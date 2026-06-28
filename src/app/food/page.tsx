"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Pencil,
  Salad,
  Flame,
} from "lucide-react";
import { api } from "@/lib/api";
import { FoodLogDTO, MealType, MEAL_TYPES, SettingsDTO } from "@/lib/types";
import { toDayKey, fromDayKey, addDays, prettyDate } from "@/lib/date";
import { PageHeader, StatCard, Spinner } from "@/components/ui";
import FoodModal from "@/components/FoodModal";

const MEAL_EMOJI: Record<MealType, string> = {
  breakfast: "🍳",
  lunch: "🍱",
  dinner: "🍽️",
  snack: "🍎",
};

export default function FoodPage() {
  const [day, setDay] = useState(toDayKey());
  const [food, setFood] = useState<FoodLogDTO[]>([]);
  const [settings, setSettings] = useState<SettingsDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<FoodLogDTO | null>(null);

  async function load() {
    setLoading(true);
    const [f, s] = await Promise.all([
      api.getFood({ date: day }),
      settings ? Promise.resolve(settings) : api.getSettings(),
    ]);
    setFood(f);
    setSettings(s);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, [day]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalCals = food.reduce((s, f) => s + (f.calories || 0), 0);
  const healthy = food.filter((f) => f.healthy).length;
  const healthyPct = food.length ? Math.round((healthy / food.length) * 100) : 0;

  async function save(data: Partial<FoodLogDTO>) {
    if (editing) {
      const u = await api.updateFood(editing._id, data);
      setFood((p) => p.map((f) => (f._id === editing._id ? u : f)));
    } else {
      const c = await api.createFood(data);
      if (c.date === day) setFood((p) => [...p, c]);
    }
    setEditing(null);
  }
  async function remove(f: FoodLogDTO) {
    setFood((p) => p.filter((x) => x._id !== f._id));
    await api.deleteFood(f._id);
  }

  const isToday = day === toDayKey();

  return (
    <>
      <PageHeader
        title="Food 🍱"
        subtitle="Log meals and keep your eating on track."
        action={
          <button
            className="btn-primary"
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Log meal
          </button>
        }
      />

      <div className="mb-6 flex items-center gap-2">
        <button
          className="btn-ghost px-2"
          onClick={() => setDay(toDayKey(addDays(fromDayKey(day), -1)))}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="card px-4 py-2 text-sm font-medium">
          {prettyDate(day)}
          {isToday && (
            <span className="chip ml-2 bg-brand/20 text-brand-glow">Today</span>
          )}
        </div>
        <button
          className="btn-ghost px-2"
          onClick={() => setDay(toDayKey(addDays(fromDayKey(day), 1)))}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-3 sm:gap-4">
        <StatCard
          label="Meals"
          value={food.length}
          accent="#fbbf24"
          icon={<Salad className="h-4 w-4" />}
        />
        <StatCard
          label="Healthy"
          value={`${healthyPct}%`}
          hint={`${healthy}/${food.length}`}
          accent="#34d399"
        />
        <StatCard
          label="Calories"
          value={totalCals || "—"}
          accent="#fb923c"
          icon={<Flame className="h-4 w-4" />}
        />
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <div className="space-y-5">
          {MEAL_TYPES.map((meal) => {
            const items = food.filter((f) => f.meal === meal);
            const planned = settings?.mealSchedule?.find(
              (m) => m.meal === meal
            );
            return (
              <div key={meal}>
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-sm font-semibold capitalize text-slate-200">
                    {MEAL_EMOJI[meal]} {meal}
                  </span>
                  {planned && (
                    <span className="text-xs text-slate-500">
                      usually {planned.time}
                    </span>
                  )}
                </div>
                {items.length === 0 ? (
                  <button
                    onClick={() => {
                      setEditing(null);
                      setModalOpen(true);
                    }}
                    className="card w-full p-3 text-left text-xs text-slate-500 hover:border-brand/40"
                  >
                    + nothing logged — tap to add
                  </button>
                ) : (
                  <div className="space-y-2">
                    {items.map((f) => (
                      <div
                        key={f._id}
                        className="group card flex items-center gap-3 p-3"
                        style={{
                          borderLeft: `3px solid ${
                            f.healthy ? "#34d399" : "#fb7185"
                          }`,
                        }}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium text-slate-100">
                            {f.name}
                          </div>
                          <div className="mt-0.5 flex gap-3 text-xs text-slate-500">
                            {f.time && <span>{f.time}</span>}
                            {f.calories ? <span>{f.calories} kcal</span> : null}
                            <span
                              className={
                                f.healthy ? "text-emerald-400" : "text-rose-400"
                              }
                            >
                              {f.healthy ? "healthy" : "unhealthy"}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1 opacity-0 transition group-hover:opacity-100">
                          <button
                            onClick={() => {
                              setEditing(f);
                              setModalOpen(true);
                            }}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-white/5 hover:text-slate-200"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => remove(f)}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-white/5 hover:text-rose-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <FoodModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSave={save}
        initial={editing}
        defaultDate={day}
      />
    </>
  );
}
