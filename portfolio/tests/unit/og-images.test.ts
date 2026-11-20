import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

/** Read width and height from a PNG's IHDR chunk. */
function pngSize(file: string) {
  const buf = readFileSync(resolve(here, '../../public', file));
  expect(buf.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

describe('social cards', () => {
  // 1200x630 is the 1.91:1 size that link previews expect; other sizes get cropped or padded.
  for (const file of ['og-default.png', 'og-ieee-754.png']) {
    it(`${file} is exactly 1200x630`, () => {
      expect(pngSize(file)).toEqual({ width: 1200, height: 630 });
    });
  }
});
