import { NextRequest, NextResponse } from "next/server";

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await request.json();
  return NextResponse.json({
    success: true,
    data: {
      door: {
        id: Number(params.id),
        status: body.status || "active",
        prize: body.prize || 500,
        entry_fee: body.entry_fee || 100,
        question_id: body.question_id || null,
        questions: null,
      },
    },
  });
}
