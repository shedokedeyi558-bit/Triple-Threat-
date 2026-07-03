import { NextRequest, NextResponse } from "next/server";

const settings = {
  id: 1,
  entry_fee: 500,
  min_withdrawal: 1000,
  max_daily_plays: 20,
  new_user_bonus: 0,
  auto_rotate: false,
  auto_rotate_interval: 30,
  auto_approve_withdrawals: false,
  auto_approve_limit: 1000,
  game_name: "BITLYFE",
  primary_color: "#00FF66",
  game_kill_switch: false,
  payout_bank_name: "Opay",
  payout_account_name: "BITLYFE Games",
  payout_account_number: "9012345678",
};

export async function GET() {
  return NextResponse.json({ success: true, data: { settings } });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const updated = { ...settings, ...body };
  return NextResponse.json({ success: true, data: { settings: updated } });
}
