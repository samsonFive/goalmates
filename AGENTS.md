# GoalMates Agent Instructions

Read this file first, then `KICKOFF-PROMPT.md`, `docs/product/GOALMATES-MISSION-01.md`, and the rest of `/docs` before mutation.

## Mission doctrine
- Build a real family-dogfoodable product, not a toy MVP or screenshot prototype.
- Preserve the product loop: **Capture → Plan → Do → Review → Learn**.
- Paper/image intake is a first-class front door.
- Individual accounts and shared GoalMate spaces are foundational.
- Phone, tablet, and desktop are first-class from the beginning.
- UI must not collapse into generic AI/SaaS cards. Follow `docs/design/`.
- Licensed reference assets under `/reference-assets` are local-only inspiration/reference. Never commit, redistribute, or blindly copy them.
- Prefer replaceable provider interfaces for OCR/vision, AI, calendar, storage, notifications, and auth where practical.
- No knowingly dead controls, fake persistence, misleading success states, or demo-only core flows.

## Agent operating rules
1. Inspect repository state and specs before changing code.
2. Record consequential architecture decisions as ADRs under `docs/architecture/decisions/`.
3. If the repo has no application scaffold, select a modern stack suited to a mobile-first installable PWA, document why, and proceed unless a blocker requires human input.
4. Build vertical slices that are usable end-to-end, while preserving the complete Mission 01 scope.
5. Add migrations, seed/demo household data, automated tests, accessibility, and responsive QA alongside implementation.
6. Protect authorization boundaries between private and shared data.
7. Preserve history: completion/archive should normally supersede destructive deletion for meaningful planning records.
8. Do not infer that every captured item belongs to a project. Standalone tasks are first-class.
9. Captured suggestions require a reconciliation step before durable creation when confidence/ambiguity warrants it.
10. At every handoff report: branch, HEAD SHA, tests, working tree, completed flows, known gaps, and exact next action.

## Stop conditions
Stop and ask only for a genuinely blocking decision such as unavailable credentials for a required external service, an irreversible destructive action, or contradictory product requirements that cannot safely coexist. Prefer sensible documented defaults for reversible implementation choices.
