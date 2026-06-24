function formatDueDate(value) {
  if (!value) {
    return "";
  }

  return new Date(value).toLocaleDateString("ru-RU");
}

export function TaskCard({ task }) {
  const dueDate = formatDueDate(task.due_date);

  return (
    <article className="task-card">
      <div className="task-card__topline">
        <span className="task-number">{task.number}</span>
        {dueDate && (
          <time className="task-due-date" dateTime={task.due_date}>
            {dueDate}
          </time>
        )}
      </div>

      <h3>{task.title}</h3>

      <div className="task-card__footer">
        <span className="task-priority">{task.priority || "Без приоритета"}</span>
      </div>
    </article>
  );
}