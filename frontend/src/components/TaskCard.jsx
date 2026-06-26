import { useEffect, useRef, useState } from "react";

function formatDueDate(value) {
  if (!value) {
    return "";
  }

  return new Date(value).toLocaleDateString("ru-RU");
}

function isHighPriority(priority) {
  const normalizedPriority = String(priority || "").toLowerCase();
  return normalizedPriority.includes("high") || normalizedPriority.includes("высок");
}

function isCompletedSubtask(subtask) {
  return ["completed", "archived"].includes(subtask.status_system_type);
}

function compareByCreatedAt(left, right) {
  const leftTime = left.created_at ? new Date(left.created_at).getTime() : 0;
  const rightTime = right.created_at ? new Date(right.created_at).getTime() : 0;

  if (leftTime !== rightTime) {
    return leftTime - rightTime;
  }

  return Number(left.id || 0) - Number(right.id || 0);
}

function getAssigneeInitials(assignee) {
  return assignee.initials || String(assignee.username || "?").slice(0, 2).toUpperCase();
}

export function TaskCard({
  task,
  isMenuOpen = false,
  isSelected = false,
  onCloseMenu,
  onCreateSubtask,
  onOpen,
  onRenameTask,
  onToggleMenu,
  onToggleSubtask,
}) {
  const cardRef = useRef(null);
  const renameInputRef = useRef(null);
  const subtaskInputRef = useRef(null);
  const subtaskRenameInputRef = useRef(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameTitle, setRenameTitle] = useState(task.title || "");
  const [renameError, setRenameError] = useState("");
  const [isSavingRename, setIsSavingRename] = useState(false);
  const [renamingSubtaskId, setRenamingSubtaskId] = useState(null);
  const [subtaskRenameTitle, setSubtaskRenameTitle] = useState("");
  const [isSubtaskRenameSaving, setIsSubtaskRenameSaving] = useState(false);
  const [isSubtasksExpanded, setIsSubtasksExpanded] = useState(false);
  const [isSubtaskFormOpen, setIsSubtaskFormOpen] = useState(false);
  const [subtaskTitle, setSubtaskTitle] = useState("");
  const [isCreatingSubtask, setIsCreatingSubtask] = useState(false);
  const [isTogglingSubtaskId, setIsTogglingSubtaskId] = useState(null);
  const [subtaskError, setSubtaskError] = useState("");
  const dueDate = formatDueDate(task.due_date);
  const commentsCount = Number(task.comments_count || 0);
  const filesCount = Number(task.files_count || 0);
  const subtasks = Array.isArray(task.subtasks) ? [...task.subtasks].sort(compareByCreatedAt) : [];
  const assignees = Array.isArray(task.assignees) ? task.assignees : [];
  const visibleAssignees = assignees.slice(0, 3);
  const hiddenAssigneesCount = Math.max(assignees.length - visibleAssignees.length, 0);
  const subtasksTotal = Number(task.subtasks_total ?? subtasks.length);
  const subtasksCompleted = Number(
    task.subtasks_completed ?? subtasks.filter(isCompletedSubtask).length,
  );
  const hasMeta = task.priority || commentsCount > 0 || filesCount > 0 || dueDate;
  const hasSubtasks = subtasksTotal > 0;
  const shouldShowSubtaskPanel = isSubtasksExpanded || isSubtaskFormOpen;
  const areAllSubtasksCompleted = hasSubtasks && subtasksCompleted === subtasksTotal;
  const priorityClassName = isHighPriority(task.priority)
    ? "task-priority task-priority--high"
    : "task-priority task-priority--muted";

  useEffect(() => {
    setRenameTitle(task.title || "");
  }, [task.title]);

  useEffect(() => {
    if (!isMenuOpen) {
      return undefined;
    }

    function handlePointerDown(event) {
      if (cardRef.current && !cardRef.current.contains(event.target)) {
        onCloseMenu?.();
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onCloseMenu?.();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen, onCloseMenu]);

  useEffect(() => {
    if (isRenaming) {
      window.setTimeout(() => renameInputRef.current?.focus(), 0);
    }
  }, [isRenaming]);

  useEffect(() => {
    if (isSubtaskFormOpen) {
      window.setTimeout(() => subtaskInputRef.current?.focus(), 0);
    }
  }, [isSubtaskFormOpen]);

  useEffect(() => {
    if (renamingSubtaskId) {
      window.setTimeout(() => subtaskRenameInputRef.current?.focus(), 0);
    }
  }, [renamingSubtaskId]);

  function handleMenuClick(event) {
    event.stopPropagation();
    onToggleMenu?.();
  }

  function handleStubMenuAction() {
    onCloseMenu?.();
  }

  function handleRenameMenuAction() {
    onCloseMenu?.();
    setRenameTitle(task.title || "");
    setRenameError("");
    setIsRenaming(true);
  }

  function cancelRename() {
    setRenameTitle(task.title || "");
    setRenameError("");
    setIsRenaming(false);
  }

  async function saveRename() {
    const titleValue = renameTitle.trim();
    if (!titleValue) {
      setRenameError("Название не может быть пустым.");
      return;
    }

    if (!onRenameTask || isSavingRename) {
      return;
    }

    setIsSavingRename(true);
    setRenameError("");

    try {
      await onRenameTask(task, titleValue);
      setIsRenaming(false);
    } catch (error) {
      setRenameError("Не удалось переименовать задачу.");
    } finally {
      setIsSavingRename(false);
    }
  }

  function handleRenameKeyDown(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      saveRename();
    }

    if (event.key === "Escape") {
      event.preventDefault();
      cancelRename();
    }
  }

  function handleAddSubtask() {
    onCloseMenu?.();
    setIsSubtasksExpanded(true);
    setSubtaskError("");
    setIsSubtaskFormOpen(true);
  }

  function handleSubtaskCancel(event) {
    setSubtaskTitle("");
    setSubtaskError("");
    setIsSubtaskFormOpen(false);
    event.currentTarget.blur();
  }

  async function handleSubtaskSubmit() {
    const titleValue = subtaskTitle.trim();
    if (!titleValue || isCreatingSubtask || !onCreateSubtask) {
      return;
    }

    setIsCreatingSubtask(true);
    setSubtaskError("");

    try {
      await onCreateSubtask(task, titleValue);
      setSubtaskTitle("");
      setIsSubtasksExpanded(true);
      setIsSubtaskFormOpen(false);
    } catch (createError) {
      setSubtaskError("Не удалось создать подзадачу.");
    } finally {
      setIsCreatingSubtask(false);
    }
  }

  function startSubtaskRename(event, subtask) {
    event.stopPropagation();
    setRenamingSubtaskId(subtask.id);
    setSubtaskRenameTitle(subtask.title || "");
    setSubtaskError("");
  }

  function cancelSubtaskRename() {
    setRenamingSubtaskId(null);
    setSubtaskRenameTitle("");
    setSubtaskError("");
  }

  async function saveSubtaskRename(subtask) {
    const titleValue = subtaskRenameTitle.trim();
    if (!titleValue) {
      setSubtaskError("Название не может быть пустым.");
      return;
    }

    if (!onRenameTask || isSubtaskRenameSaving) {
      return;
    }

    setIsSubtaskRenameSaving(true);
    setSubtaskError("");

    try {
      await onRenameTask(subtask, titleValue);
      cancelSubtaskRename();
    } catch (error) {
      setSubtaskError("Не удалось переименовать подзадачу.");
    } finally {
      setIsSubtaskRenameSaving(false);
    }
  }

  function handleSubtaskRenameKeyDown(event, subtask) {
    if (event.key === "Enter") {
      event.preventDefault();
      saveSubtaskRename(subtask);
    }

    if (event.key === "Escape") {
      event.preventDefault();
      cancelSubtaskRename();
    }
  }

  async function handleToggleSubtask(event, subtask) {
    event.stopPropagation();
    if (!onToggleSubtask || isTogglingSubtaskId) {
      return;
    }

    setIsTogglingSubtaskId(subtask.id);
    setSubtaskError("");

    try {
      await onToggleSubtask(task, subtask);
    } catch (toggleError) {
      setSubtaskError("Не удалось изменить подзадачу.");
    } finally {
      setIsTogglingSubtaskId(null);
    }
  }

  function handleOpenSubtask(event, subtask) {
    event.stopPropagation();
    onOpen?.(subtask);
  }

  function handleSubtaskKeyDown(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSubtaskSubmit();
    }

    if (event.key === "Escape") {
      handleSubtaskCancel(event);
    }
  }

  return (
    <article className={`task-card ${!hasSubtasks ? "task-card--without-subtasks" : ""} ${isSelected ? "task-card--selected" : ""}`} ref={cardRef}>
      <div className="task-card__body" role="button" tabIndex={0} onClick={() => !isRenaming && onOpen(task)}>
        {isRenaming ? (
          <span className="task-rename-inline" onClick={(event) => event.stopPropagation()}>
            <input
              ref={renameInputRef}
              type="text"
              value={renameTitle}
              disabled={isSavingRename}
              onBlur={cancelRename}
              onChange={(event) => setRenameTitle(event.target.value)}
              onKeyDown={handleRenameKeyDown}
            />
            {renameError && <span className="task-rename-error">{renameError}</span>}
          </span>
        ) : (
          <span className="task-card__title">{task.title}</span>
        )}

        {hasMeta && (
          <span className="task-card__compact-line">
            {task.priority && <span className={priorityClassName}>{task.priority}</span>}
            {commentsCount > 0 && <span>💬{commentsCount}</span>}
            {filesCount > 0 && <span>📎{filesCount}</span>}
            {dueDate && <time dateTime={task.due_date}>{dueDate}</time>}
          </span>
        )}

        {assignees.length > 0 && (
          <span className="task-assignees" aria-label="Ответственные">
            {visibleAssignees.map((assignee) => (
              <span className="task-assignee-avatar" key={assignee.id} title={assignee.username}>
                {getAssigneeInitials(assignee)}
              </span>
            ))}
            {hiddenAssigneesCount > 0 && (
              <span className="task-assignee-avatar task-assignee-avatar--more">
                +{hiddenAssigneesCount}
              </span>
            )}
          </span>
        )}
      </div>

      {hasSubtasks && (
        <button
          className={`task-subtasks-toggle ${areAllSubtasksCompleted ? "task-subtasks-toggle--done" : ""}`}
          type="button"
          aria-expanded={isSubtasksExpanded}
          onClick={(event) => {
            event.stopPropagation();
            setIsSubtasksExpanded((current) => !current);
          }}
        >
          ☑ {subtasksCompleted}/{subtasksTotal} {isSubtasksExpanded ? "▲" : "▼"}
        </button>
      )}

      <button
        className="task-card__menu-button"
        type="button"
        aria-label="Меню задачи"
        aria-expanded={isMenuOpen}
        onClick={handleMenuClick}
      >
        ≡
      </button>

      {isMenuOpen && (
        <div className="task-card-menu" role="menu" onClick={(event) => event.stopPropagation()}>
          <button type="button" role="menuitem" onClick={handleRenameMenuAction}>Переименовать</button>
          <button type="button" role="menuitem" onClick={handleAddSubtask}>Добавить подзадачу</button>
          <span className="task-card-menu__divider" aria-hidden="true" />
          <button type="button" role="menuitem" onClick={handleStubMenuAction}>Установить срок</button>
          <button type="button" role="menuitem" onClick={handleStubMenuAction}>Изменить приоритет</button>
          <button type="button" role="menuitem" onClick={handleStubMenuAction}>Назначить исполнителя</button>
          <button type="button" role="menuitem" onClick={handleStubMenuAction}>Добавить наблюдателя</button>
          <span className="task-card-menu__divider" aria-hidden="true" />
          <button type="button" role="menuitem" onClick={handleStubMenuAction}>Вернуть на доработку</button>
          <button type="button" role="menuitem" onClick={handleStubMenuAction}>Архивировать</button>
          <button type="button" role="menuitem" onClick={handleStubMenuAction}>Удалить</button>
        </div>
      )}

      {shouldShowSubtaskPanel && (
        <div className="task-subtasks-list">
          {subtasks.map((subtask) => {
            const isDone = isCompletedSubtask(subtask);
            const isSubtaskRenaming = renamingSubtaskId === subtask.id;
            return (
              <div className="task-subtask-row" key={subtask.id}>
                <input
                  type="checkbox"
                  checked={isDone}
                  disabled={isTogglingSubtaskId === subtask.id}
                  aria-label={`Отметить подзадачу ${subtask.title}`}
                  onChange={(event) => handleToggleSubtask(event, subtask)}
                  onClick={(event) => event.stopPropagation()}
                />
                {isSubtaskRenaming ? (
                  <input
                    ref={subtaskRenameInputRef}
                    className="task-subtask-rename-input"
                    type="text"
                    value={subtaskRenameTitle}
                    disabled={isSubtaskRenameSaving}
                    onBlur={cancelSubtaskRename}
                    onChange={(event) => setSubtaskRenameTitle(event.target.value)}
                    onKeyDown={(event) => handleSubtaskRenameKeyDown(event, subtask)}
                  />
                ) : (
                  <button type="button" onClick={(event) => handleOpenSubtask(event, subtask)}>
                    {subtask.title}
                  </button>
                )}
                {!isSubtaskRenaming && (
                  <button
                    className="task-subtask-edit-button"
                    type="button"
                    aria-label="Переименовать подзадачу"
                    onClick={(event) => startSubtaskRename(event, subtask)}
                  >
                    ✎
                  </button>
                )}
              </div>
            );
          })}

          {isSubtaskFormOpen ? (
            <div className="subtask-create-inline">
              <input
                ref={subtaskInputRef}
                autoFocus
                type="text"
                value={subtaskTitle}
                placeholder={isCreatingSubtask ? "Создание..." : "Название подзадачи"}
                disabled={isCreatingSubtask}
                onBlur={() => {
                  if (!subtaskTitle.trim()) {
                    setIsSubtaskFormOpen(false);
                  }
                }}
                onChange={(event) => setSubtaskTitle(event.target.value)}
                onKeyDown={handleSubtaskKeyDown}
              />
            </div>
          ) : (
            <button
              className="subtask-create-trigger"
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setSubtaskError("");
                setIsSubtaskFormOpen(true);
              }}
            >
              + Новая подзадача
            </button>
          )}

          {subtaskError && <span className="subtask-create-inline__error">{subtaskError}</span>}
        </div>
      )}
    </article>
  );
}