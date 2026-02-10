import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Portfolio Homepage', () => {
  test('page loads and displays main content', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Full-Stack Engineering');
    await expect(page.locator('h2:has-text("Selected Work")')).toBeVisible();
    const projectCards = page.locator('a[aria-label*="project"]');
    await expect(projectCards).toHaveCount(4);
  });

  test('all external links open in new tab with proper security', async ({ page }) => {
    await page.goto('/');
    const projectLinks = page.locator('a[target="_blank"]');
    const count = await projectLinks.count();

    for (let i = 0; i < count; i++) {
      const link = projectLinks.nth(i);
      const rel = await link.getAttribute('rel');
      expect(rel).toContain('noopener');
      expect(rel).toContain('noreferrer');
    }
  });

  test('keyboard navigation works', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(focused).toBeTruthy();
  });

  test('contact email link works', async ({ page }) => {
    await page.goto('/');

    const emailLink = page.locator('a[href^="mailto:"]');
    await expect(emailLink).toBeVisible();
    await expect(emailLink).toHaveAttribute('href', 'mailto:mwangicollins391@gmail.com');
  });
});

test.describe('Accessibility', () => {
  test('should not have automatic accessibility violations', async ({ page }) => {
    await page.goto('/');
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('focus indicators are visible', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });
});

test.describe('Performance Checks', () => {
  test('page title is correct', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Collins Mwangi/);
  });

  test('no console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    const relevantErrors = errors.filter(err => !err.includes('System trace failed'));
    expect(relevantErrors).toHaveLength(0);
  });
});
