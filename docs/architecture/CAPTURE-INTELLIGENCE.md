# Capture Intelligence

## Product requirement
Image/document capture is a primary GoalMates front door. A paper planner user should be able to photograph a page and reach useful structured planning data without retyping it.

## Canonical flow
1. Capture/upload image or document.
2. Store source safely and create processing record.
3. Extract text/layout with a provider abstraction suitable for handwriting and printed content.
4. Interpret candidates: task, event, note, date/time, duration, project hints, assignee hints, list/group structure.
5. Run duplicate/project matching against records visible to the user in the target space.
6. Present a **reconciliation screen**.
7. For each candidate, user can accept/edit/skip/merge/link and choose:
   - standalone task;
   - existing project;
   - create new project;
   - event/note when appropriate.
8. Commit accepted changes transactionally where practical.
9. Preserve source link/provenance and processing result for correction/audit.

## Reconciliation UX requirements
- Show source and interpreted result together where screen size permits.
- Batch acceptance for high-confidence obvious items.
- Never force every task into a project.
- Surface likely duplicates with enough context to decide.
- Avoid silently merging fuzzy matches.
- Allow quick correction of title/date/time/duration/project.
- Make uncertainty visible without overwhelming the user with model internals.

## Duplicate strategy
Use deterministic normalization first (case, whitespace, punctuation, dates/project identity), then fuzzy/semantic similarity as a candidate generator. Consider active/completed state, time proximity, project, and source. Duplicate detection proposes; the user decides ambiguous cases.

## Provider architecture
Define interfaces around source storage, OCR/vision extraction, structured interpretation, and optional LLM enrichment. Do not couple domain persistence to one AI vendor.

## Degraded behavior
If intelligence is unavailable, preserve the uploaded source and permit manual task/event creation from it. Never claim capture succeeded when only the image was stored.

## Security/privacy
Captured family planning material can contain sensitive household information. Apply space authorization to source files and derived data. Avoid exposing private-space content to shared-space duplicate matching or AI prompts.
