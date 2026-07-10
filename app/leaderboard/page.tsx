"use client";

import { useEffect, useState } from "react";
import { leaderboardApi, ApiError } from "@/lib/api";
import { NavBar } from "@/components/ui/NavBar";
import { Loader2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

type Period = "week" | "month" | "all_time";

interface LeaderboardEntry {
  rank: number;
  player_id: string;
  masked_name: string;
  total_won: number;
  games_played: number;
}

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<Period>("week");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await leaderboardApi.get(period);
        setEntries(res.entries);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed to load leaderboard");
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [period]);

  const periodLabels = {
    week: "This Week",
    month: "This Month",
    all_time: "All Time",
  };

  return (
    <div className="min-h-dvh bg-[#0A0A0A] flex flex-col">
      <NavBar />

      <main className="flex-1 px-4 sm:px-6 py-8 sm:py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-2">Leaderboard</h1>
            <p className="text-gray-400 text-lg">Top players by winnings</p>
          </motion.div>

          {/* Period Filter Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8 flex gap-2 bg-gray-950/50 border border-gray-800 rounded-xl p-1 w-fit"
          >
            {(["week", "month", "all_time"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  period === p
                    ? "bg-[#4C6FFF] text-[#042C53]"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {periodLabels[p]}
              </button>
            ))}
          </motion.div>

          {/* Error State */}
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-red-900/10 border border-red-800/30 rounded-xl p-4 text-red-400 text-sm flex gap-3 mb-6"
            >
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              {error}
            </motion.div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 size={24} className="text-neon animate-spin" />
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">No leaderboard data available yet.</p>
            </div>
          ) : (
            /* Leaderboard Table */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-2"
            >
              {entries.map((entry, idx) => (
                <div
                  key={entry.player_id}
                  className={`flex items-center gap-4 px-4 py-4 rounded-xl border transition-all ${
                    idx === 0
                      ? "bg-yellow-900/10 border-yellow-800/30"
                      : idx === 1
                      ? "bg-gray-700/10 border-gray-700/30"
                      : idx === 2
                      ? "bg-orange-900/10 border-orange-800/30"
                      : "bg-gray-950/50 border-gray-800"
                  }`}
                >
                  {/* Rank */}
                  <div className="w-8 flex-shrink-0">
                    <span className="text-lg font-bold text-white">
                      {entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : entry.rank === 3 ? "🥉" : entry.rank}
                    </span>
                  </div>

                  {/* Name */}
                  <div className="flex-1">
                    <p className="text-white font-semibold">{entry.masked_name}</p>
                    <p className="text-xs text-gray-400">{entry.games_played} games</p>
                  </div>

                  {/* Winnings */}
                  <div className="text-right">
                    <p className="font-mono text-lg font-bold text-neon">₦{entry.total_won.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
