import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/calendar.readonly",
];

const GOOGLE_COLOR_FALLBACKS = ["#FF7BAC", "#B08AE0", "#70C8A0", "#A0C8E0", "#FFB870", "#C060A0"];

export function jsonResponse(body, status = 200) {
  return Response.json(body, { status });
}

export function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing server environment variable ${name}`);
  return value;
}

export function getSupabaseAdmin() {
  return createClient(requireEnv("NEXT_PUBLIC_SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}


const RATE_LIMITS = new Map();

export function getBearerToken(request) {
  const header = request.headers.get("authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1] || null;
}

export async function requireAuthenticatedUser(request) {
  const token = getBearerToken(request);
  if (!token) {
    const err = new Error("Unauthorized");
    err.status = 401;
    throw err;
  }
  const sb = getSupabaseAdmin();
  const { data, error } = await sb.auth.getUser(token);
  if (error || !data?.user?.id) {
    const err = new Error("Unauthorized");
    err.status = 401;
    throw err;
  }
  return data.user;
}

export function rateLimit(request, { key = "default", limit = 60, windowMs = 60_000 } = {}) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  const bucketKey = `${key}:${ip}`;
  const now = Date.now();
  const bucket = RATE_LIMITS.get(bucketKey) || { count: 0, resetAt: now + windowMs };
  if (bucket.resetAt <= now) {
    bucket.count = 0;
    bucket.resetAt = now + windowMs;
  }
  bucket.count += 1;
  RATE_LIMITS.set(bucketKey, bucket);
  if (bucket.count > limit) {
    const err = new Error("Too many requests");
    err.status = 429;
    throw err;
  }
}

export function appBaseUrl(request) {
  const configured = process.env.TEMPO_APP_URL || process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`;
  if (configured) return configured.replace(/\/+$/, "");
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

export function googleRedirectUri(request) {
  return process.env.GOOGLE_REDIRECT_URI || `${appBaseUrl(request)}/api/google/auth/callback`;
}

function base64url(input) {
  return Buffer.from(input).toString("base64url");
}

function stateSecret() {
  return process.env.GOOGLE_OAUTH_STATE_SECRET || process.env.CRON_SECRET || process.env.GOOGLE_CLIENT_SECRET || "tempo-dev-state-secret";
}

function signState(payload) {
  return crypto.createHmac("sha256", stateSecret()).update(payload).digest("base64url");
}


function tokenEncryptionKey() {
  const raw = requireEnv("GOOGLE_TOKEN_ENCRYPTION_KEY");
  const asBase64 = Buffer.from(raw, "base64");
  if (asBase64.length === 32) return asBase64;
  return crypto.createHash("sha256").update(raw).digest();
}

function encryptToken(value) {
  if (!value) return value;
  if (String(value).startsWith("enc:")) return value;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", tokenEncryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(String(value), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `enc:${Buffer.concat([iv, tag, ciphertext]).toString("base64url")}`;
}

