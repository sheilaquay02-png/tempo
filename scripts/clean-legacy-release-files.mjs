#!/usr/bin/env node
import { rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const legacyPaths = [
  '.npm-cache',
  'app/api/assistant',
  'app/api/assistant/route.js',
  'docs/tempo-assistant-ai-setup.md',
  'components/TempoApp.jsx.bak_patch',
  'components/bloom/BloomRoom.jsx.bak_patch',
  'styles/tempoStyles.js.bak_patch',
];

let removed = 0;
for (const p of legacyPaths) {
  const full = join(root, p);
  if (!existsSync(full)) continue;
  rmSync(full, { recursive: true, force: true });
  removed += 1;
  console.log(`Removed legacy release path: ${p}`);
}

if (removed === 0) {
  console.log('No legacy release paths found.');
}
