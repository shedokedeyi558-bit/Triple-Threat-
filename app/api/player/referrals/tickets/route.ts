import { NextRequest, NextResponse } from "next/server";

// Placeholder tickets endpoint — returns empty array for now
// TODO: Connect to backend to fetch actual referral tickets
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tickets = {
      tickets: [],
    };

    return NextResponse.json(tickets);
  } catch (error) {
    console.error("Referral tickets error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
