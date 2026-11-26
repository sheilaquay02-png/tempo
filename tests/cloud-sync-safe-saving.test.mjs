import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createCloudSync } from "../lib/tempo/client/cloudSync.js";
import { mergeTempoData } from "../lib/tempo/core.js";

// A tiny stand-in for Supabase's user_data table: one row per user, with the
// same filter-then-update semantics the real API has.
function fakeSupabase() {
  const rows = new Map();
  let clock = Date.parse("2026-11-26T08:00:00.000Z");
  const stamp = () => new Date((clock += 1000)).toISOString();
  const client = {
    rows,
    stamp,
    from() {
      const filters = [];
      const api = {
        select() { return api; },
        eq(col, val) { filters.push([col, val]); return api; },
        maybeSingle: async () => {
          const uid = filters.find(([c]) => c === "user_id")?.[1];
          return { data: rows.has(uid) ? structuredClone(rows.get(uid)) : null, error: null };
        },
        insert(row) {
          return { select: async () => {
            if (rows.has(row.user_id)) return { data: null, error: { code: "23505", message: "duplicate" } };
            rows.set(row.user_id, structuredClone(row));
            return { data: [{ updated_at: row.updated_at }], error: null };
          } };
        },
        update(row) {
          const upd = {
            eq(col, val) { filters.push([col, val]); return upd; },
            select: async () => {
              const uid = filters.find(([c]) => c === "user_id")?.[1];
              const current = rows.get(uid);
              const matches = current && filters.every(([c, v]) => current[c] === v);
              if (!matches) return { data: [], error: null };
              rows.set(uid, structuredClone(row));
              return { data: [{ updated_at: row.updated_at }], error: null };
            },
          };
          return upd;
        },
      };
      return api;
    },
  };
  return client;
}

const U = "user-1";
const task = (id, title, updatedAt) => ({ id, title, scope: "day", dayKey: "2026-11-26", updatedAt });

// One "device": its own version memory, local state, and the app's merge-and-retry path.
function device(client) {
  const sync = createCloudSync({ getClient: async () => client });
  const dev = { sync, state: null };
  dev.open = async () => {
    const row = await sync.load(U);
    dev.state = { events: row.events, tasks: row.tasks, settings: row.settings, updated_at: row.updated_at };
  };
  dev.edit = (fn) => { dev.state = { ...dev.state, tasks: fn(dev.state.tasks) }; };
  dev.save = async () => {
    for (let attempt = 0; attempt < 3; attempt++) {
      const row = { user_id: U, events: dev.state.events, tasks: dev.state.tasks, settings: dev.state.settings, updated_at: client.stamp() };
      const res = await sync.save(U, row);
      if (res.ok) return { ...res, attempts: attempt + 1 };
      if (!res.conflict) return res;
      const cloud = await sync.load(U);
      dev.state = mergeTempoData(cloud, dev.state);
    }
    return { ok: false, conflict: true };
  };
  return dev;
}

test("two devices editing different tasks at the same time keep both edits", async () => {
  const client = fakeSupabase();
  client.rows.set(U, { user_id: U, events: [], tasks: [task("a", "Old A", "2026-11-26T07:00:00.000Z"), task("b", "Old B", "2026-11-26T07:00:00.000Z")], settings: {}, updated_at: "2026-11-26T07:00:00.000Z" });
  const laptop = device(client);
  const phone = device(client);
  await laptop.open();
  await phone.open();

  laptop.edit(ts => ts.map(t => (t.id === "a" ? { ...t, title: "Laptop A", updatedAt: "2026-11-26T08:10:00.000Z" } : t)));
  phone.edit(ts => ts.map(t => (t.id === "b" ? { ...t, title: "Phone B", updatedAt: "2026-11-26T08:10:01.000Z" } : t)));

  const first = await laptop.save();
  const second = await phone.save();
  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.equal(second.attempts, 2, "the phone must notice the laptop's newer save and merge before saving");

  const titles = Object.fromEntries(client.rows.get(U).tasks.map(t => [t.id, t.title]));
  assert.deepEqual(titles, { a: "Laptop A", b: "Phone B" });
});

