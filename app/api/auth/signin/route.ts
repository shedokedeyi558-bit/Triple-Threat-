import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Mock user credentials for testing
    if (email === "admin@triplethreat.com" && password === "admin123") {
      return NextResponse.json(
        {
          success: true,
          data: {
            token: "mock-token-" + Date.now(),
            player: {
              id: "admin-1",
              email: "admin@triplethreat.com",
              phone: "08000000000",
              name: "Admin User",
              balance: 50000,
              is_admin: true,
            },
          },
        },
        { status: 200 }
      );
    }

    // Mock regular user for testing
    if (email === "test@example.com" && password === "password123") {
      return NextResponse.json(
        {
          success: true,
          data: {
            token: "mock-token-" + Date.now(),
            player: {
              id: "player-1",
              email: "test@example.com",
              phone: "08111111111",
              name: "Test Player",
              balance: 5000,
              is_admin: false,
            },
          },
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Invalid email or password",
      },
      { status: 401 }
    );
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
