import { execFile } from 'node:child_process';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { expect, pages, test } from './support/site.mjs';

const canonical = 'https://dask.org';
const id = 'GTM-P4GQM59';
const tagManager = 'https://www.googletagmanager.com';
const loader = `${tagManager}/gtm.js?id=${id}`;
let output;

test.beforeAll(async () => {
  output = await mkdtemp(path.join(tmpdir(), 'dask-analytics-'));
  await promisify(execFile)(
    process.execPath,
    ['node_modules/astro/bin/astro.mjs', 'build', '--outDir', output],
    {
      env: {
        ...process.env,
        DASK_PAGES_ANALYTICS: '1',
        READTHEDOCS_CANONICAL_URL: '',
      },
    },
  );
});

test.afterAll(async () => {
  if (output) await rm(output, { recursive: true, force: true });
});

test('only the six content pages in the production artifact contain the original container', async () => {
  const tracked = pages.map(({ path: route }) =>
    path.join(route, 'index.html'),
  );
  const files = await readdir(output, { recursive: true });
  expect(files).toEqual(expect.arrayContaining(tracked));
  for (const file of files) {
    if (!file.endsWith('.html')) continue;
    const html = await readFile(path.join(output, file), 'utf8');
    expect(html).not.toMatch(/UA-18218894-5|G-M6Z7MD5JX6|3553212/);
    expect(html).not.toContain(`${tagManager}/ns.html`);
    if (tracked.includes(file)) {
      expect(html.split(id)).toHaveLength(2);
      expect(html.match(/googletagmanager\.com\/gtm\.js/g)).toHaveLength(1);
      expect(html).toMatch(/<head>[\s\S]*gtm\.js[\s\S]*<\/head>/);
    } else {
      expect(html).not.toContain(tagManager);
    }
  }
});

test('regular builds and Read the Docs previews omit Tag Manager', async ({
  request,
  baseURL,
  mountedURL,
}) => {
  for (const root of [baseURL, mountedURL]) {
    for (const { path: route } of pages) {
      const response = await request.get(new URL(route, root).href);
      expect(response.ok()).toBe(true);
      expect(await response.text()).not.toContain(tagManager);
    }
  }
});

for (const scenario of [
  {
    name: 'canonical host',
    origin: canonical,
    script: true,
    expected: [loader],
  },
  {
    name: 'alternate host',
    origin: 'https://dask.github.io',
    script: true,
    expected: [],
  },
  {
    name: 'canonical host without JavaScript',
    origin: canonical,
    script: false,
    expected: [],
  },
  {
    name: 'alternate host without JavaScript',
    origin: 'https://dask.github.io',
    script: false,
    expected: [],
  },
]) {
  test(`Tag Manager requests on ${scenario.name} are scoped and stubbed`, async ({
    browser,
  }) => {
    const context = await browser.newContext({
      javaScriptEnabled: scenario.script,
      serviceWorkers: 'block',
    });
    try {
      const requests = [];
      const homepage = `${scenario.origin}/`;
      const html = await readFile(path.join(output, 'index.html'));
      // No network request leaves the browser, including undocumented vendors.
      await context.route('**/*', async (route) => {
        const url = route.request().url();
        if (url === homepage)
          return route.fulfill({ contentType: 'text/html', body: html });
        if (new URL(url).origin === scenario.origin) return route.abort();
        requests.push(url);
        if (url === loader)
          return route.fulfill({
            contentType: 'application/javascript',
            body: '',
          });
        return route.abort();
      });
      const page = await context.newPage();
      await page.goto(homepage);
      expect(requests).toEqual(scenario.expected);
      if (scenario.script) {
        const events = await page.evaluate(() =>
          (window.dataLayer || []).map((entry) => entry.event),
        );
        expect(events).toEqual(scenario.expected.length ? ['gtm.js'] : []);
      }
    } finally {
      await context.close();
    }
  });
}
