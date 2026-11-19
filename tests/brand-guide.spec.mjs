import { expect, expectLoadedImages, test } from './support/site.mjs';

for (const width of [390, 1440]) {
  test.describe(`Brand guide rail at ${width}px`, () => {
    test.use({ viewport: { width, height: 900 } });

    test('navigates to sections and follows the reading position in both directions', async ({
      page,
    }) => {
      await page.goto('./brand-guide');
      const rail = page.getByRole('navigation', { name: 'Brand sections' });
      const sections = ['logos', 'colors', 'typography', 'tone'];

      for (const section of sections) {
        const link = rail.locator(`a[href="#${section}"]`);
        await expect(link).toBeInViewport();
        await link.press('Enter');
        await expect(page).toHaveURL(new RegExp(`#${section}$`));
        await expect(page.locator(`#${section} h2`)).toBeInViewport();
        await expect(link).toHaveAttribute('aria-current', 'location');
      }

      // Scroll independently of the URL hash, up and then back down.
      for (const section of [
        'typography',
        'colors',
        'logos',
        'colors',
        'tone',
      ]) {
        await page.locator('#' + section).evaluate((el) => {
          const box = el.getBoundingClientRect();
          scrollTo(
            0,
            scrollY +
              box.top +
              Math.min(box.height, innerHeight) / 2 -
              innerHeight / 2,
          );
        });
        const current = rail.locator('[aria-current="location"]');
        await expect(current).toHaveAttribute('href', '#' + section);
        await expect(current).toBeInViewport();
      }
      await page.getByRole('contentinfo').scrollIntoViewIfNeeded();
      await expect(rail.locator('[aria-current]')).toHaveCount(0);
    });
  });
}

test('logo variants can be selected by pointer and keyboard and load live artwork', async ({
  page,
}) => {
  await page.goto('./brand-guide');
  const tabs = page.locator('[data-logo-color]');
  const images = page.locator('.logo-showcase img');
  expect(await tabs.count()).toBeGreaterThan(1);

  async function expectVariant(tab) {
    await expect(tab).toHaveAttribute('aria-selected', 'true');
    await expect(
      page.locator('[data-logo-color][aria-selected=true]'),
    ).toHaveCount(1);
    const variant = await tab.getAttribute('data-variant');
    for (const image of await images.all()) {
      const source = await image.getAttribute('data-' + variant);
      expect(source).toBeTruthy();
      await expect(image).toHaveAttribute('src', source);
    }
    await expectLoadedImages(images);
  }

  for (const tab of await tabs.all()) {
    await tab.click();
    await expectVariant(tab);
  }
  await page.keyboard.press('ArrowRight');
  await expect(tabs.first()).toBeFocused();
  await expectVariant(tabs.first());
});

test('palette selection updates contrast choices and copies the selected hex value', async ({
  page,
  context,
}) => {
  await page.goto('./brand-guide');
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const colors = page.locator('[data-color]');
  expect(await colors.count()).toBeGreaterThan(1);
  const contrast = page.locator('.accessible-colors');
  const contrasts = new Set();
  for (const color of await colors.all()) {
    await color.click();
    const hex = await color.getAttribute('data-color');
    await expect(page.locator('.color-hex')).toHaveText(hex);
    await expect(color).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('[data-color][aria-pressed=true]')).toHaveCount(
      1,
    );
    await expect(contrast).toContainText(/\bAA(?:18)?\b/);
    contrasts.add(await contrast.textContent());
  }
  expect(contrasts.size).toBeGreaterThan(1);
  const hex = await colors.last().getAttribute('data-color');
  await page.getByRole('button', { name: /copy hex/i }).press('Enter');
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toBe(hex);
});
