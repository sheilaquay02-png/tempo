#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
const failures = [];
const warn = [];

function fail(message) { failures.push(message); }
function warning(message) { warn.push(message); }
function rel(path) { return relative(root, path) || '.'; }
function has(path) { return existsSync(join(root, path)); }

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const full = join(dir, entry);
    const r = rel(full);
    if (['node_modules', '.next', '.git', '.npm-cache'].includes(entry)) {
      continue;
    }
    const s = statSync(full);
    if (s.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

const forbiddenPaths = ['.env.local', '.npm-cache'];
for (const p of forbiddenPaths) {
  if (has(p)) fail(`Forbidden sensitive path exists: ${p}`);
}

// GitHub Actions checkouts always contain .git, and npm ci creates node_modules.
// Those are not release artifacts by themselves, so CI validation must not fail just
// because it is running inside a normal working tree. The zip/release packaging step
// is still responsible for excluding .git, node_modules, .next, and other generated
// folders.
for (const p of ['.git', 'node_modules', '.next']) {
  if (has(p)) warning(`Generated/local path present in working tree and should not be included in release zip: ${p}`);
}

if (has('app/api/assistant/route.js')) {
  fail('OpenAI/API assistant route must not be present: app/api/assistant/route.js');
}

const envExample = has('.env.example') ? readFileSync(join(root, '.env.example'), 'utf8') : '';
if (/OPENAI_API_KEY|OPENAI_MODEL/i.test(envExample)) {
  fail('.env.example must not require OpenAI assistant variables. Tempo Assistant is local-only.');
}

const tempoApp = has('components/TempoApp.jsx') ? readFileSync(join(root, 'components/TempoApp.jsx'), 'utf8') : '';
const styles = has('styles/tempoStyles.js') ? readFileSync(join(root, 'styles/tempoStyles.js'), 'utf8') : '';

const requiredAssistantMarkers = [
  'function ChatPanel',
  'buildTempoAssistantContext',
  'assistant-context-card',
  'assistant-prompt-bank',
  'startAssistantFlow',
  'buildAssistantAction',
  'normalizeAssistantMemory',
  'assistantActionHistory',
  'Created with Tempo Assistant',
];
for (const marker of requiredAssistantMarkers) {
  if (!tempoApp.includes(marker) && !styles.includes(marker)) {
    fail(`Local Tempo Assistant regression marker missing: ${marker}`);
  }
}

const requiredJournalMarkers = [
  'allowDecorationEditing={!isMobileViewport}',
  'allowDecorationEditing && decoratePromptKey',
  'startDecoratingMemory',
  'journal-decoration-bottom-sheet',
  'Undo',
  'Redo',
];
for (const marker of requiredJournalMarkers) {
  if (!tempoApp.includes(marker) && !styles.includes(marker)) {
    fail(`Journal decorator regression marker missing: ${marker}`);
  }
}

if (!has('docs/qa/manual_regression_checklist.md')) {
  fail('Manual regression checklist is missing: docs/qa/manual_regression_checklist.md');
}

if (!has('.github/workflows/tempo-ci.yml')) {
  warning('CI workflow is not present yet: .github/workflows/tempo-ci.yml');
}

const files = walk(root).map(rel);
const sensitiveFiles = files.filter(p => /(^|\/)(\.env\.local|\.npm-cache)(\/|$)/.test(p));
if (sensitiveFiles.length) {
  fail(`Release tree contains forbidden sensitive paths: ${sensitiveFiles.slice(0, 12).join(', ')}`);
}

if (failures.length) {
  console.error('\nTempo release validation failed:');
  for (const f of failures) console.error(`- ${f}`);
  if (warn.length) {
    console.error('\nWarnings:');
    for (const w of warn) console.error(`- ${w}`);
  }
  process.exit(1);
}

console.log('Tempo release validation passed.');
if (warn.length) {
  console.log('\nWarnings:');
  for (const w of warn) console.log(`- ${w}`);
}
