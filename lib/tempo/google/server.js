import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { sanitizeUserDataPayload } from "../validation.js";
import { dateKeyInTimeZone, normalizeTimeZone, zonedDateOnlyToUtc } from "../dateTime.js";
import { enforceRateLimit } from "../rateLimit.js";
import {
  googleCalendarSettingsFromList,
  googleEventTempoId,
  mapGoogleCalendar,
  mapGoogleEvent,
  mergeGoogleImport,
  tempoGoogleCalendarId,
  tempoGoogleEventId,
} from "./mapping.js";

export {
  googleCalendarSettingsFromList,
  googleEventTempoId,
  mapGoogleCalendar,
  mapGoogleEvent,
  mergeGoogleImport,
  tempoGoogleCalendarId,
  tempoGoogleEventId,
};

const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/calendar.readonly",
];

const GOOGLE_SYNC_STATE_TABLE = "google_calendar_sync_state";
const TABLE_MISSING_CODES = new Set(["42P01", "PGRST116", "PGRST205"]);

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

export async function rateLimit(request, options = {}) {
  return enforceRateLimit(request, options);
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

function markNeedsReconnect(err) {
  err.status = err.status || 401;
  err.needsReconnect = true;
  return err;
}

function isMissingTableError(error) {
  return Boolean(error?.code && TABLE_MISSING_CODES.has(error.code)) || /does not exist|schema cache/i.test(String(error?.message || ""));
}

export function safeReturnPath(returnTo = "/") {
  const raw = String(returnTo || "/").trim();
  if (!raw || raw.startsWith("//") || /^[a-z][a-z0-9+.-]*:/i.test(raw)) return "/?page=calendar";
  return raw.startsWith("/") ? raw : `/${raw}`;
}

export function sanitizeGoogleError(err) {
  if (err?.needsReconnect) return "Google Calendar needs reconnecting.";
  if (err?.syncTokenExpired) return "Google Calendar sync state expired. Tempo will run a full import next time.";
  if (process.env.NODE_ENV === "production") return err.status === 429 ? "Too many requests" : err.status === 401 ? "Unauthorized" : "Google Calendar request failed";
  return err.message || "Google Calendar request failed";
}

function tempoDayBoundary(date = new Date(), timeZone = process.env.TEMPO_DEFAULT_TIMEZONE || "Asia/Singapore") {
  const key = dateKeyInTimeZone(date, normalizeTimeZone(timeZone));
  return zonedDateOnlyToUtc(key, timeZone) || new Date(date);
}

export function validateGoogleSyncWindow({ timeMin, timeMax, timeZone = process.env.TEMPO_DEFAULT_TIMEZONE || "Asia/Singapore" } = {}) {
  const today = tempoDayBoundary(new Date(), timeZone);
  const defaultMin = new Date(today);
  defaultMin.setUTCDate(defaultMin.getUTCDate() - 90);
  const defaultMax = new Date(today);
  defaultMax.setUTCDate(defaultMax.getUTCDate() + 365);
  const min = timeMin ? new Date(timeMin) : defaultMin;
  const max = timeMax ? new Date(timeMax) : defaultMax;
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
  if (!res.ok) {
    const err = new Error(data.error_description || data.error || "Google token exchange failed");
    err.status = res.status;
    if (/invalid_grant|invalid_token|revoked/i.test(`${data.error || ""} ${data.error_description || ""}`)) err.needsReconnect = true;
    throw err;
  }
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
  if (!res.ok) {
    const err = new Error(data.error_description || data.error || "Google token refresh failed");
    err.status = /invalid_grant|invalid_token|revoked/i.test(`${data.error || ""} ${data.error_description || ""}`) ? 401 : res.status;
    if (err.status === 401 || err.status === 403) err.needsReconnect = true;
    throw err;
  }
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
  let refreshed;
  try {
    refreshed = await refreshAccessToken(tokenRow.refresh_token);
  } catch (err) {
    if (err.needsReconnect) {
      await sb.from("google_calendar_tokens").update({ updated_at: new Date().toISOString() }).eq("user_id", userId);
    }
    throw err;
  }
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
    if (res.status === 401 || res.status === 403) err.needsReconnect = true;
    if (res.status === 410) err.syncTokenExpired = true;
    throw err;
  }
  return data;
}

export async function listGoogleCalendars(userId) {
  const data = await googleFetch(userId, "/users/me/calendarList?minAccessRole=reader&showDeleted=false&showHidden=true");
  return Array.isArray(data.items) ? data.items : [];
}

