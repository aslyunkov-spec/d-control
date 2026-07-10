import { Bell, Menu, PanelRightOpen, Star } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  createDepartmentColumn,
  createSubtask,
  createTask,
  deleteDepartmentColumn,
  deleteSubtask,
  getDepartmentColumns,
  getDepartments,
  getTaskDetails,
  getTasksByDepartment,
  toggleSubtask,
  updateDepartmentColumn,
  updateTaskAssignments,
  updateTaskTitle,
} from "../api/kanban";
import { AppearanceSettings } from "../components/AppearanceSettings";
import { BoardSidebar } from "../components/BoardSidebar";
import { DepartmentSelector } from "../components/DepartmentSelector";
import { KanbanColumn } from "../components/KanbanColumn";
import { TaskDetailsDrawer } from "../components/TaskDetailsDrawer";
import { Tooltip } from "../components/Tooltip";

function getTaskColumnId(task) {
  if (task.column_id) {
    return String(task.column_id);
  }

  if (task.column && typeof task.column === "object" && task.column.id) {
    return String(task.column.id);
  }

  if (task.column && ["number", "string"].includes(typeof task.column)) {
    return String(task.column);
  }

  return "";
}

function isCompletedSubtask(subtask) {
  return ["completed", "archived"].includes(subtask.status_system_type);
}

function updateParentSubtasks(parentTask, nextSubtasks) {
  const subtasksCompleted = nextSubtasks.filter(isCompletedSubtask).length;

  return {
    ...parentTask,
    subtasks: nextSubtasks,
    subtasks_total: nextSubtasks.length,
    subtasks_completed: subtasksCompleted,
  };
}

function replaceSubtask(subtasks = [], updatedSubtask) {
  return subtasks.map((subtask) =>
    subtask.id === updatedSubtask.id ? { ...subtask, ...updatedSubtask } : subtask,
  );
}

function updateTaskEverywhere(task, updatedTask) {
  if (task.id === updatedTask.id) {
    return {
      ...task,
      ...updatedTask,
      subtasks: task.subtasks || updatedTask.subtasks || [],
    };
  }

  if (!Array.isArray(task.subtasks)) {
    return task;
  }

  return {
    ...task,
    subtasks: task.subtasks.map((subtask) =>
      subtask.id === updatedTask.id ? { ...subtask, ...updatedTask } : subtask,
    ),
  };
}

const APPEARANCE_STORAGE_KEY = "d-control.appearance";
const COLLAPSED_COLUMNS_STORAGE_KEY = "d-control.collapsed-columns";
const DRAWER_WIDTH_STORAGE_KEY = "d-control.drawer-width";
const DRAWER_MIN_WIDTH = 350;
const DRAWER_MAX_WIDTH = 900;
const DRAWER_DEFAULT_WIDTH = 450;
const FONT_FAMILY_STACKS = {
  system: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  inter: '"D-Control Inter", system-ui, sans-serif',
  roboto: '"D-Control Roboto", system-ui, sans-serif',
  "ibm-plex-sans": '"D-Control IBM Plex Sans", system-ui, sans-serif',
  "noto-sans": '"D-Control Noto Sans", system-ui, sans-serif',
  "source-sans-3": '"D-Control Source Sans 3", system-ui, sans-serif',
  manrope: '"D-Control Manrope", system-ui, sans-serif',
  "pt-sans": '"D-Control PT Sans", system-ui, sans-serif',
};
const FONT_SIZE_OPTIONS = ["9", "10", "11", "12", "13", "14"];
const LEGACY_FONT_SIZE_MAP = {
  compact: "10",
  default: "11",
  comfortable: "12",
  large: "12",
};
const DEFAULT_APPEARANCE = {
  background: "default",
  backgroundColor: "#f4f6f8",
  gradientStart: "#dbeafe",
  gradientEnd: "#bfdbfe",
  backgroundImageUrl: "",
  fontFamily: "system",
  fontSize: "11",
  density: "default",
  columnOpacity: "default",
  cardRadius: "strong",
};

