"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Rocket,
  Utensils,
  Flame,
  ArrowRight,
  Sparkles,
  Plus,
} from "lucide-react";
import { api } from "@/lib/api";
import { TaskDTO, FoodLogDTO, SettingsDTO } from "@/lib/types";
import { AnalyticsResult } from "@/lib/analytics";
import { toDayKey, addDays, nowHHmm } from "@/lib/date";
import { PageHeader, StatCard, ProgressRing, Spinner } from "@/components/ui";
import TaskRow from "@/components/TaskRow";
import TaskModal from "@/components/TaskModal";

const SEV_STYLE: Record<string, string> = {
  good: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  info: "border-sky-500/30 bg-sky-500/10 text-sky-300",
  warn: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  bad: "border-rose-500/30 bg-rose-500/10 text-rose-300",
};

export default function Dashboard() {
  const today = toDayKey();
  const [tasks, setTasks] = useState<TaskDTO[]>([]);
  const [food, setFood] = useState<FoodLogDTO[]>([]);
  const [settings, setSettings] = useState<SettingsDTO | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  async function load() {
    const [t, f, s, a] = await Promise.all([
      api.getTasks({ date: today }),
      api.getFood({ date: today }),
      api.getSettings(),
      api.getAnalytics({
        from: toDayKey(addDays(new Date(), -6)),
        to: today,
      }),
    ]);
    setTasks(t);
    setFood(f);
    setSettings(s);
    setAnalytics(a);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading || !settings || !analytics) return <Spinner />;

  const doneCount = tasks.filter((t) => t.status === "done").length;
  const considered = tasks.filter((t) => t.status !== "skipped").length;
  const pct = considered ? Math.round((doneCount / considered) * 100) : 0;

  const focusMinutes = tasks
    .filter((t) => t.category === "focus" && t.status === "done")
    .reduce((s, t) => s + (t.actualMinutes || t.plannedMinutes || 0), 0);
  const focusPct = settings.dailyFocusMinutesGoal
    ? Math.min(100, Math.round((focusMinutes / settings.dailyFocusMinutesGoal) * 100))
    : 0;

  const healthyMeals = food.filter((f) => f.healthy).length;

  const upcoming = [...tasks]
    .filter((t) => t.status === "planned")
    .sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""))
    .slice(0, 5);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  async function setStatus(task: TaskDTO, status: TaskDTO["status"]) {
    setTasks((p) => p.map((t) => (t._id === task._id ? { ...t, status } : t)));
    await api.updateTask(task._id, { status });
  }

  return (
    <>
      <PageHeader
        title={`${greeting}, ${settings.name} 👋`}
        subtitle={`It's ${nowHHmm()} — here's how today is shaping up.`}
        action={
          <button className="btn-primary" onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" /> Quick add
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="Today's tasks"
          value={`${doneCount}/${considered}`}
          hint={`${pct}% complete`}
          accent="#6c5ce7"
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
        <StatCard
          label="Tasks (focus)"
          value={`${focusMinutes}m`}
          hint={`goal ${settings.dailyFocusMinutesGoal}m`}
          accent="#34d399"
          icon={<Rocket className="h-4 w-4" />}
        />
        <StatCard
          label="Meals logged"
          value={`${food.length}`}
          hint={`${healthyMeals} healthy`}
          accent="#fbbf24"
          icon={<Utensils className="h-4 w-4" />}
        />
        <StatCard
          label="7-day score"
          value={`${analytics.totals.avgScore}`}
          hint={`${analytics.totals.onTrackDays} on-track days`}
          accent="#f472b6"
          icon={<Flame className="h-4 w-4" />}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {/* Today timeline */}
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-200">
              Up next today
            </h2>
            <Link
              href="/schedule"
              className="inline-flex items-center gap-1 text-xs text-brand-glow hover:underline"
            >
              Full schedule <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <div className="card p-6 text-center text-sm text-slate-400">
              🎉 Nothing pending. You&apos;re all caught up for today.
            </div>
          ) : (
            <div className="space-y-2">
              {upcoming.map((t) => (
                <TaskRow
                  key={t._id}
                  task={t}
                  onStatus={(s) => setStatus(t, s)}
                  onEdit={() => {}}
                  onDelete={async () => {
                    setTasks((p) => p.filter((x) => x._id !== t._id));
                    await api.deleteTask(t._id);
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right column: rings + insights */}
        <div className="space-y-4">
          <div className="card p-5">
            <h2 className="mb-4 text-sm font-semibold text-slate-200">
              Today at a glance
            </h2>
            <div className="flex items-center justify-around">
              <div className="flex flex-col items-center gap-2">
                <ProgressRing value={pct} color="#6c5ce7" label={`${pct}%`} />
                <span className="text-xs text-slate-400">Tasks</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <ProgressRing
                  value={focusPct}
                  color="#34d399"
                  label={`${focusPct}%`}
                />
                <span className="text-xs text-slate-400">Tasks</span>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-brand-glow" />
              <h2 className="text-sm font-semibold text-slate-200">
                Insights
              </h2>
            </div>
            <div className="space-y-2">
              {analytics.suggestions.slice(0, 3).map((s) => (
                <div
                  key={s.id}
                  className={`rounded-xl border px-3 py-2 text-xs ${
                    SEV_STYLE[s.severity]
                  }`}
                >
                  <div className="font-medium">{s.title}</div>
                  <div className="mt-0.5 opacity-90">{s.detail}</div>
                </div>
              ))}
            </div>
            <Link
              href="/analytics"
              className="mt-3 inline-flex items-center gap-1 text-xs text-brand-glow hover:underline"
            >
              See full analytics <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      <TaskModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={async (data) => {
          const created = await api.createTask(data);
          if (created.date === today) setTasks((p) => [...p, created]);
        }}
        defaultDate={today}
      />
    </>
  );
}
