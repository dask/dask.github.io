import { chromium, expect } from '@playwright/test';
import fs from 'node:fs/promises';
const browser = await chromium.launch();
const base = process.env.BASE_URL || 'http://127.0.0.1:4321';
const rows = [];
await fs.mkdir('evidence/round3/local', { recursive: true });
for (const width of [
  320, 390, 479, 480, 599, 600, 601, 767, 768, 991, 992, 1440,
])
  for (const route of [
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
    await p.goto(base + '/' + route);
    await p.evaluate(() => document.fonts.ready);
    const data = await p.evaluate(() => {
      const h = document.querySelector('h1'),
        s = getComputedStyle(h);
      const hero = h.closest('section');
      const rect = (e) => e.getBoundingClientRect().toJSON();
      const clipped = [];
      for (const e of document
        .querySelector('main')
        .querySelectorAll('h1,h2,h3,p,.button,time')) {
        const r = e.getBoundingClientRect();
        if (!r.width || !r.height) continue;
        for (
          let a = e.parentElement;
          a && a !== document.body;
          a = a.parentElement
        ) {
          const style = getComputedStyle(a);
          if (['hidden', 'clip'].includes(style.overflowY)) {
            const ar = a.getBoundingClientRect();
            if (r.bottom > ar.bottom + 2 || r.top < ar.top - 2)
              clipped.push({
                text: e.textContent.slice(0, 40),
                rect: rect(e),
                ancestor: a.className,
                bounds: ar.toJSON(),
              });
          }
        }
      }
      const collisions = [];
      const table = [...document.querySelectorAll('.type-row')];
      for (const e of table) {
        const children = [...e.children];
        for (let i = 0; i < children.length - 1; i++) {
          const range = document.createRange();
          range.selectNodeContents(children[i]);
          for (const r of range.getClientRects())
            if (r.right > children[i + 1].getBoundingClientRect().left + 1)
              collisions.push({
                text: children[i].textContent.trim(),
                right: r.right,
                next: children[i + 1].getBoundingClientRect().left,
              });
        }
      }
      return {
        width: innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        h1: { font: s.fontSize, line: s.lineHeight, ...rect(h) },
        hero: rect(hero),
        brandParagraph: document.querySelector('#logos p')
          ? {
              font: getComputedStyle(document.querySelector('#logos p'))
                .fontSize,
              ...rect(document.querySelector('#logos p')),
            }
          : null,
        rail: document.querySelector('.brand-sidebar')
          ? rect(document.querySelector('.brand-sidebar'))
          : null,
        clipped,
        collisions,
      };
    });
    await p.screenshot({
      path: `evidence/round3/local/${route || 'home'}-${width}.png`,
      fullPage: true,
    });
    rows.push({ route: route || 'home', width, ...data });
    await p.close();
  }
await browser.close();
await fs.writeFile(
  'evidence/round3/responsive.json',
  JSON.stringify(rows, null, 2),
);
for (const r of rows)
  if (r.clipped.length || r.collisions.length || r.scrollWidth > r.width + 1)
    console.log(
      r.route,
      r.width,
      JSON.stringify({
        clipped: r.clipped,
        collisions: r.collisions,
        overflow: r.scrollWidth - r.width,
      }),
    );

const expectedBrandH1 = {
  320: 30.72,
  390: 37.44,
  479: 45.984,
  480: 25.2624,
  599: 31.5254,
  600: 31.578,
  601: 31.6306,
  767: 40.3672,
  768: 40.4198,
  991: 52.1563,
  992: 38.5789,
  1440: 56.0016,
};
for (const row of rows) {
  expect(
    row.scrollWidth,
    `${row.route} ${row.width} document width`,
  ).toBeLessThanOrEqual(row.width + 1);
  expect(
    row.clipped,
    `${row.route} ${row.width} visible text cut off by an ancestor`,
  ).toEqual([]);
  // Fresh original evidence shows its fixed 40px specimen intentionally reaches
  // 6.109375px into the next cell at320 (not a newly introduced collision).
  // Keep every other cell strict and compare this one against the source, rather
  // than shrinking the actual font to make an inaccurate table pass.
  if (row.route === 'brand-guide' && row.width === 320) {
    const [sample] = JSON.parse(
      await fs.readFile('tests/fixtures/narrow-specimen-reference.json'),
    );
    expect(row.collisions.length).toBe(1);
    expect(row.collisions[0].text).toBe('Inter');
    expect(
      Math.abs(
        row.collisions[0].right -
          row.collisions[0].next -
          (sample.ink.right - sample.next.left),
      ),
    ).toBeLessThan(0.05);
  } else {
    expect(
      row.collisions,
      `${row.route} ${row.width} specimen collision`,
    ).toEqual([]);
  }
  if (row.route === 'brand-guide') {
    expect(
      Math.abs(parseFloat(row.h1.font) - expectedBrandH1[row.width]),
    ).toBeLessThan(0.02);
    if (row.width < 768) expect(row.rail.width).toBe(row.width);
    else expect(row.rail.width).toBeLessThan(100);
  }
}
console.log(`${rows.length} full-page responsive geometry checks passed`);