test("the old blind overwrite would have lost the laptop's edit (regression guard)", async () => {
  const client = fakeSupabase();
  const base = { user_id: U, events: [], tasks: [task("a", "Old A", "t0"), task("b", "Old B", "t0")], settings: {}, updated_at: "2026-11-26T07:00:00.000Z" };
  client.rows.set(U, structuredClone(base));
  const laptopTasks = base.tasks.map(t => (t.id === "a" ? { ...t, title: "Laptop A" } : t));
  const phoneTasks = base.tasks.map(t => (t.id === "b" ? { ...t, title: "Phone B" } : t));
  client.rows.set(U, { ...base, tasks: laptopTasks });   // laptop upserts
  client.rows.set(U, { ...base, tasks: phoneTasks });    // phone upserts blindly afterwards
  const titles = Object.fromEntries(client.rows.get(U).tasks.map(t => [t.id, t.title]));
  assert.equal(titles.a, "Old A", "blind upsert loses the laptop edit, which is why saves are now version-checked");
});

test("a save with no known cloud version never writes blindly", async () => {
  const client = fakeSupabase();
  client.rows.set(U, { user_id: U, events: [], tasks: [], settings: {}, updated_at: "2026-11-26T07:00:00.000Z" });
  const sync = createCloudSync({ getClient: async () => client });
  const res = await sync.save(U, { user_id: U, events: [], tasks: [task("x", "X", "t")], settings: {}, updated_at: client.stamp() });
  assert.equal(res.ok, false);
  assert.equal(res.conflict, true);
  assert.equal(client.rows.get(U).tasks.length, 0);
});

test("a brand-new account inserts once; a second device inserting gets a conflict instead of overwriting", async () => {
  const client = fakeSupabase();
  const a = createCloudSync({ getClient: async () => client });
  const b = createCloudSync({ getClient: async () => client });
  assert.equal(await a.load(U), null);
  assert.equal(await b.load(U), null);
  const first = await a.save(U, { user_id: U, events: [], tasks: [task("1", "A", "t")], settings: {}, updated_at: client.stamp() });
  const second = await b.save(U, { user_id: U, events: [], tasks: [task("2", "B", "t")], settings: {}, updated_at: client.stamp() });
  assert.equal(first.ok, true);
  assert.equal(second.conflict, true);
  assert.equal(client.rows.get(U).tasks[0].id, "1");
});

test("consecutive saves from the same device do not conflict with themselves", async () => {
  const client = fakeSupabase();
  client.rows.set(U, { user_id: U, events: [], tasks: [], settings: {}, updated_at: "2026-11-26T07:00:00.000Z" });
  const laptop = device(client);
  await laptop.open();
  for (let i = 0; i < 5; i++) {
    laptop.edit(ts => [...ts, task(`n${i}`, `New ${i}`, `2026-11-26T08:0${i}:00.000Z`)]);
    const res = await laptop.save();
    assert.equal(res.attempts, 1);
  }
  assert.equal(client.rows.get(U).tasks.length, 5);
  assert.equal(laptop.sync.getPullCount(U), 1, "no extra downloads for a device's own consecutive saves");
});

test("the app routes every save through the version check", () => {
  const login = readFileSync("components/auth/LoginScreen.jsx", "utf8");
  const hook = readFileSync("hooks/useTempoCloudSync.js", "utf8");
  const app = readFileSync("components/TempoApp.jsx", "utf8");
  assert.doesNotMatch(login, /\.upsert\(/, "user_data must not be written with a blind upsert any more");
  assert.match(login, /createCloudSync\(/);
  assert.match(hook, /saveToCloudChecked\(/);
  assert.match(hook, /getCloudPullCount\(/);
  assert.match(app, /saveToCloudChecked\(auth\.user\.id/);
  assert.match(app, /fromQueue/);
});
