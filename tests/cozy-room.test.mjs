import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { ROOM_LAYOUT } from "../lib/game/roomLayout.js";
import { TOWN_LAYOUT } from "../lib/game/townLayout.js";

const read = file => readFileSync(file, "utf8");
const app = read("components/TempoApp.jsx");
const room = read("components/game/GameScene.jsx");
const scene = read("lib/game/scene.js");

test("Cozy Room and Town are loaded lazily, only when opened", () => {
  assert.match(app, /dynamic\(\(\) => import\("\.\/game\/GameScene"\)/, "GameScene must be a dynamic import");
  assert.doesNotMatch(app, /^import .*game\/GameScene/m, "GameScene must not be statically imported");
  assert.doesNotMatch(app, /lib\/game\/scene/, "the scene engine must only be imported by the room");
  assert.match(app, /page === "room" \|\| page === "town" \? \(\s*<GameScene key=\{page\} scene=\{page\}/);
});

test("Mini Tempo and the other pages never pull in the game", () => {
  for (const file of ["components/mini/MiniTempoPanel.jsx", "components/today/TodayDashboard.jsx", "components/tasks/Tasks.jsx", "components/calendar/CalendarViews.jsx"]) {
    assert.doesNotMatch(read(file), /game\//, `${file} should not import game code`);
  }
});

test("Room opens from a button on Today (not the menus); Town is reached by walking out and left via My House", () => {
  const shell = read("components/layout/AppShell.jsx");
  assert.doesNotMatch(shell, /onNavigate\("room"\)|onNavigate\("town"\)|onNavigateRoom/, "no Room/Town menu items");
  const today = read("components/today/TodayDashboard.jsx");
  assert.match(today, /onOpenRoom && <button[^>]*>🏠 Visit my room<\/button>/);
  assert.ok(today.indexOf("Visit my room") > today.indexOf("<DailyAffirmationCard"), "the button sits under Daily Affirmation");
  assert.match(app, /onOpenRoom=\{\(\) => setPage\("room"\)\}/);
  const exit = ROOM_LAYOUT.exits.find(e => e.action === "town");
  assert.ok(exit, "the room has a walking exit to town");
  const [x0, , x1, y1] = ROOM_LAYOUT.walk;
  assert.ok(exit.area[0] >= x0 && exit.area[2] <= x1 + 1 && exit.area[1] < y1, "the exit is inside the walkable floor");
  assert.ok(exit.area[0] < ROOM_LAYOUT.size[0] / 2 && exit.area[2] > ROOM_LAYOUT.size[0] / 2, "the exit is at the bottom middle");
  assert.match(scene, /opts\.onExit\(exit\.action\)/);
  assert.match(room, /onExit: action => tapRef\.current\(\{ action \}\)/);
  const house = TOWN_LAYOUT.objects.find(o => o.id === "my_house");
  assert.equal(house.tap.action, "room");
  assert.ok(!TOWN_LAYOUT.objects.some(o => o.id === "market"), "My House replaces the market");
  assert.doesNotMatch(app, /onNavigateRoom=\{/);
});

test("the game opens full screen with a Back button that returns to Today", () => {
  assert.match(app, /<GameScene key=\{page\} scene=\{page\} variant="full" onBack=\{\(\) => setPage\("today"\)\}/);
  assert.match(room, /className="cozy-back" onClick=\{onBack\}/);
  assert.match(room, /\.cozy-full\{position:fixed;inset:0;/);
  assert.match(room, /env\(safe-area-inset-top\)/, "respects phone notches");
});

test("Mini Tempo can switch between its normal view and the room, without importing the game itself", () => {
  const mini = read("components/mini/MiniTempoPanel.jsx");
  assert.match(mini, /renderRoom/);
  assert.match(mini, /VIEW_KEY = "tempo-mini-view-v1"/);
  assert.doesNotMatch(mini, /game\//, "the panel gets the room from TempoApp's lazy import");
  assert.match(app, /renderRoom=\{\(\) => <GameScene key=\{miniScene\} scene=\{miniScene\} variant="compact"/);
});

test("dogs follow by chance each time you start walking, and stay-behind dogs keep sleeping", () => {
  assert.match(scene, /FOLLOW_CHANCE = \{ awake: 0\.\d+, asleep: 0\.\d+ \}/);
  assert.match(scene, /if \(moving && !state\.wasMoving\) \{/);
  assert.match(scene, /if \(moving && !c\.following\) return;/);
  assert.match(scene, /state\.wasMoving && c\.following \? "sit" : c\.pose/);
});

test("Today, Tasks and Calendar open as small in-game panels instead of leaving the game", () => {
  const panels = read("components/game/GamePanels.jsx");
  assert.match(room, /if \(\["today", "tasks", "calendar"\]\.includes\(tap\.action\)\) \{ setPanel\(tap\.action\); return; \}/);
  assert.match(room, /<button onClick=\{\(\) => setPanel\("tasks"\)\}>Open tasks<\/button>/);
  assert.match(room, /<button onClick=\{\(\) => setPanel\("calendar"\)\}>Open calendar<\/button>/);
  for (const part of ["TodayBody", "TasksBody", "CalendarBody"]) assert.match(panels, new RegExp(`function ${part}\\(`));
  // ticking and adding use the app's own actions; the full pages stay one tap away
  assert.match(panels, /onToggleTask\?\.\(t\.id\)/);
  assert.match(panels, /onAddTask\?\.\(title\)/);
  assert.match(panels, /onOpenPage\?\.\(kind\)/);
  assert.match(app, /onAddTask=\{addQuickTodayTask\}/);
  assert.match(app, /calendarEvents=\{events\.filter\(eventSourceVisible\)\}/);
  // Escape closes the panel without leaving the game
  assert.match(panels, /if \(e\.key === "Escape"\) \{ e\.stopPropagation\(\); onClose\?\.\(\); \}/);
});

test("finishing a task plays the celebration pack: you cheer, the dogs bounce then wag", () => {
  assert.match(scene, /\["idle", "sleep", "play", "celebrate"\]/);
  assert.match(scene, /c\.act = \{ name: "celebrate", start: now, repeat: 1 \}/);
  assert.match(scene, /\{ name: "happy_bounce", start: now \+ i \* 90, repeat: 1, then: "tail_wag"/);
  assert.match(scene, /else if \(c\.act\.repeat > 0\)/);
  const m = JSON.parse(read("public/game/celebrate/manifest.json"));
  assert.deepEqual(Object.keys(m.animations.happy_bounce).sort(), ["bernedoodle_black_white", "bernedoodle_charcoal", "bernedoodle_cream", "westie"]);
  assert.ok(m.animations.celebrate.avatar);
});

test("the town has no bridge", () => {
  assert.ok(!TOWN_LAYOUT.objects.some(o => o.id === "bridge"));
  assert.ok(!existsSync("public/game/town/town/structures/bridge_with_water.png"));
});

test("in the room, letter keys walk instead of triggering app shortcuts", () => {
  const i = app.indexOf('if (page === "room" || page === "town") return;');
  assert.ok(i > 0, "shortcut handler should step aside in the room");
  assert.ok(i < app.indexOf('if (k === "d" && !e.metaKey'), "the room check must come before the letter shortcuts");
});

test("the game never saves anything: no cloud, database or storage writes", () => {
  for (const [name, src] of [["GameScene.jsx", room], ["GamePanels.jsx", read("components/game/GamePanels.jsx")], ["scene.js", scene], ["townLayout.js", read("lib/game/townLayout.js")]]) {
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

test("every picture the room and town use is shipped in public/game", () => {
  for (const L of [ROOM_LAYOUT, TOWN_LAYOUT]) {
    const base = "public" + L.assetBase;
    assert.ok(existsSync(base + L.background), L.background);
    for (const o of L.objects) if (o.src) assert.ok(existsSync(base + o.src), o.src);
  }
  const pack = JSON.parse(read("public/game/pack/manifest.json"));
  for (const sp of pack.sprites) assert.ok(existsSync("public/game/pack/" + sp.file), sp.file);
  const walk = JSON.parse(read("public/game/walk/manifest.json"));
  for (const c of Object.values(walk.characters)) for (const files of Object.values(c.animations)) for (const f of files) assert.ok(existsSync("public/game/walk/" + f), f);
  for (const dir of ["idle", "sleep", "play", "celebrate"]) {
    const m = JSON.parse(read(`public/game/${dir}/manifest.json`));
    for (const chars of Object.values(m.animations)) for (const a of Object.values(chars)) for (const f of a.frames) assert.ok(existsSync(`public/game/${dir}/${f}`), `${dir}/${f}`);
  }
});

test("taps only open existing pages or scene-only effects", () => {
  const allowed = new Set(["today", "tasks", "calendar", "budget", "room", "town", "night", "dogs", "note"]);
  for (const o of [...ROOM_LAYOUT.objects, ...TOWN_LAYOUT.objects]) if (o.tap) {
    assert.ok(allowed.has(o.tap.action), `${o.id} → ${o.tap.action}`);
    if (o.tap.action === "note") assert.ok(o.tap.note, `${o.id} needs a note`);
  }
  // Budget shortcuts go through the app's own budget navigation
  assert.match(app, /if \(p === "budget"\) \{ navigateBudgetPage\(sub\); return; \}/);
});
