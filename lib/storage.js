import { ensureEventModel, ensureTaskModel, normalizeRecurrence } from "./recurrence";

export const STORAGE_VERSION = 5;
export const GLOBAL_STORAGE_KEY = "tempo_app_state_v5";
export const LEGACY_STORAGE_KEYS = ["tempo_app_state_v4", "tempo_app_state_v3", "tempo_app_state_v2", "tempo_app_state"];

export const DEFAULT_CALENDARS = [
  { id: "personal", name: "Personal", color: "#FF7BAC", account: "local", source: "local" },
  { id: "work", name: "Work", color: "#B08AE0", account: "local", source: "local" },
];

export const DEFAULT_CATEGORIES = [
  { id: "deep", label: "Deep Work", color: "#B08AE0", icon: "🔮" },
  { id: "admin", label: "Admin", color: "#A0C8E0", icon: "📋" },
  { id: "meeting", label: "Meeting", color: "#FF7BAC", icon: "💬" },
  { id: "personal", label: "Personal", color: "#70C8A0", icon: "🌿" },
  { id: "health", label: "Health", color: "#FFB870", icon: "🌸" },
];

export const DEFAULT_TEMPLATES = [
  { id: "tpl_deep", label: "🔮 Deep Work Day", events: [
    { title: "Morning Focus", start: [9, 0], end: [11, 0], category: "deep", fixed: false, allDay: false },
    { title: "Lunch", start: [12, 0], end: [13, 0], category: "personal", fixed: true, allDay: false },
    { title: "Afternoon Focus", start: [13, 0], end: [15, 0], category: "deep", fixed: false, allDay: false },
    { title: "Review & Plan", start: [16, 0], end: [17, 0], category: "admin", fixed: false, allDay: false },
  ] },
  { id: "tpl_light", label: "🌿 Light Day", events: [
    { title: "Morning Emails", start: [9, 0], end: [9, 30], category: "admin", fixed: false, allDay: false },
    { title: "Lunch", start: [12, 0], end: [13, 0], category: "personal", fixed: true, allDay: false },
    { title: "Gym", start: [17, 0], end: [18, 0], category: "health", fixed: false, allDay: false },
  ] },
];

export const DEFAULT_JOURNAL_ACTIVITIES = ["Workout", "Reading", "Crypto research", "Meditation", "Client follow-up"];

function todayAt(h, m, offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  d.setHours(h, m, 0, 0);
  return d;
}

function dateKeyFromOffset(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export const DEFAULT_EVENTS = [
  { id: "e1", title: "Team Standup", start: todayAt(9, 0), end: todayAt(9, 30), calendar: "work", category: "meeting", fixed: true, notes: "", allDay: false, recurrence: null },
  { id: "e2", title: "Deep Work", start: todayAt(10, 0), end: todayAt(12, 0), calendar: "work", category: "deep", fixed: false, notes: "Focus on top priority", allDay: false, recurrence: null },
  { id: "e3", title: "Lunch", start: todayAt(12, 0), end: todayAt(13, 0), calendar: "personal", category: "personal", fixed: true, notes: "", allDay: false, recurrence: null },
];

export const DEFAULT_TASKS = [
  { id: "t1", title: "Prepare budget slides", durationValue: 90, durationUnit: "minutes", category: "deep", done: false, deadline: dateKeyFromOffset(2), priority: "high", notes: "Slides 1-12", recurrence: null },
  { id: "t2", title: "Reply to vendor emails", durationValue: 30, durationUnit: "minutes", category: "admin", done: false, deadline: null, priority: "medium", notes: "", recurrence: null },
];

export const DEFAULT_SETTINGS = {
  fontSize: "md",
  darkMode: false,
  theme: "tempo",
  workStart: 9,
  workEnd: 19,
  notifs: false,
  timezone: typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "UTC",
  hiddenCalendars: [],
};

export function defaultAppState({ seeded = true } = {}) {
  return {
    version: STORAGE_VERSION,
    updatedAt: seeded ? new Date(0).toISOString() : new Date().toISOString(),
    seeded,
    events: seeded ? DEFAULT_EVENTS.map(ensureEventModel) : [],
    tasks: seeded ? DEFAULT_TASKS.map(ensureTaskModel) : [],
    categories: DEFAULT_CATEGORIES.map(c => ({ ...c })),
    templates: DEFAULT_TEMPLATES.map(t => ({ ...t, events: t.events.map(e => ({ ...e })) })),
    journalActivities: [...DEFAULT_JOURNAL_ACTIVITIES],
    journal: {},
    calendars: DEFAULT_CALENDARS.map(c => ({ ...c })),
    settings: { ...DEFAULT_SETTINGS },
  };
}

function replacer(_key, value) {
  if (value instanceof Date) return { __date: value.toISOString() };
  return value;
}

function reviver(_key, value) {
  if (value && value.__date) return new Date(value.__date);
  if (value && value.__d) return new Date(value.__d);
  return value;
}

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object || {}, key);
}

