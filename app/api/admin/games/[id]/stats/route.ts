import { NextRequest, NextResponse } from "next/server";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  return NextResponse.json({
    success: true,
    data: {
      game: { id: params.id },
      stats: {
        total_players: 18,
        total_revenue: 18000,
        total_payout: 16000,
        profit: 2000,
        completion_rate: 0.95,
      },
    },
  });
}
