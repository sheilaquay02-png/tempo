import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const appSource = readFileSync('components/TempoApp.jsx', 'utf8');
const todayPath = 'components/today/TodayDashboard.jsx';
const todaySource = existsSync(todayPath) ? readFileSync(todayPath, 'utf8') : '';

test('Today dashboard is split into its own presentational component', () => {
  assert.equal(existsSync(todayPath), true, 'Today dashboard component file should exist');
  assert.match(todaySource, /export function TodayLitePage\(/, 'TodayLitePage should be exported from the Today dashboard file');
  assert.match(appSource, /import \{ TodayLitePage \} from "\.\/today\/TodayDashboard";/, 'TempoApp should import the split Today dashboard');
  assert.doesNotMatch(appSource, /function TodayLitePage\(/, 'TempoApp should no longer define TodayLitePage inline');
});

test('Today dashboard stays presentational and does not own persistence or sync side effects', () => {
  for (const forbidden of ['useState(', 'useEffect(', 'localStorage', 'saveToCloud', 'loadFromCloud', 'registerTempoPushNotifications']) {
    assert.equal(todaySource.includes(forbidden), false, `Today dashboard should not contain side-effect marker: ${forbidden}`);
  }
  for (const marker of ['Top 3 Tasks', 'Today’s Calendar', 'DailyAffirmationCard', 'Plan Today']) {
    assert.ok(todaySource.includes(marker), `missing Today dashboard UI marker: ${marker}`);
  }
  for (const retired of ['Today’s Habits', 'Journal Prompt', 'Tomorrow Reset', 'HabitCard', 'onOpenJournal', 'onOpenHabits']) {
    assert.equal(todaySource.includes(retired), false, `retired dashboard element remains: ${retired}`);
  }
});
