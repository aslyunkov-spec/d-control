# Task Panel v2 Specification

Status: Draft (will become Stable after UI Freeze)

---

# 1. Purpose

Task Panel is the primary workspace for working with a task.

Design goals:

- maximum information density without visual overload;
- fast editing;
- consistent layout;
- unified visual language across all sections.

---

# 2. Structure

The panel consists of:

1. Header
2. Task Information Block
3. Tabs
4. Chat
5. Composer
6. Footer

Future sections:

7. Subtasks
8. Files
9. Events

---

# 3. Header

## Layout

Left:

- Close

Center:

- Complete
- Return for revision

Right:

- More (...)

Rules:

- Header resembles macOS Toolbar.
- Icon-only buttons always have tooltips.
- More (...) has no permanent border.
- Hover background only.

---

# 4. Task Information Block

Contains:

- Title
- Description
- TaskMetaBar

Order:

Title

Description

TaskMetaBar

Divider

Tabs

The information block is perceived as one visual unit.

---

# 5. TaskMetaBar

Layout:

Left:

- Priority

Right:

- Deadline

Rules:

- One row only.
- Priority color indicates importance.
- Deadline aligned right.
- No background pills.
- Compact vertical spacing.

---

# 6. Tabs

Order:

- Chat
- Subtasks
- Files
- Events

Rules:

- Counters displayed in blue badges.
- Even spacing between tabs.
- Divider above tabs.
- Active tab indicated with underline.

Unread state:

(implementation planned)

---

# 7. Chat

Layout:

Avatar

Bubble

Message bubble contains:

Header

Author

Date

More (...)

Body

Edited metadata

Rules:

- Avatar outside bubble.
- Bubble width adapts to content.
- Long words wrap correctly.
- Compact spacing between messages.
- Bubble has soft blue background.

Author:

font-weight: 600

Date:

secondary text.

Edited:

bottom-right

edit icon

secondary typography

Editing:

inline

Save

Cancel

Escape cancels editing

---

# 8. Composer

Always fixed above Footer.

Contains:

Attachment

Mention

Autosize textarea

Send button

Rules:

Placeholder:

"Напишите сообщение..."

Autosize:

up to approximately 7 lines

After maximum height:

internal scroll

Send button:

grey when empty

accent color when text exists

---

# 9. Footer

Contains two rows:

Executors

Observers

Row layout:

Label

Avatars

Add button

Rules:

Dynamic avatars.

If all avatars fit:

show all.

If not:

show hidden users as +N.

Add button always visible.

Icon-only button.

Hover background only.

No permanent border.

---

# 10. Visual Principles

Task Information Block

↓

Divider

↓

Workspace

Chat

↓

Composer

↓

Footer

The divider separates information from interaction.

---

# 11. Freeze Status

Header

Approved

Task Information Block

Approved

TaskMetaBar

Approved

Chat

Approved

Composer

Approved

Footer

In Progress

Subtasks

Planned

Files

Planned

Events

Planned

---

# Future Enhancements (Post UI Freeze)

## Checklist Groups (Subtasks v2)

Groups are optional. Small tasks continue using a single flat checklist

Status:

Planned

The current implementation (v1) contains a single flat checklist.

In a future version, subtasks may be organized into named checklist groups.

Example:

▼ Preparation (3/5)

☑ Review contract

☑ Collect documents

☐ Sign

☐ Send

☐ Archive

▼ Approval (1/3)

☑ Legal

☐ Director

☐ Customer

Possible capabilities:

- multiple checklist groups;
- group progress (completed / total);
- collapsible groups;
- drag & drop between groups;
- rename group;
- reorder groups;
- create/delete groups.

Architecture should allow this feature without redesigning the Task Panel.

## Tab context rule

Each Task Panel tab must contain only UI elements related to its own content.

Task-level participants footer is shown only on the Chat tab.

Rules:

- Chat tab shows:
  - messages;
  - Composer;
  - task executors;
  - task watchers.

- Subtasks tab shows:
  - subtasks progress;
  - subtasks list;
  - assignee control for each subtask;
  - subtask actions.

- Files tab shows only files-related UI.

- Events tab shows only task history/events.

Task executors and watchers must not be duplicated in Subtasks, Files or Events tabs.

### Architecture

Checklist Groups are a presentation layer feature.

The system continues storing all subtasks as regular subtasks.

Groups are created by assigning a group name to a subtask.

The UI groups subtasks dynamically by this value.

No separate Checklist or ChecklistGroup entity is required.

Advantages:

- minimal backend changes;
- existing subtasks remain compatible;
- easy migration from Subtasks v1;
- groups are optional;
- tasks without a group continue working as a single checklist.

### Design principle

Checklist groups are optional.

Small tasks continue using a single flat checklist.

Groups are introduced only when they improve readability for larger tasks.

# Subtasks

Status:

Stable Draft

Purpose:

Subtasks provide a lightweight checklist for completing the parent task.

The current implementation (v1) intentionally remains simple and focused.

Layout:

Progress row

Checklist

New subtask action

Progress row:

- completed / total counter (e.g. 1/4);
- horizontal progress bar;
- collapse/expand control (prepared for future functionality).

Checklist rows:

Each row contains:

- completion checkbox;
- subtask title;
- assignee control;
- actions menu.

Rules:

- checklist is visually indented relative to the progress row;
- rows have a subtle hover background;
- no underline on hover;
- completed subtasks use reduced text emphasis;
- assignee control is displayed before the actions menu;
- actions menu contains Rename and Delete.

Progress:

The progress row always reflects completed / total subtasks.

Example:

1/4 ███████────────

New subtask:

Displayed as an action link below the checklist.

Empty state:

0/0 progress

"Подзадач пока нет"

"+ Новая подзадача"

Context:

Subtasks tab is an independent workspace.

Task executors and watchers are not displayed here.

Each subtask manages its own assignee.

## File Preview

All file attachments in D-Control must use a unified built-in File Preview component.

Opening files in a new browser tab should be avoided whenever technically possible.

Preview behavior:

- image files open in an internal preview overlay;
- PDF files should open in an internal viewer when supported;
- unsupported files show a fallback preview card;
- download remains available as an action;
- the same File Preview component must be reused in Chat, Files, comments and future attachment areas.
