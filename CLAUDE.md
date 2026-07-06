# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build — run before pushing to catch type/build errors
npm run lint         # ESLint
```

No test suite exists. Verify changes by building (`npm run build`) and running the dev server.

## Deployment

Vercel auto-deploys on merge to `main`. Workflow: push to feature branch → create PR → squash merge.

## Architecture

**大喜利Pocket** — a Japanese comedy improv (大喜利) party game. Players join rooms, answer AI-generated prompts, vote with "座布団" (cushions), and get AI judge reviews.

### Stack

- **Next.js 16.2.9** (App Router, Turbopack) + React 19 + Tailwind CSS 4
- **Firebase**: Firestore (client SDK for realtime subscriptions, Admin SDK for server-side writes), Auth (Anonymous + LINE Login via custom tokens), Storage (photo uploads)
- **Anthropic API**: Claude Haiku for question generation (`/api/ogiri/question`) and AI judge reviews (`/api/ogiri/review`)
- **Vercel** hosting

### Firebase Split

Two Firebase initializations — never mix them:

- `lib/firebase/client.ts` → `auth`, `db` — used in `"use client"` components and `lib/ogiri/*.ts` helpers. Realtime subscriptions via `onSnapshot`.
- `lib/firebase/admin.ts` → `adminDb` — used ONLY in `app/api/` route handlers (server-side). Requires `FIREBASE_SERVICE_ACCOUNT_JSON` env var.

### Game Flow

```
Waiting Room → Game (Answer) → Vote → Result → [next round or Summary]
     ↑              ↓                    ↓
  room.status   session.status      round.status
  "waiting"     "answering"         "answering"
  "active"      "voting"            "voting"
  "finished"    "reviewing"         "reviewing"
                "finished"          "done"
```

- **Room** (`rooms/{id}`): lobby with invite code, member list, host controls
- **Session** (`sessions/{id}`): one play-through (multiple rounds), tracks `currentRound` and `status`
- **Round** (`sessions/{sid}/rounds/{n}`): one question with answer deadline, vote deadline
- **Answers/Votes/AiReviews**: subcollections under each round

Phase transitions use `transitionPhase()` (atomic `writeBatch` updating both round and session status). All status-based navigation is driven by `onSnapshot` callbacks — when status changes, the subscriber's callback calls `router.replace()`.

### Key Patterns

**Firestore subscriptions**: All `subscribe*` functions in `lib/ogiri/sessions.ts` and `lib/ogiri/rooms.ts` follow the pattern: guard empty IDs → `onSnapshot` with error handler → return unsubscribe function. Always call these inside `useEffect` and return the unsubscribe.

**Timestamp handling**: Firestore `Timestamp` objects have a `toDate()` method. Never extract this method into a variable — call it directly on the object to preserve `this` binding: `ts.toDate()`, not `const fn = ts.toDate; fn()`.

**Suspense boundaries**: Pages using `useSearchParams()` must wrap the content component in `<Suspense>`. Pattern: `function PageContent() { ... }` + `export default function Page() { return <Suspense><PageContent /></Suspense> }`.

**Auth flow**: `AuthGuard` in `components/ClientProviders.tsx` wraps all pages. It redirects unauthenticated users to `/auth/login`. Public routes: `/`, `/auth/*`, `/invite/*`, `/engawa/*`.

### Routing

- `/rooms` — room list
- `/rooms/new` — create room
- `/rooms/[id]` — waiting room (lobby)
- `/rooms/[id]/game?sid=` — answer phase
- `/rooms/[id]/game/vote?sid=&round=` — voting phase
- `/rooms/[id]/game/result?sid=&round=` — round results + AI reviews
- `/rooms/[id]/summary?sid=` — final summary (千秋楽)
- `/engawa` — community feed (public お題 + open answers)
- `/engawa/[id]` — single お題 detail + answer submission

### Next.js 16 Breaking Changes

- **error.tsx**: The retry prop is `unstable_retry`, not `reset`
- **Server Component params**: `params` is a `Promise` in server components (use `await params`); `useParams()` in client components still returns a plain object
- Always check `node_modules/next/dist/docs/` for current API behavior before writing new route files

### Environment Variables

Required in `.env.local` (never commit):
- `NEXT_PUBLIC_FIREBASE_*` — Firebase client config (5 vars)
- `FIREBASE_SERVICE_ACCOUNT_JSON` — Firebase Admin (server-side only)
- `ANTHROPIC_API_KEY` — Claude API for question generation and AI reviews
- `LINE_CHANNEL_ID`, `LINE_CHANNEL_SECRET`, `NEXT_PUBLIC_LINE_CHANNEL_ID` — LINE Login

### Design Language

Japanese-themed UI: `font-mincho` (Shippori Mincho B1) for headings, `font-gothic` (Zen Kaku Gothic New) for body. Brand colors: `#E5402F` (red/accent), `#2BA35F` (green/success), `#F4C422` (gold), `#1A1714` (ink), `#FBF7EC` (paper background). Custom SVG illustrations via `Engimono` component.
