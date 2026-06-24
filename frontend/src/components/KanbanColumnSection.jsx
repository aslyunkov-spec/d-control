import { useState } from "react";

import { TaskCard } from "./TaskCard";

export function KanbanColumnSection({ title, tasks, collapsedByDefault = false, onOpenTask }) {
  const [isCollapsed, setIsCollapsed] = useState(collapsedByDefault);

  return (
    <section className="kanban-section" aria-label={title}>
      <button
        className="kanban-section__header"
        type="button"
        aria-expanded={!isCollapsed}
        onClick={() => setIsCollapsed((current) => !current)}
      >
        <span>{title}</span>
        <span className="kanban-section__meta">
          {tasks.length}
          <span aria-hidden="true">{isCollapsed ? "▸" : "▾"}</span>
        </span>
      </button>

      {!isCollapsed && (
        <div className="kanban-section__tasks">
          {tasks.length > 0 ? (
            tasks.map((task) => <TaskCard key={task.id} task={task} onOpen={onOpenTask} />)
          ) : (
            <p className="column-empty">Нет задач</p>
          )}
        </div>
      )}
    </section>
  );
}