import { useEffect, useRef, useState } from "react";

import { KanbanColumnSection } from "./KanbanColumnSection";

const SECTION_CONFIG = [
  { key: "active", title: "Активные" },
  { key: "deferred", title: "Отложенные" },
  { key: "completed", title: "Выполненные" },
  { key: "archived", title: "Архив", collapsedByDefault: true },
];

function getTaskSection(task) {
  return task.status_system_type || "active";
}

function compareByCreatedAt(left, right) {
  const leftTime = left.created_at ? new Date(left.created_at).getTime() : 0;
  const rightTime = right.created_at ? new Date(right.created_at).getTime() : 0;

  if (leftTime !== rightTime) {
    return leftTime - rightTime;
  }

  return Number(left.id || 0) - Number(right.id || 0);
}

export function KanbanColumn({
  column,
  title,
  tasks,
  canManageColumns = false,
  isCollapsed = false,
  isColumnMenuOpen = false,
  onDeleteColumn,
  onRenameColumn,
  onToggleCollapse,
  onToggleColumnMenu,
  openTaskMenuId,
  selectedTaskId,
  onCreateTask,
  onCreateSubtask,
  onOpenTask,
  onRenameTask,
  onToggleSubtask,
  onToggleTaskMenu,
}) {
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [isCreateFocused, setIsCreateFocused] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const columnMenuRef = useRef(null);
  const columnMenuButtonRef = useRef(null);
  const tasksBySection = SECTION_CONFIG.reduce((sections, section) => {
    sections[section.key] = [];
    return sections;
  }, {});

  tasks.forEach((task) => {
    const sectionKey = getTaskSection(task);
    const targetSection = tasksBySection[sectionKey] ? sectionKey : "active";
    tasksBySection[targetSection].push(task);
  });

  Object.values(tasksBySection).forEach((sectionTasks) => sectionTasks.sort(compareByCreatedAt));

  useEffect(() => {
    if (!isColumnMenuOpen) {
      return undefined;
    }

    function handlePointerDown(event) {
      if (
        !columnMenuRef.current?.contains(event.target)
        && !columnMenuButtonRef.current?.contains(event.target)
      ) {
        onToggleColumnMenu?.(null);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onToggleColumnMenu?.(null);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isColumnMenuOpen, onToggleColumnMenu]);

  async function handleCreateSubmit() {
    const titleValue = newTaskTitle.trim();
    if (!titleValue || !column?.id || isCreating || !onCreateTask) {
      return;
    }

    setIsCreating(true);
    try {
      await onCreateTask(column.id, titleValue);
      setNewTaskTitle("");
      setIsCreateFocused(false);
    } finally {
      setIsCreating(false);
    }
  }

  function handleCreateCancel(event) {
    setNewTaskTitle("");
    setIsCreateFocused(false);
    event.currentTarget.blur();
  }

  function handleCreateKeyDown(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      handleCreateSubmit();
    }

    if (event.key === "Escape") {
      handleCreateCancel(event);
    }
  }

  return (
    <section className={`kanban-column ${isCollapsed ? "kanban-column--collapsed" : ""}`} aria-label={title}>
      <header className="kanban-column__header">
        <span className="kanban-column__header-spacer" aria-hidden="true" />
        <h2>{title}</h2>
        <div className="kanban-column__actions">
          {column && isCollapsed && (
            <button
              className="kanban-column__expand-button"
              type="button"
              aria-label={"\u0420\u0430\u0437\u0432\u0435\u0440\u043d\u0443\u0442\u044c \u043a\u043e\u043b\u043e\u043d\u043a\u0443"}
              onClick={() => onToggleCollapse?.(column.id)}
            >
              {"\u25B6"}
            </button>
          )}
          {column && canManageColumns && !isCollapsed && (
            <button
              ref={columnMenuButtonRef}
              className="kanban-column__menu-button"
              type="button"
              aria-label={"\u041c\u0435\u043d\u044e \u043a\u043e\u043b\u043e\u043d\u043a\u0438"}
              aria-expanded={isColumnMenuOpen}
              onClick={() => onToggleColumnMenu?.(isColumnMenuOpen ? null : column.id)}
            >
              {"\u2261"}
            </button>
          )}
        </div>
        {column && canManageColumns && isColumnMenuOpen && (
          <div className="kanban-column-menu" role="menu" ref={columnMenuRef}>
            <button type="button" role="menuitem" onClick={() => onRenameColumn?.(column)}>
              {"\u041f\u0435\u0440\u0435\u0438\u043c\u0435\u043d\u043e\u0432\u0430\u0442\u044c \u043a\u043e\u043b\u043e\u043d\u043a\u0443"}
            </button>
            <button type="button" role="menuitem" onClick={() => onToggleCollapse?.(column.id)}>
              {isCollapsed
                ? "\u0420\u0430\u0437\u0432\u0435\u0440\u043d\u0443\u0442\u044c \u043a\u043e\u043b\u043e\u043d\u043a\u0443"
                : "\u0421\u0432\u0435\u0440\u043d\u0443\u0442\u044c \u043a\u043e\u043b\u043e\u043d\u043a\u0443"}
            </button>
            <button className="kanban-column-menu__delete" type="button" role="menuitem" onClick={() => onDeleteColumn?.(column, tasks.length)}>
              {"\u0423\u0434\u0430\u043b\u0438\u0442\u044c \u043a\u043e\u043b\u043e\u043d\u043a\u0443"}
            </button>
          </div>
        )}
      </header>

      {!isCollapsed && (
        <>
      <div className="kanban-column__tasks">
        {SECTION_CONFIG.map((section) => (
          <KanbanColumnSection
            key={section.key}
            title={section.title}
            tasks={tasksBySection[section.key]}
            collapsedByDefault={section.collapsedByDefault}
            createTaskControl={
              section.key === "active" && onCreateTask ? (
        <div className={`task-create-row ${isCreateFocused ? "task-create-row--active" : ""}`}>
          {!isCreateFocused && !newTaskTitle ? (
            <button className="task-create-trigger" type="button" onClick={() => setIsCreateFocused(true)}>
              + Новая задача
            </button>
          ) : (
            <input
              autoFocus
              type="text"
              value={newTaskTitle}
              placeholder={isCreating ? "Создание..." : "Введите название задачи"}
              disabled={isCreating}
              onBlur={() => {
                if (!newTaskTitle.trim()) {
                  setIsCreateFocused(false);
                }
              }}
              onChange={(event) => setNewTaskTitle(event.target.value)}
              onKeyDown={handleCreateKeyDown}
            />
          )}
        </div>
              ) : null
            }
            openTaskMenuId={openTaskMenuId}
            selectedTaskId={selectedTaskId}
            onCreateSubtask={onCreateSubtask}
            onOpenTask={onOpenTask}
            onRenameTask={onRenameTask}
            onToggleSubtask={onToggleSubtask}
            onToggleTaskMenu={onToggleTaskMenu}
          />
        ))}
      </div>
        </>
      )}
    </section>
  );
}