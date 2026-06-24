import { TaskCard } from "./TaskCard";

export function KanbanColumn({ title, tasks, onOpenTask }) {
  return (
    <section className="kanban-column" aria-label={title}>
      <header className="kanban-column__header">
        <h2>{title}</h2>
        <span>{tasks.length}</span>
      </header>

      <div className="kanban-column__tasks">
        {tasks.length > 0 ? (
          tasks.map((task) => <TaskCard key={task.id} task={task} onOpen={onOpenTask} />)
        ) : (
          <p className="column-empty">Нет задач</p>
        )}
      </div>
    </section>
  );
}