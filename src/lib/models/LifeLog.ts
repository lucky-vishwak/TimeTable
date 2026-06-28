import mongoose, { Schema, model, models } from "mongoose";

// A life event / memory: movies, dinner parties, outings, travel, etc.
// Builds an end-to-end record of what you actually did on a given day.
const LifeLogSchema = new Schema(
  {
    date: { type: String, required: true, index: true }, // YYYY-MM-DD
    time: { type: String, default: "" }, // HH:mm
    type: {
      type: String,
      enum: [
        "movie",
        "party",
        "outing",
        "travel",
        "event",
        "health",
        "shopping",
        "other",
      ],
      default: "other",
      index: true,
    },
    title: { type: String, required: true, trim: true },
    notes: { type: String, default: "" },
    people: { type: [String], default: [] },
    location: { type: String, default: "" },
    rating: { type: Number, min: 0, max: 5, default: 0 },
  },
  { timestamps: true }
);

// Text index so the Journal can search across all memories.
LifeLogSchema.index({ title: "text", notes: "text", location: "text" });

export type LifeLogDoc = mongoose.InferSchemaType<typeof LifeLogSchema>;

export const LifeLog = models.LifeLog || model("LifeLog", LifeLogSchema);
