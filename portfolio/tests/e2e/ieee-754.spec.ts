import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('IEEE 754 Notebook Page', () => {
  test('page loads and displays component', async ({ page }) => {
    await page.goto('/notebook/ieee-754/');

    await expect(page.locator('h1')).toContainText('Floating Point Internals');
    
    await expect(page.locator('h2').filter({ hasText: 'IEEE 754 Visualizer' })).toBeVisible();

    await expect(page.locator('input#float-input')).toBeVisible();
  });

  test('visualizer is interactive', async ({ page }) => {
    await page.goto('/notebook/ieee-754/');

    const input = page.locator('input#float-input');
    await input.fill('42');

    const bits = page.locator('button[aria-label*="bit"]');
    await expect(bits.first()).toBeVisible();
  });

  test('example buttons work', async ({ page }) => {
    await page.goto('/notebook/ieee-754/');

    const input = page.locator('input#float-input');
    await input.waitFor({ state: 'visible' });
    
    await page.waitForTimeout(500);
    
    await page.click('button:has-text("+∞")');
    
    await expect(page.locator('text=SPECIAL VALUE')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=+Infinity')).toBeVisible();
  });

  test('bits are toggleable via keyboard', async ({ page }) => {
    await page.goto('/notebook/ieee-754/');

    await page.waitForTimeout(500);

    const firstBit = page.locator('button[aria-label*="Sign bit"]');
    await firstBit.focus();
    await expect(firstBit).toBeFocused();

    await firstBit.press('Enter');
    await page.waitForTimeout(200);
    
    await expect(page.locator('div[role="status"]').first()).toContainText('Negative (1)');
  });

  test('should not have accessibility violations', async ({ page }) => {
    await page.goto('/notebook/ieee-754/');

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('back link works', async ({ page }) => {
    await page.goto('/notebook/ieee-754/');

    await page.click('text=cd ..');
    await expect(page).toHaveURL('/');
  });
});
