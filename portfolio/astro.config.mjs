// astro.config.mjs
import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import tailwindcss from '@tailwindcss/vite';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
    output: 'server',
    integrations: [svelte()],
    adapter: cloudflare(),
    vite: {
        plugins: [tailwindcss()]
    }
});
