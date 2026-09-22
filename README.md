# GoalMates

GoalMates is a shared life-planning system for individuals, couples, families, and small teams. It turns paper and digital plans into structured shared action and reinforces **Capture → Plan → Do → Review → Learn**.

Mission 01 is a **family-dogfoodable installable PWA**, not a demo. See `docs/product/GOALMATES-MISSION-01.md` and `KICKOFF-PROMPT.md`.

## Stack

Next.js 15 App Router, TypeScript, Prisma/SQLite (Postgres-ready), Auth.js credentials, GoalMates-owned design tokens, Vitest, Playwright. Decision record: `docs/architecture/decisions/0001-stack-selection.md`.

## Try it on a phone

**https://samsonfive.github.io/goalmates/**

That GitHub Pages preview is installable. It keeps data on the device. The Next.js app in this repo is the multi-user server version for local or hosted deploy.

## Local setup

```powershell
copy .env.example .env
npm install
npx prisma migrate dev
npm run db:seed
npm run dev
```

Demo household (clearly labeled, separable from real accounts):

- `jordan@goalmates.local` / `household-demo`
- `sam@goalmates.local` / `household-demo`

## Tests

```powershell
npm test
npx playwright install
npm run test:e2e
```

## Licensed references

Place TaskPilot and Dason packages under `reference-assets/`. They are gitignored inspection material only.

## Docs

- Product: `docs/product/`
- Architecture: `docs/architecture/`
- Design: `docs/design/`
- Dogfood journeys: `docs/dogfood/DOGFOOD-SCENARIOS.md`
- Deploy: `docs/deploy/DEPLOYMENT.md`
