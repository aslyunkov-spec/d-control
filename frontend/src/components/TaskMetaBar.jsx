import { Calendar, Flame, ListChecks, MessageCircle, Paperclip } from "lucide-react";

import { Tooltip } from "./Tooltip";

const DAY_MS = 24 * 60 * 60 * 1000;

function getDateValue(task) {
  return task?.due_date || task?.deadline || task?.end_date || task?.planned_at || "";
}

function padDatePart(value) {
  return String(value).padStart(2, "0");
}

function formatDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return `${padDatePart(date.getDate())}.${padDatePart(date.getMonth() + 1)}.${date.getFullYear()}`;
}

function formatDateTime(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getDayWord(days) {
  const value = Math.abs(days);
  const lastDigit = value % 10;
  const lastTwoDigits = value % 100;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return "\u0434\u043d\u0435\u0439";
  }

  if (lastDigit === 1) {
    return "\u0434\u0435\u043d\u044c";
  }

  if (lastDigit >= 2 && lastDigit <= 4) {
    return "\u0434\u043d\u044f";
  }

  return "\u0434\u043d\u0435\u0439";
}

function getDueMeta(task) {
  const value = getDateValue(task);
  if (!value) {
    return {
      dateTime: "",
      label: "\u0411\u0435\u0437 \u0441\u0440\u043e\u043a\u0430",
      tooltip: "\u0421\u0440\u043e\u043a \u043d\u0435 \u0443\u043a\u0430\u0437\u0430\u043d",
    };
  }

  const date = new Date(value);
  const formattedDate = formatDate(value);
  if (Number.isNaN(date.getTime()) || !formattedDate) {
    return {
      dateTime: String(value),
      label: String(value),
      tooltip: String(value),
    };
  }

  const today = startOfDay(new Date());
  const dueDay = startOfDay(date);
  const dayDiff = Math.round((dueDay.getTime() - today.getTime()) / DAY_MS);
  let relative = "";

  if (dayDiff === 0) {
    relative = "\u0441\u0435\u0433\u043e\u0434\u043d\u044f";
  } else if (dayDiff > 0) {
    relative = `\u0447\u0435\u0440\u0435\u0437 ${dayDiff} ${getDayWord(dayDiff)}`;
  } else {
    const overdueDays = Math.abs(dayDiff);
    relative = `\u043f\u0440\u043e\u0441\u0440\u043e\u0447\u0435\u043d\u043e ${overdueDays} ${getDayWord(overdueDays)}`;
  }

  return {
    dateTime: value,
    label: `${formattedDate} (${relative})`,
    tooltip: formatDateTime(value) || formattedDate,
  };
}

function getPriorityLabel(task) {
  return task?.priority_display || task?.priority_label || task?.priority || "\u0411\u0435\u0437 \u043f\u0440\u0438\u043e\u0440\u0438\u0442\u0435\u0442\u0430";
}

function isHighPriority(priority) {
  const normalizedPriority = String(priority || "").toLowerCase();
  return normalizedPriority.includes("high") || normalizedPriority.includes("\u0432\u044b\u0441\u043e\u043a");
}

function getCount(task, directValue, listName, countName) {
  if (Number.isFinite(Number(directValue))) {
    return Number(directValue);
  }

  if (Number.isFinite(Number(task?.[countName]))) {
    return Number(task[countName]);
  }

  const list = task?.[listName];
  return Array.isArray(list) ? list.length : 0;
}

function isCompletedSubtask(subtask) {
  return ["completed", "archived"].includes(subtask.status_system_type);
}

function PriorityMeta({ task }) {
  const priorityLabel = getPriorityLabel(task);
  const isHigh = isHighPriority(priorityLabel);
  const className = isHigh
    ? "task-meta-bar__item task-meta-bar__priority task-meta-bar__priority--high"
    : "task-meta-bar__item task-meta-bar__priority";

  return (
    <Tooltip label={"\u041f\u0440\u0438\u043e\u0440\u0438\u0442\u0435\u0442"} className={className}>
      {isHigh && <Flame aria-hidden="true" size={12} strokeWidth={2} />}
      <span>{priorityLabel}</span>
    </Tooltip>
  );
}

