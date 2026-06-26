import { useRef, useState } from "react";

import {
  createTaskComment,
  deleteTaskFile,
  updateTaskComment,
  uploadTaskFile,
} from "../api/kanban";

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

function getFileExtension(fileName = "") {
  const parts = fileName.toLowerCase().split(".");
  return parts.length > 1 ? parts.pop() : "";
}

function getFileIcon(fileName) {
  const extension = getFileExtension(fileName);

  if (extension === "pdf") {
    return "PDF";
  }

  if (["png", "jpg", "jpeg"].includes(extension)) {
    return "🖼";
  }

  if (extension === "txt") {
    return "📝";
  }

  if (["doc", "docx"].includes(extension)) {
    return "W";
  }

  if (["xls", "xlsx"].includes(extension)) {
    return "X";
  }

  return "📎";
}

const ASSIGNMENT_STATUS_LABELS = {
  assigned: "assigned",
  in_progress: "in_progress",
  done: "done",
  returned: "returned",
};

function getAssigneeName(assignee) {
  const fullName = `${assignee.first_name || ""} ${assignee.last_name || ""}`.trim();
  return fullName || assignee.username;
}

function getAssignmentStatus(assignee) {
  return String(assignee.assignment_status || assignee.status || "assigned").toLowerCase();
}

function getAssignmentStatusLabel(assignee) {
  const status = getAssignmentStatus(assignee);
  return ASSIGNMENT_STATUS_LABELS[status] || status;
}

function getAssigneeMark(assignee) {
  const status = getAssignmentStatus(assignee);

  if (status === "done") {
    return "✓";
  }

  if (status === "returned") {
    return "X";
  }

  return "•";
}

function buildTimeline(task) {
  const comments = (task.comments || []).map((comment) => ({
    id: `comment-${comment.id}`,
    type: "comment",
    author: comment.author || "Комментарий",
    date: comment.created_at,
    comment,
  }));

  const files = (task.files || []).map((file) => ({
    id: `file-${file.id}`,
    type: "file",
    author: file.author || file.uploaded_by_username || "Файл",
    date: file.uploaded_at,
    file,
  }));

  const history = (task.history || []).map((event) => ({
    id: `history-${event.id}`,
    type: "history",
    author: event.user || event.event_type,
    date: event.created_at,
    text: event.description,
  }));

  return [...comments, ...files, ...history].sort(
    (left, right) => new Date(left.date || 0) - new Date(right.date || 0),
  );
}

function AssigneesCompact({ assignees = [] }) {
  return (
    <section className="drawer-assignees" aria-label="Исполнители">
      <h3>Исполнители</h3>
      {assignees.length ? (
        <ul className="assignee-list">
          {assignees.map((assignee) => (
            <li key={assignee.assignment_id || assignee.id}>
              <span className="assignee-main">
                <span>{getAssigneeMark(assignee)}</span>
                {getAssigneeName(assignee)}
              </span>
              <span className={`assignee-status assignee-status--${getAssignmentStatus(assignee)}`}>
                {getAssignmentStatusLabel(assignee)}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p>Исполнители не назначены</p>
      )}
    </section>
  );
}

function TimelineItem({ item, editingCommentId, editText, isSaving, onEditStart, onEditTextChange, onEditSave, onEditCancel, onFileDelete }) {
  const isEditing = item.type === "comment" && editingCommentId === item.comment.id;

  return (
    <li>
      <div className="timeline-meta">
        <strong>{item.author}</strong>
        <span>
          <time>{formatDateTime(item.date)}</time>
          {item.type === "comment" && item.comment.can_edit && !isEditing && (
            <button className="timeline-icon-button" type="button" onClick={() => onEditStart(item.comment)}>
              Изм.
            </button>
          )}
        </span>
      </div>

      {item.type === "comment" && isEditing && (
        <div className="comment-edit-form">
          <textarea
            autoFocus
            value={editText}
            rows="3"
            disabled={isSaving}
            onChange={(event) => onEditTextChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.preventDefault();
                onEditCancel();
              }

              if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
                event.preventDefault();
                onEditSave();
              }
            }}
          />
          <div className="comment-edit-actions">
            <button type="button" disabled={isSaving} onClick={onEditSave}>Сохранить</button>
            <button type="button" disabled={isSaving} onClick={onEditCancel}>Отмена</button>
          </div>
        </div>
      )}

      {item.type === "comment" && !isEditing && <p>{item.comment.text}</p>}

      {item.type === "file" && (
        <div className="timeline-file-item">
          <span className="timeline-file-icon">{getFileIcon(item.file.original_name)}</span>
          <span className="timeline-file-name">{item.file.original_name}</span>
          {item.file.file_url && (
            <a href={item.file.file_url} target="_blank" rel="noreferrer">Открыть</a>
          )}
          {item.file.can_delete && (
            <button type="button" onClick={() => onFileDelete(item.file)}>Удалить</button>
          )}
        </div>
      )}

      {item.type === "history" && <p>{item.text}</p>}
    </li>
  );
}

