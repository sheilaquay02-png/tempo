// Behaviour tests (Phase 1, update 4): they run the real logic with real data
// instead of checking source text, so they fail if the behaviour changes.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  expandRecurring,
  deleteSingleOccurrence,
  modifySingleOccurrence,
  createNextRecurringTask,
  mergeTempoData,
  dateKey,
  taskDayKey,
  DATA_MIGRATION_VERSION,
} from "../lib/tempo/core.js";
import {
  dateKeyInTimeZone,
  weekStartKeyFromDateKey,
  addDaysToDateKey,
  monthKeyFromDateKey,
  getLocalDateTimeParts,
  localClockDue,
} from "../lib/tempo/dateTime.js";
import { prepareUndoRestore } from "../utils/undoRestore.js";

// Event times are built in the device's own local time, exactly as Tempo
// creates them, so these tests pass in any time zone (a Singapore Mac,
// GitHub's UTC machines, or anywhere else).
const sg = (date, time = "12:00") => {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  return new Date(y, m - 1, d, hh, mm, 0, 0);
};
const T0 = "2026-11-20T10:00:00.000Z";
const T1 = "2026-11-25T10:00:00.000Z";
const T2 = "2026-11-26T10:00:00.000Z";
const task = (id, title, extra = {}) => ({ id, title, scope: "day", dayKey: "2026-11-26", updatedAt: T0, ...extra });
const row = (tasks, extra = {}) => ({ events: [], tasks, settings: extra.settings || {}, updated_at: extra.updated_at || T2 });

// ── Undo ──────────────────────────────────────────────────────────────────────
test("undo re-stamps only the records it changes and reports records it removes", () => {
  const snapshot = { events: [], tasks: [task("a", "Original"), task("b", "Untouched")] };
  const unchanged = snapshot.tasks[1];
  const current = { events: [], tasks: [task("a", "Edited", { updatedAt: T1 }), unchanged, task("c", "Added after", { createdAt: T1, updatedAt: T1 })] };
  const out = prepareUndoRestore(current, snapshot, T2);
  assert.equal(out.tasks.find(t => t.id === "a").title, "Original");
  assert.equal(out.tasks.find(t => t.id === "a").updatedAt, T2, "changed record gets the undo time");
  assert.equal(out.tasks.find(t => t.id === "b"), unchanged, "unchanged record is kept as-is");
  assert.deepEqual(out.removedTaskIds, ["c"]);
  assert.deepEqual(out.removedEventIds, []);
});

test("an undo on one device is not overruled by another device's copy of the undone edit", () => {
  // Laptop edits a task (T1); the phone syncs that edit; the laptop then undoes it (T2).
  const phone = row([task("a", "Laptop edit", { updatedAt: T1 })], { updated_at: T1 });
  const restored = prepareUndoRestore({ events: [], tasks: [task("a", "Laptop edit", { updatedAt: T1 })] }, { events: [], tasks: [task("a", "Original")] }, T2);
  const laptopCloud = row(restored.tasks);
  assert.equal(mergeTempoData(laptopCloud, phone).tasks[0].title, "Original");
  assert.equal(mergeTempoData(phone, laptopCloud).tasks[0].title, "Original");
  // Regression guard: restoring the old record with its old time loses to the phone.
  const oldStyle = row([task("a", "Original")]);
  assert.equal(mergeTempoData(oldStyle, phone).tasks[0].title, "Laptop edit");
});

test("undoing an add removes the task on other devices too", () => {
  const phone = row([task("a", "Kept"), task("new", "Added then undone", { createdAt: T1, updatedAt: T1 })], { updated_at: T1 });
  const restored = prepareUndoRestore({ events: [], tasks: phone.tasks }, { events: [], tasks: [task("a", "Kept")] }, T2);
  const laptopCloud = row(restored.tasks, { settings: { deletedRecords: { tasks: Object.fromEntries(restored.removedTaskIds.map(id => [id, T2])) } } });
  assert.deepEqual(mergeTempoData(laptopCloud, phone).tasks.map(t => t.id), ["a"]);
});

