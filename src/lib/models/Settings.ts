import mongoose, { Schema, model, models } from "mongoose";

const ReminderSchema = new Schema(
  {
    enabled: { type: Boolean, default: true },
    label: { type: String, required: true },
    time: { type: String, required: true }, // HH:mm
    message: { type: String, default: "" },
    days: { type: [Number], default: [0, 1, 2, 3, 4, 5, 6] }, // 0..6 Sun..Sat
  },
  { _id: false }
);

const MealScheduleSchema = new Schema(
  {
    meal: {
      type: String,
      enum: ["breakfast", "lunch", "dinner", "snack"],
      required: true,
    },
    time: { type: String, required: true },
  },
  { _id: false }
);

// Single-document settings collection (one user / personal app).
const SettingsSchema = new Schema(
  {
    key: { type: String, default: "default", unique: true },
    name: { type: String, default: "Vishwak" },
    officeStart: { type: String, default: "09:30" },
    officeEnd: { type: String, default: "18:30" },
    officeDays: { type: [Number], default: [1, 2, 3, 4, 5] }, // Mon..Fri
    sleepStart: { type: String, default: "23:30" },
    wakeTime: { type: String, default: "07:00" },
    dailyCodingMinutesGoal: { type: Number, default: 90 },
    dailyCodingTasksGoal: { type: Number, default: 2 },
    mealSchedule: {
      type: [MealScheduleSchema],
      default: [
        { meal: "breakfast", time: "08:30" },
        { meal: "lunch", time: "13:00" },
        { meal: "dinner", time: "21:00" },
      ],
    },
    reminders: {
      type: [ReminderSchema],
      default: [
        {
          enabled: true,
          label: "Plan your day",
          time: "08:00",
          message: "Good morning! Plan your tasks for today.",
          days: [1, 2, 3, 4, 5],
        },
        {
          enabled: true,
          label: "Coding time",
          time: "20:00",
          message: "Time for your daily coding goal 💻",
          days: [0, 1, 2, 3, 4, 5, 6],
        },
        {
          enabled: true,
          label: "Day review",
          time: "22:30",
          message: "Review your day & mark tasks done/missed.",
          days: [0, 1, 2, 3, 4, 5, 6],
        },
      ],
    },
    smsEnabled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export type SettingsDoc = mongoose.InferSchemaType<typeof SettingsSchema>;

export const Settings = models.Settings || model("Settings", SettingsSchema);

export const DEFAULT_SETTINGS_KEY = "default";
