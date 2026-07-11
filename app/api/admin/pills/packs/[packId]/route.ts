import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_API_URL || "https://bitlyfe-production.up.railway.app";

export async function PUT(request: NextRequest, { params }: { params: { packId: string } }) {
  try {
    const token = request.headers.get("authorization");
    const body = await request.json();
    const res = await fetch(`${BACKEND}/api/admin/pills/packs/${params.packId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: token } : {}) },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { packId: string } }) {
  try {
    const token = request.headers.get("authorization");
    const res = await fetch(`${BACKEND}/api/admin/pills/packs/${params.packId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: token } : {}) },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
