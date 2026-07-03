import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, phone, name } = body;

    // Validation
    if (!email || !password || !phone) {
      return NextResponse.json(
        {
          success: false,
          error: "Email, password, and phone are required",
        },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        {
          success: false,
          error: "Password must be at least 6 characters",
        },
        { status: 400 }
      );
    }

    // Check if email already exists (mock database)
    const existingEmails = ["admin@triplethreat.com", "test@example.com"];
    if (existingEmails.includes(email.toLowerCase())) {
      return NextResponse.json(
        {
          success: false,
          error: "Email already exists",
        },
        { status: 400 }
      );
    }

    // Mock: Create new user
    return NextResponse.json(
      {
        success: true,
        data: {
          token: "mock-token-" + Date.now(),
          player: {
            id: "player-" + Math.random().toString(36).substr(2, 9),
            email: email.toLowerCase(),
            phone: phone,
            name: name || null,
            balance: 0, // No welcome bonus in mock
            is_admin: false,
          },
        },
      },
      { status: 201 }
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
