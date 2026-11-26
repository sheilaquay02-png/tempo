import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import * as Core from "../../lib/tempo/core";
const { dateKey, TODAY, uid, encryptMemoryJournalForStorage, decryptMemoryJournalFromStorage, SER, DES, MEMORY_STORAGE_BUCKET, MEMORY_SIGNED_URL_SECONDS, MEMORY_IMAGE_LIMIT_PER_ENTRY, MEMORY_MAX_ORIGINAL_BYTES, MEMORY_MAX_IMAGE_EDGE, MEMORY_THUMB_IMAGE_EDGE, MEMORY_UPLOAD_IMAGE_QUALITY, MEMORY_THUMB_IMAGE_QUALITY, MEMORY_ENCRYPTION_VERSION, hasWebCrypto, bytesToBase64, base64ToBytes } = Core;

function LoginLogoSticker() {
  return <>🌸</>;
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

  6. Create a private Supabase Storage bucket for Journal photos:

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
  8. Supabase JS is bundled from @supabase/supabase-js
  ════════════════════════════
*/

// ── Supabase client ───────────────────────────────────────────────────────────
// Keys must be set as environment variables (Vercel dashboard / .env.local).
// For local dev, create a .env.local file:
//   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
//   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabase = null;
export async function getSupabase() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error("Supabase env vars are not set. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  if (supabase) return supabase;
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
    return supabase;
  } catch (e) {
    console.warn("Supabase unavailable, running offline:", e);
    throw e; // callers catch this and fall back to localStorage
  }
}



