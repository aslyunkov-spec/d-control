import { apiRequest } from "./client";

export function getDepartments() {
  return apiRequest("/api/departments/");
}