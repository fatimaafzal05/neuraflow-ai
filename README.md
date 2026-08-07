# NeuraFlow AI

Production-ready AI productivity suite: streaming chat, resume & cover-letter generator, interview coach, study assistant (notes, flashcards, quizzes), prompt library, and an admin dashboard.

## Stack

- **Framework:** TanStack Start v1 (React 19, Vite 7, SSR on Cloudflare Workers)
- **Styling:** Tailwind CSS v4 + shadcn/ui, dark premium theme
- **Backend:** Lovable Cloud (Supabase) — Postgres, Auth (email + Google OAuth), RLS
- **AI:** Lovable AI Gateway (Google Gemini 2.5 Flash) via Vercel AI SDK
- **State/Data:** TanStack Query, Zustand
- **Charts / UX:** Recharts, motion/react, sonner, react-markdown + rehype-highlight

## Local development

```bash
bun install
bun run dev        # http://localhost:8080
bun run build
```

### Environment variables

Copy `.env.example` to `.env` and set:

```
SUPABASE_URL=...
SUPABASE_PUBLISHABLE_KEY=...
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
VITE_SUPABASE_PROJECT_ID=...
LOVABLE_API_KEY=...            # optional, server-only, for cloud AI responses
```

Never commit `.env`. The publishable Supabase values may be exposed to the browser, but the
Lovable API key must remain server-only.

Without `LOVABLE_API_KEY`, the app runs in built-in offline mode: chat, resume, cover letter,
study, and interview features remain usable with local template-based responses. Add the key
later to switch those features to cloud-generated responses automatically.

## Project structure

```
src/
  routes/                # File-based routing
    __root.tsx           # Root layout, head metadata, Toaster
    index.tsx            # Marketing landing page
    auth.tsx             # Sign in / sign up (email + Google)
    reset-password.tsx
    _authenticated/      # Auth-gated app shell
      route.tsx          # Sidebar shell + session guard
      dashboard.tsx
      chat.tsx           # Streaming AI chat
      resume.tsx         # AI resume builder
      cover-letter.tsx   # Cover letter generator
      interview.tsx      # Mock interview coach
      study.tsx          # Notes, flashcards, quiz
      prompts.tsx        # Prompt library
      settings.tsx
      admin.tsx          # Admin-only overview
    api/
      chat.ts            # Streaming chat endpoint
  components/            # UI + feature components (shadcn/ui + brand/*)
  integrations/supabase/ # Generated client + auth middleware
  lib/
    ai-gateway.server.ts # Lovable AI Gateway provider
    ai.functions.ts      # Server functions: resume, cover, study, interview
supabase/migrations/     # Schema, RLS policies, triggers
```

## Database

11 tables with RLS: `profiles`, `user_roles`, `chats`, `messages`, `resumes`,
`cover_letters`, `flashcard_decks`, `quizzes`, `quiz_attempts`,
`interview_sessions`, `saved_prompts`, `activity_logs`.

Roles are stored in `user_roles` and checked via the `has_role()`
security-definer function.

## Deploy

Publish through Lovable, or push the repo to GitHub and deploy to any
Cloudflare Workers–compatible host. `bun run build` emits the SSR bundle.

## License

MIT
