import { expectReadingMarker } from './brand-reading-check.mjs';
import { chromium, expect } from '@playwright/test';
import fs from 'node:fs/promises';
const browser = await chromium.launch();
const base = process.env.BASE_URL || 'http://127.0.0.1:4321';
const results = [];
await fs.mkdir('evidence/round2/local', { recursive: true });
async function check(name, fn) {
  try {
    await fn();
    results.push({ name, status: 'passed' });
    console.log('PASS', name);
  } catch (error) {
    results.push({ name, status: 'failed', error: String(error) });
    console.error('FAIL', name, String(error));
  }
}
try {
  for (const width of [
    320, 360, 390, 599, 600, 601, 767, 768, 990, 991, 992, 993, 1099, 1100,
    1101, 1440, 1599, 1600, 1601,
  ]) {
    for (const slug of [
      '',
      'get-started',
      'get-help',
      'powered-by',
      'brand-guide',
      'press-mentions',
    ]) {
      const p = await browser.newPage({
        viewport: { width, height: 900 },
        reducedMotion: 'reduce',
      });
      await p.goto(base + '/' + slug, { waitUntil: 'networkidle' });
      await check(
        `${slug || 'home'} ${width}: intrinsic width and visible primary content`,
        async () => {
          expect(
            await p.evaluate(() => document.documentElement.scrollWidth),
          ).toBeLessThanOrEqual(width + 1);
          await expect(p.locator('h1')).toBeVisible();
          if (slug === 'press-mentions') {
            for (const h of await p.locator('.press-card h2').all()) {
              const r = await h.boundingBox();
              expect(r.x + r.width).toBeLessThanOrEqual(width + 1);
            }
          }
        },
      );
      if (
        [320, 390].includes(width) &&
        ['brand-guide', 'press-mentions'].includes(slug)
      )
        await p.screenshot({
          path: `evidence/round2/local/${slug}-${width}.png`,
          fullPage: true,
        });
      await p.close();
    }
  }
  for (const width of [1440, 390]) {
    const p = await browser.newPage({
      viewport: { width, height: 900 },
      reducedMotion: 'reduce',
    });
    await p.goto(base);
    for (const [i, label, href] of [
      [0, 'Performance Benchmarks', 'https://docs.coiled.io/blog/tpch.html'],
      [
        1,
        'Process 5,000 files in parallel',
        'https://docs.coiled.io/user_guide/arxiv-matplotlib.html',
      ],
      [
        2,
        'Aggregate 250 TB of Water Model Data',
        'https://docs.coiled.io/blog/coiled-xarray.html',
      ],
      [
        3,
        'Example: XGBoost Model Training',
        'https://docs.coiled.io/user_guide/xgboost.html',
      ],
    ]) {
      await p.locator('.workload-tabs [role=tab]').nth(i).click();
      await check(
        `workload ${i} ${width}: both visible action labels and destinations`,
        async () => {
          const panel = p.locator('#workload-' + i);
          await expect(
            panel.getByRole('link', { name: 'Documentation', exact: true }),
          ).toHaveAttribute(
            'href',
            `https://docs.dask.org/en/stable/${['dataframe', 'futures', 'array', 'ml'][i]}.html`,
          );
          await expect(
            panel.getByRole('link', { name: label, exact: true }),
          ).toBeVisible();
          await expect(
            panel.getByRole('link', { name: label, exact: true }),
          ).toHaveAttribute(
            'href',
            href + '?utm_source=dask.org&utm_medium=homepage',
          );
          if (i !== 1)
            await expect(panel.locator('.workload-logos')).toBeVisible();
        },
      );
    }
    for (const [i, label, href] of [
      [
        0,
        'Dask deployment video',
        'https://www.youtube.com/watch?v=faFncNrXmIY',
      ],
      [1, 'Video: Dask in the Cloud', 'https://youtu.be/SfPzmIqMKp0'],
    ]) {
      await p.locator('.deployment [role=tab]').nth(i).click();
      await check(
        `deployment ${i} ${width}: both visible action labels and destinations`,
        async () => {
          const panel = p.locator('#deploy-' + i);
          await expect(
            panel.getByRole('link', { name: 'Documentation', exact: true }),
          ).toHaveAttribute(
            'href',
            i
              ? 'https://docs.coiled.io/user_guide/index.html?utm_source=dask.org&utm_medium=homepage'
              : 'https://docs.dask.org/en/stable/deploying.html',
          );
          await expect(
            panel.getByRole('link', { name: label, exact: true }),
          ).toBeVisible();
          await expect(
            panel.getByRole('link', { name: label, exact: true }),
          ).toHaveAttribute('href', href);
          await expect(panel.locator('.workload-logos')).toBeVisible();
        },
      );
    }
    await check(`homepage inline and hero destinations ${width}`, async () => {
      await expect(p.locator('.home-headline .button')).toHaveAttribute(
        'href',
        'https://docs.dask.org/en/stable/',
      );
      await expect(p.locator('.home-install .button')).toHaveAttribute(
        'href',
        'https://docs.dask.org/en/latest/install.html',
      );
      await expect(
        p.getByRole('link', {
          name: 'Dask is 50% faster than Spark',
          exact: true,
        }),
      ).toHaveAttribute(
        'href',
        'https://docs.coiled.io/blog/spark-vs-dask.html?utm_source=dask.org&utm_medium=homepage',
      );
      await expect(
        p.getByRole('link', { name: '$0.10 per TiB', exact: true }),
      ).toHaveAttribute(
        'href',
        'https://docs.coiled.io/blog/ten-cents.html?utm_source=dask.org&utm_medium=homepage',
      );
      expect(await p.locator('input[type=range]').count()).toBe(0);
    });
    await p.goto(base + '/brand-guide');
    await check(`brand palette order and native icons ${width}`, async () => {
      expect(
        await p
          .locator('[data-color]')
          .evaluateAll((es) => es.map((e) => e.dataset.color)),
      ).toEqual([
        '#FFFFFF',
        '#F6F6F6',
        '#EBEAEE',
        '#FFC11E',
        '#FC6E6B',
        '#EF1561',
        '#61BA92',
        '#1F5AFF',
        '#183D72',
        '#33363D',
        '#262326',
        '#080815',
      ]);
      expect(await p.locator('.brand-sidebar svg').count()).toBe(3);
      expect(await p.locator('.brand-sidebar img').count()).toBe(1);
      if (width < 600) {
        const rect = await p.locator('.palette-grid').boundingBox();
        expect(Math.abs(rect.width - 330.75)).toBeLessThan(2);
        const logo = await p.locator('.word-mark img').boundingBox();
        expect(logo.width).toBe(156);
      }
    });
    for (const section of ['colors', 'typography', 'tone', 'logos'])
      await check(
        `brand rail ${width}: navigate to ${section} without returning to top`,
        async () => {
          await p.locator(`.brand-sidebar a[href="#${section}"]`).click();
          await p.waitForTimeout(150);
          const r = await p.locator('#' + section).boundingBox();
          expect(r.y).toBeGreaterThanOrEqual(width < 600 ? 79 : 0);
          expect(r.y).toBeLessThan(width < 600 ? 83 : 27);
          await expect(p).toHaveURL(new RegExp('#' + section + '$'));
          await expectReadingMarker(p);
          const nav = await p.locator('.brand-sidebar').boundingBox();
          expect(nav.y).toBeGreaterThanOrEqual(-1);
          const pin = await p
            .locator('.brand-sidebar')
            .evaluate((e) => parseFloat(getComputedStyle(e).top));
          expect(Math.abs(nav.y - pin)).toBeLessThanOrEqual(1);
          await p.screenshot({
            path: `evidence/round2/local/brand-${section}-${width}.png`,
          });
        },
      );
    await p.close();
  }
  const p = await browser.newPage({
    viewport: { width: 390, height: 900 },
    reducedMotion: 'reduce',
  });
  const mutations = [];
  await p.route('**/*', (r) => {
    if (!['GET', 'HEAD'].includes(r.request().method())) {
      mutations.push(r.request().url());
      return r.abort();
    }
    return r.continue();
  });
  await p.goto(base + '/press-mentions');
  await p.locator('[data-dialog="press"]').first().click();
  for (const type of ['press', 'event', 'newsletter'])
    await check(
      `mobile ${type} form layout, safe submit, focus and Escape`,
      async () => {
        await p.locator(`[data-form="${type}"]`).click();
        const a = await p.locator('[name=first-name]').boundingBox(),
          b = await p.locator('[name=last-name]').boundingBox();
        expect(b.y).toBeGreaterThan(a.y + a.height);
        const tabs = await p
          .locator('.dialog-tabs [role=tab]')
          .evaluateAll((es) => es.map((e) => e.getBoundingClientRect().y));
        expect(tabs[1]).toBeGreaterThan(tabs[0] + 24);
        expect(tabs[2]).toBeGreaterThan(tabs[1] + 24);
        const close = await p.locator('.dialog-close').boundingBox();
        expect(close.x).toBeGreaterThan(300);
        await p.screenshot({
          path: `evidence/round2/local/form-${type}-390-empty.png`,
        });
        for (const input of await p.locator('dialog input:enabled').all()) {
          const name = await input.getAttribute('name');
          await input.fill(
            name === 'email'
              ? 'test@example.invalid'
              : name === 'news-url'
                ? 'https://example.invalid/test'
                : 'Local test only',
          );
        }
        for (const input of await p.locator('dialog textarea:enabled').all())
          await input.fill('Local test only');
        await p.screenshot({
          path: `evidence/round2/local/form-${type}-390.png`,
        });
        await p.locator('dialog button[type=submit]').click();
        await expect(p.locator('.form-status')).toHaveText(
          'Not sent: this local preview has no submission backend.',
        );
        expect(mutations).toEqual([]);
        await p.keyboard.press('Escape');
        await expect(p.locator('dialog')).not.toBeVisible();
        await p.locator('[data-dialog="press"]').first().click();
      },
    );
  await p.close();
} finally {
  await browser.close();
  await fs.writeFile(
    'evidence/round2/checks.json',
    JSON.stringify(
      {
        passed: results.filter((r) => r.status === 'passed').length,
        failed: results.filter((r) => r.status === 'failed').length,
        results,
      },
      null,
      2,
    ),
  );
}
if (results.some((r) => r.status === 'failed')) process.exitCode = 1;
