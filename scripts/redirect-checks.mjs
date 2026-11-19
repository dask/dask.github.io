import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { chromium } from '@playwright/test';

// A Pages-style static host: real files get 200; missing paths get the build's
// 404 document with status 404 and the original browser URL, never an SPA rewrite.
const target = 'https://blog.dask.org/';
const evidence = 'evidence/redirects';
await fs.mkdir(evidence, { recursive: true });
const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'dask-redirects-'));
const browser = await chromium.launch();
const results = [];
const known = ['/blog', '/events', '/archive/2022-news-events'];
const excluded = [
  ...known.flatMap((p) => [p, p + '/', p + '/?from=old#section']),
  '/blog/a-real-old-post',
  '/blog/a/deep/arbitrary/path/',
  '/blog/a%20post?next=https://elsewhere.invalid/path#old',
  '/blog/2022/05/story.html',
  '/blog/index.html',
  '/blog//nested/',
  '/events/some-unknown-event',
  '/events/2027/a/future-event/?q=anything#fragment',
  '/events/index.html',
];
const unrelated = [
  '/missing',
  '/blogger',
  '/blog.html',
  '/events-old',
  '/myevents/a',
  '/archive/2022-news-events-old',
  '/archive/2022-news-events/child',
  '/not-blog/blog/a',
  '/Blog/a',
  '/Events/a',
];
const mime = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};
try {
  for (const base of ['/', '/dask.org/']) {
    const output = path.join(temporary, base === '/' ? 'root' : 'project');
    const { stdout, stderr } = await promisify(execFile)(
      process.execPath,
      [
        'node_modules/astro/bin/astro.mjs',
        'build',
        '--base',
        base,
        '--outDir',
        output,
      ],
      { maxBuffer: 2 * 1024 * 1024 },
    );
    await fs.writeFile(
      `${evidence}/build-${base === '/' ? 'root' : 'project'}.log`,
      stdout + stderr,
    );
    for (const source of known) {
      const html = await fs.readFile(
        path.join(output, source, 'index.html'),
        'utf8',
      );
      assert.ok(html.includes(`content="0;url=${target}"`));
      assert.ok(html.includes(`<link rel="canonical" href="${target}"`));
      assert.ok(html.includes(`<a href="${target}"`));
      assert.ok(
        !html.includes('301'),
        'HTML redirect must not claim an HTTP 301',
      );
    }
    assert.ok(
      !(await fs.readdir(output)).some((name) => name.includes('[')),
      'no literal wildcard file emitted',
    );
    const mount = base.replace(/\/$/, '');
    const server = http.createServer(async (request, response) => {
      let pathname;
      try {
        pathname = decodeURI(new URL(request.url, 'http://local').pathname);
      } catch {
        response.writeHead(400);
        response.end();
        return;
      }
      let file;
      if (!mount || pathname === mount || pathname.startsWith(mount + '/')) {
        const local = pathname.slice(mount.length).replace(/^\/+/, '');
        const candidate = path.resolve(output, local);
        if (candidate === output || candidate.startsWith(output + path.sep)) {
          try {
            const stat = await fs.stat(candidate);
            file = stat.isDirectory()
              ? path.join(candidate, 'index.html')
              : candidate;
            await fs.access(file);
          } catch {
            file = null;
          }
        }
      }
      response.writeHead(file ? 200 : 404, {
        'content-type': file
          ? mime[path.extname(file)] || 'application/octet-stream'
          : 'text/html',
      });
      response.end(await fs.readFile(file || path.join(output, '404.html')));
    });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const origin = `http://127.0.0.1:${server.address().port}`;
    try {
      for (const javaScriptEnabled of [true, false]) {
        const context = await browser.newContext({
          javaScriptEnabled,
          reducedMotion: 'reduce',
        });
        const outbound = [];
        await context.route('https://blog.dask.org/**', async (route) => {
          outbound.push(route.request().url());
          await route.fulfill({
            contentType: 'text/html',
            body: '<title>Intercepted exact blog target</title><p>Local redirect test; no external request sent.</p>',
          });
        });
        const page = await context.newPage();
        for (const source of excluded) {
          const isKnown =
            known.some(
              (k) => source.split(/[?#]/)[0].replace(/\/+$/, '') === k,
            ) || source.endsWith('/index.html');
          const shouldRedirect = javaScriptEnabled || isKnown;
          const url = origin + mount + source;
          const requestsBefore = outbound.length;
          const originalResponses = [];
          const listener = (r) => {
            if (r.request().isNavigationRequest() && r.url().startsWith(origin))
              originalResponses.push(r.status());
          };
          page.on('response', listener);
          try {
            await page
              .goto(url, { waitUntil: 'domcontentloaded' })
              .catch((error) => {
                if (!String(error).includes('ERR_ABORTED')) throw error;
              });
            if (shouldRedirect) {
              await page.waitForURL(target, { timeout: 5000 });
              assert.equal(
                page.url(),
                target,
                'path, query and fragment all discarded',
              );
              assert.ok(
                outbound.slice(requestsBefore).every((u) => u === target),
              );
              assert.ok(
                outbound.length > requestsBefore,
                'actual navigation request observed',
              );
            } else {
              await page.waitForTimeout(150);
              assert.equal(
                page.url(),
                url,
                'without JS an arbitrary missing path remains an honest 404',
              );
              assert.equal(outbound.length, requestsBefore);
              assert.equal(
                await page
                  .getByRole('link', { name: 'Dask blog', exact: true })
                  .count(),
                1,
              );
            }
            assert.ok(
              originalResponses.includes(isKnown ? 200 : 404),
              'known document or genuine host 404',
            );
            results.push({
              base,
              javaScriptEnabled,
              source,
              passed: true,
              redirect: shouldRedirect,
              initialStatuses: originalResponses,
              finalURL: page.url().replace(origin, '<local>'),
            });
          } finally {
            page.off('response', listener);
          }
        }
        for (const source of [
          ...unrelated,
          ...(mount
            ? ['/outside-mount/events/a', '/dask.org.evil/blog/a']
            : []),
        ]) {
          const url =
            origin +
            (source.startsWith('/outside-mount') ||
            source.startsWith('/dask.org.evil')
              ? ''
              : mount) +
            source;
          const before = outbound.length;
          const response = await page.goto(url);
          await page.waitForTimeout(150);
          assert.equal(response.status(), 404);
          assert.equal(page.url(), url);
          assert.equal(
            outbound.length,
            before,
            'unrelated missing paths must not redirect',
          );
          assert.ok(
            !(await page.locator('main').innerText()).match(
              /pending|not been selected|guessed/i,
            ),
          );
          assert.equal(
            await page
              .getByRole('link', { name: 'Return to Dask home', exact: true })
              .getAttribute('href'),
            base,
          );
          results.push({
            base,
            javaScriptEnabled,
            source,
            passed: true,
            redirect: false,
            initialStatus: 404,
          });
        }
        if (javaScriptEnabled)
          await page.screenshot({
            path: `${evidence}/unknown-${mount ? 'project' : 'root'}.png`,
            fullPage: true,
          });
        await context.close();
      }
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  }
} finally {
  await browser.close();
  await fs.rm(temporary, { recursive: true, force: true });
  await fs.writeFile(
    `${evidence}/checks.json`,
    JSON.stringify(
      {
        target,
        passed: results.length,
        results,
        note: 'No external requests or live site mutations: destination intercepted locally. Arbitrary missing descendants require JavaScript on static Pages; known inventory meta-refresh works without JS.',
      },
      null,
      2,
    ) + '\n',
  );
}
console.log(
  `${results.length} root/project redirect and unrelated-404 browser cases passed (JS on/off); exact target requests intercepted, no network publication.`,
);
