import { chromium } from '@playwright/test';

async function captureOGImage() {
  console.log('🎬 Launching browser...');
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  console.log('📡 Navigating to IEEE 754 visualizer...');
  await page.goto('http://localhost:4321/notebook/ieee-754/');
  
  console.log('⏳ Waiting for component to hydrate...');
  await page.waitForSelector('input#float-input', { state: 'visible' });
  await page.waitForTimeout(1000);

  console.log('🧹 Hiding Astro dev toolbar...');
  await page.evaluate(() => {
    const toolbar = document.querySelector('astro-dev-toolbar');
    if (toolbar) toolbar.style.display = 'none';
  });

  console.log('🔢 Loading Infinity value...');
  await page.click('button:has-text("+∞")');
  await page.waitForTimeout(500);

  console.log('🖼️  Framing the shot...');
  const visualizer = await page.locator('.bg-zinc-900.border.border-zinc-800.rounded-xl').first();
  const box = await visualizer.boundingBox();
  
  if (box) {
    await page.setViewportSize({
      width: Math.ceil(box.width + 100),
      height: Math.ceil(box.height + 100),
    });
    await page.waitForTimeout(300);
  }

  console.log('📸 Capturing screenshot...');
  await visualizer.screenshot({
    path: 'public/og-default.png',
    animations: 'disabled',
  });

  await browser.close();
  console.log('✅ OG image saved to public/og-default.png');
  console.log('   Size optimized for social media (1200x630 recommended)');
}

captureOGImage().catch(console.error);
