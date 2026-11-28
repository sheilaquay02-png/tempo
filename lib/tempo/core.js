import { normalizeDateKey as normalizeTempoDateKey, normalizeMonthKey as normalizeTempoMonthKey, normalizeTimeZone as normalizeTempoTimeZone } from "./dateTime.js";

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
export const EVENT_DRAG_HOLD_MS = 360;
export const EVENT_DRAG_MOVE_CANCEL_PX = 8;

export const DATA_MIGRATION_VERSION = 17;
export const SYNC_HARDENING_PHASE = 20;
export const SYNC_TOMBSTONE_RETENTION_DAYS = 90;
export const SYNC_CONFLICT_LOG_LIMIT = 40;
export const SYNC_DATASET_KEYS = [
  "events", "tasks", "calendars", "rituals", "ritualCompletions",
  "habits", "habitCompletions", "dailyCheckIns", "tomorrowResets",
  "weeklyResets", "affirmations",
];
export const LEGACY_FOCUS_SETTING_KEYS = [
  "focusSessions", "focusHistory", "focusSettings", "focusLog", "focusStats",
  "focusMode", "focusBlocks", "focusDuration", "focusProgress", "linkedFocusTask",
  "linkedFocusTaskId", "focusTaskId", "bossHp", "bossHP", "bossBattle", "bosses",
  "bossStats", "bossBattleStats", "taskHp", "taskHP", "dailyStats", "productivityStats"
];
export const LEGACY_TASK_FIELD_KEYS = [
  "focusSessionId", "focusSessions", "focusHistory", "linkedFocusTask", "linkedFocusTaskId",
  "focusDuration", "focusProgress", "focusStartedAt", "focusCompletedAt", "focusBlockId",
  "bossHp", "bossHP", "bossDamage", "bossBattle", "taskHp", "taskHP", "hp", "maxHp"
];
export const LEGACY_LOCAL_STORAGE_KEY_PATTERN = /(^|_)(focus|boss)(_|$)|focusmode|pomodoro|bossbattle|taskhp/i;

export const CALENDARS = [
  { id: "personal", name: "Personal", color: "#FF7BAC", account: null, source: "tempo", googleCalendarId: null, readOnly: false, visible: true, syncEnabled: true },
  { id: "work",     name: "Work",     color: "#B08AE0", account: null, source: "tempo", googleCalendarId: null, readOnly: false, visible: true, syncEnabled: true },
];

