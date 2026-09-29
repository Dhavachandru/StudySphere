# 🚀 StudySphere App Store Publishing & Distribution Guide

This guide walks you through publishing **StudySphere** to the **Google Play Store** (Android) and the **Microsoft Store** (Windows), as well as direct distribution.

---

## 📋 What Has Been Configured

1. **Native Android Platform (Capacitor)**:
   - Complete native Android project generated in `/android`.
   - Android package ID: `com.studysphere.app`.
   - `AndroidManifest.xml` configured with Internet permissions and single-task launch.
   - Launcher icons (`ic_launcher.png`, `ic_launcher_round.png`, adaptive foreground icons) and splash screens generated in all screen densities (`mdpi`, `hdpi`, `xhdpi`, `xxhdpi`, `xxxhdpi`).

2. **Store-Compliant Web App Manifest (`/public/manifest.json` & `/public/manifest.webmanifest`)**:
   - Standard, maskable, and store icons (44x44, 50x50, 150x150, 192x192, 310x150, 512x512, 1024x1024).
   - High-definition store screenshots for desktop (`1280x720`) and mobile (`750x1334`).
   - App shortcuts (AI Copilot, Smart Planner, Group Study Rooms).
   - Display mode `standalone` with `window-controls-overlay` support.

3. **Production Service Worker & Offline Page (`/public/sw.js` & `/public/offline.html`)**:
   - Cache-first & stale-while-revalidate caching for instant launch and offline access.
   - Branded offline fallback screen.

4. **In-App Install & Download Modal (`InstallAppModal` & `InstallAppBanner`)**:
   - Interactive prompt for Windows, Android, and 1-click browser installation.
   - Prominent "Download App" buttons in Landing page header, body showcase, and application sidebar.

---

## 🤖 1. Publishing to Google Play Store (Android)

