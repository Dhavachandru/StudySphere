import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, '../public');
const iconsDir = path.resolve(publicDir, 'icons');

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Ultra-modern SVG icon for StudySphere
// Gradient sphere with orbital study ring and central intellect star
const createIconSvg = (size, isMaskable = false) => {
  const padding = isMaskable ? size * 0.18 : size * 0.08;
  const contentSize = size - padding * 2;
  const cx = size / 2;
  const cy = size / 2;
  const r = contentSize * 0.44;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0F172A" />
        <stop offset="50%" stop-color="#1E1B4B" />
        <stop offset="100%" stop-color="#020617" />
      </linearGradient>
      <linearGradient id="primaryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#38BDF8" />
        <stop offset="50%" stop-color="#6366F1" />
        <stop offset="100%" stop-color="#A855F7" />
      </linearGradient>
      <linearGradient id="ringGrad" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#06B6D4" stop-opacity="0.8"/>
        <stop offset="50%" stop-color="#818CF8" stop-opacity="0.9"/>
        <stop offset="100%" stop-color="#EC4899" stop-opacity="0.8"/>
      </linearGradient>
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="${size * 0.03}" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
      <filter id="subtleGlow">
        <feDropShadow dx="0" dy="${size * 0.015}" stdDeviation="${size * 0.02}" flood-color="#6366F1" flood-opacity="0.6"/>
      </filter>
    </defs>

    <!-- Background (Full rectangle for maskable, rounded squircle for standard) -->
    ${
      isMaskable
        ? `<rect width="${size}" height="${size}" fill="url(#bgGrad)" />`
        : `<rect width="${size}" height="${size}" rx="${size * 0.22}" fill="url(#bgGrad)" />
           <rect width="${size - 4}" height="${size - 4}" x="2" y="2" rx="${size * 0.22 - 2}" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="${Math.max(1, size * 0.008)}" />`
    }

    <!-- Background ambient glow circle -->
    <circle cx="${cx}" cy="${cy}" r="${r * 0.85}" fill="url(#primaryGrad)" opacity="0.25" filter="url(#glow)"/>

    <!-- Central Sphere Core -->
    <circle cx="${cx}" cy="${cy}" r="${r * 0.72}" fill="url(#primaryGrad)" filter="url(#subtleGlow)"/>

    <!-- Inner sphere highlight -->
    <circle cx="${cx - r * 0.22}" cy="${cy - r * 0.22}" r="${r * 0.25}" fill="#FFFFFF" opacity="0.3" filter="url(#glow)"/>

    <!-- Orbital Academic Planetary Ring -->
    <ellipse cx="${cx}" cy="${cy}" rx="${r * 1.15}" ry="${r * 0.42}"
      fill="none" stroke="url(#ringGrad)" stroke-width="${Math.max(2, size * 0.032)}"
      transform="rotate(-25 ${cx} ${cy})" stroke-dasharray="${size * 0.02} 0" stroke-linecap="round"/>

    <!-- Academic Star / Beacon symbol in center -->
    <g transform="translate(${cx}, ${cy}) scale(${contentSize / 240})">
      <path d="M0 -34 L9 -11 L33 -11 L14 4 L21 27 L0 14 L-21 27 L-14 4 L-33 -11 L-9 -11 Z" fill="#FFFFFF" opacity="0.95"/>
      <circle cx="0" cy="0" r="6" fill="#38BDF8"/>
    </g>

    <!-- Tiny satellite particle on orbit -->
    <circle cx="${cx + r * 0.98}" cy="${cy - r * 0.35}" r="${Math.max(2, size * 0.025)}" fill="#38BDF8" filter="url(#glow)"/>
    <circle cx="${cx - r * 0.92}" cy="${cy + r * 0.32}" r="${Math.max(2, size * 0.02)}" fill="#EC4899" filter="url(#glow)"/>
  </svg>`;
};

// Wide banner / screenshot mock SVG for store listings
const createScreenshotSvg = (width, height, isMobile = false) => {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <linearGradient id="bgG" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0B0F19" />
        <stop offset="100%" stop-color="#111827" />
      </linearGradient>
      <linearGradient id="cardG" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1F2937" stop-opacity="0.8" />
        <stop offset="100%" stop-color="#111827" stop-opacity="0.9" />
      </linearGradient>
      <linearGradient id="accentG" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#38BDF8" />
        <stop offset="50%" stop-color="#6366F1" />
        <stop offset="100%" stop-color="#A855F7" />
      </linearGradient>
    </defs>

    <rect width="${width}" height="${height}" fill="url(#bgG)"/>
    
    <!-- Header bar -->
    <rect x="0" y="0" width="${width}" height="${isMobile ? 70 : 64}" fill="#0F172A" />
    <circle cx="${isMobile ? 36 : 40}" cy="${isMobile ? 35 : 32}" r="${isMobile ? 18 : 16}" fill="url(#accentG)" />
    <text x="${isMobile ? 66 : 70}" y="${isMobile ? 42 : 38}" fill="#FFFFFF" font-family="system-ui, sans-serif" font-weight="bold" font-size="${isMobile ? 22 : 18}">StudySphere</text>

    <!-- Top Badge -->
    <rect x="${isMobile ? 20 : 60}" y="${isMobile ? 100 : 100}" width="${isMobile ? width - 40 : 380}" height="42" rx="21" fill="rgba(99, 102, 241, 0.15)" stroke="rgba(99, 102, 241, 0.3)" />
    <text x="${isMobile ? 40 : 80}" y="${isMobile ? 126 : 126}" fill="#818CF8" font-family="system-ui, sans-serif" font-weight="600" font-size="14">✨ All-In-One Intelligent Student Workspace</text>

    <!-- Hero Title -->
    <text x="${isMobile ? 20 : 60}" y="${isMobile ? 180 : 190}" fill="#FFFFFF" font-family="system-ui, sans-serif" font-weight="800" font-size="${isMobile ? 32 : 46}">One Browser. Every Student Need.</text>
    <text x="${isMobile ? 20 : 60}" y="${isMobile ? 220 : 235}" fill="#94A3B8" font-family="system-ui, sans-serif" font-size="${isMobile ? 16 : 20}">AI Assistant • Smart Planner • Group Study • Coding Tracker</text>

    <!-- Feature Cards Grid -->
    <g transform="translate(${isMobile ? 20 : 60}, ${isMobile ? 260 : 270})">
      <!-- Card 1: AI Assistant -->
      <rect x="0" y="0" width="${isMobile ? width - 40 : (width - 160) / 3}" height="${isMobile ? 120 : 260}" rx="16" fill="url(#cardG)" stroke="rgba(255,255,255,0.08)" stroke-width="1.5"/>
      <circle cx="36" cy="36" r="18" fill="rgba(56, 189, 248, 0.2)"/>
      <text x="70" y="42" fill="#38BDF8" font-family="system-ui, sans-serif" font-weight="bold" font-size="18">AI Study Copilot</text>
      <text x="24" y="80" fill="#94A3B8" font-family="system-ui, sans-serif" font-size="14">Interactive explanations, formula solver, and personalized tutoring.</text>

      ${
        !isMobile
          ? `
      <!-- Card 2: Smart Planner -->
      <g transform="translate(${(width - 160) / 3 + 20}, 0)">
        <rect x="0" y="0" width="${(width - 160) / 3}" height="260" rx="16" fill="url(#cardG)" stroke="rgba(255,255,255,0.08)" stroke-width="1.5"/>
        <circle cx="36" cy="36" r="18" fill="rgba(129, 140, 248, 0.2)"/>
        <text x="70" y="42" fill="#818CF8" font-family="system-ui, sans-serif" font-weight="bold" font-size="18">Smart Planner</text>
        <text x="24" y="80" fill="#94A3B8" font-family="system-ui, sans-serif" font-size="14">Automated study schedules, timetable sync, and exam countdowns.</text>
      </g>

      <!-- Card 3: Peer Collaboration -->
      <g transform="translate(${((width - 160) / 3 + 20) * 2}, 0)">
        <rect x="0" y="0" width="${(width - 160) / 3}" height="260" rx="16" fill="url(#cardG)" stroke="rgba(255,255,255,0.08)" stroke-width="1.5"/>
        <circle cx="36" cy="36" r="18" fill="rgba(236, 72, 153, 0.2)"/>
        <text x="70" y="42" fill="#F472B6" font-family="system-ui, sans-serif" font-weight="bold" font-size="18">Peer Study Rooms</text>
        <text x="24" y="80" fill="#94A3B8" font-family="system-ui, sans-serif" font-size="14">Real-time collaborative note-taking, whiteboard, and group goals.</text>
      </g>
      `
          : `
      <!-- Mobile Second Card -->
      <g transform="translate(0, 135)">
        <rect x="0" y="0" width="${width - 40}" height="120" rx="16" fill="url(#cardG)" stroke="rgba(255,255,255,0.08)" stroke-width="1.5"/>
        <circle cx="36" cy="36" r="18" fill="rgba(129, 140, 248, 0.2)"/>
        <text x="70" y="42" fill="#818CF8" font-family="system-ui, sans-serif" font-weight="bold" font-size="18">Smart Planner &amp; Goals</text>
        <text x="24" y="80" fill="#94A3B8" font-family="system-ui, sans-serif" font-size="14">Automated timetable and exam deadlines.</text>
      </g>
      <g transform="translate(0, 270)">
        <rect x="0" y="0" width="${width - 40}" height="120" rx="16" fill="url(#cardG)" stroke="rgba(255,255,255,0.08)" stroke-width="1.5"/>
        <circle cx="36" cy="36" r="18" fill="rgba(236, 72, 153, 0.2)"/>
        <text x="70" y="42" fill="#F472B6" font-family="system-ui, sans-serif" font-weight="bold" font-size="18">Group Study Hub</text>
        <text x="24" y="80" fill="#94A3B8" font-family="system-ui, sans-serif" font-size="14">Virtual rooms, collaborative notes, and peer chat.</text>
      </g>
      `
      }
    </g>
  </svg>`;
};

