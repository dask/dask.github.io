import { chromium, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import { PNG } from 'pngjs';
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
      await reveal(p, '.dashboard-frame');
      const first = await p.locator('.dashboard-code code').innerHTML();
      if (reducedMotion === 'no-preference')
        await p.waitForFunction(
          () =>
            document
              .querySelector('.dashboard-code')
              ?.getAttribute('data-typing') === 'complete',
          {},
          { timeout: 18000 },
        );
      else await p.waitForTimeout(8500);
      const typed = await p.locator('.dashboard-code code').evaluate((e) => ({
        text: e.textContent,
        inner: e.innerText,
        spans: e.querySelectorAll('span').length,
        whiteSpace: getComputedStyle(e).whiteSpace,
      }));
      expect(typed.spans).toBeGreaterThan(2);
      expect(typed.whiteSpace).toBe('pre');
      expect(typed.inner).toContain('\n');
      if (reducedMotion === 'reduce')
        expect(await p.locator('.dashboard-code code').innerHTML()).toBe(first);
      rows.push({
        width,
        reducedMotion,
        name: 'dashboard-full-transition',
        ...typed,
      });
      await p.screenshot({
        path: `evidence/round3/motion/dashboard-${width}-${reducedMotion}.png`,
      });
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
      await reveal(p, '.benchmark-art');
      for (const phase of [0, 1000, 2500, 4500, 7500]) {
        await p.locator('.benchmark-art').evaluate((e, t) => {
          const svg = e.querySelector('svg');
          svg.pauseAnimations();
          const smil = e.querySelector('animateTransform');
          if (e.dataset.gaugesStarted)
            svg.setCurrentTime(smil.getStartTime() + t / 1000);
          for (const animation of e.getAnimations({ subtree: true })) {
            animation.pause();
            animation.currentTime = t;
          }
        }, phase);
        const geometry = await p.locator('.benchmark-art').evaluate((e) => {
          const svg = e.querySelector('svg').getBoundingClientRect();
          return {
            svg: svg.toJSON(),
            needles: [...e.querySelectorAll('.gauge-needle path')].map((p) =>
              p.getBoundingClientRect().toJSON(),
            ),
          };
        });
        for (const r of geometry.needles) {
          expect(r.left).toBeGreaterThanOrEqual(geometry.svg.left - 1);
          expect(r.right).toBeLessThanOrEqual(geometry.svg.right + 1);
          expect(r.top).toBeGreaterThanOrEqual(geometry.svg.top - 1);
          expect(r.bottom).toBeLessThanOrEqual(geometry.svg.bottom + 1);
        }
        const png = PNG.sync.read(
          await p.screenshot({
            path: `evidence/round3/motion/gauges-${width}-${reducedMotion}-${phase}.png`,
          }),
        );
        let yellow = [0, 0];
        const s = geometry.svg;
        for (
          let y = Math.max(0, Math.floor(s.top));
          y < Math.min(png.height, s.bottom);
          y++
        )
          for (
            let x = Math.max(0, Math.floor(s.left));
            x < Math.min(png.width, s.right);
            x++
          ) {
            let i = (y * png.width + x) * 4;
            if (
              png.data[i] > 190 &&
              png.data[i + 1] > 100 &&
              png.data[i + 1] < 230 &&
              png.data[i + 2] < 90
            )
              yellow[x < s.left + s.width / 2 ? 0 : 1]++;
          }
        for (const count of yellow) expect(count).toBeGreaterThan(2);
        rows.push({
          name: 'gauge-visible-pivots',
          width,
          reducedMotion,
          phase,
          yellow,
          ...geometry,
        });
      }
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
