import { useState } from "react";

import { TaskCard } from "./TaskCard";

export function KanbanColumnSection({
  title,
  tasks,
  collapsedByDefault = false,
  openTaskMenuId,
  selectedTaskId,
  onCreateSubtask,
  onOpenTask,
  onToggleSubtask,
  onToggleTaskMenu,
}) {
  const [isCollapsed, setIsCollapsed] = useState(collapsedByDefault);

  return (
    <section className="kanban-section" aria-label={title}>
      <button
        className="kanban-section__header"
        type="button"
        aria-expanded={!isCollapsed}
        onClick={() => setIsCollapsed((current) => !current)}
      >
        <span>
          {title} ({tasks.length})
        </span>
        <span className="kanban-section__meta" aria-hidden="true">
          {isCollapsed ? "▸" : "▾"}
        </span>
      </button>

      {!isCollapsed && tasks.length > 0 && (
        <div className="kanban-section__tasks">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              isMenuOpen={openTaskMenuId === task.id}
              isSelected={selectedTaskId === task.id}
              onCloseMenu={() => onToggleTaskMenu?.(null)}
              onCreateSubtask={onCreateSubtask}
              onOpen={onOpenTask}
              onToggleMenu={() => onToggleTaskMenu?.(openTaskMenuId === task.id ? null : task.id)}
              onToggleSubtask={onToggleSubtask}
            />
          ))}
        </div>
      )}
    </section>
  );
}