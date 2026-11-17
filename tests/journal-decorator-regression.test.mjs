import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const appSource = readFileSync('components/TempoApp.jsx', 'utf8');
const journalSource = readFileSync('components/journal/Journal.jsx', 'utf8');
const styleSource = readFileSync('styles/tempoStyles.js', 'utf8');
const combinedSource = `${appSource}\n${journalSource}\n${styleSource}`;

test('journal decoration editing remains desktop-only while mobile can still view decorations', () => {
  assert.doesNotMatch(appSource, /<JournalPage/, 'retired Journal must not be mounted in the active app');
  assert.ok(journalSource.includes('!isDecorating && allowDecorationEditing') && journalSource.includes('Decorate 🎀'), 'Decorate button should be gated by allowDecorationEditing');
  assert.match(journalSource, /allowDecorationEditing && decoratePromptKey/, 'after-save decorate prompt should be gated by allowDecorationEditing');
  assert.ok(journalSource.includes('<JournalDecorationCanvas') && journalSource.includes('editing={isDecorating}'), 'view layer should still render decorations while editing is controlled separately');
});

test('journal decorator direct-manipulation controls remain present on desktop', () => {
  for (const marker of [
    'journal-decoration-bottom-sheet',
    'Swipe up to decorate',
    'Undo',
    'Redo',
    'flipX',
    'flipY',
    'layerDecoration',
    'duplicateDecoration',
    'removeDecoration',
  ]) {
    assert.ok(combinedSource.includes(marker), `missing journal decorator marker: ${marker}`);
  }
});

test('journal modal scroll lock and card-only scrolling hooks remain present', () => {
  assert.match(journalSource, /tempo-modal-locked/, 'modal scroll lock should remain wired');
  assert.match(styleSource, /entry-view-scroll-content/, 'journal entry scroll content styles should remain present');
  assert.match(styleSource, /journal-decorating-overlay/, 'decorate overlay styles should remain present');
});
