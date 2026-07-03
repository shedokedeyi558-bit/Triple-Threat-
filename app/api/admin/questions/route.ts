import { NextRequest, NextResponse } from "next/server";

const questions = [
  { id: "q1", door_id: 1, text: "What is the capital city of Nigeria?", format: "multiple_choice", difficulty: "Easy", prize: 500, time_limit: 15, options: [{ id: "a", text: "Lagos" }, { id: "b", text: "Abuja" }, { id: "c", text: "Kano" }, { id: "d", text: "Ibadan" }], correct_answer: "b", case_sensitive: false, spelling_tolerance: "strict", status: "active", created_at: "2024-01-15T00:00:00Z" },
  { id: "q2", door_id: 2, text: "Who wrote the novel 'Things Fall Apart'?", format: "multiple_choice", difficulty: "Medium", prize: 2000, time_limit: 10, options: [{ id: "a", text: "Wole Soyinka" }, { id: "b", text: "Chimamanda Adichie" }, { id: "c", text: "Chinua Achebe" }, { id: "d", text: "Ben Okri" }], correct_answer: "c", case_sensitive: false, spelling_tolerance: "strict", status: "active", created_at: "2024-01-15T00:00:00Z" },
  { id: "q3", door_id: 3, text: "What is the chemical symbol for gold?", format: "type_answer", difficulty: "Hard", prize: 5000, time_limit: 10, options: null, correct_answer: "Au", case_sensitive: false, spelling_tolerance: "strict", status: "active", created_at: "2024-01-15T00:00:00Z" },
  { id: "q4", door_id: 1, text: "What year did Nigeria gain independence?", format: "multiple_choice", difficulty: "Easy", prize: 500, time_limit: 15, options: [{ id: "a", text: "1956" }, { id: "b", text: "1960" }, { id: "c", text: "1963" }, { id: "d", text: "1970" }], correct_answer: "b", case_sensitive: false, spelling_tolerance: "strict", status: "active", created_at: "2024-01-16T00:00:00Z" },
  { id: "q5", door_id: 2, text: "Which planet is closest to the Sun?", format: "type_answer", difficulty: "Medium", prize: 2000, time_limit: 10, options: null, correct_answer: "Mercury", case_sensitive: false, spelling_tolerance: "lenient", status: "active", created_at: "2024-01-16T00:00:00Z" },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "";
  const limit = Number(searchParams.get("limit") || 50);

  let filtered = questions;
  if (status) filtered = filtered.filter((q) => q.status === status);

  return NextResponse.json({
    success: true,
    data: { questions: filtered.slice(0, limit), total: filtered.length },
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const newQ = { ...body, id: "q" + Date.now(), status: "active", created_at: new Date().toISOString() };
  return NextResponse.json({ success: true, data: { question: newQ } }, { status: 201 });
}
