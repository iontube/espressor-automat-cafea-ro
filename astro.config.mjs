import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://espressor-automat-cafea.ro',
  output: 'static',
  build: {
    format: 'file',
    inlineStylesheets: 'always',
  },
  integrations: [sitemap({
    filter: (page) => ![
      '/politica-confidentialitate',
      '/politica-cookies',
      '/termeni-si-conditii',
      '/disclaimer-afiliere',
      '/contact',
      '/out/',
    ].some(p => page.includes(p)),
  })],
  compressHTML: true,
  vite: {
    build: {
      cssMinify: true,
    },
  },
});
