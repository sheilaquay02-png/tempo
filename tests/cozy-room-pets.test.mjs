import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { ACCESSORIES, ACCESSORY_FIT, DOG_FIT, DOGS, buyAccessory, wearAccessory } from "../lib/game/accessories.js";
import { normalizeGameState } from "../lib/tempo/core.js";
import { TOWN_LAYOUT } from "../lib/game/townLayout.js";
import { FURNITURE_BY_ID } from "../lib/game/furniture.js";

const read = f => readFileSync(f, "utf8");

test("every accessory has front and side pictures, a fair price and a name", () => {
  assert.equal(ACCESSORIES.length, 14);
  for (const a of ACCESSORIES) {
    for (const v of ["front", "side"]) assert.ok(existsSync(`public/game/accessories/${a.id}/${v}.png`), `${a.id}/${v}`);
    assert.ok(a.price > 0 && a.price % 3 === 0, `${a.id} costs whole tasks`);
    assert.ok(a.name);
  }
});

test("buying an accessory: once, needs enough blossoms, and works for every dog", () => {
  const bow = ACCESSORIES.find(a => a.id === "small_pink_bow");
  assert.equal(buyAccessory({ blossoms: bow.price - 1, owned: {} }, bow), null);
  const g = buyAccessory({ blossoms: bow.price + 3, owned: {} }, bow);
  assert.equal(g.blossoms, 3);
  assert.equal(g.owned.small_pink_bow, 1);
  assert.equal(buyAccessory(g, bow), null, "already owned");
  let worn = g;
  for (const d of DOGS) worn = wearAccessory(worn, d.key, "small_pink_bow");
  assert.deepEqual(Object.values(worn.pets), ["small_pink_bow", "small_pink_bow", "small_pink_bow", "small_pink_bow"]);
});

test("only owned accessories can be worn, and a dog can take one off", () => {
  const g = { blossoms: 0, owned: { cat_ears: 1 }, pets: {} };
  assert.equal(wearAccessory(g, "westie", "gold_crown"), g, "not owned");
  assert.equal(wearAccessory(g, "kitty", "cat_ears"), g, "not one of the dogs");
  const on = wearAccessory(g, "westie", "cat_ears");
  assert.equal(on.pets.westie, "cat_ears");
  assert.equal(wearAccessory(on, "westie", null).pets.westie, null);
});

test("what the dogs wear is saved and cleaned like the rest of the game data", () => {
  const g = normalizeGameState({ pets: { westie: "bunny_ears", cream: null, kitty: "cat_ears", bernie: "Bad Id!" } });
  assert.deepEqual(g.pets, { westie: "bunny_ears", cream: null });
  assert.deepEqual(normalizeGameState(undefined).pets, {});
});

test("every dog frame has a head position for accessories", () => {
  const anchors = JSON.parse(read("public/game/accessories/anchors.json"));
  const folders = DOGS.map(d => d.folder);
  const frames = [];
  for (const dir of ["idle", "sleep", "play", "celebrate"]) {
    const m = JSON.parse(read(`public/game/${dir}/manifest.json`));
    for (const chars of Object.values(m.animations)) for (const [dog, clip] of Object.entries(chars)) if (folders.includes(dog)) frames.push(...clip.frames.map(f => `${dir}/${f}`));
  }
  const w = JSON.parse(read("public/game/walk/manifest.json"));
  for (const f of folders) for (const files of Object.values(w.characters[f].animations)) frames.push(...files.map(x => `walk/${x}`));
  for (const f of frames) {
    const a = anchors[f];
    assert.ok(a, `missing anchor for ${f}`);
    assert.ok(a[0] > 0 && a[0] < 320 && a[1] > 0 && a[1] < 320 && ["front", "back", "left", "right"].includes(a[2]) && a[3] > 10, `odd anchor for ${f}: ${a}`);
  }
});

test("the Pet Shop sells accessories and the food bowls open the dress-up menu", () => {
  assert.equal(TOWN_LAYOUT.objects.find(o => o.id === "pet_shop").tap.action, "petshop");
  assert.equal(FURNITURE_BY_ID.pet_station.tap.action, "pets");
  const scene = read("components/game/GameScene.jsx"), panels = read("components/game/GamePanels.jsx"), engine = read("lib/game/scene.js");
  assert.match(scene, /"store", "pets", "petshop"\]\.includes\(tap\.action\)/);
  assert.match(scene, /apiRef\.current\?\.setAccessories\?\.\(/);
  assert.match(panels, /function PetShopBody\(/);
  assert.match(panels, /function PetsBody\(/);
  assert.match(engine, /function wear\(c, img, x, y, k, flipped, kAcc, phase = "front"\)/);
  assert.equal((engine.match(/^\s+wear\(c, /gm) || []).length, 8, "accessories drawn on idle, toy, walking and still frames, before and after the dog");
  assert.equal((engine.match(/"behind"\);/g) || []).length, 4, "back views put the accessory behind the dog");
  assert.match(engine, /if \(\(a\[2\] === "back"\) !== \(phase === "behind"\)\) return;/);
});

test("accessory fine-tuning only names real accessories, dogs and directions", () => {
  const ids = new Set(ACCESSORIES.map(a => a.id)), dogs = new Set(DOGS.map(d => d.key));
  const ok = v => Number.isFinite(v.x) && Number.isFinite(v.y) && v.size > 0;
  for (const [id, f] of Object.entries(ACCESSORY_FIT)) { assert.ok(ids.has(id), id); assert.ok(ok(f), id); }
  for (const [k, views] of Object.entries(DOG_FIT)) {
    assert.ok(dogs.has(k), k);
    for (const [v, f] of Object.entries(views)) { assert.ok(["front", "right", "left", "back", "nap"].includes(v), v); assert.ok(ok(f), `${k} ${v}`); }
  }
  assert.match(read("lib/game/scene.js"), /DOG_FIT\[c\.key\]/);
});
