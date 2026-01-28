const sharp = require('sharp');
const path = require('path');

const inputSvg = path.join(__dirname, '..', 'assets', 'icons', 'toss-icon.svg');
const outputPng = path.join(__dirname, '..', 'assets', 'icons', 'toss-icon-600.png');

async function generateTossIcon() {
  console.log('Generating Toss App Icon (600x600)...');

  try {
    await sharp(inputSvg)
      .resize(600, 600)
      .png({ quality: 100 })
      .toFile(outputPng);

    console.log('✓ Generated toss-icon-600.png');
  } catch (error) {
    console.error('✗ Failed:', error.message);
  }
}

generateTossIcon();
