import { NextRequest, NextResponse } from "next/server";

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await request.json();
  return NextResponse.json({ success: true, data: { question: { id: params.id, ...body } } });
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  return NextResponse.json({ success: true, data: { message: `Question ${params.id} deleted` } });
}
