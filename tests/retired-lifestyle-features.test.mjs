import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = file => readFileSync(file, 'utf8');
const shell = source('components/layout/AppShell.jsx');
const today = source('components/today/TodayDashboard.jsx');
const app = source('components/TempoApp.jsx');
const settings = source('components/settings/SettingsPanel.jsx');

test('retired feature screens are no longer navigable on desktop or phone', () => {
  for (const page of ['habits', 'journal', 'tomorrow-reset', 'weekly-reset']) {
    assert.doesNotMatch(shell, new RegExp('onNavigate\\("'+page+'"\\)'));
    assert.doesNotMatch(app, new RegExp('page === "'+page+'"'));
  }
  assert.doesNotMatch(shell, /onNavigateJournal|onNavigateHabits/);
  assert.equal(app.includes('else if (k === "j")'), false);
});

test('Today only shows retained daily features, and old records are still supported', () => {
  for (const label of ['Top 3 Tasks', 'Today’s Calendar', 'Plan Today']) {
    assert.ok(today.includes(label));
  }
  for (const removed of ['Today’s Habits', 'Journal Prompt', 'Tomorrow Reset', 'Weekly Reset']) {
    assert.equal(today.includes(removed), false);
  }
  // Historical data is intentionally kept so sync/migrations cannot silently delete it.
  for (const data of ['journal:', 'habits:', 'tomorrowResets:', 'weeklyResets:']) {
    assert.ok(app.includes(data), 'missing preserved historical data field: ' + data);
  }
});

test('removed features have no user-facing reminder settings', () => {
  for (const word of ['Journal reminder', 'Tomorrow Reset</strong>', 'Weekly Reset</strong>', '"habits", "🌱"']) {
    assert.equal(settings.includes(word), false);
  }
});