test("undoing a delete brings the task back even though a deletion marker exists", () => {
  const deletedRecords = { tasks: { a: T1 } };
  const restored = prepareUndoRestore({ events: [], tasks: [] }, { events: [], tasks: [task("a", "Deleted by mistake")] }, T2);
  const laptopCloud = row(restored.tasks, { settings: { deletedRecords } });
  const phone = row([], { settings: { deletedRecords }, updated_at: T1 });
  assert.deepEqual(mergeTempoData(laptopCloud, phone).tasks.map(t => t.title), ["Deleted by mistake"]);
});

test("the app's Undo uses the re-stamping helper and saves tasks locally", () => {
  const app = readFileSync("components/TempoApp.jsx", "utf8");
  assert.match(app, /const restored = prepareUndoRestore\(\{ events, tasks \}, snapshot, now\);/);
  assert.match(app, /save\(`\$\{uk\}_tk`, restored\.tasks\);/);
  assert.doesNotMatch(app, /setEvRaw\(l\.events\); setTkRaw\(l\.tasks\); syncEvents\(l\.events, l\.tasks\)/);
});

// ── Data upgrade version ─────────────────────────────────────────────────────
test("merging keeps the more advanced upgrade version instead of stamping the app's latest", () => {
  assert.equal(mergeTempoData({ settings: { dataMigrationVersion: 5 } }, { settings: { dataMigrationVersion: 3 } }).settings.dataMigrationVersion, 5);
  assert.equal(mergeTempoData({ settings: { dataMigrationVersion: 2 } }, { settings: { dataMigrationVersion: 4 } }).settings.dataMigrationVersion, 4);
  const fresh = mergeTempoData({ settings: {} }, { settings: {} }).settings.dataMigrationVersion;
  assert.equal(fresh, 0, `pending migrations must not be marked done (app latest is ${DATA_MIGRATION_VERSION})`);
});

test("the app saves the data's real upgrade version", () => {
  const app = readFileSync("components/TempoApp.jsx", "utf8");
  assert.doesNotMatch(app, /Math\.max\(Number\(dataMigrationVersion \|\| 0\), Core\.DATA_MIGRATION_VERSION\)/);
  assert.doesNotMatch(app, /dataMigrationVersion \|\| 0\), Core\.DATA_MIGRATION_VERSION\),/);
});

// ── Repeating events and tasks ───────────────────────────────────────────────
const daily = { id: "walk", title: "Walk", start: sg("2026-12-01", "12:00"), end: sg("2026-12-01", "12:30"), recurrence: { frequency: "daily", interval: 1 } };
const days = list => list.map(e => dateKey(e.start));

test("deleting one occurrence skips just that day", () => {
  const edited = deleteSingleOccurrence(daily, sg("2026-12-03"));
  const out = expandRecurring([edited], sg("2026-12-01", "00:00"), sg("2026-12-05", "23:00"));
  assert.deepEqual(days(out), ["2026-12-01", "2026-12-02", "2026-12-04", "2026-12-05"]);
});

test("moving one occurrence changes only that day's time", () => {
  const edited = modifySingleOccurrence(daily, sg("2026-12-02"), { start: sg("2026-12-02", "18:00"), end: sg("2026-12-02", "18:30") });
  const out = expandRecurring([edited], sg("2026-12-01", "00:00"), sg("2026-12-03", "23:00"));
  const byDay = Object.fromEntries(out.map(e => [dateKey(e.start), e.start.toISOString()]));
  assert.equal(byDay["2026-12-02"], sg("2026-12-02", "18:00").toISOString());
  assert.equal(byDay["2026-12-01"], sg("2026-12-01", "12:00").toISOString());
  assert.equal(byDay["2026-12-03"], sg("2026-12-03", "12:00").toISOString());
});

test("a series with an end date stops on that date", () => {
  const ending = { ...daily, recurrence: { frequency: "daily", interval: 1, until: "2026-12-03", endMode: "on" } };
  const out = expandRecurring([ending], sg("2026-12-01", "00:00"), sg("2026-12-10", "23:00"));
  assert.deepEqual(days(out), ["2026-12-01", "2026-12-02", "2026-12-03"]);
});

