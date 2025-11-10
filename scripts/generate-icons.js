/**
 * Generate placeholder PWA icons
 * Run: node scripts/generate-icons.js
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Blue Tradie brand color
const BRAND_COLOR = '#4F46E5'; // Indigo/Purple

// Output directory
const OUTPUT_DIR = path.join(__dirname, '..', 'client', 'public');

// Icon sizes to generate
const ICONS = [
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'icon-invoice.png', size: 96 },
  { name: 'icon-quote.png', size: 96 },
  { name: 'icon-chat.png', size: 96 },
  { name: 'badge-72.png', size: 72 },
];

/**
 * Create a simple SVG with "BT" text
 */
function createSVG(size) {
  const fontSize = Math.floor(size * 0.4);
  const radius = size * 0.1;

  return `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" rx="${radius}" fill="${BRAND_COLOR}"/>
      <text
        x="50%"
        y="50%"
        dominant-baseline="middle"
        text-anchor="middle"
        font-family="Arial, sans-serif"
        font-size="${fontSize}"
        font-weight="bold"
        fill="white"
      >BT</text>
    </svg>
  `;
}

/**
 * Generate all icons
 */
async function generateIcons() {
  console.log('🎨 Generating PWA icons...\n');

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  for (const icon of ICONS) {
    const svg = createSVG(icon.size);
    const outputPath = path.join(OUTPUT_DIR, icon.name);

    try {
      await sharp(Buffer.from(svg))
        .resize(icon.size, icon.size)
        .png()
        .toFile(outputPath);

      console.log(`✓ Generated ${icon.name} (${icon.size}x${icon.size})`);
    } catch (error) {
      console.error(`✗ Failed to generate ${icon.name}:`, error.message);
    }
  }

  console.log('\n✅ Icon generation complete!');
  console.log('\n📝 Note: These are placeholder icons.');
  console.log('   For production, replace with professionally designed icons.');
  console.log('   See client/public/ICONS-README.md for details.\n');
}

// Run
generateIcons().catch(error => {
  console.error('❌ Error generating icons:', error);
  process.exit(1);
});
