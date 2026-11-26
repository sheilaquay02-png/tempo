"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { load, save } from "../lib/tempo/core";
import { getSupabase, saveToCloudChecked, getCloudPullCount } from "../components/auth/LoginScreen";

// onConflictRef.current({ events, tasks, settings }) must download the newer
// cloud row, merge it with that snapshot, save the result and resolve true/false.
export function useTempoCloudSync({ authUser, userKey, dataReady, onConflictRef }) {
  const [syncStatus, setSyncStatus] = useState({ status: "saved", message: "Saved to cloud", lastError: "" });
  const [pendingLocalChanges, setPendingLocalChanges] = useState(() => load(`${userKey}_pending_sync_count`, 0));
  const [lastSyncedAt, setLastSyncedAt] = useState(() => load(`${userKey}_last_synced_at`, null));
  const cloudQueueRef = useRef(Promise.resolve());
  const cloudHydrationRef = useRef({ usingFallback: false, cloudResolved: false });

  useEffect(() => {
    setPendingLocalChanges(load(`${userKey}_pending_sync_count`, 0));
    setLastSyncedAt(load(`${userKey}_last_synced_at`, null));
  }, [userKey]);

  const markPendingLocalChange = useCallback(() => {
    const next = Number(load(`${userKey}_pending_sync_count`, 0)) + 1;
    setPendingLocalChanges(next);
    save(`${userKey}_pending_sync_count`, next);
  }, [userKey]);

  const markCloudSynced = useCallback(() => {
    const stamp = new Date().toISOString();
    setPendingLocalChanges(0);
    setLastSyncedAt(stamp);
    save(`${userKey}_pending_sync_count`, 0);
    save(`${userKey}_last_synced_at`, stamp);
  }, [userKey]);

  const queueCloudSave = useCallback((events, tasks, settings, options = {}) => {
    if (!authUser || !dataReady) {
      markPendingLocalChange();
      setSyncStatus({ status: "offline", message: "Offline edits pending", lastError: "Not signed in or cloud not ready" });
      return Promise.resolve(!options.strict);
    }
    if (cloudHydrationRef.current.usingFallback && !cloudHydrationRef.current.cloudResolved) {
      markPendingLocalChange();
      setSyncStatus({ status: "offline", message: "Waiting for cloud before saving fallback data", lastError: "Cloud load still pending" });
      return Promise.resolve(!options.strict);
    }
    // A download between queueing and running means this snapshot may be
    // missing what was downloaded, so it must be merged rather than written.
    const pullsWhenQueued = getCloudPullCount(authUser.id);
    const run = async () => {
      setSyncStatus({ status: "saving", message: "Saving…", lastError: "" });
      let result = { ok: false, conflict: true };
      if (getCloudPullCount(authUser.id) === pullsWhenQueued) {
        result = await saveToCloudChecked(authUser.id, events, tasks, settings);
      }
      if (result.ok) {
        markCloudSynced();
        setSyncStatus({ status: "saved", message: "Saved to cloud", lastError: "" });
        return true;
      }
      if (result.conflict && onConflictRef?.current) {
        setSyncStatus({ status: "saving", message: "Combining changes from another device…", lastError: "" });
        const merged = await onConflictRef.current({ events, tasks, settings }).catch(() => false);
        if (merged) return true;
      }
      markPendingLocalChange();
      setSyncStatus({ status: "failed", message: "Sync failed — tap to retry", lastError: "Cloud save failed" });
      if (options.strict) throw new Error("Cloud save failed. Your Journal change was not finalized.");
      return false;
    };
    const queued = cloudQueueRef.current.then(run, run);
    cloudQueueRef.current = queued.catch(() => {});
    return queued;
  }, [authUser, dataReady, markCloudSynced, markPendingLocalChange, onConflictRef]);

  return {
    syncStatus,
    setSyncStatus,
    pendingLocalChanges,
    lastSyncedAt,
    cloudQueueRef,
    cloudHydrationRef,
    markPendingLocalChange,
    markCloudSynced,
    queueCloudSave,
  };
}

export function useTempoRealtimeSync({ userId, userKey, dataReady, forceSyncNow }) {
  const lastRealtimeSyncRef = useRef(0);
  const forceSyncNowRef = useRef(forceSyncNow);

  useEffect(() => {
    forceSyncNowRef.current = forceSyncNow;
  }, [forceSyncNow]);

  useEffect(() => {
    if (!userId || !dataReady) return undefined;
    let cancelled = false;
    let channel = null;
    const pullLatest = (reason = "cloud") => {
      const now = Date.now();
      if (now - lastRealtimeSyncRef.current < 2500) return;
      lastRealtimeSyncRef.current = now;
      forceSyncNowRef.current({ silent: true, skipCloudSave: reason === "realtime" }).catch(() => {});
    };

    getSupabase().then(sb => {
      if (cancelled) return;
      channel = sb
        .channel(`tempo-user-data-${userId}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "user_data", filter: `user_id=eq.${userId}` }, payload => {
          const cloudUpdatedAt = payload?.new?.updated_at;
          const localUpdatedAt = load(`${userKey}_updated_at`, null);
          const cloudTime = cloudUpdatedAt ? new Date(cloudUpdatedAt).getTime() : 0;
          const localTime = localUpdatedAt ? new Date(localUpdatedAt).getTime() : 0;
          if (cloudTime && cloudTime <= localTime + 1000) return;
          pullLatest("realtime");
        })
        .subscribe();
    }).catch(() => {});

    const onFocus = () => pullLatest("focus");
    const onOnline = () => pullLatest("online");
    const onVisibility = () => { if (document.visibilityState === "visible") pullLatest("visible"); };
    window.addEventListener("focus", onFocus);
    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onVisibility);
      try { channel?.unsubscribe?.(); } catch {}
    };
  }, [dataReady, userId, userKey]);
}
