"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Search,
  Star,
  MapPin,
  Users,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { api } from "@/lib/api";
import {
  TaskDTO,
  FoodLogDTO,
  LifeLogDTO,
  CATEGORY_META,
  LIFELOG_META,
} from "@/lib/types";
import { toDayKey, fromDayKey, addDays, prettyDate, minutesOf } from "@/lib/date";
import { PageHeader, Spinner, EmptyState } from "@/components/ui";
import LifeLogModal from "@/components/LifeLogModal";

interface TimelineItem {
  time: string;
  sortKey: number;
  emoji: string;
  color: string;
  title: string;
  sub: string;
  kind: "task" | "meal" | "life";
  life?: LifeLogDTO;
}

const MEAL_EMOJI: Record<string, string> = {
  breakfast: "🍳",
  lunch: "🍱",
  dinner: "🍽️",
  snack: "🍎",
};

export default function JournalPage() {
  const [day, setDay] = useState(toDayKey());
  const [tasks, setTasks] = useState<TaskDTO[]>([]);
  const [food, setFood] = useState<FoodLogDTO[]>([]);
  const [life, setLife] = useState<LifeLogDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<LifeLogDTO | null>(null);

  // Search across all memories
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LifeLogDTO[] | null>(null);
  const [searching, setSearching] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [t, f, l] = await Promise.all([
      api.getTasks({ date: day }),
      api.getFood({ date: day }),
      api.getLifeLogs({ date: day }),
    ]);
    setTasks(t);
    setFood(f);
    setLife(l);
    setLoading(false);
  }, [day]);

  useEffect(() => {
    load();
  }, [load]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      return;
    }
    setSearching(true);
    const h = setTimeout(async () => {
      const r = await api.getLifeLogs({ q: query.trim() });
      setResults(r);
      setSearching(false);
    }, 350);
    return () => clearTimeout(h);
  }, [query]);

  const timeline = useMemo<TimelineItem[]>(() => {
    const items: TimelineItem[] = [];
    tasks.forEach((t) => {
      const meta = CATEGORY_META[t.category];
      const m = minutesOf(t.startTime);
      items.push({
        time: t.startTime || "",
        sortKey: m ?? 9000,
        emoji: meta.emoji,
        color: meta.color,
        title: t.title,
        sub:
          (t.status === "done"
            ? "✓ done"
            : t.status === "missed"
            ? "✗ missed"
            : t.status === "skipped"
            ? "skipped"
            : "planned") +
          ` · ${meta.label}` +
          (t.endTime ? ` · ${t.startTime}–${t.endTime}` : ""),
        kind: "task",
      });
    });
    food.forEach((f) => {
      const m = minutesOf(f.time);
      items.push({
        time: f.time || "",
        sortKey: m ?? 9100,
        emoji: MEAL_EMOJI[f.meal] || "🍽️",
        color: f.healthy ? "#34d399" : "#fb7185",
        title: f.name,
        sub: `${f.meal}${f.calories ? ` · ${f.calories} kcal` : ""} · ${
          f.healthy ? "healthy" : "unhealthy"
        }`,
        kind: "meal",
      });
    });
    life.forEach((l) => {
      const meta = LIFELOG_META[l.type];
      const m = minutesOf(l.time);
      const bits = [meta.label];
      if (l.location) bits.push(l.location);
      if (l.people?.length) bits.push(l.people.join(", "));
      items.push({
        time: l.time || "",
        sortKey: m ?? 9200,
        emoji: meta.emoji,
        color: meta.color,
        title: l.title,
        sub: bits.join(" · "),
        kind: "life",
        life: l,
      });
    });
    return items.sort((a, b) => a.sortKey - b.sortKey);
  }, [tasks, food, life]);

  async function save(
    data: Omit<Partial<LifeLogDTO>, "people"> & { people?: string }
  ) {
    if (editing) {
      const u = await api.updateLifeLog(editing._id, data);
      setLife((p) => p.map((x) => (x._id === editing._id ? u : x)));
    } else {
      const c = await api.createLifeLog(data);
      if (c.date === day) setLife((p) => [...p, c]);
    }
    setEditing(null);
  }
  async function removeLife(l: LifeLogDTO) {
    setLife((p) => p.filter((x) => x._id !== l._id));
    setResults((p) => (p ? p.filter((x) => x._id !== l._id) : p));
    await api.deleteLifeLog(l._id);
  }

  const isToday = day === toDayKey();
  const counts = {
    tasks: tasks.length,
    meals: food.length,
    life: life.length,
  };

  return (
    <>
      <PageHeader
        title="Journal"
        subtitle="Your day, end to end — tasks, meals and life moments in one timeline."
        action={
          <button
            className="btn-primary"
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Add memory
          </button>
        }
      />

      {/* Search */}
      <div className="card mb-6 flex items-center gap-2 px-3 py-2">
        <Search className="h-4 w-4 text-slate-500" />
        <input
          className="w-full bg-transparent text-sm outline-none placeholder:text-slate-500"
          placeholder="Search your memories — movies, places, people, anything…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="rounded-lg p-1 text-slate-500 hover:bg-white/5"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {results !== null ? (
        /* ---------- SEARCH RESULTS ---------- */
        <div>
          <p className="mb-3 text-xs text-slate-400">
            {searching
              ? "Searching…"
              : `${results.length} result${results.length === 1 ? "" : "s"} for “${query}”`}
          </p>
          {results.length === 0 && !searching ? (
            <EmptyState
              title="No memories found"
              hint="Try a different keyword — a place, person, or movie name."
            />
          ) : (
            <div className="space-y-2">
              {results.map((l) => (
                <button
                  key={l._id}
                  onClick={() => {
                    setQuery("");
                    setDay(l.date);
                  }}
                  className="card flex w-full items-center gap-3 p-3 text-left transition hover:border-brand/40"
                  style={{ borderLeft: `3px solid ${LIFELOG_META[l.type].color}` }}
                >
                  <span className="text-xl">{LIFELOG_META[l.type].emoji}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-slate-100">
                      {l.title}
                    </div>
                    <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-slate-500">
                      <span>{prettyDate(l.date)}</span>
                      {l.location && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {l.location}
                        </span>
                      )}
                      {!!l.people?.length && (
                        <span className="inline-flex items-center gap-1">
                          <Users className="h-3 w-3" /> {l.people.join(", ")}
                        </span>
                      )}
                    </div>
                  </div>
                  {!!l.rating && (
                    <span className="inline-flex items-center gap-0.5 text-xs text-amber-400">
                      {l.rating}
                      <Star className="h-3 w-3" fill="#fbbf24" stroke="#fbbf24" />
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ---------- DAY TIMELINE ---------- */
        <>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                className="btn-ghost px-2"
                onClick={() => setDay(toDayKey(addDays(fromDayKey(day), -1)))}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="card px-4 py-2 text-sm font-medium">
                {prettyDate(day)}
                {isToday && (
                  <span className="chip ml-2 bg-brand/20 text-brand-glow">
                    Today
                  </span>
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
            <div className="flex gap-2 text-xs text-slate-400">
              <span className="chip border border-ink-line bg-ink-card/60">
                {counts.tasks} tasks
              </span>
              <span className="chip border border-ink-line bg-ink-card/60">
                {counts.meals} meals
              </span>
              <span className="chip border border-ink-line bg-ink-card/60">
                {counts.life} moments
              </span>
            </div>
          </div>

          {loading ? (
            <Spinner />
          ) : timeline.length === 0 ? (
            <EmptyState
              title="Nothing recorded for this day yet"
              hint="Add a memory, or log tasks and meals to build the full picture."
              action={
                <button
                  className="btn-primary mt-2"
                  onClick={() => {
                    setEditing(null);
                    setModalOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4" /> Add memory
                </button>
              }
            />
          ) : (
            <div className="relative ml-3 border-l border-ink-line pl-6">
              {timeline.map((it, i) => (
                <div key={i} className="relative pb-5 last:pb-0">
                  <span
                    className="absolute -left-[31px] grid h-6 w-6 place-items-center rounded-full text-xs ring-4 ring-ink"
                    style={{ background: `${it.color}22` }}
                  >
                    {it.emoji}
                  </span>
                  <div className="group card flex items-start gap-3 p-3">
                    <div className="w-12 shrink-0 pt-0.5 text-xs font-medium text-slate-400">
                      {it.time || "—"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-slate-100">
                        {it.title}
                      </div>
                      <div className="mt-0.5 text-xs text-slate-500">
                        {it.sub}
                      </div>
                    </div>
                    {it.kind === "life" && it.life && (
                      <div className="flex items-center gap-1">
                        {!!it.life.rating && (
                          <span className="mr-1 inline-flex items-center gap-0.5 text-xs text-amber-400">
                            {it.life.rating}
                            <Star
                              className="h-3 w-3"
                              fill="#fbbf24"
                              stroke="#fbbf24"
                            />
                          </span>
                        )}
                        <button
                          onClick={() => {
                            setEditing(it.life!);
                            setModalOpen(true);
                          }}
                          className="rounded-lg p-1.5 text-slate-500 opacity-0 transition hover:bg-white/5 hover:text-slate-200 group-hover:opacity-100"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => removeLife(it.life!)}
                          className="rounded-lg p-1.5 text-slate-500 opacity-0 transition hover:bg-white/5 hover:text-rose-400 group-hover:opacity-100"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <LifeLogModal
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
