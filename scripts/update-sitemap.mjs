import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const now = new Date().toISOString().split('T')[0];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://espressor-automat-cafea.ro/</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://espressor-automat-cafea.ro/despre-noi/</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
</urlset>
`;

const out = fileURLToPath(new URL('../public/sitemap.xml', import.meta.url));
writeFileSync(out, sitemap);
console.log(`Sitemap updated: lastmod=${now}`);