export function fileExtFromType(type = "") {
  if (type.includes("png")) return "png";
  if (type.includes("webp")) return "webp";
  if (type.includes("gif")) return "gif";
  return "jpg";
}
export function dataUrlToBlob(dataUrl) {
  const [meta, body] = String(dataUrl || "").split(",");
  const mime = (meta.match(/data:(.*?);base64/) || [])[1] || "image/jpeg";
  const binary = atob(body || "");
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}
export function resizeImageFileToBlob(file, maxSize = MEMORY_MAX_IMAGE_EDGE, quality = 0.84) {
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
export async function signMemoryImagePath(storagePath) {
  if (!storagePath) return { src: "", srcExpiresAt: null };
  const sb = await getSupabase();
  const { data, error } = await sb.storage.from(MEMORY_STORAGE_BUCKET).createSignedUrl(storagePath, MEMORY_SIGNED_URL_SECONDS);
  if (error) throw error;
  return {
    src: data?.signedUrl || "",
    srcExpiresAt: new Date(Date.now() + (MEMORY_SIGNED_URL_SECONDS * 1000)).toISOString(),
  };
}
export async function uploadMemoryBlobToStorage(userId, blob, originalName = "memory-photo", memoryDateKey = dateKey(TODAY), variant = "full", sharedId = null) {
  if (!userId) throw new Error("Please sign in before uploading Journal photos.");
  if (!memoryDateKey) throw new Error("Missing Journal date for photo upload.");
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
export async function uploadMemoryImageToStorage(userId, file, memoryDateKey = dateKey(TODAY)) {
  const fileId = `${Date.now()}-${uid()}`;
  const fullBlob = await resizeImageFileToBlob(file, MEMORY_MAX_IMAGE_EDGE, MEMORY_UPLOAD_IMAGE_QUALITY);
  const thumbBlob = await resizeImageFileToBlob(file, MEMORY_THUMB_IMAGE_EDGE, MEMORY_THUMB_IMAGE_QUALITY);
  const uploadedPaths = [];
  try {
    const full = await uploadMemoryBlobToStorage(userId, fullBlob, file?.name || "memory-photo", memoryDateKey, "full", fileId);
    uploadedPaths.push(full.storagePath);
    const thumb = await uploadMemoryBlobToStorage(userId, thumbBlob, file?.name || "memory-photo", memoryDateKey, "thumb", fileId);
    uploadedPaths.push(thumb.storagePath);
    return { storagePath: full.storagePath, thumbStoragePath: thumb.storagePath, bucket: MEMORY_STORAGE_BUCKET };
  } catch (err) {
    // Roll back every object that made it to storage if any later upload step fails.
    if (uploadedPaths.length) await deleteMemoryStoragePaths(uploadedPaths);
    throw err;
  }
}
export async function uploadMemoryDataUrlToStorage(userId, dataUrl, name = "legacy-memory-photo", memoryDateKey = dateKey(TODAY)) {
  const fileId = `${Date.now()}-${uid()}`;
  const blob = dataUrlToBlob(dataUrl);
  const fullBlob = await resizeImageFileToBlob(blob, MEMORY_MAX_IMAGE_EDGE, MEMORY_UPLOAD_IMAGE_QUALITY);
  const thumbBlob = await resizeImageFileToBlob(blob, MEMORY_THUMB_IMAGE_EDGE, MEMORY_THUMB_IMAGE_QUALITY);
  const uploadedPaths = [];
  try {
    const full = await uploadMemoryBlobToStorage(userId, fullBlob, name, memoryDateKey, "full", fileId);
    uploadedPaths.push(full.storagePath);
    const thumb = await uploadMemoryBlobToStorage(userId, thumbBlob, name, memoryDateKey, "thumb", fileId);
    uploadedPaths.push(thumb.storagePath);
    return { storagePath: full.storagePath, thumbStoragePath: thumb.storagePath, bucket: MEMORY_STORAGE_BUCKET };
  } catch (err) {
    if (uploadedPaths.length) await deleteMemoryStoragePaths(uploadedPaths);
    throw err;
  }
}
export async function deleteMemoryStoragePathsDetailed(paths = []) {
  const clean = [...new Set((Array.isArray(paths) ? paths : []).filter(Boolean))];
  if (!clean.length) return { ok: true, requestedPaths: [], deletedPaths: [], failedPaths: [], error: null };
  try {
    const sb = await getSupabase();
    const { error } = await sb.storage.from(MEMORY_STORAGE_BUCKET).remove(clean);
    if (error) throw error;
    return { ok: true, requestedPaths: clean, deletedPaths: clean, failedPaths: [], error: null };
  } catch (err) {
    console.warn("Could not delete removed Journal photos", err);
    return { ok: false, requestedPaths: clean, deletedPaths: [], failedPaths: clean, error: err?.message || String(err) };
  }
}
export async function deleteMemoryStoragePaths(paths = []) {
  const result = await deleteMemoryStoragePathsDetailed(paths);
  return Boolean(result.ok);
}
export const allMemoryPhotoStoragePaths = photo => [photo?.storagePath, photo?.thumbStoragePath].filter(Boolean);
export const memoryPhotoNeedsStorageMigration = photo => Boolean(photo?.src && String(photo.src).startsWith("data:") && !photo.storagePath);

export async function saveToCloud(userId, events, tasks, settings) {
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
export async function saveToCloudStrict(userId, events, tasks, settings) {
  const ok = await saveToCloud(userId, events, tasks, settings);
  if (!ok) throw new Error("Cloud save failed. Your Journal change was not finalized.");
  return true;
}

export async function loadFromCloud(userId) {
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
export function useAuth() {
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

export function LoginScreen({ auth }) {
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
            <div className="mascot-icon"><LoginLogoSticker /></div>
          </div>
          <div className="login-brand">
            <span className="login-logo-text">Tempo</span>
            <span className="login-logo-badge">✦ beta</span>
          </div>
          <p className="login-tagline">Your calm, organized day<br/>starts right here ✨</p>
        </div>

        {/* Cute feature pills */}
        <div className="login-pills">
          <span className="login-pill">📅 Smart scheduling</span>
          <span className="login-pill">🌸 Daily planning</span>
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
