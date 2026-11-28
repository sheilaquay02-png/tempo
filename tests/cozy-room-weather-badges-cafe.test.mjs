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

test("badges: 36 from the art pack, each with a picture; left-out ones aren't there", async () => {
  const { existsSync } = await import("node:fs");
  assert.equal(BADGES.length, 36);
  assert.equal(new Set(BADGES.map(b => b.id)).size, 36);
  for (const b of BADGES) { assert.ok(existsSync(`public/game/badges/${b.id}.png`), b.id); assert.ok(b.gift > 0); }
  for (const gone of ["goal_setter", "goal_crusher", "big_goal", "pet_parent", "pet_care_pro", "pet_lover", "study_buddy", "budget_starter", "saving_explorer", "saving_pro", "finance_zone"])
    assert.ok(!BADGES.some(b => b.id === gone), gone);
  assert.equal(BADGES.find(b => b.id === "streak_master").gift, 200);
});

test("badges: reached ones are given once with their gift; progress shows for the rest", () => {
  const day = "2026-11-20";
  const tasks = Array.from({ length: 12 }, (_, i) => ({ id: `t${i}`, title: i === 0 ? "Morning walk" : `Task ${i}`, done: true, completedDate: day, category: i < 2 ? "wellness" : "light" }));
  let g = normalizeGameState({ blossoms: 0 });
  const fresh = newBadges(g, tasks, []).map(b => b.id).sort();
  assert.deepEqual(fresh, ["active_day", "daily_achiever", "first_step", "getting_going", "self_care_day"]);
  g = awardBadges(g, newBadges(g, tasks, []));
  assert.equal(g.blossoms, 5 + 8 + 5 + 10 + 5);
  assert.equal(newBadges(g, tasks, []).length, 0, "not given twice");
  const p = badgeProgress(g, tasks, []).find(b => b.id === "in_full_bloom");
  assert.equal(p.value, 12); assert.equal(p.have, false);
  // streak badges use your best streak
  let s = { blossoms: 0, earned: {} };
  for (const d of ["2026-11-01", "2026-11-02", "2026-11-03"]) s = rewardStreakDay(s, d);
  assert.ok(newBadges(s, [], []).some(b => b.id === "warming_up"));
});

test("café badges read sessions (with their minutes); planning and time off read your calendar", () => {
  const earned = {};
  ["2026-11-20T09:00:00", "2026-11-20T10:00:00", "2026-11-20T11:00:00"].forEach(t => { earned[`focus@${t}~50`] = 3; });
  const g = normalizeGameState({ earned });
  const ids = newBadges(g, [], []).map(b => b.id);
  for (const id of ["cafe_regular", "focus_zone", "flow_state"]) assert.ok(ids.includes(id), id);
  const events = Array.from({ length: 20 }, (_, i) => ({ id: `e${i}`, title: i === 0 ? "Bali holiday" : "Meeting", start: new Date(2026, 10, i + 1), end: new Date(2026, 10, i + 1, 2), createdAt: new Date(2026, 10, i + 1).toISOString() }));
  const ev = newBadges(normalizeGameState({}), [], events).map(b => b.id);
  for (const id of ["planner_pro", "consistent_planner", "time_off"]) assert.ok(ev.includes(id), id);
  assert.ok(!newBadges(normalizeGameState({}), [], [{ title: "Lunch break", start: new Date(2026, 0, 1), end: new Date(2026, 0, 1, 1) }]).some(b => b.id === "time_off"), "a lunch break isn't time off");
  assert.match(read("components/game/CafeTimer.jsx"), /~\$\{lengths\.focus\}`\);/);
});

test("the two big badges count the others", () => {
  const earned = {}; BADGES.filter(b => b.stat !== "badges").slice(0, 20).forEach(b => { earned[`badge@${b.id}`] = b.gift; });
  const ids = newBadges(normalizeGameState({ earned }), [], []).map(b => b.id);
  assert.ok(ids.includes("milestone_champ")); assert.ok(!ids.includes("tempo_master"));
});

test("badges and long streaks survive the 600-reward trim and sync between devices without paying twice", () => {
  const earned = { "badge@first_step": 5 };
  for (let i = 0; i < 370; i++) earned[`day@x${i}`] = 0;
  for (let i = 0; i < 700; i++) earned[`t${i}@d`] = 3;
  const g = normalizeGameState({ blossoms: 10, earned });
  assert.equal(g.earned["badge@first_step"], 5);
  assert.equal(Object.keys(g.earned).filter(k => k.startsWith("day@")).length, 370);
  assert.equal(Object.keys(g.earned).length, 1 + 370 + 600);
  const base = normalizeGameState({ blossoms: 0 });
  const phone = awardBadges(base, [BADGES[0]]), mac = awardBadges(base, [BADGES[0]]);
  assert.equal(mergeGameStates(mac, phone).blossoms, 5);
  assert.equal(mergeGameStates(base, phone).blossoms, 5, "a badge the other device got is counted");
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
