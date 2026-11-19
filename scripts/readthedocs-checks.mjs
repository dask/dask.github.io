import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { chromium, expect } from '@playwright/test';

const temporary = await mkdtemp(path.join(os.tmpdir(), 'dask-rtd-'));
const browser = await chromium.launch();
const slugs = [
  '',
  'get-started',
  'get-help',
  'powered-by',
  'brand-guide',
  'press-mentions',
];
let checked = 0;
try {
  for (const base of ['/en/59/', '/']) {
    const canonical = 'https://preview.example.invalid' + base;
    const output = path.join(
      temporary,
      base === '/' ? 'root output' : 'version output',
    );
    const build = spawnSync(
      process.execPath,
      ['scripts/readthedocs-build.mjs'],
      {
        env: {
          ...process.env,
          READTHEDOCS_CANONICAL_URL: canonical,
          READTHEDOCS_OUTPUT: output,
        },
        stdio: 'inherit',
      },
    );
    assert.equal(build.status, 0);
    const htmlRoot = path.join(output, 'html');
    const types = {
      '.js': 'text/javascript',
      '.css': 'text/css',
      '.html': 'text/html',
      '.svg': 'image/svg+xml',
      '.ttf': 'font/ttf',
    };
    const server = http.createServer(async (request, response) => {
      const pathname = new URL(request.url, 'http://local').pathname;
      let file;
      if (pathname.startsWith(base)) {
        const candidate = path.resolve(
          htmlRoot,
          decodeURI(pathname.slice(base.length)),
        );
        if (
          candidate.startsWith(htmlRoot + path.sep) ||
          candidate === htmlRoot
        ) {
          try {
            file = (await stat(candidate)).isDirectory()
              ? path.join(candidate, 'index.html')
              : candidate;
            await stat(file);
          } catch {
            file = null;
          }
        }
      }
      response.writeHead(file ? 200 : 404, {
        'content-type':
          types[path.extname(file || '404.html')] || 'application/octet-stream',
      });
      response.end(await readFile(file || path.join(htmlRoot, '404.html')));
    });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const origin = 'http://127.0.0.1:' + server.address().port;
    const context = await browser.newContext({
      reducedMotion: 'reduce',
      viewport: { width: 390, height: 900 },
    });
    const external = [],
      failed = [];
    await context.route('**/*', async (route) => {
      if (
        route
          .request()
          .url()
          .startsWith(origin + '/')
      )
        await route.continue();
      else {
        external.push(route.request().url());
        await route.fulfill({
          contentType: 'text/html',
          body: '<p>Intercepted external destination</p>',
        });
      }
    });
    const page = await context.newPage();
    page.on('pageerror', (error) => failed.push(String(error)));
    page.on('response', (response) => {
      if (response.status() >= 400) failed.push(response.url());
    });
    try {
      for (const slug of slugs) {
        await page.goto(origin + base + slug, { waitUntil: 'networkidle' });
        await page.evaluate(() => document.fonts.ready);
        await expect(page.locator('main')).toBeVisible();
        await expect(page.locator('link[rel=canonical]')).toHaveAttribute(
          'href',
          canonical + (slug ? slug + '/' : ''),
        );
        const credit = page.getByRole('link', {
          name: 'Hosted by GitHub Pages',
          exact: true,
        });
        await credit.scrollIntoViewIfNeeded();
        await expect(credit).toBeVisible();
        await expect(credit).toHaveAttribute(
          'href',
          'https://github.com/dask/dask.github.io',
        );
        assert.deepEqual(
          await page
            .locator('img')
            .evaluateAll((images) =>
              images
                .filter((i) => !i.complete || !i.naturalWidth)
                .map((i) => i.src),
            ),
          [],
        );
        // Every root-relative HTML URL points inside this exact version and to
        // a real static output file. External links/fragments stay unchanged.
        const urls = await page
          .locator('[href], [src]')
          .evaluateAll((elements) =>
            elements
              .flatMap((el) =>
                ['href', 'src'].map((name) => el.getAttribute(name)),
              )
              .filter(
                (value) => value?.startsWith('/') && !value.startsWith('//'),
              ),
          );
        for (const url of urls) {
          assert.ok(url.startsWith(base), url);
          const candidate = path.join(
            htmlRoot,
            new URL(url, origin).pathname.slice(base.length),
          );
          const info = await stat(candidate);
          if (info.isDirectory())
            await stat(path.join(candidate, 'index.html'));
        }
        if (slug === 'brand-guide') {
          for (const tab of await page.locator('[data-logo-color]').all()) {
            await tab.click();
            await expect
              .poll(() =>
                page
                  .locator('.logo-showcase img')
                  .evaluateAll((images) =>
                    images.every((i) => i.complete && i.naturalWidth > 0),
                  ),
              )
              .toBe(true);
          }
        }
        assert.deepEqual(failed, []);
        assert.deepEqual(external, []);
        checked++;
      }
      const destination = 'https://blog.dask.org/';
      for (const suffix of [
        'blog/',
        'events/',
        'archive/2022-news-events/',
        'blog/arbitrary/deep/post?old=yes#section',
        'events/unknown',
      ]) {
        await page.goto(origin + base + suffix);
        await page.waitForURL(destination);
        assert.equal(page.url(), destination);
        checked++;
      }
      for (const suffix of [
        'missing',
        'blogger',
        'archive/2022-news-events/child',
      ]) {
        const response = await page.goto(origin + base + suffix);
        assert.equal(response.status(), 404);
        await page.waitForTimeout(100);
        assert.equal(page.url(), origin + base + suffix);
        checked++;
      }
      const noJS = await browser.newContext({ javaScriptEnabled: false });
      try {
        const staticPage = await noJS.newPage();
        await staticPage.route('https://blog.dask.org/**', (route) =>
          route.fulfill({ body: 'Blog' }),
        );
        await staticPage.goto(origin + base + 'blog/');
        await staticPage.waitForURL(destination);
        checked++;
      } finally {
        await noJS.close();
      }
    } finally {
      await context.close();
      await new Promise((resolve) => server.close(resolve));
    }
  }
} finally {
  await browser.close();
  await rm(temporary, { recursive: true, force: true });
}
console.log(
  `${checked} RTD mounted/root route, canonical, asset/link, footer, brand-state and redirect groups passed; dynamic isolated test ports.`,
);
