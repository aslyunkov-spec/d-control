import { useEffect, useMemo, useState } from "react";

import {
  getDepartmentColumns,
  getDepartments,
  getTaskDetails,
  getTasksByDepartment,
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

export function KanbanPage() {
  const [departments, setDepartments] = useState([]);
  const [columns, setColumns] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [selectedTask, setSelectedTask] = useState(null);
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

  async function handleOpenTask(task) {
    setTaskError("");
    setIsTaskLoading(true);
    setIsDrawerOpen(true);

    try {
      const taskDetails = await getTaskDetails(task.id);
      setSelectedTask(taskDetails);
    } catch (loadError) {
      setTaskError("Не удалось загрузить карточку задачи.");
    } finally {
      setIsTaskLoading(false);
    }
  }

  function handleCloseTask() {
    setIsDrawerOpen(false);
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
                  title={column.name}
                  tasks={tasksByColumn.groupedTasks.get(String(column.id)) || []}
                  onOpenTask={handleOpenTask}
                />
              ))}

              {tasksByColumn.withoutColumn.length > 0 && (
                <KanbanColumn
                  title="Без колонки"
                  tasks={tasksByColumn.withoutColumn}
                  onOpenTask={handleOpenTask}
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