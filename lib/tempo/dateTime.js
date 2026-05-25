export const TEMPO_FALLBACK_TIMEZONE = "Asia/Singapore";
const DATE_KEY_RE = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;
const MONTH_KEY_RE = /^(\d{4})-(\d{1,2})$/;

export function normalizeTimeZone(value, fallback = TEMPO_FALLBACK_TIMEZONE) {
  const candidate = String(value || fallback || TEMPO_FALLBACK_TIMEZONE).trim() || TEMPO_FALLBACK_TIMEZONE;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: candidate }).format(new Date());
    return candidate;
  } catch {
    return fallback === candidate ? TEMPO_FALLBACK_TIMEZONE : normalizeTimeZone(fallback, TEMPO_FALLBACK_TIMEZONE);
  }
}

export function safeDate(value, fallback = null) {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? fallback : value;
  if (value && typeof value === "object" && value.__d) return safeDate(value.__d, fallback);
  if (value === null || value === undefined || value === "") return fallback;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date;
}

export function padDatePart(value, width = 2) {
  return String(Number(value)).padStart(width, "0");
}

export function normalizeDateKey(value, fallback = null) {
  if (value instanceof Date) return dateKeyInTimeZone(value);
  const raw = String(value || "").trim().slice(0, 10);
  const match = raw.match(DATE_KEY_RE);
  if (!match) return fallback;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day) || year < 1900 || year > 9999 || month < 1 || month > 12 || day < 1 || day > 31) return fallback;
  const utc = new Date(Date.UTC(year, month - 1, day));
  if (utc.getUTCFullYear() !== year || utc.getUTCMonth() !== month - 1 || utc.getUTCDate() !== day) return fallback;
  return `${padDatePart(year, 4)}-${padDatePart(month)}-${padDatePart(day)}`;
}

export function normalizeMonthKey(value, fallback = null) {
  const raw = String(value || "").trim().slice(0, 7);
  const match = raw.match(MONTH_KEY_RE);
  if (!match) return fallback;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (!Number.isInteger(year) || !Number.isInteger(month) || year < 1900 || year > 9999 || month < 1 || month > 12) return fallback;
  return `${padDatePart(year, 4)}-${padDatePart(month)}`;
}

export function getLocalDateTimeParts(value = new Date(), timeZone = TEMPO_FALLBACK_TIMEZONE) {
  const date = safeDate(value, new Date());
  const tz = normalizeTimeZone(timeZone);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const lookup = Object.fromEntries(parts.map(part => [part.type, part.value]));
  const hour = lookup.hour === "24" ? 0 : Number(lookup.hour);
  const year = Number(lookup.year);
  const month = Number(lookup.month);
  const day = Number(lookup.day);
  return {
    timeZone: tz,
    weekday: lookup.weekday,
    year,
    month,
    day,
    hour,
    minute: Number(lookup.minute),
    second: Number(lookup.second || 0),
    dateKey: `${padDatePart(year, 4)}-${padDatePart(month)}-${padDatePart(day)}`,
  };
}

export function dateKeyInTimeZone(value = new Date(), timeZone = TEMPO_FALLBACK_TIMEZONE) {
  return getLocalDateTimeParts(value, timeZone).dateKey;
}

export function monthKeyInTimeZone(value = new Date(), timeZone = TEMPO_FALLBACK_TIMEZONE) {
  return dateKeyInTimeZone(value, timeZone).slice(0, 7);
}

export function dateKeyToUtcDate(key) {
  const normalized = normalizeDateKey(key, null);
  if (!normalized) return null;
  const [year, month, day] = normalized.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
}

export function dateKeyFromUtcDate(value) {
  const date = safeDate(value, null);
  if (!date) return null;
  return `${padDatePart(date.getUTCFullYear(), 4)}-${padDatePart(date.getUTCMonth() + 1)}-${padDatePart(date.getUTCDate())}`;
}

export function weekdayForDateKey(key) {
  const date = dateKeyToUtcDate(key);
  return date ? date.getUTCDay() : null;
}

export function addDaysToDateKey(key, days = 0) {
  const date = dateKeyToUtcDate(key);
  if (!date) return null;
  date.setUTCDate(date.getUTCDate() + Number(days || 0));
  return dateKeyFromUtcDate(date);
}

