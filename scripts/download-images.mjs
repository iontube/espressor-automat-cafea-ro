import { readFile, writeFile, access, mkdir } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = join(__dirname, '..');
const PRODUCTS_FILE = join(ROOT, 'src', 'data', 'products.json');
const IMAGES_DIR = join(ROOT, 'public', 'assets', 'images', 'products');

async function fileExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function getExtension(url, contentType) {
  const urlExt = extname(new URL(url).pathname).split('?')[0].toLowerCase();
  if (['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif'].includes(urlExt)) {
    return urlExt;
  }
  if (contentType) {
    const map = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/avif': '.avif',
      'image/gif': '.gif',
    };
    return map[contentType] || '.jpg';
  }
  return '.jpg';
}

async function downloadImage(url, destPath) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; ImageDownloader/1.0)',
    },
    redirect: 'follow',
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }

  const contentType = res.headers.get('content-type')?.split(';')[0];
  const ext = getExtension(url, contentType);
  const finalPath = destPath.replace(/\.[^.]+$/, ext);
  const buffer = Buffer.from(await res.arrayBuffer());
  await writeFile(finalPath, buffer);
  return { finalPath, size: buffer.length };
}

async function main() {
  console.log('Citesc produsele din', PRODUCTS_FILE);
  const raw = await readFile(PRODUCTS_FILE, 'utf-8');
  const products = JSON.parse(raw);

  await mkdir(IMAGES_DIR, { recursive: true });

  let downloaded = 0;
  let skipped = 0;
  let errors = 0;

  for (const product of products) {
    const { id, imageUrl, localImage } = product;

    if (!imageUrl || imageUrl.startsWith('#')) {
      console.log(`  [SKIP] ${id} – imageUrl nu este completat`);
      skipped++;
      continue;
    }

    const destBase = join(ROOT, 'public', localImage.replace(/^\//, ''));

    const existingExts = ['.webp', '.jpg', '.jpeg', '.png', '.avif', '.gif'];
    const baseName = destBase.replace(/\.[^.]+$/, '');
    let alreadyExists = false;
    for (const ext of existingExts) {
      if (await fileExists(baseName + ext)) {
        console.log(`  [EXISTS] ${id} – deja descarcat`);
        skipped++;
        alreadyExists = true;
        break;
      }
    }
    if (alreadyExists) continue;

    try {
      console.log(`  [DOWNLOAD] ${id} – ${imageUrl}`);
      const { finalPath, size } = await downloadImage(imageUrl, destBase);
      console.log(`    -> Salvat: ${finalPath} (${(size / 1024).toFixed(1)} KB)`);
      downloaded++;
    } catch (err) {
      console.error(`  [ERROR] ${id} – ${err.message}`);
      errors++;
    }
  }

  console.log(`\nRezultat: ${downloaded} descarcate, ${skipped} omise, ${errors} erori`);
}

main().catch(err => {
  console.error('Eroare fatala:', err);
  process.exit(1);
});
