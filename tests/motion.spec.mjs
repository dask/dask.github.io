import { readFile } from 'node:fs/promises';
import {
  expect,
  expectLoadedImages,
  test,
  watchPage,
} from './support/site.mjs';

const animationNames = ['dask-home', 'type-gauge'];

for (const name of animationNames) {
  test(`${name} animation data does not use expressions or linked/embedded resources`, async () => {
    const data = JSON.parse(
      await readFile(`public/animations/${name}.json`, 'utf8'),
    );
    expect(data.layers.length).toBeGreaterThan(0);
    const violations = [];
    function audit(value, at = name) {
      if (typeof value === 'string') {
        if (
          /(?:[a-z][a-z0-9+.-]*:\/\/|^\s*\/\/|\b(?:https?|data|javascript|file|blob):)/i.test(
            value,
          )
        ) {
          violations.push(at + ': external or embedded resource');
        }
      } else if (value && typeof value === 'object') {
        for (const [key, item] of Object.entries(value)) {
          const location = at + '.' + key;
          if (key === 'x' && typeof item === 'string')
            violations.push(location + ': expression');
          if ((key === 'u' || key === 'fPath') && item)
            violations.push(location + ': resource path');
          audit(item, location);
        }
      }
    }
    audit(data);
    // These are self-contained vector compositions, not image/audio assets.
    for (const asset of data.assets ?? []) {
      if ('p' in asset || 'e' in asset)
        violations.push(asset.id + ': linked or embedded asset');
    }
    expect(violations).toEqual([]);
  });

  for (const mode of ['root', 'mounted']) {
    test(`${name} plays only when visible and reverts to the poster on ${mode} preview`, async ({
      page,
      baseURL,
      mountedURL,
    }) => {
      const base = mode === 'root' ? baseURL : mountedURL;
      await page.setViewportSize({
        width: mode === 'root' ? 1440 : 390,
        height: 900,
      });
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      const problems = await watchPage(page, base);
      await page.goto(base);
      const art = page.locator(`[data-lottie="${name}"]`);
      const poster = art.locator(':scope > img');
      const svg = art.locator('svg');
      await art.scrollIntoViewIfNeeded();
      await expectLoadedImages(poster);
      await expect(svg).toBeVisible();
      const frame = await art.getAttribute('data-frame');
      await expect.poll(() => art.getAttribute('data-frame')).not.toBe(frame);
      const rendered = await svg.innerHTML();
      await expect.poll(() => svg.innerHTML()).not.toBe(rendered);

      await page.evaluate(() => scrollTo(0, document.body.scrollHeight));
      await expect(art).not.toBeInViewport();
      // Observe over multiple animation frames rather than compare two
      // immediate samples, which could both fall between live ticks.
      await expect
        .poll(() =>
          art.evaluate(async (el) => {
            const before = el.dataset.frame;
            await new Promise((resolve) => setTimeout(resolve, 160));
            return el.dataset.frame === before;
          }),
        )
        .toBe(true);
      await art.scrollIntoViewIfNeeded();
      const resumed = await art.getAttribute('data-frame');
      await expect.poll(() => art.getAttribute('data-frame')).not.toBe(resumed);

      await page.emulateMedia({ reducedMotion: 'reduce' });
      await expect(poster).toBeVisible();
      expect(problems).toEqual([]);
    });
  }
}

test('a failed animation download leaves the local poster visible', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.route('**/animations/*.json', (route) =>
    route.fulfill({ status: 503 }),
  );
  const failed = page.waitForResponse(
    (response) =>
      response.status() === 503 && response.url().includes('/animations/'),
  );
  await page.goto('./');
  const art = page.locator('[data-lottie="dask-home"]');
  await art.scrollIntoViewIfNeeded();
  await failed;
  await expectLoadedImages(art.locator(':scope > img'));
  await expect(art.locator(':scope > img')).toBeVisible();
  await expect(art.locator('svg')).toHaveCount(0);
});

for (const javaScriptEnabled of [true, false]) {
  test.describe(javaScriptEnabled ? 'Reduced motion' : 'No JavaScript', () => {
    test.use({ javaScriptEnabled, viewport: { width: 390, height: 900 } });

    test('homepage illustrations have static posters, terminal and counter', async ({
      page,
    }) => {
      const downloads = [];
      await page.route('**/animations/*.json', (route) => {
        downloads.push(route.request().url());
        return route.abort();
      });
      await page.goto('./');
      for (const name of animationNames) {
        const art = page.locator(`[data-lottie="${name}"]`);
        const poster = art.locator(':scope > img');
        await art.scrollIntoViewIfNeeded();
        await expect(poster).toBeInViewport();
        await expectLoadedImages(poster);
        await expect(art.locator('svg')).toHaveCount(0);
      }
      const terminal = page.locator('.human-code [data-loop-codes]');
      await terminal.scrollIntoViewIfNeeded();
      await expect(terminal.locator('code')).toBeVisible();
      expect(await terminal.locator('code').textContent()).toMatch(
        /\S[^\n]*\n[\s\S]*\S/,
      );
      await expect(terminal).not.toHaveAttribute('data-typing', /.+/);
      const counter = page.locator('[data-illustration="counter"]');
      await counter.scrollIntoViewIfNeeded();
      await expect(counter.locator('#rows-value')).toContainText(/\d/);
      await expect(counter.locator('#cost-value')).toContainText(/\d+\.\d{2}/);
      await expect(counter).not.toHaveClass(/is-playing/);
      expect(downloads).toEqual([]);
    });
  });
}

test('native terminal types a completed new frame and the counter advances', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('./');
  const terminal = page.locator('.human-code [data-loop-codes]');
  const code = terminal.locator('code');
  const first = await code.textContent();
  await terminal.scrollIntoViewIfNeeded();
  // The animation starts by typing the same frame used by its static fallback.
  // Sample completion state and text together to avoid reading a partial frame.
  await expect
    .poll(
      () =>
        terminal.evaluate((el, original) => {
          const code = el.querySelector('code');
          return (
            el.dataset.typing === 'complete' &&
            code.querySelector('span') !== null &&
            code.textContent !== original &&
            /\S[^\n]*\n[\s\S]*\S/.test(code.textContent)
          );
        }, first),
      { timeout: 15000 },
    )
    .toBe(true);

  const counter = page.locator('[data-illustration="counter"]');
  const rows = counter.locator('#rows-value');
  const cost = counter.locator('#cost-value');
  const initialRows = await rows.textContent();
  const initialCost = await cost.textContent();
  await counter.scrollIntoViewIfNeeded();
  await expect(counter).toHaveClass(/is-playing/);
  await expect.poll(() => rows.textContent()).not.toBe(initialRows);
  await expect.poll(() => cost.textContent()).not.toBe(initialCost);
});
