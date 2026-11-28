import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { rewardStreakDay, streakInfo, streakBonusFor, STREAK_MAX_BONUS, rewardForTaskToggle } from "../lib/game/economy.js";
import { mergeGameStates } from "../lib/tempo/core.js";
import { TOWN_LAYOUT } from "../lib/game/townLayout.js";
import { SOUND_NAMES } from "../lib/game/sounds.js";

const read = f => readFileSync(f, "utf8");
const days = (g, keys) => keys.reduce((x, k) => rewardStreakDay(x, k), g);

test("daily streak: day 1 no bonus, then 2, 3… capped at 7; once per day; a gap starts again", () => {
  let g = { blossoms: 0, earned: {} };
  g = days(g, ["2026-11-20", "2026-11-21", "2026-11-22"]);
  assert.equal(g.blossoms, 0 + 2 + 3);
  assert.equal(rewardStreakDay(g, "2026-11-22"), g, "same day doesn't pay twice");
  assert.equal(streakBonusFor(30), STREAK_MAX_BONUS);
  const gap = rewardStreakDay(g, "2026-11-25");
  assert.equal(gap.blossoms, g.blossoms, "a missed day starts a new streak with no bonus");
  assert.equal(streakInfo(gap, "2026-11-25").current, 1);
  assert.equal(streakInfo(gap, "2026-11-25").best, 3);
});

test("streak info: yesterday's streak still counts until today ends; 28 days for the Town Hall grid", () => {
  const g = days({ blossoms: 0, earned: {} }, ["2026-11-26", "2026-11-27"]);
  const s = streakInfo(g, "2026-11-28");
  assert.equal(s.current, 2); assert.equal(s.doneToday, false); assert.equal(s.nextBonus, 3);
  assert.equal(s.recent.length, 28); assert.equal(s.recent.at(-1).key, "2026-11-28");
});

test("streak days sync like other rewards (two devices, same day, paid once)", () => {
  const base = days({ blossoms: 0, earned: {} }, ["2026-11-27"]);
  const phone = rewardStreakDay(rewardForTaskToggle(base, "a@d", true), "2026-11-28");
  const mac = rewardStreakDay(rewardForTaskToggle(base, "b@d", true), "2026-11-28");
  const merged = mergeGameStates(mac, phone);
  assert.equal(merged.blossoms, 3 + 3 + 2, "two tasks, one streak bonus");
});

test("the app counts the first task of the day toward the streak", () => {
  assert.match(read("components/TempoApp.jsx"), /return before\.done \? next : rewardStreakDay\(next\);/);
});

test("town buildings: Library = done diary, Town Hall = streak, Bank = blossoms (Budget still one tap away)", () => {
  const act = id => TOWN_LAYOUT.objects.find(o => o.id === id).tap.action;
  assert.equal(act("library"), "library"); assert.equal(act("town_hall"), "townhall"); assert.equal(act("bank"), "bank");
  const panels = read("components/game/GamePanels.jsx");
  assert.match(panels, /function LibraryBody/); assert.match(panels, /function TownHallBody/); assert.match(panels, /function BankBody/);
  assert.match(panels, /kind === "bank" \? onOpenPage\?\.\("budget", "home"\)/);
});

test("soft sounds: made in the browser, quiet, with a remembered mute switch", () => {
  for (const n of ["chime", "woof", "step", "buy", "pop", "door", "streak", "timer"]) assert.ok(SOUND_NAMES.includes(n), n);
  const src = read("lib/game/sounds.js");
  assert.doesNotMatch(src, /\.mp3|\.wav|\.ogg|fetch\(/, "no sound files");
  assert.match(src, /tempo-game-sound-v1/);
  const scene = read("components/game/GameScene.jsx");
  assert.match(scene, /setSoundOn\(on\)/); assert.match(scene, /onSound: name => play\(name\)/);
  assert.match(read("components/game/CafeTimer.jsx"), /const chime = \(\) => play\("timer"\);/);
});
