import { expect, test } from './support/site.mjs';

for (const width of [390, 768, 1440]) {
  test.describe(`${width}px navigation`, () => {
    test.use({ viewport: { width, height: 900 } });

    test('menu and Community controls work by keyboard and navigate locally', async ({
      page,
    }) => {
      await page.goto('./');
      const menu = page.getByRole('button', { name: /^(open|close) menu$/i });
      const nav = page.getByRole('navigation', { name: 'Main navigation' });
      const community = nav.getByRole('button', { name: 'Community' });
      const help = nav.getByRole('link', { name: 'Get Help' });

      if (width < 992) {
        await expect(nav).toBeHidden();
        await menu.press('Enter');
        await expect(menu).toHaveAttribute('aria-expanded', 'true');
        await expect(nav).toBeVisible();
        // Community links are already expanded in the mobile layout.
        await expect(help).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(menu).toHaveAttribute('aria-expanded', 'false');
        await expect(nav).toBeHidden();
        await menu.click();
      } else {
        await expect(help).toBeHidden();
        await community.press('Space');
        await expect(community).toHaveAttribute('aria-expanded', 'true');
        await expect(help).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(community).toHaveAttribute('aria-expanded', 'false');
        await expect(help).toBeHidden();
        await community.click();
      }
      await help.press('Enter');
      await expect(page).toHaveURL(/\/get-help\/?$/);
      await expect(page.getByRole('main')).toBeVisible();
    });
  });
}

for (const { name, path, group } of [
  { name: 'Workloads', path: '', group: '.workload-tabs' },
  { name: 'Deployment', path: '', group: '.deployment-tabs' },
  { name: 'Explore', path: 'get-started', group: '.explore-tabs' },
]) {
  for (const width of [390, 1440]) {
    test.describe(`${name} at ${width}px`, () => {
      test.use({ viewport: { width, height: 900 } });

      test('click and keyboard select one linked panel and keep actions usable', async ({
        page,
      }) => {
        await page.goto('./' + path);
        const widget = page.locator(group);
        const tabs = widget.getByRole('tab');
        const count = await tabs.count();
        expect(count).toBeGreaterThan(1);

        async function expectSelected(index) {
          const active = tabs.nth(index);
          await expect(active).toBeFocused();
          await expect(active).toHaveAttribute('tabindex', '0');
          await expect(widget.getByRole('tab', { selected: true })).toHaveCount(
            1,
          );
          await expect(active).toHaveAttribute('aria-selected', 'true');
          const panel = widget.getByRole('tabpanel');
          const id = await active.getAttribute('aria-controls');
          expect(id).toBeTruthy();
          await expect(panel).toHaveId(id);
          await expect(panel).toBeVisible();
          const actions = panel.getByRole('link');
          expect(await actions.count()).toBeGreaterThanOrEqual(
            group === '.explore-tabs' ? 1 : 2,
          );
          for (const action of await actions.all()) {
            await expect(action).toBeVisible();
            await expect(action).toHaveAttribute(
              'href',
              /^(https:\/\/|\/[^/])/,
            );
          }
        }

        for (let index = 0; index < count; index++) {
          await tabs.nth(index).click();
          await expectSelected(index);
        }
        for (const [key, index] of [
          ['Home', 0],
          ['ArrowRight', 1],
          ['End', count - 1],
          ['ArrowRight', 0],
          ['ArrowLeft', count - 1],
        ]) {
          await page.keyboard.press(key);
          await expectSelected(index);
        }
        if (group === '.explore-tabs') {
          await widget
            .getByRole('button', { name: /previous exploration/i })
            .click();
          await expectSelected(count - 2);
        }
      });
    });
  }
}
