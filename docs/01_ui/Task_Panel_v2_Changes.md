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

## Task Panel Header v2 (Approved)

### Header

Структура:

× Выполнено Доработать ⋯

Правила:

- кнопка закрытия располагается слева;
- действия располагаются справа;
- кнопка `⋯` входит в Toolbar действий;
- постоянная рамка у `⋯` отсутствует;
- фон появляется только при hover/focus;
- действия `Закрыть` и `Удалить` находятся внутри меню `⋯`.

---

### Layout

Финальная последовательность верхней части панели:

1. Header
2. Название задачи
3. Описание
4. Разделитель
5. TaskMetaBar
6. Вкладки

После TaskMetaBar разделитель отсутствует.

---

### Description

Если описание отсутствует:

Описание отсутствует ✎

Если описание существует:

Описание: текст описания

где:

- "Описание:" выделено жирным;
- текст продолжается в той же строке;
- справа icon-only кнопка редактирования.

Редактор автоматически закрывается при потере фокуса, если изменений не было.

---

### Tabs

Вкладки:

- Чат
- Подзадачи
- Файлы
- События

Правила:

- без иконок;
- между вкладками увеличенные интервалы;
- счетчики отображаются круглыми badge;
- активная вкладка подчеркивается.

---

### Status

Статус задачи в панели не отображается.

Состояние задачи определяется расположением в Kanban.
