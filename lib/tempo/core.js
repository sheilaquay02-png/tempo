
// ─── Constants ────────────────────────────────────────────────────────────────
// ─── Pre-split data schema notes ──────────────────────────────────────────────
// Event: { id,title,start,end,calendar,category,fixed,color,notes,recurrence,allDay }
// Task: { id,title,duration,category,scope,done,priority,dayKey,weekKey,monthKey,recurrence }
// MemoryEntry: { mood,activities,note,gratitude,photos,tags,backgroundId,highlights,blocks,updatedAt }
// MemoryPhoto: { id,storagePath,thumbStoragePath,bucket,caption,name,createdAt }
// MemoryBlock: { id,type,text,photoIds,caption,sticker,stickerAsset,size }
// UserSettings: { fontSize,darkMode,theme,workStart,workEnd,notifs,categories,templates,journalActivities,memoryTags }
// Memory Storage Service surface: upload full/thumb, sign URLs, refresh URLs, delete full/thumb, migrate legacy base64.
export const DAY_START = 0, DAY_END = 24, HOUR_H = 48;
export const RECURRENCE_WINDOW_DAYS  = 60;
export const RECURRENCE_SAFETY_LIMIT = 500;
export const UNDO_STACK_MAX      = 20;
export const CLOUD_FALLBACK_MS   = 4000;
export const CHAT_REPLY_DELAY_MS = 280;
export const EVENT_DRAG_HOLD_MS = 360;
export const EVENT_DRAG_MOVE_CANCEL_PX = 8;

export const CALENDARS = [
  { id: "personal", name: "Personal", color: "#FF7BAC", account: null },
  { id: "work",     name: "Work",     color: "#B08AE0", account: null },
];

export const normalizeCalendars = value => {
  const source = Array.isArray(value) && value.length ? value : CALENDARS;
  const seen = new Set();
  const clean = [];
  source.filter(Boolean).forEach((cal, i) => {
    const rawId = String(cal.id || cal.name || `calendar-${i + 1}`).trim().toLowerCase();
    let id = rawId.replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "") || `calendar-${i + 1}`;
    let suffix = 2;
    while (seen.has(id)) id = `${id}-${suffix++}`;
    seen.add(id);
    clean.push({
      id,
      name: String(cal.name || "Calendar").trim() || "Calendar",
      color: /^#[0-9a-f]{6}$/i.test(String(cal.color || "")) ? cal.color : (CALENDARS[i % CALENDARS.length]?.color || "#FF7BAC"),
      account: cal.account ?? null,
      source: cal.source || "tempo",
      updatedAt: cal.updatedAt || cal.createdAt || null,
      createdAt: cal.createdAt || null,
    });
  });
  return clean.length ? clean : CALENDARS;
};

export const CATEGORIES = [
  { id: "important", label: "Important",  color: "#B08AE0", icon: "⭐" },
  { id: "main",      label: "Main Thing", color: "#FF6B8A", icon: "🎯" },
  { id: "light",     label: "Light Task", color: "#A0C8E0", icon: "📝" },
  { id: "meeting",   label: "Meeting",    color: "#FF7BAC", icon: "💬" },
  { id: "personal",  label: "Personal",   color: "#70C8A0", icon: "🌿" },
  { id: "wellness",  label: "Wellness",   color: "#FFB870", icon: "🌸" },
];

export const CATEGORY_ID_ALIASES = {
  deep: "important",
  "deep-work": "important",
  "important-work": "important",
  boss: "main",
  "boss-battle": "main",
  "main-thing": "main",
  admin: "light",
  "light-task": "light",
  health: "wellness",
  wellbeing: "wellness",
};

export const normalizeCategoryId = (id, fallback = "important") => {
  const raw = String(id || fallback || "important").trim().toLowerCase();
  if (!raw) return fallback;
  return CATEGORY_ID_ALIASES[raw] || raw;
};
export const categoryIs = (id, target) => normalizeCategoryId(id) === normalizeCategoryId(target);
export const categoryIn = (id, targets = []) => targets.map(t => normalizeCategoryId(t)).includes(normalizeCategoryId(id));
export const isPersonalCategory = id => categoryIn(id, ["personal", "wellness"]);

export const PRIORITIES = [
  { id: "high",   label: "High",   color: "#FF6B8A", icon: "🔴" },
  { id: "medium", label: "Medium", color: "#FFB347", icon: "🟡" },
  { id: "low",    label: "Low",    color: "#7EC8A0", icon: "🟢" },
];

export const normalizeCategoryRecord = (category, index = 0) => {
  const rawId = String(category?.id || category?.label || `category-${index + 1}`).trim().toLowerCase();
  const fallbackId = rawId.replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "") || `category-${index + 1}`;
  const id = normalizeCategoryId(fallbackId);
  const preset = CATEGORIES.find(c => c.id === id);
  const legacyLabel = normalizeCategoryId(rawId) !== rawId || ["boss battle", "deep work", "admin", "health"].includes(String(category?.label || "").trim().toLowerCase());
  return {
    id,
    label: legacyLabel && preset ? preset.label : (String(category?.label || preset?.label || "Category").trim() || preset?.label || "Category"),
    color: /^#[0-9a-f]{6}$/i.test(String(category?.color || "")) ? category.color : (preset?.color || CATEGORIES[index % CATEGORIES.length]?.color || "#FF7BAC"),
    icon: legacyLabel && preset ? preset.icon : String(category?.icon || preset?.icon || "✨"),
  };
};

export const normalizeCategories = cats => {
  const source = Array.isArray(cats) && cats.length ? cats.filter(Boolean) : CATEGORIES;
  const seen = new Set();
  const clean = [];
  source.forEach((cat, index) => {
    const normalized = normalizeCategoryRecord(cat, index);
    if (seen.has(normalized.id)) return;
    seen.add(normalized.id);
    clean.push(normalized);
  });
  CATEGORIES.forEach((preset, index) => {
    if (seen.has(preset.id)) return;
    seen.add(preset.id);
    clean.splice(Math.min(index, clean.length), 0, preset);
  });
  return clean;
};

export const FONT_SIZES = [
  { id: "xs", label: "XS", desc: "Extra small", scale: 0.78 },
  { id: "sm", label: "S",  desc: "Small",       scale: 0.88 },
  { id: "md", label: "M",  desc: "Medium",      scale: 1.00 },
  { id: "lg", label: "L",  desc: "Large",       scale: 1.14 },
  { id: "xl", label: "XL", desc: "Extra large", scale: 1.28 },
];

