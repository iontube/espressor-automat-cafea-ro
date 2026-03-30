import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://espressor-automat-cafea.ro',
  output: 'static',
  trailingSlash: 'always',
  build: {
    format: 'directory',
    inlineStylesheets: 'always',
  },
  integrations: [sitemap({
    filter: (page) => ![
      '/politica-confidentialitate/',
      '/politica-cookies/',
      '/termeni-si-conditii/',
      '/disclaimer-afiliere/',
      '/contact/',
      '/out/',
    ].some(p => page.includes(p)),
    serialize: (item) => ({ ...item, lastmod: new Date() }),
  })],
  compressHTML: true,
  vite: {
    build: {
      cssMinify: true,
    },
  },
});