export function TaskDetailsDrawer({
  task,
  drawerWidth,
  isLoading,
  error,
  onClose,
  onDrawerWidthChange,
  onCommentCreated,
  onCommentUpdated,
  onFileDeleted,
  onFileUploaded,
}) {
  const fileInputRef = useRef(null);
  const [commentText, setCommentText] = useState("");
  const [commentError, setCommentError] = useState("");
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState("");
  const [editCommentError, setEditCommentError] = useState("");
  const [fileError, setFileError] = useState("");
  const [isCommentSubmitting, setIsCommentSubmitting] = useState(false);
  const [isCommentSaving, setIsCommentSaving] = useState(false);
  const [isFileUploading, setIsFileUploading] = useState(false);
  const [isFileDeletingId, setIsFileDeletingId] = useState(null);
  const timeline = task ? buildTimeline(task) : [];
  const commentsCount = task?.comments?.length || 0;
  const filesCount = task?.files?.length || 0;
  const subtasks = Array.isArray(task?.subtasks) ? task.subtasks : [];
  const subtasksTotal = subtasks.length;

  function handleResizeStart(event) {
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = drawerWidth;

    function handleResizeMove(moveEvent) {
      const nextWidth = Math.min(Math.max(startWidth + startX - moveEvent.clientX, 320), 720);
      onDrawerWidthChange?.(nextWidth);
    }

    function handleResizeEnd() {
      window.removeEventListener("mousemove", handleResizeMove);
      window.removeEventListener("mouseup", handleResizeEnd);
    }

    window.addEventListener("mousemove", handleResizeMove);
    window.addEventListener("mouseup", handleResizeEnd);
  }

  async function handleCommentSubmit(event) {
    event.preventDefault();

    if (!task || isCommentSubmitting) {
      return;
    }

    const text = commentText.trim();
    if (!text) {
      setCommentError("Введите комментарий.");
      return;
    }

    setCommentError("");
    setIsCommentSubmitting(true);

    try {
      const comment = await createTaskComment(task.id, text);
      onCommentCreated?.(comment);
      setCommentText("");
    } catch (submitError) {
      setCommentError("Не удалось отправить комментарий.");
    } finally {
      setIsCommentSubmitting(false);
    }
  }

  function handleEditStart(comment) {
    setEditingCommentId(comment.id);
    setEditCommentText(comment.text);
    setEditCommentError("");
  }

  function handleEditCancel() {
    setEditingCommentId(null);
    setEditCommentText("");
    setEditCommentError("");
  }

  async function handleEditSave() {
    if (!task || !editingCommentId || isCommentSaving) {
      return;
    }

    const text = editCommentText.trim();
    if (!text) {
      setEditCommentError("Комментарий не может быть пустым.");
      return;
    }

    setIsCommentSaving(true);
    setEditCommentError("");

    try {
      const updatedComment = await updateTaskComment(task.id, editingCommentId, text);
      onCommentUpdated?.(updatedComment);
      handleEditCancel();
    } catch (saveError) {
      setEditCommentError("Не удалось сохранить комментарий.");
    } finally {
      setIsCommentSaving(false);
    }
  }

  async function handleFileChange(event) {
    const file = event.target.files?.[0];
    if (!file || !task || isFileUploading) {
      return;
    }

    setFileError("");
    setIsFileUploading(true);

    try {
      const uploadedFile = await uploadTaskFile(task.id, file);
      onFileUploaded?.(uploadedFile);
      event.target.value = "";
    } catch (uploadError) {
      setFileError("Не удалось загрузить файл.");
    } finally {
      setIsFileUploading(false);
    }
  }

  async function handleFileDelete(file) {
    if (!task || isFileDeletingId) {
      return;
    }

    setFileError("");
    setIsFileDeletingId(file.id);

    try {
      await deleteTaskFile(task.id, file.id);
      onFileDeleted?.(file.id);
    } catch (deleteError) {
      setFileError("Не удалось удалить файл.");
    } finally {
      setIsFileDeletingId(null);
    }
  }

  return (
    <aside className="task-drawer" aria-label="Карточка задачи">
      <button
        className="task-drawer__resize-handle"
        type="button"
        aria-label={"\u0418\u0437\u043c\u0435\u043d\u0438\u0442\u044c \u0448\u0438\u0440\u0438\u043d\u0443 \u043f\u0430\u043d\u0435\u043b\u0438"}
        onMouseDown={handleResizeStart}
      />
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
              {editCommentError && <p className="comment-error">{editCommentError}</p>}
              {timeline.length ? (
                <ol className="timeline-list">
                  {timeline.map((item) => (
                    <TimelineItem
                      key={item.id}
                      item={item}
                      editingCommentId={editingCommentId}
                      editText={editCommentText}
                      isSaving={isCommentSaving || isFileDeletingId === item.file?.id}
                      onEditStart={handleEditStart}
                      onEditTextChange={setEditCommentText}
                      onEditSave={handleEditSave}
                      onEditCancel={handleEditCancel}
                      onFileDelete={handleFileDelete}
                    />
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
        <form className="comment-composer" onSubmit={handleCommentSubmit}>
          <textarea
            placeholder="Новый комментарий"
            rows="2"
            value={commentText}
            disabled={!task || isCommentSubmitting}
            onChange={(event) => setCommentText(event.target.value)}
          />
          {(commentError || fileError) && <p className="comment-error">{commentError || fileError}</p>}
          <div className="comment-composer__actions">
            <div>
              <button
                type="button"
                disabled={!task || isFileUploading}
                onClick={() => fileInputRef.current?.click()}
              >
                {isFileUploading ? "Загрузка..." : "📎 Файл"}
              </button>
              <input
                ref={fileInputRef}
                className="file-input-hidden"
                type="file"
                disabled={!task || isFileUploading}
                onChange={handleFileChange}
              />
              <button type="button" disabled>@ Упомянуть</button>
            </div>
            <button type="submit" disabled={!task || isCommentSubmitting}>
              {isCommentSubmitting ? "Отправка..." : "Отправить"}
            </button>
          </div>
        </form>
        <AssigneesCompact assignees={task?.assignees || []} />
      </footer>
    </aside>
  );
}