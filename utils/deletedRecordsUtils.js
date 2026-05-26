export function normalizeSettingsUpdatedAt(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

export function normalizeDeletedRecords(value) {
  const src = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const cleanKind = obj => Object.fromEntries(Object.entries(obj || {}).filter(([id, ts]) => id && ts));
  return {
    events: cleanKind(src.events),
    tasks: cleanKind(src.tasks),
    calendars: cleanKind(src.calendars),
    rituals: cleanKind(src.rituals),
    ritualCompletions: cleanKind(src.ritualCompletions),
    habits: cleanKind(src.habits),
    habitCompletions: cleanKind(src.habitCompletions),
    dailyCheckIns: cleanKind(src.dailyCheckIns),
    tomorrowResets: cleanKind(src.tomorrowResets),
    weeklyResets: cleanKind(src.weeklyResets),
    affirmations: cleanKind(src.affirmations),
  };
}

export function addDeletedRecords(records, kind, ids, timestamp = new Date().toISOString()) {
  const current = normalizeDeletedRecords(records);
  const next = {
    events: { ...current.events },
    tasks: { ...current.tasks },
    calendars: { ...current.calendars },
    rituals: { ...current.rituals },
    ritualCompletions: { ...current.ritualCompletions },
    habits: { ...current.habits },
    habitCompletions: { ...current.habitCompletions },
    dailyCheckIns: { ...current.dailyCheckIns },
    tomorrowResets: { ...current.tomorrowResets },
    weeklyResets: { ...current.weeklyResets },
    affirmations: { ...current.affirmations },
  };
  const allowed = new Set(Object.keys(next));
  const bucket = allowed.has(kind) ? kind : (kind === "tasks" ? "tasks" : kind === "calendars" ? "calendars" : kind === "rituals" ? "rituals" : kind === "habits" ? "habits" : kind === "affirmations" ? "affirmations" : "events");
  (Array.isArray(ids) ? ids : [ids]).filter(Boolean).forEach(id => { next[bucket][id] = timestamp; });
  return next;
}

export function filterActiveRecords(records) {
  return Array.isArray(records) ? records.filter(r => !r?.deletedAt) : [];
}
