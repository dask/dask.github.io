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
    const canonical = new URL('/' + path, 'https://dask.org').href;
    expect(html).toContain(`rel="canonical" href="${canonical}"`);
    expect(html).not.toMatch(/webflow\.js|jquery|cdn\.prod\.website-files/i);
  });
}

test('static output omits domain and wildcard artifacts', async () => {
  const files = await readdir('dist', { recursive: true });
  expect(files).not.toContain('CNAME');
  expect(files.filter((file) => file.includes('['))).toEqual([]);
});

// The published URLs identify distinct decks. Check the destination rather
// than freezing the redirect documents' bytes or editorial text.
const legacySlides = {
  'slides.html':
    'https://docs.google.com/presentation/d/e/2PACX-1vSTH2kAR0DCR0nw8pFBe5kuYbOk3inZ9cQfZbzOIRjyzQoVaOoMfI2JONGBz-qsvG_P6g050ddHxSXT/pub?start=false&loop=false&delayms=60000',
  'ml-slides.html':
    'https://docs.google.com/presentation/d/e/2PACX-1vSYCry8AWCGv3zMY8ELc_EB1DCsh4sPzMRLDV0NKl1_5xYGKuF6T7NzBMEZ6mm23OgebOVNzBiMPI5Z/pub?start=false&loop=false&delayms=6000',
};

for (const mode of ['root', 'mounted']) {
  for (const [path, destination] of Object.entries(legacySlides)) {
    test(`${mode} ${path} redirects to its published deck`, async ({
      page,
      request,
      baseURL,
      mountedURL,
    }) => {
      const base = mode === 'root' ? baseURL : mountedURL;
      const response = await request.get(new URL(path, base).href, {
        maxRedirects: 0,
      });
      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toContain('text/html');

      // Parse an inert document. The check never visits Google.
      const targets = await page.evaluate(
        (html) => {
          const doc = new DOMParser().parseFromString(html, 'text/html');
          return [
            ...doc.querySelectorAll('head meta[http-equiv="refresh" i]'),
          ].map(
            (meta) =>
              meta.content.match(/^\s*0\s*;\s*url\s*=\s*(.*?)\s*$/i)?.[1],
          );
        },
        await response.text(),
      );
      expect(targets).toEqual([destination]);
    });
  }

  test(`${mode} survey URL keeps the closed-survey document`, async ({
    request,
    baseURL,
    mountedURL,
  }) => {
    const base = mode === 'root' ? baseURL : mountedURL;
    const response = await request.get(new URL('survey.html', base).href, {
      maxRedirects: 0,
    });
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('text/html');
    const html = await response.text();
    expect(html).toContain('https://examples.dask.org');
    expect(html).not.toMatch(/<form\b/i);
  });
}
