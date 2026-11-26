import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const appSource = readFileSync("components/TempoApp.jsx", "utf8");
const cloudHookSource = readFileSync("hooks/useTempoCloudSync.js", "utf8");
const persistenceHookSource = readFileSync("hooks/useTempoPersistence.js", "utf8");

test("Tempo persistence and cloud sync are split into hooks", () => {
  assert.match(appSource, /import \{ useTempoUserKey \} from "\.\.\/hooks\/useTempoPersistence";/);
  assert.match(appSource, /import \{ useTempoCloudSync, useTempoRealtimeSync \} from "\.\.\/hooks\/useTempoCloudSync";/);
  assert.match(appSource, /const uk = useTempoUserKey\(auth\.user\?\.id\);/);
  assert.match(appSource, /useTempoCloudSync\(\{ authUser: auth\.user, userKey: uk, dataReady, onConflictRef: syncConflictRef \}\)/);
  assert.match(appSource, /useTempoRealtimeSync\(\{ userId: auth\.user\?\.id, userKey: uk, dataReady, forceSyncNow \}\);/);
});

test("cloud sync hook owns queue, status, pending change, and realtime subscription side effects", () => {
  assert.match(cloudHookSource, /export function useTempoCloudSync/);
  assert.match(cloudHookSource, /cloudQueueRef = useRef\(Promise\.resolve\(\)\)/);
  assert.match(cloudHookSource, /cloudHydrationRef = useRef\(\{ usingFallback: false, cloudResolved: false \}\)/);
  assert.match(cloudHookSource, /markPendingLocalChange/);
  assert.match(cloudHookSource, /markCloudSynced/);
  assert.match(cloudHookSource, /saveToCloudChecked\(authUser\.id, events, tasks, settings\)/);
  assert.match(cloudHookSource, /export function useTempoRealtimeSync/);
  assert.match(cloudHookSource, /postgres_changes/);
  assert.match(cloudHookSource, /window\.addEventListener\("online", onOnline\)/);
});

test("persistent anonymous user key logic is isolated from the main app component", () => {
  assert.match(persistenceHookSource, /export function useTempoUserKey/);
  assert.match(persistenceHookSource, /tempo_anon_key/);
  assert.doesNotMatch(appSource, /localStorage\.getItem\("tempo_anon_key"\)/);
  assert.doesNotMatch(appSource, /localStorage\.setItem\("tempo_anon_key"/);
});
