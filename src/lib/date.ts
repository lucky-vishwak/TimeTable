// Lightweight date helpers. All "day keys" are local-time YYYY-MM-DD strings
// so a task on a given day stays on that day regardless of timezone math.

export function toDayKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function fromDayKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function nowHHmm(d: Date = new Date()): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes()
  ).padStart(2, "0")}`;
}

export function minutesOf(hhmm?: string): number | null {
  if (!hhmm || !/^\d{1,2}:\d{2}$/.test(hhmm)) return null;
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function durationBetween(start?: string, end?: string): number {
  const s = minutesOf(start);
  const e = minutesOf(end);
  if (s == null || e == null) return 0;
  return Math.max(0, e - s);
}

export function addDays(d: Date, n: number): Date {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
}

export function startOfWeek(d: Date): Date {
  const c = new Date(d);
  const day = c.getDay(); // 0 Sun
  c.setDate(c.getDate() - day);
  c.setHours(0, 0, 0, 0);
  return c;
}

export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const WEEKDAYS_LONG = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export function prettyDate(key: string): string {
  const d = fromDayKey(key);
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}
