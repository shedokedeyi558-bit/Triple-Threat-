import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      doors: [
        {
          id: 1,
          status: "active",
          prize: 500,
          entry_fee: 100,
          question_id: "q1",
          questions: {
            id: "q1",
            text: "What is the capital city of Nigeria?",
            format: "multiple_choice",
            difficulty: "Easy",
            prize: 500,
            status: "active",
          },
        },
        {
          id: 2,
          status: "active",
          prize: 2000,
          entry_fee: 200,
          question_id: "q2",
          questions: {
            id: "q2",
            text: "Who wrote the novel 'Things Fall Apart'?",
            format: "multiple_choice",
            difficulty: "Medium",
            prize: 2000,
            status: "active",
          },
        },
        {
          id: 3,
          status: "active",
          prize: 5000,
          entry_fee: 500,
          question_id: "q3",
          questions: {
            id: "q3",
            text: "What is the chemical symbol for gold?",
            format: "type_answer",
            difficulty: "Hard",
            prize: 5000,
            status: "active",
          },
        },
      ],
    },
  });
}
