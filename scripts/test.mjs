import { chromium, expect } from '@playwright/test';
import { spawn, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs/promises';
const base = process.env.BASE_URL || 'http://127.0.0.1:4322';
let server;
if (!process.env.BASE_URL) {
  server = spawn(
    process.execPath,
    [
      'node_modules/astro/bin/astro.mjs',
      'preview',
      '--host',
      '127.0.0.1',
      '--port',
      '4322',
    ],
    { stdio: 'pipe' },
  );
  let ready = false;
  for (let i = 0; i < 100; i++) {
    try {
      const r = await fetch(base);
      if (r.ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  if (!ready) {
    server.kill();
    throw Error('Preview did not start; run npm run build first.');
  }
}
const browser = await chromium.launch();
const results = [];
let passed = 0;
const errors = [];
await fs.mkdir('evidence/tests', { recursive: true });
async function check(name, fn) {
  try {
    await fn();
    results.push({ name, status: 'passed' });
    passed++;
    console.log('PASS', name);
  } catch (error) {
    results.push({ name, status: 'failed', error: String(error) });
    errors.push(name);
    console.error('FAIL', name, String(error));
  }
}
try {
  for (const width of [1440, 768, 390])
    for (const slug of [
      '',
      'get-started',
      'get-help',
      'powered-by',
      'brand-guide',
      'press-mentions',
    ]) {
      const page = await browser.newPage({
        viewport: { width, height: 900 },
        reducedMotion: 'reduce',
      });
      page.setDefaultTimeout(10000);
      const pageErrors = [];
      const external = [];
      page.on('pageerror', (e) => pageErrors.push(String(e)));
      page.on('request', (r) => {
        if (!r.url().startsWith(base)) external.push(r.url());
      });
      await page.goto(base + '/' + slug, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      await check(
        `${slug || 'home'} ${width}: semantic page, local assets, no JS errors`,
        async () => {
          await expect(page.locator('main')).toBeVisible();
          await expect(page.locator('h1').first()).toBeVisible();
          expect(pageErrors).toEqual([]);
          expect(external).toEqual([]);
          expect(
            await page
              .locator('img')
              .evaluateAll((images) =>
                images
                  .filter((i) => !i.complete || !i.naturalWidth)
                  .map((i) => i.src),
              ),
          ).toEqual([]);
        },
      );
      await check(
        `${slug || 'home'} ${width}: no horizontal overflow`,
        async () => {
          expect(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth + 1,
            ),
          ).toBe(true);
        },
      );
      await check(`${slug || 'home'} ${width}: navigation`, async () => {
        if (width < 992) {
          const toggle = page.locator('.menu-toggle');
          await toggle.click();
          await expect(toggle).toHaveAttribute('aria-expanded', 'true');
          await expect(
            page
              .getByRole('navigation', { name: 'Main navigation' })
              .getByRole('link', { name: 'Get Help', exact: true }),
          ).toBeVisible();
          await page.screenshot({
            path: `evidence/tests/${slug || 'home'}-${width}-nav.png`,
          });
          await page.keyboard.press('Escape');
          await expect(toggle).toHaveAttribute('aria-expanded', 'false');
        } else {
          const toggle = page.getByRole('button', {
            name: 'Community',
            exact: true,
          });
          await toggle.click();
          await expect(page.locator('#community-links')).toBeVisible();
          await page.keyboard.press('Escape');
          await expect(toggle).toHaveAttribute('aria-expanded', 'false');
        }
      });
      await check(
        `${slug || 'home'} ${width}: shared hosting credit`,
        async () => {
          const copyright = page.locator('.copyright > span');
          const credit = page.getByRole('link', {
            name: 'Hosted by GitHub Pages',
            exact: true,
          });
          await credit.scrollIntoViewIfNeeded();
          await expect(credit).toBeVisible();
          await expect(copyright).toHaveText(
            `Copyright © ${new Date().getFullYear()} Dask core developers. New-BSD Licensed`,
          );
          await expect(credit).toHaveAttribute(
            'href',
            'https://github.com/dask/dask.github.io',
          );
          expect(
            await copyright.evaluate((el) =>
              el.nextElementSibling?.classList.contains('hosting-credit'),
            ),
          ).toBe(true);
          const a = await copyright.boundingBox(),
            b = await credit.boundingBox();
          expect(b.y).toBeGreaterThanOrEqual(a.y + a.height - 1);
          expect(b.y - a.y - a.height).toBeLessThan(2);
          expect(
            await credit.evaluate((el) => {
              const r = el.getBoundingClientRect();
              const hit = document.elementFromPoint(
                r.x + r.width / 2,
                r.y + r.height / 2,
              );
              return hit === el || el.contains(hit);
            }),
          ).toBe(true);
        },
      );
      await page.close();
    }
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  page.setDefaultTimeout(10000);
  for (const slug of ['', 'get-started']) {
    await page.goto(base + '/' + slug);
    await check(`${slug || 'home'}: all native tabs + keyboard`, async () => {
      for (const group of await page.locator('[data-tabs]').all()) {
        const tabs = group.locator(':scope > [role=tablist] > [role=tab]');
        for (let i = 0; i < (await tabs.count()); i++) {
          const tab = tabs.nth(i);
          await tab.click();
          await expect(tab).toHaveAttribute('aria-selected', 'true');
          const id = await tab.getAttribute('aria-controls');
          await expect(page.locator('#' + id)).toBeVisible();
        }
        await tabs.last().focus();
        await page.keyboard.press('Home');
        await expect(tabs.first()).toHaveAttribute('aria-selected', 'true');
        await page.keyboard.press('ArrowRight');
        await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
      }
    });
  }
  await page.goto(base + '/brand-guide');
  await check(
    'brand: four logo variants and twelve palette choices',
    async () => {
      for (const tab of await page.locator('[data-logo-color]').all()) {
        await tab.click();
        await expect(tab).toHaveAttribute('aria-selected', 'true');
        await expect
          .poll(() =>
            page
              .locator('.logo-showcase img')
              .evaluateAll((imgs) =>
                imgs.every((i) => i.complete && i.naturalWidth > 0),
              ),
          )
          .toBe(true);
      }
      for (const button of await page.locator('[data-color]').all()) {
        await button.click();
        await expect(page.locator('.color-hex')).toHaveText(
          await button.getAttribute('data-color'),
        );
        await expect(button).toHaveAttribute('aria-pressed', 'true');
      }
      await page
        .context()
        .grantPermissions(['clipboard-read', 'clipboard-write']);
      await page.getByRole('button', { name: 'Copy Hex Code' }).click();
      await expect(page.getByRole('button', { name: 'Copied!' })).toBeVisible();
      expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
        '#080815',
      );
    },
  );
  await page.goto(base + '/press-mentions');
  await check(
    'submission: dialog, all form types, native focus, no network mutation',
    async () => {
      let mutations = [];
      page.on('request', (r) => {
        if (!['GET', 'HEAD'].includes(r.method())) mutations.push(r.url());
      });
      await page.getByRole('button', { name: 'Add a press mention' }).click();
      await expect(page.getByRole('dialog')).toBeVisible();
      for (const type of ['event', 'newsletter', 'press']) {
        await page.locator(`[data-form=${type}]`).click();
        await expect(page.locator(`.${type}-fields`)).toBeVisible();
      }
      await page
        .getByPlaceholder('First Name', { exact: true })
        .fill('Preview');
      await page.getByPlaceholder('Last Name', { exact: true }).fill('Test');
      await page
        .getByPlaceholder('Email Address', { exact: true })
        .fill('preview@example.invalid');
      await page
        .getByPlaceholder('URL of News Post', { exact: true })
        .fill('https://example.invalid/test');
      await page.getByRole('button', { name: 'Submit', exact: true }).click();
      await expect(page.locator('.form-status')).toHaveText(
        'Not sent: this local preview has no submission backend.',
      );
      expect(mutations).toEqual([]);
      await page.screenshot({ path: 'evidence/tests/press-dialog.png' });
      await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog')).not.toBeVisible();
    },
  );
  await page.goto(base + '/');
  await check(
    'native counter: static representative frame in reduced motion',
    async () => {
      await expect(page.locator('#rows-value')).toHaveText(
        '1 0 0 0 0 0 0 0 0 0 0 0',
      );
      await expect(page.locator('#cost-value')).toHaveText('1.07');
      expect(await page.locator('input[type=range]').count()).toBe(0);
    },
  );
  await check(
    'excluded redirects use the authorized exact blog homepage',
    async () => {
      const mappings = JSON.parse(
        await fs.readFile('src/data/redirects.json', 'utf8'),
      );
      expect(mappings.length).toBeGreaterThan(0);
      expect(
        mappings.every(
          (m) =>
            m.status === 'resolved' &&
            m.destination === 'https://blog.dask.org/',
        ),
      ).toBe(true);
    },
  );
  await page.close();
  await check(
    'independent-review regression suite (see evidence/round2/checks.json)',
    async () => {
      const { stdout } = await promisify(execFile)(
        process.execPath,
        ['scripts/round2-checks.mjs'],
        {
          env: { ...process.env, BASE_URL: base },
          maxBuffer: 1024 * 1024,
        },
      );
      console.log(stdout.trim());
    },
  );
  for (const script of [
    'round3-checks.mjs',
    'round3-motion.mjs',
    'round3-art-bounds.mjs',
    'round6-checks.mjs',
  ]) {
    await check(`${script}: production-preview regression`, async () => {
      const { stdout } = await promisify(execFile)(
        process.execPath,
        ['scripts/' + script],
        {
          env: { ...process.env, BASE_URL: base },
          maxBuffer: 1024 * 1024,
        },
      );
      console.log(stdout.trim());
    });
  }
} finally {
  await browser.close();
  server?.kill();
  await fs.writeFile(
    'evidence/tests/results.json',
    JSON.stringify({ passed, failed: errors.length, results }, null, 2) + '\n',
  );
}
console.log(`${passed} passed; ${errors.length} failed`);
if (errors.length) process.exitCode = 1;
