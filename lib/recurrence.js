/* Tempo recurrence and model helpers
   Phase 1 foundation + Phase 2/3 recurrence behavior.
   No external dependencies. */

export const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

export function uid(prefix = "id") {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function asDate(value, fallback = new Date()) {
  if (value instanceof Date) {
    if (!Number.isNaN(value.getTime())) return new Date(value.getTime());
    const f = fallback instanceof Date ? new Date(fallback.getTime()) : new Date(fallback);
    return Number.isNaN(f.getTime()) ? new Date() : f;
  }
  if (value && typeof value === "object" && value.__date) return asDate(value.__date, fallback);
  if (value && typeof value === "object" && value.__d) return asDate(value.__d, fallback);
  const d = value ? new Date(value) : new Date(fallback);
  if (!Number.isNaN(d.getTime())) return d;
  const f = fallback instanceof Date ? new Date(fallback.getTime()) : new Date(fallback);
  return Number.isNaN(f.getTime()) ? new Date() : f;
}

export function startOfDay(value) {
  const d = asDate(value);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(value) {
  const d = startOfDay(value);
  d.setDate(d.getDate() + 1);
  return d;
}

export function addDays(value, days) {
  const d = asDate(value);
  d.setDate(d.getDate() + days);
  return d;
}

export function addMonths(value, months) {
  const d = asDate(value);
  const originalDate = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + months);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(originalDate, last));
  return d;
}

export function addYears(value, years) {
  const d = asDate(value);
  d.setFullYear(d.getFullYear() + years);
  return d;
}

export function dateKey(value) {
  const d = asDate(value);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function parseDateKey(key) {
  if (!key) return startOfDay(new Date());
  const [y, m, d] = String(key).split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0);
}

export function toInputDate(value) {
  return dateKey(value);
}

export function toInputTime(value) {
  const d = asDate(value);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function combineDateTime(dateText, timeText = "00:00") {
  const [y, m, d] = String(dateText || dateKey(new Date())).split("-").map(Number);
  const [hh, mm] = String(timeText || "00:00").split(":").map(Number);
  return new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, 0, 0);
}

export function sameDay(a, b) {
  const x = asDate(a);
  const y = asDate(b);
  return x.getFullYear() === y.getFullYear() && x.getMonth() === y.getMonth() && x.getDate() === y.getDate();
}

export function weekRange(value) {
  const start = startOfDay(value);
  const diff = (start.getDay() + 6) % 7; // Monday start
  start.setDate(start.getDate() - diff);
  return { start, end: addDays(start, 7) };
}

export function monthRange(value) {
  const d = asDate(value);
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  const gridStart = addDays(start, -((start.getDay() + 6) % 7));
  const end = addDays(gridStart, 42);
  return { start: gridStart, end, monthStart: start };
}

export function eventIntersectsDay(event, day) {
  const s = asDate(event.start);
  const e = asDate(event.end);
  const ds = startOfDay(day);
  const de = addDays(ds, 1);
  return s < de && e > ds;
}

export function durationMs(item) {
  return asDate(item.end).getTime() - asDate(item.start).getTime();
}

export function durationToMinutes(value, unit) {
  const n = Math.max(0, Number(value || 0));
  if (unit === "days") return n * 24 * 60;
  if (unit === "hours") return n * 60;
  return n;
}

export function minutesToFriendly(minutes) {
  const m = Number(minutes || 0);
  if (m >= 1440 && m % 1440 === 0) return `${m / 1440} day${m / 1440 === 1 ? "" : "s"}`;
  if (m >= 60 && m % 60 === 0) return `${m / 60} hour${m / 60 === 1 ? "" : "s"}`;
  return `${m} min`;
}

export function blankRecurrence(baseDate = new Date()) {
  return {
    freq: "week", // day | week | month | year
    interval: 1,
    byWeekday: [asDate(baseDate).getDay()],
    monthlyMode: "date", // date | weekday
    endType: "never", // never | on | after
    until: null,
    count: null,
  };
}

