import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { Task } from "@/lib/models/Task";
import { Settings, DEFAULT_SETTINGS_KEY } from "@/lib/models/Settings";
import { serialize } from "@/lib/serialize";
import { toDayKey, nowHHmm, minutesOf } from "@/lib/date";

export const dynamic = "force-dynamic";

interface DueItem {
  kind: "reminder" | "task";
  label: string;
  message: string;
}

// Evaluate which reminders / upcoming tasks are due "now" and return them.
// scripts/notify.mjs (run by cron on the Mac) calls this and displays a native
// macOS notification for each due item.
//
// Query/body params:
//   window  : minutes tolerance around the scheduled time (default 1)
//   lead    : minutes before a task's start to remind (default 10)
//   force   : "true" to ignore time and return all of today's reminders/tasks
async function handle(req: NextRequest) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const window = Number(searchParams.get("window") ?? 1);
  const lead = Number(searchParams.get("lead") ?? 10);
  const force = searchParams.get("force") === "true";

  const now = new Date();
  const today = toDayKey(now);
  const weekday = now.getDay();
  const nowMin = minutesOf(nowHHmm(now))!;

  const settingsDoc = await Settings.findOne({ key: DEFAULT_SETTINGS_KEY }).lean();
  const settings: any =
    settingsDoc ||
    (await Settings.create({ key: DEFAULT_SETTINGS_KEY })).toObject();

  const due: DueItem[] = [];

  // 1) Configured reminders
  for (const r of settings.reminders || []) {
    if (!r.enabled) continue;
    if (!(r.days || []).includes(weekday)) continue;
    const rMin = minutesOf(r.time);
    if (rMin == null) continue;
    if (force || Math.abs(rMin - nowMin) <= window) {
      due.push({
        kind: "reminder",
        label: r.label,
        message: r.message || r.label,
      });
    }
  }

  // 2) Upcoming tasks (remind `lead` minutes before start)
  const todaysTasks = await Task.find({
    date: today,
    status: "planned",
  }).lean();
  for (const t of todaysTasks as any[]) {
    const startMin = minutesOf(t.startTime);
    if (startMin == null) continue;
    const target = startMin - lead;
    if (force || Math.abs(target - nowMin) <= window) {
      due.push({
        kind: "task",
        label: t.title,
        message: `⏰ "${t.title}" starts at ${t.startTime}${
          t.category ? ` (${t.category})` : ""
        }`,
      });
    }
  }

  return NextResponse.json({
    now: nowHHmm(now),
    today,
    dueCount: due.length,
    results: serialize(due),
  });
}

export async function GET(req: NextRequest) {
  return handle(req);
}
export async function POST(req: NextRequest) {
  return handle(req);
}
