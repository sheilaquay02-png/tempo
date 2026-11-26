// Packages a personal macOS Tempo.app (Electron shell), not a hosted deployment.
// The approved HTTPS origin must be supplied intentionally at packaging time.
// Does not bundle Next.js, Supabase credentials or financial data.
// The app is ad-hoc signed for this Mac only: it is not notarized, so copies
// downloaded onto other Macs will be blocked by Gatekeeper.
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const { execFileSync } = require("node:child_process");
if (process.platform !== "darwin") throw new Error("Package the Mac app on a Mac.");
if (process.env.TEMPO_PERSONAL_PACKAGE_APPROVED !== "YES") {
  throw new Error("Set TEMPO_PERSONAL_PACKAGE_APPROVED=YES only after verifying the approved Tempo HTTPS site and /mini route.");
}
let origin;
try {
  const raw = process.env.TEMPO_PERSONAL_ORIGIN || "";
  origin = new URL(raw);
  if (origin.protocol !== "https:" || origin.username || origin.password ||
      origin.pathname !== "/" || origin.search || origin.hash ||
      !origin.hostname || origin.hostname === "localhost") throw Error("Invalid origin");
} catch {
  throw new Error("Set TEMPO_PERSONAL_ORIGIN to your approved Tempo HTTPS origin, e.g. https://your-domain.example (no path).");
}
const here = path.resolve(__dirname, "..");
const root = path.resolve(here, "..");
const stageRoot = fs.mkdtempSync(path.join(os.tmpdir(), "tempo-mac-"));
const stage = path.join(stageRoot, "app");
const destination = path.join(here, "out");
const version = require(path.join(here, "package.json")).devDependencies.electron;
if (!/^\d+\.\d+\.\d+$/.test(version)) throw Error("Electron version must be pinned.");

// Build a macOS .icns from the 512px PNG using the built-in sips and iconutil tools.
function writeMacIcns(pngPath, icnsPath) {
  const iconset = path.join(stageRoot, "tempo.iconset");
  fs.mkdirSync(iconset, { recursive: true });
  for (const size of [16, 32, 128, 256, 512]) {
    for (const scale of [1, 2]) {
      const px = size * scale;
      const name = `icon_${size}x${size}${scale === 2 ? "@2x" : ""}.png`;
      execFileSync("sips", ["-z", String(px), String(px), pngPath, "--out", path.join(iconset, name)], { stdio: "ignore" });
    }
  }
  execFileSync("iconutil", ["-c", "icns", iconset, "-o", icnsPath]);
  return icnsPath;
}

(async () => {
  try {
    fs.mkdirSync(path.join(stage, "public"), { recursive: true });
    for (const file of ["main.cjs", "preload.cjs", "offline.html", "personal-entry.cjs"]) {
      fs.copyFileSync(path.join(here, file), path.join(stage, file));
    }
    const trayIcon = path.join(root, "public", "icon-192.png");
    const appIcon = path.join(root, "public", "icon-512.png");
    for (const icon of [trayIcon, appIcon]) if (!fs.existsSync(icon)) throw Error("Missing " + path.basename(icon));
    fs.copyFileSync(trayIcon, path.join(stage, "public", "icon-192.png"));
    const icns = writeMacIcns(appIcon, path.join(stageRoot, "Tempo.icns"));
    fs.writeFileSync(path.join(stage, "desktop-origin.json"), JSON.stringify({ origin: origin.origin }));
    fs.writeFileSync(path.join(stage, "package.json"), JSON.stringify({
      name: "tempo-mac-personal", version: "0.1.0", private: true,
      description: "Personal Tempo desktop app for macOS", main: "personal-entry.cjs"
    }, null, 2));
    const { packager } = require("@electron/packager");
    const outputs = await packager({
      dir: stage, name: "Tempo", executableName: "Tempo",
      platform: "darwin", arch: process.arch, electronVersion: version, out: destination,
      icon: icns, appBundleId: "com.tempo.mini.personal", appCategoryType: "public.app-category.productivity",
      overwrite: true, prune: true, asar: true
    });
    for (const folder of outputs) {
      const bundle = path.join(folder, "Tempo.app");
      if (!fs.existsSync(bundle)) throw Error("App bundle missing: " + folder);
      // Ad-hoc signature so Apple Silicon will run the modified Electron bundle on this Mac.
      // Strip extended attributes first (iCloud-synced folders add some), or signing fails.
      execFileSync("xattr", ["-cr", bundle]);
      execFileSync("codesign", ["--force", "--deep", "--sign", "-", bundle], { stdio: "inherit" });
      fs.writeFileSync(path.join(folder, "READ_ME.txt"), [
        "TEMPO - PERSONAL MAC APP",
        "Approved interface origin: " + origin.origin,
        "Drag Tempo.app into your Applications folder.",
        "Ad-hoc signed for this Mac only; not notarized. Do not distribute.",
        "Needs an internet connection: it shows the hosted Tempo site.",
        "This build does not include API keys or a local database."
      ].join("\n"));
      process.stdout.write("Mac app: " + bundle + "\n");
    }
  } finally { fs.rmSync(stageRoot, { recursive: true, force: true }); }
})().catch(error => { console.error(error); process.exitCode = 1; });
