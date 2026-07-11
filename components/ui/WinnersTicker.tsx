"use client";
import { recentWinners } from "@/lib/mockData";
import { Trophy } from "lucide-react";

export function WinnersTicker() {
  const text = recentWinners.join(" · ") + " · ";
  return (
    <div className="marquee-container w-full py-2 bg-[#111] border-y border-[#2A2A2A]">
      <div className="marquee-content text-sm text-yellow-400 font-medium flex items-center gap-2">
        <Trophy size={14} className="flex-shrink-0" /> {text}<Trophy size={14} className="flex-shrink-0" /> {text}
      </div>
    </div>
  );
}
