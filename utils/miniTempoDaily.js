// View selectors for Mini. These do not mutate task/event records.
const rank = { high: 0, medium: 1, low: 2 };

export function miniTaskRows(todayTasks = [], lastChangedId = "") {
  const rows = [...todayTasks].filter(t => t && t.id);
  const open = rows.filter(t => !t.done).sort((a,b) =>
    (rank[a.priority] ?? 1) - (rank[b.priority] ?? 1));
  const completed = rows.filter(t => t.done);
  const recentlyCompleted = completed.find(t => t.id === lastChangedId);
  // Show every task assigned to today, not just the first three. Keep a newly
  // checked task at the top for a convenient Undo, followed by unfinished tasks
  // (priority order) and the rest of today's completed tasks.
  return recentlyCompleted
    ? [recentlyCompleted, ...open, ...completed.filter(t => t.id !== recentlyCompleted.id)]
    : [...open, ...completed];
}

export function nextUpcomingEvent(expandedEvents = [], now = new Date()) {
  const moment = now instanceof Date ? now.getTime() : new Date(now).getTime();
  return expandedEvents
    .filter(e => e?.start && e?.end &&
      Number.isFinite(new Date(e.start).getTime()) &&
      new Date(e.end).getTime() >= moment)
    .sort((a,b) => new Date(a.start).getTime() - new Date(b.start).getTime())[0] || null;
}