function decryptToken(value) {
  if (!value || !String(value).startsWith("enc:")) return value || null;
  const packed = Buffer.from(String(value).slice(4), "base64url");
  if (packed.length <= 28) throw new Error("Invalid encrypted Google token");
  const iv = packed.subarray(0, 12);
  const tag = packed.subarray(12, 28);
  const ciphertext = packed.subarray(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", tokenEncryptionKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}

function withDecryptedGoogleTokens(row) {
  if (!row) return row;
  return {
    ...row,
    access_token: decryptToken(row.access_token),
    refresh_token: decryptToken(row.refresh_token),
  };
}

export function safeReturnPath(returnTo = "/") {
  const raw = String(returnTo || "/").trim();
  if (!raw || raw.startsWith("//") || /^[a-z][a-z0-9+.-]*:/i.test(raw)) return "/?page=calendar";
  return raw.startsWith("/") ? raw : `/${raw}`;
}

export function sanitizeGoogleError(err) {
  if (process.env.NODE_ENV === "production") return err.status === 429 ? "Too many requests" : err.status === 401 ? "Unauthorized" : "Google Calendar request failed";
  return err.message || "Google Calendar request failed";
}

export function validateGoogleSyncWindow({ timeMin, timeMax } = {}) {
  const min = timeMin ? new Date(timeMin) : new Date(Date.now() - 90 * 86400000);
  const max = timeMax ? new Date(timeMax) : new Date(Date.now() + 365 * 86400000);
  if (Number.isNaN(min.getTime()) || Number.isNaN(max.getTime()) || min >= max) {
    const err = new Error("Invalid Google sync time window");
    err.status = 400;
    throw err;
  }
  const maxWindowMs = 550 * 86400000;
  if (max.getTime() - min.getTime() > maxWindowMs) {
    const err = new Error("Google sync window is too large");
    err.status = 400;
    throw err;
  }
  return { timeMin: min.toISOString(), timeMax: max.toISOString() };
}

export function buildOAuthState({ userId, returnTo = "/" }) {
  const payload = JSON.stringify({ userId, returnTo, nonce: crypto.randomBytes(12).toString("base64url"), ts: Date.now() });
  const encoded = base64url(payload);
  return `${encoded}.${signState(encoded)}`;
}

export function verifyOAuthState(state) {
  const [encoded, sig] = String(state || "").split(".");
  if (!encoded || !sig) throw new Error("Invalid OAuth state");
  const expected = signState(encoded);
  const sigBuffer = Buffer.from(sig);
  const expectedBuffer = Buffer.from(expected);
  if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) throw new Error("OAuth state mismatch");
  const parsed = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
  if (!parsed.userId) throw new Error("OAuth state missing user");
  if (Date.now() - Number(parsed.ts || 0) > 15 * 60 * 1000) throw new Error("OAuth state expired");
  return parsed;
}

export function googleAuthUrl(request, { userId, returnTo }) {
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", requireEnv("GOOGLE_CLIENT_ID"));
  url.searchParams.set("redirect_uri", googleRedirectUri(request));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", GOOGLE_SCOPES.join(" "));
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("include_granted_scopes", "true");
  url.searchParams.set("state", buildOAuthState({ userId, returnTo: safeReturnPath(returnTo) }));
  return url.toString();
}

export async function exchangeCodeForTokens(request, code) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: requireEnv("GOOGLE_CLIENT_ID"),
      client_secret: requireEnv("GOOGLE_CLIENT_SECRET"),
      redirect_uri: googleRedirectUri(request),
      grant_type: "authorization_code",
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error_description || data.error || "Google token exchange failed");
  return data;
}

async function refreshAccessToken(refreshToken) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: requireEnv("GOOGLE_CLIENT_ID"),
      client_secret: requireEnv("GOOGLE_CLIENT_SECRET"),
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error_description || data.error || "Google token refresh failed");
  return data;
}

export async function storeGoogleTokens(userId, tokenData) {
  const sb = getSupabaseAdmin();
  const expiresAt = new Date(Date.now() + Math.max(60, Number(tokenData.expires_in || 3600)) * 1000).toISOString();
  const row = {
    user_id: userId,
    access_token: encryptToken(tokenData.access_token),
    expires_at: expiresAt,
    scope: tokenData.scope || GOOGLE_SCOPES.join(" "),
    token_type: tokenData.token_type || "Bearer",
    updated_at: new Date().toISOString(),
  };
  if (tokenData.refresh_token) row.refresh_token = encryptToken(tokenData.refresh_token);
  const { error } = await sb.from("google_calendar_tokens").upsert(row, { onConflict: "user_id" });
  if (error) throw error;
  return row;
}

export async function getValidGoogleToken(userId) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb.from("google_calendar_tokens").select("*").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  if (!data?.access_token) return null;
  const tokenRow = withDecryptedGoogleTokens(data);
  const expiresAt = tokenRow.expires_at ? new Date(tokenRow.expires_at).getTime() : 0;
  if (expiresAt - Date.now() > 2 * 60 * 1000) return tokenRow;
  if (!tokenRow.refresh_token) return tokenRow;
  const refreshed = await refreshAccessToken(tokenRow.refresh_token);
  const expires_at = new Date(Date.now() + Math.max(60, Number(refreshed.expires_in || 3600)) * 1000).toISOString();
  const patch = {
    access_token: encryptToken(refreshed.access_token),
    expires_at,
    scope: refreshed.scope || tokenRow.scope,
    token_type: refreshed.token_type || tokenRow.token_type || "Bearer",
    updated_at: new Date().toISOString(),
  };
  const { data: updated, error: updateError } = await sb.from("google_calendar_tokens").update(patch).eq("user_id", userId).select("*").maybeSingle();
  if (updateError) throw updateError;
  return withDecryptedGoogleTokens(updated || { ...tokenRow, ...patch });
}

