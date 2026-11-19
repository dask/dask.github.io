import {
  expect,
  expectLoadedImages,
  pages,
  test,
  watchPage,
  widths,
} from './support/site.mjs';

for (const width of widths) {
  test.describe(`${width}px viewport`, () => {
    test.use({ viewport: { width, height: 900 } });
    for (const route of pages) {
      test(`${route.name} loads without broken assets or runtime errors`, async ({
        page,
        baseURL,
      }) => {
        const problems = await watchPage(page, baseURL);
        const response = await page.goto('./' + route.path);
        expect(response.status()).toBe(200);
        const main = page.getByRole('main');
        await expect(main.getByRole('heading', { level: 1 })).toBeVisible();
        await page.evaluate(() => document.fonts.ready);
        await expectLoadedImages(page.locator('img'));
        const footer = page.getByRole('contentinfo');
        await expect(
          footer.getByRole('link', { name: /GitHub Pages/i }),
        ).toHaveAttribute('href', 'https://github.com/dask/dask.github.io');
        expect(problems).toEqual([]);
      });
    }
  });
}
