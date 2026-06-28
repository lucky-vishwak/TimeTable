"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";
import { TrendingUp, TrendingDown, Lightbulb, CalendarRange } from "lucide-react";
import { api } from "@/lib/api";
import { AnalyticsResult } from "@/lib/analytics";
import { CATEGORY_META, Category } from "@/lib/types";
import { toDayKey, addDays, prettyDate } from "@/lib/date";
import { PageHeader, StatCard, Spinner } from "@/components/ui";

const SEV_STYLE: Record<string, string> = {
  good: "border-emerald-500/30 bg-emerald-500/10",
  info: "border-sky-500/30 bg-sky-500/10",
  warn: "border-amber-500/30 bg-amber-500/10",
  bad: "border-rose-500/30 bg-rose-500/10",
};
const SEV_DOT: Record<string, string> = {
  good: "bg-emerald-400",
  info: "bg-sky-400",
  warn: "bg-amber-400",
  bad: "bg-rose-400",
};

const RANGES = [
  { label: "7d", days: 7 },
  { label: "14d", days: 14 },
  { label: "30d", days: 30 },
];

export default function AnalyticsPage() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<AnalyticsResult | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const a = await api.getAnalytics({
      from: toDayKey(addDays(new Date(), -(days - 1))),
      to: toDayKey(),
    });
    setData(a);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, [days]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading || !data) return <Spinner />;

  const scoreSeries = data.days.map((d) => ({
    date: d.date.slice(5),
    score: d.score,
    onTrack: d.onTrack,
  }));

  const completionSeries = data.days
    .filter((d) => d.total > 0)
    .map((d) => ({
      date: d.date.slice(5),
      completion: Math.round(d.completionRate * 100),
    }));

  const pieData = data.categorySplit
    .filter((c) => c.actualMinutes > 0)
    .map((c) => ({
      name: CATEGORY_META[c.category].label,
      value: c.actualMinutes,
      color: CATEGORY_META[c.category].color,
    }));

  const offTrackDays = data.days.filter((d) => d.total > 0 && !d.onTrack);

  return (
    <>
      <PageHeader
        title="Analytics"
        subtitle="Where you're on track, where you're slipping, and how to do better."
        action={
          <div className="flex gap-1 rounded-xl border border-ink-line bg-ink-soft p-1">
            {RANGES.map((r) => (
              <button
                key={r.days}
                onClick={() => setDays(r.days)}
                className={`rounded-lg px-3 py-1 text-xs font-medium transition ${
                  days === r.days
                    ? "bg-brand text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="Avg score"
          value={`${data.totals.avgScore}`}
          hint="/ 100"
          accent="#6c5ce7"
        />
        <StatCard
          label="On-track days"
          value={data.totals.onTrackDays}
          hint={`${data.totals.offTrackDays} off-track`}
          accent="#34d399"
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <StatCard
          label="Completion"
          value={`${Math.round(data.totals.completionRate * 100)}%`}
          hint="tasks done"
          accent="#60a5fa"
        />
        <StatCard
          label="Focus goal"
          value={data.totals.focusGoalHitDays}
          hint="days hit"
          accent="#fbbf24"
        />
      </div>

      {/* Best / worst day */}
      {(data.bestDay || data.worstDay) && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {data.bestDay && (
            <div className="card flex items-center justify-between p-4">
              <div>
                <div className="flex items-center gap-2 text-xs text-emerald-400">
                  <TrendingUp className="h-4 w-4" /> Best day
                </div>
                <div className="mt-1 font-medium">
                  {prettyDate(data.bestDay.date)}
                </div>
              </div>
              <div className="text-2xl font-semibold text-emerald-400">
                {data.bestDay.score}
              </div>
            </div>
          )}
          {data.worstDay && (
            <div className="card flex items-center justify-between p-4">
              <div>
                <div className="flex items-center gap-2 text-xs text-rose-400">
                  <TrendingDown className="h-4 w-4" /> Needs attention
                </div>
                <div className="mt-1 font-medium">
                  {prettyDate(data.worstDay.date)}
                </div>
              </div>
              <div className="text-2xl font-semibold text-rose-400">
                {data.worstDay.score}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Suggestions */}
      <div className="mt-6">
        <div className="mb-3 flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-amber-300" />
          <h2 className="text-sm font-semibold text-slate-200">
            Personalized suggestions
          </h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {data.suggestions.map((s) => (
            <div
              key={s.id}
              className={`rounded-2xl border p-4 ${SEV_STYLE[s.severity]}`}
            >
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${SEV_DOT[s.severity]}`} />
                <span className="text-sm font-semibold text-slate-100">
                  {s.title}
                </span>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
                {s.detail}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Score trend */}
      <div className="mt-6 card p-5">
        <h2 className="mb-4 text-sm font-semibold text-slate-200">
          Daily adherence score
        </h2>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={scoreSeries}>
            <defs>
              <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6c5ce7" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#6c5ce7" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#242838" />
            <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
            <YAxis domain={[0, 100]} stroke="#64748b" fontSize={11} />
            <Tooltip
              contentStyle={{
                background: "#12141d",
                border: "1px solid #242838",
                borderRadius: 12,
                fontSize: 12,
              }}
            />
            <Area
              type="monotone"
              dataKey="score"
              stroke="#8b7bf0"
              strokeWidth={2}
              fill="url(#scoreGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {/* Completion bars */}
        <div className="card p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-200">
            Task completion %
          </h2>
          {completionSeries.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500">
              No tasks in this range.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={completionSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#242838" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                <YAxis domain={[0, 100]} stroke="#64748b" fontSize={11} />
                <Tooltip
                  cursor={{ fill: "#ffffff08" }}
                  contentStyle={{
                    background: "#12141d",
                    border: "1px solid #242838",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="completion" radius={[6, 6, 0, 0]}>
                  {completionSeries.map((d, i) => (
                    <Cell
                      key={i}
                      fill={d.completion >= 70 ? "#34d399" : "#fbbf24"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Time split pie */}
        <div className="card p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-200">
            Where your time goes
          </h2>
          {pieData.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500">
              Complete some timed tasks to see your time split.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={3}
                >
                  {pieData.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Pie>
                <Legend
                  formatter={(v) => (
                    <span style={{ color: "#94a3b8", fontSize: 12 }}>{v}</span>
                  )}
                />
                <Tooltip
                  formatter={(v: number) => [`${v} min`, ""]}
                  contentStyle={{
                    background: "#12141d",
                    border: "1px solid #242838",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Off-track days list */}
      <div className="mt-4 card p-5">
        <div className="mb-3 flex items-center gap-2">
          <CalendarRange className="h-4 w-4 text-rose-400" />
          <h2 className="text-sm font-semibold text-slate-200">
            Off-track days
          </h2>
        </div>
        {offTrackDays.length === 0 ? (
          <p className="text-sm text-emerald-400">
            🎉 No off-track days in this range. Excellent consistency!
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {offTrackDays.map((d) => (
              <div
                key={d.date}
                className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs"
              >
                <div className="font-medium text-slate-200">
                  {prettyDate(d.date)}
                </div>
                <div className="text-slate-400">
                  score {d.score} · {d.done}/{d.total - d.skipped} done
                  {d.missed > 0 && ` · ${d.missed} missed`}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
