/**
 * IEEE 754 binary32 ("single precision") helpers.
 *
 * Everything here is pure: the only state is the 32-bit pattern, held as an
 * unsigned integer (0 .. 0xFFFFFFFF). Every other quantity is derived from it.
 */

export type FloatKind = 'zero' | 'subnormal' | 'normal' | 'infinity' | 'nan';

export interface Decoded {
  /** The raw 32-bit pattern as an unsigned integer. */
  bits: number;
  /** 0 or 1. */
  sign: 0 | 1;
  /** The 8-bit exponent field, 0..255 (still biased). */
  exponentField: number;
  /** The 23-bit fraction field (trailing significand field), 0..2^23-1. */
  fractionField: number;
  kind: FloatKind;
  /** For NaNs only: by the usual convention the top fraction bit marks a quiet NaN. */
  nanKind: 'quiet' | 'signaling' | null;
  /** The decoded value as a JavaScript number (a double that holds the float32 exactly). */
  value: number;
  /** Unbiased exponent used in the formula: e-127 (normal), -126 (subnormal), null otherwise. */
  unbiasedExponent: number | null;
  /** The significand (1.f for normal, 0.f for subnormal) written out exactly, or null. */
  significandExact: string | null;
  /** The exact decimal expansion of the stored value. */
  exact: string;
  /** Hex of the whole pattern, e.g. 0x3DCCCCCD. */
  hex: string;
}

const FRACTION_BITS = 23;
const BIAS = 127;

const view = new DataView(new ArrayBuffer(4));

/** Round a number to float32 and return its 32-bit pattern. */
export function floatToBits(x: number): number {
  view.setFloat32(0, x); // big-endian by default; only used symmetrically with getUint32
  return view.getUint32(0);
}

/** Interpret a 32-bit pattern as a float32 and return it as a number. */
export function bitsToFloat(bits: number): number {
  view.setUint32(0, bits >>> 0);
  return view.getFloat32(0);
}

/** Flip one bit. `index` counts from the left: 0 is the sign bit, 31 is the last fraction bit. */
export function toggleBit(bits: number, index: number): number {
  if (!Number.isInteger(index) || index < 0 || index > 31) {
    throw new RangeError(`bit index out of range: ${index}`);
  }
  return (bits ^ (1 << (31 - index))) >>> 0;
}

export function toHex(bits: number): string {
  return '0x' + (bits >>> 0).toString(16).toUpperCase().padStart(8, '0');
}

/** String form of a value that keeps the sign of zero (String(-0) is "0"). */
export function formatValue(v: number): string {
  return Object.is(v, -0) ? '-0' : String(v);
}

/**
 * Exact decimal expansion of (-1)^neg * mant * 2^exp2, using BigInt.
 * Every binary32 value is a dyadic rational, so its decimal expansion is finite.
 */
export function exactDecimal(neg: boolean, mant: bigint, exp2: number): string {
  const sign = neg ? '-' : '';
  if (mant === 0n) return sign + '0';
  if (exp2 >= 0) return sign + (mant << BigInt(exp2)).toString();
  const k = -exp2;
  // mant / 2^k = mant * 5^k / 10^k
  const digits = (mant * 5n ** BigInt(k)).toString().padStart(k + 1, '0');
  const intPart = digits.slice(0, digits.length - k);
  const fracPart = digits.slice(digits.length - k).replace(/0+$/, '');
  return sign + (fracPart ? `${intPart}.${fracPart}` : intPart);
}

export function decode(bitsIn: number): Decoded {
  const bits = bitsIn >>> 0;
  const sign = (bits >>> 31) as 0 | 1;
  const exponentField = (bits >>> FRACTION_BITS) & 0xff;
  const fractionField = bits & 0x7fffff;
  const value = bitsToFloat(bits);
  const neg = sign === 1;

  let kind: FloatKind;
  if (exponentField === 255) kind = fractionField === 0 ? 'infinity' : 'nan';
  else if (exponentField === 0) kind = fractionField === 0 ? 'zero' : 'subnormal';
  else kind = 'normal';

  const nanKind = kind === 'nan' ? (fractionField & 0x400000 ? 'quiet' : 'signaling') : null;

  let unbiasedExponent: number | null = null;
  let significandExact: string | null = null;
  let exact: string;

  if (kind === 'normal') {
    unbiasedExponent = exponentField - BIAS;
    const mant = (1n << BigInt(FRACTION_BITS)) | BigInt(fractionField);
    significandExact = exactDecimal(false, mant, -FRACTION_BITS);
    exact = exactDecimal(neg, mant, unbiasedExponent - FRACTION_BITS);
  } else if (kind === 'subnormal') {
    unbiasedExponent = 1 - BIAS; // -126
    const mant = BigInt(fractionField);
    significandExact = exactDecimal(false, mant, -FRACTION_BITS);
    exact = exactDecimal(neg, mant, unbiasedExponent - FRACTION_BITS);
  } else if (kind === 'zero') {
    significandExact = '0';
    exact = neg ? '-0' : '0';
  } else if (kind === 'infinity') {
    exact = neg ? '-Infinity' : 'Infinity';
  } else {
    exact = 'NaN';
  }

  return {
    bits,
    sign,
    exponentField,
    fractionField,
    kind,
    nanKind,
    value,
    unbiasedExponent,
    significandExact,
    exact,
    hex: toHex(bits),
  };
}

export type ParseResult = { ok: true; value: number } | { ok: false; reason: string };

/**
 * Parse what a person types into the value box. Unlike <input type="number">,
 * this accepts Infinity and NaN, which are exactly the values worth exploring.
 */
export function parseFloatInput(raw: string): ParseResult {
  const s = raw.trim().toLowerCase();
  if (s === '') return { ok: false, reason: 'Type a number, or Infinity, or NaN.' };
  if (/^[+-]?nan$/.test(s)) return { ok: true, value: NaN };
  if (/^[+-]?(inf|infinity|∞)$/.test(s)) {
    return { ok: true, value: s.startsWith('-') ? -Infinity : Infinity };
  }
  if (!/^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/.test(s)) {
    return { ok: false, reason: `"${raw.trim()}" is not a number this box understands.` };
  }
  return { ok: true, value: Number(s) };
}
