import { NextRequest, NextResponse } from "next/server";

const players = [
  { id: "p1", phone: "08034567890", name: "Emeka Obi", balance: 2500, games_played: 18, games_won: 9, total_won: 14500, status: "active", created_at: "2024-01-01T00:00:00Z" },
  { id: "p2", phone: "07012345678", name: "Fatima Yusuf", balance: 0, games_played: 25, games_won: 11, total_won: 22000, status: "active", created_at: "2024-01-03T00:00:00Z" },
  { id: "p3", phone: "09067891234", name: "Chidi Nwosu", balance: 1000, games_played: 7, games_won: 2, total_won: 3000, status: "active", created_at: "2024-01-10T00:00:00Z" },
  { id: "p4", phone: "08109876543", name: null, balance: 0, games_played: 40, games_won: 5, total_won: 8500, status: "banned", created_at: "2023-12-20T00:00:00Z" },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";

  let filtered = players;
  if (search) filtered = filtered.filter((p) => p.phone.includes(search));
  if (status) filtered = filtered.filter((p) => p.status === status);

  return NextResponse.json({
    success: true,
    data: { players: filtered, total: filtered.length },
  });
}
