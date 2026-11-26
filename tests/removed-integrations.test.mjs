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
const core = source('lib/tempo/core.js');
const pkg = JSON.parse(source('package.json'));

test('push reminder server code is gone', () => {
  for (const path of [
    'app/api/push',
    'lib/tempo/client/pushNotifications.js',
    'lib/tempo/rateLimit.js',
    'public/tempo-sw.js',
    '.github/workflows/tempo-reminders.yml',
  ]) {
    assert.equal(existsSync(path), false, `${path} should stay removed`);
  }
  assert.equal(pkg.dependencies?.['web-push'], undefined, 'web-push dependency should stay removed');
  // The Windows companion's local QA probe is the only server route left.
  assert.equal(existsSync('app/api/tempo-qa-status/route.js'), true);
});

test('Settings no longer offers push, notification or reminder controls', () => {
  for (const text of ['Closed-app push notifications', 'In-app notifications', 'Reminder categories', 'Daily affirmation']) {
    assert.equal(settings.includes(text), false, `Settings should not show "${text}"`);
  }
  assert.doesNotMatch(app, /\b(enableClosedPushNotifications|registerTempoPushNotifications|setPushEnabled|setNotificationPreferences)\b/);
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

test('the old assistant reply engine stays removed from core', () => {
  assert.doesNotMatch(core, /export function processMessage\(|export function buildGreeting\(|CHAT_REPLY_DELAY_MS/);
});
