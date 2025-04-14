# Aethel OS - Metaphysical PWA

A sacred operating system designed as a Progressive Web App (PWA) for personal spiritual development and tracking. Inspired by mythology, system interfaces, and arcane UI elements.

## Description

Aethel OS aims to be a personal, offline-first digital companion for logging insights, tracking spiritual 'skills', managing sigils, and accessing emergency grounding tools. It utilizes modern web technologies and stores all user data locally in the browser's `localStorage`.

## Features

* **Dashboard:** Welcome message, current date/time, editable "Daily Ritual" prompt, random "Daily Insight", and an "Activate Avatar State" visual effect.
* **Fractal Memory Log:** Record timestamped entries for dreams, visions, synchronicities, etc. Includes search functionality.
* **Skill Tree Tracker:** Define and track custom spiritual or personal development skills with names, descriptions, and an "unlocked" status toggle.
* **Sigil Vault:** A simple canvas for drawing sigils, saving them with names/tags, and viewing them in a gallery. (Note: Drawings are saved as image data URLs in `localStorage`).
* **Red Gate Mode:** An emergency ritual tool that darkens the screen, displays a user-defined mantra, and optionally plays ambient audio (using Tone.js) for grounding.
* **Settings / Data Management:** Toggle between dark/light themes, export all app data to a JSON file, import data from a JSON backup, and clear all locally stored data (with confirmation).

## Technology Stack

* **Frontend:** HTML5, CSS3, JavaScript (Vanilla JS, ES6 Modules pattern)
* **Styling:** Tailwind CSS (via CDN)
* **Audio:** Tone.js (for Red Gate ambient sound and UI sound effects)
* **PWA:** Service Worker API, Web App Manifest
* **Storage:** Browser `localStorage`

## File Structure

/|-- index.html          # Main application page|-- app.js              # Core JavaScript logic and feature implementation|-- manifest.json       # PWA manifest file|-- service-worker.js   # Service worker for offline caching|-- /assets|   |-- /icons          # App icons (favicon, PWA icons, apple-touch-icon)|   |   |-- icon-192x192.png|   |   |-- icon-512x512.png|   |   |-- apple-touch-icon.png|   |   |-- favicon.ico|-- README.md           # This file
## Setup & Installation

This application is designed to be run directly from a web server or deployed as a static site. No backend or build process is required.

1.  Ensure all files listed in the File Structure are present.
2.  Serve the files using a simple HTTP server for local testing (e.g., using VS Code Live Server extension, Python's `http.server`, or `npx serve`).
3.  Access the `index.html` file through the server address (e.g., `http://localhost:8080`).

## Deployment (GitHub Pages)

1.  Ensure your code is pushed to a GitHub repository.
2.  Go to your repository **Settings** > **Pages**.
3.  Under "Build and deployment", select **Deploy from a branch**.
4.  Choose the branch containing your code (e.g., `main`).
5.  Select `/ (root)` as the folder.
6.  Click **Save**.
7.  Wait a few minutes for deployment. Your site will be available at `https://YOUR_USERNAME.github.io/YOUR_REPOSITORY_NAME/`. (Ensure the URL matches your setup).

## PWA Installation

* **Android (Chrome):** Visit the site, Chrome should prompt you to "Add to Home Screen". If not, tap the three-dot menu and select "Install app" or "Add to Home screen".
* **iOS (Safari):** Visit the site, tap the "Share" icon (square with arrow), scroll down, and select "Add to Home Screen".

## Usage Notes

* **Data Storage:** All data (rituals, memories, skills, sigils, settings) is stored *only* in your browser's `localStorage`. Clearing your browser data or using a different browser/profile will result in data loss unless you use the Export/Import feature.
* **Sigil Storage:** Drawn sigils are saved as base64 encoded PNG image data URLs within `localStorage`. Very complex or numerous sigils could potentially exceed `localStorage` size limits (typically 5-10MB).
* **Offline Use:** Once the PWA is installed and has cached the core assets via the service worker, it should load and function offline for most features.

## Troubleshooting

If the website isn't working correctly after deployment:

1.  **Check GitHub Pages URL:** Ensure you are using the correct URL provided in the GitHub Pages settings. Remember it might be `https://USER.github.io/REPO/` if it's not a user/org page.
2.  **Wait for Deployment:** GitHub Pages can take a few minutes to update after a push.
3.  **Check File Paths:** Verify that all paths in `index.html` (CSS, JS, manifest, icons) and `service-worker.js` (`CORE_ASSETS`) are correct relative to the root of your deployed site. Case sensitivity matters.
4.  **Browser Developer Tools:** Open your browser's developer tools (usually F12 or Right-Click > Inspect).
    * **Console:** Look for any JavaScript errors (red messages). These often indicate problems in `app.js` or issues loading resources.
    * **Network Tab:** Check if all files (`index.html`, `app.js`, CSS, images, manifest, service worker) are loading correctly (Status 200). Look for 404 (Not Found) errors. Disable cache while testing here.
    * **Application Tab (or Storage/Service Workers):**
        * Check if the `manifest.json` is loaded and valid.
        * Check if the `service-worker.js` is registered, activated, and running. Look for errors here too. You might need to "Update on reload" or manually unregister/register the worker during testing.
5.  **HTTPS:** PWAs require HTTPS. GitHub Pages provides this automatically. Ensure you are accessing the `https://` version.
6.  **Clear Cache:** Sometimes old cached versions can cause issues. Try a hard refresh (Ctrl+Shift+R or Cmd+Shift+R) or manually clear the browser cache for the site.
7.  **Service Worker Scope:** Ensure the service worker is registered with the correct scope, especially if deployed in a subdirectory. The default `/` scope might need adjustment in `app.js` registration if deployed to `/repo-name/`.
8.  **PWA Installation Issues:** If installation fails, double-check `manifest.json` validity and ensure all specified icons are accessible.

