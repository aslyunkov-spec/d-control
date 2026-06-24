function formatDueDate(value) {
  if (!value) {
    return "";
  }

  return new Date(value).toLocaleDateString("ru-RU");
}

export function TaskCard({ task, onOpen }) {
  const dueDate = formatDueDate(task.due_date);

  return (
    <button className="task-card" type="button" onClick={() => onOpen(task)}>
      <span className="task-card__topline">
        <span className="task-number">{task.number}</span>
        {dueDate && (
          <time className="task-due-date" dateTime={task.due_date}>
            {dueDate}
          </time>
        )}
      </span>

      <span className="task-card__title">{task.title}</span>

      <span className="task-card__footer">
        <span className="task-priority">{task.priority || "Без приоритета"}</span>
      </span>
    </button>
  );
}