export const normalizeCalendars = value => {
  const source = Array.isArray(value) && value.length ? value : CALENDARS;
  const seen = new Set();
  const clean = [];
  source.filter(Boolean).forEach((cal, i) => {
    const rawId = String(cal.id || cal.googleCalendarId || cal.name || `calendar-${i + 1}`).trim().toLowerCase();
    let id = rawId.replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "") || `calendar-${i + 1}`;
    let suffix = 2;
    while (seen.has(id)) id = `${id}-${suffix++}`;
    seen.add(id);
    const sourceType = cal.source === "google" ? "google" : "tempo";
    clean.push({
      id,
      name: String(cal.name || "Calendar").trim() || "Calendar",
      color: /^#[0-9a-f]{6}$/i.test(String(cal.color || "")) ? cal.color : (CALENDARS[i % CALENDARS.length]?.color || "#FF7BAC"),
      account: cal.account ?? null,
      source: sourceType,
      googleCalendarId: sourceType === "google" ? String(cal.googleCalendarId || cal.id || "") : null,
      readOnly: Boolean(cal.readOnly),
      visible: cal.visible !== false,
      syncEnabled: cal.syncEnabled !== false,
      googleAccessRole: cal.googleAccessRole || null,
      googlePrimary: Boolean(cal.googlePrimary),
      googleSummaryOverride: cal.googleSummaryOverride || null,
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
  "deep work": "important",
  "deep-work": "important",
  "important work": "important",
  "important-work": "important",
  boss: "main",
  "boss battle": "main",
  "boss-battle": "main",
  "main thing": "main",
  "main-thing": "main",
  admin: "light",
  "admin task": "light",
  "light task": "light",
  "light-task": "light",
  health: "wellness",
  wellbeing: "wellness",
  "well-being": "wellness",
};

export const normalizeCategoryId = (id, fallback = "important") => {
  const raw = String(id || fallback || "important").trim().toLowerCase();
  if (!raw) return fallback;
  const dashed = raw.replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
  return CATEGORY_ID_ALIASES[raw] || CATEGORY_ID_ALIASES[dashed] || dashed || fallback;
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
    description: "Cream & Blush",
    swatch: ["#D989A2", "#F8E7E0", "#FBF4EC"],
    light: "--bg:#FBF4EC;--bg2:#FFFFFF;--bg3:#FFF9F5;--bg4:#F8E7E0;--border:#EEDDD2;--text:#46342D;--text2:#7A5F54;--text3:#A88D82;",
    dark:  "--bg:#120807;--bg2:#241210;--bg3:#351C18;--bg4:#4A2B25;--border:#6A453A;--text:#FFF3EC;--text2:#E8C4B7;--text3:#B58D7E;",
    accent: "--accent:#D989A2;--accent2:#EAB4C2;--accent3:#F4CFD8;--accent-rgb:217,137,162;",
  },
  {
    id: "pink-white",
    label: "Floral",
    description: "Layered rose pink",
    swatch: ["#FFA2AA", "#FFBCC2", "#FEE3E2"],
    light: "--bg:#FFD6D8;--bg2:#FFF5F6;--bg3:#FFE5E8;--bg4:#FFC4CB;--border:#F1A9B5;--text:#41242E;--text2:#7A4654;--text3:#A76876;",
    dark:  "--bg:#13040A;--bg2:#270A16;--bg3:#3A1024;--bg4:#5A1937;--border:#823257;--text:#FFF0F5;--text2:#F4A7C2;--text3:#D0779A;",
    accent: "--accent:#CB416B;--accent2:#E0678C;--accent3:#F4A6BE;--accent-rgb:203,65,107;",
  },
  {
    id: "ocean",
    label: "Ocean",
    description: "Teal & Blue",
    swatch: ["#20B2AA", "#5F9EA0", "#E0FFFF"],
    light: "--bg:#F0FAFA;--bg2:#FFFFFF;--bg3:#E6F7F7;--bg4:#CCF0EE;--border:#99DDD9;--text:#0D3535;--text2:#2A6060;--text3:#4A8888;",
    dark:  "--bg:#041016;--bg2:#09222E;--bg3:#10374A;--bg4:#19536A;--border:#24728B;--text:#E8FFFF;--text2:#86E5DD;--text3:#54B4B4;",
    accent: "--accent:#20B2AA;--accent2:#40C8C0;--accent3:#80DDD8;--accent-rgb:32,178,170;",
  },
  {
    id: "sunset",
    label: "Sunset",
    description: "Coral & Orange",
    swatch: ["#FF7050", "#FF9040", "#FFF8F0"],
    light: "--bg:#FFF8F0;--bg2:#FFFFFF;--bg3:#FFF2E6;--bg4:#FFE4CC;--border:#FFCCA0;--text:#3A1800;--text2:#7A3A10;--text3:#A05A30;",
    dark:  "--bg:#170900;--bg2:#2A1100;--bg3:#421D00;--bg4:#642E06;--border:#864715;--text:#FFF2E5;--text2:#FFBA79;--text3:#D98247;",
    accent: "--accent:#FF7050;--accent2:#FF9040;--accent3:#FFBA80;--accent-rgb:255,112,80;",
  },
  {
    id: "forest",
    label: "Forest",
    description: "Green & Earthy",
    swatch: ["#2E8B57", "#8FBC8F", "#F5F9F0"],
    light: "--bg:#F5F9F0;--bg2:#FFFFFF;--bg3:#EAF4E4;--bg4:#D4EAC8;--border:#A8D898;--text:#0D2810;--text2:#2A5530;--text3:#4A7850;",
    dark:  "--bg:#041006;--bg2:#0B2110;--bg3:#12351C;--bg4:#1E512D;--border:#2E6F42;--text:#ECFFE8;--text2:#9BE2A5;--text3:#68AE76;",
    accent: "--accent:#2E8B57;--accent2:#50A870;--accent3:#90CC90;--accent-rgb:46,139,87;",
  },
  {
    id: "mono",
    label: "Mono",
    description: "Minimal Grayscale",
    swatch: ["#36454F", "#708090", "#F8F8F8"],
    light: "--bg:#F8F8F8;--bg2:#FFFFFF;--bg3:#F0F0F0;--bg4:#E4E4E4;--border:#CCCCCC;--text:#1A1A1A;--text2:#555555;--text3:#888888;",
    dark:  "--bg:#070707;--bg2:#151217;--bg3:#241F28;--bg4:#38313D;--border:#554C5C;--text:#F7F3FA;--text2:#C9BECF;--text3:#91859A;",
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

export const DEFAULT_NOTIFICATION_PREFERENCES = {
  events: true,
  tasks: true,
  rituals: false,
  habits: true,
  journal: { enabled: false, time: "21:30" },
  tomorrowReset: { enabled: false, time: "21:45" },
  weeklyReset: { enabled: false, day: 0, time: "18:00" },
  affirmations: { enabled: false, time: "08:30" },
};
const validReminderTime = (value, fallback = "09:00") => /^\d{2}:\d{2}$/.test(String(value || "")) ? String(value) : fallback;
export const normalizeNotificationPreferences = prefs => {
  const source = prefs || {};
  const journal = typeof source.journal === "object" ? source.journal : { enabled: Boolean(source.journal), time: DEFAULT_NOTIFICATION_PREFERENCES.journal.time };
  const tomorrowReset = typeof source.tomorrowReset === "object" ? source.tomorrowReset : { enabled: Boolean(source.tomorrowReset), time: DEFAULT_NOTIFICATION_PREFERENCES.tomorrowReset.time };
  const weeklyReset = typeof source.weeklyReset === "object" ? source.weeklyReset : { enabled: Boolean(source.weeklyReset), day: DEFAULT_NOTIFICATION_PREFERENCES.weeklyReset.day, time: DEFAULT_NOTIFICATION_PREFERENCES.weeklyReset.time };
  const affirmations = typeof source.affirmations === "object" ? source.affirmations : { enabled: Boolean(source.affirmations), time: DEFAULT_NOTIFICATION_PREFERENCES.affirmations.time };
  return {
    events: source.events === undefined ? DEFAULT_NOTIFICATION_PREFERENCES.events : Boolean(source.events),
    tasks: source.tasks === undefined ? DEFAULT_NOTIFICATION_PREFERENCES.tasks : Boolean(source.tasks),
    rituals: false,
    habits: source.habits === undefined ? DEFAULT_NOTIFICATION_PREFERENCES.habits : Boolean(source.habits),
    journal: { enabled: Boolean(journal.enabled), time: validReminderTime(journal.time, DEFAULT_NOTIFICATION_PREFERENCES.journal.time) },
    tomorrowReset: { enabled: Boolean(tomorrowReset.enabled), time: validReminderTime(tomorrowReset.time, DEFAULT_NOTIFICATION_PREFERENCES.tomorrowReset.time) },
    weeklyReset: { enabled: Boolean(weeklyReset.enabled), day: Math.max(0, Math.min(6, Number(weeklyReset.day ?? DEFAULT_NOTIFICATION_PREFERENCES.weeklyReset.day) || 0)), time: validReminderTime(weeklyReset.time, DEFAULT_NOTIFICATION_PREFERENCES.weeklyReset.time) },
    affirmations: { enabled: Boolean(affirmations.enabled), time: validReminderTime(affirmations.time, DEFAULT_NOTIFICATION_PREFERENCES.affirmations.time) },
  };
};

// ── Cozy Room game data (blossoms, furniture owned, room layout) ─────────────
// Saved inside the normal Tempo settings so it syncs and is backed up like everything else.
// It is never the source of truth for tasks or money: it only remembers rewards and decorations.
export const DEFAULT_GAME_STATE = { version: 1, blossoms: 0, earned: {}, owned: {}, room: null, pets: {} };
const GAME_ID = /^[a-z0-9_]{1,40}$/;
const GAME_UID = /^[a-z0-9_#-]{1,48}$/;
export const normalizeGameState = state => {
  const src = state && typeof state === "object" ? state : {};
  const int = (v, max) => Math.max(0, Math.min(max, Math.floor(Number(v) || 0)));
  const earnedEntries = Object.entries(src.earned && typeof src.earned === "object" ? src.earned : {})
    .filter(([k]) => typeof k === "string" && k.length <= 120)
    .slice(-600) // keep the most recent completions only
    .map(([k, v]) => [k, int(v, 1000)]);
  const owned = Object.fromEntries(Object.entries(src.owned && typeof src.owned === "object" ? src.owned : {})
    .filter(([k]) => GAME_ID.test(k)).map(([k, v]) => [k, int(v, 99)]).filter(([, v]) => v > 0));
  const room = Array.isArray(src.room) ? src.room.slice(0, 60)
    .filter(p => p && GAME_UID.test(String(p.uid || "")) && GAME_ID.test(String(p.item || "")) && Array.isArray(p.box) && p.box.length === 4 && p.box.every(n => Number.isFinite(Number(n))))
    .map(p => ({ uid: String(p.uid), item: String(p.item), box: p.box.map(n => Math.max(-2000, Math.min(4000, Math.round(Number(n))))) })) : null;
  // what each dog is wearing (an accessory id, or nothing)
  const pets = Object.fromEntries(Object.entries(src.pets && typeof src.pets === "object" ? src.pets : {})
    .filter(([dog, id]) => ["westie", "cream", "bernie", "charcoal"].includes(dog) && (id === null || GAME_ID.test(String(id))))
    .map(([dog, id]) => [dog, id || null]));
  return { version: 1, blossoms: int(src.blossoms, 1000000), earned: Object.fromEntries(earnedEntries), owned, room, pets };
};

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
export const DEFAULT_TIMEZONE = normalizeTempoTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Singapore");
export let _displayTimezone = DEFAULT_TIMEZONE;
export const setDisplayTimezoneCtx = tz => {
  _displayTimezone = normalizeTempoTimeZone(tz || DEFAULT_TIMEZONE, DEFAULT_TIMEZONE);
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
  const normalized = typeof d === "string" ? normalizeTempoDateKey(d, null) : null;
  if (normalized) return normalized;
  const dt = d instanceof Date ? d : new Date(d || Date.now());
  if (Number.isNaN(dt.getTime())) return normalizeTempoDateKey(new Date(), "1970-01-01");
  const y = dt.getFullYear(), m = String(dt.getMonth()+1).padStart(2,"0"), day = String(dt.getDate()).padStart(2,"0");
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
  const normalized = normalizeTempoDateKey(key, null);
  if (!normalized) return null;
  const [y, m, d] = normalized.split("-").map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0);
};
export const localDateFromMonthKey = key => {
  const normalized = normalizeTempoMonthKey(key, null);
  if (!normalized) return null;
  const [y, m] = normalized.split("-").map(Number);
  return new Date(y, m - 1, 1, 0, 0, 0, 0);
};
export const monthKey = d => {
  const normalized = typeof d === "string" ? normalizeTempoMonthKey(d, null) || normalizeTempoDateKey(d, null)?.slice(0, 7) : null;
  if (normalized) return normalized;
  const dt = d instanceof Date ? d : new Date(d || Date.now());
  if (Number.isNaN(dt.getTime())) return normalizeTempoMonthKey(new Date().toISOString().slice(0, 7), "1970-01");
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
export const stripLegacyTaskFields = task => {
  const out = { ...(task || {}) };
  LEGACY_TASK_FIELD_KEYS.forEach(key => { if (key in out) delete out[key]; });
  return out;
};
export const withTaskPeriod = (task, anchorDate = TODAY) => {
  const cleanTask = stripLegacyTaskFields(task);
  const scope = taskScopeOf(cleanTask);
  const inferredAnchor = taskAnchorDate(cleanTask, anchorDate);
  return { ...cleanTask, category: normalizeCategoryId(cleanTask?.category || "important"), scope, ...taskPeriodPatchForScope(scope, inferredAnchor) };
};
export const normalizeTasks = tasks => Array.isArray(tasks) ? tasks.map(t => withTaskPeriod(t, TODAY)) : [];
export const migrateTaskCategories = tasks => normalizeTasks(tasks);
export const stripLegacyFocusSettings = settings => {
  const out = { ...(settings || {}) };
  LEGACY_FOCUS_SETTING_KEYS.forEach(key => { if (key in out) delete out[key]; });
  return out;
};
export const sanitizeTempoSettingsForMigration = settings => {
  const out = stripLegacyFocusSettings(settings);
  return {
    ...out,
    categories: normalizeCategories(out.categories || CATEGORIES),
    // Keep the version the data has really been migrated to. Stamping the app's
    // latest version here marked pending migrations as done without running them.
    dataMigrationVersion: Number(out.dataMigrationVersion || 0) || 0,
  };
};
export const removeLegacyLocalStorageKeys = userKey => {
  if (typeof localStorage === "undefined" || !userKey) return [];
  const prefix = `${userKey}_`;
  const removed = [];
  Object.keys(localStorage).forEach(key => {
    if (!key.startsWith(prefix)) return;
    const suffix = key.slice(prefix.length);
    if (!LEGACY_LOCAL_STORAGE_KEY_PATTERN.test(suffix)) return;
    localStorage.removeItem(key);
    removed.push(key);
  });
  return removed;
};
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
export const taskCompletionTargetKey = task => {
  const scope = taskScopeOf(task);
  if (scope === "week") return taskWeekKey(task);
  if (scope === "month") return taskMonthKey(task);
  return taskDayKey(task);
};
export const taskHasCompletionStamp = task => Boolean(task?.completedDate || task?.completedAt || task?.doneAt || task?.completed_at);
export const taskCompletedDateKey = task => {
  if (!task?.done) return null;
  if (task.completedDate) return normalizeTempoDateKey(task.completedDate, null);
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
// Legacy gamification helpers kept as compatibility stubs during the soft-rhythm cleanup.
// The visible app no longer uses weekly missions, combos, badges, leaderboards,
// mascot progression, or theme unlock gates.
export const buildWeeklyMissions = () => [];
export const buildCombos = () => [];
export const buildPersonalLeaderboard = () => [];
export const buildBadges = () => [];
export const buildRhythmPersonality = (tasks = [], journal = {}, events = [], skills = []) => {
  const completedTasks = (tasks || []).filter(t => t?.done).length;
  const journalDays = Object.keys(journal || {}).filter(k => hasJournalEntryForKey(journal, k)).length;
  const scheduledEvents = (events || []).length;
  const strongestSkill = [...(skills || [])].sort((a, b) => (b?.points || 0) - (a?.points || 0))[0];

  if (journalDays >= completedTasks && journalDays >= scheduledEvents) {
    return { icon: "📔", type: "Reflective Planner", desc: "You build rhythm by pausing, noticing patterns, and resetting with intention." };
  }
  if (scheduledEvents > completedTasks && scheduledEvents >= journalDays) {
    return { icon: "🗓️", type: "Calendar Anchor", desc: "You feel best when your day has visible structure and clear time blocks." };
  }
  if (strongestSkill?.id === "wellness" || strongestSkill?.id === "balance") {
    return { icon: "🌿", type: "Soft Resetter", desc: "You grow through calm consistency, light routines, and space to recover." };
  }
  if (completedTasks > 0) {
    return { icon: "✅", type: "Gentle Finisher", desc: "You create momentum by completing small promises and keeping the day realistic." };
  }
  return { icon: "🌤️", type: "Rhythm Starter", desc: "Start with one gentle plan, one useful task, or one short reflection today." };
};
export const MASCOT_STAGES = [];
export const buildMascotProgression = () => null;
export const THEME_UNLOCK_RULES = {};
export const buildThemeUnlocksForStats = () => THEMES.map(t => ({ id: t.id, label: t.label, unlocked: true, reason: "Available" }));
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
  const taskXP = completed.reduce((sum, t) => sum + taskXPValue(t), 0);
  const journalXP = journalCount * 30;
  const questXP = todayQuests.filter(q => q.done).reduce((sum, q) => sum + q.xp, 0);
  const totalXP = taskXP + journalXP + questXP;
  const level = Math.floor(totalXP / XP_PER_LEVEL) + 1;
  const xpIntoLevel = totalXP % XP_PER_LEVEL;
  const title = LEVEL_TITLES[Math.min(LEVEL_TITLES.length - 1, Math.floor((level - 1) / 3))];
  return {
    totalXP, level, xpIntoLevel, nextXP: XP_PER_LEVEL, title,
    levelPct: Math.round((xpIntoLevel / XP_PER_LEVEL) * 100),
    today: dailyGameSummary(tasks, journal, events, TODAY),
    quests: todayQuests,
    weeklyMissions: [],
    combos: [],
    leaderboard: [],
    personality: buildRhythmPersonality(tasks, journal, events, skills),
    badges: [],
    unlockedBadges: [],
    streaks,
    skills,
    weekly,
    mascot: null,
    themeUnlocks: buildThemeUnlocksForStats(),
    lifeGarden: buildMonthlyLifeGarden(tasks, journal, events, TODAY),
    xpBreakdown: { taskXP, journalXP, questXP, missionXP: 0, comboXP: 0, badgeXP: 0 },
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

const safeEventDate = (value, fallback = null) => {
  const raw = value?.__d ?? value;
  const date = raw instanceof Date ? raw : new Date(raw);
  if (!Number.isNaN(date.getTime())) return date;
  const fb = fallback instanceof Date ? fallback : new Date(fallback || Date.now());
  return Number.isNaN(fb.getTime()) ? new Date() : fb;
};

// Guarantee event dates are always real Date objects regardless of source
// (localStorage JSON, Supabase JSONB, or in-memory — all can drift to strings)
export const reviveEvents = evs => (Array.isArray(evs) ? evs : []).filter(Boolean).map(e => {
  const start = safeEventDate(e.start);
  let end = safeEventDate(e.end, new Date(start.getTime() + 30 * 60000));
  if (end <= start) end = new Date(start.getTime() + (e.allDay ? 24 * 60 * 60000 : 30 * 60000));
  return {
    ...e,
    category: normalizeCategoryId(e?.category || "meeting", "meeting"),
    start,
    end,
  };
});

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
  // Read a "YYYY-MM-DD" end date as a local calendar day. new Date("YYYY-MM-DD")
  // is UTC midnight, which is the previous day west of UTC and ended series a day early.
  const endDay = end ? (localDateFromKey(end) || dayStart(new Date(end))) : null;
  if (endDay && dayStart(occurrenceDate) > endDay) return false;
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

export const hasStoredUserData = uk => Boolean(load(`${uk}_ev`, null) || load(`${uk}_tk`, null) || load(`${uk}_journal`, null) || load(`${uk}_daily_checkins`, null) || load(`${uk}_affirmations`, null) || load(`${uk}_budget_profile`, null) || load(`${uk}_budget_accounts`, null) || load(`${uk}_budget_buckets`, null));
export const loadStoredEventsOrSeed = uk => reviveEvents(load(`${uk}_ev`, null) ?? INIT_EVENTS);
export const loadStoredTasksOrSeed = uk => normalizeTasks(load(`${uk}_tk`, null) ?? INIT_TASKS);

// ─── Journal Constants ────────────────────────────────────────────────────────

export const MEMORY_STORAGE_BUCKET = "memory-images";
export const MEMORY_SIGNED_URL_SECONDS = 60 * 60 * 24 * 7;
export const MEMORY_IMAGE_LIMIT_PER_ENTRY = 6;
export const MEMORY_MAX_ORIGINAL_BYTES = 15 * 1024 * 1024;
export const MEMORY_MAX_IMAGE_EDGE = 1600;
export const MEMORY_THUMB_IMAGE_EDGE = 300;
export const MEMORY_PREVIEW_IMAGE_EDGE = 900;
export const MEMORY_PREVIEW_IMAGE_QUALITY = 0.72;
export const MEMORY_UPLOAD_IMAGE_QUALITY = 0.84;
export const MEMORY_THUMB_IMAGE_QUALITY = 0.76;
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


export const DAILY_CHECKIN_MOODS = [
  { id: "great", emoji: "✨", label: "Great", color: "#4CAF82" },
  { id: "good", emoji: "😊", label: "Good", color: "#7CB9E8" },
  { id: "okay", emoji: "🌿", label: "Okay", color: "#B08AE0" },
  { id: "tired", emoji: "😴", label: "Tired", color: "#C79A5A" },
  { id: "stressed", emoji: "🌧️", label: "Stressed", color: "#FF8C69" },
  { id: "low", emoji: "🫧", label: "Low", color: "#9C8AA5" },
];
export const DAILY_CHECKIN_ENERGIES = [
  { id: "low", emoji: "🪫", label: "Low", description: "Keep it lighter today" },
  { id: "medium", emoji: "🌤️", label: "Medium", description: "A steady, normal rhythm" },
  { id: "high", emoji: "⚡", label: "High", description: "Use the momentum well" },
];
export const normalizeDailyCheckIn = entry => {
  const date = String(entry?.date || dateKey(TODAY));
  const now = new Date().toISOString();
  const mood = DAILY_CHECKIN_MOODS.some(m => m.id === entry?.mood) ? entry.mood : null;
  const energy = DAILY_CHECKIN_ENERGIES.some(e => e.id === entry?.energy) ? entry.energy : null;
  return {
    id: entry?.id || `checkin-${date}`,
    date,
    mood,
    energy,
    note: String(entry?.note || ""),
    createdAt: entry?.createdAt || entry?.updatedAt || now,
    updatedAt: entry?.updatedAt || entry?.createdAt || now,
    deletedAt: entry?.deletedAt || null,
  };
};
export const normalizeDailyCheckIns = value => {
  const list = Array.isArray(value) ? value : Object.entries(value || {}).map(([date, entry]) => ({ ...(entry || {}), date }));
  const byDate = new Map();
  list.forEach(item => {
    const clean = normalizeDailyCheckIn(item);
    if (clean.deletedAt) return;
    const prev = byDate.get(clean.date);
    const pt = prev?.updatedAt ? new Date(prev.updatedAt).getTime() : 0;
    const nt = clean.updatedAt ? new Date(clean.updatedAt).getTime() : 0;
    if (!prev || nt >= pt) byDate.set(clean.date, clean);
  });
  return [...byDate.values()].sort((a, b) => String(b.date).localeCompare(String(a.date)));
};
export const dailyCheckInForDate = (dailyCheckIns, date = TODAY) => {
  const key = typeof date === "string" ? date : dateKey(date);
  return normalizeDailyCheckIns(dailyCheckIns).find(entry => entry.date === key) || null;
};


export const TOMORROW_RESET_TASK_ACTIONS = [
  { id: "tomorrow", label: "Move to tomorrow", shortLabel: "Tomorrow", emoji: "→", description: "Carry this into tomorrow's plan." },
  { id: "week", label: "Move to this week", shortLabel: "This week", emoji: "↗", description: "Keep it for later this week." },
  { id: "keep", label: "Keep unscheduled", shortLabel: "Keep", emoji: "○", description: "Leave it outside tomorrow's plan for now." },
  { id: "drop", label: "Drop it", shortLabel: "Drop", emoji: "×", description: "Remove this task from your active list." },
];

export const normalizeTomorrowReset = entry => {
  const date = String(entry?.date || dateKey(TODAY));
  const now = new Date().toISOString();
  const validActions = new Set(TOMORROW_RESET_TASK_ACTIONS.map(a => a.id));
  const rawTaskActions = Array.isArray(entry?.taskActions) ? entry.taskActions : [];
  const taskActions = rawTaskActions.map(item => ({
    taskId: String(item?.taskId || ""),
    taskTitle: String(item?.taskTitle || ""),
    action: validActions.has(item?.action) ? item.action : "tomorrow",
    duration: Number(item?.duration || 0),
    category: item?.category || null,
  })).filter(item => item.taskId || item.taskTitle);
  const reflection = entry?.reflection || {};
  return {
    id: entry?.id || `reset-${date}`,
    date,
    completedAt: entry?.completedAt || entry?.updatedAt || now,
    taskActions,
    summary: {
      movedTomorrow: Number(entry?.summary?.movedTomorrow || taskActions.filter(x => x.action === "tomorrow").length),
      movedWeek: Number(entry?.summary?.movedWeek || taskActions.filter(x => x.action === "week").length),
      kept: Number(entry?.summary?.kept || taskActions.filter(x => x.action === "keep").length),
      dropped: Number(entry?.summary?.dropped || taskActions.filter(x => x.action === "drop").length),
    },
    reflection: {
      wentWell: String(reflection.wentWell || entry?.wentWell || ""),
      difficult: String(reflection.difficult || entry?.difficult || ""),
      moveTomorrow: String(reflection.moveTomorrow || entry?.moveTomorrow || ""),
      tomorrowMainThing: String(reflection.tomorrowMainThing || entry?.tomorrowMainThing || ""),
      gratitude: String(reflection.gratitude || entry?.gratitude || ""),
    },
    createdAt: entry?.createdAt || entry?.updatedAt || now,
    updatedAt: entry?.updatedAt || entry?.completedAt || entry?.createdAt || now,
    deletedAt: entry?.deletedAt || null,
  };
};
export const normalizeTomorrowResets = value => {
  const list = Array.isArray(value) ? value : Object.entries(value || {}).map(([date, entry]) => ({ ...(entry || {}), date }));
  const byDate = new Map();
  list.forEach(item => {
    const clean = normalizeTomorrowReset(item);
    if (clean.deletedAt) return;
    const prev = byDate.get(clean.date);
    const pt = prev?.updatedAt ? new Date(prev.updatedAt).getTime() : 0;
    const nt = clean.updatedAt ? new Date(clean.updatedAt).getTime() : 0;
    if (!prev || nt >= pt) byDate.set(clean.date, clean);
  });
  return [...byDate.values()].sort((a, b) => String(b.date).localeCompare(String(a.date)));
};
export const tomorrowResetForDate = (tomorrowResets, date = TODAY) => {
  const key = typeof date === "string" ? date : dateKey(date);
  return normalizeTomorrowResets(tomorrowResets).find(entry => entry.date === key) || null;
};



export const WEEKLY_RESET_TASK_ACTIONS = [
  { id: "nextWeek", label: "Move to next week", shortLabel: "Next week", emoji: "→", description: "Carry this forward into next week." },
  { id: "keep", label: "Keep unscheduled", shortLabel: "Keep", emoji: "○", description: "Leave it active, but outside a specific plan." },
  { id: "drop", label: "Drop it", shortLabel: "Drop", emoji: "×", description: "Remove this task from your active list." },
];

export const normalizeWeeklyReset = entry => {
  const rawWeekStart = entry?.weekStart || entry?.date || dateKey(weekStart(TODAY));
  const weekStartKey = typeof rawWeekStart === "string" ? rawWeekStart : dateKey(weekStart(rawWeekStart));
  const now = new Date().toISOString();
  const validActions = new Set(WEEKLY_RESET_TASK_ACTIONS.map(a => a.id));
  const rawTaskActions = Array.isArray(entry?.taskActions) ? entry.taskActions : [];
  const taskActions = rawTaskActions.map(item => ({
    taskId: String(item?.taskId || ""),
    taskTitle: String(item?.taskTitle || ""),
    action: validActions.has(item?.action) ? item.action : "nextWeek",
    duration: Number(item?.duration || 0),
    category: item?.category || null,
    scope: item?.scope || null,
  })).filter(item => item.taskId || item.taskTitle);
  const reflection = entry?.reflection || {};
  const priorities = Array.isArray(entry?.priorities) ? entry.priorities : [];
  const keyEvents = Array.isArray(entry?.keyEvents) ? entry.keyEvents : [];
  const habitFocus = Array.isArray(entry?.habitFocus) ? entry.habitFocus : [];
  return {
    id: entry?.id || `weekly-reset-${weekStartKey}`,
    weekStart: weekStartKey,
    completedAt: entry?.completedAt || entry?.updatedAt || now,
    priorities: priorities.map(v => String(v || "").trim()).filter(Boolean).slice(0, 5),
    intention: String(entry?.intention || ""),
    keyEvents: keyEvents.map(v => String(v || "").trim()).filter(Boolean).slice(0, 8),
    habitFocus: habitFocus.map(v => String(v || "")).filter(Boolean).slice(0, 12),
    moodEnergySummary: {
      checkInDays: Number(entry?.moodEnergySummary?.checkInDays || 0),
      dominantMood: entry?.moodEnergySummary?.dominantMood || null,
      dominantEnergy: entry?.moodEnergySummary?.dominantEnergy || null,
      lowEnergyDays: Number(entry?.moodEnergySummary?.lowEnergyDays || 0),
    },
    taskActions,
    summary: {
      movedNextWeek: Number(entry?.summary?.movedNextWeek || taskActions.filter(x => x.action === "nextWeek").length),
      kept: Number(entry?.summary?.kept || taskActions.filter(x => x.action === "keep").length),
      dropped: Number(entry?.summary?.dropped || taskActions.filter(x => x.action === "drop").length),
    },
    reflection: {
      lastWeek: String(reflection.lastWeek || entry?.lastWeek || ""),
      wins: String(reflection.wins || entry?.wins || ""),
      difficult: String(reflection.difficult || entry?.difficult || ""),
      moodEnergy: String(reflection.moodEnergy || entry?.moodEnergy || ""),
      nextWeekFocus: String(reflection.nextWeekFocus || entry?.nextWeekFocus || ""),
    },
    createdAt: entry?.createdAt || entry?.updatedAt || now,
    updatedAt: entry?.updatedAt || entry?.completedAt || entry?.createdAt || now,
    deletedAt: entry?.deletedAt || null,
  };
};
export const normalizeWeeklyResets = value => {
  const list = Array.isArray(value) ? value : Object.entries(value || {}).map(([weekStartKey, entry]) => ({ ...(entry || {}), weekStart: weekStartKey }));
  const byWeek = new Map();
  list.forEach(item => {
    const clean = normalizeWeeklyReset(item);
    if (clean.deletedAt) return;
    const prev = byWeek.get(clean.weekStart);
    const pt = prev?.updatedAt ? new Date(prev.updatedAt).getTime() : 0;
    const nt = clean.updatedAt ? new Date(clean.updatedAt).getTime() : 0;
    if (!prev || nt >= pt) byWeek.set(clean.weekStart, clean);
  });
  return [...byWeek.values()].sort((a, b) => String(b.weekStart).localeCompare(String(a.weekStart)));
};
export const weeklyResetForDate = (weeklyResets, date = TODAY) => {
  const key = typeof date === "string" ? dateKey(weekStart(localDateFromKey(date) || TODAY)) : dateKey(weekStart(date));
  return normalizeWeeklyResets(weeklyResets).find(entry => entry.weekStart === key) || null;
};

// ─── Affirmations ─────────────────────────────────────────────────────────────

export const AFFIRMATION_CATEGORIES = [
  { id: "calm", label: "Calm", emoji: "🌿" },
  { id: "clarity", label: "Clarity", emoji: "🕊️" },
  { id: "confidence", label: "Confidence", emoji: "✨" },
  { id: "reset", label: "Reset", emoji: "🌙" },
  { id: "kindness", label: "Kindness", emoji: "💌" },
];

export const DEFAULT_AFFIRMATIONS = [
  { id: "affirm-calm-1", text: "I can move through today calmly and clearly.", category: "calm", favorite: false, source: "starter" },
  { id: "affirm-calm-2", text: "I do not need to do everything at once.", category: "calm", favorite: false, source: "starter" },
  { id: "affirm-calm-3", text: "A steady rhythm is enough for today.", category: "calm", favorite: false, source: "starter" },
  { id: "affirm-clarity-1", text: "I can choose the next right step.", category: "clarity", favorite: false, source: "starter" },
  { id: "affirm-clarity-2", text: "Small steps still count.", category: "clarity", favorite: false, source: "starter" },
  { id: "affirm-clarity-3", text: "I can simplify today instead of forcing it.", category: "clarity", favorite: false, source: "starter" },
  { id: "affirm-confidence-1", text: "I trust myself to handle today with care.", category: "confidence", favorite: false, source: "starter" },
  { id: "affirm-confidence-2", text: "I can show up gently and still make progress.", category: "confidence", favorite: false, source: "starter" },
  { id: "affirm-confidence-3", text: "My rhythm is built by returning, not rushing.", category: "confidence", favorite: false, source: "starter" },
  { id: "affirm-reset-1", text: "I can reset without judging yesterday.", category: "reset", favorite: false, source: "starter" },
  { id: "affirm-reset-2", text: "Today can begin softly, one choice at a time.", category: "reset", favorite: false, source: "starter" },
  { id: "affirm-reset-3", text: "I can close the day with peace, even if it was imperfect.", category: "reset", favorite: false, source: "starter" },
  { id: "affirm-kindness-1", text: "I can speak to myself with patience today.", category: "kindness", favorite: false, source: "starter" },
  { id: "affirm-kindness-2", text: "I am allowed to move at a human pace.", category: "kindness", favorite: false, source: "starter" },
  { id: "affirm-kindness-3", text: "Rest is part of keeping my life together.", category: "kindness", favorite: false, source: "starter" },
];

export const DEFAULT_AFFIRMATION_SETTINGS = {
  reminderEnabled: false,
  reminderTime: "08:30",
};

export const normalizeAffirmation = affirmation => {
  const now = new Date().toISOString();
  const validCategory = AFFIRMATION_CATEGORIES.some(c => c.id === affirmation?.category) ? affirmation.category : "calm";
  return {
    id: affirmation?.id || "affirm-" + uid(),
    text: String(affirmation?.text || "").trim(),
    category: validCategory,
    favorite: Boolean(affirmation?.favorite),
    source: affirmation?.source === "custom" ? "custom" : "starter",
    createdAt: affirmation?.createdAt || affirmation?.updatedAt || now,
    updatedAt: affirmation?.updatedAt || affirmation?.createdAt || now,
    deletedAt: affirmation?.deletedAt || null,
  };
};

export const normalizeAffirmations = value => {
  const source = Array.isArray(value) && value.length ? value : DEFAULT_AFFIRMATIONS;
  const byId = new Map();
  source.forEach(item => {
    const clean = normalizeAffirmation(item);
    if (!clean.text || clean.deletedAt) return;
    const prev = byId.get(clean.id);
    const pt = prev?.updatedAt ? new Date(prev.updatedAt).getTime() : 0;
    const nt = clean.updatedAt ? new Date(clean.updatedAt).getTime() : 0;
    if (!prev || nt >= pt) byId.set(clean.id, clean);
  });
  return [...byId.values()].sort((a, b) => {
    if (a.source !== b.source) return a.source === "starter" ? -1 : 1;
    return String(a.createdAt || a.id).localeCompare(String(b.createdAt || b.id));
  });
};

export const normalizeAffirmationSettings = settings => {
  const time = /^\d{2}:\d{2}$/.test(String(settings?.reminderTime || "")) ? settings.reminderTime : DEFAULT_AFFIRMATION_SETTINGS.reminderTime;
  return {
    reminderEnabled: Boolean(settings?.reminderEnabled),
    reminderTime: time,
  };
};

export const affirmationCategoryById = id => AFFIRMATION_CATEGORIES.find(c => c.id === id) || AFFIRMATION_CATEGORIES[0];

export const affirmationForDate = (affirmations, date = TODAY, offset = 0) => {
  const active = normalizeAffirmations(affirmations).filter(item => item.text && !item.deletedAt);
  if (!active.length) return null;
  const key = typeof date === "string" ? date : dateKey(date);
  const digits = String(key).replace(/\D/g, "");
  const seed = (Number(digits) || 0) + Number(offset || 0);
  return active[Math.abs(seed) % active.length];
};


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
export const MEMORY_STICKER_PACKS = [
  { id: "cozy", label: "Cozy", count: 12 },
  { id: "lola", label: "Lola", count: 9 },
  { id: "luna", label: "Luna", count: 9 },
  { id: "sugar", label: "Sugar", count: 9 },
  { id: "truffle", label: "Truffle", count: 9 },
].map(pack => ({
  ...pack,
  stickers: Array.from({ length: pack.count }, (_, i) => ({
    id: `${pack.id}-${i + 1}`,
    packId: pack.id,
    packLabel: pack.label,
    number: i + 1,
    label: `${pack.label} ${i + 1}`,
    src: `${MEMORY_ASSET_BASE}/stickers/${pack.id}/${i + 1}.png`,
  })),
}));

export const COZY_STICKER_PACK = MEMORY_STICKER_PACKS.flatMap(pack => pack.stickers);
export const memoryBackgroundById = id => MEMORY_BACKGROUNDS.find(b => b.id === id) || MEMORY_BACKGROUNDS[0];
export const memoryBackgroundStyle = id => {
  const bg = memoryBackgroundById(id);
  const image = bg?.src
    ? `linear-gradient(rgba(255,255,255,.52), rgba(255,255,255,.66)), url(${bg.src})`
    : `linear-gradient(180deg, var(--surface, #fff), var(--surface-warm, #fffaf7))`;
  return {
    "--memory-bg-image": image,
    backgroundImage: image,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
  };
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

export const memoryPhotoStoragePaths = photo => [photo?.storagePath, photo?.thumbStoragePath].filter(Boolean);

export const memoryStoragePathsFromJournal = journal => {
  const paths = new Set();
  Object.values(journal || {}).forEach(entry => {
    normalizeMemoryEntry(entry).photos.forEach(photo => {
      memoryPhotoStoragePaths(photo).forEach(path => paths.add(path));
    });
  });
  return [...paths];
};

export const findRemovedMemoryPhotoPaths = (previousJournal = {}, nextJournal = {}) => {
  const previous = new Set(memoryStoragePathsFromJournal(previousJournal));
  const next = new Set(memoryStoragePathsFromJournal(nextJournal));
  return [...previous].filter(path => !next.has(path));
};

export const buildJournalPhotoCleanupQueue = (existingQueue = [], paths = [], reason = "removed", now = new Date()) => {
  const timestamp = now instanceof Date ? now.toISOString() : new Date(now || Date.now()).toISOString();
  const byPath = new Map();
  (Array.isArray(existingQueue) ? existingQueue : []).forEach(item => {
    const path = String(item?.path || "").trim();
    if (!path) return;
    byPath.set(path, {
      path,
      reason: item?.reason || "unknown",
      createdAt: item?.createdAt || timestamp,
      attempts: Math.max(0, Number(item?.attempts || 0)),
      lastTriedAt: item?.lastTriedAt || null,
    });
  });
  (Array.isArray(paths) ? paths : []).forEach(raw => {
    const path = String(raw || "").trim();
    if (!path) return;
    if (!byPath.has(path)) byPath.set(path, { path, reason, createdAt: timestamp, attempts: 0, lastTriedAt: null });
  });
  return [...byPath.values()].slice(-200);
};

export const markJournalPhotoCleanupAttempt = (queue = [], attemptedPaths = [], succeededPaths = [], now = new Date()) => {
  const attempted = new Set((Array.isArray(attemptedPaths) ? attemptedPaths : []).filter(Boolean));
  const succeeded = new Set((Array.isArray(succeededPaths) ? succeededPaths : []).filter(Boolean));
  const timestamp = now instanceof Date ? now.toISOString() : new Date(now || Date.now()).toISOString();
  return (Array.isArray(queue) ? queue : [])
    .filter(item => item?.path && !succeeded.has(item.path))
    .map(item => attempted.has(item.path)
      ? { ...item, attempts: Math.max(0, Number(item.attempts || 0)) + 1, lastTriedAt: timestamp }
      : item)
    .filter(item => Math.max(0, Number(item.attempts || 0)) < 8);
};
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

export async function imageFileToPreviewDataUrl(file, maxSize = MEMORY_PREVIEW_IMAGE_EDGE, quality = MEMORY_PREVIEW_IMAGE_QUALITY) {
  if (typeof window === "undefined" || !file?.type?.startsWith?.("image/")) return readFileAsDataUrl(file);
  return new Promise(resolve => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onerror = async () => {
      URL.revokeObjectURL(objectUrl);
      resolve(await readFileAsDataUrl(file));
    };
    img.onload = () => {
      try {
        const scale = Math.min(1, maxSize / Math.max(img.width || 1, img.height || 1));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round((img.width || 1) * scale));
        canvas.height = Math.max(1, Math.round((img.height || 1) * scale));
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        // Always use JPEG for previews to keep local cache/state small and predictable.
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        URL.revokeObjectURL(objectUrl);
        resolve(dataUrl);
      } catch {
        URL.revokeObjectURL(objectUrl);
        readFileAsDataUrl(file).then(resolve);
      }
    };
    img.src = objectUrl;
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
      previewSrc: await imageFileToPreviewDataUrl(file),
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
  return {
    events: clean(src.events),
    tasks: clean(src.tasks),
    calendars: clean(src.calendars),
    rituals: clean(src.rituals),
    ritualCompletions: clean(src.ritualCompletions),
    habits: clean(src.habits),
    habitCompletions: clean(src.habitCompletions),
    dailyCheckIns: clean(src.dailyCheckIns),
    tomorrowResets: clean(src.tomorrowResets),
    weeklyResets: clean(src.weeklyResets),
    affirmations: clean(src.affirmations),
  };
};
export const pruneDeletedRecords = (value, retentionDays = SYNC_TOMBSTONE_RETENTION_DAYS, now = new Date()) => {
  const normalized = normalizeDeletedRecordsForMerge(value);
  const cutoffMs = now.getTime() - (Math.max(1, Number(retentionDays) || SYNC_TOMBSTONE_RETENTION_DAYS) * 86400000);
  const pruneKind = records => Object.fromEntries(Object.entries(records || {}).filter(([, ts]) => {
    const t = ts ? new Date(ts).getTime() : 0;
    return Number.isFinite(t) && t >= cutoffMs;
  }));
  return Object.fromEntries(SYNC_DATASET_KEYS.map(key => [key, pruneKind(normalized[key])])) ;
};

export const normalizeSyncConflictLog = value => {
  const source = Array.isArray(value) ? value : [];
  return source
    .filter(Boolean)
    .map(item => ({
      id: String(item.id || `sync-${uid()}`),
      kind: String(item.kind || "unknown"),
      recordId: String(item.recordId || ""),
      recordLabel: String(item.recordLabel || item.recordId || "Item"),
      kept: item.kept === "local" || item.kept === "cloud" ? item.kept : "latest",
      cloudUpdatedAt: item.cloudUpdatedAt || null,
      localUpdatedAt: item.localUpdatedAt || null,
      detectedAt: item.detectedAt || new Date().toISOString(),
      note: String(item.note || "Latest update kept during sync merge."),
    }))
    .sort((a, b) => new Date(b.detectedAt || 0) - new Date(a.detectedAt || 0))
    .slice(0, SYNC_CONFLICT_LOG_LIMIT);
};

const recordConflictLabel = item => String(item?.title || item?.name || item?.text || item?.date || item?.weekStart || item?.id || "Item");
const stableRecordFingerprint = item => {
  if (!item || typeof item !== "object") return "";
  const clone = { ...item };
  delete clone.previewSrc;
  delete clone.pendingFile;
  return JSON.stringify(clone, (key, value) => value instanceof Date ? value.toISOString() : value);
};
const collectRecordConflicts = (kind, cloudList = [], localList = [], tombstones = {}) => {
  const cloudMap = new Map((Array.isArray(cloudList) ? cloudList : []).filter(item => item?.id).map(item => [item.id, item]));
  const localMap = new Map((Array.isArray(localList) ? localList : []).filter(item => item?.id).map(item => [item.id, item]));
  const detectedAt = new Date().toISOString();
  const conflicts = [];
  localMap.forEach((localItem, id) => {
    const cloudItem = cloudMap.get(id);
    if (!cloudItem || tombstones?.[id]) return;
    const cloudTime = recordModifiedTime(cloudItem);
    const localTime = recordModifiedTime(localItem);
    if (!cloudTime || !localTime || Math.abs(cloudTime - localTime) < 1000) return;
    if (stableRecordFingerprint(cloudItem) === stableRecordFingerprint(localItem)) return;
    conflicts.push({
      id: `${kind}:${id}:${Math.max(cloudTime, localTime)}`,
      kind,
      recordId: id,
      recordLabel: recordConflictLabel(localTime >= cloudTime ? localItem : cloudItem),
      kept: localTime >= cloudTime ? "local" : "cloud",
      cloudUpdatedAt: cloudItem.updatedAt || cloudItem.modifiedAt || cloudItem.completedAt || cloudItem.createdAt || null,
      localUpdatedAt: localItem.updatedAt || localItem.modifiedAt || localItem.completedAt || localItem.createdAt || null,
      detectedAt,
      note: "Both devices changed this item; the newest update was kept.",
    });
  });
  return conflicts;
};

export const buildSyncConflictLog = (cloud = {}, local = {}, deletedRecords = {}) => {
  const cloudSettings = cloud.settings || {};
  const localSettings = local.settings || {};
  const existing = [
    ...normalizeSyncConflictLog(cloudSettings.syncConflictLog),
    ...normalizeSyncConflictLog(localSettings.syncConflictLog),
  ];
  const incoming = [
    ...collectRecordConflicts("events", cloud.events || [], local.events || [], deletedRecords.events),
    ...collectRecordConflicts("tasks", cloud.tasks || [], local.tasks || [], deletedRecords.tasks),
    ...collectRecordConflicts("calendars", cloudSettings.calendars || [], localSettings.calendars || [], deletedRecords.calendars),
    ...collectRecordConflicts("rituals", cloudSettings.rituals || [], localSettings.rituals || [], deletedRecords.rituals),
    ...collectRecordConflicts("ritualCompletions", cloudSettings.ritualCompletions || [], localSettings.ritualCompletions || [], deletedRecords.ritualCompletions),
    ...collectRecordConflicts("habits", cloudSettings.habits || [], localSettings.habits || [], deletedRecords.habits),
    ...collectRecordConflicts("habitCompletions", cloudSettings.habitCompletions || [], localSettings.habitCompletions || [], deletedRecords.habitCompletions),
    ...collectRecordConflicts("dailyCheckIns", cloudSettings.dailyCheckIns || [], localSettings.dailyCheckIns || [], deletedRecords.dailyCheckIns),
    ...collectRecordConflicts("tomorrowResets", cloudSettings.tomorrowResets || [], localSettings.tomorrowResets || [], deletedRecords.tomorrowResets),
    ...collectRecordConflicts("weeklyResets", cloudSettings.weeklyResets || [], localSettings.weeklyResets || [], deletedRecords.weeklyResets),
    ...collectRecordConflicts("affirmations", cloudSettings.affirmations || [], localSettings.affirmations || [], deletedRecords.affirmations),
  ];
  const byId = new Map();
  [...incoming, ...existing].forEach(item => { if (item?.id) byId.set(item.id, item); });
  return normalizeSyncConflictLog([...byId.values()]);
};

export const syncDatasetCounts = (events = [], tasks = [], settings = {}) => ({
  events: Array.isArray(events) ? events.filter(item => !item?.deletedAt).length : 0,
  tasks: Array.isArray(tasks) ? tasks.filter(item => !item?.deletedAt).length : 0,
  rituals: Array.isArray(settings.rituals) ? settings.rituals.filter(item => !item?.deletedAt).length : 0,
  ritualCompletions: Array.isArray(settings.ritualCompletions) ? settings.ritualCompletions.filter(item => !item?.deletedAt).length : 0,
  habits: Array.isArray(settings.habits) ? settings.habits.filter(item => !item?.deletedAt).length : 0,
  habitCompletions: Array.isArray(settings.habitCompletions) ? settings.habitCompletions.filter(item => !item?.deletedAt).length : 0,
  dailyCheckIns: Array.isArray(settings.dailyCheckIns) ? settings.dailyCheckIns.filter(item => !item?.deletedAt).length : 0,
  tomorrowResets: Array.isArray(settings.tomorrowResets) ? settings.tomorrowResets.filter(item => !item?.deletedAt).length : 0,
  weeklyResets: Array.isArray(settings.weeklyResets) ? settings.weeklyResets.filter(item => !item?.deletedAt).length : 0,
  affirmations: Array.isArray(settings.affirmations) ? settings.affirmations.filter(item => !item?.deletedAt).length : 0,
  budgetAccounts: Array.isArray(settings.budgetAccounts) ? settings.budgetAccounts.filter(item => !item?.deletedAt).length : 0,
  budgetLedgers: Array.isArray(settings.budgetLedgers) ? settings.budgetLedgers.filter(item => !item?.deletedAt).length : 0,
  budgetBuckets: Array.isArray(settings.budgetBuckets) ? settings.budgetBuckets.filter(item => !item?.deletedAt).length : 0,
  budgetTransactions: Array.isArray(settings.budgetTransactions) ? settings.budgetTransactions.filter(item => !item?.deletedAt).length : 0,
});

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
    rituals: mergeTombstoneMaps(c.rituals, l.rituals),
    ritualCompletions: mergeTombstoneMaps(c.ritualCompletions, l.ritualCompletions),
    habits: mergeTombstoneMaps(c.habits, l.habits),
    habitCompletions: mergeTombstoneMaps(c.habitCompletions, l.habitCompletions),
    dailyCheckIns: mergeTombstoneMaps(c.dailyCheckIns, l.dailyCheckIns),
    tomorrowResets: mergeTombstoneMaps(c.tomorrowResets, l.tomorrowResets),
    weeklyResets: mergeTombstoneMaps(c.weeklyResets, l.weeklyResets),
    affirmations: mergeTombstoneMaps(c.affirmations, l.affirmations),
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
  const prunedDeletedRecords = pruneDeletedRecords(deletedRecords);
  const syncConflictLog = buildSyncConflictLog(cloud, local, deletedRecords);
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
    dailyCheckIns: normalizeDailyCheckIns(mergeRecordsById(cloudSettings.dailyCheckIns || [], localSettings.dailyCheckIns || [], deletedRecords.dailyCheckIns)),
    tomorrowResets: normalizeTomorrowResets(mergeRecordsById(cloudSettings.tomorrowResets || [], localSettings.tomorrowResets || [], deletedRecords.tomorrowResets)),
    weeklyResets: normalizeWeeklyResets(mergeRecordsById(cloudSettings.weeklyResets || [], localSettings.weeklyResets || [], deletedRecords.weeklyResets)),
    affirmations: normalizeAffirmations(mergeRecordsById(cloudSettings.affirmations || DEFAULT_AFFIRMATIONS, localSettings.affirmations || DEFAULT_AFFIRMATIONS, deletedRecords.affirmations)),
    affirmationSettings: normalizeAffirmationSettings(chooseSettingValue("affirmationSettings", cloudSettings, localSettings, cloud.updated_at, local.updated_at)),
    notificationPreferences: normalizeNotificationPreferences(chooseSettingValue("notificationPreferences", cloudSettings, localSettings, cloud.updated_at, local.updated_at)),
    game: normalizeGameState(chooseSettingValue("game", cloudSettings, localSettings, cloud.updated_at, local.updated_at)),
    journalActivities: mergeRecordsById(cloudSettings.journalActivities || [], localSettings.journalActivities || []),
    calendars: normalizeCalendars(mergeRecordsById(cloudSettings.calendars || CALENDARS, localSettings.calendars || CALENDARS, deletedRecords.calendars)),
    hiddenCals: chooseSettingValue("hiddenCals", cloudSettings, localSettings, cloud.updated_at, local.updated_at) || [],
    hiddenCalendarSources: chooseSettingValue("hiddenCalendarSources", cloudSettings, localSettings, cloud.updated_at, local.updated_at) || ["habit"],
    categories: normalizeCategories(mergeRecordsById(cloudSettings.categories || [], localSettings.categories || [])),
    templates: mergeRecordsById(cloudSettings.templates || [], localSettings.templates || []),
    rituals: mergeRecordsById(cloudSettings.rituals || [], localSettings.rituals || [], deletedRecords.rituals),
    ritualCompletions: mergeRecordsById(cloudSettings.ritualCompletions || [], localSettings.ritualCompletions || [], deletedRecords.ritualCompletions),
    habits: mergeRecordsById(cloudSettings.habits || [], localSettings.habits || [], deletedRecords.habits),
    habitCompletions: mergeRecordsById(cloudSettings.habitCompletions || [], localSettings.habitCompletions || [], deletedRecords.habitCompletions),
    memoryTags: [...new Set([...(cloudSettings.memoryTags || []), ...(localSettings.memoryTags || [])])],
    appMode: chooseSettingValue("appMode", cloudSettings, localSettings, cloud.updated_at, local.updated_at) || "schedule",
    budgetProfile: chooseSettingValue("budgetProfile", cloudSettings, localSettings, cloud.updated_at, local.updated_at),
    budgetAccounts: chooseSettingValue("budgetAccounts", cloudSettings, localSettings, cloud.updated_at, local.updated_at),
    budgetLedgers: chooseSettingValue("budgetLedgers", cloudSettings, localSettings, cloud.updated_at, local.updated_at),
    budgetBuckets: chooseSettingValue("budgetBuckets", cloudSettings, localSettings, cloud.updated_at, local.updated_at),
    budgetTransactions: chooseSettingValue("budgetTransactions", cloudSettings, localSettings, cloud.updated_at, local.updated_at),
    bonusAllocationRules: chooseSettingValue("bonusAllocationRules", cloudSettings, localSettings, cloud.updated_at, local.updated_at),
    memoryStorageMigratedAt: localSettings.memoryStorageMigratedAt || cloudSettings.memoryStorageMigratedAt || null,
    settingsUpdatedAt,
    deletedRecords: prunedDeletedRecords,
    syncConflictLog,
  };
  return {
    events: reviveEvents(mergeRecordsById(cloud.events || [], local.events || [], deletedRecords.events)),
    tasks: normalizeTasks(mergeRecordsById(cloud.tasks || [], local.tasks || [], deletedRecords.tasks)),
    settings: sanitizeTempoSettingsForMigration({
      ...mergedSettings,
      // A merge is migrated as far as the more advanced side.
      dataMigrationVersion: Math.max(Number(cloudSettings.dataMigrationVersion || 0), Number(localSettings.dataMigrationVersion || 0)),
    }),
  };
};
