"use client";

import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import { gameApi, type RecentWinner } from "@/lib/api";

// Mask phone for privacy: 0803***4567
function maskPhone(phone: string): string {
  if (!phone || phone.length < 7) return "Player";
  return `${phone.slice(0, 4)}***${phone.slice(-4)}`;
}

// Fallback entries shown when no real data is available yet
const FALLBACK_ENTRIES = [
  "First wins are being claimed now",
  "Be the first to win real Naira",
  "Games are live — join now",
];

export function WinnersTicker() {
  const [entries, setEntries] = useState<string[]>(FALLBACK_ENTRIES);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    gameApi.recentWinners()
      .then((winners) => {
        if (winners && winners.length > 0) {
          const formatted = winners.map(
            (w: RecentWinner) => `${maskPhone(w.phone)} won ₦${w.prize.toLocaleString()}`
          );
          setEntries(formatted);
        }
        // If empty array, keep fallback — don't show blank ticker
      })
      .catch(() => {
        // Network/backend failure — keep fallback, don't crash
      })
      .finally(() => setLoaded(true));
  }, []);

  const text = entries.join("  ·  ") + "  ·  ";

  return (
    <div className="marquee-container w-full py-2 border-y" style={{ backgroundColor: "#111", borderColor: "#2A2A2A" }}>
      <div className="marquee-content text-sm font-medium flex items-center gap-2" style={{ color: loaded ? "#facc15" : "#6b7280" }}>
        <Trophy size={14} className="flex-shrink-0" style={{ color: "#facc15" }} />
        {text}
        <Trophy size={14} className="flex-shrink-0" style={{ color: "#facc15" }} />
        {text}
      </div>
    </div>
  );
}
