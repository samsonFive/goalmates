# Agent Guardrails

## Autonomy
Make reversible engineering decisions without waiting for approval when they satisfy the written product doctrine. Record consequential decisions. Do not shrink scope merely to make a milestone easier to declare complete.

## Vertical delivery
Prefer complete user journeys over disconnected layers. A feature is not complete because a schema or screen exists; persistence, authorization, states, errors, tests, and responsive interaction matter.

## Truthfulness
- No fake success toasts.
- No controls that imply an unavailable integration works.
- No placeholder analytics presented as real household insight.
- Seed/demo data must be clearly separable from user data.
- If an external provider is unavailable, expose a truthful degraded state.

## Data safety
Use migrations; avoid destructive schema resets as routine workflow; seed safely; never commit secrets; protect private/shared boundaries in backend authorization rather than UI alone.

## AI safety/quality
AI output is proposed data until accepted when ambiguity could cause harmful/annoying durable changes. Store enough provenance to understand/correct capture results. Avoid sending unrelated private household context to models.

## Testing
At minimum cover domain invariants, authorization/privacy, capture reconciliation, duplicate proposal behavior, core CRUD, shared collaboration, planning/calendar relationships, ritual completion, and representative browser journeys. Include responsive QA at phone/tablet/desktop sizes.

## Design
Use reference assets as inspiration/inspection only. Create GoalMates-owned components/tokens. Avoid vendor-kit copy-paste unless licensing and technical rationale explicitly permit it and the decision is documented.

## Handoff format
Every substantial agent run ends with:
- branch and HEAD SHA;
- working tree status;
- migrations/schema changes;
- tests and QA results;
- user journeys now working;
- known limitations/blockers;
- next recommended mission slice.
