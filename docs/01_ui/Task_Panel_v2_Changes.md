# Task Panel v2 — Approved Changes

## General

Task Panel is the main working workspace of a task.

It is not:

- modal window;
- form;
- separate page.

---

## Approved UI changes

### Header

- Task number removed.
- Task title is the only heading.
- Visible actions:
  - Выполнено
  - Доработать
  - ⋯
- Actions inside ⋯:
  - Закрыть
  - Удалить

---

### TaskMetaBar

Shared component.

Variants:

- card
- panel

Panel layout:

🔥 Высокий 📅 12.07.2026 (через 4 дня)

💬 4 📎 3 ✓1/4

---

### Due date

Always show the date.

Examples:

12.07.2026 (через 4 дня)

07.07.2026 (сегодня)

05.07.2026 (просрочено 2 дня)

---

### Description

- separate block;
- no border;
- collapsible after three lines;
- empty state:
  "Описание отсутствует";
- editable.

---

### Tabs

Order:

- Чат
- Подзадачи
- Файлы
- События

Default tab:
Chat.

---

### Participants

Fixed footer.

Rows:

- Исполнители
- Наблюдатели

Layout:

- ○ ○ ○

---

### Chat

Description is not duplicated.

Input is fixed above footer.

Buttons are inside input.

---

### Header

Workspace Header shrinks by Task Panel width while panel is open.

## TaskMetaBar v2 (Approved)

TaskMetaBar is a shared UI component.

### Variants

- card
- panel

### Card

Two-row layout.

Row 1:

- Priority (left)
- Due date (right)

Row 2:

- Quick actions "+" (left)
- Comments, Attachments, Subtasks (right)

Rules:

- smaller font than task title;
- "+" keeps current size;
- due date truncates if needed;
- subtasks use only the list icon;
- format: "≡ 1/4";
- all icon-only elements have Tooltip.

### Panel

Single-row layout.

Left:

- Priority.

Right:

- Due date.

Comments, attachments and subtasks are displayed in Task Panel tabs instead of TaskMetaBar.

### Quick Actions

Quick Actions remain a horizontal expanding toolbar.

Rules:

- icon-only;
- Tooltip for every icon;
- floating background;
- rounded corners;
- subtle shadow;
- does not change Task Card height.
