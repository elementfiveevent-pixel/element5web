/**
 * Image Optimization Script
 * Converts 3D PNG assets to WebP at 512px width, quality 80
 * Run: node scripts/optimize-images.mjs
 */
import sharp from 'sharp';
import { readdir, mkdir } from 'fs/promises';
import { join, basename, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const INPUT_DIR = join(__dirname, '..', 'src', 'assets');
const OUTPUT_DIR = join(INPUT_DIR, 'optimized');

const WIDTH = 512;
const QUALITY = 80;

async function optimize() {
  await mkdir(OUTPUT_DIR, { recursive: true });

  const files = await readdir(INPUT_DIR);
  const pngs = files.filter(f => f.startsWith('3d-') && f.endsWith('.png'));

  console.log(`Found ${pngs.length} 3D PNGs to optimize...\n`);

  for (const file of pngs) {
    const input = join(INPUT_DIR, file);
    const name = basename(file, extname(file));
    const output = join(OUTPUT_DIR, `${name}.webp`);

    const info = await sharp(input)
      .resize({ width: WIDTH, withoutEnlargement: true })
      .webp({ quality: QUALITY })
      .toFile(output);

    const origSize = (await sharp(input).metadata()).size || 0;
    const saved = ((1 - info.size / origSize) * 100).toFixed(1);

    console.log(`✅ ${file} → ${name}.webp  (${(origSize / 1024).toFixed(0)}KB → ${(info.size / 1024).toFixed(0)}KB, -${saved}%)`);
  }

  console.log('\n🎉 Done! Optimized images saved to src/assets/optimized/');
}

optimize().catch(console.error);
