import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { LifeLog } from "@/lib/models/LifeLog";
import { serialize } from "@/lib/serialize";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  await dbConnect();
  const body = await req.json();
  if (typeof body.people === "string") {
    body.people = body.people
      .split(",")
      .map((p: string) => p.trim())
      .filter(Boolean);
  }
  const log = await LifeLog.findByIdAndUpdate(params.id, body, {
    new: true,
    runValidators: true,
  }).lean();
  if (!log) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(serialize(log));
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  await dbConnect();
  const res = await LifeLog.findByIdAndDelete(params.id).lean();
  if (!res) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