export async function googleFetch(userId, path, options = {}) {
  const token = await getValidGoogleToken(userId);
  if (!token?.access_token) {
    const err = new Error("Google Calendar is not connected");
    err.status = 401;
    throw err;
  }
  const url = path.startsWith("http") ? path : `https://www.googleapis.com/calendar/v3${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "authorization": `Bearer ${token.access_token}`,
      "content-type": "application/json",
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data?.error?.message || data.error_description || data.error || "Google Calendar API request failed");
    err.status = res.status;
    err.details = data;
    throw err;
  }
  return data;
}

function shortHash(value, len = 12) {
  return crypto.createHash("sha1").update(String(value)).digest("hex").slice(0, len);
}

export function tempoGoogleCalendarId(googleCalendarId) {
  const slug = String(googleCalendarId || "google")
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 38) || "google";
  return `google-${slug}-${shortHash(googleCalendarId, 8)}`;
}

export function tempoGoogleEventId(googleCalendarId, googleEventId) {
  return `gcal-${shortHash(`${googleCalendarId}:${googleEventId}`, 20)}`;
}

function googleCalendarColor(item, index) {
  return item.backgroundColor || item.foregroundColor || GOOGLE_COLOR_FALLBACKS[index % GOOGLE_COLOR_FALLBACKS.length];
}

export function mapGoogleCalendar(item, index = 0, existing = null) {
  const id = tempoGoogleCalendarId(item.id);
  const accessRole = item.accessRole || "reader";
  const readOnly = ["reader", "freeBusyReader"].includes(accessRole);
  return {
    ...(existing || {}),
    id,
    name: item.summaryOverride || item.summary || existing?.name || "Google Calendar",
    color: existing?.color || googleCalendarColor(item, index),
    account: "Google",
    source: "google",
    googleCalendarId: item.id,
    readOnly,
    visible: existing?.visible ?? !item.hidden,
    syncEnabled: existing?.syncEnabled ?? true,
    googleAccessRole: accessRole,
    googlePrimary: Boolean(item.primary),
    googleSummaryOverride: item.summaryOverride || null,
    updatedAt: new Date().toISOString(),
    createdAt: existing?.createdAt || new Date().toISOString(),
  };
}

export async function listGoogleCalendars(userId) {
  const data = await googleFetch(userId, "/users/me/calendarList?minAccessRole=reader&showDeleted=false&showHidden=true");
  return Array.isArray(data.items) ? data.items : [];
}

function isDateOnly(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));
}

function assertValidDate(date, label = "date") {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    const err = new Error(`Invalid Google event ${label}`);
    err.status = 400;
    throw err;
  }
  return date;
}

function timeZoneOffsetMs(date, timeZone = "Asia/Singapore") {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).formatToParts(date);
    const map = Object.fromEntries(parts.map(part => [part.type, part.value]));
    const hour = map.hour === "24" ? "00" : map.hour;
    const asUtc = Date.UTC(Number(map.year), Number(map.month) - 1, Number(map.day), Number(hour), Number(map.minute), Number(map.second));
    return asUtc - date.getTime();
  } catch {
    return 0;
  }
}

function zonedDateOnlyToUtc(value, timeZone = "Asia/Singapore") {
  const [year, month, day] = String(value || "").split("-").map(Number);
  if (!year || !month || !day) return null;
  const utcGuess = Date.UTC(year, month - 1, day, 0, 0, 0, 0);
  const firstPass = new Date(utcGuess - timeZoneOffsetMs(new Date(utcGuess), timeZone));
  const secondPass = new Date(utcGuess - timeZoneOffsetMs(firstPass, timeZone));
  return assertValidDate(secondPass, "all-day date");
}

function parseGoogleDate(value, fallback = null, { timeZone = "Asia/Singapore", allDay = false } = {}) {
  if (!value) return fallback ? new Date(fallback) : null;
  if (allDay || isDateOnly(value)) return zonedDateOnlyToUtc(value, timeZone);
  return assertValidDate(new Date(value), "dateTime");
}

function cleanGoogleText(value = "", max = 1600) {
  const text = String(value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max - 1).trim()}…` : text;
}

