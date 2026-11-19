import { chromium, expect } from '@playwright/test';
import fs from 'node:fs/promises';
const browser = await chromium.launch(),
  base = process.env.BASE_URL || 'http://127.0.0.1:4321',
  rows = [];
await fs.mkdir('evidence/round3/motion', { recursive: true });
async function reveal(p, selector) {
  await p.locator(selector).evaluate((e) =>
    scrollTo({
      top: scrollY + e.getBoundingClientRect().top - 200,
      behavior: 'instant',
    }),
  );
}
try {
  for (const width of [1440, 390])
    for (const reducedMotion of ['no-preference', 'reduce']) {
      const p = await browser.newPage({
        viewport: { width, height: 900 },
        reducedMotion,
      });
      await p.goto(base);
      await reveal(p, '.human-code');
      const terminal = p.locator('.human-code [data-loop-codes]');
      if (reducedMotion === 'no-preference')
        await terminal.evaluate(
          (e) =>
            new Promise((resolve, reject) => {
              const t = setTimeout(
                () => reject(Error('typing timed out')),
                20000,
              );
              const o = new MutationObserver(() => {
                if (e.getAttribute('data-typing') === 'complete') {
                  clearTimeout(t);
                  o.disconnect();
                  resolve(true);
                }
              });
              o.observe(e, { attributes: true });
            }),
        );
      const code = await terminal.locator('code').evaluate((e) => ({
        spans: e.querySelectorAll('span').length,
        text: e.textContent,
        whiteSpace: getComputedStyle(e).whiteSpace,
      }));
      expect(code.spans).toBeGreaterThan(2);
      expect(code.text).toContain('\n');
      rows.push({
        name: 'terminal-full-transition',
        width,
        reducedMotion,
        ...code,
      });
      await p.close();
    }
} finally {
  await browser.close();
  await fs.writeFile(
    'evidence/round3/motion/results.json',
    JSON.stringify(rows, null, 2),
  );
}
console.log(rows.length + ' motion assertions passed');