export async function listGoogleEventsFull(userId, googleCalendarId, { timeMin, timeMax } = {}) {
  const syncWindow = validateGoogleSyncWindow({ timeMin, timeMax });
  const base = new URLSearchParams({
    singleEvents: "true",
    orderBy: "startTime",
    showDeleted: "true",
    maxResults: "2500",
    timeMin: syncWindow.timeMin,
    timeMax: syncWindow.timeMax,
  });
  const out = [];
  let pageToken = "";
  let nextSyncToken = "";
  do {
    const params = new URLSearchParams(base);
    if (pageToken) params.set("pageToken", pageToken);
    const data = await googleFetch(userId, `/calendars/${encodeURIComponent(googleCalendarId)}/events?${params.toString()}`);
    out.push(...(Array.isArray(data.items) ? data.items : []));
    pageToken = data.nextPageToken || "";
    nextSyncToken = data.nextSyncToken || nextSyncToken;
  } while (pageToken);
  return { items: out, nextSyncToken, syncWindow };
}

export async function listGoogleEventChanges(userId, googleCalendarId, syncToken) {
  if (!syncToken) {
    const err = new Error("Missing Google sync token");
    err.status = 400;
    throw err;
  }
  const base = new URLSearchParams({
    singleEvents: "true",
    showDeleted: "true",
    maxResults: "2500",
    syncToken,
  });
  const out = [];
  let pageToken = "";
  let nextSyncToken = "";
  do {
    const params = new URLSearchParams(base);
    if (pageToken) params.set("pageToken", pageToken);
    const data = await googleFetch(userId, `/calendars/${encodeURIComponent(googleCalendarId)}/events?${params.toString()}`);
    out.push(...(Array.isArray(data.items) ? data.items : []));
    pageToken = data.nextPageToken || "";
    nextSyncToken = data.nextSyncToken || nextSyncToken;
  } while (pageToken);
  return { items: out, nextSyncToken };
}

export async function listGoogleEvents(userId, googleCalendarId, { timeMin, timeMax } = {}) {
  const result = await listGoogleEventsFull(userId, googleCalendarId, { timeMin, timeMax });
  return result.items;
}

export async function loadUserData(userId) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb.from("user_data").select("user_id, events, tasks, settings, updated_at").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  return data || { user_id: userId, events: [], tasks: [], settings: {}, updated_at: null };
}

function publicSyncState(row = {}) {
  return {
    hasSyncToken: Boolean(row.sync_token),
    lastFullSyncAt: row.last_full_sync_at || null,
    lastIncrementalSyncAt: row.last_incremental_sync_at || null,
    lastWebhookAt: row.last_webhook_at || null,
    lastError: row.last_error || null,
    lastMode: row.last_mode || null,
    syncWindow: row.sync_window || null,
  };
}

function windowMatches(a = {}, b = {}) {
  return Boolean(a?.timeMin && a?.timeMax && b?.timeMin && b?.timeMax && a.timeMin === b.timeMin && a.timeMax === b.timeMax);
}

export async function loadGoogleCalendarSyncState(userId, googleCalendarId) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from(GOOGLE_SYNC_STATE_TABLE)
    .select("*")
    .eq("user_id", userId)
    .eq("google_calendar_id", googleCalendarId)
    .maybeSingle();
  if (error) {
    if (isMissingTableError(error)) return { tableAvailable: false, state: null };
    throw error;
  }
  return { tableAvailable: true, state: data || null };
}

export async function saveGoogleCalendarSyncState(userId, googleCalendarId, patch = {}) {
  const sb = getSupabaseAdmin();
  const row = {
    user_id: userId,
    google_calendar_id: googleCalendarId,
    updated_at: new Date().toISOString(),
    ...patch,
  };
  const { data, error } = await sb
    .from(GOOGLE_SYNC_STATE_TABLE)
    .upsert(row, { onConflict: "user_id,google_calendar_id" })
    .select("*")
    .maybeSingle();
  if (error) {
    if (isMissingTableError(error)) return { tableAvailable: false, state: null };
    throw error;
  }
  return { tableAvailable: true, state: data };
}

export async function clearGoogleCalendarSyncState(userId, googleCalendarId, patch = {}) {
  return saveGoogleCalendarSyncState(userId, googleCalendarId, {
    sync_token: null,
    sync_window: null,
    last_error: null,
    ...patch,
  });
}

export async function saveUserData(userId, { events, tasks, settings }) {
  const sb = getSupabaseAdmin();
  const { data: current } = await sb.from("user_data").select("tasks, settings").eq("user_id", userId).maybeSingle();
  const clean = sanitizeUserDataPayload({
    events: events || [],
    tasks: tasks ?? current?.tasks ?? [],
    settings: settings ?? current?.settings ?? {},
  });
  const row = {
    user_id: userId,
    events: JSON.parse(JSON.stringify(clean.events)),
    tasks: JSON.parse(JSON.stringify(clean.tasks)),
    settings: JSON.parse(JSON.stringify(clean.settings)),
    updated_at: new Date().toISOString(),
  };
  const { error } = await sb.from("user_data").upsert(row, { onConflict: "user_id" });
  if (error) throw error;
  return row;
}

