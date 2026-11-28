// Blossoms 🌸: the Cozy Room's reward currency. Pure functions over the saved game state
// (see normalizeGameState in lib/tempo/core.js); nothing here touches tasks, money or the budget.

export const TASK_REWARD = 1; // blossoms for finishing a task

// Ticking a task earns blossoms once per completion; unticking gives them back,
// so ticking the same task on and off can't farm rewards.
export function rewardForTaskToggle(game, completionKey, nowDone) {
  const earned = { ...(game.earned || {}) };
  if (nowDone) {
    if (earned[completionKey]) return game; // already paid for this completion
    earned[completionKey] = TASK_REWARD;
    return { ...game, blossoms: (game.blossoms || 0) + TASK_REWARD, earned };
  }
  const paid = earned[completionKey];
  if (!paid) return game;
  delete earned[completionKey];
  return { ...game, blossoms: Math.max(0, (game.blossoms || 0) - paid), earned };
}

// Buying furniture: spend blossoms, the piece goes into your storage.
export function buyItem(game, item) {
  if (!item || !item.price || (game.blossoms || 0) < item.price) return null;
  const owned = { ...(game.owned || {}) };
  owned[item.id] = (owned[item.id] || 0) + 1;
  return { ...game, blossoms: game.blossoms - item.price, owned };
}
