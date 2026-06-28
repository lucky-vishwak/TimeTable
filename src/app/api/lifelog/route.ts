import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { LifeLog } from "@/lib/models/LifeLog";
import { serialize } from "@/lib/serialize";

export const dynamic = "force-dynamic";

// GET /api/lifelog?date= | ?from=&to= | ?q=search | ?type=
export async function GET(req: NextRequest) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const type = searchParams.get("type");
  const q = searchParams.get("q")?.trim();

  const query: Record<string, any> = {};
  if (date) query.date = date;
  if (from && to) query.date = { $gte: from, $lte: to };
  if (type) query.type = type;
  if (q) {
    // Case-insensitive match across title/notes/location/people.
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    query.$or = [
      { title: rx },
      { notes: rx },
      { location: rx },
      { people: rx },
    ];
  }

  const logs = await LifeLog.find(query)
    .sort({ date: -1, time: 1 })
    .limit(q ? 200 : 0)
    .lean();
  return NextResponse.json(serialize(logs));
}

// POST /api/lifelog
export async function POST(req: NextRequest) {
  await dbConnect();
  const body = await req.json();
  if (!body.title || !body.date) {
    return NextResponse.json(
      { error: "title and date are required" },
      { status: 400 }
    );
  }
  if (typeof body.people === "string") {
    body.people = body.people
      .split(",")
      .map((p: string) => p.trim())
      .filter(Boolean);
  }
  const log = await LifeLog.create(body);
  return NextResponse.json(serialize(log), { status: 201 });
}
