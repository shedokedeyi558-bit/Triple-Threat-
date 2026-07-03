import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, name } = body;

    if (!phone) {
      return NextResponse.json(
        { success: false, error: "Phone is required" },
        { status: 400 }
      );
    }

    // Forward to production backend
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "https://bitlyfe-production.up.railway.app";
    const res = await fetch(`${backendUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, name }),
    });

    const data = await res.json();

    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { success: false, error: "Server error. Please try again." },
      { status: 500 }
    );
  }
}
