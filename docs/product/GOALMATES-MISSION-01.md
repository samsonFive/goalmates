# GoalMates Mission 01 — Family Dogfood Release

## Mission
Create a real household operating system for planning and follow-through. GoalMates should absorb existing paper, whiteboard, calendar, list, and project habits rather than demand that users abandon them before receiving value.

The proving ground is a household using the product daily. Mission 01 is successful when the system can become a credible landing page for that household's planning process.

## Problem
Planning is fragmented across paper planners, scratch lists, whiteboards, calendars, messages, and people's heads. Shared visibility is poor; free time does not automatically reveal the best available action; project work loses context; estimates are rarely learned from; and most task tools store work without teaching a better planning process.

## Product promise
GoalMates turns plans—paper or digital—into structured, shareable action and helps people improve how they plan, execute, and learn together over time.

## Core loop
1. **Capture** — get intentions into the system with minimal friction.
2. **Plan** — decide what matters and when it fits.
3. **Do** — focus, collaborate, claim, request, and complete.
4. **Review** — reconcile what actually happened.
5. **Learn** — improve estimates, workload, routines, and future plans.

## Mission 01 capabilities
### Accounts and spaces
- Individual account and private personal space.
- Shared GoalMate spaces for couples/families/teams.
- Membership and role/permission model suitable for later child/limited accounts.
- Clear visibility of private vs shared information.

### Tasks
- Standalone tasks are first-class.
- Optional project relationship.
- Title, description/notes, estimated duration, optional actual duration, due/scheduled dates, priority/importance, context/tags, status, ownership/collaboration state, nudging preference, recurrence where appropriate.
- Completion, archive/history, and deliberate deletion.
- Shared pool, claim, request/assign, and collaborative semantics.

### Projects
- Goal/outcome, status, progress, participants, open/completed tasks, project context/workspace, relevant dates and review cadence.
- Project progress should derive meaningfully from work rather than require fake manual percentages.

### Calendar and planning
- Calendar is a planning surface, not a synonym for the task database.
- Tasks may be scheduled/time-blocked without becoming indistinguishable from external calendar events.
- Day/week planning and shared visibility.
- Architecture seam for external calendar sync/import.

### Capture
- Typed quick capture.
- Image/photo/document capture is a primary front door.
- Extract candidate tasks/events/notes and useful metadata such as date/time/duration when supported by evidence.
- Human reconciliation before ambiguous changes become durable.
- Standalone / attach project / create project decision.
- Fuzzy duplicate candidates and merge/link/skip options.
- Preserve source/provenance and confidence sufficient for later correction/audit.

### Rituals
First-class recurring planning-process objects, including configurable daily planning, daily debrief, weekly planning/review, monthly review, family planning, and custom rituals. Track ritual completion and useful reflection outputs.

### Focus
Start a focus session from a task or ad hoc intention; support duration/timer-oriented work and completion/reflection without forcing Pomodoro as the only method.

### Opportunity mode
Answer: **"I have some time—what should I do?"** Suggestions may use available time, task duration, schedule, context, priority, project state, ownership, user-selected energy/mood, and eventually location where permission/implementation allows. Users remain in control.

### Dashboard
An action-oriented command center, not a KPI wall. Surface:
- what needs attention now;
- upcoming rituals;
- today's/this week's plan;
- open projects and meaningful progress;
- shared requests/pool items;
- quick capture;
- opportunity/focus entry points;
- recent completion and plan-vs-actual learning;
- estimate calibration and planning trends.

### Project workspace/context
Projects support rich contextual material alongside structured work: formatted notes, images/media, links, files, research, ideas, decisions, and references. Avoid making free-form content the underlying data model for structured tasks.

### Nudges
Highly configurable. A task/project/ritual can be quiet or proactive. Suggestions should feel cooperative and useful, not managerial, shaming, or guilt-driven.

## Explicit non-goals / anti-patterns
- Not a chatbot with task management bolted on.
- Not a Jira clone for households.
- Not a Notion clone.
- Not a generic SaaS analytics dashboard.
- Not dependent on AI to perform basic CRUD/planning.
- Not a system that requires abandoning paper.
- Not a points engine that rewards creating/checking trivial tasks.

## Quality bar
Real persistence; secure authorization; migration strategy; accessible interaction; responsive phone/tablet/desktop behavior; honest empty/error/loading states; automated tests around core domain behavior; no knowingly dead primary controls; and documentation sufficient for another agent to continue the work.
