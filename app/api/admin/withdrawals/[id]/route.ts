import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_API_URL || "https://bitlyfe-production.up.railway.app";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get("authorization");
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action"); // "approve" or "reject"
    const body = await request.json().catch(() => ({}));

    const endpoint = action
      ? `${BACKEND}/api/admin/withdrawals/${params.id}/${action}`
      : `${BACKEND}/api/admin/withdrawals/${params.id}`;

    const res = await fetch(endpoint, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: token } : {}),
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
