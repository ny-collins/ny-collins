<script lang="ts">
  import { decode, floatToBits, formatValue, parseFloatInput, toggleBit } from '../lib/float32';

  const examples: Array<{ label: string; value: number; text: string }> = [
    { label: '0.0', value: 0, text: '0' },
    { label: '-0.0', value: -0, text: '-0' },
    { label: '0.1', value: 0.1, text: '0.1' },
    { label: '1.0', value: 1, text: '1' },
    { label: '+∞', value: Infinity, text: 'Infinity' },
    { label: '-∞', value: -Infinity, text: '-Infinity' },
    { label: 'NaN', value: NaN, text: 'NaN' },
  ];

  // The 32 bits are the only source of truth. Everything shown is derived from them,
  // so the grid, the readouts and the hex can never disagree.
  let bits = $state(floatToBits(0.1));
  let text = $state('0.1'); // what is currently in the value box
  let parseError = $state<string | null>(null);

  const info = $derived(decode(bits));
  const bitArray = $derived(Array.from({ length: 32 }, (_, i) => (bits >>> (31 - i)) & 1));

  const special = $derived.by(() => {
    switch (info.kind) {
      case 'nan':
        return `NaN (Not a Number, ${info.nanKind})`;
      case 'infinity':
        return info.sign === 0 ? '+Infinity' : '-Infinity';
      case 'zero':
        return info.sign === 1 ? '-0 (Negative Zero)' : null;
      case 'subnormal':
        return 'Subnormal number (no implicit leading 1)';
      default:
        return null;
    }
  });

  const exponentText = $derived.by(() => {
    const e = info.exponentField;
    switch (info.kind) {
      case 'normal':
        return `${e} → 2^(${e} − 127) = 2^${e - 127}`;
      case 'zero':
        return '0 (zero)';
      case 'subnormal':
        return '0 (subnormal: fixed at 2^-126)';
      case 'infinity':
        return '255 (infinity)';
      default:
        return '255 (NaN)';
    }
  });

  const significandText = $derived(
    info.significandExact === null
      ? 'not used'
      : (info.kind === 'normal' ? '1.' : '0.') +
          `f where f = ${info.fractionField} / 2^23 → ${info.significandExact}`
  );

  function setNumber(value: number, shown: string) {
    bits = floatToBits(value);
    text = shown;
    parseError = null;
  }

  function onInput(next: string) {
    text = next;
    const result = parseFloatInput(next);
    if (result.ok) {
      bits = floatToBits(result.value);
      parseError = null;
    } else {
      parseError = result.reason;
    }
  }

  function flip(index: number) {
    bits = toggleBit(bits, index);
    text = formatValue(decode(bits).value);
    parseError = null;
  }

  function fieldOf(index: number): 'sign' | 'exponent' | 'fraction' {
    return index === 0 ? 'sign' : index < 9 ? 'exponent' : 'fraction';
  }

  function bitLabel(index: number): string {
    const pos = 31 - index;
    const state = bitArray[index] === 1 ? 'set' : 'clear';
    const name = { sign: 'Sign bit', exponent: 'Exponent bit', fraction: 'Fraction bit' }[fieldOf(index)];
    return `${name} (bit ${pos}): ${state}. Click to toggle`;
  }

  const cellClass = {
    sign: 'bg-red-500/10 text-red-400 hover:bg-red-500/20 focus-visible:ring-red-500',
    exponent: 'bg-green-500/10 text-green-400 hover:bg-green-500/20 focus-visible:ring-green-500',
    fraction: 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 focus-visible:ring-blue-500',
  } as const;
</script>

<div class="p-4 sm:p-6 bg-zinc-900 border border-zinc-800 rounded-xl max-w-3xl mx-auto shadow-2xl">
  <div class="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
    <div>
      <h2 class="text-xl font-bold text-white mb-1">IEEE 754 Visualizer</h2>
      <p class="text-xs text-zinc-400 font-mono">32-BIT SINGLE PRECISION FLOAT</p>
    </div>

    <div class="flex items-center gap-4 bg-black/30 p-2 rounded-lg border border-zinc-800">
      <label for="float-input" class="text-zinc-400 text-sm font-mono">VALUE:</label>
      <input
        id="float-input"
        type="text"
        inputmode="decimal"
        autocomplete="off"
        spellcheck="false"
        value={text}
        oninput={(e) => onInput(e.currentTarget.value)}
        aria-describedby={parseError ? 'float-error' : undefined}
        class="bg-transparent text-emerald-400 font-mono text-xl font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded px-1 w-full md:w-48 text-right"
      />
    </div>
  </div>

  {#if parseError}
    <p id="float-error" role="alert" class="mb-4 text-xs font-mono text-red-400">{parseError}</p>
  {/if}

  {#if special}
    <div class="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
      <p class="text-xs font-mono text-amber-400">
        <span class="font-bold">SPECIAL VALUE:</span> {special}
      </p>
    </div>
  {/if}

  <div class="mb-6 flex flex-wrap gap-2">
    {#each examples as ex}
      <button
        type="button"
        onclick={() => setNumber(ex.value, ex.text)}
        class="px-3 py-2 text-xs font-mono bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded transition-colors"
      >
        {ex.label}
      </button>
    {/each}
  </div>

  <div class="mb-2" role="group" aria-label="IEEE 754 bit pattern: 1 sign bit, 8 exponent bits, 23 fraction bits">
    <ul class="flex flex-wrap gap-x-4 gap-y-1 mb-2 text-[11px] font-mono">
      <li class="text-red-400">■ sign · 1 bit</li>
      <li class="text-green-400">■ exponent · 8 bits</li>
      <li class="text-blue-400">■ fraction · 23 bits</li>
    </ul>

    <div class="grid grid-cols-8 gap-1 md:grid-cols-[repeat(32,minmax(0,1fr))] md:gap-0">
      {#each bitArray as bit, i}
        <button
          type="button"
          onclick={() => flip(i)}
          aria-label={bitLabel(i)}
          class="min-h-10 md:min-h-0 md:aspect-[3/4] flex items-center justify-center text-sm font-bold font-mono transition-all border border-zinc-800 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:z-10 {cellClass[fieldOf(i)]} {bit === 1 ? 'brightness-125 shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]' : 'opacity-50'}"
        >
          {bit}
        </button>
      {/each}
    </div>
  </div>

  <div class="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono border-t border-zinc-800 pt-4">
    <div role="status" aria-live="polite">
      <span class="text-red-400 block mb-1">SIGN BIT</span>
      <span class="text-zinc-400">{info.sign === 0 ? 'Positive' : 'Negative'} ({info.sign})</span>
    </div>
    <div role="status" aria-live="polite">
      <span class="text-green-400 block mb-1">EXPONENT FIELD</span>
      <span class="text-zinc-400">{exponentText}</span>
    </div>
    <div role="status" aria-live="polite">
      <span class="text-blue-400 block mb-1">HEX REPRESENTATION</span>
      <span class="text-zinc-300">{info.hex}</span>
    </div>
  </div>

  <div class="mt-4 space-y-3 text-xs font-mono border-t border-zinc-800 pt-4">
    <div>
      <span class="text-blue-400 block mb-1">SIGNIFICAND</span>
      <span class="text-zinc-400 break-words">{significandText}</span>
    </div>
    <div>
      <span class="text-emerald-400 block mb-1">VALUE ACTUALLY STORED (EXACT)</span>
      <span class="text-zinc-300 break-all">{info.exact}</span>
    </div>
  </div>
</div>
