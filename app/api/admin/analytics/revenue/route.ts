import { NextResponse } from "next/server";

export async function GET() {
  const revenue = [
    { period: "2024-01-15T08:00", revenue: 4500, payouts: 2000, profit: 2500, plays: 9 },
    { period: "2024-01-15T09:00", revenue: 7200, payouts: 3500, profit: 3700, plays: 14 },
    { period: "2024-01-15T10:00", revenue: 9800, payouts: 4200, profit: 5600, plays: 20 },
    { period: "2024-01-15T11:00", revenue: 8500, payouts: 3800, profit: 4700, plays: 17 },
    { period: "2024-01-15T12:00", revenue: 11200, payouts: 5500, profit: 5700, plays: 22 },
    { period: "2024-01-15T13:00", revenue: 10400, payouts: 4800, profit: 5600, plays: 21 },
    { period: "2024-01-15T14:00", revenue: 16700, payouts: 8700, profit: 8000, plays: 33 },
    { period: "2024-01-15T15:00", revenue: 9100, payouts: 4200, profit: 4900, plays: 18 },
  ];
  return NextResponse.json({ success: true, data: { revenue } });
}