export function normalizeRecurrence(input, baseDate = new Date()) {
  if (!input || input === "none") return null;
  if (typeof input === "string") {
    if (input === "daily") return { ...blankRecurrence(baseDate), freq: "day", byWeekday: [] };
    if (input === "weekly") return { ...blankRecurrence(baseDate), freq: "week", byWeekday: [asDate(baseDate).getDay()] };
    if (input === "weekdays") return { ...blankRecurrence(baseDate), freq: "week", byWeekday: [1, 2, 3, 4, 5] };
    if (input === "monthly") return { ...blankRecurrence(baseDate), freq: "month", byWeekday: [], monthlyMode: "date" };
    if (input === "yearly") return { ...blankRecurrence(baseDate), freq: "year", byWeekday: [] };
    return null;
  }
  const r = { ...blankRecurrence(baseDate), ...input };
  const allowedFreq = ["day", "week", "month", "year"];
  const freq = allowedFreq.includes(r.freq) ? r.freq : "week";
  const interval = Math.max(1, Number.parseInt(r.interval || 1, 10));
  const byWeekday = Array.isArray(r.byWeekday) ? Array.from(new Set(r.byWeekday.map(Number).filter(d => d >= 0 && d <= 6))) : [];
  return {
    freq,
    interval,
    byWeekday: freq === "week" ? (byWeekday.length ? byWeekday : [asDate(baseDate).getDay()]) : byWeekday,
    monthlyMode: r.monthlyMode === "weekday" ? "weekday" : "date",
    endType: ["never", "on", "after"].includes(r.endType) ? r.endType : "never",
    until: r.endType === "on" && r.until ? dateKey(r.until) : null,
    count: r.endType === "after" ? Math.max(1, Number.parseInt(r.count || 1, 10)) : null,
  };
}

export function defaultExceptions() {
  return { skipped: [], modified: {} };
}

export function normalizeExceptions(value) {
  const v = value || {};
  return {
    skipped: Array.isArray(v.skipped) ? Array.from(new Set(v.skipped.map(String))) : [],
    modified: v.modified && typeof v.modified === "object" ? v.modified : {},
  };
}

function normalizeCalendarId(value) {
  const id = String(value || "personal");
  return id.toLowerCase().includes("google") ? "personal" : id;
}

export function ensureEventModel(event) {
  const fallbackStart = new Date();
  const start = asDate(event?.start, fallbackStart);
  let end = asDate(event?.end, new Date(start.getTime() + 60 * 60000));
  if (end <= start) end = new Date(start.getTime() + 60 * 60000);
  const allDay = Boolean(event?.allDay);
  const model = {
    id: event?.id || uid("ev"),
    title: event?.title || "Untitled event",
    start,
    end,
    allDay,
    calendar: normalizeCalendarId(event?.calendar),
    category: event?.category || "personal",
    fixed: Boolean(event?.fixed),
    color: event?.color || null,
    notes: event?.notes || "",
    location: event?.location || "",
    recurrence: normalizeRecurrence(event?.recurrence, start),
    recurrenceExceptions: normalizeExceptions(event?.recurrenceExceptions),
    source: "local",
    syncStatus: event?.syncStatus || "local",
  };
  if (event?._isOccurrence) {
    model._isOccurrence = true;
    model._seriesId = event._seriesId || event.id || null;
    model._occurrenceKey = event._occurrenceKey || dateKey(start);
    model._occurrenceIndex = event._occurrenceIndex || null;
    model._baseStart = event._baseStart ? asDate(event._baseStart) : asDate(event.start || start);
    model._baseEnd = event._baseEnd ? asDate(event._baseEnd) : asDate(event.end || end);
  }
  return model;
}

export function ensureTaskModel(task) {
  const rawDuration = task?.durationValue ?? task?.duration ?? 30;
  const rawUnit = task?.durationUnit || "minutes";
  const deadline = task?.deadline || null;
  return {
    id: task?.id || uid("task"),
    title: task?.title || "Untitled task",
    durationValue: Math.max(0, Number(rawDuration || 0)),
    durationUnit: ["minutes", "hours", "days"].includes(rawUnit) ? rawUnit : "minutes",
    duration: durationToMinutes(rawDuration, rawUnit),
    category: task?.category || "admin",
    scope: task?.scope || "day",
    done: Boolean(task?.done),
    deadline,
    priority: task?.priority || "medium",
    notes: task?.notes || "",
    scheduled: task?.scheduled ? asDate(task.scheduled) : null,
    recurrence: normalizeRecurrence(task?.recurrence, deadline ? parseDateKey(deadline) : new Date()),
    recurrenceExceptions: normalizeExceptions(task?.recurrenceExceptions),
    recurrenceStartedAt: task?.recurrenceStartedAt || deadline || null,
    recurrenceCompletedCount: Math.max(0, Number(task?.recurrenceCompletedCount || 0)),
    completedAt: task?.completedAt || null,
  };
}

