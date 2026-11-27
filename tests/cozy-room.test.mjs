import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { ROOM_LAYOUT } from "../lib/game/roomLayout.js";

const read = file => readFileSync(file, "utf8");
const app = read("components/TempoApp.jsx");
const room = read("components/game/CozyRoom.jsx");
const scene = read("lib/game/scene.js");

test("Cozy Room is loaded lazily, only when the Room page is opened", () => {
  assert.match(app, /dynamic\(\(\) => import\("\.\/game\/CozyRoom"\)/, "CozyRoom must be a dynamic import");
  assert.doesNotMatch(app, /^import .*game\/CozyRoom/m, "CozyRoom must not be statically imported");
  assert.doesNotMatch(app, /lib\/game\/scene/, "the scene engine must only be imported by the room");
  assert.match(app, /page === "room" \? \(\s*<CozyRoom/);
});

test("Mini Tempo and the other pages never pull in the game", () => {
  for (const file of ["components/mini/MiniTempoPanel.jsx", "components/today/TodayDashboard.jsx", "components/tasks/Tasks.jsx", "components/calendar/CalendarViews.jsx"]) {
    assert.doesNotMatch(read(file), /game\//, `${file} should not import game code`);
  }
});

test("Room is reachable from the sidebar and the mobile menu", () => {
  const shell = read("components/layout/AppShell.jsx");
  assert.match(shell, /onNavigate\("room"\)/);
  assert.match(shell, /onNavigateRoom/);
  assert.equal((app.match(/\["today", "calendar", "tasks", "room"\]/g) || []).length, 2, "both navigation helpers accept the room page");
  assert.match(app, /onNavigateRoom=\{/);
});

test("in the room, letter keys walk instead of triggering app shortcuts", () => {
  const i = app.indexOf('if (page === "room") return;');
  assert.ok(i > 0, "shortcut handler should step aside in the room");
  assert.ok(i < app.indexOf('if (k === "d" && !e.metaKey'), "the room check must come before the letter shortcuts");
});

test("the game never saves anything: no cloud, database or storage writes", () => {
  for (const [name, src] of [["CozyRoom.jsx", room], ["scene.js", scene]]) {
    assert.doesNotMatch(src, /saveToCloud|supabase|localStorage\.setItem|sessionStorage|indexedDB|method:\s*["']POST/i, `${name} must stay read-only`);
  }
  // it changes data only through the app's existing task toggle
  assert.match(room, /onToggleTask\?\.\(t\.id\)/);
});

test("the room cleans up its timers when you leave", () => {
  assert.match(scene, /destroy\(\) \{/);
  assert.match(room, /apiRef\.current\?\.destroy\(\)/);
  assert.match(room, /removeEventListener\("keydown"/);
});

test("every picture the room uses is shipped in public/game", () => {
  const base = "public" + ROOM_LAYOUT.assetBase;
  assert.ok(existsSync(base + ROOM_LAYOUT.background), "room background");
  for (const o of ROOM_LAYOUT.objects) if (o.src) assert.ok(existsSync(base + o.src), o.src);
  const pack = JSON.parse(read("public/game/pack/manifest.json"));
  for (const sp of pack.sprites) assert.ok(existsSync("public/game/pack/" + sp.file), sp.file);
  const walk = JSON.parse(read("public/game/walk/manifest.json"));
  for (const c of Object.values(walk.characters)) for (const files of Object.values(c.animations)) for (const f of files) assert.ok(existsSync("public/game/walk/" + f), f);
  for (const dir of ["idle", "sleep", "play"]) {
    const m = JSON.parse(read(`public/game/${dir}/manifest.json`));
    for (const chars of Object.values(m.animations)) for (const a of Object.values(chars)) for (const f of a.frames) assert.ok(existsSync(`public/game/${dir}/${f}`), `${dir}/${f}`);
  }
});

test("room taps only open existing pages or room-only effects", () => {
  const allowed = new Set(["today", "tasks", "calendar", "night", "dogs", "town"]);
  for (const o of ROOM_LAYOUT.objects) if (o.tap) assert.ok(allowed.has(o.tap.action), `${o.id} → ${o.tap.action}`);
});
