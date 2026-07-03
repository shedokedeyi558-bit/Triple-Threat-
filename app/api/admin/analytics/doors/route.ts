import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      doors: [
        { doorId: 1, plays: 154, wins: 72, revenue: 30800, payouts: 14400 },
        { doorId: 2, plays: 120, wins: 48, revenue: 24000, payouts: 19200 },
        { doorId: 3, plays: 68, wins: 18, revenue: 13600, payouts: 18000 },
      ],
    },
  });
}
