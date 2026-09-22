# GoalMates Design System Brief

## Reference hierarchy
1. **GoalMates product requirements** — authoritative behavior and information architecture.
2. **TaskPilot licensed Figma kit** — visual/mobile inspiration and interaction language.
3. **Dason licensed dashboard source** — mature desktop/tablet application patterns and component reference.
4. **Notion concepts** — inspiration for rich flexible project context/workspaces.

Do not clone any reference. Do not redistribute licensed source. Local `/reference-assets` content is inspection material only.

## Desired character
A **shared life-planning workbench**: calm, capable, human, structured without feeling corporate. Avoid the generic 2026 AI aesthetic of endless floating cards, gratuitous gradients/glows, chatbot-first layouts, excessive pill controls, and oversized empty hero areas.

## Visual direction
- Deep green is the initial signature family, subject to later brand refinement.
- Strong, obvious typographic hierarchy.
- Dense-but-calm information presentation.
- Restrained corner radii; not everything is a rounded card.
- Progress visualization should be useful and legible rather than decorative.
- Avatars/human presence where collaboration matters.
- High-quality empty, loading, error, reconciliation, and completion states.
- Rich content should be allowed to breathe inside project workspaces.

## Dashboard doctrine
The dashboard answers **what deserves attention / what can I do now?** before reporting metrics. Avoid opening with four generic KPI cards. Contextual actions, rituals, plan, requests, opportunity mode, and active projects lead; analytics support decisions.

Example contextual pattern:
- greeting/context;
- open time or today's plan;
- immediate actions;
- due ritual;
- active/shared work;
- learning/calibration insight.

## Components to study from references
### TaskPilot
Typography scale, spacing rhythm, mobile navigation, task rows, progress treatments, avatar/group patterns, hierarchy, dark/deep-green use, action emphasis.

### Dason
Calendar composition, forms, tables, menus, side navigation, responsive layout behavior, Kanban/task management patterns, modals, states, information-dense desktop controls.

## Accessibility
WCAG-minded contrast, keyboard access on desktop, visible focus, semantic controls, 44px-ish touch targets where practical, no hover-only primary actions, reduced-motion respect, meaningful labels/icons.

## Design tokens
Establish semantic tokens rather than scattering reference-kit values: background/surface/elevated, text/muted, border/divider, primary/accent, success/warning/danger/info, focus, spacing scale, radii, type scale, elevation. Light/dark architecture should remain possible even if Mission 01 ships one polished theme first.