// ─── Themes ──────────────────────────────────────────────────────────────────
export const THEMES = [
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

export const DAY_TEMPLATES = [
  { id: "important", label: "⭐ Important Day", events: [
    { title: "Morning Important Block",   start: [9,0],  end: [11,0], category: "important",     fixed: false },
    { title: "Lunch",           start: [12,0], end: [13,0], category: "personal", fixed: true  },
    { title: "Afternoon Important Block", start: [13,0], end: [15,0], category: "important",     fixed: false },
    { title: "Review & Plan",   start: [16,0], end: [17,0], category: "light",    fixed: false },
  ]},
  { id: "meetings", label: "💬 Meeting Heavy", events: [
    { title: "Team Standup", start: [9,0],  end: [9,30],  category: "meeting",  fixed: true  },
    { title: "1-on-1s",      start: [10,0], end: [11,0],  category: "meeting",  fixed: false },
    { title: "Lunch",        start: [12,0], end: [13,0],  category: "personal", fixed: true  },
    { title: "Project Sync", start: [14,0], end: [15,0],  category: "meeting",  fixed: false },
    { title: "Wrap-up",      start: [17,0], end: [17,30], category: "light",    fixed: false },
  ]},
  { id: "light", label: "🌿 Light Day", events: [
    { title: "Light Tasks", start: [9,0],  end: [9,30], category: "light",    fixed: false },
    { title: "Lunch",          start: [12,0], end: [13,0], category: "personal", fixed: true  },
    { title: "Gym",            start: [17,0], end: [18,0], category: "wellness",   fixed: false },
  ]},
];

// TODAY is computed once per module load and never mutated.
// Always use cloneDate(TODAY) before mutating.
export const TODAY = Object.freeze((() => { const d = new Date(); d.setHours(0,0,0,0); return d; })());


// ─── Reminder Helpers ────────────────────────────────────────────────────────
export const EVENT_REMINDER_PRESETS = [
  { id: "none", label: "No reminder", minutesBefore: null },
  { id: "at", label: "At time of event", minutesBefore: 0 },
  { id: "5", label: "5 minutes before", minutesBefore: 5 },
  { id: "10", label: "10 minutes before", minutesBefore: 10 },
  { id: "30", label: "30 minutes before", minutesBefore: 30 },
  { id: "60", label: "1 hour before", minutesBefore: 60 },
  { id: "1440", label: "1 day before", minutesBefore: 1440 },
  { id: "custom", label: "Custom", minutesBefore: 15 },
];
export const TASK_REMINDER_PRESETS = [
  { id: "none", label: "No reminder", time: "" },
  { id: "morning", label: "Morning", time: "09:00" },
  { id: "afternoon", label: "Afternoon", time: "13:00" },
  { id: "evening", label: "Evening", time: "18:00" },
  { id: "custom", label: "Custom time", time: "09:00" },
];
export const normalizeEventReminder = reminder => {
  if (reminder === null) return { type: "none", minutesBefore: null };
  if (typeof reminder === "number") return reminder < 0 ? { type: "none", minutesBefore: null } : { type: "minutes", minutesBefore: reminder };
  if (!reminder) return { type: "minutes", minutesBefore: 10 };
  const type = reminder.type || reminder.mode || reminder.id || "minutes";
  if (type === "none") return { type: "none", minutesBefore: null };
  if (type === "at") return { type: "at", minutesBefore: 0 };
  const minutes = Number(reminder.minutesBefore ?? reminder.minutes ?? reminder.offsetMinutes ?? reminder.value ?? 10);
  return { type: type === "custom" ? "custom" : "minutes", minutesBefore: Math.max(0, Number.isFinite(minutes) ? minutes : 10) };
};
export const eventReminderPresetId = reminder => {
  const r = normalizeEventReminder(reminder);
  if (r.type === "none") return "none";
  if (r.minutesBefore === 0) return "at";
  const match = EVENT_REMINDER_PRESETS.find(p => p.minutesBefore === r.minutesBefore && !["custom", "none", "at"].includes(p.id));
  return match?.id || "custom";
};
export const eventReminderMinutes = reminder => {
  const r = normalizeEventReminder(reminder);
  return r.type === "none" ? null : Math.max(0, Number(r.minutesBefore) || 0);
};
export const formatEventReminder = reminder => {
  const r = normalizeEventReminder(reminder);
  if (r.type === "none") return "No reminder";
  if (r.minutesBefore === 0) return "At time of event";
  if (r.minutesBefore === 1440) return "1 day before";
  if (r.minutesBefore === 60) return "1 hour before";
  return `${r.minutesBefore} minutes before`;
};
export const normalizeTaskReminder = reminder => {
  if (reminder === null) return { type: "none", time: "" };
  if (typeof reminder === "string") {
    const preset = TASK_REMINDER_PRESETS.find(p => p.id === reminder);
    return preset ? { type: preset.id, time: preset.time } : { type: "custom", time: reminder };
  }
  if (!reminder) return { type: "none", time: "" };
  const type = reminder.type || reminder.mode || reminder.id || "none";
  if (type === "none") return { type: "none", time: "" };
  const preset = TASK_REMINDER_PRESETS.find(p => p.id === type);
  return { type, time: reminder.time || preset?.time || "09:00" };
};
export const taskReminderPresetId = reminder => normalizeTaskReminder(reminder).type || "none";
export const taskReminderTime = reminder => normalizeTaskReminder(reminder).time || "";
export const formatTaskReminder = reminder => {
  const r = normalizeTaskReminder(reminder);
  if (r.type === "none") return "No reminder";
  const preset = TASK_REMINDER_PRESETS.find(p => p.id === r.type);
  if (r.type === "custom") return `Custom ${r.time || "09:00"}`;
  return preset?.label || r.time || "Reminder";
};
export const buildTaskRecurrencePreset = (preset, anchorDate = TODAY) => {
  if (!preset) return null;
  if (preset === "daily") return { frequency: "daily", interval: 1, endMode: "never", preset };
  if (preset === "weekly") return { frequency: "weekly", interval: 1, endMode: "never", preset };
  if (preset === "weekdays") return { frequency: "weekdays", interval: 1, endMode: "never", preset };
  if (preset === "weekly-2") return { frequency: "weekly", interval: 2, endMode: "never", preset };
  if (preset === "weekly-mwf") return { frequency: "weekly", interval: 1, byWeekdays: [1,3,5], endMode: "never", preset };
  if (preset === "monthly-15") return { frequency: "monthly", interval: 1, byMonthDay: 15, endMode: "never", preset };
  if (preset === "monthly") return { frequency: "monthly", interval: 1, byMonthDay: (anchorDate instanceof Date ? anchorDate : TODAY).getDate(), endMode: "never", preset };
  return null;
};
export const recurrencePresetId = recurrence => {
  const r = normalizeRecurrence(recurrence);
  if (!r) return "";
  if (r.preset) return r.preset;
  if (r.frequency === "weekly" && Number(r.interval || 1) === 2) return "weekly-2";
  if (r.frequency === "weekly" && Array.isArray(r.byWeekdays) && r.byWeekdays.join(",") === "1,3,5") return "weekly-mwf";
  if (r.frequency === "monthly" && Number(r.byMonthDay) === 15) return "monthly-15";
  return r.frequency || "";
};
export const formatRecurrence = recurrence => {
  const r = normalizeRecurrence(recurrence);
  if (!r) return "No repeat";
  if (r.frequency === "weekdays") return "Every weekday";
  if (r.frequency === "weekly" && Array.isArray(r.byWeekdays) && r.byWeekdays.length) {
    const names = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    const days = r.byWeekdays.map(i => names[i]).join("/");
    return `${Number(r.interval || 1) === 2 ? "Every 2 weeks" : "Weekly"} · ${days}`;
  }
  if (r.frequency === "weekly" && Number(r.interval || 1) === 2) return "Every 2 weeks";
  if (r.frequency === "monthly" && r.byMonthDay) return `Monthly on ${r.byMonthDay}`;
  const interval = Number(r.interval || 1);
  const base = r.frequency === "daily" ? "day" : r.frequency === "weekly" ? "week" : r.frequency === "monthly" ? "month" : r.frequency;
  return interval > 1 ? `Every ${interval} ${base}s` : `${String(base).charAt(0).toUpperCase()}${String(base).slice(1)}ly`;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
export const DEFAULT_TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Singapore";
export let _displayTimezone = DEFAULT_TIMEZONE;
export const setDisplayTimezoneCtx = tz => {
  try {
    if (tz) new Intl.DateTimeFormat("en-US", { timeZone: tz }).format(new Date());
    _displayTimezone = tz || DEFAULT_TIMEZONE;
  } catch {
    _displayTimezone = DEFAULT_TIMEZONE;
  }
};
export const formatWithDisplayTimezone = (d, opts) => {
  const date = d instanceof Date ? d : new Date(d);
  try { return new Intl.DateTimeFormat("en-US", { ...opts, timeZone: _displayTimezone }).format(date); }
  catch { return new Intl.DateTimeFormat("en-US", opts).format(date); }
};
export const fmt      = d => formatWithDisplayTimezone(d, { hour: "2-digit", minute: "2-digit", hour12: true });
export const fmtDate  = d => formatWithDisplayTimezone(d, { weekday: "short", month: "short", day: "numeric" });
export const sameDay  = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
export const fmtDay   = d => {
  if (sameDay(d, TODAY)) return "today";
  const t = new Date(TODAY); t.setDate(t.getDate() + 1);
  if (sameDay(d, t)) return "tomorrow";
  return formatWithDisplayTimezone(d, { weekday: "long", month: "short", day: "numeric" });
};
export const minsToTime = m => {
  const h = Math.floor(m / 60), mn = m % 60, ap = h >= 12 ? "pm" : "am", hd = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return mn === 0 ? `${hd}${ap}` : `${hd}:${mn.toString().padStart(2, "0")}${ap}`;
};

// dateKey must be defined before recurrence helpers that reference it
export const dateKey = d => {
  const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,"0"), day = String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${day}`;
};

export const cloneDate     = d => new Date((d instanceof Date ? d : new Date(d)).getTime());
export const addDaysSafe   = (date, days)   => { const d = cloneDate(date); d.setDate(d.getDate() + days); return d; };
export const addMonthsSafe = (date, months) => { const d = cloneDate(date); d.setMonth(d.getMonth() + months); return d; };
export const dayStart      = date => { const d = cloneDate(date); d.setHours(0,0,0,0); return d; };
export const getEventsOnDay  = (evs, d) => evs.filter(e => sameDay(e.start, d)).sort((a, b) => a.start - b.start);
export const weekStart = date => {
  const d = dayStart(date);
  const dow = d.getDay();
  d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
  return d;
};
export const weekDays = date => Array.from({ length: 7 }, (_, i) => addDaysSafe(weekStart(date), i));
export const monthDays = date => {
  const y = date.getFullYear(), m = date.getMonth();
  const startOffset = (new Date(y, m, 1).getDay() + 6) % 7;
  const count = new Date(y, m + 1, 0).getDate();
  const days = Array.from({ length: startOffset }, () => null);
  for (let d = 1; d <= count; d++) days.push(new Date(y, m, d));
  while (days.length % 7 !== 0) days.push(null);
  return days;
};
export const getFreeBlocks   = (evs, d, ws = 9, we = 19) => {
  const de = getEventsOnDay(evs, d); const bl = []; let cur = ws * 60; const em = we * 60;
  for (const e of de) {
    const es = e.start.getHours() * 60 + e.start.getMinutes(), ee = e.end.getHours() * 60 + e.end.getMinutes();
    if (es > cur) bl.push({ start: cur, end: es });
    cur = Math.max(cur, ee);
  }
  if (cur < em) bl.push({ start: cur, end: em });
  return bl.filter(b => b.end - b.start >= 15);
};
export const totalMins   = (evs, d) => getEventsOnDay(evs, d).reduce((a, e) => a + (e.end - e.start) / 60000, 0);
export const hasConflict = (evs, ev) => evs.filter(e => e.id !== ev.id && sameDay(e.start, ev.start)).some(e => ev.start < e.end && ev.end > e.start);
export const endOfDay = date => { const d = dayStart(date); d.setDate(d.getDate() + 1); return d; };
export const eventOccursOnDay = (ev, day) => {
  if (!ev?.start || !ev?.end) return false;
  const s = ev.start instanceof Date ? ev.start : new Date(ev.start);
  const e = ev.end instanceof Date ? ev.end : new Date(ev.end);
  return s < endOfDay(day) && e > dayStart(day);
};
export const isAllDayEvent = ev => Boolean(ev?.allDay);
export const isMultiDayEvent = ev => ev?.start && ev?.end && !sameDay(ev.start, new Date(ev.end.getTime() - 1));
export const isAllDayOrMulti = ev => isAllDayEvent(ev) || Boolean(ev?._continuesBefore || ev?._continuesAfter) || isMultiDayEvent(ev);
export const eventSegmentForDay = (ev, day) => {
  const ds = dayStart(day), de = endOfDay(day);
  const s = ev.start < ds ? ds : ev.start;
  const e = ev.end > de ? de : ev.end;
  return { ...ev, start: s, end: e, _segmentDate: dateKey(day), _continuesBefore: ev.start < ds, _continuesAfter: ev.end > de };
};
export const toDateInput = d => dateKey(d instanceof Date ? d : new Date(d));
export const toTimeInputValue = d => d instanceof Date ? `${d.getHours().toString().padStart(2,"0")}:${d.getMinutes().toString().padStart(2,"0")}` : "";
export const applyDateAndTime = (dateStr, timeStr = "00:00") => {
  const [y,m,d] = dateStr.split("-").map(Number);
  const [h,mi] = timeStr.split(":").map(Number);
  return new Date(y, m - 1, d, h || 0, mi || 0, 0, 0);
};
export const taskDurationToMinutes = (amount, unit) => {
  const n = Math.max(1, Number(amount) || 1);
  if (unit === "days") return Math.round(n * 24 * 60);
  if (unit === "hours") return Math.round(n * 60);
  return Math.round(n);
};
export const splitTaskDuration = mins => {
  const m = Math.max(1, Number(mins) || 30);
  if (m % 1440 === 0) return { amount: m / 1440, unit: "days" };
  if (m % 60 === 0) return { amount: m / 60, unit: "hours" };
  return { amount: m, unit: "minutes" };
};
export const formatTaskDuration = mins => {
  const { amount, unit } = splitTaskDuration(mins);
  if (unit === "days") return `${amount}d`;
  if (unit === "hours") return `${amount}h`;
  return `${amount}min`;
};
export const localDateFromKey = key => {
  if (!key || typeof key !== "string") return null;
  const [y, m, d] = key.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d, 0, 0, 0, 0);
};
export const localDateFromMonthKey = key => {
  if (!key || typeof key !== "string") return null;
  const [y, m] = key.slice(0, 7).split("-").map(Number);
  if (!y || !m) return null;
  return new Date(y, m - 1, 1, 0, 0, 0, 0);
};
export const monthKey = d => {
  const dt = d instanceof Date ? d : new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
};
export const taskScopeOf = task => task?.scope || "day";
export const taskAnchorDate = (task, fallbackDate = TODAY) => {
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
export const taskDayKey = (task, fallbackDate = TODAY) => dateKey(taskAnchorDate(task, fallbackDate));
export const taskWeekKey = (task, fallbackDate = TODAY) => {
  if (task?.weekKey) return dateKey(weekStart(localDateFromKey(task.weekKey) || taskAnchorDate(task, fallbackDate)));
  return dateKey(weekStart(taskAnchorDate(task, fallbackDate)));
};
export const taskMonthKey = (task, fallbackDate = TODAY) => task?.monthKey || monthKey(taskAnchorDate(task, fallbackDate));
export const taskPeriodPatchForScope = (scope, anchorDate = TODAY) => {
  const d = dayStart(anchorDate);
  if (scope === "week") return { taskDate: null, scheduled: null, weekKey: dateKey(weekStart(d)), monthKey: null };
  if (scope === "month") return { taskDate: null, scheduled: null, weekKey: null, monthKey: monthKey(d) };
  const key = dateKey(d);
  return { taskDate: key, scheduled: key, weekKey: null, monthKey: null };
};
export const withTaskPeriod = (task, anchorDate = TODAY) => {
  const scope = taskScopeOf(task);
  const inferredAnchor = taskAnchorDate(task, anchorDate);
  return { ...task, category: normalizeCategoryId(task?.category || "important"), scope, ...taskPeriodPatchForScope(scope, inferredAnchor) };
};
export const normalizeTasks = tasks => Array.isArray(tasks) ? tasks.map(t => withTaskPeriod(t, TODAY)) : [];
export const taskBelongsToPeriod = (task, scope, anchorDate = TODAY) => {
  const taskScope = taskScopeOf(task);
  if (taskScope !== scope) return false;
  if (taskSkippedPeriods(task).has(taskPeriodIdentity(task))) return false;
  if (scope === "week") return taskWeekKey(task) === dateKey(weekStart(anchorDate));
  if (scope === "month") return taskMonthKey(task) === monthKey(anchorDate);
  return taskDayKey(task) === dateKey(anchorDate);
};
export const shiftTaskPeriodDate = (date, scope, delta) => {
  if (scope === "week") return addDaysSafe(date, delta * 7);
  if (scope === "month") return addMonthsSafe(date, delta);
  return addDaysSafe(date, delta);
};
export const formatTaskPeriodLabel = (scope, date) => {
  if (scope === "week") {
    const start = weekStart(date);
    const end = addDaysSafe(start, 6);
    return `${formatWithDisplayTimezone(start, { month: "short", day: "numeric" })} – ${formatWithDisplayTimezone(end, { month: "short", day: "numeric" })}`;
  }
  if (scope === "month") return formatWithDisplayTimezone(date, { month: "long", year: "numeric" });
  return formatWithDisplayTimezone(date, { weekday: "short", month: "short", day: "numeric" });
};
export const taskCompletionTargetKey = task => taskScopeOf(task) === "day" ? taskDayKey(task) : dateKey(new Date());
export const taskHasCompletionStamp = task => Boolean(task?.completedDate || task?.completedAt || task?.doneAt || task?.completed_at);
export const taskCompletedDateKey = task => {
  if (!task?.done) return null;
  if (task.completedDate) return task.completedDate;
  const completedAt = task.completedAt || task.doneAt || task.completed_at;
  if (completedAt) {
    const d = new Date(completedAt);
    return Number.isNaN(d.getTime()) ? null : dateKey(d);
  }
  return null;
};
export const taskSeriesId = task => task?.parentTaskId || task?.seriesId || task?.id;
export const taskPeriodIdentity = task => {
  const scope = taskScopeOf(task);
  if (scope === "week") return `week:${taskWeekKey(task)}`;
  if (scope === "month") return `month:${taskMonthKey(task)}`;
  return `day:${taskDayKey(task)}`;
};
export const taskSkippedPeriods = task => new Set([...(task?.skippedTaskPeriods || []), ...(task?.recurrenceSkippedPeriods || [])]);
export const taskSamePeriod = (a, b) => taskScopeOf(a) === taskScopeOf(b) && taskPeriodIdentity(a) === taskPeriodIdentity(b);
export const taskExistsForPeriod = (tasks, root, probe) => {
  const rootSeries = taskSeriesId(root);
  return tasks.some(t => taskSeriesId(t) === rootSeries && taskSamePeriod(t, probe));
};
export function makeRecurringTaskOccurrence(root, occurrenceDate, index) {
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
export function taskOccurrenceFallsInPeriod(scope, occurrenceDate, anchorDate) {
  if (scope === "week") return dateKey(weekStart(occurrenceDate)) === dateKey(weekStart(anchorDate));
  if (scope === "month") return monthKey(occurrenceDate) === monthKey(anchorDate);
  return dateKey(occurrenceDate) === dateKey(anchorDate);
}
export function ensureRecurringTasksForPeriod(tasks, scope, anchorDate = TODAY) {
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
export const completedTasksForDateKey = (tasks, key) => {
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
export const LEVEL_TITLES = [
  "Tiny Sprout", "Routine Bud", "Bloom Apprentice", "Tempo Keeper", "Rhythm Builder",
  "Flow Mage", "Calendar Guardian", "Rhythm Queen", "Tempo Legend"
];
export const XP_PER_LEVEL = 500;
export const taskXPValue = task => {
  const pri = task?.priority === "high" ? 40 : task?.priority === "low" ? 15 : 25;
  const durationBonus = Math.min(30, Math.floor((Number(task?.duration) || 0) / 30) * 5);
  const recurringBonus = task?.recurrence || task?.parentTaskId ? 5 : 0;
  const mainThingBonus = categoryIs(task?.category, "main") ? 20 : 0;
  return pri + durationBonus + recurringBonus + mainThingBonus;
};
export const dateRangeKeys = (daysBack = 120, daysForward = 30) => {
  const keys = [];
  for (let i = -daysBack; i <= daysForward; i++) keys.push(dateKey(addDaysSafe(TODAY, i)));
  return keys;
};
export const hasJournalEntryForKey = (journal, key) => {
  const e = journal?.[key];
  return Boolean(e?.mood || e?.note || e?.gratitude?.some(Boolean) || e?.photos?.length || e?.blocks?.length || e?.tags?.length || Object.values(e?.highlights || {}).some(Boolean));
};
export const allDayTasksForKey = (tasks, key) => tasks.filter(t => taskScopeOf(t) === "day" && taskDayKey(t) === key);
export const dailyGameSummary = (tasks, journal, events, date = TODAY) => {
  const key = typeof date === "string" ? date : dateKey(date);
  const dayTasks = allDayTasksForKey(tasks, key);
  const completed = completedTasksForDateKey(tasks, key);
  const highDone = completed.filter(t => t.priority === "high").length;
  const journalDone = hasJournalEntryForKey(journal, key);
  const completionRatio = dayTasks.length ? Math.min(1, completed.length / dayTasks.length) : (completed.length ? 1 : 0);
  const allDone = dayTasks.length > 0 && dayTasks.every(t => t.done);
  const taskScore = Math.round(completionRatio * 40);
  const score = Math.min(100,
    taskScore +
    Math.min(15, highDone * 15) +
    (journalDone ? 15 : 0) +
    (allDone ? 15 : 0)
  );
  const rank = score >= 95 ? "S" : score >= 85 ? "A" : score >= 70 ? "B" : score >= 50 ? "C" : "D";
  return { key, dayTasks, completed, highDone, journalDone, allDone, score, rank };
};
export const productiveKeysFromData = (tasks, journal) => {
  const keys = new Set();
  tasks.forEach(t => {
    if (!t?.done) return;
    const k = taskCompletedDateKey(t) || (taskScopeOf(t) === "day" ? taskDayKey(t) : null);
    if (k) keys.add(k);
  });
  Object.keys(journal || {}).forEach(k => { if (hasJournalEntryForKey(journal, k)) keys.add(k); });
  return keys;
};
export const plannedTomorrowKeysFromData = tasks => {
  const keys = new Set();
  dateRangeKeys(120, 30).forEach(k => {
    const d = localDateFromKey(k) || TODAY;
    const tomorrowKey = dateKey(addDaysSafe(d, 1));
    if (allDayTasksForKey(tasks, tomorrowKey).length > 0) keys.add(k);
  });
  return keys;
};
export const countBackwardStreak = keySet => {
  let count = 0;
  let d = new Date(TODAY);
  while (keySet.has(dateKey(d))) { count++; d = addDaysSafe(d, -1); }
  return count;
};
export const buildDailyQuests = (tasks, journal, events, date = TODAY) => {
  const s = dailyGameSummary(tasks, journal, events, date);
  const quests = [
    { id: "three_tasks", icon: "✅", title: "Clear 3 tasks", desc: `${Math.min(s.completed.length, 3)}/3 completed`, done: s.completed.length >= 3, xp: 50 },
    { id: "priority", icon: "🎯", title: "Win 1 priority task", desc: `${Math.min(s.highDone, 1)}/1 high priority`, done: s.highDone >= 1, xp: 45 },
    { id: "journal", icon: "📔", title: "Write today’s journal", desc: s.journalDone ? "Entry saved" : "Reflect for the day", done: s.journalDone, xp: 35 },
    { id: "perfect_day", icon: "🌸", title: "Complete the day list", desc: s.dayTasks.length ? `${s.completed.length}/${s.dayTasks.length} day tasks` : "Add day tasks first", done: s.allDone, xp: 70 },
  ];
  return quests;
};
export const buildWeeklyRecap = (tasks, journal, events, date = TODAY) => {
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
    avgScore,
    rank,
    bestDayLabel: formatWithDisplayTimezone(bestDate, { weekday: "short" }),
    bestDayScore: best.score,
    topCategory: topCat,
    daily: summaries,
  };
};
export const buildWeeklyMissions = (tasks, journal, events, date = TODAY) => {
  const recap = buildWeeklyRecap(tasks, journal, events, date);
  const start = weekStart(date);
  const days = Array.from({ length: 7 }, (_, i) => addDaysSafe(start, i));
  const capacity = Math.max(60, (_workEnd - _workStart) * 60);
  const calmDays = days.filter(d => totalMins(events, d) <= capacity * 0.8).length;
  const missions = [
    { id: "week_tasks", icon: "✅", title: "Clear 15 tasks", value: recap.tasksDone, goal: 15, unit: "tasks", xp: 120 },
    { id: "week_priority", icon: "🎯", title: "Win 5 priority tasks", value: recap.highDone, goal: 5, unit: "priority", xp: 110 },
    { id: "week_journal", icon: "📔", title: "Journal 3 days", value: recap.journalDays, goal: 3, unit: "days", xp: 80 },
    { id: "week_balance", icon: "⚖️", title: "Keep 5 calm days", value: calmDays, goal: 5, unit: "days", xp: 90 },
  ];
  return missions.map(m => ({ ...m, done: m.value >= m.goal, pct: Math.min(100, Math.round((m.value / m.goal) * 100)), desc: `${Math.min(m.value, m.goal)}/${m.goal} ${m.unit}` }));
};
export const buildCombos = (tasks, journal, events, streaks = {}) => {
  const today = dailyGameSummary(tasks, journal, events, TODAY);
  const hasStampedEarlyClear = today.allDone && today.completed.length > 0 && today.completed.every(t => {
    const completedAt = t.completedAt || t.doneAt || t.completed_at;
    if (!completedAt) return false;
    const d = new Date(completedAt);
    return !Number.isNaN(d.getTime()) && d.getHours() < 18;
  });
  const combos = [
    { id: "triple", icon: "✨", title: "3x Task Combo", desc: "Complete 3 tasks today", done: today.completed.length >= 3, xp: 60 },
    { id: "flow", icon: "🌊", title: "Reflection Combo", desc: "Task + journal", done: today.completed.length > 0 && today.journalDone, xp: 75 },
    { id: "priority", icon: "🎯", title: "Power Start", desc: "Clear a priority task", done: today.highDone >= 1, xp: 50 },
    { id: "early", icon: "🌤️", title: "Early Clear", desc: "Finish day list before 6pm", done: hasStampedEarlyClear, xp: 80 },
    { id: "streak", icon: "🔥", title: "Streak Spark", desc: "Keep the bloom alive", done: (streaks.productive || 0) >= 3, xp: 65 },
  ];
  return combos;
};
export const buildPersonalLeaderboard = (tasks, journal, events) => dateRangeKeys(120, 0)
  .map(k => dailyGameSummary(tasks, journal, events, k))
  .filter(s => s.completed.length || s.journalDone || s.score > 0)
  .sort((a,b) => b.score - a.score || b.completed.length - a.completed.length)
  .slice(0, 5)
  .map((s, i) => ({ ...s, place: i + 1, label: formatWithDisplayTimezone((localDateFromKey(s.key) || TODAY), { month: "short", day: "numeric" }) }));
export const buildRhythmPersonality = (tasks, journal, events, skills) => {
  const completed = tasks.filter(t => t.done);
  const avgDur = completed.length ? completed.reduce((sum,t)=>sum + (Number(t.duration) || 0), 0) / completed.length : 0;
  const sorted = [...(skills || [])].sort((a,b) => b.points - a.points);
  const top = sorted[0]?.id || "balance";
  if (completed.length >= 10 && avgDur <= 45) return { icon: "⚡", type: "Task Sprinter", desc: "You build momentum through many quick wins." };
  if (top === "execution") return { icon: "🎯", type: "Deadline Warrior", desc: "You shine when important work needs to move." };
  if (top === "reflection") return { icon: "📔", type: "Calm Planner", desc: "You grow through reflection and intentional planning." };
  if (top === "discipline") return { icon: "🔥", type: "Rhythm Keeper", desc: "Your strength is showing up consistently." };
  if (top === "wellness" || top === "balance") return { icon: "🌿", type: "Balance Keeper", desc: "You are building a healthier rhythm across life and work." };
  return { icon: "🌸", type: "Bloom Builder", desc: "Your daily rhythm is still blooming." };
};
export const buildBadges = (tasks, journal, events, weekly, streaks) => {
  const completed = tasks.filter(t => t.done);
  const journalCount = Object.keys(journal || {}).filter(k => hasJournalEntryForKey(journal, k)).length;
  const productiveStreak = streaks?.productive ?? countBackwardStreak(productiveKeysFromData(tasks, journal));
  const taskStreak = streaks?.tasks ?? 0;
  const planningStreak = streaks?.planning ?? 0;
  const todayScore = dailyGameSummary(tasks, journal, events, TODAY).score;
  const importantDone = completed.filter(t => categoryIs(t.category, "important")).length;
  const mainThingDone = completed.filter(t => categoryIs(t.category, "main")).length;
  const highDone = completed.filter(t => t.priority === "high").length;
  const recurringDone = completed.filter(t => t.recurrence || t.parentTaskId).length;
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
    { id: "important_work_mage", icon: "🔮", name: "Important Work Mage", desc: "Complete 10 important tasks", unlocked: importantDone >= 10 },
    { id: "main_thing_finisher", icon: "🎯", name: "Main Thing Finisher", desc: "Complete 3 main thing tasks", unlocked: mainThingDone >= 3 },
    { id: "habit_charm", icon: "🔁", name: "Habit Charm", desc: "Complete 5 recurring tasks", unlocked: recurringDone >= 5 },
    { id: "night_planner", icon: "🌙", name: "Night Planner", desc: "Plan tomorrow’s day tasks", unlocked: tomorrowPlanned || planningStreak >= 2 },
    { id: "perfect_day", icon: "🏆", name: "Perfect Day", desc: "Score 95+ in a day", unlocked: todayScore >= 95 || perfectDays >= 1 },
    { id: "perfect_week", icon: "💫", name: "Perfect Week", desc: "Reach A-rank weekly average", unlocked: (weekly?.avgScore || 0) >= 85 },
    { id: "garden_guardian", icon: "🌼", name: "Garden Guardian", desc: "Grow 15 active garden days", unlocked: activeGardenDays >= 15 },
    { id: "consistency_gem", icon: "💎", name: "Consistency Gem", desc: "Stay productive for 30 days", unlocked: productiveStreak >= 30 },
  ];
};
export const skillRank = points => {
  const level = Math.max(1, Math.floor(points / 100) + 1);
  const pct = Math.min(100, Math.round((points % 100)));
  return { level, pct };
};
export const buildSkillStats = (tasks, journal, events) => {
  const completed = tasks.filter(t => t.done);
  const completedByCategory = id => completed.filter(t => categoryIs(t.category, id)).length;
  const journalCount = Object.keys(journal || {}).filter(k => hasJournalEntryForKey(journal, k)).length;
  const recurringDone = completed.filter(t => t.recurrence || t.parentTaskId).length;
  const highDone = completed.filter(t => t.priority === "high").length;
  const productiveStreak = countBackwardStreak(productiveKeysFromData(tasks, journal));
  const raw = [
    { id: "discipline", icon: "🔥", label: "Discipline", desc: "Recurring tasks and streaks", points: recurringDone * 24 + productiveStreak * 18 },
    { id: "wellness", icon: "🌿", label: "Wellness", desc: "Wellness and personal reset", points: completedByCategory("wellness") * 26 + completedByCategory("personal") * 10 },
    { id: "balance", icon: "⚖️", label: "Balance", desc: "Personal/light-task life balance", points: completedByCategory("personal") * 18 + completedByCategory("light") * 14 },
    { id: "execution", icon: "🎯", label: "Execution", desc: "Priority and main thing tasks completed", points: highDone * 30 + completedByCategory("main") * 28 + completed.length * 6 },
    { id: "reflection", icon: "📔", label: "Reflection", desc: "Journal consistency", points: journalCount * 28 },
  ];
  return raw.map(s => ({ ...s, ...skillRank(s.points) }));
};
export const MASCOT_STAGES = [
  { minLevel: 1,  emoji: "☁️", name: "Tiny Cloud",      note: "Every task gives your little cloud more sparkle." },
  { minLevel: 3,  emoji: "🌱", name: "Sprout Cloud",    note: "Your routine is starting to grow roots." },
  { minLevel: 6,  emoji: "🌸", name: "Bloom Cloud",     note: "You are turning small wins into a real rhythm." },
  { minLevel: 10, emoji: "✨", name: "Glow Cloud",      note: "Your consistency is becoming visible." },
  { minLevel: 15, emoji: "👑", name: "Crowned Cloud",   note: "You are protecting your rhythm like a pro." },
  { minLevel: 25, emoji: "🪄", name: "Tempo Wizard",    note: "Your calendar magic is getting powerful." },
  { minLevel: 40, emoji: "🏰", name: "Tempo Legend",    note: "Your daily rhythm is fully alive." },
];
export const buildMascotProgression = (level, streaks) => {
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
export const THEME_UNLOCK_RULES = {
  "tempo":      { unlocked: () => true, label: "Starter theme" },
  "pink-white": { unlocked: () => true, label: "Starter theme" },
  "ocean":      { unlocked: m => m.level >= 5, label: "Unlock: Level 5" },
  "sunset":     { unlocked: m => m.productiveStreak >= 3 || m.level >= 8, label: "Unlock: 3-day streak or Level 8" },
  "forest":     { unlocked: m => m.wellnessTasks >= 5 || m.level >= 10, label: "Unlock: 5 wellness tasks or Level 10" },
  "mono":       { unlocked: m => m.unlockedBadges >= 4 || m.level >= 12, label: "Unlock: 4 badges or Level 12" },
};
export const buildThemeUnlocksForStats = metrics => THEMES.map(t => {
  const rule = THEME_UNLOCK_RULES[t.id] || { unlocked: () => true, label: "Unlocked" };
  const unlocked = Boolean(rule.unlocked(metrics));
  return { id: t.id, label: t.label, unlocked, reason: unlocked ? "Unlocked" : rule.label };
});
export const buildMonthlyLifeGarden = (tasks, journal, events, date = TODAY) => {
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
    else if (summary.completed.length || summary.journalDone) { bloom = "🌱"; className = "sprout"; }
    return { key, day: day.getDate(), bloom, className, score: summary.score, rank: summary.rank, completed: summary.completed.length, journalDone: summary.journalDone };
  });
  const activeDays = cells.filter(Boolean).filter(c => !["empty","future"].includes(c.className)).length;
  const goldenDays = cells.filter(Boolean).filter(c => c.className === "gold").length;
  return { label: formatWithDisplayTimezone(new Date(year, month, 1), { month: "long", year: "numeric" }), cells, activeDays, goldenDays };
};
export const calculateGameStats = (tasks, journal, events) => {
  const completed = tasks.filter(t => t.done);
  const journalCount = Object.keys(journal || {}).filter(k => hasJournalEntryForKey(journal, k)).length;
  const todayQuests = buildDailyQuests(tasks, journal, events, TODAY);
  const productiveStreak = countBackwardStreak(productiveKeysFromData(tasks, journal));
  const journalKeySet = new Set(Object.keys(journal || {}).filter(k => hasJournalEntryForKey(journal, k)));
  const taskKeySet = new Set(completed.map(t => taskCompletedDateKey(t) || (taskScopeOf(t) === "day" ? taskDayKey(t) : null)).filter(Boolean));
  const planningKeySet = plannedTomorrowKeysFromData(tasks);
  const streaks = {
    productive: productiveStreak,
    tasks: countBackwardStreak(taskKeySet),
    journal: countBackwardStreak(journalKeySet),
    review: countBackwardStreak(journalKeySet),
    planning: countBackwardStreak(planningKeySet),
  };
  const skills = buildSkillStats(tasks, journal, events);
  const weekly = buildWeeklyRecap(tasks, journal, events, TODAY);
  const weeklyMissions = buildWeeklyMissions(tasks, journal, events, TODAY);
  const combos = buildCombos(tasks, journal, events, streaks);
  const badges = buildBadges(tasks, journal, events, weekly, streaks);
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
    wellnessTasks: completed.filter(t => categoryIn(t.category, ["wellness", "personal"])).length,
    unlockedBadges: badges.filter(b => b.unlocked).length,
  };
  return {
    totalXP, level, xpIntoLevel, nextXP: XP_PER_LEVEL, title,
    levelPct: Math.round((xpIntoLevel / XP_PER_LEVEL) * 100),
    today: dailyGameSummary(tasks, journal, events, TODAY),
    quests: todayQuests,
    weeklyMissions,
    combos,
    leaderboard: buildPersonalLeaderboard(tasks, journal, events),
    personality: buildRhythmPersonality(tasks, journal, events, skills),
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
export const createCategoryId = label => (label || "category").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,24) || `cat-${uid()}`;
export const isRecurringEvent = ev => Boolean(normalizeRecurrence(ev?.recurrence));

export const uid = () => (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 10);
export let _workStart = 9, _workEnd = 19;
export const setWorkHoursCtx = (ws, we) => { _workStart = ws; _workEnd = we; };
export const freeBlocks = (evs, d) => getFreeBlocks(evs, d, _workStart, _workEnd);

// ─── Persistence ─────────────────────────────────────────────────────────────
export const SER  = (_, v) => v instanceof Date ? { __d: v.toISOString() } : v;
export const DES  = (_, v) => v && v.__d ? new Date(v.__d) : v;
export const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v, SER)); } catch {} };
export const load = (k, fb) => { try { const r = localStorage.getItem(k); return r ? JSON.parse(r, DES) : fb; } catch { return fb; } };

// Guarantee event dates are always real Date objects regardless of source
// (localStorage JSON, Supabase JSONB, or in-memory — all can drift to strings)
export const reviveEvents = evs => evs.map(e => ({
  ...e,
  category: normalizeCategoryId(e?.category || "meeting", "meeting"),
  start: e.start instanceof Date ? e.start : new Date(e.start?.__d ?? e.start),
  end:   e.end   instanceof Date ? e.end   : new Date(e.end?.__d   ?? e.end),
}));

export const normalizeRecurrence = recurrence => {
  if (!recurrence) return null;
  if (typeof recurrence === "string") return { frequency: recurrence, interval: 1, endMode: "never" };
  return { interval: 1, endMode: "never", ...recurrence };
};
export const recurrenceDateKey = d => dateKey(dayStart(d));
export const recurrenceEndDate = rec => rec?.endDate || rec?.until || null;
export const recurrenceSkippedDates = rec => new Set([...(rec?.skippedDates || []), ...(rec?.exceptions || [])]);
export const occurrenceId = (eventId, date) => `${eventId}_r_${recurrenceDateKey(date)}`;
export const getBaseEventId = id => String(id).includes("_r_") ? String(id).split("_r_")[0] : id;
export const isOccurrence = ev => Boolean(ev?._recurring || ev?._baseId || String(ev?.id || "").includes("_r_"));
export const stripOccurrenceMeta = ev => {
  const { _recurring, _baseId, _occurrenceDate, _originalStart, _originalEnd, _segmentDate, _continuesBefore, _continuesAfter, ...base } = ev;
  return base;
};
export function stepRecurringDate(date, rec) {
  const r = normalizeRecurrence(rec);
  const freq = r?.frequency || r?.type || r;
  const interval = Math.max(1, Number(r?.interval || 1));
  if (freq === "daily") return addDaysSafe(date, interval);
  if (freq === "weekly") {
    if (Array.isArray(r?.byWeekdays) && r.byWeekdays.length) return addDaysSafe(date, 1);
    return addDaysSafe(date, 7 * interval);
  }
  if (freq === "weekdays") {
    let d = addDaysSafe(date, 1);
    while (d.getDay() === 0 || d.getDay() === 6) d = addDaysSafe(d, 1);
    return d;
  }
  if (freq === "monthly") {
    const next = addMonthsSafe(date, interval);
    if (r?.byMonthDay) {
      const max = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
      next.setDate(Math.min(Math.max(1, Number(r.byMonthDay) || date.getDate()), max));
    }
    return next;
  }
  return null;
}
export function weeksBetween(a, b) {
  return Math.floor((dayStart(b) - dayStart(a)) / (7 * 86400000));
}
export function shouldEmitOccurrence(baseEvent, occurrenceDate, rec, index) {
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
export function applyOccurrenceExceptions(baseEvent, occurrence) {
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
export function deleteSingleOccurrence(baseEvent, occurrenceDate) {
  const rec = normalizeRecurrence(baseEvent.recurrence) || {};
  const key = recurrenceDateKey(occurrenceDate);
  const skippedDates = [...new Set([...(rec.skippedDates || []), ...(rec.exceptions || []), key])];
  return { ...baseEvent, recurrence: { ...rec, skippedDates } };
}
export function modifySingleOccurrence(baseEvent, occurrenceDate, patch) {
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
export function createFollowingSeries(baseEvent, occurrenceDate, patch = {}) {
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
export function createNextRecurringTask(task, allTasks) {
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
export function expandRecurring(baseEvents, windowStart = addDaysSafe(TODAY, -RECURRENCE_WINDOW_DAYS), windowEnd = addDaysSafe(TODAY, RECURRENCE_WINDOW_DAYS)) {
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
      // Count only emitted occurrences, not scanned calendar days. This keeps
      // rules like Mon/Wed/Fri + “end after 3 times” accurate.
      let cursor = dayStart(ev.start);
      let emitted = 0;
      let safety = 0;
      const recWithoutCount = { ...rec, count: undefined };
      while (cursor <= winEnd && safety++ < RECURRENCE_SAFETY_LIMIT) {
        const emits = shouldEmitOccurrence(ev, cursor, recWithoutCount, emitted);
        if (emits) {
          if (rec.count && emitted >= Number(rec.count)) break;
          if (!sameDay(cursor, ev.start) && cursor >= winStart) {
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
          emitted += 1;
        }
        cursor = addDaysSafe(cursor, 1);
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
export const _t = (h, m, offsetDays = 0) => { const d = new Date(); d.setDate(d.getDate() + offsetDays); d.setHours(h, m, 0, 0); return d; };
export const INIT_EVENTS = [
  { id:"e1", title:"Team Standup",    start:_t(9,0),   end:_t(9,30),  calendar:"work",     category:"meeting",  fixed:true,  color:null, notes:"",                   recurrence:null    },
  { id:"e2", title:"Important Work",       start:_t(10,0),  end:_t(12,0),  calendar:"work",     category:"important",     fixed:false, color:null, notes:"Work on today’s main priority",recurrence:null   },
  { id:"e3", title:"Lunch",           start:_t(12,0),  end:_t(13,0),  calendar:"personal", category:"personal", fixed:true,  color:null, notes:"",                   recurrence:null    },
  { id:"e4", title:"Client Call",     start:_t(14,0),  end:_t(15,0),  calendar:"work",     category:"meeting",  fixed:true,  color:null, notes:"",                   recurrence:null    },
  { id:"e5", title:"Review & Light Tasks",  start:_t(15,15), end:_t(16,15), calendar:"work",     category:"light",    fixed:false, color:null, notes:"",                   recurrence:null    },
  { id:"e6", title:"Gym",             start:_t(18,0),  end:_t(19,0),  calendar:"personal", category:"wellness",   fixed:false, color:null, notes:"",                   recurrence:"daily" },
  { id:"e7", title:"Weekly Planning", start:_t(9,0,1), end:_t(10,0,1),calendar:"work",     category:"important",     fixed:false, color:null, notes:"",                   recurrence:"weekly"},
];

export const _deadline = (daysFromNow) => { const d = new Date(); d.setDate(d.getDate() + daysFromNow); return dateKey(d); };
export const INIT_TASKS = [
  { id:"t1", title:"Prepare Q3 budget slides", duration:90,  category:"important",  scope:"week",  done:false, deadline:_deadline(2),  priority:"high",   notes:"Slides 1-12",   scheduled:null },
  { id:"t2", title:"Reply to vendor emails",   duration:30,  category:"light", scope:"day",   done:false, deadline:null,          priority:"medium", notes:"",              scheduled:null },
  { id:"t3", title:"Read product brief",       duration:45,  category:"important",  scope:"day",   done:false, deadline:null,          priority:"medium", notes:"Section 3 & 4", scheduled:null },
  { id:"t4", title:"Book flights for offsite", duration:20,  category:"light", scope:"week",  done:true,  deadline:null,          priority:"low",    notes:"",              scheduled:null },
  { id:"t5", title:"Performance review",       duration:120, category:"important",  scope:"month", done:false, deadline:_deadline(14), priority:"high",   notes:"Cover Q1+Q2",   scheduled:null },
];

export const hasStoredUserData = uk => Boolean(load(`${uk}_ev`, null) || load(`${uk}_tk`, null) || load(`${uk}_journal`, null));
export const loadStoredEventsOrSeed = uk => reviveEvents(load(`${uk}_ev`, null) ?? INIT_EVENTS);
export const loadStoredTasksOrSeed = uk => normalizeTasks(load(`${uk}_tk`, null) ?? INIT_TASKS);

// ─── NLP helpers ──────────────────────────────────────────────────────────────
export function parseTimeStr(s, contextHint) {
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
export function parseTimeRange(s) {
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
export function parseDur(s) {
  s = s.trim().toLowerCase();
  const hm = s.match(/(\d+(?:\.\d+)?)\s*h(?:our)?s?/), mm = s.match(/(\d+)\s*m(?:in(?:ute)?s?)?/);
  let t = 0;
  if (hm) t += parseFloat(hm[1]) * 60;
  if (mm) t += parseInt(mm[1]);
  return t > 0 ? Math.round(t) : null;
}
export function parseDateRef(s, base) {
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
export function parseDateMention(raw, base = TODAY) {
  const m = raw.toLowerCase().match(/\b(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/);
  return m ? parseDateRef(m[1], base) : null;
}
export function parseDayWindow(raw) {
  const msg = raw.toLowerCase();
  if (/\bmorning\b/.test(msg)) return { label: "morning", start: 9 * 60, end: 12 * 60 };
  if (/\bafternoon\b/.test(msg)) return { label: "afternoon", start: 13 * 60, end: 17 * 60 };
  if (/\bevening\b/.test(msg)) return { label: "evening", start: 17 * 60, end: 19 * 60 };
  if (/\bimportant work\b/.test(msg)) return { label: "protected block", start: _workStart * 60, end: _workEnd * 60 };
  return null;
}
export function fitFreeSlot(events, date, window, duration) {
  const blocks = freeBlocks(events, date).map(b => ({
    start: Math.max(b.start, window.start),
    end: Math.min(b.end, window.end),
  })).filter(b => b.end - b.start >= duration);
  return blocks[0] || null;
}
export function eventFromWindow(title, date, startMin, endMin, category = "important") {
  const st = new Date(date), en = new Date(date);
  st.setHours(Math.floor(startMin / 60), startMin % 60, 0, 0);
  en.setHours(Math.floor(endMin / 60), endMin % 60, 0, 0);
  return {
    id: "e" + uid(),
    title,
    start: st,
    end: en,
    calendar: isPersonalCategory(category) ? "personal" : "work",
    category,
    fixed: false,
    color: null,
    notes: "",
    recurrence: null,
  };
}
export function cleanTitle(text) {
  return text
    .replace(/\b(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|morning|afternoon|evening)\b/gi, "")
    .replace(/\b(for|probably|about|around|a|an|the|session|block|task|work|of)\b/gi, " ")
    .replace(/\d+(?:\.\d+)?\s*(?:h(?:our)?s?|min(?:ute)?s?)/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}
export function inferCategory(title) {
  if (/gym|workout|run|yoga|exercise|meditation/i.test(title)) return "wellness";
  if (/deep|proposal|report|write|code|study|design|draft|finish|strategy/i.test(title)) return "important";
  if (/lunch|dinner|breakfast|coffee|eat|family|friend/i.test(title)) return "personal";
  if (/email|admin|review|catch-up|invoice|expense/i.test(title)) return "light";
  return "meeting";
}
export function buildGreeting(events, tasks) {
  const h = new Date().getHours();
  const g = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  const te = getEventsOnDay(events, TODAY);
  const ot = tasks.filter(t => !t.done && taskBelongsToPeriod(t, "day", TODAY));
  const fb = freeBlocks(events, TODAY)[0];
  const bs = fb ? ` First free: ${minsToTime(fb.start)}–${minsToTime(fb.end)}.` : "";
  return `${g} ✨ ${te.length} event${te.length !== 1 ? "s" : ""} and ${ot.length} open task${ot.length !== 1 ? "s" : ""} today.${bs} What do you need?`;
}

export function processMessage(input, events, tasks, pending) {
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
    return { text: `Here's what I can do 🌸\n\n📅 "What's on today?" / "Show my week"\n⏰ "When's my next free 2-hour block?"\n➕ "Add a 1-hour gym session tomorrow morning"\n✅ "I need to finish the proposal by Friday, probably 3 hours"\n🔄 "Move standup to 10am"\n🧹 "Clear my Friday afternoon"\n⚖️ "I only have 4 hours today, what should I prioritise?"\n📊 "How busy am I?" / "What did I not finish this week?"`, newEv, newTk, newP };

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
    for (let i = 0; i < 7; i++) { const d = new Date(mon); d.setDate(mon.getDate() + i); const evs = getEventsOnDay(events, d); if (evs.length) lines.push(`${formatWithDisplayTimezone(d, { weekday: "short", month: "short", day: "numeric" })}: ${evs.length} event${evs.length !== 1 ? "s" : ""}`); }
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

  if (/\b(important work time)\b.*\b(left|remaining|available)\b/.test(msg)) {
    let td = TODAY; const dm = msg.match(/\b(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/);
    if (dm) { const r = parseDateRef(dm[1], TODAY); if (r) td = r; }
    const workStart = _workStart * 60, workEnd = _workEnd * 60;
    const blocks = freeBlocks(events, td).filter(b => b.end > workStart && b.start < workEnd);
    const mins = blocks.reduce((sum, b) => sum + Math.max(0, Math.min(b.end, workEnd) - Math.max(b.start, workStart)), 0);
    text = `You have about ${Math.round(mins / 60 * 10) / 10}h of available work time left on ${fmtDay(td)}.\n\n${blocks.length ? blocks.map(b => `• ${minsToTime(Math.max(b.start, workStart))}–${minsToTime(Math.min(b.end, workEnd))}`).join("\n") : "No clean work blocks left."}`;
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
    text = picked.length ? `With about ${Math.round(cap / 60 * 10) / 10}h, I'd protect these first:\n\n${picked.map(t => `• ${t.title} (${t.duration}min, ${t.priority}${t.deadline ? `, due ${t.deadline}` : ""})`).join("\n")}\n\nTrade-off: push lighter tasks and anything without a deadline to tomorrow.` : "You don't have open tasks to prioritise right now.";
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

  if (/\b(hours?|time)\b.*\b(admin|meetings?|important work|personal)\b/.test(msg)) {
    const cat = /admin/.test(msg) ? "light" : /meeting/.test(msg) ? "meeting" : /personal/.test(msg) ? "personal" : "important";
    const mins = events.filter(e => categoryIs(e.category, cat)).reduce((sum, e) => sum + (e.end - e.start) / 60000, 0);
    const label = CATEGORIES.find(c => c.id === cat)?.label || cat;
    text = `You've scheduled about ${Math.round(mins / 60 * 10) / 10}h of ${label.toLowerCase()} in the current schedule data.`;
    return { text, newEv, newTk, newP };
  }

  if (/\b(underestimating|estimates?|adjust).*\b(design|important work|tasks?)\b/.test(msg)) {
    const updated = tasks.map(t => /design/i.test(t.title) || categoryIs(t.category, "important") ? { ...t, duration: Math.ceil(t.duration * 1.25 / 5) * 5 } : t);
    const changed = updated.filter((t, i) => t.duration !== tasks[i].duration);
    if (!changed.length) text = "I don't see matching design/important-work tasks to adjust yet.";
    else { newTk = updated; text = `Adjusted estimates up by 25% for ${changed.length} design/important-work task${changed.length !== 1 ? "s" : ""}. I'll be more conservative with those.`; }
    return { text, newEv, newTk, newP };
  }

  if (/\b(how am i doing|am i on track|progress|productivity)\b/.test(msg)) {
    const dn = tasks.filter(t => t.done).length, tot = tasks.length, pct = tot > 0 ? Math.round(dn / tot * 100) : 0;
    const qs = ["Keep going! 💪", "You're crushing it! 🌟", "Keep going gently ✨", "Amazing progress! 🎉"];
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

  // Protected blocks — "Block out Wednesday afternoon"
  if (/\b(block out|hold|protect)\b.*\b(morning|afternoon|evening|deep)\b/i.test(raw)) {
    const td = parseDateMention(raw) || TODAY;
    const win = parseDayWindow(raw) || { label: "protected block", start: _workStart * 60, end: _workEnd * 60 };
    const title = /deep/i.test(raw) ? "Protected time" : "Protected time";
    const ev = eventFromWindow(title, td, win.start, win.end, "important");
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
    const cat = inferCategory(title) === "meeting" ? "important" : inferCategory(title);
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
    if (/gym|workout|run|yoga|exercise/i.test(raw)) cat = "wellness";
    else if (/deep|report|write|code|study/i.test(raw)) cat = "important";
    else if (/lunch|dinner|breakfast|coffee|eat/i.test(raw)) cat = "personal";
    else if (/email|admin|review|check/i.test(raw)) cat = "light";
    // Try explicit range "1:30pm to 3pm"
    const range = parseTimeRange(timeStr);
    if (range) {
      const st = new Date(td); st.setHours(range.start.h, range.start.m, 0, 0);
      const en = new Date(td); en.setHours(range.end.h,   range.end.m,   0, 0);
      const dur = Math.round((en - st) / 60000);
      const ev = { id: "e" + uid(), title, start: st, end: en, calendar: cat === "personal" || cat === "wellness" ? "personal" : "work", category: cat, fixed: false, color: null, notes: "", recurrence: null };
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
        const ev = { id: "e" + uid(), title, start: st, end: en, calendar: cat === "personal" || cat === "wellness" ? "personal" : "work", category: cat, fixed: false, color: null, notes: "", recurrence: null };
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
    let cat = "light";
    if (/gym|workout|health/i.test(title)) cat = "wellness";
    else if (/write|research|report|build|code|study|plan|design|prepare/i.test(title)) cat = "important";
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

// ─── Journal Constants ────────────────────────────────────────────────────────

export const MEMORY_STORAGE_BUCKET = "memory-images";
export const MEMORY_SIGNED_URL_SECONDS = 60 * 60 * 24 * 7;
export const MEMORY_IMAGE_LIMIT_PER_ENTRY = 6;
export const MEMORY_MAX_ORIGINAL_BYTES = 15 * 1024 * 1024;
export const MEMORY_MAX_IMAGE_EDGE = 1600;
export const MEMORY_THUMB_IMAGE_EDGE = 300;
export const MEMORY_ENCRYPTION_VERSION = 1;
export const MEMORY_CRYPTO_CONTEXT = (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_SUPABASE_URL) ? process.env.NEXT_PUBLIC_SUPABASE_URL : "local";

export const hasWebCrypto = () => typeof crypto !== "undefined" && Boolean(crypto.subtle) && typeof TextEncoder !== "undefined" && typeof TextDecoder !== "undefined";
export const bytesToBase64 = bytes => {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.slice(i, i + chunk));
  }
  return btoa(binary);
};
export const base64ToBytes = b64 => Uint8Array.from(atob(b64 || ""), c => c.charCodeAt(0));

export const JOURNAL_MOODS = [
  { id:"rad",    emoji:"😁", label:"Rad",    color:"#4CAF82" },
  { id:"good",   emoji:"😊", label:"Good",   color:"#7CB9E8" },
  { id:"meh",    emoji:"😐", label:"Meh",    color:"#FFD700" },
  { id:"bad",    emoji:"😔", label:"Bad",    color:"#FF8C69" },
  { id:"awful",  emoji:"😢", label:"Awful",  color:"#C97FC9" },
];
export const JOURNAL_ACTIVITIES = [
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
  { id:"sleep",     emoji:"😴",   label:"Good sleep",group:"Wellness"   },
  { id:"gym",       emoji:"💪",   label:"Gym",       group:"Wellness"   },
  { id:"outdoors",  emoji:"🌿",   label:"Outdoors",  group:"Wellness"   },
  { id:"meditation",emoji:"🧘",   label:"Meditation",group:"Wellness"   },
  { id:"shopping",  emoji:"🛍️",   label:"Shopping",  group:"Other"    },
  { id:"travel",    emoji:"✈️",   label:"Travel",    group:"Other"    },
  { id:"food",      emoji:"🍜",   label:"Good food", group:"Other"    },
  { id:"relax",     emoji:"🛁",   label:"Relax",     group:"Other"    },
];
export const JOURNAL_PROMPTS = [
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
export const MEMORY_TAGS = ["Work", "Date", "Family", "Friends", "Food", "Travel", "Fitness", "Personal", "Achievement", "Rest Day"];
export const SCRAPBOOK_STICKERS = ["🌸", "✨", "🎀", "💌", "📷", "🫶", "🐰", "☕", "🍰", "🌙", "💖", "✅", "🎯", "🥹", "🌈", "🧸"];

export const MEMORY_ASSET_BASE = "/memory-assets";
export const MEMORY_BACKGROUNDS = [
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
export const COZY_STICKER_PACK = Array.from({ length: 12 }, (_, i) => ({
  id: `cozy-${i+1}`,
  label: `Cozy ${i+1}`,
  src: `${MEMORY_ASSET_BASE}/stickers/cozy/${i+1}.png`,
}));
export const memoryBackgroundById = id => MEMORY_BACKGROUNDS.find(b => b.id === id) || MEMORY_BACKGROUNDS[0];
export const memoryBackgroundStyle = id => {
  const bg = memoryBackgroundById(id);
  return bg?.src ? { backgroundImage: `linear-gradient(rgba(255,255,255,.76), rgba(255,255,255,.82)), url(${bg.src})` } : {};
};
export const normalizeMemoryEntry = entry => ({
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

export const sanitizeMemoryPhotoForStorage = photo => ({
  id: photo?.id || "p" + uid(),
  storagePath: photo?.storagePath || "",
  thumbStoragePath: photo?.thumbStoragePath || "",
  bucket: photo?.bucket || MEMORY_STORAGE_BUCKET,
  caption: photo?.caption || "",
  name: photo?.name || "Memory photo",
  createdAt: photo?.createdAt || new Date().toISOString(),
});
export const sanitizeMemoryEntryForStorage = entry => {
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
export const sanitizeMemoryJournalForStorage = journal => {
  const out = {};
  Object.entries(journal || {}).forEach(([key, entry]) => {
    out[key] = sanitizeMemoryEntryForStorage(entry);
  });
  return out;
};
export const normalizeMemoryJournalForState = journal => {
  const out = {};
  Object.entries(journal || {}).forEach(([key, entry]) => {
    out[key] = normalizeMemoryEntry(entry);
  });
  return out;
};
export const isEncryptedMemoryJournal = value => Boolean(value?.__tempoEncryptedMemoryBook && value?.v === MEMORY_ENCRYPTION_VERSION && value?.data && value?.iv);
export async function deriveMemoryCryptoKey(userId) {
  if (!hasWebCrypto() || !userId) return null;
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(`tempo-memory-book:${userId}:${MEMORY_CRYPTO_CONTEXT}`),
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
export async function encryptMemoryJournalForStorage(userId, journal) {
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
export async function decryptMemoryJournalFromStorage(userId, stored) {
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
    console.warn("Could not decrypt Journal data", err);
    return {};
  }
}
export async function saveJournalLocal(userKey, userId, journal) {
  try { save(`${userKey}_journal`, await encryptMemoryJournalForStorage(userId, journal)); } catch (err) { console.warn("Could not encrypt Journal local cache", err); }
}
export async function loadJournalLocal(userKey, userId) {
  return decryptMemoryJournalFromStorage(userId, load(`${userKey}_journal`, {}));
}
export const memoryPhotoSrc = (photo, signedUrls = {}, preferThumb = false) => {
  if (!photo) return "";
  if (photo.previewSrc || photo.src) return photo.previewSrc || photo.src;
  const preferred = preferThumb ? photo.thumbStoragePath : photo.storagePath;
  const fallback = preferThumb ? photo.storagePath : photo.thumbStoragePath;
  return signedUrls?.[preferred] || signedUrls?.[fallback] || "";
};
export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
export async function prepareJournalPhotosFromFiles(files, existingCount = 0, onProgress = null) {
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
export const memoryEntryCover = entry => {
  const e = normalizeMemoryEntry(entry);
  return e.photos.find(p => p.id === e.coverPhotoId) || e.photos[0] || null;
};
export const memoryTagLabel = tag => String(tag || "").trim();
// ─── Daily Entry Modal ────────────────────────────────────────────────────────

// ─── Cross-device merge helpers ──────────────────────────────────────────────
// Conservative last-write-wins merge by stable IDs / date keys. This preserves
// items created on different devices instead of replacing an entire collection.
export const nextDeviceId = () => {
  if (typeof localStorage === "undefined") return "server";
  let id = localStorage.getItem("tempo_device_id");
  if (!id) { id = "dev_" + uid(); localStorage.setItem("tempo_device_id", id); }
  return id;
};
const recordModifiedTime = item => {
  // Use actual mutation timestamps only. Do not use event start/deadline as a
  // fallback; otherwise a tombstone created today can fail to delete a future
  // event on another device because the future start date looks "newer".
  const raw = item?.updatedAt || item?.modifiedAt || item?.deletedAt || item?.completedAt || item?.createdAt || null;
  const t = raw ? new Date(raw).getTime() : 0;
  return Number.isFinite(t) ? t : 0;
};
export const normalizeDeletedRecordsForMerge = value => {
  const src = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const clean = obj => Object.fromEntries(Object.entries(obj || {}).filter(([id, ts]) => id && ts));
  return { events: clean(src.events), tasks: clean(src.tasks), calendars: clean(src.calendars) };
};
const mergeTombstoneMaps = (a = {}, b = {}) => {
  const out = { ...(a || {}) };
  Object.entries(b || {}).forEach(([id, ts]) => {
    const prev = out[id];
    const nextTime = ts ? new Date(ts).getTime() : 0;
    const prevTime = prev ? new Date(prev).getTime() : 0;
    if (!prev || nextTime >= prevTime) out[id] = ts;
  });
  return out;
};
export const mergeDeletedRecords = (cloud = {}, local = {}) => {
  const c = normalizeDeletedRecordsForMerge(cloud);
  const l = normalizeDeletedRecordsForMerge(local);
  return {
    events: mergeTombstoneMaps(c.events, l.events),
    tasks: mergeTombstoneMaps(c.tasks, l.tasks),
    calendars: mergeTombstoneMaps(c.calendars, l.calendars),
  };
};
export const mergeRecordsById = (cloudList = [], localList = [], tombstones = {}) => {
  const map = new Map();
  [...(Array.isArray(cloudList) ? cloudList : []), ...(Array.isArray(localList) ? localList : [])].forEach(item => {
    if (!item?.id) return;
    const deletedAt = item.deletedAt || tombstones[item.id] || null;
    const itemTime = recordModifiedTime(item);
    const deletedTime = deletedAt ? new Date(deletedAt).getTime() : 0;
    if (deletedTime && deletedTime >= itemTime) {
      map.delete(item.id);
      return;
    }
    const prev = map.get(item.id);
    if (!prev || itemTime >= recordModifiedTime(prev)) map.set(item.id, item);
  });
  return [...map.values()].filter(item => {
    const deletedAt = tombstones[item.id];
    if (!deletedAt) return !item.deletedAt;
    return new Date(deletedAt).getTime() < recordModifiedTime(item);
  });
};
const mergeSettingsUpdatedAt = (cloud = {}, local = {}) => {
  const out = { ...(cloud || {}) };
  Object.entries(local || {}).forEach(([key, ts]) => {
    const lt = ts ? new Date(ts).getTime() : 0;
    const ct = out[key] ? new Date(out[key]).getTime() : 0;
    if (!out[key] || lt >= ct) out[key] = ts;
  });
  return out;
};
const chooseSettingValue = (key, cloudSettings, localSettings, cloudUpdatedAt, localUpdatedAt) => {
  const cMap = cloudSettings.settingsUpdatedAt || {};
  const lMap = localSettings.settingsUpdatedAt || {};
  const ct = cMap[key] ? new Date(cMap[key]).getTime() : (cloudUpdatedAt ? new Date(cloudUpdatedAt).getTime() : 0);
  const lt = lMap[key] ? new Date(lMap[key]).getTime() : (localUpdatedAt ? new Date(localUpdatedAt).getTime() : 0);
  if (localSettings[key] === undefined) return cloudSettings[key];
  if (cloudSettings[key] === undefined) return localSettings[key];
  return lt >= ct ? localSettings[key] : cloudSettings[key];
};
export const mergeMemoryJournalsByDate = (cloudJournal = {}, localJournal = {}) => {
  const out = { ...(cloudJournal || {}) };
  Object.entries(localJournal || {}).forEach(([key, localEntry]) => {
    const cloudEntry = out[key];
    const lt = recordModifiedTime(localEntry);
    const ct = recordModifiedTime(cloudEntry);
    if (!cloudEntry || lt >= ct) out[key] = localEntry;
  });
  return out;
};
export const mergeTempoData = (cloud = {}, local = {}) => {
  const cloudSettings = cloud.settings || {};
  const localSettings = local.settings || {};
  const deletedRecords = mergeDeletedRecords(cloudSettings.deletedRecords, localSettings.deletedRecords);
  const settingsUpdatedAt = mergeSettingsUpdatedAt(cloudSettings.settingsUpdatedAt, localSettings.settingsUpdatedAt);
  const mergedSettings = {
    ...cloudSettings,
    ...localSettings,
    fontSize: chooseSettingValue("fontSize", cloudSettings, localSettings, cloud.updated_at, local.updated_at),
    darkMode: chooseSettingValue("darkMode", cloudSettings, localSettings, cloud.updated_at, local.updated_at),
    theme: chooseSettingValue("theme", cloudSettings, localSettings, cloud.updated_at, local.updated_at),
    workStart: chooseSettingValue("workStart", cloudSettings, localSettings, cloud.updated_at, local.updated_at),
    workEnd: chooseSettingValue("workEnd", cloudSettings, localSettings, cloud.updated_at, local.updated_at),
    mealBreaks: chooseSettingValue("mealBreaks", cloudSettings, localSettings, cloud.updated_at, local.updated_at),
    planningRules: chooseSettingValue("planningRules", cloudSettings, localSettings, cloud.updated_at, local.updated_at),
    notifs: chooseSettingValue("notifs", cloudSettings, localSettings, cloud.updated_at, local.updated_at),
    pushEnabled: chooseSettingValue("pushEnabled", cloudSettings, localSettings, cloud.updated_at, local.updated_at),
    timezone: chooseSettingValue("timezone", cloudSettings, localSettings, cloud.updated_at, local.updated_at),
    journal: mergeMemoryJournalsByDate(cloudSettings.journal || {}, localSettings.journal || {}),
    journalActivities: mergeRecordsById(cloudSettings.journalActivities || [], localSettings.journalActivities || []),
    calendars: normalizeCalendars(mergeRecordsById(cloudSettings.calendars || CALENDARS, localSettings.calendars || CALENDARS, deletedRecords.calendars)),
    hiddenCals: chooseSettingValue("hiddenCals", cloudSettings, localSettings, cloud.updated_at, local.updated_at) || [],
    categories: normalizeCategories(mergeRecordsById(cloudSettings.categories || [], localSettings.categories || [])),
    templates: mergeRecordsById(cloudSettings.templates || [], localSettings.templates || []),
    memoryTags: [...new Set([...(cloudSettings.memoryTags || []), ...(localSettings.memoryTags || [])])],
    memoryStorageMigratedAt: localSettings.memoryStorageMigratedAt || cloudSettings.memoryStorageMigratedAt || null,
    settingsUpdatedAt,
    deletedRecords,
  };
  return {
    events: reviveEvents(mergeRecordsById(cloud.events || [], local.events || [], deletedRecords.events)),
    tasks: normalizeTasks(mergeRecordsById(cloud.tasks || [], local.tasks || [], deletedRecords.tasks)),
    settings: mergedSettings,
  };
};