export function recurrenceSummary(input, baseDate = new Date()) {
  const r = normalizeRecurrence(input, baseDate);
  if (!r) return "Does not repeat";
  const unit = r.freq === "day" ? "day" : r.freq === "week" ? "week" : r.freq === "month" ? "month" : "year";
  let text = `Every ${r.interval === 1 ? "" : r.interval + " "}${unit}${r.interval === 1 ? "" : "s"}`.replace("Every  ", "Every ");
  if (r.freq === "week" && r.byWeekday?.length) {
    text += ` on ${r.byWeekday.slice().sort((a, b) => WEEKDAY_ORDER.indexOf(a) - WEEKDAY_ORDER.indexOf(b)).map(d => WEEKDAY_LABELS[d]).join(", ")}`;
  }
  if (r.freq === "month") text += r.monthlyMode === "weekday" ? " by weekday position" : " by date";
  if (r.endType === "on" && r.until) text += ` until ${r.until}`;
  if (r.endType === "after" && r.count) text += ` for ${r.count} occurrence${r.count === 1 ? "" : "s"}`;
  return text;
}

export function ordinalWeekdayInfo(value) {
  const d = asDate(value);
  const weekday = d.getDay();
  const ordinal = Math.ceil(d.getDate() / 7);
  const nextSameWeekday = addDays(d, 7);
  return { weekday, ordinal: nextSameWeekday.getMonth() !== d.getMonth() ? -1 : ordinal };
}

export function nthWeekdayOfMonth(year, monthIndex, weekday, ordinal) {
  if (ordinal === -1) {
    const d = new Date(year, monthIndex + 1, 0);
    while (d.getDay() !== weekday) d.setDate(d.getDate() - 1);
    return d;
  }
  const d = new Date(year, monthIndex, 1);
  while (d.getDay() !== weekday) d.setDate(d.getDate() + 1);
  d.setDate(d.getDate() + (ordinal - 1) * 7);
  return d.getMonth() === monthIndex ? d : null;
}

function shouldStopByEnd(date, recurrence, generatedCount) {
  if (!recurrence) return true;
  if (recurrence.endType === "on" && recurrence.until && startOfDay(date) > startOfDay(parseDateKey(recurrence.until))) return true;
  if (recurrence.endType === "after" && recurrence.count && generatedCount >= recurrence.count) return true;
  return false;
}

function makeOccurrence(base, occurrenceDate, ordinalCount) {
  const start = new Date(occurrenceDate);
  const baseStart = asDate(base.start);
  const baseEnd = asDate(base.end);
  start.setHours(baseStart.getHours(), baseStart.getMinutes(), baseStart.getSeconds(), 0);
  let end;
  if (base.allDay) {
    const days = Math.max(1, Math.round((startOfDay(baseEnd) - startOfDay(baseStart)) / 86400000));
    end = addDays(startOfDay(start), days);
  } else {
    end = new Date(start.getTime() + Math.max(60000, baseEnd.getTime() - baseStart.getTime()));
  }
  const key = dateKey(start);
  return {
    ...base,
    id: `${base.id}__${key}`,
    start,
    end,
    _isOccurrence: true,
    _seriesId: base.id,
    _occurrenceKey: key,
    _occurrenceIndex: ordinalCount,
    _baseStart: base.start,
    _baseEnd: base.end,
  };
}

