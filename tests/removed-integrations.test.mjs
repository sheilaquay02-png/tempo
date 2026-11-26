import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const source = file => readFileSync(file, 'utf8');
const app = source('components/TempoApp.jsx');
const settings = source('components/settings/SettingsPanel.jsx');
const login = source('components/auth/LoginScreen.jsx');
const shell = source('components/layout/AppShell.jsx');
const calendarModals = source('components/calendar/CalendarModals.jsx');
const tasks = source('components/tasks/Tasks.jsx');
const pkg = JSON.parse(source('package.json'));

test('Google Calendar and push server code is gone', () => {
  for (const path of [
    'app/api',
    'lib/tempo/google',
    'lib/tempo/client/googleCalendarClient.js',
    'lib/tempo/client/pushNotifications.js',
    'lib/tempo/rateLimit.js',
    'public/tempo-sw.js',
    '.github/workflows/tempo-reminders.yml',
  ]) {
    assert.equal(existsSync(path), false, `${path} should stay removed`);
  }
  assert.equal(pkg.dependencies?.['web-push'], undefined, 'web-push dependency should stay removed');
});

test('Settings no longer offers Google Calendar, push or reminder controls', () => {
  for (const text of ['Google Calendar Sync', 'Connect Google Calendar', 'Closed-app push notifications', 'In-app notifications', 'Reminder categories', 'Daily affirmation']) {
    assert.equal(settings.includes(text), false, `Settings should not show "${text}"`);
  }
  assert.doesNotMatch(app, /googleCalendarRequest|connectGoogleCalendar|enableClosedPushNotifications|registerTempoPushNotifications/);
  assert.doesNotMatch(login, /registerTempoPushNotifications|disableTempoPushNotifications|\/api\/push/);
  assert.doesNotMatch(shell, /label: "Google"/);
});

test('event and task editors no longer offer reminders that would never fire', () => {
  assert.doesNotMatch(calendarModals, /EventReminderEditor|<label>Reminder<\/label>/);
  assert.doesNotMatch(tasks, /TaskReminderFields|<label>Reminder<\/label>/);
});

test('old service workers are cleaned up instead of registered', () => {
  assert.doesNotMatch(app, /serviceWorker\.register\(/);
  assert.match(app, /getRegistrations\(\)/);
  assert.match(app, /reg\.unregister\(\)/);
});

test('previously imported Google events are kept in data but left out of views and planning', () => {
  assert.match(app, /const tempoEvents = useMemo\(\(\) => events\.filter\(e => !isImportedGoogleEvent\(e\)\)/);
  assert.match(app, /const calendarDisplayEvents = tempoEvents\.filter/);
  assert.match(app, /expandRecurring\(\[\.\.\.tempoEvents, \.\.\.safeExtraEvents/);
  assert.match(app, /return expandRecurring\(tempoEvents, dayStart\(candidate\.start\)/);
  assert.doesNotMatch(app, /calendars=\{calendars\}/);
});