function normalizeAppearance(settings) {
  const nextSettings = { ...settings };

  if (!Object.prototype.hasOwnProperty.call(FONT_FAMILY_STACKS, nextSettings.fontFamily)) {
    nextSettings.fontFamily = "system";
  }

  nextSettings.fontSize = LEGACY_FONT_SIZE_MAP[nextSettings.fontSize] || String(nextSettings.fontSize || "11");
  if (!FONT_SIZE_OPTIONS.includes(nextSettings.fontSize)) {
    nextSettings.fontSize = "11";
  }

  if (!["default", "color", "gradient", "image"].includes(nextSettings.background)) {
    nextSettings.background = "default";
  }

  return nextSettings;
}

function getAppearanceStyle(appearance, isDrawerOpen, drawerWidth) {
  const fontSize = Number(appearance.fontSize || 11);
  const safeFontSize = Number.isFinite(fontSize) ? fontSize : 11;

  return {
    "--app-background": getBoardBackground(appearance),
    "--app-font-family": FONT_FAMILY_STACKS[appearance.fontFamily] || FONT_FAMILY_STACKS.system,
    "--app-font-size": `${safeFontSize}pt`,
    "--board-font-size": `${safeFontSize}pt`,
    "--workspace-text-size": `${safeFontSize}pt`,
    "--workspace-title-size": `${safeFontSize + 1}pt`,
    "--workspace-small-size": `${Math.max(8, safeFontSize - 1)}pt`,
    "--task-panel-width": isDrawerOpen ? `${drawerWidth}px` : "0px",
  };
}

// TODO: replace the local development user with the authenticated user profile.
const LOCAL_CURRENT_USER = {
  name: "Администратор",
  role: "Администратор",
};

function getStoredAppearance() {
  try {
    const storedSettings = window.localStorage.getItem(APPEARANCE_STORAGE_KEY);
    if (!storedSettings) {
      return normalizeAppearance(DEFAULT_APPEARANCE);
    }

    return normalizeAppearance({ ...DEFAULT_APPEARANCE, ...JSON.parse(storedSettings) });
  } catch {
    return normalizeAppearance(DEFAULT_APPEARANCE);
  }
}

function getStoredDrawerWidth() {
  try {
    const storedWidth = Number(window.localStorage.getItem(DRAWER_WIDTH_STORAGE_KEY));
    if (Number.isFinite(storedWidth)) {
      return Math.min(Math.max(storedWidth, DRAWER_MIN_WIDTH), DRAWER_MAX_WIDTH);
    }
  } catch {
    return DRAWER_DEFAULT_WIDTH;
  }

  return DRAWER_DEFAULT_WIDTH;
}

function getStoredCollapsedColumnIds() {
  try {
    const storedColumnIds = JSON.parse(window.localStorage.getItem(COLLAPSED_COLUMNS_STORAGE_KEY) || "[]");
    return Array.isArray(storedColumnIds) ? storedColumnIds.map(String) : [];
  } catch {
    return [];
  }
}

