import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // TODO: Replace with real backend API call
    // const response = await fetch(`${process.env.BACKEND_API_URL}/api/doors`, {
    //   headers: { Authorization: `Bearer ${token}` },
    // });
    // const data = await response.json();
    
    // For now, return empty doors list until backend is ready
    const doors: any[] = [];

    return NextResponse.json(
      {
        success: true,
        data: doors,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Server error",
      },
      { status: 500 }
    );
  }
}
