import {
  expect,
  expectLoadedImages,
  pages,
  test,
  watchPage,
} from './support/site.mjs';

test.use({ viewport: { width: 390, height: 900 } });

for (const route of pages) {
  test(`${route.name} resolves its canonical, rendered assets and local links under the preview mount`, async ({
    page,
    request,
    mountedURL,
  }) => {
    const problems = await watchPage(page, mountedURL);
    const response = await page.goto(new URL(route.path, mountedURL).href);
    expect(response.status()).toBe(200);
    await expect(
      page.getByRole('main').getByRole('heading', { level: 1 }),
    ).toBeVisible();
    const canonical = new URL(
      route.path ? route.path + '/' : '',
      process.env.TEST_MOUNTED_CANONICAL,
    );
    await expect(page.locator('link[rel=canonical]')).toHaveAttribute(
      'href',
      canonical.href,
    );
    await page.evaluate(() => document.fonts.ready);
    await expectLoadedImages(page.locator('img'));

    const urls = await page
      .locator('[href], [src], [poster], [action]')
      .evaluateAll((elements) => [
        ...new Set(
          elements
            .flatMap((el) =>
              ['href', 'src', 'poster', 'action'].map((attr) =>
                el.getAttribute(attr),
              ),
            )
            .filter(
              (value) => value?.startsWith('/') && !value.startsWith('//'),
            ),
        ),
      ]);
    expect(urls.length).toBeGreaterThan(0);
    const mount = new URL(mountedURL).pathname;
    for (const path of urls) {
      expect(path.startsWith(mount), path).toBe(true);
      expect(
        (
          await request.get(new URL(path, mountedURL).href, { maxRedirects: 0 })
        ).status(),
        path,
      ).toBe(200);
    }

    const credit = page
      .getByRole('contentinfo')
      .getByRole('link', { name: /GitHub Pages/i });
    await expect(credit).toHaveAttribute(
      'href',
      'https://github.com/dask/dask.github.io',
    );

    if (route.path === 'brand-guide') {
      const tabs = page.locator('[data-logo-color]');
      expect(await tabs.count()).toBeGreaterThan(1);
      for (const tab of await tabs.all()) {
        await tab.click();
        await expect(tab).toHaveAttribute('aria-selected', 'true');
        await expectLoadedImages(page.locator('.logo-showcase img'));
      }
    }
    expect(problems).toEqual([]);
  });
}
