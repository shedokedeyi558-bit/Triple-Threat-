import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_API_URL || "https://bitlyfe-production.up.railway.app";

// Proxies GET /api/predictions/mine → backend GET /api/predictions/my-predictions
// Backend endpoint path confirmed as /api/predictions/my-predictions (not /mine).
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization");

    // Forward any query params the client sends (e.g. ?status=active)
    const { searchParams } = new URL(request.url);
    const qs = searchParams.toString();
    const backendUrl = `${BACKEND}/api/predictions/my-predictions${qs ? `?${qs}` : ""}`;

    const res = await fetch(backendUrl, {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: token } : {}),
      },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
