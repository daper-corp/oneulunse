const sharp = require('sharp');
const path = require('path');

const inputSvg = path.join(__dirname, '..', 'assets', 'og-image.svg');
const outputPng = path.join(__dirname, '..', 'assets', 'og-image.png');

async function generateOgImage() {
  console.log('Generating OG image...');

  try {
    await sharp(inputSvg)
      .resize(1200, 630)
      .png()
      .toFile(outputPng);

    console.log('✓ Generated og-image.png (1200x630)');
  } catch (error) {
    console.error('✗ Failed:', error.message);
  }
}

generateOgImage();
