import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import svelte from '@astrojs/svelte';

export default defineConfig({
    site: 'https://collinsmwangi.me',
    output: 'static',
    integrations: [sitemap(), svelte()],
    vite: {
        plugins: [tailwindcss()]
    }
});