async function generateAll() {
  console.log('Generating App Icons and Store Assets...');

  // Standard and Store Sizes:
  // 44: Microsoft Store small icon
  // 50: Microsoft Store store logo
  // 150: Microsoft Store medium tile
  // 192: PWA & Android standard
  // 310: Microsoft Store wide tile
  // 512: PWA standard, Google Play & Microsoft Store splash
  // 1024: Google Play Store high-res icon
  const iconSizes = [16, 32, 44, 48, 50, 72, 96, 128, 144, 150, 180, 192, 384, 512, 1024];

  for (const size of iconSizes) {
    const svg = createIconSvg(size, false);
    const outputPath = path.resolve(iconsDir, `icon-${size}x${size}.png`);
    await sharp(Buffer.from(svg)).png().toFile(outputPath);

    // Also write common named icons
    if (size === 192) {
      await sharp(Buffer.from(svg)).png().toFile(path.resolve(iconsDir, 'icon-192.png'));
    }
    if (size === 512) {
      await sharp(Buffer.from(svg)).png().toFile(path.resolve(iconsDir, 'icon-512.png'));
      // Play Store requires 512x512 PNG icon
      await sharp(Buffer.from(svg)).png().toFile(path.resolve(publicDir, 'playstore-icon.png'));
    }
    if (size === 1024) {
      await sharp(Buffer.from(svg)).png().toFile(path.resolve(iconsDir, 'icon-1024.png'));
    }
    if (size === 44) {
      await sharp(Buffer.from(svg)).png().toFile(path.resolve(iconsDir, 'StoreLogo.png'));
    }
  }

  // Generate Maskable Icons for Android Adaptive Launchers
  for (const size of [192, 512]) {
    const maskableSvg = createIconSvg(size, true);
    await sharp(Buffer.from(maskableSvg))
      .png()
      .toFile(path.resolve(iconsDir, `icon-maskable-${size}x${size}.png`));
  }

  // Generate Microsoft Store Specific Tiles
  // Medium Tile 150x150
  const medTileSvg = createIconSvg(150, false);
  await sharp(Buffer.from(medTileSvg)).png().toFile(path.resolve(iconsDir, 'Square150x150Logo.png'));

  // Wide Tile 310x150 for Windows Start Menu
  const wideBgSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="310" height="150" viewBox="0 0 310 150">
    <rect width="310" height="150" fill="#0B0F19"/>
    <text x="145" y="70" fill="#FFFFFF" font-family="system-ui, sans-serif" font-weight="bold" font-size="22">StudySphere</text>
    <text x="145" y="94" fill="#94A3B8" font-family="system-ui, sans-serif" font-size="13">Student Workspace</text>
  </svg>`;
  const icon120Buf = await sharp(Buffer.from(createIconSvg(120, false))).png().toBuffer();
  await sharp(Buffer.from(wideBgSvg))
    .composite([{ input: icon120Buf, top: 15, left: 15 }])
    .png()
    .toFile(path.resolve(iconsDir, 'Wide310x150Logo.png'));

  // Microsoft Store Splash Screen 620x300
  const splashBgSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="620" height="300" viewBox="0 0 620 300">
    <rect width="620" height="300" fill="#0B0F19"/>
    <text x="310" y="240" fill="#FFFFFF" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="bold" font-size="24">StudySphere</text>
    <text x="310" y="268" fill="#94A3B8" text-anchor="middle" font-family="system-ui, sans-serif" font-size="14">All-in-One Student Workspace</text>
  </svg>`;
  const icon160Buf = await sharp(Buffer.from(createIconSvg(160, false))).png().toBuffer();
  await sharp(Buffer.from(splashBgSvg))
    .composite([{ input: icon160Buf, top: 40, left: 230 }])
    .png()
    .toFile(path.resolve(iconsDir, 'SplashScreen.png'));

  // Generate Screenshots for Store Submission (Desktop and Mobile)
  const desktopScreenshot = createScreenshotSvg(1280, 720, false);
  await sharp(Buffer.from(desktopScreenshot))
    .png()
    .toFile(path.resolve(iconsDir, 'screenshot-desktop.png'));

  const mobileScreenshot = createScreenshotSvg(750, 1334, true);
  await sharp(Buffer.from(mobileScreenshot))
    .png()
    .toFile(path.resolve(iconsDir, 'screenshot-mobile.png'));

  // Update favicon.svg with the new modern vector icon
  const faviconSvg = createIconSvg(64, false);
  fs.writeFileSync(path.resolve(publicDir, 'favicon.svg'), faviconSvg);

  console.log('✅ All icons and store screenshots successfully generated!');
}

generateAll().catch(console.error);
