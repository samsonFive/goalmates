# Architecture Brief

## Desired properties
- Installable mobile-first PWA.
- Excellent responsive behavior on phone, tablet, desktop.
- Native-wrapper readiness later without requiring a rewrite of the domain/backend.
- Real multi-user auth and row/object authorization.
- Relational persistence suitable for tasks/projects/schedules/history.
- Durable object/file storage for captures and project resources.
- Background/async processing for capture intelligence and notifications.
- Provider seams for AI/vision, calendar, notifications, storage, and auth where practical.
- Automated unit/integration/browser testing.
- Low initial operating cost and simple deployability.
- Schema migrations and reproducible local development.

## Stack selection
The implementation agent should compare viable modern stacks and record an ADR before scaffolding. The ADR should cover:
- PWA/offline/installability;
- auth/authorization quality;
- relational DB/migrations;
- file storage;
- async jobs;
- testing and browser QA;
- deployment simplicity/cost;
- agent/tool ecosystem;
- native wrapper path;
- vendor lock-in and escape hatches.

Do not select Dason's Bootstrap/Gulp stack merely because the licensed reference exists. Dason is design/component reference material.

## External integrations
Mission 01 should establish seams and implement integrations needed for dogfooding. Calendar integration must distinguish internal planning records from external provider records and be designed for idempotent sync/conflict handling before two-way mutation is enabled.

## Observability
At minimum: structured server errors/logging, capture processing status/failure visibility, migration/version clarity, and enough diagnostics to distinguish provider failure from application failure.
