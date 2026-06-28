"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { CATEGORIES, CATEGORY_META, TaskDTO, Category, Priority } from "@/lib/types";
import { durationBetween } from "@/lib/date";

export interface TaskDraft {
  title: string;
  notes: string;
  category: Category;
  date: string;
  startTime: string;
  endTime: string;
  priority: Priority;
  tags: string;
}

export default function TaskModal({
  open,
  onClose,
  onSave,
  initial,
  defaultDate,
  defaultCategory,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<TaskDTO>) => Promise<void>;
  initial?: TaskDTO | null;
  defaultDate: string;
  defaultCategory?: Category;
}) {
  const [draft, setDraft] = useState<TaskDraft>({
    title: "",
    notes: "",
    category: defaultCategory ?? "general",
    date: defaultDate,
    startTime: "",
    endTime: "",
    priority: "medium",
    tags: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setDraft({
        title: initial?.title ?? "",
        notes: initial?.notes ?? "",
        category: initial?.category ?? defaultCategory ?? "general",
        date: initial?.date ?? defaultDate,
        startTime: initial?.startTime ?? "",
        endTime: initial?.endTime ?? "",
        priority: initial?.priority ?? "medium",
        tags: (initial?.tags ?? []).join(", "),
      });
    }
  }, [open, initial, defaultDate, defaultCategory]);

  if (!open) return null;

  const dur = durationBetween(draft.startTime, draft.endTime);

  async function submit() {
    if (!draft.title.trim()) return;
    setSaving(true);
    try {
      await onSave({
        title: draft.title.trim(),
        notes: draft.notes,
        category: draft.category,
        date: draft.date,
        startTime: draft.startTime,
        endTime: draft.endTime,
        priority: draft.priority,
        plannedMinutes: dur,
        tags: draft.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-lg p-5 animate-fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {initial ? "Edit task" : "New task"}
          </h3>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-white/5">
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="label">Title</label>
            <input
              autoFocus
              className="input"
              placeholder="e.g. Finish API integration"
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && e.metaKey && submit()}
            />
          </div>

          <div>
            <label className="label">Category</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => {
                const meta = CATEGORY_META[c];
                const active = draft.category === c;
                return (
                  <button
                    key={c}
                    onClick={() => setDraft({ ...draft, category: c })}
                    className="chip border transition"
                    style={{
                      borderColor: active ? meta.color : "#242838",
                      background: active ? `${meta.color}22` : "transparent",
                      color: active ? meta.color : "#94a3b8",
                    }}
                  >
                    {meta.emoji} {meta.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Date</label>
              <input
                type="date"
                className="input"
                value={draft.date}
                onChange={(e) => setDraft({ ...draft, date: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Priority</label>
              <select
                className="input"
                value={draft.priority}
                onChange={(e) =>
                  setDraft({ ...draft, priority: e.target.value as Priority })
                }
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Start</label>
              <input
                type="time"
                className="input"
                value={draft.startTime}
                onChange={(e) =>
                  setDraft({ ...draft, startTime: e.target.value })
                }
              />
            </div>
            <div>
              <label className="label">End</label>
              <input
                type="time"
                className="input"
                value={draft.endTime}
                onChange={(e) => setDraft({ ...draft, endTime: e.target.value })}
              />
            </div>
          </div>
          {dur > 0 && (
            <p className="-mt-2 text-xs text-slate-500">
              Planned duration: {Math.floor(dur / 60)}h {dur % 60}m
            </p>
          )}

          <div>
            <label className="label">Notes</label>
            <textarea
              className="input min-h-[70px] resize-y"
              placeholder="Any details…"
              value={draft.notes}
              onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
            />
          </div>

          <div>
            <label className="label">Tags (comma separated)</label>
            <input
              className="input"
              placeholder="deep-work, urgent"
              value={draft.tags}
              onChange={(e) => setDraft({ ...draft, tags: e.target.value })}
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={submit}
            disabled={saving || !draft.title.trim()}
          >
            {saving ? "Saving…" : initial ? "Save changes" : "Add task"}
          </button>
        </div>
      </div>
    </div>
  );
}
