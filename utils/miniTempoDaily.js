// View selectors for Mini. These do not mutate task/event records.
const rank = { high: 0, medium: 1, low: 2 };

export function miniTaskRows(todayTasks = [], lastChangedId = "", limit = 3) {
  const rows = [...todayTasks].filter(t => t && t.id);
  const open = rows.filter(t => !t.done).sort((a,b) =>
    (rank[a.priority] ?? 1) - (rank[b.priority] ?? 1));
  const recentlyCompleted = rows.find(t => t.id === lastChangedId && t.done);
  if (recentlyCompleted) {
    // Keep the just-checked item visible so Undo never disappears on click.
    return [recentlyCompleted, ...open.filter(t => t.id !== recentlyCompleted.id)].slice(0, limit);
  }
  return open.slice(0, limit);
}

export function nextUpcomingEvent(expandedEvents = [], now = new Date()) {
  const moment = now instanceof Date ? now.getTime() : new Date(now).getTime();
  return expandedEvents
    .filter(e => e?.start && e?.end &&
      Number.isFinite(new Date(e.start).getTime()) &&
      new Date(e.end).getTime() >= moment)
    .sort((a,b) => new Date(a.start).getTime() - new Date(b.start).getTime())[0] || null;
}
