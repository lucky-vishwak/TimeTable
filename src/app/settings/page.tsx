"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Save, Send, Check } from "lucide-react";
import { api } from "@/lib/api";
import { SettingsDTO, MealType, MEAL_TYPES, ReminderDTO } from "@/lib/types";
import { WEEKDAYS } from "@/lib/date";
import { PageHeader, Spinner } from "@/components/ui";

function DayPicker({
  value,
  onChange,
}: {
  value: number[];
  onChange: (d: number[]) => void;
}) {
  return (
    <div className="flex gap-1">
      {WEEKDAYS.map((d, i) => {
        const on = value.includes(i);
        return (
          <button
            key={i}
            type="button"
            onClick={() =>
              onChange(on ? value.filter((x) => x !== i) : [...value, i].sort())
            }
            className={`h-8 w-8 rounded-lg text-xs font-medium transition ${
              on
                ? "bg-brand text-white"
                : "border border-ink-line text-slate-500 hover:text-slate-300"
            }`}
          >
            {d[0]}
          </button>
        );
      })}
    </div>
  );
}

export default function SettingsPage() {
  const [s, setS] = useState<SettingsDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string>("");

  useEffect(() => {
    api.getSettings().then((data) => {
      setS(data);
      setLoading(false);
    });
  }, []);

  if (loading || !s) return <Spinner />;

  const set = (patch: Partial<SettingsDTO>) => setS({ ...s, ...patch });

  async function save() {
    const saved = await api.saveSettings(s!);
    setS(saved as any);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  function updateReminder(i: number, patch: Partial<ReminderDTO>) {
    const reminders = s!.reminders.map((r, idx) =>
      idx === i ? { ...r, ...patch } : r
    );
    set({ reminders });
  }

  async function testNotify() {
    setTesting(true);
    setTestResult("");
    try {
      const res = await fetch("/api/notify?force=true", { method: "POST" });
      const data = await res.json();
      setTestResult(
        `${data.dueCount} reminder(s)/task(s) are due. Run "node scripts/notify.mjs --force" to pop them as macOS notifications.`
      );
    } catch (e) {
      setTestResult(`Failed: ${(e as Error).message}`);
    } finally {
      setTesting(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Personalize your schedule, goals and reminders."
        action={
          <button className="btn-primary" onClick={save}>
            {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {saved ? "Saved" : "Save changes"}
          </button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Profile + office */}
        <section className="card p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-200">
            Profile & office hours
          </h2>
          <div className="space-y-4">
            <div>
              <label className="label">Your name</label>
              <input
                className="input"
                value={s.name}
                onChange={(e) => set({ name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Office start</label>
                <input
                  type="time"
                  className="input"
                  value={s.officeStart}
                  onChange={(e) => set({ officeStart: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Office end</label>
                <input
                  type="time"
                  className="input"
                  value={s.officeEnd}
                  onChange={(e) => set({ officeEnd: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="label">Office days</label>
              <DayPicker
                value={s.officeDays}
                onChange={(officeDays) => set({ officeDays })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Wake time</label>
                <input
                  type="time"
                  className="input"
                  value={s.wakeTime}
                  onChange={(e) => set({ wakeTime: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Sleep time</label>
                <input
                  type="time"
                  className="input"
                  value={s.sleepStart}
                  onChange={(e) => set({ sleepStart: e.target.value })}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Goals */}
        <section className="card p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-200">
            Daily goals
          </h2>
          <div className="space-y-4">
            <div>
              <label className="label">Coding minutes / day</label>
              <input
                type="number"
                className="input"
                value={s.dailyCodingMinutesGoal}
                onChange={(e) =>
                  set({ dailyCodingMinutesGoal: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <label className="label">Coding tasks / day</label>
              <input
                type="number"
                className="input"
                value={s.dailyCodingTasksGoal}
                onChange={(e) =>
                  set({ dailyCodingTasksGoal: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <label className="label">Meal schedule</label>
              <div className="space-y-2">
                {MEAL_TYPES.map((meal) => {
                  const entry = s.mealSchedule.find((m) => m.meal === meal);
                  return (
                    <div key={meal} className="flex items-center gap-3">
                      <span className="w-24 text-sm capitalize text-slate-300">
                        {meal}
                      </span>
                      <input
                        type="time"
                        className="input flex-1"
                        value={entry?.time || ""}
                        onChange={(e) => {
                          const others = s.mealSchedule.filter(
                            (m) => m.meal !== meal
                          );
                          set({
                            mealSchedule: [
                              ...others,
                              { meal: meal as MealType, time: e.target.value },
                            ],
                          });
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Reminders */}
      <section className="card mt-4 p-5">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-slate-200">Reminders</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            These pop as native macOS notifications when the notify script runs
            (cron). Task reminders also fire shortly before each task starts.
          </p>
        </div>

        <div className="space-y-3">
          {s.reminders.map((r, i) => (
            <div
              key={i}
              className="rounded-xl border border-ink-line bg-ink-soft/40 p-3"
            >
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => updateReminder(i, { enabled: !r.enabled })}
                  className={`h-5 w-5 rounded-md border ${
                    r.enabled
                      ? "border-emerald-400 bg-emerald-400"
                      : "border-ink-line"
                  }`}
                >
                  {r.enabled && (
                    <Check className="h-4 w-4 text-ink" strokeWidth={3} />
                  )}
                </button>
                <input
                  className="input flex-1 min-w-[120px]"
                  value={r.label}
                  placeholder="Label"
                  onChange={(e) => updateReminder(i, { label: e.target.value })}
                />
                <input
                  type="time"
                  className="input w-28"
                  value={r.time}
                  onChange={(e) => updateReminder(i, { time: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() =>
                    set({
                      reminders: s.reminders.filter((_, idx) => idx !== i),
                    })
                  }
                  className="rounded-lg p-2 text-slate-500 hover:bg-white/5 hover:text-rose-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <input
                className="input mt-2"
                value={r.message}
                placeholder="Notification message text"
                onChange={(e) => updateReminder(i, { message: e.target.value })}
              />
              <div className="mt-2">
                <DayPicker
                  value={r.days}
                  onChange={(days) => updateReminder(i, { days })}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            className="btn-ghost"
            onClick={() =>
              set({
                reminders: [
                  ...s.reminders,
                  {
                    enabled: true,
                    label: "New reminder",
                    time: "12:00",
                    message: "",
                    days: [0, 1, 2, 3, 4, 5, 6],
                  },
                ],
              })
            }
          >
            <Plus className="h-4 w-4" /> Add reminder
          </button>
          <button className="btn-ghost" onClick={testNotify} disabled={testing}>
            <Send className="h-4 w-4" />
            {testing ? "Testing…" : "Test notify now"}
          </button>
        </div>
        {testResult && (
          <p className="mt-3 rounded-lg border border-ink-line bg-ink-soft p-3 text-xs text-slate-300">
            {testResult}
          </p>
        )}
        <p className="mt-3 text-xs text-slate-500">
          Tip: remember to click <b>Save changes</b> after editing reminders.
          Schedule <code>scripts/notify.mjs</code> via cron to get them
          automatically (see README).
        </p>
      </section>
    </>
  );
}
