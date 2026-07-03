import { NextResponse } from "next/server";

export async function GET() {
  const activity = Array.from({ length: 24 }, (_, i) => ({
    hour: String(i).padStart(2, "0") + ":00",
    plays: Math.floor(Math.random() * 30),
  }));
  return NextResponse.json({ success: true, data: { activity } });
}
