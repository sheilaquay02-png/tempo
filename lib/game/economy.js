// Blossoms 🌸: the Cozy Room's reward currency. Pure functions over the saved game state
// (see normalizeGameState in lib/tempo/core.js); nothing here touches tasks, money or the budget.

export const TASK_REWARD = 3; // blossoms for finishing a task

// Ticking a task earns blossoms once per completion; unticking gives them back,
// so ticking the same task on and off can't farm rewards.
// `earned` keeps each completion with what it currently pays (3, or 0 once given back), newest last,
// so another device's save can tell which completions it hasn't counted yet (mergeGameStates in core.js).
export function rewardForTaskToggle(game, completionKey, nowDone) {
  const earned = { ...(game.earned || {}) };
  if (nowDone) {
    if (earned[completionKey]) return game; // already paid for this completion
    delete earned[completionKey]; earned[completionKey] = TASK_REWARD; // (re)added at the end: newest
    return { ...game, blossoms: (game.blossoms || 0) + TASK_REWARD, earned };
  }
  const paid = earned[completionKey];
  if (!paid) return game;
  delete earned[completionKey]; earned[completionKey] = 0; // given back; kept so other devices learn it too
  return { ...game, blossoms: Math.max(0, (game.blossoms || 0) - paid), earned };
}

// Undo changed some tasks' ticks: blossoms follow, exactly as if each had been ticked by hand.
// changes: [{ key, done }] for tasks whose done state the undo flipped.
export function rewardForUndo(game, changes) {
  return (changes || []).reduce((g, c) => rewardForTaskToggle(g, c.key, c.done), game);
}

// Every purchase is noted in `spent` (id#stamp → price, newest last), so a purchase made on another
// device at the same time is still counted when the two saves meet.
export const spendNote = (game, itemId, price) => {
  const stamp = Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36).padStart(2, "0");
  return { ...(game.spent || {}), [`${itemId}#${stamp}`]: price };
};

// Café focus timer: finishing a full focus session earns the same as a task.
export const FOCUS_REWARD = TASK_REWARD;
export function rewardForFocus(game, sessionKey) {
  const earned = { ...(game.earned || {}) };
  if (earned[sessionKey]) return game; // each session pays once
  earned[sessionKey] = FOCUS_REWARD;
  return { ...game, blossoms: (game.blossoms || 0) + FOCUS_REWARD, earned };
}

// Buying furniture: spend blossoms, the piece goes into your storage.
export function buyItem(game, item) {
  if (!item || !item.price || (game.blossoms || 0) < item.price) return null;
  const owned = { ...(game.owned || {}) };
  owned[item.id] = (owned[item.id] || 0) + 1;
  return { ...game, blossoms: game.blossoms - item.price, owned, spent: spendNote(game, item.id, item.price) };
}

// ── Daily streak ──────────────────────────────────────────────────────────
// The first task you finish each day marks that day ("day@YYYY-MM-DD" in `earned`, so it syncs like
// any reward). Finishing something on consecutive days builds a streak; from day 2 the first task of
// the day pays a bonus equal to the streak length, up to STREAK_MAX_BONUS.
export const STREAK_MAX_BONUS = 7;
const DAY = "day@";
export const localDayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const dayBefore = key => { const [y, m, d] = key.split("-").map(Number); return localDayKey(new Date(y, m - 1, d - 1)); };
const streakDays = game => new Set(Object.keys(game?.earned || {}).filter(k => k.startsWith(DAY)).map(k => k.slice(DAY.length)));
const runEndingOn = (days, key) => { let n = 0; while (days.has(key)) { n++; key = dayBefore(key); } return n; };
export const streakBonusFor = length => (length >= 2 ? Math.min(length, STREAK_MAX_BONUS) : 0);

export function rewardStreakDay(game, todayKey = localDayKey()) {
  const earned = { ...(game.earned || {}) };
  if (`${DAY}${todayKey}` in earned) return game; // today already counted
  const length = 1 + runEndingOn(streakDays(game), dayBefore(todayKey));
  const bonus = streakBonusFor(length);
  earned[`${DAY}${todayKey}`] = bonus;
  return { ...game, blossoms: (game.blossoms || 0) + bonus, earned };
}

// what the Town Hall shows: today's streak, the best one on record, and the last 28 days
export function streakInfo(game, todayKey = localDayKey()) {
  const days = streakDays(game);
  const doneToday = days.has(todayKey);
  const current = runEndingOn(days, doneToday ? todayKey : dayBefore(todayKey));
  // best: the longest run of days in a row (counted from each run's first day)
  let best = current;
  for (const d of days) if (!days.has(dayBefore(d))) { let n = 0, k = d; while (days.has(k)) { n++; k = dayAfter(k); } best = Math.max(best, n); }
  const recent = []; let k = todayKey; for (let i = 0; i < 28; i++) { recent.unshift({ key: k, done: days.has(k) }); k = dayBefore(k); }
  // the bonus the next streak day pays (tomorrow's if today is done, today's otherwise)
  return { current, best, doneToday, nextBonus: streakBonusFor(current + 1), recent };
}
function dayAfter(key) { const [y, m, d] = key.split("-").map(Number); return localDayKey(new Date(y, m - 1, d + 1)); }
