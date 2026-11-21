// Post-build step: fills the Content-Security-Policy in dist/_headers with the SHA-256 hashes of
// every inline <script> and <style> found in dist/**/*.html.
//
// Why: a policy without 'unsafe-inline' blocks inline code unless it is listed by hash. Astro writes
// some inline code itself (its island hydration scripts, small bundled scripts), and those change
// when Astro is upgraded or a page changes, so the hashes are computed from the real output each
// time instead of being copied by hand.
//
// The build FAILS, with a message, if it finds something the policy cannot allow safely:
// inline event handlers (onclick="..."), style="..." attributes, or scripts loaded from other origins.
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const headersFile = path.join(dist, '_headers');
const MAX_LINE = 2000; // Cloudflare Pages: 2,000 characters per line in _headers

const problems = [];
const fail = (msg) => problems.push(msg);

function* htmlFiles(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* htmlFiles(full);
    else if (entry.name.endsWith('.html')) yield full;
  }
}

const sha256 = (text) => `'sha256-${createHash('sha256').update(text, 'utf8').digest('base64')}'`;

// Script types that run as code. Anything else (application/ld+json, importmap...) is a data block.
const isExecutable = (attrs) => {
  const m = attrs.match(/\btype\s*=\s*["']?([^"'\s>]+)/i);
  if (!m) return true;
  return ['module', 'text/javascript', 'application/javascript'].includes(m[1].toLowerCase());
};

const scriptHashes = new Set();
const styleHashes = new Set();
let pages = 0;

if (!existsSync(dist)) {
  console.error('csp: dist/ not found. Run `astro build` first.');
  process.exit(1);
}

for (const file of htmlFiles(dist)) {
  const rel = path.relative(dist, file);
  let html = readFileSync(file, 'utf8');
  pages++;

  html = html.replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi, (whole, attrs, body) => {
    const src = attrs.match(/\bsrc\s*=\s*["']?([^"'\s>]+)/i);
    if (src) {
      if (/^(https?:)?\/\//i.test(src[1])) fail(`${rel}: script loaded from another origin: ${src[1]}`);
    } else if (isExecutable(attrs) && body.trim() !== '') {
      scriptHashes.add(sha256(body));
    }
    return ''; // remove, so the checks below only see markup
  });

  html = html.replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gi, (whole, body) => {
    if (body.trim() !== '') styleHashes.add(sha256(body));
    return '';
  });

  for (const m of html.matchAll(/<([a-zA-Z][\w-]*)\b[^>]*?\s(on[a-z]+)\s*=/g)) {
    fail(`${rel}: inline event handler ${m[2]}="..." on <${m[1]}>. Attach it with addEventListener in a script instead.`);
  }
  for (const m of html.matchAll(/<([a-zA-Z][\w-]*)\b[^>]*?\sstyle\s*=/g)) {
    fail(`${rel}: style="..." attribute on <${m[1]}>. Use a class instead (style attributes cannot be allowed without 'unsafe-inline').`);
  }
}

if (!existsSync(headersFile)) fail('dist/_headers not found (is public/_headers missing?)');

const lines = existsSync(headersFile) ? readFileSync(headersFile, 'utf8').split('\n') : [];
const cspIndexes = lines.flatMap((l, i) => (/^\s+Content-Security-Policy:/i.test(l) ? [i] : []));
if (cspIndexes.length !== 1) {
  fail(`expected exactly one "Content-Security-Policy:" line in dist/_headers, found ${cspIndexes.length}.`);
} else {
  for (const token of ['__SCRIPT_HASHES__', '__STYLE_HASHES__']) {
    if (!lines[cspIndexes[0]].includes(token)) fail(`${token} not found in the Content-Security-Policy line of public/_headers.`);
  }
}

if (problems.length) {
  console.error('\ncsp: cannot build a safe Content-Security-Policy:\n');
  for (const p of problems) console.error('  - ' + p);
  console.error('');
  process.exit(1);
}

const fill = (line, token, set) =>
  line.replace(new RegExp(` ?${token}`), set.size ? ' ' + [...set].sort().join(' ') : '');
let csp = lines[cspIndexes[0]];
csp = fill(csp, '__SCRIPT_HASHES__', scriptHashes);
csp = fill(csp, '__STYLE_HASHES__', styleHashes);
lines[cspIndexes[0]] = csp;

if (/__(SCRIPT|STYLE)_HASHES__/.test(csp)) {
  console.error('csp: an unreplaced placeholder is left in the Content-Security-Policy line.');
  process.exit(1);
}
const tooLong = lines.filter((l) => l.length > MAX_LINE);
if (tooLong.length) {
  console.error(`csp: a _headers line is ${tooLong[0].length} characters; Cloudflare allows ${MAX_LINE}.`);
  process.exit(1);
}

writeFileSync(headersFile, lines.join('\n'));
console.log(
  `csp: ${pages} page(s) scanned; ${scriptHashes.size} inline script hash(es), ${styleHashes.size} inline style hash(es) written to dist/_headers`
);
