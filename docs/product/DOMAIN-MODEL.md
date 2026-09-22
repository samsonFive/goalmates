# Domain Model — Initial Contract

This is a conceptual model, not a mandated database schema. Agents may refine it through documented migrations/ADRs while preserving behavior.

## Principal entities
### User
Identity, profile, preferences, notification defaults, locale/time zone.

### Space
A private or shared planning boundary. Fields include type, name, membership, settings, and ownership/governance.

### Membership
User ↔ Space relationship with role/capabilities. Design for adult/admin/member and later constrained/child experiences without requiring them all in Mission 01 UI.

### Goal
Optional higher-order desired outcome with target dates/metrics and related projects/habits.

### Project
Outcome-oriented container with space, participants, status, dates, review cadence, context/workspace, and task relationships.

### Task
Independent actionable unit. Required: title, space, status. Common optional fields: project, description, estimate, actual, due/scheduled window, importance/priority, tags/context, recurrence, owner/claimant, creator/requester, nudging policy.

Task collaboration states must support at least:
- personal/private;
- shared/unclaimed pool;
- claimed/owned;
- requested/assigned;
- collaborative/multi-participant where useful.

### CalendarEvent
Time-specific event distinct from a task. May originate internally or externally and may link to tasks/projects/rituals.

### TimeBlock / SchedulePlacement
Connects an actionable item to planned time without forcing the item itself to become a calendar event.

### Ritual
Reusable process definition: cadence, prompts/steps, participants/space, expected duration, reminder/nudge policy.

### RitualOccurrence
A scheduled/completed instance with answers/reflection and timestamps.

### FocusSession
Timed execution record optionally related to task/project, with planned/actual duration and outcome.

### Capture
Source ingestion record: image/document/text, provenance, processing status, extracted candidates, confidence and reconciliation status.

### CaptureCandidate
Proposed task/event/note/project relationship before durable acceptance. Stores source evidence and duplicate candidates.

### WorkspaceBlock / ProjectResource
Flexible contextual content such as rich text, image/media, link, file, decision, research note. Structured domain objects should be linkable from context.

### NudgePolicy / NotificationPreference
User/space/project/task/ritual-level policy with inheritance/override semantics.

### Activity / AuditEvent
Useful collaboration/history event: created, requested, claimed, scheduled, completed, moved, reconciled, etc. Avoid invasive surveillance.

## Important invariants
- Task.project_id is nullable by design.
- Private-space records must never leak into shared views through search, suggestions, activity, or AI context.
- A captured candidate is not equivalent to an accepted durable task.
- De-dupe should not silently destroy distinct work.
- Completion timestamps/history must support retrospectives.
- External calendar identity/sync metadata must remain separable from GoalMates canonical records.
