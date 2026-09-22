# Deployment

GoalMates is a Next.js application with Prisma/SQLite by default.

## Local dogfood

1. Install Node 22+.
2. Copy `.env.example` to `.env` and set `AUTH_SECRET`.
3. `npm install`
4. `npx prisma migrate dev`
5. `npm run db:seed`
6. `npm run dev`
7. Sign in with `jordan@goalmates.local` / `household-demo` (demo data is labeled).

## Production notes

- Point `DATABASE_URL` at PostgreSQL when more than one household process needs concurrent writes. Prisma schema types stay the same; generate a Postgres migration before switching.
- Set `UPLOAD_DIR` to durable disk or replace `src/lib/providers/storage.ts` with an S3-compatible adapter.
- Set `AUTH_SECRET` to a long random value. OAuth providers can be added beside the credentials provider.
- Optional: `OPENAI_API_KEY` upgrades image capture from local Tesseract to vision. If it is missing or fails, capture stays stored and the UI reports the failure honestly.
- Build with `npm run build` and run `npm start`.
- Serve over HTTPS so the PWA can install.

## Public preview (GitHub Pages)

GitHub Pages can only host static files. It cannot run the Next.js server, Prisma, or real multi-device auth.

The public preview is therefore a **device-local PWA** at:

**https://samsonfive.github.io/goalmates/**

Open that URL on a phone, sign in with the demo accounts, and add it to the home screen. Capture, plan, tasks, focus, and rituals work in the browser; data stays on that device.

The full server app remains in this repository for local use (`npm run dev`) or a later Vercel/Postgres deploy when you want the same household database on every phone.

## PWA

`/manifest.webmanifest` and `/sw.js` enable install prompts on supported mobile browsers. Offline coverage is the app shell only; mutations require the network.
