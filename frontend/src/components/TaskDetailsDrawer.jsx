function formatDateTime(value) {
  if (!value) {
    return "";
  }

  return new Date(value).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(value) {
  if (!value) {
    return "";
  }

  return new Date(value).toLocaleDateString("ru-RU");
}

function getAssigneeName(assignee) {
  const fullName = `${assignee.first_name || ""} ${assignee.last_name || ""}`.trim();
  return fullName || assignee.username;
}

function getAssigneeMark(assignee) {
  const status = String(assignee.status || "").toLowerCase();
  return ["returned", "unassigned", "removed"].includes(status) ? "X" : "✓";
}

function buildTimeline(task) {
  const comments = (task.comments || []).map((comment) => ({
    id: `comment-${comment.id}`,
    author: comment.author || "Комментарий",
    date: comment.created_at,
    text: comment.text,
  }));

  const files = (task.files || []).map((file) => ({
    id: `file-${file.id}`,
    author: "Файл",
    date: file.uploaded_at,
    text: `Загружен файл: ${file.original_name}`,
  }));

  const history = (task.history || []).map((event) => ({
    id: `history-${event.id}`,
    author: event.event_type,
    date: event.created_at,
    text: event.description,
  }));

  return [...comments, ...files, ...history].sort(
    (left, right) => new Date(right.date || 0) - new Date(left.date || 0)
  );
}

function AssigneesCompact({ assignees = [] }) {
  return (
    <section className="drawer-assignees" aria-label="Исполнители">
      <h3>Исполнители</h3>
      {assignees.length ? (
        <ul className="assignee-list">
          {assignees.map((assignee) => (
            <li key={assignee.id}>
              <span>{getAssigneeMark(assignee)}</span>
              {getAssigneeName(assignee)}
            </li>
          ))}
        </ul>
      ) : (
        <p>Исполнители не назначены</p>
      )}
    </section>
  );
}

export function TaskDetailsDrawer({ task, isLoading, error, onClose }) {
  const timeline = task ? buildTimeline(task) : [];
  const commentsCount = task?.comments?.length || 0;
  const filesCount = task?.files?.length || 0;
  const subtasks = Array.isArray(task?.subtasks) ? task.subtasks : [];
  const subtasksTotal = subtasks.length;

  return (
    <aside className="task-drawer" aria-label="Карточка задачи">
      <div className="task-drawer__topbar">
        <button className="drawer-back" type="button" onClick={onClose}>
          <span aria-hidden="true">‹</span> Закрыть панель
        </button>
      </div>

      <div className="task-actions" aria-label="Действия с задачей">
        <button type="button" disabled>Готово</button>
        <button type="button" disabled>Дораб.</button>
        <button type="button" disabled>Закрыть</button>
        <button type="button" disabled>Архив</button>
        <button type="button" disabled>Удалить</button>
      </div>

      <div className="task-drawer__content">
        {!task && !isLoading && !error && (
          <div className="drawer-placeholder">
            <h2>Выберите задачу</h2>
            <p>Кликните по карточке на доске, чтобы открыть подробности.</p>
          </div>
        )}

        {isLoading && <p className="muted">Загрузка карточки...</p>}
        {error && <p className="error-message">{error}</p>}

        {task && (
          <>
            <header className="task-title-block">
              <div>
                <h2>{task.title}</h2>
                <span className="task-title-block__number">{task.number}</span>
              </div>
              <span className="task-info-icon" aria-hidden="true">ⓘ</span>
            </header>

            <div className="task-summary-line" aria-label="Краткая информация">
              {task.due_date && <span>📅 {formatDate(task.due_date)}</span>}
              <span>{task.priority || "Без приоритета"}</span>
              <span>💬 {commentsCount}</span>
              <span>📎 {filesCount}</span>
              {Array.isArray(task?.subtasks) && <span>Подзадачи {subtasksTotal}</span>}
            </div>

            {task.description && <p className="task-description">{task.description}</p>}

            <section className="subtasks-folded">
              <button type="button" disabled>
                Подзадачи ({subtasksTotal}/{subtasksTotal}) ▶
              </button>
            </section>

            <section className="drawer-timeline-section">
              <h3>Timeline</h3>
              {timeline.length ? (
                <ol className="timeline-list">
                  {timeline.map((item) => (
                    <li key={item.id}>
                      <div className="timeline-meta">
                        <strong>{item.author}</strong>
                        <time>{formatDateTime(item.date)}</time>
                      </div>
                      <p>{item.text}</p>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="drawer-empty">Нет данных</p>
              )}
            </section>
          </>
        )}
      </div>

      <footer className="task-drawer__footer">
        <form className="comment-composer" onSubmit={(event) => event.preventDefault()}>
          <textarea placeholder="Новый комментарий" rows="2" disabled={!task} />
          <div className="comment-composer__actions">
            <div>
              <button type="button" disabled>📎 Файл</button>
              <button type="button" disabled>@ Упомянуть</button>
            </div>
            <button type="submit" disabled>Отправить</button>
          </div>
        </form>
        <AssigneesCompact assignees={task?.assignees || []} />
      </footer>
    </aside>
  );
}
