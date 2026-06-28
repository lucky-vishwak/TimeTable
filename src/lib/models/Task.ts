import mongoose, { Schema, model, models } from "mongoose";

const TaskSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    notes: { type: String, default: "" },
    category: {
      type: String,
      enum: ["general", "coding", "food", "office"],
      default: "general",
      index: true,
    },
    // Stored as YYYY-MM-DD so day grouping is timezone-safe.
    date: { type: String, required: true, index: true },
    startTime: { type: String, default: "" }, // HH:mm
    endTime: { type: String, default: "" }, // HH:mm
    plannedMinutes: { type: Number, default: 0 },
    actualMinutes: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["planned", "done", "missed", "skipped"],
      default: "planned",
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    tags: { type: [String], default: [] },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export type TaskDoc = mongoose.InferSchemaType<typeof TaskSchema>;

export const Task = models.Task || model("Task", TaskSchema);
