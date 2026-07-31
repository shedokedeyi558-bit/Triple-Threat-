import { NextResponse } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_API_URL || "https://bitlyfe-production.up.railway.app";

// Temporary image upload before a tournament ID exists (create flow, step 3).
// Forwards to the backend's generic blitz image upload endpoint.
export async function POST(request: Request) {
  try {
    const token = request.headers.get("authorization");
    const contentType = request.headers.get("content-type") ?? "";

    const res = await fetch(
      `${BACKEND}/api/admin/blitz/temp/questions/upload-image`,
      {
        method: "POST",
        headers: {
          "Content-Type": contentType,
          ...(token ? { Authorization: token } : {}),
        },
        body: request.body,
        // @ts-expect-error — duplex: 'half' required for streaming request body in Node 18+
        duplex: "half",
      }
    );

    // If backend returns HTML (404/500), surface a clean JSON error
    const ct = res.headers.get("content-type") ?? "";
    if (!ct.includes("application/json")) {
      return NextResponse.json(
        { success: false, error: `Upload failed (${res.status})` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("[temp upload-image proxy] error:", err);
    return NextResponse.json({ success: false, error: "Upload proxy error" }, { status: 500 });
  }
}
