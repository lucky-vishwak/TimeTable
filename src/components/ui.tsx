"use client";

import { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4 animate-fade-up">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
        )}
      </div>
      {action}
    </header>
  );
}

export function StatCard({
  label,
  value,
  hint,
  accent = "#6c5ce7",
  icon,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  accent?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="card p-4 animate-fade-up">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
          {label}
        </span>
        {icon && (
          <span
            className="grid h-8 w-8 place-items-center rounded-lg"
            style={{ background: `${accent}22`, color: accent }}
          >
            {icon}
          </span>
        )}
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight">{value}</div>
      {hint && <div className="mt-1 text-xs text-slate-500">{hint}</div>}
    </div>
  );
}

export function ProgressRing({
  value,
  size = 64,
  stroke = 7,
  color = "#6c5ce7",
  label,
}: {
  value: number; // 0..100
  size?: number;
  stroke?: number;
  color?: string;
  label?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const offset = c - (pct / 100) * c;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#242838"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset .6s cubic-bezier(.16,1,.3,1)" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-xs font-semibold">
        {label ?? `${Math.round(pct)}`}
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="card grid place-items-center gap-2 px-6 py-14 text-center">
      <div className="text-3xl">🗓️</div>
      <p className="text-sm font-medium text-slate-200">{title}</p>
      {hint && <p className="max-w-sm text-xs text-slate-500">{hint}</p>}
      {action}
    </div>
  );
}

export function Spinner() {
  return (
    <div className="grid place-items-center py-20">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink-line border-t-brand" />
    </div>
  );
}
