import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const appShell = readFileSync(new URL("../components/layout/AppShell.jsx", import.meta.url), "utf8");
const tempoApp = readFileSync(new URL("../components/TempoApp.jsx", import.meta.url), "utf8");
const budgetApp = readFileSync(new URL("../components/budget/BudgetApp.jsx", import.meta.url), "utf8");

test("mode switch uses emoji-only visible labels with accessible names", () => {
  assert.match(appShell, /aria-label=\{mode\.label\}/);
  assert.match(appShell, /title=\{mode\.label\}/);
  assert.match(appShell, /<span aria-hidden="true">\{mode\.emoji\}<\/span>/);
  assert.doesNotMatch(appShell, /<span>\{mode\.emoji\}<\/span>\{mode\.label\}/);
});

test("schedule and budget navigation render separate menu sets", () => {
  assert.match(appShell, /appMode === "budget"/);
  assert.match(appShell, /budgetNavItems/);
  assert.match(appShell, /label: "Home"/);
  assert.match(appShell, /label: "Account"/);
  assert.match(appShell, /label: "Transactions"/);
  assert.match(appShell, /label: "Budget"/);
  assert.match(appShell, /label: "Settings"/);
  assert.match(appShell, /appMode === "schedule" && \(/);
  assert.match(appShell, /<span className="cal-label">My Calendars<\/span>/);
});

test("mobile footer changes between schedule and budget menus", () => {
  assert.match(appShell, /appMode === "budget" \? \(/);
  assert.match(appShell, /budget-mobile-nav/);
  assert.match(appShell, />☰<span>Menu<\/span><\/button>/);
  assert.match(appShell, /onNavigateBudgetPage/);
  assert.match(appShell, /<span>Tasks<\/span>/);
  assert.doesNotMatch(appShell, /<span>Journal<\/span>|<span>Habits<\/span>/);
  assert.doesNotMatch(appShell, /onNavigateBudget\s*=|onNavigateOverall\s*=/);
});

test("BudgetApp supports skeleton pages without implementing extra roadmap pages", () => {
  assert.match(tempoApp, /const \[budgetPage, setBudgetPage\]/);
  assert.match(tempoApp, /function navigateBudgetPage/);
  assert.match(tempoApp, /<BudgetApp activePage=\{budgetPage\}/);
  assert.match(budgetApp, /activePage = "home"/);
  assert.match(budgetApp, /safePage === "account"/);
  assert.match(budgetApp, /safePage === "transactions"/);
  assert.match(budgetApp, /safePage === "settings"/);
  assert.match(budgetApp, /Record transaction/);
});


test("transaction calendar renders real date cells without blanking the first column", () => {
  assert.match(budgetApp, /function buildBudgetCalendarDays/);
  assert.match(budgetApp, /Array\.from\(\{ length: 42 \}/);
  assert.match(budgetApp, /calendarDays\.map\(day =>/);
  assert.doesNotMatch(budgetApp, /index % 7 === 0 \? ""/);
  assert.match(budgetApp, /budget-calendar-weekdays/);
});