test("every-other-day repeats skip the in-between days", () => {
  const alt = { ...daily, recurrence: { frequency: "daily", interval: 2 } };
  const out = expandRecurring([alt], sg("2026-12-01", "00:00"), sg("2026-12-07", "23:00"));
  assert.deepEqual(days(out), ["2026-12-01", "2026-12-03", "2026-12-05", "2026-12-07"]);
});

test("completing a repeating task creates the next one once, not twice", () => {
  const t = { id: "plants", title: "Water plants", scope: "day", taskDate: "2026-12-01", recurrence: { frequency: "daily", interval: 1 }, done: true };
  const next = createNextRecurringTask(t, [t]);
  assert.ok(next, "next occurrence is created");
  assert.equal(taskDayKey(next), "2026-12-02", "the date the app shows for the new task");
  assert.equal(next.done, false);
  assert.equal(createNextRecurringTask(t, [t, next]), null, "no duplicate when it already exists");
});

// ── Time zones and dates ─────────────────────────────────────────────────────
test("dates follow the chosen time zone, including daylight-saving changes", () => {
  // Sydney moves clocks forward on 4 Oct 2026 (02:00 -> 03:00).
  assert.equal(dateKeyInTimeZone(new Date("2026-10-03T16:30:00Z"), "Australia/Sydney"), "2026-10-04");
  assert.equal(dateKeyInTimeZone(new Date("2026-10-03T16:30:00Z"), "Asia/Singapore"), "2026-10-04");
  assert.equal(dateKeyInTimeZone(new Date("2026-10-03T15:30:00Z"), "Asia/Singapore"), "2026-10-03");
  assert.equal(dateKeyInTimeZone(new Date("2026-10-03T15:30:00Z"), "America/New_York"), "2026-10-03");
});

test("weeks start on Monday, including across the new year", () => {
  assert.equal(weekStartKeyFromDateKey("2027-01-01"), "2026-12-28");
  assert.equal(weekStartKeyFromDateKey("2026-11-30"), "2026-11-30");
  assert.equal(weekStartKeyFromDateKey("2026-12-06"), "2026-11-30");
});

test("day and month arithmetic handles month ends and leap years", () => {
  assert.equal(addDaysToDateKey("2026-02-28", 1), "2026-03-01");
  assert.equal(addDaysToDateKey("2028-02-28", 1), "2028-02-29");
  assert.equal(addDaysToDateKey("2026-12-31", 1), "2027-01-01");
  assert.equal(addDaysToDateKey("2026-03-01", -1), "2026-02-28");
  assert.equal(monthKeyFromDateKey("2026-12-31"), "2026-12");
});

test("time-of-day checks work across midnight in the chosen time zone", () => {
  const justAfterMidnight = getLocalDateTimeParts(new Date("2026-11-26T16:05:00Z"), "Asia/Singapore"); // 00:05 on the 27th
  assert.equal(justAfterMidnight.dateKey, "2026-11-27");
  assert.equal(localClockDue(justAfterMidnight, "00:00", 10, 0), true);
  assert.equal(localClockDue(justAfterMidnight, "23:55", 5, 0), false, "yesterday's 23:55 is not today's");
});

// ── Merging between devices ──────────────────────────────────────────────────
test("an edit made after a deletion on another device brings the task back; an older edit does not", () => {
  const deleted = row([], { settings: { deletedRecords: { tasks: { a: T1 } } } });
  const newerEdit = row([task("a", "Edited later", { updatedAt: T2 })]);
  const olderEdit = row([task("a", "Edited earlier", { updatedAt: T0 })]);
  assert.deepEqual(mergeTempoData(deleted, newerEdit).tasks.map(t => t.title), ["Edited later"]);
  assert.deepEqual(mergeTempoData(deleted, olderEdit).tasks, []);
});

test("different tasks changed on different devices are all kept", () => {
  const laptop = row([task("a", "Laptop A", { updatedAt: T2 }), task("b", "B", { updatedAt: T0 })]);
  const phone = row([task("a", "A", { updatedAt: T0 }), task("b", "Phone B", { updatedAt: T1 }), task("c", "Phone new", { updatedAt: T1 })]);
  const titles = Object.fromEntries(mergeTempoData(laptop, phone).tasks.map(t => [t.id, t.title]));
  assert.deepEqual(titles, { a: "Laptop A", b: "Phone B", c: "Phone new" });
});
