import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const appSource = readFileSync('components/TempoApp.jsx', 'utf8');
const settingsSource = existsSync('components/settings/SettingsPanel.jsx') ? readFileSync('components/settings/SettingsPanel.jsx', 'utf8') : '';
const combined = `${appSource}\n${settingsSource}`;

test('assistant feature remains removed from product UI and API routes', () => {
  assert.equal(existsSync('app/api/assistant/route.js'), false, 'OpenAI/API assistant route must stay removed');
  assert.doesNotMatch(combined, /function ChatPanel\(/, 'assistant chat panel should not be present');
  assert.doesNotMatch(combined, /buildTempoAssistantContext/, 'assistant context engine should not be present');
  assert.doesNotMatch(combined, /chat-fab/, 'assistant floating action button should not be present');
  assert.doesNotMatch(combined, /tempo-assistant/i, 'assistant-specific classes should not be present');
  assert.doesNotMatch(combined, /Assistant Rhythm Memory/, 'assistant settings section should not be present');
  assert.doesNotMatch(combined, /fetch\(["']\/api\/assistant["']/, 'assistant must not call a server AI endpoint');
  assert.doesNotMatch(combined, /OPENAI_API_KEY|OPENAI_MODEL/i, 'client source must not require OpenAI env vars');
});
