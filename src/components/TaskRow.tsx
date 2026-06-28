"use client";

import { Check, Pencil, Trash2, SkipForward, Clock } from "lucide-react";
import { CATEGORY_META, TaskDTO, TaskStatus } from "@/lib/types";

const PRIORITY_COLOR: Record<string, string> = {
  high: "#f87171",
  medium: "#fbbf24",
  low: "#64748b",
};

export default function TaskRow({
  task,
  onStatus,
  onEdit,
  onDelete,
}: {
  task: TaskDTO;
  onStatus: (status: TaskStatus) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const meta = CATEGORY_META[task.category];
  const done = task.status === "done";
  const missed = task.status === "missed";
  const skipped = task.status === "skipped";

  return (
    <div
      className={`group card flex items-center gap-3 p-3 transition ${
        done ? "opacity-70" : ""
      }`}
      style={{ borderLeft: `3px solid ${meta.color}` }}
    >
      <button
        onClick={() => onStatus(done ? "planned" : "done")}
        className={`grid h-6 w-6 shrink-0 place-items-center rounded-md border transition ${
          done
            ? "border-emerald-400 bg-emerald-400 text-ink"
            : "border-ink-line hover:border-emerald-400"
        }`}
        title={done ? "Mark as planned" : "Mark as done"}
      >
        {done && <Check className="h-4 w-4" strokeWidth={3} />}
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className={`truncate text-sm font-medium ${
              done ? "text-slate-400 line-through" : "text-slate-100"
            }`}
          >
            {task.title}
          </span>
          {task.priority === "high" && !done && (
            <span
              className="chip"
              style={{ background: "#f8717122", color: PRIORITY_COLOR.high }}
            >
              high
            </span>
          )}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500">
          <span style={{ color: meta.color }}>
            {meta.emoji} {meta.label}
          </span>
          {task.startTime && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {task.startTime}
              {task.endTime ? `–${task.endTime}` : ""}
            </span>
          )}
          {missed && <span className="text-rose-400">missed</span>}
          {skipped && <span className="text-slate-500">skipped</span>}
          {task.tags?.map((t) => (
            <span key={t} className="text-slate-600">
              #{t}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
        {!done && (
          <button
            onClick={() => onStatus(missed ? "planned" : "missed")}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-white/5 hover:text-rose-400"
            title="Mark missed"
          >
            <SkipForward className="h-4 w-4" />
          </button>
        )}
        <button
          onClick={onEdit}
          className="rounded-lg p-1.5 text-slate-500 hover:bg-white/5 hover:text-slate-200"
          title="Edit"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          onClick={onDelete}
          className="rounded-lg p-1.5 text-slate-500 hover:bg-white/5 hover:text-rose-400"
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
