import { NextRequest, NextResponse } from "next/server";

// Placeholder stats endpoint — returns dummy data for now
// TODO: Connect to backend to fetch actual referral stats
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Generate a dummy referral code based on token (deterministic for testing)
    const referralCode = `REF${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const stats = {
      referral_code: referralCode,
      referred_count: 0,
      pending_count: 0,
      completed_count: 0,
      total_earned: 0,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Referral stats error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
