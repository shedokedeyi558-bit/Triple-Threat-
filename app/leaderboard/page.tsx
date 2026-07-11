"use client";

import { useEffect, useState } from "react";
import { leaderboardApi, ApiError } from "@/lib/api";
import { Loader2, AlertCircle, ArrowLeft, Trophy, Medal } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

type Period = "week" | "month" | "all_time";

interface LeaderboardEntry {
  rank: number;
  player_id: string;
  masked_name: string;
  total_won: number;
  games_played: number;
}

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <Trophy size={18} className="text-yellow-400" />;
  if (rank === 2) return <Medal size={18} className="text-gray-400" />;
  if (rank === 3) return <Medal size={18} className="text-orange-400" />;
  return <span className="text-sm font-bold tabular-nums" style={{ color: "var(--text-muted)" }}>{rank}</span>;
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

  const periodLabels: Record<Period, string> = {
    week: "This Week",
    month: "This Month",
    all_time: "All Time",
  };

  return (
    <div className="min-h-dvh flex flex-col" style={{ backgroundColor: "var(--bg-base)" }}>
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b flex items-center gap-3 px-4 sm:px-6 py-4" style={{ borderColor: "var(--border-hairline)", backgroundColor: "var(--bg-base)" }}>
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <Image src="/bitlyfe-mark.svg" alt="BitLyfe" width={28} height={28} />
          <span className="font-headline text-base font-semibold" style={{ color: "var(--text-primary)" }}>bitlyfe</span>
        </Link>
        <div className="flex-1" />
        <Link href="/" className="flex items-center gap-1 text-sm font-medium transition-colors hover:opacity-80" style={{ color: "var(--text-secondary)" }}>
          <ArrowLeft size={16} /> Back
        </Link>
      </header>

      <main className="flex-1 px-4 sm:px-6 py-8 sm:py-12">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-1">
              <Trophy size={24} style={{ color: "var(--accent-amber)" }} />
              <h1 className="font-headline text-3xl sm:text-4xl font-semibold" style={{ color: "var(--text-primary)" }}>Leaderboard</h1>
            </div>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Top players by total winnings</p>
          </motion.div>

          {/* Period Filter Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8 flex gap-1 p-1 rounded-xl w-fit border"
            style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-card)" }}
          >
            {(["week", "month", "all_time"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                style={{
                  backgroundColor: period === p ? "var(--accent-indigo)" : "transparent",
                  color: period === p ? "white" : "var(--text-secondary)",
                }}
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
              className="border rounded-xl p-4 text-sm flex gap-3 mb-6"
              style={{ borderColor: "rgba(239,68,68,0.3)", backgroundColor: "rgba(239,68,68,0.05)", color: "#ef4444" }}
            >
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              {error}
            </motion.div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 size={24} className="animate-spin" style={{ color: "var(--accent-indigo)" }} />
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-16">
              <Trophy size={32} className="mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
              <p className="font-semibold" style={{ color: "var(--text-secondary)" }}>No data yet for this period</p>
              <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Check back after some games have been played.</p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-2"
            >
              {entries.map((entry, idx) => (
                <div
                  key={entry.player_id}
                  className="flex items-center gap-4 px-4 py-4 rounded-xl border transition-all"
                  style={{
                    borderColor: idx === 0 ? "rgba(234,179,8,0.25)" : idx === 1 ? "rgba(156,163,175,0.2)" : idx === 2 ? "rgba(249,115,22,0.2)" : "var(--border-hairline)",
                    backgroundColor: idx === 0 ? "rgba(234,179,8,0.05)" : idx === 1 ? "rgba(156,163,175,0.04)" : idx === 2 ? "rgba(249,115,22,0.04)" : "var(--bg-card)",
                  }}
                >
                  {/* Rank */}
                  <div className="w-7 flex items-center justify-center flex-shrink-0">
                    <RankIcon rank={entry.rank} />
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate" style={{ color: "var(--text-primary)" }}>{entry.masked_name}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{entry.games_played} games</p>
                  </div>

                  {/* Winnings */}
                  <div className="text-right flex-shrink-0">
                    <p className="font-mono text-base font-bold" style={{ color: "var(--accent-indigo)" }}>
                      ₦{entry.total_won.toLocaleString()}
                    </p>
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
