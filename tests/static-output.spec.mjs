import { readdir } from 'node:fs/promises';
import { expect, pages, test } from './support/site.mjs';

for (const route of pages) {
  test(`${route.name} has a production document and root canonical`, async ({
    request,
    baseURL,
  }) => {
    const path = route.path ? route.path + '/' : '';
    const response = await request.get(new URL(path, baseURL).href);
    expect(response.status()).toBe(200);
    const html = await response.text();
    const origin = process.env.SITE_URL || 'https://dask.github.io';
    const canonical = new URL('/' + path, origin).href;
    expect(html).toContain(`rel="canonical" href="${canonical}"`);
    expect(html).not.toMatch(/webflow\.js|jquery|cdn\.prod\.website-files/i);
  });
}

test('static output keeps the legacy URLs and omits domain and wildcard artifacts', async ({
  request,
  baseURL,
  mountedURL,
}) => {
  const files = await readdir('dist', { recursive: true });
  expect(files).not.toContain('CNAME');
  expect(files.filter((file) => file.includes('['))).toEqual([]);
  for (const base of [baseURL, mountedURL]) {
    for (const path of ['slides.html', 'ml-slides.html', 'survey.html']) {
      const response = await request.get(new URL(path, base).href);
      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toContain('text/html');
      const html = await response.text();
      if (path === 'survey.html') {
        expect(html).toContain('https://examples.dask.org');
        expect(html).not.toMatch(/<form\b/i);
      } else {
        expect(html).toMatch(
          /http-equiv="refresh"[^>]+https:\/\/docs\.google\.com\/presentation\//i,
        );
      }
    }
  }
});
