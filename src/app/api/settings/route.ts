import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { Settings, DEFAULT_SETTINGS_KEY } from "@/lib/models/Settings";
import { serialize } from "@/lib/serialize";

export const dynamic = "force-dynamic";

async function getOrCreate() {
  let s = await Settings.findOne({ key: DEFAULT_SETTINGS_KEY });
  if (!s) s = await Settings.create({ key: DEFAULT_SETTINGS_KEY });
  return s;
}

// GET /api/settings  — returns the single settings doc (creating defaults if needed)
export async function GET() {
  await dbConnect();
  const s = await getOrCreate();
  return NextResponse.json(serialize(s.toObject()));
}

// PUT /api/settings  — upsert settings
export async function PUT(req: NextRequest) {
  await dbConnect();
  const body = await req.json();
  delete body._id;
  delete body.key;
  const s = await Settings.findOneAndUpdate(
    { key: DEFAULT_SETTINGS_KEY },
    { $set: body },
    { new: true, upsert: true, runValidators: true }
  ).lean();
  return NextResponse.json(serialize(s));
}