function normalizeArray(value, fallback) {
  return Array.isArray(value) ? value : fallback;
}

function isLegacyGoogleCalendar(calendar) {
  const text = `${calendar?.id || ""} ${calendar?.name || ""} ${calendar?.account || ""} ${calendar?.source || ""}`.toLowerCase();
  return text.includes("google");
}

export function normaliseState(input, { seedIfEmpty = false } = {}) {
  const d = defaultAppState({ seeded: seedIfEmpty });
  const s = input && typeof input === "object" ? input : {};
  const settingsSource = s.settings || {};
  return {
    ...d,
    ...s,
    version: STORAGE_VERSION,
    seeded: Boolean(s.seeded),
    updatedAt: s.updatedAt || s.updated_at || d.updatedAt,
    events: normalizeArray(s.events, d.events).map(ensureEventModel),
    tasks: normalizeArray(s.tasks, d.tasks).map(ensureTaskModel),
    categories: normalizeArray(s.categories, d.categories).map(c => ({ ...c })),
    templates: normalizeArray(s.templates, d.templates).map(t => ({ ...t, events: Array.isArray(t.events) ? t.events : [] })),
    journalActivities: normalizeArray(s.journalActivities, d.journalActivities),
    journal: s.journal && typeof s.journal === "object" ? s.journal : d.journal,
    calendars: normalizeArray(s.calendars, d.calendars).filter(c => !isLegacyGoogleCalendar(c)).map(c => ({ ...c })),
    settings: {
      ...d.settings,
      ...settingsSource,
    },
  };
}

export function touchState(state) {
  return { ...state, version: STORAGE_VERSION, updatedAt: new Date().toISOString() };
}

export function isSeededState(state) {
  return Boolean(state?.seeded);
}

function readJson(key) {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw, reviver) : null;
  } catch {
    return null;
  }
}

function writeJson(key, value) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value, replacer));
}

export function storageKeyForUser(userId) {
  return userId ? `tempo_app_state_v5_user_${userId}` : GLOBAL_STORAGE_KEY;
}

function migrateFromPhaseOneOrV3(raw) {
  if (!raw) return null;
  const settings = raw.settings || {};
  return normaliseState({
    ...raw,
    categories: raw.categories || settings.categories,
    templates: raw.templates || settings.templates,
    journalActivities: raw.journalActivities || settings.journalActivities,
    journal: raw.journal || settings.journal,
    calendars: raw.calendars || settings.calendars,
  }, { seedIfEmpty: false });
}

function migrateFromOriginalPerUserKeys(prefix) {
  if (typeof window === "undefined") return null;
  const events = readJson(`${prefix}_ev`);
  const tasks = readJson(`${prefix}_tk`);
  const hasEvents = Array.isArray(events);
  const hasTasks = Array.isArray(tasks);
  if (!hasEvents && !hasTasks) return null;
  return normaliseState({
    events: hasEvents ? events : [],
    tasks: hasTasks ? tasks : [],
    categories: readJson(`${prefix}_categories`) || undefined,
    templates: readJson(`${prefix}_templates`) || undefined,
    journalActivities: readJson(`${prefix}_journal_activities`) || undefined,
    journal: readJson(`${prefix}_journal`) || undefined,
    settings: {
      fontSize: readJson(`${prefix}_fs`) || undefined,
      darkMode: readJson(`${prefix}_dm`) ?? undefined,
      theme: readJson(`${prefix}_th`) || undefined,
      workStart: readJson(`${prefix}_ws`) ?? undefined,
      workEnd: readJson(`${prefix}_we`) ?? undefined,
      notifs: readJson(`${prefix}_nf`) ?? undefined,
      timezone: readJson(`${prefix}_tz`) || undefined,
    },
    updatedAt: readJson(`${prefix}_updated_at`) || new Date(0).toISOString(),
  }, { seedIfEmpty: false });
}

