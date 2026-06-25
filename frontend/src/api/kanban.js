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

export function createTask({ title, department, column }) {
  return apiRequest("/api/tasks/", {
    method: "POST",
    body: JSON.stringify({ title, department, column }),
  });
}

export function createSubtask(taskId, title) {
  return apiRequest(`/api/tasks/${taskId}/subtasks/`, {
    method: "POST",
    body: JSON.stringify({ title }),
  });
}

export function toggleSubtask(parentTaskId, subtaskId) {
  return apiRequest(`/api/tasks/${parentTaskId}/subtasks/${subtaskId}/toggle/`, {
    method: "POST",
  });
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

export function updateTaskComment(taskId, commentId, text) {
  return apiRequest(`/api/tasks/${taskId}/comments/${commentId}/`, {
    method: "PATCH",
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

export function deleteTaskFile(taskId, fileId) {
  return apiRequest(`/api/tasks/${taskId}/files/${fileId}/`, {
    method: "DELETE",
  });
}