function googleEventTitle(item = {}) {
  const summary = cleanGoogleText(item.summary || "", 180);
  if (summary) return summary;
  const location = cleanGoogleText(item.location || "", 80);
  if (location) return `Google event at ${location}`;
  return "Untitled Google event";
}

export function googleEventTempoId(item, calendar) {
  return tempoGoogleEventId(calendar.googleCalendarId, item.id);
}

export function mapGoogleEvent(item, calendar, { timeZone = "Asia/Singapore" } = {}) {
  if (!item?.id) {
    const err = new Error("Google event is missing an id");
    err.status = 400;
    throw err;
  }
  if (item.status === "cancelled" && !item.start && !item.end) {
    return {
      id: googleEventTempoId(item, calendar),
      source: "google",
      externalSource: "google_calendar",
      googleEventId: item.id,
      googleCalendarId: calendar.googleCalendarId,
      googleStatus: "cancelled",
      deletedAt: item.updated || new Date().toISOString(),
      updatedAt: item.updated || new Date().toISOString(),
    };
  }

  const isAllDay = Boolean(item.start?.date && !item.start?.dateTime);
  const start = parseGoogleDate(item.start?.dateTime || item.start?.date, null, { timeZone, allDay: isAllDay });
  if (!start) {
    const err = new Error("Google event is missing a start date");
    err.status = 422;
    throw err;
  }
  const fallbackEnd = isAllDay && item.start?.date ? item.start.date : start;
  let end = parseGoogleDate(item.end?.dateTime || item.end?.date, fallbackEnd, { timeZone, allDay: isAllDay });
  if (!end || end <= start) {
    end = isAllDay ? parseGoogleDate(item.start?.date, start, { timeZone, allDay: true }) : new Date(start.getTime() + 30 * 60000);
    if (isAllDay) end = new Date(end.getTime() + 24 * 60 * 60000);
  }

  return {
    id: googleEventTempoId(item, calendar),
    title: googleEventTitle(item),
    start,
    end,
    allDay: isAllDay,
    calendar: calendar.id,
    category: "meeting",
    fixed: true,
    color: calendar.color || null,
    notes: cleanGoogleText(item.description || item.location || "", 1600),
    location: cleanGoogleText(item.location || "", 240),
    recurrence: null,
    reminder: { type: "none" },
    source: "google",
    externalSource: "google_calendar",
    googleEventId: item.id,
    googleRecurringEventId: item.recurringEventId || null,
    googleOriginalStartTime: item.originalStartTime || null,
    googleCalendarId: calendar.googleCalendarId,
    googleHtmlLink: item.htmlLink || "",
    googleICalUID: item.iCalUID || null,
    googleSequence: item.sequence ?? null,
    googleUpdatedAt: item.updated || null,
    googleStatus: item.status || "confirmed",
    googleAllDayEndExclusive: isAllDay ? (item.end?.date || null) : null,
    readOnly: true,
    createdAt: item.created || new Date().toISOString(),
    updatedAt: item.updated || new Date().toISOString(),
  };
}

export async function listGoogleEvents(userId, googleCalendarId, { timeMin, timeMax } = {}) {
  const syncWindow = validateGoogleSyncWindow({ timeMin, timeMax });
  const params = new URLSearchParams({
    singleEvents: "true",
    orderBy: "startTime",
    showDeleted: "true",
    maxResults: "2500",
    timeMin: syncWindow.timeMin,
    timeMax: syncWindow.timeMax,
  });
  const out = [];
  let pageToken = "";
  do {
    if (pageToken) params.set("pageToken", pageToken);
    const data = await googleFetch(userId, `/calendars/${encodeURIComponent(googleCalendarId)}/events?${params.toString()}`);
    out.push(...(Array.isArray(data.items) ? data.items : []));
    pageToken = data.nextPageToken || "";
  } while (pageToken);
  return out;
}

export async function loadUserData(userId) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb.from("user_data").select("user_id, events, tasks, settings, updated_at").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  return data || { user_id: userId, events: [], tasks: [], settings: {}, updated_at: null };
}

function reviveEventForServer(ev) {
  const revive = v => v?.__d ? new Date(v.__d) : v;
  return {
    ...ev,
    start: revive(ev.start),
    end: revive(ev.end),
  };
}

