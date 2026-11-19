import { test as base, expect } from '@playwright/test';

export const test = base.extend({
  baseURL: async ({}, use) => use(process.env.TEST_SITE_URL),
  mountedURL: async ({}, use) => use(process.env.TEST_MOUNTED_URL),
});

export { expect };

export const pages = [
  {
    name: 'Home',
    path: '',
    sections: [
      '.home-intro',
      '.performance',
      '.deployment',
      '.testimonials',
      '.org-band',
      '.use-cases',
      '.home-install',
    ],
  },
  {
    name: 'Get Started',
    path: 'get-started',
    sections: [
      '.install-section',
      '.learn-section',
      '.explore-section',
      '.deeper',
    ],
  },
  { name: 'Get Help', path: 'get-help', sections: ['.help-content'] },
  {
    name: 'Powered By',
    path: 'powered-by',
    sections: [
      '.sponsors',
      '.org-section:not(.projects)',
      '.projects',
      '.metrics',
    ],
  },
  {
    name: 'Brand Guide',
    path: 'brand-guide',
    sections: ['#logos', '#colors', '#typography', '#tone'],
  },
  {
    name: 'Press Mentions',
    path: 'press-mentions',
    sections: ['.press-section', '.press-card:first-child'],
  },
];

export const widths = [320, 390, 768, 1440];

export async function watchPage(page, baseURL) {
  const origin = new URL(baseURL).origin;
  const problems = [];
  await page.route('**/*', (route) => {
    const url = route.request().url();
    if (new URL(url).origin === origin) return route.continue();
    problems.push('Unexpected external request: ' + url);
    return route.abort();
  });
  page.on('pageerror', (error) => problems.push(error.message));
  page.on('requestfailed', (request) => {
    problems.push(`${request.failure()?.errorText}: ${request.url()}`);
  });
  page.on('response', (response) => {
    if (response.status() >= 400) {
      problems.push(`${response.status()}: ${response.url()}`);
    }
  });
  return problems;
}

export async function expectLoadedImages(images) {
  expect(await images.count()).toBeGreaterThan(0);
  await expect
    .poll(() =>
      images.evaluateAll((elements) =>
        elements
          .filter((img) => !img.complete || !img.naturalWidth)
          .map((img) => img.src),
      ),
    )
    .toEqual([]);
}
