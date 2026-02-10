// astro.config.mjs
import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import tailwindcss from '@tailwindcss/vite';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
    site: 'https://collinsmwangi.me',
    output: 'server',
    integrations: [svelte(), sitemap()],
    adapter: cloudflare(),
    vite: {
        plugins: [tailwindcss()]
    }
});