### Prerequisites
- A [Google Play Developer Account](https://play.google.com/console/signup) (one-time $25 registration fee).
- [Android Studio](https://developer.android.com/studio) installed on your computer.

### Step-by-Step Instructions

#### Option A: Using the Native Capacitor Android Project (Recommended)

1. **Build and Sync the Latest Web Assets**:
   ```powershell
   npm run build:android
   ```
   *(This builds the production bundle and syncs it into `android/app/src/main/assets/public`)*.

2. **Open the Project in Android Studio**:
   ```powershell
   npm run open:android
   ```
   *(Or launch Android Studio and choose "Open" -> select the `android` folder in `StudySphere`)*.

3. **Generate a Signed Android App Bundle (.aab)**:
   - In Android Studio, go to the top menu: **Build** > **Generate Signed Bundle / APK...**
   - Select **Android App Bundle** (`.aab` is required by Google Play) and click **Next**.
   - Under **Key store path**, click **Create new...** if you don't already have a keystore:
     - Choose a safe location (e.g. `studysphere-release-key.jks`) and remember the password.
     - Alias: `studysphere`
     - Validity: `25` years
     - Fill in your name/organization.
   - Select the release variant (`release`) and check **Export encrypted key for enrolling in Google Play App Signing**.
   - Click **Create / Finish**.
   - Android Studio will generate the signed bundle at:
     `android/app/release/app-release.aab`.

4. **Upload to Google Play Console**:
   - Log in to [Google Play Console](https://play.google.com/console).
   - Click **Create App**:
     - App name: **StudySphere**
     - Default language: **English (United States)**
     - App or Game: **App**
     - Free or Paid: **Free** (or your preference)
   - Go to **Grow** > **Store presence** > **Main store listing**:
     - **Short description**: `All-in-one student workspace featuring AI study copilot, timetable planner, group study rooms, and coding tracker.`
     - **App icon**: Upload `public/playstore-icon.png` (512x512 PNG).
     - **Feature graphic**: 1024x500 banner (you can crop or use `public/icons/screenshot-desktop.png`).
     - **Phone screenshots**: Upload `public/icons/screenshot-mobile.png`.
     - **7-inch / 10-inch tablet screenshots**: Upload `public/icons/screenshot-desktop.png`.
   - Complete the **Policy** section (Content Rating, Target Audience, Privacy Policy).
   - Go to **Release** > **Production** (or **Testing** > **Internal testing** for a trial run):
     - Click **Create new release**.
     - Drag and drop `app-release.aab`.
     - Enter release notes (e.g. `Initial release of StudySphere v1.0.0`).
     - Click **Next** > **Save** > **Start rollout to Production**!

---

#### Option B: Using PWABuilder (Fastest Web-to-Play Store Alternative)

1. Deploy StudySphere to your production URL with HTTPS (e.g. Netlify, Vercel, Cloudflare, or custom domain).
2. Go to [PWABuilder.com](https://www.pwabuilder.com).
3. Enter your live URL and click **Start**.
4. Click **Package for Stores** -> **Google Play (Android)**.
5. Enter your Package ID (`com.studysphere.app`) and app details.
6. Click **Generate Package** to download the signed `.aab` and upload to Google Play Console.

---

## 🪟 2. Publishing to Microsoft Store (Windows 10 & 11)

Microsoft officially supports and recommends **Progressive Web Apps packaged as MSIX** for the Microsoft Store.

### Prerequisites
- A [Microsoft Partner Center Account](https://partner.microsoft.com/dashboard) (one-time individual registration fee is ~$19 USD).

### Step-by-Step Instructions

1. **Deploy StudySphere with HTTPS**:
   Deploy your build to your public web host (e.g. Netlify, Vercel, or custom server).

2. **Generate the Microsoft Store Package via PWABuilder**:
   - Go to [PWABuilder.com](https://www.pwabuilder.com).
   - Enter your live URL and click **Start**.
   - PWABuilder will verify your manifest and service worker. (All Microsoft Store assets: `StoreLogo.png`, `Square150x150Logo.png`, `Wide310x150Logo.png`, and `SplashScreen.png` are already in `public/icons/`).
   - Click **Package for Stores** -> **Windows (Microsoft Store)**.
   - Enter your Microsoft Partner Center details:
     - **Package Name**: `StudySphere` (or the reserved name from your dashboard)
     - **Publisher Display Name**: Your Developer / Organization Name
     - **Publisher ID**: Found in your Microsoft Partner Center account under *Account settings > Organization profile > Legal info*.
   - Click **Generate MSIX Package**.
   - Download the generated `.zip` containing the signed `.msixbundle` / `.msix`.

3. **Submit to Microsoft Partner Center**:
   - Go to [Partner Center Dashboard](https://partner.microsoft.com/dashboard/apps-and-games/overview).
   - Click **New product** > **MSIX or PWA app**.
   - Reserve your app name: **StudySphere**.
   - Under **Packages**, upload the `.msix` file downloaded from PWABuilder.
   - Under **Store listings**:
     - Description: Highlight AI Assistant, Smart Planner, Notes, Group Study Rooms.
     - Screenshots: Upload `public/icons/screenshot-desktop.png` and `public/icons/screenshot-mobile.png`.
     - App icons: Upload `public/icons/Square150x150Logo.png` and `public/icons/Wide310x150Logo.png`.
   - Set pricing and availability (Free / Global).
   - Click **Submit to the Store**. Microsoft certification typically approves within 24–48 hours.

---

## ⚡ 3. Direct 1-Click App Installation (Instant PWA)

Users don't even need to wait for store approvals to start using StudySphere as a software application on their device:

- **On Windows (Microsoft Edge or Google Chrome)**:
  - Users visiting your site will see the **"Install"** button in their browser's address bar or can click **"Download App"** on StudySphere.
  - Clicking Install adds StudySphere directly to the **Windows Start Menu**, creates a **Desktop shortcut**, and runs it in its own isolated, borderless window with taskbar grouping.

- **On Android**:
  - Chrome / Samsung Internet prompts users with **"Add StudySphere to Home screen"** / **"Install App"**.
  - Creates a native launcher icon on their home screen and app drawer.

---

## 🛠️ Helpful Commands

| Command | Description |
|---|---|
| `npm run build` | Builds the production Vite web application bundle into `/dist` |
| `npm run build:android` | Builds web assets and updates the native Android Gradle project |
| `npm run open:android` | Launches Android Studio with the StudySphere Android project |
| `npm run generate:icons` | Regenerates all standard, maskable, Android, and Microsoft Store icons |
