import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // TODO: Replace with real backend API call
    // const response = await fetch(`${process.env.BACKEND_API_URL}/api/games`, {
    //   headers: { Authorization: `Bearer ${token}` },
    // });
    // const data = await response.json();
    
    // For now, return empty games list until backend is ready
    const games: any[] = [];

    return NextResponse.json({
      success: true,
      data: {
        games: games,
        total: 0,
        page: 1,
        limit: 50,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Server error",
      },
      { status: 500 }
    );
  }
}
