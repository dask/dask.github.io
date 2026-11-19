import { chromium, expect } from '@playwright/test';
import fs from 'node:fs/promises';
const b = await chromium.launch(),
  rows = [],
  base = process.env.BASE_URL || 'http://127.0.0.1:4321';
try {
  for (const width of [
    320, 390, 479, 480, 599, 600, 601, 767, 768, 991, 992, 1440,
  ]) {
    const p = await b.newPage({
      viewport: { width, height: 900 },
      reducedMotion: 'reduce',
    });
    await p.goto(base + '/powered-by');
    const r = await p.locator('.metrics').evaluate((e) => {
      const chart = e.querySelector('.adoption-chart'),
        r = chart.getBoundingClientRect(),
        box = e.getBoundingClientRect(),
        overlap = [];
      for (const el of e.querySelectorAll('h2,.metric')) {
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) {
          if (!walker.currentNode.textContent.trim()) continue;
          const range = document.createRange();
          range.selectNodeContents(walker.currentNode);
          for (const t of range.getClientRects())
            if (
              t.right > r.left &&
              t.left < r.right &&
              t.bottom > r.top &&
              t.top < r.bottom
            )
              overlap.push(walker.currentNode.textContent.trim());
        }
      }
      return {
        chart: r.toJSON(),
        box: box.toJSON(),
        naturalWidth: chart.naturalWidth,
        overlap,
      };
    });
    rows.push({ width, ...r });
    expect(r.naturalWidth).toBeGreaterThan(0);
    expect(r.chart.left).toBeGreaterThanOrEqual(r.box.left);
    expect(r.chart.right).toBeLessThanOrEqual(r.box.right + 1);
    expect(r.chart.top).toBeGreaterThanOrEqual(r.box.top);
    expect(r.chart.bottom).toBeLessThanOrEqual(r.box.bottom + 1);
    expect(r.overlap).toEqual([]);
    await p.close();
  }
} finally {
  await b.close();
  await fs.writeFile(
    'evidence/round3/art-bounds.json',
    JSON.stringify(rows, null, 2),
  );
}
console.log(
  rows.length + ' loaded artwork bounds/text separation checks passed',
);
