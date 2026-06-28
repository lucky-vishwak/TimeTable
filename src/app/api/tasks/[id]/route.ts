import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { Task } from "@/lib/models/Task";
import { serialize } from "@/lib/serialize";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

// PATCH /api/tasks/:id  — update fields / change status
export async function PATCH(req: NextRequest, { params }: Ctx) {
  await dbConnect();
  const body = await req.json();

  // When marking done, stamp completedAt.
  if (body.status === "done" && !body.completedAt) {
    body.completedAt = new Date();
  }
  if (body.status && body.status !== "done") {
    body.completedAt = null;
  }

  const task = await Task.findByIdAndUpdate(params.id, body, {
    new: true,
    runValidators: true,
  }).lean();

  if (!task) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json(serialize(task));
}

// DELETE /api/tasks/:id
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  await dbConnect();
  const res = await Task.findByIdAndDelete(params.id).lean();
  if (!res) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
