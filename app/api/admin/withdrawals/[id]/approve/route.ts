import { NextRequest, NextResponse } from "next/server";

export async function PUT(_: NextRequest, { params }: { params: { id: string } }) {
  return NextResponse.json({
    success: true,
    data: {
      withdrawal: { id: params.id, status: "approved" },
      message: "Withdrawal approved",
      transferError: null,
    },
  });
}
