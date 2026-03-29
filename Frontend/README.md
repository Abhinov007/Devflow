# Chat App — Vite + React

Dark-mode chat frontend built for Claude / OpenAI API wrappers.

## Features
- Sidebar with persistent chat history (localStorage)
- Login / auth UI (demo — swap for Clerk/Supabase)
- Streaming message support (SSE)
- Markdown rendering in assistant messages
- Collapsible sidebar
- Auto-resizing textarea

## Setup

```bash
npm install
npm run dev
```

App runs at http://localhost:5173

## Connecting your backend

The app proxies `/api/chat` → `http://localhost:3001` (configured in `vite.config.js`).

Your backend should accept:

```json
POST /api/chat
{ "messages": [{ "role": "user", "content": "..." }] }
```

And stream back SSE:

```
data: {"choices":[{"delta":{"content":"Hello"}}]}
data: [DONE]
```

### Example Express + Anthropic backend

```js
import Anthropic from '@anthropic-ai/sdk'
import express from 'express'

const app = express()
app.use(express.json())

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

app.post('/api/chat', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')

  const stream = await client.messages.stream({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: req.body.messages,
  })

  for await (const chunk of stream) {
    if (chunk.type === 'content_block_delta') {
      res.write(`data: ${JSON.stringify({ content: chunk.delta.text })}\n\n`)
    }
  }

  res.write('data: [DONE]\n\n')
  res.end()
})

app.listen(3001)
```

## File structure

```
src/
├── App.jsx                  # Root component
├── App.module.css
├── index.css                # Design tokens + markdown styles
├── main.jsx
├── hooks/
│   └── useChat.js           # All state, streaming, localStorage
└── components/
    ├── Sidebar.jsx          # Chat history + login button
    ├── Message.jsx          # Renders user/assistant bubbles + markdown
    ├── ChatInput.jsx        # Auto-resize textarea + send/stop
    ├── EmptyState.jsx       # Suggestion prompts on fresh load
    └── LoginModal.jsx       # Demo login form
```

## Swapping in real auth

Replace the `LoginModal` submit handler with a call to your auth provider:

- **Clerk**: `useSignIn()` from `@clerk/clerk-react`
- **Supabase**: `supabase.auth.signInWithPassword()`
- **NextAuth** (if you move to Next.js): `signIn()`
