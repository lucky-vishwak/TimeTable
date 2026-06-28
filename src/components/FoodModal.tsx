"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { FoodLogDTO, MEAL_TYPES, MealType } from "@/lib/types";

export default function FoodModal({
  open,
  onClose,
  onSave,
  initial,
  defaultDate,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<FoodLogDTO>) => Promise<void>;
  initial?: FoodLogDTO | null;
  defaultDate: string;
}) {
  const [name, setName] = useState("");
  const [meal, setMeal] = useState<MealType>("breakfast");
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState("");
  const [calories, setCalories] = useState<string>("");
  const [healthy, setHealthy] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? "");
      setMeal(initial?.meal ?? "breakfast");
      setDate(initial?.date ?? defaultDate);
      setTime(initial?.time ?? "");
      setCalories(initial?.calories ? String(initial.calories) : "");
      setHealthy(initial?.healthy ?? true);
    }
  }, [open, initial, defaultDate]);

  if (!open) return null;

  async function submit() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        meal,
        date,
        time,
        calories: calories ? Number(calories) : 0,
        healthy,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  const MEAL_EMOJI: Record<MealType, string> = {
    breakfast: "🍳",
    lunch: "🍱",
    dinner: "🍽️",
    snack: "🍎",
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-md p-5 animate-fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {initial ? "Edit meal" : "Log meal"}
          </h3>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-white/5">
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="label">What did you eat?</label>
            <input
              autoFocus
              className="input"
              placeholder="e.g. Oats with fruit"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Meal</label>
            <div className="flex flex-wrap gap-2">
              {MEAL_TYPES.map((m) => (
                <button
                  key={m}
                  onClick={() => setMeal(m)}
                  className={`chip border capitalize transition ${
                    meal === m
                      ? "border-amber-400 bg-amber-400/15 text-amber-300"
                      : "border-ink-line text-slate-400"
                  }`}
                >
                  {MEAL_EMOJI[m]} {m}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Date</label>
              <input
                type="date"
                className="input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Time</label>
              <input
                type="time"
                className="input"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 items-end gap-3">
            <div>
              <label className="label">Calories (optional)</label>
              <input
                type="number"
                className="input"
                placeholder="0"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
              />
            </div>
            <button
              onClick={() => setHealthy((h) => !h)}
              className={`chip h-[38px] justify-center border transition ${
                healthy
                  ? "border-emerald-400 bg-emerald-400/15 text-emerald-300"
                  : "border-rose-400/50 bg-rose-400/10 text-rose-300"
              }`}
            >
              {healthy ? "🥗 Healthy" : "🍔 Not healthy"}
            </button>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={submit}
            disabled={saving || !name.trim()}
          >
            {saving ? "Saving…" : initial ? "Save" : "Log meal"}
          </button>
        </div>
      </div>
    </div>
  );
}
