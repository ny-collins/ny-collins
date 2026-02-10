<script lang="ts">
  import { onMount } from 'svelte';

  let floatValue = 3.14159;
  let bitArray = new Array(32).fill(0);
  
  const buffer = new ArrayBuffer(4);
  const floatView = new Float32Array(buffer);
  const uintView = new Uint32Array(buffer);

  function updateBitsFromFloat() {
    floatView[0] = floatValue;
    const bits = uintView[0];
    for (let i = 0; i < 32; i++) {
      bitArray[31 - i] = (bits >> i) & 1;
    }
  }

  function updateFloatFromBits() {
    let bits = 0;
    for (let i = 0; i < 32; i++) {
      if (bitArray[31 - i]) {
        bits |= (1 << i);
      }
    }
    uintView[0] = bits;
    floatValue = floatView[0];
  }

  function toggleBit(index: number) {
    bitArray[index] = bitArray[index] === 1 ? 0 : 1;
    updateFloatFromBits();
  }

  function getSpecialValue(): string | null {
    if (Number.isNaN(floatValue)) return 'NaN (Not a Number)';
    if (floatValue === Infinity) return '+Infinity';
    if (floatValue === -Infinity) return '-Infinity';
    if (Object.is(floatValue, -0)) return '-0 (Negative Zero)';
    const exponent = parseInt(bitArray.slice(1, 9).join(''), 2);
    if (exponent === 0 && bitArray.slice(9).some(b => b === 1)) {
      return 'Denormalized Number';
    }
    return null;
  }

  function loadExample(value: number) {
    floatValue = value;
    updateBitsFromFloat();
  }

  function getBitLabel(index: number): string {
    const pos = 31 - index;
    const state = bitArray[index] === 1 ? 'set' : 'clear';
    if (index === 0) return `Sign bit (bit ${pos}): ${state}. Click to toggle`;
    if (index < 9) return `Exponent bit ${pos}: ${state}. Click to toggle`;
    return `Mantissa bit ${pos}: ${state}. Click to toggle`;
  }

  onMount(() => {
    updateBitsFromFloat();
  });
</script>

<div class="p-6 bg-zinc-900 border border-zinc-800 rounded-xl max-w-3xl mx-auto shadow-2xl">
  <div class="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
    <div>
      <h2 class="text-xl font-bold text-white mb-1">IEEE 754 Visualizer</h2>
      <p class="text-xs text-zinc-400 font-mono">32-BIT SINGLE PRECISION FLOAT</p>
    </div>
    
    <div class="flex items-center gap-4 bg-black/30 p-2 rounded-lg border border-zinc-800">
      <label for="float-input" class="text-zinc-400 text-sm font-mono">VALUE:</label>
      <input 
        id="float-input"
        type="number" 
        step="any" 
        bind:value={floatValue} 
        on:input={updateBitsFromFloat}
        aria-label="Floating point value"
        class="bg-transparent text-emerald-400 font-mono text-xl font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded px-1 w-40 text-right"
      />
    </div>
  </div>

  {#if getSpecialValue()}
    <div class="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
      <p class="text-xs font-mono text-amber-400">
        <span class="font-bold">SPECIAL VALUE:</span> {getSpecialValue()}
      </p>
    </div>
  {/if}

  <div class="mb-6 flex flex-wrap gap-2">
    <button
      on:click={() => loadExample(0)}
      class="px-3 py-1 text-xs font-mono bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded transition-colors"
    >
      0.0
    </button>
    <button
      on:click={() => loadExample(-0)}
      class="px-3 py-1 text-xs font-mono bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded transition-colors"
    >
      -0.0
    </button>
    <button
      on:click={() => loadExample(1)}
      class="px-3 py-1 text-xs font-mono bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded transition-colors"
    >
      1.0
    </button>
    <button
      on:click={() => loadExample(Infinity)}
      class="px-3 py-1 text-xs font-mono bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded transition-colors"
    >
      +∞
    </button>
    <button
      on:click={() => loadExample(-Infinity)}
      class="px-3 py-1 text-xs font-mono bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded transition-colors"
    >
      -∞
    </button>
    <button
      on:click={() => loadExample(NaN)}
      class="px-3 py-1 text-xs font-mono bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded transition-colors"
    >
      NaN
    </button>
  </div>

  <div class="mb-2" role="group" aria-label="IEEE 754 bit representation with 32 bits: 1 sign bit, 8 exponent bits, 23 mantissa bits">
    <div class="flex text-[10px] font-mono text-zinc-500 mb-2 px-1">
      <div class="w-[3.125%] text-center text-red-400" aria-label="Sign bit section">S</div>
      <div class="w-[25%] text-center text-green-400" aria-label="Exponent bits section">EXPONENT (8)</div>
      <div class="w-[71.875%] text-center text-blue-400" aria-label="Mantissa bits section">MANTISSA (23)</div>
    </div>

    <div class="flex flex-wrap gap-y-2">
      {#each bitArray as bit, i}
        <button
          on:click={() => toggleBit(i)}
          aria-label={getBitLabel(i)}
          class="
            w-[3.125%] aspect-[3/4] flex items-center justify-center text-sm font-bold font-mono transition-all border-y border-r first:border-l border-zinc-800
            active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:z-10
            {i === 0 ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 focus:ring-red-500' : ''}
            {i > 0 && i < 9 ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20 focus:ring-green-500' : ''}
            {i >= 9 ? 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 focus:ring-blue-500' : ''}
            {bit === 1 ? 'brightness-125 shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]' : 'opacity-50'}
          "
        >
          {bit}
        </button>
      {/each}
    </div>
  </div>

  <div class="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono border-t border-zinc-800 pt-4">
    <div role="status" aria-live="polite">
      <span class="text-red-400 block mb-1">SIGN BIT</span>
      <span class="text-zinc-400">{bitArray[0] === 0 ? 'Positive' : 'Negative'} ({bitArray[0]})</span>
    </div>
    <div role="status" aria-live="polite">
      <span class="text-green-400 block mb-1">EXPONENT</span>
      <span class="text-zinc-400">
        {#if parseInt(bitArray.slice(1, 9).join(''), 2) === 0}
          0 (denormalized or zero)
        {:else if parseInt(bitArray.slice(1, 9).join(''), 2) === 255}
          255 (infinity or NaN)
        {:else}
          2^({parseInt(bitArray.slice(1, 9).join(''), 2)} - 127) = 2^{parseInt(bitArray.slice(1, 9).join(''), 2) - 127}
        {/if}
      </span>
    </div>
    <div role="status" aria-live="polite">
      <span class="text-blue-400 block mb-1">HEX REPRESENTATION</span>
      <span class="text-zinc-300">
        0x{uintView[0].toString(16).toUpperCase().padStart(8, '0')}
      </span>
    </div>
  </div>
</div>
