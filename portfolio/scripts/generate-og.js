// Generates the social cards in public/ at exactly 1200x630.
//
//   npm run generate-og
//
// No dev server is needed: the cards are drawn from the HTML template below. On Ubuntu 26.04 set
//   export PLAYWRIGHT_HOST_PLATFORM_OVERRIDE=ubuntu24.04-x64
// first, as for the end-to-end tests.
//
// The cards deliberately do not contain the domain name, so they stay valid if the site moves.
import { chromium } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fontFile = path.join(
  root,
  'node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2'
);

// The 32 bits of 0.1 as a float32, and its hex. Computed here so the cards cannot drift from the maths.
const view = new DataView(new ArrayBuffer(4));
view.setFloat32(0, 0.1);
const word = view.getUint32(0);
const bits = word.toString(2).padStart(32, '0');
const hex = '0x' + word.toString(16).toUpperCase().padStart(8, '0');
// Exact decimal expansion of the stored value; checked by tests/unit/float32.test.ts.
const exact = '0.100000001490116119384765625';

const COLORS = { sign: '#f87171', exponent: '#4ade80', fraction: '#60a5fa' };

function cells(str, color) {
  return `<div class="group">${[...str]
    .map((b) => `<span class="bit" style="--c:${color}">${b}</span>`)
    .join('')}</div>`;
}

const bitRow = `<div class="bits">${cells(bits.slice(0, 1), COLORS.sign)}${cells(
  bits.slice(1, 9),
  COLORS.exponent
)}${cells(bits.slice(9), COLORS.fraction)}</div>`;

const legend = `<div class="legend">
  <span style="color:${COLORS.sign}">sign</span>
  <span style="color:${COLORS.exponent}">exponent</span>
  <span style="color:${COLORS.fraction}">fraction</span>
</div>`;

const cards = [
  {
    file: 'og-default.png',
    kicker: '~/home/collins',
    title: 'Collins Mwangi',
    titleSize: 88,
    subtitle: 'Data Science student, University of Nairobi',
    tagline: 'Learning how things work, from the fundamentals up.',
    caption: `0.1 as a 32-bit float: ${hex}`,
  },
  {
    file: 'og-ieee-754.png',
    kicker: '~/notebook',
    title: 'Floating Point Internals',
    titleSize: 64,
    subtitle: 'How a computer stores a real number in 32 bits',
    tagline: 'An interactive IEEE 754 visualizer',
    caption: `0.1 is stored as ${exact}`,
  },
];

function html(card, fontCss) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
${fontCss}
*{box-sizing:border-box;margin:0}
html,body{width:1200px;height:630px;background:#09090b;color:#d4d4d8;
  font-family:'JB','JetBrains Mono',ui-monospace,'DejaVu Sans Mono',monospace}
.frame{position:relative;width:1200px;height:630px;padding:64px 72px;display:flex;flex-direction:column;
  border:2px solid #27272a;background:
  radial-gradient(900px 420px at 85% -10%,rgba(16,185,129,.14),transparent 60%),#09090b}
.kicker{font-size:26px;color:#a1a1aa;letter-spacing:.06em}
.title{margin-top:34px;color:#fff;font-size:${card.titleSize}px;line-height:1.05;font-weight:400;letter-spacing:-.01em}
.subtitle{margin-top:20px;font-size:32px;color:#a1a1aa}
.tagline{margin-top:30px;font-size:30px;color:#34d399}
.spacer{flex:1}
.legend{display:flex;gap:28px;font-size:20px;margin-bottom:12px}
.bits{display:flex;gap:14px}
.group{display:flex;gap:2px}
.bit{width:30px;height:44px;display:flex;align-items:center;justify-content:center;font-size:22px;
  color:var(--c);background:color-mix(in srgb,var(--c) 12%,transparent);border:1px solid color-mix(in srgb,var(--c) 40%,transparent)}
.caption{margin-top:16px;font-size:22px;color:#71717a}
</style></head><body><div class="frame">
<div class="kicker">${card.kicker}</div>
<div class="title">${card.title}</div>
<div class="subtitle">${card.subtitle}</div>
<div class="tagline">${card.tagline}</div>
<div class="spacer"></div>
${legend}${bitRow}
<div class="caption">${card.caption}</div>
</div></body></html>`;
}

async function main() {
  let fontCss = '';
  if (existsSync(fontFile)) {
    const b64 = readFileSync(fontFile).toString('base64');
    fontCss = `@font-face{font-family:'JB';src:url(data:font/woff2;base64,${b64}) format('woff2');font-weight:400}`;
  } else {
    console.warn('JetBrains Mono not found in node_modules; falling back to a system monospace font.');
  }

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1, // 1 so the file is exactly 1200x630 pixels
  });
  const page = await context.newPage();

  for (const card of cards) {
    await page.setContent(html(card, fontCss), { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    const out = path.join(root, 'public', card.file);
    await page.screenshot({ path: out, animations: 'disabled' });
    console.log('saved', path.relative(root, out));
  }

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
