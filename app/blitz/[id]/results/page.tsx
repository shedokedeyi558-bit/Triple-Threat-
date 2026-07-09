"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { blitzApi, type BlitzResult, ApiError } from "@/lib/api";
import { BottomNavigation } from "@/components/ui/BottomNavigation";
import { ArrowLeft, Trophy, Ticket, Zap } from "lucide-react";

function maskPhone(phone: string): string {
  if (phone.length < 6) return phone;
  return phone.slice(0, 4) + "****" + phone.slice(-2);
}

function formatTime(ms: number): string {
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  return `${mins}m ${secs}s`;
}

export default function BlitzResultsPage() {
  const { state } = useApp();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [result, setResult] = useState<BlitzResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!state.isAuthenticated) {
      router.push("/auth");
      return;
    }
    fetchResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.isAuthenticated, id]);

  const fetchResults = async () => {
    try {
      const res = await blitzApi.getResults(id);
      setResult(res);
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!state.isAuthenticated) return null;

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white pb-28">
      <header className="sticky top-0 z-40 bg-[#0A0A0A]/90 backdrop-blur-md border-b border-[#1A1A1A] px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button
            onClick={() => router.push("/blitz")}
            className="p-2 rounded-lg bg-[#141414] border border-[#1E1E1E] hover:border-neon/30 transition-colors"
          >
            <ArrowLeft size={18} className="text-gray-400" />
          </button>
          <div className="flex items-center gap-2">
            <Zap size={18} className="text-neon" />
            <span className="font-black text-lg uppercase tracking-tight text-white">Results</span>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-400 text-sm bg-red-900/10 border border-red-900/30 rounded-xl p-3"
          >
            {error}
          </motion.p>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-[#141414] border border-[#1E1E1E] rounded-xl p-4 h-16 animate-pulse" />
            ))}
          </div>
        ) : result ? (
          <>
            {result.my_prize && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`rounded-2xl p-5 text-center border ${
                  result.my_prize.prize_type === "cash"
                    ? "bg-neon/10 border-neon/40"
                    : "bg-purple-500/10 border-purple-500/40"
                }`}
              >
                {result.my_prize.prize_type === "cash" ? (
                  <>
                    <Trophy size={36} className="text-neon mx-auto mb-2" />
                    <p className="text-gray-400 text-sm mb-1">You won</p>
                    <p className="text-neon font-black text-3xl">₦{result.my_prize.amount.toLocaleString()}</p>
                  </>
                ) : (
                  <>
                    <Ticket size={36} className="text-purple-400 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm mb-1">Free ticket</p>
                    {result.my_prize.ticket_code && (
                      <p className="text-purple-400 font-black text-xl tracking-widest">{result.my_prize.ticket_code}</p>
                    )}
                  </>
                )}
              </motion.div>
            )}

            {result.my_position && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#141414] border border-[#1E1E1E] rounded-2xl p-4 flex items-center justify-between"
              >
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-widest mb-0.5">Your Position</p>
                  <p className="text-white font-black text-2xl">#{result.my_position}</p>
                </div>
                {result.my_score !== undefined && (
                  <div className="text-right">
                    <p className="text-gray-500 text-xs uppercase tracking-widest mb-0.5">Score</p>
                    <p className="text-neon font-black text-2xl">{result.my_score}</p>
                  </div>
                )}
              </motion.div>
            )}

            <div className="space-y-2">
              <h2 className="text-gray-500 text-xs font-bold uppercase tracking-widest">Leaderboard</h2>
            {result.leaderboard.slice(0, 10).map((entry, i) => {
                const isMe = result.my_position === entry.position;
                const delay = Math.min(i * 0.06, 0.5);
                
                // Determine badge based on actual prize_type from backend
                let badgeStyle = null;
                let badgeLabel = null;
                if (entry.position === 1 && entry.prize_type === "cash") {
                  badgeStyle = "bg-yellow-500/10 border-yellow-500/40";
                  badgeLabel = "WINNER";
                } else if (entry.prize_type === "free_ticket") {
                  badgeStyle = "bg-purple-500/10 border-purple-500/40";
                  badgeLabel = "FREE TICKET";
                }

                return (
                  <motion.div
                    key={entry.position}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay }}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border ${
                      isMe
                        ? "bg-neon/10 border-neon/40"
                        : badgeStyle
                        ? badgeStyle
                        : "bg-[#141414] border-[#1E1E1E]"
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs flex-shrink-0 ${
                        isMe ? "bg-neon text-black" : "bg-[#0A0A0A] text-gray-400"
                      }`}
                    >
                      {entry.position}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`font-bold text-sm ${isMe ? "text-neon" : "text-white"}`}>
                          {maskPhone(entry.player_phone)}
                          {isMe && <span className="text-[10px] text-neon/60">(you)</span>}
                        </p>
                        {badgeLabel && (
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                            badgeLabel === "WINNER" ? "text-yellow-400" : "text-purple-400"
                          }`}>
                            {badgeLabel}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-500 text-xs">{formatTime(entry.total_time_ms)}</p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className={`font-black text-sm ${isMe ? "text-neon" : "text-white"}`}>
                        {entry.score}
                      </p>
                      {entry.prize_type && (
                        <p className={`text-[10px] font-semibold ${entry.prize_type === "cash" ? "text-neon" : "text-purple-400"}`}>
                          {entry.prize_type === "cash"
                            ? `₦${entry.amount?.toLocaleString()}`
                            : "Free ticket"}
                        </p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="bg-[#141414] border border-[#1E1E1E] rounded-2xl p-12 text-center">
            <p className="text-gray-600 text-sm">Results not available yet</p>
          </div>
        )}
      </div>

      <BottomNavigation />
    </main>
  );
}
