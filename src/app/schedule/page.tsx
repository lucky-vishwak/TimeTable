"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, ChevronLeft, ChevronRight, CalendarClock } from "lucide-react";
import { api } from "@/lib/api";
import { TaskDTO, TaskStatus, SettingsDTO } from "@/lib/types";
import { toDayKey, fromDayKey, addDays, prettyDate, minutesOf } from "@/lib/date";
import TaskRow from "@/components/TaskRow";
import TaskModal from "@/components/TaskModal";
import { PageHeader, Spinner, EmptyState, ProgressRing } from "@/components/ui";

export default function SchedulePage() {
  const [day, setDay] = useState(toDayKey());
  const [tasks, setTasks] = useState<TaskDTO[]>([]);
  const [settings, setSettings] = useState<SettingsDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TaskDTO | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [t, s] = await Promise.all([
      api.getTasks({ date: day }),
      settings ? Promise.resolve(settings) : api.getSettings(),
    ]);
    setTasks(t);
    setSettings(s);
    setLoading(false);
  }, [day]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    load();
  }, [load]);

  const sorted = useMemo(
    () =>
      [...tasks].sort((a, b) => {
        const am = minutesOf(a.startTime) ?? 9999;
        const bm = minutesOf(b.startTime) ?? 9999;
        return am - bm;
      }),
    [tasks]
  );

  const doneCount = tasks.filter((t) => t.status === "done").length;
  const considered = tasks.filter((t) => t.status !== "skipped").length;
  const pct = considered ? Math.round((doneCount / considered) * 100) : 0;

  async function setStatus(task: TaskDTO, status: TaskStatus) {
    setTasks((prev) =>
      prev.map((t) => (t._id === task._id ? { ...t, status } : t))
    );
    await api.updateTask(task._id, { status });
  }

  async function save(data: Partial<TaskDTO>) {
    if (editing) {
      const updated = await api.updateTask(editing._id, data);
      setTasks((p) => p.map((t) => (t._id === editing._id ? updated : t)));
    } else {
      const created = await api.createTask(data);
      if (created.date === day) setTasks((p) => [...p, created]);
    }
    setEditing(null);
  }

  async function remove(task: TaskDTO) {
    setTasks((p) => p.filter((t) => t._id !== task._id));
    await api.deleteTask(task._id);
  }

  const isToday = day === toDayKey();

  return (
    <>
      <PageHeader
        title="Day Schedule"
        subtitle="Your timeline for the day — add, complete and track tasks."
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

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            className="btn-ghost px-2"
            onClick={() => setDay(toDayKey(addDays(fromDayKey(day), -1)))}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="card flex items-center gap-2 px-4 py-2">
            <CalendarClock className="h-4 w-4 text-brand-glow" />
            <span className="text-sm font-medium">{prettyDate(day)}</span>
            {isToday && (
              <span className="chip bg-brand/20 text-brand-glow">Today</span>
            )}
          </div>
          <button
            className="btn-ghost px-2"
            onClick={() => setDay(toDayKey(addDays(fromDayKey(day), 1)))}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          {!isToday && (
            <button className="btn-ghost" onClick={() => setDay(toDayKey())}>
              Today
            </button>
          )}
        </div>

        <div className="card flex items-center gap-3 px-4 py-2">
          <ProgressRing value={pct} size={42} stroke={5} label={`${pct}%`} />
          <div className="text-xs text-slate-400">
            <div className="font-medium text-slate-200">
              {doneCount}/{considered} done
            </div>
            <div>tasks today</div>
          </div>
        </div>
      </div>

      {settings && (
        <div className="mb-6 flex flex-wrap gap-2 text-xs text-slate-400">
          <span className="chip border border-ink-line bg-ink-card/60">
            🏢 Office {settings.officeStart}–{settings.officeEnd}
          </span>
          <span className="chip border border-ink-line bg-ink-card/60">
            🌅 Wake {settings.wakeTime}
          </span>
          <span className="chip border border-ink-line bg-ink-card/60">
            💻 Coding goal {settings.dailyCodingMinutesGoal}m
          </span>
        </div>
      )}

      {loading ? (
        <Spinner />
      ) : sorted.length === 0 ? (
        <EmptyState
          title="No tasks for this day"
          hint="Add your first task to start building your schedule."
          action={
            <button
              className="btn-primary mt-2"
              onClick={() => {
                setEditing(null);
                setModalOpen(true);
              }}
            >
              <Plus className="h-4 w-4" /> Add task
            </button>
          }
        />
      ) : (
        <div className="space-y-2">
          {sorted.map((t) => (
            <TaskRow
              key={t._id}
              task={t}
              onStatus={(s) => setStatus(t, s)}
              onEdit={() => {
                setEditing(t);
                setModalOpen(true);
              }}
              onDelete={() => remove(t)}
            />
          ))}
        </div>
      )}

      <TaskModal
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
