// Shared AI question paste parser — used by both Draft Library and Specials bank.
// Format: Q: [text], A) [opt], B) [opt], C) [opt], D) [opt], Correct: [A/B/C/D]
// Supports inline format (no blank lines between fields) and blank-line separated blocks.

export interface PastedQuestion {
  id: string;
  question: string;
  options: [string, string, string, string];
  correct_answer: "A" | "B" | "C" | "D";
  error?: string;
}

export function parseQuestions(raw: string): PastedQuestion[] {
  const normalized = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();

  // Split on Q: at the start of a line or inline after a newline
  const chunks = normalized
    .split(/(?=\bQ\s*:)/i)
    .map((s) => s.trim())
    .filter(Boolean);

  const results: PastedQuestion[] = [];
  let id = 0;

  for (const chunk of chunks) {
    // Expand inline format: insert newlines before each known label
    const expanded = chunk
      .replace(/(?<!\n)(A\s*\))/g, "\nA)")
      .replace(/(?<!\n)(B\s*\))/g, "\nB)")
      .replace(/(?<!\n)(C\s*\))/g, "\nC)")
      .replace(/(?<!\n)(D\s*\))/g, "\nD)")
      .replace(/(?<!\n)(Correct\s*:)/gi, "\nCorrect:");

    const lines = expanded.split("\n").map((l) => l.trim()).filter(Boolean);
    const q: Partial<PastedQuestion> = {
      id: String(id++),
      options: ["", "", "", ""] as [string, string, string, string],
    };
    const errors: string[] = [];

    for (const line of lines) {
      if (/^Q\s*:/i.test(line))            q.question    = line.replace(/^Q\s*:/i, "").trim();
      else if (/^A\s*\)/i.test(line))      q.options![0] = line.replace(/^A\s*\)/i, "").trim();
      else if (/^B\s*\)/i.test(line))      q.options![1] = line.replace(/^B\s*\)/i, "").trim();
      else if (/^C\s*\)/i.test(line))      q.options![2] = line.replace(/^C\s*\)/i, "").trim();
      else if (/^D\s*\)/i.test(line))      q.options![3] = line.replace(/^D\s*\)/i, "").trim();
      else if (/^Correct\s*:/i.test(line)) {
        const ans = line.replace(/^Correct\s*:/i, "").trim().toUpperCase().charAt(0);
        if (["A", "B", "C", "D"].includes(ans)) q.correct_answer = ans as "A" | "B" | "C" | "D";
        else errors.push(`Bad correct answer "${ans}" — must be A B C or D`);
      }
    }

    if (!q.question?.trim()) errors.push("Missing Q:");
    const missingOpts = ["A", "B", "C", "D"].filter((_, i) => !q.options![i].trim());
    if (missingOpts.length) errors.push(`Missing option${missingOpts.length > 1 ? "s" : ""}: ${missingOpts.join(" ")}`);
    if (!q.correct_answer && !errors.some((e) => e.startsWith("Bad"))) errors.push("Missing Correct:");

    results.push({
      id: q.id!,
      question: q.question || "",
      options: q.options!,
      correct_answer: q.correct_answer || "A",
      error: errors.length ? errors.join(" · ") : undefined,
    });
  }

  return results;
}
