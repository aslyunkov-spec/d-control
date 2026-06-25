# D-Control Architecture Principles

## Philosophy

D-Control is designed to accelerate daily work, not to maximize the number of features.

Every new function must justify its existence by making users faster and more efficient.

If a feature increases complexity without providing clear daily value, it should not be implemented.

---

# Core Principles

## 1. Simplicity over universality

Always prefer the simpler workflow.

One obvious way is better than several configurable ones.

---

## 2. One screen — one purpose

Each screen has a single responsibility.

Examples:

* Kanban — overview and navigation.
* Task panel — work with a task.
* Subtask — execution.

---

## 3. Avoid duplicated information

The same information should exist only once.

Examples:

* Subtask activity is not duplicated in the parent task Timeline.
* Files belong only to the main task.
* Task comments and Timeline are not duplicated.

---

## 4. User should not think

Every action should be obvious.

Examples:

☐ = not completed

☑ = completed

▼ = expand

← = back

---

## 5. High information density

The interface is optimized for FullHD monitors.

The user should see as many tasks as possible without scrolling.

Compact spacing is preferred.

---

## 6. Minimum clicks

Every common operation should require the minimum number of actions.

---

## 7. Main task vs Subtask

### Main Task

Management object.

Contains:

* title
* description
* priority
* due date
* assignees
* watchers
* files
* comments
* timeline
* subtasks

---

### Subtask

Execution object.

Contains:

* title
* assignees
* completed checkbox
* comments

Does NOT contain in UI:

* priority
* due date
* files
* watchers

---

## 8. One subtask level only

Nested subtasks are forbidden.

Task

→ Subtask

Further nesting is not allowed.

---

## 9. Files

Files belong only to the main task.

Subtasks do not own files.

---

## 10. Comments

Users with permission to write in the main task may also comment in subtasks.

---

## 11. Timeline

Main task Timeline contains only events of the main task.

Subtask actions must not pollute the parent Timeline.

---

## 12. Future changes

Every new feature should first answer one question:

"Does this make everyday work faster?"

If not, the feature should be reconsidered.