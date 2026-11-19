import {
  expect,
  expectLoadedImages,
  pages,
  test,
  widths,
} from './support/site.mjs';

// A CSS breakpoint sweep is useful here, but the assertion is about readability,
// not the values of the site's style tokens or the dimensions of an old screen.
const layoutWidths = [...widths, 479, 480, 599, 600, 767, 991, 992];

for (const route of pages) {
  test(`${route.name} keeps primary content within the viewport and its clipping containers`, async ({
    page,
  }) => {
    for (const width of layoutWidths) {
      await test.step(`${width}px`, async () => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto('./' + route.path);
        await page.evaluate(() => document.fonts.ready);
        const { overflow, clipped } = await page.evaluate(() => {
          const clipped = [];
          for (const el of document.querySelectorAll(
            'main :is(h1,h2,h3,p,.button,time)',
          )) {
            if (!el.getClientRects().length) continue;
            // A container may extend beyond a clipped decorative section while
            // all of its readable text still fits. Measure the text, not the box.
            const text = document.createRange();
            text.selectNodeContents(el);
            for (const box of text.getClientRects()) {
              if (!box.width || !box.height) continue;
              const clippedBy = (by) =>
                clipped.push({
                  element: el.tagName,
                  text: el.textContent.trim().slice(0, 60),
                  by,
                });
              if (box.left < -1 || box.right > innerWidth + 1)
                clippedBy('viewport');
              for (
                let parent = el;
                parent && parent !== document.body;
                parent = parent.parentElement
              ) {
                const style = getComputedStyle(parent);
                const edge = parent.getBoundingClientRect();
                const clips = (overflow) =>
                  ['hidden', 'clip'].includes(overflow);
                if (
                  (clips(style.overflowY) &&
                    (box.top < edge.top - 2 || box.bottom > edge.bottom + 2)) ||
                  (clips(style.overflowX) &&
                    (box.left < edge.left - 1 || box.right > edge.right + 1))
                ) {
                  clippedBy(parent.className);
                }
              }
            }
          }
          return {
            overflow: document.documentElement.scrollWidth - innerWidth,
            clipped,
          };
        });
        expect(overflow).toBeLessThanOrEqual(1); // Allow subpixel rounding.
        expect(clipped).toEqual([]);
      });
    }
  });
}

test('adoption chart stays inside its section and clear of the labels', async ({
  page,
}) => {
  for (const width of layoutWidths) {
    await test.step(`${width}px`, async () => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('./powered-by');
      await page.evaluate(() => document.fonts.ready);
      const metrics = page.locator('.metrics');
      const chart = metrics.locator('.adoption-chart');
      await expect(chart).toBeVisible();
      await expectLoadedImages(chart);
      const { contained, overlap } = await metrics.evaluate((section) => {
        const bounds = section.getBoundingClientRect();
        const art = section
          .querySelector('.adoption-chart')
          .getBoundingClientRect();
        const overlap = [];
        const walker = document.createTreeWalker(section, NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) {
          const text = walker.currentNode;
          if (
            !text.textContent.trim() ||
            !text.parentElement.closest('h2,.metric')
          )
            continue;
          const range = document.createRange();
          range.selectNodeContents(text);
          for (const ink of range.getClientRects()) {
            if (
              ink.right > art.left &&
              ink.left < art.right &&
              ink.bottom > art.top &&
              ink.top < art.bottom
            ) {
              overlap.push(text.textContent.trim());
            }
          }
        }
        return {
          contained:
            art.left >= bounds.left - 1 &&
            art.right <= bounds.right + 1 &&
            art.top >= bounds.top - 1 &&
            art.bottom <= bounds.bottom + 1,
          overlap,
        };
      });
      expect(contained).toBe(true);
      expect(overlap).toEqual([]);
    });
  }
});
