# Mission 01 implementation plan

Mapped to `docs/dogfood/DOGFOOD-SCENARIOS.md`. Implementation proceeds as vertical slices, not layer-only milestones.

| Slice | Dogfood scenarios | Outcome |
| --- | --- | --- |
| Accounts & spaces | 13 (foundation) | Sign up / sign in, personal space auto-created, shared GoalMate space, membership roles |
| Tasks & projects | 2, 3, 12 | Standalone tasks, optional projects, estimates, progress from work, workspace blocks |
| Collaboration | 4, 5 | Shared pool, claim/release, lightweight request/errand |
| Calendar & planning | 6 | Time blocks distinct from events; day/week plan surface |
| Capture & reconcile | 1, 15 | Image/text intake, provenance, duplicate proposals, standalone/project/create-project, honest failure |
| Do: focus & opportunity | 7, 8 | Timed focus sessions; “I have N minutes” suggestions with explanations |
| Rituals & review | 9, 10, 11 | Configurable rituals, debrief/weekly review, estimate calibration without shame |
| Responsive PWA | 14 | Phone Capture & Do, tablet Plan & Review, desktop Organize & Think, installable |

## Device jobs

- **Phone:** capture, now list, claim/complete, focus, opportunity, day strip
- **Tablet:** week plan + inbox side-by-side, capture reconciliation with source
- **Desktop:** project workspace depth, lists/tables, space admin, bulk organization
