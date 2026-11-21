import { test, expect, type Page } from '@playwright/test';

// These tests only mean something when the real headers are served:
//   npm run build && npm run test:e2e:pages
// Against `astro preview` there is no Content-Security-Policy header and they skip themselves.

const PAGES = ['/', '/notebook/ieee-754/', '/404.html'];

async function watch(page: Page) {
  const problems: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') problems.push(`console: ${msg.text()}`);
  });
  page.on('pageerror', (err) => problems.push(`pageerror: ${err.message}`));
  await page.addInitScript(() => {
    document.addEventListener('securitypolicyviolation', (e) => {
      (window as any).__csp = (window as any).__csp ?? [];
      (window as any).__csp.push(`${e.violatedDirective} blocked ${e.blockedURI || 'inline'}`);
    });
  });
  return problems;
}

const violations = (page: Page) => page.evaluate(() => (window as any).__csp ?? []);

for (const url of PAGES) {
  test(`no CSP violations or console errors on ${url}`, async ({ page }) => {
    const problems = await watch(page);
    const res = await page.goto(url);
    const csp = res?.headers()['content-security-policy'];
    test.skip(!csp, 'No Content-Security-Policy header: run `npm run test:e2e:pages` after `npm run build`.');

    await page.waitForLoadState('networkidle');
    expect(await violations(page)).toEqual([]);
    expect(problems).toEqual([]);
  });
}

test('the policy has no unsafe-inline, no leftover placeholders, and hashes for the inline code', async ({ page }) => {
  const res = await page.goto('/notebook/ieee-754/');
  const csp = res?.headers()['content-security-policy'];
  test.skip(!csp, 'No Content-Security-Policy header: run `npm run test:e2e:pages` after `npm run build`.');

  expect(csp).not.toContain('unsafe-inline');
  expect(csp).not.toContain('unsafe-eval');
  expect(csp).not.toMatch(/__(SCRIPT|STYLE)_HASHES__/);
  expect(csp).toMatch(/script-src 'self'( 'sha256-[A-Za-z0-9+/=]+')+;/);
});

test('the visualizer still hydrates and responds under the policy', async ({ page }) => {
  const problems = await watch(page);
  const res = await page.goto('/notebook/ieee-754/');
  test.skip(!res?.headers()['content-security-policy'], 'Run `npm run test:e2e:pages` after `npm run build`.');

  await page.click('button:has-text("+∞")');
  await expect(page.locator('text=0x7F800000')).toBeVisible();
  await page.locator('button[aria-label*="Sign bit"]').click();
  await expect(page.locator('text=0xFF800000')).toBeVisible();

  expect(await violations(page)).toEqual([]);
  expect(problems).toEqual([]);
});

test('404 "cd .." button goes back without an inline handler', async ({ page }) => {
  await page.goto('/');
  const res = await page.goto('/404.html');
  test.skip(!res?.headers()['content-security-policy'], 'Run `npm run test:e2e:pages` after `npm run build`.');

  await page.click('#go-back');
  await expect(page).toHaveURL(/\/$/);
});
