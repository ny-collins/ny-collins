// astro.config.mjs
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
    site: 'https://collinsmwangi.me',
    output: 'static',
    integrations: [sitemap()],
    vite: {
        plugins: [tailwindcss()]
    }
});
