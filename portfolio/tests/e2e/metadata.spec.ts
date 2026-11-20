import { test, expect, type Page } from '@playwright/test';

const content = (page: Page, selector: string) => page.locator(selector).getAttribute('content');

test.describe('Homepage metadata', () => {
  test('has its own title, and the social tags repeat it', async ({ page }) => {
    await page.goto('/');
    const title = await page.title();
    expect(title).not.toMatch(/^Overview/);
    expect(title).toContain('Collins Mwangi');
    expect(await content(page, 'meta[property="og:title"]')).toBe(title);
    expect(await content(page, 'meta[name="twitter:title"]')).toBe(title);
  });

  test('has a description of sensible length', async ({ page }) => {
    await page.goto('/');
    const description = (await content(page, 'meta[name="description"]')) ?? '';
    expect(description.length).toBeGreaterThan(50);
    expect(description.length).toBeLessThanOrEqual(160);
    expect(await content(page, 'meta[property="og:description"]')).toBe(description);
  });

  test('points at the default social card, with its size and alt text', async ({ page }) => {
    await page.goto('/');
    expect(await content(page, 'meta[property="og:image"]')).toMatch(/^https:\/\/.+\/og-default\.png$/);
    expect(await content(page, 'meta[property="og:image:width"]')).toBe('1200');
    expect(await content(page, 'meta[property="og:image:height"]')).toBe('630');
    expect(await content(page, 'meta[property="og:image:alt"]')).toBeTruthy();
    expect(await content(page, 'meta[name="twitter:image:alt"]')).toBeTruthy();
  });

  test('emits the Person structured data exactly once', async ({ page }) => {
    await page.goto('/');
    const blocks = page.locator('script[type="application/ld+json"]');
    await expect(blocks).toHaveCount(1);
    const data = JSON.parse((await blocks.first().textContent()) ?? '{}');
    expect(data['@type']).toBe('Person');
    expect(data.jobTitle).toBeUndefined();
    expect(data.alumniOf).toBeUndefined();
  });
});

test.describe('IEEE 754 page metadata', () => {
  test('has its own description, card, canonical URL and no Person data', async ({ page }) => {
    await page.goto('/');
    const homeDescription = await content(page, 'meta[name="description"]');

    await page.goto('/notebook/ieee-754/');
    expect(await page.title()).toBe('Floating Point Internals | Collins Mwangi');
    expect(await content(page, 'meta[name="description"]')).not.toBe(homeDescription);
    expect(await content(page, 'meta[property="og:image"]')).toMatch(/\/og-ieee-754\.png$/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/notebook\/ieee-754\/$/);
    await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(0);
  });

  test('is linked from the homepage with a trailing slash, so no redirect is needed', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('a[href^="/notebook/"]')).toHaveAttribute('href', '/notebook/ieee-754/');
  });
});

test.describe('Footer and 404', () => {
  test('footer states the licence accurately', async ({ page }) => {
    await page.goto('/');
    const footer = page.locator('footer');
    await expect(footer).toContainText('MIT License');
    await expect(footer).toContainText('Text and personal content');
    await expect(footer).not.toContainText('ENGINEERED');
  });

  test('404 page is noindex and has no canonical link', async ({ page }) => {
    await page.goto('/404.html');
    expect(await content(page, 'meta[name="robots"]')).toBe('noindex');
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
  });
});