function DueMeta({ task }) {
  const dueMeta = getDueMeta(task);

  return (
    <Tooltip label={dueMeta.tooltip} className="task-meta-bar__item task-meta-bar__due">
      <Calendar aria-hidden="true" size={13} strokeWidth={2} />
      {dueMeta.dateTime ? <time dateTime={dueMeta.dateTime}>{dueMeta.label}</time> : <span>{dueMeta.label}</span>}
    </Tooltip>
  );
}

export function TaskMetaBar({
  task,
  className = "",
  variant = "card",
  leading = null,
  commentsCount,
  filesCount,
  subtasksCompleted,
  subtasksTotal,
  isSubtasksExpanded = false,
  onToggleSubtasks,
}) {
  const normalizedCommentsCount = getCount(task, commentsCount, "comments", "comments_count");
  const normalizedFilesCount = getCount(task, filesCount, "files", "files_count");
  const subtasks = Array.isArray(task?.subtasks) ? task.subtasks : [];
  const normalizedSubtasksTotal = Number.isFinite(Number(subtasksTotal))
    ? Number(subtasksTotal)
    : Number(task?.subtasks_total ?? subtasks.length);
  const normalizedSubtasksCompleted = Number.isFinite(Number(subtasksCompleted))
    ? Number(subtasksCompleted)
    : Number(task?.subtasks_completed ?? subtasks.filter(isCompletedSubtask).length);
  const classNames = ["task-meta-bar", `task-meta-bar--${variant}`, className].filter(Boolean).join(" ");
  const subtasksClassName = [
    "task-meta-bar__item",
    "task-meta-bar__subtasks",
    normalizedSubtasksTotal > 0 && normalizedSubtasksCompleted === normalizedSubtasksTotal ? "task-meta-bar__subtasks--done" : "",
  ].filter(Boolean).join(" ");

  if (variant === "panel") {
    return (
      <div className={classNames}>
        <div className="task-meta-bar__panel-row">
          <PriorityMeta task={task} />
          <DueMeta task={task} />
        </div>
      </div>
    );
  }

  return (
    <div className={classNames}>
      <div className="task-meta-bar__card-row task-meta-bar__card-row--top">
        <PriorityMeta task={task} />
        <DueMeta task={task} />
      </div>
      <div className="task-meta-bar__card-row task-meta-bar__card-row--bottom">
        {leading && <div className="task-meta-bar__leading">{leading}</div>}
        <div className="task-meta-bar__counters">
          <Tooltip label={"\u041a\u043e\u043c\u043c\u0435\u043d\u0442\u0430\u0440\u0438\u0438"} className="task-meta-bar__item task-meta-bar__counter">
            <MessageCircle aria-hidden="true" size={13} strokeWidth={2} />
            <span>{normalizedCommentsCount}</span>
          </Tooltip>
          <Tooltip label={"\u0412\u043b\u043e\u0436\u0435\u043d\u0438\u044f"} className="task-meta-bar__item task-meta-bar__counter">
            <Paperclip aria-hidden="true" size={13} strokeWidth={2} />
            <span>{normalizedFilesCount}</span>
          </Tooltip>
          <Tooltip
            as={onToggleSubtasks ? "button" : "span"}
            label={"\u041f\u043e\u0434\u0437\u0430\u0434\u0430\u0447\u0438"}
            className={subtasksClassName}
            type={onToggleSubtasks ? "button" : undefined}
            aria-label={onToggleSubtasks ? "\u041f\u043e\u0434\u0437\u0430\u0434\u0430\u0447\u0438" : undefined}
            aria-expanded={onToggleSubtasks ? isSubtasksExpanded : undefined}
            onClick={onToggleSubtasks}
          >
            <ListChecks aria-hidden="true" size={13} strokeWidth={2} />
            <span>{normalizedSubtasksCompleted}/{normalizedSubtasksTotal}</span>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
