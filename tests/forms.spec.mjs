import { expect, test } from './support/site.mjs';

test.use({ viewport: { width: 390, height: 780 } });

for (const [kind, field] of [
  ['press', 'news-url'],
  ['event', 'event-date'],
  ['newsletter', 'company'],
]) {
  test(`mobile ${kind} form is usable and never sends submissions`, async ({
    page,
  }) => {
    await page.goto('./press-mentions');
    const open = page.getByRole('button', { name: 'Add a press mention' });
    await open.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByRole('button', { name: 'Close dialog' }),
    ).toBeFocused();
    if (kind !== 'press') {
      await dialog
        .getByRole('tab', { selected: true })
        .press(kind === 'event' ? 'ArrowLeft' : 'ArrowRight');
      await expect(dialog.locator(`[data-form=${kind}]`)).toBeFocused();
    }
    await expect(dialog.locator(`[data-form=${kind}]`)).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await expect(dialog.locator(`[name=${field}]`)).toBeEnabled();
    for (const inactive of ['press', 'event', 'newsletter'].filter(
      (name) => name !== kind,
    )) {
      const section = dialog.locator('.' + inactive + '-fields');
      await expect(section).toBeHidden();
      for (const input of await section.locator('input,textarea').all())
        await expect(input).toBeDisabled();
    }

    const tabBoxes = await Promise.all(
      (await dialog.getByRole('tab').all()).map((tab) => tab.boundingBox()),
    );
    expect(tabBoxes).toHaveLength(3);
    for (let i = 1; i < tabBoxes.length; i++) {
      expect(tabBoxes[i].y).toBeGreaterThanOrEqual(
        tabBoxes[i - 1].y + tabBoxes[i - 1].height,
      );
    }
    const first = await dialog.locator('[name=first-name]').boundingBox();
    const last = await dialog.locator('[name=last-name]').boundingBox();
    expect(last.y).toBeGreaterThanOrEqual(first.y + first.height);
    expect(
      await dialog.evaluate((el) => el.scrollWidth - el.clientWidth),
    ).toBeLessThanOrEqual(1);

    const submit = dialog.getByRole('button', { name: 'Submit', exact: true });
    await submit.click();
    await expect(dialog.getByRole('status')).toBeEmpty();
    await expect(dialog.locator('[name=first-name]')).toBeFocused();

    for (const input of await dialog
      .locator('input:enabled,textarea:enabled')
      .all()) {
      const type = await input.getAttribute('type');
      await input.fill(
        type === 'email'
          ? 'local@example.invalid'
          : type === 'url'
            ? 'https://example.invalid/'
            : 'Local test',
      );
    }
    // Observe every request after filling, including GET and beacon submissions,
    // and block unexpected calls before they leave the local test environment.
    const requests = [];
    await page.route('**/*', (route) => {
      requests.push(route.request().url());
      return route.abort();
    });
    await submit.click();
    await expect(dialog.getByRole('status')).toContainText(/not sent/i);
    await expect(page).toHaveURL(/\/press-mentions\/?$/);
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(open).toBeFocused();
    expect(requests).toEqual([]);
  });
}
