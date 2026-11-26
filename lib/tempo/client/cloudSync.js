// Version-checked saving for the single public.user_data row.
//
// Each device remembers the cloud row's `updated_at` it last loaded or wrote
// (its "base version"). A save only succeeds if the cloud row still has that
// exact version; otherwise it reports a conflict so the caller can download
// the newer row, merge it with local changes (mergeTempoData) and try again.
// This stops one device silently overwriting another device's newer edits.
//
// `pulls` counts downloads. A save that was queued before a download holds a
// snapshot that may not include what was downloaded, so callers compare the
// pull count captured when the save was queued and treat a change as a
// conflict too.

export const UNKNOWN_VERSION = undefined;

export function createCloudSync({ getClient, table = "user_data" } = {}) {
  const versions = new Map(); // userId -> string (updated_at) | null (no row yet)
  const pulls = new Map();    // userId -> number of successful downloads

  const getVersion = userId => (versions.has(userId) ? versions.get(userId) : UNKNOWN_VERSION);
  const getPullCount = userId => pulls.get(userId) || 0;
  const remember = (userId, version) => versions.set(userId, version ?? null);

  async function load(userId) {
    const client = await getClient();
    const { data, error } = await client
      .from(table)
      .select("user_id, events, tasks, settings, updated_at")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    remember(userId, data ? data.updated_at : null);
    pulls.set(userId, getPullCount(userId) + 1);
    return data || null;
  }

  // row: { user_id, events, tasks, settings, updated_at }
  // Returns { ok, conflict, version, error }.
  async function save(userId, row) {
    const expected = getVersion(userId);
    if (expected === UNKNOWN_VERSION) return { ok: false, conflict: true, reason: "unknown-base" };
    const client = await getClient();
    if (expected === null) {
      const { data, error } = await client.from(table).insert(row).select("updated_at");
      if (error) {
        if (error.code === "23505") return { ok: false, conflict: true, reason: "row-exists" };
        return { ok: false, conflict: false, error };
      }
      const version = data?.[0]?.updated_at ?? row.updated_at;
      remember(userId, version);
      return { ok: true, conflict: false, version };
    }
    const { data, error } = await client
      .from(table)
      .update(row)
      .eq("user_id", userId)
      .eq("updated_at", expected)
      .select("updated_at");
    if (error) return { ok: false, conflict: false, error };
    if (!Array.isArray(data) || data.length === 0) return { ok: false, conflict: true, reason: "newer-in-cloud" };
    const version = data[0].updated_at;
    remember(userId, version);
    return { ok: true, conflict: false, version };
  }

  return { load, save, getVersion, getPullCount, remember };
}