export function weekStartKeyFromDateKey(key, weekStartsOn = 1) {
  const date = dateKeyToUtcDate(key);
  if (!date) return null;
  const dow = date.getUTCDay();
  const normalizedStart = ((Number(weekStartsOn) || 0) % 7 + 7) % 7;
  const diff = (dow - normalizedStart + 7) % 7;
  date.setUTCDate(date.getUTCDate() - diff);
  return dateKeyFromUtcDate(date);
}

export function monthKeyFromDateKey(key) {
  const normalized = normalizeDateKey(key, null);
  return normalized ? normalized.slice(0, 7) : null;
}

export function normalizeClockTime(value, fallback = "09:00") {
  const match = String(value || "").trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return fallback;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) return fallback;
  return `${padDatePart(hour)}:${padDatePart(minute)}`;
}

export function parseClockTime(value) {
  const normalized = normalizeClockTime(value, null);
  if (!normalized) return null;
  const [hour, minute] = normalized.split(":").map(Number);
  return { hour, minute, value: normalized };
}

export function localDateTimeMs(parts, time = null) {
  const clock = time ? parseClockTime(time) : null;
  const hour = clock ? clock.hour : Number(parts?.hour || 0);
  const minute = clock ? clock.minute : Number(parts?.minute || 0);
  return Date.UTC(Number(parts?.year), Number(parts?.month) - 1, Number(parts?.day), hour, minute, 0, 0);
}

export function localClockDue(parts, time, lookbackMinutes = 0, lookaheadMinutes = 0) {
  const clock = parseClockTime(time);
  if (!clock || !parts?.year || !parts?.month || !parts?.day) return false;
  const nowMs = localDateTimeMs(parts);
  const dueMs = localDateTimeMs(parts, clock.value);
  return dueMs >= nowMs - Number(lookbackMinutes || 0) * 60000 && dueMs <= nowMs + Number(lookaheadMinutes || 0) * 60000;
}

export function dateAtLocalClockUtc(parts, time) {
  const clock = parseClockTime(time);
  if (!clock || !parts?.year || !parts?.month || !parts?.day) return new Date();
  return new Date(Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), clock.hour, clock.minute, 0, 0));
}

export function addDaysUTC(value, days = 0) {
  const date = safeDate(value, new Date());
  const out = new Date(date.getTime());
  out.setUTCDate(out.getUTCDate() + Number(days || 0));
  return out;
}

export function addMonthsUTC(value, months = 0) {
  const date = safeDate(value, new Date());
  const out = new Date(date.getTime());
  out.setUTCMonth(out.getUTCMonth() + Number(months || 0));
  return out;
}

function timeZoneOffsetMs(date, timeZone = TEMPO_FALLBACK_TIMEZONE) {
  try {
    const parts = getLocalDateTimeParts(date, timeZone);
    const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second || 0);
    return asUtc - date.getTime();
  } catch {
    return 0;
  }
}

export function zonedDateOnlyToUtc(value, timeZone = TEMPO_FALLBACK_TIMEZONE) {
  const key = normalizeDateKey(value, null);
  if (!key) return null;
  const [year, month, day] = key.split("-").map(Number);
  const utcGuess = Date.UTC(year, month - 1, day, 0, 0, 0, 0);
  const firstPass = new Date(utcGuess - timeZoneOffsetMs(new Date(utcGuess), timeZone));
  return new Date(utcGuess - timeZoneOffsetMs(firstPass, timeZone));
}

export function googleAllDayRangeToUtc(startKey, endExclusiveKey = null, timeZone = TEMPO_FALLBACK_TIMEZONE) {
  const normalizedStart = normalizeDateKey(startKey, null);
  if (!normalizedStart) return { start: null, end: null, startKey: null, endExclusiveKey: null };
  const normalizedEndExclusive = normalizeDateKey(endExclusiveKey, null) || addDaysToDateKey(normalizedStart, 1);
  const start = zonedDateOnlyToUtc(normalizedStart, timeZone);
  let end = zonedDateOnlyToUtc(normalizedEndExclusive, timeZone);
  if (!end || !start || end <= start) end = zonedDateOnlyToUtc(addDaysToDateKey(normalizedStart, 1), timeZone);
  return { start, end, startKey: normalizedStart, endExclusiveKey: normalizedEndExclusive };
}
