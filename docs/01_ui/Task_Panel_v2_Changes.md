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

## Task Chat Messages v1.0 (Approved)

Chat messages are displayed as calm conversation bubbles.

### Layout

Message layout:

- avatar on the left;
- message bubble on the right;
- bubble is slightly darker than panel background;
- bubble is not white;
- no heavy card shadow;
- compact vertical spacing.

### Message meta

Message meta line:

admin · 25.06.2026, 12:18

Rules:

- author and date/time stay close together;
- date/time does not move to the far right;
- author is slightly stronger;
- date/time is visually calmer.

### Message actions

Message actions use `⋯`.

The message action menu currently contains:

- Редактировать

The same menu may later contain:

- Ответить
- Удалить

### Edit mode

Editing keeps the message bubble layout.

Only message text is replaced with textarea.

Rules:

- textarea uses full bubble width;
- textarea auto-grows;
- buttons are below textarea, aligned right:
  - Отмена
  - Сохранить
- Esc cancels editing;
- Ctrl+Enter saves editing.

### Edited timestamp

Message creation time must never be changed.

Messages are sorted by `created_at` from old to new.

Editing a message must not move it down.

Approved display:

admin · 25.06.2026, 12:18 · изменено

If edit timestamp is available, `изменено` has Tooltip:

Изменено: 08.07.2026, 11:37

Backend should store edit time separately:

- `created_at` — message creation time;
- `edited_at` or equivalent — last edit time.

## Task Chat v1.0 (Approved)

### Messages

Chat messages use conversation-style bubbles.

Rules:

- avatar on the left;
- message bubble on the right;
- author is displayed fully;
- initials are used only inside avatar;
- message actions use `⋯`;
- message bubble keeps approved max-width;
- vertical spacing between messages is compact;
- long words/URLs wrap correctly.

### Message meta

Author and creation date are shown in one line:

admin · 25.06.2026, 12:18

Rules:

- author is stronger;
- date is calmer;
- messages are sorted by creation time.

### Edited indicator

Edited messages show edit information in the bottom-right corner of the bubble.

Format:

✎ 08.07.2026, 12:36

Rules:

- do not show words like `изменено`, `изм.`, `ред.`;
- do not replace creation date with edit date;
- editing does not move message position.

---

## Task Composer v1.0 (Approved)

Composer is fixed above participants footer.

Layout:

📎 @ Напишите сообщение... ➜

Rules:

- file button is inside input;
- mention button is inside input;
- send button is inside input;
- empty send icon is calm gray;
- active send icon uses accent color;
- textarea auto-grows up to 7 lines;
- after 7 lines internal scroll appears;
- Shift+Enter creates a new line if supported;
- Composer does not affect message spacing.

# Task Chat v1.0 (Approved)

The Chat is the primary working area of the Task Panel.

## Layout

The Chat consists of three independent areas:

1. Scrollable message list.
2. Fixed Composer.
3. Fixed Footer.

Only the message list scrolls.

Composer and Footer never move.

---

## Messages

Messages are displayed from oldest to newest.

Layout:

Avatar | Bubble

Rules:

- avatar on the left;
- initials inside avatar;
- author shown in full;
- creation date shown next to author;
- author is visually stronger than date;
- bubble has fixed maximum width;
- long words wrap correctly;
- bubble spacing is compact.

---

## Message Actions

Actions are displayed using:

⋯

The menu contains editing/deleting actions according to permissions.

No inline action buttons.

---

## Edited Messages

If a message was edited:

- original creation date remains unchanged;
- message position never changes;
- edit information is shown inside the bottom-right corner of the bubble;
- compact icon is used instead of the text "Edited".

---

## Composer

Composer is permanently fixed above Footer.

Layout:

[file]
[@]
Message input
[Send]

Rules:

- textarea grows automatically;
- maximum auto height — 7 lines;
- after that internal scroll appears;
- buttons live inside Composer;
- Send icon becomes active only when message contains text.

---

## Empty State

If there are no messages:

- empty state is shown inside the message area;
- Composer remains fixed above Footer;
- Footer position never changes.

---

## Visual Rules

Approved:

- compact spacing;
- compact bubbles;
- calm blue background;
- single divider above Composer;
- single divider above Footer;
- balanced spacing around Composer.

### Chat (Final UI)

Approved.

Message layout:

- Avatar is displayed outside the message bubble.
- Bubble has a light blue background.
- Message width adapts to content.
- Long words wrap correctly.
- Maximum bubble width is limited.
- Vertical spacing between messages is compact.
- Author is bold (600).
- Message date is secondary text.
- Message menu (...) is aligned to the top-right with sufficient spacing from the timestamp.

Edited messages:

- Editing never changes message order.
- Original creation date remains unchanged.
- Edited timestamp is shown in the bottom-right corner.
- Edited timestamp uses an edit icon instead of text.
- Edited timestamp uses secondary typography matching other metadata.

Message editing:

- Inline editing.
- Autosized textarea.
- Save / Cancel actions.
- Escape cancels editing.

### Composer (Final UI)

Approved.

- Fixed to the bottom of chat area.
- Always visible.
- Placeholder:
  "Напишите сообщение..."
- Attachment and mention buttons are inside the input.
- Send icon:
  - inactive when empty;
  - accent color when message contains text.
- Textarea grows automatically up to approximately 7 lines.
- After maximum height, internal scrolling is enabled.
- Composer spacing is visually balanced relative to chat and footer.

### Subtasks v1 polish

Completed:

- progress row;
- progress bar;
- completed/total indicator;
- checklist indentation;
- contextual footer removal;
- assignee placeholder;
- actions menu;
- hover behavior;
- compact spacing;
- collapse control placeholder.

Result:

Subtasks now function as an independent checklist workspace.
