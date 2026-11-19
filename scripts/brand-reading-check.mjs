import { expect } from '@playwright/test';
/** Current location follows the visible reading midpoint, not the last clicked URL.
 * The source-backed bidirectional fixtures live in round14; this shared assertion
 * also keeps older direct-navigation regressions honest after their click. */
export async function expectReadingMarker(page) {
  await expect
    .poll(() =>
      page.evaluate(() => {
        const links = [...document.querySelectorAll('.brand-sidebar a')];
        const expected = links
          .filter((e) => {
            const r = document.querySelector(e.hash).getBoundingClientRect();
            return r.top <= innerHeight / 2 && r.bottom >= innerHeight / 2;
          })
          .map((e) => e.hash);
        const actual = links
          .filter((e) => e.hasAttribute('aria-current'))
          .map((e) => e.hash);
        return JSON.stringify(actual) === JSON.stringify(expected);
      }),
    )
    .toBe(true);
  for (const link of await page
    .locator('.brand-sidebar a[aria-current]')
    .all()) {
    await expect(link).toHaveCSS('background-color', 'rgb(246, 246, 246)');
    await expect(link).toHaveCSS('color', 'rgb(8, 8, 21)');
  }
}