function nextCandidateDate(current, baseStart, recurrence) {
  const r = recurrence;
  const base = asDate(baseStart);
  if (r.freq === "day") return addDays(current, r.interval);
  if (r.freq === "week") return addDays(current, 1);
  if (r.freq === "month") {
    if (r.monthlyMode === "weekday") {
      const info = ordinalWeekdayInfo(base);
      const targetMonth = addMonths(new Date(current.getFullYear(), current.getMonth(), 1), r.interval);
      return nthWeekdayOfMonth(targetMonth.getFullYear(), targetMonth.getMonth(), info.weekday, info.ordinal) || addMonths(current, r.interval);
    }
    return addMonths(current, r.interval);
  }
  if (r.freq === "year") return addYears(current, r.interval);
  return addDays(current, 1);
}

function matchesWeeklyCandidate(candidate, baseStart, recurrence) {
  if (recurrence.freq !== "week") return true;
  const base = startOfDay(baseStart);
  const c = startOfDay(candidate);
  const diffDays = Math.floor((c - base) / 86400000);
  const weekIndex = Math.floor(diffDays / 7);
  return weekIndex >= 0 && weekIndex % recurrence.interval === 0 && recurrence.byWeekday.includes(c.getDay());
}

export function expandRecurringEvents(inputEvents, windowStart, windowEnd) {
  const events = (inputEvents || []).map(ensureEventModel);
  const startWindow = startOfDay(windowStart || addDays(new Date(), -60));
  const endWindow = startOfDay(windowEnd || addDays(new Date(), 120));
  const out = [];

  for (const baseEvent of events) {
    const base = ensureEventModel(baseEvent);
    const r = normalizeRecurrence(base.recurrence, base.start);
    if (!r) {
      out.push(base);
      continue;
    }

    const ex = normalizeExceptions(base.recurrenceExceptions);
    let cursor = startOfDay(base.start);
    let safety = 0;
    let generatedCount = 0;

    while (cursor < addDays(endWindow, 1) && safety++ < 2500) {
      const candidateMatches = r.freq === "week" ? matchesWeeklyCandidate(cursor, base.start, r) : true;
      if (cursor >= startOfDay(base.start) && candidateMatches) {
        if (shouldStopByEnd(cursor, r, generatedCount)) break;
        const key = dateKey(cursor);
        let occurrence = makeOccurrence(base, cursor, generatedCount + 1);
        if (!ex.skipped.includes(key)) {
          if (ex.modified?.[key]) {
            occurrence = ensureEventModel({ ...occurrence, ...ex.modified[key], id: occurrence.id, _isOccurrence: true, _seriesId: base.id, _occurrenceKey: key });
          }
          if (asDate(occurrence.start) < addDays(endWindow, 1) && asDate(occurrence.end) > startWindow) out.push(occurrence);
        }
        generatedCount += 1;
      }
      cursor = nextCandidateDate(cursor, base.start, r);
    }
  }
  return out.sort((a, b) => asDate(a.start) - asDate(b.start));
}

export function getBaseEvent(events, eventOrOccurrence) {
  const ev = eventOrOccurrence || {};
  const id = ev._seriesId || ev.id;
  return (events || []).find(e => e.id === id) || null;
}

export function stripOccurrenceMeta(event) {
  const { _isOccurrence, _seriesId, _occurrenceKey, _occurrenceIndex, _baseStart, _baseEnd, ...clean } = event || {};
  return clean;
}

export function applySingleOccurrenceModification(base, occurrence) {
  const ex = normalizeExceptions(base.recurrenceExceptions);
  const key = occurrence._occurrenceKey || dateKey(occurrence.start);
  const clean = stripOccurrenceMeta(occurrence);
  return {
    ...base,
    recurrenceExceptions: {
      ...ex,
      skipped: ex.skipped.filter(k => k !== key),
      modified: { ...ex.modified, [key]: clean },
    },
  };
}

export function applySingleOccurrenceDelete(base, occurrence) {
  const ex = normalizeExceptions(base.recurrenceExceptions);
  const key = occurrence._occurrenceKey || dateKey(occurrence.start);
  const modified = { ...ex.modified };
  delete modified[key];
  return { ...base, recurrenceExceptions: { ...ex, skipped: Array.from(new Set([...ex.skipped, key])), modified } };
}

