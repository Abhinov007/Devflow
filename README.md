# devflow

Small Node.js CLI that wires **Notion databases** (inbox/backlog/sprint) + optional **LLM providers** (Claude/OpenAI/Gemini).

## Setup

1. Install deps:

```bash
npm install
```

2. Create env:

- Copy `.env.example` → `.env`
- Fill in your keys and Notion IDs

## Notion env values

`NOTION_INBOX_DB`, `NOTION_BACKLOG_DB`, `NOTION_SPRINT_DB` can be:

- a raw 32-char Notion ID, or
- a Notion URL / share link that contains the ID (the code extracts the first 32-hex token)

## CLI usage

Run via Node:

```bash
node index.js inbox:list --limit 10
node index.js inbox:add --title "Investigate flaky build"

node index.js backlog:list
node index.js backlog:add --title "Add onboarding docs"

node index.js sprint:list
node index.js sprint:add --title "Ship v1 CLI"

node index.js changelog:append --line "Added CLI scaffolding" --line "Wired Notion + LLM providers"
```

LLM quick test:

```bash
node index.js llm:ask -p claude --prompt "Return JSON: {\"ok\": true}" --json
```

## Code map

- `config/notion.js`: pulls + normalizes Notion IDs from env
- `mcp/*.js`: Notion read/write helpers
- `llm/providers/*.js`: provider implementations
- `llm/index.js`: provider factory
- `utils/logger.js`: colored logs
- `utils/parseJSON.js`: safe JSON parsing for LLM output

