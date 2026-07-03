import { NextRequest, NextResponse } from "next/server";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const mockGames: Record<string, any> = {
    "game-1": {
      id: "game-1",
      game_type: "door_game",
      title: "Daily Quiz #42",
      description: "Test your knowledge with daily trivia",
      status: "active",
      entry_fee: 500,
      stats: { total_players: 156, revenue: 78000 },
      created_at: "2024-01-15T10:00:00Z",
    },
    "challenge-1": {
      id: "challenge-1",
      game_type: "challenge_game",
      title: "How many goals today?",
      description: "Chelsea vs Arsenal prediction challenge",
      status: "active",
      category: "Football",
      stake_amount: 1000,
      prize_pool: 16000,
      max_participants: 20,
      current_participants: 18,
      countdown_duration: 60,
      ends_at: "2024-01-15T16:00:00Z",
      answer_revealed_at: null,
      created_at: "2024-01-15T12:00:00Z",
    },
  };

  const game = mockGames[params.id];
  if (!game) {
    return NextResponse.json(
      { success: false, error: "Game not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: { game },
  });
}
