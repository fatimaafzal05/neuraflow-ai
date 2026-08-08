# NeuraFlow AI

> A polished, privacy-conscious productivity workspace for job seekers, students, and early-career professionals.

[Live demo](https://neuraflow-ai-fatima-2026.fa23-bcs-048.chatgpt.site) · [Source code](https://github.com/fatimaafzal05/neuraflow-ai)

NeuraFlow AI brings practical career and learning workflows into one responsive web experience. It helps a user turn a vague goal—preparing for an interview, tailoring a résumé, planning revision, or drafting a cover letter—into a structured next step.

## Why this project matters

This project is designed as a portfolio-quality product build rather than a single-page UI exercise. It demonstrates the ability to:

- Turn a broad user problem into focused, task-specific workflows
- Build a coherent, responsive interface with a consistent component system
- Design client-side data flows that work without a database setup
- Create useful AI-style outputs with a dependable offline fallback
- Ship a TypeScript application with production build and deployment configuration

## What users can do

| Workflow | User value |
| --- | --- |
| AI chat | Get structured help with careers, study planning, productivity, and interview preparation. |
| Résumé builder | Create, preview, save, and download a targeted résumé. |
| Cover letter generator | Draft a role-specific letter from a job description and personal context. |
| Interview coach | Practice a five-question interview and receive clear, actionable feedback. |
| Study assistant | Generate notes, flashcards, and quiz questions from a topic. |
| Prompt library and dashboard | Keep useful prompts and review activity in one personal workspace. |

## Product decisions

### Works without a backend account

NeuraFlow uses browser-local guest storage for the demo experience. A visitor can explore the product without creating a remote account or configuring Supabase. Their saved work stays in their own browser, rather than being shared with other visitors.

### Useful even without an API key

The app has an offline assistant that produces varied, structured responses for core workflows. This makes the project demonstrable and functional without requiring users to bring an AI-provider key.

### Transparent limitations

The default assistant is a rules-based fallback, not a general-purpose large language model. It is suitable for demo and portfolio use; users should verify important career, academic, and professional information before relying on it.

## Tech stack

- **Frontend:** React 19, TypeScript, TanStack Start, Vite
- **UI system:** Tailwind CSS v4, shadcn/ui, Radix UI, Motion, Lucide
- **Data and state:** Browser local storage, TanStack Query, Zustand
- **AI integration:** Vercel AI SDK with an offline assistant fallback
- **Quality and delivery:** ESLint, TypeScript checks, production build scripts, public deployment configuration

## Architecture highlights

```text
Browser
  ├─ Marketing site and product workspace
  ├─ Local guest session + browser-local saved data
  ├─ Career, study, interview, and writing workflows
  └─ Chat API route → offline response generator

Production build
  └─ TanStack Start / Nitro output packaged for deployment
```

## Run locally

**Requirements:** Node.js 20 or newer.

```bash
npm install
npm run dev
```

Open the local address printed by Vite. No environment variables are required for the guest-mode experience.

## Verify quality

```bash
npm run lint
npx tsc --noEmit
npm run build
```

## Project structure

```text
src/
  routes/                  Marketing, workspace pages, and chat route
  components/              Reusable UI, application shell, and branding
  integrations/            Browser-local data and guest-session adapter
  lib/                     Offline assistant and workflow generators
scripts/                   Production packaging helpers
```

## Privacy

Guest-mode data is stored in the current browser only. Clearing site data or changing browsers removes access to saved items. Avoid storing sensitive personal information in a portfolio demo.

## License

MIT
