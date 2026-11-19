import assert from 'node:assert/strict';
import { readFile, stat, mkdtemp, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import http from 'node:http';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { chromium, expect } from '@playwright/test';
const identities = {
  'dask-home':
    '76423fcd4c9991490f5a5d09231727324380f874acb76cbfbe3c0f81305ac543',
  'type-gauge':
    '6b9e60ae47ddb6c5287e493f29d023cac7044416133d3234121d41e4dee8e8f0',
};
for (const [name, sha] of Object.entries(identities)) {
  const bytes = await readFile(`public/animations/${name}.json`);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), sha);
  function audit(value) {
    if (Array.isArray(value)) value.forEach(audit);
    else if (value && typeof value === 'object')
      for (const [key, item] of Object.entries(value)) {
        assert.ok(!(key === 'x' && typeof item === 'string'), 'no expressions');
        assert.ok(
          !(
            typeof item === 'string' && /https?:|data:|javascript:/i.test(item)
          ),
          'no external/embedded resources',
        );
        if (key === 'u') assert.equal(item, '', 'no asset directory');
        audit(item);
      }
  }
  audit(JSON.parse(bytes));
}
const browser = await chromium.launch();
const temp = await mkdtemp(path.join(os.tmpdir(), 'dask-lottie-'));
let groups = 0;
try {
  for (const mount of process.env.BASE_URL ? [null] : ['/', '/en/59/']) {
    let server;
    let base = process.env.BASE_URL;
    if (mount) {
      const output = path.join(temp, mount === '/' ? 'root' : 'rtd');
      const build = spawnSync(
        process.execPath,
        ['scripts/readthedocs-build.mjs'],
        {
          env: {
            ...process.env,
            READTHEDOCS_OUTPUT: output,
            READTHEDOCS_CANONICAL_URL: 'https://preview.invalid' + mount,
          },
          stdio: 'inherit',
        },
      );
      assert.equal(build.status, 0);
      const root = path.join(output, 'html');
      server = http.createServer(async (req, res) => {
        try {
          const url = new URL(req.url, 'http://localhost');
          assert.ok(url.pathname.startsWith(mount));
          let file = path.resolve(
            root,
            decodeURIComponent(url.pathname.slice(mount.length)),
          );
          assert.ok(file === root || file.startsWith(root + path.sep));
          if ((await stat(file)).isDirectory())
            file = path.join(file, 'index.html');
          res.setHeader(
            'Content-Type',
            {
              '.js': 'text/javascript',
              '.css': 'text/css',
              '.html': 'text/html',
              '.json': 'application/json',
              '.png': 'image/png',
              '.svg': 'image/svg+xml',
            }[path.extname(file)] || 'application/octet-stream',
          );
          res.end(await readFile(file));
        } catch {
          res.writeHead(404);
          res.end();
        }
      });
      await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
      base = `http://127.0.0.1:${server.address().port}${mount}`;
    }
    try {
      for (const width of [1440, 390])
        for (const reducedMotion of ['no-preference', 'reduce']) {
          const page = await browser.newPage({
            viewport: { width, height: 900 },
            reducedMotion,
          });
          const errors = [],
            external = [];
          page.on('pageerror', (error) => errors.push(String(error)));
          page.on('request', (req) => {
            if (new URL(req.url()).origin !== new URL(base).origin)
              external.push(req.url());
          });
          await page.goto(base);
          for (const name of Object.keys(identities)) {
            const art = page.locator(`[data-lottie="${name}"]`);
            await art.scrollIntoViewIfNeeded();
            const poster = art.locator(':scope > img');
            await expect
              .poll(() =>
                poster.evaluate((img) => img.complete && img.naturalWidth > 0),
              )
              .toBe(true);
            const geometry = await art.boundingBox();
            expect(geometry.width).toBeGreaterThan(100);
            if (reducedMotion === 'reduce') {
              await page.waitForTimeout(350);
              await expect(art).not.toHaveAttribute('data-loaded', 'true');
              await expect(poster).toBeVisible();
              expect(await art.locator('svg').count()).toBe(0);
            } else {
              await expect(art).toHaveAttribute('data-loaded', 'true');
              await expect(art.locator('svg')).toBeVisible();
              const frame = await art.getAttribute('data-frame');
              const image = await art.screenshot();
              await expect
                .poll(() => art.getAttribute('data-frame'))
                .not.toBe(frame);
              await page.waitForTimeout(650);
              assert.ok(
                !image.equals(await art.screenshot()),
                'actual rendered SVG pixels advance',
              );
              // Offscreen pause, then dynamic reduced-motion switches back to poster.
              await page.evaluate(() =>
                scrollTo(0, document.body.scrollHeight),
              );
              await page.waitForTimeout(200);
              const paused = await art.getAttribute('data-frame');
              await page.waitForTimeout(200);
              expect(await art.getAttribute('data-frame')).toBe(paused);
              await page.emulateMedia({ reducedMotion: 'reduce' });
              await art.scrollIntoViewIfNeeded();
              await expect(poster).toBeVisible();
              await page.emulateMedia({ reducedMotion: 'no-preference' });
            }
            groups++;
          }
          expect(errors).toEqual([]);
          expect(external).toEqual([]);
          await page.close();
        }
      // Posters remain available without JavaScript.
      const page = await browser.newPage({ javaScriptEnabled: false });
      await page.goto(base);
      for (const name of Object.keys(identities))
        await expect(
          page.locator(`[data-lottie="${name}"] > img`),
        ).toBeVisible();
      await page.close();
    } finally {
      if (server) await new Promise((resolve) => server.close(resolve));
    }
  }
} finally {
  await browser.close();
  await rm(temp, { recursive: true, force: true });
}
console.log(
  `${groups} original-Lottie rendering/lifecycle groups passed; exact byte/resource audit passed.`,
);
