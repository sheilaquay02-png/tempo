import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = path => readFileSync(path,"utf8");
const shell = source("components/layout/AppShell.jsx");
const app = source("components/TempoApp.jsx");
const mini = source("components/mini/MiniTempoPanel.jsx");
const desktop = source("desktop/main.cjs");
const fallback = source("desktop/offline.html");
const css = source("styles/miniTempoStyles.js");

test("V1 primary destinations are exactly Today, Calendar, Tasks and Budget",()=>{
  const switchBody = shell.split("export function AppModeSwitch")[1].split("export function AppSidebar")[0];
  assert.deepEqual(
    [...switchBody.matchAll(/\{ id: "([^"]+)", label: "([^"]+)"/g)].map(x=>x[2]),
    ["Today","Calendar","Tasks","Budget"]
  );
  assert.match(switchBody,/onNavigate\?\.\(mode\.id\)/);
  assert.match(shell,/tempo-primary-mobile-nav/);
  assert.match(shell,/tempo-budget-subnav/);
  assert.match(shell,/onNavigateBudgetPage/);
  assert.match(shell,/onToggleMenu/);
  assert.match(css,/grid-template-columns:repeat\(4/);
});

test("Financial Budget screens and internal section keys remain unchanged by global navigation",()=>{
  const budget = source("components/budget/BudgetApp.jsx");
  for(const section of ["home","account","transactions","budget","settings"]){
    assert.ok(shell.includes('id: "'+section+'"'),section);
  }
  assert.match(app,/<BudgetApp activePage=\{budgetPage\}/);
  assert.match(budget,/BudgetAmountKeypad/);
});

test("Offline cold start is an explicit recovery screen, not a false promise of transaction entry",()=>{
  assert.match(desktop,/loadFile\(path\.join\(__dirname,"offline\.html"\)\)/);
  assert.match(desktop,/tempo:retry-window/);
  assert.match(fallback,/full offline restart is not supported yet/);
  assert.match(fallback,/Retry connection/);
  assert.doesNotMatch(fallback,/NEXT_PUBLIC_SUPABASE|supabase\.co/);
});

test("Offline in a running Mini uses the existing Budget popup and local journal",()=>{
  assert.match(app,/navigator\.onLine === false/);
  assert.match(app,/if \(!offline && !inline/);
  assert.match(app,/onSaveAndAddAnother=\{windowMode==="recorder" \|\| windowMode==="mini"/);
  assert.match(mini,/mini-offline-banner/);
  assert.match(mini,/offlineReady/);
  assert.match(app,/async function setBudgetTransactions/);
  assert.match(app,/writeBudgetJournal\(window\.localStorage,userId,queued\)/);
});
