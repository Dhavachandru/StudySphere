import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const resDir = path.resolve(__dirname, '../android/app/src/main/res');
const publicDir = path.resolve(__dirname, '../public');

const iconPath = path.resolve(publicDir, 'icons/icon-512x512.png');
const maskableIconPath = path.resolve(publicDir, 'icons/icon-maskable-512x512.png');

const mipmaps = [
  { dir: 'mipmap-mdpi', size: 48 },
  { dir: 'mipmap-hdpi', size: 72 },
  { dir: 'mipmap-xhdpi', size: 96 },
  { dir: 'mipmap-xxhdpi', size: 144 },
  { dir: 'mipmap-xxxhdpi', size: 192 }
];

async function updateAndroidAssets() {
  if (!fs.existsSync(resDir)) {
    console.log('Android res directory not found, skipping.');
    return;
  }

  console.log('Updating Android launcher icons & splash screen...');

  // Standard and Round launcher icons
  for (const { dir, size } of mipmaps) {
    const targetDir = path.resolve(resDir, dir);
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

    await sharp(iconPath)
      .resize(size, size)
      .png()
      .toFile(path.resolve(targetDir, 'ic_launcher.png'));

    await sharp(maskableIconPath)
      .resize(size, size)
      .png()
      .toFile(path.resolve(targetDir, 'ic_launcher_round.png'));
  }

  // Adaptive foreground icons (432x432)
  const anyDpiDir = path.resolve(resDir, 'mipmap-anydpi-v26');
  if (fs.existsSync(anyDpiDir)) {
    await sharp(maskableIconPath)
      .resize(432, 432)
      .png()
      .toFile(path.resolve(resDir, 'drawable/ic_launcher_foreground.png'));
  }

  // Splash screen asset
  const splashDrawables = [
    'drawable',
    'drawable-port-hdpi',
    'drawable-port-mdpi',
    'drawable-port-xhdpi',
    'drawable-port-xxhdpi',
    'drawable-port-xxxhdpi'
  ];

  for (const drawDir of splashDrawables) {
    const fullDir = path.resolve(resDir, drawDir);
    if (fs.existsSync(fullDir)) {
      await sharp(path.resolve(publicDir, 'icons/SplashScreen.png'))
        .resize(480, 800, { fit: 'contain', background: { r: 11, g: 15, b: 25, alpha: 1 } })
        .png()
        .toFile(path.resolve(fullDir, 'splash.png'));
    }
  }

  console.log('✅ Android assets successfully updated with StudySphere branding!');
}

updateAndroidAssets().catch(console.error);
