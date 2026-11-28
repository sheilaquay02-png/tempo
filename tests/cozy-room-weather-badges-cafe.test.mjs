import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { weatherAt, WEATHER_CHANCE } from "../lib/game/weather.js";
import { BADGES, newBadges, awardBadges, badgeProgress } from "../lib/game/badges.js";
import { normalizeGameState, mergeGameStates } from "../lib/tempo/core.js";
import { rewardStreakDay } from "../lib/game/economy.js";

const read = f => readFileSync(f, "utf8");

test("weather: steady within a 3-hour spell, snow only in winter, rain otherwise, about 3 spells in 10", () => {
  assert.equal(weatherAt(new Date(2026, 10, 28, 13, 5)), weatherAt(new Date(2026, 10, 28, 14, 55)));
  let wet = 0, n = 0;
  for (let d = 1; d <= 365; d++) for (let h = 0; h < 24; h += 3) {
    const date = new Date(2026, 0, d, h), w = weatherAt(date); n++;
    if (w) { wet++; assert.equal(w, [11, 0, 1].includes(date.getMonth()) ? "snow" : "rain"); }
  }
  assert.ok(Math.abs(wet / n - WEATHER_CHANCE) < 0.05, `${wet}/${n}`);
});

test("weather is drawn only in town, and can be still for reduced motion", () => {
  const engine = read("lib/game/scene.js");
  assert.match(engine, /setWeather,/); assert.match(engine, /if \(opts\.reduceMotion\) \{ render\(\); return; \}/);
  assert.match(read("components/game/GameScene.jsx"), /const weather = scene === "town" \?/);
});

test("badges: reached ones are given once with their gift; progress shows for the rest", () => {
  const tasks = Array.from({ length: 12 }, (_, i) => ({ id: `t${i}`, done: true }));
  let g = normalizeGameState({ blossoms: 0 });
  const fresh = newBadges(g, tasks).map(b => b.id);
  assert.deepEqual(fresh.sort(), ["first_task", "tasks_10"]);
  g = awardBadges(g, newBadges(g, tasks));
  assert.equal(g.blossoms, 5 + 10);
  assert.equal(newBadges(g, tasks).length, 0, "not given twice");
  assert.equal(awardBadges(g, BADGES.slice(0, 2)).blossoms, 15, "awarding again pays nothing");
  const p = badgeProgress(g, tasks).find(b => b.id === "tasks_50");
  assert.equal(p.value, 12); assert.equal(p.have, false);
  // streak badges use your best streak
  let s = { blossoms: 0, earned: {} };
  for (const d of ["2026-11-01", "2026-11-02", "2026-11-03"]) s = rewardStreakDay(s, d);
  assert.ok(newBadges(s, []).some(b => b.id === "streak_3"));
});

test("badges survive the 600-reward trim and sync between devices without paying twice", () => {
  const earned = { "badge@first_task": 5 };
  for (let i = 0; i < 700; i++) earned[`t${i}@d`] = 3;
  const g = normalizeGameState({ blossoms: 10, earned });
  assert.equal(g.earned["badge@first_task"], 5);
  assert.equal(Object.keys(g.earned).length, 601);
  const base = normalizeGameState({ blossoms: 0 });
  const phone = awardBadges(base, [BADGES[0]]), mac = awardBadges(base, [BADGES[0]]);
  assert.equal(mergeGameStates(mac, phone).blossoms, 5);
  const onlyPhone = mergeGameStates(base, phone);
  assert.equal(onlyPhone.blossoms, 5, "a badge the other device got is counted");
});

test("café: 15/3, 25/5, 50/10 or custom; your choice is kept in the game save", () => {
  const timer = read("components/game/CafeTimer.jsx");
  assert.match(timer, /export const CAFE_PRESETS = \[\[15, 3\], \[25, 5\], \[50, 10\]\];/);
  assert.match(timer, /onSaveLengths\?\.\(\{ focus: next\.focus, brk: next\.break \}\)/);
  assert.deepEqual(normalizeGameState({ cafe: { focus: 50, brk: 10 } }).cafe, { focus: 50, brk: 10 });
  assert.deepEqual(normalizeGameState({ cafe: { focus: 999, brk: 0 } }).cafe, undefined, "nonsense isn't kept");
  assert.deepEqual(normalizeGameState({ cafe: { focus: 999, brk: 2 } }).cafe, { focus: 180, brk: 2 });
  assert.match(read("components/game/GameScene.jsx"), /saved=\{game\?\.cafe \|\| null\} onSaveLengths=/);
});
