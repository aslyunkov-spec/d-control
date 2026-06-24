export function DepartmentSelector({ departments, selectedDepartmentId, onChange }) {
  return (
    <nav className="department-tabs" aria-label="Отделы">
      {departments.map((department) => {
        const isActive = String(department.id) === selectedDepartmentId;

        return (
          <button
            key={department.id}
            className={`department-tab ${isActive ? "department-tab--active" : ""}`}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(String(department.id))}
          >
            {department.name}
          </button>
        );
      })}
    </nav>
  );
}