function eventProcessingBucket(items = [], calendar, { timeZone, onlyCountSeenForFull = false } = {}) {
  const imported = [];
  const skipped = [];
  const cancelled = new Set();
  const seenIds = new Set();
  for (const item of items) {
    if (!item?.id) continue;
    const tempoId = googleEventTempoId(item, calendar);
    if (onlyCountSeenForFull) seenIds.add(tempoId);
    if (item.status === "cancelled") {
      cancelled.add(tempoId);
      continue;
    }
    try {
      imported.push(mapGoogleEvent(item, calendar, { timeZone }));
    } catch (eventError) {
      skipped.push({ id: item.id, calendarId: calendar.googleCalendarId, reason: eventError?.message || "Could not import Google event" });
    }
  }
  return { imported, skipped, cancelled, seenIds };
}

export async function syncGoogleCalendarsForUser(userId, { timeMin, timeMax, mode = "manual", calendarIds = null, allowIncremental = true } = {}) {
  const explicitWindow = Boolean(timeMin || timeMax);
  const syncWindow = validateGoogleSyncWindow({ timeMin, timeMax });
  const calendarItems = await listGoogleCalendars(userId);
  const userData = await loadUserData(userId);
  const settings = googleCalendarSettingsFromList(userData.settings || {}, calendarItems);
  const requestedGoogleIds = Array.isArray(calendarIds) && calendarIds.length ? new Set(calendarIds) : null;
  const googleCalendars = settings.calendars
    .filter(c => c.source === "google" && c.syncEnabled !== false)
    .filter(c => !requestedGoogleIds || requestedGoogleIds.has(c.googleCalendarId));

  const imported = [];
  const skipped = [];
  const cancelled = new Set();
  const seenIds = new Set();
  const fullSyncedCalendarIds = new Set();
  const perCalendar = {};
  let syncStateTableAvailable = true;
  let incrementalCount = 0;
  let fullCount = 0;
  let recoveryCount = 0;
  const timeZone = settings.timezone || "Asia/Singapore";

  for (const calendar of googleCalendars) {
    const loadedState = await loadGoogleCalendarSyncState(userId, calendar.googleCalendarId);
    if (loadedState.tableAvailable === false) syncStateTableAvailable = false;
    const state = loadedState.state;
    const canIncremental = Boolean(allowIncremental && !explicitWindow && state?.sync_token && windowMatches(state.sync_window, syncWindow));
    let items = [];
    let nextSyncToken = "";
    let calendarMode = canIncremental ? "incremental" : "full";
    let recoveredFromExpiredToken = false;

    try {
      if (canIncremental) {
        try {
          const result = await listGoogleEventChanges(userId, calendar.googleCalendarId, state.sync_token);
          items = result.items;
          nextSyncToken = result.nextSyncToken;
          incrementalCount += 1;
        } catch (err) {
          if (err.status !== 410 && !err.syncTokenExpired) throw err;
          recoveredFromExpiredToken = true;
          recoveryCount += 1;
          calendarMode = "full_recovery";
          await clearGoogleCalendarSyncState(userId, calendar.googleCalendarId, { last_error: "Google sync token expired; full sync recovered." });
          const result = await listGoogleEventsFull(userId, calendar.googleCalendarId, syncWindow);
          items = result.items;
          nextSyncToken = result.nextSyncToken;
          fullCount += 1;
          fullSyncedCalendarIds.add(calendar.googleCalendarId);
        }
      } else {
        const result = await listGoogleEventsFull(userId, calendar.googleCalendarId, syncWindow);
        items = result.items;
        nextSyncToken = result.nextSyncToken;
        fullCount += 1;
        fullSyncedCalendarIds.add(calendar.googleCalendarId);
      }

      const bucket = eventProcessingBucket(items, calendar, { timeZone, onlyCountSeenForFull: calendarMode !== "incremental" });
      imported.push(...bucket.imported);
      skipped.push(...bucket.skipped);
      bucket.cancelled.forEach(id => cancelled.add(id));
      bucket.seenIds.forEach(id => seenIds.add(id));

      const statePatch = {
        sync_token: nextSyncToken || state?.sync_token || null,
        sync_window: syncWindow,
        last_mode: calendarMode,
        last_error: null,
        last_item_count: items.length,
      };
      if (calendarMode === "incremental") statePatch.last_incremental_sync_at = new Date().toISOString();
      else statePatch.last_full_sync_at = new Date().toISOString();
      const savedState = await saveGoogleCalendarSyncState(userId, calendar.googleCalendarId, statePatch);
      if (savedState.tableAvailable === false) syncStateTableAvailable = false;
      perCalendar[calendar.googleCalendarId] = {
        calendarId: calendar.id,
        name: calendar.name,
        imported: bucket.imported.length,
        cancelled: bucket.cancelled.size,
        skipped: bucket.skipped.length,
        mode: calendarMode,
        recoveredFromExpiredToken,
        syncState: savedState.state ? publicSyncState(savedState.state) : publicSyncState({ ...state, ...statePatch }),
      };
    } catch (err) {
      await saveGoogleCalendarSyncState(userId, calendar.googleCalendarId, { last_error: err?.message || "Google calendar sync failed", last_mode: "failed" }).catch(() => null);
      if (err.needsReconnect || err.status === 401 || err.status === 403) throw markNeedsReconnect(err);
      skipped.push({ calendarId: calendar.googleCalendarId, reason: err?.message || "Google calendar sync failed" });
      perCalendar[calendar.googleCalendarId] = {
        calendarId: calendar.id,
        name: calendar.name,
        imported: 0,
        cancelled: 0,
        skipped: 1,
        mode: "failed",
        error: err?.message || "Google calendar sync failed",
      };
    }
  }

  const eventsBefore = Array.isArray(userData.events) ? userData.events : [];
  const events = mergeGoogleImport({
    existingEvents: eventsBefore,
    googleEvents: imported,
    cancelledIds: cancelled,
    seenIds,
    syncedCalendarIds: fullSyncedCalendarIds,
    syncWindow: fullSyncedCalendarIds.size ? syncWindow : null,
  });

  const beforeMissing = new Set(eventsBefore.filter(ev => ev?.source === "google" && ev.googleStatus === "missing_from_sync").map(ev => ev.id));
  const staleRemovedCount = events.filter(ev => ev?.source === "google" && ev.googleStatus === "missing_from_sync" && !beforeMissing.has(ev.id)).length;
  const modeLabel = incrementalCount && fullCount ? "mixed" : incrementalCount ? "incremental" : "full";
  const nextSettings = {
    ...settings,
    googleCalendarSync: {
      ...(settings.googleCalendarSync || {}),
      connected: true,
      lastImportAt: new Date().toISOString(),
      importedCount: imported.length,
      cancelledCount: cancelled.size,
      skippedCount: skipped.length,
      staleRemovedCount,
      mode: modeLabel,
      runType: mode,
      fullCalendarCount: fullCount,
      incrementalCalendarCount: incrementalCount,
      recoveredCalendarCount: recoveryCount,
      syncStateTableAvailable,
      timeMin: syncWindow.timeMin,
      timeMax: syncWindow.timeMax,
      calendarStates: perCalendar,
    },
  };

  await saveUserData(userId, { events, tasks: userData.tasks || [], settings: nextSettings });
  return {
    ok: true,
    mode: modeLabel,
    runType: mode,
    imported: imported.length,
    cancelled: cancelled.size,
    skipped: skipped.length,
    staleRemovedCount,
    syncStateTableAvailable,
    events,
    calendars: nextSettings.calendars,
    hiddenCals: nextSettings.hiddenCals || [],
    googleCalendarSync: nextSettings.googleCalendarSync,
  };
}

