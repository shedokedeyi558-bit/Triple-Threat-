import { NextRequest, NextResponse } from "next/server";

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await request.json().catch(() => ({}));
  return NextResponse.json({
    success: true,
    data: {
      withdrawal: { id: params.id, status: "rejected", reject_reason: body.reason || "Rejected by admin" },
      message: "Withdrawal rejected",
    },
  });
}
