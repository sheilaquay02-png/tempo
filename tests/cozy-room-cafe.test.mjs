import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { CAFE_LAYOUT } from "../lib/game/cafeLayout.js";
import { TOWN_LAYOUT } from "../lib/game/townLayout.js";
import { rewardForFocus, FOCUS_REWARD, TASK_REWARD } from "../lib/game/economy.js";

const read = f => readFileSync(f, "utf8");

test("the Café in Tempo Town opens the café focus scene, and ← Town leads back out", () => {
  assert.equal(TOWN_LAYOUT.objects.find(o => o.id === "cafe").tap.action, "cafe");
  const scene = read("components/game/GameScene.jsx"), app = read("components/TempoApp.jsx");
  assert.match(scene, /cafe: \{ layout: CAFE_LAYOUT/);
  assert.match(scene, /scene === "cafe" \? \(\) => onOpenPage\?\.\("town"\)/);
  assert.match(app, /page === "room" \|\| page === "town" \|\| page === "cafe"/);
  assert.match(app, /if \(p === "room" \|\| p === "town" \|\| p === "cafe"\) setMiniScene\(p\)/, "works in Mini Tempo too");
});

test("café pictures are shipped and only loaded for the café", () => {
  assert.ok(existsSync("public" + CAFE_LAYOUT.assetBase + CAFE_LAYOUT.background));
  const m = JSON.parse(read("public/game/cafe/manifest.json"));
  for (const name of ["typing", "happy", "sip_drink", "thinking", "dozing"]) {
    assert.ok(m.animations[name], name);
    for (const f of m.animations[name].frames) assert.ok(existsSync("public/game/cafe/" + f), f);
  }
  const engine = read("lib/game/scene.js");
  assert.match(engine, /loadPack\(opts\.base, \{ cafe: Boolean\(layout\.seated\) \}\)/, "the room and town never download the café pack");
});

test("in the café you stay seated at your laptop; the dogs still wander", () => {
  assert.equal(CAFE_LAYOUT.seated, true);
  const engine = read("lib/game/scene.js");
  assert.match(engine, /if \(layout\.seated\) \{ dx = dy = 0; state\.target = null; \}/);
  assert.match(engine, /!blocked\(x, y\) && !layout\.seated/);
  assert.match(engine, /if \(c\.key === "you" && layout\.seated\) return;/);
  assert.match(engine, /setCafeAnim\(name\)/);
  const [x0, y0, x1, y1] = CAFE_LAYOUT.walk, [yx, yy] = CAFE_LAYOUT.cast.you;
  for (const [k, [x, y]] of Object.entries(CAFE_LAYOUT.cast)) if (k !== "you") assert.ok(x > x0 && x < x1 && y > y0 && y < y1, `${k} starts on the café floor`);
  assert.ok(yx > x0 && yy > y0, "your table is on the floor");
});

test("a finished focus session earns blossoms once", () => {
  assert.equal(FOCUS_REWARD, TASK_REWARD);
  let g = { blossoms: 0, earned: {} };
  g = rewardForFocus(g, "focus@2026-11-28T10:00:00Z");
  assert.equal(g.blossoms, FOCUS_REWARD);
  assert.equal(rewardForFocus(g, "focus@2026-11-28T10:00:00Z"), g, "the same session doesn't pay twice");
});

test("the timer counts from the clock, so it stays right in a background tab", () => {
  const t = read("components/game/CafeTimer.jsx");
  assert.match(t, /setEndAt\(Date\.now\(\) \+ left\)/);
  assert.match(t, /Math\.max\(0, endAt - now\)/);
  assert.match(t, /cb\.current\.onReward\?\.\(`focus@/);
  assert.doesNotMatch(t, /localStorage|supabase|saveToCloud/);
});
