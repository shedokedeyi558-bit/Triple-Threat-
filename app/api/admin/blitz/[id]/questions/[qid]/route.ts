import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_API_URL || "https://bitlyfe-production.up.railway.app";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; qid: string } }
) {
  try {
    const token = request.headers.get("authorization");
    const res = await fetch(`${BACKEND}/api/admin/blitz/${params.id}/questions/${params.qid}`, {
      method: "DELETE",
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
