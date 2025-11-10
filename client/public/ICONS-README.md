# PWA Icons Setup

## Required Icons

The following icon files are referenced in `manifest.json` and need to be created:

### Main App Icons
- `icon-192.png` (192x192) - Required for Android
- `icon-512.png` (512x512) - Required for splash screens

### Shortcut Icons
- `icon-invoice.png` (96x96)
- `icon-quote.png` (96x96)
- `icon-chat.png` (96x96)

### Optional
- `badge-72.png` (72x72) - For push notification badge
- `screenshot-mobile.png` (750x1334) - For app store listing
- `screenshot-desktop.png` (1920x1080) - For app store listing

## Temporary Placeholders

Run this script to generate temporary placeholder icons:

```bash
# Install sharp for image generation (if not already installed)
npm install sharp

# Generate placeholder icons
npm run icons:generate
```

## Production Icons

For production, replace these placeholders with:
1. Professional logo design
2. Brand colors matching theme (#4F46E5 - Blue Tradie purple)
3. Proper transparency and padding
4. Optimized PNG files

### Design Guidelines
- Use the Blue Tradie logo
- Include the wrench/tools motif
- Maintain consistent branding
- Ensure legibility at small sizes
- Follow iOS and Android guidelines

### Tools for Creating Icons
- **Figma** - Design the icon
- **RealFaviconGenerator** - https://realfavicongenerator.net/
- **PWA Builder** - https://www.pwabuilder.com/
- **Squoosh** - https://squoosh.app/ (for optimization)

## Quick Solution

If you need icons immediately, you can:
1. Use a tool like https://favicon.io/favicon-generator/
2. Generate a simple text-based icon with "BT" (Blue Tradie)
3. Use brand color #4F46E5
4. Export at required sizes

Or copy a logo file and resize:
```bash
# If you have ImageMagick installed
convert logo.png -resize 192x192 icon-192.png
convert logo.png -resize 512x512 icon-512.png
convert logo.png -resize 96x96 icon-invoice.png
cp icon-invoice.png icon-quote.png
cp icon-invoice.png icon-chat.png
```
