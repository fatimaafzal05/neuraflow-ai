# NeuraFlow AI

NeuraFlow AI is a focused workspace for career preparation, interview practice, study support, and everyday productivity. It runs entirely in guest mode, keeping your session and saved work in the current browser.

## What you can do

- Chat with a practical career and productivity assistant
- Create, preview, download, and save targeted resumes
- Draft tailored cover letters
- Run a five-question mock interview with feedback and scoring
- Generate study notes, flashcards, and quizzes
- Save reusable prompts and review activity from a personal dashboard

## AI modes

NeuraFlow works in either of these modes:

| Mode              | Setup                               | Behaviour                                                                                     |
| ----------------- | ----------------------------------- | --------------------------------------------------------------------------------------------- |
| Offline (default) | No AI key required                  | Provides instant, template-based chat and generation features. Ideal for demos and local use. |
| Cloud AI          | Set `LOVABLE_API_KEY` on the server | Uses Google Gemini 2.5 Flash through the Lovable AI Gateway for generated responses.          |

The app selects cloud AI automatically when the key is available; otherwise it remains fully usable in offline mode. API requests require an authenticated user in either mode.

## Technology

- **App:** TanStack Start, React 19, TypeScript, Vite
- **UI:** Tailwind CSS v4, shadcn/ui, Motion, Lucide
- **Data and auth:** Browser local storage and guest sessions
- **State:** TanStack Query and Zustand
- **AI:** Vercel AI SDK with an optional Lovable/Gemini provider and a built-in offline fallback

## Getting started

### Prerequisites

- Node.js 20 or newer

### Install and run

```bash
npm install
copy .env.example .env
npm run dev
```

Open the local address printed by Vite (normally `http://localhost:8080`).

On macOS or Linux, use this instead of `copy`:

```bash
cp .env.example .env
```

No environment variables are required for guest mode.

## Quality checks

```bash
npm run lint
npx tsc --noEmit
npm run build
```

## Project layout

```text
src/
  routes/                     Pages, route guards, and the chat API
    _authenticated/           Signed-in workspace
  components/                 Brand, app, marketing, and UI components
  integrations/supabase/      Supabase clients and auth middleware
  lib/
    ai.functions.ts           Server-side generators and persistence
    offline-assistant.server.ts Credential-free fallback assistant
    ai-gateway.server.ts      Optional cloud AI provider
supabase/migrations/          Schema, RLS policies, roles, and triggers
```

## Security and data

Guest-mode data is stored in the browser only. Clearing browser storage or switching browsers removes access to it. Do not store sensitive personal data in the app.

## Deployment

Deploy to any compatible hosting provider after running `npm run build`. Each browser keeps its own local guest workspace.

## License

MIT