export function loadLocalState(userId = null) {
  if (typeof window === "undefined") return defaultAppState({ seeded: true });
  const userKey = storageKeyForUser(userId);
  const candidates = [];
  const current = readJson(userKey);
  if (current) candidates.push(normaliseState(current, { seedIfEmpty: false }));
  const global = readJson(GLOBAL_STORAGE_KEY);
  if (global) candidates.push(normaliseState(global, { seedIfEmpty: false }));
  for (const key of LEGACY_STORAGE_KEYS) {
    const legacy = readJson(key);
    if (legacy) candidates.push(migrateFromPhaseOneOrV3(legacy));
  }
  const legacyPrefixes = ["tempo_anon", "tempo_user", "tempo", "anon", "u_local"];
  for (const prefix of legacyPrefixes) {
    const migrated = migrateFromOriginalPerUserKeys(prefix);
    if (migrated) candidates.push(migrated);
  }
  const valid = candidates.filter(Boolean);
  if (!valid.length) return defaultAppState({ seeded: true });
  return valid.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0))[0];
}

export function saveLocalState(state, userId = null) {
  if (typeof window === "undefined") return;
  const touched = isSeededState(state) ? { ...state, version: STORAGE_VERSION } : touchState(state);
  writeJson(storageKeyForUser(userId), touched);
  if (!userId) writeJson(GLOBAL_STORAGE_KEY, touched);
}

let supabase = null;
async function getSupabase() {
  if (supabase) return supabase;
  if (typeof window === "undefined") throw new Error("Supabase is client-only here");
  if (!window.supabase) {
    await new Promise(resolve => {
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js";
      s.onload = resolve;
      s.onerror = resolve;
      document.head.appendChild(s);
      setTimeout(resolve, 5000);
    });
  }
  if (!window.supabase) throw new Error("Supabase library unavailable");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase env vars missing");
  supabase = window.supabase.createClient(url, key);
  return supabase;
}

export async function getCurrentSupabaseUser() {
  try {
    const sb = await getSupabase();
    const { data } = await sb.auth.getSession();
    return data?.session?.user || null;
  } catch {
    return null;
  }
}

export async function signInSupabase(email, password) {
  const sb = await getSupabase();
  return sb.auth.signInWithPassword({ email, password });
}

export async function signUpSupabase(email, password, name = "") {
  const sb = await getSupabase();
  return sb.auth.signUp({ email, password, options: { data: { name } } });
}

export async function signOutSupabase() {
  const sb = await getSupabase();
  return sb.auth.signOut();
}

export async function loadCloudState(userId) {
  if (!userId) return null;
  try {
    const sb = await getSupabase();
    const { data, error } = await sb.from("user_data").select("*").eq("user_id", userId).single();
    if (error || !data) return null;
    const settings = data.settings || {};
    return normaliseState({
      events: hasOwn(data, "events") ? data.events : [],
      tasks: hasOwn(data, "tasks") ? data.tasks : [],
      settings,
      categories: settings.categories,
      templates: settings.templates,
      journalActivities: settings.journalActivities,
      journal: settings.journal,
      calendars: settings.calendars,
      updatedAt: data.updated_at,
    }, { seedIfEmpty: false });
  } catch (e) {
    console.warn("Cloud load failed", e);
    return null;
  }
}

export async function saveCloudState(userId, state) {
  if (!userId) return;
  if (isSeededState(state)) return;
  try {
    const sb = await getSupabase();
    const cleanState = touchState(state);
    const settingsPayload = {
      ...(cleanState.settings || {}),
      categories: cleanState.categories || [],
      templates: cleanState.templates || [],
      journalActivities: cleanState.journalActivities || [],
      journal: cleanState.journal || {},
      calendars: cleanState.calendars || [],
      version: STORAGE_VERSION,
    };
    const { error } = await sb.from("user_data").upsert(
      {
        user_id: userId,
        events: JSON.parse(JSON.stringify(cleanState.events || [], replacer)),
        tasks: JSON.parse(JSON.stringify(cleanState.tasks || [], replacer)),
        settings: JSON.parse(JSON.stringify(settingsPayload, replacer)),
        updated_at: cleanState.updatedAt,
      },
      { onConflict: "user_id" }
    );
    if (error) throw error;
  } catch (e) {
    console.warn("Cloud save failed", e);
  }
}

export function chooseLatestState(localState, cloudState) {
  if (!cloudState) return localState;
  if (!localState) return cloudState;
  if (isSeededState(localState)) return cloudState;
  if (isSeededState(cloudState)) return localState;
  const localTime = new Date(localState.updatedAt || 0).getTime();
  const cloudTime = new Date(cloudState.updatedAt || 0).getTime();
  return cloudTime > localTime ? cloudState : localState;
}

export async function hydrateStateSafely() {
  const localBeforeAuth = loadLocalState(null);
  const user = await getCurrentSupabaseUser();
  const localForUser = loadLocalState(user?.id || null);
  const local = chooseLatestState(localBeforeAuth, localForUser);
  const cloud = user?.id ? await loadCloudState(user.id) : null;
  const state = chooseLatestState(local, cloud);
  return { user, state };
}
