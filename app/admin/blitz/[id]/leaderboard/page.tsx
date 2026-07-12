"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { useAdmin } from "@/context/AdminContext";
import { adminApi, type BlitzResult, ApiError } from "@/lib/api";
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

const topColors: Record<number, string> = {
  1: "text-yellow-400",
  2: "text-gray-300",
  3: "text-orange-400",
};

export default function AdminBlitzLeaderboardPage() {
  const { state } = useAdmin();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [leaderboard, setLeaderboard] = useState<BlitzResult["leaderboard"]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [scoring, setScoring] = useState(false);

  useEffect(() => {
    if (!state.isAuthenticated) {
      router.push("/admin/login");
      return;
    }
    fetchLeaderboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.isAuthenticated, id]);

  const fetchLeaderboard = async () => {
    try {
      const res = await adminApi.getBlitzLeaderboard(id);
      setLeaderboard(res.leaderboard);
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleScore = async () => {
    setScoring(true);
    try {
      await adminApi.scoreBlitz(id);
      await fetchLeaderboard();
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
    } finally {
      setScoring(false);
    }
  };

  if (!state.isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-4 lg:p-6">
      <div className="max-w-3xl mx-auto space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/admin/blitz")}
              className="p-2 rounded-lg bg-[#141414] border border-[#1E1E1E] hover:border-[#4C6FFF]/30 transition-colors"
            >
              <ArrowLeft size={18} className="text-gray-400" />
            </button>
            <div className="flex items-center gap-2">
              <Zap size={18} style={{ color: "var(--accent-amber)" }} />
              <h1 className="font-black text-xl text-white">Leaderboard</h1>
            </div>
          </div>
          <button
            onClick={handleScore}
            disabled={scoring}
            className="px-4 py-2 bg-yellow-500/10 border border-yellow-500/40 text-yellow-400 text-sm font-bold rounded-xl hover:bg-yellow-500/20 transition-colors disabled:opacity-50"
          >
            {scoring ? "Scoring..." : "Score & Pay"}
          </button>
        </div>

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
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-[#141414] border border-[#1E1E1E] rounded-xl p-3.5 h-14 animate-pulse" />
            ))}
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="bg-[#141414] border border-[#1E1E1E] rounded-2xl p-12 text-center">
            <Trophy size={40} className="text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No results yet</p>
          </div>
        ) : (
          <>
            <div className="bg-[#141414] border border-[#1E1E1E] rounded-xl overflow-hidden">
              <div className="grid grid-cols-5 gap-2 px-4 py-2.5 border-b border-[#1E1E1E]">
                <span className="text-gray-500 text-xs font-bold">#</span>
                <span className="col-span-2 text-gray-500 text-xs font-bold">Player</span>
                <span className="text-gray-500 text-xs font-bold text-right">Score</span>
                <span className="text-gray-500 text-xs font-bold text-right">Prize</span>
              </div>

              <div className="divide-y divide-[#1E1E1E]">
                {leaderboard.map((entry, i) => (
                  <motion.div
                    key={entry.position}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(i * 0.04, 0.5) }}
                    className="grid grid-cols-5 gap-2 px-4 py-3.5 items-center hover:bg-white/[0.02] transition-colors"
                  >
                    <span className={`font-black text-sm ${topColors[entry.position] ?? "text-gray-500"}`}>
                      {entry.position}
                    </span>
                    <div className="col-span-2 min-w-0">
                      <p className="text-white font-semibold text-sm truncate">{maskPhone(entry.player_phone)}</p>
                      <p className="text-gray-600 text-xs">{formatTime(entry.total_time_ms)}</p>
                    </div>
                    <p className="text-white font-bold text-sm text-right">{entry.score}</p>
                    <div className="text-right">
                      {entry.prize_type === "cash" ? (
                        <span className="text-[#E8A33D] font-bold text-sm">₦{entry.amount?.toLocaleString()}</span>
                      ) : entry.prize_type === "free_ticket" ? (
                        <span className="text-purple-400 font-semibold text-xs flex items-center justify-end gap-1">
                          <Ticket size={11} />
                          Ticket
                        </span>
                      ) : (
                        <span className="text-gray-700 text-xs">—</span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
