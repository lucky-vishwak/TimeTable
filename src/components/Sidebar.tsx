"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  ListTodo,
  Rocket,
  Utensils,
  BookHeart,
  BarChart3,
  Settings as SettingsIcon,
  Clock3,
} from "lucide-react";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/schedule", label: "Day Schedule", icon: ListTodo },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/tasks", label: "Tasks", icon: Rocket },
  { href: "/food", label: "Food", icon: Utensils },
  { href: "/journal", label: "Journal", icon: BookHeart },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-ink-line bg-ink-soft/60 px-4 py-6 backdrop-blur-md lg:flex">
      <div className="mb-8 flex items-center gap-3 px-2">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand shadow-glow">
          <Clock3 className="h-5 w-5 text-white" />
        </div>
        <div>
          <div className="text-sm font-semibold leading-tight">TimeTable</div>
          <div className="text-xs text-slate-400">your day, mastered</div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {nav.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                active
                  ? "bg-brand/15 text-white shadow-[inset_0_0_0_1px_rgba(108,92,231,.35)]"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
              }`}
            >
              <Icon
                className={`h-[18px] w-[18px] ${
                  active ? "text-brand-glow" : "text-slate-500 group-hover:text-slate-300"
                }`}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-4 rounded-xl border border-ink-line bg-ink-card/60 p-3 text-xs text-slate-400">
        <p className="font-medium text-slate-300">Stay on track</p>
        <p className="mt-1 leading-relaxed">
          macOS reminders fire from the notify script based on your schedule.
        </p>
      </div>
    </aside>
  );
}
