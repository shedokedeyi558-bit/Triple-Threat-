import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await request.json();
  const { correct_answer } = body;

  // Mock reveal logic
  return NextResponse.json({
    success: true,
    data: {
      message: "Answer revealed",
      total_participants: 18,
      total_correct: 7,
      prize_per_winner: 2285, // (18 * 1000 * 0.8) / 7
      total_paid: 16000,
    },
  });
}
