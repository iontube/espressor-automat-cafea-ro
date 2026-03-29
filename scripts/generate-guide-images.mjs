const API_KEY = process.argv[2];
const OUT_DIR = '/Users/luc/Moneysites/espressor-automat-cafea.ro/public/assets/images';

import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const images = [
  {
    name: 'rasnita-ceramica-boabe-cafea-espressor.png',
    prompt: 'Extreme close-up editorial photo of ceramic coffee grinder burrs inside an automatic espresso machine, fresh whole coffee beans falling in, warm golden side lighting on dark background, macro product photography, shallow depth of field, no text no watermark'
  },
  {
    name: 'cappuccino-spuma-lapte-espressor-automat.png',
    prompt: 'Top-down editorial photo of a perfect cappuccino with latte art in a ceramic cup, automatic espresso machine blurred in background, dark wooden table, warm moody lighting with golden tones, coffee shop aesthetic, professional food photography, no text no watermark'
  },
  {
    name: 'intretinere-curatare-espressor-automat.png',
    prompt: 'Editorial photo of hands cleaning a detachable brew group of an automatic espresso machine under running water, clean kitchen background, soft natural light, instructional photography style, warm tones, dark countertop, no text no watermark'
  },
  {
    name: 'espressor-automat-pentru-acasa-bucatarie-moderna.png',
    prompt: 'Wide editorial photo of a modern kitchen counter with an automatic espresso machine as centerpiece, two espresso cups ready, morning sunlight through window, cozy home atmosphere, warm golden and dark tones, lifestyle photography, no text no watermark'
  }
];

async function generate(img) {
  console.log(`Generating: ${img.name}...`);
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt: img.prompt,
      n: 1,
      size: '1792x1024',
      quality: 'hd'
    })
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);

  const imgUrl = data.data[0].url;
  const imgRes = await fetch(imgUrl);
  const buffer = Buffer.from(await imgRes.arrayBuffer());
  const outPath = join(OUT_DIR, img.name);
  await writeFile(outPath, buffer);
  console.log(`  OK: ${img.name} (${(buffer.length / 1024).toFixed(0)} KB)`);
}

// Sequential to avoid rate limits
for (const img of images) {
  try {
    await generate(img);
  } catch (e) {
    console.error(`  ERROR: ${img.name} – ${e.message}`);
  }
}
console.log('Done');
