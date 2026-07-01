import type { Difficulty } from "@/lib/types";

const colors: Record<Difficulty, string> = {
  Easy: "bg-green-900/50 text-green-400 border border-green-800",
  Medium: "bg-yellow-900/50 text-yellow-400 border border-yellow-800",
  Hard: "bg-red-900/50 text-red-400 border border-red-800",
};

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colors[difficulty]}`}>
      {difficulty}
    </span>
  );
}
