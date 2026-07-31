import { NextResponse } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_API_URL || "https://bitlyfe-production.up.railway.app";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get("authorization");
    // Forward multipart/form-data raw — do NOT call request.json() or request.formData().
    // The Content-Type header (including the multipart boundary) must pass through unchanged
    // so the backend's busboy/multer parser can correctly split the file boundary.
    const contentType = request.headers.get("content-type") ?? "";

    const res = await fetch(
      `${BACKEND}/api/admin/blitz/${params.id}/questions/upload-image`,
      {
        method: "POST",
        headers: {
          // Preserve the full Content-Type with boundary intact
          "Content-Type": contentType,
          ...(token ? { Authorization: token } : {}),
        },
        // Pass the raw ReadableStream — never JSON.stringify() a multipart body
        body: request.body,
        // @ts-expect-error — duplex: 'half' required for streaming request body in Node 18+
        duplex: "half",
      }
    );

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("[upload-image proxy] error:", err);
    return NextResponse.json({ success: false, error: "Upload proxy error" }, { status: 500 });
  }
}
