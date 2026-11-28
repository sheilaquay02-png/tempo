// Works out where a head accessory sits on every dog animation frame and writes
// public/game/accessories/anchors.json: { "<path under /game/>": [x, y, facing, headWidth] }.
// x/y are in the frame's own pixels: the point the accessory's bottom-centre is placed on.
// facing: "front" | "back" | "left" | "right" (which accessory view to use and whether to mirror it).
// Heuristic: look at the side of the silhouette the dog faces, find the top of the head and its width.
// Usage: node scripts/build-accessory-anchors.mjs   (reads public/game, run after build-game-assets)
import { readFileSync, writeFileSync } from "node:fs";
import sharp from "sharp";

const G = "public/game/";
const SINK = Number(process.env.SINK || 0.2); // how far down the head (share of the dog's height) the accessory sits
const DOGS = ["westie", "bernedoodle_cream", "bernedoodle_black_white", "bernedoodle_charcoal"];
const FACING = { down: "front", up: "back", left: "left", right: "right", left_3quarter: "left" };
const jobs = []; // [path under /game/, facing]

// animation packs with a "direction" per clip
for (const dir of ["idle", "sleep", "play", "celebrate"]) {
  const m = JSON.parse(readFileSync(G + dir + "/manifest.json", "utf8"));
  for (const chars of Object.values(m.animations)) for (const [dog, clip] of Object.entries(chars)) {
    if (!DOGS.includes(dog)) continue;
    for (const f of clip.frames) jobs.push([`${dir}/${f}`, FACING[clip.direction] || "front"]);
  }
}
// walk cycles: folder name is the direction
const w = JSON.parse(readFileSync(G + "walk/manifest.json", "utf8"));
for (const dog of DOGS) for (const [d, files] of Object.entries(w.characters[dog].animations)) for (const f of files) jobs.push([`walk/${f}`, FACING[d]]);
// still poses
const p = JSON.parse(readFileSync(G + "pack/manifest.json", "utf8"));
const POSE = { front: "front", back: "back", left: "left", left_alt: "left", right: "right", sit: "front", happy: "front", sleep: "right" };
for (const s of p.sprites) if (DOGS.includes(s.character)) jobs.push([`pack/${s.file}`, POSE[s.pose] || "front"]);

async function anchor(file, facing) {
  const { data, info } = await sharp(G + file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, on = (x, y) => data[(y * W + x) * 4 + 3] > 40;
  let x0 = W, x1 = -1, y0 = H, y1 = -1;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (on(x, y)) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  const bw = x1 - x0 + 1, bh = y1 - y0 + 1;
  // columns where the head is: the middle for front/back, the leading part for side views
  const [c0, c1] = facing === "right" ? [x0 + 0.42 * bw, x1] : facing === "left" ? [x0, x1 - 0.42 * bw] : [x0 + 0.18 * bw, x1 - 0.18 * bw];
  let top = -1;
  for (let y = y0; y <= y1 && top < 0; y++) for (let x = Math.ceil(c0); x <= c1; x++) if (on(x, y)) { top = y; break; }
  // head width a little below the top of the head, around the topmost point
  const row = Math.min(y1, top + Math.round(0.16 * bh));
  let a = -1, b = -1;
  for (let x = Math.ceil(c0); x <= c1; x++) if (on(x, row)) { if (a < 0) a = x; b = x; }
  const headW = Math.max(1, b - a + 1);
  // the accessory's bottom sits a little way down the head, so hats and headbands hug it instead of floating
  return [Math.round((a + b) / 2), top + Math.round(SINK * bh), facing, headW];
}

const out = {};
for (const [file, facing] of jobs) out[file] = await anchor(file, facing);
writeFileSync(G + "accessories/anchors.json", JSON.stringify(out));
console.log(`anchors for ${Object.keys(out).length} dog frames`);
