import assert from "node:assert/strict";
import test from "node:test";
import { normalizeGameState, mergeGameStates, mergeTempoData } from "../lib/tempo/core.js";
import { rewardForTaskToggle, rewardForUndo, buyItem, TASK_REWARD } from "../lib/game/economy.js";
import { buyAccessory, ACCESSORIES } from "../lib/game/accessories.js";

const start = normalizeGameState({ blossoms: 30, earned: { "a@2026-11-01": 3 } });
const chair = { id: "armchair", price: 18 };

test("Undo gives back the blossoms for a tick it reverses, and pays again for an untick it reverses", () => {
  const ticked = rewardForTaskToggle(start, "t1@2026-11-28", true);
  assert.equal(ticked.blossoms, 33);
  const undone = rewardForUndo(ticked, [{ key: "t1@2026-11-28", done: false }]);
  assert.equal(undone.blossoms, 30);
  const redone = rewardForUndo(undone, [{ key: "t1@2026-11-28", done: true }]);
  assert.equal(redone.blossoms, 33);
  // undoing twice can't pay twice
  assert.equal(rewardForUndo(redone, [{ key: "t1@2026-11-28", done: true }]).blossoms, 33);
});

test("an untick is remembered (0), so the other device learns about it", () => {
  const g = rewardForTaskToggle(rewardForTaskToggle(start, "t1@d", true), "t1@d", false);
  assert.equal(g.earned["t1@d"], 0);
  assert.equal(g.blossoms, 30);
});

test("two devices earning at the same time: both rewards are kept", () => {
  const phone = rewardForTaskToggle(start, "p@d", true);       // 33
  const mac = rewardForTaskToggle(start, "m@d", true);         // 33, saved a moment later
  const merged = mergeGameStates(mac, phone);
  assert.equal(merged.blossoms, 30 + 2 * TASK_REWARD);
  assert.deepEqual(Object.keys(merged.earned).sort(), ["a@2026-11-01", "m@d", "p@d"]);
  // merging again changes nothing
  assert.deepEqual(mergeGameStates(merged, phone), merged);
});

test("two devices buying at the same time: both purchases are paid for and owned", () => {
  const phone = normalizeGameState(buyItem(start, chair));
  const mac = normalizeGameState(buyAccessory(start, ACCESSORIES[0]));
  const merged = mergeGameStates(mac, phone);
  assert.equal(merged.blossoms, 30 - 18 - ACCESSORIES[0].price);
  assert.equal(merged.owned.armchair, 1);
  assert.equal(merged.owned[ACCESSORIES[0].id], 1);
  assert.equal(Object.keys(merged.spent).length, 2);
});

test("an older copy doesn't bring back things the newer save already settled", () => {
  const ticked = rewardForTaskToggle(start, "t@d", true);
  const unticked = rewardForTaskToggle(ticked, "t@d", false);  // newer: given back
  const merged = mergeGameStates(unticked, ticked);              // older copy still shows it paid
  assert.equal(merged.blossoms, 30);
});

test("saving through mergeTempoData uses the game merge", () => {
  const phone = rewardForTaskToggle(start, "p@d", true);
  const mac = rewardForTaskToggle(start, "m@d", true);
  const out = mergeTempoData(
    { updated_at: "2026-11-28T10:00:00Z", settings: { game: phone, settingsUpdatedAt: { game: "2026-11-28T10:00:00Z" } } },
    { updated_at: "2026-11-28T10:00:05Z", settings: { game: mac, settingsUpdatedAt: { game: "2026-11-28T10:00:05Z" } } },
  );
  assert.equal(out.settings.game.blossoms, 36);
});

test("the light follows the clock: pink morning, plain day, golden evening, night", async () => {
  globalThis.document ??= undefined;
  const src = (await import("node:fs")).readFileSync("lib/game/scene.js", "utf8");
  assert.match(src, /setHour\(h\)/);
  assert.match(src, /const light = state\.night \? NIGHT : lightAt\(state\.hour\)/);
  const { lightAt } = await import("../lib/game/scene.js");
  assert.deepEqual(lightAt(12).mul, [255, 255, 255]);
  assert.equal(lightAt(12).glow[3], 0);
  assert.deepEqual(lightAt(23).mul, [168, 151, 207]);
  assert.deepEqual(lightAt(3).mul, lightAt(23).mul);
  assert.ok(lightAt(18.5).mul[2] < lightAt(18.5).mul[0], "evening is warm (more red than blue)");
  assert.ok(lightAt(7).glow[3] > 0, "morning has a glow");
  const mid = lightAt(8).mul; assert.ok(mid[1] > 212 && mid[1] < 255, "blends smoothly between points");
});