export function splitSeriesFromOccurrence(base, occurrence) {
  const key = occurrence._occurrenceKey || dateKey(occurrence.start);
  const previousUntil = dateKey(addDays(parseDateKey(key), -1));
  const oldBase = {
    ...base,
    recurrence: { ...base.recurrence, endType: "on", until: previousUntil, count: null },
  };
  const newBase = ensureEventModel({
    ...stripOccurrenceMeta(occurrence),
    id: uid("ev"),
    recurrence: normalizeRecurrence(occurrence.recurrence || base.recurrence, occurrence.start),
    recurrenceExceptions: defaultExceptions(),
    source: "local",
    syncStatus: "local",
  });
  return { oldBase, newBase };
}

export function applySeriesChangeFromOccurrence(base, occurrence) {
  const clean = stripOccurrenceMeta(occurrence);
  const newOccurrenceStart = asDate(occurrence.start);
  const baseStart = asDate(base.start);
  const keepDateStart = new Date(baseStart);
  keepDateStart.setHours(newOccurrenceStart.getHours(), newOccurrenceStart.getMinutes(), newOccurrenceStart.getSeconds(), 0);
  const dur = asDate(clean.end).getTime() - asDate(clean.start).getTime();
  const newEnd = clean.allDay ? addDays(startOfDay(keepDateStart), Math.max(1, Math.round(dur / 86400000))) : new Date(keepDateStart.getTime() + Math.max(60000, dur));
  return ensureEventModel({
    ...base,
    ...clean,
    id: base.id,
    start: clean.allDay ? startOfDay(keepDateStart) : keepDateStart,
    end: newEnd,
    recurrence: normalizeRecurrence(clean.recurrence || base.recurrence, keepDateStart),
    recurrenceExceptions: base.recurrenceExceptions || defaultExceptions(),
  });
}

export function nextTaskDate(task, fromDate = null) {
  const t = ensureTaskModel(task);
  const recurrenceBase = t.recurrenceStartedAt ? parseDateKey(t.recurrenceStartedAt) : t.deadline ? parseDateKey(t.deadline) : new Date();
  const r = normalizeRecurrence(t.recurrence, recurrenceBase);
  if (!r) return null;
  const base = fromDate ? startOfDay(fromDate) : t.deadline ? parseDateKey(t.deadline) : startOfDay(new Date());
  const ex = normalizeExceptions(t.recurrenceExceptions);
  let cursor = startOfDay(base);
  for (let i = 0; i < 2500; i++) {
    cursor = nextCandidateDate(cursor, recurrenceBase, r);
    if (cursor <= base) {
      cursor = addDays(cursor, 1);
      continue;
    }
    if (r.freq === "week" && !matchesWeeklyCandidate(cursor, recurrenceBase, r)) continue;
    if (r.endType === "on" && r.until && startOfDay(cursor) > startOfDay(parseDateKey(r.until))) return null;
    if (ex.skipped.includes(dateKey(cursor))) continue;
    return cursor;
  }
  return null;
}

export function createNextRecurringTask(task) {
  const t = ensureTaskModel(task);
  const r = normalizeRecurrence(t.recurrence, t.recurrenceStartedAt ? parseDateKey(t.recurrenceStartedAt) : t.deadline ? parseDateKey(t.deadline) : new Date());
  if (!r) return null;
  const completedCount = t.recurrenceCompletedCount + 1;
  if (r.endType === "after" && r.count && completedCount >= r.count) return null;
  const next = nextTaskDate(t, t.deadline ? parseDateKey(t.deadline) : new Date());
  if (!next) return null;
  return ensureTaskModel({
    ...t,
    id: uid("task"),
    done: false,
    completedAt: null,
    scheduled: null,
    deadline: dateKey(next),
    recurrenceCompletedCount: completedCount,
  });
}

export function sortEvents(events) {
  return [...(events || [])].sort((a, b) => asDate(a.start) - asDate(b.start));
}

export function sortTasks(tasks) {
  return [...(tasks || [])].sort((a, b) => {
    if (!a.deadline && b.deadline) return 1;
    if (a.deadline && !b.deadline) return -1;
    if (a.deadline && b.deadline && a.deadline !== b.deadline) return a.deadline.localeCompare(b.deadline);
    return String(a.title).localeCompare(String(b.title));
  });
}
