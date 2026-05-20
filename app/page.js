"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────
// ─── Pre-split data schema notes ──────────────────────────────────────────────
// Event: { id,title,start,end,calendar,category,fixed,color,notes,recurrence,allDay }
// Task: { id,title,duration,category,scope,done,priority,dayKey,weekKey,monthKey,recurrence }
// MemoryEntry: { mood,activities,note,gratitude,photos,tags,backgroundId,highlights,blocks,updatedAt }
// MemoryPhoto: { id,storagePath,thumbStoragePath,bucket,caption,name,createdAt }
// MemoryBlock: { id,type,text,photoIds,caption,sticker,stickerAsset,size }
// UserSettings: { fontSize,darkMode,theme,workStart,workEnd,notifs,categories,templates,journalActivities,memoryTags }
// Memory Storage Service surface: upload full/thumb, sign URLs, refresh URLs, delete full/thumb, migrate legacy base64.
const DAY_START = 0, DAY_END = 24, HOUR_H = 48;
const POMODORO_WORK_SECS  = 25 * 60;
const POMODORO_BREAK_SECS = 5  * 60;
const RECURRENCE_WINDOW_DAYS  = 60;
const RECURRENCE_SAFETY_LIMIT = 500;
const UNDO_STACK_MAX      = 20;
const CLOUD_FALLBACK_MS   = 4000;
const CHAT_REPLY_DELAY_MS = 280;
const EVENT_DRAG_HOLD_MS = 360;

const CALENDARS = [
  { id: "personal", name: "Personal", color: "#FF7BAC", account: null },
  { id: "work",     name: "Work",     color: "#B08AE0", account: null },
];

const CATEGORIES = [
  { id: "deep",     label: "Deep Work",   color: "#B08AE0", icon: "🔮" },
  { id: "boss",     label: "Boss Battle", color: "#FF6B8A", icon: "🐉" },
  { id: "admin",    label: "Admin",       color: "#A0C8E0", icon: "📋" },
  { id: "meeting",  label: "Meeting",   color: "#FF7BAC", icon: "💬" },
  { id: "personal", label: "Personal",  color: "#70C8A0", icon: "🌿" },
  { id: "health",   label: "Health",    color: "#FFB870", icon: "🌸" },
];

const PRIORITIES = [
  { id: "high",   label: "High",   color: "#FF6B8A", icon: "🔴" },
  { id: "medium", label: "Medium", color: "#FFB347", icon: "🟡" },
  { id: "low",    label: "Low",    color: "#7EC8A0", icon: "🟢" },
];

const normalizeCategories = cats => {
  const list = Array.isArray(cats) && cats.length ? cats.filter(Boolean) : CATEGORIES;
  const hasBoss = list.some(c => c?.id === "boss");
  if (hasBoss) return list;
  const boss = CATEGORIES.find(c => c.id === "boss");
  const deepIndex = list.findIndex(c => c?.id === "deep");
  const next = [...list];
  next.splice(deepIndex >= 0 ? deepIndex + 1 : next.length, 0, boss);
  return next;
};

const FONT_SIZES = [
  { id: "xs", label: "XS", desc: "Extra small", scale: 0.78 },
  { id: "sm", label: "S",  desc: "Small",       scale: 0.88 },
  { id: "md", label: "M",  desc: "Medium",      scale: 1.00 },
  { id: "lg", label: "L",  desc: "Large",       scale: 1.14 },
  { id: "xl", label: "XL", desc: "Extra large", scale: 1.28 },
];

// ─── Themes ──────────────────────────────────────────────────────────────────
const THEMES = [
  {
    id: "tempo",
    label: "Tempo",
    description: "Pink & Purple",
    swatch: ["#FF7BAC", "#B08AE0", "#FFF5F7"],
    light: "--bg:#FFF5F7;--bg2:#FFFFFF;--bg3:#FFF0F4;--bg4:#FFE4EC;--border:#FFD6E4;--text:#4A2840;--text2:#7A4060;--text3:#A07090;",
    dark:  "--bg:#1A0F1E;--bg2:#231329;--bg3:#2D1A35;--bg4:#3D2445;--border:#4D2A5D;--text:#F5E8F8;--text2:#C090D0;--text3:#805890;",
    accent: "--accent:#FF7BAC;--accent2:#FF9EC4;--accent3:#FFBAD4;--accent-rgb:255,123,172;",
  },
  {
    id: "pink-white",
    label: "Pink/White",
    description: "Pastel & Soft",
    swatch: ["#F4A7C3", "#F9C8DA", "#FFFFFF"],
    light: "--bg:#FFFFFF;--bg2:#FFFFFF;--bg3:#FFF6F9;--bg4:#FDEAF2;--border:#F9D0E3;--text:#3D1A2C;--text2:#7A4060;--text3:#B07090;",
    dark:  "--bg:#1E0F18;--bg2:#2A1522;--bg3:#361B2C;--bg4:#44223A;--border:#5C2E4E;--text:#FAE8F2;--text2:#E8A8C8;--text3:#A06080;",
    accent: "--accent:#F4A7C3;--accent2:#F9C8DA;--accent3:#FDE0EC;--accent-rgb:244,167,195;",
  },
  {
    id: "ocean",
    label: "Ocean",
    description: "Teal & Blue",
    swatch: ["#20B2AA", "#5F9EA0", "#E0FFFF"],
    light: "--bg:#F0FAFA;--bg2:#FFFFFF;--bg3:#E6F7F7;--bg4:#CCF0EE;--border:#99DDD9;--text:#0D3535;--text2:#2A6060;--text3:#4A8888;",
    dark:  "--bg:#071820;--bg2:#0D2530;--bg3:#123040;--bg4:#1A3E50;--border:#1E5060;--text:#E0FFFF;--text2:#80D8D0;--text3:#409090;",
    accent: "--accent:#20B2AA;--accent2:#40C8C0;--accent3:#80DDD8;--accent-rgb:32,178,170;",
  },
  {
    id: "sunset",
    label: "Sunset",
    description: "Coral & Orange",
    swatch: ["#FF7050", "#FF9040", "#FFF8F0"],
    light: "--bg:#FFF8F0;--bg2:#FFFFFF;--bg3:#FFF2E6;--bg4:#FFE4CC;--border:#FFCCA0;--text:#3A1800;--text2:#7A3A10;--text3:#A05A30;",
    dark:  "--bg:#1E0E00;--bg2:#2A1400;--bg3:#381C00;--bg4:#4A2600;--border:#603200;--text:#FFF0E0;--text2:#FFA060;--text3:#C06030;",
    accent: "--accent:#FF7050;--accent2:#FF9040;--accent3:#FFBA80;--accent-rgb:255,112,80;",
  },
  {
    id: "forest",
    label: "Forest",
    description: "Green & Earthy",
    swatch: ["#2E8B57", "#8FBC8F", "#F5F9F0"],
    light: "--bg:#F5F9F0;--bg2:#FFFFFF;--bg3:#EAF4E4;--bg4:#D4EAC8;--border:#A8D898;--text:#0D2810;--text2:#2A5530;--text3:#4A7850;",
    dark:  "--bg:#071208;--bg2:#0D1E10;--bg3:#122818;--bg4:#183520;--border:#1E4428;--text:#E8F5E0;--text2:#80C890;--text3:#408850;",
    accent: "--accent:#2E8B57;--accent2:#50A870;--accent3:#90CC90;--accent-rgb:46,139,87;",
  },
  {
    id: "mono",
    label: "Mono",
    description: "Minimal Grayscale",
    swatch: ["#36454F", "#708090", "#F8F8F8"],
    light: "--bg:#F8F8F8;--bg2:#FFFFFF;--bg3:#F0F0F0;--bg4:#E4E4E4;--border:#CCCCCC;--text:#1A1A1A;--text2:#555555;--text3:#888888;",
    dark:  "--bg:#0A0A0A;--bg2:#141414;--bg3:#1E1E1E;--bg4:#282828;--border:#383838;--text:#F0F0F0;--text2:#AAAAAA;--text3:#666666;",
    accent: "--accent:#36454F;--accent2:#708090;--accent3:#A0B0B8;--accent-rgb:54,69,79;",
  },
];

const DAY_TEMPLATES = [
  { id: "deep", label: "🔮 Deep Work Day", events: [
    { title: "Morning Focus",   start: [9,0],  end: [11,0], category: "deep",     fixed: false },
    { title: "Lunch",           start: [12,0], end: [13,0], category: "personal", fixed: true  },
    { title: "Afternoon Focus", start: [13,0], end: [15,0], category: "deep",     fixed: false },
    { title: "Review & Plan",   start: [16,0], end: [17,0], category: "admin",    fixed: false },
  ]},
  { id: "meetings", label: "💬 Meeting Heavy", events: [
    { title: "Team Standup", start: [9,0],  end: [9,30],  category: "meeting",  fixed: true  },
    { title: "1-on-1s",      start: [10,0], end: [11,0],  category: "meeting",  fixed: false },
    { title: "Lunch",        start: [12,0], end: [13,0],  category: "personal", fixed: true  },
    { title: "Project Sync", start: [14,0], end: [15,0],  category: "meeting",  fixed: false },
    { title: "Wrap-up",      start: [17,0], end: [17,30], category: "admin",    fixed: false },
  ]},
  { id: "light", label: "🌿 Light Day", events: [
    { title: "Morning Emails", start: [9,0],  end: [9,30], category: "admin",    fixed: false },
    { title: "Lunch",          start: [12,0], end: [13,0], category: "personal", fixed: true  },
    { title: "Gym",            start: [17,0], end: [18,0], category: "health",   fixed: false },
  ]},
];

// TODAY is computed once per module load and never mutated.
// Always use cloneDate(TODAY) before mutating.
const TODAY = Object.freeze((() => { const d = new Date(); d.setHours(0,0,0,0); return d; })());

// ─── Helpers ──────────────────────────────────────────────────────────────────
const DEFAULT_TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Singapore";
let _displayTimezone = DEFAULT_TIMEZONE;
const setDisplayTimezoneCtx = tz => {
  try {
    if (tz) new Intl.DateTimeFormat("en-US", { timeZone: tz }).format(new Date());
    _displayTimezone = tz || DEFAULT_TIMEZONE;
  } catch {
    _displayTimezone = DEFAULT_TIMEZONE;
  }
};
const formatWithDisplayTimezone = (d, opts) => {
  const date = d instanceof Date ? d : new Date(d);
  try { return new Intl.DateTimeFormat("en-US", { ...opts, timeZone: _displayTimezone }).format(date); }
  catch { return new Intl.DateTimeFormat("en-US", opts).format(date); }
};
const fmt      = d => formatWithDisplayTimezone(d, { hour: "2-digit", minute: "2-digit", hour12: true });
const fmtDate  = d => formatWithDisplayTimezone(d, { weekday: "short", month: "short", day: "numeric" });
const sameDay  = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const fmtDay   = d => {
  if (sameDay(d, TODAY)) return "today";
  const t = new Date(TODAY); t.setDate(t.getDate() + 1);
  if (sameDay(d, t)) return "tomorrow";
  return formatWithDisplayTimezone(d, { weekday: "long", month: "short", day: "numeric" });
};
const minsToTime = m => {
  const h = Math.floor(m / 60), mn = m % 60, ap = h >= 12 ? "pm" : "am", hd = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return mn === 0 ? `${hd}${ap}` : `${hd}:${mn.toString().padStart(2, "0")}${ap}`;
};

// dateKey must be defined before recurrence helpers that reference it
const dateKey = d => {
  const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,"0"), day = String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${day}`;
};

const cloneDate     = d => new Date((d instanceof Date ? d : new Date(d)).getTime());
const addDaysSafe   = (date, days)   => { const d = cloneDate(date); d.setDate(d.getDate() + days); return d; };
const addMonthsSafe = (date, months) => { const d = cloneDate(date); d.setMonth(d.getMonth() + months); return d; };
const dayStart      = date => { const d = cloneDate(date); d.setHours(0,0,0,0); return d; };
const getEventsOnDay  = (evs, d) => evs.filter(e => sameDay(e.start, d)).sort((a, b) => a.start - b.start);
const weekStart = date => {
  const d = dayStart(date);
  const dow = d.getDay();
  d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
  return d;
};
const weekDays = date => Array.from({ length: 7 }, (_, i) => addDaysSafe(weekStart(date), i));
const monthDays = date => {
  const y = date.getFullYear(), m = date.getMonth();
  const startOffset = (new Date(y, m, 1).getDay() + 6) % 7;
  const count = new Date(y, m + 1, 0).getDate();
  const days = Array.from({ length: startOffset }, () => null);
  for (let d = 1; d <= count; d++) days.push(new Date(y, m, d));
  while (days.length % 7 !== 0) days.push(null);
  return days;
};
const getFreeBlocks   = (evs, d, ws = 9, we = 19) => {
  const de = getEventsOnDay(evs, d); const bl = []; let cur = ws * 60; const em = we * 60;
  for (const e of de) {
    const es = e.start.getHours() * 60 + e.start.getMinutes(), ee = e.end.getHours() * 60 + e.end.getMinutes();
    if (es > cur) bl.push({ start: cur, end: es });
    cur = Math.max(cur, ee);
  }
  if (cur < em) bl.push({ start: cur, end: em });
  return bl.filter(b => b.end - b.start >= 15);
};
const totalMins   = (evs, d) => getEventsOnDay(evs, d).reduce((a, e) => a + (e.end - e.start) / 60000, 0);
const hasConflict = (evs, ev) => evs.filter(e => e.id !== ev.id && sameDay(e.start, ev.start)).some(e => ev.start < e.end && ev.end > e.start);
const endOfDay = date => { const d = dayStart(date); d.setDate(d.getDate() + 1); return d; };
const eventOccursOnDay = (ev, day) => {
  if (!ev?.start || !ev?.end) return false;
  const s = ev.start instanceof Date ? ev.start : new Date(ev.start);
  const e = ev.end instanceof Date ? ev.end : new Date(ev.end);
  return s < endOfDay(day) && e > dayStart(day);
};
const isAllDayEvent = ev => Boolean(ev?.allDay);
const isMultiDayEvent = ev => ev?.start && ev?.end && !sameDay(ev.start, new Date(ev.end.getTime() - 1));
const isAllDayOrMulti = ev => isAllDayEvent(ev) || Boolean(ev?._continuesBefore || ev?._continuesAfter) || isMultiDayEvent(ev);
const eventSegmentForDay = (ev, day) => {
  const ds = dayStart(day), de = endOfDay(day);
  const s = ev.start < ds ? ds : ev.start;
  const e = ev.end > de ? de : ev.end;
  return { ...ev, start: s, end: e, _segmentDate: dateKey(day), _continuesBefore: ev.start < ds, _continuesAfter: ev.end > de };
};
const toDateInput = d => dateKey(d instanceof Date ? d : new Date(d));
const toTimeInputValue = d => d instanceof Date ? `${d.getHours().toString().padStart(2,"0")}:${d.getMinutes().toString().padStart(2,"0")}` : "";
const applyDateAndTime = (dateStr, timeStr = "00:00") => {
  const [y,m,d] = dateStr.split("-").map(Number);
  const [h,mi] = timeStr.split(":").map(Number);
  return new Date(y, m - 1, d, h || 0, mi || 0, 0, 0);
};
const taskDurationToMinutes = (amount, unit) => {
  const n = Math.max(1, Number(amount) || 1);
  if (unit === "days") return Math.round(n * 24 * 60);
  if (unit === "hours") return Math.round(n * 60);
  return Math.round(n);
};
const splitTaskDuration = mins => {
  const m = Math.max(1, Number(mins) || 30);
  if (m % 1440 === 0) return { amount: m / 1440, unit: "days" };
  if (m % 60 === 0) return { amount: m / 60, unit: "hours" };
  return { amount: m, unit: "minutes" };
};
const formatTaskDuration = mins => {
  const { amount, unit } = splitTaskDuration(mins);
  if (unit === "days") return `${amount}d`;
  if (unit === "hours") return `${amount}h`;
  return `${amount}min`;
};
const localDateFromKey = key => {
  if (!key || typeof key !== "string") return null;
  const [y, m, d] = key.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d, 0, 0, 0, 0);
};
const localDateFromMonthKey = key => {
  if (!key || typeof key !== "string") return null;
  const [y, m] = key.slice(0, 7).split("-").map(Number);
  if (!y || !m) return null;
  return new Date(y, m - 1, 1, 0, 0, 0, 0);
};
const monthKey = d => {
  const dt = d instanceof Date ? d : new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
};
const taskScopeOf = task => task?.scope || "day";
const taskAnchorDate = (task, fallbackDate = TODAY) => {
  const scope = taskScopeOf(task);

  // Strict task periods must always be anchored to the assigned period first.
  // Do not let deadline/completedDate shift a weekly/monthly recurring task.
  if (scope === "month") {
    const m = localDateFromMonthKey(task?.monthKey || task?.month || null);
    if (m) return m;
    return new Date(fallbackDate.getFullYear(), fallbackDate.getMonth(), 1, 0, 0, 0, 0);
  }

  if (scope === "week") {
    const wk = localDateFromKey(task?.weekKey || null);
    if (wk) return weekStart(wk);
    return weekStart(fallbackDate);
  }

  const raw = task?.taskDate || task?.dayKey || task?.dateKey || task?.scheduled || task?.deadline || task?.completedDate || null;
  const parsed = localDateFromKey(raw);
  if (parsed) return parsed;
  return dayStart(fallbackDate);
};
const taskDayKey = (task, fallbackDate = TODAY) => dateKey(taskAnchorDate(task, fallbackDate));
const taskWeekKey = (task, fallbackDate = TODAY) => {
  if (task?.weekKey) return dateKey(weekStart(localDateFromKey(task.weekKey) || taskAnchorDate(task, fallbackDate)));
  return dateKey(weekStart(taskAnchorDate(task, fallbackDate)));
};
const taskMonthKey = (task, fallbackDate = TODAY) => task?.monthKey || monthKey(taskAnchorDate(task, fallbackDate));
const taskPeriodPatchForScope = (scope, anchorDate = TODAY) => {
  const d = dayStart(anchorDate);
  if (scope === "week") return { taskDate: null, scheduled: null, weekKey: dateKey(weekStart(d)), monthKey: null };
  if (scope === "month") return { taskDate: null, scheduled: null, weekKey: null, monthKey: monthKey(d) };
  const key = dateKey(d);
  return { taskDate: key, scheduled: key, weekKey: null, monthKey: null };
};
const withTaskPeriod = (task, anchorDate = TODAY) => {
  const scope = taskScopeOf(task);
  const inferredAnchor = taskAnchorDate(task, anchorDate);
  return { ...task, scope, ...taskPeriodPatchForScope(scope, inferredAnchor) };
};
const normalizeTasks = tasks => Array.isArray(tasks) ? tasks.map(t => withTaskPeriod(t, TODAY)) : [];
const taskBelongsToPeriod = (task, scope, anchorDate = TODAY) => {
  const taskScope = taskScopeOf(task);
  if (taskScope !== scope) return false;
  if (scope === "week") return taskWeekKey(task) === dateKey(weekStart(anchorDate));
  if (scope === "month") return taskMonthKey(task) === monthKey(anchorDate);
  return taskDayKey(task) === dateKey(anchorDate);
};
const shiftTaskPeriodDate = (date, scope, delta) => {
  if (scope === "week") return addDaysSafe(date, delta * 7);
  if (scope === "month") return addMonthsSafe(date, delta);
  return addDaysSafe(date, delta);
};
const formatTaskPeriodLabel = (scope, date) => {
  if (scope === "week") {
    const start = weekStart(date);
    const end = addDaysSafe(start, 6);
    return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${end.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  }
  if (scope === "month") return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
};
const taskCompletionTargetKey = task => taskScopeOf(task) === "day" ? taskDayKey(task) : dateKey(new Date());
const taskHasCompletionStamp = task => Boolean(task?.completedDate || task?.completedAt || task?.doneAt || task?.completed_at);
const taskCompletedDateKey = task => {
  if (!task?.done) return null;
  if (task.completedDate) return task.completedDate;
  const completedAt = task.completedAt || task.doneAt || task.completed_at;
  if (completedAt) {
    const d = new Date(completedAt);
    return Number.isNaN(d.getTime()) ? null : dateKey(d);
  }
  return null;
};
const taskSeriesId = task => task?.parentTaskId || task?.seriesId || task?.id;
const taskPeriodIdentity = task => {
  const scope = taskScopeOf(task);
  if (scope === "week") return `week:${taskWeekKey(task)}`;
  if (scope === "month") return `month:${taskMonthKey(task)}`;
  return `day:${taskDayKey(task)}`;
};
const taskSkippedPeriods = task => new Set([...(task?.skippedTaskPeriods || []), ...(task?.recurrenceSkippedPeriods || [])]);
const taskSamePeriod = (a, b) => taskScopeOf(a) === taskScopeOf(b) && taskPeriodIdentity(a) === taskPeriodIdentity(b);
const taskExistsForPeriod = (tasks, root, probe) => {
  const rootSeries = taskSeriesId(root);
  return tasks.some(t => taskSeriesId(t) === rootSeries && taskSamePeriod(t, probe));
};
function makeRecurringTaskOccurrence(root, occurrenceDate, index) {
  const scope = taskScopeOf(root);
  const periodPatch = taskPeriodPatchForScope(scope, occurrenceDate);
  const probe = { ...root, ...periodPatch };
  const identity = taskPeriodIdentity(probe).replace(/[^a-z0-9]/gi, "-").toLowerCase();
  const dueDate = root.deadline ? recurrenceDateKey(occurrenceDate) : root.deadline;
  return {
    ...root,
    ...periodPatch,
    id: `t${uid()}_${identity}`,
    done: false,
    completedAt: null,
    completedDate: null,
    deadline: dueDate,
    parentTaskId: taskSeriesId(root),
    recurrenceIndex: index,
    generatedFromRecurrence: true,
  };
}
function taskOccurrenceFallsInPeriod(scope, occurrenceDate, anchorDate) {
  if (scope === "week") return dateKey(weekStart(occurrenceDate)) === dateKey(weekStart(anchorDate));
  if (scope === "month") return monthKey(occurrenceDate) === monthKey(anchorDate);
  return dateKey(occurrenceDate) === dateKey(anchorDate);
}
function ensureRecurringTasksForPeriod(tasks, scope, anchorDate = TODAY) {
  if (!Array.isArray(tasks) || !tasks.length) return tasks;
  const additions = [];
  const roots = tasks.filter(t => normalizeRecurrence(t.recurrence) && !t.parentTaskId && taskScopeOf(t) === scope);

  for (const root of roots) {
    const rec = normalizeRecurrence(root.recurrence);
    const start = taskAnchorDate(root, anchorDate);
    let cursor = dayStart(start);
    let index = 0;
    let safety = 0;

    while (cursor <= endOfDay(anchorDate) && safety++ < RECURRENCE_SAFETY_LIMIT) {
      if (taskOccurrenceFallsInPeriod(scope, cursor, anchorDate)) {
        const probe = { ...root, ...taskPeriodPatchForScope(scope, cursor) };
        const identity = taskPeriodIdentity(probe);
        if (!taskSkippedPeriods(root).has(identity) && shouldEmitOccurrence(root, cursor, rec, index) && !taskExistsForPeriod([...tasks, ...additions], root, probe)) {
          additions.push(makeRecurringTaskOccurrence(root, cursor, index));
        }
        // A week/month task should only appear once in that week/month even if a
        // daily recurrence could match multiple dates inside the same period.
        if (scope !== "day") break;
      }
      const next = stepRecurringDate(cursor, rec);
      if (!next || next <= cursor) break;
      cursor = next;
      index += 1;
    }
  }

  return additions.length ? [...tasks, ...additions] : tasks;
};
const completedTasksForDateKey = (tasks, key) => {
  const seen = new Set();
  const completed = [];
  const addUnique = task => {
    if (!task?.done || seen.has(task.id)) return;
    seen.add(task.id);
    completed.push(task);
  };

  tasks.forEach(t => {
    if (taskCompletedDateKey(t) === key) addUnique(t);
  });

  // Legacy compatibility: if an older completed Day task has no completion
  // timestamp, place it under the strict day it belongs to. This avoids global
  // completed tasks leaking into every journal date.
  tasks.forEach(t => {
    if (!t?.done || taskHasCompletionStamp(t)) return;
    if (taskScopeOf(t) === "day" && taskDayKey(t) === key) addUnique(t);
  });

  return completed;
};

// ─── Gamification helpers ────────────────────────────────────────────────────
const LEVEL_TITLES = [
  "Tiny Sprout", "Focus Bud", "Bloom Apprentice", "Tempo Keeper", "Rhythm Builder",
  "Flow Mage", "Calendar Guardian", "Productivity Queen", "Tempo Legend"
];
const XP_PER_LEVEL = 500;
const taskXPValue = task => {
  const pri = task?.priority === "high" ? 40 : task?.priority === "low" ? 15 : 25;
  const durationBonus = Math.min(30, Math.floor((Number(task?.duration) || 0) / 30) * 5);
  const recurringBonus = task?.recurrence || task?.parentTaskId ? 5 : 0;
  const bossBonus = task?.category === "boss" ? 20 : 0;
  return pri + durationBonus + recurringBonus + bossBonus;
};
const dateRangeKeys = (daysBack = 120, daysForward = 30) => {
  const keys = [];
  for (let i = -daysBack; i <= daysForward; i++) keys.push(dateKey(addDaysSafe(TODAY, i)));
  return keys;
};
const hasJournalEntryForKey = (journal, key) => {
  const e = journal?.[key];
  return Boolean(e?.mood || e?.note || e?.gratitude?.some(Boolean) || e?.photos?.length || e?.blocks?.length || e?.tags?.length || Object.values(e?.highlights || {}).some(Boolean));
};
const focusMinsForKey = (events, key) => events
  .filter(e => e?.start instanceof Date && eventOccursOnDay(e, localDateFromKey(key) || TODAY) && e.category === "deep")
  .reduce((sum, e) => sum + Math.max(0, (eventSegmentForDay(e, localDateFromKey(key) || TODAY).end - eventSegmentForDay(e, localDateFromKey(key) || TODAY).start) / 60000), 0);
const allDayTasksForKey = (tasks, key) => tasks.filter(t => taskScopeOf(t) === "day" && taskDayKey(t) === key);
const dailyGameSummary = (tasks, journal, events, date = TODAY) => {
  const key = typeof date === "string" ? date : dateKey(date);
  const dayTasks = allDayTasksForKey(tasks, key);
  const completed = completedTasksForDateKey(tasks, key);
  const highDone = completed.filter(t => t.priority === "high").length;
  const journalDone = hasJournalEntryForKey(journal, key);
  const focusMins = focusMinsForKey(events, key);
  const completionRatio = dayTasks.length ? Math.min(1, completed.length / dayTasks.length) : (completed.length ? 1 : 0);
  const allDone = dayTasks.length > 0 && dayTasks.every(t => t.done);
  const taskScore = Math.round(completionRatio * 40);
  const score = Math.min(100,
    taskScore +
    Math.min(15, highDone * 15) +
    (journalDone ? 15 : 0) +
    (focusMins >= 60 ? 15 : focusMins > 0 ? 8 : 0) +
    (allDone ? 15 : 0)
  );
  const rank = score >= 95 ? "S" : score >= 85 ? "A" : score >= 70 ? "B" : score >= 50 ? "C" : "D";
  return { key, dayTasks, completed, highDone, journalDone, focusMins, allDone, score, rank };
};
const productiveKeysFromData = (tasks, journal) => {
  const keys = new Set();
  tasks.forEach(t => {
    if (!t?.done) return;
    const k = taskCompletedDateKey(t) || (taskScopeOf(t) === "day" ? taskDayKey(t) : null);
    if (k) keys.add(k);
  });
  Object.keys(journal || {}).forEach(k => { if (hasJournalEntryForKey(journal, k)) keys.add(k); });
  return keys;
};
const focusKeysFromData = events => new Set(dateRangeKeys(120, 0).filter(k => focusMinsForKey(events, k) > 0));
const plannedTomorrowKeysFromData = tasks => {
  const keys = new Set();
  dateRangeKeys(120, 30).forEach(k => {
    const d = localDateFromKey(k) || TODAY;
    const tomorrowKey = dateKey(addDaysSafe(d, 1));
    if (allDayTasksForKey(tasks, tomorrowKey).length > 0) keys.add(k);
  });
  return keys;
};
const countBackwardStreak = keySet => {
  let count = 0;
  let d = new Date(TODAY);
  while (keySet.has(dateKey(d))) { count++; d = addDaysSafe(d, -1); }
  return count;
};
const buildDailyQuests = (tasks, journal, events, date = TODAY) => {
  const s = dailyGameSummary(tasks, journal, events, date);
  const quests = [
    { id: "three_tasks", icon: "✅", title: "Clear 3 tasks", desc: `${Math.min(s.completed.length, 3)}/3 completed`, done: s.completed.length >= 3, xp: 50 },
    { id: "priority", icon: "🎯", title: "Win 1 priority task", desc: `${Math.min(s.highDone, 1)}/1 high priority`, done: s.highDone >= 1, xp: 45 },
    { id: "journal", icon: "📔", title: "Write today’s journal", desc: s.journalDone ? "Entry saved" : "Reflect for the day", done: s.journalDone, xp: 35 },
    { id: "perfect_day", icon: "🌸", title: "Complete the day list", desc: s.dayTasks.length ? `${s.completed.length}/${s.dayTasks.length} day tasks` : "Add day tasks first", done: s.allDone, xp: 70 },
  ];
  return quests;
};
const buildWeeklyRecap = (tasks, journal, events, date = TODAY) => {
  const start = weekStart(date);
  const keys = Array.from({ length: 7 }, (_, i) => dateKey(addDaysSafe(start, i)));
  const summaries = keys.map(k => dailyGameSummary(tasks, journal, events, k));
  const weekTaskKey = dateKey(start);
  const weekTasks = tasks.filter(t =>
    (taskScopeOf(t) === "day" && keys.includes(taskDayKey(t))) ||
    (taskScopeOf(t) === "week" && taskWeekKey(t) === weekTaskKey)
  );
  const completed = weekTasks.filter(t => t.done || keys.includes(taskCompletedDateKey(t)));
  const highDone = completed.filter(t => t.priority === "high").length;
  const journalDays = keys.filter(k => hasJournalEntryForKey(journal, k)).length;
  const focusMins = summaries.reduce((sum, d) => sum + d.focusMins, 0);
  const avgScore = Math.round(summaries.reduce((sum, d) => sum + d.score, 0) / 7);
  const best = summaries.reduce((a, b) => b.score > a.score ? b : a, summaries[0]);
  const rank = avgScore >= 95 ? "S" : avgScore >= 85 ? "A" : avgScore >= 70 ? "B" : avgScore >= 50 ? "C" : "D";
  const bestDate = localDateFromKey(best.key) || TODAY;
  const byCat = completed.reduce((acc, t) => { acc[t.category] = (acc[t.category] || 0) + 1; return acc; }, {});
  const topCat = Object.entries(byCat).sort((a,b)=>b[1]-a[1])[0]?.[0] || null;
  return {
    label: formatTaskPeriodLabel("week", start),
    keys,
    tasksDone: completed.length,
    highDone,
    tasksTotal: weekTasks.length,
    journalDays,
    focusHours: Math.round(focusMins / 60 * 10) / 10,
    avgScore,
    rank,
    bestDayLabel: bestDate.toLocaleDateString("en-US", { weekday: "short" }),
    bestDayScore: best.score,
    topCategory: topCat,
    daily: summaries,
  };
};
const buildWeeklyMissions = (tasks, journal, events, date = TODAY) => {
  const recap = buildWeeklyRecap(tasks, journal, events, date);
  const start = weekStart(date);
  const days = Array.from({ length: 7 }, (_, i) => addDaysSafe(start, i));
  const capacity = Math.max(60, (_workEnd - _workStart) * 60);
  const calmDays = days.filter(d => totalMins(events, d) <= capacity * 0.8).length;
  const missions = [
    { id: "week_tasks", icon: "✅", title: "Clear 15 tasks", value: recap.tasksDone, goal: 15, unit: "tasks", xp: 120 },
    { id: "week_priority", icon: "🎯", title: "Win 5 priority tasks", value: recap.highDone, goal: 5, unit: "priority", xp: 110 },
    { id: "week_focus", icon: "🔮", title: "Protect 4h focus", value: recap.focusHours, goal: 4, unit: "hours", xp: 100 },
    { id: "week_journal", icon: "📔", title: "Journal 3 days", value: recap.journalDays, goal: 3, unit: "days", xp: 80 },
    { id: "week_balance", icon: "⚖️", title: "Keep 5 calm days", value: calmDays, goal: 5, unit: "days", xp: 90 },
  ];
  return missions.map(m => ({ ...m, done: m.value >= m.goal, pct: Math.min(100, Math.round((m.value / m.goal) * 100)), desc: `${Math.min(m.value, m.goal)}/${m.goal} ${m.unit}` }));
};
const buildCombos = (tasks, journal, events, streaks = {}) => {
  const today = dailyGameSummary(tasks, journal, events, TODAY);
  const hasStampedEarlyClear = today.allDone && today.completed.length > 0 && today.completed.every(t => {
    const completedAt = t.completedAt || t.doneAt || t.completed_at;
    if (!completedAt) return false;
    const d = new Date(completedAt);
    return !Number.isNaN(d.getTime()) && d.getHours() < 18;
  });
  const combos = [
    { id: "triple", icon: "✨", title: "3x Task Combo", desc: "Complete 3 tasks today", done: today.completed.length >= 3, xp: 60 },
    { id: "flow", icon: "🌊", title: "Flow Combo", desc: "Task + focus + journal", done: today.completed.length > 0 && today.focusMins > 0 && today.journalDone, xp: 75 },
    { id: "priority", icon: "🎯", title: "Power Start", desc: "Clear a priority task", done: today.highDone >= 1, xp: 50 },
    { id: "early", icon: "🌤️", title: "Early Clear", desc: "Finish day list before 6pm", done: hasStampedEarlyClear, xp: 80 },
    { id: "streak", icon: "🔥", title: "Streak Spark", desc: "Keep the bloom alive", done: (streaks.productive || 0) >= 3, xp: 65 },
  ];
  return combos;
};
const buildBossBattles = tasks => {
  const bosses = tasks
    .filter(t => !t.done && t.category === "boss")
    .sort((a,b) => Number(b.duration || 0) - Number(a.duration || 0) || (b.priority === "high") - (a.priority === "high"))
    .slice(0, 5)
    .map(t => {
      const hp = Math.max(30, Number(t.duration) || 60);
      return {
        id: t.id,
        title: t.title,
        icon: "🐉",
        hp,
        remaining: hp,
        pct: 0,
        scope: taskScopeOf(t),
        period: formatTaskPeriodLabel(taskScopeOf(t), taskAnchorDate(t, TODAY)),
        rewardXP: taskXPValue(t) + 40,
      };
    });
  return bosses;
};
const buildPersonalLeaderboard = (tasks, journal, events) => dateRangeKeys(120, 0)
  .map(k => dailyGameSummary(tasks, journal, events, k))
  .filter(s => s.completed.length || s.journalDone || s.focusMins > 0 || s.score > 0)
  .sort((a,b) => b.score - a.score || b.completed.length - a.completed.length || b.focusMins - a.focusMins)
  .slice(0, 5)
  .map((s, i) => ({ ...s, place: i + 1, label: (localDateFromKey(s.key) || TODAY).toLocaleDateString("en-US", { month: "short", day: "numeric" }) }));
const buildProductivityPersonality = (tasks, journal, events, skills) => {
  const completed = tasks.filter(t => t.done);
  const avgDur = completed.length ? completed.reduce((sum,t)=>sum + (Number(t.duration) || 0), 0) / completed.length : 0;
  const sorted = [...(skills || [])].sort((a,b) => b.points - a.points);
  const top = sorted[0]?.id || "balance";
  if (completed.length >= 10 && avgDur <= 45) return { icon: "⚡", type: "Task Sprinter", desc: "You build momentum through many quick wins." };
  if (top === "focus") return { icon: "🔮", type: "Deep Work Fairy", desc: "Your power comes from protected focus blocks." };
  if (top === "execution") return { icon: "🎯", type: "Deadline Warrior", desc: "You shine when important work needs to move." };
  if (top === "reflection") return { icon: "📔", type: "Calm Planner", desc: "You grow through reflection and intentional planning." };
  if (top === "discipline") return { icon: "🔥", type: "Rhythm Keeper", desc: "Your strength is showing up consistently." };
  if (top === "wellness" || top === "balance") return { icon: "🌿", type: "Balance Keeper", desc: "You are building a healthier rhythm across life and work." };
  return { icon: "🌸", type: "Bloom Builder", desc: "Your productivity style is still blooming." };
};
const buildBadges = (tasks, journal, events, weekly, streaks) => {
  const completed = tasks.filter(t => t.done);
  const journalCount = Object.keys(journal || {}).filter(k => hasJournalEntryForKey(journal, k)).length;
  const productiveStreak = streaks?.productive ?? countBackwardStreak(productiveKeysFromData(tasks, journal));
  const taskStreak = streaks?.tasks ?? 0;
  const focusStreak = streaks?.focus ?? 0;
  const planningStreak = streaks?.planning ?? 0;
  const todayScore = dailyGameSummary(tasks, journal, events, TODAY).score;
  const deepDone = completed.filter(t => t.category === "deep").length;
  const bossDone = completed.filter(t => t.category === "boss").length;
  const highDone = completed.filter(t => t.priority === "high").length;
  const recurringDone = completed.filter(t => t.recurrence || t.parentTaskId).length;
  const focusDays = dateRangeKeys(120, 0).filter(k => focusMinsForKey(events, k) > 0).length;
  const perfectDays = dateRangeKeys(120, 0).filter(k => dailyGameSummary(tasks, journal, events, k).score >= 95).length;
  const activeGardenDays = buildMonthlyLifeGarden(tasks, journal, events, TODAY).activeDays;
  const tomorrowPlanned = allDayTasksForKey(tasks, dateKey(addDaysSafe(TODAY, 1))).length > 0;
  return [
    { id: "first_bloom", icon: "🌸", name: "First Bloom", desc: "Complete your first task", unlocked: completed.length >= 1 },
    { id: "triple_spark", icon: "✨", name: "Triple Spark", desc: "Complete 3 tasks", unlocked: completed.length >= 3 },
    { id: "priority_hero", icon: "🎯", name: "Priority Hero", desc: "Complete a high-priority task", unlocked: highDone >= 1 },
    { id: "journal_keeper", icon: "📔", name: "Journal Keeper", desc: "Write 7 journal entries", unlocked: journalCount >= 7 },
    { id: "streak_starter", icon: "🔥", name: "Streak Starter", desc: "Stay productive for 3 days", unlocked: productiveStreak >= 3 },
    { id: "on_fire", icon: "🔥", name: "On Fire", desc: "Complete tasks 3 days in a row", unlocked: taskStreak >= 3 },
    { id: "focus_fairy", icon: "🧚", name: "Focus Fairy", desc: "Create 10 focus days", unlocked: focusDays >= 10 || focusStreak >= 5 },
    { id: "deep_work_mage", icon: "🔮", name: "Deep Work Mage", desc: "Complete 10 deep work tasks", unlocked: deepDone >= 10 },
    { id: "boss_slayer", icon: "🐉", name: "Boss Slayer", desc: "Complete 3 boss battle tasks", unlocked: bossDone >= 3 },
    { id: "habit_charm", icon: "🔁", name: "Habit Charm", desc: "Complete 5 recurring tasks", unlocked: recurringDone >= 5 },
    { id: "night_planner", icon: "🌙", name: "Night Planner", desc: "Plan tomorrow’s day tasks", unlocked: tomorrowPlanned || planningStreak >= 2 },
    { id: "perfect_day", icon: "🏆", name: "Perfect Day", desc: "Score 95+ in a day", unlocked: todayScore >= 95 || perfectDays >= 1 },
    { id: "perfect_week", icon: "💫", name: "Perfect Week", desc: "Reach A-rank weekly average", unlocked: (weekly?.avgScore || 0) >= 85 },
    { id: "garden_guardian", icon: "🌼", name: "Garden Guardian", desc: "Grow 15 active garden days", unlocked: activeGardenDays >= 15 },
    { id: "consistency_gem", icon: "💎", name: "Consistency Gem", desc: "Stay productive for 30 days", unlocked: productiveStreak >= 30 },
  ];
};
const skillRank = points => {
  const level = Math.max(1, Math.floor(points / 100) + 1);
  const pct = Math.min(100, Math.round((points % 100)));
  return { level, pct };
};
const buildSkillStats = (tasks, journal, events) => {
  const completed = tasks.filter(t => t.done);
  const completedByCategory = id => completed.filter(t => t.category === id).length;
  const journalCount = Object.keys(journal || {}).filter(k => hasJournalEntryForKey(journal, k)).length;
  const focusHours = dateRangeKeys(120, 0).reduce((sum, k) => sum + focusMinsForKey(events, k), 0) / 60;
  const recurringDone = completed.filter(t => t.recurrence || t.parentTaskId).length;
  const highDone = completed.filter(t => t.priority === "high").length;
  const productiveStreak = countBackwardStreak(productiveKeysFromData(tasks, journal));
  const raw = [
    { id: "focus", icon: "🔮", label: "Focus", desc: "Deep work and focus blocks", points: completedByCategory("deep") * 22 + Math.round(focusHours * 12) },
    { id: "discipline", icon: "🔥", label: "Discipline", desc: "Recurring tasks and streaks", points: recurringDone * 24 + productiveStreak * 18 },
    { id: "wellness", icon: "🌿", label: "Wellness", desc: "Health and personal reset", points: completedByCategory("health") * 26 + completedByCategory("personal") * 10 },
    { id: "balance", icon: "⚖️", label: "Balance", desc: "Personal/admin life balance", points: completedByCategory("personal") * 18 + completedByCategory("admin") * 14 },
    { id: "execution", icon: "🎯", label: "Execution", desc: "Priority and boss tasks completed", points: highDone * 30 + completedByCategory("boss") * 28 + completed.length * 6 },
    { id: "reflection", icon: "📔", label: "Reflection", desc: "Journal consistency", points: journalCount * 28 },
  ];
  return raw.map(s => ({ ...s, ...skillRank(s.points) }));
};
const MASCOT_STAGES = [
  { minLevel: 1,  emoji: "☁️", name: "Tiny Cloud",      note: "Every task gives your little cloud more sparkle." },
  { minLevel: 3,  emoji: "🌱", name: "Sprout Cloud",    note: "Your routine is starting to grow roots." },
  { minLevel: 6,  emoji: "🌸", name: "Bloom Cloud",     note: "You are turning small wins into a real rhythm." },
  { minLevel: 10, emoji: "✨", name: "Glow Cloud",      note: "Your consistency is becoming visible." },
  { minLevel: 15, emoji: "👑", name: "Crowned Cloud",   note: "You are protecting your focus like a pro." },
  { minLevel: 25, emoji: "🪄", name: "Tempo Wizard",    note: "Your calendar magic is getting powerful." },
  { minLevel: 40, emoji: "🏰", name: "Tempo Legend",    note: "Your productivity kingdom is fully alive." },
];
const buildMascotProgression = (level, streaks) => {
  let stageIndex = 0;
  for (let i = 0; i < MASCOT_STAGES.length; i++) if (level >= MASCOT_STAGES[i].minLevel) stageIndex = i;
  const current = MASCOT_STAGES[stageIndex];
  const next = MASCOT_STAGES[stageIndex + 1] || null;
  const toNext = next ? Math.max(0, next.minLevel - level) : 0;
  const stageStart = current.minLevel;
  const stageEnd = next?.minLevel || Math.max(level + 1, current.minLevel + 1);
  const stagePct = next ? Math.min(100, Math.round(((level - stageStart) / (stageEnd - stageStart)) * 100)) : 100;
  const mood = streaks?.productive >= 7 ? "glowing" : streaks?.productive >= 3 ? "happy" : "gentle";
  const reaction = streaks?.productive >= 7 ? "You’re glowing this week ✨" : streaks?.productive >= 3 ? "Tiny cloud is proud of your rhythm 🌸" : "One gentle win is enough to start blooming 🌱";
  return { ...current, nextName: next?.name || "Max Stage", toNext, stagePct, mood, reaction };
};
const THEME_UNLOCK_RULES = {
  "tempo":      { unlocked: () => true, label: "Starter theme" },
  "pink-white": { unlocked: () => true, label: "Starter theme" },
  "ocean":      { unlocked: m => m.focusHours >= 3 || m.level >= 5, label: "Unlock: 3h focus or Level 5" },
  "sunset":     { unlocked: m => m.productiveStreak >= 3 || m.level >= 8, label: "Unlock: 3-day streak or Level 8" },
  "forest":     { unlocked: m => m.wellnessTasks >= 5 || m.level >= 10, label: "Unlock: 5 wellness tasks or Level 10" },
  "mono":       { unlocked: m => m.unlockedBadges >= 4 || m.level >= 12, label: "Unlock: 4 badges or Level 12" },
};
const buildThemeUnlocksForStats = metrics => THEMES.map(t => {
  const rule = THEME_UNLOCK_RULES[t.id] || { unlocked: () => true, label: "Unlocked" };
  const unlocked = Boolean(rule.unlocked(metrics));
  return { id: t.id, label: t.label, unlocked, reason: unlocked ? "Unlocked" : rule.label };
});
const buildMonthlyLifeGarden = (tasks, journal, events, date = TODAY) => {
  const year = date.getFullYear(), month = date.getMonth();
  const days = monthDays(date);
  const todayKey = dateKey(TODAY);
  const cells = days.map(day => {
    if (!day) return null;
    const key = dateKey(day);
    const summary = dailyGameSummary(tasks, journal, events, key);
    const future = key > todayKey;
    let bloom = "·", className = "empty";
    if (future) { bloom = "·"; className = "future"; }
    else if (summary.score >= 95) { bloom = "🌟"; className = "gold"; }
    else if (summary.score >= 85) { bloom = "🌺"; className = "big"; }
    else if (summary.score >= 70) { bloom = "🌸"; className = "bloom"; }
    else if (summary.score >= 50) { bloom = "🌷"; className = "bud"; }
    else if (summary.completed.length || summary.journalDone || summary.focusMins > 0) { bloom = "🌱"; className = "sprout"; }
    return { key, day: day.getDate(), bloom, className, score: summary.score, rank: summary.rank, completed: summary.completed.length, journalDone: summary.journalDone };
  });
  const activeDays = cells.filter(Boolean).filter(c => !["empty","future"].includes(c.className)).length;
  const goldenDays = cells.filter(Boolean).filter(c => c.className === "gold").length;
  return { label: new Date(year, month, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" }), cells, activeDays, goldenDays };
};
const calculateGameStats = (tasks, journal, events) => {
  const completed = tasks.filter(t => t.done);
  const journalCount = Object.keys(journal || {}).filter(k => hasJournalEntryForKey(journal, k)).length;
  const todayQuests = buildDailyQuests(tasks, journal, events, TODAY);
  const productiveStreak = countBackwardStreak(productiveKeysFromData(tasks, journal));
  const journalKeySet = new Set(Object.keys(journal || {}).filter(k => hasJournalEntryForKey(journal, k)));
  const taskKeySet = new Set(completed.map(t => taskCompletedDateKey(t) || (taskScopeOf(t) === "day" ? taskDayKey(t) : null)).filter(Boolean));
  const focusKeySet = focusKeysFromData(events);
  const planningKeySet = plannedTomorrowKeysFromData(tasks);
  const streaks = {
    productive: productiveStreak,
    tasks: countBackwardStreak(taskKeySet),
    journal: countBackwardStreak(journalKeySet),
    focus: countBackwardStreak(focusKeySet),
    review: countBackwardStreak(journalKeySet),
    planning: countBackwardStreak(planningKeySet),
  };
  const skills = buildSkillStats(tasks, journal, events);
  const weekly = buildWeeklyRecap(tasks, journal, events, TODAY);
  const weeklyMissions = buildWeeklyMissions(tasks, journal, events, TODAY);
  const combos = buildCombos(tasks, journal, events, streaks);
  const badges = buildBadges(tasks, journal, events, weekly, streaks);
  const focusHours = Math.round(dateRangeKeys(120, 0).reduce((sum, k) => sum + focusMinsForKey(events, k), 0) / 60 * 10) / 10;
  const taskXP = completed.reduce((sum, t) => sum + taskXPValue(t), 0);
  const journalXP = journalCount * 30;
  const questXP = todayQuests.filter(q => q.done).reduce((sum, q) => sum + q.xp, 0);
  const missionXP = weeklyMissions.filter(m => m.done).reduce((sum, m) => sum + m.xp, 0);
  const comboXP = combos.filter(c => c.done).reduce((sum, c) => sum + c.xp, 0);
  const badgeXP = badges.filter(b => b.unlocked).length * 75;
  const totalXP = taskXP + journalXP + questXP + missionXP + comboXP + badgeXP;
  const level = Math.floor(totalXP / XP_PER_LEVEL) + 1;
  const xpIntoLevel = totalXP % XP_PER_LEVEL;
  const title = LEVEL_TITLES[Math.min(LEVEL_TITLES.length - 1, Math.floor((level - 1) / 3))];
  const metrics = {
    level,
    productiveStreak,
    focusHours,
    wellnessTasks: completed.filter(t => t.category === "health" || t.category === "personal").length,
    unlockedBadges: badges.filter(b => b.unlocked).length,
  };
  return {
    totalXP, level, xpIntoLevel, nextXP: XP_PER_LEVEL, title,
    levelPct: Math.round((xpIntoLevel / XP_PER_LEVEL) * 100),
    today: dailyGameSummary(tasks, journal, events, TODAY),
    quests: todayQuests,
    weeklyMissions,
    combos,
    bossBattles: buildBossBattles(tasks),
    leaderboard: buildPersonalLeaderboard(tasks, journal, events),
    personality: buildProductivityPersonality(tasks, journal, events, skills),
    badges,
    unlockedBadges: badges.filter(b => b.unlocked),
    streaks,
    skills,
    weekly,
    mascot: buildMascotProgression(level, streaks),
    themeUnlocks: buildThemeUnlocksForStats(metrics),
    lifeGarden: buildMonthlyLifeGarden(tasks, journal, events, TODAY),
    xpBreakdown: { taskXP, journalXP, questXP, missionXP, comboXP, badgeXP },
  };
};
const createCategoryId = label => (label || "category").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,24) || `cat-${uid()}`;
const isRecurringEvent = ev => Boolean(normalizeRecurrence(ev?.recurrence));

const uid = () => (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 10);
let _workStart = 9, _workEnd = 19;
const setWorkHoursCtx = (ws, we) => { _workStart = ws; _workEnd = we; };
const freeBlocks = (evs, d) => getFreeBlocks(evs, d, _workStart, _workEnd);

// ─── Persistence ─────────────────────────────────────────────────────────────
const SER  = (_, v) => v instanceof Date ? { __d: v.toISOString() } : v;
const DES  = (_, v) => v && v.__d ? new Date(v.__d) : v;
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v, SER)); } catch {} };
const load = (k, fb) => { try { const r = localStorage.getItem(k); return r ? JSON.parse(r, DES) : fb; } catch { return fb; } };

// Guarantee event dates are always real Date objects regardless of source
// (localStorage JSON, Supabase JSONB, or in-memory — all can drift to strings)
const reviveEvents = evs => evs.map(e => ({
  ...e,
  start: e.start instanceof Date ? e.start : new Date(e.start?.__d ?? e.start),
  end:   e.end   instanceof Date ? e.end   : new Date(e.end?.__d   ?? e.end),
}));

const normalizeRecurrence = recurrence => {
  if (!recurrence) return null;
  if (typeof recurrence === "string") return { frequency: recurrence, interval: 1, endMode: "never" };
  return { interval: 1, endMode: "never", ...recurrence };
};
const recurrenceDateKey = d => dateKey(dayStart(d));
const recurrenceEndDate = rec => rec?.endDate || rec?.until || null;
const recurrenceSkippedDates = rec => new Set([...(rec?.skippedDates || []), ...(rec?.exceptions || [])]);
const occurrenceId = (eventId, date) => `${eventId}_r_${recurrenceDateKey(date)}`;
const getBaseEventId = id => String(id).includes("_r_") ? String(id).split("_r_")[0] : id;
const isOccurrence = ev => Boolean(ev?._recurring || ev?._baseId || String(ev?.id || "").includes("_r_"));
const stripOccurrenceMeta = ev => {
  const { _recurring, _baseId, _occurrenceDate, _originalStart, _originalEnd, _segmentDate, _continuesBefore, _continuesAfter, ...base } = ev;
  return base;
};
function stepRecurringDate(date, rec) {
  const r = normalizeRecurrence(rec);
  const freq = r?.frequency || r?.type || r;
  const interval = Math.max(1, Number(r?.interval || 1));
  if (freq === "daily") return addDaysSafe(date, interval);
  if (freq === "weekly") return addDaysSafe(date, 7 * interval);
  if (freq === "weekdays") {
    let d = addDaysSafe(date, 1);
    while (d.getDay() === 0 || d.getDay() === 6) d = addDaysSafe(d, 1);
    return d;
  }
  if (freq === "monthly") return addMonthsSafe(date, interval);
  return null;
}
function weeksBetween(a, b) {
  return Math.floor((dayStart(b) - dayStart(a)) / (7 * 86400000));
}
function shouldEmitOccurrence(baseEvent, occurrenceDate, rec, index) {
  const r = normalizeRecurrence(rec);
  if (!r) return false;
  const key = recurrenceDateKey(occurrenceDate);
  const skipped = recurrenceSkippedDates(r);
  if (skipped.has(key)) return false;
  const end = recurrenceEndDate(r);
  if (end && dayStart(occurrenceDate) > dayStart(new Date(end))) return false;
  if (r.count && index >= Number(r.count)) return false;
  if (r.frequency === "weekly" && Array.isArray(r.byWeekdays) && r.byWeekdays.length) {
    if (!r.byWeekdays.includes(occurrenceDate.getDay())) return false;
    const wk = weeksBetween(baseEvent.start, occurrenceDate);
    if (wk % Math.max(1, Number(r.interval || 1)) !== 0) return false;
  }
  return true;
}
function applyOccurrenceExceptions(baseEvent, occurrence) {
  const key = recurrenceDateKey(occurrence.start);
  const modified = baseEvent.recurrenceModified?.[key] || baseEvent.modifiedOccurrences?.[key];
  if (!modified) return occurrence;
  return {
    ...occurrence,
    ...modified,
    id: occurrence.id,
    start: modified.start instanceof Date ? modified.start : new Date(modified.start),
    end: modified.end instanceof Date ? modified.end : new Date(modified.end),
    _recurring: true,
    _baseId: baseEvent.id,
    _occurrenceDate: key,
  };
}
function deleteSingleOccurrence(baseEvent, occurrenceDate) {
  const rec = normalizeRecurrence(baseEvent.recurrence) || {};
  const key = recurrenceDateKey(occurrenceDate);
  const skippedDates = [...new Set([...(rec.skippedDates || []), ...(rec.exceptions || []), key])];
  return { ...baseEvent, recurrence: { ...rec, skippedDates } };
}
function modifySingleOccurrence(baseEvent, occurrenceDate, patch) {
  const key = recurrenceDateKey(occurrenceDate);
  return {
    ...baseEvent,
    recurrenceModified: {
      ...(baseEvent.recurrenceModified || baseEvent.modifiedOccurrences || {}),
      [key]: {
        ...stripOccurrenceMeta(patch),
        start: patch.start,
        end: patch.end,
      },
    },
  };
}
function createFollowingSeries(baseEvent, occurrenceDate, patch = {}) {
  const rec = normalizeRecurrence(baseEvent.recurrence);
  if (!rec) return [baseEvent];
  const splitStart = cloneDate(occurrenceDate);
  const prevUntil = addDaysSafe(dayStart(splitStart), -1);
  const original = { ...baseEvent, recurrence: { ...rec, until: dateKey(prevUntil), endMode: "on" } };
  const nextStart = patch.start ? cloneDate(patch.start) : cloneDate(splitStart);
  const duration = baseEvent.end - baseEvent.start;
  const nextEnd = patch.end ? cloneDate(patch.end) : new Date(nextStart.getTime() + duration);
  const following = {
    ...baseEvent,
    ...stripOccurrenceMeta(patch),
    id: "e" + uid(),
    start: nextStart,
    end: nextEnd,
    recurrence: rec,
    recurrenceModified: {},
  };
  return [original, following];
}
function createNextRecurringTask(task, allTasks) {
  const rec = normalizeRecurrence(task.recurrence);
  if (!rec) return null;
  const currentDate = taskAnchorDate(task, TODAY);
  const nextDate = stepRecurringDate(currentDate, rec);
  if (!nextDate) return null;
  const nextIndex = Number(task.recurrenceIndex || 0) + 1;
  if (!shouldEmitOccurrence(task, nextDate, rec, nextIndex)) return null;
  const probe = { ...task, ...taskPeriodPatchForScope(taskScopeOf(task), nextDate) };
  if (taskSkippedPeriods(task).has(taskPeriodIdentity(probe))) return null;
  if (taskExistsForPeriod(allTasks, task, probe)) return null;
  return makeRecurringTaskOccurrence(task, nextDate, nextIndex);
}
// Given the stored base events, expand recurring ones into a visible window.
function expandRecurring(baseEvents, windowStart = addDaysSafe(TODAY, -RECURRENCE_WINDOW_DAYS), windowEnd = addDaysSafe(TODAY, RECURRENCE_WINDOW_DAYS)) {
  const result = [];
  const winStart = dayStart(windowStart);
  const winEnd   = endOfDay(windowEnd);

  for (const ev of baseEvents) {
    const rec = normalizeRecurrence(ev.recurrence);
    if (ev.start < winEnd && ev.end > winStart) {
      if (rec) {
        if (shouldEmitOccurrence(ev, ev.start, rec, 0)) result.push(applyOccurrenceExceptions(ev, { ...ev, _occurrenceDate: recurrenceDateKey(ev.start) }));
      } else {
        result.push(ev);
      }
    }
    if (!rec) continue;
    const dur = ev.end - ev.start; // ms

    if (rec.frequency === "weekly" && Array.isArray(rec.byWeekdays) && rec.byWeekdays.length) {
      let cursor = dayStart(ev.start);
      let index = 0;
      while (cursor < winStart) { cursor = addDaysSafe(cursor, 1); index += 1; }
      let safety = 0;
      while (cursor <= winEnd && safety++ < RECURRENCE_SAFETY_LIMIT) {
        if (!sameDay(cursor, ev.start) && shouldEmitOccurrence(ev, cursor, rec, index)) {
          const start = cloneDate(cursor);
          start.setHours(ev.start.getHours(), ev.start.getMinutes(), 0, 0);
          const end = new Date(start.getTime() + dur);
          result.push(applyOccurrenceExceptions(ev, {
            ...ev,
            id: occurrenceId(ev.id, cursor),
            start,
            end,
            _recurring: true,
            _baseId: ev.id,
            _occurrenceDate: recurrenceDateKey(cursor),
            _originalStart: start,
            _originalEnd: end,
          }));
        }
        cursor = addDaysSafe(cursor, 1);
        index += 1;
      }
      continue;
    }

    let cursor = cloneDate(ev.start);
    let index = 0;
    while (cursor < winStart) {
      const next = stepRecurringDate(cursor, rec);
      if (!next) break;
      cursor = next;
      index += 1;
    }

    let safety = 0;
    while (cursor <= winEnd && safety++ < RECURRENCE_SAFETY_LIMIT) {
      if (!sameDay(cursor, ev.start) && shouldEmitOccurrence(ev, cursor, rec, index)) {
        const start = cloneDate(cursor);
        const end   = new Date(start.getTime() + dur);
        result.push(applyOccurrenceExceptions(ev, {
          ...ev,
          id: occurrenceId(ev.id, cursor),
          start,
          end,
          _recurring: true,
          _baseId: ev.id,
          _occurrenceDate: recurrenceDateKey(cursor),
          _originalStart: start,
          _originalEnd: end,
        }));
      }
      const next = stepRecurringDate(cursor, rec);
      if (!next) break;
      cursor = next;
      index += 1;
    }
  }
  return result;
}



// ─── Seed data ────────────────────────────────────────────────────────────────
// Seed events — relative to real today so demo data is always current
const _t = (h, m, offsetDays = 0) => { const d = new Date(); d.setDate(d.getDate() + offsetDays); d.setHours(h, m, 0, 0); return d; };
const INIT_EVENTS = [
  { id:"e1", title:"Team Standup",    start:_t(9,0),   end:_t(9,30),  calendar:"work",     category:"meeting",  fixed:true,  color:null, notes:"",                   recurrence:null    },
  { id:"e2", title:"Deep Work",       start:_t(10,0),  end:_t(12,0),  calendar:"work",     category:"deep",     fixed:false, color:null, notes:"Focus on top priority",recurrence:null   },
  { id:"e3", title:"Lunch",           start:_t(12,0),  end:_t(13,0),  calendar:"personal", category:"personal", fixed:true,  color:null, notes:"",                   recurrence:null    },
  { id:"e4", title:"Client Call",     start:_t(14,0),  end:_t(15,0),  calendar:"work",     category:"meeting",  fixed:true,  color:null, notes:"",                   recurrence:null    },
  { id:"e5", title:"Review & Admin",  start:_t(15,15), end:_t(16,15), calendar:"work",     category:"admin",    fixed:false, color:null, notes:"",                   recurrence:null    },
  { id:"e6", title:"Gym",             start:_t(18,0),  end:_t(19,0),  calendar:"personal", category:"health",   fixed:false, color:null, notes:"",                   recurrence:"daily" },
  { id:"e7", title:"Weekly Planning", start:_t(9,0,1), end:_t(10,0,1),calendar:"work",     category:"deep",     fixed:false, color:null, notes:"",                   recurrence:"weekly"},
];

const _deadline = (daysFromNow) => { const d = new Date(); d.setDate(d.getDate() + daysFromNow); return dateKey(d); };
const INIT_TASKS = [
  { id:"t1", title:"Prepare Q3 budget slides", duration:90,  category:"deep",  scope:"week",  done:false, deadline:_deadline(2),  priority:"high",   notes:"Slides 1-12",   scheduled:null },
  { id:"t2", title:"Reply to vendor emails",   duration:30,  category:"admin", scope:"day",   done:false, deadline:null,          priority:"medium", notes:"",              scheduled:null },
  { id:"t3", title:"Read product brief",       duration:45,  category:"deep",  scope:"day",   done:false, deadline:null,          priority:"medium", notes:"Section 3 & 4", scheduled:null },
  { id:"t4", title:"Book flights for offsite", duration:20,  category:"admin", scope:"week",  done:true,  deadline:null,          priority:"low",    notes:"",              scheduled:null },
  { id:"t5", title:"Performance review",       duration:120, category:"deep",  scope:"month", done:false, deadline:_deadline(14), priority:"high",   notes:"Cover Q1+Q2",   scheduled:null },
];

const hasStoredUserData = uk => Boolean(load(`${uk}_ev`, null) || load(`${uk}_tk`, null) || load(`${uk}_journal`, null));
const loadStoredEventsOrSeed = uk => reviveEvents(load(`${uk}_ev`, null) ?? INIT_EVENTS);
const loadStoredTasksOrSeed = uk => normalizeTasks(load(`${uk}_tk`, null) ?? INIT_TASKS);

// ─── NLP helpers ──────────────────────────────────────────────────────────────
function parseTimeStr(s, contextHint) {
  // contextHint: "am" | "pm" | null — used when no meridiem is explicit
  s = s.trim().toLowerCase().replace(/\./g, ":"); // normalise 1.30pm → 1:30pm
  if (s === "noon")     return { h: 12, m: 0 };
  if (s === "midnight") return { h: 0,  m: 0 };
  const mt = s.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/);
  if (!mt) return null;
  let h = parseInt(mt[1]); const mn = parseInt(mt[2] || "0");
  let mer = mt[3] || contextHint || null;
  // Infer meridiem: hours 1-6 with no marker are almost always PM in scheduling context
  if (!mer) {
    if (h >= 1 && h <= 6)  mer = "pm";
    else if (h >= 7 && h <= 11) mer = "am";
    // 12 stays as noon (pm)
  }
  if (mer === "pm" && h !== 12) h += 12;
  if (mer === "am" && h === 12) h = 0;
  return { h, m: mn };
}
// Parse a time range string like "1.30pm to 3pm" or "13:30-15:00"
function parseTimeRange(s) {
  const norm = s.trim().toLowerCase().replace(/\./g, ":");
  const rangeRe = /(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*(?:to|-|–|until)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i;
  const m = norm.match(rangeRe);
  if (!m) return null;
  // Determine end meridiem first so we can infer start meridiem
  const endMer = (m[2].match(/am|pm/i) || [])[0] || null;
  const startMer = (m[1].match(/am|pm/i) || [])[0] || null;
  const end   = parseTimeStr(m[2], endMer);
  const start = parseTimeStr(m[1], startMer || endMer); // inherit end's meridiem if start has none
  if (!start || !end) return null;
  return { start, end };
}
function parseDur(s) {
  s = s.trim().toLowerCase();
  const hm = s.match(/(\d+(?:\.\d+)?)\s*h(?:our)?s?/), mm = s.match(/(\d+)\s*m(?:in(?:ute)?s?)?/);
  let t = 0;
  if (hm) t += parseFloat(hm[1]) * 60;
  if (mm) t += parseInt(mm[1]);
  return t > 0 ? Math.round(t) : null;
}
function parseDateRef(s, base) {
  s = s.trim().toLowerCase();
  const d = new Date(base);
  if (s === "today") return d;
  if (s === "tomorrow") { d.setDate(d.getDate() + 1); return d; }
  const days = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
  const idx = days.indexOf(s);
  if (idx !== -1) {
    const cur = d.getDay();
    // diff < 0 (not <=) so that "schedule on Monday" when today IS Monday means today, not next week
    let diff = idx - cur;
    if (diff < 0) diff += 7;
    d.setDate(d.getDate() + diff);
    return d;
  }
  return null;
}
function parseDateMention(raw, base = TODAY) {
  const m = raw.toLowerCase().match(/\b(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/);
  return m ? parseDateRef(m[1], base) : null;
}
function parseDayWindow(raw) {
  const msg = raw.toLowerCase();
  if (/\bmorning\b/.test(msg)) return { label: "morning", start: 9 * 60, end: 12 * 60 };
  if (/\bafternoon\b/.test(msg)) return { label: "afternoon", start: 13 * 60, end: 17 * 60 };
  if (/\bevening\b/.test(msg)) return { label: "evening", start: 17 * 60, end: 19 * 60 };
  if (/\bdeep focus|focus time|deep work\b/.test(msg)) return { label: "focus block", start: 9 * 60, end: 17 * 60 };
  return null;
}
function fitFreeSlot(events, date, window, duration) {
  const blocks = freeBlocks(events, date).map(b => ({
    start: Math.max(b.start, window.start),
    end: Math.min(b.end, window.end),
  })).filter(b => b.end - b.start >= duration);
  return blocks[0] || null;
}
function eventFromWindow(title, date, startMin, endMin, category = "deep") {
  const st = new Date(date), en = new Date(date);
  st.setHours(Math.floor(startMin / 60), startMin % 60, 0, 0);
  en.setHours(Math.floor(endMin / 60), endMin % 60, 0, 0);
  return {
    id: "e" + uid(),
    title,
    start: st,
    end: en,
    calendar: category === "personal" || category === "health" ? "personal" : "work",
    category,
    fixed: false,
    color: null,
    notes: "",
    recurrence: null,
  };
}
function cleanTitle(text) {
  return text
    .replace(/\b(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|morning|afternoon|evening)\b/gi, "")
    .replace(/\b(for|probably|about|around|a|an|the|session|block|task|work|of)\b/gi, " ")
    .replace(/\d+(?:\.\d+)?\s*(?:h(?:our)?s?|min(?:ute)?s?)/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}
function inferCategory(title) {
  if (/gym|workout|run|yoga|exercise|meditation/i.test(title)) return "health";
  if (/focus|deep|proposal|report|write|code|study|design|draft|finish|strategy/i.test(title)) return "deep";
  if (/lunch|dinner|breakfast|coffee|eat|family|friend/i.test(title)) return "personal";
  if (/email|admin|review|catch-up|invoice|expense/i.test(title)) return "admin";
  return "meeting";
}
function buildGreeting(events, tasks) {
  const h = new Date().getHours();
  const g = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  const te = getEventsOnDay(events, TODAY);
  const ot = tasks.filter(t => !t.done && taskBelongsToPeriod(t, "day", TODAY));
  const fb = freeBlocks(events, TODAY)[0];
  const bs = fb ? ` First free: ${minsToTime(fb.start)}–${minsToTime(fb.end)}.` : "";
  return `${g} ✨ ${te.length} event${te.length !== 1 ? "s" : ""} and ${ot.length} open task${ot.length !== 1 ? "s" : ""} today.${bs} What do you need?`;
}

function processMessage(input, events, tasks, pending) {
  const raw = input.trim(), msg = raw.toLowerCase();
  let text = "", newEv = null, newTk = null, newP = null;

  if (pending) {
    const yes = /^(yes|yeah|yep|sure|ok|okay|do it|confirm|go ahead|yup|absolutely|please|sounds good)/.test(msg);
    const no  = /^(no|nope|cancel|stop|don't|nevermind|actually)/.test(msg);
    const wantsAdjustment = /^(actually|make it|change it|instead|can you|could you)/.test(msg);
    if (wantsAdjustment) {
      const dur = parseDur(raw);
      const timeMatch = raw.match(/\b(?:at|to|make it)?\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\b/i);
      if (dur && pending.event) {
        const event = { ...pending.event, end: new Date(pending.event.start.getTime() + dur * 60000) };
        newP = { ...pending, event };
        text = `Adjusted preview: "${event.title}" on ${fmtDay(event.start)} at ${fmt(event.start)}–${fmt(event.end)} (${dur}min). Does that work?`;
        return { text, newEv, newTk, newP };
      }
      if (dur && pending.task) {
        const task = { ...pending.task, duration: dur };
        newP = { ...pending, task };
        text = `Adjusted preview: add task "${task.title}" (${dur}min, ${task.scope})${task.deadline ? `, due ${task.deadline}` : ""}. Does that work?`;
        return { text, newEv, newTk, newP };
      }
      if (timeMatch && pending.event) {
        const nt = parseTimeStr(timeMatch[1]);
        if (nt) {
          const oldDur = (pending.event.end - pending.event.start) / 60000;
          const st = new Date(pending.event.start); st.setHours(nt.h, nt.m, 0, 0);
          const en = new Date(st.getTime() + oldDur * 60000);
          const event = { ...pending.event, start: st, end: en };
          newP = { ...pending, event, newStart: st, newEnd: en };
          text = `Adjusted preview: "${event.title}" on ${fmtDay(st)} at ${fmt(st)}–${fmt(en)}. Does that work?`;
          return { text, newEv, newTk, newP };
        }
      }
    }
    if (yes) {
      if      (pending.type === "add_event")     { newEv = [...events, pending.event]; text = `Done! 🎉 Added "${pending.event.title}" on ${fmtDay(pending.event.start)} at ${fmt(pending.event.start)}.`; }
      else if (pending.type === "add_task")      { newTk = [...tasks, pending.task];   text = `Added! ✅ "${pending.task.title}" is in your ${pending.task.scope} list.`; }
      else if (pending.type === "delete_event")  { newEv = events.filter(e => e.id !== pending.eventId); text = `Removed "${pending.title}" 🗑️`; }
      else if (pending.type === "complete_task") { const now = new Date(); newTk = tasks.map(t => t.id === pending.taskId ? { ...t, done: true, completedAt: now.toISOString(), completedDate: dateKey(now) } : t); text = `Done! "${pending.title}" marked complete ✅`; }
      else if (pending.type === "reschedule")    { newEv = events.map(e => e.id === pending.eventId ? { ...e, start: pending.newStart, end: pending.newEnd } : e); text = `Rescheduled! "${pending.title}" → ${fmt(pending.newStart)}.`; }
      else if (pending.type === "clear_day")     { newEv = events.filter(e => !sameDay(e.start, pending.date) || e.fixed); text = `Cleared ${fmtDay(pending.date)}.`; }
      else if (pending.type === "clear_window")  { newEv = events.filter(e => !pending.eventIds.includes(e.id)); text = `Cleared ${pending.label} on ${fmtDay(pending.date)}.`; }
      return { text, newEv, newTk, newP: null };
    }
    if (no) return { text: "No problem! 😊 Nothing changed.", newEv: null, newTk: null, newP: null };
  }

  if (/^(hi|hello|hey|good morning|good afternoon|howdy|yo)\b/.test(msg))
    return { text: buildGreeting(events, tasks), newEv, newTk, newP };

  if (/\b(help|what can you do|commands)\b/.test(msg))
    return { text: `Here's what I can do 🌸\n\n📅 "What's on today?" / "Show my week"\n⏰ "When's my next free 2-hour block?" / "How much focus time is left?"\n➕ "Add a 1-hour gym session tomorrow morning"\n✅ "I need to finish the proposal by Friday, probably 3 hours"\n🔄 "Move standup to 10am"\n🧹 "Clear my Friday afternoon"\n⚖️ "I only have 4 hours today, what should I prioritise?"\n📊 "How busy am I?" / "What did I not finish this week?"`, newEv, newTk, newP };

  if (/\b(what('s| is) (on|happening) today|show (me )?today|today('s)? (schedule|events|plan)|my day)\b/.test(msg) || msg === "today") {
    const evs = getEventsOnDay(events, TODAY); const ot = tasks.filter(t => !t.done && taskBelongsToPeriod(t, "day", TODAY));
    text = evs.length === 0 ? "Nothing today! 🎉" : `📅 Today:\n\n${evs.map(e => `• ${fmt(e.start)}–${fmt(e.end)}: ${e.title}${hasConflict(events, e) ? " ⚠️" : ""}`).join("\n")}${ot.length ? `\n\n📋 Tasks:\n${ot.map(t => `• ${t.title} (${t.duration}min)`).join("\n")}` : ""}`;
    return { text, newEv, newTk, newP };
  }

  if (/\b(tomorrow|what('s| is) (on )?tomorrow)\b/.test(msg)) {
    const tom = new Date(TODAY); tom.setDate(TODAY.getDate() + 1);
    const evs = getEventsOnDay(events, tom);
    text = evs.length === 0 ? "Nothing tomorrow yet!" : `📅 Tomorrow:\n\n${evs.map(e => `• ${fmt(e.start)}–${fmt(e.end)}: ${e.title}`).join("\n")}`;
    return { text, newEv, newTk, newP };
  }

  if (/\b(this week|show week)\b/.test(msg)) {
    const mon = weekStart(TODAY);
    const lines = [];
    for (let i = 0; i < 7; i++) { const d = new Date(mon); d.setDate(mon.getDate() + i); const evs = getEventsOnDay(events, d); if (evs.length) lines.push(`${d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}: ${evs.length} event${evs.length !== 1 ? "s" : ""}`); }
    text = lines.length ? `🗓️ This week:\n\n${lines.join("\n")}` : "Nothing this week!";
    return { text, newEv, newTk, newP };
  }

  if (/\b(what('s| is) next|next (event|meeting|thing)|upcoming)\b/.test(msg)) {
    const now = new Date(); const up = events.filter(e => e.start > now).sort((a, b) => a.start - b.start);
    if (!up.length) text = "No more events today! 🎉";
    else { const e = up[0]; const diff = Math.round((e.start - now) / 60000); text = `Next: "${e.title}" ${diff < 60 ? `in ${diff}min` : `in ${Math.round(diff / 60)}h`} at ${fmt(e.start)}.`; }
    return { text, newEv, newTk, newP };
  }

  if (/\b(free (time|block|slot)|when am i free|available)\b/.test(msg)) {
    let td = TODAY; const dm = msg.match(/\b(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/);
    if (dm) { const r = parseDateRef(dm[1], TODAY); if (r) td = r; }
    const need = parseDur(raw) || 0;
    if (/\bthis week|week\b/.test(msg) && need) {
      const mon = weekStart(TODAY);
      const hits = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(mon); d.setDate(mon.getDate() + i);
        const slot = freeBlocks(events, d).find(b => b.end - b.start >= need);
        if (slot) hits.push(`• ${fmtDay(d)} ${minsToTime(slot.start)}–${minsToTime(slot.end)} (${slot.end - slot.start}min)`);
      }
      text = hits.length ? `Free ${Math.round(need / 60 * 10) / 10}h blocks this week:\n\n${hits.join("\n")}` : `I don't see a free ${Math.round(need / 60 * 10) / 10}h block this week.`;
    } else {
      let bl = freeBlocks(events, td);
      if (need) bl = bl.filter(b => b.end - b.start >= need);
      text = bl.length ? `Free on ${fmtDay(td)}${need ? ` for ${need}min+` : ""}:\n\n${bl.map(b => `• ${minsToTime(b.start)}–${minsToTime(b.end)} (${b.end - b.start}min)`).join("\n")}` : `No free ${need ? `${need}min ` : ""}blocks on ${fmtDay(td)}! 😅`;
    }
    return { text, newEv, newTk, newP };
  }

  if (/\b(how busy|capacity|overloaded)\b/.test(msg)) {
    let td = TODAY; const dm = msg.match(/\b(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/);
    if (dm) { const r = parseDateRef(dm[1], TODAY); if (r) td = r; }
    const tm = totalMins(events, td); const workHours = _workEnd - _workStart; const pct = Math.round(tm / (workHours * 60) * 100);
    text = `${fmtDay(td).charAt(0).toUpperCase() + fmtDay(td).slice(1)}: ${pct > 80 ? "Very busy 😅" : pct > 50 ? "Moderately busy" : "Fairly open 😊"}\n• Scheduled: ${Math.round(tm / 60 * 10) / 10}h (${pct}% of work day)\n• Free blocks: ${freeBlocks(events, td).length} remaining`;
    return { text, newEv, newTk, newP };
  }

  if (/\b(focus time|deep work time)\b.*\b(left|remaining|available)\b/.test(msg)) {
    let td = TODAY; const dm = msg.match(/\b(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/);
    if (dm) { const r = parseDateRef(dm[1], TODAY); if (r) td = r; }
    const blocks = freeBlocks(events, td).filter(b => b.end > 9 * 60 && b.start < 17 * 60);
    const mins = blocks.reduce((sum, b) => sum + Math.max(0, Math.min(b.end, 17 * 60) - Math.max(b.start, 9 * 60)), 0);
    text = `You have about ${Math.round(mins / 60 * 10) / 10}h of focus-capable time left on ${fmtDay(td)}.\n\n${blocks.length ? blocks.map(b => `• ${minsToTime(Math.max(b.start, 9 * 60))}–${minsToTime(Math.min(b.end, 17 * 60))}`).join("\n") : "No clean focus blocks left."}`;
    return { text, newEv, newTk, newP };
  }

  if (/\b(show (me )?(my )?tasks?|list tasks?|pending|open tasks?)\b/.test(msg)) {
    const sm = msg.match(/\b(today|day|week|month)\b/); const sc = sm ? (sm[1] === "today" ? "day" : sm[1]) : null;
    const ft = tasks.filter(t => !t.done && (sc ? t.scope === sc : true));
    text = ft.length ? `📋 Tasks${sc ? ` — this ${sc}` : ""}:\n\n${ft.map(t => `${PRIORITIES.find(p => p.id === t.priority)?.icon || "•"} ${t.title} (${t.duration}min${t.deadline ? `, due ${t.deadline.slice(5)}` : ""}) [${t.scope}]`).join("\n")}` : `No open tasks${sc ? ` for this ${sc}` : ""}! 🎉`;
    return { text, newEv, newTk, newP };
  }

  if (/\b(only have|real work time|prioriti[sz]e|prioritise|prioritize|what should i do)\b/.test(msg)) {
    const cap = parseDur(raw) || (raw.match(/\b(\d+(?:\.\d+)?)\s*hours?\b/i) ? Math.round(parseFloat(raw.match(/\b(\d+(?:\.\d+)?)\s*hours?\b/i)[1]) * 60) : 240);
    const open = tasks.filter(t => !t.done).sort((a, b) => {
      const pr = { high: 0, medium: 1, low: 2 };
      return (pr[a.priority] ?? 1) - (pr[b.priority] ?? 1) || (a.deadline || "9999").localeCompare(b.deadline || "9999");
    });
    const picked = []; let used = 0;
    for (const t of open) {
      if (used + t.duration <= cap || picked.length < 2) { picked.push(t); used += t.duration; }
      if (used >= cap) break;
    }
    text = picked.length ? `With about ${Math.round(cap / 60 * 10) / 10}h, I'd protect these first:\n\n${picked.map(t => `• ${t.title} (${t.duration}min, ${t.priority}${t.deadline ? `, due ${t.deadline}` : ""})`).join("\n")}\n\nTrade-off: push lower-priority admin and anything without a deadline to tomorrow.` : "You don't have open tasks to prioritise right now.";
    return { text, newEv, newTk, newP };
  }

  if (/\b(running behind|got a meeting|what needs to move|what can i push|push to tomorrow)\b/.test(msg)) {
    const movable = events.filter(e => sameDay(e.start, TODAY) && !e.fixed && e.start > new Date()).sort((a, b) => a.start - b.start);
    const open = tasks.filter(t => !t.done && taskBelongsToPeriod(t, "day", TODAY)).sort((a, b) => b.duration - a.duration);
    text = `Here's the softest trade-off I see:\n\n${movable.slice(0, 3).map(e => `• Move "${e.title}" (${fmt(e.start)}–${fmt(e.end)})`).join("\n") || "• No movable events left today"}\n${open.slice(0, 3).map(t => `• Push task "${t.title}" (${t.duration}min)`).join("\n") || "• No day tasks to push"}\n\nTell me what to move and I'll preview it before changing anything.`;
    return { text, newEv, newTk, newP };
  }

  if (/\b(mark|complete|finish|done|tick off)\b.{0,40}(task|it)\b/i.test(raw) || /\b(i('ve| have) (finished?|completed?|done))\b/.test(msg)) {
    const kw = raw.replace(/mark|complete|finish|done|tick off|task|i've|i have|finished?|completed?/gi, "").trim();
    const tk = kw.length > 2 ? tasks.find(t => t.title.toLowerCase().includes(kw.toLowerCase())) : null;
    if (!tk) text = "Which task? Give me the name!";
    else if (tk.done) text = `"${tk.title}" is already done! 🎉`;
    else { newP = { type: "complete_task", taskId: tk.id, title: tk.title }; text = `Mark "${tk.title}" as done? ✅`; }
    return { text, newEv, newTk, newP };
  }

  if (/\b(deadline|due (soon|today|this week)|overdue)\b/.test(msg)) {
    const soon = new Date(TODAY); soon.setDate(soon.getDate() + 3);
    const ur = tasks.filter(t => !t.done && t.deadline && (localDateFromKey(t.deadline) || new Date(t.deadline)) <= soon);
    text = ur.length ? `⚠️ Upcoming deadlines:\n\n${ur.map(t => `• "${t.title}" — due ${t.deadline}`).join("\n")}` : "No urgent deadlines in 3 days! 🎉";
    return { text, newEv, newTk, newP };
  }

  if (/\b(not finish|unfinished|not completed|didn't finish)\b/.test(msg)) {
    const scope = /\bweek\b/.test(msg) ? "week" : /\bmonth\b/.test(msg) ? "month" : "day";
    const undone = tasks.filter(t => !t.done && (scope === "day" ? t.scope === "day" : true));
    text = undone.length ? `Still unfinished ${scope === "day" ? "today" : `this ${scope}`}:\n\n${undone.map(t => `• ${t.title} (${t.duration}min, ${t.priority})`).join("\n")}` : `Everything in that view is finished. Nice. ✨`;
    return { text, newEv, newTk, newP };
  }

  if (/\b(hours?|time)\b.*\b(admin|meetings?|deep work|personal)\b/.test(msg)) {
    const cat = /admin/.test(msg) ? "admin" : /meeting/.test(msg) ? "meeting" : /personal/.test(msg) ? "personal" : "deep";
    const mins = events.filter(e => e.category === cat).reduce((sum, e) => sum + (e.end - e.start) / 60000, 0);
    const label = CATEGORIES.find(c => c.id === cat)?.label || cat;
    text = `You've scheduled about ${Math.round(mins / 60 * 10) / 10}h of ${label.toLowerCase()} in the current schedule data.`;
    return { text, newEv, newTk, newP };
  }

  if (/\b(underestimating|estimates?|adjust).*\b(design|deep work|tasks?)\b/.test(msg)) {
    const updated = tasks.map(t => /design/i.test(t.title) || t.category === "deep" ? { ...t, duration: Math.ceil(t.duration * 1.25 / 5) * 5 } : t);
    const changed = updated.filter((t, i) => t.duration !== tasks[i].duration);
    if (!changed.length) text = "I don't see matching design/deep-work tasks to adjust yet.";
    else { newTk = updated; text = `Adjusted estimates up by 25% for ${changed.length} design/deep-work task${changed.length !== 1 ? "s" : ""}. I'll be more conservative with those.`; }
    return { text, newEv, newTk, newP };
  }

  if (/\b(how am i doing|am i on track|progress|productivity)\b/.test(msg)) {
    const dn = tasks.filter(t => t.done).length, tot = tasks.length, pct = tot > 0 ? Math.round(dn / tot * 100) : 0;
    const qs = ["Keep going! 💪", "You're crushing it! 🌟", "Stay focused! ✨", "Amazing progress! 🎉"];
    text = `${qs[Math.floor(Math.random() * qs.length)]}\n\n📊 ${dn}/${tot} tasks done (${pct}%)\n📅 ${getEventsOnDay(events, TODAY).length} events today\n🕐 ${freeBlocks(events, TODAY).length} free blocks left`;
    return { text, newEv, newTk, newP };
  }

  if (/^(thanks?|thank you|thx|cheers|great|perfect|awesome)\b/.test(msg)) {
    const rs = ["Happy to help! 🌸", "Anytime! ✨", "Of course! 💕", "You're welcome! 🎀"];
    text = rs[Math.floor(Math.random() * rs.length)];
    return { text, newEv, newTk, newP };
  }

  // Clear a specific part of a day — destructive, so always preview first
  if (/\b(clear|wipe|empty)\b.*\b(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|morning|afternoon|evening)\b/i.test(raw)) {
    const td = parseDateMention(raw) || TODAY;
    const win = parseDayWindow(raw) || { label: "day", start: _workStart * 60, end: _workEnd * 60 };
    const affected = getEventsOnDay(events, td).filter(e => {
      const s = e.start.getHours() * 60 + e.start.getMinutes();
      const en = e.end.getHours() * 60 + e.end.getMinutes();
      return !e.fixed && s < win.end && en > win.start;
    });
    if (!affected.length) text = `Nothing movable to clear on ${fmtDay(td)} ${win.label}.`;
    else {
      newP = { type: "clear_window", eventIds: affected.map(e => e.id), date: td, label: win.label };
      text = `I'd clear ${win.label} on ${fmtDay(td)} by removing:\n\n${affected.map(e => `• ${fmt(e.start)}–${fmt(e.end)} ${e.title}`).join("\n")}\n\nConfirm?`;
    }
    return { text, newEv, newTk, newP };
  }

  // Natural flexible scheduling — "Add a 1-hour gym session tomorrow morning"
  const flexAdd = raw.match(/\b(add|schedule|book|put|slot in)\b\s+(.+)/i);
  const flexDur = parseDur(raw);
  const flexDate = parseDateMention(raw);
  const flexWindow = parseDayWindow(raw);
  if (flexAdd && flexDur && (flexDate || flexWindow)) {
    const td = flexDate || TODAY;
    const win = flexWindow || { label: "day", start: _workStart * 60, end: _workEnd * 60 };
    const slot = fitFreeSlot(events, td, win, flexDur);
    const rawTitle = cleanTitle(flexAdd[2]) || "New event";
    const title = rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1);
    const cat = inferCategory(title);
    if (!slot) {
      text = `I don't see a free ${flexDur}min slot on ${fmtDay(td)} ${win.label}. Want me to look elsewhere?`;
    } else {
      const ev = eventFromWindow(title, td, slot.start, slot.start + flexDur, cat);
      newP = { type: "add_event", event: ev };
      text = `I'd add "${title}" on ${fmtDay(ev.start)} at ${fmt(ev.start)}–${fmt(ev.end)}.${hasConflict(events, ev) ? " It overlaps something, so confirm before I touch it." : " Does that work?"}`;
    }
    return { text, newEv, newTk, newP };
  }

  // Focus blocks — "Block out Wednesday afternoon"
  if (/\b(block out|hold|protect)\b.*\b(morning|afternoon|evening|focus|deep)\b/i.test(raw)) {
    const td = parseDateMention(raw) || TODAY;
    const win = parseDayWindow(raw) || { label: "focus block", start: 9 * 60, end: 17 * 60 };
    const title = /focus|deep/i.test(raw) ? "Deep focus time" : "Protected time";
    const ev = eventFromWindow(title, td, win.start, win.end, "deep");
    newP = { type: "add_event", event: ev };
    text = `I'd block ${fmtDay(td)} ${win.label}: ${fmt(ev.start)}–${fmt(ev.end)} as "${title}". Does that work?`;
    return { text, newEv, newTk, newP };
  }

  // Natural task capture — "I need to finish the proposal by Friday, probably 3 hours"
  if (/\b(i need to|need to|finish|complete|proposal|by)\b/i.test(raw) && (/\bby\b/i.test(raw) || flexDur)) {
    const td = parseDateMention(raw);
    const dur = flexDur || 60;
    let title = raw
      .replace(/\b(i need to|need to|probably|by|today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi, " ")
      .replace(/\d+(?:\.\d+)?\s*(?:h(?:our)?s?|min(?:ute)?s?)/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
    title = title || "New task";
    title = title.charAt(0).toUpperCase() + title.slice(1).replace(/[.!?]$/, "");
    const cat = inferCategory(title) === "meeting" ? "deep" : inferCategory(title);
    const tk = withTaskPeriod({ id: "t" + uid(), title, duration: dur, category: cat, scope: "week", done: false, deadline: td ? dateKey(td) : null, priority: dur >= 120 ? "high" : "medium", notes: "", scheduled: null }, td || TODAY);
    newP = { type: "add_task", task: tk };
    text = `Add task "${title}" (${dur}min${tk.deadline ? `, due ${tk.deadline}` : ""})?`;
    return { text, newEv, newTk, newP };
  }

  // Add event — try "X to Y" / "X - Y" range first, then single time + duration
  const aem = raw.match(/\b(add|schedule|create|put|book|set up)\b(.{3,80}?)\b(at|@|from)\s+([\d:.]+\s*(?:am|pm)?(?:\s*(?:to|-|\u2013|until)\s*[\d:.]+\s*(?:am|pm)?)?)/i);
  if (aem) {
    let title = aem[2].replace(/\b(a |an |me |for |event |meeting |session |block )\b/gi, "").trim();
    title = title.charAt(0).toUpperCase() + title.slice(1);
    const timeStr = aem[4];
    let td = new Date(TODAY);
    const dm = raw.match(/\b(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i);
    if (dm) { const r = parseDateRef(dm[1].toLowerCase(), TODAY); if (r) td = r; }
    let cat = "meeting";
    if (/gym|workout|run|yoga|exercise/i.test(raw)) cat = "health";
    else if (/focus|deep|report|write|code|study/i.test(raw)) cat = "deep";
    else if (/lunch|dinner|breakfast|coffee|eat/i.test(raw)) cat = "personal";
    else if (/email|admin|review|check/i.test(raw)) cat = "admin";
    // Try explicit range "1:30pm to 3pm"
    const range = parseTimeRange(timeStr);
    if (range) {
      const st = new Date(td); st.setHours(range.start.h, range.start.m, 0, 0);
      const en = new Date(td); en.setHours(range.end.h,   range.end.m,   0, 0);
      const dur = Math.round((en - st) / 60000);
      const ev = { id: "e" + uid(), title, start: st, end: en, calendar: cat === "personal" || cat === "health" ? "personal" : "work", category: cat, fixed: false, color: null, notes: "", recurrence: null };
      newP = { type: "add_event", event: ev };
      text = `Add "${title}" on ${fmtDay(st)} at ${fmt(st)}\u2013${fmt(en)} (${dur}min)?${hasConflict(events, ev) ? " \u26a0\ufe0f Overlaps existing event." : ""}`;
    } else {
      // Single time + optional duration
      const pt = parseTimeStr(timeStr.split(/\s+/)[0]);
      let dur = 60;
      const dr = raw.match(/(\d+(?:\.\d+)?)\s*(h(?:our)?s?|min(?:ute)?s?)/i);
      if (dr) { const d = parseDur(dr[0]); if (d) dur = d; }
      if (!pt) {
        text = `Couldn't parse the time. Try: "add ${title} at 3pm for 1 hour" or "add ${title} at 1:30pm to 3pm".`;
      } else {
        const st = new Date(td); st.setHours(pt.h, pt.m, 0, 0);
        const en = new Date(st.getTime() + dur * 60000);
        const ev = { id: "e" + uid(), title, start: st, end: en, calendar: cat === "personal" || cat === "health" ? "personal" : "work", category: cat, fixed: false, color: null, notes: "", recurrence: null };
        newP = { type: "add_event", event: ev };
        text = `Add "${title}" on ${fmtDay(st)} at ${fmt(st)}\u2013${fmt(en)} (${dur}min)?${hasConflict(events, ev) ? " \u26a0\ufe0f Overlaps existing event." : ""}`;
      }
    }
    return { text, newEv, newTk, newP };
  }

  // Add task
  const atm = raw.match(/\b(add|create|new|remind me to|i need to)\b\s*(?:task[:\s]*)?(.{3,80}?)(?:\s*[,\s]\s*(\d+)\s*(min(?:ute)?s?|h(?:our)?s?))?(?:\s*(today|this week|this month))?$/i);
  if (atm && !/\bat\s+\d/.test(msg)) {
    let title = atm[2].trim(); title = title.charAt(0).toUpperCase() + title.slice(1).replace(/[.!?]$/, "");
    let dur = 30;
    if (atm[3] && atm[4]) { const d = parseDur(atm[3] + " " + atm[4]); if (d) dur = d; }
    const sw = atm[5]?.toLowerCase(); const sc = sw === "this week" ? "week" : sw === "this month" ? "month" : "day";
    let cat = "admin";
    if (/gym|workout|health/i.test(title)) cat = "health";
    else if (/write|research|report|build|code|study|plan|design|prepare/i.test(title)) cat = "deep";
    const tk = withTaskPeriod({ id: "t" + uid(), title, duration: dur, category: cat, scope: sc, done: false, deadline: null, priority: "medium", notes: "", scheduled: null }, TODAY);
    newP = { type: "add_task", task: tk };
    text = `Add task "${title}" (${dur}min, ${sc})?`;
    return { text, newEv, newTk, newP };
  }

  // Delete event
  if (/\b(delete|remove|cancel)\b.{0,40}/i.test(raw)) {
    const kw = raw.replace(/delete|remove|cancel/gi, "").trim();
    const ev = kw.length > 1 ? events.find(e => e.title.toLowerCase().includes(kw.toLowerCase())) : null;
    if (!ev) text = "Which event to remove?";
    else { newP = { type: "delete_event", eventId: ev.id, title: ev.title }; text = `Delete "${ev.title}" on ${fmtDay(ev.start)}?`; }
    return { text, newEv, newTk, newP };
  }

  // Move an item by day while keeping its time — "Move my 3pm task to Thursday"
  const dayMove = raw.match(/\b(move|reschedule|push|shift|change)\b.*?\b(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\b.*?\b(to|on)\s+(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i);
  if (dayMove && !/\b(to|at)\s+\d{1,2}/i.test(raw.replace(dayMove[4], ""))) {
    const oldTime = parseTimeStr(dayMove[2]);
    const td = parseDateRef(dayMove[4].toLowerCase(), TODAY);
    const minute = oldTime ? oldTime.h * 60 + oldTime.m : null;
    const ev = minute == null ? null : events.find(e => sameDay(e.start, TODAY) && (e.start.getHours() * 60 + e.start.getMinutes()) <= minute && (e.end.getHours() * 60 + e.end.getMinutes()) > minute);
    if (!ev) text = `I couldn't find an event around ${dayMove[2]} today.`;
    else {
      const dur = (ev.end - ev.start) / 60000;
      const ns = new Date(td); ns.setHours(ev.start.getHours(), ev.start.getMinutes(), 0, 0);
      const ne = new Date(ns.getTime() + dur * 60000);
      newP = { type: "reschedule", eventId: ev.id, title: ev.title, newStart: ns, newEnd: ne };
      text = `Move "${ev.title}" to ${fmtDay(ns)} at ${fmt(ns)}–${fmt(ne)}?`;
    }
    return { text, newEv, newTk, newP };
  }

  // Reschedule
  const rem = raw.match(/\b(move|reschedule|push|shift|change)\b.{0,40}?\b(to|at)\s+([\d:.]+\s*(?:am|pm)?)/i);
  if (rem) {
    const kw = raw.replace(/move|reschedule|push|shift|change|to|at|[\d:.]+\s*(?:am|pm)?/gi, "").trim();
    const ev = events.find(e => e.title.toLowerCase().includes(kw.toLowerCase()));
    const nt = parseTimeStr(rem[3]);
    let td = ev ? new Date(ev.start) : new Date(TODAY);
    const dm = msg.match(/\b(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/);
    if (dm) { const r = parseDateRef(dm[1], TODAY); if (r) td = r; }
    if (!ev) text = "Couldn't find that event.";
    else if (!nt) text = `What time for "${ev.title}"?`;
    else {
      const dur = (ev.end - ev.start) / 60000;
      const ns = new Date(td); ns.setHours(nt.h, nt.m, 0, 0);
      const ne = new Date(ns.getTime() + dur * 60000);
      newP = { type: "reschedule", eventId: ev.id, title: ev.title, newStart: ns, newEnd: ne };
      text = `Move "${ev.title}" to ${fmt(ns)}–${fmt(ne)} on ${fmtDay(ns)}?`;
    }
    return { text, newEv, newTk, newP };
  }

  // Time query
  if (/\b(what time|when) (is|does|starts?|am i|do i have)\b.{0,40}/i.test(raw)) {
    const kw = raw.replace(/what time|when|is|does|starts?|am i|do i have/gi, "").trim();
    const ev = kw.length > 1 ? events.find(e => e.title.toLowerCase().includes(kw.toLowerCase())) : null;
    text = ev ? `"${ev.title}" is on ${fmtDay(ev.start)} at ${fmt(ev.start)}–${fmt(ev.end)}.${ev.fixed ? " 🔒" : ""}` : "Couldn't find that event.";
    return { text, newEv, newTk, newP };
  }

  const fbs = ["Not sure 🤔 Type 'help' to see what I can do!", "Didn't catch that 😊 Try 'What's on today?'", "Type 'help' for all commands 🌸"];
  text = fbs[Math.floor(Math.random() * fbs.length)];
  return { text, newEv, newTk, newP };
}

// ─── Pomodoro hook ────────────────────────────────────────────────────────────
function usePomodoro() {
  const [state, setState] = useState({ active: false, mode: "work", remaining: POMODORO_WORK_SECS, cycles: 0, taskId: null });
  const iv = useRef(null);
  const start  = id => setState({ active: true, mode: "work", remaining: POMODORO_WORK_SECS, cycles: 0, taskId: id });
  const pause  = ()  => setState(s => ({ ...s, active: false }));
  const resume = ()  => setState(s => ({ ...s, active: true }));
  const stop   = ()  => setState({ active: false, mode: "work", remaining: POMODORO_WORK_SECS, cycles: 0, taskId: null });
  useEffect(() => {
    if (state.active) {
      iv.current = setInterval(() => setState(s => {
        if (s.remaining <= 1) {
          const nc = s.mode === "work" ? s.cycles + 1 : s.cycles;
          const nm = s.mode === "work" ? "break" : "work";
          const nr = nm === "work" ? POMODORO_WORK_SECS : POMODORO_BREAK_SECS;
          if (typeof Notification !== "undefined" && Notification.permission === "granted")
            new Notification(nm === "break" ? "Break time! 🌸" : "Back to work! 💪");
          return { ...s, mode: nm, remaining: nr, cycles: nc };
        }
        return { ...s, remaining: s.remaining - 1 };
      }), 1000);
    } else clearInterval(iv.current);
    return () => clearInterval(iv.current);
  }, [state.active]);
  return { state, start, pause, resume, stop };
}

// ─── Login Screen ─────────────────────────────────────────────────────────────
/*
  SUPABASE SETUP INSTRUCTIONS
  ════════════════════════════
  1. Go to https://supabase.com → New project (free)
  2. Copy your Project URL and anon/public key
  3. Replace SUPABASE_URL and SUPABASE_ANON_KEY below
  4. In Supabase dashboard → Authentication → enable Email provider
  5. In SQL Editor run:

    create table public.user_data (
      id uuid primary key default gen_random_uuid(),
      user_id uuid references auth.users not null unique,
      events jsonb default '[]',
      tasks jsonb default '[]',
      settings jsonb default '{}',
      updated_at timestamptz default now()
    );
    alter table public.user_data enable row level security;
    drop policy if exists "Users can only access their own data" on public.user_data;
    create policy "Users can only access their own data"
      on public.user_data for all
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);

  6. Create a private Supabase Storage bucket for Memory Book photos:

    insert into storage.buckets (id, name, public)
    values ('memory-images', 'memory-images', false)
    on conflict (id) do nothing;

    drop policy if exists "Users can upload own memory images" on storage.objects;
    drop policy if exists "Users can view own memory images" on storage.objects;
    drop policy if exists "Users can update own memory images" on storage.objects;
    drop policy if exists "Users can delete own memory images" on storage.objects;

    create policy "Users can upload own memory images"
      on storage.objects for insert
      with check (bucket_id = 'memory-images' and auth.uid()::text = (storage.foldername(name))[1]);

    create policy "Users can view own memory images"
      on storage.objects for select
      using (bucket_id = 'memory-images' and auth.uid()::text = (storage.foldername(name))[1]);

    create policy "Users can update own memory images"
      on storage.objects for update
      using (bucket_id = 'memory-images' and auth.uid()::text = (storage.foldername(name))[1])
      with check (bucket_id = 'memory-images' and auth.uid()::text = (storage.foldername(name))[1]);

    create policy "Users can delete own memory images"
      on storage.objects for delete
      using (bucket_id = 'memory-images' and auth.uid()::text = (storage.foldername(name))[1]);

  7. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel environment variables
  8. Supabase JS loads via CDN automatically — no npm install needed
  ════════════════════════════
*/

// ── Supabase client ───────────────────────────────────────────────────────────
// Keys must be set as environment variables (Vercel dashboard / .env.local).
// For local dev, create a .env.local file:
//   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
//   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Dynamically load Supabase via CDN so no npm install is needed
let supabase = null;
async function getSupabase() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error("Supabase env vars are not set. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  if (supabase) return supabase;
  try {
    if (!window.supabase) {
      await new Promise((res) => {
        const s = document.createElement("script");
        s.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js";
        s.onload = res; s.onerror = res; // always resolve — never hang
        document.head.appendChild(s);
        setTimeout(res, 5000); // hard 5s timeout in case CDN is slow
      });
    }
    if (!window.supabase) throw new Error("CDN unavailable");
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return supabase;
  } catch (e) {
    console.warn("Supabase unavailable, running offline:", e);
    throw e; // callers catch this and fall back to localStorage
  }
}


const MEMORY_STORAGE_BUCKET = "memory-images";
const MEMORY_SIGNED_URL_SECONDS = 60 * 60 * 24 * 7;
const MEMORY_IMAGE_LIMIT_PER_ENTRY = 6;
const MEMORY_MAX_ORIGINAL_BYTES = 15 * 1024 * 1024;
const MEMORY_MAX_IMAGE_EDGE = 1600;
const MEMORY_THUMB_IMAGE_EDGE = 300;
const MEMORY_ENCRYPTION_VERSION = 1;

const hasWebCrypto = () => typeof crypto !== "undefined" && Boolean(crypto.subtle) && typeof TextEncoder !== "undefined" && typeof TextDecoder !== "undefined";
const bytesToBase64 = bytes => {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.slice(i, i + chunk));
  }
  return btoa(binary);
};
const base64ToBytes = b64 => Uint8Array.from(atob(b64 || ""), c => c.charCodeAt(0));

function fileExtFromType(type = "") {
  if (type.includes("png")) return "png";
  if (type.includes("webp")) return "webp";
  if (type.includes("gif")) return "gif";
  return "jpg";
}
function dataUrlToBlob(dataUrl) {
  const [meta, body] = String(dataUrl || "").split(",");
  const mime = (meta.match(/data:(.*?);base64/) || [])[1] || "image/jpeg";
  const binary = atob(body || "");
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}
function resizeImageFileToBlob(file, maxSize = MEMORY_MAX_IMAGE_EDGE, quality = 0.84) {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !file?.type?.startsWith?.("image/")) return resolve(file);
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onerror = () => { URL.revokeObjectURL(objectUrl); resolve(file); };
    img.onload = () => {
      try {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(blob => {
          URL.revokeObjectURL(objectUrl);
          resolve(blob || file);
        }, "image/jpeg", quality);
      } catch {
        URL.revokeObjectURL(objectUrl);
        resolve(file);
      }
    };
    img.src = objectUrl;
  });
}
async function signMemoryImagePath(storagePath) {
  if (!storagePath) return { src: "", srcExpiresAt: null };
  const sb = await getSupabase();
  const { data, error } = await sb.storage.from(MEMORY_STORAGE_BUCKET).createSignedUrl(storagePath, MEMORY_SIGNED_URL_SECONDS);
  if (error) throw error;
  return {
    src: data?.signedUrl || "",
    srcExpiresAt: new Date(Date.now() + (MEMORY_SIGNED_URL_SECONDS * 1000)).toISOString(),
  };
}
async function uploadMemoryBlobToStorage(userId, blob, originalName = "memory-photo", memoryDateKey = dateKey(TODAY), variant = "full", sharedId = null) {
  if (!userId) throw new Error("Please sign in before uploading Memory Book photos.");
  if (!memoryDateKey) throw new Error("Missing Memory Book date for photo upload.");
  const sb = await getSupabase();
  const ext = fileExtFromType(blob?.type || "image/jpeg");
  const safeName = String(originalName || "memory-photo").replace(/[^a-z0-9._-]+/gi, "-").slice(0, 80);
  const fileId = sharedId || `${Date.now()}-${uid()}`;
  const storagePath = `${userId}/${memoryDateKey}/${variant}/${fileId}-${safeName}.${ext}`;
  const { error } = await sb.storage.from(MEMORY_STORAGE_BUCKET).upload(storagePath, blob, {
    cacheControl: "31536000",
    upsert: false,
    contentType: blob?.type || "image/jpeg",
  });
  if (error) throw error;
  return { storagePath, bucket: MEMORY_STORAGE_BUCKET };
}
async function uploadMemoryImageToStorage(userId, file, memoryDateKey = dateKey(TODAY)) {
  const fileId = `${Date.now()}-${uid()}`;
  const fullBlob = await resizeImageFileToBlob(file, MEMORY_MAX_IMAGE_EDGE, 0.84);
  const thumbBlob = await resizeImageFileToBlob(file, MEMORY_THUMB_IMAGE_EDGE, 0.76);
  let full = null;
  try {
    full = await uploadMemoryBlobToStorage(userId, fullBlob, file?.name || "memory-photo", memoryDateKey, "full", fileId);
    const thumb = await uploadMemoryBlobToStorage(userId, thumbBlob, file?.name || "memory-photo", memoryDateKey, "thumb", fileId);
    return { storagePath: full.storagePath, thumbStoragePath: thumb.storagePath, bucket: MEMORY_STORAGE_BUCKET };
  } catch (err) {
    if (full?.storagePath) await deleteMemoryStoragePaths([full.storagePath]);
    throw err;
  }
}
async function uploadMemoryDataUrlToStorage(userId, dataUrl, name = "legacy-memory-photo", memoryDateKey = dateKey(TODAY)) {
  const fileId = `${Date.now()}-${uid()}`;
  const blob = dataUrlToBlob(dataUrl);
  const fullBlob = await resizeImageFileToBlob(blob, MEMORY_MAX_IMAGE_EDGE, 0.84);
  const thumbBlob = await resizeImageFileToBlob(blob, MEMORY_THUMB_IMAGE_EDGE, 0.76);
  let full = null;
  try {
    full = await uploadMemoryBlobToStorage(userId, fullBlob, name, memoryDateKey, "full", fileId);
    const thumb = await uploadMemoryBlobToStorage(userId, thumbBlob, name, memoryDateKey, "thumb", fileId);
    return { storagePath: full.storagePath, thumbStoragePath: thumb.storagePath, bucket: MEMORY_STORAGE_BUCKET };
  } catch (err) {
    if (full?.storagePath) await deleteMemoryStoragePaths([full.storagePath]);
    throw err;
  }
}
async function deleteMemoryStoragePaths(paths = []) {
  const clean = [...new Set(paths.filter(Boolean))];
  if (!clean.length) return true;
  try {
    const sb = await getSupabase();
    const { error } = await sb.storage.from(MEMORY_STORAGE_BUCKET).remove(clean);
    if (error) throw error;
    return true;
  } catch (err) {
    console.warn("Could not delete removed Memory Book photos", err);
    return false;
  }
}
const allMemoryPhotoStoragePaths = photo => [photo?.storagePath, photo?.thumbStoragePath].filter(Boolean);
const memoryPhotoNeedsStorageMigration = photo => Boolean(photo?.src && String(photo.src).startsWith("data:") && !photo.storagePath);

async function saveToCloud(userId, events, tasks, settings) {
  try {
    const sb = await getSupabase();
    const safeSettings = {
      ...(settings || {}),
      journal: await encryptMemoryJournalForStorage(userId, settings?.journal || {}),
    };

    const { error } = await sb.from("user_data").upsert(
      {
        user_id: userId,
        events: JSON.parse(JSON.stringify(events, SER)),
        tasks: JSON.parse(JSON.stringify(tasks, SER)),
        settings: JSON.parse(JSON.stringify(safeSettings, SER)),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    if (error) throw error;
    return true;
  } catch (e) {
    console.warn("Cloud save failed, using local:", e);
    return false;
  }
}
async function saveToCloudStrict(userId, events, tasks, settings) {
  const ok = await saveToCloud(userId, events, tasks, settings);
  if (!ok) throw new Error("Cloud save failed. Your Memory Book change was not finalized.");
  return true;
}

async function loadFromCloud(userId) {
  try {
    const sb = await getSupabase();
    const { data, error } = await sb
      .from("user_data")
      .select("user_id, events, tasks, settings, updated_at")
      .eq("user_id", userId)
      .maybeSingle();
    if (error || !data) return null;

    // Extra client-side guard: never hydrate a session with a row that
    // does not exactly belong to the signed-in Supabase auth user.
    if (data.user_id !== userId) return null;

    const rawSettings = data.settings ?? {};
    return {
      user_id: data.user_id,
      events: JSON.parse(JSON.stringify(data.events ?? []), DES),
      tasks: JSON.parse(JSON.stringify(data.tasks ?? []), DES),
      settings: {
        ...rawSettings,
        journal: await decryptMemoryJournalFromStorage(userId, rawSettings.journal ?? {}),
      },
      updated_at: data.updated_at ?? null,
    };
  } catch (e) { console.warn("Cloud load failed, using local:", e); return null; }
}

// ── Auth hook (real Supabase) ─────────────────────────────────────────────────
function useAuth() {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true); // true on boot while session is checked
  const [error,   setError]   = useState("");

  // On mount: restore existing session
  useEffect(() => {
    let cancelled = false;
    let subscription = null;

    getSupabase().then(sb => {
      if (cancelled) return;
      // Wire up listener first to avoid race condition
      const { data: { subscription: sub } } = sb.auth.onAuthStateChange((_event, session) => {
        if (cancelled) return;
        if (session?.user) setUser({ id: session.user.id, email: session.user.email, name: session.user.user_metadata?.name ?? session.user.email.split("@")[0] });
        else setUser(null);
        setLoading(false);
      });
      subscription = sub;
      // Then check existing session
      sb.auth.getSession().then(({ data: { session } }) => {
        if (cancelled) return;
        if (session?.user) setUser({ id: session.user.id, email: session.user.email, name: session.user.user_metadata?.name ?? session.user.email.split("@")[0] });
        setLoading(false);
      }).catch(() => { if (!cancelled) setLoading(false); });
    }).catch(() => {
      // Supabase CDN failed (e.g. running offline) — show login screen anyway
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
      subscription?.unsubscribe();
    };
  }, []);

  async function signIn(email, password) {
    setLoading(true); setError("");
    try {
      const sb = await getSupabase();
      const { error: err } = await sb.auth.signInWithPassword({ email, password });
      if (err) setError(err.message);
    } catch (e) { setError("Connection error — check your internet."); }
    setLoading(false);
  }

  async function signUp(email, password, name) {
    setLoading(true); setError("");
    try {
      const sb = await getSupabase();
      const { error: err } = await sb.auth.signUp({ email, password, options: { data: { name } } });
      if (err) setError(err.message);
      else setError("__verify__"); // signal to show verify-email message
    } catch (e) { setError("Connection error — check your internet."); }
    setLoading(false);
  }

  async function signOut() {
    const sb = await getSupabase();
    await sb.auth.signOut();
    setUser(null);
  }

  return { user, loading, error, setError, signIn, signUp, signOut };
}

function LoginScreen({ auth }) {
  const [mode, setMode]         = useState("login"); // "login" | "signup"
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [name, setName]         = useState("");
  const [showPass, setShowPass] = useState(false);

  const showVerify = auth.error === "__verify__";

  function handleSubmit(e) {
    e.preventDefault();
    if (mode === "login") auth.signIn(email, password);
    else auth.signUp(email, password, name);
  }

  return (
    <div className="login-page">
      {/* Animated background blobs */}
      <div className="login-bg-blobs">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
        <div className="blob blob-4" />
      </div>

      {/* Floating decorative elements */}
      <div className="login-deco" aria-hidden="true">
        <span className="deco deco-1">🌸</span>
        <span className="deco deco-2">✨</span>
        <span className="deco deco-3">🌷</span>
        <span className="deco deco-4">💫</span>
        <span className="deco deco-5">🌿</span>
        <span className="deco deco-6">🎀</span>
        <span className="deco deco-7">⭐</span>
        <span className="deco deco-8">🌼</span>
      </div>

      <div className="login-card">
        {/* Mascot / hero area */}
        <div className="login-hero">
          <div className="login-mascot">
            <div className="mascot-ring mascot-ring-outer" />
            <div className="mascot-ring mascot-ring-inner" />
            <div className="mascot-icon">🌸</div>
          </div>
          <div className="login-brand">
            <span className="login-logo-text">Tempo</span>
            <span className="login-logo-badge">✦ beta</span>
          </div>
          <p className="login-tagline">Your calm, focused day<br/>starts right here ✨</p>
        </div>

        {/* Cute feature pills */}
        <div className="login-pills">
          <span className="login-pill">📅 Smart scheduling</span>
          <span className="login-pill">🔮 Focus mode</span>
          <span className="login-pill">🌿 Task tracking</span>
        </div>

        {showVerify ? (
          <div className="verify-banner">
            <div className="verify-icon">📬</div>
            <div className="verify-title">Check your inbox!</div>
            <div className="verify-body">We sent a magic link to <strong>{email}</strong>. Click it to activate your account, then come back to sign in 🌸</div>
            <button className="login-demo" onClick={() => { auth.setError(""); setMode("login"); }}>← Back to sign in</button>
          </div>
        ) : (
          <>
            <div className="login-tabs">
              <button className={`login-tab ${mode === "login" ? "active" : ""}`} onClick={() => { setMode("login"); auth.setError(""); }}>Sign in</button>
              <button className={`login-tab ${mode === "signup" ? "active" : ""}`} onClick={() => { setMode("signup"); auth.setError(""); }}>Create account</button>
            </div>

            <form className="login-form" onSubmit={handleSubmit}>
              {mode === "signup" && (
                <div className="login-field">
                  <label><span className="field-icon">👤</span> Your name</label>
                  <input type="text" placeholder="e.g. Alex" value={name} onChange={e => setName(e.target.value)} autoComplete="name" />
                </div>
              )}
              <div className="login-field">
                <label><span className="field-icon">✉️</span> Email</label>
                <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
              </div>
              <div className="login-field">
                <label><span className="field-icon">🔑</span> Password</label>
                <div className="pass-wrap">
                  <input type={showPass ? "text" : "password"} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} autoComplete={mode === "login" ? "current-password" : "new-password"} />
                  <button type="button" className="pass-toggle" onClick={() => setShowPass(v => !v)} aria-label={showPass ? "Hide password" : "Show password"}>{showPass ? "🙈" : "👁️"}</button>
                </div>
              </div>
              {auth.error && auth.error !== "__verify__" && (
                <div className="login-error">🌷 {auth.error}</div>
              )}
              <button type="submit" className="login-submit" disabled={auth.loading}>
                {auth.loading
                  ? <><span className="login-spinner" /><span>Just a moment…</span></>
                  : mode === "login"
                    ? <><span>Welcome back</span><span className="submit-arrow">→</span></>
                    : <><span>Start your journey</span><span className="submit-arrow">🌸</span></>}
              </button>
            </form>
          </>
        )}

        <p className="login-footer">🔒 Private by design · No ads, ever · Made with 💕</p>
      </div>
    </div>
  );
}

// ─── Overlap layout algorithm ─────────────────────────────────────────────────
// Returns a map of eventId -> { col, totalCols } for side-by-side rendering
function computeColumns(events) {
  const sorted = [...events].sort((a, b) => a.start - b.start);
  const cols = {}; // id -> col index
  const colEnds = []; // tracks end time of last event in each column

  for (const ev of sorted) {
    const startMs = ev.start.getTime(), endMs = ev.end.getTime();
    // Find first free column
    let col = colEnds.findIndex(end => end <= startMs);
    if (col === -1) { col = colEnds.length; colEnds.push(endMs); }
    else colEnds[col] = endMs;
    cols[ev.id] = col;
  }

  // Compute totalCols for each overlapping group
  const totalCols = {};
  for (const ev of sorted) {
    const col = cols[ev.id];
    // Find all events that overlap with this one
    const overlapping = sorted.filter(other =>
      other.id !== ev.id && other.start < ev.end && other.end > ev.start
    );
    const maxCol = Math.max(col, ...overlapping.map(o => cols[o.id]));
    totalCols[ev.id] = maxCol + 1;
  }
  return events.map(ev => ({ ...ev, _col: cols[ev.id] ?? 0, _totalCols: totalCols[ev.id] ?? 1 }));
}

// ─── Event Block (drag-to-reschedule) ────────────────────────────────────────
function EventBlock({ event, calendars, categories, onReschedule, onClick }) {
  const cal  = calendars.find(c => c.id === event.calendar);
  const cat  = categories.find(c => c.id === event.category);
  const sh   = event.start.getHours() + event.start.getMinutes() / 60;
  const eh   = event.end.getHours()   + event.end.getMinutes()   / 60;
  const top  = (sh - DAY_START) * HOUR_H;
  const height = Math.max((eh - sh) * HOUR_H - 2, 22);
  const color  = event.color || cal?.color || "#FF7BAC";
  const draggable = !event.fixed;
  const ref = useRef(null);
  const suppressClick = useRef(false);
  const [holdState, setHoldState] = useState("idle");

  const col = event._col ?? 0;
  const totalCols = event._totalCols ?? 1;
  const widthPct = 100 / totalCols;
  const leftPct  = col * widthPct;
  const colStyle = totalCols > 1
    ? { left: `${leftPct}%`, width: `calc(${widthPct}% - 3px)`, right: "auto" }
    : {};

  function startPressHoldDrag(e) {
    if (!draggable || (e.pointerType === "mouse" && e.button !== 0)) return;
    e.stopPropagation();
    const sx = e.clientX, sy = e.clientY, ot = top, dur = (event.end - event.start) / 60000;
    const pointerId = e.pointerId;
    let started = false;
    let latestEvent = e;
    let ghost = null;
    let tip = null;
    const el = ref.current;
    el?.setPointerCapture?.(pointerId);
    setHoldState("holding");
    const timer = setTimeout(() => {
      if (!ref.current) return;
      started = true;
      suppressClick.current = true;
      setHoldState("dragging");
      const r = ref.current.getBoundingClientRect();
      ghost = document.createElement("div");
      ghost.style.cssText = `position:fixed;width:${r.width}px;height:${height}px;background:${color}40;border:2px dashed ${color};border-radius:12px;pointer-events:none;z-index:9999;left:${r.left}px;top:${r.top}px;display:flex;align-items:center;padding:8px 12px;font-family:'Nunito',sans-serif;font-size:12px;font-weight:800;color:${color};`;
      ghost.textContent = event.title;
      document.body.appendChild(ghost);
      tip = document.createElement("div");
      tip.style.cssText = `position:fixed;background:#4A2840;color:white;padding:4px 10px;border-radius:8px;font-family:'Inconsolata',monospace;font-size:12px;font-weight:600;z-index:10000;pointer-events:none;`;
      document.body.appendChild(tip);
      move(latestEvent);
    }, EVENT_DRAG_HOLD_MS);
    function cleanup() {
      clearTimeout(timer);
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerup", up);
      document.removeEventListener("pointercancel", cancel);
      window.removeEventListener("blur", cancel);
      el?.releasePointerCapture?.(pointerId);
      if (ghost?.parentNode) ghost.remove();
      if (tip?.parentNode) tip.remove();
      setHoldState("idle");
    }
    function cancel() { cleanup(); }
    function move(pe) {
      latestEvent = pe;
      if (!started && Math.hypot(pe.clientX - sx, pe.clientY - sy) > EVENT_DRAG_MOVE_CANCEL_PX) { cleanup(); return; }
      if (!started || !ghost || !tip || !ref.current) return;
      pe.preventDefault?.();
      const dy = pe.clientY - sy, nt = ot + dy;
      ghost.style.top = `${ref.current.getBoundingClientRect().top - (top - nt)}px`;
      const rm = nt / HOUR_H * 60 + DAY_START * 60, sm = Math.round(rm / 5) * 5, em = sm + dur;
      const f12 = (h, m) => { const ap = h >= 12 ? "pm" : "am", hd = h > 12 ? h - 12 : h === 0 ? 12 : h; return m === 0 ? `${hd}${ap}` : `${hd}:${m.toString().padStart(2,"0")}${ap}`; };
      tip.textContent = `Move event · ${f12(Math.floor(sm/60), sm%60)} – ${f12(Math.floor(em/60), em%60)}`;
      tip.style.left = `${pe.clientX + 12}px`; tip.style.top = `${pe.clientY - 10}px`;
    }
    function up(pe) {
      const wasStarted = started;
      cleanup();
      if (!wasStarted) return;
      const dy = pe.clientY - sy, nt = ot + dy, rm = nt / HOUR_H * 60 + DAY_START * 60, sm = Math.round(rm / 5) * 5, cm = Math.max(DAY_START * 60, Math.min(sm, (DAY_END - 1) * 60));
      const ns = new Date(event.start); ns.setHours(Math.floor(cm / 60), cm % 60, 0, 0);
      const ne = new Date(ns.getTime() + dur * 60000);
      if (ns.getTime() !== event.start.getTime()) onReschedule(event.id, ns, ne);
      setTimeout(() => { suppressClick.current = false; }, 80);
    }
    document.addEventListener("pointermove", move, { passive: false });
    document.addEventListener("pointerup", up);
    document.addEventListener("pointercancel", cancel);
    window.addEventListener("blur", cancel);
  }

  return (
    <div ref={ref} className={`event-block ${event.fixed ? "fixed" : ""} hold-${holdState}`}
      onPointerDown={startPressHoldDrag}
      onClick={(e) => { e.stopPropagation(); if (suppressClick.current) { suppressClick.current = false; return; } onClick(event); }}
      style={{ top, height, borderLeftColor: color, background: `${color}18`, ...colStyle, touchAction: draggable ? "none" : "auto" }}
      title={draggable ? "Tap to edit · Hold to move" : "Fixed event · Tap to edit"}>
      <div className="event-title">{event.title}</div>
      {height > 38 && <div className="event-time">{fmt(event.start)} - {fmt(event.end)}</div>}
      {cat && height > 55 && <div className="event-cat"><span>{cat.icon}</span> {cat.label}</div>}
      {event.fixed && <span className="fixed-badge">🔒</span>}
      {!event.fixed && <span className="hold-cue">{holdState === "holding" ? "Keep holding…" : holdState === "dragging" ? "Move event" : "Tap to edit · Hold to move"}</span>}
    </div>
  );
}

// ─── Day View ─────────────────────────────────────────────────────────────────
function DayView({ events, calendars, categories, onReschedule, onEventClick, onDropTask, viewDate, onGridClick }) {
  const hours = []; for (let h = DAY_START; h < DAY_END; h++) hours.push(h);
  const now = new Date(); const nowTop = (now.getHours() + now.getMinutes() / 60 - DAY_START) * HOUR_H;
  const gridH = (DAY_END - DAY_START) * HOUR_H;
  const allDayEvents = events.filter(isAllDayOrMulti);
  const timedEvents = events.filter(e => !isAllDayOrMulti(e)).map(e => eventSegmentForDay(e, viewDate));
  const conflicts = timedEvents.filter(e => hasConflict(timedEvents, e));
  const hasEvents = events.length > 0;
  const scrollRef = useRef(null);
  const gridRef   = useRef(null);
  const [dropIndicator, setDropIndicator] = useState(null); // { top, label } while dragging over grid

  useEffect(() => {
    let el = scrollRef.current?.parentElement;
    while (el && !el.classList?.contains("calendar-pane")) el = el.parentElement;
    const scrollTo = Math.max(nowTop - 120, 8 * HOUR_H - 120);
    (el || document.querySelector(".calendar-pane"))?.scrollTo({ top: scrollTo, behavior: "smooth" });
  }, []);

  function snapToGrid(clientY) {
    if (!gridRef.current) return null;
    const rect = gridRef.current.getBoundingClientRect();
    const rawMins = ((clientY - rect.top) / HOUR_H) * 60 + DAY_START * 60;
    const snapped = Math.round(rawMins / 15) * 15;
    const clamped = Math.max(DAY_START * 60, Math.min(snapped, (DAY_END - 1) * 60));
    const top = ((clamped / 60) - DAY_START) * HOUR_H;
    const h = Math.floor(clamped / 60), m = clamped % 60;
    const ap = h >= 12 ? "pm" : "am", hd = h > 12 ? h - 12 : h === 0 ? 12 : h;
    const label = m === 0 ? `${hd}${ap}` : `${hd}:${m.toString().padStart(2,"0")}${ap}`;
    return { top, mins: clamped, label };
  }

  function onDragOver(e) {
    if (!e.dataTransfer.types.includes("application/tempo-task")) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    const snap = snapToGrid(e.clientY);
    if (snap) setDropIndicator(snap);
  }

  function onDragLeave(e) {
    // Only clear if leaving the grid itself, not a child element
    if (!gridRef.current?.contains(e.relatedTarget)) setDropIndicator(null);
  }

  function onDrop(e) {
    e.preventDefault();
    setDropIndicator(null);
    const raw = e.dataTransfer.getData("application/tempo-task");
    if (!raw) return;
    const task = JSON.parse(raw);
    const snap = snapToGrid(e.clientY);
    if (!snap) return;
    const start = new Date(viewDate);
    start.setHours(Math.floor(snap.mins / 60), snap.mins % 60, 0, 0);
    const end = new Date(start.getTime() + task.duration * 60000);
    const cal = task.category === "personal" || task.category === "health" ? "personal" : "work";
    onDropTask({
      id: "e" + uid(),
      title: task.title,
      start, end,
      calendar: cal,
      category: task.category,
      fixed: false,
      color: task.color,
      notes: `From task: ${task.title}`,
      recurrence: null,
      fromTaskId: task.id,
    });
  }

  function handleGridClick(e) {
    // Ignore clicks on event blocks
    if (e.target.closest(".event-block")) return;
    const snap = snapToGrid(e.clientY);
    if (!snap) return;
    const clickDate = new Date(viewDate);
    clickDate.setHours(Math.floor(snap.mins / 60), snap.mins % 60, 0, 0);
    onGridClick(clickDate);
  }

  return (
    <div className="day-view" ref={scrollRef}>
      <div className="drag-hint">⠿ Drag events to reschedule · Click empty slot to add/paste event · Drag tasks from panel</div>
      {allDayEvents.length > 0 && (
        <div className="all-day-strip">
          <span className="all-day-label">All-day</span>
          <div className="all-day-list">
            {allDayEvents.map(e => {
              const cal = calendars.find(c => c.id === e.calendar);
              const color = e.color || cal?.color || "#FF7BAC";
              return <button key={e.id} className="all-day-chip" style={{ borderLeft: `3px solid ${color}`, background: `${color}18`, color }} onClick={() => onEventClick(e)}>{e._continuesBefore ? "‹ " : ""}{e.title}{e._continuesAfter ? " ›" : ""}</button>;
            })}
          </div>
        </div>
      )}
      {conflicts.length > 0 && <div className="conflict-banner">⚠️ {conflicts.length} conflict{conflicts.length > 1 ? "s" : ""} — overlapping events</div>}
      <div className="day-grid" ref={gridRef} style={{ height: gridH }}
        onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop} onClick={handleGridClick}>
        {hours.map(h => {
          const label = h === 0 ? "12am" : h === 12 ? "12pm" : h === 24 ? "12am" : h > 12 ? `${h - 12}pm` : `${h}am`;
          return <div key={h} className="hour-row" style={{ top: (h - DAY_START) * HOUR_H }}><span className="hour-label">{label}</span><div className="hour-line" /></div>;
        })}
        {nowTop > 0 && nowTop < gridH && <div className="now-line" style={{ top: nowTop }}><div className="now-dot" /><div className="now-track" /></div>}
        {!hasEvents && (
          <div className="day-empty-state">
            <img src="/empty-calendar.png" alt="" draggable="false" />
            <div className="empty-state-title">Nothing scheduled — Tap anywhere to add an event 🌸</div>
          </div>
        )}
        {/* Drop indicator line */}
        {dropIndicator && (
          <div className="drop-indicator" style={{ top: dropIndicator.top }}>
            <div className="drop-indicator-dot" />
            <div className="drop-indicator-line" />
            <span className="drop-indicator-label">{dropIndicator.label}</span>
          </div>
        )}
        <div className="events-layer">{computeColumns(timedEvents).map(e => <EventBlock key={e.id} event={e} calendars={calendars} categories={categories} onReschedule={onReschedule} onClick={onEventClick} />)}</div>
      </div>
    </div>
  );
}

// ─── Week View (full timetable, like TimeTree) ────────────────────────────────
function WeekEventBlock({ ev, dayIndex, rect, calendars, categories, onEventClick, onReschedule, gridRef, days }) {
  const cal = calendars.find(c => c.id === ev.calendar);
  const cat = categories.find(c => c.id === ev.category);
  const color = ev.color || cal?.color || "#FF7BAC";
  const sh = ev.start.getHours() + ev.start.getMinutes() / 60;
  const eh = ev.end.getHours() + ev.end.getMinutes() / 60;
  const top = (sh - DAY_START) * HOUR_H;
  const height = Math.max((eh - sh) * HOUR_H - 2, 20);
  const dayColumnWidth = `calc((100% - 48px) / 7)`;
  const col = ev._col ?? 0, total = ev._totalCols ?? 1;
  const subWidth = 100 / total, subLeft = col * subWidth;
  const left = `calc(48px + ${dayIndex} * ${dayColumnWidth} + (${dayColumnWidth} * ${subLeft / 100}))`;
  const width = `calc(${dayColumnWidth} * ${subWidth / 100} - 3px)`;
  const suppressClick = useRef(false);
  const ref = useRef(null);
  const [holdState, setHoldState] = useState("idle");

  function onPointerDown(e) {
    if (ev.fixed || (e.pointerType === "mouse" && e.button !== 0)) return;
    e.stopPropagation();
    const sx = e.clientX, sy = e.clientY, dur = (ev.end - ev.start) / 60000;
    let started = false;
    let latestEvent = e;
    let ghost = null;
    let tip = null;
    const pointerId = e.pointerId;
    ref.current?.setPointerCapture?.(pointerId);
    setHoldState("holding");
    const timer = setTimeout(() => {
      if (!ref.current) return;
      started = true;
      suppressClick.current = true;
      setHoldState("dragging");
      const r = ref.current.getBoundingClientRect();
      ghost = document.createElement("div");
      ghost.style.cssText = `position:fixed;width:${r.width}px;height:${height}px;background:${color}40;border:2px dashed ${color};border-radius:10px;pointer-events:none;z-index:9999;left:${r.left}px;top:${r.top}px;display:flex;align-items:center;padding:6px 8px;font-family:'Nunito',sans-serif;font-size:11px;font-weight:800;color:${color};`;
      ghost.textContent = ev.title;
      document.body.appendChild(ghost);
      tip = document.createElement("div");
      tip.style.cssText = `position:fixed;background:#4A2840;color:white;padding:4px 10px;border-radius:8px;font-family:'Inconsolata',monospace;font-size:12px;font-weight:600;z-index:10000;pointer-events:none;`;
      document.body.appendChild(tip);
      move(latestEvent);
    }, EVENT_DRAG_HOLD_MS);
    function cleanup() {
      clearTimeout(timer);
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerup", up);
      document.removeEventListener("pointercancel", cancel);
      ref.current?.releasePointerCapture?.(pointerId);
      if (ghost?.parentNode) ghost.remove();
      if (tip?.parentNode) tip.remove();
      setHoldState("idle");
    }
    function cancel() { cleanup(); }
    function snap(pe) {
      if (!gridRef.current) return null;
      const g = gridRef.current.getBoundingClientRect();
      const dayW = (g.width - 48) / 7;
      const di = Math.max(0, Math.min(6, Math.floor((pe.clientX - g.left - 48) / dayW)));
      const rawMins = ((pe.clientY - g.top) / HOUR_H) * 60 + DAY_START * 60;
      const snapped = Math.round(rawMins / 15) * 15;
      const cm = Math.max(DAY_START * 60, Math.min(snapped, (DAY_END - 1) * 60));
      const ns = new Date(days[di]); ns.setHours(Math.floor(cm / 60), cm % 60, 0, 0);
      return { di, ns, ne: new Date(ns.getTime() + dur * 60000) };
    }
    function move(pe) {
      latestEvent = pe;
      if (!started && Math.hypot(pe.clientX - sx, pe.clientY - sy) > EVENT_DRAG_MOVE_CANCEL_PX) { cleanup(); return; }
      if (!started || !ghost || !tip) return;
      pe.preventDefault?.();
      const s = snap(pe);
      if (!s) return;
      ghost.style.left = `${pe.clientX - 40}px`; ghost.style.top = `${pe.clientY - 20}px`;
      tip.textContent = `Move event · ${fmt(s.ns)} – ${fmt(s.ne)}`;
      tip.style.left = `${pe.clientX + 12}px`; tip.style.top = `${pe.clientY - 10}px`;
    }
    function up(pe) {
      const wasStarted = started;
      cleanup();
      if (!wasStarted) return;
      const s = snap(pe);
      if (!s) return;
      if (s.ns.getTime() !== ev.start.getTime() || s.di !== dayIndex) onReschedule(ev.id, s.ns, s.ne);
      setTimeout(() => { suppressClick.current = false; }, 80);
    }
    document.addEventListener("pointermove", move, { passive: false });
    document.addEventListener("pointerup", up);
    document.addEventListener("pointercancel", cancel);
  }

  return (
    <div ref={ref} className={`wt-event hold-${holdState}`} onPointerDown={onPointerDown} onClick={e => { e.stopPropagation(); if (suppressClick.current) { suppressClick.current = false; return; } onEventClick(ev); }}
      style={{ top, height, color, background: `${color}18`, borderLeft: `3px solid ${color}`, left, width, cursor: ev.fixed ? "pointer" : "grab", touchAction: ev.fixed ? "auto" : "none" }}
      title={ev.fixed ? "Fixed · Click to edit" : "Tap to edit · Hold to move"}>
      <div className="wt-event-title">{ev.title}</div>
      {height > 30 && <div className="wt-event-time">{fmt(ev.start)} - {fmt(ev.end)}</div>}
      {height > 52 && cat && <div className="wt-event-cat">{cat.icon}</div>}
      {ev.fixed && <span className="fixed-badge">🔒</span>}
    </div>
  );
}

function WeekView({ events, calendars, categories, onEventClick, viewDate, onDayClick, onGridClick, onReschedule }) {
  const days = weekDays(viewDate);
  const hours = []; for (let h = DAY_START; h < DAY_END; h++) hours.push(h);
  const now = new Date();
  const nowTop = (now.getHours() + now.getMinutes() / 60 - DAY_START) * HOUR_H;
  const gridH = (DAY_END - DAY_START) * HOUR_H;

  const scrollRef = useRef(null);
  const gridRef = useRef(null);
  useEffect(() => {
    let el = scrollRef.current?.parentElement;
    while (el && !el.classList?.contains("calendar-pane")) el = el.parentElement;
    const scrollTo = Math.max(nowTop - 120, 8 * HOUR_H - 120);
    (el || document.querySelector(".calendar-pane"))?.scrollTo({ top: scrollTo, behavior: "smooth" });
  }, []);

  function snapFromPoint(clientX, clientY) {
    if (!gridRef.current) return null;
    const rect = gridRef.current.getBoundingClientRect();
    const dayW = (rect.width - 48) / 7;
    const di = Math.max(0, Math.min(6, Math.floor((clientX - rect.left - 48) / dayW)));
    const rawMins = ((clientY - rect.top) / HOUR_H) * 60 + DAY_START * 60;
    const snapped = Math.round(rawMins / 15) * 15;
    const cm = Math.max(DAY_START * 60, Math.min(snapped, (DAY_END - 1) * 60));
    const d = new Date(days[di]); d.setHours(Math.floor(cm / 60), cm % 60, 0, 0);
    return d;
  }
  function handleGridClick(e) {
    if (e.target.closest(".wt-event")) return;
    const d = snapFromPoint(e.clientX, e.clientY);
    if (d) onGridClick(d);
  }

  return (
    <div className="week-timetable" ref={scrollRef}>
      <div className="wt-header">
        <div className="wt-time-gutter" />
        {days.map((day, i) => {
          const isT = day.toDateString() === TODAY.toDateString();
          return (
            <div key={i} className={`wt-day-header ${isT ? "wt-today" : ""}`} onClick={() => onDayClick(day)}>
              <span className="wt-day-name">{day.toLocaleDateString("en-US", { weekday: "short" })}</span>
              <span className={`wt-day-num ${isT ? "wt-today-num" : ""}`}>{day.getDate()}</span>
            </div>
          );
        })}
      </div>

      <div className="week-all-day-row">
        <div className="wt-time-gutter"><span className="all-day-mini-label">All-day</span></div>
        {days.map(day => {
          const dayEvents = events.filter(e => eventOccursOnDay(e, day) && isAllDayOrMulti(e));
          return <div key={dateKey(day)} className="week-all-day-cell">{dayEvents.slice(0,3).map(e => {
            const cal = calendars.find(c => c.id === e.calendar); const color = e.color || cal?.color || "#FF7BAC";
            return <button key={e.id} className="week-all-day-chip" style={{ background: `${color}18`, borderLeft: `3px solid ${color}`, color }} onClick={() => onEventClick(e)}>{e.title}</button>;
          })}</div>;
        })}
      </div>

      <div className="wt-grid" ref={gridRef} style={{ height: gridH + 32 }} onClick={handleGridClick}>
        {hours.map(h => {
          const label = h === 0 ? "12am" : h === 12 ? "12pm" : h > 12 ? `${h-12}pm` : `${h}am`;
          return (
            <div key={h} className="wt-hour-row" style={{ top: (h - DAY_START) * HOUR_H }}>
              <div className="wt-time-gutter"><span className="wt-hour-label">{label}</span></div>
              {days.map((_, i) => <div key={i} className="wt-hour-cell" />)}
            </div>
          );
        })}

        {nowTop > 0 && nowTop < gridH && (
          <div className="wt-now-line" style={{ top: nowTop }}>
            <div className="wt-time-gutter"><div className="now-dot" /></div>
            {days.map((_, i) => <div key={i} className="wt-now-track-cell" />)}
          </div>
        )}

        {days.map((day, di) => {
          const de = events
            .filter(e => eventOccursOnDay(e, day) && !isAllDayOrMulti(e))
            .map(e => eventSegmentForDay(e, day))
            .sort((a, b) => a.start - b.start);
          return computeColumns(de).map(ev => <WeekEventBlock key={`${ev.id}-${dateKey(day)}`} ev={ev} dayIndex={di} days={days} gridRef={gridRef} calendars={calendars} categories={categories} onEventClick={onEventClick} onReschedule={onReschedule} />);
        })}
      </div>
    </div>
  );
}


function MonthEventRow({ event, color, onOpen, onReschedule }) {
  const suppressClick = useRef(false);
  const ref = useRef(null);

  function startPressDrag(e) {
    if (event.fixed || e.button !== 0) return;
    e.stopPropagation();
    const sy = e.clientY, sx = e.clientX;
    let started = false;
    let ghost = null;
    const timer = setTimeout(() => {
      started = true;
      suppressClick.current = true;
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      ghost = ref.current.cloneNode(true);
      ghost.style.cssText = `position:fixed;left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;pointer-events:none;z-index:10000;opacity:.82;box-shadow:var(--shadow-md);`;
      document.body.appendChild(ghost);
    }, EVENT_DRAG_HOLD_MS);
    function cleanup() {
      clearTimeout(timer);
      document.removeEventListener("mousemove", mv);
      document.removeEventListener("mouseup", up);
      window.removeEventListener("blur", cleanup);
      if (ghost?.parentNode) ghost.remove();
    }
    function mv(me) {
      if (!started && Math.hypot(me.clientX - sx, me.clientY - sy) > EVENT_DRAG_MOVE_CANCEL_PX) { cleanup(); return; }
      if (!started || !ghost) return;
      ghost.style.transform = `translate(${me.clientX - sx}px, ${me.clientY - sy}px)`;
    }
    function up(ue) {
      const wasStarted = started;
      cleanup();
      if (!wasStarted) return;
      const target = document.elementFromPoint(ue.clientX, ue.clientY)?.closest?.("[data-month-date]");
      const targetKey = target?.getAttribute("data-month-date");
      const targetDate = targetKey ? localDateFromKey(targetKey) : null;
      if (targetDate) {
        const dur = event.end - event.start;
        const ns = new Date(targetDate); ns.setHours(event.start.getHours(), event.start.getMinutes(), 0, 0);
        onReschedule(event.id, ns, new Date(ns.getTime() + dur));
      }
      setTimeout(() => { suppressClick.current = false; }, 80);
    }
    document.addEventListener("mousemove", mv);
    document.addEventListener("mouseup", up);
    window.addEventListener("blur", cleanup);
  }

  return (
    <div ref={ref} className="month-event-row" onMouseDown={startPressDrag}
      style={{ background: `${color}20`, borderLeft: `2px solid ${color}`, color: "var(--text)", cursor: event.fixed ? "pointer" : "grab" }}
      onClick={ev => { ev.stopPropagation(); if (suppressClick.current) { suppressClick.current = false; return; } onOpen(event); }}
      title={event.fixed ? "Fixed · Click to edit" : "Press and hold to drag · Click to edit"}>
      <span className="month-event-time">{isAllDayEvent(event) ? "All day" : `${event.start.getHours()}:${String(event.start.getMinutes()).padStart(2,"0")}`}</span>
      <span className="month-event-name">{event.title}</span>
    </div>
  );
}


// ─── Gamification UI ──────────────────────────────────────────────────────────
function LevelBar({ gameStats }) {
  if (!gameStats) return null;
  return (
    <div className="level-card">
      <div className="level-topline">
        <div>
          <div className="level-label">Level {gameStats.level}</div>
          <div className="level-title">{gameStats.title}</div>
        </div>
        <div className="level-xp">{gameStats.xpIntoLevel}/{gameStats.nextXP} XP</div>
      </div>
      <div className="level-track"><div className="level-fill" style={{ width: `${gameStats.levelPct}%` }} /></div>
      <div className="level-meta"><span>🔥 {gameStats.streaks.productive}d streak</span><span>🏅 {gameStats.unlockedBadges?.length || 0}/{gameStats.badges?.length || 0} badges</span></div>
    </div>
  );
}

function MascotProgressCard({ gameStats }) {
  if (!gameStats?.mascot) return null;
  const m = gameStats.mascot;
  return (
    <div className="mascot-progress-card game-soft-card">
      <div className="game-card-head">
        <span className="game-card-title">Mascot Progress</span>
        <span className="game-card-sub">{m.nextName === "Max Stage" ? "max glow" : `${m.toNext} lvl to next`}</span>
      </div>
      <div className={`mascot-stage ${m.mood}`}>
        <div className="mascot-stage-icon">{m.emoji}</div>
        <div className="mascot-stage-body">
          <div className="mascot-stage-name">{m.name}</div>
          <div className="mascot-stage-note">{m.note}<br/><span>{m.reaction}</span></div>
        </div>
      </div>
      <div className="level-track mini"><div className="level-fill" style={{ width: `${m.stagePct}%` }} /></div>
    </div>
  );
}

function DailyQuestsCard({ gameStats }) {
  if (!gameStats) return null;
  const done = gameStats.quests.filter(q => q.done).length;
  return (
    <div className="daily-quests-card">
      <div className="game-card-head">
        <div><span className="game-card-title">Daily Quests</span><span className="game-card-sub"> {done}/{gameStats.quests.length} cleared</span></div>
        <span className="score-pill">{gameStats.today.rank} Rank · {gameStats.today.score}</span>
      </div>
      <div className="quest-list">
        {gameStats.quests.map(q => (
          <div key={q.id} className={`quest-item ${q.done ? "done" : ""}`}>
            <span className="quest-icon">{q.done ? "✓" : q.icon}</span>
            <div className="quest-body"><div className="quest-title">{q.title}</div><div className="quest-desc">{q.desc}</div></div>
            <span className="quest-xp">+{q.xp} XP</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SkillStatsCard({ gameStats }) {
  if (!gameStats?.skills) return null;
  return (
    <div className="skills-card game-soft-card">
      <div className="game-card-head"><span className="game-card-title">Skill Stats</span><span className="game-card-sub">RPG growth</span></div>
      <div className="skill-list">
        {gameStats.skills.map(s => (
          <div key={s.id} className="skill-row" title={s.desc}>
            <div className="skill-main"><span className="skill-icon">{s.icon}</span><span className="skill-name">{s.label}</span><span className="skill-level">Lv {s.level}</span></div>
            <div className="skill-track"><div className="skill-fill" style={{ width: `${s.pct}%` }} /></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WeeklyRecapCard({ gameStats }) {
  if (!gameStats?.weekly) return null;
  const w = gameStats.weekly;
  return (
    <div className="weekly-recap-card game-soft-card">
      <div className="game-card-head"><span className="game-card-title">Weekly Recap</span><span className="score-pill">{w.rank} · {w.avgScore}</span></div>
      <div className="weekly-label">{w.label}</div>
      <div className="weekly-mini-grid">
        <div><strong>{w.tasksDone}</strong><span>tasks done</span></div>
        <div><strong>{w.focusHours}h</strong><span>focus</span></div>
        <div><strong>{w.journalDays}</strong><span>journal days</span></div>
        <div><strong>{w.bestDayLabel}</strong><span>best day</span></div>
      </div>
      <div className="weekly-bars">
        {w.daily.map(d => <span key={d.key} className={`weekly-dot rank-${d.rank.toLowerCase()}`} title={`${d.key}: ${d.score}`} />)}
      </div>
    </div>
  );
}

function ThemeUnlocksCard({ gameStats, limit = 6 }) {
  if (!gameStats?.themeUnlocks) return null;
  return (
    <div className="theme-unlocks-card game-soft-card">
      <div className="game-card-head"><span className="game-card-title">Theme Unlocks</span><span className="game-card-sub">earned styles</span></div>
      <div className="theme-unlock-list">
        {gameStats.themeUnlocks.slice(0, limit).map(t => (
          <div key={t.id} className={`theme-unlock-pill ${t.unlocked ? "unlocked" : "locked"}`} title={t.reason}>
            <span>{t.unlocked ? "✓" : "🔒"}</span><span>{t.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LifeGardenCard({ gameStats }) {
  if (!gameStats?.lifeGarden) return null;
  const g = gameStats.lifeGarden;
  return (
    <div className="life-garden-card game-soft-card">
      <div className="game-card-head"><span className="game-card-title">Monthly Life Garden</span><span className="game-card-sub">{g.activeDays} active · {g.goldenDays} gold</span></div>
      <div className="garden-label">{g.label}</div>
      <div className="garden-dow">{["M","T","W","T","F","S","S"].map((d,i)=><span key={i}>{d}</span>)}</div>
      <div className="garden-grid">
        {g.cells.map((c, i) => c ? (
          <div key={c.key} className={`garden-cell ${c.className}`} title={`${c.key} · ${c.rank} Rank · ${c.score}/100`}>
            <span className="garden-bloom">{c.bloom}</span><span className="garden-day">{c.day}</span>
          </div>
        ) : <div key={`empty-${i}`} className="garden-cell blank" />)}
      </div>
    </div>
  );
}

function BadgesPreview({ gameStats, limit = 6 }) {
  if (!gameStats) return null;
  const badges = gameStats.badges.slice(0, limit);
  return (
    <div className="badges-card">
      <div className="game-card-head"><span className="game-card-title">Achievements</span><span className="game-card-sub">{gameStats.unlockedBadges.length}/{gameStats.badges.length}</span></div>
      <div className="badge-grid">
        {badges.map(b => (
          <div key={b.id} className={`badge-chip ${b.unlocked ? "unlocked" : "locked"}`} title={b.desc}>
            <span className="badge-icon">{b.icon}</span>
            <span className="badge-name">{b.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function WeeklyMissionsCard({ gameStats }) {
  if (!gameStats?.weeklyMissions) return null;
  const done = gameStats.weeklyMissions.filter(m => m.done).length;
  return (
    <div className="weekly-missions-card game-soft-card">
      <div className="game-card-head"><span className="game-card-title">Weekly Missions</span><span className="game-card-sub">{done}/{gameStats.weeklyMissions.length} cleared</span></div>
      <div className="mission-list">
        {gameStats.weeklyMissions.map(m => (
          <div key={m.id} className={`mission-item ${m.done ? "done" : ""}`}>
            <div className="mission-top"><span>{m.icon} {m.title}</span><strong>{m.desc}</strong></div>
            <div className="mission-track"><div className="mission-fill" style={{ width: `${m.pct}%` }} /></div>
            <div className="mission-reward">+{m.xp} XP</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ComboCard({ gameStats }) {
  if (!gameStats?.combos) return null;
  const done = gameStats.combos.filter(c => c.done).length;
  return (
    <div className="combo-card game-soft-card">
      <div className="game-card-head"><span className="game-card-title">Combos</span><span className="game-card-sub">{done}/{gameStats.combos.length} active</span></div>
      <div className="combo-list">
        {gameStats.combos.map(c => (
          <div key={c.id} className={`combo-chip ${c.done ? "done" : ""}`} title={c.desc}>
            <span>{c.done ? "✓" : c.icon}</span><div><strong>{c.title}</strong><small>+{c.xp} XP</small></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BossBattlesCard({ gameStats }) {
  if (!gameStats?.bossBattles) return null;
  const bosses = gameStats.bossBattles;
  return (
    <div className="boss-card game-soft-card">
      <div className="game-card-head"><span className="game-card-title">Boss Battles</span><span className="game-card-sub">boss category</span></div>
      {bosses.length ? <div className="boss-list">
        {bosses.map(b => (
          <div key={b.id} className="boss-item">
            <div className="boss-top"><span>{b.icon} {b.title}</span><strong>{b.remaining} HP</strong></div>
            <div className="boss-track"><div className="boss-fill" style={{ width: `${b.pct}%` }} /></div>
            <div className="boss-meta">{b.period} · Defeat for +{b.rewardXP} XP</div>
          </div>
        ))}
      </div> : <div className="empty-game-note">No boss tasks right now. Set a task category to Boss Battle to spawn one 🐉</div>}
    </div>
  );
}

function StreaksCard({ gameStats }) {
  if (!gameStats?.streaks) return null;
  const rows = [
    ["🔥", "Productive", gameStats.streaks.productive],
    ["✅", "Tasks", gameStats.streaks.tasks],
    ["📔", "Memory", gameStats.streaks.journal],
    ["🔮", "Focus", gameStats.streaks.focus],
    ["🌙", "Review", gameStats.streaks.review],
    ["🗓️", "Planning", gameStats.streaks.planning],
  ];
  return (
    <div className="streaks-card game-soft-card">
      <div className="game-card-head"><span className="game-card-title">Streak Garden</span><span className="game-card-sub">gentle consistency</span></div>
      <div className="streak-grid">
        {rows.map(([icon, label, val]) => <div key={label} className="streak-pill"><span>{icon}</span><strong>{val}d</strong><small>{label}</small></div>)}
      </div>
    </div>
  );
}

function PersonalityCard({ gameStats }) {
  if (!gameStats?.personality) return null;
  const p = gameStats.personality;
  return (
    <div className="personality-card game-soft-card">
      <div className="game-card-head"><span className="game-card-title">Productivity Type</span><span className="game-card-sub">your style</span></div>
      <div className="personality-main"><span>{p.icon}</span><div><strong>{p.type}</strong><p>{p.desc}</p></div></div>
    </div>
  );
}

function PersonalLeaderboardCard({ gameStats }) {
  if (!gameStats?.leaderboard) return null;
  return (
    <div className="leaderboard-card game-soft-card">
      <div className="game-card-head"><span className="game-card-title">Best Days</span><span className="game-card-sub">beat yourself</span></div>
      {gameStats.leaderboard.length ? <div className="leaderboard-list">
        {gameStats.leaderboard.map(d => (
          <div key={d.key} className="leaderboard-row"><span className="leader-place">#{d.place}</span><strong>{d.label}</strong><span>{d.completed.length} tasks</span><span>{d.rank} · {d.score}</span></div>
        ))}
      </div> : <div className="empty-game-note">Your best days will appear here after you complete tasks, focus, or journal 🌱</div>}
    </div>
  );
}

function GameDashboard({ gameStats, compact = false }) {
  if (!gameStats) return null;
  return (
    <div className={`game-dashboard ${compact ? "compact" : ""}`}>
      <MascotProgressCard gameStats={gameStats} />
      <DailyQuestsCard gameStats={gameStats} />
      <StreaksCard gameStats={gameStats} />
      <XPBreakdownCard gameStats={gameStats} />
      <BloomCollapse title="Weekly missions" defaultOpen={false}><WeeklyMissionsCard gameStats={gameStats} /></BloomCollapse>
      <BloomCollapse title="Skills & personality" defaultOpen={false}><SkillStatsCard gameStats={gameStats} /><PersonalityCard gameStats={gameStats} /></BloomCollapse>
      <BloomCollapse title="Badges & theme unlocks" defaultOpen={false}><BadgesPreview gameStats={gameStats} limit={8} /><ThemeUnlocksCard gameStats={gameStats} /></BloomCollapse>
      <BloomCollapse title="Boss battles & combos" defaultOpen={false}><ComboCard gameStats={gameStats} /><BossBattlesCard gameStats={gameStats} /></BloomCollapse>
      <BloomCollapse title="Weekly recap & life garden" defaultOpen={false}><WeeklyRecapCard gameStats={gameStats} /><LifeGardenCard gameStats={gameStats} /></BloomCollapse>
      <BloomCollapse title="Personal leaderboard" defaultOpen={false}><PersonalLeaderboardCard gameStats={gameStats} /></BloomCollapse>
    </div>
  );
}

function BloomRoomPage({ gameStats }) {
  return (
    <div className="bloom-room-page">
      <div className="journal-header">
        <div>
          <div className="journal-title">🌸 Bloom Room</div>
          <div className="bloom-room-subtitle">Your cozy productivity game space</div>
        </div>
        <div className="journal-streak">Lvl {gameStats?.level ?? 1} · {gameStats?.today?.rank ?? "D"} Rank · {gameStats?.unlockedBadges?.length ?? 0} badges</div>
      </div>
      <GameDashboard gameStats={gameStats} />
    </div>
  );
}

// ─── Task Item ────────────────────────────────────────────────────────────────
function TaskItem({ task, onToggle, onStartPomodoro, categories, onEdit }) {
  const [expanded, setExpanded] = useState(false);
  const cat = categories.find(c => c.id === task.category);
  const pri = PRIORITIES.find(p => p.id === task.priority);
  const color = cat?.color || "var(--accent)";
  const pointerDragRef = useRef(null);

  function startPointerDrag(e) {
    if (task.done || e.pointerType === "mouse" || e.target.closest?.("button,input,textarea,select")) return;
    const startX = e.clientX, startY = e.clientY;
    let started = false;
    let ghost = null;
    const timer = setTimeout(() => {
      started = true;
      try { e.target.setPointerCapture?.(e.pointerId); } catch {}
      ghost = document.createElement("div");
      ghost.className = "task-mobile-drag-ghost";
      ghost.textContent = task.title;
      ghost.style.left = `${startX}px`;
      ghost.style.top = `${startY}px`;
      document.body.appendChild(ghost);
    }, EVENT_DRAG_HOLD_MS);
    function cleanup() {
      clearTimeout(timer);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", cleanup);
      if (ghost?.parentNode) ghost.remove();
      pointerDragRef.current = null;
    }
    function move(me) {
      if (!started) {
        if (Math.hypot(me.clientX - startX, me.clientY - startY) > EVENT_DRAG_MOVE_CANCEL_PX) cleanup();
        return;
      }
      me.preventDefault();
      if (ghost) { ghost.style.left = `${me.clientX}px`; ghost.style.top = `${me.clientY}px`; }
      document.querySelectorAll(".task-period-card.drag-touch-over").forEach(el => el.classList.remove("drag-touch-over"));
      document.elementFromPoint(me.clientX, me.clientY)?.closest?.(".task-period-card")?.classList.add("drag-touch-over");
    }
    function up(ue) {
      const wasStarted = started;
      const target = document.elementFromPoint(ue.clientX, ue.clientY)?.closest?.(".task-period-card");
      const scope = target?.getAttribute("data-task-scope");
      const anchor = target?.getAttribute("data-period-anchor");
      cleanup();
      document.querySelectorAll(".task-period-card.drag-touch-over").forEach(el => el.classList.remove("drag-touch-over"));
      if (wasStarted && scope && anchor) {
        window.dispatchEvent(new CustomEvent("tempo-mobile-task-drop", { detail: { id: task.id, scope, anchor } }));
      }
    }
    pointerDragRef.current = { cleanup };
    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", cleanup);
  }

  function onDragStart(e) {
    e.dataTransfer.effectAllowed = "copy";
    e.dataTransfer.setData("application/tempo-task", JSON.stringify({
      id: task.id, title: task.title, duration: task.duration,
      category: task.category, color: cat?.color || null,
    }));
    const ghost = document.createElement("div");
    ghost.style.cssText = `position:fixed;top:-200px;left:0;padding:7px 12px;border-radius:10px;background:${cat?.color || "#FF7BAC"}20;border-left:3px solid ${cat?.color || "#FF7BAC"};font-family:'Nunito',sans-serif;font-size:12px;font-weight:800;color:${cat?.color || "#FF7BAC"};white-space:nowrap;`;
    ghost.textContent = `${task.title} (${formatTaskDuration(task.duration)})`;
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 0, 14);
    setTimeout(() => ghost.remove(), 0);
  }

  return (
    <div className={`task-item ${task.done ? "done" : ""}`} data-priority={task.priority}
      draggable={!task.done} onDragStart={!task.done ? onDragStart : undefined} onPointerDown={!task.done ? startPointerDrag : undefined}>
      {!task.done && <span className="task-drag-handle" title="Drag to schedule">⠿</span>}
      <button className="task-check" onClick={() => onToggle(task.id)} aria-label={task.done ? "Mark incomplete" : "Mark complete"} aria-pressed={task.done}>{task.done ? "✓" : ""}</button>
      <div className="task-body" onClick={() => setExpanded(v => !v)}>
        <div className="task-title">{task.title}</div>
        <div className="task-meta">
          <span style={{ color: cat?.color }}>{cat?.icon} {cat?.label}</span>
          <span>{formatTaskDuration(task.duration)}</span>
          {task.recurrence && <span>↻ {normalizeRecurrence(task.recurrence)?.frequency}</span>}
          {pri && <span style={{ color: pri.color }}>{pri.icon} {pri.label}</span>}
          {task.deadline && <span className="deadline">due {task.deadline.slice(5)}</span>}
          {task.notes && <span title={task.notes}>📝</span>}
        </div>
        {expanded && task.notes && <div className="task-notes">{task.notes}</div>}
      </div>
      <button className="pomo-btn" onClick={() => onEdit(task)} title="Edit task">✎</button>
      {!task.done && <button className="pomo-btn" onClick={() => onStartPomodoro(task.id)} title="Start Pomodoro">⏱</button>}
    </div>
  );
}

// ─── Task Panel ───────────────────────────────────────────────────────────────
function TaskPanel({ tasks, categories, onToggle, onAdd, onEdit, onStartPomodoro, scope, setScope, periodDate = TODAY, setPeriodDate = () => {}, standalone = false, mobileOpen = false, onMobileClose }) {
  const [collapsed, setCollapsed] = useState(false);
  const [adding, setAdding]       = useState(false);
  const [durationDraft, setDurationDraft] = useState({ amount: 30, unit: "minutes" });
  const [form, setForm]           = useState({ title: "", duration: 30, category: "deep", scope, deadline: "", priority: "medium", notes: "", recurrence: null });
  useEffect(() => {
    if (adding) setForm(f => ({ ...f, scope }));
  }, [adding, scope]);
  const filtered = tasks.filter(t => taskBelongsToPeriod(t, scope, periodDate));
  const openTasks = filtered.filter(t => !t.done);
  const urgent   = tasks.filter(t => !t.done && t.deadline && (localDateFromKey(t.deadline) || new Date(t.deadline)) <= new Date(TODAY.getTime() + 3 * 86400000));
  function handleAdd() {
    if (!form.title.trim()) return;
    const duration = taskDurationToMinutes(durationDraft.amount, durationDraft.unit);
    onAdd(withTaskPeriod({ ...form, title: form.title.trim(), duration, id: "t" + uid(), done: false, completedAt: null, completedDate: null }, periodDate));
    setForm({ title: "", duration: 30, category: "deep", scope, deadline: "", priority: "medium", notes: "", recurrence: null });
    setDurationDraft({ amount: 30, unit: "minutes" });
    setAdding(false);
  }
  return (
    <div className={`task-panel ${collapsed ? "collapsed" : ""} ${standalone ? "standalone" : ""} ${mobileOpen ? "mobile-open" : ""}`}>
      {!standalone && <button className="task-panel-toggle" onClick={() => setCollapsed(v => !v)} title={collapsed ? "Expand tasks" : "Collapse tasks"}>{collapsed ? "‹" : "›"}</button>}
      <div className="task-panel-inner">
        <div className="panel-header">
          <span className="panel-title">Tasks</span>
          {urgent.length > 0 && <span className="urgent-badge">⚠️ {urgent.length}</span>}
          {!standalone && <div className="scope-tabs">{["day","week","month"].map(s => <button key={s} className={`scope-tab ${scope === s ? "active" : ""}`} onClick={() => setScope(s)}>{s}</button>)}</div>}
          {standalone && <div className="scope-tabs">{["day","week","month"].map(s => <button key={s} className={`scope-tab ${scope === s ? "active" : ""}`} onClick={() => setScope(s)}>{s}</button>)}</div>}
          <button className="add-btn" onClick={() => setAdding(v => !v)}>+</button>
          {onMobileClose && <button className="add-btn" onClick={onMobileClose}>✕</button>}
        </div>
        <div className="task-period-nav">
          <button className="period-btn" onClick={() => setPeriodDate(d => shiftTaskPeriodDate(d, scope, -1))}>‹</button>
          <button className="period-label" onClick={() => setPeriodDate(new Date(TODAY))}>{formatTaskPeriodLabel(scope, periodDate)}</button>
          <button className="period-btn" onClick={() => setPeriodDate(d => shiftTaskPeriodDate(d, scope, 1))}>›</button>
        </div>
      {adding && (
        <div className="task-form">
          <input className="tf-input" placeholder="Task name..." value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} autoFocus />
          <div className="tf-row">
            <select className="tf-select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>{categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}</select>
            <select className="tf-select" value={form.scope} onChange={e => setForm(f => ({ ...f, scope: e.target.value }))}><option value="day">Day</option><option value="week">Week</option><option value="month">Month</option></select>
          </div>
          <div className="task-period-hint">Saving to {form.scope === "week" ? "week" : form.scope === "month" ? "month" : "day"}: {formatTaskPeriodLabel(form.scope, periodDate)}</div>
          <div className="tf-row">
            <select className="tf-select" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>{PRIORITIES.map(p => <option key={p.id} value={p.id}>{p.icon} {p.label}</option>)}</select>
            <input type="date" className="tf-input tf-date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
          </div>
          <div className="tf-row">
            <div className="tf-duration"><span>⏱</span><input type="number" className="tf-num" value={durationDraft.amount} min={1} step={durationDraft.unit === "minutes" ? 5 : 1} onChange={e => setDurationDraft(d => ({ ...d, amount: Number(e.target.value) || 1 }))}/><select className="tf-select" value={durationDraft.unit} onChange={e => setDurationDraft(d => ({ ...d, unit: e.target.value }))}><option value="minutes">min</option><option value="hours">hours</option><option value="days">days</option></select></div>
          </div>
          <div className="tf-row">
            <select className="tf-select" value={form.recurrence || ""} onChange={e => setForm(f => ({ ...f, recurrence: e.target.value || null }))}><option value="">No repeat</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="weekdays">Weekdays</option><option value="monthly">Monthly</option></select>
          </div>
          <textarea className="tf-input tf-notes" placeholder="Notes (optional)..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
          <div className="tf-actions"><button className="tf-cancel" onClick={() => setAdding(false)}>Cancel</button><button className="tf-save" onClick={handleAdd}>Add task</button></div>
        </div>
      )}
      <div className="task-list">
        {openTasks.length === 0 ? (
          <div className="task-empty-state">
            <img src="/empty-tasks.png" alt="" draggable="false" />
            <div className="empty-state-title">All clear! No tasks for now. Enjoy the free time 🌸</div>
          </div>
        ) : (
          [...filtered].sort((a, b) => ({high:0,medium:1,low:2}[a.priority]??1) - ({high:0,medium:1,low:2}[b.priority]??1)).map(t => <TaskItem key={t.id} task={t} onToggle={onToggle} onEdit={onEdit} onStartPomodoro={onStartPomodoro} categories={categories} />)
        )}
      </div>
      <div className="task-footer"><span>{filtered.filter(t => !t.done).length} remaining</span><span>{filtered.filter(t => t.done).length} done ✅</span></div>
      </div>
    </div>
  );
}

function TaskModal({ task, categories, onClose, onSave, onDelete }) {
  const initial = splitTaskDuration(task.duration);
  const [form, setForm] = useState({ ...task, deadline: task.deadline || "", recurrence: task.recurrence || null });
  const [durationDraft, setDurationDraft] = useState(initial);
  const [periodDate, setPeriodDate] = useState(taskAnchorDate(task, TODAY));
  function saveTask() {
    if (!form.title.trim()) return;
    const becameDone = Boolean(form.done) && !Boolean(task.done);
    const stayedDone = Boolean(form.done) && Boolean(task.done);
    const perioded = withTaskPeriod({
      ...form,
      title: form.title.trim(),
      duration: taskDurationToMinutes(durationDraft.amount, durationDraft.unit),
    }, periodDate);
    const completionKey = taskCompletionTargetKey(perioded);
    onSave({
      ...perioded,
      completedAt: Boolean(form.done) ? (becameDone ? new Date().toISOString() : (stayedDone ? (task.completedAt || new Date().toISOString()) : new Date().toISOString())) : null,
      completedDate: Boolean(form.done) ? (taskScopeOf(perioded) === "day" ? completionKey : (becameDone ? completionKey : (task.completedDate || taskCompletedDateKey(task) || completionKey))) : null,
    });
    onClose();
  }
  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Edit task">
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <input className="modal-title-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Task title" autoFocus />
          <button className="modal-close" onClick={requestClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="modal-row"><label>Category</label><select className="modal-select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>{categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}</select></div>
          <div className="modal-row"><label>Scope</label><select className="modal-select" value={form.scope} onChange={e => setForm(f => ({ ...f, scope: e.target.value }))}><option value="day">Day</option><option value="week">Week</option><option value="month">Month</option></select></div>
          <div className="modal-row"><label>{form.scope === "week" ? "Week" : form.scope === "month" ? "Month" : "Day"}</label>{form.scope === "month" ? <input type="month" className="modal-select" value={monthKey(periodDate)} onChange={e => setPeriodDate(localDateFromMonthKey(e.target.value) || new Date(TODAY))}/> : <input type="date" className="modal-select" value={dateKey(periodDate)} onChange={e => setPeriodDate(localDateFromKey(e.target.value) || new Date(TODAY))}/>}</div>
          <div className="modal-row"><label>Priority</label><select className="modal-select" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>{PRIORITIES.map(p => <option key={p.id} value={p.id}>{p.icon} {p.label}</option>)}</select></div>
          <div className="modal-row"><label>Duration</label><input type="number" className="modal-select modal-time" min={1} value={durationDraft.amount} onChange={e => setDurationDraft(d => ({ ...d, amount: Number(e.target.value) || 1 }))}/><select className="modal-select" value={durationDraft.unit} onChange={e => setDurationDraft(d => ({ ...d, unit: e.target.value }))}><option value="minutes">minutes</option><option value="hours">hours</option><option value="days">days</option></select></div>
          <div className="modal-row"><label>Deadline</label><input type="date" className="modal-select" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}/></div>
          <div className="modal-row"><label>Recurrence</label><select className="modal-select" value={form.recurrence || ""} onChange={e => setForm(f => ({ ...f, recurrence: e.target.value || null }))}><option value="">No repeat</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="weekdays">Weekdays</option><option value="monthly">Monthly</option></select></div>
          <div className="modal-row"><label>Done</label><input type="checkbox" checked={Boolean(form.done)} onChange={e => setForm(f => ({ ...f, done: e.target.checked }))}/></div>
          <div className="modal-row modal-col"><label>Notes</label><textarea className="modal-textarea" rows={3} value={form.notes || ""} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}/></div>
        </div>
        <div className="modal-footer">{onDelete && <button className="modal-delete" onClick={() => { onDelete(task.id); onClose(); }}>🗑️ Delete</button>}<div style={{ display: "flex", gap: 8 }}><button className="tf-cancel" onClick={requestClose}>Cancel</button><button className="tf-save" onClick={saveTask}>Save changes</button></div></div>
      </div>
    </div>
  );
}

function TaskPeriodCard({ cardScope, tasks, categories, periodDate, setPeriodDate, onToggle, onEdit, onStartPomodoro, onAdd, onMoveTaskPeriod, onSelectScope }) {
  const [isOver, setIsOver] = useState(false);
  const [adding, setAdding] = useState(false);
  const [durationDraft, setDurationDraft] = useState({ amount: 30, unit: "minutes" });
  const [form, setForm] = useState({ title: "", category: "deep", priority: "medium", deadline: "", notes: "", recurrence: null });
  const filtered = tasks.filter(t => taskBelongsToPeriod(t, cardScope, periodDate));
  const sorted = [...filtered].sort((a, b) => Number(a.done) - Number(b.done) || (({high:0,medium:1,low:2}[a.priority]??1) - ({high:0,medium:1,low:2}[b.priority]??1)));
  const openCount = filtered.filter(t => !t.done).length;

  function addCardTask() {
    if (!form.title.trim()) return;
    const duration = taskDurationToMinutes(durationDraft.amount, durationDraft.unit);
    onAdd(withTaskPeriod({ ...form, id: "t" + uid(), title: form.title.trim(), duration, scope: cardScope, done: false, completedAt: null, completedDate: null }, periodDate));
    setForm({ title: "", category: "deep", priority: "medium", deadline: "", notes: "", recurrence: null });
    setDurationDraft({ amount: 30, unit: "minutes" });
    setAdding(false);
  }

  function handleDrop(e) {
    e.preventDefault();
    setIsOver(false);
    const raw = e.dataTransfer.getData("application/tempo-task");
    if (!raw) return;
    try {
      const payload = JSON.parse(raw);
      if (payload?.id) onMoveTaskPeriod(payload.id, cardScope, periodDate);
    } catch {}
  }

  return (
    <div className={`task-period-card ${isOver ? "drag-over" : ""}`} data-task-scope={cardScope} data-period-anchor={dateKey(periodDate)} onDragOver={e => { e.preventDefault(); setIsOver(true); }} onDragLeave={() => setIsOver(false)} onDrop={handleDrop}>
      <div className="task-period-card-head">
        <button className="task-period-card-title" onClick={() => onSelectScope(cardScope)}>{cardScope === "day" ? "☀️ Day" : cardScope === "week" ? "🗓️ Week" : "🌙 Month"}</button>
        <span className="task-period-count">{openCount} open</span>
      </div>
      <div className="task-period-card-sub card-nav-inline">
        <button type="button" onClick={() => setPeriodDate(d => shiftTaskPeriodDate(d, cardScope, -1))}>‹</button>
        <span>{formatTaskPeriodLabel(cardScope, periodDate)}</span>
        <button type="button" onClick={() => setPeriodDate(d => shiftTaskPeriodDate(d, cardScope, 1))}>›</button>
      </div>
      <button className="task-card-add" onClick={() => setAdding(v => !v)}>+ Add {cardScope} task</button>
      {adding && (
        <div className="task-form task-card-form">
          <input className="tf-input" placeholder="Task name..." value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} autoFocus />
          <div className="tf-row">
            <select className="tf-select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>{categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}</select>
            <select className="tf-select" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>{PRIORITIES.map(p => <option key={p.id} value={p.id}>{p.icon} {p.label}</option>)}</select>
          </div>
          <div className="tf-row">
            <div className="tf-duration"><span>⏱</span><input type="number" className="tf-num" value={durationDraft.amount} min={1} step={durationDraft.unit === "minutes" ? 5 : 1} onChange={e => setDurationDraft(d => ({ ...d, amount: Number(e.target.value) || 1 }))}/><select className="tf-select" value={durationDraft.unit} onChange={e => setDurationDraft(d => ({ ...d, unit: e.target.value }))}><option value="minutes">min</option><option value="hours">hours</option><option value="days">days</option></select></div>
          </div>
          <div className="tf-row">
            <select className="tf-select" value={form.recurrence || ""} onChange={e => setForm(f => ({ ...f, recurrence: e.target.value || null }))}><option value="">No repeat</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="weekdays">Weekdays</option><option value="monthly">Monthly</option></select>
          </div>
          <textarea className="tf-input tf-notes" placeholder="Notes (optional)..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
          <div className="tf-actions"><button className="tf-cancel" onClick={() => setAdding(false)}>Cancel</button><button className="tf-save" onClick={addCardTask}>Add task</button></div>
        </div>
      )}
      <div className="task-period-list">
        {sorted.length ? sorted.map(t => <div key={t.id} className="task-card-with-move"><TaskItem task={t} onToggle={onToggle} onEdit={onEdit} onStartPomodoro={onStartPomodoro} categories={categories} />{cardScope !== "day" && <button className="mini-move-btn" onClick={() => onMoveTaskPeriod(t.id, "day", new Date(TODAY))}>Move to Day</button>}{cardScope !== "week" && <button className="mini-move-btn" onClick={() => onMoveTaskPeriod(t.id, "week", new Date(TODAY))}>Move to Week</button>}{cardScope !== "month" && <button className="mini-move-btn" onClick={() => onMoveTaskPeriod(t.id, "month", new Date(TODAY))}>Move to Month</button>}</div>) : <div className="task-card-empty">No tasks here yet 🌸<br/><small>Drop a task here or add one small task.</small></div>}
      </div>
    </div>
  );
}

function TasksPage({ tasks, categories, onToggle, onAdd, onEdit, onStartPomodoro, scope, setScope, periodDate, setPeriodDate, onMoveTaskPeriod, gameStats }) {
  useEffect(() => {
    const handler = e => {
      const { id, scope: targetScope, anchor } = e.detail || {};
      const anchorDate = localDateFromKey(anchor) || periodDate;
      if (id && targetScope) onMoveTaskPeriod(id, targetScope, anchorDate);
    };
    window.addEventListener("tempo-mobile-task-drop", handler);
    return () => window.removeEventListener("tempo-mobile-task-drop", handler);
  }, [onMoveTaskPeriod, periodDate]);
  return (
    <div className="tasks-page">
      <div className="journal-header">
        <div>
          <div className="journal-title">✅ Tasks</div>
          <div className="memory-book-subtitle">Drag a task into Day, Week, or Month to move it there.</div>
        </div>
        <div className="journal-streak">{tasks.filter(t => !t.done).length} open</div>
      </div>
      <div className="task-period-board">
        {["day", "week", "month"].map(s => (
          <TaskPeriodCard key={s} cardScope={s} tasks={tasks} categories={categories} periodDate={periodDate} setPeriodDate={setPeriodDate} onToggle={onToggle} onEdit={onEdit} onStartPomodoro={onStartPomodoro} onAdd={onAdd} onMoveTaskPeriod={onMoveTaskPeriod} onSelectScope={next => setScope(next)} />
        ))}
      </div>
    </div>
  );
}


// ─── Event Modal ──────────────────────────────────────────────────────────────
function RecurrenceEditor({ value, onChange, startDate }) {
  const rec = normalizeRecurrence(value);
  const freq = rec?.frequency || "";
  const byWeekdays = rec?.byWeekdays || [startDate?.getDay?.() ?? TODAY.getDay()];
  const setFreq = frequency => onChange(frequency ? { ...(rec || {}), frequency, interval: rec?.interval || 1, endMode: rec?.endMode || "never" } : null);
  const setRec = patch => onChange({ ...(rec || { frequency: "daily", interval: 1, endMode: "never" }), ...patch });
  const days = ["S","M","T","W","T","F","S"];
  return (
    <div className="recurrence-editor">
      <select className="modal-select" value={freq} onChange={e => setFreq(e.target.value)}>
        <option value="">Does not repeat</option>
        <option value="daily">Daily</option>
        <option value="weekly">Weekly</option>
        <option value="weekdays">Every weekday</option>
        <option value="monthly">Monthly</option>
      </select>
      {freq && (
        <div className="recurrence-custom">
          <div className="modal-row"><label>Every</label><input type="number" min={1} className="modal-select modal-time" value={rec?.interval || 1} onChange={e => setRec({ interval: Math.max(1, Number(e.target.value) || 1) })}/><span style={{fontSize:12,color:"var(--text2)"}}>{freq === "monthly" ? "month(s)" : freq === "weekly" ? "week(s)" : "day(s)"}</span></div>
          {freq === "weekly" && (
            <div className="weekday-picker">
              {days.map((d,i) => <button key={i} className={`weekday-btn ${byWeekdays.includes(i) ? "active" : ""}`} onClick={() => {
                const next = byWeekdays.includes(i) ? byWeekdays.filter(x => x !== i) : [...byWeekdays, i].sort();
                setRec({ byWeekdays: next.length ? next : [i] });
              }}>{d}</button>)}
            </div>
          )}
          <div className="modal-row"><label>Ends</label><select className="modal-select" value={rec?.endMode || (rec?.until ? "on" : rec?.count ? "after" : "never")} onChange={e => setRec({ endMode: e.target.value, until: e.target.value === "on" ? (rec?.until || dateKey(addDaysSafe(startDate || TODAY, 30))) : undefined, count: e.target.value === "after" ? (rec?.count || 10) : undefined })}><option value="never">Never</option><option value="on">On date</option><option value="after">After count</option></select></div>
          {(rec?.endMode === "on" || rec?.until) && <div className="modal-row"><label>Until</label><input type="date" className="modal-select" value={rec?.until || rec?.endDate || ""} onChange={e => setRec({ until: e.target.value, endMode: "on" })}/></div>}
          {(rec?.endMode === "after" || rec?.count) && <div className="modal-row"><label>Count</label><input type="number" min={1} className="modal-select modal-time" value={rec?.count || 10} onChange={e => setRec({ count: Math.max(1, Number(e.target.value) || 1), endMode: "after" })}/></div>}
        </div>
      )}
    </div>
  );
}

function EventModal({ event, calendars, categories, onClose, onSave, onDelete, onCopy }) {
  const [form, setForm] = useState({ ...event, allDay: Boolean(event.allDay) });
  const cal = calendars.find(c => c.id === form.calendar);
  const COLORS = ["#FF7BAC","#B08AE0","#7CBAFF","#70C8A0","#FFB870","#FF9F9F","#C9A0FF","#7EC8C8"];
  const startDate = toDateInput(form.start);
  const endDateForInput = form.allDay ? dateKey(addDaysSafe(form.end, -1)) : toDateInput(form.end);
  function updateStartDate(v) {
    const oldStart = form.start;
    const dur = form.end - form.start;
    const st = form.allDay ? applyDateAndTime(v, "00:00") : applyDateAndTime(v, toTimeInputValue(oldStart));
    const en = form.allDay ? endOfDay(st) : new Date(st.getTime() + dur);
    setForm(f => ({ ...f, start: st, end: en }));
  }
  function updateEndDate(v) {
    const en = form.allDay ? endOfDay(applyDateAndTime(v, "00:00")) : applyDateAndTime(v, toTimeInputValue(form.end));
    setForm(f => ({ ...f, end: en }));
  }
  function updateAllDay(checked) {
    if (checked) {
      const st = dayStart(form.start);
      const en = endOfDay(form.end);
      setForm(f => ({ ...f, allDay: true, start: st, end: en }));
    } else {
      const st = cloneDate(form.start); st.setHours(9,0,0,0);
      const en = cloneDate(form.start); en.setHours(10,0,0,0);
      setForm(f => ({ ...f, allDay: false, start: st, end: en }));
    }
  }
  function saveForm() {
    if (!form.title.trim()) return;
    if (form.end <= form.start) return;
    onSave({ ...form, title: form.title.trim() });
    onClose();
  }
  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Edit event">
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header" style={{ borderLeft: `4px solid ${form.color || cal?.color || "#FF7BAC"}` }}>
          <input className="modal-title-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Event title" />
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="modal-row"><label>All day</label><input type="checkbox" checked={form.allDay} onChange={e => updateAllDay(e.target.checked)}/></div>
          <div className="modal-row"><label>Start date</label><input type="date" className="modal-select" value={startDate} onChange={e => updateStartDate(e.target.value)} /></div>
          <div className="modal-row"><label>End date</label><input type="date" className="modal-select" value={endDateForInput} onChange={e => updateEndDate(e.target.value)} /></div>
          {!form.allDay && <div className="modal-row"><label>Start</label><input type="time" className="modal-select modal-time" value={toTimeInputValue(form.start)} onChange={e => setForm(f => ({ ...f, start: applyDateAndTime(toDateInput(f.start), e.target.value) }))} /><label style={{marginLeft:8}}>End</label><input type="time" className="modal-select modal-time" value={toTimeInputValue(form.end)} onChange={e => setForm(f => ({ ...f, end: applyDateAndTime(toDateInput(f.end), e.target.value) }))} /></div>}
          <div className="modal-row"><label>Calendar</label><select className="modal-select" value={form.calendar} onChange={e => setForm(f => ({ ...f, calendar: e.target.value }))}>{calendars.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div className="modal-row"><label>Category</label><select className="modal-select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>{categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}</select></div>
          <div className="modal-row modal-col"><label>Recurrence</label><RecurrenceEditor value={form.recurrence} startDate={form.start} onChange={recurrence => setForm(f => ({ ...f, recurrence }))} /></div>
          <div className="modal-row"><label>Fixed</label><input type="checkbox" checked={form.fixed} onChange={e => setForm(f => ({ ...f, fixed: e.target.checked }))}/><span style={{ fontSize: 11, color: "var(--text2)", marginLeft: 6 }}>Cannot be dragged</span></div>
          <div className="modal-row"><label>Color</label><div className="color-picker">{COLORS.map(c => <button key={c} className={`color-dot ${form.color === c ? "selected" : ""}`} style={{ background: c }} onClick={() => setForm(f => ({ ...f, color: c }))} />)}<button className="color-dot color-reset" onClick={() => setForm(f => ({ ...f, color: null }))}>↺</button></div></div>
          <div className="modal-row modal-col"><label>Notes</label><textarea className="modal-textarea" value={form.notes || ""} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Add notes..." rows={3} /></div>
        </div>
        <div className="modal-footer"><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><button className="modal-delete" onClick={() => { onDelete(event.id); onClose(); }}>🗑️ Delete</button><button className="tf-cancel" onClick={() => { onCopy?.({ ...form, title: form.title.trim() || event.title }); onClose(); }}>📋 Duplicate / Copy</button></div><div style={{ display: "flex", gap: 8 }}><button className="tf-cancel" onClick={requestClose}>Cancel</button><button className="tf-save" onClick={saveForm}>Save changes</button></div></div>
      </div>
    </div>
  );
}

// ─── Pomodoro Widget ──────────────────────────────────────────────────────────
function PomodoroWidget({ state, tasks, onPause, onResume, onStop }) {
  const task  = tasks.find(t => t.id === state.taskId);
  const m     = Math.floor(state.remaining / 60).toString().padStart(2, "0");
  const s     = (state.remaining % 60).toString().padStart(2, "0");
  const total = state.mode === "work" ? POMODORO_WORK_SECS : POMODORO_BREAK_SECS;
  const pct   = (1 - state.remaining / total) * 100;
  const r = 34; const circ = 2 * Math.PI * r;
  return (
    <div className="pomo-widget">
      <div className="pomo-header"><span className="pomo-mode">{state.mode === "work" ? "🔮 Focus" : "🌸 Break"}</span><span className="pomo-cycles">#{state.cycles + 1}</span><button className="pomo-stop" onClick={onStop}>✕</button></div>
      {task && <div className="pomo-task">{task.title}</div>}
      <div className="pomo-ring-wrap">
        <svg className="pomo-ring" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r={r} fill="none" stroke="var(--border)" strokeWidth="6" />
          <circle cx="40" cy="40" r={r} fill="none" stroke={state.mode === "work" ? "var(--accent)" : "#B8F0E0"} strokeWidth="6" strokeDasharray={`${circ}`} strokeDashoffset={`${circ * (1 - pct / 100)}`} strokeLinecap="round" transform="rotate(-90 40 40)" style={{ transition: "stroke-dashoffset 1s linear" }} />
        </svg>
        <div className="pomo-time">{m}:{s}</div>
      </div>
      <div className="pomo-controls">{state.active ? <button className="pomo-btn-ctrl" onClick={onPause}>⏸ Pause</button> : <button className="pomo-btn-ctrl" onClick={onResume}>▶ Resume</button>}</div>
    </div>
  );
}

// ─── Stats Card ───────────────────────────────────────────────────────────────
function StatsCard({ events, tasks, streak, gameStats, onClose }) {
  const td = getEventsOnDay(events, TODAY); const todayTasks = tasks.filter(t => taskBelongsToPeriod(t, "day", TODAY)); const dn = todayTasks.filter(t => t.done).length, tot = todayTasks.length;
  const catMins = id => td.filter(e => e.category === id).reduce((a, e) => a + (e.end - e.start) / 60000, 0);
  const bars = [
    { label: "Deep Work", mins: catMins("deep"),    color: "#B08AE0" },
    { label: "Meetings",  mins: catMins("meeting"), color: "#FF7BAC" },
    { label: "Admin",     mins: catMins("admin"),   color: "#A0C8E0" },
    { label: "Personal",  mins: catMins("personal") + catMins("health"), color: "#70C8A0" },
  ];
  const mx = Math.max(...bars.map(b => b.mins), 1);
  const gs = gameStats || calculateGameStats(tasks, {}, events);
  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Daily summary">
      <div className="stats-card" onClick={e => e.stopPropagation()}>
        <div className="stats-header"><span className="stats-title">📊 Daily Summary</span><button className="modal-close" onClick={onClose}>✕</button></div>
        <div className="stats-streak">🔥 {gs.streaks?.productive ?? streak} day productivity streak · Level {gs.level} {gs.title}</div>
        <div className="stats-row">
          <div className="stat-big"><div className="stat-num">{dn}/{tot}</div><div className="stat-lbl">Tasks done</div></div>
          <div className="stat-big"><div className="stat-num">{gs.today.rank}</div><div className="stat-lbl">Daily rank</div></div>
          <div className="stat-big"><div className="stat-num">{gs.today.score}</div><div className="stat-lbl">Tempo score</div></div>
        </div>
        <div className="stats-row">
          <div className="stat-big"><div className="stat-num">{Math.round(catMins("deep") / 60 * 10) / 10}h</div><div className="stat-lbl">Focus time</div></div>
          <div className="stat-big"><div className="stat-num">{td.length}</div><div className="stat-lbl">Events</div></div>
          <div className="stat-big"><div className="stat-num">{gs.unlockedBadges.length}</div><div className="stat-lbl">Badges</div></div>
        </div>
        <div className="stats-mini-note">A quick snapshot of today. Deeper game progress now lives in 🌸 Bloom Room.</div>
      </div>
    </div>
  );
}

// ─── Carry Over ───────────────────────────────────────────────────────────────
function CarryOverPrompt({ tasks, gameStats, onCarry, onDrop, onDismiss }) {
  const [sel, setSel] = useState(tasks.map(t => t.id));
  const toggle = id => setSel(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  return (
    <div className="modal-overlay" onClick={onDismiss} role="dialog" aria-modal="true" aria-label="End of day carry over">
      <div className="carryover-card" onClick={e => e.stopPropagation()}>
        <div className="carryover-title">🌙 End of day — uncompleted tasks:</div>
        {gameStats && <div className="eod-rank-card">
          <div className="eod-rank-main"><strong>{gameStats.today.rank} Rank</strong><span>{gameStats.today.score}/100 Tempo Score</span></div>
          <div className="eod-rank-meta"><span>+{gameStats.quests.filter(q => q.done).reduce((sum,q)=>sum+q.xp,0)} quest XP</span><span>{gameStats.unlockedBadges?.length || 0} badges unlocked</span></div>
          <div className="eod-rank-note">{gameStats.today.rank === "S" ? "Perfect bloom day ✨" : gameStats.today.score >= 70 ? "Strong rhythm today 🌸" : "Gentle reset. Carry what matters into tomorrow 🌱"}</div>
        </div>}
        <div className="carryover-list">{tasks.map(t => <label key={t.id} className="carryover-item"><input type="checkbox" checked={sel.includes(t.id)} onChange={() => toggle(t.id)} /><span>{t.title}</span><span className="co-dur">{t.duration}min</span></label>)}</div>
        <div className="carryover-actions"><button className="tf-cancel" onClick={() => onDrop(sel)}>Drop selected</button><button className="tf-save" onClick={() => onCarry(sel)}>Push to tomorrow →</button></div>
      </div>
    </div>
  );
}

// ─── Focus Mode ───────────────────────────────────────────────────────────────
function FocusMode({ tasks, events, pomodoro, onStartPomodoro, onPause, onResume, onStop, onExit }) {
  const now  = new Date(); const next = events.filter(e => e.start > now).sort((a, b) => a.start - b.start)[0];
  const open = tasks.filter(t => !t.done && taskBelongsToPeriod(t, "day", TODAY));
  return (
    <div className="focus-overlay">
      <button className="focus-exit" onClick={onExit}>✕ Exit Focus Mode</button>
      <div className="focus-content">
        <div className="focus-logo">🌸 Tempo</div>
        <div className="focus-date">{fmtDate(TODAY)}</div>
        {pomodoro.active ? (
          <PomodoroWidget state={pomodoro} tasks={tasks} onPause={onPause} onResume={onResume} onStop={onStop} />
        ) : (
          <div className="focus-idle">
            <div className="focus-idle-msg">Ready to focus? 🔮</div>
            {next && <div className="focus-next">Next: {next.title} at {fmt(next.start)}</div>}
          </div>
        )}
        <div className="focus-tasks">
          <div className="focus-tasks-title">Today's tasks</div>
          {open.slice(0, 5).map(t => (
            <div key={t.id} className="focus-task-row">
              <span className="focus-task-name">{t.title}</span>
              <span className="focus-task-dur">{t.duration}min</span>
              <button className="focus-start-btn" onClick={() => onStartPomodoro(t.id)}>▶</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Shortcuts Modal ──────────────────────────────────────────────────────────
function ShortcutsModal({ onClose }) {
  const sc = [["D","Day view"],["W","Week view"],["M","Month view"],["J","Memory Book"],["F","Focus mode"],["C","Open chat"],["S","Settings"],["/ or ⌘K","Search"],["?","Shortcuts"],["Cmd+Z","Undo"],["Esc","Close / Back"]];
  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Keyboard shortcuts">
      <div className="shortcuts-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header"><span style={{ fontWeight: 800 }}>⌨️ Keyboard Shortcuts</span><button className="modal-close" onClick={onClose}>✕</button></div>
        <div className="shortcuts-grid">{sc.map(([k, v]) => <div key={k} className="shortcut-row"><kbd className="kbd">{k}</kbd><span>{v}</span></div>)}</div>
      </div>
    </div>
  );
}

// ─── Settings Panel ───────────────────────────────────────────────────────────
function SettingsPanel({ onClose, fontSize, setFontSize, darkMode, setDarkMode, theme, setTheme, workStart, setWorkStart, workEnd, setWorkEnd, notifs, setNotifs, timezone, setTimezone, categories, setCategories, user, onSignOut, gameStats }) {
  const [catDraft, setCatDraft] = useState({ icon: "✨", label: "", color: "#FF7BAC" });
  const themeUnlockMap = new Map((gameStats?.themeUnlocks || THEMES.map(t => ({ id: t.id, unlocked: true, reason: "Unlocked" }))).map(t => [t.id, t]));
  function toggleNotifs() { if (!notifs && typeof Notification !== "undefined" && Notification.permission === "default") Notification.requestPermission(); setNotifs(!notifs); }
  function addCategory() {
    if (!catDraft.label.trim()) return;
    const id = createCategoryId(catDraft.label);
    setCategories(cs => [...cs, { id: cs.some(c => c.id === id) ? id + "-" + uid() : id, icon: catDraft.icon || "✨", label: catDraft.label.trim(), color: catDraft.color || "#FF7BAC" }]);
    setCatDraft({ icon: "✨", label: "", color: "#FF7BAC" });
  }
  function updateCategory(id, patch) { setCategories(cs => cs.map(c => c.id === id ? { ...c, ...patch } : c)); }
  function removeCategory(id) { if (categories.length <= 1) return; setCategories(cs => cs.filter(c => c.id !== id)); }

  // Common timezones list
  const TIMEZONES = [
    "Pacific/Honolulu","America/Anchorage","America/Los_Angeles","America/Denver",
    "America/Chicago","America/New_York","America/Sao_Paulo","Europe/London",
    "Europe/Paris","Europe/Berlin","Europe/Istanbul","Asia/Dubai","Asia/Kolkata",
    "Asia/Bangkok","Asia/Singapore","Asia/Tokyo","Asia/Seoul","Australia/Sydney",
    "Pacific/Auckland",
  ];
  // Also include the user's detected timezone if not in list
  const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const tzList = TIMEZONES.includes(detected) ? TIMEZONES : [detected, ...TIMEZONES];
  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={e => e.stopPropagation()}>
        <div className="settings-header">
          <div className="settings-title-row"><span>⚙️</span><span className="settings-title">Settings</span></div>
          <button className="settings-close" onClick={onClose}>✕</button>
        </div>
        <div className="settings-body">
          {/* Account */}
          {user && (
            <div className="settings-section">
              <div className="settings-section-label">Account</div>
              <div className="settings-section-desc">Signed in as <strong>{user.email}</strong></div>
              <button className="signout-btn" onClick={onSignOut}>Sign out</button>
            </div>
          )}
          {/* Theme */}
          <div className="settings-section">
            <div className="settings-section-label">Appearance</div>
            <div className="settings-section-desc">Choose a color theme and toggle light / dark mode</div>
            <div className="theme-grid">
              {THEMES.map(t => {
                const unlock = themeUnlockMap.get(t.id) || { unlocked: true, reason: "Unlocked" };
                const locked = !unlock.unlocked && theme !== t.id;
                return (
                  <button key={t.id} disabled={locked} className={`theme-swatch-btn ${theme === t.id ? "active" : ""} ${locked ? "locked" : ""}`} onClick={() => !locked && setTheme(t.id)} title={locked ? unlock.reason : t.description}>
                    <div className="theme-swatch-dots">
                      {t.swatch.map((c, i) => <span key={i} className="theme-swatch-dot" style={{ background: c }} />)}
                    </div>
                    <span className="theme-swatch-label">{t.label}</span>
                    <span className="theme-swatch-lockline">{locked ? unlock.reason : "Unlocked"}</span>
                    {locked ? <span className="theme-swatch-lock">🔒</span> : theme === t.id && <span className="theme-swatch-check">✓</span>}
                  </button>
                );
              })}
            </div>
            <div className="toggle-row" style={{ marginTop: 14 }}><span>☀️ Light</span><button className={`toggle ${darkMode ? "on" : ""}`} onClick={() => setDarkMode(v => !v)}><div className="toggle-thumb" /></button><span>🌙 Dark</span></div>
          </div>
          {/* Font size */}
          <div className="settings-section">
            <div className="settings-section-label">Text Size</div>
            <div className="settings-section-desc">Adjust text size across the app</div>
            <div className="font-size-preview"><span style={{ fontSize: `${FONT_SIZES.find(f => f.id === fontSize)?.scale * 14}px`, fontWeight: 700, color: "var(--accent)" }}>The quick brown fox</span><span style={{ fontSize: `${FONT_SIZES.find(f => f.id === fontSize)?.scale * 11}px`, color: "var(--text2)" }}>9:00 AM – Team standup</span></div>
            <div className="font-size-options">{FONT_SIZES.map(f => <button key={f.id} className={`font-size-btn ${fontSize === f.id ? "active" : ""}`} onClick={() => setFontSize(f.id)}><span className="fsb-label">{f.label}</span><span className="fsb-desc">{f.desc}</span></button>)}</div>
            <div className="font-size-slider-row"><span className="fsr-a">A</span><input type="range" min={0} max={4} step={1} value={FONT_SIZES.findIndex(f => f.id === fontSize)} onChange={e => setFontSize(FONT_SIZES[parseInt(e.target.value)].id)} className="font-slider" /><span className="fsr-A">A</span></div>
          </div>
          {/* Work hours */}
          <div className="settings-section">
            <div className="settings-section-label">Work Hours</div>
            <div className="settings-section-desc">Set your working window</div>
            <div className="work-hours-row">
              <label>Start <input type="number" className="tf-num wh-input" min={0} max={23} value={workStart} onChange={e => setWorkStart(Number(e.target.value))} /> {workStart < 12 ? "am" : workStart === 12 ? "pm" : `${workStart - 12}pm`}</label>
              <label>End <input type="number" className="tf-num wh-input" min={0} max={23} value={workEnd} onChange={e => setWorkEnd(Number(e.target.value))} /> {workEnd < 12 ? "am" : workEnd === 12 ? "pm" : `${workEnd - 12}pm`}</label>
            </div>
          </div>
          {/* Timezone */}
          <div className="settings-section">
            <div className="settings-section-label">Timezone</div>
            <div className="settings-section-desc">Choose the timezone used for displaying calendar and schedule times</div>
            <select className="tf-select" value={timezone || detected} onChange={e => setTimezone(e.target.value)}>
              {tzList.map(tz => <option key={tz} value={tz}>{tz.replace(/_/g, " ")}</option>)}
            </select>
          </div>

          {/* Categories */}
          <div className="settings-section">
            <div className="settings-section-label">Categories</div>
            <div className="settings-section-desc">Add, rename, recolor, or remove event and task categories</div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {categories.map(c => (
                <div key={c.id} className="tf-row">
                  <input className="tf-input" style={{width:44,flex:"0 0 44px",textAlign:"center"}} value={c.icon} onChange={e => updateCategory(c.id, { icon: e.target.value })}/>
                  <input className="tf-input" value={c.label} onChange={e => updateCategory(c.id, { label: e.target.value })}/>
                  <input type="color" className="tf-input" style={{width:48,flex:"0 0 48px",padding:4}} value={c.color} onChange={e => updateCategory(c.id, { color: e.target.value })}/>
                  <button className="tf-cancel" onClick={() => removeCategory(c.id)}>Remove</button>
                </div>
              ))}
              <div className="tf-row">
                <input className="tf-input" style={{width:44,flex:"0 0 44px",textAlign:"center"}} value={catDraft.icon} onChange={e => setCatDraft(d => ({ ...d, icon: e.target.value }))}/>
                <input className="tf-input" placeholder="New category" value={catDraft.label} onChange={e => setCatDraft(d => ({ ...d, label: e.target.value }))}/>
                <input type="color" className="tf-input" style={{width:48,flex:"0 0 48px",padding:4}} value={catDraft.color} onChange={e => setCatDraft(d => ({ ...d, color: e.target.value }))}/>
                <button className="tf-save" onClick={addCategory}>Add</button>
              </div>
            </div>
          </div>
          {/* Notifications */}
          <div className="settings-section">
            <div className="settings-section-label">Pomodoro notifications</div>
            <div className="settings-section-desc">Used for focus timer alerts while the app is open</div>
            <div className="toggle-row"><span>Off</span><button className={`toggle ${notifs ? "on" : ""}`} onClick={toggleNotifs}><div className="toggle-thumb" /></button><span>On</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Journal Constants ────────────────────────────────────────────────────────
const JOURNAL_MOODS = [
  { id:"rad",    emoji:"😁", label:"Rad",    color:"#4CAF82" },
  { id:"good",   emoji:"😊", label:"Good",   color:"#7CB9E8" },
  { id:"meh",    emoji:"😐", label:"Meh",    color:"#FFD700" },
  { id:"bad",    emoji:"😔", label:"Bad",    color:"#FF8C69" },
  { id:"awful",  emoji:"😢", label:"Awful",  color:"#C97FC9" },
];
const JOURNAL_ACTIVITIES = [
  { id:"family",    emoji:"👨‍👩‍👧", label:"Family",    group:"Social"   },
  { id:"friends",   emoji:"👯",   label:"Friends",   group:"Social"   },
  { id:"date",      emoji:"💑",   label:"Date",      group:"Social"   },
  { id:"work",      emoji:"💼",   label:"Work",      group:"Social"   },
  { id:"reading",   emoji:"📚",   label:"Reading",   group:"Hobbies"  },
  { id:"gaming",    emoji:"🎮",   label:"Gaming",    group:"Hobbies"  },
  { id:"movies",    emoji:"🎬",   label:"Movies",    group:"Hobbies"  },
  { id:"music",     emoji:"🎵",   label:"Music",     group:"Hobbies"  },
  { id:"sport",     emoji:"🏃",   label:"Sport",     group:"Hobbies"  },
  { id:"cooking",   emoji:"🍳",   label:"Cooking",   group:"Hobbies"  },
  { id:"sleep",     emoji:"😴",   label:"Good sleep",group:"Health"   },
  { id:"gym",       emoji:"💪",   label:"Gym",       group:"Health"   },
  { id:"outdoors",  emoji:"🌿",   label:"Outdoors",  group:"Health"   },
  { id:"meditation",emoji:"🧘",   label:"Meditation",group:"Health"   },
  { id:"shopping",  emoji:"🛍️",   label:"Shopping",  group:"Other"    },
  { id:"travel",    emoji:"✈️",   label:"Travel",    group:"Other"    },
  { id:"food",      emoji:"🍜",   label:"Good food", group:"Other"    },
  { id:"relax",     emoji:"🛁",   label:"Relax",     group:"Other"    },
];
const JOURNAL_PROMPTS = [
  "What made you smile today?",
  "What are you grateful for right now?",
  "What challenged you today and how did you handle it?",
  "What's one thing you'd do differently?",
  "What are you looking forward to tomorrow?",
  "Describe your day in three words.",
  "Who made a positive impact on your day?",
  "What did you learn today?",
  "What did you do for yourself today?",
  "What moment do you want to remember from today?",
];
const MEMORY_TAGS = ["Work", "Date", "Family", "Friends", "Food", "Travel", "Fitness", "Personal", "Achievement", "Rest Day"];
const SCRAPBOOK_STICKERS = ["🌸", "✨", "🎀", "💌", "📷", "🫶", "🐰", "☕", "🍰", "🌙", "💖", "✅", "🎯", "🥹", "🌈", "🧸"];

const MEMORY_ASSET_BASE = "/memory-assets";
const MEMORY_BACKGROUNDS = [
  { id:"plain", label:"Plain", src:null, tone:"soft" },
  { id:"ruled", label:"Ruled", src:`${MEMORY_ASSET_BASE}/backgrounds/bg_ruled_paper.png`, tone:"paper" },
  { id:"grid", label:"Grid", src:`${MEMORY_ASSET_BASE}/backgrounds/bg_grid_paper.png`, tone:"paper" },
  { id:"dotgrid", label:"Dot Grid", src:`${MEMORY_ASSET_BASE}/backgrounds/bg_dot_grid_paper.png`, tone:"paper" },
  { id:"legal", label:"Legal Pad", src:`${MEMORY_ASSET_BASE}/backgrounds/bg_legal_pad.png`, tone:"warm" },
  { id:"watercolor", label:"Watercolor", src:`${MEMORY_ASSET_BASE}/backgrounds/bg_watercolor_paper.png`, tone:"soft" },
  { id:"kraft", label:"Kraft", src:`${MEMORY_ASSET_BASE}/backgrounds/bg_kraft_paper.png`, tone:"warm" },
  { id:"crumpled", label:"Crumpled", src:`${MEMORY_ASSET_BASE}/backgrounds/bg_crumpled_paper.png`, tone:"paper" },
  { id:"parchment", label:"Parchment", src:`${MEMORY_ASSET_BASE}/backgrounds/bg_parchment_paper.png`, tone:"warm" },
  { id:"gingham", label:"Gingham", src:`${MEMORY_ASSET_BASE}/backgrounds/bg_gingham.png`, tone:"cute" },
  { id:"floral", label:"Floral", src:`${MEMORY_ASSET_BASE}/backgrounds/bg_subtle_floral.png`, tone:"cute" },
  { id:"gradient", label:"Gradient", src:`${MEMORY_ASSET_BASE}/backgrounds/bg_pastel_gradient.png`, tone:"soft" },
  { id:"checker", label:"Checker", src:`${MEMORY_ASSET_BASE}/backgrounds/bg_retro_checkerboard.png`, tone:"cute" },
  { id:"happy", label:"Happy Peach", src:`${MEMORY_ASSET_BASE}/backgrounds/bg_mood_happy_peach.png`, tone:"mood" },
  { id:"calm", label:"Calm Blue", src:`${MEMORY_ASSET_BASE}/backgrounds/bg_mood_calm_blue.png`, tone:"mood" },
  { id:"energy", label:"Energetic", src:`${MEMORY_ASSET_BASE}/backgrounds/bg_mood_energetic_yellow.png`, tone:"mood" },
  { id:"lavender", label:"Lavender", src:`${MEMORY_ASSET_BASE}/backgrounds/bg_mood_sad_lavender.png`, tone:"mood" },
];
const COZY_STICKER_PACK = Array.from({ length: 12 }, (_, i) => ({
  id: `cozy-${i+1}`,
  label: `Cozy ${i+1}`,
  src: `${MEMORY_ASSET_BASE}/stickers/cozy/${i+1}.png`,
}));
const memoryBackgroundById = id => MEMORY_BACKGROUNDS.find(b => b.id === id) || MEMORY_BACKGROUNDS[0];
const memoryBackgroundStyle = id => {
  const bg = memoryBackgroundById(id);
  return bg?.src ? { backgroundImage: `linear-gradient(rgba(255,255,255,.76), rgba(255,255,255,.82)), url(${bg.src})` } : {};
};
const normalizeMemoryEntry = entry => ({
  mood: entry?.mood || null,
  activities: Array.isArray(entry?.activities) ? entry.activities : [],
  note: entry?.note || "",
  gratitude: Array.isArray(entry?.gratitude) ? entry.gratitude : ["", "", ""],
  photos: Array.isArray(entry?.photos) ? entry.photos : [],
  coverPhotoId: entry?.coverPhotoId || entry?.photos?.[0]?.id || null,
  tags: Array.isArray(entry?.tags) ? entry.tags : [],
  highlights: { best: "", win: "", learned: "", remember: "", ...(entry?.highlights || {}) },
  blocks: Array.isArray(entry?.blocks) ? entry.blocks : (Array.isArray(entry?.scrapbookBlocks) ? entry.scrapbookBlocks : []),
  backgroundId: entry?.backgroundId || "plain",
  updatedAt: entry?.updatedAt || null,
});

const sanitizeMemoryPhotoForStorage = photo => ({
  id: photo?.id || "p" + uid(),
  storagePath: photo?.storagePath || "",
  thumbStoragePath: photo?.thumbStoragePath || "",
  bucket: photo?.bucket || MEMORY_STORAGE_BUCKET,
  caption: photo?.caption || "",
  name: photo?.name || "Memory photo",
  createdAt: photo?.createdAt || new Date().toISOString(),
});
const sanitizeMemoryEntryForStorage = entry => {
  const mem = normalizeMemoryEntry(entry);
  return {
    mood: mem.mood,
    activities: mem.activities,
    note: mem.note,
    gratitude: mem.gratitude,
    photos: mem.photos.filter(p => p?.storagePath).map(sanitizeMemoryPhotoForStorage),
    coverPhotoId: mem.coverPhotoId,
    tags: mem.tags,
    highlights: mem.highlights,
    blocks: mem.blocks,
    backgroundId: mem.backgroundId,
    updatedAt: mem.updatedAt,
  };
};
const sanitizeMemoryJournalForStorage = journal => {
  const out = {};
  Object.entries(journal || {}).forEach(([key, entry]) => {
    out[key] = sanitizeMemoryEntryForStorage(entry);
  });
  return out;
};
const normalizeMemoryJournalForState = journal => {
  const out = {};
  Object.entries(journal || {}).forEach(([key, entry]) => {
    out[key] = normalizeMemoryEntry(entry);
  });
  return out;
};
const isEncryptedMemoryJournal = value => Boolean(value?.__tempoEncryptedMemoryBook && value?.v === MEMORY_ENCRYPTION_VERSION && value?.data && value?.iv);
async function deriveMemoryCryptoKey(userId) {
  if (!hasWebCrypto() || !userId) return null;
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(`tempo-memory-book:${userId}:${SUPABASE_URL || "local"}`),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: enc.encode(`tempo-memory-salt:${userId}`), iterations: 120000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}
async function encryptMemoryJournalForStorage(userId, journal) {
  const clean = sanitizeMemoryJournalForStorage(journal || {});
  const key = await deriveMemoryCryptoKey(userId);
  if (!key) return clean;
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const payload = new TextEncoder().encode(JSON.stringify(clean));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, payload);
  return {
    __tempoEncryptedMemoryBook: true,
    v: MEMORY_ENCRYPTION_VERSION,
    alg: "AES-GCM",
    iv: bytesToBase64(iv),
    data: bytesToBase64(new Uint8Array(encrypted)),
    updatedAt: new Date().toISOString(),
  };
}
async function decryptMemoryJournalFromStorage(userId, stored) {
  if (!stored) return {};
  if (!isEncryptedMemoryJournal(stored)) return normalizeMemoryJournalForState(stored);
  const key = await deriveMemoryCryptoKey(userId);
  if (!key) return {};
  try {
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: base64ToBytes(stored.iv) },
      key,
      base64ToBytes(stored.data)
    );
    return normalizeMemoryJournalForState(JSON.parse(new TextDecoder().decode(decrypted)) || {});
  } catch (err) {
    console.warn("Could not decrypt Memory Book data", err);
    return {};
  }
}
async function saveJournalLocal(userKey, userId, journal) {
  try { save(`${userKey}_journal`, await encryptMemoryJournalForStorage(userId, journal)); } catch (err) { console.warn("Could not encrypt Memory Book local cache", err); }
}
async function loadJournalLocal(userKey, userId) {
  return decryptMemoryJournalFromStorage(userId, load(`${userKey}_journal`, {}));
}
const memoryPhotoSrc = (photo, signedUrls = {}, preferThumb = false) => {
  if (!photo) return "";
  if (photo.previewSrc || photo.src) return photo.previewSrc || photo.src;
  const preferred = preferThumb ? photo.thumbStoragePath : photo.storagePath;
  const fallback = preferThumb ? photo.storagePath : photo.thumbStoragePath;
  return signedUrls?.[preferred] || signedUrls?.[fallback] || "";
};
function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
async function prepareJournalPhotosFromFiles(files, existingCount = 0, onProgress = null) {
  const imageFiles = Array.from(files || []).filter(f => f.type?.startsWith("image/"));
  if (!imageFiles.length) return [];
  if (existingCount + imageFiles.length > MEMORY_IMAGE_LIMIT_PER_ENTRY) {
    throw new Error(`You can add up to ${MEMORY_IMAGE_LIMIT_PER_ENTRY} images per memory.`);
  }
  const tooLarge = imageFiles.find(f => f.size > MEMORY_MAX_ORIGINAL_BYTES);
  if (tooLarge) {
    throw new Error(`${tooLarge.name || "This image"} is too large. Please use images under 15MB.`);
  }
  const photos = [];
  for (let i = 0; i < imageFiles.length; i++) {
    const file = imageFiles[i];
    onProgress?.(`Reading image ${i + 1} of ${imageFiles.length}…`);
    photos.push({
      id: "p" + uid(),
      previewSrc: await readFileAsDataUrl(file),
      pendingFile: file,
      caption: "",
      name: file.name || "Memory photo",
      createdAt: new Date().toISOString(),
    });
  }
  return photos;
}
const memoryEntryCover = entry => {
  const e = normalizeMemoryEntry(entry);
  return e.photos.find(p => p.id === e.coverPhotoId) || e.photos[0] || null;
};
const memoryTagLabel = tag => String(tag || "").trim();
// ─── Daily Entry Modal ────────────────────────────────────────────────────────
function DayEntryModal({ date, entry, onSave, onClose, activitiesCatalog = JOURNAL_ACTIVITIES, memoryTagsCatalog = MEMORY_TAGS, onAddActivity, onUpdateActivity, onDeleteActivity, onAddMemoryTag, onUpdateMemoryTag, onDeleteMemoryTag, userId, imageUrls = {} }) {
  const normalized = normalizeMemoryEntry(entry);
  const originalStoragePaths = useMemo(() => normalized.photos.flatMap(allMemoryPhotoStoragePaths), [entry]);
  const [mood,       setMoodLocal]  = useState(normalized.mood);
  const [activities, setActivities] = useState(normalized.activities);
  const [note,       setNote]       = useState(normalized.note);
  const [gratitude,  setGratitude]  = useState(normalized.gratitude.length ? normalized.gratitude : ["","",""]);
  const [photos,     setPhotos]     = useState(normalized.photos);
  const [coverPhotoId, setCoverPhotoId] = useState(normalized.coverPhotoId);
  const [tags,       setTags]       = useState(normalized.tags);
  const [newTag,     setNewTag]     = useState("");
  const [blocks,     setBlocks]     = useState(normalized.blocks);
  const [backgroundId, setBackgroundId] = useState(normalized.backgroundId || "plain");
  const [highlights, setHighlights] = useState(normalized.highlights);
  const [newActivity, setNewActivity] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadStatus, setUploadStatus] = useState("");
  const initialSnapshot = useMemo(() => JSON.stringify({
    mood: normalized.mood,
    activities: normalized.activities,
    note: normalized.note,
    gratitude: normalized.gratitude.length ? normalized.gratitude : ["","",""],
    photos: normalized.photos.map(p => ({ id:p.id, caption:p.caption || "", storagePath:p.storagePath || "", thumbStoragePath:p.thumbStoragePath || "" })),
    coverPhotoId: normalized.coverPhotoId,
    tags: normalized.tags,
    blocks: normalized.blocks,
    backgroundId: normalized.backgroundId || "plain",
    highlights: normalized.highlights,
  }), [entry]);
  const prompt = JOURNAL_PROMPTS[date.getDate() % JOURNAL_PROMPTS.length];
  const visibleActivitiesCatalog = (activitiesCatalog || []).filter(a => !a.archived);
  const groups = [...new Set(visibleActivitiesCatalog.map(a => a.group || "Custom"))];
  const [showActivityManager, setShowActivityManager] = useState(false);
  const [showTagManager, setShowTagManager] = useState(false);
  const availableTags = [...new Set([...(memoryTagsCatalog || MEMORY_TAGS), ...tags].map(memoryTagLabel).filter(Boolean))];
  const currentSnapshot = JSON.stringify({
    mood, activities, note, gratitude,
    photos: photos.map(p => ({ id:p.id, caption:p.caption || "", storagePath:p.storagePath || "", thumbStoragePath:p.thumbStoragePath || "", pending: Boolean(p.pendingFile) })),
    coverPhotoId, tags, blocks, backgroundId, highlights,
  });
  const hasUnsavedChanges = currentSnapshot !== initialSnapshot;
  function requestClose() {
    if (uploading) return;
    if (hasUnsavedChanges && !window.confirm("Discard this memory? You have unsaved changes.")) return;
    onClose();
  }

  function toggleActivity(id) {
    setActivities(a => a.includes(id) ? a.filter(x => x !== id) : [...a, id]);
  }
  function updateGratitude(i, val) {
    setGratitude(g => { const n=[...g]; n[i]=val; return n; });
  }
  function toggleTag(tag) {
    const clean = memoryTagLabel(tag);
    if (!clean) return;
    setTags(t => t.includes(clean) ? t.filter(x => x !== clean) : [...t, clean]);
  }
  function editMemoryTag(tag) {
    const clean = memoryTagLabel(tag);
    const next = window.prompt("Rename memory tag", clean);
    if (!next || !next.trim()) return;
    const renamed = memoryTagLabel(next);
    onUpdateMemoryTag?.(clean, renamed);
    setTags(t => [...new Set(t.map(x => x === clean ? renamed : x))]);
  }
  function removeMemoryTag(tag) {
    const clean = memoryTagLabel(tag);
    if (!clean) return;
    if (!window.confirm(`Remove #${clean} from all memories? This cannot be undone.`)) return;
    onDeleteMemoryTag?.(clean);
    setTags(t => t.filter(x => x !== clean));
  }
  function editActivity(activity) {
    const label = window.prompt("Rename activity", activity.label);
    if (!label || !label.trim()) return;
    const emoji = window.prompt("Emoji", activity.emoji || "✨") || activity.emoji || "✨";
    onUpdateActivity?.(activity.id, { label: label.trim(), emoji: emoji.trim() || "✨" });
  }
  function removeActivity(activity) {
    if (!window.confirm(`Archive ${activity.emoji || ""} ${activity.label}? Old memories will keep their label.`)) return;
    onDeleteActivity?.(activity.id);
    setActivities(a => a.filter(x => x !== activity.id));
  }
  async function handlePhotoUpload(files) {
    if (!files?.length) return;
    setUploading(true);
    setUploadError("");
    setUploadStatus("Preparing photos…");
    try {
      const next = await prepareJournalPhotosFromFiles(files, photos.length, setUploadStatus);
      setPhotos(p => {
        const merged = [...p, ...next];
        if (!coverPhotoId && merged[0]) setCoverPhotoId(merged[0].id);
        return merged;
      });
    } catch (err) {
      console.warn("Memory photo selection failed", err);
      setUploadError(err?.message || "Could not add photos. Please try smaller image files.");
    } finally { setUploading(false); setUploadStatus(""); }
  }
  function updatePhotoCaption(id, caption) {
    setPhotos(p => p.map(photo => photo.id === id ? { ...photo, caption } : photo));
  }
  function removePhoto(id) {
    if (!window.confirm("Remove this photo from the memory? The file is deleted after the memory saves successfully.")) return;
    setPhotos(p => p.filter(photo => photo.id !== id));
    setCoverPhotoId(c => c === id ? null : c);
    setBlocks(bs => bs.map(b => b.type === "photoGrid" ? { ...b, photoIds: (b.photoIds || []).filter(pid => pid !== id) } : b));
  }
  function addBlock(type) {
    if (type === "photoGrid") {
      setBlocks(bs => [...bs, { id:"b"+uid(), type, photoIds: photos.slice(0,6).map(p=>p.id), caption:"" }]);
    } else if (type === "sticker") {
      setBlocks(bs => [...bs, { id:"b"+uid(), type, sticker:"🌸", stickerAsset: COZY_STICKER_PACK[0]?.src || null, size:"medium" }]);
    } else if (type === "quote") {
      setBlocks(bs => [...bs, { id:"b"+uid(), type, text:"" }]);
    } else if (type === "divider") {
      setBlocks(bs => [...bs, { id:"b"+uid(), type }]);
    } else {
      setBlocks(bs => [...bs, { id:"b"+uid(), type:"text", text:"" }]);
    }
  }
  function updateBlock(id, patch) { setBlocks(bs => bs.map(b => b.id === id ? { ...b, ...patch } : b)); }
  function removeBlock(id) { setBlocks(bs => bs.filter(b => b.id !== id)); }
  function moveBlock(id, dir) {
    setBlocks(bs => {
      const idx = bs.findIndex(b => b.id === id), next = [...bs];
      const to = idx + dir;
      if (idx < 0 || to < 0 || to >= next.length) return bs;
      [next[idx], next[to]] = [next[to], next[idx]];
      return next;
    });
  }
  async function handleSave() {
    const memoryKey = dateKey(date);
    setUploading(true);
    setUploadError("");
    try {
      const cleanTags = [...new Set(tags.map(memoryTagLabel).filter(Boolean))];
      const uploadedPhotos = [];
      const pendingPhotos = photos.filter(p => p.pendingFile);
      for (const photo of photos) {
        if (photo.pendingFile) {
          const uploadIndex = pendingPhotos.findIndex(p => p.id === photo.id) + 1;
          setUploadStatus(`Uploading ${uploadIndex || 1} of ${pendingPhotos.length || 1} photos…`);
          const uploaded = await uploadMemoryImageToStorage(userId, photo.pendingFile, memoryKey);
          uploadedPhotos.push(sanitizeMemoryPhotoForStorage({
            id: photo.id,
            ...uploaded,
            caption: photo.caption || "",
            name: photo.name || photo.pendingFile?.name || "Memory photo",
            createdAt: photo.createdAt || new Date().toISOString(),
          }));
        } else if (photo.storagePath) {
          uploadedPhotos.push(sanitizeMemoryPhotoForStorage({ ...photo, caption: photo.caption || "" }));
        }
      }
      const cleanBlocks = blocks.map(b => ({ ...b }));
      const finalStoragePaths = new Set(uploadedPhotos.flatMap(allMemoryPhotoStoragePaths));
      const removedPaths = originalStoragePaths.filter(path => !finalStoragePaths.has(path));
      const newlyUploadedPaths = uploadedPhotos
        .filter(p => photos.find(original => original.id === p.id)?.pendingFile)
        .flatMap(allMemoryPhotoStoragePaths);
      try {
        setUploadStatus("Saving memory…");
        await onSave(memoryKey, {
          mood, activities, note, gratitude,
          photos: uploadedPhotos,
          coverPhotoId: coverPhotoId || uploadedPhotos[0]?.id || null,
          tags: cleanTags,
          backgroundId,
          highlights,
          blocks: cleanBlocks,
          updatedAt: new Date().toISOString()
        });
      } catch (saveErr) {
        if (newlyUploadedPaths.length) await deleteMemoryStoragePaths(newlyUploadedPaths);
        throw saveErr;
      }
      if (removedPaths.length) {
        setUploadStatus("Cleaning removed photos…");
        await deleteMemoryStoragePaths(removedPaths);
      }
      setUploadStatus("Memory saved ✓");
      onClose();
    } catch (err) {
      console.warn("Memory save failed", err);
      setUploadError(err?.message || "Could not save memory. Please check your connection and Supabase Storage setup.");
    } finally {
      setUploading(false);
    }
  }
  return (
    <div className="modal-overlay" onClick={requestClose} role="dialog" aria-modal="true" aria-label="Memory Book entry">
      <div className={`entry-modal memory-entry-modal memory-bg-${backgroundId}`} style={memoryBackgroundStyle(backgroundId)} onClick={e => e.stopPropagation()}>
        <div className="entry-modal-header">
          <div>
            <div className="entry-modal-date">{date.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}</div>
            <div className="entry-modal-sub">Add today’s memory page</div>
          </div>
          <button className="modal-close" onClick={requestClose}>✕</button>
        </div>

        <div className="entry-modal-body">
        <div className="entry-section">
          <div className="entry-section-title">Mood</div>
          <div className="mood-picker-row">
            {JOURNAL_MOODS.map(m => (
              <button key={m.id} className={`mood-pick-btn ${mood===m.id?"selected":""}`}
                style={{"--mc": m.color}} onClick={() => setMoodLocal(m.id)}>
                <span className="mp-emoji">{m.emoji}</span>
                <span className="mp-label">{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="entry-section">
          <div className="entry-section-title">Photos</div>
          <label className="memory-upload-box">
            <input type="file" accept="image/*" multiple onChange={e => { handlePhotoUpload(e.target.files); e.target.value=""; }} />
            <span className="memory-upload-icon">📷</span>
            <span>{uploading ? "Working on photos…" : `+ Add photos (${photos.length}/${MEMORY_IMAGE_LIMIT_PER_ENTRY})`}</span>
          </label>
          {(uploadStatus || uploadError) && <div className={uploadError ? "memory-upload-error" : "memory-upload-status"}>{uploadError || uploadStatus}</div>}
          {photos.length > 0 && (
            <div className="memory-photo-editor-grid">
              {photos.map(p => (
                <div key={p.id} className={`memory-photo-editor-card ${coverPhotoId===p.id?"cover":""}`}>
                  <img src={memoryPhotoSrc(p, imageUrls)} alt={p.caption || "Journal memory"} />
                  <div className="memory-photo-tools">
                    <button type="button" onClick={() => setCoverPhotoId(p.id)}>{coverPhotoId===p.id ? "Cover ✓" : "Set cover"}</button>
                    <button type="button" onClick={() => removePhoto(p.id)}>Remove</button>
                  </div>
                  <input className="gratitude-input memory-caption-input" placeholder="Add caption…" value={p.caption || ""} onChange={e => updatePhotoCaption(p.id, e.target.value)} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="entry-section">
          <div className="entry-section-title section-title-with-action"><span>Memory Tags</span><button type="button" className="mini-manage-btn" onClick={() => setShowTagManager(v => !v)}>{showTagManager ? "Done" : "Manage"}</button></div>
          <div className="memory-tag-row editable-memory-row">
            {availableTags.map(tag => (
              <span key={tag} className={`editable-chip memory-tag-chip ${tags.includes(tag)?"selected":""}`}>
                <button type="button" className="editable-chip-main" onClick={() => toggleTag(tag)}>#{tag}</button>
                <button type="button" className="chip-mini-action" title="Rename tag" onClick={() => editMemoryTag(tag)}>✎</button>
                <button type="button" className="chip-mini-action" title="Remove tag" onClick={() => removeMemoryTag(tag)}>×</button>
              </span>
            ))}
          </div>
          <div className="tf-row" style={{marginTop:10}}>
            <input className="tf-input" placeholder="Add tag…" value={newTag} onChange={e => setNewTag(e.target.value)} />
            <button className="tf-save" onClick={() => { const added = onAddMemoryTag?.(newTag) || memoryTagLabel(newTag); toggleTag(added); setNewTag(""); }}>Add</button>
          </div>
          {showTagManager && (
            <div className="memory-manager-panel">
              <div className="manager-title">Tag Manager</div>
              {availableTags.map(tag => (
                <div key={tag} className="manager-row">
                  <span className="manager-chip">#{tag}</span>
                  <span className="manager-count">{tags.includes(tag) ? "selected" : "available"}</span>
                  <button type="button" onClick={() => editMemoryTag(tag)}>Rename</button>
                  <button type="button" onClick={() => removeMemoryTag(tag)}>Remove</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="entry-section">
          <div className="entry-section-title">Page Background</div>
          <div className="memory-background-picker">
            {MEMORY_BACKGROUNDS.map(bg => (
              <button key={bg.id} type="button" className={`memory-bg-choice ${backgroundId===bg.id?"selected":""}`} onClick={() => setBackgroundId(bg.id)}>
                <span className="memory-bg-swatch" style={bg.src ? {backgroundImage:`url(${bg.src})`} : {}} />
                <span>{bg.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="entry-section">
          <div className="entry-section-title section-title-with-action"><span>Activities</span><button type="button" className="mini-manage-btn" onClick={() => setShowActivityManager(v => !v)}>{showActivityManager ? "Done" : "Manage"}</button></div>
          {groups.map(g => (
            <div key={g} className="activity-group">
              <div className="activity-group-label">{g}</div>
              <div className="activity-chips">
                {visibleActivitiesCatalog.filter(a => (a.group || "Custom") === g).map(a => (
                  <span key={a.id} className={`editable-chip activity-chip ${activities.includes(a.id)?"selected":""}`}>
                    <button type="button" className="editable-chip-main" onClick={() => toggleActivity(a.id)}><span>{a.emoji}</span><span>{a.label}</span></button>
                    <button type="button" className="chip-mini-action" title="Rename activity" onClick={() => editActivity(a)}>✎</button>
                    <button type="button" className="chip-mini-action" title="Remove activity" onClick={() => removeActivity(a)}>×</button>
                  </span>
                ))}
              </div>
            </div>
          ))}
          <div className="tf-row" style={{marginTop:10}}>
            <input className="tf-input" placeholder="Add activity…" value={newActivity} onChange={e => setNewActivity(e.target.value)} />
            <button className="tf-save" onClick={() => { if (!newActivity.trim()) return; const added = onAddActivity?.(newActivity.trim()); if (added?.id) setActivities(a => [...new Set([...a, added.id])]); setNewActivity(""); }}>Add</button>
          </div>
          {showActivityManager && (
            <div className="memory-manager-panel activity-manager-panel">
              <div className="manager-title">Activity Manager</div>
              {groups.map(groupName => (
                <div key={groupName} className="manager-group-card">
                  <div className="manager-group-head">{groupName}</div>
                  {visibleActivitiesCatalog.filter(a => (a.group || "Custom") === groupName).map(a => (
                    <div key={a.id} className="manager-row">
                      <span className="manager-chip">{a.emoji} {a.label}</span>
                      <button type="button" onClick={() => editActivity(a)}>Edit</button>
                      <button type="button" onClick={() => removeActivity(a)}>Archive</button>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="entry-section">
          <div className="entry-section-title">Today’s Highlights ✨</div>
          <input className="gratitude-input" placeholder="Best moment…" value={highlights.best || ""} onChange={e => setHighlights(h => ({...h, best:e.target.value}))} />
          <input className="gratitude-input" placeholder="Biggest win…" value={highlights.win || ""} onChange={e => setHighlights(h => ({...h, win:e.target.value}))} />
          <input className="gratitude-input" placeholder="Something I learned…" value={highlights.learned || ""} onChange={e => setHighlights(h => ({...h, learned:e.target.value}))} />
          <input className="gratitude-input" placeholder="One thing I want to remember…" value={highlights.remember || ""} onChange={e => setHighlights(h => ({...h, remember:e.target.value}))} />
        </div>

        <div className="entry-section">
          <div className="entry-section-title">3 Things I'm Grateful For 🌸</div>
          {[0,1,2].map(i => (
            <input key={i} className="gratitude-input" placeholder={`Gratitude ${i+1}…`}
              value={gratitude[i] || ""} onChange={e => updateGratitude(i, e.target.value)} />
          ))}
        </div>

        <div className="entry-section">
          <div className="entry-section-title">Journal Entry</div>
          <div className="journal-prompt">💭 {prompt}</div>
          <textarea className="journal-textarea" rows={5} placeholder="Write freely…"
            value={note} onChange={e => setNote(e.target.value)} />
        </div>

        <div className="entry-section scrapbook-editor-section">
          <div className="entry-section-title">Scrapbook Blocks</div>
          <div className="scrapbook-add-row">
            <button type="button" onClick={() => addBlock("text")}>+ Text</button>
            <button type="button" onClick={() => addBlock("photoGrid")}>+ Photo Grid</button>
            <button type="button" onClick={() => addBlock("sticker")}>+ Sticker</button>
            <button type="button" onClick={() => addBlock("quote")}>+ Quote</button>
            <button type="button" onClick={() => addBlock("divider")}>+ Divider</button>
          </div>
          <div className="scrapbook-block-editor-list">
            {blocks.map((b, idx) => (
              <div key={b.id} className={`scrapbook-block-editor block-${b.type}`}>
                <div className="scrapbook-block-tools">
                  <span>{b.type === "photoGrid" ? "Photo grid" : b.type === "quote" ? "Quote" : b.type === "sticker" ? "Sticker" : b.type === "divider" ? "Divider" : "Text"}</span>
                  <div>
                    <button type="button" disabled={idx===0} onClick={() => moveBlock(b.id,-1)}>↑</button>
                    <button type="button" disabled={idx===blocks.length-1} onClick={() => moveBlock(b.id,1)}>↓</button>
                    <button type="button" onClick={() => removeBlock(b.id)}>Remove</button>
                  </div>
                </div>
                {b.type === "text" && <textarea className="journal-textarea" rows={3} placeholder="Scrapbook note…" value={b.text || ""} onChange={e => updateBlock(b.id,{text:e.target.value})} />}
                {b.type === "quote" && <input className="gratitude-input" placeholder="Quote of the day…" value={b.text || ""} onChange={e => updateBlock(b.id,{text:e.target.value})} />}
                {b.type === "sticker" && <>
                  <div className="sticker-asset-picker-row">
                    {COZY_STICKER_PACK.map(st => <button key={st.id} type="button" className={b.stickerAsset===st.src?"selected":""} onClick={() => updateBlock(b.id,{stickerAsset:st.src})}><img src={st.src} alt={st.label}/></button>)}
                  </div>
                  <div className="sticker-picker-row">{SCRAPBOOK_STICKERS.map(st => <button key={st} type="button" className={!b.stickerAsset && b.sticker===st?"selected":""} onClick={() => updateBlock(b.id,{sticker:st, stickerAsset:null})}>{st}</button>)}</div>
                </>}
                {b.type === "photoGrid" && <>
                  <div className="photo-grid-select-row">{photos.map(p => <button key={p.id} type="button" className={(b.photoIds || []).includes(p.id)?"selected":""} onClick={() => { const set = new Set(b.photoIds || []); set.has(p.id) ? set.delete(p.id) : set.add(p.id); updateBlock(b.id,{photoIds:[...set]}); }}><img src={memoryPhotoSrc(p, imageUrls)} alt="" /></button>)}</div>
                  <input className="gratitude-input memory-caption-input" placeholder="Grid caption…" value={b.caption || ""} onChange={e => updateBlock(b.id,{caption:e.target.value})} />
                </>}
                {b.type === "divider" && <div className="scrapbook-divider-preview">✦ ✦ ✦</div>}
              </div>
            ))}
            {blocks.length === 0 && <div className="scrapbook-empty-note">Add blocks to make this page feel like a real scrapbook.</div>}
          </div>
        </div>
        </div>

        <div className="entry-modal-footer">
          <button className="tf-cancel" onClick={requestClose}>Cancel</button>
          <button className="tf-save" onClick={handleSave} disabled={uploading}>{uploading ? "Saving…" : "Save memory ✓"}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Journal Page ─────────────────────────────────────────────────────────────
function JournalPage({ journal, setJournal, onSaveMemoryEntry, events, tasks, activitiesCatalog = JOURNAL_ACTIVITIES, memoryTagsCatalog = MEMORY_TAGS, onAddActivity, onUpdateActivity, onDeleteActivity, onAddMemoryTag, onUpdateMemoryTag, onDeleteMemoryTag, userId, onMemoryStorageMigrated, quickEditDate, onQuickEditHandled }) {
  const [calDate,    setCalDate]    = useState(new Date(TODAY));
  const [editing,    setEditing]    = useState(null); // Date being edited
  const [viewingKey, setViewingKey] = useState(null); // dateKey being read
  const [activeTag,  setActiveTag]  = useState("all"); // Memory Book tag filter
  const [memorySearch, setMemorySearch] = useState("");
  const [memorySettingsOpen, setMemorySettingsOpen] = useState(false);
  const [memoryImageUrls, setMemoryImageUrls] = useState({});
  useEffect(() => {
    if (quickEditDate) {
      setEditing(quickEditDate);
      onQuickEditHandled?.();
    }
  }, [quickEditDate]);

  async function saveEntry(key, data) {
    if (onSaveMemoryEntry) return onSaveMemoryEntry(key, data);
    setJournal(j => ({ ...j, [key]: data }));
    return true;
  }

  // Build mood calendar for current month
  const year = calDate.getFullYear(), month = calDate.getMonth();
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const fd = new Date(year, month, 1); const so = (fd.getDay()+6)%7;
  const calDays = [];
  for (let i=0; i<so; i++) calDays.push(null);
  for (let d=1; d<=daysInMonth; d++) calDays.push(new Date(year, month, d));
  while (calDays.length%7!==0) calDays.push(null);

  // Stats for current month
  const monthPrefix = `${year}-${String(month+1).padStart(2,"0")}`;
  const monthEntries = Object.entries(journal).filter(([k]) => k.startsWith(monthPrefix));
  const monthTags = [...new Set(monthEntries.flatMap(([,e]) => normalizeMemoryEntry(e).tags || []))].filter(Boolean).sort();
  const allTagUsage = Object.values(journal || {}).reduce((acc, e) => { normalizeMemoryEntry(e).tags.forEach(t => { acc[t] = (acc[t] || 0) + 1; }); return acc; }, {});
  const allActivitiesUsage = Object.values(journal || {}).reduce((acc, e) => { normalizeMemoryEntry(e).activities.forEach(id => { acc[id] = (acc[id] || 0) + 1; }); return acc; }, {});
  const monthPhotos = monthEntries.reduce((sum, [,e]) => sum + normalizeMemoryEntry(e).photos.length, 0);
  const monthPages = monthEntries.filter(([,e]) => hasJournalEntryForKey({ tmp: e }, "tmp")).length;
  const moodCounts = JOURNAL_MOODS.map(m => ({ ...m, count: monthEntries.filter(([,e]) => e.mood===m.id).length }));
  const query = memorySearch.trim().toLowerCase();
  const memorySearchText = (key, entry) => {
    const mem = normalizeMemoryEntry(entry);
    const moodLabel = JOURNAL_MOODS.find(m => m.id === mem.mood)?.label || "";
    const activityLabels = (mem.activities || []).map(id => activitiesCatalog.find(a => a.id === id)?.label || id);
    const bgLabel = memoryBackgroundById(mem.backgroundId)?.label || "";
    return [
      key,
      moodLabel,
      bgLabel,
      ...activityLabels,
      mem.note,
      ...(mem.gratitude || []),
      ...(mem.tags || []),
      ...Object.values(mem.highlights || {}),
      ...(mem.photos || []).flatMap(p => [p.caption || "", p.name || ""]),
      ...(mem.blocks || []).flatMap(b => [b.text || "", b.caption || "", b.sticker || ""])
    ].join(" ").toLowerCase();
  };
  const memoryMatchesFilters = (key, entry) => {
    if (!hasJournalEntryForKey({ [key]: entry }, key)) return false;
    const mem = normalizeMemoryEntry(entry);
    if (activeTag !== "all" && !(mem.tags || []).includes(activeTag)) return false;
    if (query && !memorySearchText(key, entry).includes(query)) return false;
    return true;
  };
  const memoryFiltersActive = activeTag !== "all" || Boolean(query);
  const searchableEntries = Object.entries(journal)
    .filter(([k,e]) => memoryMatchesFilters(k, e))
    .sort(([a],[b]) => b.localeCompare(a));
  const throwbackKeys = [dateKey(addDaysSafe(TODAY, -7)), dateKey(addMonthsSafe(TODAY, -1)), dateKey(addDaysSafe(TODAY, -365))];
  const throwbacks = [...new Set(throwbackKeys)].map(k => [k, journal[k]]).filter(([,e]) => e && hasJournalEntryForKey({ tmp:e }, "tmp")).slice(0,3);
  const streak = (() => {
    let s=0; const d=new Date(TODAY);
    while(true){ if(!hasJournalEntryForKey(journal, dateKey(d))) break; s++; d.setDate(d.getDate()-1); }
    return s;
  })();

  async function refreshMemoryImage(photo, preferThumb = false) {
    const path = preferThumb ? (photo?.thumbStoragePath || photo?.storagePath) : (photo?.storagePath || photo?.thumbStoragePath);
    if (!path) return;
    try {
      const signed = await signMemoryImagePath(path);
      if (signed.src) setMemoryImageUrls(prev => ({ ...prev, [path]: signed.src }));
    } catch (err) {
      console.warn("Could not refresh Memory Book image URL", err);
    }
  }


  useEffect(() => {
    if (!userId) return;
    const migrations = [];
    const pathsToSign = new Set();
    Object.entries(journal || {}).forEach(([key, entry]) => {
      const mem = normalizeMemoryEntry(entry);
      mem.photos.forEach(photo => {
        if (memoryPhotoNeedsStorageMigration(photo)) migrations.push({ key, photo });
        else {
          allMemoryPhotoStoragePaths(photo).forEach(path => { if (!memoryImageUrls[path]) pathsToSign.add(path); });
        }
      });
    });
    if (!migrations.length && !pathsToSign.size) return;
    let cancelled = false;
    (async () => {
      const migratedPhotos = {};
      const signedUrls = {};
      for (const item of migrations) {
        try {
          const uploaded = await uploadMemoryDataUrlToStorage(userId, item.photo.src, item.photo.name || "legacy-memory-photo", item.key);
          migratedPhotos[`${item.key}:${item.photo.id}`] = sanitizeMemoryPhotoForStorage({
            id: item.photo.id,
            ...uploaded,
            caption: item.photo.caption || "",
            name: item.photo.name || "legacy-memory-photo",
            createdAt: item.photo.createdAt || new Date().toISOString(),
          });
          allMemoryPhotoStoragePaths(uploaded).forEach(path => pathsToSign.add(path));
        } catch (err) {
          console.warn("Could not migrate Memory Book photo", err);
        }
      }
      for (const path of pathsToSign) {
        try {
          const signed = await signMemoryImagePath(path);
          if (signed.src) signedUrls[path] = signed.src;
        } catch (err) {
          console.warn("Could not sign Memory Book photo", err);
        }
      }
      if (cancelled) return;
      if (Object.keys(signedUrls).length) setMemoryImageUrls(prev => ({ ...prev, ...signedUrls }));
      if (Object.keys(migratedPhotos).length) {
        setJournal(prev => {
          let changed = false;
          const next = { ...prev };
          Object.entries(prev || {}).forEach(([key, entry]) => {
            const mem = normalizeMemoryEntry(entry);
            let entryChanged = false;
            const photos = mem.photos.map(photo => {
              const patch = migratedPhotos[`${key}:${photo.id}`];
              if (!patch) return photo;
              changed = true;
              entryChanged = true;
              return patch;
            });
            if (entryChanged) next[key] = { ...entry, photos };
          });
          return changed ? next : prev;
        });
        onMemoryStorageMigrated?.(new Date().toISOString());
      }
    })();
    return () => { cancelled = true; };
  }, [userId, journal, memoryImageUrls, setJournal, onMemoryStorageMigrated]);

  // (viewEntry accessed inline below via journal[viewingKey])

  return (
    <div className="journal-page">
      {/* Header */}
      <div className="journal-header">
        <div className="journal-title">📔 Memory Book</div>
        <div className="journal-streak">🔥 {streak} day streak</div>
        <button className="tf-cancel journal-today-btn" onClick={() => setMemorySettingsOpen(true)}>Memory Settings</button>
        <button className="tf-save journal-today-btn" onClick={() => setEditing(new Date(TODAY))}>+ Add Memory</button>
      </div>


      {/* Mood stats bar */}
      <div className="mood-stats-bar">
        {moodCounts.map(m => m.count > 0 && (
          <div key={m.id} className="mood-stat-pill" style={{"--mc":m.color}}>
            <span>{m.emoji}</span><span className="mood-stat-count">{m.count}</span>
          </div>
        ))}
        <span className="mood-stats-month">{calDate.toLocaleDateString("en-US",{month:"long",year:"numeric"})}</span>
      </div>

      <div className="memory-search-section">
        <input className="memory-search-input" value={memorySearch} onChange={e=>setMemorySearch(e.target.value)} placeholder="Search memories, tags, gratitude, captions…" />
      </div>

      {throwbacks.length > 0 && (
        <div className="memory-throwback-section">
          <div className="journal-entries-title">Then & Now Throwbacks ✨</div>
          <div className="memory-throwback-row">
            {throwbacks.map(([k,e]) => { const mem = normalizeMemoryEntry(e); const cover = memoryEntryCover(mem); const d = localDateFromKey(k) || new Date(TODAY); return (
              <button key={k} className="memory-throwback-card" onClick={() => setViewingKey(k)}>
                {cover ? <img src={memoryPhotoSrc(cover, memoryImageUrls, true)} onError={() => refreshMemoryImage(cover, true)} alt="Throwback"/> : <span>📔</span>}
                <strong>{d.toLocaleDateString("en-US",{month:"short",day:"numeric"})}</strong>
                <small>{mem.note ? mem.note.slice(0,42) + (mem.note.length>42?"…":"") : "A memory from before"}</small>
              </button>
            );})}
          </div>
        </div>
      )}

      {/* Monthly Memory Book */}
      <div className="memory-book-section">
        <div className="memory-book-head">
          <div>
            <div className="memory-book-title">{calDate.toLocaleDateString("en-US",{month:"long",year:"numeric"})} Memory Book</div>
            <div className="memory-book-sub">{monthPages} page{monthPages !== 1 ? "s" : ""} • {monthPhotos} photo{monthPhotos !== 1 ? "s" : ""}</div>
          </div>
          <div className="memory-book-actions">
            <button className="topbar-btn icon-only nav-arrow" onClick={() => { const d=new Date(calDate); d.setMonth(d.getMonth()-1); setCalDate(d); }}>‹</button>
            <button className="tf-save journal-today-btn" onClick={() => setEditing(new Date(TODAY))}>+ Add Memory</button>
            <button className="topbar-btn icon-only nav-arrow" onClick={() => { const d=new Date(calDate); d.setMonth(d.getMonth()+1); setCalDate(d); }}>›</button>
          </div>
        </div>
        <div className="memory-filter-row">
          <button className={`memory-tag-chip ${activeTag === "all" ? "selected" : ""}`} onClick={() => setActiveTag("all")}>All</button>
          {monthTags.map(tag => <button key={tag} className={`memory-tag-chip ${activeTag === tag ? "selected" : ""}`} onClick={() => setActiveTag(tag)}>#{tag}</button>)}
        </div>
        <div className="memory-page-grid">
          {calDays.filter(Boolean).map(day => {
            const key = dateKey(day);
            const rawEntry = journal[key];
            const entry = normalizeMemoryEntry(rawEntry);
            const hasEntry = hasJournalEntryForKey(journal, key);
            const matchesFilters = memoryMatchesFilters(key, rawEntry);
            const filteredOut = memoryFiltersActive && !matchesFilters;
            const moodObj = entry.mood ? JOURNAL_MOODS.find(m=>m.id===entry.mood) : null;
            const cover = memoryEntryCover(entry);
            const completedCount = completedTasksForDateKey(tasks, key).length;
            const score = dailyGameSummary(tasks, journal, events, key);
            const isFuture = day > TODAY;
            return (
              <button key={key} className={`memory-page-card ${hasEntry ? "has-memory" : ""} ${isFuture ? "future" : ""} ${filteredOut ? "filtered-out" : ""} ${memoryFiltersActive && matchesFilters ? "filter-match" : ""}`} onClick={() => isFuture ? null : (hasEntry ? setViewingKey(key) : setEditing(day))}>
                {cover && <img className="memory-page-cover" src={memoryPhotoSrc(cover, memoryImageUrls, true)} onError={() => refreshMemoryImage(cover, true)} alt={cover.caption || "Memory cover"} />}
                <div className="memory-page-shade" />
                <div className="memory-page-date">{day.getDate()}</div>
                <div className="memory-page-main">
                  <span>{moodObj?.emoji || (hasEntry ? "📔" : "＋")}</span>
                  {hasEntry && <strong>{score.rank}</strong>}
                </div>
                {hasEntry && <div className="memory-page-meta">{completedCount}✓ {entry.photos.length}📷</div>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent entries list */}
      <div className="journal-entries-section">
        <div className="journal-entries-title">{memoryFiltersActive ? "Matching Memories" : "Recent Entries"}</div>
        {searchableEntries
          .slice(0,10)
          .map(([key, entry]) => {
            const d = localDateFromKey(key) || new Date(TODAY);
            const mem = normalizeMemoryEntry(entry);
            const moodObj = JOURNAL_MOODS.find(m=>m.id===mem.mood);
            const cover = memoryEntryCover(mem);
            const acts = (mem.activities||[]).map(id=>activitiesCatalog.find(a=>a.id===id)).filter(Boolean);
            const completedCount = completedTasksForDateKey(tasks, key).length;
            return (
              <div key={key} className="journal-entry-card" onClick={() => setViewingKey(key)}>
                <div className="jec-left">
                  {cover ? <img className="jec-cover" src={memoryPhotoSrc(cover, memoryImageUrls, true)} onError={() => refreshMemoryImage(cover, true)} alt={cover.caption || "Memory cover"} /> : (moodObj && <span className="jec-emoji" style={{"--mc":moodObj.color}}>{moodObj.emoji}</span>)}
                </div>
                <div className="jec-body">
                  <div className="jec-date">{d.toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})}</div>
                  {moodObj && <div className="jec-mood" style={{color:moodObj.color}}>{moodObj.label}</div>}
                  {acts.length>0 && <div className="jec-acts">{acts.slice(0,5).map(a=><span key={a.id}>{a.emoji}</span>)}</div>}
                  {mem.note && <div className="jec-note">{mem.note.slice(0,80)}{mem.note.length>80?"…":""}</div>}
                  {mem.gratitude?.some(g=>g) && <div className="jec-gratitude">🌸 {mem.gratitude.filter(g=>g)[0]}</div>}
                  {mem.tags?.length > 0 && <div className="jec-tags">{mem.tags.slice(0,3).map(t => <span key={t}>#{t}</span>)}</div>}
                  {mem.photos.length > 0 && <div className="jec-gratitude">📷 {mem.photos.length} photo{mem.photos.length !== 1 ? "s" : ""}</div>}
                  {completedCount > 0 && <div className="jec-gratitude">✅ {completedCount} task{completedCount !== 1 ? "s" : ""} completed</div>}
                </div>
                <div className="jec-arrow">›</div>
              </div>
            );
          })}
        {Object.keys(journal).length === 0 && (
          <div className="journal-empty">
            <div className="journal-empty-icon">📔</div>
            <div className="journal-empty-title">No entries yet</div>
            <div className="journal-empty-sub">Tap "+ Add Memory" to create your first page</div>
            <button className="tf-save" style={{marginTop:16}} onClick={() => setEditing(new Date(TODAY))}>Create memory 🌸</button>
          </div>
        )}
      </div>


      {memorySettingsOpen && (
        <div className="modal-overlay" onClick={() => setMemorySettingsOpen(false)} role="dialog" aria-modal="true" aria-label="Memory Settings">
          <div className="entry-modal memory-settings-modal" onClick={e => e.stopPropagation()}>
            <div className="entry-modal-header">
              <div><div className="entry-modal-date">Memory Settings</div><div className="entry-modal-sub">Manage activities, tags, backgrounds, and stickers</div></div>
              <button className="modal-close" onClick={() => setMemorySettingsOpen(false)}>✕</button>
            </div>
            <div className="entry-modal-body">
              <div className="entry-section">
                <div className="entry-section-title">Activities</div>
                {[...new Set((activitiesCatalog || []).map(a => a.group || "Custom"))].map(group => (
                  <div key={group} className="manager-group-card">
                    <div className="manager-group-head">{group}</div>
                    {(activitiesCatalog || []).filter(a => (a.group || "Custom") === group && !a.archived).map(a => (
                      <div key={a.id} className="manager-row">
                        <span className="manager-chip">{a.emoji} {a.label}</span>
                        <span className="manager-count">{allActivitiesUsage[a.id] || 0} uses</span>
                        <button type="button" onClick={() => { const label = window.prompt("Rename activity", a.label); if (!label?.trim()) return; const emoji = window.prompt("Emoji", a.emoji || "✨") || a.emoji || "✨"; onUpdateActivity?.(a.id, { label: label.trim(), emoji: emoji.trim() || "✨" }); }}>Edit</button>
                        <button type="button" onClick={() => { if (window.confirm(`Archive ${a.emoji || ""} ${a.label}? Old memories will keep their label.`)) onDeleteActivity?.(a.id); }}>Archive</button>
                      </div>
                    ))}
                  </div>
                ))}
                <div className="tf-row" style={{marginTop:10}}><button className="tf-save" onClick={() => { const label = window.prompt("New activity name"); if (!label?.trim()) return; const emoji = window.prompt("Emoji", "✨") || "✨"; const group = window.prompt("Group", "Custom") || "Custom"; onAddActivity?.(label.trim(), group.trim() || "Custom", emoji.trim() || "✨"); }}>+ Add activity</button></div>
              </div>
              <div className="entry-section">
                <div className="entry-section-title">Memory Tags</div>
                {Object.keys(allTagUsage).length === 0 && <div className="scrapbook-empty-note">No tags yet. Add tags while creating a memory.</div>}
                {Object.keys(allTagUsage).sort().map(tag => (
                  <div key={tag} className="manager-row">
                    <span className="manager-chip">#{tag}</span><span className="manager-count">{allTagUsage[tag]} uses</span>
                    <button type="button" onClick={() => { const next = window.prompt("Rename memory tag", tag); if (next?.trim()) onUpdateMemoryTag?.(tag, next.trim()); }}>Rename</button>
                    <button type="button" onClick={() => { const into = window.prompt("Merge into which tag?"); if (into?.trim()) onUpdateMemoryTag?.(tag, into.trim()); }}>Merge</button>
                    <button type="button" onClick={() => { if (window.confirm(`Delete #${tag} from all memories?`)) onDeleteMemoryTag?.(tag); }}>Delete</button>
                  </div>
                ))}
              </div>
              <div className="entry-section"><div className="entry-section-title">Backgrounds</div><div className="memory-background-picker">{MEMORY_BACKGROUNDS.map(bg => <span key={bg.id} className="memory-bg-choice"><span className="memory-bg-swatch" style={bg.src ? {backgroundImage:`url(${bg.src})`} : {}} /> <span>{bg.label}</span></span>)}</div></div>
              <div className="entry-section"><div className="entry-section-title">Stickers</div><div className="sticker-asset-picker-row">{COZY_STICKER_PACK.map(st => <span key={st.id}><img src={st.src} alt={st.label}/></span>)}</div></div>
            </div>
          </div>
        </div>
      )}

      {/* View entry modal */}
      {viewingKey && journal[viewingKey] && (() => {
        const entry = normalizeMemoryEntry(journal[viewingKey]);
        const d = localDateFromKey(viewingKey) || new Date(TODAY);
        const moodObj = JOURNAL_MOODS.find(m=>m.id===entry.mood);
        const cover = memoryEntryCover(entry);
        const acts = (entry.activities||[]).map(id=>activitiesCatalog.find(a=>a.id===id)).filter(Boolean);
        const completedTasks = completedTasksForDateKey(tasks, viewingKey);
        const dayScore = dailyGameSummary(tasks, journal, events, viewingKey);
        return (
          <div className="modal-overlay" onClick={() => setViewingKey(null)} role="dialog" aria-modal="true" aria-label="View journal entry">
            <div className={`entry-view-modal memory-bg-${entry.backgroundId || "plain"}`} style={memoryBackgroundStyle(entry.backgroundId)} onClick={e=>e.stopPropagation()}>
              <div className="entry-modal-header">
                <div>
                  <div className="entry-modal-date">{d.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"})}</div>
                  {moodObj && <div className="entry-view-mood" style={{color:moodObj.color}}>{moodObj.emoji} {moodObj.label}</div>}
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button className="tf-cancel" style={{fontSize:11}} onClick={() => { setEditing(d); setViewingKey(null); }}>Edit Memory</button>
                  <button className="modal-close" onClick={() => setViewingKey(null)}>✕</button>
                </div>
              </div>
              <div className="entry-view-body">
                {cover && <div className="memory-cover-hero"><img src={memoryPhotoSrc(cover, memoryImageUrls)} onError={() => refreshMemoryImage(cover)} alt={cover.caption || "Memory cover"}/>{cover.caption && <div>{cover.caption}</div>}</div>}
                {entry.tags.length > 0 && <div className="entry-view-section"><div className="entry-section-title">Memory Tags</div><div className="memory-tag-row">{entry.tags.map(t => <span key={t} className="memory-tag-chip selected">#{t}</span>)}</div></div>}
                {entry.photos.length > 0 && <div className="entry-view-section"><div className="entry-section-title">Photos</div><div className="memory-photo-view-grid">{entry.photos.map(p => <figure key={p.id} className="memory-photo-view-card"><img src={memoryPhotoSrc(p, memoryImageUrls)} onError={() => refreshMemoryImage(p)} alt={p.caption || "Memory photo"}/>{p.caption && <figcaption>{p.caption}</figcaption>}</figure>)}</div></div>}
                {acts.length>0 && <div className="entry-view-section"><div className="entry-section-title">Activities</div><div className="activity-chips">{acts.map(a=><span key={a.id} className="activity-chip selected">{a.emoji} {a.label}</span>)}</div></div>}
                {Object.values(entry.highlights || {}).some(Boolean) && <div className="entry-view-section"><div className="entry-section-title">Today’s Highlights ✨</div><div className="highlight-view-grid">{entry.highlights.best && <div><span>Best moment</span><strong>{entry.highlights.best}</strong></div>}{entry.highlights.win && <div><span>Biggest win</span><strong>{entry.highlights.win}</strong></div>}{entry.highlights.learned && <div><span>Learned</span><strong>{entry.highlights.learned}</strong></div>}{entry.highlights.remember && <div><span>Remember</span><strong>{entry.highlights.remember}</strong></div>}</div></div>}
                {entry.gratitude?.some(g=>g) && <div className="entry-view-section"><div className="entry-section-title">Gratitude 🌸</div>{entry.gratitude.filter(g=>g).map((g,i)=><div key={i} className="gratitude-view-item">✦ {g}</div>)}</div>}
                {entry.note && <div className="entry-view-section"><div className="entry-section-title">Journal</div><div className="entry-view-note">{entry.note}</div></div>}
                {entry.blocks.length > 0 && <div className="entry-view-section"><div className="entry-section-title">Scrapbook Page 🎀</div><div className="scrapbook-view-list">{entry.blocks.map(b => { const blockPhotos = (b.photoIds || []).map(id => entry.photos.find(p => p.id === id)).filter(Boolean); return <div key={b.id} className={`scrapbook-view-block block-${b.type}`}>{b.type === "text" && <div className="entry-view-note">{b.text}</div>}{b.type === "quote" && <blockquote>{b.text}</blockquote>}{b.type === "sticker" && (b.stickerAsset ? <div className="scrapbook-sticker-view asset"><img src={b.stickerAsset} alt="Sticker"/></div> : <div className="scrapbook-sticker-view">{b.sticker || "🌸"}</div>)}{b.type === "divider" && <div className="scrapbook-divider-preview">✦ ✦ ✦</div>}{b.type === "photoGrid" && <><div className="memory-photo-view-grid scrapbook-photo-grid">{blockPhotos.map(p => <figure key={p.id} className="memory-photo-view-card"><img src={memoryPhotoSrc(p, memoryImageUrls)} onError={() => refreshMemoryImage(p)} alt={p.caption || "Memory photo"}/>{p.caption && <figcaption>{p.caption}</figcaption>}</figure>)}</div>{b.caption && <div className="scrapbook-grid-caption">{b.caption}</div>}</>}</div>; })}</div></div>}
                <div className="entry-view-section daily-score-section">
                  <div className="entry-section-title">Daily Score 🌸</div>
                  <div className="daily-score-card">
                    <div className="daily-score-main"><span className="daily-score-rank">{dayScore.rank}</span><span className="daily-score-num">{dayScore.score}/100</span></div>
                    <div className="daily-score-lines">
                      <span>✅ {dayScore.completed.length} task{dayScore.completed.length !== 1 ? "s" : ""}</span>
                      <span>🎯 {dayScore.highDone} priority</span>
                      <span>🔮 {Math.round(dayScore.focusMins / 60 * 10) / 10}h focus</span>
                      <span>📔 {dayScore.journalDone ? "Journal done" : "No journal"}</span>
                    </div>
                  </div>
                </div>
                {completedTasks.length > 0 && (
                  <div className="entry-view-section completed-tasks-section">
                    <div className="entry-section-title">Completed Tasks ✅</div>
                    <div className="completed-task-list">
                      {completedTasks.map(t => (
                        <div key={t.id} className="completed-task-item">
                          <span className="completed-task-check">✓</span>
                          <div className="completed-task-body">
                            <div className="completed-task-title">{t.title}</div>
                            <div className="completed-task-meta">{formatTaskDuration(t.duration)}{t.priority ? ` • ${PRIORITIES.find(p=>p.id===t.priority)?.label || t.priority}` : ""}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {editing && <DayEntryModal date={editing} entry={journal[dateKey(editing)]} onSave={saveEntry} onClose={() => setEditing(null)} activitiesCatalog={activitiesCatalog} memoryTagsCatalog={memoryTagsCatalog} onAddActivity={onAddActivity} onUpdateActivity={onUpdateActivity} onDeleteActivity={onDeleteActivity} onAddMemoryTag={onAddMemoryTag} onUpdateMemoryTag={onUpdateMemoryTag} onDeleteMemoryTag={onDeleteMemoryTag} userId={userId} imageUrls={memoryImageUrls} />}
    </div>
  );
}

// ─── Add Event Modal ──────────────────────────────────────────────────────────
function AddEventModal({ onClose, onSave, defaultDate, calendars = CALENDARS, categories = CATEGORIES }) {
  const now = new Date(defaultDate); now.setMinutes(0,0,0);
  const end = new Date(now); end.setHours(end.getHours()+1);
  const [form, setForm] = useState({
    title: "", startDate: toDateInput(defaultDate), endDate: toDateInput(defaultDate), startTime: toTimeInputValue(now), endTime: toTimeInputValue(end), allDay: false,
    calendar: "work", category: "meeting", fixed: false, notes: "", color: null, recurrence: null
  });
  const [err, setErr] = useState("");
  function handleSave() {
    if (!form.title.trim()) { setErr("Please enter a title."); return; }
    const start = form.allDay ? applyDateAndTime(form.startDate, "00:00") : applyDateAndTime(form.startDate, form.startTime);
    const endBase = form.allDay ? endOfDay(applyDateAndTime(form.endDate, "00:00")) : applyDateAndTime(form.endDate, form.endTime);
    if (endBase <= start) { setErr("End must be after start."); return; }
    onSave({ id:"e"+uid(), title:form.title.trim(), start, end:endBase, allDay: form.allDay, calendar:form.calendar, category:form.category, fixed:form.fixed, notes:form.notes, color:form.color, recurrence:form.recurrence });
    onClose();
  }
  const COLORS=["#FF7BAC","#B08AE0","#7CBAFF","#70C8A0","#FFB870","#FF9F9F","#C9A0FF","#7EC8C8"];
  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Add event">
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-header" style={{borderLeft:`4px solid ${form.color||"var(--accent)"}`}}>
          <input className="modal-title-input" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="Event title" autoFocus />
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="modal-row"><label>All day</label><input type="checkbox" checked={form.allDay} onChange={e=>setForm(f=>({...f,allDay:e.target.checked}))}/></div>
          <div className="modal-row"><label>Start date</label><input type="date" className="modal-select" value={form.startDate} onChange={e=>setForm(f=>({...f,startDate:e.target.value,endDate:f.endDate < e.target.value ? e.target.value : f.endDate}))}/></div>
          <div className="modal-row"><label>End date</label><input type="date" className="modal-select" value={form.endDate} onChange={e=>setForm(f=>({...f,endDate:e.target.value}))}/></div>
          {!form.allDay && <><div className="modal-row"><label>Start</label><input type="time" className="modal-select modal-time" value={form.startTime} onChange={e=>setForm(f=>({...f,startTime:e.target.value}))}/></div><div className="modal-row"><label>End</label><input type="time" className="modal-select modal-time" value={form.endTime} onChange={e=>setForm(f=>({...f,endTime:e.target.value}))}/></div></>}
          <div className="modal-row"><label>Calendar</label><select className="modal-select" value={form.calendar} onChange={e=>setForm(f=>({...f,calendar:e.target.value}))}>{calendars.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div className="modal-row"><label>Category</label><select className="modal-select" value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>{categories.map(c=><option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}</select></div>
          <div className="modal-row modal-col"><label>Recurrence</label><RecurrenceEditor value={form.recurrence} startDate={applyDateAndTime(form.startDate, form.startTime)} onChange={recurrence=>setForm(f=>({...f,recurrence}))}/></div>
          <div className="modal-row"><label>Fixed</label><input type="checkbox" checked={form.fixed} onChange={e=>setForm(f=>({...f,fixed:e.target.checked}))}/><span style={{fontSize:11,color:"var(--text2)",marginLeft:6}}>Cannot be dragged</span></div>
          <div className="modal-row"><label>Color</label><div className="color-picker">{COLORS.map(c=><button key={c} className={`color-dot ${form.color===c?"selected":""}`} style={{background:c}} onClick={()=>setForm(f=>({...f,color:c}))}/> )}<button className="color-dot color-reset" onClick={()=>setForm(f=>({...f,color:null}))}>↺</button></div></div>
          <div className="modal-row modal-col"><label>Notes</label><textarea className="modal-textarea" value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Add notes..." rows={2}/></div>
          {err && <div style={{color:"#C04040",fontSize:12,fontWeight:700}}>⚠️ {err}</div>}
        </div>
        <div className="modal-footer"><div/><div style={{display:"flex",gap:8}}><button className="tf-cancel" onClick={requestClose}>Cancel</button><button className="tf-save" onClick={handleSave}>Save event</button></div></div>
      </div>
    </div>
  );
}

// ─── Search Modal ─────────────────────────────────────────────────────────────
function SearchModal({ events, tasks, categories = CATEGORIES, onClose, onEventClick, onTaskEdit, onNavigate }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const q = query.trim().toLowerCase();
  const matchedEvents = q.length < 2 ? [] : events
    .filter(e => e.title.toLowerCase().includes(q) || (e.notes || "").toLowerCase().includes(q))
    .sort((a, b) => a.start - b.start)
    .slice(0, 20);
  const matchedTasks = q.length < 2 ? [] : tasks
    .filter(t => t.title.toLowerCase().includes(q) || (t.notes || "").toLowerCase().includes(q))
    .slice(0, 10);

  function handleKey(e) {
    if (e.key === "Escape") onClose();
  }

  return (
    <div className="modal-overlay search-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Search">
      <div className="search-modal" onClick={e => e.stopPropagation()}>
        <div className="search-input-row">
          <span className="search-icon">🔍</span>
          <input
            ref={inputRef}
            className="search-input"
            placeholder="Search events, tasks, notes…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
          />
          {query && <button className="search-clear" onClick={() => setQuery("")}>✕</button>}
        </div>

        {q.length >= 2 && (
          <div className="search-results">
            {matchedEvents.length === 0 && matchedTasks.length === 0 && (
              <div className="search-empty">No results for "{query}"</div>
            )}

            {matchedEvents.length > 0 && (
              <div className="search-section">
                <div className="search-section-title">📅 Events ({matchedEvents.length})</div>
                {matchedEvents.map(e => {
                  const cal = CALENDARS.find(c => c.id === e.calendar);
                  const color = e.color || cal?.color || "#FF7BAC";
                  return (
                    <div key={e.id} className="search-result-row" onClick={() => { onNavigate(e.start); onEventClick(e); onClose(); }}>
                      <div className="search-result-dot" style={{ background: color }} />
                      <div className="search-result-body">
                        <div className="search-result-title">{highlightMatch(e.title, q)}</div>
                        <div className="search-result-meta">
                          {e.start.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} · {fmt(e.start)}–{fmt(e.end)}
                          {e._recurring && <span className="search-recurring-badge">↻ recurring</span>}
                        </div>
                        {e.notes && <div className="search-result-notes">{highlightMatch(e.notes.slice(0, 80), q)}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {matchedTasks.length > 0 && (
              <div className="search-section">
                <div className="search-section-title">✅ Tasks ({matchedTasks.length})</div>
                {matchedTasks.map(t => {
                  const cat = categories.find(c => c.id === t.category);
                  return (
                    <div key={t.id} className={`search-result-row ${t.done ? "search-done" : ""}`} onClick={() => { onTaskEdit(t); onClose(); }}>
                      <div className="search-result-dot" style={{ background: cat?.color || "#FF7BAC" }} />
                      <div className="search-result-body">
                        <div className="search-result-title">{highlightMatch(t.title, q)}</div>
                        <div className="search-result-meta">
                          {cat?.icon} {cat?.label} · {t.duration}min · {t.scope}
                          {t.done && <span className="search-done-badge">✓ done</span>}
                        </div>
                        {t.notes && <div className="search-result-notes">{highlightMatch(t.notes.slice(0, 80), q)}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {q.length < 2 && (
          <div className="search-hint">Type at least 2 characters to search across all events and tasks</div>
        )}
      </div>
    </div>
  );
}

function highlightMatch(text, query) {
  if (!query || !text) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="search-highlight">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

// ─── Chat Panel ───────────────────────────────────────────────────────────────
function ChatPanel({ events, tasks, onClose, onUpdateEvents, onUpdateTasks, onAddEvent }) {
  const [messages, setMessages] = useState([{ role: "assistant", text: buildGreeting(events, tasks) }]);
  const [input, setInput]       = useState("");
  const [pending, setPending]   = useState(null);
  const bottomRef = useRef(null);
  // Use refs so send() always reads current events/tasks without needing them in its closure
  const eventsRef = useRef(events);
  const tasksRef  = useRef(tasks);
  const pendingRef = useRef(pending);
  useEffect(() => { eventsRef.current  = events;  }, [events]);
  useEffect(() => { tasksRef.current   = tasks;   }, [tasks]);
  useEffect(() => { pendingRef.current = pending; }, [pending]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  function send(ov) {
    const text = (ov ?? input).trim(); if (!text) return;
    setInput(""); setMessages(p => [...p, { role: "user", text }]);
    // CHAT_REPLY_DELAY_MS adds a brief pause to feel natural — purely cosmetic
    setTimeout(() => {
      const { text: rt, newEv, newTk, newP } = processMessage(text, eventsRef.current, tasksRef.current, pendingRef.current);
      setMessages(p => [...p, { role: "assistant", text: rt }]);
      if (newEv && Array.isArray(newEv)) onUpdateEvents(newEv);
      if (newTk) onUpdateTasks(newTk);
      setPending(newP || null);
    }, CHAT_REPLY_DELAY_MS);
  }
  function handleKey(e) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }
  const sugg = ["What's on today?","When am I free?","Show my tasks","How busy am I?","What's next?","Help"];
  return (
    <div className="chat-panel">
      <div className="chat-header"><div className="chat-title-row"><div className="chat-avatar">🌸</div><div><div className="chat-name">Tempo Assistant</div><div className="chat-status">● always here</div></div></div><button className="chat-close" onClick={onClose} aria-label="Close chat">✕</button></div>
      <div className="chat-messages">
        {messages.map((m, i) => <div key={i} className={`chat-msg ${m.role}`}>{m.role === "assistant" && <div className="msg-avatar">🌸</div>}<div className="msg-bubble" style={{ whiteSpace: "pre-line" }}>{m.text}</div></div>)}
        <div ref={bottomRef} />
      </div>
      {messages.length <= 2 && <div className="suggestions">{sugg.map((s, i) => <button key={i} className="suggestion-pill" onClick={() => send(s)}>{s}</button>)}</div>}
      <div className="chat-input-row"><textarea className="chat-input" placeholder="Ask about your schedule..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey} rows={1} aria-label="Chat input" /><button className="chat-send" onClick={() => send()} disabled={!input.trim()} aria-label="Send message"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg></button></div>
    </div>
  );
}


function SyncStatusPill({ syncStatus, onRetry }) {
  const status = syncStatus?.status || "saved";
  const label = syncStatus?.message || (status === "saving" ? "Saving…" : status === "failed" ? "Sync failed" : status === "offline" ? "Saved on this device only" : "Saved to cloud");
  const icon = status === "saving" ? "⏳" : status === "failed" ? "⚠️" : status === "offline" ? "📱" : "✓";
  return (
    <button type="button" className={`sync-pill sync-${status}`} onClick={status === "failed" ? onRetry : undefined} title={status === "failed" ? "Tap to retry cloud sync" : label}>
      <span>{icon}</span><span>{label}</span>
    </button>
  );
}

function QuickAddMenu({ open, onToggle, onClose, onAddEvent, onAddTask, onAddMemory, onAddFocus }) {
  return (
    <div className="quick-add-wrap">
      {open && <div className="quick-add-menu" role="menu">
        <button onClick={() => { onAddEvent(); onClose(); }}>📅 Event</button>
        <button onClick={() => { onAddTask(); onClose(); }}>✅ Task</button>
        <button onClick={() => { onAddMemory(); onClose(); }}>📔 Memory</button>
        <button onClick={() => { onAddFocus(); onClose(); }}>🎯 Focus block</button>
      </div>}
      <button className="quick-add-fab" onClick={onToggle} aria-label="Quick add">{open ? "×" : "+"}</button>
    </div>
  );
}

function XPBreakdownCard({ gameStats }) {
  const b = gameStats?.xpBreakdown || {};
  const rows = [
    ["Completed tasks", b.taskXP || 0],
    ["Memory Book", b.journalXP || 0],
    ["Daily quests", b.questXP || 0],
    ["Weekly missions", b.missionXP || 0],
    ["Combos", b.comboXP || 0],
    ["Badges", b.badgeXP || 0],
  ];
  return (
    <div className="game-card xp-breakdown-card">
      <div className="game-card-title">Why did my XP change?</div>
      <div className="xp-breakdown-list">{rows.map(([label, xp]) => <div key={label} className="xp-breakdown-row"><span>{label}</span><strong>+{xp} XP</strong></div>)}</div>
    </div>
  );
}

function BloomCollapse({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return <div className={`bloom-collapse ${open ? "open" : ""}`}><button className="bloom-collapse-head" onClick={() => setOpen(v => !v)}><span>{title}</span><span>{open ? "−" : "+"}</span></button>{open && <div className="bloom-collapse-body">{children}</div>}</div>;
}

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  const auth = useAuth();
  // Use auth user ID when available; fall back to a per-session key stored in sessionStorage
  // so anonymous users on shared devices do not see each other's data.
  const uk = useMemo(() => {
    if (auth.user?.id) return auth.user.id;
    if (typeof sessionStorage !== "undefined") {
      let k = sessionStorage.getItem("tempo_anon_key");
      if (!k) { k = "anon_" + Math.random().toString(36).slice(2, 10); sessionStorage.setItem("tempo_anon_key", k); }
      return k;
    }
    return "anon";
  }, [auth.user?.id]);

  const [view, setView]             = useState("day");
  const [viewDate, setViewDate]     = useState(new Date(TODAY));
  const [page, setPage]             = useState("calendar"); // "calendar" | "journal" | "tasks"
  const [taskScope, setTaskScope]   = useState("day");
  const [taskPeriodDate, setTaskPeriodDate] = useState(new Date(TODAY));
  const [events, setEvRaw]          = useState(() => reviveEvents(load(`${uk}_ev`, INIT_EVENTS)));
  const [tasks,  setTkRaw]          = useState(() => normalizeTasks(load(`${uk}_tk`, INIT_TASKS)));
  const [chatOpen, setChatOpen]     = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(() => (typeof window === "undefined" ? true : window.innerWidth > 768));
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [fontSize,  setFSRaw]       = useState(() => load(`${uk}_fs`, "md"));
  const [darkMode,  setDMRaw]       = useState(() => load(`${uk}_dm`, false));
  const [workStart, setWSRaw]       = useState(() => load(`${uk}_ws`, 9));
  const [workEnd,   setWERaw]       = useState(() => load(`${uk}_we`, 19));
  const [timezone,   setTzRaw]        = useState(() => load(`${uk}_tz`, Intl.DateTimeFormat().resolvedOptions().timeZone));
  const [theme,     setThRaw]       = useState(() => load(`${uk}_th`, "tempo"));
  const [undoStack, setUndo]        = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [copiedEvent, setCopiedEvent] = useState(null);
  const [toast, setToast] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [mobileTasksOpen, setMobileTasksOpen] = useState(false);
  const [categories, setCatRaw] = useState(() => normalizeCategories(load(`${uk}_categories`, CATEGORIES)));
  const [templates, setTplRaw] = useState(() => load(`${uk}_templates`, DAY_TEMPLATES));
  const [journalActivities, setJournalActivitiesRaw] = useState(() => load(`${uk}_journal_activities`, JOURNAL_ACTIVITIES));
  const [memoryTags, setMemoryTagsRaw] = useState(() => load(`${uk}_memory_tags`, MEMORY_TAGS));
  const [showStats,    setShowStats]    = useState(false);
  const [showShortcuts,setShowShortcuts]= useState(false);
  const [showCarryOver,setShowCarryOver]= useState(false);
  const [showAddEvent,  setShowAddEvent]  = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [notifs, setNfRaw] = useState(() => load(`${uk}_nf`, false));
  const [hiddenCals,    setHiddenCals]    = useState(() => load(`${uk}_hidden_cals`, []));
  const [quickAddDate,  setQuickAddDate]  = useState(null);
  const [quickMemoryDate, setQuickMemoryDate] = useState(null);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState({ status: "saved", message: "Saved to cloud", lastError: "" });
  const cloudQueueRef = useRef(Promise.resolve());
  const [focusMode,    setFocusMode]    = useState(false);
  const [dataReady,    setDataReady]    = useState(false);
  const [loadedUserId, setLoadedUserId] = useState(null);
  const [journal, setJournalRaw] = useState({}); // populated by useEffect after auth resolves
  const [memoryStorageMigratedAt, setMemoryStorageMigratedAtRaw] = useState(() => load(`${uk}_memory_storage_migrated_at`, null));
  // Real streak: count consecutive days the user has been active
  const [streak, setStreak] = useState(0);
  const pomodoro = usePomodoro();
  const closeSidebarOnMobile = () => {
    if (typeof window !== "undefined" && window.innerWidth <= 768) setSidebarOpen(false);
  };

  // Mobile app-like viewport: prevent accidental pinch/input zoom and horizontal scaling.
  useEffect(() => {
    if (typeof document === "undefined") return;
    let viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
      viewport = document.createElement("meta");
      viewport.setAttribute("name", "viewport");
      document.head.appendChild(viewport);
    }
    const previous = viewport.getAttribute("content") || "";
    viewport.setAttribute("content", "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover");
    return () => {
      if (previous) viewport.setAttribute("content", previous);
    };
  }, []);

  // Helper: compute, persist, and return the current streak for a given user key
  const computeAndSaveStreak = useCallback((userKey) => {
    const lastActive = load(`${userKey}_last_active`, null);
    const saved      = load(`${userKey}_streak`, 0);
    const today      = dateKey(TODAY);
    const yesterday  = dateKey(new Date(TODAY.getTime() - 86400000));
    let streak;
    if (!lastActive)            { streak = 1; }
    else if (lastActive === today)     { streak = saved; }
    else if (lastActive === yesterday) { streak = saved + 1; }
    else                               { streak = 1; }
    save(`${userKey}_streak`, streak);
    save(`${userKey}_last_active`, today);
    return streak;
  }, []);
  useEffect(() => {
    const userId = auth.user?.id;
    if (!userId) {
      setDataReady(false);
      setLoadedUserId(null);
      setEvRaw([]);
      setTkRaw([]);
      setJournalRaw({});
      return;
    }

    let cancelled = false;
    const userKey = userId;

    // Privacy guard: immediately blank the in-memory state before loading the
    // newly signed-in user's own scoped data. This prevents a newly signed-in
    // user from briefly seeing the previous user's calendar/tasks/journal.
    setDataReady(false);
    setLoadedUserId(null);
    setEvRaw([]);
    setTkRaw([]);
    setJournalRaw({});
    setJournalActivitiesRaw(load(`${userKey}_journal_activities`, JOURNAL_ACTIVITIES));
    setMemoryTagsRaw(load(`${userKey}_memory_tags`, MEMORY_TAGS));

    const applyLoadedData = async ({ loadedEvents, loadedTasks, settings, updatedAt }) => {
      if (cancelled) return;
      const safeEvents = reviveEvents(loadedEvents || []);
      const safeTasks = normalizeTasks(Array.isArray(loadedTasks) ? loadedTasks : []);
      const safeSettings = settings || {};

      setEvRaw(safeEvents);
      setTkRaw(safeTasks);

      save(`${userKey}_ev`, safeEvents);
      save(`${userKey}_tk`, safeTasks);
      if (updatedAt) save(`${userKey}_updated_at`, updatedAt);

      const nextSettings = {
        fontSize: safeSettings.fontSize ?? load(`${userKey}_fs`, "md"),
        darkMode: safeSettings.darkMode ?? load(`${userKey}_dm`, false),
        theme: safeSettings.theme ?? load(`${userKey}_th`, "tempo"),
        workStart: safeSettings.workStart ?? load(`${userKey}_ws`, 9),
        workEnd: safeSettings.workEnd ?? load(`${userKey}_we`, 19),
        notifs: safeSettings.notifs ?? load(`${userKey}_nf`, false),
        timezone: safeSettings.timezone ?? load(`${userKey}_tz`, Intl.DateTimeFormat().resolvedOptions().timeZone),
        categories: normalizeCategories(safeSettings.categories ?? load(`${userKey}_categories`, CATEGORIES)),
        templates: safeSettings.templates ?? load(`${userKey}_templates`, DAY_TEMPLATES),
        journalActivities: safeSettings.journalActivities ?? load(`${userKey}_journal_activities`, JOURNAL_ACTIVITIES),
        memoryTags: safeSettings.memoryTags ?? load(`${userKey}_memory_tags`, MEMORY_TAGS),
        memoryStorageMigratedAt: safeSettings.memoryStorageMigratedAt ?? load(`${userKey}_memory_storage_migrated_at`, null),
        journal: await decryptMemoryJournalFromStorage(userId, safeSettings.journal ?? load(`${userKey}_journal`, {})),
      };

      setFSRaw(nextSettings.fontSize);
      setDMRaw(Boolean(nextSettings.darkMode));
      setThRaw(nextSettings.theme);
      setWSRaw(Number(nextSettings.workStart));
      setWERaw(Number(nextSettings.workEnd));
      setNfRaw(Boolean(nextSettings.notifs));
      setTzRaw(nextSettings.timezone);
      setCatRaw(normalizeCategories(nextSettings.categories));
      setTplRaw(nextSettings.templates);
      setJournalActivitiesRaw(nextSettings.journalActivities);
      setMemoryTagsRaw(nextSettings.memoryTags || MEMORY_TAGS);
      setMemoryStorageMigratedAtRaw(nextSettings.memoryStorageMigratedAt || null);
      setJournalRaw(nextSettings.journal || {});
      save(`${userKey}_memory_storage_migrated_at`, nextSettings.memoryStorageMigratedAt || null);
      saveJournalLocal(userKey, userId, nextSettings.journal || {});
      setWorkHoursCtx(Number(nextSettings.workStart), Number(nextSettings.workEnd));
      setStreak(computeAndSaveStreak(userKey));
      setLoadedUserId(userId);
      setDataReady(true);
    };

    const fallbackTimer = setTimeout(async () => {
      if (cancelled) return;
      setSyncStatus({ status: "offline", message: "Offline — saved on this device only", lastError: "Cloud load timed out" });
      const localHasData = hasStoredUserData(userKey);
      await applyLoadedData({
        loadedEvents: localHasData ? reviveEvents(load(`${userKey}_ev`, [])) : [],
        loadedTasks: localHasData ? load(`${userKey}_tk`, []) : [],
        settings: {
          fontSize: load(`${userKey}_fs`, "md"),
          darkMode: load(`${userKey}_dm`, false),
          theme: load(`${userKey}_th`, "tempo"),
          workStart: load(`${userKey}_ws`, 9),
          workEnd: load(`${userKey}_we`, 19),
          notifs: load(`${userKey}_nf`, false),
          timezone: load(`${userKey}_tz`, Intl.DateTimeFormat().resolvedOptions().timeZone),
          categories: normalizeCategories(load(`${userKey}_categories`, CATEGORIES)),
          templates: load(`${userKey}_templates`, DAY_TEMPLATES),
          journalActivities: load(`${userKey}_journal_activities`, JOURNAL_ACTIVITIES),
          memoryTags: load(`${userKey}_memory_tags`, MEMORY_TAGS),
          memoryStorageMigratedAt: load(`${userKey}_memory_storage_migrated_at`, null),
          journal: load(`${userKey}_journal`, {}),
        },
        updatedAt: load(`${userKey}_updated_at`, null),
      });
    }, CLOUD_FALLBACK_MS);

    loadFromCloud(userId).then(async cloud => {
      clearTimeout(fallbackTimer);
      if (cancelled) return;

      const localHasData = hasStoredUserData(userKey);
      const localUpdatedAt = load(`${userKey}_updated_at`, null);
      const cloudUpdatedAt = cloud?.updated_at ?? null;
      const localIsNewer =
        localHasData &&
        (!cloudUpdatedAt || (localUpdatedAt && new Date(localUpdatedAt) >= new Date(cloudUpdatedAt)));

      // Authenticated accounts are never hydrated from anonymous/demo keys.
      // Order of trust: this user's cloud row > this user's scoped local row > empty.
      if (cloud && !localIsNewer) {
        setSyncStatus({ status: "saved", message: "Saved to cloud", lastError: "" });
        await applyLoadedData({
          loadedEvents: Array.isArray(cloud.events) ? cloud.events : [],
          loadedTasks: Array.isArray(cloud.tasks) ? cloud.tasks : [],
          settings: cloud.settings || {},
          updatedAt: cloud.updated_at,
        });
      } else if (localHasData) {
        const nextEvents = reviveEvents(load(`${userKey}_ev`, []));
        const nextTasks = load(`${userKey}_tk`, []);
        const nextSettings = {
          fontSize: load(`${userKey}_fs`, "md"),
          darkMode: load(`${userKey}_dm`, false),
          theme: load(`${userKey}_th`, "tempo"),
          workStart: load(`${userKey}_ws`, 9),
          workEnd: load(`${userKey}_we`, 19),
          notifs: load(`${userKey}_nf`, false),
          timezone: load(`${userKey}_tz`, Intl.DateTimeFormat().resolvedOptions().timeZone),
          categories: normalizeCategories(load(`${userKey}_categories`, CATEGORIES)),
          templates: load(`${userKey}_templates`, DAY_TEMPLATES),
          journalActivities: load(`${userKey}_journal_activities`, JOURNAL_ACTIVITIES),
          memoryTags: load(`${userKey}_memory_tags`, MEMORY_TAGS),
          memoryStorageMigratedAt: load(`${userKey}_memory_storage_migrated_at`, null),
          journal: load(`${userKey}_journal`, {}),
        };
        await applyLoadedData({ loadedEvents: nextEvents, loadedTasks: nextTasks, settings: nextSettings, updatedAt: localUpdatedAt });
        saveToCloud(userId, nextEvents, nextTasks, { ...nextSettings, journal: await decryptMemoryJournalFromStorage(userId, nextSettings.journal) });
      } else {
        // Brand-new authenticated user: start empty. Do not copy previous in-memory,
        // anonymous, demo, or browser data into this account.
        const blankSettings = {
          fontSize: "md",
          darkMode: false,
          theme: "tempo",
          workStart: 9,
          workEnd: 19,
          notifs: false,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          categories: normalizeCategories(CATEGORIES),
          templates: DAY_TEMPLATES,
          journalActivities: JOURNAL_ACTIVITIES,
          memoryTags: MEMORY_TAGS,
          memoryStorageMigratedAt: null,
          journal: {},
        };
        await applyLoadedData({ loadedEvents: [], loadedTasks: [], settings: blankSettings, updatedAt: new Date().toISOString() });
        saveToCloud(userId, [], [], blankSettings);
      }
    }).catch(async () => {
      clearTimeout(fallbackTimer);
      setSyncStatus({ status: "offline", message: "Offline — saved on this device only", lastError: "Cloud load failed" });
      if (cancelled) return;
      const localHasData = hasStoredUserData(userKey);
      await applyLoadedData({
        loadedEvents: localHasData ? reviveEvents(load(`${userKey}_ev`, [])) : [],
        loadedTasks: localHasData ? load(`${userKey}_tk`, []) : [],
        settings: {
          fontSize: load(`${userKey}_fs`, "md"),
          darkMode: load(`${userKey}_dm`, false),
          theme: load(`${userKey}_th`, "tempo"),
          workStart: load(`${userKey}_ws`, 9),
          workEnd: load(`${userKey}_we`, 19),
          notifs: load(`${userKey}_nf`, false),
          timezone: load(`${userKey}_tz`, Intl.DateTimeFormat().resolvedOptions().timeZone),
          categories: normalizeCategories(load(`${userKey}_categories`, CATEGORIES)),
          templates: load(`${userKey}_templates`, DAY_TEMPLATES),
          journalActivities: load(`${userKey}_journal_activities`, JOURNAL_ACTIVITIES),
          memoryTags: load(`${userKey}_memory_tags`, MEMORY_TAGS),
          memoryStorageMigratedAt: load(`${userKey}_memory_storage_migrated_at`, null),
          journal: load(`${userKey}_journal`, {}),
        },
        updatedAt: load(`${userKey}_updated_at`, null),
      });
    });

    return () => {
      cancelled = true;
      clearTimeout(fallbackTimer);
    };
  }, [auth.user?.id]);

  // Helper: save locally + push to cloud — always use passed values to avoid stale closure
  const markUpdated = () => save(`${uk}_updated_at`, new Date().toISOString());

  const currentSettings = (overrides = {}) => ({
    fontSize,
    darkMode,
    theme,
    workStart,
    workEnd,
    notifs,
    timezone,
    categories,
    templates,
    journalActivities,
    memoryTags,
    memoryStorageMigratedAt,
    journal,
    ...overrides,
  });

  const queueCloudSave = (evs = events, tks = tasks, settings = currentSettings(), options = {}) => {
    if (!auth.user || !dataReady) {
      setSyncStatus({ status: "offline", message: "Saved on this device only", lastError: "Not signed in or cloud not ready" });
      return Promise.resolve(!options.strict);
    }
    const run = async () => {
      setSyncStatus({ status: "saving", message: "Saving…", lastError: "" });
      const ok = await saveToCloud(auth.user.id, evs, tks, settings);
      if (ok) {
        setSyncStatus({ status: "saved", message: "Saved to cloud", lastError: "" });
        return true;
      }
      setSyncStatus({ status: "failed", message: "Sync failed — tap to retry", lastError: "Cloud save failed" });
      if (options.strict) throw new Error("Cloud save failed. Your Memory Book change was not finalized.");
      return false;
    };
    const queued = cloudQueueRef.current.then(run, run);
    cloudQueueRef.current = queued.catch(() => {});
    return queued;
  };
  const retryCloudSave = () => queueCloudSave(events, tasks, currentSettings());

  const syncEvents = (evs, tks) => {
    save(`${uk}_ev`, evs);
    save(`${uk}_updated_at`, new Date().toISOString());

    if (auth.user && dataReady) {
      queueCloudSave(evs, tks ?? tasks, currentSettings());
    }
  };

  const syncTasks = (tks, evs) => {
    save(`${uk}_tk`, tks);
    save(`${uk}_updated_at`, new Date().toISOString());

    if (auth.user && dataReady) {
      queueCloudSave(evs ?? events, tks, currentSettings());
    }
  };

  const setEvents   = v => { const n = reviveEvents(typeof v === "function" ? v(events) : v); setEvRaw(n); syncEvents(n, tasks); };
  const setTasks    = v => { const n = normalizeTasks(typeof v === "function" ? v(tasks)  : v); setTkRaw(n); syncTasks(n, events); };
  useEffect(() => {
    if (!dataReady) return;
    const next = ensureRecurringTasksForPeriod(tasks, taskScope, taskPeriodDate);
    if (next !== tasks) setTasks(next);
  }, [dataReady, taskScope, taskPeriodDate, tasks]);
  const persistSettings = overrides => {
    const next = currentSettings(overrides);

    save(`${uk}_fs`, next.fontSize);
    save(`${uk}_dm`, next.darkMode);
    save(`${uk}_th`, next.theme);
    save(`${uk}_ws`, next.workStart);
    save(`${uk}_we`, next.workEnd);
    save(`${uk}_nf`, next.notifs);
    save(`${uk}_tz`, next.timezone);
    save(`${uk}_categories`, next.categories);
    save(`${uk}_templates`, next.templates);
    save(`${uk}_journal_activities`, next.journalActivities);
    save(`${uk}_memory_tags`, next.memoryTags || MEMORY_TAGS);
    save(`${uk}_memory_storage_migrated_at`, next.memoryStorageMigratedAt || null);
    saveJournalLocal(uk, auth.user?.id, next.journal ?? journal);
    save(`${uk}_updated_at`, new Date().toISOString());

    if (auth.user) {
      queueCloudSave(events, tasks, next);
    }
  };

  const setFontSize = v => {
    setFSRaw(v);
    persistSettings({ fontSize: v });
  };

  const setDarkMode = v => {
    const n = typeof v === "function" ? v(darkMode) : v;
    setDMRaw(n);
    persistSettings({ darkMode: n });
  };

  const setWorkStart = v => {
    const n = Number(v);
    setWSRaw(n);
    setWorkHoursCtx(n, workEnd);
    persistSettings({ workStart: n });
  };

  const setWorkEnd = v => {
    const n = Number(v);
    setWERaw(n);
    setWorkHoursCtx(workStart, n);
    persistSettings({ workEnd: n });
  };

  // Keep work-hours context in sync whenever they change (via effect, not during render)
  useEffect(() => {
    setWorkHoursCtx(workStart, workEnd);
  }, [workStart, workEnd]);
  // Keep display timezone context in sync whenever timezone changes
  useEffect(() => {
    setDisplayTimezoneCtx(timezone);
  }, [timezone]);


  const setNotifs = v => {
    const n = typeof v === "function" ? v(notifs) : v;
    setNfRaw(n);
    persistSettings({ notifs: n });
  };

  const setTimezone = v => {
    setTzRaw(v);
    persistSettings({ timezone: v });
  };

  const setCategories = v => {
    const n = normalizeCategories(typeof v === "function" ? v(categories) : v);
    setCatRaw(n);
    save(`${uk}_categories`, n);
    persistSettings({ categories: n });
  };
  const setTemplates = v => {
    const n = typeof v === "function" ? v(templates) : v;
    setTplRaw(n);
    save(`${uk}_templates`, n);
    persistSettings({ templates: n });
  };
  const setJournalActivities = v => {
    const n = typeof v === "function" ? v(journalActivities) : v;
    setJournalActivitiesRaw(n);
    save(`${uk}_journal_activities`, n);
    persistSettings({ journalActivities: n });
  };
  const setMemoryTags = v => {
    const n = [...new Set((typeof v === "function" ? v(memoryTags) : v).map(memoryTagLabel).filter(Boolean))];
    setMemoryTagsRaw(n);
    save(`${uk}_memory_tags`, n);
    persistSettings({ memoryTags: n });
  };
  function addJournalActivity(label, group = "Custom", emoji = "✨") {
    const activity = { id: createCategoryId(label) + "-" + uid(), emoji, label, group };
    setJournalActivities(a => [...a, activity]);
    return activity;
  }
  function updateJournalActivity(id, patch = {}) {
    setJournalActivities(a => a.map(x => x.id === id ? { ...x, ...patch, label: patch.label?.trim?.() || x.label } : x));
  }
  function deleteJournalActivity(id) {
    // Archive instead of hard-deleting so older Memory Book pages keep their historical activity labels.
    setJournalActivities(a => a.map(x => x.id === id ? { ...x, archived: true } : x));
  }
  function addMemoryTag(label) {
    const clean = memoryTagLabel(label);
    if (!clean) return null;
    setMemoryTags(t => [...new Set([...t, clean])]);
    return clean;
  }
  function updateMemoryTag(oldTag, newTag) {
    const oldClean = memoryTagLabel(oldTag);
    const newClean = memoryTagLabel(newTag);
    if (!oldClean || !newClean) return;
    setMemoryTags(t => [...new Set(t.map(x => x === oldClean ? newClean : x))]);
    setJournal(j => {
      const next = { ...(j || {}) };
      Object.keys(next).forEach(k => {
        const e = normalizeMemoryEntry(next[k]);
        next[k] = { ...e, tags: [...new Set((e.tags || []).map(x => x === oldClean ? newClean : x))] };
      });
      return next;
    });
  }
  function deleteMemoryTag(tag) {
    const clean = memoryTagLabel(tag);
    if (!clean) return;
    setMemoryTags(t => t.filter(x => x !== clean));
    setJournal(j => {
      const next = { ...(j || {}) };
      Object.keys(next).forEach(k => {
        const e = normalizeMemoryEntry(next[k]);
        next[k] = { ...e, tags: (e.tags || []).filter(x => x !== clean) };
      });
      return next;
    });
  }

  const markMemoryStorageMigrated = iso => {
    const value = iso || new Date().toISOString();
    setMemoryStorageMigratedAtRaw(value);
    save(`${uk}_memory_storage_migrated_at`, value);
    persistSettings({ memoryStorageMigratedAt: value });
  };

  const toggleCalVisibility = id => {
    const n = hiddenCals.includes(id) ? hiddenCals.filter(c => c !== id) : [...hiddenCals, id];
    setHiddenCals(n); save(`${uk}_hidden_cals`, n);
  };
  const setJournal   = v => {
    const n = typeof v === "function" ? v(journal) : v;
    const clean = sanitizeMemoryJournalForStorage(n);
    setJournalRaw(clean);
    saveJournalLocal(uk, auth.user?.id, clean);
    save(`${uk}_updated_at`, new Date().toISOString());
    if (auth.user && dataReady) return queueCloudSave(events, tasks, currentSettings({ journal: clean }));
    setSyncStatus({ status: "offline", message: "Saved on this device only", lastError: "" });
    return Promise.resolve(true);
  };
  const saveMemoryEntry = async (key, data) => {
    const clean = sanitizeMemoryJournalForStorage({ ...(journal || {}), [key]: data });
    if (auth.user && dataReady) {
      await queueCloudSave(events, tasks, currentSettings({ journal: clean }), { strict: true });
      setJournalRaw(clean);
      await saveJournalLocal(uk, auth.user?.id, clean);
      save(`${uk}_updated_at`, new Date().toISOString());
      return true;
    }
    setJournalRaw(clean);
    await saveJournalLocal(uk, auth.user?.id, clean);
    save(`${uk}_updated_at`, new Date().toISOString());
    setSyncStatus({ status: "offline", message: "Saved locally only", lastError: "Not signed in" });
    return true;
  };
  const setTheme = v => {
    setThRaw(v);
    persistSettings({ theme: v });
  };

  // Recurrence scope modal state
  const [recurringPrompt, setRecurringPrompt] = useState(null); // { resolve, action }

  function chooseRecurrenceScope(action) {
    return new Promise(resolve => {
      setRecurringPrompt({ resolve, action });
    });
  }

  function RecurrenceScopeModal() {
    if (!recurringPrompt) return null;
    const pick = scope => {
      setRecurringPrompt(null);
      recurringPrompt.resolve(scope);
    };
    return (
      <div className="modal-overlay" onClick={() => pick("single")} role="dialog" aria-modal="true" aria-label="Edit recurring event">
        <div className="modal" style={{ maxWidth: 340 }} onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <span style={{ fontWeight: 800 }}>🔄 {recurringPrompt.action} recurring event</span>
          </div>
          <div className="modal-body" style={{ gap: 8 }}>
            <button className="tf-save" style={{ width: "100%", marginBottom: 0 }} onClick={() => pick("single")}>This event only</button>
            <button className="tf-cancel" style={{ width: "100%", marginBottom: 0 }} onClick={() => pick("following")}>This and following events</button>
            <button className="tf-cancel" style={{ width: "100%", marginBottom: 0 }} onClick={() => pick("all")}>All events in series</button>
          </div>
        </div>
      </div>
    );
  }

  function pushUndo() { setUndo(s => [...s.slice(-(UNDO_STACK_MAX - 1)), { events, tasks }]); }
  function undo() {
    setUndo(s => {
      if (!s.length) return s;
      const l = s[s.length - 1];
      setEvRaw(l.events); setTkRaw(l.tasks); syncEvents(l.events, l.tasks); return s.slice(0, -1);
    });
  }

  function toggleTask(id) {
    pushUndo();
    setTasks(ts => {
      const task = ts.find(t => t.id === id);
      if (!task) return ts;
      const nextDone = !task.done;
      const completedAt = new Date().toISOString();
      const completedDate = taskCompletionTargetKey(task);
      let updated = ts.map(t => t.id === id ? { ...t, done: nextDone, completedAt: nextDone ? completedAt : null, completedDate: nextDone ? completedDate : null } : t);
      if (nextDone) {
        const nextRecurring = createNextRecurringTask(task, ts);
        if (nextRecurring) updated = [...updated, nextRecurring];
      }
      return updated;
    });
  }
  function addTask(task)          { pushUndo(); setTasks(ts => [...ts, withTaskPeriod(task, taskPeriodDate)]); }
  function eventConflictsFor(candidate, skipId = null) {
    const skipBase = skipId ? getBaseEventId(skipId) : getBaseEventId(candidate.id);
    return expandRecurring(events, dayStart(candidate.start), addDaysSafe(dayStart(candidate.start), 1))
      .filter(e => getBaseEventId(e.id) !== skipBase && eventOccursOnDay(e, candidate.start) && candidate.start < e.end && candidate.end > e.start)
      .slice(0, 4);
  }
  function confirmEventPlacement(candidate, skipId = null, action = "Place event") {
    const conflicts = eventConflictsFor(candidate, skipId);
    if (!conflicts.length) return true;
    const lines = conflicts.map(e => `• ${e.title}, ${fmt(e.start)}–${fmt(e.end)}`).join("\n");
    return window.confirm(`${action} overlaps with:\n${lines}\n\nPlace anyway?`);
  }
  function moveTaskToPeriod(id, scope, anchorDate) {
    pushUndo();
    setTasks(ts => ts.map(t => t.id === id ? withTaskPeriod({ ...t, scope, completedDate: t.done && scope === "day" ? dateKey(anchorDate) : t.completedDate }, anchorDate) : t));
  }
  function addEvent(ev, options = {})           { if (!options.skipConflictCheck && !confirmEventPlacement(ev, ev.id, "Add event")) return false; pushUndo(); setEvents(es => [...es, ev]); return true; }

  function copyEventForPaste(ev) {
    if (!ev) return;
    const clean = stripOccurrenceMeta(ev);
    const sourceStart = clean.start instanceof Date ? clean.start : new Date(clean.start);
    const sourceEnd = clean.end instanceof Date ? clean.end : new Date(clean.end);
    const durationMs = Math.max(15 * 60000, sourceEnd - sourceStart);
    setCopiedEvent({
      title: clean.title || "Untitled Event",
      calendar: clean.calendar || "work",
      category: clean.category || "meeting",
      fixed: Boolean(clean.fixed),
      color: clean.color || null,
      notes: clean.notes || "",
      allDay: Boolean(clean.allDay),
      durationMs,
      sourceHour: sourceStart.getHours(),
      sourceMinute: sourceStart.getMinutes(),
    });
  }

  function buildPastedEvent(targetDate, { useSourceTime = false } = {}) {
    if (!copiedEvent || !targetDate) return null;
    let start;
    if (copiedEvent.allDay) {
      start = dayStart(targetDate);
    } else {
      start = cloneDate(targetDate);
      if (useSourceTime) start.setHours(copiedEvent.sourceHour ?? 9, copiedEvent.sourceMinute ?? 0, 0, 0);
    }
    const end = new Date(start.getTime() + (copiedEvent.durationMs || 60 * 60000));
    return {
      id: "e" + uid(),
      title: copiedEvent.title,
      start,
      end,
      allDay: Boolean(copiedEvent.allDay),
      calendar: copiedEvent.calendar,
      category: copiedEvent.category,
      fixed: Boolean(copiedEvent.fixed),
      color: copiedEvent.color || null,
      notes: copiedEvent.notes || "",
      recurrence: null,
      copiedFrom: copiedEvent.title,
    };
  }

  function pasteCopiedEvent(targetDate, options = {}) {
    const ev = buildPastedEvent(targetDate, options);
    if (!ev) return false;
    if (!confirmEventPlacement(ev, ev.id, "Paste event")) return false;
    addEvent(ev, { skipConflictCheck: true });
    setToast({ text: `Copied event pasted to ${fmt(ev.start)} ✓`, ts: Date.now() });
    return true;
  }

  function handleCalendarSlotClick(date, options = {}) {
    if (copiedEvent) {
      pasteCopiedEvent(date, options);
      return;
    }
    setQuickAddDate(date);
  }

  async function reschedule(id, ns, ne) {
    const baseId = getBaseEventId(id);
    const base = events.find(e => e.id === baseId);
    if (!base) return;
    if (!confirmEventPlacement({ ...base, id: baseId, start: ns, end: ne }, baseId, "Move event")) return;
    const occurrenceDate = String(id).includes("_r_") ? id.split("_r_")[1] : dateKey(base.start);
    const needsScope = isRecurringEvent(base);
    const scope = needsScope ? await chooseRecurrenceScope("Move") : "all";
    pushUndo();
    setEvents(es => {
      const currentBase = es.find(e => e.id === baseId);
      if (!currentBase) return es;
      if (!needsScope || scope === "all") return es.map(e => e.id === baseId ? { ...e, start: ns, end: ne } : e);
      if (scope === "following") {
        const [original, following] = createFollowingSeries(currentBase, new Date(occurrenceDate), { ...currentBase, start: ns, end: ne });
        return [...es.filter(e => e.id !== baseId), original, following];
      }
      return es.map(e => e.id === baseId ? modifySingleOccurrence(e, new Date(occurrenceDate), { ...currentBase, start: ns, end: ne }) : e);
    });
  }
  async function saveEvent(ev) {
    const baseId = getBaseEventId(ev.id);
    const base = events.find(e => e.id === baseId);
    if (!base) return;
    const needsScope = isOccurrence(ev) || isRecurringEvent(base);
    const scope = needsScope ? await chooseRecurrenceScope("Edit") : "all";
    const occurrenceDate = ev._occurrenceDate || String(ev.id).split("_r_")[1] || dateKey(ev.start);
    pushUndo();
    setEvents(es => {
      const currentBase = es.find(e => e.id === baseId);
      if (!currentBase) return es;
      if (!needsScope || scope === "all") return es.map(e => e.id === baseId ? { ...stripOccurrenceMeta(ev), id: baseId } : e);
      if (scope === "following") {
        const [original, following] = createFollowingSeries(currentBase, new Date(occurrenceDate), ev);
        return [...es.filter(e => e.id !== baseId), original, following];
      }
      return es.map(e => e.id === baseId ? modifySingleOccurrence(e, new Date(occurrenceDate), ev) : e);
    });
  }
  async function deleteEvent(id) {
    const baseId = getBaseEventId(id);
    const base = events.find(e => e.id === baseId);
    if (!base) return;
    const occurrenceDate = String(id).includes("_r_") ? id.split("_r_")[1] : dateKey(base.start);
    const needsScope = isRecurringEvent(base);
    const scope = needsScope ? await chooseRecurrenceScope("Delete") : "all";
    pushUndo();
    setEvents(es => {
      const currentBase = es.find(e => e.id === baseId);
      if (!currentBase) return es;
      if (!needsScope || scope === "all") return es.filter(e => e.id !== baseId);
      if (scope === "following") {
        const rec = normalizeRecurrence(currentBase.recurrence);
        const until = addDaysSafe(dayStart(new Date(occurrenceDate)), -1);
        return es.map(e => e.id === baseId ? { ...e, recurrence: { ...rec, until: dateKey(until), endMode: "on" } } : e);
      }
      return es.map(e => e.id === baseId ? deleteSingleOccurrence(e, new Date(occurrenceDate)) : e);
    });
  }
  function saveTask(task) {
    pushUndo();
    setTasks(ts => {
      const previous = ts.find(t => t.id === task.id);
      let updated = ts.map(t => t.id === task.id ? task : t);
      const becameDone = Boolean(task.done) && !Boolean(previous?.done);
      if (becameDone) {
        const nextRecurring = createNextRecurringTask(task, updated);
        if (nextRecurring) updated = [...updated, nextRecurring];
      }
      return updated;
    });
  }
  function deleteTask(id) {
    const target = tasks.find(t => t.id === id);
    if (target?.recurrence && !window.confirm("Delete this full recurring task series?")) return;
    pushUndo();
    setTasks(ts => {
      const target = ts.find(t => t.id === id);
      if (!target) return ts;
      if (target.parentTaskId) {
        const identity = taskPeriodIdentity(target);
        return ts
          .map(t => t.id === target.parentTaskId ? { ...t, skippedTaskPeriods: [...new Set([...(t.skippedTaskPeriods || []), identity])] } : t)
          .filter(t => t.id !== id);
      }
      if (target.recurrence) return ts.filter(t => t.id !== id && t.parentTaskId !== id);
      return ts.filter(t => t.id !== id);
    });
  }


  function applyTemplate(tpl) {
    pushUndo();
    const base = new Date(viewDate);
    const newEvs = tpl.events.map((te, i) => {
      const st = new Date(base); st.setHours(te.start[0], te.start[1], 0, 0);
      const en = new Date(base); en.setHours(te.end[0],   te.end[1],   0, 0);
      return { id: "e" + uid() + i, title: te.title, start: st, end: en, allDay: Boolean(te.allDay), calendar: te.calendar || (te.category === "personal" || te.category === "health" ? "personal" : "work"), category: te.category, fixed: te.fixed, color: te.color || null, notes: te.notes || "", recurrence: null };
    });
    setEvents(es => [...es.filter(e => !eventOccursOnDay(e, base) || e.fixed), ...newEvs]);
    setShowTemplates(false);
  }
  function saveCurrentDayAsTemplate() {
    const base = new Date(viewDate);
    const dayEvents = visibleEvents.filter(e => eventOccursOnDay(e, base));
    if (!dayEvents.length) return;
    const tpl = {
      id: "tpl" + uid(),
      label: `✨ ${base.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}`,
      events: dayEvents.map(e => ({
        title: e.title,
        start: [e.start.getHours(), e.start.getMinutes()],
        end: [e.end.getHours(), e.end.getMinutes()],
        calendar: e.calendar,
        category: e.category,
        fixed: e.fixed,
        color: e.color || null,
        notes: e.notes || "",
        allDay: Boolean(e.allDay),
      })),
    };
    setTemplates(t => [...t, tpl]);
  }
  function updateTemplate(id, patch) { setTemplates(tpls => tpls.map(t => t.id === id ? { ...t, ...patch } : t)); }
  function deleteTemplate(id) { if (!window.confirm("Delete this day template?")) return; setTemplates(tpls => tpls.filter(t => t.id !== id)); }

  function handleCarryOver(ids) { const tomorrow = addDaysSafe(TODAY, 1); setTasks(ts => ts.map(t => ids.includes(t.id) ? withTaskPeriod({ ...t, scope: "day", done: false, completedAt: null, completedDate: null }, tomorrow) : t)); setShowCarryOver(false); }
  function handleDrop(ids)      { setTasks(ts => ts.filter(t => !ids.includes(t.id))); setShowCarryOver(false); }

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e) {
      if (typeof window !== "undefined" && window.innerWidth <= 768) return;
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.tagName === "SELECT") return;
      if ((e.ctrlKey || e.metaKey) && e.key === "z") { e.preventDefault(); undo(); return; }
      if (e.key === "Escape") {
        if (showSearch) { setShowSearch(false); return; }
        if (page === "journal") { setPage("calendar"); return; }
        setSelectedEvent(null); setShowStats(false); setShowShortcuts(false); setSettingsOpen(false); setShowTemplates(false); setFocusMode(false); return;
      }
      if (e.key === "/" || ((e.ctrlKey || e.metaKey) && e.key === "k")) { e.preventDefault(); setShowSearch(v => !v); return; }
      if (e.key === "?") { setShowShortcuts(v => !v); return; }
      const k = e.key.toLowerCase();
      if (k === "d" && !e.metaKey && !e.ctrlKey) { setPage("calendar"); setView("day"); }
      else if (k === "w" && !e.metaKey) { setPage("calendar"); setView("week"); }
      else if (k === "m" && !e.metaKey) { setPage("calendar"); setView("month"); }
      else if (k === "j") setPage(p => p === "journal" ? "calendar" : "journal");
      else if (k === "f") setFocusMode(v => !v);
      else if (k === "c") setChatOpen(v => !v);
      else if (k === "s") setSettingsOpen(v => !v);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  // Include events, tasks, and undo so the undo handler always operates on current state
  }, [view, page, focusMode, chatOpen, settingsOpen, showShortcuts, showSearch, undoStack, events, tasks]);

  // Show boot spinner while checking existing session
  if (auth.loading && !auth.user) return (
    <>
      <style>{loginCSS}</style>
      <div className="login-page"><div className="login-bg-blobs"><div className="blob blob-1"/><div className="blob blob-2"/><div className="blob blob-3"/></div><div className="login-card" style={{textAlign:"center",padding:"48px 32px"}}><div className="login-hero" style={{marginBottom:20}}><div className="login-mascot"><div className="mascot-ring mascot-ring-outer"/><div className="mascot-ring mascot-ring-inner"/><div className="mascot-icon">🌸</div></div><div className="login-brand"><span className="login-logo-text">Tempo</span></div></div><span className="login-spinner" style={{width:28,height:28,borderWidth:3,display:"inline-block",margin:"0 auto"}}/></div></div>
    </>
  );

  // Show login screen if not authenticated
  if (!auth.user) return (
    <>
      <style>{loginCSS}</style>
      <LoginScreen auth={auth} />
    </>
  );

  // Show spinner while pulling this exact user's data from cloud/local storage.
  // The loadedUserId guard prevents cross-account data from appearing during user switching.
  if (!dataReady || loadedUserId !== auth.user.id) return (
    <>
      <style>{loginCSS}</style>
      <div className="login-page"><div className="login-bg-blobs"><div className="blob blob-1"/><div className="blob blob-2"/><div className="blob blob-3"/></div><div className="login-card" style={{textAlign:"center",padding:"48px 32px"}}><div className="login-hero" style={{marginBottom:16}}><div className="login-mascot"><div className="mascot-ring mascot-ring-outer"/><div className="mascot-ring mascot-ring-inner"/><div className="mascot-icon">🌸</div></div><div className="login-brand"><span className="login-logo-text">Tempo</span></div></div><p style={{color:"#A07090",fontSize:13,fontWeight:600,marginBottom:20}}>Loading your schedule…</p><span className="login-spinner" style={{width:28,height:28,borderWidth:3,display:"inline-block",margin:"0 auto"}}/></div></div>
    </>
  );

  const rangeStart = view === "month" ? new Date(viewDate.getFullYear(), viewDate.getMonth(), 1) : view === "week" ? weekStart(viewDate) : viewDate;
  const rangeEnd = view === "month" ? new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0) : view === "week" ? addDaysSafe(weekStart(viewDate), 6) : viewDate;
  const expandedEvents  = expandRecurring(events, rangeStart, rangeEnd);
  const viewDayEvents   = expandedEvents.filter(e => e.start instanceof Date && eventOccursOnDay(e, viewDate) && !hiddenCals.includes(e.calendar)).map(e => eventSegmentForDay(e, viewDate));
  const visibleEvents   = expandedEvents.filter(e => !hiddenCals.includes(e.calendar));
  // Gamification must be calculated from a stable event window, not the current
  // calendar view. Otherwise XP/levels can change when switching Day/Week/Month
  // because recurring/focus events are expanded differently per view. Hidden
  // calendar filters should also not affect earned XP.
  const gameEvents      = expandRecurring(events, addDaysSafe(TODAY, -120), addDaysSafe(TODAY, 30));
  const gameStats      = calculateGameStats(tasks, journal, gameEvents);
  const openToday     = tasks.filter(t => !t.done && taskBelongsToPeriod(t, "day", TODAY)).length;
  const fontScale     = FONT_SIZES.find(f => f.id === fontSize)?.scale ?? 1;
  const activeTheme   = THEMES.find(t => t.id === theme) ?? THEMES[0];
  const cvars         = (darkMode ? activeTheme.dark : activeTheme.light) + activeTheme.accent;
  const memoAppCSS    = appCSS(cvars, fontScale);

  return (
    <>
      <style>{memoAppCSS + `
  .editable-chip{position:relative;display:inline-flex;align-items:center;gap:3px;}
  .editable-chip-main{border:0;background:transparent;color:inherit;font:inherit;font-weight:800;cursor:pointer;padding:0;display:inline-flex;align-items:center;gap:5px;}
  .chip-mini-action{width:18px;height:18px;border-radius:999px;border:1px solid var(--border);background:var(--bg2);color:var(--text3);font-size:10px;font-weight:900;line-height:1;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;opacity:.65;transition:all .15s;}
  .editable-chip:hover .chip-mini-action{opacity:1;}
  .chip-mini-action:hover{background:var(--accent);border-color:var(--accent);color:white;}
  .editable-memory-row{gap:7px;}
  .task-board-nav{display:flex;align-items:center;justify-content:center;gap:8px;margin:0 0 14px;}
  .task-period-board{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;align-items:start;}
  .task-period-card{min-height:420px;background:var(--bg2);border:1.5px solid var(--border);border-radius:22px;box-shadow:var(--shadow-sm);padding:14px;transition:all .18s;}
  .task-period-card.drag-over{border-color:var(--accent);background:var(--bg4);box-shadow:0 12px 32px rgba(255,123,172,.16);transform:translateY(-2px);}
  .task-period-card-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:4px;}
  .task-period-card-title{border:0;background:transparent;color:var(--text);font-family:var(--font);font-size:15px;font-weight:900;cursor:pointer;padding:0;}
  .task-period-count{font-family:var(--mono);font-size:10px;font-weight:800;color:var(--accent);background:var(--bg4);border:1px solid var(--border);border-radius:999px;padding:3px 8px;white-space:nowrap;}
  .task-period-card-sub{font-size:11px;color:var(--text2);font-weight:800;margin-bottom:10px;}
  .task-card-add{width:100%;border:1.5px dashed var(--border);background:var(--bg3);color:var(--accent);border-radius:14px;padding:9px 10px;font-family:var(--font);font-weight:900;cursor:pointer;margin-bottom:10px;}
  .task-card-add:hover{border-color:var(--accent);background:var(--bg4);}
  .task-card-form{margin:0 0 10px;padding:10px;border-radius:16px;}
  .task-period-list{display:flex;flex-direction:column;gap:6px;}
  .task-card-empty{border:1.5px dashed var(--border);border-radius:16px;padding:18px 12px;text-align:center;color:var(--text3);font-size:12px;font-weight:800;background:var(--bg3);}
  .sync-pill{border:1px solid var(--border);background:var(--bg3);color:var(--text2);border-radius:999px;padding:5px 9px;font-size:11px;font-weight:900;display:inline-flex;align-items:center;gap:5px;cursor:default;white-space:nowrap;}
  .sync-pill.sync-saving{color:#B07800;background:#FFF4D8;}.sync-pill.sync-saved{color:#2E8B57;background:#EAF7EF;}.sync-pill.sync-failed{color:#D44848;background:#FFF0F0;cursor:pointer;}.sync-pill.sync-offline{color:#A07090;background:var(--bg4);}
  .quick-add-wrap{position:fixed;right:76px;bottom:20px;z-index:80;display:flex;flex-direction:column;align-items:flex-end;gap:8px;}.quick-add-fab{width:52px;height:52px;border-radius:18px;border:0;background:linear-gradient(135deg,var(--accent),var(--accent2));color:white;font-size:28px;font-weight:900;box-shadow:0 14px 32px rgba(var(--accent-rgb),.28);cursor:pointer;}.quick-add-menu{background:var(--bg2);border:1.5px solid var(--border);border-radius:18px;box-shadow:0 16px 40px rgba(0,0,0,.14);padding:8px;display:flex;flex-direction:column;gap:6px;min-width:170px;}.quick-add-menu button{border:0;background:var(--bg3);color:var(--text);border-radius:12px;padding:10px 12px;text-align:left;font-family:var(--font);font-weight:900;cursor:pointer;}.quick-add-menu button:hover{background:var(--bg4);color:var(--accent);}
  .tempo-toast{position:fixed;left:50%;bottom:88px;transform:translateX(-50%);background:#4A2840;color:white;border-radius:999px;padding:9px 16px;font-size:12px;font-weight:900;z-index:120;box-shadow:0 12px 32px rgba(0,0,0,.18);animation:toastFade 2.4s ease forwards;}@keyframes toastFade{0%{opacity:0;transform:translate(-50%,8px)}15%,80%{opacity:1;transform:translate(-50%,0)}100%{opacity:0;transform:translate(-50%,8px)}}
  .hold-cue{position:absolute;right:8px;bottom:5px;font-size:9px;font-weight:900;color:var(--text3);opacity:.0;background:var(--bg2);border:1px solid var(--border);border-radius:999px;padding:2px 6px;transition:opacity .15s;}.event-block:hover .hold-cue,.event-block.hold-holding .hold-cue,.event-block.hold-dragging .hold-cue{opacity:.92}.event-block.hold-holding{box-shadow:0 0 0 2px var(--accent3),var(--shadow-sm)}.event-block.hold-dragging{opacity:.75;}
  .memory-upload-status{font-size:11px;font-weight:900;color:var(--accent);background:var(--bg4);border:1px solid var(--border);border-radius:12px;padding:8px 10px;margin-top:8px;}
  .memory-settings-modal{max-width:820px;width:min(92vw,820px);}.memory-settings-modal .entry-modal-body{max-height:72vh;overflow:auto;}
  .task-card-with-move{border-radius:14px;}.task-card-with-move .task-item{margin-bottom:4px;}.mini-move-btn{border:1px solid var(--border);background:var(--bg3);color:var(--text2);border-radius:999px;padding:4px 7px;font-size:10px;font-weight:900;margin:2px 3px 6px 0;cursor:pointer;}.mini-move-btn:hover{background:var(--bg4);color:var(--accent);}
  .xp-breakdown-list{display:flex;flex-direction:column;gap:7px}.xp-breakdown-row{display:flex;justify-content:space-between;gap:10px;font-size:12px;color:var(--text2);font-weight:800}.xp-breakdown-row strong{color:var(--accent);font-family:var(--mono)}.bloom-collapse{background:var(--bg2);border:1px solid var(--border);border-radius:18px;overflow:hidden;box-shadow:var(--shadow-sm)}.bloom-collapse-head{width:100%;display:flex;align-items:center;justify-content:space-between;border:0;background:var(--bg3);color:var(--text);font-family:var(--font);font-weight:900;padding:12px 14px;cursor:pointer}.bloom-collapse-body{padding:12px;display:flex;flex-direction:column;gap:12px}.bloom-collapse-body>.game-card{box-shadow:none;}
  @media(max-width:768px){.quick-add-wrap{right:16px;bottom:84px}.quick-add-fab{width:50px;height:50px}.sync-pill{font-size:10px;padding:4px 7px}.topbar .sync-pill{display:none}}
  @media(max-width:900px){.task-period-board{grid-template-columns:1fr;}.task-period-card{min-height:260px;}.task-board-nav{position:sticky;top:0;background:var(--bg);z-index:5;padding:8px 0;}}
`}</style>

      {focusMode && <FocusMode tasks={tasks} events={events} pomodoro={pomodoro.state} onStartPomodoro={pomodoro.start} onPause={pomodoro.pause} onResume={pomodoro.resume} onStop={pomodoro.stop} onExit={() => setFocusMode(false)} />}

      <div className="app">
        <div className={`sidebar ${sidebarOpen ? "" : "closed"}`}>
          <div className="sidebar-logo"><div className="logo-icon">🌸</div><span>Tempo</span></div>
          <div className="sidebar-date">
            <div className="date-big">{TODAY.getDate()}</div>
            {TODAY.toLocaleDateString("en-US", { weekday: "long", month: "long", year: "numeric" })}
            {auth.user && <div className="sidebar-user">👤 {auth.user.name || auth.user.email}</div>}
            <SyncStatusPill syncStatus={syncStatus} onRetry={retryCloudSave} />
          </div>
          {(() => { const todayMood = journal[dateKey(TODAY)]; const m = todayMood?.mood ? JOURNAL_MOODS.find(x=>x.id===todayMood.mood) : null; return m ? <div className="mood-bar" onClick={() => { setPage("journal"); closeSidebarOnMobile(); }} style={{cursor:"pointer"}}>{m.emoji} Feeling {m.label}</div> : null; })()}
          <LevelBar gameStats={gameStats} />
          <nav className="sidebar-nav">
            <div className="nav-section-label">Calendar</div>
            {[{id:"day",icon:"☀️",label:"Day"},{id:"week",icon:"🗓️",label:"Week"},{id:"month",icon:"🌙",label:"Month"}].map(n => (
              <div key={n.id} className={`nav-item ${page==="calendar" && view === n.id ? "active" : ""}`} onClick={() => { setPage("calendar"); setView(n.id); closeSidebarOnMobile(); }}><span className="nav-icon">{n.icon}</span>{n.label}</div>
            ))}
            <div className="nav-section-label" style={{marginTop:8}}>Me</div>
            <div className={`nav-item ${page==="journal"?"active":""}`} onClick={() => { setPage("journal"); closeSidebarOnMobile(); }}><span className="nav-icon">📔</span>Memory Book</div>
            <div className={`nav-item ${page==="tasks"?"active":""}`} onClick={() => { setPage("tasks"); closeSidebarOnMobile(); }}><span className="nav-icon">✅</span>Tasks</div>
            <div className={`nav-item ${page==="bloom"?"active":""}`} onClick={() => { setPage("bloom"); closeSidebarOnMobile(); }}><span className="nav-icon">🌸</span>Bloom Room</div>
            <div className="nav-item" onClick={() => { setFocusMode(true); closeSidebarOnMobile(); }}><span className="nav-icon">🎯</span>Focus Mode</div>
            <div className="nav-item" onClick={() => { setShowStats(true); closeSidebarOnMobile(); }}><span className="nav-icon">📊</span>Daily Stats</div>
            <div className="nav-item" onClick={() => { setShowCarryOver(true); closeSidebarOnMobile(); }}><span className="nav-icon">🌙</span>End of Day</div>
          </nav>
          <div className="sidebar-cals">
            <div className="cal-label-row">
              <span className="cal-label">Calendars</span>
            </div>
            {CALENDARS.map(c => {
              const hidden = hiddenCals.includes(c.id);
              return (
                <div key={c.id} className={`cal-item cal-toggleable ${hidden ? "cal-hidden" : ""}`}
                  onClick={() => toggleCalVisibility(c.id)} title={hidden ? "Click to show" : "Click to hide"}>
                  <span className="cal-dot" style={{ background: hidden ? "var(--border)" : c.color }} />
                  <span className="cal-name">{c.id === "work" ? (auth.user?.email ?? c.name) : c.name}</span>
                  <span className="cal-eye">{hidden ? "○" : "●"}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="main">
          {page === "journal" ? (
            <JournalPage journal={journal} setJournal={setJournal} onSaveMemoryEntry={saveMemoryEntry} events={gameEvents} tasks={tasks} activitiesCatalog={journalActivities} memoryTagsCatalog={memoryTags} onAddActivity={addJournalActivity} onUpdateActivity={updateJournalActivity} onDeleteActivity={deleteJournalActivity} onAddMemoryTag={addMemoryTag} onUpdateMemoryTag={updateMemoryTag} onDeleteMemoryTag={deleteMemoryTag} userId={auth.user?.id} onMemoryStorageMigrated={markMemoryStorageMigrated} quickEditDate={quickMemoryDate} onQuickEditHandled={() => setQuickMemoryDate(null)} />
          ) : page === "tasks" ? (
            <TasksPage tasks={tasks} categories={categories} onToggle={toggleTask} onAdd={addTask} onEdit={setSelectedTask} onStartPomodoro={pomodoro.start} scope={taskScope} setScope={setTaskScope} periodDate={taskPeriodDate} setPeriodDate={setTaskPeriodDate} onMoveTaskPeriod={moveTaskToPeriod} gameStats={gameStats} />
          ) : page === "bloom" ? (
            <BloomRoomPage gameStats={gameStats} />
          ) : (<>
          <div className="topbar">
            <button className="topbar-btn icon-only desktop-sidebar-toggle" onClick={() => setSidebarOpen(v => !v)} aria-label="Toggle sidebar">☰</button>
            <button className="topbar-btn icon-only nav-arrow" onClick={() => {
              const d = new Date(viewDate);
              if (view === "day")   d.setDate(d.getDate() - 1);
              if (view === "week")  d.setDate(d.getDate() - 7);
              if (view === "month") d.setMonth(d.getMonth() - 1);
              setViewDate(d);
            }} aria-label="Previous">‹</button>
            <button className="topbar-btn today-btn" onClick={() => setViewDate(new Date(TODAY))}>Today</button>
            <button className="topbar-btn icon-only nav-arrow" onClick={() => {
              const d = new Date(viewDate);
              if (view === "day")   d.setDate(d.getDate() + 1);
              if (view === "week")  d.setDate(d.getDate() + 7);
              if (view === "month") d.setMonth(d.getMonth() + 1);
              setViewDate(d);
            }} aria-label="Next">›</button>
            <div className="topbar-date">
              {view === "day" ? fmtDate(viewDate) : view === "week" ? (() => {
                const mon = new Date(viewDate); mon.setDate(viewDate.getDate() - viewDate.getDay() + 1);
                const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
                return `${mon.toLocaleDateString("en-US",{month:"short",day:"numeric"})} – ${sun.toLocaleDateString("en-US",{month:"short",day:"numeric"})}`;
              })() : viewDate.toLocaleDateString("en-US",{month:"long",year:"numeric"})}
              {view === "day" && viewDate.toDateString() === TODAY.toDateString() && <span className="today-badge">{viewDayEvents.length} events</span>}
            </div>
            <div className="view-tabs">
              {["day","week","month"].map(v => <button key={v} className={`view-tab ${view === v ? "active" : ""}`} onClick={() => setView(v)}>{v.charAt(0).toUpperCase() + v.slice(1)}</button>)}
            </div>
            <SyncStatusPill syncStatus={syncStatus} onRetry={retryCloudSave} />
            <button className="topbar-btn add-event-btn" onClick={() => setQuickAddOpen(v => !v)}>+ Add</button>
            <button className="topbar-btn" onClick={() => setShowSearch(true)} aria-label="Search" title="Search (/)">🔍</button>
            <button className="topbar-btn" onClick={() => setShowTemplates(true)} aria-label="Day templates">🗂 Templates</button>
            <button className="topbar-btn icon-only keyboard-shortcuts-btn" onClick={() => setShowShortcuts(true)} aria-label="Keyboard shortcuts">⌨️</button>
            <button className="topbar-btn icon-only" onClick={() => setSettingsOpen(true)} aria-label="Settings">⚙️</button>
          </div>

          <div className="stats-bar">
            <div className="stat"><div className="stat-dot" style={{ background: "#B08AE0" }} />Focus: {Math.round(viewDayEvents.filter(e => e.category === "deep").reduce((a, e) => a + (e.end - e.start) / 60000, 0) / 60 * 10) / 10}h</div>
            <div className="stat"><div className="stat-dot" style={{ background: "#FF7BAC" }} />{openToday} tasks open</div>
            <div className="stat"><div className="stat-dot" style={{ background: "#70C8A0" }} />Free blocks: {freeBlocks(visibleEvents, viewDate).length}</div>
            <div className="stat"><div className="stat-dot" style={{ background: "#FFB870" }} />🔥 {gameStats.streaks.productive}d streak</div>
            <div className="stat"><div className="stat-dot" style={{ background: "#C9A0FF" }} />Lvl {gameStats.level} · {gameStats.today.rank} Rank</div>
          </div>

          <div className="content-area">
            <div className={`calendar-pane view-${view}`}>
              {view === "day" && <DayView events={viewDayEvents} calendars={CALENDARS} categories={categories} onReschedule={reschedule} onEventClick={setSelectedEvent} onDropTask={addEvent} viewDate={viewDate} onGridClick={d => handleCalendarSlotClick(d)} />}
              {view === "week" && <WeekView events={visibleEvents} calendars={CALENDARS} categories={categories} onEventClick={setSelectedEvent} onReschedule={reschedule} viewDate={viewDate} onGridClick={d => handleCalendarSlotClick(d)} onDayClick={d => { setViewDate(d); setView("day"); }} />}
              {view === "month" && (() => {
                const days = monthDays(viewDate);

                // Compute max events in any single day this month for heat map normalisation
                const dayCounts = days.filter(Boolean).map(d =>
                  visibleEvents.filter(e => e.start instanceof Date && eventOccursOnDay(e, d)).length
                );
                const maxCount = Math.max(...dayCounts, 1);

                return (
                  <div className="month-view">
                    {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d => <div key={d} className="month-header">{d}</div>)}
                    {days.map((day, i) => {
                      const de = day ? visibleEvents.filter(e => e.start instanceof Date && eventOccursOnDay(e, day)).map(e => eventSegmentForDay(e, day)) : [];
                      const isT = day && sameDay(day, TODAY);
                      const heat = day ? de.length / maxCount : 0; // 0–1
                      // Heat map: tint the active theme accent colour at low opacity
                      const heatBg = heat > 0.05 ? `rgba(var(--accent-rgb,255,123,172),${(heat * 0.22).toFixed(2)})` : undefined;
                      return (
                        <div key={i} data-month-date={day ? dateKey(day) : ""} className={`month-day ${!day ? "other" : ""} ${isT ? "today-cell" : ""}`}
                          style={heatBg ? { background: heatBg } : {}}
                          onClick={() => { if (!day) return; if (copiedEvent) { pasteCopiedEvent(day, { useSourceTime: true }); return; } setViewDate(day); setView("day"); }}>
                          {day && <div className="month-day-num">{isT ? <span className="today-circle">{day.getDate()}</span> : day.getDate()}</div>}
                          {heat > 0.6 && day && <div className="month-heat-bar" style={{ width: `${Math.round(heat * 100)}%` }} />}
                          <div className="month-day-events">
                            {de.slice(0, 4).map(e => {
                              const cal = CALENDARS.find(c => c.id === e.calendar);
                              const color = e.color || cal?.color || "#FF7BAC";
                              return (
                                <MonthEventRow key={e.id} event={e} color={color} onOpen={setSelectedEvent} onReschedule={reschedule} />
                              );
                            })}
                            {de.length > 4 && <div className="month-more">+{de.length - 4} more</div>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
            <TaskPanel tasks={tasks} categories={categories} onToggle={toggleTask} onAdd={addTask} onEdit={setSelectedTask} onStartPomodoro={pomodoro.start} scope={taskScope} setScope={setTaskScope} periodDate={taskPeriodDate} setPeriodDate={setTaskPeriodDate} mobileOpen={mobileTasksOpen} onMobileClose={() => setMobileTasksOpen(false)} />
          </div>
        </>)}
        </div>
      </div>

      {pomodoro.state.active && <PomodoroWidget state={pomodoro.state} tasks={tasks} onPause={pomodoro.pause} onResume={pomodoro.resume} onStop={pomodoro.stop} />}
      {undoStack.length > 0 && <button className="undo-btn" onClick={undo}>↩ Undo <kbd>⌘Z</kbd></button>}
      {copiedEvent && (
        <div className="event-copy-bar">
          <span className="event-copy-icon">📋</span>
          <span className="event-copy-text">Copied: <strong>{copiedEvent.title}</strong>. Click any empty slot to paste multiple times, then Clear when done.</span>
          <button className="event-copy-clear" onClick={() => setCopiedEvent(null)}>Clear</button>
        </div>
      )}

      {showSearch && <SearchModal events={expandedEvents} tasks={tasks} categories={categories} onClose={() => setShowSearch(false)} onEventClick={setSelectedEvent} onTaskEdit={setSelectedTask} onNavigate={d => { setViewDate(new Date(d)); setView("day"); }} />}
      {quickAddDate  && <AddEventModal onClose={() => setQuickAddDate(null)} onSave={ev => { addEvent(ev); setQuickAddDate(null); }} defaultDate={quickAddDate} calendars={CALENDARS} categories={categories} />}
      {showAddEvent  && <AddEventModal onClose={() => setShowAddEvent(false)} onSave={addEvent} defaultDate={viewDate} calendars={CALENDARS} categories={categories} />}
      {selectedEvent && <EventModal event={selectedEvent} calendars={CALENDARS} categories={categories} onClose={() => setSelectedEvent(null)} onSave={saveEvent} onDelete={deleteEvent} onCopy={copyEventForPaste} />}
      {selectedTask && <TaskModal task={selectedTask} categories={categories} onClose={() => setSelectedTask(null)} onSave={task => { selectedTask._isNew ? addTask({ ...task, _isNew: undefined }) : saveTask(task); setSelectedTask(null); }} onDelete={selectedTask._isNew ? null : deleteTask} />}
      {showStats  && <StatsCard events={visibleEvents} tasks={tasks} streak={streak} gameStats={gameStats} onClose={() => setShowStats(false)} />}
      {/* End of day carry-over: only surface after work hours to avoid mid-day false positives */}
      {showCarryOver && <CarryOverPrompt tasks={tasks.filter(t => !t.done && taskBelongsToPeriod(t, "day", TODAY))} gameStats={gameStats} onCarry={handleCarryOver} onDrop={handleDrop} onDismiss={() => setShowCarryOver(false)} />}
      {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}
      {settingsOpen  && <SettingsPanel onClose={() => setSettingsOpen(false)} fontSize={fontSize} setFontSize={setFontSize} darkMode={darkMode} setDarkMode={setDarkMode} theme={theme} setTheme={setTheme} workStart={workStart} setWorkStart={setWorkStart} workEnd={workEnd} setWorkEnd={setWorkEnd} notifs={notifs} setNotifs={setNotifs} timezone={timezone} setTimezone={setTimezone} categories={categories} setCategories={setCategories} user={auth.user} onSignOut={auth.signOut} gameStats={gameStats} />}
      {showTemplates && (
        <div className="modal-overlay" onClick={() => setShowTemplates(false)} role="dialog" aria-modal="true" aria-label="Day templates">
          <div className="templates-panel" onClick={e => e.stopPropagation()}>
            <div className="templates-header"><span className="templates-title">🗂 Day Templates</span><button className="modal-close" onClick={() => setShowTemplates(false)}>✕</button></div>
            <div className="templates-desc">Apply a schedule pattern to the selected day, or save this day as a reusable template.</div>
            <button className="tf-save" style={{width:"100%",marginBottom:10}} onClick={saveCurrentDayAsTemplate}>Save current day as template</button>
            {templates.map(tpl => (
              <div key={tpl.id} className="template-btn" style={{cursor:"default"}}>
                <input className="tf-input" value={tpl.label} onChange={e => updateTemplate(tpl.id, { label: e.target.value })} />
                <div className="tpl-events">{tpl.events.map(e => e.title).join(" · ")}</div>
                <div className="tf-actions" style={{marginTop:8}}>
                  <button className="tf-cancel" onClick={() => deleteTemplate(tpl.id)}>Delete</button>
                  <button className="tf-save" onClick={() => applyTemplate(tpl)}>Apply</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {chatOpen && <ChatPanel events={events} tasks={tasks} onClose={() => setChatOpen(false)} onUpdateEvents={setEvents} onUpdateTasks={setTasks} onAddEvent={addEvent} />}
      <RecurrenceScopeModal />

      {/* Mobile bottom nav — visible only on small screens */}
      <div className="mobile-nav">
        <button className="mobile-nav-btn" onClick={() => setSidebarOpen(v => !v)}>☰<span>Menu</span></button>
        <button className="mobile-nav-btn" onClick={() => { setPage("calendar"); setView("day"); }}>☀️<span>Day</span></button>
        <button className="mobile-nav-btn" onClick={() => { setPage("tasks"); setTaskScope("day"); }}>✅<span>Tasks</span></button>
        <button className="mobile-nav-btn" onClick={() => setPage("journal")}>📔<span>Memory</span></button>
        <button className="mobile-nav-btn" onClick={() => setPage("bloom")}>🌸<span>Bloom</span></button>
      </div>

      {toast && <div className="tempo-toast" onAnimationEnd={() => setToast(null)}>{toast.text}</div>}
      <QuickAddMenu
        open={quickAddOpen}
        onToggle={() => setQuickAddOpen(v => !v)}
        onClose={() => setQuickAddOpen(false)}
        onAddEvent={() => setShowAddEvent(true)}
        onAddTask={() => setSelectedTask({ id: "t" + uid(), title: "", duration: 30, category: "admin", scope: "day", done: false, priority: "medium", notes: "", deadline: null, scheduled: null, _isNew: true })}
        onAddMemory={() => { setPage("journal"); setQuickMemoryDate(new Date(TODAY)); }}
        onAddFocus={() => { const slot = freeBlocks(events, viewDate)[0]; const startMin = slot?.start ?? 9*60; const ev = eventFromWindow("Focus block", viewDate, startMin, Math.min(startMin + 60, DAY_END*60), "deep"); addEvent(ev); }}
      />
      <button className="chat-fab" onClick={() => setChatOpen(v => !v)}>{chatOpen ? "✕" : "🌸"}</button>
    </>
  );
}

// ─── CSS (split into login + app for clarity) ─────────────────────────────────
const loginCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Inconsolata:wght@400;500&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:'Nunito',sans-serif;background:#FFF0F6;overflow:hidden;}

  /* ── Page & background ─────────────────────────────────────────────────────── */
  .login-page{
    min-height:100vh;display:flex;align-items:center;justify-content:center;
    position:relative;overflow:hidden;
    background:linear-gradient(145deg,#FFF0F8 0%,#F5EEFF 45%,#EEF5FF 100%);
  }

  /* ── Blobs ──────────────────────────────────────────────────────────────────── */
  .login-bg-blobs{position:absolute;inset:0;pointer-events:none;overflow:hidden;}
  .blob{position:absolute;border-radius:50%;filter:blur(72px);}
  .blob-1{width:560px;height:560px;background:radial-gradient(circle,#FFB8D4,#FFD6E8);opacity:.40;top:-160px;left:-160px;animation:blobFloat 9s ease-in-out infinite;}
  .blob-2{width:460px;height:460px;background:radial-gradient(circle,#D4AAFF,#C0CCFF);opacity:.35;bottom:-120px;right:-100px;animation:blobFloat 11s ease-in-out infinite reverse;}
  .blob-3{width:340px;height:340px;background:radial-gradient(circle,#A8E8FF,#B8F0E8);opacity:.30;top:38%;left:48%;transform:translate(-50%,-50%);animation:blobFloat 13s ease-in-out infinite 1.5s;}
  .blob-4{width:200px;height:200px;background:radial-gradient(circle,#FFE0A8,#FFD0C0);opacity:.28;top:10%;right:12%;animation:blobFloat 7s ease-in-out infinite 3s;}
  @keyframes blobFloat{0%,100%{transform:translateY(0) scale(1);}50%{transform:translateY(-28px) scale(1.05);}}

  /* ── Floating deco emojis ───────────────────────────────────────────────────── */
  .login-deco{position:absolute;inset:0;pointer-events:none;overflow:hidden;}
  .deco{position:absolute;font-size:22px;animation:decoFloat 6s ease-in-out infinite;user-select:none;opacity:.70;}
  .deco-1{top:8%;  left:6%;  animation-duration:7s;  animation-delay:0s;}
  .deco-2{top:14%; right:8%; animation-duration:5.5s;animation-delay:.8s;font-size:18px;}
  .deco-3{top:72%; left:4%;  animation-duration:8s;  animation-delay:1.2s;}
  .deco-4{top:20%; left:42%; animation-duration:6.5s;animation-delay:2s;  font-size:16px;}
  .deco-5{bottom:18%;right:5%;animation-duration:7.5s;animation-delay:.4s;}
  .deco-6{bottom:10%;left:10%;animation-duration:6s; animation-delay:1.8s;font-size:20px;}
  .deco-7{top:50%; right:3%; animation-duration:9s;  animation-delay:.2s; font-size:16px;}
  .deco-8{bottom:28%;left:46%;animation-duration:5s; animation-delay:2.5s;font-size:18px;}
  @keyframes decoFloat{0%,100%{transform:translateY(0) rotate(0deg);}33%{transform:translateY(-12px) rotate(6deg);}66%{transform:translateY(-6px) rotate(-4deg);}}

  /* ── Card ───────────────────────────────────────────────────────────────────── */
  .login-card{
    position:relative;z-index:1;width:100%;max-width:430px;margin:20px;
    background:rgba(255,255,255,0.82);backdrop-filter:blur(28px) saturate(1.4);
    border:1.5px solid rgba(255,182,214,0.45);
    border-radius:32px;
    padding:32px 30px 28px;
    box-shadow:
      0 32px 80px rgba(255,123,172,0.18),
      0 8px 24px rgba(180,120,200,0.10),
      0 2px 0 rgba(255,255,255,0.90) inset;
    animation:cardPop .5s cubic-bezier(.34,1.56,.64,1);
  }
  @keyframes cardPop{from{opacity:0;transform:translateY(24px) scale(.96);}to{opacity:1;transform:none;}}

  /* ── Hero / mascot ──────────────────────────────────────────────────────────── */
  .login-hero{display:flex;flex-direction:column;align-items:center;gap:10px;margin-bottom:20px;}
  .login-mascot{position:relative;width:76px;height:76px;display:flex;align-items:center;justify-content:center;margin-bottom:2px;}
  .mascot-ring{position:absolute;border-radius:50%;}
  .mascot-ring-outer{inset:0;background:linear-gradient(135deg,#FFD6E8,#E8C8FF,#C8E8FF);opacity:.55;animation:ringPulse 3s ease-in-out infinite;}
  .mascot-ring-inner{inset:8px;background:linear-gradient(135deg,#FFC0D8,#D8B0FF);opacity:.70;animation:ringPulse 3s ease-in-out infinite .6s;}
  @keyframes ringPulse{0%,100%{transform:scale(1);opacity:.55;}50%{transform:scale(1.08);opacity:.80;}}
  .mascot-icon{position:relative;z-index:1;font-size:34px;filter:drop-shadow(0 4px 10px rgba(255,123,172,.45));animation:mascotBounce 2.4s ease-in-out infinite;}
  @keyframes mascotBounce{0%,100%{transform:translateY(0);}50%{transform:translateY(-5px);}}
  .login-brand{display:flex;align-items:center;gap:8px;}
  .login-logo-text{font-size:28px;font-weight:900;background:linear-gradient(135deg,#FF7BAC 0%,#C060C8 60%,#8080E0 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;letter-spacing:-.5px;}
  .login-logo-badge{font-size:10px;font-weight:800;background:linear-gradient(135deg,#FFD6E8,#E8C8FF);color:#9060A0;border-radius:20px;padding:3px 8px;border:1px solid rgba(255,182,214,.5);}
  .login-tagline{font-size:13.5px;color:#9070A0;font-weight:700;text-align:center;line-height:1.55;}

  /* ── Feature pills ──────────────────────────────────────────────────────────── */
  .login-pills{display:flex;gap:6px;justify-content:center;flex-wrap:wrap;margin-bottom:20px;}
  .login-pill{
    font-size:11px;font-weight:800;color:#A070B0;
    background:linear-gradient(135deg,rgba(255,214,232,.6),rgba(232,200,255,.6));
    border:1px solid rgba(255,182,214,.5);
    border-radius:20px;padding:5px 11px;
    backdrop-filter:blur(8px);
    white-space:nowrap;
  }

  /* ── Tabs ───────────────────────────────────────────────────────────────────── */
  .login-tabs{display:flex;gap:4px;background:rgba(255,232,240,.8);padding:4px;border-radius:16px;margin-bottom:20px;border:1px solid rgba(255,182,214,.35);}
  .login-tab{flex:1;padding:9px;border-radius:12px;border:none;background:transparent;font-family:'Nunito',sans-serif;font-size:13px;font-weight:800;color:#B090B0;cursor:pointer;transition:all .2s;}
  .login-tab.active{background:white;color:#FF7BAC;box-shadow:0 3px 12px rgba(255,123,172,.22),0 1px 0 rgba(255,255,255,.9) inset;}

  /* ── Form fields ────────────────────────────────────────────────────────────── */
  .login-form{display:flex;flex-direction:column;gap:13px;margin-bottom:14px;}
  .login-field{display:flex;flex-direction:column;gap:5px;}
  .login-field label{font-size:11.5px;font-weight:800;color:#A080B0;display:flex;align-items:center;gap:5px;}
  .field-icon{font-size:13px;}
  .login-field input{
    background:rgba(255,245,250,.9);border:1.5px solid #F0C8DC;
    border-radius:14px;padding:12px 15px;
    font-family:'Nunito',sans-serif;font-size:14px;color:#4A2840;font-weight:600;
    outline:none;transition:border-color .18s,background .18s,box-shadow .18s;
  }
  .login-field input:focus{border-color:#FF7BAC;background:white;box-shadow:0 0 0 4px rgba(255,123,172,.12);}
  .login-field input::placeholder{color:#C8A0BC;}
  .pass-wrap{position:relative;}
  .pass-wrap input{width:100%;padding-right:46px;}
  .pass-toggle{position:absolute;right:13px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:16px;line-height:1;opacity:.7;transition:opacity .15s;}
  .pass-toggle:hover{opacity:1;}

  /* ── Error ──────────────────────────────────────────────────────────────────── */
  .login-error{
    background:linear-gradient(135deg,rgba(255,230,235,.9),rgba(255,220,240,.9));
    border:1.5px solid rgba(255,160,180,.6);
    border-radius:12px;padding:10px 14px;
    font-size:12.5px;color:#C04060;font-weight:700;
    display:flex;align-items:center;gap:6px;
  }

  /* ── Submit button ──────────────────────────────────────────────────────────── */
  .login-submit{
    padding:14px;margin-top:2px;
    background:linear-gradient(135deg,#FF7BAC 0%,#FF9EC4 50%,#C880E0 100%);
    background-size:200% 200%;animation:gradShift 4s ease infinite;
    border:none;border-radius:16px;color:white;
    font-family:'Nunito',sans-serif;font-size:14.5px;font-weight:900;
    cursor:pointer;
    box-shadow:0 8px 24px rgba(255,123,172,.45),0 2px 0 rgba(255,255,255,.25) inset;
    transition:transform .18s,box-shadow .18s;
    display:flex;align-items:center;justify-content:center;gap:8px;
  }
  @keyframes gradShift{0%{background-position:0% 50%;}50%{background-position:100% 50%;}100%{background-position:0% 50%;}}
  .login-submit:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 12px 30px rgba(255,123,172,.55);}
  .login-submit:active:not(:disabled){transform:translateY(0);}
  .login-submit:disabled{opacity:.6;cursor:not-allowed;animation:none;}
  .submit-arrow{font-size:16px;transition:transform .2s;}
  .login-submit:hover .submit-arrow{transform:translateX(3px);}
  .login-spinner{width:18px;height:18px;border:2.5px solid rgba(255,255,255,.4);border-top-color:white;border-radius:50%;animation:spin .7s linear infinite;flex-shrink:0;}
  @keyframes spin{to{transform:rotate(360deg);}}

  /* ── Footer ─────────────────────────────────────────────────────────────────── */
  .login-footer{font-size:11px;color:#C0A0C8;text-align:center;font-weight:700;margin-top:4px;letter-spacing:.2px;}

  /* ── Verify banner ──────────────────────────────────────────────────────────── */
  .login-demo{
    width:100%;padding:10px;background:transparent;
    border:1.5px dashed #F0C8DC;border-radius:12px;
    color:#A07090;font-family:'Nunito',sans-serif;font-size:12px;font-weight:700;
    cursor:pointer;transition:all .15s;margin-bottom:14px;
  }
  .login-demo:hover{border-color:#FF7BAC;color:#FF7BAC;background:rgba(255,245,250,.8);}
  .verify-banner{text-align:center;padding:8px 0;}
  .verify-icon{font-size:40px;margin-bottom:12px;animation:mascotBounce 2s ease-in-out infinite;}
  .verify-title{font-size:18px;font-weight:900;color:#4A2840;margin-bottom:8px;}
  .verify-body{font-size:13px;color:#A07090;font-weight:600;line-height:1.65;margin-bottom:20px;}

  /* ── Setup banner (kept for compat) ─────────────────────────────────────────── */
  .setup-banner{background:#FFF8E8;border:1.5px solid #FFD870;border-radius:14px;padding:12px 14px;margin-bottom:18px;font-size:12px;}
  .setup-banner-title{font-weight:800;color:#A06000;margin-bottom:4px;}
  .setup-banner-body{color:#806020;line-height:1.5;}
  .setup-banner-body code{background:#FFE890;padding:1px 5px;border-radius:4px;font-family:'Inconsolata',monospace;}
`;

function appCSS(cvars, fontScale) { return `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&family=Inconsolata:wght@300;400;500&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  :root{${cvars}--mint:#B8F0E0;--radius:16px;--font:'Nunito',sans-serif;--mono:'Inconsolata',monospace;--shadow:0 2px 16px rgba(0,0,0,0.08);--shadow-md:0 4px 24px rgba(0,0,0,0.12);--fs:${fontScale};--accent-rgb:255,123,172;}
  body{background:var(--bg);color:var(--text);font-family:var(--font);font-size:calc(var(--fs)*14px);overflow:hidden;height:100vh;}
  .app{display:flex;height:100vh;overflow:hidden;}
  .sidebar{width:230px;background:var(--bg2);border-right:1px solid var(--border);display:flex;flex-direction:column;flex-shrink:0;transition:width .25s ease;overflow:hidden;}
  .sidebar.closed{width:0;}
  .sidebar-logo{padding:20px;border-bottom:1px solid var(--border);font-size:20px;font-weight:900;color:var(--text);display:flex;align-items:center;gap:8px;}
  .sidebar-logo .logo-icon{width:32px;height:32px;border-radius:10px;background:linear-gradient(135deg,var(--accent),var(--accent2));display:flex;align-items:center;justify-content:center;font-size:16px;}
  .sidebar-logo span{color:var(--accent);}
  .sidebar-date{padding:14px 20px;font-family:var(--mono);font-size:11px;color:var(--text2);border-bottom:1px solid var(--border);background:var(--bg3);}
  .sidebar-date .date-big{font-size:30px;font-weight:900;font-family:var(--font);background:linear-gradient(135deg,var(--accent),#C060A0);-webkit-background-clip:text;-webkit-text-fill-color:transparent;line-height:1;margin-bottom:4px;}
  .sidebar-user{margin-top:6px;font-size:10px;color:var(--text3);font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
  /* mood-bar used by journal mood display in sidebar */
  .mood-bar{padding:10px 20px;border-bottom:1px solid var(--border);font-size:12px;font-weight:700;display:flex;align-items:center;gap:8px;cursor:pointer;}
  .mood-bar:hover{background:var(--bg3);}.sidebar-nav{padding:12px 10px;flex:1;}
  .nav-item{display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:12px;cursor:pointer;font-size:13px;font-weight:700;color:var(--text2);transition:all .2s;margin-bottom:3px;}
  .nav-item:hover{background:var(--bg3);color:var(--text);}
  .nav-item.active{background:var(--bg4);color:var(--accent);box-shadow:inset 0 0 0 1px var(--accent3);}
  .nav-icon{font-size:16px;width:22px;text-align:center;}
  .sidebar-cals{padding:12px 20px 16px;border-top:1px solid var(--border);}
  .cal-label{font-size:10px;font-family:var(--mono);text-transform:uppercase;letter-spacing:1.5px;color:var(--text3);margin-bottom:10px;}
  .cal-item{display:flex;align-items:center;font-size:12px;color:var(--text2);margin-bottom:8px;font-weight:600;}
  .main{flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0;}
  .topbar{height:58px;border-bottom:1px solid var(--border);display:flex;align-items:center;padding:0 14px;gap:7px;background:var(--bg2);flex-shrink:0;box-shadow:var(--shadow);}
  .topbar-btn{height:34px;padding:0 10px;border-radius:10px;border:1.5px solid var(--border);background:var(--bg3);color:var(--text2);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;font-family:var(--font);gap:5px;transition:all .15s;white-space:nowrap;flex-shrink:0;}
  .topbar-btn:hover{background:var(--bg4);color:var(--accent);border-color:var(--accent3);}
  .topbar-btn.icon-only{width:34px;padding:0;}
  .topbar-date{font-size:14px;font-weight:800;flex:1;color:var(--text);min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .add-event-btn{background:linear-gradient(135deg,var(--accent),var(--accent2))!important;color:white!important;border-color:var(--accent)!important;font-weight:800!important;}
  .nav-arrow{font-size:18px;font-weight:900;color:var(--text2);}
  .today-btn{font-size:12px;font-weight:800;padding:0 12px;}
  .today-badge{color:var(--accent);font-weight:700;font-size:11px;margin-left:6px;background:var(--bg4);padding:2px 7px;border-radius:20px;}
  .view-tabs{display:flex;gap:3px;background:var(--bg3);padding:3px;border-radius:12px;border:1px solid var(--border);}
  .view-tab{padding:5px 12px;border-radius:9px;border:none;background:transparent;color:var(--text2);font-family:var(--font);font-size:12px;font-weight:700;cursor:pointer;transition:all .15s;}
  .view-tab.active{background:var(--bg2);color:var(--accent);box-shadow:var(--shadow);}
  .stats-bar{display:flex;gap:8px;padding:8px 16px;border-bottom:1px solid var(--border);background:var(--bg2);flex-shrink:0;overflow-x:auto;}
  .stat{font-size:11px;font-family:var(--mono);color:var(--text2);display:flex;align-items:center;gap:6px;background:var(--bg3);padding:5px 10px;border-radius:20px;border:1px solid var(--border);white-space:nowrap;}
  .stat-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0;}
  .content-area{flex:1;display:flex;overflow:hidden;}
  .calendar-pane{flex:1;overflow-y:auto;padding:16px 20px;min-width:0;display:flex;flex-direction:column;}
  .calendar-pane.view-month,.calendar-pane.view-week{padding:0;}
  .calendar-pane::-webkit-scrollbar{width:4px;}
  .calendar-pane::-webkit-scrollbar-thumb{background:var(--border);border-radius:4px;}
  .day-view{position:relative;}
  .drag-hint{font-size:calc(var(--fs)*10px);color:var(--text3);font-family:var(--mono);padding:0 0 10px 54px;}
  .conflict-banner{background:#FFF0F0;border:1px solid #FFB0B0;border-radius:10px;padding:8px 14px;margin-bottom:10px;font-size:12px;color:#C04040;font-weight:700;}
  .day-grid{position:relative;}
  .day-empty-state{position:absolute;top:50%;left:calc(54px + (100% - 54px)/2);transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;pointer-events:none;z-index:3;width:min(320px,calc(100% - 78px));padding:8px;}
  .day-empty-state img{width:170px;height:170px;object-fit:contain;filter:drop-shadow(0 10px 24px rgba(255,123,172,.18));margin-bottom:8px;}
  .empty-state-title{font-size:13px;line-height:1.35;font-weight:900;color:var(--text2);}
  .hour-row{position:absolute;left:0;right:0;display:flex;align-items:flex-start;pointer-events:none;}
  .hour-label{width:46px;font-family:var(--mono);font-size:10px;color:var(--text3);flex-shrink:0;margin-top:-6px;text-align:right;padding-right:8px;line-height:1;}
  .hour-line{flex:1;height:1px;background:var(--border);}
  .drop-indicator{position:absolute;left:0;right:0;display:flex;align-items:center;z-index:15;pointer-events:none;}
  .drop-indicator-dot{width:10px;height:10px;border-radius:50%;background:var(--accent);flex-shrink:0;margin-left:38px;}
  .drop-indicator-line{flex:1;height:2px;background:var(--accent);opacity:.8;}
  .drop-indicator-label{font-size:10px;font-family:var(--mono);color:var(--accent);font-weight:700;margin-left:6px;background:var(--bg2);padding:1px 5px;border-radius:4px;border:1px solid var(--accent3);flex-shrink:0;}
  .task-drag-handle{cursor:grab;font-size:13px;color:var(--text3);padding:0 4px 0 0;flex-shrink:0;opacity:.5;transition:opacity .15s;}
  .task-item:hover .task-drag-handle{opacity:1;color:var(--accent);}
  .task-item[draggable="true"]{cursor:grab;}
  .task-item[draggable="true"]:active{opacity:.7;}
  .now-line{position:absolute;left:0;right:0;display:flex;align-items:center;z-index:10;pointer-events:none;}
  .now-dot{width:10px;height:10px;border-radius:50%;background:var(--accent);flex-shrink:0;box-shadow:0 0 0 3px rgba(255,123,172,.25);}
  .now-track{flex:1;height:1.5px;background:var(--accent);opacity:.6;}
  .events-layer{position:absolute;left:54px;right:0;top:0;}
  .event-block{position:absolute;left:0;right:4px;padding:6px 10px;border-radius:12px;transition:transform .15s,box-shadow .15s;box-shadow:var(--shadow);user-select:none;display:flex;flex-direction:column;justify-content:center;overflow:hidden;}
  .event-block.draggable:hover{transform:translateX(2px) scale(1.01);box-shadow:var(--shadow-md);z-index:20;}
  .event-block.draggable:active{cursor:grabbing!important;opacity:.85;}
  .drag-handle{position:absolute;right:8px;top:50%;transform:translateY(-50%);font-size:14px;color:var(--text3);opacity:0;transition:opacity .15s;pointer-events:none;}
  .event-block.draggable:hover .drag-handle{opacity:1;}
  .fixed-badge{position:absolute;right:6px;top:5px;font-size:9px;opacity:.6;}
  .event-title{font-size:calc(var(--fs)*12.5px);font-weight:800;line-height:1.25;word-break:break-word;overflow-wrap:break-word;}
  .event-inline{display:flex;align-items:center;gap:6px;overflow:hidden;}
  .event-inline .event-title{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .event-inline .event-time{flex-shrink:0;margin-top:0;white-space:nowrap;}
  .event-time{font-size:calc(var(--fs)*10.5px);font-family:var(--mono);color:var(--text2);margin-top:2px;font-weight:600;}
  .event-cat{font-size:calc(var(--fs)*10px);margin-top:3px;font-weight:700;}
  /* ── Week Timetable ── */
  .week-timetable{display:flex;flex-direction:column;min-width:0;}
  .wt-header{display:flex;border-bottom:1.5px solid var(--border);background:var(--bg2);position:sticky;top:0;z-index:10;}
  .wt-time-gutter{width:48px;flex-shrink:0;}
  .wt-day-header{flex:1;text-align:center;padding:8px 4px;cursor:pointer;border-left:1px solid var(--border);transition:background .15s;}
  .wt-day-header:hover{background:var(--bg3);}
  .wt-day-header.wt-today{background:var(--bg4);}
  .wt-day-name{display:block;font-size:10px;font-family:var(--mono);text-transform:uppercase;letter-spacing:1px;color:var(--text3);font-weight:700;}
  .wt-day-num{display:block;font-size:20px;font-weight:900;color:var(--text2);margin-top:2px;}
  .wt-day-header.wt-today .wt-day-num{color:var(--accent);}
  .wt-today-num{color:var(--accent)!important;}
  .wt-grid{position:relative;display:block;}
  .wt-hour-row{position:absolute;left:0;right:0;display:flex;height:${HOUR_H}px;align-items:flex-start;}
  .wt-hour-label{font-family:var(--mono);font-size:10px;color:var(--text3);padding-right:6px;line-height:1;}
  .wt-time-gutter{width:48px;flex-shrink:0;display:flex;align-items:flex-start;justify-content:flex-end;padding-top:6px;}
  .wt-hour-cell{flex:1;border-left:1px solid var(--border);border-top:1px solid var(--border);height:${HOUR_H}px;}
  .wt-now-line{position:absolute;left:0;right:0;display:flex;align-items:center;z-index:8;pointer-events:none;}
  .wt-now-track-cell{flex:1;height:1.5px;background:var(--accent);opacity:.7;}
  .wt-event{position:absolute;border-radius:6px;padding:3px 6px;cursor:pointer;overflow:hidden;transition:opacity .15s;z-index:5;}
  .wt-event:hover{opacity:.85;z-index:9;}
  .wt-event-title{font-size:11px;font-weight:800;line-height:1.25;word-break:break-word;}
  .wt-event-time{font-size:10px;font-family:var(--mono);color:var(--text2);margin-top:1px;}
  .wt-event-cat{font-size:10px;margin-top:1px;}
  /* ── Month View ── */
  .month-view{display:grid;grid-template-columns:repeat(7,1fr);border-top:1px solid var(--border);border-left:1px solid var(--border);flex:1;}
  .month-header{background:var(--bg3);padding:8px;text-align:center;font-size:10px;font-family:var(--mono);text-transform:uppercase;letter-spacing:1.5px;color:var(--text3);font-weight:700;border-right:1px solid var(--border);border-bottom:1px solid var(--border);}
  .month-day{background:var(--bg2);min-height:110px;padding:6px;cursor:pointer;border-right:1px solid var(--border);border-bottom:1px solid var(--border);transition:background .1s;display:flex;flex-direction:column;gap:2px;}
  .month-day:hover{background:var(--bg3);}
  .month-day.other{opacity:.35;pointer-events:none;}
  .month-day.today-cell{background:var(--bg3);}
  .month-day-num{font-size:12px;font-family:var(--mono);color:var(--text2);font-weight:700;margin-bottom:3px;min-height:20px;}
  .today-circle{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;background:var(--accent);color:white;font-size:11px;font-weight:800;}
  .month-day-events{display:flex;flex-direction:column;gap:2px;flex:1;min-height:0;}
  .month-event-row{display:flex;align-items:center;gap:4px;padding:2px 5px;border-radius:4px;font-size:10px;font-weight:700;overflow:hidden;white-space:nowrap;cursor:pointer;transition:opacity .15s;}
  .month-event-row:hover{opacity:.75;}
  .month-event-time{font-family:var(--mono);font-size:9px;color:var(--text3);flex-shrink:0;}
  .month-event-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
  .month-more{font-size:10px;color:var(--accent);font-family:var(--mono);font-weight:700;padding:1px 4px;}
  .task-panel{width:295px;border-left:1px solid var(--border);background:var(--bg2);display:flex;flex-direction:row;flex-shrink:0;overflow:hidden;transition:width .25s ease;position:relative;}
  .task-panel.collapsed{width:28px;}
  .task-panel-toggle{width:28px;flex-shrink:0;background:var(--bg3);border:none;border-right:1px solid var(--border);color:var(--text2);cursor:pointer;font-size:14px;font-weight:900;display:flex;align-items:center;justify-content:center;transition:background .15s, color .15s;padding:0;}
  .task-panel-toggle:hover{background:var(--bg4);color:var(--accent);}
  .task-panel-inner{flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0;}
  .panel-header{padding:14px 14px 12px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:6px;flex-shrink:0;background:var(--bg3);}
  .panel-title{font-size:15px;font-weight:900;flex:1;color:var(--text);}
  .urgent-badge{background:#FFE0E0;color:#C04040;border-radius:20px;padding:2px 8px;font-size:10px;font-weight:800;}
  .task-period-nav{display:flex;align-items:center;justify-content:center;gap:8px;padding:8px 12px;border-bottom:1px solid var(--border);}
  .period-btn,.period-label{border:1px solid var(--border);background:var(--bg2);color:var(--text2);border-radius:10px;font-family:var(--font);font-weight:800;cursor:pointer;box-shadow:var(--shadow);}
  .period-btn{width:28px;height:28px;font-size:16px;line-height:1;}
  .period-label{min-width:150px;padding:7px 12px;font-size:11px;}
  .task-period-hint{font-size:10px;font-weight:800;color:var(--text3);padding:2px 2px 4px;text-align:center;}
  .scope-tabs{display:flex;gap:2px;background:var(--bg4);padding:2px;border-radius:8px;}
  .scope-tab{padding:3px 9px;border-radius:6px;border:none;background:transparent;font-family:var(--font);font-size:10px;font-weight:800;color:var(--text3);cursor:pointer;text-transform:capitalize;transition:all .15s;}
  .scope-tab.active{background:var(--bg2);color:var(--accent);box-shadow:var(--shadow);}
  .add-btn{width:28px;height:28px;border-radius:8px;border:1.5px solid var(--accent3);background:var(--bg4);color:var(--accent);font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-weight:700;transition:all .15s;}
  .add-btn:hover{background:var(--accent);color:white;border-color:var(--accent);}
  .task-form{padding:12px 14px;border-bottom:1px solid var(--border);display:flex;flex-direction:column;gap:8px;background:var(--bg3);}
  .tf-input{width:100%;background:var(--bg2);border:1.5px solid var(--border);border-radius:10px;padding:8px 12px;font-family:var(--font);font-size:13px;color:var(--text);outline:none;font-weight:600;}
  .tf-input:focus{border-color:var(--accent3);}
  .tf-notes{resize:none;font-size:12px;}
  .tf-row{display:flex;gap:6px;}
  .tf-select{flex:1;background:var(--bg2);border:1.5px solid var(--border);border-radius:10px;padding:6px 10px;font-family:var(--font);font-size:12px;color:var(--text);outline:none;cursor:pointer;font-weight:600;}
  .tf-duration{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--text2);background:var(--bg2);border:1.5px solid var(--border);border-radius:10px;padding:6px 10px;font-weight:600;}
  .tf-num{width:44px;background:transparent;border:none;font-family:var(--mono);font-size:13px;color:var(--text);outline:none;text-align:center;}
  .tf-date{font-size:12px;flex:1;}
  .tf-actions{display:flex;gap:6px;justify-content:flex-end;}
  .tf-cancel{padding:7px 14px;background:transparent;border:1.5px solid var(--border);border-radius:10px;color:var(--text2);font-family:var(--font);font-size:12px;cursor:pointer;font-weight:700;}
  .tf-save{padding:7px 16px;background:linear-gradient(135deg,var(--accent),var(--accent2));border:none;border-radius:10px;color:white;font-family:var(--font);font-size:12px;font-weight:800;cursor:pointer;box-shadow:0 4px 12px rgba(255,123,172,.35);}
  .task-list{flex:1;overflow-y:auto;padding:8px;}
  .task-list::-webkit-scrollbar{width:3px;}
  .task-list::-webkit-scrollbar-thumb{background:var(--border);border-radius:4px;}
  .task-empty-state{min-height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:28px 16px;color:var(--text3);}
  .task-empty-state img{width:150px;height:150px;object-fit:contain;filter:drop-shadow(0 10px 24px rgba(255,123,172,.18));margin-bottom:8px;}
  .task-item{display:flex;align-items:flex-start;gap:10px;padding:10px;border-radius:12px;transition:all .15s;margin-bottom:3px;border:1.5px solid transparent;}
  .task-item:hover{background:var(--bg3);border-color:var(--border);}
  .task-item.done{opacity:.45;}
  .task-check{width:19px;height:19px;border-radius:6px;border:2px solid var(--border);flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:11px;color:white;margin-top:1px;background:transparent;transition:all .15s;cursor:pointer;}
  .task-item:not(.done):hover .task-check{border-color:var(--accent3);}
  .task-item.done .task-check{background:linear-gradient(135deg,var(--accent),var(--accent2));border-color:var(--accent);}
  .task-body{flex:1;min-width:0;cursor:pointer;}
  .task-title{font-size:calc(var(--fs)*13px);font-weight:700;line-height:1.3;margin-bottom:4px;color:var(--text);}
  .task-item.done .task-title{text-decoration:line-through;}
  .task-meta{display:flex;gap:8px;font-size:calc(var(--fs)*10px);font-family:var(--mono);color:var(--text3);flex-wrap:wrap;}
  .deadline{color:var(--accent)!important;font-weight:700;}
  .task-notes{margin-top:6px;font-size:11px;color:var(--text2);background:var(--bg3);border-radius:8px;padding:6px 10px;line-height:1.4;}
  .pomo-btn{width:26px;height:26px;border-radius:8px;border:1.5px solid var(--border);background:var(--bg3);color:var(--accent);font-size:13px;cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:all .15s;}
  .pomo-btn:hover{background:var(--accent);color:white;}
  .task-footer{padding:10px 16px;border-top:1px solid var(--border);display:flex;justify-content:space-between;background:var(--bg3);font-size:11px;font-family:var(--mono);color:var(--text3);font-weight:600;}
  .chat-panel{position:fixed;bottom:86px;right:24px;width:360px;height:520px;background:var(--bg2);border:1.5px solid var(--border);border-radius:20px;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(255,123,172,.2);z-index:100;animation:slideUp .22s cubic-bezier(.34,1.56,.64,1);overflow:hidden;}
  @keyframes slideUp{from{opacity:0;transform:translateY(16px) scale(.97);}to{opacity:1;transform:translateY(0) scale(1);}}
  .chat-header{padding:14px 16px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-shrink:0;background:linear-gradient(135deg,#FFF0F6,#FFF8FC);}
  .chat-title-row{display:flex;align-items:center;gap:10px;}
  .chat-avatar{width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,var(--accent),var(--accent2));display:flex;align-items:center;justify-content:center;font-size:16px;}
  .chat-name{font-size:13px;font-weight:800;color:var(--text);}
  .chat-status{font-size:10px;font-family:var(--mono);color:#50C090;font-weight:600;}
  .chat-close{background:var(--bg4);border:1px solid var(--border);color:var(--text2);font-size:12px;cursor:pointer;width:26px;height:26px;border-radius:8px;display:flex;align-items:center;justify-content:center;}
  .chat-messages{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;background:var(--bg);}
  .chat-messages::-webkit-scrollbar{width:3px;}
  .chat-msg{display:flex;gap:8px;align-items:flex-start;}
  .chat-msg.user{flex-direction:row-reverse;}
  .msg-avatar{width:28px;height:28px;border-radius:50%;flex-shrink:0;background:linear-gradient(135deg,var(--accent),var(--accent2));display:flex;align-items:center;justify-content:center;font-size:13px;}
  .msg-bubble{max-width:80%;padding:10px 14px;border-radius:16px;font-size:calc(var(--fs)*13px);line-height:1.55;font-weight:600;background:var(--bg2);color:var(--text);border:1px solid var(--border);border-bottom-left-radius:4px;}
  .chat-msg.user .msg-bubble{background:linear-gradient(135deg,var(--accent),var(--accent2));color:white;border:none;border-bottom-right-radius:4px;border-bottom-left-radius:16px;}
  .suggestions{padding:0 12px 10px;display:flex;flex-wrap:wrap;gap:6px;background:var(--bg);}
  .suggestion-pill{padding:6px 12px;border-radius:20px;border:1.5px solid var(--border);background:var(--bg2);color:var(--text2);font-family:var(--font);font-size:11px;cursor:pointer;transition:all .15s;font-weight:700;}
  .suggestion-pill:hover{border-color:var(--accent3);color:var(--accent);background:var(--bg4);}
  .chat-input-row{padding:10px 12px;border-top:1px solid var(--border);display:flex;gap:8px;align-items:flex-end;flex-shrink:0;background:var(--bg2);}
  .chat-input{flex:1;background:var(--bg3);border:1.5px solid var(--border);border-radius:14px;padding:9px 14px;font-family:var(--font);font-size:13px;color:var(--text);outline:none;resize:none;min-height:40px;max-height:100px;line-height:1.4;font-weight:600;}
  .chat-input:focus{border-color:var(--accent3);}
  .chat-input::placeholder{color:var(--text3);}
  .chat-send{width:40px;height:40px;border-radius:12px;border:none;background:linear-gradient(135deg,var(--accent),var(--accent2));color:white;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .15s;box-shadow:0 4px 12px rgba(255,123,172,.4);}
  .chat-send:hover:not(:disabled){transform:scale(1.05);}
  .chat-send:disabled{opacity:.4;cursor:not-allowed;transform:none;}
  .chat-fab{position:fixed;bottom:24px;right:24px;width:54px;height:54px;border-radius:50%;background:linear-gradient(135deg,var(--accent),var(--accent2));border:none;color:white;font-size:22px;cursor:pointer;box-shadow:0 8px 28px rgba(255,123,172,.45);z-index:100;display:flex;align-items:center;justify-content:center;transition:transform .2s cubic-bezier(.34,1.56,.64,1),box-shadow .15s;}
  .chat-fab:hover{transform:scale(1.1);}
  .modal-overlay{position:fixed;inset:0;background:rgba(74,40,64,.25);backdrop-filter:blur(6px);z-index:200;display:flex;align-items:center;justify-content:center;animation:fadeIn .18s ease;}
  @keyframes fadeIn{from{opacity:0;}to{opacity:1;}}
  .modal{width:420px;max-width:calc(100vw - 32px);background:var(--bg2);border-radius:20px;border:1.5px solid var(--border);box-shadow:0 24px 64px rgba(255,123,172,.18);overflow:hidden;animation:popIn .22s cubic-bezier(.34,1.56,.64,1);}
  @keyframes popIn{from{opacity:0;transform:scale(.93) translateY(8px);}to{opacity:1;transform:scale(1) translateY(0);}}
  .modal-header{padding:18px 20px 14px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;background:linear-gradient(135deg,#FFF0F6,#FFF8FC);}
  .modal-title-input{flex:1;font-size:16px;font-weight:800;color:var(--text);background:transparent;border:none;outline:none;font-family:var(--font);}
  .modal-close{background:var(--bg4);border:1px solid var(--border);color:var(--text2);font-size:12px;cursor:pointer;width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
  .modal-close:hover{background:var(--accent);color:white;}
  .modal-body{padding:16px 20px;display:flex;flex-direction:column;gap:12px;max-height:60vh;overflow-y:auto;}
  .modal-row{display:flex;align-items:center;gap:10px;font-size:13px;font-weight:600;color:var(--text2);}
  .modal-col{flex-direction:column;align-items:flex-start;}
  .modal-row label{width:80px;flex-shrink:0;font-size:12px;}
  .modal-select{flex:1;background:var(--bg3);border:1.5px solid var(--border);border-radius:10px;padding:6px 10px;font-family:var(--font);font-size:12px;color:var(--text);outline:none;cursor:pointer;font-weight:600;}
  .modal-textarea{width:100%;background:var(--bg3);border:1.5px solid var(--border);border-radius:10px;padding:8px 12px;font-family:var(--font);font-size:12px;color:var(--text);outline:none;resize:none;font-weight:600;line-height:1.5;}
  .modal-time{font-family:var(--mono);font-size:13px;padding:5px 8px;min-width:0;flex:1;color:var(--text);}
  .color-picker{display:flex;gap:6px;flex-wrap:wrap;align-items:center;}
  .color-dot{width:22px;height:22px;border-radius:50%;border:2px solid transparent;cursor:pointer;transition:all .15s;}
  .color-dot:hover{transform:scale(1.15);}
  .color-dot.selected{border-color:var(--text);transform:scale(1.1);}
  .color-reset{background:var(--bg3);font-size:12px;display:flex;align-items:center;justify-content:center;color:var(--text2);}
  .modal-footer{padding:14px 20px;border-top:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;background:var(--bg3);}
  .modal-delete{background:transparent;border:1.5px solid #FFB0B0;color:#C04040;border-radius:10px;padding:7px 14px;font-family:var(--font);font-size:12px;cursor:pointer;font-weight:700;}
  .modal-delete:hover{background:#FFF0F0;}
  .pomo-widget{position:fixed;bottom:86px;right:390px;background:var(--bg2);border:1.5px solid var(--border);border-radius:20px;padding:16px;box-shadow:var(--shadow-md);width:190px;animation:slideUp .22s cubic-bezier(.34,1.56,.64,1);}
  .pomo-header{display:flex;align-items:center;margin-bottom:8px;}
  .pomo-mode{font-size:13px;font-weight:800;flex:1;color:var(--accent);}
  .pomo-cycles{font-size:11px;font-family:var(--mono);color:var(--text3);margin-right:8px;}
  .pomo-stop{background:var(--bg4);border:1px solid var(--border);color:var(--text2);width:22px;height:22px;border-radius:6px;cursor:pointer;font-size:10px;display:flex;align-items:center;justify-content:center;}
  .pomo-task{font-size:11px;color:var(--text2);font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:10px;}
  .pomo-ring-wrap{position:relative;width:80px;height:80px;margin:0 auto 10px;}
  .pomo-ring{width:80px;height:80px;}
  .pomo-time{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:800;font-family:var(--mono);color:var(--text);}
  .pomo-controls{display:flex;justify-content:center;}
  .pomo-btn-ctrl{background:linear-gradient(135deg,var(--accent),var(--accent2));border:none;color:white;border-radius:20px;padding:6px 18px;font-family:var(--font);font-size:12px;font-weight:800;cursor:pointer;}
  .stats-card{background:var(--bg2);border-radius:20px;border:1.5px solid var(--border);width:380px;max-width:calc(100vw - 32px);padding:20px;box-shadow:0 24px 64px rgba(255,123,172,.18);animation:popIn .22s cubic-bezier(.34,1.56,.64,1);}
  .stats-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;}
  .stats-title{font-size:16px;font-weight:900;color:var(--text);}
  .stats-streak{font-size:20px;font-weight:800;color:var(--accent);margin-bottom:16px;}
  .stats-row{display:flex;gap:12px;margin-bottom:20px;}
  .stat-big{flex:1;background:var(--bg3);border-radius:12px;padding:12px;text-align:center;border:1px solid var(--border);}
  .stat-num{font-size:22px;font-weight:900;color:var(--accent);}
  .stat-lbl{font-size:10px;color:var(--text3);font-family:var(--mono);font-weight:600;margin-top:2px;}
  .stats-bars{display:flex;flex-direction:column;gap:8px;}
  .stats-bar-row{display:flex;align-items:center;gap:8px;}
  .stats-bar-label{width:80px;font-size:11px;color:var(--text2);font-weight:600;flex-shrink:0;}
  .stats-bar-track{flex:1;height:8px;background:var(--bg3);border-radius:4px;overflow:hidden;}
  .stats-bar-fill{height:100%;border-radius:4px;transition:width .5s ease;}
  .stats-bar-val{width:32px;font-size:10px;font-family:var(--mono);color:var(--text3);text-align:right;flex-shrink:0;}
  .carryover-card{background:var(--bg2);border-radius:20px;border:1.5px solid var(--border);padding:20px;width:360px;max-width:calc(100vw - 32px);box-shadow:0 24px 64px rgba(255,123,172,.18);animation:popIn .22s cubic-bezier(.34,1.56,.64,1);}
  .carryover-title{font-size:14px;font-weight:800;color:var(--text);margin-bottom:14px;}
  .carryover-list{display:flex;flex-direction:column;gap:8px;margin-bottom:16px;}
  .carryover-item{display:flex;align-items:center;gap:10px;font-size:13px;color:var(--text);font-weight:600;cursor:pointer;}
  .carryover-item input{accent-color:var(--accent);}
  .co-dur{margin-left:auto;font-size:10px;font-family:var(--mono);color:var(--text3);}
  .carryover-actions{display:flex;gap:8px;justify-content:flex-end;}
  .focus-overlay{position:fixed;inset:0;z-index:300;display:flex;flex-direction:column;align-items:center;justify-content:center;animation:fadeIn .3s ease;background:var(--bg);}
  .focus-exit{position:absolute;top:20px;right:20px;background:var(--bg3);border:1.5px solid var(--border);border-radius:12px;padding:8px 16px;font-family:var(--font);font-size:12px;font-weight:700;color:var(--text2);cursor:pointer;}
  .focus-content{display:flex;flex-direction:column;align-items:center;gap:20px;max-width:400px;width:100%;padding:20px;}
  .focus-logo{font-size:32px;font-weight:900;color:var(--accent);}
  .focus-date{font-size:14px;color:var(--text2);font-family:var(--mono);}
  .focus-idle{text-align:center;}
  .focus-idle-msg{font-size:22px;font-weight:800;color:var(--text);margin-bottom:8px;}
  .focus-next{font-size:13px;color:var(--text2);font-family:var(--mono);}
  .focus-tasks{width:100%;background:var(--bg2);border:1.5px solid var(--border);border-radius:16px;padding:16px;}
  .focus-tasks-title{font-size:12px;font-weight:800;color:var(--text3);text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;}
  .focus-task-row{display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border);font-size:13px;}
  .focus-task-row:last-child{border-bottom:none;}
  .focus-task-name{flex:1;font-weight:700;color:var(--text);}
  .focus-task-dur{font-size:11px;font-family:var(--mono);color:var(--text3);}
  .focus-start-btn{width:28px;height:28px;border-radius:8px;background:var(--accent);border:none;color:white;cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center;}
  .shortcuts-modal{background:var(--bg2);border-radius:20px;border:1.5px solid var(--border);width:340px;max-width:calc(100vw - 32px);overflow:hidden;box-shadow:0 24px 64px rgba(255,123,172,.18);animation:popIn .22s cubic-bezier(.34,1.56,.64,1);}
  .shortcuts-grid{padding:16px 20px;display:grid;grid-template-columns:1fr 1fr;gap:8px;}
  .shortcut-row{display:flex;align-items:center;gap:8px;font-size:12px;color:var(--text2);font-weight:600;}
  .kbd{background:var(--bg4);border:1.5px solid var(--border);border-radius:6px;padding:2px 7px;font-family:var(--mono);font-size:11px;color:var(--text);font-weight:700;}
  .settings-overlay{position:fixed;inset:0;background:rgba(74,40,64,.18);backdrop-filter:blur(4px);z-index:200;display:flex;align-items:center;justify-content:center;animation:fadeIn .18s ease;}
  .settings-panel{width:420px;max-width:calc(100vw - 32px);background:var(--bg2);border-radius:24px;border:1.5px solid var(--border);box-shadow:0 24px 64px rgba(255,123,172,.18);overflow:hidden;animation:popIn .22s cubic-bezier(.34,1.56,.64,1);}
  .settings-header{padding:20px 22px 16px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;background:linear-gradient(135deg,#FFF0F6,#FFF8FC);}
  .settings-title-row{display:flex;align-items:center;gap:10px;}
  .settings-title{font-size:16px;font-weight:900;color:var(--text);}
  .settings-close{width:28px;height:28px;border-radius:8px;border:1.5px solid var(--border);background:var(--bg4);color:var(--text2);cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center;}
  .settings-close:hover{background:var(--accent);color:white;}
  .settings-body{padding:16px;display:flex;flex-direction:column;gap:4px;max-height:70vh;overflow-y:auto;}
  .settings-section{padding:16px;border-radius:16px;background:var(--bg3);border:1.5px solid var(--border);margin-bottom:8px;}
  .settings-section-label{font-size:13px;font-weight:800;color:var(--text);margin-bottom:4px;}
  .settings-section-desc{font-size:11px;color:var(--text2);margin-bottom:14px;font-weight:600;line-height:1.4;}
  .toggle-row{display:flex;align-items:center;gap:10px;font-size:12px;font-weight:700;color:var(--text2);}
  .toggle{width:44px;height:24px;border-radius:12px;background:var(--border);border:none;cursor:pointer;position:relative;transition:background .2s;flex-shrink:0;}
  .toggle.on{background:var(--accent);}
  .toggle-thumb{position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:50%;background:white;transition:transform .2s;box-shadow:0 2px 4px rgba(0,0,0,.2);}
  .toggle.on .toggle-thumb{transform:translateX(20px);}
  .work-hours-row{display:flex;gap:20px;}
  .work-hours-row label{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--text2);font-weight:600;}
  .wh-input{width:40px!important;}
  .signout-btn{padding:8px 16px;background:transparent;border:1.5px solid #FFB0B0;border-radius:10px;color:#C04040;font-family:var(--font);font-size:12px;font-weight:700;cursor:pointer;transition:all .15s;}
  .signout-btn:hover{background:#FFF0F0;}
  .font-size-preview{background:var(--bg2);border:1.5px solid var(--border);border-radius:12px;padding:14px 16px;margin-bottom:14px;display:flex;flex-direction:column;gap:5px;min-height:60px;justify-content:center;}
  .font-size-options{display:flex;gap:6px;margin-bottom:14px;}
  .font-size-btn{flex:1;padding:10px 6px;border-radius:12px;border:2px solid var(--border);background:var(--bg2);cursor:pointer;transition:all .15s;display:flex;flex-direction:column;align-items:center;gap:3px;font-family:var(--font);}
  .font-size-btn:hover{border-color:var(--accent3);background:var(--bg4);}
  .font-size-btn.active{border-color:var(--accent);background:var(--bg4);}
  .fsb-label{font-size:15px;font-weight:900;color:var(--text);}
  .font-size-btn.active .fsb-label{color:var(--accent);}
  .fsb-desc{font-size:9px;color:var(--text3);font-weight:700;white-space:nowrap;}
  .font-size-slider-row{display:flex;align-items:center;gap:10px;}
  .fsr-a{font-size:11px;color:var(--text3);font-weight:700;font-family:var(--mono);}
  .fsr-A{font-size:18px;color:var(--text2);font-weight:700;font-family:var(--mono);}
  .font-slider{flex:1;-webkit-appearance:none;appearance:none;height:4px;border-radius:4px;outline:none;cursor:pointer;background:linear-gradient(to right,var(--accent) 0%,var(--accent3) 100%);}
  .font-slider::-webkit-slider-thumb{-webkit-appearance:none;width:20px;height:20px;border-radius:50%;background:white;border:2.5px solid var(--accent);cursor:pointer;}
  /* ── Month heat map ─────────────────────────────────────────────────────────── */
  .month-heat-bar{position:absolute;bottom:0;left:0;height:3px;background:var(--accent);opacity:0.5;border-radius:0 0 0 0;pointer-events:none;}
  .month-day{position:relative;}

  /* ── Search modal ───────────────────────────────────────────────────────────── */
  .search-overlay{align-items:flex-start!important;padding-top:80px;}
  .search-modal{width:580px;max-width:calc(100vw - 32px);background:var(--bg2);border-radius:20px;border:1.5px solid var(--border);box-shadow:0 24px 64px rgba(0,0,0,.18);overflow:hidden;animation:popIn .18s cubic-bezier(.34,1.56,.64,1);}
  .search-input-row{display:flex;align-items:center;gap:10px;padding:16px 20px;border-bottom:1px solid var(--border);}
  .search-icon{font-size:18px;flex-shrink:0;}
  .search-input{flex:1;background:transparent;border:none;outline:none;font-family:var(--font);font-size:16px;font-weight:700;color:var(--text);}
  .search-input::placeholder{color:var(--text3);}
  .search-clear{background:var(--bg4);border:1px solid var(--border);border-radius:6px;width:24px;height:24px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--text2);font-size:11px;}
  .search-results{max-height:480px;overflow-y:auto;}
  .search-results::-webkit-scrollbar{width:3px;}
  .search-results::-webkit-scrollbar-thumb{background:var(--border);}
  .search-section{padding:8px 0;}
  .search-section-title{padding:6px 20px;font-size:10px;font-family:var(--mono);text-transform:uppercase;letter-spacing:1.5px;color:var(--text3);font-weight:700;background:var(--bg3);}
  .search-result-row{display:flex;align-items:flex-start;gap:12px;padding:12px 20px;cursor:pointer;transition:background .15s;border-bottom:1px solid var(--border);}
  .search-result-row:hover{background:var(--bg3);}
  .search-result-row:last-child{border-bottom:none;}
  .search-result-row.search-done{opacity:.5;}
  .search-result-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;margin-top:5px;}
  .search-result-body{flex:1;min-width:0;}
  .search-result-title{font-size:14px;font-weight:700;color:var(--text);margin-bottom:3px;}
  .search-result-meta{font-size:11px;font-family:var(--mono);color:var(--text3);display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
  .search-result-notes{font-size:11px;color:var(--text2);margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .search-highlight{background:var(--accent3);color:var(--text);border-radius:2px;padding:0 1px;}
  .search-recurring-badge,.search-done-badge{background:var(--bg4);border-radius:20px;padding:1px 7px;font-size:10px;color:var(--text3);}
  .search-empty{padding:24px 20px;text-align:center;color:var(--text3);font-size:13px;}
  .search-hint{padding:20px;text-align:center;color:var(--text3);font-size:12px;font-family:var(--mono);}

  
  .event-copy-bar{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:70;display:flex;align-items:center;gap:10px;max-width:min(560px,calc(100vw - 32px));padding:10px 12px;background:rgba(255,255,255,.94);border:1.5px solid var(--border);border-radius:18px;box-shadow:0 14px 40px rgba(255,123,172,.22);backdrop-filter:blur(16px);color:var(--text);font-size:13px;font-weight:700;}
  .section-title-with-action{display:flex;align-items:center;justify-content:space-between;gap:10px;}
  .mini-manage-btn{border:1.5px solid var(--border);background:var(--bg2);color:var(--accent);border-radius:999px;padding:4px 10px;font-family:var(--font);font-size:10px;font-weight:900;cursor:pointer;}
  .memory-manager-panel{margin-top:12px;border:1.5px solid var(--border);background:rgba(255,255,255,.62);border-radius:16px;padding:10px;display:flex;flex-direction:column;gap:8px;}
  .manager-title{font-size:11px;font-family:var(--mono);text-transform:uppercase;letter-spacing:1px;color:var(--text3);font-weight:900;}
  .manager-group-card{border:1px solid var(--border);background:var(--bg2);border-radius:14px;padding:8px;display:flex;flex-direction:column;gap:6px;}
  .manager-group-head{font-size:12px;font-weight:900;color:var(--text);}
  .manager-row{display:flex;align-items:center;gap:8px;padding:6px;border-radius:10px;background:var(--bg3);}
  .manager-row button{border:1px solid var(--border);background:var(--bg2);border-radius:999px;padding:4px 8px;font-family:var(--font);font-size:10px;font-weight:800;color:var(--text2);cursor:pointer;}
  .manager-chip{font-size:12px;font-weight:800;color:var(--text);flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
  .manager-count{font-size:10px;color:var(--text3);font-family:var(--mono);}
  .card-nav-inline{display:flex;align-items:center;justify-content:space-between;gap:8px;}
  .card-nav-inline button{width:24px;height:24px;border-radius:8px;border:1px solid var(--border);background:var(--bg2);color:var(--accent);font-weight:900;cursor:pointer;}
  .task-board-quick-nav{justify-content:flex-start;gap:8px;}
  .task-mobile-drag-ghost{position:fixed;transform:translate(-50%,-50%);z-index:12000;pointer-events:none;background:var(--bg2);border:2px solid var(--accent);box-shadow:0 14px 40px rgba(255,123,172,.24);border-radius:14px;padding:10px 14px;font-family:var(--font);font-size:13px;font-weight:900;color:var(--text);max-width:220px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .task-period-card.drag-touch-over{border-color:var(--accent);background:var(--bg4);box-shadow:0 0 0 3px rgba(var(--accent-rgb),.10);}

  .event-copy-icon{width:26px;height:26px;border-radius:50%;display:grid;place-items:center;background:rgba(var(--accent-rgb),.12);}
  .event-copy-text{min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .event-copy-clear{border:none;background:var(--bg3);color:var(--text2);border-radius:12px;padding:6px 10px;font-family:'Nunito',sans-serif;font-size:12px;font-weight:900;cursor:pointer;}
  .event-copy-clear:hover{background:var(--bg4);color:var(--text);}
.undo-btn{position:fixed;bottom:88px;left:50%;transform:translateX(-50%);background:#4A2840;color:white;border:none;border-radius:20px;padding:8px 20px;font-family:var(--font);font-size:12px;font-weight:700;cursor:pointer;box-shadow:0 4px 16px rgba(74,40,64,.3);z-index:99;display:flex;align-items:center;gap:8px;animation:slideUp .2s ease;white-space:nowrap;}
  .undo-btn:hover{background:#6A3860;transform:translateX(-50%) scale(1.03);}
  .undo-btn kbd{background:rgba(255,255,255,.15);padding:1px 6px;border-radius:4px;font-family:var(--mono);font-size:10px;}
  .templates-panel{background:var(--bg2);border-radius:20px;border:1.5px solid var(--border);padding:20px;width:340px;max-width:calc(100vw - 32px);box-shadow:0 24px 64px rgba(255,123,172,.18);animation:popIn .22s cubic-bezier(.34,1.56,.64,1);}
  .templates-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;}
  .templates-title{font-size:15px;font-weight:900;color:var(--text);}
  .templates-desc{font-size:12px;color:var(--text2);margin-bottom:16px;}
  .template-btn{width:100%;padding:14px;border-radius:14px;border:1.5px solid var(--border);background:var(--bg3);text-align:left;cursor:pointer;font-family:var(--font);font-size:13px;font-weight:700;color:var(--text);margin-bottom:8px;transition:all .15s;}
  .template-btn:hover{border-color:var(--accent3);background:var(--bg4);}
  .tpl-events{font-size:10px;color:var(--text3);margin-top:4px;font-family:var(--mono);}
  .mobile-nav{display:none;position:fixed;bottom:0;left:0;right:0;height:60px;background:var(--bg2);border-top:1.5px solid var(--border);z-index:110;align-items:stretch;}
  .mobile-nav-btn{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;background:transparent;border:none;color:var(--text2);font-family:var(--font);font-size:18px;cursor:pointer;padding:8px 0;}
  .mobile-nav-btn span{font-size:9px;font-weight:700;color:var(--text3);}
  .mobile-nav-btn:hover{background:var(--bg3);color:var(--accent);}

  /* Mobile hardening: prevent layout/input zoom and keep task board app-like. */
  html,body{max-width:100%;overflow-x:hidden;}
  *{box-sizing:border-box;}

  @media(max-width:768px){
    .sidebar{display:none;}
    .task-panel{display:none;position:fixed;inset:0;top:auto;height:70vh;z-index:150;border-radius:20px 20px 0 0;box-shadow:0 -8px 40px rgba(255,123,172,.2);width:100%!important;flex-direction:column;}
    .task-panel.mobile-open{display:flex;}
    .task-panel-toggle{display:none;}
    .chat-panel{width:calc(100vw - 32px);right:16px;left:16px;bottom:86px;}
    .chat-fab{bottom:80px;}
    .stats-bar{overflow-x:auto;flex-wrap:nowrap;}
    .pomo-widget{right:16px;bottom:140px;}
    .topbar-btn:not(.icon-only){display:none;}
    .mobile-nav{display:flex;}
    .content-area{padding-bottom:64px;}
    .desktop-sidebar-toggle{display:none!important;}
    .topbar{gap:6px;padding-left:10px;padding-right:10px;}
    .topbar-title{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
    input,textarea,select{font-size:16px!important;}
    .tasks-page{width:100%;max-width:100vw;overflow-x:hidden;padding:12px 10px 78px!important;}
    .task-period-board{grid-template-columns:1fr!important;gap:10px;width:100%;max-width:100%;overflow:visible;}
    .task-period-card{width:100%;max-width:100%;min-width:0;min-height:auto!important;padding:12px;border-radius:18px;}
    .task-period-card-head,.task-period-card-sub{min-width:0;}
    .task-period-card-sub span{min-width:0;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
    .task-period-list{width:100%;min-width:0;}
    .task-card-with-move,.task-item{width:100%;max-width:100%;min-width:0;}
    .task-main,.task-title{min-width:0;overflow:hidden;text-overflow:ellipsis;}
    .tf-row{grid-template-columns:1fr!important;display:flex;flex-direction:column;gap:8px;}
    .tf-duration{width:100%;}   
  }
  /* ── Theme picker ─────────────────────────────────────────────────────────── */
  .theme-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;}
  .theme-swatch-btn{position:relative;display:flex;flex-direction:column;align-items:center;gap:6px;padding:10px 6px 8px;border-radius:14px;border:2px solid var(--border);background:var(--bg2);cursor:pointer;transition:all .18s;font-family:var(--font);}
  .theme-swatch-btn:hover{border-color:var(--accent3);background:var(--bg4);transform:translateY(-1px);}
  .theme-swatch-btn.active{border-color:var(--accent);background:var(--bg4);box-shadow:0 0 0 3px var(--accent3);}
  .theme-swatch-dots{display:flex;gap:3px;}
  .theme-swatch-dot{width:14px;height:14px;border-radius:50%;border:1.5px solid rgba(0,0,0,.08);flex-shrink:0;}
  .theme-swatch-label{font-size:10px;font-weight:800;color:var(--text2);text-align:center;white-space:nowrap;}
  .theme-swatch-btn.active .theme-swatch-label{color:var(--accent);}
  .theme-swatch-check{position:absolute;top:5px;right:7px;font-size:10px;font-weight:900;color:var(--accent);}

  /* ── Improved nav active state ────────────────────────────────────────────── */
  .nav-item.active{background:var(--bg4);color:var(--accent);box-shadow:inset 0 0 0 1.5px var(--accent3);border-left:3px solid var(--accent);padding-left:11px;}
  .view-tab.active{background:var(--bg2);color:var(--accent);box-shadow:var(--shadow);border-bottom:2px solid var(--accent);}
  .scope-tab.active{background:var(--bg2);color:var(--accent);box-shadow:var(--shadow);border-bottom:2px solid var(--accent);}

  /* ── Event block text legibility overlay ─────────────────────────────────── */
  .event-block::before{content:"";position:absolute;inset:0;border-radius:12px;background:linear-gradient(180deg,rgba(255,255,255,0.18) 0%,rgba(255,255,255,0.06) 100%);pointer-events:none;}
  .event-title{position:relative;z-index:1;text-shadow:0 1px 2px rgba(0,0,0,0.10);}
  .event-time{position:relative;z-index:1;}
  .event-cat{position:relative;z-index:1;}

  /* ── High-priority task highlight ────────────────────────────────────────── */
  .task-item[data-priority="high"]:not(.done){border-color:rgba(255,107,138,0.30);background:rgba(255,107,138,0.04);}
  .task-item[data-priority="high"]:not(.done):hover{background:rgba(255,107,138,0.09);border-color:rgba(255,107,138,0.50);}
  .task-check{min-width:22px;min-height:22px;width:22px;height:22px;border-radius:7px;padding:0;}

  /* ── Conflict banner dark-mode safe ──────────────────────────────────────── */
  .conflict-banner{background:rgba(255,100,100,0.12);border:1px solid rgba(255,100,100,0.35);border-radius:10px;padding:8px 14px;margin-bottom:10px;font-size:12px;color:#E05050;font-weight:700;}

  /* ── Topbar date event count pill ────────────────────────────────────────── */
  .topbar-date span{color:var(--text2);font-weight:700;font-size:11px;margin-left:6px;background:var(--bg4);padding:2px 8px;border-radius:20px;border:1px solid var(--border);}

  /* ── Calendar sidebar toggles ── */
  .cal-label-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;}
  .cal-toggleable{cursor:pointer;transition:opacity .15s;border-radius:8px;padding:5px 6px;margin:-2px -6px;gap:8px;}
  .cal-toggleable:hover{background:var(--bg3);}
  .cal-hidden{opacity:.45;}
  .cal-dot{display:inline-block;width:8px;height:8px;border-radius:50%;flex-shrink:0;transition:background .2s;}
  .cal-name{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;font-weight:600;color:var(--text2);}
  .cal-eye{font-size:10px;color:var(--text3);flex-shrink:0;}
  .nav-section-label{font-size:9px;font-family:var(--mono);text-transform:uppercase;letter-spacing:1.5px;color:var(--text3);font-weight:700;padding:4px 14px 2px;}

  /* ── Journal Page ────────────────────────────────────────────────────────── */
  .journal-page{flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:0;background:var(--bg);}
  .journal-page::-webkit-scrollbar{width:4px;}
  .journal-page::-webkit-scrollbar-thumb{background:var(--border);border-radius:4px;}
  .journal-header{display:flex;align-items:center;gap:12px;padding:16px 20px 12px;background:var(--bg2);border-bottom:1px solid var(--border);flex-shrink:0;}
  .journal-title{font-size:18px;font-weight:900;color:var(--text);flex:1;}
  .journal-streak{font-size:13px;font-weight:700;color:var(--accent);background:var(--bg4);padding:4px 10px;border-radius:20px;}
  .journal-today-btn{font-size:12px;padding:7px 14px;white-space:nowrap;}
  .mood-stats-bar{display:flex;align-items:center;gap:8px;padding:10px 20px;background:var(--bg2);border-bottom:1px solid var(--border);overflow-x:auto;flex-shrink:0;}
  .mood-stat-pill{display:flex;align-items:center;gap:4px;background:var(--bg3);border:1.5px solid var(--border);border-radius:20px;padding:4px 10px;font-size:13px;flex-shrink:0;}
  .mood-stat-count{font-size:11px;font-weight:800;color:var(--text2);font-family:var(--mono);}
  .mood-stats-month{margin-left:auto;font-size:11px;color:var(--text3);font-family:var(--mono);font-weight:600;flex-shrink:0;}

  /* Mood Calendar */
  .jcal-dow{text-align:center;font-size:9px;font-family:var(--mono);text-transform:uppercase;color:var(--text3);font-weight:700;padding:4px 0;}
  .jcal-empty{aspect-ratio:1;}
  .jcal-day{aspect-ratio:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;border-radius:12px;border:none;background:var(--bg3);cursor:pointer;transition:all .15s;padding:2px;}
  .jcal-day:hover:not(.jcal-future){background:var(--bg4);transform:scale(1.05);}
  .jcal-today{background:var(--bg4);box-shadow:0 0 0 2px var(--accent);}
  .jcal-future{opacity:.3;cursor:default;}
  .jcal-emoji{font-size:20px;line-height:1;filter:drop-shadow(0 1px 2px rgba(0,0,0,.15));}
  .jcal-dot{width:8px;height:8px;border-radius:50%;background:var(--border);}
  .jcal-today-dot{background:var(--accent);opacity:.6;}
  .jcal-num{font-size:9px;font-family:var(--mono);color:var(--text3);font-weight:700;line-height:1;}

  /* Entry list */
  .journal-entries-section{padding:16px 20px;display:flex;flex-direction:column;gap:10px;}
  .journal-entries-title{font-size:13px;font-weight:800;color:var(--text3);text-transform:uppercase;letter-spacing:1px;font-family:var(--mono);margin-bottom:4px;}
  .journal-entry-card{display:flex;align-items:flex-start;gap:12px;background:var(--bg2);border:1.5px solid var(--border);border-radius:16px;padding:14px;cursor:pointer;transition:all .15s;}
  .journal-entry-card:hover{background:var(--bg3);border-color:var(--accent3);transform:translateY(-1px);box-shadow:var(--shadow);}
  .jec-left{flex-shrink:0;width:36px;text-align:center;}
  .jec-emoji{font-size:28px;line-height:1;}
  .jec-body{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px;}
  .jec-date{font-size:11px;font-family:var(--mono);color:var(--text3);font-weight:600;}
  .jec-mood{font-size:12px;font-weight:800;}
  .jec-acts{font-size:16px;display:flex;gap:4px;flex-wrap:wrap;}
  .jec-note{font-size:12px;color:var(--text2);line-height:1.4;font-weight:600;}
  .jec-gratitude{font-size:11px;color:var(--text3);font-style:italic;font-weight:600;}
  .jec-arrow{color:var(--text3);font-size:18px;font-weight:700;align-self:center;}
  .journal-empty{display:flex;flex-direction:column;align-items:center;padding:40px 20px;text-align:center;gap:8px;}
  .journal-empty-icon{font-size:48px;}
  .journal-empty-title{font-size:16px;font-weight:800;color:var(--text);}
  .journal-empty-sub{font-size:13px;color:var(--text3);font-weight:600;}

  /* Entry modal */
  .entry-modal{width:500px;max-width:calc(100vw - 32px);max-height:88vh;background:var(--bg2);border-radius:24px;border:1.5px solid var(--border);box-shadow:0 24px 64px rgba(0,0,0,.15);display:flex;flex-direction:column;overflow:hidden;animation:popIn .22s cubic-bezier(.34,1.56,.64,1);}
  .entry-view-modal{width:480px;max-width:calc(100vw - 32px);max-height:88vh;background:var(--bg2);border-radius:24px;border:1.5px solid var(--border);box-shadow:0 24px 64px rgba(0,0,0,.15);display:flex;flex-direction:column;overflow:hidden;animation:popIn .22s cubic-bezier(.34,1.56,.64,1);}
  .entry-view-body{flex:1;overflow-y:auto;display:flex;flex-direction:column;}
  .entry-view-body::-webkit-scrollbar{width:3px;}
  .entry-view-body::-webkit-scrollbar-thumb{background:var(--border);border-radius:4px;}
  .entry-modal-header{display:flex;align-items:flex-start;justify-content:space-between;padding:20px 20px 14px;border-bottom:1px solid var(--border);background:linear-gradient(135deg,var(--bg3),var(--bg2));flex-shrink:0;}
  .entry-modal-date{font-size:16px;font-weight:800;color:var(--text);}
  .entry-modal-sub{font-size:12px;color:var(--text3);font-weight:600;margin-top:2px;}
  .entry-view-mood{font-size:15px;font-weight:800;margin-top:4px;}
  .entry-modal-body{flex:1;overflow-y:auto;display:flex;flex-direction:column;}
  .entry-modal-body::-webkit-scrollbar{width:3px;}
  .entry-modal-body::-webkit-scrollbar-thumb{background:var(--border);border-radius:4px;}
  .entry-modal .entry-section,.entry-view-modal .entry-view-section{padding:14px 20px;border-bottom:1px solid var(--border);}
  .entry-section-title{font-size:11px;font-family:var(--mono);text-transform:uppercase;letter-spacing:1.2px;color:var(--text3);font-weight:700;margin-bottom:10px;}
  .entry-modal-footer{padding:14px 20px;display:flex;justify-content:flex-end;gap:8px;background:var(--bg3);border-top:1px solid var(--border);flex-shrink:0;}

  /* Mood picker */
  .mood-picker-row{display:flex;gap:8px;justify-content:space-between;}
  .mood-pick-btn{flex:1;display:flex;flex-direction:column;align-items:center;gap:5px;padding:10px 6px;border-radius:14px;border:2px solid var(--border);background:var(--bg3);cursor:pointer;transition:all .18s;font-family:var(--font);}
  .mood-pick-btn:hover{border-color:var(--mc,var(--accent));transform:translateY(-2px);}
  .mood-pick-btn.selected{border-color:var(--mc,var(--accent));background:var(--bg4);box-shadow:0 0 0 3px rgba(128,128,128,0.18);outline:2px solid var(--mc,var(--accent));outline-offset:1px;}
  .mp-emoji{font-size:26px;line-height:1;}
  .mp-label{font-size:10px;font-weight:800;color:var(--text2);}

  /* Activities */
  .activity-group{margin-bottom:10px;}
  .activity-group-label{font-size:10px;font-family:var(--mono);text-transform:uppercase;letter-spacing:1px;color:var(--text3);font-weight:700;margin-bottom:6px;}
  .activity-chips{display:flex;flex-wrap:wrap;gap:6px;}
  .activity-chip{display:flex;align-items:center;gap:5px;padding:5px 10px;border-radius:20px;border:1.5px solid var(--border);background:var(--bg3);cursor:pointer;font-family:var(--font);font-size:12px;font-weight:700;color:var(--text2);transition:all .15s;}
  .activity-chip:hover{border-color:var(--accent3);color:var(--accent);}
  .activity-chip.selected{background:var(--bg4);border-color:var(--accent);color:var(--accent);}

  /* Gratitude + journal */
  .gratitude-input{width:100%;background:var(--bg3);border:1.5px solid var(--border);border-radius:10px;padding:8px 12px;font-family:var(--font);font-size:13px;color:var(--text);font-weight:600;outline:none;margin-bottom:7px;display:block;}
  .gratitude-input:focus{border-color:var(--accent3);}
  .gratitude-view-item{font-size:13px;color:var(--text);font-weight:600;padding:5px 0;border-bottom:1px solid var(--border);}
  .journal-prompt{font-size:12px;color:var(--accent);font-weight:700;font-style:italic;margin-bottom:8px;padding:8px 12px;background:var(--bg4);border-radius:8px;border-left:3px solid var(--accent);}
  .journal-textarea{width:100%;background:var(--bg3);border:1.5px solid var(--border);border-radius:12px;padding:10px 14px;font-family:var(--font);font-size:13px;color:var(--text);font-weight:600;outline:none;resize:none;line-height:1.6;}
  .journal-textarea:focus{border-color:var(--accent3);}
  .entry-view-note{font-size:13px;color:var(--text);line-height:1.7;font-weight:600;white-space:pre-wrap;}
  .completed-tasks-section{background:linear-gradient(135deg,var(--bg2),var(--bg3));}
  .completed-task-list{display:flex;flex-direction:column;gap:8px;}
  .completed-task-item{display:flex;align-items:center;gap:10px;background:var(--bg3);border:1.5px solid var(--border);border-radius:14px;padding:9px 11px;}
  .completed-task-check{width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;background:linear-gradient(135deg,var(--accent),var(--accent2));color:white;font-size:12px;font-weight:900;box-shadow:0 4px 10px rgba(var(--accent-rgb),.18);}
  .completed-task-body{min-width:0;display:flex;flex-direction:column;gap:2px;}
  .completed-task-title{font-size:13px;font-weight:800;color:var(--text);line-height:1.25;}
  .completed-task-meta{font-size:10px;font-family:var(--mono);font-weight:700;color:var(--text3);}

  /* Memory Book scrapbook layer */
  .memory-entry-modal{width:720px;max-width:calc(100vw - 32px);}
  .memory-book-section{padding:16px 20px;background:linear-gradient(135deg,var(--bg2),var(--bg3));border-bottom:1px solid var(--border);}
  .memory-book-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px;}
  .memory-book-actions{display:flex;align-items:center;gap:7px;flex-shrink:0;}
  .memory-book-title{font-size:15px;font-weight:900;color:var(--text);}
  .memory-book-sub{font-size:11px;color:var(--text3);font-family:var(--mono);font-weight:700;margin-top:2px;}
  .memory-filter-row{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px;}
  .memory-tag-row{display:flex;flex-wrap:wrap;gap:6px;}
  .memory-tag-chip{border:1.5px solid var(--border);background:var(--bg3);color:var(--text2);border-radius:999px;padding:5px 10px;font-size:11px;font-family:var(--font);font-weight:800;cursor:pointer;transition:all .15s;}
  .memory-tag-chip:hover{border-color:var(--accent3);color:var(--accent);}
  .memory-tag-chip.selected{background:var(--bg4);border-color:var(--accent);color:var(--accent);}
  .memory-page-grid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:7px;}
  .memory-page-card{position:relative;min-height:86px;border:1.5px solid var(--border);background:var(--bg2);border-radius:16px;overflow:hidden;cursor:pointer;box-shadow:0 6px 18px rgba(var(--accent-rgb),.06);transition:all .16s;font-family:var(--font);}
  .memory-page-card:hover:not(.future){transform:translateY(-2px);border-color:var(--accent3);box-shadow:var(--shadow);}
  .memory-page-card.future{opacity:.35;cursor:default;}
  .memory-page-card.filtered-out{opacity:.28;filter:saturate(.45);box-shadow:none;}
  .memory-page-card.filter-match{border-color:var(--accent);box-shadow:0 8px 24px rgba(var(--accent-rgb),.12);}
  .memory-page-card.has-memory{background:linear-gradient(135deg,var(--bg4),var(--bg2));}
  .memory-page-cover{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;}
  .memory-page-shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.04),rgba(0,0,0,.34));opacity:0;}
  .memory-page-cover + .memory-page-shade{opacity:1;}
  .memory-page-date{position:absolute;top:7px;left:8px;z-index:2;font-size:10px;font-family:var(--mono);font-weight:900;color:var(--text3);background:rgba(255,255,255,.78);border:1px solid rgba(255,255,255,.65);border-radius:999px;padding:2px 6px;}
  .dark .memory-page-date{background:rgba(35,19,41,.78);}
  .memory-page-main{position:absolute;left:8px;right:8px;top:31px;z-index:2;display:flex;align-items:center;justify-content:center;gap:5px;font-size:20px;font-weight:900;color:var(--text);}
  .memory-page-cover ~ .memory-page-main,.memory-page-cover ~ .memory-page-meta{color:white;text-shadow:0 1px 4px rgba(0,0,0,.34);}
  .memory-page-main strong{font-size:10px;font-family:var(--mono);background:rgba(255,255,255,.76);color:var(--accent);border-radius:999px;padding:2px 6px;text-shadow:none;}
  .memory-page-meta{position:absolute;left:8px;right:8px;bottom:7px;z-index:2;font-size:9px;font-family:var(--mono);font-weight:900;color:var(--text3);text-align:center;}
  .jec-cover{width:38px;height:38px;border-radius:12px;object-fit:cover;border:1.5px solid var(--border);box-shadow:0 4px 12px rgba(var(--accent-rgb),.12);}
  .jec-tags{display:flex;gap:4px;flex-wrap:wrap;margin-top:2px;}
  .jec-tags span{font-size:10px;font-family:var(--mono);font-weight:800;color:var(--accent);background:var(--bg4);border:1px solid var(--border);border-radius:999px;padding:2px 6px;}
  .memory-upload-box{display:flex;align-items:center;justify-content:center;gap:8px;border:1.5px dashed var(--accent3);background:var(--bg3);border-radius:16px;padding:14px 12px;font-size:13px;font-weight:900;color:var(--accent);cursor:pointer;transition:all .15s;}
  .memory-upload-box:hover{background:var(--bg4);transform:translateY(-1px);}
  .memory-upload-box input{display:none;}
  .memory-upload-error{margin-top:8px;font-size:11px;font-weight:800;color:#E05D7F;background:rgba(255,123,172,.10);border:1px solid var(--border);border-radius:14px;padding:8px 10px;}
  .memory-upload-icon{font-size:20px;}
  .memory-photo-editor-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:12px;}
  .memory-photo-editor-card{background:var(--bg3);border:1.5px solid var(--border);border-radius:16px;padding:8px;overflow:hidden;}
  .memory-photo-editor-card.cover{border-color:var(--accent);box-shadow:0 0 0 3px rgba(var(--accent-rgb),.12);}
  .memory-photo-editor-card img{width:100%;height:145px;object-fit:cover;border-radius:12px;display:block;background:var(--bg4);}
  .memory-photo-tools{display:flex;gap:6px;margin:7px 0;}
  .memory-photo-tools button,.scrapbook-add-row button,.scrapbook-block-tools button,.sticker-picker-row button,.photo-grid-select-row button{border:1px solid var(--border);background:var(--bg2);color:var(--text2);border-radius:10px;padding:5px 8px;font-size:10px;font-family:var(--font);font-weight:800;cursor:pointer;}
  .memory-photo-tools button:hover,.scrapbook-add-row button:hover,.scrapbook-block-tools button:hover{border-color:var(--accent3);color:var(--accent);}
  .memory-caption-input{margin-bottom:0;font-size:11px;padding:7px 9px;}
  .memory-cover-hero{position:relative;margin:0;border-bottom:1px solid var(--border);background:var(--bg3);}
  .memory-cover-hero img{width:100%;max-height:260px;object-fit:cover;display:block;}
  .memory-cover-hero div{position:absolute;left:14px;right:14px;bottom:12px;background:rgba(255,255,255,.78);border:1px solid rgba(255,255,255,.65);border-radius:14px;padding:8px 10px;font-size:12px;font-weight:800;color:var(--text);backdrop-filter:blur(8px);}
  .dark .memory-cover-hero div{background:rgba(35,19,41,.78);}
  .memory-photo-view-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;}
  .memory-photo-view-card{margin:0;background:var(--bg3);border:1.5px solid var(--border);border-radius:16px;padding:7px;}
  .memory-photo-view-card img{width:100%;height:150px;object-fit:cover;border-radius:12px;display:block;}
  .memory-photo-view-card figcaption{font-size:11px;color:var(--text2);font-weight:800;text-align:center;margin-top:6px;line-height:1.35;}
  .highlight-view-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;}
  .highlight-view-grid div{background:var(--bg3);border:1px solid var(--border);border-radius:14px;padding:9px;}
  .highlight-view-grid span{display:block;font-size:9px;font-family:var(--mono);text-transform:uppercase;letter-spacing:.8px;color:var(--text3);font-weight:900;margin-bottom:4px;}
  .highlight-view-grid strong{font-size:12px;color:var(--text);line-height:1.4;}
  .scrapbook-editor-section{background:linear-gradient(135deg,var(--bg2),var(--bg3));}
  .scrapbook-add-row{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px;}
  .scrapbook-block-editor-list{display:flex;flex-direction:column;gap:10px;}
  .scrapbook-block-editor{border:1.5px solid var(--border);background:var(--bg2);border-radius:16px;padding:10px;}
  .scrapbook-block-tools{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:8px;}
  .scrapbook-block-tools span{font-size:10px;font-family:var(--mono);font-weight:900;text-transform:uppercase;letter-spacing:.8px;color:var(--text3);}
  .scrapbook-block-tools div{display:flex;gap:5px;}
  .sticker-picker-row{display:flex;flex-wrap:wrap;gap:6px;}
  .sticker-picker-row button{font-size:18px;padding:6px 8px;}
  .sticker-picker-row button.selected{border-color:var(--accent);background:var(--bg4);}
  .photo-grid-select-row{display:grid;grid-template-columns:repeat(6,1fr);gap:5px;margin-bottom:8px;}
  .photo-grid-select-row button{padding:2px;border-radius:10px;opacity:.45;}
  .photo-grid-select-row button.selected{opacity:1;border-color:var(--accent);background:var(--bg4);}
  .photo-grid-select-row img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:8px;display:block;}
  .scrapbook-empty-note{font-size:12px;color:var(--text3);font-weight:700;text-align:center;border:1.5px dashed var(--border);border-radius:14px;padding:13px;background:var(--bg3);}
  .scrapbook-view-list{display:flex;flex-direction:column;gap:10px;}
  .scrapbook-view-block{background:var(--bg3);border:1.5px solid var(--border);border-radius:16px;padding:12px;}
  .scrapbook-view-block blockquote{margin:0;font-size:15px;line-height:1.55;color:var(--text);font-weight:800;font-style:italic;border-left:3px solid var(--accent);padding-left:12px;}
  .scrapbook-sticker-view{text-align:center;font-size:42px;line-height:1.1;filter:drop-shadow(0 5px 12px rgba(var(--accent-rgb),.18));}
  .scrapbook-divider-preview{text-align:center;font-size:14px;color:var(--accent);font-family:var(--mono);font-weight:900;letter-spacing:6px;padding:6px 0;}
  .scrapbook-photo-grid{grid-template-columns:repeat(3,minmax(0,1fr));}
  .scrapbook-grid-caption{text-align:center;font-size:12px;font-weight:800;color:var(--text2);margin-top:8px;}

  .bloom-room-page{height:100%;overflow:auto;padding:20px;background:var(--bg);}
  .bloom-room-page .game-dashboard{padding:0;}
  .bloom-room-subtitle{font-size:12px;font-weight:700;color:var(--text3);margin-top:4px;}

  /* ── Cozy game layer ─────────────────────────────────────────────────────── */
  .level-card{margin:10px 12px 8px;background:linear-gradient(135deg,var(--bg2),var(--bg3));border:1.5px solid var(--border);border-radius:16px;padding:12px;box-shadow:0 8px 24px rgba(var(--accent-rgb),.08);}
  .level-topline{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:8px;}
  .level-label{font-size:10px;font-family:var(--mono);text-transform:uppercase;letter-spacing:1px;color:var(--text3);font-weight:800;}
  .level-title{font-size:14px;font-weight:900;color:var(--text);line-height:1.2;}
  .level-xp{font-size:10px;font-family:var(--mono);font-weight:800;color:var(--accent);background:var(--bg4);border:1px solid var(--border);border-radius:999px;padding:3px 7px;white-space:nowrap;}
  .level-track{height:9px;background:var(--bg4);border-radius:999px;border:1px solid var(--border);overflow:hidden;}
  .level-track.mini{height:7px;margin-top:10px;}
  .level-fill{height:100%;background:linear-gradient(90deg,var(--accent),var(--accent2));border-radius:999px;box-shadow:0 0 14px rgba(var(--accent-rgb),.24);transition:width .25s ease;}
  .level-meta{display:flex;justify-content:space-between;gap:8px;margin-top:7px;font-size:10px;color:var(--text3);font-family:var(--mono);font-weight:700;}
  .game-dashboard{display:grid;grid-template-columns:repeat(3,minmax(220px,1fr));gap:12px;padding:0 20px 12px;background:var(--bg);}
  .game-dashboard.compact{max-width:980px;margin:0 auto 12px;padding:0;grid-template-columns:repeat(2,minmax(220px,1fr));}
  .daily-quests-card,.badges-card,.game-soft-card{background:var(--bg2);border:1.5px solid var(--border);border-radius:18px;padding:13px 14px;box-shadow:var(--shadow);min-width:0;}
  .game-stack{display:flex;flex-direction:column;gap:12px;min-width:0;}
  .game-card-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:9px;}
  .game-card-title{font-size:13px;font-weight:900;color:var(--text);}
  .game-card-sub{font-size:10px;font-family:var(--mono);font-weight:700;color:var(--text3);}
  .score-pill{font-size:10px;font-family:var(--mono);font-weight:900;color:var(--accent);background:var(--bg4);border:1px solid var(--border);border-radius:999px;padding:4px 8px;white-space:nowrap;}
  .quest-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;}
  .quest-item{display:flex;align-items:center;gap:9px;border:1.5px solid var(--border);background:var(--bg3);border-radius:14px;padding:8px 9px;min-width:0;}
  .quest-item.done{background:linear-gradient(135deg,var(--bg4),var(--bg3));border-color:var(--accent3);}
  .quest-icon{width:24px;height:24px;border-radius:9px;background:var(--bg2);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:900;color:var(--accent);flex-shrink:0;}
  .quest-item.done .quest-icon{background:linear-gradient(135deg,var(--accent),var(--accent2));color:white;border-color:transparent;}
  .quest-body{min-width:0;flex:1;}
  .quest-title{font-size:12px;font-weight:900;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .quest-desc{font-size:10px;font-family:var(--mono);font-weight:700;color:var(--text3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .quest-xp{font-size:10px;font-family:var(--mono);font-weight:900;color:var(--accent);white-space:nowrap;}
  .badge-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;}
  .badge-chip{display:flex;align-items:center;gap:7px;border:1.5px solid var(--border);background:var(--bg3);border-radius:14px;padding:8px;min-width:0;opacity:.48;}
  .badge-chip.unlocked{opacity:1;background:linear-gradient(135deg,var(--bg4),var(--bg2));border-color:var(--accent3);}
  .badge-icon{width:22px;height:22px;border-radius:8px;background:var(--bg2);display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0;}
  .badge-name{font-size:11px;font-weight:900;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .mascot-stage{display:flex;align-items:center;gap:12px;background:linear-gradient(135deg,var(--bg4),var(--bg3));border:1px solid var(--border);border-radius:16px;padding:11px;}
  .mascot-stage-icon{width:48px;height:48px;border-radius:18px;background:var(--bg2);display:flex;align-items:center;justify-content:center;font-size:28px;box-shadow:0 8px 20px rgba(var(--accent-rgb),.12);animation:mascotBounce 2.8s ease-in-out infinite;}
  .mascot-stage.glowing .mascot-stage-icon{box-shadow:0 0 24px rgba(var(--accent-rgb),.32);}
  .mascot-stage-body{min-width:0;}
  .mascot-stage-name{font-size:14px;font-weight:900;color:var(--text);margin-bottom:3px;}
  .mascot-stage-note{font-size:11px;line-height:1.35;color:var(--text2);font-weight:700;}
  .skill-list{display:flex;flex-direction:column;gap:8px;}
  .skill-row{display:flex;flex-direction:column;gap:5px;}
  .skill-main{display:flex;align-items:center;gap:7px;font-size:12px;font-weight:900;color:var(--text);}
  .skill-icon{width:22px;height:22px;border-radius:8px;background:var(--bg4);display:flex;align-items:center;justify-content:center;font-size:12px;}
  .skill-name{flex:1;min-width:0;}
  .skill-level{font-family:var(--mono);font-size:10px;color:var(--accent);background:var(--bg4);border:1px solid var(--border);border-radius:999px;padding:2px 6px;}
  .skill-track{height:6px;background:var(--bg4);border:1px solid var(--border);border-radius:999px;overflow:hidden;}
  .skill-fill{height:100%;background:linear-gradient(90deg,var(--accent),var(--accent2));border-radius:999px;}
  .weekly-label,.garden-label{font-size:11px;color:var(--text3);font-family:var(--mono);font-weight:800;margin-bottom:8px;}
  .weekly-mini-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:10px;}
  .weekly-mini-grid div{background:var(--bg3);border:1px solid var(--border);border-radius:12px;padding:8px 6px;text-align:center;display:flex;flex-direction:column;gap:2px;}
  .weekly-mini-grid strong{font-size:14px;color:var(--text);font-weight:900;}
  .weekly-mini-grid span{font-size:9px;color:var(--text3);font-family:var(--mono);font-weight:800;}
  .weekly-bars{display:grid;grid-template-columns:repeat(7,1fr);gap:5px;}
  .weekly-dot{height:8px;border-radius:999px;background:var(--bg4);border:1px solid var(--border);}
  .weekly-dot.rank-s{background:linear-gradient(90deg,#FFD76B,#FFB870);}
  .weekly-dot.rank-a{background:linear-gradient(90deg,var(--accent),var(--accent2));}
  .weekly-dot.rank-b{background:#B8F0E0;}
  .weekly-dot.rank-c{background:#FFD6A8;}
  .weekly-dot.rank-d{background:var(--bg4);}
  .theme-unlock-list{display:flex;flex-wrap:wrap;gap:6px;}
  .theme-unlock-pill{display:flex;align-items:center;gap:5px;border:1px solid var(--border);border-radius:999px;padding:5px 8px;font-size:10px;font-family:var(--mono);font-weight:900;}
  .theme-unlock-pill.unlocked{background:var(--bg4);color:var(--accent);}
  .theme-unlock-pill.locked{background:var(--bg3);color:var(--text3);opacity:.65;}
  .theme-swatch-btn.locked{opacity:.58;cursor:not-allowed;filter:saturate(.55);}
  .theme-swatch-lockline{font-size:8px;color:var(--text3);font-family:var(--mono);font-weight:800;margin-top:1px;line-height:1.15;text-align:center;}
  .theme-swatch-lock{position:absolute;top:6px;right:6px;font-size:12px;}
  .garden-dow{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin-bottom:4px;}
  .garden-dow span{text-align:center;font-size:9px;color:var(--text3);font-family:var(--mono);font-weight:900;}
  .garden-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;}
  .garden-cell{position:relative;min-height:32px;border-radius:10px;background:var(--bg3);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;overflow:hidden;}
  .garden-cell.blank{background:transparent;border-color:transparent;}
  .garden-cell.future{opacity:.35;}
  .garden-cell.sprout{background:linear-gradient(135deg,var(--bg3),var(--bg4));}
  .garden-cell.bud,.garden-cell.bloom,.garden-cell.big,.garden-cell.gold{background:linear-gradient(135deg,var(--bg4),var(--bg2));border-color:var(--accent3);}
  .garden-cell.gold{box-shadow:0 0 0 1px rgba(var(--accent-rgb),.10),0 8px 18px rgba(var(--accent-rgb),.10);}
  .garden-bloom{font-size:15px;line-height:1;}
  .garden-day{position:absolute;right:4px;bottom:2px;font-size:8px;font-family:var(--mono);font-weight:900;color:var(--text3);}
  .daily-score-section{background:linear-gradient(135deg,var(--bg3),var(--bg2));}
  .daily-score-card{display:flex;align-items:center;gap:14px;background:var(--bg2);border:1.5px solid var(--border);border-radius:16px;padding:12px;}
  .daily-score-main{min-width:86px;display:flex;flex-direction:column;align-items:center;justify-content:center;background:var(--bg4);border:1px solid var(--border);border-radius:14px;padding:8px;}
  .daily-score-rank{font-size:24px;font-weight:900;color:var(--accent);line-height:1;}
  .daily-score-num{font-size:10px;font-family:var(--mono);font-weight:900;color:var(--text3);margin-top:3px;}
  .daily-score-lines{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px 10px;font-size:11px;font-weight:800;color:var(--text2);flex:1;}
  .mission-list,.combo-list,.boss-list,.leaderboard-list{display:flex;flex-direction:column;gap:7px;}
  .mission-item,.boss-item{background:var(--bg3);border:1.5px solid var(--border);border-radius:14px;padding:8px 9px;}
  .mission-item.done{background:linear-gradient(135deg,var(--bg4),var(--bg2));border-color:var(--accent3);}
  .mission-top,.boss-top{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:11px;font-weight:900;color:var(--text);margin-bottom:6px;}
  .mission-top span,.boss-top span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0;}
  .mission-top strong,.boss-top strong{font-size:10px;font-family:var(--mono);color:var(--accent);white-space:nowrap;}
  .mission-track,.boss-track{height:6px;background:var(--bg4);border:1px solid var(--border);border-radius:999px;overflow:hidden;}
  .mission-fill,.boss-fill{height:100%;background:linear-gradient(90deg,var(--accent),var(--accent2));border-radius:999px;}
  .mission-reward,.boss-meta{font-size:9px;font-family:var(--mono);font-weight:800;color:var(--text3);margin-top:5px;}
  .combo-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;}
  .combo-chip{display:flex;align-items:center;gap:7px;background:var(--bg3);border:1.5px solid var(--border);border-radius:14px;padding:8px;opacity:.52;min-width:0;}
  .combo-chip.done{opacity:1;background:linear-gradient(135deg,var(--bg4),var(--bg2));border-color:var(--accent3);}
  .combo-chip>span{width:22px;height:22px;border-radius:8px;background:var(--bg2);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--accent);font-weight:900;}
  .combo-chip strong{display:block;font-size:10px;font-weight:900;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .combo-chip small{display:block;font-size:8.5px;font-family:var(--mono);font-weight:800;color:var(--text3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .streak-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;}
  .streak-pill{display:flex;flex-direction:column;align-items:center;gap:2px;background:var(--bg3);border:1.5px solid var(--border);border-radius:14px;padding:8px 4px;text-align:center;}
  .streak-pill span{font-size:14px;}.streak-pill strong{font-size:14px;font-weight:900;color:var(--accent);}.streak-pill small{font-size:8.5px;font-family:var(--mono);font-weight:800;color:var(--text3);}
  .personality-main{display:flex;align-items:center;gap:12px;background:linear-gradient(135deg,var(--bg4),var(--bg3));border:1px solid var(--border);border-radius:16px;padding:12px;}
  .personality-main>span{width:44px;height:44px;border-radius:16px;background:var(--bg2);display:flex;align-items:center;justify-content:center;font-size:25px;flex-shrink:0;}
  .personality-main strong{display:block;font-size:14px;font-weight:900;color:var(--text);margin-bottom:3px;}.personality-main p{font-size:11px;line-height:1.35;color:var(--text2);font-weight:700;margin:0;}
  .leaderboard-row{display:grid;grid-template-columns:auto 1fr auto auto;align-items:center;gap:7px;background:var(--bg3);border:1.5px solid var(--border);border-radius:13px;padding:8px;font-size:10px;font-family:var(--mono);font-weight:800;color:var(--text3);}
  .leaderboard-row strong{font-size:11px;font-family:var(--font);font-weight:900;color:var(--text);}.leader-place{color:var(--accent);font-weight:900;}
  .empty-game-note{font-size:11px;line-height:1.45;color:var(--text2);font-weight:700;background:var(--bg3);border:1.5px dashed var(--border);border-radius:14px;padding:12px;text-align:center;}
  .eod-rank-card{background:linear-gradient(135deg,var(--bg4),var(--bg2));border:1.5px solid var(--border);border-radius:16px;padding:12px;margin-bottom:12px;}
  .eod-rank-main{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:7px;}.eod-rank-main strong{font-size:22px;color:var(--accent);font-weight:900;}.eod-rank-main span{font-size:11px;font-family:var(--mono);font-weight:900;color:var(--text3);}
  .eod-rank-meta{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:7px;}.eod-rank-meta span{font-size:10px;font-family:var(--mono);font-weight:900;color:var(--text2);background:var(--bg3);border:1px solid var(--border);border-radius:999px;padding:4px 7px;}
  .eod-rank-note{font-size:12px;font-weight:800;color:var(--text);}

  @media(max-width:1280px){.game-dashboard{grid-template-columns:repeat(2,minmax(220px,1fr));}.quest-list{grid-template-columns:1fr;}}
  @media(max-width:1080px){.game-dashboard,.game-dashboard.compact{grid-template-columns:1fr;}.weekly-mini-grid{grid-template-columns:repeat(2,1fr);}}

  @media(max-width:768px){
    .combo-list{grid-template-columns:1fr;}
    .streak-grid{grid-template-columns:repeat(2,minmax(0,1fr));}
    .leaderboard-row{grid-template-columns:auto 1fr auto;font-size:9px;}
    .leaderboard-row span:last-child{grid-column:2 / -1;}
    .mission-top,.boss-top{align-items:flex-start;}
    .eod-rank-main{align-items:flex-start;flex-direction:column;gap:3px;}
  }




  /* ── Bloom Room mobile optimisation ─────────────────────────────────────── */
  @media(max-width:768px){
    .bloom-room-page{
      height:calc(100dvh - 60px);
      padding:12px 10px calc(84px + env(safe-area-inset-bottom));
      overflow-y:auto;
      -webkit-overflow-scrolling:touch;
      background:var(--bg);
    }
    .bloom-room-page .journal-header{
      position:sticky;
      top:0;
      z-index:8;
      margin:-12px -10px 10px;
      padding:12px 12px 10px;
      background:rgba(255,255,255,.82);
      backdrop-filter:blur(14px);
      -webkit-backdrop-filter:blur(14px);
      border-bottom:1px solid var(--border);
      align-items:center;
    }
    .dark .bloom-room-page .journal-header{background:rgba(35,19,41,.82);}
    .bloom-room-page .journal-title{font-size:17px;line-height:1.15;}
    .bloom-room-subtitle{font-size:10.5px;margin-top:2px;}
    .bloom-room-page .journal-streak{font-size:10px;padding:4px 8px;white-space:nowrap;}
    .bloom-room-page .game-dashboard{
      display:flex;
      flex-direction:column;
      gap:10px;
      padding:0;
      background:transparent;
    }
    .bloom-room-page .daily-quests-card,
    .bloom-room-page .badges-card,
    .bloom-room-page .game-soft-card{
      border-radius:16px;
      padding:11px 10px;
      box-shadow:0 8px 22px rgba(var(--accent-rgb),.08);
    }
    .bloom-room-page .game-card-head{gap:8px;margin-bottom:8px;align-items:flex-start;}
    .bloom-room-page .game-card-title{font-size:12.5px;line-height:1.2;}
    .bloom-room-page .game-card-sub,
    .bloom-room-page .score-pill{font-size:9px;padding:3px 7px;}
    .bloom-room-page .mascot-stage{gap:10px;padding:10px;border-radius:15px;}
    .bloom-room-page .mascot-stage-icon{width:42px;height:42px;border-radius:15px;font-size:24px;}
    .bloom-room-page .mascot-stage-name{font-size:13px;}
    .bloom-room-page .mascot-stage-note{font-size:10.5px;line-height:1.35;}
    .bloom-room-page .quest-list{grid-template-columns:1fr;gap:6px;}
    .bloom-room-page .quest-item{padding:7px 8px;gap:7px;border-radius:13px;}
    .bloom-room-page .quest-icon{width:22px;height:22px;border-radius:8px;font-size:11px;}
    .bloom-room-page .quest-title{font-size:11.5px;white-space:normal;line-height:1.2;}
    .bloom-room-page .quest-desc{font-size:9.5px;white-space:normal;line-height:1.25;}
    .bloom-room-page .quest-xp{font-size:9px;}
    .bloom-room-page .skill-list{gap:7px;}
    .bloom-room-page .skill-main{gap:6px;font-size:11.5px;}
    .bloom-room-page .skill-icon{width:20px;height:20px;border-radius:7px;font-size:11px;}
    .bloom-room-page .skill-level{font-size:9px;padding:2px 5px;}
    .bloom-room-page .weekly-mini-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;}
    .bloom-room-page .weekly-mini-grid div{padding:7px 6px;border-radius:11px;}
    .bloom-room-page .weekly-mini-grid strong{font-size:13px;}
    .bloom-room-page .weekly-mini-grid span{font-size:8.5px;}
    .bloom-room-page .weekly-bars{gap:4px;}
    .bloom-room-page .weekly-dot{height:7px;}
    .bloom-room-page .garden-label,
    .bloom-room-page .weekly-label{font-size:10px;margin-bottom:7px;}
    .bloom-room-page .garden-dow{gap:3px;}
    .bloom-room-page .garden-grid{gap:3px;}
    .bloom-room-page .garden-cell{min-height:29px;border-radius:9px;}
    .bloom-room-page .garden-bloom{font-size:14px;}
    .bloom-room-page .garden-day{font-size:7.5px;right:3px;bottom:2px;}
    .bloom-room-page .badge-grid{grid-template-columns:1fr;gap:6px;}
    .bloom-room-page .badge-chip{padding:7px;border-radius:13px;}
    .bloom-room-page .badge-icon{width:21px;height:21px;font-size:12px;}
    .bloom-room-page .badge-name{font-size:10.5px;}
    .bloom-room-page .game-stack{gap:10px;}
    .bloom-room-page .theme-unlock-list{gap:5px;}
    .bloom-room-page .theme-unlock-pill{font-size:9px;padding:4px 7px;}
  }
  @media(max-width:390px){
    .bloom-room-page{padding-left:8px;padding-right:8px;}
    .bloom-room-page .journal-header{margin-left:-8px;margin-right:-8px;}
    .bloom-room-page .garden-cell{min-height:26px;border-radius:8px;}
    .bloom-room-page .garden-bloom{font-size:13px;}
    .bloom-room-page .game-card-head{flex-wrap:wrap;}
  }

  /* ── Feature wiring additions (keeps existing aesthetic) ─────────────────── */
  .all-day-strip{display:flex;align-items:flex-start;gap:8px;background:var(--bg2);border:1.5px solid var(--border);border-radius:14px;padding:8px 10px;margin-bottom:8px;}
  .all-day-label,.all-day-mini-label{font-size:10px;font-family:var(--mono);font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.8px;white-space:nowrap;}
  .all-day-list{display:flex;gap:6px;flex-wrap:wrap;min-width:0;}
  .all-day-chip,.week-all-day-chip{border:1px solid var(--border);border-radius:10px;padding:4px 8px;font-family:var(--font);font-size:11px;font-weight:800;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;background:var(--bg3);}
  .week-all-day-row{display:grid;grid-template-columns:48px repeat(7,1fr);border-bottom:1px solid var(--border);background:var(--bg2);min-height:34px;}
  .week-all-day-cell{min-width:0;border-left:1px solid var(--border);padding:4px;display:flex;gap:3px;flex-direction:column;}
  .week-all-day-chip{width:100%;text-align:left;padding:3px 6px;font-size:10px;}
  .recurrence-editor{width:100%;display:flex;flex-direction:column;gap:8px;}
  .recurrence-custom{display:flex;flex-direction:column;gap:6px;background:var(--bg3);border:1px solid var(--border);border-radius:12px;padding:8px;}
  .weekday-picker{display:flex;gap:5px;flex-wrap:wrap;}
  .weekday-btn{width:28px;height:28px;border-radius:50%;border:1.5px solid var(--border);background:var(--bg2);color:var(--text2);font-family:var(--font);font-size:11px;font-weight:800;cursor:pointer;}
  .weekday-btn.active{background:var(--accent);border-color:var(--accent);color:white;}
  .tasks-page{height:100%;overflow:auto;padding:20px;}
  .task-panel.standalone{display:flex;position:relative;width:100%;height:auto;max-width:880px;border-radius:20px;margin:0 auto;border:1.5px solid var(--border);box-shadow:var(--shadow);}
  .task-panel.standalone .task-panel-inner{width:100%;}
  .task-panel.standalone .task-list{max-height:none;}
  @media(max-width:768px){
    body{overflow:hidden;}
    .main{margin-left:0;width:100%;min-width:0;}
    .app{padding-bottom:60px;}
    .modal,.entry-modal,.entry-view-modal,.settings-panel,.templates-panel,.search-modal{width:calc(100vw - 20px)!important;max-width:calc(100vw - 20px)!important;max-height:calc(100vh - 96px)!important;overflow-y:auto;}
    .modal-overlay,.settings-overlay{padding:10px;align-items:center!important;}
    .week-timetable,.day-view,.month-view{min-width:0;}
    .task-panel:not(.standalone){display:none!important;}
    .task-panel:not(.standalone).mobile-open{display:flex!important;}
    .tasks-page{padding:14px 12px 74px;}
    .task-panel.standalone{height:auto;min-height:calc(100vh - 170px);}
    .sidebar{display:flex!important;position:fixed;top:0;bottom:60px;left:0;width:230px!important;z-index:160;box-shadow:8px 0 40px rgba(255,123,172,.18);transform:translateX(0);transition:transform .25s ease,width .25s ease;}
    .sidebar.closed{width:230px!important;transform:translateX(-105%);}
    .sidebar-logo{padding:16px 20px;}
    .sidebar-nav{overflow-y:auto;}
    .desktop-sidebar-toggle{display:none!important;}
    .tasks-page{overflow-x:hidden!important;}
    .task-period-board{grid-template-columns:1fr!important;}
    .task-period-card{min-width:0!important;width:100%!important;}
  }


  /* ── Mobile cleanup + TimeTree-style month view ─────────────────────────── */
  .stats-mini-note{font-size:11px;color:var(--text3);font-family:var(--mono);background:var(--bg3);border:1px solid var(--border);border-radius:14px;padding:8px 10px;margin-top:10px;line-height:1.35;}
  @media(max-width:768px){
    .keyboard-shortcuts-btn{display:none!important;}
    .calendar-pane.view-month{padding:0!important;background:var(--bg2);overflow-y:auto;}
    .calendar-pane.view-month .month-view{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));border:none!important;background:var(--bg2);min-width:0;width:100%;}
    .calendar-pane.view-month .month-header{position:sticky;top:0;z-index:6;background:var(--bg2);border:none!important;border-bottom:1px solid rgba(255,123,172,.16)!important;padding:9px 0 7px;text-align:center;font-size:10px;letter-spacing:.5px;color:var(--text3);}
    .calendar-pane.view-month .month-day{min-height:118px;padding:6px 3px 5px;border:none!important;border-bottom:1px solid rgba(255,123,172,.12)!important;background:var(--bg2)!important;border-radius:0!important;gap:3px;overflow:hidden;}
    .calendar-pane.view-month .month-day:hover{background:var(--bg2)!important;}
    .calendar-pane.view-month .month-day.other{opacity:.35;pointer-events:none;background:var(--bg)!important;}
    .calendar-pane.view-month .month-day.today-cell{background:rgba(var(--accent-rgb),.06)!important;}
    .calendar-pane.view-month .month-day-num{text-align:center;min-height:25px;margin:0 0 2px;font-size:15px;font-family:var(--font);font-weight:700;color:var(--text2);}
    .calendar-pane.view-month .today-circle{width:28px;height:28px;border-radius:50%;background:var(--text);color:var(--bg2);font-size:14px;box-shadow:0 4px 12px rgba(74,40,64,.16);}
    .calendar-pane.view-month .month-heat-bar{display:none!important;}
    .calendar-pane.view-month .month-day-events{gap:3px;min-height:0;overflow:hidden;}
    .calendar-pane.view-month .month-event-row{display:flex;justify-content:center;text-align:center;border-left:0!important;border-radius:4px!important;padding:2px 3px;min-height:17px;font-size:10px;line-height:1.15;font-weight:900;box-shadow:none;}
    .calendar-pane.view-month .month-event-time{display:none!important;}
    .calendar-pane.view-month .month-event-name{width:100%;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
    .calendar-pane.view-month .month-more{text-align:center;font-size:9px;padding:1px 0;color:var(--text3);}
    .calendar-pane.view-month + .task-panel{display:none!important;}
  }

  @media(max-width:768px){
    .journal-page{padding-bottom:70px;}
    .journal-header{padding:12px 12px 10px;gap:8px;position:sticky;top:0;z-index:12;background:rgba(255,255,255,.84);backdrop-filter:blur(14px);}
    .dark .journal-header{background:rgba(35,19,41,.84);}
    .journal-title{font-size:16px;}
    .journal-streak{font-size:10px;padding:4px 7px;}
    .journal-today-btn{font-size:10.5px;padding:6px 9px;}
    .mood-stats-bar{padding:8px 12px;}
    .memory-book-section,.journal-entries-section{padding:12px;}
    .memory-book-head{align-items:flex-start;}
    .memory-book-actions{gap:5px;flex-wrap:wrap;justify-content:flex-end;}
    .memory-book-title{font-size:14px;}
    .memory-book-sub{font-size:10px;}
    .memory-filter-row{overflow-x:auto;flex-wrap:nowrap;padding-bottom:3px;}
    .memory-tag-chip{font-size:10px;padding:4px 8px;white-space:nowrap;}
    .memory-page-grid{gap:4px;}
    .memory-page-card{min-height:68px;border-radius:12px;}
    .memory-page-date{top:5px;left:5px;font-size:8px;padding:1px 5px;}
    .memory-page-main{top:26px;font-size:16px;}
    .memory-page-main strong{font-size:8px;padding:1px 5px;}
    .memory-page-meta{font-size:7.5px;bottom:5px;}
    .journal-entry-card{padding:11px;border-radius:14px;gap:9px;}
    .jec-left{width:34px;}
    .jec-cover{width:34px;height:34px;border-radius:10px;}
    .entry-modal.memory-entry-modal{width:calc(100vw - 20px)!important;max-height:calc(100dvh - 84px)!important;}
    .memory-photo-editor-grid,.memory-photo-view-grid,.highlight-view-grid{grid-template-columns:1fr;}
    .memory-photo-editor-card img,.memory-photo-view-card img{height:170px;}
    .photo-grid-select-row{grid-template-columns:repeat(4,1fr);}
    .scrapbook-photo-grid{grid-template-columns:repeat(2,minmax(0,1fr));}
    .scrapbook-block-tools{align-items:flex-start;flex-direction:column;}
    .scrapbook-block-tools div{flex-wrap:wrap;}
    .memory-cover-hero img{max-height:220px;}
  }


  /* ── Memory Book Phase 4/5: backgrounds, sticker packs, lock, search, export ── */
  .memory-entry-modal,.entry-view-modal{background-size:cover;background-position:center;background-repeat:no-repeat;}
  .memory-bg-choice{display:flex;align-items:center;gap:7px;padding:7px 9px;border:1px solid var(--border);border-radius:14px;background:rgba(255,255,255,.6);color:var(--text2);font-family:var(--font);font-size:11px;font-weight:900;cursor:pointer;}
  .memory-bg-choice.selected{border-color:var(--accent);background:rgba(var(--accent-rgb),.12);color:var(--accent);box-shadow:0 4px 14px rgba(var(--accent-rgb),.12);}
  .memory-background-picker{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;}
  .memory-bg-swatch{width:28px;height:28px;border-radius:10px;border:1px solid var(--border);background:linear-gradient(135deg,var(--bg3),var(--bg4));background-size:cover;background-position:center;box-shadow:inset 0 0 0 1px rgba(255,255,255,.55);flex:0 0 auto;}
  .sticker-asset-picker-row{display:grid;grid-template-columns:repeat(6,1fr);gap:8px;margin:8px 0;}
  .sticker-asset-picker-row button{height:54px;border:1px solid var(--border);border-radius:14px;background:rgba(255,255,255,.65);display:flex;align-items:center;justify-content:center;cursor:pointer;padding:5px;}
  .sticker-asset-picker-row button.selected{border-color:var(--accent);background:rgba(var(--accent-rgb),.12);box-shadow:0 6px 18px rgba(var(--accent-rgb),.14);}
  .sticker-asset-picker-row img{max-width:100%;max-height:100%;object-fit:contain;display:block;}
  .scrapbook-sticker-view.asset{font-size:0;display:flex;justify-content:center;}
  .scrapbook-sticker-view.asset img{width:min(140px,45vw);height:auto;object-fit:contain;filter:drop-shadow(0 10px 18px rgba(74,40,64,.12));}
  .memory-search-section,.memory-throwback-section{padding:12px 16px;border-bottom:1px solid var(--border);}
  .memory-search-input{width:100%;border:1px solid var(--border);border-radius:18px;padding:11px 14px;background:var(--bg2);color:var(--text);font-family:var(--font);font-size:13px;font-weight:700;outline:none;}
  .memory-search-input:focus{border-color:var(--accent);box-shadow:0 0 0 3px rgba(var(--accent-rgb),.12);}
  .memory-throwback-row{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:10px;}
  .memory-throwback-card{border:1px solid var(--border);border-radius:18px;background:var(--bg2);padding:10px;text-align:left;display:grid;gap:6px;color:var(--text);font-family:var(--font);cursor:pointer;box-shadow:0 8px 20px rgba(74,40,64,.06);}
  .memory-throwback-card img{width:100%;height:74px;object-fit:cover;border-radius:14px;display:block;}
  .memory-throwback-card span{height:74px;border-radius:14px;background:var(--bg3);display:flex;align-items:center;justify-content:center;font-size:28px;}
  .memory-throwback-card strong{font-size:12px;color:var(--accent);}
  .memory-throwback-card small{font-size:11px;color:var(--text2);line-height:1.3;}
  @media(max-width:768px){
    .memory-background-picker{grid-template-columns:repeat(2,minmax(0,1fr));}
    .sticker-asset-picker-row{grid-template-columns:repeat(4,1fr);}
    .memory-throwback-row{grid-template-columns:1fr;}
    .memory-throwback-card{grid-template-columns:58px 1fr;align-items:center;}
    .memory-throwback-card img,.memory-throwback-card span{width:58px;height:58px;grid-row:span 2;}
    .memory-search-section,.memory-throwback-section{padding:10px 12px;}
    .journal-header-actions{gap:6px;}
  }


  @media(max-width:768px){
    .event-copy-bar{bottom:78px;left:10px;right:10px;transform:none;max-width:none;border-radius:16px;font-size:12px;padding:9px 10px;}
    .event-copy-text{white-space:normal;line-height:1.25;}
  }
`; }