function eventOverlapsWindow(ev, syncWindow = {}) {
  const start = ev?.start instanceof Date ? ev.start : new Date(ev?.start?.__d ?? ev?.start);
  const end = ev?.end instanceof Date ? ev.end : new Date(ev?.end?.__d ?? ev?.end);
  const min = syncWindow.timeMin ? new Date(syncWindow.timeMin) : null;
  const max = syncWindow.timeMax ? new Date(syncWindow.timeMax) : null;
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false;
  if (min && end <= min) return false;
  if (max && start >= max) return false;
  return true;
}

export function mergeGoogleImport({ existingEvents = [], googleEvents = [], cancelledIds = new Set(), seenIds = new Set(), syncedCalendarIds = new Set(), syncWindow = null } = {}) {
  const now = new Date().toISOString();
  const byId = new Map((Array.isArray(existingEvents) ? existingEvents : []).map(ev => [ev.id, reviveEventForServer(ev)]));

  cancelledIds.forEach(id => {
    const existing = byId.get(id);
    if (existing?.source === "google") byId.set(id, { ...existing, deletedAt: existing.deletedAt || now, updatedAt: now, googleStatus: "cancelled" });
  });

  googleEvents.forEach(ev => {
    const prev = byId.get(ev.id);
    if (prev?.source && prev.source !== "google") return;
    const protectedLocalFields = prev?.source === "google" ? { createdAt: prev.createdAt || ev.createdAt } : {};
    byId.set(ev.id, { ...(prev || {}), ...ev, ...protectedLocalFields, source: "google", externalSource: "google_calendar", readOnly: true, deletedAt: null, updatedAt: ev.updatedAt || now, lastImportedAt: now });
  });

  if (syncWindow && syncedCalendarIds?.size && seenIds?.size) {
    byId.forEach((ev, id) => {
      if (ev?.source !== "google" || ev.deletedAt) return;
      if (!syncedCalendarIds.has(ev.googleCalendarId)) return;
      if (seenIds.has(id)) return;
      if (!eventOverlapsWindow(ev, syncWindow)) return;
      byId.set(id, { ...ev, deletedAt: now, updatedAt: now, googleStatus: "missing_from_sync" });
    });
  }
  return [...byId.values()];
}

export async function saveUserData(userId, { events, tasks, settings }) {
  const sb = getSupabaseAdmin();
  const { data: current } = await sb.from("user_data").select("tasks, settings").eq("user_id", userId).maybeSingle();
  const row = {
    user_id: userId,
    events: JSON.parse(JSON.stringify(events || [])),
    tasks: JSON.parse(JSON.stringify(tasks ?? current?.tasks ?? [])),
    settings: JSON.parse(JSON.stringify(settings ?? current?.settings ?? {})),
    updated_at: new Date().toISOString(),
  };
  const { error } = await sb.from("user_data").upsert(row, { onConflict: "user_id" });
  if (error) throw error;
  return row;
}

export function googleCalendarSettingsFromList(existingSettings = {}, googleItems = []) {
  const existingCalendars = Array.isArray(existingSettings.calendars) ? existingSettings.calendars : [];
  const existingByGoogleId = new Map(existingCalendars.filter(c => c.source === "google" && c.googleCalendarId).map(c => [c.googleCalendarId, c]));
  const googleCalendars = googleItems.map((item, i) => mapGoogleCalendar(item, i, existingByGoogleId.get(item.id)));
  const tempoCalendars = existingCalendars.filter(c => c.source !== "google");
  const calendars = [...tempoCalendars, ...googleCalendars];
  const validCalendarIds = new Set(calendars.map(cal => cal.id));
  const hidden = new Set((Array.isArray(existingSettings.hiddenCals) ? existingSettings.hiddenCals : []).filter(id => validCalendarIds.has(id)));
  googleCalendars.forEach(cal => {
    if (cal.visible === false) hidden.add(cal.id);
    else hidden.delete(cal.id);
  });
  return {
    ...existingSettings,
    calendars,
    hiddenCals: [...hidden],
    googleCalendarSync: {
      ...(existingSettings.googleCalendarSync || {}),
      connected: true,
      lastCalendarRefreshAt: new Date().toISOString(),
    },
  };
}

export async function handleRouteError(err) {
  console.error("Google Calendar route failed", err);
  const status = err.status || 500;
  const body = { ok: false, error: sanitizeGoogleError(err) };
  if (process.env.NODE_ENV !== "production" && err.details) body.details = err.details;
  return jsonResponse(body, status);
}
