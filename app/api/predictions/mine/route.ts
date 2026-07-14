import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_API_URL || "https://bitlyfe-production.up.railway.app";

// Proxies GET /api/predictions/mine → backend GET /api/predictions/mine
// NOTE: This backend endpoint has not been confirmed in the backend spec.
// The My Predictions page (app/predictions/mine/page.tsx) handles 404/500 gracefully
// with an empty-state fallback, so this will not break if the backend path differs.
// If the backend uses a different path (e.g. /api/predictions/my-predictions),
// update the fetch URL below.
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization");

    // Forward any query params the client sends (e.g. ?status=active)
    const { searchParams } = new URL(request.url);
    const qs = searchParams.toString();
    const backendUrl = `${BACKEND}/api/predictions/mine${qs ? `?${qs}` : ""}`;

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
