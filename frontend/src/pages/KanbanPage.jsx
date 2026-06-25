import { useEffect, useMemo, useState } from "react";

import {
  createSubtask,
  createTask,
  getDepartmentColumns,
  getDepartments,
  getTaskDetails,
  getTasksByDepartment,
  toggleSubtask,
} from "../api/kanban";
import { DepartmentSelector } from "../components/DepartmentSelector";
import { KanbanColumn } from "../components/KanbanColumn";
import { TaskDetailsDrawer } from "../components/TaskDetailsDrawer";

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

export function KanbanPage() {
  const [departments, setDepartments] = useState([]);
  const [columns, setColumns] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [selectedTask, setSelectedTask] = useState(null);
  const [openTaskMenuId, setOpenTaskMenuId] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDepartmentsLoading, setIsDepartmentsLoading] = useState(true);
  const [isBoardLoading, setIsBoardLoading] = useState(false);
  const [isTaskLoading, setIsTaskLoading] = useState(false);
  const [error, setError] = useState("");
  const [taskError, setTaskError] = useState("");

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

  const tasksByColumn = useMemo(() => {
    const groupedTasks = new Map(columns.map((column) => [String(column.id), []]));
    const withoutColumn = [];

    tasks.forEach((task) => {
      const columnId = getTaskColumnId(task);
      if (columnId && groupedTasks.has(columnId)) {
        groupedTasks.get(columnId).push(task);
      } else {
        withoutColumn.push(task);
      }
    });

    return { groupedTasks, withoutColumn };
  }, [columns, tasks]);

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

  function handleCloseTask() {
    setIsDrawerOpen(false);
    setSelectedTask(null);
    setTaskError("");
    setIsTaskLoading(false);
  }

  function handleCommentCreated(comment) {
    setSelectedTask((currentTask) => {
      if (!currentTask) {
        return currentTask;
      }

      return {
        ...currentTask,
        comments: [...(currentTask.comments || []), comment],
      };
    });
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
      };
    });
  }

  return (
    <main className="kanban-page">
      <div className={`kanban-workspace ${isDrawerOpen ? "" : "kanban-workspace--drawer-closed"}`}>
        <div className="kanban-main">
          <header className="board-topbar">
            {isDepartmentsLoading ? (
              <span className="muted">Загрузка отделов...</span>
            ) : (
              <DepartmentSelector
                departments={departments}
                selectedDepartmentId={selectedDepartmentId}
                onChange={setSelectedDepartmentId}
              />
            )}
            <div className="board-topbar__actions">
              {isBoardLoading && <span className="muted">Загрузка...</span>}
              {!isDrawerOpen && (
                <button
                  className="drawer-open-button"
                  type="button"
                  onClick={() => setIsDrawerOpen(true)}
                >
                  Панель
                </button>
              )}
            </div>
          </header>

          {error && <p className="error-message">{error}</p>}

          <section className="board-shell" aria-label="Доска отдела">
            <div className="kanban-board">
              {columns.map((column) => (
                <KanbanColumn
                  key={column.id}
                  column={column}
                  title={column.name}
                  tasks={tasksByColumn.groupedTasks.get(String(column.id)) || []}
                  openTaskMenuId={openTaskMenuId}
                  selectedTaskId={isDrawerOpen ? selectedTask?.id : null}
                  onCreateTask={handleCreateTask}
                  onCreateSubtask={handleCreateSubtask}
                  onOpenTask={handleOpenTask}
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
                  onToggleSubtask={handleToggleSubtask}
                  onToggleTaskMenu={setOpenTaskMenuId}
                />
              )}
            </div>
          </section>
        </div>

        {isDrawerOpen && (
          <TaskDetailsDrawer
            task={selectedTask}
            isLoading={isTaskLoading}
            error={taskError}
            onClose={handleCloseTask}
            onCommentCreated={handleCommentCreated}
            onFileUploaded={handleFileUploaded}
          />
        )}
      </div>
    </main>
  );
}