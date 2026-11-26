// Undo restores an earlier snapshot of events and tasks. If those records kept
// their OLD change times, another device's newer copy would win the next merge
// and the undo would be quietly reversed. So every record the undo changes is
// re-stamped with the undo time, and records the undo removes (for example
// undoing an "add") get deletion markers.

const sameRecord = (a, b) => {
  try { return JSON.stringify(a) === JSON.stringify(b); } catch { return false; }
};

function restoreKind(currentList = [], restoredList = [], now) {
  const current = new Map((Array.isArray(currentList) ? currentList : []).filter(r => r?.id).map(r => [r.id, r]));
  const restored = Array.isArray(restoredList) ? restoredList : [];
  const restoredIds = new Set();
  const records = restored.map(record => {
    if (!record?.id) return record;
    restoredIds.add(record.id);
    const now_ = current.get(record.id);
    if (now_ && sameRecord(now_, record)) return record;
    return { ...record, updatedAt: now };
  });
  const removedIds = [...current.keys()].filter(id => !restoredIds.has(id));
  return { records, removedIds };
}

export function prepareUndoRestore(current = {}, snapshot = {}, now = new Date().toISOString()) {
  const events = restoreKind(current.events, snapshot.events, now);
  const tasks = restoreKind(current.tasks, snapshot.tasks, now);
  return {
    events: events.records,
    tasks: tasks.records,
    removedEventIds: events.removedIds,
    removedTaskIds: tasks.removedIds,
  };
}
