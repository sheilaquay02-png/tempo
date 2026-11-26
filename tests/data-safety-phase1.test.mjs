import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

const setup = readFileSync("supabase/user_data_history_setup.sql", "utf8");
const undo = readFileSync("supabase/user_data_history_undo.sql", "utf8");
const app = readFileSync("components/TempoApp.jsx", "utf8");
const settings = readFileSync("components/settings/SettingsPanel.jsx", "utf8");

test("version history keeps previous copies of user_data, read-only for the owner", () => {
  assert.match(setup, /create table if not exists public\.user_data_history/);
  assert.match(setup, /before update or delete on public\.user_data/);
  assert.match(setup, /security definer/);
  assert.match(setup, /alter table public\.user_data_history enable row level security/);
  assert.match(setup, /for select\s+using \(auth\.uid\(\) = user_id\)/);
  // Users must not be able to write or erase history themselves.
  assert.doesNotMatch(setup, /on public\.user_data_history for (insert|update|delete|all)/);
  // Saves that change nothing are skipped; at most one copy per 10 minutes.
  assert.match(setup, /is not distinct from new\.events/);
  assert.match(setup, /interval '10 minutes'/);
  // Retention: newest 20 plus one per day for 14 days.
  assert.match(setup, /limit 20/);
  assert.match(setup, /interval '14 days'/);
});

test("history setup is re-runnable and has an undo that keeps saved copies", () => {
  assert.match(setup, /create table if not exists/);
  assert.match(setup, /drop trigger if exists user_data_keep_history/);
  assert.match(setup, /create or replace function public\.archive_user_data_version/);
  assert.ok(existsSync("supabase/user_data_history_undo.sql"));
  assert.match(undo, /drop trigger if exists user_data_keep_history/);
  assert.doesNotMatch(undo.replace(/^--.*$/gm, ""), /drop table/);
});

test("Settings offers a Download my data backup of the full saved data", () => {
  assert.match(settings, /Download my data/);
  assert.match(settings, /onDownloadData/);
  assert.match(app, /onDownloadData=\{downloadMyData\}/);
  assert.match(app, /function downloadMyData\(\)/);
  assert.match(app, /JSON\.stringify\(payload, SER, 2\)/);
  assert.match(app, /settings: currentSettings\(\)/);
  assert.match(app, /tempo-backup-\$\{dateKey\(new Date\(\)\)\}\.json/);
});
