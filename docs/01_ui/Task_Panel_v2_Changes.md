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
