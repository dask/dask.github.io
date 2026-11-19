import { chromium, expect } from '@playwright/test';
import fs from 'node:fs/promises';
await fs.mkdir('evidence/round6', { recursive: true });
const browser = await chromium.launch();
const base = process.env.BASE_URL || 'http://127.0.0.1:4321';
const rows = [];
try {
  const p = await browser.newPage({ reducedMotion: 'reduce' });
  for (const width of [
    320, 390, 479, 480, 601, 767, 768, 769, 991, 992, 1440,
  ]) {
    await p.setViewportSize({ width, height: 1000 });
    await p.goto(base + '/');
    await p.evaluate(() => document.fonts.ready);
    const home = await p.evaluate(() => {
      const height = (s) =>
        document.querySelector(s).getBoundingClientRect().height;
      return {
        testimonials: height('.testimonials'),
        cases: height('.use-cases'),
        quotes: [...document.querySelectorAll('.quote')].map((e) => ({
          height: e.getBoundingClientRect().height,
          logo: e.querySelector('.quote-logo').getBoundingClientRect().height,
          author: parseFloat(
            getComputedStyle(e.querySelector('figcaption')).fontSize,
          ),
        })),
        grayscale: [...document.querySelectorAll('.quote-logo')].every(
          (e) => getComputedStyle(e).filter === 'grayscale(1)',
        ),
        benefits: [...document.querySelectorAll('.quote-benefits li')].map(
          (e) => e.textContent.trim(),
        ),
        overflow: document.documentElement.scrollWidth > innerWidth,
      };
    });
    expect(home.quotes).toHaveLength(9);
    expect(home.grayscale).toBe(true);
    expect(home.benefits).toEqual([
      'It’s easy',
      'It’s massive',
      'It solved my problem',
    ]);
    expect(home.overflow).toBe(false);
    if (width === 390) {
      expect(Math.abs(home.testimonials - 3206.15625)).toBeLessThan(0.1);
      expect(Math.abs(home.cases - 2823.15625)).toBeLessThan(0.4);
      expect(Math.abs(home.quotes[0].height - 265.125)).toBeLessThan(0.1);
      expect(home.quotes[0].logo).toBeCloseTo(35.1, 0);
      expect(home.quotes[0].author).toBeCloseTo(16.64, 2);
    }
    if (width === 768) {
      expect(Math.abs(home.testimonials - 2145.21875)).toBeLessThan(0.1);
      expect(Math.abs(home.cases - 1140.1875)).toBeLessThan(1.5);
    }
    if (width === 1440) {
      expect(Math.abs(home.testimonials - 1826.203125)).toBeLessThan(0.25);
      expect(Math.abs(home.cases - 1215.59375)).toBeLessThan(0.1);
    }
    await p.goto(base + '/brand-guide');
    await p.evaluate(() => document.fonts.ready);
    const brand = await p.evaluate(() => {
      const e = document.querySelector('.accessible-colors');
      const section = document.querySelector('#tone');
      return {
        emphasis: [...e.querySelectorAll('strong')].map((s) => ({
          text: s.textContent,
          weight: getComputedStyle(s).fontWeight,
        })),
        weight: getComputedStyle(e).fontWeight,
        emphasizedFont: parseFloat(
          getComputedStyle(section.querySelector('.tone-emphasis')).fontSize,
        ),
        bodyFont: parseFloat(
          getComputedStyle(section.querySelector('p')).fontSize,
        ),
        breaks: section.querySelectorAll('br').length,
        toneHeight: section.getBoundingClientRect().height,
        iconSizes: [...document.querySelectorAll('.brand-sidebar svg')].map(
          (e) => e.getBoundingClientRect().width,
        ),
        railTrack: getComputedStyle(document.querySelector('.brand-body'))
          .backgroundImage,
        background: getComputedStyle(document.querySelector('#logos'))
          .backgroundSize,
      };
    });
    expect(brand.emphasis).toHaveLength(3);
    expect(brand.weight).toBe('400');
    expect(
      brand.emphasis.every(
        (e) => e.weight === '600' && /^#[0-9A-F]{6}$/.test(e.text),
      ),
    ).toBe(true);
    // Original trailing <br> nodes do not create content; preserve the six internal example breaks.
    expect(brand.breaks).toBe(6);
    expect(brand.emphasizedFont / brand.bodyFont).toBeCloseTo(1.125, 2);
    expect(brand.iconSizes).toHaveLength(3);
    expect(brand.iconSizes.every((n) => n > 10 && n < 40)).toBe(true);
    if (width === 390)
      expect(Math.abs(brand.toneHeight - 1938.671875)).toBeLessThan(1);
    if (width >= 768) {
      expect(brand.background).toBe(`${width}px auto`);
      expect(brand.railTrack).toContain('linear-gradient');
      expect(brand.railTrack).toContain('rgb(239, 21, 97)');
    } else expect(brand.railTrack).toBe('none');
    for (const color of ['#1F5AFF', '#FFC11E', '#FC6E6B']) {
      await p.locator(`[data-color="${color}"]`).click();
      const dynamic = await p.locator('.accessible-colors').evaluate((e) => ({
        strong: e.querySelectorAll('strong').length,
        text: e.textContent,
        html: e.querySelectorAll('script,img,iframe').length,
      }));
      expect(dynamic.strong).toBeGreaterThan(0);
      expect(dynamic.html).toBe(0);
      expect(dynamic.text).toMatch(/\(AAA?\)/);
    }
    const foot = await p.locator('footer').evaluate((e) => {
      const r = e.getBoundingClientRect();
      return Object.fromEntries(
        ['.copyright', '.socials', '.footer-nav h2'].map((s) => {
          let z = e.querySelector(s).getBoundingClientRect();
          return [
            s,
            { x: z.x, y: z.y - r.y, width: z.width, height: z.height },
          ];
        }),
      );
    });
    if (width === 390) {
      expect(Math.abs(foot['.copyright'].y - 991.09375)).toBeLessThan(0.1);
      expect(foot['.copyright'].width).toBe(281.75);
    }
    if (width === 768) {
      expect(Math.abs(foot['.footer-nav h2'].y - 179.8125)).toBeLessThan(0.1);
      expect(Math.abs(foot['.socials'].y - 449.3125)).toBeLessThan(0.3);
      expect(Math.abs(foot['.copyright'].y - 551.3125)).toBeLessThan(0.3);
    }
    await p.goto(base + '/press-mentions');
    await p.evaluate(() => document.fonts.ready);
    if (width === 390) {
      const press = await p.locator('.press-section').evaluate((e) => ({
        height: e.getBoundingClientRect().height,
        times: [...e.querySelectorAll('time')].map(
          (t) => getComputedStyle(t).display,
        ),
        lastMargin: getComputedStyle(e.querySelector('.press-card:last-child'))
          .marginBottom,
      }));
      expect(press.times).toHaveLength(9);
      expect(press.times.every((x) => x === 'block')).toBe(true);
      expect(press.lastMargin).toBe('19.5px');
    }
    rows.push({ width, home, brand, foot });
  }
  for (const [route, selector, name] of [
    ['/', '.performance', 'vector-grid'],
    ['/', '.use-cases', 'vector-grid-white-bg'],
    ['/powered-by', '.sponsors', 'vector-grid-white-bg'],
    ['/powered-by', '.metrics', 'vector-grid'],
    ['/brand-guide', '.palette-section', 'vector-grid'],
    ['/get-started', '.learn-section', 'vector-grid'],
    ['/get-started', '.explore-section', 'vector-grid-white-bg'],
  ]) {
    await p.setViewportSize({ width: 1440, height: 1000 });
    await p.goto(base + route);
    expect(
      await p
        .locator(selector)
        .evaluate((e) => getComputedStyle(e).backgroundImage),
    ).toContain(`/assets/${name}.svg`);
  }
  await p.goto(base + '/get-started');
  expect(
    await p
      .locator('.get-started-intro')
      .evaluate((e) => getComputedStyle(e).backgroundImage),
  ).toContain('vector-grid.svg');
  expect(
    await p
      .locator('.install-section')
      .evaluate((e) => getComputedStyle(e).backgroundImage),
  ).toBe('none');
  expect(
    await p
      .locator('.deeper')
      .evaluate((e) => getComputedStyle(e).backgroundImage),
  ).toContain('grid-half-get-st.svg');
  await p.goto(base + '/');
  expect(
    await p
      .locator('.laptop-note')
      .evaluate((e) => getComputedStyle(e).backgroundImage),
  ).toContain('grid-half-home.svg');
  console.log(
    `${rows.length} round6 responsive component groups plus 11 grid-role/continuity assertions passed`,
  );
} finally {
  await browser.close();
  await fs.writeFile(
    'evidence/round6/checks.json',
    JSON.stringify(rows, null, 2) + '\n',
  );
}
