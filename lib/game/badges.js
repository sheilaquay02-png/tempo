// Town Hall milestones: small badges, each with a one-off blossom gift.
// A badge is noted in `earned` as "badge@<id>" (worth its gift), so it syncs between devices like any
// reward and can never be paid twice. Progress comes from your tasks and the game's own records.
import { streakInfo } from "./economy.js";

export const BADGES = [
  { id: "first_task", icon: "🌱", name: "First step", desc: "Finish your first task", stat: "tasks", goal: 1, gift: 5 },
  { id: "tasks_10", icon: "🌿", name: "Getting going", desc: "Finish 10 tasks", stat: "tasks", goal: 10, gift: 10 },
  { id: "tasks_50", icon: "🌷", name: "In full bloom", desc: "Finish 50 tasks", stat: "tasks", goal: 50, gift: 20 },
  { id: "tasks_100", icon: "🌸", name: "Hundred club", desc: "Finish 100 tasks", stat: "tasks", goal: 100, gift: 30 },
  { id: "tasks_250", icon: "🏵️", name: "Busy bee", desc: "Finish 250 tasks", stat: "tasks", goal: 250, gift: 45 },
  { id: "tasks_500", icon: "👑", name: "Task royalty", desc: "Finish 500 tasks", stat: "tasks", goal: 500, gift: 60 },
  { id: "streak_3", icon: "🔥", name: "Warming up", desc: "A 3-day streak", stat: "streak", goal: 3, gift: 6 },
  { id: "streak_7", icon: "📅", name: "A whole week", desc: "A 7-day streak", stat: "streak", goal: 7, gift: 15 },
  { id: "streak_14", icon: "⭐", name: "Two weeks strong", desc: "A 14-day streak", stat: "streak", goal: 14, gift: 24 },
  { id: "streak_30", icon: "🏆", name: "Month of momentum", desc: "A 30-day streak", stat: "streak", goal: 30, gift: 45 },
  { id: "focus_1", icon: "☕", name: "Café regular", desc: "Finish a café focus session", stat: "focus", goal: 1, gift: 5 },
  { id: "focus_10", icon: "💻", name: "Deep focus", desc: "Finish 10 café focus sessions", stat: "focus", goal: 10, gift: 15 },
  { id: "shopper", icon: "🛍️", name: "First purchase", desc: "Buy something in town", stat: "bought", goal: 1, gift: 5 },
  { id: "decorator", icon: "🛋️", name: "Home maker", desc: "Buy 10 things", stat: "bought", goal: 10, gift: 15 },
];
const PREFIX = "badge@";

// the numbers badges are measured against
export function badgeStats(game, tasks = []) {
  const earned = game?.earned || {};
  return {
    tasks: tasks.filter(t => t && t.done).length,
    streak: streakInfo(game || {}).best,
    focus: Object.keys(earned).filter(k => k.startsWith("focus@") && earned[k] > 0).length,
    bought: Object.values(game?.owned || {}).reduce((n, v) => n + (Number(v) || 0), 0),
  };
}

export const hasBadge = (game, id) => `${PREFIX}${id}` in (game?.earned || {});

// every badge with whether you have it and how far along you are
export function badgeProgress(game, tasks) {
  const stats = badgeStats(game, tasks);
  return BADGES.map(b => ({ ...b, have: hasBadge(game, b.id), value: Math.min(stats[b.stat], b.goal), reached: stats[b.stat] >= b.goal }));
}

// badges reached but not yet given
export const newBadges = (game, tasks) => badgeProgress(game, tasks).filter(b => b.reached && !b.have);

// give badges (and their gifts) — each only once
export function awardBadges(game, badges) {
  const earned = { ...(game.earned || {}) };
  let blossoms = game.blossoms || 0;
  for (const b of badges) {
    if (`${PREFIX}${b.id}` in earned) continue;
    earned[`${PREFIX}${b.id}`] = b.gift; blossoms += b.gift;
  }
  return { ...game, blossoms, earned };
}
