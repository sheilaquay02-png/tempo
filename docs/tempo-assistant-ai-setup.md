# Tempo Phase 24C — Assistant AI endpoint setup

Phase 24C adds a server-side AI response endpoint:

```txt
POST /api/assistant
```

The browser never receives the OpenAI API key. The client sends only the user's message, recent assistant messages, and a sanitized Tempo context summary.

## Vercel environment variables

Add these in Vercel:

```txt
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-5.5
```

`OPENAI_MODEL` is optional. If it is not set, Tempo uses `gpt-5.5`.

## What the AI receives

Tempo sends a limited context summary:

```txt
today's visible events
Tempo / Google / habit source counts
open tasks and top tasks
free time blocks
habit completion count
mood and energy labels
journal status only
```

Tempo does not send raw journal body text in Phase 24C.

## Fallback behavior

If `OPENAI_API_KEY` is missing or the API call fails, Tempo Assistant falls back to the local rule-based assistant from Phase 24A/24B, so the app still works.
