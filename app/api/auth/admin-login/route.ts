import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Mock admin credentials
    if (email === "admin@triplethreat.com" && password === "admin123") {
      return NextResponse.json(
        {
          success: true,
          data: {
            token: "mock-admin-token-" + Date.now(),
            admin: {
              id: "admin-1",
              email: "admin@triplethreat.com",
            },
          },
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Invalid credentials",
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
