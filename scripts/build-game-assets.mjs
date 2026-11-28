// Copies the Cozy Room art from the V2 prototype folder into public/game/, re-packing each PNG
// losslessly (palette PNG when the picture has 256 colours or fewer). Every output is decoded and
// compared pixel-for-pixel with its source; if anything differs, the original file is kept.
// Usage: node scripts/build-game-assets.mjs <path-to-v2-plan>
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import sharp from "sharp";

const SRC = process.argv[2];
if (!SRC || !existsSync(join(SRC, "layouts.js"))) { console.error("Pass the v2-plan folder."); process.exit(1); }
const OUT = "public/game";

// objects actually used by each scene's layout (+ its empty background) → public/game/<scene>/
const layoutText = readFileSync(join(SRC, "layouts.js"), "utf8");
const sceneText = name => {
  const start = layoutText.indexOf(`  ${name}: {`), next = layoutText.indexOf("\n  }", start);
  return layoutText.slice(start, next);
};
const jobs = [];
for (const scene of ["room", "town"]) {
  const text = sceneText(scene);
  const bg = text.match(/background: "env-zip\/([^"]+)"/)[1];
  const files = [...new Set([...text.matchAll(/src: "([^"]+)"/g)].map(m => m[1]))].concat(bg);
  // the room also ships every furniture picture, so pieces from the General Store and storage can be placed
  if (scene === "room") for (const f of readdirSync(join(SRC, "env-zip", "room"))) if (f.endsWith(".png") && !/floor_panel/.test(f)) files.push("room/" + f);
  for (const f of [...new Set(files)]) jobs.push([join(SRC, "env-zip", f), join(OUT, scene, f)]);
}
// character packs: manifests + every frame they reference
for (const dir of ["pack", "walk", "idle", "sleep", "play", "celebrate", "cafe"]) {
  jobs.push([join(SRC, dir, "manifest.json"), join(OUT, dir, "manifest.json")]);
  const walkDir = d => readdirSync(d).flatMap(n => { const p = join(d, n); return statSync(p).isDirectory() ? (n === "source_sheets" ? [] : walkDir(p)) : [p]; });
  for (const p of walkDir(join(SRC, dir))) {
    if (!p.endsWith(".png") || /source_sheet|preview\.png$/.test(p)) continue;
    jobs.push([p, join(OUT, p.slice(join(SRC, "").length))]);
  }
}

let before = 0, after = 0, packed = 0;
for (const [from, to] of jobs) {
  mkdirSync(dirname(to), { recursive: true });
  if (!from.endsWith(".png")) { copyFileSync(from, to); continue; }
  const orig = readFileSync(from); before += orig.length;
  const src = await sharp(orig).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const colours = new Set(); for (let i = 0; i < src.data.length && colours.size <= 256; i += 4) colours.add(src.data.readUInt32BE(i));
  const out = await sharp(orig).png(colours.size <= 256 ? { palette: true, colours: 256, dither: 0, effort: 10, compressionLevel: 9 } : { compressionLevel: 9, adaptiveFiltering: true }).toBuffer(); // (no effort/colours: those switch sharp to palette mode)
  const check = await sharp(out).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  // fully transparent pixels may change hidden colour values; compare visible pixels only
  let same = check.info.width === src.info.width && check.info.height === src.info.height;
  for (let i = 0; same && i < src.data.length; i += 4) {
    const a = src.data[i + 3], b = check.data[i + 3];
    if (a !== b || (a !== 0 && (src.data[i] !== check.data[i] || src.data[i + 1] !== check.data[i + 1] || src.data[i + 2] !== check.data[i + 2]))) same = false;
  }
  const best = same && out.length < orig.length ? out : orig;
  if (best === out) packed++;
  writeFileSync(to, best); after += best.length;
}
console.log(`${jobs.length} files · ${packed} re-packed · ${(before / 1e6).toFixed(2)} MB → ${(after / 1e6).toFixed(2)} MB`);
