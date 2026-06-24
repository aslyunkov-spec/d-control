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

  const selectedDepartment = useMemo(
    () => departments.find((department) => String(department.id) === selectedDepartmentId),
    [departments, selectedDepartmentId]
  );

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
    setSelectedTask(null);
    setTaskError("");
    setIsTaskLoading(false);
  }

  return (
    <main className="kanban-page">
      <div className="kanban-workspace">
        <div className="kanban-main">
          <header className="page-header">
            <div>
              <p className="eyebrow">D-Control</p>
              <h1>Kanban</h1>
            </div>
          </header>

          <section className="toolbar" aria-label="Фильтры доски">
            {isDepartmentsLoading ? (
              <span className="muted">Загрузка отделов...</span>
            ) : (
              <DepartmentSelector
                departments={departments}
                selectedDepartmentId={selectedDepartmentId}
                onChange={setSelectedDepartmentId}
              />
            )}
          </section>

          {error && <p className="error-message">{error}</p>}

          <section className="board-shell" aria-label="Доска отдела">
            <div className="board-header">
              <div>
                <p className="eyebrow">Отдел</p>
                <h2>{selectedDepartment ? selectedDepartment.name : "Отдел не выбран"}</h2>
              </div>
              {isBoardLoading && <span className="muted">Загрузка доски...</span>}
            </div>

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

        <TaskDetailsDrawer
          task={selectedTask}
          isLoading={isTaskLoading}
          error={taskError}
          onClose={handleCloseTask}
        />
      </div>
    </main>
  );
}