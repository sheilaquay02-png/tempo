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
