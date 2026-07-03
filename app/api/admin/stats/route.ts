import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      playsToday: 342,
      revenueToday: 68400,
      payoutsToday: 32500,
      profitToday: 35900,
      totalPlayers: 1250,
      pendingWithdrawals: 3,
    },
  });
}
