# D-Control — Current State

## Next session

Continue with:

Feature:
Task Panel v2 polishing

Pending:

- TaskMetaBar panel layout
- Header actions
- Description editing
- Chat polishing
- Participants footer
- Header resize

## Current branch

`feature/codex-test-admin-view`

## Development process

Current process:

- ChatGPT is used as Solution Architect and UX Lead.
- Codex is used only for small approved implementation tasks.
- One Codex request = one visual component or one small bugfix.
- Large mixed tasks are avoided.
- Code and documentation are committed separately.

## Completed UI foundation

Completed or mostly completed:

- Workspace Header
- Sidebar
- Task Card
- Unified Tooltip system
- Quick Actions
- Appearance Settings
- Local web fonts
- Text size settings
- TaskMetaBar initial implementation

## Important UI rules

- Documentation is the source of truth.
- `docs/` must not be changed together with code.
- One Feature = one commit.
- Every icon-only control must have Tooltip.
- Shared UI components must have one reusable implementation.
- Tooltip must render above all UI layers and stay inside viewport.
- TaskMetaBar must be reused in Task Card and Task Panel.
- Task Panel is the main working space for a task.

## Current active Feature

Current active Feature:

`Task Panel v2`

The first implementation exists, but still needs polishing.

## Current uncommitted code state

There are uncommitted frontend changes related to Task Panel v2:

- `frontend/src/components/TaskCard.jsx`
- `frontend/src/components/TaskDetailsDrawer.jsx`
- `frontend/src/components/TaskMetaBar.jsx`
- `frontend/src/pages/KanbanPage.jsx`
- `frontend/src/styles.css`

These changes should not be considered final until Task Panel v2 is visually accepted.

## Current known Task Panel issues

Known issues to finish:

- TaskMetaBar panel variant must be redesigned into two rows.
- TaskMetaBar card variant must not break Task Card layout.
- Top action bar must show only:
  - close
  - `Выполнено`
  - `Доработать`
  - `⋯`
- `Закрыть` and `Удалить` must be moved into `⋯`.
- Description must show `Описание отсутствует` when empty.
- Description must have edit icon if editing is available.
- Participants footer must be fixed at the bottom.
- Chat input must be fixed above participants footer.
- File and mention buttons must be inside the input row.
- Subtask rows must be lightweight, without card backgrounds.
- Subtask delete action must be inside `⋯`.
- Chat and Events date/time must be close to author name/event text.

## Stable Components

The following UI components are considered stable and should not be redesigned without an architecture decision:

- Tooltip
- TaskMetaBar

## Stable Components

The following UI components are considered stable and are part of the upcoming UI Freeze v1.0:

- Tooltip
- TaskMetaBar v2
- Task Panel Header v2
