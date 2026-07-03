import { NextRequest, NextResponse } from "next/server";

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  return NextResponse.json({
    success: true,
    data: {
      player: { id: params.id, status: "banned" },
      message: "Player ban toggled",
    },
  });
}
