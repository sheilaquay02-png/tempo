import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { normalizeGameState, mergeTempoData, DEFAULT_GAME_STATE } from "../lib/tempo/core.js";
import { rewardForTaskToggle, buyItem, TASK_REWARD } from "../lib/game/economy.js";
import { FURNITURE, STORE_ITEMS, DEFAULT_ROOM, storageCounts, roomLayoutFor, newPiece } from "../lib/game/furniture.js";
import { ROOM_LAYOUT } from "../lib/game/roomLayout.js";
import { TOWN_LAYOUT } from "../lib/game/townLayout.js";

const read = f => readFileSync(f, "utf8");

test("blossoms: earned once per completion, given back when unticked", () => {
  let g = normalizeGameState(DEFAULT_GAME_STATE);
  g = rewardForTaskToggle(g, "t1@2026-11-28", true);
  assert.equal(g.blossoms, TASK_REWARD);
  assert.equal(rewardForTaskToggle(g, "t1@2026-11-28", true), g, "ticking again doesn't pay twice");
  g = rewardForTaskToggle(g, "t1@2026-11-28", false);
  assert.equal(g.blossoms, 0);
  assert.equal(g.earned["t1@2026-11-28"], 0, "remembered as given back, so other devices learn it too");
  assert.equal(rewardForTaskToggle(g, "never-paid", false), g, "unticking an unpaid task changes nothing");
});

test("blossoms never go below zero and buying needs enough", () => {
  const chair = STORE_ITEMS.find(i => i.id === "swivel_chair");
  assert.equal(buyItem({ blossoms: chair.price - 1, owned: {} }, chair), null);
  const after = buyItem({ blossoms: chair.price + 5, owned: {} }, chair);
  assert.equal(after.blossoms, 5);
  assert.equal(after.owned.swivel_chair, 1);
  assert.equal(normalizeGameState({ blossoms: -40 }).blossoms, 0);
});

test("saved game data is cleaned: bad pieces, ids and numbers are dropped", () => {
  const g = normalizeGameState({ blossoms: "12", owned: { swivel_chair: 2, "Bad Id!": 3, cabinet: -1 },
    room: [{ uid: "bed", item: "bed", box: [1, 2, 3, 4] }, { uid: "x", item: "bed", box: [1, 2] }, { item: "bed" }] });
  assert.equal(g.blossoms, 12);
  assert.deepEqual(g.owned, { swivel_chair: 2 });
  assert.deepEqual(g.room, [{ uid: "bed", item: "bed", box: [1, 2, 3, 4] }]);
  assert.equal(normalizeGameState(null).room, null, "no saved room = your original room");
});

test("game data syncs like other settings: the newer device wins", () => {
  const cloud = { settings: { game: { blossoms: 50 }, settingsUpdatedAt: { game: "2026-11-28T10:00:00Z" } } };
  const local = { settings: { game: { blossoms: 70 }, settingsUpdatedAt: { game: "2026-11-28T11:00:00Z" } } };
  assert.equal(mergeTempoData(cloud, local).settings.game.blossoms, 70);
  assert.equal(mergeTempoData(local, { settings: { game: { blossoms: 1 }, settingsUpdatedAt: { game: "2026-11-28T09:00:00Z" } } }).settings.game.blossoms, 70);
});

test("TempoApp loads, saves and merges game data in every settings path, and rewards finished tasks", () => {
  const app = read("components/TempoApp.jsx");
  assert.ok((app.match(/normalizeGameState\(/g) || []).length >= 16, "game data follows every settings path");
  assert.match(app, /game: normalizeGameState\(game\),/, "included in the settings that get saved");
  assert.match(app, /rewardForTaskToggle\(g, `\$\{before\.id\}@\$\{taskCompletionTargetKey\(before\)\}`, !before\.done\)/);
  assert.match(app, /persistSettings\(\{ game: next \}\)/);
  assert.match(app, /game=\{game\} onGameChange=\{updateGame\}/);
});

test("your original room is unchanged until you edit it; removed pieces wait in storage", () => {
  assert.equal(DEFAULT_ROOM.length, ROOM_LAYOUT.objects.length);
  assert.deepEqual(roomLayoutFor({}).objects.map(o => o.box), ROOM_LAYOUT.objects.map(o => o.box));
  assert.deepEqual(storageCounts({}), { pot_plant: 1, flower_art: 1, heart_art: 1, cabinet: 1 });
  assert.equal(storageCounts({ owned: { swivel_chair: 2 } }).swivel_chair, 2);
  const placed = [...DEFAULT_ROOM, newPiece("cabinet", DEFAULT_ROOM.map(p => p.uid))];
  assert.equal(storageCounts({}, placed).cabinet, undefined, "placing a piece takes it out of storage");
});

test("every piece of furniture has a shipped picture, and only real pieces are for sale", () => {
  for (const f of FURNITURE) assert.ok(read.length && readFileSync("public/game/room/" + f.src).length > 0, f.src);
  for (const i of STORE_ITEMS) assert.ok(i.price > 0 && i.price < 1000, i.id);
});

test("the General Store in town opens the shop; Edit room and the shop live in the game screen", () => {
  assert.equal(TOWN_LAYOUT.objects.find(o => o.id === "general_store").tap.action, "store");
  const scene = read("components/game/GameScene.jsx"), panels = read("components/game/GamePanels.jsx");
  assert.match(scene, /✏️ Edit room/);
  assert.match(scene, /📦 Put away/);
  assert.match(scene, /🧺 Storage/);
  assert.match(scene, /onGameChange\(g => \(\{ \.\.\.g, room: placed \}\)\)/);
  assert.match(panels, /function StoreBody\(/);
  assert.match(panels, /function StorageBody\(/);
});

test("the Room Furniture pack is in the General Store: 89 pieces, sorted into sections, each with a picture", async () => {
  const { FURNITURE, STORE_ITEMS, STORE_CATEGORIES, storeCategory } = await import("../lib/game/furniture.js");
  const { existsSync } = await import("node:fs");
  const pack = FURNITURE.filter(f => f.cat);
  assert.equal(pack.length, 89);
  assert.ok(!FURNITURE.some(f => f.id === "bed_and_nightstand"), "the bed with nightstand was left out on request");
  assert.equal(new Set(FURNITURE.map(f => f.id)).size, FURNITURE.length, "ids are unique");
  const cats = new Set(STORE_CATEGORIES.map(([k]) => k));
  for (const f of pack) {
    assert.ok(existsSync(`public/game/room/${f.src}`), f.src);
    assert.ok(cats.has(f.cat), f.cat);
    assert.ok(["object", "wall", "ground"].includes(f.layer), f.id);
    assert.ok(f.price >= 9 && f.price <= 45 && f.price % 3 === 0, `${f.id} costs whole tasks`);
    assert.ok(f.size[0] > 0 && f.size[1] > 0);
  }
  for (const [k] of STORE_CATEGORIES) assert.ok(STORE_ITEMS.some(i => storeCategory(i) === k), `section ${k} has something`);
});
