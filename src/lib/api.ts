// Tiny client-side fetch helpers.
import { TaskDTO, FoodLogDTO, SettingsDTO, LifeLogDTO } from "./types";
import { AnalyticsResult } from "./analytics";

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`${res.status}: ${txt}`);
  }
  return res.json();
}

export const api = {
  // Tasks
  getTasks: (params: Record<string, string>) =>
    fetch(`/api/tasks?${new URLSearchParams(params)}`, {
      cache: "no-store",
    }).then((r) => json<TaskDTO[]>(r)),
  createTask: (data: Partial<TaskDTO>) =>
    fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => json<TaskDTO>(r)),
  updateTask: (id: string, data: Partial<TaskDTO>) =>
    fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => json<TaskDTO>(r)),
  deleteTask: (id: string) =>
    fetch(`/api/tasks/${id}`, { method: "DELETE" }).then((r) => json(r)),

  // Food
  getFood: (params: Record<string, string>) =>
    fetch(`/api/food?${new URLSearchParams(params)}`, {
      cache: "no-store",
    }).then((r) => json<FoodLogDTO[]>(r)),
  createFood: (data: Partial<FoodLogDTO>) =>
    fetch("/api/food", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => json<FoodLogDTO>(r)),
  updateFood: (id: string, data: Partial<FoodLogDTO>) =>
    fetch(`/api/food/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => json<FoodLogDTO>(r)),
  deleteFood: (id: string) =>
    fetch(`/api/food/${id}`, { method: "DELETE" }).then((r) => json(r)),

  // Life log / journal
  getLifeLogs: (params: Record<string, string>) =>
    fetch(`/api/lifelog?${new URLSearchParams(params)}`, {
      cache: "no-store",
    }).then((r) => json<LifeLogDTO[]>(r)),
  createLifeLog: (
    data: Omit<Partial<LifeLogDTO>, "people"> & { people?: string }
  ) =>
    fetch("/api/lifelog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => json<LifeLogDTO>(r)),
  updateLifeLog: (
    id: string,
    data: Omit<Partial<LifeLogDTO>, "people"> & { people?: string }
  ) =>
    fetch(`/api/lifelog/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => json<LifeLogDTO>(r)),
  deleteLifeLog: (id: string) =>
    fetch(`/api/lifelog/${id}`, { method: "DELETE" }).then((r) => json(r)),

  // Settings
  getSettings: () =>
    fetch("/api/settings", { cache: "no-store" }).then((r) =>
      json<SettingsDTO>(r)
    ),
  saveSettings: (data: SettingsDTO) =>
    fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => json<SettingsDTO>(r)),

  // Analytics
  getAnalytics: (params: Record<string, string> = {}) =>
    fetch(`/api/analytics?${new URLSearchParams(params)}`, {
      cache: "no-store",
    }).then((r) => json<AnalyticsResult>(r)),
};
