// Shared domain types used by both client and server.

// "focus" = any productive / growth work: building projects, learning new tech,
// coding, deep work, etc. Shown to the user as "Tasks".
export type Category = "general" | "focus" | "food" | "office";
export type TaskStatus = "planned" | "done" | "missed" | "skipped";
export type Priority = "low" | "medium" | "high";
export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export const CATEGORIES: Category[] = ["general", "focus", "food", "office"];
export const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

export const CATEGORY_META: Record<
  Category,
  { label: string; color: string; emoji: string }
> = {
  general: { label: "General", color: "#60a5fa", emoji: "🗒️" },
  focus: { label: "Tasks", color: "#34d399", emoji: "🚀" },
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
  dailyFocusMinutesGoal: number;
  dailyFocusTasksGoal: number;
  mealSchedule: { meal: MealType; time: string }[];
  reminders: ReminderDTO[];
}

export type LifeLogType =
  | "movie"
  | "party"
  | "outing"
  | "travel"
  | "event"
  | "health"
  | "shopping"
  | "other";

export const LIFELOG_TYPES: LifeLogType[] = [
  "movie",
  "party",
  "outing",
  "travel",
  "event",
  "health",
  "shopping",
  "other",
];

export const LIFELOG_META: Record<
  LifeLogType,
  { label: string; color: string; emoji: string }
> = {
  movie: { label: "Movie / Show", color: "#a78bfa", emoji: "🎬" },
  party: { label: "Party / Dinner", color: "#f472b6", emoji: "🎉" },
  outing: { label: "Outing", color: "#38bdf8", emoji: "🚶" },
  travel: { label: "Travel", color: "#34d399", emoji: "✈️" },
  event: { label: "Event", color: "#fbbf24", emoji: "📅" },
  health: { label: "Health", color: "#fb7185", emoji: "🩺" },
  shopping: { label: "Shopping", color: "#facc15", emoji: "🛍️" },
  other: { label: "Other", color: "#94a3b8", emoji: "📝" },
};

export interface LifeLogDTO {
  _id: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  type: LifeLogType;
  title: string;
  notes?: string;
  people?: string[];
  location?: string;
  rating?: number; // 1..5, optional
  createdAt?: string;
  updatedAt?: string;
}
