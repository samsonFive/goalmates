# GoalMates — Mission 01 Kickoff Prompt

You are the lead product-engineering agent for GoalMates.

Read `AGENTS.md` and every document under `/docs` before mutation. Inspect the local licensed design references under `/reference-assets` if present. They are reference material only and must remain gitignored.

## Objective
Build **GoalMates Family Dogfood Release 1**: an installable, mobile-first PWA that a real household can begin using as its planning system. This is not a proof-of-concept and not a deliberately crippled MVP. Prioritize complete, coherent user journeys over broad but fake surface area.

The core product loop is:

**Capture → Plan → Do → Review → Learn**

The signature front-door experience is:

**paper/image in → structured proposed plan/tasks/events → human reconciliation → useful shared action out.**

## Required outcomes
Deliver real persistence, authentication/authorization, individual/private and shared spaces, projects, standalone/project tasks, time estimates, calendar planning, image/document capture and structured reconciliation, duplicate prevention, rituals, focus sessions, opportunity suggestions, dashboard/review history, project context/workspaces, responsive phone/tablet/desktop experiences, installable PWA behavior, seed data, tests, and deployment documentation.

Do not assume captured planner tasks belong to projects. During intake users can leave a task standalone, attach it to an existing project, or create a project. Surface fuzzy duplicate candidates before creating likely duplicates.

## Product behavior
- Phone = Capture & Do.
- Tablet = Plan & Review.
- Desktop = Organize & Think.
- Suggestions are offers, not guilt mechanisms.
- Gamification rewards planning calibration and healthy process adherence, not raw checkbox volume.
- Rituals are first-class recurring process objects, not ordinary tasks disguised with labels.
- Completed work remains available for retrospective learning.

## Design direction
TaskPilot establishes visual/mobile inspiration; Dason supplies mature app/component references; Notion inspires flexible project context. GoalMates requirements remain authoritative. Do not clone any reference or create a generic AI dashboard.

## Execution
1. Perform read-only repo/spec/reference preflight.
2. If no app stack exists, write an ADR comparing viable choices and select a stack optimized for agentic development, PWA quality, maintainability, low initial operating cost, testing, and later native-wrapper readiness.
3. Produce an implementation plan mapped to the acceptance journeys in `docs/dogfood/DOGFOOD-SCENARIOS.md`.
4. Implement continuously rather than stopping after planning. Use branches/commits coherently.
5. Validate with automated tests and responsive browser QA.
6. Keep docs synchronized with reality.

## Definition of done
A new household can sign in, establish a shared space, capture a handwritten/printed plan image, review extracted items, resolve duplicates/project relationships, create tasks/events, plan them on a calendar, collaborate on shared work, complete/focus on work, perform planning/debrief rituals, and later review what was planned versus accomplished. The application is installable as a PWA and useful at phone, tablet, and desktop widths.

When blocked, do not silently stub the requirement. Implement a truthful degraded state and document the exact external dependency.
