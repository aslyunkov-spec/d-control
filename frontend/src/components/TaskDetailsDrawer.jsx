import { useEffect, useRef, useState } from "react";
import { AtSign, Check, Ellipsis, FilePlus, GripVertical, Pencil, RotateCcw, Send, X } from "lucide-react";

import { TaskMetaBar } from "./TaskMetaBar";
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

function asArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function getEntityId(entity, fallback) {
  return entity?.id ?? fallback;
}

function buildTimeline(task) {
  const comments = asArray(task?.comments).map((comment, index) => ({
    id: `comment-${comment.id}`,
    type: "comment",
    author: comment.author || "\u041a\u043e\u043c\u043c\u0435\u043d\u0442\u0430\u0440\u0438\u0439",
    actor: comment.author_details || null,
    date: comment.created_at,
    comment,
  }));

  const files = asArray(task?.files).map((file, index) => ({
    id: `file-${file.id}`,
    type: "file",
    author: file.author || file.uploaded_by_username || "\u0424\u0430\u0439\u043b",
    actor: file.uploaded_by_details || null,
    date: file.uploaded_at,
    file,
  }));

  const history = asArray(task?.history).map((event, index) => ({
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

function getUserInitials(user = {}) {
  if (user.initials) {
    return user.initials;
  }

  const names = [user.first_name, user.last_name].filter(Boolean);
  return names.length
    ? names.map((name) => name.slice(0, 1)).join("").toUpperCase()
    : String(user.username || user.email || "?").slice(0, 2).toUpperCase();
}

function getUserTitle(user = {}) {
  const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim();
  return [fullName || user.username, user.email, user.role].filter(Boolean).join("\n");
}

function isLongDescription(description) {
  const value = String(description || "");
  return value.split(/\r?\n/).length > 3 || value.length > 220;
}

function TaskDescriptionBlock({ description }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draftDescription, setDraftDescription] = useState(description || '');
  const hasDescription = Boolean(String(description || '').trim());
  const canCollapse = isLongDescription(description);

  useEffect(() => {
    setIsExpanded(false);
    setIsEditing(false);
    setDraftDescription(description || '');
  }, [description]);

  return (
    <section className='task-panel-description' aria-label={'\u041e\u043f\u0438\u0441\u0430\u043d\u0438\u0435'}>
      <header className='task-panel-description__header'>
        <h3>{'\u041e\u043f\u0438\u0441\u0430\u043d\u0438\u0435'}</h3>
        <Tooltip as='button' label={'\u0420\u0435\u0434\u0430\u043a\u0442\u0438\u0440\u043e\u0432\u0430\u0442\u044c \u043e\u043f\u0438\u0441\u0430\u043d\u0438\u0435'} className='task-panel-description__edit' type='button' aria-label={'\u0420\u0435\u0434\u0430\u043a\u0442\u0438\u0440\u043e\u0432\u0430\u0442\u044c \u043e\u043f\u0438\u0441\u0430\u043d\u0438\u0435'} onClick={() => setIsEditing((current) => !current)}>
          <Pencil aria-hidden='true' size={14} strokeWidth={2} />
        </Tooltip>
      </header>
      {isEditing ? (
        <div className='task-panel-description__editor'>
          <textarea value={draftDescription} rows='4' onChange={(event) => setDraftDescription(event.target.value)} />
          <p>{'\u0421\u043e\u0445\u0440\u0430\u043d\u0435\u043d\u0438\u0435 \u043e\u043f\u0438\u0441\u0430\u043d\u0438\u044f \u0431\u0443\u0434\u0435\u0442 \u043f\u043e\u0434\u043a\u043b\u044e\u0447\u0435\u043d\u043e \u043a \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u044e\u0449\u0435\u043c\u0443 API.'}</p>
        </div>
      ) : hasDescription ? (
        <>
          <p className={!isExpanded && canCollapse ? 'task-panel-description__text task-panel-description__text--clamped' : 'task-panel-description__text'}>{description}</p>
          {canCollapse && <button className='task-panel-description__toggle' type='button' onClick={() => setIsExpanded((current) => !current)}>{isExpanded ? '\u0421\u0432\u0435\u0440\u043d\u0443\u0442\u044c' : '\u041f\u043e\u043a\u0430\u0437\u0430\u0442\u044c \u043f\u043e\u043b\u043d\u043e\u0441\u0442\u044c\u044e'}</button>}
        </>
      ) : (
        <p className='drawer-empty'>{'\u041e\u043f\u0438\u0441\u0430\u043d\u0438\u0435 \u043e\u0442\u0441\u0443\u0442\u0441\u0442\u0432\u0443\u0435\u0442'}</p>
      )}
    </section>
  );
}

function TaskPeopleSection({ title, addLabel, users = [], onChange, isUpdating, error }) {
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
      if (event.key === 'Escape') {
        setIsPickerOpen(false);
      }
    }

    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isPickerOpen]);

  const safeUsers = asArray(users);

  function removeUser(userId) {
    onChange?.(safeUsers.filter((user) => String(user.id) !== String(userId)));
  }

  return (
    <section className='task-people-section' ref={sectionRef}>
      <header className='task-people-section__header'>
        <Tooltip as='button' label={addLabel} className='task-people-section__add' type='button' disabled={isUpdating} aria-label={addLabel} aria-expanded={isPickerOpen} onClick={() => setIsPickerOpen((current) => !current)}>
          +
        </Tooltip>
        <h3>{title}</h3>
      </header>
      <div className='task-people-section__users'>
        {safeUsers.map((user) => (
          <span className='task-person' key={user.id}>
            <Tooltip label={getUserTitle(user)} className='task-person__avatar'>
              {user.avatar ? <img src={user.avatar} alt='' /> : <span>{getUserInitials(user)}</span>}
            </Tooltip>
            <Tooltip as='button' label={'\u0423\u0431\u0440\u0430\u0442\u044c'} className='task-person__remove' type='button' disabled={isUpdating} aria-label={'\u0423\u0431\u0440\u0430\u0442\u044c ' + getAssigneeName(user)} onClick={() => removeUser(user.id)}>
              {'\u00d7'}
            </Tooltip>
          </span>
        ))}
      </div>
      {isPickerOpen && (
        <div className='task-people-section__popover'>
          <UserPicker value={safeUsers} onChange={onChange} disabled={isUpdating} searchOnly autoFocus onSelection={() => setIsPickerOpen(false)} onClose={() => setIsPickerOpen(false)} />
        </div>
      )}
      {error && <p className='comment-error'>{error}</p>}
    </section>
  );
}

