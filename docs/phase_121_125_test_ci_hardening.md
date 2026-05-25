# Phase 121–125: Test and CI Hardening

This phase adds guardrails around the features that were most at risk during the audit work. It is intentionally conservative: it does not redesign Tempo, change journal mechanics, remove features, or add any OpenAI/API assistant behavior.

## Added release validation

New command:

```bash
npm run validate:release
```

The validator checks for:

- no `.env.local`, `.git`, `.npm-cache`, `node_modules`, or `.next` in the release tree
- no `app/api/assistant/route.js`
- no OpenAI env variables required in `.env.example`
- local Tempo Assistant regression markers still present
- journal decoration regression markers still present
- manual regression checklist still present

## Added CI workflow

New workflow:

```text
.github/workflows/tempo-ci.yml
```

It runs on push, pull request, and manual dispatch:

1. Node 24 setup
2. `npm ci`
3. `npm run validate:release`
4. `npm test`
5. `npm run lint`
6. `npm run build`

## Added regression tests

New tests:

```text
tests/local-assistant-regression.test.mjs
tests/journal-decorator-regression.test.mjs
tests/route-safety-regression.test.mjs
```

These protect:

- restored local Tempo Assistant/chatbot UI
- Today Context, chips, local actions, memory, undo history
- no `/api/assistant` route
- no OpenAI client/server assistant call
- desktop-only journal decoration editing
- mobile decoration viewing without mobile editing controls
- API route auth/rate-limit/validation guardrails

## Local commands before deployment

```bash
npm run validate:release
npm test
npm run lint
npm run build
```

Use Node 24 / npm 11 for build parity with Vercel.
