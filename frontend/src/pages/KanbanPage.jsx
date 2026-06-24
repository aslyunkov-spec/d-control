import { useEffect, useMemo, useState } from "react";

import { getDepartments } from "../api/kanban";
import { DepartmentSelector } from "../components/DepartmentSelector";

export function KanbanPage() {
  const [departments, setDepartments] = useState([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

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
          setIsLoading(false);
        }
      }
    }

    loadDepartments();

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedDepartment = useMemo(
    () => departments.find((department) => String(department.id) === selectedDepartmentId),
    [departments, selectedDepartmentId]
  );

  return (
    <main className="kanban-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">D-Control</p>
          <h1>Kanban</h1>
        </div>
      </header>

      <section className="toolbar" aria-label="Фильтры доски">
        {isLoading ? (
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
        <div className="empty-board">
          <h2>{selectedDepartment ? selectedDepartment.name : "Отдел не выбран"}</h2>
          <p>
            На следующем шаге здесь появятся колонки выбранного отдела и карточки задач.
          </p>
        </div>
      </section>
    </main>
  );
}