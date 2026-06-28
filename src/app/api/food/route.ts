import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { FoodLog } from "@/lib/models/FoodLog";
import { serialize } from "@/lib/serialize";

export const dynamic = "force-dynamic";

// GET /api/food?date= | ?from=&to=
export async function GET(req: NextRequest) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const query: Record<string, any> = {};
  if (date) query.date = date;
  if (from && to) query.date = { $gte: from, $lte: to };

  const food = await FoodLog.find(query).sort({ date: 1, time: 1 }).lean();
  return NextResponse.json(serialize(food));
}

// POST /api/food
export async function POST(req: NextRequest) {
  await dbConnect();
  const body = await req.json();
  if (!body.name || !body.date || !body.meal) {
    return NextResponse.json(
      { error: "name, date and meal are required" },
      { status: 400 }
    );
  }
  const log = await FoodLog.create(body);
  return NextResponse.json(serialize(log), { status: 201 });
}
