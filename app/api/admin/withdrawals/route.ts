import { NextRequest, NextResponse } from "next/server";

const withdrawals = [
  { id: "w1", player_id: "p1", phone: "08034567890", amount: 2000, method: "PalmPay", account_number: "8123456789", bank_name: "PalmPay", status: "pending", reject_reason: null, created_at: "2024-01-15T14:35:00Z" },
  { id: "w2", player_id: "p2", phone: "07012345678", amount: 5000, method: "Bank Transfer", account_number: "0123456789", bank_name: "GTBank", status: "pending", reject_reason: null, created_at: "2024-01-15T13:20:00Z" },
  { id: "w3", player_id: "p3", phone: "09067891234", amount: 1000, method: "OPay", account_number: "7012345678", bank_name: "OPay", status: "pending", reject_reason: null, created_at: "2024-01-15T12:00:00Z" },
  { id: "w4", player_id: "p1", phone: "08034567890", amount: 3000, method: "Bank Transfer", account_number: "0123456789", bank_name: "Access Bank", status: "approved", reject_reason: null, created_at: "2024-01-14T10:00:00Z" },
  { id: "w5", player_id: "p2", phone: "07012345678", amount: 1500, method: "PalmPay", account_number: "8123456789", bank_name: "PalmPay", status: "approved", reject_reason: null, created_at: "2024-01-14T09:00:00Z" },
  { id: "w6", player_id: "p4", phone: "08109876543", amount: 10000, method: "Bank Transfer", account_number: "1234567890", bank_name: "Zenith Bank", status: "rejected", reject_reason: "Suspicious activity", created_at: "2024-01-13T08:00:00Z" },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "";

  let filtered = withdrawals;
  if (status) filtered = filtered.filter((w) => w.status === status);

  return NextResponse.json({
    success: true,
    data: { withdrawals: filtered, total: filtered.length },
  });
}
