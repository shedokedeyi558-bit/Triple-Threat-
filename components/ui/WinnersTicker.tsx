"use client";
import { recentWinners } from "@/lib/mockData";

export function WinnersTicker() {
  const text = recentWinners.join(" • ") + " • ";
  return (
    <div className="marquee-container w-full py-2 bg-[#111] border-y border-[#2A2A2A]">
      <div className="marquee-content text-sm text-yellow-400 font-medium">
        🏆 {text}🏆 {text}
      </div>
    </div>
  );
}
