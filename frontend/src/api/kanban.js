import { apiRequest } from "./client";

export function getDepartments() {
  return apiRequest("/api/departments/");
}

export function getDepartmentColumns(departmentId) {
  return apiRequest(`/api/departments/${departmentId}/columns/`);
}

export function getTasksByDepartment(departmentId) {
  return apiRequest(`/api/tasks/?department=${departmentId}`);
}