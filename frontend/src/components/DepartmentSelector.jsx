export function DepartmentSelector({ departments, selectedDepartmentId, onChange }) {
  return (
    <label className="department-selector">
      <span>Отдел</span>
      <select
        value={selectedDepartmentId || ""}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">Выберите отдел</option>
        {departments.map((department) => (
          <option key={department.id} value={department.id}>
            {department.name}
          </option>
        ))}
      </select>
    </label>
  );
}