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

export function getTaskDetails(taskId) {
  return apiRequest(`/api/tasks/${taskId}/`);
}

export function createTaskComment(taskId, text) {
  return apiRequest(`/api/tasks/${taskId}/comments/`, {
    method: "POST",
    body: JSON.stringify({ text }),
  });
}

export function uploadTaskFile(taskId, file) {
  const formData = new FormData();
  formData.append("file", file);

  return apiRequest(`/api/tasks/${taskId}/files/`, {
    method: "POST",
    body: formData,
  });
}