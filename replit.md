# NoteFlow AI

A sleek AI-powered note-taking app with glassmorphism UI, 3D backgrounds, and natural language AI assistance powered by Google Gemini.

## Architecture

- **Frontend**: React 18 + TypeScript + Vite (port 5000 in dev)
- **Backend**: Express.js (port 3000 in dev). Vite proxies `/api` → `:3000`. In production, the same Express process serves the built `dist/` static bundle.
- **Database**: Replit PostgreSQL via Drizzle ORM
- **Auth**: JWT-based (tokens in localStorage, signed with `SESSION_SECRET` or `JWT_SECRET`)
- **AI**: Google `gemini-2.0-flash` (chat streaming, auto-tag, summarize, enhance, semantic search, voice transcription)

## Project Structure

```
src/                       — React frontend
  components/              — UI (NoteCard, NoteEditor, AIChatPanel, SearchBar, etc.)
  pages/                   — Auth, Index, NotFound
  store/                   — NotesContext (server-synced)
  lib/                     — api.ts (notesApi, chatApi, aiApi, chatStream), auth.ts
  types.ts                 — Shared Note/Tag/NoteColor types
server/                    — Express backend
  index.ts                 — Server entry, mounts routes, serves dist/ in prod
  auth.ts                  — JWT middleware
  db.ts                    — Drizzle + pg pool
  lib/gemini.ts            — Shared Gemini client (geminiGenerate, geminiStream, geminiGenerateJSON)
  routes/
    authRoutes.ts          — POST /api/auth/register, /login, GET /me
    notesRoutes.ts         — CRUD /api/notes
    chatRoutes.ts          — POST /api/chat (SSE streaming, persists conversations),
                             GET/DELETE /api/chat/conversations[/:id]
    aiRoutes.ts            — POST /api/ai/auto-tag, /summarize, /enhance, /search, /transcribe
shared/
  schema.ts                — Drizzle schema (users, user_preferences, notes, tags,
                             note_tags, note_attachments, chat_conversations, chat_messages)
```

## Dev Workflow

```
npm run dev          — runs server (tsx) and Vite together (single workflow)
npm run dev:server   — Express only on :3000
npm run dev:client   — Vite only on :5000
npm run db:push      — sync Drizzle schema (use --force if prompted)
npm run build        — vite build + esbuild server bundle into dist-server/
npm run start        — production: node dist-server/index.js (serves dist/)
```

## Secrets Required

- `DATABASE_URL` — PostgreSQL connection string (auto-provisioned by Replit)
- `SESSION_SECRET` (or `JWT_SECRET`) — JWT signing secret
- `GOOGLE_API_KEY` — Gemini API key (https://aistudio.google.com/apikey)

## Deployment

Configured for **autoscale** deployment:
- build: `npm run build` (builds frontend + bundles server with esbuild)
- run: `npm run start` (serves API + static files from one Node process)

## AI Features

- **Chat panel** — streaming Gemini responses, persists conversations, history sidebar, can emit `create_note` actions in fenced ` ```action ` JSON blocks.
- **AI Enhance / Summarize / Auto-Tag** — buttons in the note editor footer call `/api/ai/*` and update the note in place.
- **AI Semantic Search** — search bar `Sparkles` button (or Enter) sends the query plus the user's notes to Gemini, which returns the matching note IDs and a one-line explanation; results filter the grid.
- **Voice transcription** — `/api/ai/transcribe` accepts base64 audio + mime type and returns text via Gemini.

## Key UI Features

- Masonry grid, pin/archive/trash with restore
- Color-coded notes, glassmorphism + 3D background
- Mind map view, tags & AI-tagged filter
- Visual comfort settings (themes, blue-light filter, color-blind modes)
- Keyboard shortcuts: Ctrl/Cmd+K command palette
