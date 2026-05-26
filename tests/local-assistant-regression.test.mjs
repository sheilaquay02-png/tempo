import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const appSource = readFileSync('components/TempoApp.jsx', 'utf8');
const settingsSource = existsSync('components/settings/SettingsPanel.jsx') ? readFileSync('components/settings/SettingsPanel.jsx', 'utf8') : '';
const styleSource = readFileSync('styles/tempoStyles.js', 'utf8');
const combined = `${appSource}\n${settingsSource}\n${styleSource}`;

test('local Tempo Assistant remains restored and local-only', () => {
  assert.equal(existsSync('app/api/assistant/route.js'), false, 'OpenAI/API assistant route must stay removed');
  assert.match(appSource, /function ChatPanel\(/, 'assistant chat panel component should exist');
  assert.match(appSource, /buildTempoAssistantContext/, 'assistant context engine should exist');
  assert.match(appSource, /assistantContext=\{assistantContext\}/, 'main app should pass local context into ChatPanel');
  assert.match(appSource, /onUpdateEvents=\{setEvents\}/, 'assistant should still be able to apply confirmed local event actions');
  assert.match(appSource, /onUpdateTasks=\{setTasks\}/, 'assistant should still be able to apply confirmed local task actions');
  assert.doesNotMatch(appSource, /fetch\(["']\/api\/assistant["']/, 'assistant must not call a server AI endpoint');
  assert.doesNotMatch(appSource, /OPENAI_API_KEY|OPENAI_MODEL/i, 'client source must not require OpenAI env vars');
});

test('Tempo Assistant UI affordances and guided flows remain present', () => {
  for (const marker of [
    'Plan Today',
    'Check in',
    'Journal',
    'Tomorrow Reset',
    'Plan my day',
    'Find free time',
    'Check load',
    'Next move',
    'Reflect',
    'Add event',
    'Add task',
    'Suggest action',
    'Schedule top task',
    'Focus block',
    'Assistant Rhythm Memory',
    'assistant-context-toggle',
    'assistant-prompt-bank',
    'assistant-safe-action-note',
    'assistant-history',
  ]) {
    assert.ok(combined.includes(marker), `missing assistant UI marker: ${marker}`);
  }
});

test('assistant local memory and undo history are still wired into Settings', () => {
  assert.match(combined, /onUpdateAssistantMemory/, 'settings should still update local assistant rhythm memory');
  assert.match(combined, /onClearAssistantActionHistory/, 'settings should still clear assistant undo history');
  assert.match(combined, /clear assistant undo history/i, 'assistant undo history copy should remain visible');
});
