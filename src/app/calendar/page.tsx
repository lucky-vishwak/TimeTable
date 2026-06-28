"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { api } from "@/lib/api";
import { TaskDTO, CATEGORY_META, TaskStatus } from "@/lib/types";
import { toDayKey, WEEKDAYS, prettyDate } from "@/lib/date";
import { PageHeader, Spinner } from "@/components/ui";
import TaskRow from "@/components/TaskRow";
import TaskModal from "@/components/TaskModal";

function monthMatrix(year: number, month: number) {
  const first = new Date(year, month, 1);
  const startOffset = first.getDay(); // 0 Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(
      `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`
    );
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export default function CalendarPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [tasks, setTasks] = useState<TaskDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(toDayKey());
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TaskDTO | null>(null);

  const cells = useMemo(() => monthMatrix(year, month), [year, month]);
  const from = cells.find((c) => c) as string;
  const to = [...cells].reverse().find((c) => c) as string;

  async function load() {
    setLoading(true);
    const t = await api.getTasks({ from, to });
    setTasks(t);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, [year, month]); // eslint-disable-line react-hooks/exhaustive-deps

  const byDay = useMemo(() => {
    const m: Record<string, TaskDTO[]> = {};
    tasks.forEach((t) => {
      (m[t.date] = m[t.date] || []).push(t);
    });
    return m;
  }, [tasks]);

  const dayTasks = byDay[selected] || [];

  function prevMonth() {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  }

  async function setStatus(task: TaskDTO, status: TaskStatus) {
    setTasks((p) => p.map((t) => (t._id === task._id ? { ...t, status } : t)));
    await api.updateTask(task._id, { status });
  }
  async function save(data: Partial<TaskDTO>) {
    if (editing) {
      const u = await api.updateTask(editing._id, data);
      setTasks((p) => p.map((t) => (t._id === editing._id ? u : t)));
    } else {
      const c = await api.createTask(data);
      setTasks((p) => [...p, c]);
    }
    setEditing(null);
  }

  const monthName = new Date(year, month).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  return (
    <>
      <PageHeader
        title="Calendar"
        subtitle="See your whole month. Click a day to view and plan tasks."
        action={
          <div className="flex items-center gap-2">
            <button className="btn-ghost px-2" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="min-w-[140px] text-center text-sm font-medium">
              {monthName}
            </span>
            <button className="btn-ghost px-2" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {loading ? (
            <Spinner />
          ) : (
            <div className="card overflow-hidden p-3">
              <div className="mb-2 grid grid-cols-7 text-center text-xs font-medium text-slate-500">
                {WEEKDAYS.map((d) => (
                  <div key={d} className="py-1">
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1.5">
                {cells.map((c, i) => {
                  if (!c) return <div key={i} />;
                  const list = byDay[c] || [];
                  const isToday = c === toDayKey();
                  const isSel = c === selected;
                  const dayNum = Number(c.split("-")[2]);
                  const done = list.filter((t) => t.status === "done").length;
                  return (
                    <button
                      key={c}
                      onClick={() => setSelected(c)}
                      className={`group relative flex min-h-[64px] flex-col rounded-xl border p-1.5 text-left transition sm:min-h-[84px] ${
                        isSel
                          ? "border-brand bg-brand/10"
                          : "border-ink-line bg-ink-soft/40 hover:border-brand/40"
                      }`}
                    >
                      <span
                        className={`text-xs ${
                          isToday
                            ? "grid h-5 w-5 place-items-center rounded-full bg-brand font-semibold text-white"
                            : "text-slate-400"
                        }`}
                      >
                        {dayNum}
                      </span>
                      <div className="mt-1 flex flex-wrap gap-0.5">
                        {list.slice(0, 4).map((t) => (
                          <span
                            key={t._id}
                            className="h-1.5 w-1.5 rounded-full"
                            style={{
                              background: CATEGORY_META[t.category].color,
                              opacity: t.status === "done" ? 0.4 : 1,
                            }}
                          />
                        ))}
                      </div>
                      {list.length > 0 && (
                        <span className="mt-auto text-[10px] text-slate-500">
                          {done}/{list.length}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Selected day panel */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-200">
              {prettyDate(selected)}
            </h2>
            <button
              className="btn-ghost px-2 py-1 text-xs"
              onClick={() => {
                setEditing(null);
                setModalOpen(true);
              }}
            >
              <Plus className="h-3.5 w-3.5" /> Add
            </button>
          </div>
          {dayTasks.length === 0 ? (
            <div className="card p-6 text-center text-sm text-slate-500">
              No tasks. Click “Add” to plan this day.
            </div>
          ) : (
            <div className="space-y-2">
              {dayTasks.map((t) => (
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
        defaultDate={selected}
      />
    </>
  );
}
