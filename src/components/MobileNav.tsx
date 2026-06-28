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
} from "lucide-react";

const nav = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/schedule", label: "Day", icon: ListTodo },
  { href: "/calendar", label: "Cal", icon: CalendarDays },
  { href: "/tasks", label: "Tasks", icon: Rocket },
  { href: "/food", label: "Food", icon: Utensils },
  { href: "/journal", label: "Journal", icon: BookHeart },
  { href: "/analytics", label: "Stats", icon: BarChart3 },
];

export default function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-ink-line bg-ink-soft/90 backdrop-blur-md lg:hidden">
      {nav.map(({ href, label, icon: Icon }) => {
        const active =
          href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] ${
              active ? "text-brand-glow" : "text-slate-500"
            }`}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
