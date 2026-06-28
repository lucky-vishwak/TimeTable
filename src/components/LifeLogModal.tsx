"use client";

import { useEffect, useState } from "react";
import { X, Star } from "lucide-react";
import {
  LifeLogDTO,
  LifeLogType,
  LIFELOG_TYPES,
  LIFELOG_META,
} from "@/lib/types";

export default function LifeLogModal({
  open,
  onClose,
  onSave,
  initial,
  defaultDate,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (
    data: Omit<Partial<LifeLogDTO>, "people"> & { people?: string }
  ) => Promise<void>;
  initial?: LifeLogDTO | null;
  defaultDate: string;
}) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<LifeLogType>("movie");
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [people, setPeople] = useState("");
  const [notes, setNotes] = useState("");
  const [rating, setRating] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(initial?.title ?? "");
      setType(initial?.type ?? "movie");
      setDate(initial?.date ?? defaultDate);
      setTime(initial?.time ?? "");
      setLocation(initial?.location ?? "");
      setPeople((initial?.people ?? []).join(", "));
      setNotes(initial?.notes ?? "");
      setRating(initial?.rating ?? 0);
    }
  }, [open, initial, defaultDate]);

  if (!open) return null;

  async function submit() {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        type,
        date,
        time,
        location,
        people,
        notes,
        rating,
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
            {initial ? "Edit memory" : "Add to your day"}
          </h3>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-white/5">
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="label">What happened?</label>
            <input
              autoFocus
              className="input"
              placeholder="e.g. Watched Dune with the gang"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Type</label>
            <div className="flex flex-wrap gap-2">
              {LIFELOG_TYPES.map((t) => {
                const meta = LIFELOG_META[t];
                const active = type === t;
                return (
                  <button
                    key={t}
                    onClick={() => setType(t)}
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Location</label>
              <input
                className="input"
                placeholder="e.g. PVR Cinemas"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <div>
              <label className="label">People (comma sep)</label>
              <input
                className="input"
                placeholder="Arjun, Sneha"
                value={people}
                onChange={(e) => setPeople(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea
              className="input min-h-[70px] resize-y"
              placeholder="How was it? Anything to remember…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Rating</label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setRating(rating === n ? 0 : n)}
                  className="p-0.5"
                  title={`${n} star${n > 1 ? "s" : ""}`}
                >
                  <Star
                    className="h-6 w-6 transition"
                    fill={n <= rating ? "#fbbf24" : "none"}
                    stroke={n <= rating ? "#fbbf24" : "#475569"}
                  />
                </button>
              ))}
              {rating > 0 && (
                <button
                  className="ml-2 text-xs text-slate-500 hover:text-slate-300"
                  onClick={() => setRating(0)}
                >
                  clear
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={submit}
            disabled={saving || !title.trim()}
          >
            {saving ? "Saving…" : initial ? "Save" : "Add memory"}
          </button>
        </div>
      </div>
    </div>
  );
}
