import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const outDir = path.resolve("playstore-assets");

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

function iconSvg(size = 512) {
  return `
  <svg width="${size}" height="${size}" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#0EA5E9"/>
        <stop offset="100%" stop-color="#7C3AED"/>
      </linearGradient>
      <linearGradient id="accent" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.95"/>
        <stop offset="100%" stop-color="#E0E7FF" stop-opacity="0.9"/>
      </linearGradient>
    </defs>
    <rect x="0" y="0" width="512" height="512" rx="110" fill="url(#bg)"/>
    <circle cx="256" cy="256" r="172" fill="#FFFFFF" fill-opacity="0.12"/>
    <path d="M126 260c0-72 58-130 130-130s130 58 130 130c0 72-58 130-130 130s-130-58-130-130z" fill="none" stroke="url(#accent)" stroke-width="34"/>
    <circle cx="256" cy="256" r="32" fill="url(#accent)"/>
    <path d="M256 110v64M256 338v64M110 256h64M338 256h64" stroke="#FFFFFF" stroke-opacity="0.75" stroke-width="18" stroke-linecap="round"/>
  </svg>`;
}

function featureGraphicSvg() {
  return `
  <svg width="1024" height="500" viewBox="0 0 1024 500" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#0F172A"/>
        <stop offset="45%" stop-color="#1E3A8A"/>
        <stop offset="100%" stop-color="#7C3AED"/>
      </linearGradient>
      <linearGradient id="card" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.16"/>
        <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0.06"/>
      </linearGradient>
    </defs>
    <rect width="1024" height="500" fill="url(#bg)"/>
    <circle cx="880" cy="98" r="140" fill="#38BDF8" fill-opacity="0.23"/>
    <circle cx="136" cy="410" r="190" fill="#A78BFA" fill-opacity="0.22"/>

    <rect x="70" y="84" width="520" height="334" rx="30" fill="url(#card)" stroke="#FFFFFF" stroke-opacity="0.18"/>
    <text x="110" y="168" fill="#FFFFFF" font-family="Segoe UI, Inter, sans-serif" font-size="74" font-weight="700">Anchor</text>
    <text x="110" y="220" fill="#D1D5DB" font-family="Segoe UI, Inter, sans-serif" font-size="30">Private space for two</text>
    <text x="110" y="278" fill="#E5E7EB" font-family="Segoe UI, Inter, sans-serif" font-size="25">Mood Sync</text>
    <text x="286" y="278" fill="#E5E7EB" font-family="Segoe UI, Inter, sans-serif" font-size="25">•</text>
    <text x="304" y="278" fill="#E5E7EB" font-family="Segoe UI, Inter, sans-serif" font-size="25">Duo Calendar</text>
    <text x="536" y="278" fill="#E5E7EB" font-family="Segoe UI, Inter, sans-serif" font-size="25">•</text>
    <text x="554" y="278" fill="#E5E7EB" font-family="Segoe UI, Inter, sans-serif" font-size="25">Guardian Alerts</text>

    <rect x="676" y="78" width="280" height="344" rx="36" fill="#111827" stroke="#FFFFFF" stroke-opacity="0.2"/>
    <rect x="697" y="116" width="238" height="290" rx="22" fill="#F8FAFC"/>
    <text x="717" y="156" fill="#111827" font-family="Segoe UI, Inter, sans-serif" font-size="22" font-weight="700">Daily Snapshot</text>
    <rect x="717" y="170" width="198" height="124" rx="18" fill="#C4B5FD"/>
    <text x="717" y="334" fill="#374151" font-family="Segoe UI, Inter, sans-serif" font-size="18">Partner mood: calm</text>
    <text x="717" y="364" fill="#4F46E5" font-family="Segoe UI, Inter, sans-serif" font-size="16" font-weight="700">Connected in shared space</text>
  </svg>`;
}

