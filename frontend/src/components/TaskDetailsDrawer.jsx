function formatDateTime(value) {
  if (!value) {
    return "";
  }

  return new Date(value).toLocaleString("ru-RU");
}

function DetailRow({ label, value }) {
  return (
    <div className="drawer-detail-row">
      <dt>{label}</dt>
      <dd>{value || "Не указано"}</dd>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="drawer-section">
      <h3>{title}</h3>
      {children}
    </section>
  );
}

function EmptySection() {
  return <p className="drawer-empty">Нет данных</p>;
}

export function TaskDetailsDrawer({ task, isLoading, error, onClose }) {
  return (
    <aside className="task-drawer" aria-label="Карточка задачи">
      <header className="task-drawer__header">
        <div>
          <p className="eyebrow">Задача</p>
          <h2>{task ? `${task.number} ${task.title}` : "Выберите задачу"}</h2>
        </div>
        {task && (
          <button className="drawer-close" type="button" onClick={onClose} aria-label="Закрыть">
            ×
          </button>
        )}
      </header>

      <div className="task-drawer__content">
        {!task && !isLoading && !error && (
          <div className="drawer-placeholder">
            <h3>Выберите задачу</h3>
            <p>Кликните по карточке на доске, чтобы открыть подробности задачи.</p>
          </div>
        )}

        {isLoading && <p className="muted">Загрузка карточки...</p>}
        {error && <p className="error-message">{error}</p>}

        {task && (
          <>
            <Section title="Основная информация">
              <dl className="drawer-details">
                <DetailRow label="Номер" value={task.number} />
                <DetailRow label="Название" value={task.title} />
                <DetailRow label="Описание" value={task.description} />
                <DetailRow label="Статус" value={task.status} />
                <DetailRow label="Приоритет" value={task.priority} />
                <DetailRow label="Срок" value={formatDateTime(task.due_date)} />
              </dl>
            </Section>

            <Section title="Исполнители">
              {task.assignees?.length ? (
                <ul className="drawer-list">
                  {task.assignees.map((assignee) => (
                    <li key={assignee.id}>
                      {assignee.first_name || assignee.last_name
                        ? `${assignee.first_name} ${assignee.last_name}`.trim()
                        : assignee.username}
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptySection />
              )}
            </Section>

            <Section title="Комментарии">
              {task.comments?.length ? (
                <ul className="drawer-list drawer-list--stacked">
                  {task.comments.map((comment) => (
                    <li key={comment.id}>
                      <strong>{comment.author}</strong>
                      <p>{comment.text}</p>
                      <time>{formatDateTime(comment.created_at)}</time>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptySection />
              )}
            </Section>

            <Section title="Файлы">
              {task.files?.length ? (
                <ul className="drawer-list">
                  {task.files.map((file) => (
                    <li key={file.id}>
                      <span>{file.original_name}</span>
                      <time>{formatDateTime(file.uploaded_at)}</time>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptySection />
              )}
            </Section>

            <Section title="История">
              {task.history?.length ? (
                <ul className="drawer-list drawer-list--stacked">
                  {task.history.map((event) => (
                    <li key={event.id}>
                      <strong>{event.event_type}</strong>
                      <p>{event.description}</p>
                      <time>{formatDateTime(event.created_at)}</time>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptySection />
              )}
            </Section>
          </>
        )}
      </div>
    </aside>
  );
}