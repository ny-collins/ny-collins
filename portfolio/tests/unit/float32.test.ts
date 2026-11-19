import { describe, it, expect } from 'vitest';
import {
  bitsToFloat,
  decode,
  exactDecimal,
  floatToBits,
  parseFloatInput,
  toggleBit,
  toHex,
} from '../../src/lib/float32';

describe('floatToBits / bitsToFloat', () => {
  const vectors: Array<[number, number]> = [
    [0, 0x00000000],
    [-0, 0x80000000],
    [1, 0x3f800000],
    [-2, 0xc0000000],
    [Infinity, 0x7f800000],
    [-Infinity, 0xff800000],
    [0.1, 0x3dcccccd],
    [3.4028234663852886e38, 0x7f7fffff], // largest finite float32
    [1.1754943508222875e-38, 0x00800000], // smallest normal
  ];

  for (const [value, bits] of vectors) {
    it(`encodes ${Object.is(value, -0) ? '-0' : value} as ${toHex(bits)}`, () => {
      expect(floatToBits(value)).toBe(bits);
    });
  }

  it('decodes the smallest subnormal, 2^-149', () => {
    expect(bitsToFloat(0x00000001)).toBe(2 ** -149);
  });

  it('keeps the sign of zero', () => {
    expect(Object.is(bitsToFloat(0x80000000), -0)).toBe(true);
  });

  it('round-trips 10,000 pseudo-random non-NaN patterns', () => {
    let state = 123456789;
    for (let i = 0; i < 10000; i++) {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      const isNaNPattern = ((state >>> 23) & 0xff) === 255 && (state & 0x7fffff) !== 0;
      if (isNaNPattern) continue;
      expect(floatToBits(bitsToFloat(state))).toBe(state);
    }
  });
});

describe('toggleBit', () => {
  it('flips the sign bit (index 0)', () => {
    expect(toggleBit(0, 0)).toBe(0x80000000);
    expect(toggleBit(0x80000000, 0)).toBe(0);
  });
  it('flips the last fraction bit (index 31)', () => {
    expect(toggleBit(0, 31)).toBe(1);
  });
  it('rejects out-of-range indices', () => {
    expect(() => toggleBit(0, 32)).toThrow();
    expect(() => toggleBit(0, -1)).toThrow();
  });
});

describe('decode', () => {
  it('classifies the five kinds', () => {
    expect(decode(0x00000000).kind).toBe('zero');
    expect(decode(0x80000000).kind).toBe('zero');
    expect(decode(0x00000001).kind).toBe('subnormal');
    expect(decode(0x3f800000).kind).toBe('normal');
    expect(decode(0x7f800000).kind).toBe('infinity');
    expect(decode(0x7fc00000).kind).toBe('nan');
  });

  it('tells quiet NaNs from signaling NaNs by the top fraction bit', () => {
    expect(decode(0x7fc00000).nanKind).toBe('quiet');
    expect(decode(0x7f800001).nanKind).toBe('signaling');
  });

  it('uses exponent -126 for subnormals and e-127 for normals', () => {
    expect(decode(0x00000001).unbiasedExponent).toBe(-126);
    expect(decode(0x3f800000).unbiasedExponent).toBe(0);
    expect(decode(0x7f7fffff).unbiasedExponent).toBe(127);
  });

  it('shows that 0.1 is not stored exactly', () => {
    expect(decode(floatToBits(0.1)).exact).toBe('0.100000001490116119384765625');
  });

  it('gives exact decimals for simple values', () => {
    expect(decode(0x3f800000).exact).toBe('1');
    expect(decode(0xc0490fdb).exact).toBe('-3.1415927410125732421875');
    expect(decode(0x3f800000).significandExact).toBe('1');
    expect(decode(0x3fc00000).significandExact).toBe('1.5');
  });

  it('exact decimal parses back to the stored value for every kind of finite pattern', () => {
    let state = 987654321;
    for (let i = 0; i < 5000; i++) {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      if (((state >>> 23) & 0xff) === 255) continue; // skip infinity and NaN
      const d = decode(state);
      expect(Number(d.exact)).toBe(d.value);
    }
  });

  it('reports the hex of the pattern', () => {
    expect(decode(0x7f800000).hex).toBe('0x7F800000');
    expect(decode(0).hex).toBe('0x00000000');
  });
});

describe('exactDecimal', () => {
  it('handles non-negative exponents', () => {
    expect(exactDecimal(false, 3n, 2)).toBe('12');
  });
  it('handles negative exponents without losing digits', () => {
    expect(exactDecimal(false, 1n, -3)).toBe('0.125');
    expect(exactDecimal(true, 5n, -1)).toBe('-2.5');
  });
});

describe('parseFloatInput', () => {
  it('accepts ordinary numbers', () => {
    expect(parseFloatInput('42')).toEqual({ ok: true, value: 42 });
    expect(parseFloatInput(' -0.5 ')).toEqual({ ok: true, value: -0.5 });
    expect(parseFloatInput('1e-3')).toEqual({ ok: true, value: 0.001 });
    expect(parseFloatInput('.25')).toEqual({ ok: true, value: 0.25 });
  });
  it('accepts Infinity and NaN, which <input type="number"> cannot hold', () => {
    expect(parseFloatInput('Infinity')).toEqual({ ok: true, value: Infinity });
    expect(parseFloatInput('-inf')).toEqual({ ok: true, value: -Infinity });
    const nan = parseFloatInput('NaN');
    expect(nan.ok).toBe(true);
    if (nan.ok) expect(Number.isNaN(nan.value)).toBe(true);
  });
  it('rejects anything else', () => {
    expect(parseFloatInput('').ok).toBe(false);
    expect(parseFloatInput('abc').ok).toBe(false);
    expect(parseFloatInput('1.2.3').ok).toBe(false);
    expect(parseFloatInput('0x10').ok).toBe(false);
  });
});
