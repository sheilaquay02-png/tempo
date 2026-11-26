import { normalizeDateKey, normalizeMonthKey, normalizeTimeZone } from "./dateTime.js";
// Conservative validation and sanitization helpers for Tempo API boundaries.
// These helpers intentionally preserve Tempo's existing data shape while making
// server routes safer around malformed JSON, oversized strings, and unexpected
// payload types.

export class TempoValidationError extends Error {
  constructor(message = "Invalid request", status = 400, details = null) {
    super(message);
    this.name = "TempoValidationError";
    this.status = status;
    if (details) this.details = details;
  }
}

export const isPlainObject = value => Boolean(value) && typeof value === "object" && !Array.isArray(value);

export function validationError(message = "Invalid request", status = 400, details = null) {
  return new TempoValidationError(message, status, details);
}

export async function readJsonBody(request, { maxBytes = 256 * 1024, fallback = {} } = {}) {
  const text = await request.text().catch(() => "");
  if (!text) return fallback;
  if (text.length > maxBytes) throw validationError("Request body is too large", 413);
  try {
    const parsed = JSON.parse(text);
    if (!isPlainObject(parsed)) throw validationError("Request body must be a JSON object", 400);
    return parsed;
  } catch (err) {
    if (err instanceof TempoValidationError) throw err;
    throw validationError("Invalid JSON body", 400);
  }
}

export function asTrimmedString(value, fallback = "", maxLength = 4000) {
  const text = String(value ?? fallback ?? "").trim();
  if (!text) return fallback;
  return text.length > maxLength ? text.slice(0, maxLength) : text;
}

export function assertString(value, name, { maxLength = 500, required = true } = {}) {
  const text = asTrimmedString(value, "", maxLength);
  if (required && !text) throw validationError(`Missing ${name}`, 400);
  return text;
}

export function assertSupabaseUserId(value, name = "userId") {
  const text = assertString(value, name, { maxLength: 80 });
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(text)) {
    throw validationError(`Invalid ${name}`, 400);
  }
  return text;
}

export function assertHttpsUrl(value, name = "url", { maxLength = 2000 } = {}) {
  const text = assertString(value, name, { maxLength });
  try {
    const url = new URL(text);
    if (url.protocol !== "https:") throw new Error("Expected https");
    return text;
  } catch {
    throw validationError(`Invalid ${name}`, 400);
  }
}

export function normalizeBoolean(value, fallback = false) {
  if (value === undefined || value === null) return fallback;
  return Boolean(value);
}

export function normalizeUrlPath(value, fallback = "/") {
  const raw = asTrimmedString(value, fallback, 600);
  if (!raw || raw.startsWith("//") || /^[a-z][a-z0-9+.-]*:/i.test(raw)) return fallback;
  return raw.startsWith("/") ? raw : `/${raw}`;
}

function deepJsonSanitize(value, depth = 0) {
  if (depth > 8) return null;
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value;
  if (["string", "number", "boolean"].includes(typeof value)) {
    if (typeof value === "string") return value.length > 12000 ? value.slice(0, 12000) : value;
    if (typeof value === "number") return Number.isFinite(value) ? value : 0;
    return value;
  }
  if (Array.isArray(value)) return value.slice(0, 12000).map(item => deepJsonSanitize(item, depth + 1)).filter(item => item !== undefined);
  if (!isPlainObject(value)) return null;
  const out = {};
  Object.entries(value).slice(0, 1200).forEach(([key, item]) => {
    const safeKey = asTrimmedString(key, "", 120);
    if (!safeKey || safeKey === "__proto__" || safeKey === "constructor" || safeKey === "prototype") return;
    const clean = deepJsonSanitize(item, depth + 1);
    if (clean !== undefined) out[safeKey] = clean;
  });
  return out;
}

export function sanitizeEventRecord(event = {}) {
  const clean = deepJsonSanitize(event) || {};
  if (!clean.id) clean.id = `event-${Date.now()}`;
  if (clean.title !== undefined) clean.title = asTrimmedString(clean.title, "Untitled event", 240);
  return clean;
}

export function sanitizeTaskRecord(task = {}) {
  const clean = deepJsonSanitize(task) || {};
  if (!clean.id) clean.id = `task-${Date.now()}`;
  if (clean.title !== undefined) clean.title = asTrimmedString(clean.title, "Untitled task", 240);
  ["taskDate", "dayKey", "dateKey", "scheduled", "deadline", "completedDate"].forEach(key => {
    if (clean[key] === undefined || clean[key] === null || clean[key] === "") return;
    const normalized = normalizeDateKey(clean[key], null);
    if (normalized) clean[key] = normalized;
  });
  if (clean.weekKey) clean.weekKey = normalizeDateKey(clean.weekKey, clean.weekKey);
  if (clean.monthKey) clean.monthKey = normalizeMonthKey(clean.monthKey, clean.monthKey);
  return clean;
}

export function sanitizeSettingsRecord(settings = {}) {
  const clean = isPlainObject(settings) ? (deepJsonSanitize(settings) || {}) : {};
  if (clean.timezone) clean.timezone = normalizeTimeZone(clean.timezone);
  return clean;
}

export function sanitizeUserDataPayload(payload = {}) {
  const source = isPlainObject(payload) ? payload : {};
  return {
    events: Array.isArray(source.events) ? source.events.slice(0, 12000).filter(Boolean).map(sanitizeEventRecord) : [],
    tasks: Array.isArray(source.tasks) ? source.tasks.slice(0, 12000).filter(Boolean).map(sanitizeTaskRecord) : [],
    settings: sanitizeSettingsRecord(source.settings || {}),
  };
}
