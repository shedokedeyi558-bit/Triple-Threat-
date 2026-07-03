import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { game_type, title, description, entry_fee, category, stake_amount, prize_pool, max_participants, countdown_duration } = body;

    // Validate required fields
    if (!game_type || !title) {
      return NextResponse.json(
        { success: false, error: "game_type and title are required" },
        { status: 400 }
      );
    }

    // Generate mock game
    const newGame = {
      id: `game-${Date.now()}`,
      game_type,
      title,
      description: description || "",
      status: "draft",
      ...(game_type === "door_game"
        ? {
            entry_fee: entry_fee || 500,
            stats: { total_players: 0, revenue: 0 },
          }
        : {
            category,
            stake_amount: stake_amount || 1000,
            prize_pool: prize_pool || 10000,
            max_participants: max_participants || 20,
            current_participants: 0,
            countdown_duration: countdown_duration || 60,
            ends_at: null,
            answer_revealed_at: null,
          }),
      created_at: new Date().toISOString(),
    };

    return NextResponse.json(
      { success: true, data: { game: newGame } },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to create game" },
      { status: 500 }
    );
  }
}
