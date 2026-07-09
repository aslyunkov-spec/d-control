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
