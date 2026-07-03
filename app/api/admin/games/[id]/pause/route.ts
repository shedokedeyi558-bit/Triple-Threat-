import { NextRequest, NextResponse } from "next/server";

export async function POST(_: NextRequest, { params }: { params: { id: string } }) {
  return NextResponse.json({
    success: true,
    data: { message: "Game paused" },
  });
}
