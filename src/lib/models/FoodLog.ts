import mongoose, { Schema, model, models } from "mongoose";

const FoodLogSchema = new Schema(
  {
    date: { type: String, required: true, index: true }, // YYYY-MM-DD
    meal: {
      type: String,
      enum: ["breakfast", "lunch", "dinner", "snack"],
      required: true,
    },
    name: { type: String, required: true, trim: true },
    time: { type: String, default: "" }, // HH:mm
    calories: { type: Number, default: 0 },
    healthy: { type: Boolean, default: true },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

export type FoodLogDoc = mongoose.InferSchemaType<typeof FoodLogSchema>;

export const FoodLog = models.FoodLog || model("FoodLog", FoodLogSchema);
