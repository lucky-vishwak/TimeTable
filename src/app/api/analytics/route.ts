import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { Task } from "@/lib/models/Task";
import { FoodLog } from "@/lib/models/FoodLog";
import { Settings, DEFAULT_SETTINGS_KEY } from "@/lib/models/Settings";
import { serialize } from "@/lib/serialize";
import { buildAnalytics } from "@/lib/analytics";
import { toDayKey, addDays } from "@/lib/date";

export const dynamic = "force-dynamic";

// GET /api/analytics?from=&to=  (defaults to last 30 days)
export async function GET(req: NextRequest) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const to = searchParams.get("to") || toDayKey();
  const from = searchParams.get("from") || toDayKey(addDays(new Date(), -29));

  const [tasks, food, settingsDoc] = await Promise.all([
    Task.find({ date: { $gte: from, $lte: to } }).lean(),
    FoodLog.find({ date: { $gte: from, $lte: to } }).lean(),
    Settings.findOne({ key: DEFAULT_SETTINGS_KEY }).lean(),
  ]);

  const settings: any =
    settingsDoc ||
    (await Settings.create({ key: DEFAULT_SETTINGS_KEY })).toObject();

  const result = buildAnalytics(
    from,
    to,
    serialize(tasks),
    serialize(food),
    serialize(settings)
  );

  return NextResponse.json(result);
}
