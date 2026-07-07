import { useEffect, useRef, useState } from "react";

import { UserPicker } from "./UserPicker";
import { Tooltip } from "./Tooltip";

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
    return { label: "PDF", type: "pdf" };
  }

  if (["doc", "docx", "odt"].includes(extension)) {
    return { label: "W", type: "word" };
  }

  if (["xls", "xlsx", "ods", "csv"].includes(extension)) {
    return { label: "X", type: "excel" };
  }

  if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(extension)) {
    return { label: "IMG", type: "image" };
  }

  if (["zip", "rar", "7z", "tar", "gz"].includes(extension)) {
    return { label: "ZIP", type: "archive" };
  }

  return { label: "FILE", type: "file" };
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
    author: comment.author || "\u041a\u043e\u043c\u043c\u0435\u043d\u0442\u0430\u0440\u0438\u0439",
    actor: comment.author_details || null,
    date: comment.created_at,
    comment,
  }));

  const files = (task.files || []).map((file) => ({
    id: `file-${file.id}`,
    type: "file",
    author: file.author || file.uploaded_by_username || "\u0424\u0430\u0439\u043b",
    actor: file.uploaded_by_details || null,
    date: file.uploaded_at,
    file,
  }));

  const history = (task.history || []).map((event) => ({
    id: `history-${event.id}`,
    type: "history",
    author: event.user || event.event_type,
    actor: event.user_details || null,
    date: event.created_at,
    text: event.description,
  }));

  return [...comments, ...files, ...history].sort(
    (left, right) => new Date(left.date || 0) - new Date(right.date || 0),
  );
}

function sortSubtasks(subtasks) {
  return [...subtasks].sort((left, right) => {
    const leftCreatedAt = Date.parse(left.created_at || "");
    const rightCreatedAt = Date.parse(right.created_at || "");

    if (Number.isFinite(leftCreatedAt) && Number.isFinite(rightCreatedAt) && leftCreatedAt !== rightCreatedAt) {
      return leftCreatedAt - rightCreatedAt;
    }

    return Number(left.id || 0) - Number(right.id || 0);
  });
}

function getUserInitials(user) {
  if (user.initials) {
    return user.initials;
  }

  const names = [user.first_name, user.last_name].filter(Boolean);
  return names.length
    ? names.map((name) => name.slice(0, 1)).join("").toUpperCase()
    : String(user.username || user.email || "?").slice(0, 2).toUpperCase();
}

function getUserTitle(user) {
  const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim();
  return [fullName || user.username, user.email, user.role].filter(Boolean).join("\n");
}

function TaskPeopleSection({ title, users, onChange, isUpdating, error }) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    if (!isPickerOpen) {
      return undefined;
    }

    function closeOnOutsideClick(event) {
      if (!sectionRef.current?.contains(event.target)) {
        setIsPickerOpen(false);
      }
    }

    function closeOnEscape(event) {
      if (event.key === "Escape") {
        setIsPickerOpen(false);
      }
    }

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isPickerOpen]);

  function removeUser(userId) {
    onChange?.(users.filter((user) => String(user.id) !== String(userId)));
  }

  return (
    <section className="task-people-section" ref={sectionRef}>
      <header className="task-people-section__header">
        <h3>{title}</h3>
        <Tooltip
          as="button"
          label={"\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c \u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u044f"}
          className="task-people-section__add"
          type="button"
          disabled={isUpdating}
          aria-label={"\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c \u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u044f"}
          aria-expanded={isPickerOpen}
          onClick={() => setIsPickerOpen((current) => !current)}
        >
          +
        </Tooltip>
      </header>
      {users.length > 0 && (
        <div className="task-people-section__users">
          {users.map((user) => (
            <span className="task-person" key={user.id} title={getUserTitle(user)}>
              {user.avatar ? (
                <img src={user.avatar} alt="" />
              ) : (
                <span>{getUserInitials(user)}</span>
              )}
              <Tooltip
                as="button"
                label={"\u0423\u0431\u0440\u0430\u0442\u044c"}
                type="button"
                disabled={isUpdating}
                aria-label={"\u0423\u0431\u0440\u0430\u0442\u044c " + getAssigneeName(user)}
                onClick={() => removeUser(user.id)}
              >
                {"\u00d7"}
              </Tooltip>
            </span>
          ))}
        </div>
      )}
      {isPickerOpen && (
        <div className="task-people-section__popover">
          <UserPicker
            value={users}
            onChange={onChange}
            disabled={isUpdating}
            searchOnly
            autoFocus
            onSelection={() => setIsPickerOpen(false)}
            onClose={() => setIsPickerOpen(false)}
          />
        </div>
      )}
      {error && <p className="comment-error">{error}</p>}
    </section>
  );
}

