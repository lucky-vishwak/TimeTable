// Shared domain types used by both client and server.

export type Category = "general" | "coding" | "food" | "office";
export type TaskStatus = "planned" | "done" | "missed" | "skipped";
export type Priority = "low" | "medium" | "high";
export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export const CATEGORIES: Category[] = ["general", "coding", "food", "office"];
export const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

export const CATEGORY_META: Record<
  Category,
  { label: string; color: string; emoji: string }
> = {
  general: { label: "General", color: "#60a5fa", emoji: "🗒️" },
  coding: { label: "Coding", color: "#34d399", emoji: "💻" },
  food: { label: "Food", color: "#fbbf24", emoji: "🍱" },
  office: { label: "Office", color: "#f472b6", emoji: "🏢" },
};

export interface TaskDTO {
  _id: string;
  title: string;
  notes?: string;
  category: Category;
  date: string; // YYYY-MM-DD
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  plannedMinutes?: number;
  actualMinutes?: number;
  status: TaskStatus;
  priority: Priority;
  tags: string[];
  completedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface FoodLogDTO {
  _id: string;
  date: string; // YYYY-MM-DD
  meal: MealType;
  name: string;
  time?: string; // HH:mm
  calories?: number;
  healthy: boolean;
  notes?: string;
}

export interface ReminderDTO {
  enabled: boolean;
  label: string;
  time: string; // HH:mm
  message: string;
  days: number[]; // 0..6, Sun..Sat
}

export interface SettingsDTO {
  _id?: string;
  name: string;
  officeStart: string; // HH:mm
  officeEnd: string; // HH:mm
  officeDays: number[]; // 0..6
  sleepStart: string;
  wakeTime: string;
  dailyCodingMinutesGoal: number;
  dailyCodingTasksGoal: number;
  mealSchedule: { meal: MealType; time: string }[];
  reminders: ReminderDTO[];
}
