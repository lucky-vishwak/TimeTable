import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { Task } from "@/lib/models/Task";
import { Settings, DEFAULT_SETTINGS_KEY } from "@/lib/models/Settings";
import { serialize } from "@/lib/serialize";
import { sendSms } from "@/lib/sms";
import { toDayKey, nowHHmm, minutesOf } from "@/lib/date";

export const dynamic = "force-dynamic";

interface DueItem {
  kind: "reminder" | "task";
  label: string;
  message: string;
}

// Evaluate what notifications are due "now" (within a window) and optionally
// send them. Designed to be called every minute by scripts/notify.mjs (cron).
//
// Query/body params:
//   window  : minutes tolerance around the scheduled time (default 1)
//   lead    : minutes before a task's start to remind (default 10)
//   force   : "true" to ignore time and preview all of today's reminders
//   dry     : "true" to never actually send (preview only)
async function handle(req: NextRequest) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const window = Number(searchParams.get("window") ?? 1);
  const lead = Number(searchParams.get("lead") ?? 10);
  const force = searchParams.get("force") === "true";
  const dry = searchParams.get("dry") === "true";

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

  // Send
  const results = [];
  const reallySend = settings.smsEnabled && !dry;
  for (const item of due) {
    if (reallySend) {
      const r = await sendSms(item.message);
      results.push({ ...item, sent: r.sent, detail: r.detail });
    } else {
      results.push({
        ...item,
        sent: false,
        detail: dry
          ? "[dry] not sent"
          : "[smsEnabled=false] not sent",
      });
    }
  }

  return NextResponse.json({
    now: nowHHmm(now),
    today,
    smsEnabled: !!settings.smsEnabled,
    dueCount: due.length,
    results: serialize(results),
  });
}

export async function GET(req: NextRequest) {
  return handle(req);
}
export async function POST(req: NextRequest) {
  return handle(req);
}
