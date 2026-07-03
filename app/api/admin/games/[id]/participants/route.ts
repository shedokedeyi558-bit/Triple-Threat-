import { NextRequest, NextResponse } from "next/server";

const participantsMock: Record<string, any[]> = {
  "challenge-1": [
    { id: "p1", player_phone: "08034567890", answer: "2", is_correct: false, amount_won: 0, participated_at: "2024-01-15T14:15:00Z" },
    { id: "p2", player_phone: "07012345678", answer: "3", is_correct: true, amount_won: 2285, participated_at: "2024-01-15T14:20:00Z" },
    { id: "p3", player_phone: "09067891234", answer: "3", is_correct: true, amount_won: 2285, participated_at: "2024-01-15T14:25:00Z" },
    { id: "p4", player_phone: "08109876543", answer: "5", is_correct: false, amount_won: 0, participated_at: "2024-01-15T14:30:00Z" },
    { id: "p5", player_phone: "08245678901", answer: "3", is_correct: true, amount_won: 2285, participated_at: "2024-01-15T14:35:00Z" },
    { id: "p6", player_phone: "07156789012", answer: "1", is_correct: false, amount_won: 0, participated_at: "2024-01-15T14:40:00Z" },
    { id: "p7", player_phone: "09267890123", answer: "3", is_correct: true, amount_won: 2285, participated_at: "2024-01-15T14:45:00Z" },
    { id: "p8", player_phone: "08378901234", answer: "4", is_correct: false, amount_won: 0, participated_at: "2024-01-15T14:50:00Z" },
    { id: "p9", player_phone: "07289012345", answer: "3", is_correct: true, amount_won: 2285, participated_at: "2024-01-15T14:55:00Z" },
    { id: "p10", player_phone: "09390123456", answer: "2", is_correct: false, amount_won: 0, participated_at: "2024-01-15T15:00:00Z" },
    { id: "p11", player_phone: "08401234567", answer: "3", is_correct: true, amount_won: 2285, participated_at: "2024-01-15T15:05:00Z" },
    { id: "p12", player_phone: "07512345678", answer: "6", is_correct: false, amount_won: 0, participated_at: "2024-01-15T15:10:00Z" },
    { id: "p13", player_phone: "09623456789", answer: "3", is_correct: true, amount_won: 2285, participated_at: "2024-01-15T15:15:00Z" },
    { id: "p14", player_phone: "08734567890", answer: "7", is_correct: false, amount_won: 0, participated_at: "2024-01-15T15:20:00Z" },
    { id: "p15", player_phone: "07845678901", answer: "3", is_correct: true, amount_won: 2285, participated_at: "2024-01-15T15:25:00Z" },
    { id: "p16", player_phone: "09956789012", answer: "2", is_correct: false, amount_won: 0, participated_at: "2024-01-15T15:30:00Z" },
    { id: "p17", player_phone: "08067890123", answer: "3", is_correct: true, amount_won: 2285, participated_at: "2024-01-15T15:35:00Z" },
    { id: "p18", player_phone: "07178901234", answer: "4", is_correct: false, amount_won: 0, participated_at: "2024-01-15T15:40:00Z" },
  ],
};

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const participations = participantsMock[params.id] || [];

  return NextResponse.json({
    success: true,
    data: {
      participations,
      total: participations.length,
    },
  });
}
