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
  onToggleMenu,
  onToggleSubtask,
}) {
  const cardRef = useRef(null);
  const subtaskInputRef = useRef(null);
  const [isSubtasksExpanded, setIsSubtasksExpanded] = useState(false);
  const [isSubtaskFormOpen, setIsSubtaskFormOpen] = useState(false);
  const [subtaskTitle, setSubtaskTitle] = useState("");
  const [isCreatingSubtask, setIsCreatingSubtask] = useState(false);
  const [isTogglingSubtaskId, setIsTogglingSubtaskId] = useState(null);
  const [subtaskError, setSubtaskError] = useState("");
  const dueDate = formatDueDate(task.due_date);
  const commentsCount = Number(task.comments_count || 0);
  const filesCount = Number(task.files_count || 0);
  const subtasks = Array.isArray(task.subtasks) ? task.subtasks : [];
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
    if (isSubtaskFormOpen) {
      window.setTimeout(() => subtaskInputRef.current?.focus(), 0);
    }
  }, [isSubtaskFormOpen]);

  function handleMenuClick(event) {
    event.stopPropagation();
    onToggleMenu?.();
  }

  function handleStubMenuAction() {
    onCloseMenu?.();
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
    <article className={`task-card ${isSelected ? "task-card--selected" : ""}`} ref={cardRef}>
      <button className="task-card__body" type="button" onClick={() => onOpen(task)}>
        <span className="task-card__title">{task.title}</span>

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
      </button>

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
          <button type="button" role="menuitem" onClick={handleStubMenuAction}>Переименовать</button>
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
                <button type="button" onClick={(event) => handleOpenSubtask(event, subtask)}>
                  {subtask.title}
                </button>
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