function TimelineItem({ item, editingCommentId, editText, isSaving, onEditStart, onEditTextChange, onEditSave, onEditCancel, onFileDelete }) {
  const comment = item.comment || {};
  const file = item.file || {};
  const isEditing = item.type === 'comment' && editingCommentId === comment.id;
  const fileName = file.original_name || file.name || '';
  const fileIcon = item.type === 'file' ? getFileIcon(fileName) : null;
  const actor = item.actor;
  const actorName = actor ? getUserTitle(actor) : item.author || '\u0421\u0438\u0441\u0442\u0435\u043c\u0430';
  const actorInitials = actor ? getUserInitials(actor) : '?';

  return (
    <li className={'timeline-item timeline-item--' + item.type}>
      <span className='timeline-item__avatar' title={actorName}>
        {actor?.avatar ? <img src={actor.avatar} alt='' /> : <span>{actorInitials}</span>}
      </span>
      <div className='timeline-item__body'>
        <div className='timeline-meta'>
          <span className='timeline-meta__main'>
            <strong>{item.author}</strong>
            <time>{formatDateTime(item.date)}</time>
          </span>
          {item.type === 'comment' && comment.can_edit && !isEditing && (
            <Tooltip as='button' label={'\u0420\u0435\u0434\u0430\u043a\u0442\u0438\u0440\u043e\u0432\u0430\u0442\u044c \u0441\u043e\u043e\u0431\u0449\u0435\u043d\u0438\u0435'} className='timeline-icon-button' type='button' aria-label={'\u0420\u0435\u0434\u0430\u043a\u0442\u0438\u0440\u043e\u0432\u0430\u0442\u044c \u0441\u043e\u043e\u0431\u0449\u0435\u043d\u0438\u0435'} onClick={() => onEditStart(comment)}>
              <Pencil aria-hidden='true' size={13} strokeWidth={2} />
            </Tooltip>
          )}
        </div>

        {item.type === 'comment' && isEditing && (
          <div className='comment-edit-form'>
            <textarea autoFocus value={editText} rows='3' disabled={isSaving} onChange={(event) => onEditTextChange(event.target.value)} onKeyDown={(event) => {
              if (event.key === 'Escape') { event.preventDefault(); onEditCancel(); }
              if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) { event.preventDefault(); onEditSave(); }
            }} />
            <div className='comment-edit-actions'>
              <button type='button' disabled={isSaving} onClick={onEditSave}>{'\u0421\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u044c'}</button>
              <button type='button' disabled={isSaving} onClick={onEditCancel}>{'\u041e\u0442\u043c\u0435\u043d\u0430'}</button>
            </div>
          </div>
        )}

        {item.type === 'comment' && !isEditing && <p>{comment.text || ''}</p>}

        {item.type === 'file' && (
          <div className='timeline-file-item'>
            <span className={'timeline-file-icon timeline-file-icon--' + fileIcon.type}>{fileIcon.label}</span>
            <span className='timeline-file-name'>{fileName}</span>
            {file.file_url && <a href={file.file_url} target='_blank' rel='noreferrer'>{'\u041e\u0442\u043a\u0440\u044b\u0442\u044c'}</a>}
            {file.can_delete && <button type='button' onClick={() => onFileDelete(file)}>{'\u0423\u0434\u0430\u043b\u0438\u0442\u044c'}</button>}
          </div>
        )}

        {item.type === 'history' && <p>{item.text}</p>}
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
  const taskActionMenuRef = useRef(null);
  const subtaskMenuRef = useRef(null);
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
  const [activeTab, setActiveTab] = useState("chat");
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [isSubtaskFormOpen, setIsSubtaskFormOpen] = useState(false);
  const [editingSubtaskId, setEditingSubtaskId] = useState(null);
  const [editingSubtaskTitle, setEditingSubtaskTitle] = useState("");
  const [subtaskError, setSubtaskError] = useState("");
  const [assigneeError, setAssigneeError] = useState("");
  const [isAssigneeUpdating, setIsAssigneeUpdating] = useState(false);
  const [watcherError, setWatcherError] = useState("");
  const [isWatcherUpdating, setIsWatcherUpdating] = useState(false);
  const [isTaskActionMenuOpen, setIsTaskActionMenuOpen] = useState(false);
  const [openSubtaskMenuId, setOpenSubtaskMenuId] = useState(null);
  const timeline = task ? buildTimeline(task) : [];
  const chatItems = timeline.filter((item) => item.type === "comment");
  const eventItems = timeline.filter((item) => item.type === "history");
  const files = asArray(task?.files);
  const commentsCount = asArray(task?.comments).length;
  const filesCount = files.length;
  const subtasks = sortSubtasks(asArray(task?.subtasks));
  const subtasksTotal = subtasks.length;
  const subtasksCompleted = subtasks.filter((subtask) => (
    ["completed", "archived"].includes(subtask.status_system_type)
  )).length;

  useEffect(() => {
    setActiveTab("chat");
    setNewSubtaskTitle("");
    setIsSubtaskFormOpen(false);
    setEditingSubtaskId(null);
    setSubtaskError("");
  }, [task?.id]);

  useEffect(() => {
    function closePanelOnEscape(event) {
      if (event.key === "Escape") {
        onClose?.();
      }
    }

    document.addEventListener("keydown", closePanelOnEscape);
    return () => document.removeEventListener("keydown", closePanelOnEscape);
  }, [onClose]);

  useEffect(() => {
    if (!isTaskActionMenuOpen) {
      return undefined;
    }

    function closeOnOutsideClick(event) {
      if (!taskActionMenuRef.current?.contains(event.target)) {
        setIsTaskActionMenuOpen(false);
      }
    }

    function closeOnEscape(event) {
      if (event.key === "Escape") {
        setIsTaskActionMenuOpen(false);
      }
    }

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isTaskActionMenuOpen]);

  useEffect(() => {
    if (openSubtaskMenuId === null) {
      return undefined;
    }

    function closeOnOutsideClick(event) {
      if (!subtaskMenuRef.current?.contains(event.target)) {
        setOpenSubtaskMenuId(null);
      }
    }

    function closeOnEscape(event) {
      if (event.key === "Escape") {
        setOpenSubtaskMenuId(null);
      }
    }

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [openSubtaskMenuId]);


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
      const nextWidth = Math.min(Math.max(startWidth + startX - moveEvent.clientX, 350), 900);
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
    <aside className="task-drawer" aria-label={"\u041f\u0430\u043d\u0435\u043b\u044c \u0437\u0430\u0434\u0430\u0447\u0438"} style={{ width: drawerWidth ? `${drawerWidth}px` : undefined }}>
      <Tooltip
        as="button"
        label={"\u0418\u0437\u043c\u0435\u043d\u0438\u0442\u044c \u0448\u0438\u0440\u0438\u043d\u0443"}
        className="task-drawer__resize-handle"
        type="button"
        aria-label={"\u0418\u0437\u043c\u0435\u043d\u0438\u0442\u044c \u0448\u0438\u0440\u0438\u043d\u0443 \u043f\u0430\u043d\u0435\u043b\u0438"}
        onMouseDown={handleResizeStart}
      >
        <GripVertical aria-hidden="true" size={16} strokeWidth={1.8} />
      </Tooltip>
      <header className="task-drawer__topbar task-panel-header">
        <Tooltip
          as="button"
          label={"\u0417\u0430\u043a\u0440\u044b\u0442\u044c \u043f\u0430\u043d\u0435\u043b\u044c"}
          className="task-drawer__close"
          type="button"
          aria-label={"\u0417\u0430\u043a\u0440\u044b\u0442\u044c \u043f\u0430\u043d\u0435\u043b\u044c"}
          onClick={onClose}
        >
          <X aria-hidden="true" size={18} strokeWidth={2} />
        </Tooltip>

        <div className='task-panel-header__actions' aria-label={'\u0414\u0435\u0439\u0441\u0442\u0432\u0438\u044f \u0441 \u0437\u0430\u0434\u0430\u0447\u0435\u0439'}>
          <button type='button' disabled><Check aria-hidden='true' size={15} strokeWidth={2} /><span>{'\u0412\u044b\u043f\u043e\u043b\u043d\u0435\u043d\u043e'}</span></button>
          <button type='button' disabled><RotateCcw aria-hidden='true' size={15} strokeWidth={2} /><span>{'\u0414\u043e\u0440\u0430\u0431\u043e\u0442\u0430\u0442\u044c'}</span></button>
          <div className='task-panel-header__menu' ref={taskActionMenuRef}>
            <Tooltip as='button' label={'\u0414\u0435\u0439\u0441\u0442\u0432\u0438\u044f'} className='task-panel-header__menu-button' type='button' aria-label={'\u0414\u0435\u0439\u0441\u0442\u0432\u0438\u044f'} aria-expanded={isTaskActionMenuOpen} onClick={() => setIsTaskActionMenuOpen((current) => !current)}>
              <Ellipsis aria-hidden='true' size={17} strokeWidth={2} />
            </Tooltip>
            {isTaskActionMenuOpen && (
              <div className='task-panel-header__dropdown' role='menu'>
                <button type='button' role='menuitem' onClick={() => setIsTaskActionMenuOpen(false)}>{'\u0417\u0430\u043a\u0440\u044b\u0442\u044c'}</button>
                <button type='button' role='menuitem' onClick={() => setIsTaskActionMenuOpen(false)}>{'\u0423\u0434\u0430\u043b\u0438\u0442\u044c'}</button>
              </div>
            )}
          </div>
        </div>
      </header>

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
            <header className="task-title-block task-panel-title-block">
              <h2>{task.title}</h2>
            </header>

            <TaskMetaBar
              task={task}
              variant="panel"
              commentsCount={commentsCount}
              filesCount={filesCount}
              subtasksCompleted={subtasksCompleted}
              subtasksTotal={subtasksTotal}
            />

            <TaskDescriptionBlock description={task.description} />

            <nav className="task-drawer-tabs" aria-label={"\u0420\u0430\u0437\u0434\u0435\u043b\u044b \u0437\u0430\u0434\u0430\u0447\u0438"}>
              <button
                className={activeTab === "chat" ? "task-drawer-tab task-drawer-tab--active" : "task-drawer-tab"}
                type="button"
                onClick={() => setActiveTab("chat")}
              >
                {"\u0427\u0430\u0442"} ({commentsCount})
              </button>
              <button
                className={activeTab === "subtasks" ? "task-drawer-tab task-drawer-tab--active" : "task-drawer-tab"}
                type="button"
                onClick={() => setActiveTab("subtasks")}
              >
                {"\u041f\u043e\u0434\u0437\u0430\u0434\u0430\u0447\u0438"} ({subtasksCompleted}/{subtasksTotal})
              </button>
              <button
                className={activeTab === "files" ? "task-drawer-tab task-drawer-tab--active" : "task-drawer-tab"}
                type="button"
                onClick={() => setActiveTab("files")}
              >
                {"\u0424\u0430\u0439\u043b\u044b"} ({filesCount})
              </button>
              <button
                className={activeTab === "events" ? "task-drawer-tab task-drawer-tab--active" : "task-drawer-tab"}
                type="button"
                onClick={() => setActiveTab("events")}
              >
                {"\u0421\u043e\u0431\u044b\u0442\u0438\u044f"}
              </button>
            </nav>

            {activeTab === "subtasks" && (
              <section className="drawer-subtasks">
                <div className="drawer-subtasks__list">
                  {subtasks.map((subtask, index) => {
                    const isDone = ["completed", "archived"].includes(subtask.status_system_type);
                    const isEditing = editingSubtaskId === subtask.id;
                    return (
                      <div className="drawer-subtask-row" key={getEntityId(subtask, index)}>
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
                        <div className='drawer-subtask-row__menu' ref={openSubtaskMenuId === subtask.id ? subtaskMenuRef : null}>
                          <Tooltip as='button' label={'\u0414\u0435\u0439\u0441\u0442\u0432\u0438\u044f'} className='drawer-subtask-row__more' type='button' aria-label={'\u0414\u0435\u0439\u0441\u0442\u0432\u0438\u044f \u043f\u043e\u0434\u0437\u0430\u0434\u0430\u0447\u0438'} aria-expanded={openSubtaskMenuId === subtask.id} onClick={() => setOpenSubtaskMenuId((current) => current === subtask.id ? null : subtask.id)}>
                            <Ellipsis aria-hidden='true' size={15} strokeWidth={2} />
                          </Tooltip>
                          {openSubtaskMenuId === subtask.id && (
                            <div className='drawer-subtask-row__dropdown' role='menu'>
                              <button type='button' role='menuitem' onClick={() => { setOpenSubtaskMenuId(null); setEditingSubtaskId(subtask.id); setEditingSubtaskTitle(subtask.title || ''); }}>{'\u041f\u0435\u0440\u0435\u0438\u043c\u0435\u043d\u043e\u0432\u0430\u0442\u044c'}</button>
                              <button type='button' role='menuitem' onClick={() => { setOpenSubtaskMenuId(null); handleSubtaskDelete(subtask); }}>{'\u0423\u0434\u0430\u043b\u0438\u0442\u044c'}</button>
                            </div>
                          )}
                        </div>
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

            {activeTab === "chat" && (
              <section className="drawer-chat-section">
                {editCommentError && <p className="comment-error">{editCommentError}</p>}
                {chatItems.length ? (
                  <ol className="timeline-list timeline-list--chat">
                    {chatItems.map((item) => (
                      <TimelineItem
                        key={item.id}
                        item={item}
                        editingCommentId={editingCommentId}
                        editText={editCommentText}
                        isSaving={isCommentSaving}
                        onEditStart={handleEditStart}
                        onEditTextChange={setEditCommentText}
                        onEditSave={handleEditSave}
                        onEditCancel={handleEditCancel}
                        onFileDelete={handleFileDelete}
                      />
                    ))}
                  </ol>
                ) : (
                  <p className="drawer-empty">{"\u0421\u043e\u043e\u0431\u0449\u0435\u043d\u0438\u0439 \u043f\u043e\u043a\u0430 \u043d\u0435\u0442"}</p>
                )}
                <form className='comment-composer comment-composer--timeline' onSubmit={handleCommentSubmit}>
                  <div className='comment-composer__field'>
                    <div className='comment-composer__tools'>
                      <Tooltip as='button' label={isFileUploading ? '\u0417\u0430\u0433\u0440\u0443\u0437\u043a\u0430' : '\u041f\u0440\u0438\u043a\u0440\u0435\u043f\u0438\u0442\u044c \u0444\u0430\u0439\u043b'} className='comment-composer__icon' type='button' disabled={!task || isFileUploading} aria-label={'\u041f\u0440\u0438\u043a\u0440\u0435\u043f\u0438\u0442\u044c \u0444\u0430\u0439\u043b'} onClick={() => fileInputRef.current?.click()}>
                        <FilePlus aria-hidden='true' size={15} strokeWidth={2} />
                      </Tooltip>
                      <input ref={fileInputRef} className='file-input-hidden' type='file' disabled={!task || isFileUploading} onChange={handleFileChange} />
                      <Tooltip as='button' label={'\u0423\u043f\u043e\u043c\u044f\u043d\u0443\u0442\u044c'} className='comment-composer__icon' type='button' disabled aria-label={'\u0423\u043f\u043e\u043c\u044f\u043d\u0443\u0442\u044c'}>
                        <AtSign aria-hidden='true' size={15} strokeWidth={2} />
                      </Tooltip>
                    </div>
                    <textarea placeholder={'\u041d\u043e\u0432\u044b\u0439 \u043a\u043e\u043c\u043c\u0435\u043d\u0442\u0430\u0440\u0438\u0439'} rows='1' value={commentText} disabled={!task || isCommentSubmitting} onChange={(event) => setCommentText(event.target.value)} />
                    <Tooltip as='button' label={isCommentSubmitting ? '\u041e\u0442\u043f\u0440\u0430\u0432\u043a\u0430' : '\u041e\u0442\u043f\u0440\u0430\u0432\u0438\u0442\u044c'} className='comment-composer__send' type='submit' disabled={!task || isCommentSubmitting} aria-label={'\u041e\u0442\u043f\u0440\u0430\u0432\u0438\u0442\u044c'}>
                      <Send aria-hidden='true' size={15} strokeWidth={2} />
                    </Tooltip>
                  </div>
                  {(commentError || fileError) && <p className='comment-error'>{commentError || fileError}</p>}
                </form>
              </section>
            )}

            {activeTab === "files" && (
              <section className="drawer-files-section">
                {files.length ? (
                  <ul className="drawer-files-list">
                    {files.map((file, index) => {
                      const fileName = String(file.original_name || file.name || "");
 const fileIcon = getFileIcon(fileName);
                      return (
                        <li className="drawer-file-row" key={getEntityId(file, index)}>
            <span className={'timeline-file-icon timeline-file-icon--' + fileIcon.type}>{fileIcon.label}</span>
                          <div>
                            <strong>{fileName || "Файл"}</strong>
                            <span>{[file.author || file.uploaded_by_username, formatDateTime(file.uploaded_at)].filter(Boolean).join(" | ")}</span>
                          </div>
                          {file.file_url && <a href={file.file_url} target="_blank" rel="noreferrer">{"\u0421\u043a\u0430\u0447\u0430\u0442\u044c"}</a>}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="drawer-empty">{"\u0424\u0430\u0439\u043b\u043e\u0432 \u043f\u043e\u043a\u0430 \u043d\u0435\u0442"}</p>
                )}
              </section>
            )}

            {activeTab === "events" && (
              <section className="drawer-events-section">
                {eventItems.length ? (
                  <ol className="timeline-list timeline-list--events">
                    {eventItems.map((item) => (
                      <TimelineItem
                        key={item.id}
                        item={item}
                        editingCommentId={editingCommentId}
                        editText={editCommentText}
                        isSaving={false}
                        onEditStart={handleEditStart}
                        onEditTextChange={setEditCommentText}
                        onEditSave={handleEditSave}
                        onEditCancel={handleEditCancel}
                        onFileDelete={handleFileDelete}
                      />
                    ))}
                  </ol>
                ) : (
                  <p className="drawer-empty">{"\u0421\u043e\u0431\u044b\u0442\u0438\u0439 \u043f\u043e\u043a\u0430 \u043d\u0435\u0442"}</p>
                )}
              </section>
            )}
          </>
        )}
      </div>

      <footer className="task-drawer__footer">
        <div className="task-drawer__participants">
          <TaskPeopleSection
            title={"\u0418\u0441\u043f\u043e\u043b\u043d\u0438\u0442\u0435\u043b\u0438"}
            addLabel={"\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c \u0438\u0441\u043f\u043e\u043b\u043d\u0438\u0442\u0435\u043b\u044f"}
            users={task?.assignees || []}
            onChange={handleAssigneesChange}
            isUpdating={isAssigneeUpdating}
            error={assigneeError}
          />
          <TaskPeopleSection
            title={"\u041d\u0430\u0431\u043b\u044e\u0434\u0430\u0442\u0435\u043b\u0438"}
            addLabel={"\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c \u043d\u0430\u0431\u043b\u044e\u0434\u0430\u0442\u0435\u043b\u044f"}
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
