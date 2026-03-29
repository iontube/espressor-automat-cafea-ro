import { readFile, writeFile, access, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = join(__dirname, '..');
const PRODUCTS_FILE = join(ROOT, 'src', 'data', 'products.json');
const IMAGES_DIR = join(ROOT, 'public', 'assets', 'images', 'products');

const DELAY_MS = 3000; // 3 sec between requests

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fileExists(path) {
  try { await access(path); return true; } catch { return false; }
}

async function getImageUrl(emagUrl) {
  const res = await fetch(emagUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'ro-RO,ro;q=0.9,en;q=0.8',
    },
    redirect: 'follow',
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();

  // Try og:image first
  const ogMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/);
  if (ogMatch) return ogMatch[1];

  // Try product image from JSON-LD
  const ldMatch = html.match(/"image"\s*:\s*"(https:\/\/[^"]*\.(?:jpg|jpeg|png|webp)[^"]*)"/i);
  if (ldMatch) return ldMatch[1];

  // Try any large product image
  const imgMatch = html.match(/https:\/\/s\d+\.emag\.ro\/products\/[^"'\s]+/);
  if (imgMatch) return imgMatch[0];

  throw new Error('No image found in page');
}

async function downloadImage(url, destPath) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());

  // Determine extension from URL or content-type
  const ct = res.headers.get('content-type') || '';
  let ext = '.jpg';
  if (ct.includes('webp') || url.includes('.webp')) ext = '.webp';
  else if (ct.includes('png') || url.includes('.png')) ext = '.png';
  else if (ct.includes('jpeg') || ct.includes('jpg')) ext = '.jpg';

  const finalPath = destPath.replace(/\.[^.]+$/, ext);
  await writeFile(finalPath, buffer);
  return { finalPath, size: buffer.length, ext };
}

async function main() {
  const products = JSON.parse(await readFile(PRODUCTS_FILE, 'utf-8'));
  await mkdir(IMAGES_DIR, { recursive: true });

  let ok = 0, skip = 0, err = 0;

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const basePath = join(ROOT, 'public', p.localImage.replace(/^\//, ''));
    const baseNoExt = basePath.replace(/\.[^.]+$/, '');

    // Check if already downloaded
    let exists = false;
    for (const ext of ['.webp', '.jpg', '.jpeg', '.png']) {
      if (await fileExists(baseNoExt + ext)) { exists = true; break; }
    }
    if (exists) {
      console.log(`  [SKIP] ${p.id} – deja exista`);
      skip++;
      continue;
    }

    if (!p.imageUrl || !p.imageUrl.startsWith('http')) {
      console.log(`  [SKIP] ${p.id} – nu are imageUrl`);
      skip++;
      continue;
    }

    try {
      // Step 1: Get actual image URL from eMAG page
      console.log(`  [${i+1}/${products.length}] ${p.id} – extrag URL imagine...`);
      const imgUrl = await getImageUrl(p.imageUrl);
      console.log(`    -> ${imgUrl.substring(0, 80)}...`);

      // Step 2: Download the image
      const { finalPath, size, ext } = await downloadImage(imgUrl, basePath);
      console.log(`    -> Salvat: ${(size / 1024).toFixed(0)} KB (${ext})`);

      // Update localImage in products array if extension differs
      const newLocalImage = p.localImage.replace(/\.[^.]+$/, ext);
      if (newLocalImage !== p.localImage) {
        p.localImage = newLocalImage;
      }

      ok++;
    } catch (e) {
      console.error(`  [ERROR] ${p.id} – ${e.message}`);
      err++;
    }

    // Delay between requests
    if (i < products.length - 1) {
      console.log(`    ... astept ${DELAY_MS/1000}s ...`);
      await sleep(DELAY_MS);
    }
  }

  // Save updated products.json (with corrected extensions)
  await writeFile(PRODUCTS_FILE, JSON.stringify(products, null, 2) + '\n');
  console.log(`\nGata: ${ok} descarcate, ${skip} omise, ${err} erori`);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
