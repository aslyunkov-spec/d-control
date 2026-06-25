import { useState } from "react";

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

export function KanbanColumn({
  column,
  title,
  tasks,
  openTaskMenuId,
  selectedTaskId,
  onCreateTask,
  onCreateSubtask,
  onOpenTask,
  onToggleSubtask,
  onToggleTaskMenu,
}) {
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [isCreateFocused, setIsCreateFocused] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const tasksBySection = SECTION_CONFIG.reduce((sections, section) => {
    sections[section.key] = [];
    return sections;
  }, {});

  tasks.forEach((task) => {
    const sectionKey = getTaskSection(task);
    const targetSection = tasksBySection[sectionKey] ? sectionKey : "active";
    tasksBySection[targetSection].push(task);
  });

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
    <section className="kanban-column" aria-label={title}>
      <header className="kanban-column__header">
        <h2>{title}</h2>
        <span>{tasks.length}</span>
      </header>

      {onCreateTask && (
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
      )}

      <div className="kanban-column__tasks">
        {SECTION_CONFIG.map((section) => (
          <KanbanColumnSection
            key={section.key}
            title={section.title}
            tasks={tasksBySection[section.key]}
            collapsedByDefault={section.collapsedByDefault}
            openTaskMenuId={openTaskMenuId}
            selectedTaskId={selectedTaskId}
            onCreateSubtask={onCreateSubtask}
            onOpenTask={onOpenTask}
            onToggleSubtask={onToggleSubtask}
            onToggleTaskMenu={onToggleTaskMenu}
          />
        ))}
      </div>
    </section>
  );
}