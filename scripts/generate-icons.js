const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const inputSvg = path.join(__dirname, '..', 'assets', 'icons', 'icon.svg');
const outputDir = path.join(__dirname, '..', 'assets', 'icons');

async function generateIcons() {
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log('Generating icons from SVG...\n');

  for (const size of sizes) {
    const outputFile = path.join(outputDir, `icon-${size}.png`);

    try {
      await sharp(inputSvg)
        .resize(size, size)
        .png()
        .toFile(outputFile);

      console.log(`✓ Generated icon-${size}.png`);
    } catch (error) {
      console.error(`✗ Failed to generate icon-${size}.png:`, error.message);
    }
  }

  // Generate favicon.ico (using 32x32)
  const faviconPath = path.join(__dirname, '..', 'favicon.ico');
  try {
    await sharp(inputSvg)
      .resize(32, 32)
      .png()
      .toFile(faviconPath.replace('.ico', '.png'));
    console.log(`✓ Generated favicon.png`);
  } catch (error) {
    console.error(`✗ Failed to generate favicon:`, error.message);
  }

  // Generate Apple touch icon (180x180)
  const appleTouchPath = path.join(outputDir, 'apple-touch-icon.png');
  try {
    await sharp(inputSvg)
      .resize(180, 180)
      .png()
      .toFile(appleTouchPath);
    console.log(`✓ Generated apple-touch-icon.png`);
  } catch (error) {
    console.error(`✗ Failed to generate apple-touch-icon:`, error.message);
  }

  console.log('\nDone! Icons generated successfully.');
}

generateIcons().catch(console.error);
