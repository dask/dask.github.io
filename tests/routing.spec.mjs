import { expect, test } from './support/site.mjs';

// Deliberately independent of redirect data: these URLs are public contracts.
const target = 'https://blog.dask.org/';
const known = ['blog', 'events', 'archive/2022-news-events'];
const staticRoutes = known.flatMap((path) => [
  path,
  path + '/',
  path + '?old=yes#section',
  path + '/?old=yes#section',
  path + '/index.html',
]);
const fallbackRoutes = [
  'blog/a-real-old-post',
  'blog/a/deep/arbitrary/path/',
  'blog/a%20post?next=https://elsewhere.invalid/path#old',
  'blog/2022/05/story.html',
  'blog//nested/',
  'events/some-unknown-event',
  'events/2027/a/future-event/?q=anything#fragment',
];
const unrelated = [
  'missing',
  'blogger',
  'blog.html',
  'events-old',
  'myevents/a',
  'archive/2022-news-events-old',
  'archive/2022-news-events/child',
  'not-blog/blog/a',
  'Blog/a',
  'Events/a',
];

for (const mode of ['root', 'mounted']) {
  for (const javaScriptEnabled of [true, false]) {
    test.describe(`${mode} routing with JS ${javaScriptEnabled ? 'on' : 'off'}`, () => {
      test.use({ javaScriptEnabled });

      test('blog, event and archive URLs honor the exact destination and fallback status', async ({
        page,
        baseURL,
        mountedURL,
      }) => {
        const base = mode === 'root' ? baseURL : mountedURL;
        const origin = new URL(base).origin;
        const outbound = [];
        const incoming = [];

        await page.route('**/*', (route) => {
          const url = route.request().url();
          if (new URL(url).origin === origin) return route.continue();
          outbound.push(url);
          return route.fulfill({
            contentType: 'text/html',
            body: '<title>Intercepted destination</title>',
          });
        });
        page.on('response', (response) => {
          if (
            response.request().isNavigationRequest() &&
            new URL(response.url()).origin === origin
          ) {
            incoming.push(response.status());
          }
        });

        for (const [paths, status, redirects] of [
          [staticRoutes, 200, true],
          [fallbackRoutes, 404, javaScriptEnabled],
          [
            mode === 'root'
              ? unrelated
              : [
                  ...unrelated,
                  '/outside-mount/events/a',
                  new URL(base).pathname.replace(/\/$/, '.old/blog/a'),
                ],
            404,
            false,
          ],
        ]) {
          for (const path of paths) {
            await test.step(path, async () => {
              // Distinguish a new redirect from the previous case's final URL.
              if (redirects) await page.goto('about:blank');
              incoming.length = outbound.length = 0;
              const url = new URL(path, base).href;
              if (redirects) {
                await Promise.all([
                  page.waitForURL(target, { timeout: 5000 }),
                  // The immediate HTML redirect can replace the initial navigation.
                  page
                    .goto(url, { waitUntil: 'domcontentloaded' })
                    .catch((error) => {
                      if (!String(error).includes('ERR_ABORTED')) throw error;
                    }),
                ]);
                await expect(page).toHaveURL(target);
                expect(outbound).toEqual([target]);
              } else {
                const response = await page.goto(url);
                expect(response.status()).toBe(404);
                await expect(
                  page.getByRole('main').getByRole('heading', { level: 1 }),
                ).toBeVisible();
                await expect(
                  page.getByRole('link', { name: /return to dask home/i }),
                ).toHaveAttribute('href', new URL(base).pathname);
                if (paths === fallbackRoutes) {
                  await expect(
                    page
                      .getByRole('main')
                      .getByRole('link', { name: 'Dask blog' }),
                  ).toHaveAttribute('href', target);
                }
                await expect(page).toHaveURL(url);
                expect(outbound).toEqual([]);
              }
              expect(incoming).toEqual([status]);
            });
          }
        }
      });
    });
  }
}

test('known redirect documents offer canonical, meta refresh and fallback link', async ({
  request,
  baseURL,
  mountedURL,
}) => {
  for (const base of [baseURL, mountedURL]) {
    for (const path of known) {
      const response = await request.get(new URL(path + '/', base).href);
      expect(response.status()).toBe(200);
      const html = await response.text();
      expect(html).toContain(`rel="canonical" href="${target}"`);
      expect(html).toContain(`http-equiv="refresh" content="0;url=${target}"`);
      expect(html).toContain(`<a href="${target}"`);
    }
  }
});
