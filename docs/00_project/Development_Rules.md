# D-Control — Development Rules

## 1. Documentation is the source of truth

Project documentation is the single source of truth.

Before starting a new Feature, the developer/AI must read:

- `docs/00_project/D-Control_Constitution.md`
- `docs/00_project/AI_INSTRUCTIONS.md`
- `docs/00_project/Implementation_Checklist.md`
- relevant UI standards and specifications.

No implementation decision should be made only from memory.

---

## 2. Documentation and code are committed separately

Files in `docs/` must not be changed during ordinary code implementation unless the task explicitly says that documentation must be updated.

Documentation changes must be committed separately from frontend/backend implementation.

---

## 3. One Feature — one commit

Each completed Feature or visual component should be committed separately.

Examples:

- `Finalize Task Card tooltips and quick actions`
- `Add local font and text size appearance settings`
- `Improve tooltip positioning and viewport handling`
- `Implement TaskMetaBar v2`

---

## 4. One Codex request — one visual component

Codex should not receive large mixed tasks.

Allowed:

- one component;
- one visual block;
- one small Feature;
- one bugfix.

Avoid tasks like:

- “Redesign the whole Task Panel”
- “Fix everything”
- “Make it beautiful”

Preferred tasks:

- “Update only TaskMetaBar”
- “Polish only Task Panel header”
- “Fix only MessageComposer”

---

## 5. ChatGPT role and Codex role

ChatGPT acts as:

- Solution Architect;
- UX Lead;
- keeper of project consistency.

Codex acts as:

- implementation assistant;
- frontend/backend developer for already approved decisions.

UX, structure, lifecycle and architecture are discussed and approved before Codex receives implementation tasks.

---

## 6. One UI component — one implementation

Shared UI components must exist in one reusable implementation.

Examples:

- Tooltip
- TaskMetaBar
- Popover
- Context Menu
- UserPicker
- MessageComposer
- Task Panel footer

Do not create duplicate local versions of shared UI components inside individual Features.

---

## 7. Icon-only controls require Tooltip

Every button or control that is represented only by an icon must have Tooltip.

Tooltip must:

- use the shared Tooltip component;
- render above all UI layers;
- not affect layout;
- not block clicks;
- stay inside viewport.

---

## 8. Design tokens first

Global visual decisions should be implemented through shared variables/tokens:

- colors;
- font family;
- font size;
- spacing;
- radius;
- shadows;
- z-index;
- animation timing.

---

## 9. UI Freeze v1.0

After Task Panel is completed, D-Control should enter UI Freeze v1.0.

After UI Freeze, stable components may only change for:

- bug fixes;
- accessibility improvements;
- performance improvements;
- approved architecture-wide design decisions.

## UI Freeze additions

The following components are considered visually approved and should not be redesigned without project-wide approval:

- Task Header
- TaskMetaBar
- Task Chat
- Task Composer

Allowed changes:

- bug fixes;
- accessibility;
- performance;
- architecture-wide design decisions.

Visual redesign is prohibited after approval.

## Component Freeze

When a UI component reaches Approved status:

- its layout is considered stable;
- future changes require explicit approval;
- cosmetic redesigns are avoided;
- only bug fixes and architecture-wide improvements are allowed.

Each frozen component must be recorded in:

docs/01_ui/UI_Freeze_Log.md

### Prefer UI composition over new entities

When possible, prefer solving new functionality through UI composition instead of introducing new backend entities.

Example:

Subtasks v2 uses visual checklist groups based on a group name assigned to each subtask instead of creating separate Checklist and ChecklistGroup models.

This keeps the data model simple while allowing richer UI.