function TimelineItem({ item, editingCommentId, editText, isSaving, onEditStart, onEditTextChange, onEditSave, onEditCancel, onFileDelete }) {
  const isEditing = item.type === "comment" && editingCommentId === item.comment.id;
  const fileIcon = item.type === "file" ? getFileIcon(item.file.original_name) : null;
  const actor = item.actor;
  const actorName = actor ? getUserTitle(actor) : item.author || "\u0421\u0438\u0441\u0442\u0435\u043c\u0430";
  const actorInitials = actor ? getUserInitials(actor) : "?";

  return (
    <li className={`timeline-item timeline-item--${item.type}`}>
      <span className="timeline-item__avatar" title={actorName}>
        {actor?.avatar ? <img src={actor.avatar} alt="" /> : <span>{actorInitials}</span>}
      </span>
      <div className="timeline-item__body">
        <div className="timeline-meta">
          <strong>{item.author}</strong>
          <span>
            <time>{formatDateTime(item.date)}</time>
            {item.type === "comment" && item.comment.can_edit && !isEditing && (
              <button className="timeline-icon-button" type="button" onClick={() => onEditStart(item.comment)}>
                {"\u0418\u0437\u043c."}
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
              <button type="button" disabled={isSaving} onClick={onEditSave}>{"\u0421\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u044c"}</button>
              <button type="button" disabled={isSaving} onClick={onEditCancel}>{"\u041e\u0442\u043c\u0435\u043d\u0430"}</button>
            </div>
          </div>
        )}

        {item.type === "comment" && !isEditing && <p>{item.comment.text}</p>}

        {item.type === "file" && (
          <div className="timeline-file-item">
            <span className={`timeline-file-icon timeline-file-icon--${fileIcon.type}`}>{fileIcon.label}</span>
            <span className="timeline-file-name">{item.file.original_name}</span>
            {item.file.file_url && (
              <a href={item.file.file_url} target="_blank" rel="noreferrer">{"\u041e\u0442\u043a\u0440\u044b\u0442\u044c"}</a>
            )}
            {item.file.can_delete && (
              <button type="button" onClick={() => onFileDelete(item.file)}>{"\u0423\u0434\u0430\u043b\u0438\u0442\u044c"}</button>
            )}
          </div>
        )}

        {item.type === "history" && <p>{item.text}</p>}
      </div>
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
  onAssigneesChange,
  onWatchersChange,
  onCreateSubtask,
  onDeleteSubtask,
  onRenameTask,
  onToggleSubtask,
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
  const [activeTab, setActiveTab] = useState("timeline");
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [isSubtaskFormOpen, setIsSubtaskFormOpen] = useState(false);
  const [editingSubtaskId, setEditingSubtaskId] = useState(null);
  const [editingSubtaskTitle, setEditingSubtaskTitle] = useState("");
  const [subtaskError, setSubtaskError] = useState("");
  const [assigneeError, setAssigneeError] = useState("");
  const [isAssigneeUpdating, setIsAssigneeUpdating] = useState(false);
  const [watcherError, setWatcherError] = useState("");
  const [isWatcherUpdating, setIsWatcherUpdating] = useState(false);
  const timeline = task ? buildTimeline(task) : [];
  const commentsCount = task?.comments?.length || 0;
  const filesCount = task?.files?.length || 0;
  const subtasks = sortSubtasks(Array.isArray(task?.subtasks) ? task.subtasks : []);
  const subtasksTotal = subtasks.length;
  const subtasksCompleted = subtasks.filter((subtask) => (
    ["completed", "archived"].includes(subtask.status_system_type)
  )).length;

  useEffect(() => {
    setActiveTab("timeline");
    setNewSubtaskTitle("");
    setIsSubtaskFormOpen(false);
    setEditingSubtaskId(null);
    setSubtaskError("");
  }, [task?.id]);


  async function handleAssigneesChange(nextAssignees) {
    if (!task || isAssigneeUpdating) {
      return;
    }

    setAssigneeError("");
    setIsAssigneeUpdating(true);
    try {
      await onAssigneesChange?.(task.id, nextAssignees);
    } catch {
      setAssigneeError("\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u043e\u0431\u043d\u043e\u0432\u0438\u0442\u044c \u0438\u0441\u043f\u043e\u043b\u043d\u0438\u0442\u0435\u043b\u0435\u0439.");
    } finally {
      setIsAssigneeUpdating(false);
    }
  }

  async function handleWatchersChange(nextWatchers) {
    if (!task || isWatcherUpdating) {
      return;
    }

    setWatcherError("");
    setIsWatcherUpdating(true);
    try {
      await onWatchersChange?.(task.id, nextWatchers);
    } catch {
      setWatcherError("\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u043e\u0431\u043d\u043e\u0432\u0438\u0442\u044c \u043d\u0430\u0431\u043b\u044e\u0434\u0430\u0442\u0435\u043b\u0435\u0439.");
    } finally {
      setIsWatcherUpdating(false);
    }
  }

  async function handleSubtaskCreate(event) {
    event.preventDefault();
    const title = newSubtaskTitle.trim();
    if (!task || !title) {
      return;
    }

    setSubtaskError("");
    try {
      await onCreateSubtask?.(task, title);
      setNewSubtaskTitle("");
      setIsSubtaskFormOpen(false);
    } catch {
      setSubtaskError("\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0441\u043e\u0437\u0434\u0430\u0442\u044c \u043f\u043e\u0434\u0437\u0430\u0434\u0430\u0447\u0443.");
    }
  }

  async function handleSubtaskToggle(subtask) {
    if (!task) {
      return;
    }
    setSubtaskError("");
    try {
      await onToggleSubtask?.(task, subtask);
    } catch {
      setSubtaskError("\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0438\u0437\u043c\u0435\u043d\u0438\u0442\u044c \u043f\u043e\u0434\u0437\u0430\u0434\u0430\u0447\u0443.");
    }
  }

  async function handleSubtaskRename(subtask) {
    const title = editingSubtaskTitle.trim();
    if (!title) {
      return;
    }
    setSubtaskError("");
    try {
      await onRenameTask?.(subtask, title);
      setEditingSubtaskId(null);
    } catch {
      setSubtaskError("\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u043f\u0435\u0440\u0435\u0438\u043c\u0435\u043d\u043e\u0432\u0430\u0442\u044c \u043f\u043e\u0434\u0437\u0430\u0434\u0430\u0447\u0443.");
    }
  }

  async function handleSubtaskDelete(subtask) {
    if (!task || !window.confirm("\u0423\u0434\u0430\u043b\u0438\u0442\u044c \u043f\u043e\u0434\u0437\u0430\u0434\u0430\u0447\u0443?")) {
      return;
    }
    setSubtaskError("");
    try {
      await onDeleteSubtask?.(task, subtask);
    } catch {
      setSubtaskError("\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0443\u0434\u0430\u043b\u0438\u0442\u044c \u043f\u043e\u0434\u0437\u0430\u0434\u0430\u0447\u0443.");
    }
  }

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
      <Tooltip
        as="button"
        label={"\u0418\u0437\u043c\u0435\u043d\u0438\u0442\u044c \u0448\u0438\u0440\u0438\u043d\u0443"}
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

      <div className="task-actions" aria-label={"\u0414\u0435\u0439\u0441\u0442\u0432\u0438\u044f \u0441 \u0437\u0430\u0434\u0430\u0447\u0435\u0439"}>
        <button type="button" disabled><span className="task-actions__icon">{"\u2713"}</span><span>{"\u0413\u043e\u0442\u043e\u0432\u043e"}</span></button>
        <button type="button" disabled><span className="task-actions__icon">{"\u21ba"}</span><span>{"\u0414\u043e\u0440\u0430\u0431."}</span></button>
        <button type="button" disabled><span className="task-actions__icon">{"\u2713\u2713"}</span><span>{"\u0417\u0430\u043a\u0440\u044b\u0442\u044c"}</span></button>
        <button type="button" disabled><span className="task-actions__icon">{"\u25a3"}</span><span>{"\u0410\u0440\u0445\u0438\u0432"}</span></button>
        <button type="button" disabled><span className="task-actions__icon">{"\u00d7"}</span><span>{"\u0423\u0434\u0430\u043b\u0438\u0442\u044c"}</span></button>
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
              </div>
              <span className="task-info-icon" aria-hidden="true">ⓘ</span>
            </header>

            <div className="task-summary-line" aria-label={"\u041a\u0440\u0430\u0442\u043a\u0430\u044f \u0438\u043d\u0444\u043e\u0440\u043c\u0430\u0446\u0438\u044f"}>
              <span className="task-status-badge">{task.status || "\u0411\u0435\u0437 \u0441\u0442\u0430\u0442\u0443\u0441\u0430"}</span>
              <span>{"\uD83D\uDCAC"} {commentsCount}</span>
              <span>{"\uD83D\uDCCE"} {filesCount}</span>
            </div>

            {task.description && <p className="task-description">{task.description}</p>}

            <nav className="task-drawer-tabs" aria-label={"\u0420\u0430\u0437\u0434\u0435\u043b\u044b \u0437\u0430\u0434\u0430\u0447\u0438"}>
              <button
                className={activeTab === "timeline" ? "task-drawer-tab task-drawer-tab--active" : "task-drawer-tab"}
                type="button"
                onClick={() => setActiveTab("timeline")}
              >
                {"\u0422\u0430\u0439\u043c\u043b\u0430\u0439\u043d"}
              </button>
              <button
                className={activeTab === "subtasks" ? "task-drawer-tab task-drawer-tab--active" : "task-drawer-tab"}
                type="button"
                onClick={() => setActiveTab("subtasks")}
              >
                {"\u041f\u043e\u0434\u0437\u0430\u0434\u0430\u0447\u0438"} ({subtasksCompleted}/{subtasksTotal})
              </button>
            </nav>

            {activeTab === "subtasks" && (
              <section className="drawer-subtasks">
                <div className="drawer-subtasks__list">
                  {subtasks.map((subtask) => {
                    const isDone = ["completed", "archived"].includes(subtask.status_system_type);
                    const isEditing = editingSubtaskId === subtask.id;
                    return (
                      <div className="drawer-subtask-row" key={subtask.id}>
                        <input
                          type="checkbox"
                          checked={isDone}
                          aria-label={"\u041e\u0442\u043c\u0435\u0442\u0438\u0442\u044c \u043f\u043e\u0434\u0437\u0430\u0434\u0430\u0447\u0443"}
                          onChange={() => handleSubtaskToggle(subtask)}
                        />
                        {isEditing ? (
                          <input
                            autoFocus
                            value={editingSubtaskTitle}
                            onChange={(event) => setEditingSubtaskTitle(event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                event.preventDefault();
                                handleSubtaskRename(subtask);
                              }
                              if (event.key === "Escape") {
                                setEditingSubtaskId(null);
                              }
                            }}
                            onBlur={() => setEditingSubtaskId(null)}
                          />
                        ) : (
                          <button className="drawer-subtask-row__title" type="button" onClick={() => {
                            setEditingSubtaskId(subtask.id);
                            setEditingSubtaskTitle(subtask.title || "");
                          }}>
                            {subtask.title}
                          </button>
                        )}
                        <Tooltip as="button" label={"\u0423\u0434\u0430\u043b\u0438\u0442\u044c \u043f\u043e\u0434\u0437\u0430\u0434\u0430\u0447\u0443"} className="drawer-subtask-row__delete" type="button" aria-label={"\u0423\u0434\u0430\u043b\u0438\u0442\u044c \u043f\u043e\u0434\u0437\u0430\u0434\u0430\u0447\u0443"} onClick={() => handleSubtaskDelete(subtask)}>{"\uD83D\uDDD1"}</Tooltip>
                      </div>
                    );
                  })}
                  {!subtasks.length && <p className="drawer-empty">{"\u041f\u043e\u0434\u0437\u0430\u0434\u0430\u0447 \u043f\u043e\u043a\u0430 \u043d\u0435\u0442"}</p>}
                </div>
                {subtaskError && <p className="comment-error">{subtaskError}</p>}
                {isSubtaskFormOpen ? (
                  <form className="drawer-subtasks__create" onSubmit={handleSubtaskCreate}>
                    <input
                      autoFocus
                      type="text"
                      value={newSubtaskTitle}
                      placeholder={"\u041d\u0430\u0437\u0432\u0430\u043d\u0438\u0435 \u043f\u043e\u0434\u0437\u0430\u0434\u0430\u0447\u0438"}
                      onChange={(event) => setNewSubtaskTitle(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Escape") {
                          event.preventDefault();
                          setNewSubtaskTitle("");
                          setIsSubtaskFormOpen(false);
                        }
                      }}
                    />
                    <Tooltip as="button" label={"\u0421\u043e\u0437\u0434\u0430\u0442\u044c \u043f\u043e\u0434\u0437\u0430\u0434\u0430\u0447\u0443"} type="submit" aria-label={"\u0421\u043e\u0437\u0434\u0430\u0442\u044c \u043f\u043e\u0434\u0437\u0430\u0434\u0430\u0447\u0443"}>+</Tooltip>
                  </form>
                ) : (
                  <button
                    className="drawer-subtasks__add"
                    type="button"
                    onClick={() => setIsSubtaskFormOpen(true)}
                  >
                    {"\u002b \u041d\u043e\u0432\u0430\u044f \u043f\u043e\u0434\u0437\u0430\u0434\u0430\u0447\u0430"}
                  </button>
                )}
              </section>
            )}

            {activeTab === "timeline" && (
              <section className="drawer-timeline-section">
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
                  <p className="drawer-empty">{"\u041d\u0435\u0442 \u0441\u043e\u0431\u044b\u0442\u0438\u0439"}</p>
                )}
                <form className="comment-composer comment-composer--timeline" onSubmit={handleCommentSubmit}>
                  <textarea
                    placeholder={"\u041d\u043e\u0432\u044b\u0439 \u043a\u043e\u043c\u043c\u0435\u043d\u0442\u0430\u0440\u0438\u0439"}
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
                        {isFileUploading ? "\u0417\u0430\u0433\u0440\u0443\u0437\u043a\u0430..." : "\uD83D\uDCCE \u0424\u0430\u0439\u043b"}
                      </button>
                      <input
                        ref={fileInputRef}
                        className="file-input-hidden"
                        type="file"
                        disabled={!task || isFileUploading}
                        onChange={handleFileChange}
                      />
                      <button type="button" disabled>{"@ \u0423\u043f\u043e\u043c\u044f\u043d\u0443\u0442\u044c"}</button>
                    </div>
                    <button type="submit" disabled={!task || isCommentSubmitting}>
                      {isCommentSubmitting ? "\u041e\u0442\u043f\u0440\u0430\u0432\u043a\u0430..." : "\u041e\u0442\u043f\u0440\u0430\u0432\u0438\u0442\u044c"}
                    </button>
                  </div>
                </form>
              </section>
            )}
          </>
        )}
      </div>

      <footer className="task-drawer__footer">
        <div className="task-drawer__participants">
          <TaskPeopleSection
            title={"\u0418\u0441\u043f\u043e\u043b\u043d\u0438\u0442\u0435\u043b\u0438"}
            users={task?.assignees || []}
            onChange={handleAssigneesChange}
            isUpdating={isAssigneeUpdating}
            error={assigneeError}
          />
          <TaskPeopleSection
            title={"\u0413\u043e\u0441\u0442\u0438"}
            users={task?.watchers || []}
            onChange={handleWatchersChange}
            isUpdating={isWatcherUpdating}
            error={watcherError}
          />
        </div>
      </footer>
    </aside>
  );
}