function getBoardBackground(settings) {
  if (settings.background === "color") {
    return settings.backgroundColor || DEFAULT_APPEARANCE.backgroundColor;
  }

  if (settings.background === "gradient") {
    return `linear-gradient(135deg, ${settings.gradientStart}, ${settings.gradientEnd})`;
  }

  if (settings.background === "image" && settings.backgroundImageUrl.trim()) {
    const safeUrl = settings.backgroundImageUrl.trim().replace(/["\\]/g, "");
    return `url("${safeUrl}") center / cover fixed no-repeat`;
  }

  return DEFAULT_APPEARANCE.backgroundColor;
}
function isManagementRole(role) {
  return ["Администратор", "Директор"].includes(role);
}

export function KanbanPage() {
  const [departments, setDepartments] = useState([]);
  const [columns, setColumns] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [selectedTask, setSelectedTask] = useState(null);
  const [openTaskMenuId, setOpenTaskMenuId] = useState(null);
  const [openColumnMenuId, setOpenColumnMenuId] = useState(null);
  const [collapsedColumnIds, setCollapsedColumnIds] = useState(getStoredCollapsedColumnIds);
  const [drawerWidth, setDrawerWidth] = useState(getStoredDrawerWidth);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDepartmentsLoading, setIsDepartmentsLoading] = useState(true);
  const [isBoardLoading, setIsBoardLoading] = useState(false);
  const [isTaskLoading, setIsTaskLoading] = useState(false);
  const [error, setError] = useState("");
  const [taskError, setTaskError] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAppearanceOpen, setIsAppearanceOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [appearance, setAppearance] = useState(getStoredAppearance);

  useEffect(() => {
    window.localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify(appearance));
  }, [appearance]);

  useEffect(() => {
    window.localStorage.setItem(COLLAPSED_COLUMNS_STORAGE_KEY, JSON.stringify(collapsedColumnIds));
  }, [collapsedColumnIds]);

  useEffect(() => {
    window.localStorage.setItem(DRAWER_WIDTH_STORAGE_KEY, String(drawerWidth));
  }, [drawerWidth]);

  useEffect(() => {
    let isMounted = true;

    async function loadDepartments() {
      try {
        const data = await getDepartments();
        if (!isMounted) {
          return;
        }

        setDepartments(data);
        if (data.length > 0) {
          setSelectedDepartmentId(String(data[0].id));
        }
      } catch (loadError) {
        if (isMounted) {
          setError("Не удалось загрузить отделы.");
        }
      } finally {
        if (isMounted) {
          setIsDepartmentsLoading(false);
        }
      }
    }

    loadDepartments();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedDepartmentId) {
      setColumns([]);
      setTasks([]);
      return;
    }

    let isMounted = true;

    async function loadBoard() {
      setIsBoardLoading(true);
      setError("");

      try {
        const [columnsData, tasksData] = await Promise.all([
          getDepartmentColumns(selectedDepartmentId),
          getTasksByDepartment(selectedDepartmentId),
        ]);

        if (!isMounted) {
          return;
        }

        setColumns(columnsData);
        setTasks(tasksData);
      } catch (loadError) {
        if (isMounted) {
          setError("Не удалось загрузить доску отдела.");
        }
      } finally {
        if (isMounted) {
          setIsBoardLoading(false);
        }
      }
    }

    loadBoard();

    return () => {
      isMounted = false;
    };
  }, [selectedDepartmentId]);

  const selectedDepartment = useMemo(
    () => departments.find((department) => String(department.id) === selectedDepartmentId),
    [departments, selectedDepartmentId],
  );
  const canManageDepartments = isManagementRole(LOCAL_CURRENT_USER.role);
  const canManageColumns = canManageDepartments;

  const tasksByColumn = useMemo(() => {
    const groupedTasks = new Map(columns.map((column) => [String(column.id), []]));
    const withoutColumn = [];

    const normalizedQuery = searchQuery.trim().toLocaleLowerCase("ru-RU");
    const visibleTasks = normalizedQuery
      ? tasks.filter((task) => String(task.title || "").toLocaleLowerCase("ru-RU").includes(normalizedQuery))
      : tasks;

    visibleTasks.forEach((task) => {
      const columnId = getTaskColumnId(task);
      if (columnId && groupedTasks.has(columnId)) {
        groupedTasks.get(columnId).push(task);
      } else {
        withoutColumn.push(task);
      }
    });

    return { groupedTasks, withoutColumn };
  }, [columns, searchQuery, tasks]);

  async function loadTaskDetails(taskId, fallbackTask = null) {
    setTaskError("");
    setIsTaskLoading(true);

    try {
      const taskDetails = await getTaskDetails(taskId);
      setSelectedTask(taskDetails);
      return taskDetails;
    } catch (loadError) {
      if (fallbackTask) {
        setSelectedTask(fallbackTask);
      }
      setTaskError("Не удалось загрузить карточку задачи.");
      return null;
    } finally {
      setIsTaskLoading(false);
    }
  }

  async function handleOpenTask(task) {
    setIsDrawerOpen(true);
    await loadTaskDetails(task.id, task);
  }

  async function handleCreateTask(columnId, title) {
    const createdTask = await createTask({
      title,
      department: Number(selectedDepartmentId),
      column: columnId,
    });

    setTasks((currentTasks) => [createdTask, ...currentTasks]);
    setIsDrawerOpen(true);
    await loadTaskDetails(createdTask.id, createdTask);
  }

  async function handleCreateSubtask(parentTask, title) {
    const createdSubtask = await createSubtask(parentTask.id, title);

    setTasks((currentTasks) =>
      currentTasks.map((task) => {
        if (task.id !== parentTask.id) {
          return task;
        }

        const nextSubtasks = [...(task.subtasks || []), createdSubtask];
        return updateParentSubtasks(task, nextSubtasks);
      }),
    );

    if (selectedTask?.id === parentTask.id) {
      await loadTaskDetails(parentTask.id, {
        ...selectedTask,
        subtasks: [...(selectedTask.subtasks || []), createdSubtask],
      });
    }

    return createdSubtask;
  }

  async function handleDeleteSubtask(parentTask, subtask) {
    await deleteSubtask(parentTask.id, subtask.id);

    setTasks((currentTasks) =>
      currentTasks.map((task) => {
        if (task.id !== parentTask.id) {
          return task;
        }
        return updateParentSubtasks(
          task,
          (task.subtasks || []).filter((currentSubtask) => currentSubtask.id !== subtask.id),
        );
      }),
    );

    setSelectedTask((currentTask) => {
      if (!currentTask) {
        return currentTask;
      }
      if (currentTask.id === parentTask.id) {
        return updateParentSubtasks(
          currentTask,
          (currentTask.subtasks || []).filter((currentSubtask) => currentSubtask.id !== subtask.id),
        );
      }
      return currentTask;
    });
  }

  async function handleRenameTask(task, title) {
    const updatedTask = await updateTaskTitle(task.id, title);

    setTasks((currentTasks) =>
      currentTasks.map((currentTask) => updateTaskEverywhere(currentTask, updatedTask)),
    );

    setSelectedTask((currentTask) => {
      if (!currentTask) {
        return currentTask;
      }

      if (currentTask.id === updatedTask.id) {
        return {
          ...currentTask,
          ...updatedTask,
        };
      }

      if (Array.isArray(currentTask.subtasks)) {
        return {
          ...currentTask,
          subtasks: currentTask.subtasks.map((subtask) =>
            subtask.id === updatedTask.id ? { ...subtask, ...updatedTask } : subtask,
          ),
        };
      }

      return currentTask;
    });

    return updatedTask;
  }

  async function handleToggleSubtask(parentTask, subtask) {
    const updatedSubtask = await toggleSubtask(parentTask.id, subtask.id);

    setTasks((currentTasks) =>
      currentTasks.map((task) => {
        if (task.id !== parentTask.id) {
          return task;
        }

        const nextSubtasks = replaceSubtask(task.subtasks || [], updatedSubtask);
        return updateParentSubtasks(task, nextSubtasks);
      }),
    );

    setSelectedTask((currentTask) => {
      if (!currentTask) {
        return currentTask;
      }

      if (currentTask.id === parentTask.id) {
        const nextSubtasks = replaceSubtask(currentTask.subtasks || [], updatedSubtask);
        return updateParentSubtasks(currentTask, nextSubtasks);
      }

      if (currentTask.id === updatedSubtask.id) {
        return {
          ...currentTask,
          ...updatedSubtask,
        };
      }

      return currentTask;
    });

    return updatedSubtask;
  }

  async function handleRenameColumn(column) {
    setOpenColumnMenuId(null);
    const name = window.prompt("\u041d\u043e\u0432\u043e\u0435 \u043d\u0430\u0437\u0432\u0430\u043d\u0438\u0435 \u043a\u043e\u043b\u043e\u043d\u043a\u0438", column.name);
    if (!name?.trim()) {
      return;
    }

    try {
      const updatedColumn = await updateDepartmentColumn(selectedDepartmentId, column.id, name.trim());
      setColumns((currentColumns) =>
        currentColumns.map((currentColumn) =>
          currentColumn.id === updatedColumn.id ? updatedColumn : currentColumn,
        ),
      );
    } catch {
      setError("\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u043f\u0435\u0440\u0435\u0438\u043c\u0435\u043d\u043e\u0432\u0430\u0442\u044c \u043a\u043e\u043b\u043e\u043d\u043a\u0443.");
    }
  }

  async function handleCreateColumn() {
    setOpenColumnMenuId(null);
    const name = window.prompt("\u041d\u0430\u0437\u0432\u0430\u043d\u0438\u0435 \u043d\u043e\u0432\u043e\u0439 \u043a\u043e\u043b\u043e\u043d\u043a\u0438");
    if (!name?.trim()) {
      return;
    }

    try {
      const createdColumn = await createDepartmentColumn(selectedDepartmentId, {
        name: name.trim(),
      });
      setColumns((currentColumns) => [...currentColumns, createdColumn]);
    } catch {
      setError("\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0441\u043e\u0437\u0434\u0430\u0442\u044c \u043a\u043e\u043b\u043e\u043d\u043a\u0443.");
    }
  }

  async function handleDeleteColumn(column, taskCount) {
    setOpenColumnMenuId(null);
    if (taskCount > 0) {
      window.alert("\u041d\u0435\u043b\u044c\u0437\u044f \u0443\u0434\u0430\u043b\u0438\u0442\u044c \u043a\u043e\u043b\u043e\u043d\u043a\u0443, \u0432 \u043a\u043e\u0442\u043e\u0440\u043e\u0439 \u0435\u0441\u0442\u044c \u0437\u0430\u0434\u0430\u0447\u0438");
      return;
    }

    if (!window.confirm("\u0423\u0434\u0430\u043b\u0438\u0442\u044c \u043f\u0443\u0441\u0442\u0443\u044e \u043a\u043e\u043b\u043e\u043d\u043a\u0443?")) {
      return;
    }

    try {
      await deleteDepartmentColumn(selectedDepartmentId, column.id);
      setColumns((currentColumns) => currentColumns.filter((currentColumn) => currentColumn.id !== column.id));
      setCollapsedColumnIds((currentIds) => currentIds.filter((columnId) => columnId !== String(column.id)));
    } catch {
      setError("\u041d\u0435\u043b\u044c\u0437\u044f \u0443\u0434\u0430\u043b\u0438\u0442\u044c \u043a\u043e\u043b\u043e\u043d\u043a\u0443, \u0432 \u043a\u043e\u0442\u043e\u0440\u043e\u0439 \u0435\u0441\u0442\u044c \u0437\u0430\u0434\u0430\u0447\u0438.");
    }
  }

  function handleToggleColumnCollapse(columnId) {
    setOpenColumnMenuId(null);
    setCollapsedColumnIds((currentIds) => {
      const normalizedColumnId = String(columnId);
      return currentIds.includes(normalizedColumnId)
        ? currentIds.filter((currentId) => currentId !== normalizedColumnId)
        : [...currentIds, normalizedColumnId];
    });
  }

  function handleCloseTask() {
    setIsDrawerOpen(false);
    setSelectedTask(null);
    setTaskError("");
    setIsTaskLoading(false);
  }

  async function handleTaskUsersChange(taskId, fieldName, nextUsers) {
    const selectedSubtask = selectedTask?.subtasks?.find((subtask) => subtask.id === taskId);
    const previousUsers = selectedTask?.id === taskId
      ? selectedTask[fieldName] || []
      : selectedSubtask?.[fieldName] || [];
    const optimisticTask = { id: taskId, [fieldName]: nextUsers };

    setSelectedTask((currentTask) => (
      currentTask ? updateTaskEverywhere(currentTask, optimisticTask) : currentTask
    ));
    setTasks((currentTasks) => (
      currentTasks.map((currentTask) => updateTaskEverywhere(currentTask, optimisticTask))
    ));

    try {
      const updatedTask = await updateTaskAssignments(
        taskId,
        { [fieldName]: nextUsers.map((user) => user.id) },
      );
      setSelectedTask((currentTask) => (
        currentTask ? updateTaskEverywhere(currentTask, updatedTask) : currentTask
      ));
      setTasks((currentTasks) => (
        currentTasks.map((currentTask) => updateTaskEverywhere(currentTask, updatedTask))
      ));
      return updatedTask;
    } catch (error) {
      const rollbackTask = { id: taskId, [fieldName]: previousUsers };
      setSelectedTask((currentTask) => (
        currentTask ? updateTaskEverywhere(currentTask, rollbackTask) : currentTask
      ));
      setTasks((currentTasks) => (
        currentTasks.map((currentTask) => updateTaskEverywhere(currentTask, rollbackTask))
      ));
      throw error;
    }
  }

  function handleTaskAssigneesChange(taskId, nextAssignees) {
    return handleTaskUsersChange(taskId, "assignees", nextAssignees);
  }

  function handleTaskWatchersChange(taskId, nextWatchers) {
    return handleTaskUsersChange(taskId, "watchers", nextWatchers);
  }

  function handleCommentCreated(comment) {
    const attachments = Array.isArray(comment.attachments) ? comment.attachments : [];

    setSelectedTask((currentTask) => {
      if (!currentTask) {
        return currentTask;
      }

      const currentFiles = currentTask.files || [];
      const currentFileIds = new Set(currentFiles.map((file) => file.id));
      const nextFiles = [
        ...attachments.filter((file) => !currentFileIds.has(file.id)),
        ...currentFiles,
      ];

      return {
        ...currentTask,
        comments: [...(currentTask.comments || []), comment],
        files: nextFiles,
      };
    });

    setTasks((currentTasks) => currentTasks.map((task) => (
      task.id === selectedTask?.id
        ? {
            ...task,
            comments_count: Number(task.comments_count || 0) + 1,
            files_count: Number(task.files_count || 0) + attachments.length,
          }
        : task
    )));
  }

  function handleCommentUpdated(comment) {
    setSelectedTask((currentTask) => {
      if (!currentTask) {
        return currentTask;
      }

      return {
        ...currentTask,
        comments: (currentTask.comments || []).map((currentComment) =>
          currentComment.id === comment.id ? comment : currentComment,
        ),
      };
    });
  }

  function handleFileUploaded(file) {
    setSelectedTask((currentTask) => {
      if (!currentTask) {
        return currentTask;
      }

      return {
        ...currentTask,
        files: [...(currentTask.files || []), file],
      };
    });
  }

  function handleFileDeleted(fileId) {
    setSelectedTask((currentTask) => {
      if (!currentTask) {
        return currentTask;
      }

      return {
        ...currentTask,
        files: (currentTask.files || []).filter((file) => file.id !== fileId),
        comments: (currentTask.comments || []).map((comment) => ({
          ...comment,
          attachments: (comment.attachments || []).filter((file) => file.id !== fileId),
        })),
      };
    });
  }

  return (
    <main
      className={`kanban-page appearance appearance--font-${appearance.fontSize} appearance--density-${appearance.density} appearance--column-opacity-${appearance.columnOpacity} appearance--radius-${appearance.cardRadius}`}
      style={getAppearanceStyle(appearance, isDrawerOpen, drawerWidth)}
    >
      <header className="board-topbar">
        <div className="board-topbar__primary">
          <button
            className="board-topbar__brand-button"
            type="button"
            aria-label="Открыть боковое меню"
            aria-expanded={isSidebarOpen}
            onClick={() => setIsSidebarOpen(true)}
          >
            <span className="topbar-menu-button" aria-hidden="true">
              <Menu size={20} strokeWidth={2} />
            </span>
            <span className="board-topbar__brand">D-Control</span>
          </button>

          <div className="board-topbar__tabs">
            {isDepartmentsLoading ? (
              <span className="board-topbar__status">Загрузка отделов...</span>
            ) : (
              <DepartmentSelector
                departments={departments}
                selectedDepartmentId={selectedDepartmentId}
                onChange={setSelectedDepartmentId}
              />
            )}
            {canManageDepartments && (
              <Tooltip as="button" label="Добавить отдел" className="department-add-button" type="button" aria-label="Добавить отдел">
                +
              </Tooltip>
            )}
          </div>

          {isBoardLoading && <span className="board-topbar__status">Загрузка...</span>}

          <div className="board-topbar__spacer" />
          <div className="board-topbar__tools" aria-label="Инструменты Workspace">
            <Tooltip as="button" label="Избранное" className="topbar-icon-button" type="button" aria-label="Избранное">
              <Star aria-hidden="true" size={17} strokeWidth={2} />
            </Tooltip>
            <Tooltip
              as="button"
              label="Центр активности"
              className="topbar-icon-button topbar-activity-button"
              type="button"
              aria-label="Центр активности"
            >
              <Bell aria-hidden="true" size={17} strokeWidth={2} />
              <span className="topbar-activity-badge" aria-label="Новые элементы">3</span>
            </Tooltip>
          </div>
          <label className="board-search">
            <span className="board-search__icon" aria-hidden="true" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Поиск"
              aria-label="Поиск задач"
            />
          </label>
          {!isDrawerOpen && (
            <Tooltip
              as="button"
              label="Открыть панель"
              className="topbar-drawer-button"
              type="button"
              aria-label="Открыть панель задачи"
              onClick={() => setIsDrawerOpen(true)}
            >
              <PanelRightOpen aria-hidden="true" size={17} strokeWidth={2} />
            </Tooltip>
          )}
        </div>
      </header>
      <div className={`kanban-workspace ${isDrawerOpen ? "" : "kanban-workspace--drawer-closed"}`}>
        <div className="kanban-main">


          {error && <p className="error-message">{error}</p>}

          <section className="board-shell" aria-label="Доска отдела">
            <div className="kanban-board">
              {columns.map((column) => (
                <KanbanColumn
                  key={column.id}
                  column={column}
                  title={column.name}
                  tasks={tasksByColumn.groupedTasks.get(String(column.id)) || []}
                  canManageColumns={canManageColumns}
                  isCollapsed={collapsedColumnIds.includes(String(column.id))}
                  isColumnMenuOpen={openColumnMenuId === column.id}
                  onDeleteColumn={handleDeleteColumn}
                  onRenameColumn={handleRenameColumn}
                  onToggleCollapse={handleToggleColumnCollapse}
                  onToggleColumnMenu={setOpenColumnMenuId}
                  openTaskMenuId={openTaskMenuId}
                  selectedTaskId={isDrawerOpen ? selectedTask?.id : null}
                  onCreateTask={handleCreateTask}
                  onCreateSubtask={handleCreateSubtask}
                  onOpenTask={handleOpenTask}
                  onRenameTask={handleRenameTask}
                  onToggleSubtask={handleToggleSubtask}
                  onToggleTaskMenu={setOpenTaskMenuId}
                />
              ))}

              {tasksByColumn.withoutColumn.length > 0 && (
                <KanbanColumn
                  title="Без колонки"
                  tasks={tasksByColumn.withoutColumn}
                  openTaskMenuId={openTaskMenuId}
                  selectedTaskId={isDrawerOpen ? selectedTask?.id : null}
                  onCreateSubtask={handleCreateSubtask}
                  onOpenTask={handleOpenTask}
                  onRenameTask={handleRenameTask}
                  onToggleSubtask={handleToggleSubtask}
                  onToggleTaskMenu={setOpenTaskMenuId}
                />
              )}

              {canManageColumns && (
                <Tooltip
                  as="button"
                  label="Добавить колонку"
                  className="kanban-column-add-button"
                  type="button"
                  aria-label="Добавить колонку"
                  onClick={handleCreateColumn}
                >
                  +
                </Tooltip>
              )}

            </div>
          </section>
        </div>

        {isDrawerOpen && (
          <TaskDetailsDrawer
            task={selectedTask}
            isLoading={isTaskLoading}
            error={taskError}
            drawerWidth={drawerWidth}
            onClose={handleCloseTask}
            onDrawerWidthChange={setDrawerWidth}
            onAssigneesChange={handleTaskAssigneesChange}
            onWatchersChange={handleTaskWatchersChange}
            onCreateSubtask={handleCreateSubtask}
            onDeleteSubtask={handleDeleteSubtask}
            onRenameTask={handleRenameTask}
            onToggleSubtask={handleToggleSubtask}
            onCommentCreated={handleCommentCreated}
            onCommentUpdated={handleCommentUpdated}
            onFileDeleted={handleFileDeleted}
            onFileUploaded={handleFileUploaded}
          />
        )}
      </div>
      <BoardSidebar
        isOpen={isSidebarOpen}
        user={LOCAL_CURRENT_USER}
        onClose={() => setIsSidebarOpen(false)}
        onOpenAppearance={() => {
          setIsSidebarOpen(false);
          setIsAppearanceOpen(true);
        }}
      />
      {isAppearanceOpen && (
        <AppearanceSettings
          settings={appearance}
          onChange={(nextSettings) => setAppearance((current) => ({ ...current, ...nextSettings }))}
          onClose={() => setIsAppearanceOpen(false)}
        />
      )}
    </main>
  );
}
