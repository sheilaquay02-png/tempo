import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const appShell = readFileSync(new URL("../components/layout/AppShell.jsx", import.meta.url), "utf8");
const tempoApp = readFileSync(new URL("../components/TempoApp.jsx", import.meta.url), "utf8");

test("app shell navigation is split into dedicated layout components", () => {
  assert.match(appShell, /export function TempoLoadingScreen/);
  assert.match(appShell, /export function AppSidebar/);
  assert.match(appShell, /export function CalendarTopbar/);
  assert.match(appShell, /export function MobileBottomNav/);
  assert.match(tempoApp, /from "\.\/layout\/AppShell"/);
});

test("app shell split keeps navigation presentational", () => {
  assert.doesNotMatch(appShell, /useState|useEffect|localStorage|saveToCloud|loadFromCloud|googleCalendarRequest/);
  assert.match(appShell, /onNavigate/);
  assert.match(appShell, /onToggleMenu/);
  assert.match(appShell, /onForceSync/);
});
