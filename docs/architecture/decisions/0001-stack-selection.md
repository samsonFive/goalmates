# ADR 0001 — Mission 01 application stack

**Status:** Accepted  
**Date:** 2026-09-22

## Context

Mission 01 requires an installable, mobile-first PWA with real multi-user authorization, relational persistence, file storage for captures, async capture processing, provider seams, automated tests, low operating cost, and a later native-wrapper path. No application scaffold existed. Dason’s Bootstrap/Gulp kit is licensed reference only and is not a candidate stack.

## Options considered

| Option | Strengths | Risks for Mission 01 |
| --- | --- | --- |
| **Next.js App Router + TypeScript + Prisma + SQLite (Postgres-ready) + Auth.js** | Strong agent/tooling ecosystem; first-class TypeScript; App Router server actions for vertical slices; PWA via Web App Manifest + service worker; Prisma migrations; easy local dogfood; Auth.js credentials avoid OAuth vendor lock-in; later native wrap of the same web app | SQLite write concurrency is modest; Auth.js v5 still evolving; Node required |
| Remix / React Router 7 | Excellent progressive enhancement and forms | Smaller agent ecosystem; similar implementation cost without a PWA advantage |
| SvelteKit | Excellent PWA/offline story | Weaker agent/codegen familiarity; smaller hiring/tooling pool |
| Django + HTMX + Postgres | Python is already on this machine | Weaker installable-PWA and native-wrapper path; more split frontend/backend work |
| Supabase / Firebase first | Fast hosted auth/storage | Vendor lock-in; harder honest local dogfood; cost and data-boundary complexity |
| Dason Bootstrap/Gulp | Familiar dashboard chrome | Explicitly rejected; not GoalMates-owned; poor PWA/auth/domain fit |

## Decision

Use a **GoalMates-owned Next.js App Router application** at the repository root:

- **UI:** Next.js 15 + React 19 + TypeScript + Tailwind CSS with GoalMates semantic tokens
- **Auth:** Auth.js (NextAuth v5) credentials provider; OAuth remains a later seam
- **Data:** Prisma + SQLite for local/family dogfood; `DATABASE_URL` can point at PostgreSQL later without rewriting the domain
- **Files:** Local filesystem storage provider; S3-compatible interface reserved
- **Capture intelligence:** Provider interfaces for storage, OCR/vision, and structured interpretation. Local Tesseract OCR is the default; optional OpenAI vision if `OPENAI_API_KEY` is present. Failures are truthful.
- **Jobs:** In-process capture processing with persisted status (no extra broker required for household scale)
- **Tests:** Vitest for domain/authorization; Playwright for representative journeys
- **PWA:** Web App Manifest + service worker, installable independently of any native wrapper

## Consequences

- Agents can iterate in one TypeScript tree with migrations, seed data, and tests beside the UI.
- Households can dogfood locally without cloud credentials.
- Postgres, object storage, and a job queue can be swapped behind existing interfaces when usage outgrows SQLite/local disk.
- Capture works without an AI vendor; handwriting quality depends on the local OCR engine and always requires reconciliation.
