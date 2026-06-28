import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { Task } from "@/lib/models/Task";
import { serialize } from "@/lib/serialize";
import { durationBetween } from "@/lib/date";

export const dynamic = "force-dynamic";

// GET /api/tasks?date=YYYY-MM-DD | ?from=&to= | ?category=
export async function GET(req: NextRequest) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const category = searchParams.get("category");

  const query: Record<string, any> = {};
  if (date) query.date = date;
  if (from && to) query.date = { $gte: from, $lte: to };
  if (category) query.category = category;

  const tasks = await Task.find(query).sort({ date: 1, startTime: 1 }).lean();
  return NextResponse.json(serialize(tasks));
}

// POST /api/tasks
export async function POST(req: NextRequest) {
  await dbConnect();
  const body = await req.json();

  if (!body.title || !body.date) {
    return NextResponse.json(
      { error: "title and date are required" },
      { status: 400 }
    );
  }

  // Auto-derive plannedMinutes from start/end if not provided.
  if (!body.plannedMinutes && body.startTime && body.endTime) {
    body.plannedMinutes = durationBetween(body.startTime, body.endTime);
  }

  const task = await Task.create(body);
  return NextResponse.json(serialize(task), { status: 201 });
}