function screenshotSvg(title, subtitle, accent = "#7C3AED") {
  return `
  <svg width="1080" height="1920" viewBox="0 0 1080 1920" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#F8FAFC"/>
        <stop offset="100%" stop-color="#EDE9FE"/>
      </linearGradient>
    </defs>
    <rect width="1080" height="1920" fill="url(#bg)"/>
    <rect x="64" y="96" width="952" height="1728" rx="48" fill="#FFFFFF" stroke="#E5E7EB"/>
    <text x="128" y="210" fill="#111827" font-family="Segoe UI, Inter, sans-serif" font-size="64" font-weight="800">Anchor</text>
    <text x="128" y="286" fill="#6B7280" font-family="Segoe UI, Inter, sans-serif" font-size="40">${title}</text>
    <rect x="128" y="350" width="824" height="240" rx="28" fill="${accent}" fill-opacity="0.12"/>
    <text x="168" y="450" fill="#111827" font-family="Segoe UI, Inter, sans-serif" font-size="46" font-weight="700">${subtitle}</text>

    <rect x="128" y="650" width="824" height="170" rx="24" fill="#F9FAFB" stroke="#E5E7EB"/>
    <rect x="128" y="860" width="824" height="170" rx="24" fill="#F9FAFB" stroke="#E5E7EB"/>
    <rect x="128" y="1070" width="824" height="170" rx="24" fill="#F9FAFB" stroke="#E5E7EB"/>
    <rect x="128" y="1280" width="824" height="170" rx="24" fill="#F9FAFB" stroke="#E5E7EB"/>

    <circle cx="182" cy="735" r="24" fill="${accent}"/>
    <circle cx="182" cy="945" r="24" fill="${accent}"/>
    <circle cx="182" cy="1155" r="24" fill="${accent}"/>
    <circle cx="182" cy="1365" r="24" fill="${accent}"/>

    <text x="228" y="749" fill="#374151" font-family="Segoe UI, Inter, sans-serif" font-size="34">Private couple space</text>
    <text x="228" y="959" fill="#374151" font-family="Segoe UI, Inter, sans-serif" font-size="34">Firebase backed sync</text>
    <text x="228" y="1169" fill="#374151" font-family="Segoe UI, Inter, sans-serif" font-size="34">Real reminders &amp; location</text>
    <text x="228" y="1379" fill="#374151" font-family="Segoe UI, Inter, sans-serif" font-size="34">Designed for daily rituals</text>

    <text x="128" y="1658" fill="#6B7280" font-family="Segoe UI, Inter, sans-serif" font-size="30">Google Play preview image</text>
  </svg>`;
}

async function renderSvgToPng(svg, outPath, width, height) {
  await sharp(Buffer.from(svg))
    .resize(width, height)
    .png({ quality: 100 })
    .toFile(outPath);
}

async function main() {
  await ensureDir(outDir);
  await ensureDir(path.join(outDir, "phone-screenshots"));

  await renderSvgToPng(iconSvg(512), path.join(outDir, "app-icon-512.png"), 512, 512);
  await renderSvgToPng(featureGraphicSvg(), path.join(outDir, "feature-graphic-1024x500.png"), 1024, 500);

  await renderSvgToPng(
    screenshotSvg("Sanctuary", "Mood + Snapshot"),
    path.join(outDir, "phone-screenshots", "01-sanctuary.png"),
    1080,
    1920
  );
  await renderSvgToPng(
    screenshotSvg("Duo Calendar", "Shared events and reminders", "#0EA5E9"),
    path.join(outDir, "phone-screenshots", "02-duocalendar.png"),
    1080,
    1920
  );
  await renderSvgToPng(
    screenshotSvg("Guardian Alert", "Milestone protection", "#EF4444"),
    path.join(outDir, "phone-screenshots", "03-guardian.png"),
    1080,
    1920
  );
  await renderSvgToPng(
    screenshotSvg("Vault", "Memories and notes", "#10B981"),
    path.join(outDir, "phone-screenshots", "04-vault.png"),
    1080,
    1920
  );

  // Optional convenience copies to Expo defaults.
  await fs.copyFile(path.join(outDir, "app-icon-512.png"), path.resolve("assets", "icon.png"));
  await fs.copyFile(path.join(outDir, "app-icon-512.png"), path.resolve("assets", "adaptive-icon.png"));
  await fs.copyFile(path.join(outDir, "app-icon-512.png"), path.resolve("assets", "favicon.png"));

  console.log("Generated Play Store assets in:", outDir);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