export async function findGoogleSyncStateByChannel({ channelId, resourceId } = {}) {
  if (!channelId) return { tableAvailable: true, state: null };
  const sb = getSupabaseAdmin();
  let query = sb.from(GOOGLE_SYNC_STATE_TABLE).select("*").eq("channel_id", channelId);
  if (resourceId) query = query.eq("channel_resource_id", resourceId);
  const { data, error } = await query.maybeSingle();
  if (error) {
    if (isMissingTableError(error)) return { tableAvailable: false, state: null };
    throw error;
  }
  return { tableAvailable: true, state: data || null };
}

export async function markGoogleWebhookSeen(userId, googleCalendarId, { channelId, resourceId, resourceState } = {}) {
  return saveGoogleCalendarSyncState(userId, googleCalendarId, {
    channel_id: channelId || null,
    channel_resource_id: resourceId || null,
    last_webhook_at: new Date().toISOString(),
    last_webhook_state: resourceState || null,
  });
}

export async function handleRouteError(err) {
  console.error("Google Calendar route failed", err);
  const status = err.status || 500;
  const body = { ok: false, error: sanitizeGoogleError(err) };
  if (err.needsReconnect) body.needsReconnect = true;
  if (err.syncTokenExpired) body.syncTokenExpired = true;
  if (process.env.NODE_ENV !== "production" && err.details) body.details = err.details;
  return jsonResponse(body, status);
}
