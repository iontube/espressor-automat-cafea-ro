import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://espressor-automat-cafea.ro',
  output: 'static',
  trailingSlash: 'always',
  build: {
    format: 'directory',
    inlineStylesheets: 'always',
  },
  compressHTML: true,
  vite: {
    build: {
      cssMinify: true,
    },
  },
});
