"use client";

import { useEffect, useState } from "react";
import { Plus, Rocket, Flame, Target } from "lucide-react";
import { api } from "@/lib/api";
import { TaskDTO, SettingsDTO, TaskStatus } from "@/lib/types";
import { toDayKey, addDays, WEEKDAYS } from "@/lib/date";
import { PageHeader, StatCard, ProgressRing, Spinner } from "@/components/ui";
import TaskRow from "@/components/TaskRow";
import TaskModal from "@/components/TaskModal";

// "Tasks" = the focus category: any productive / growth work — building
// projects, learning new tech, coding, deep work, etc.
export default function TasksPage() {
  const today = toDayKey();
  const [tasks, setTasks] = useState<TaskDTO[]>([]);
  const [settings, setSettings] = useState<SettingsDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TaskDTO | null>(null);

  const from = toDayKey(addDays(new Date(), -13));

  async function load() {
    setLoading(true);
    const [t, s] = await Promise.all([
      api.getTasks({ from, to: today, category: "focus" }),
      api.getSettings(),
    ]);
    setTasks(t);
    setSettings(s);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading || !settings) return <Spinner />;

  const minutesFor = (t: TaskDTO) => t.actualMinutes || t.plannedMinutes || 0;

  const todayTasks = tasks.filter((t) => t.date === today);
  const todayDone = todayTasks.filter((t) => t.status === "done");
  const todayMinutes = todayDone.reduce((s, t) => s + minutesFor(t), 0);
  const goalPct = Math.min(
    100,
    Math.round((todayMinutes / settings.dailyFocusMinutesGoal) * 100)
  );

  // Build last 14 days minutes + streak
  const last14: { date: string; minutes: number; hit: boolean }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = toDayKey(addDays(new Date(), -i));
    const minutes = tasks
      .filter((t) => t.date === d && t.status === "done")
      .reduce((s, t) => s + minutesFor(t), 0);
    last14.push({
      date: d,
      minutes,
      hit: minutes >= settings.dailyFocusMinutesGoal,
    });
  }
  let streak = 0;
  for (let i = last14.length - 1; i >= 0; i--) {
    if (last14[i].hit) streak++;
    else break;
  }
  const maxMin = Math.max(
    settings.dailyFocusMinutesGoal,
    ...last14.map((d) => d.minutes),
    1
  );

  async function setStatus(task: TaskDTO, status: TaskStatus) {
    setTasks((p) => p.map((t) => (t._id === task._id ? { ...t, status } : t)));
    await api.updateTask(task._id, { status });
  }
  async function save(data: Partial<TaskDTO>) {
    const payload = { ...data, category: "focus" as const };
    if (editing) {
      const u = await api.updateTask(editing._id, payload);
      setTasks((p) => p.map((t) => (t._id === editing._id ? u : t)));
    } else {
      const c = await api.createTask(payload);
      setTasks((p) => [...p, c]);
    }
    setEditing(null);
  }

  return (
    <>
      <PageHeader
        title="Tasks 🚀"
        subtitle="Any productive work — projects, learning, coding, deep work. Hit your daily focus goal."
        action={
          <button
            className="btn-primary"
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> New task
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="Today"
          value={`${todayMinutes}m`}
          hint={`of ${settings.dailyFocusMinutesGoal}m goal`}
          accent="#34d399"
          icon={<Rocket className="h-4 w-4" />}
        />
        <StatCard
          label="Streak"
          value={`${streak}🔥`}
          hint="days hitting goal"
          accent="#fb923c"
          icon={<Flame className="h-4 w-4" />}
        />
        <StatCard
          label="Tasks today"
          value={`${todayDone.length}/${todayTasks.length}`}
          hint={`target ${settings.dailyFocusTasksGoal}`}
          accent="#6c5ce7"
          icon={<Target className="h-4 w-4" />}
        />
        <div className="card flex items-center justify-center p-4">
          <ProgressRing value={goalPct} color="#34d399" label={`${goalPct}%`} />
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold text-slate-200">
            Last 14 days
          </h2>
          <div className="flex h-40 items-end gap-1.5">
            {last14.map((d) => (
              <div
                key={d.date}
                className="group flex flex-1 flex-col items-center justify-end gap-1"
              >
                <div
                  className="w-full rounded-t-md transition-all"
                  style={{
                    height: `${(d.minutes / maxMin) * 100}%`,
                    minHeight: d.minutes ? 4 : 2,
                    background: d.hit ? "#34d399" : "#34d39955",
                  }}
                  title={`${d.date}: ${d.minutes}m`}
                />
                <span className="text-[9px] text-slate-600">
                  {WEEKDAYS[new Date(d.date).getDay()][0]}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs text-slate-500">
            <span className="h-2 w-2 rounded-full bg-emerald-400" /> goal met
            <span className="ml-3 h-2 w-2 rounded-full bg-emerald-400/40" />{" "}
            below goal
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold text-slate-200">
            Today&apos;s tasks
          </h2>
          {todayTasks.length === 0 ? (
            <div className="card p-6 text-center text-sm text-slate-500">
              No focus tasks yet today. Add one to start.
            </div>
          ) : (
            <div className="space-y-2">
              {todayTasks.map((t) => (
                <TaskRow
                  key={t._id}
                  task={t}
                  onStatus={(s) => setStatus(t, s)}
                  onEdit={() => {
                    setEditing(t);
                    setModalOpen(true);
                  }}
                  onDelete={async () => {
                    setTasks((p) => p.filter((x) => x._id !== t._id));
                    await api.deleteTask(t._id);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <TaskModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSave={save}
        initial={editing}
        defaultDate={today}
        defaultCategory="focus"
      />
    </>
  );
}
