"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { blitzApi, type BlitzTournament, ApiError } from "@/lib/api";
import { BottomNavigation } from "@/components/ui/BottomNavigation";
import {
  ArrowLeft, Zap, Users, Clock, Trophy, Ticket, CheckCircle
} from "lucide-react";

function formatCountdown(target: string): string {
  const now = new Date();
  const end = new Date(target);
  const diffMs = end.getTime() - now.getTime();
  if (diffMs <= 0) return "Now";
  const hours = Math.floor(diffMs / 3600000);
  const mins = Math.floor((diffMs % 3600000) / 60000);
  const secs = Math.floor((diffMs % 60000) / 1000);
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  return hours > 0 ? `${hours}h ${mins}m ${secs}s` : `${mins}m ${secs}s`;
}

export default function BlitzDetailPage() {
  const { state } = useApp();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [tournament, setTournament] = useState<BlitzTournament | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [hasAttempted, setHasAttempted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState("");

  useEffect(() => {
    if (!state.isAuthenticated) {
      router.push("/auth");
      return;
    }
    fetchTournament();
  }, [state.isAuthenticated, id, router]);

  useEffect(() => {
    if (!tournament) return;
    const interval = setInterval(() => {
      if (tournament.status === "registration") {
        setCountdown(formatCountdown(tournament.tournament_start));
      } else if (tournament.status === "active") {
        setCountdown(formatCountdown(tournament.tournament_end));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [tournament]);

  useEffect(() => {
    if (tournament?.status === "completed") {
      router.replace(`/blitz/${id}/results`);
    }
  }, [tournament, id, router]);

  const fetchTournament = async () => {
    try {
      const res = await blitzApi.getOne(id);
      setTournament(res.tournament);
      setIsRegistered(res.is_registered);
      setHasAttempted(res.has_attempted);
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!tournament) return;
    setRegistering(true);
    setError("");
    try {
      await blitzApi.register(id);
      setIsRegistered(true);
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
    } finally {
      setRegistering(false);
    }
  };

  if (!state.isAuthenticated) return null;

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-neon/30 border-t-neon rounded-full animate-spin" />
      </main>
    );
  }

  if (!tournament) {
    return (
      <main className="min-h-screen bg-[#0A0A0A] flex items-center justify-center text-gray-500 text-sm">
        Tournament not found.
      </main>
    );
  }

  const cutPercent = tournament.platform_cut_percent;
  const prizePool = tournament.prize_pool;
  const playerCut = prizePool * (1 - cutPercent / 100);
  const firstPlace = Math.floor(playerCut * 0.6);
  const secondPlace = Math.floor(playerCut * 0.25);
  const thirdPlace = Math.floor(playerCut * 0.15);

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white pb-28">
      <header className="sticky top-0 z-40 bg-[#0A0A0A]/90 backdrop-blur-md border-b border-[#1A1A1A] px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg bg-[#141414] border border-[#1E1E1E] hover:border-neon/30 transition-colors"
          >
            <ArrowLeft size={18} className="text-gray-400" />
          </button>
          <div className="flex items-center gap-2">
            <Zap size={18} className="text-neon" />
            <span className="font-black text-lg uppercase tracking-tight text-white">BLITZ</span>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-400 text-sm bg-red-900/10 border border-red-900/30 rounded-xl p-3"
          >
            {error}
          </motion.p>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#141414] border border-[#1E1E1E] rounded-2xl p-5 space-y-4"
        >
          <div>
            <h1 className="text-white font-black text-2xl leading-tight">{tournament.title}</h1>
            {tournament.description && (
              <p className="text-gray-500 text-sm mt-1.5">{tournament.description}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#0A0A0A] rounded-xl p-3">
              <p className="text-[10px] text-gray-500 mb-0.5">Entry Fee</p>
              <p className="text-neon font-black text-xl">₦{tournament.entry_fee.toLocaleString()}</p>
            </div>
            <div className="bg-[#0A0A0A] rounded-xl p-3">
              <p className="text-[10px] text-gray-500 mb-0.5">Prize Pool</p>
              <p className="text-white font-black text-xl">₦{prizePool.toLocaleString()}</p>
            </div>
            <div className="bg-[#0A0A0A] rounded-xl p-3">
              <p className="text-[10px] text-gray-500 mb-0.5">Questions</p>
              <p className="text-white font-bold text-lg">{tournament.question_count}</p>
            </div>
            <div className="bg-[#0A0A0A] rounded-xl p-3">
              <p className="text-[10px] text-gray-500 mb-0.5">Time Limit</p>
              <p className="text-white font-bold text-lg">{Math.floor(tournament.time_limit_seconds / 60)}m</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Users size={14} />
            <span>{tournament.total_registered} registered</span>
          </div>
        </motion.div>

        {(tournament.status === "registration" || tournament.status === "active") && countdown && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#141414] border border-[#1E1E1E] rounded-2xl p-5 flex items-center justify-between"
          >
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <Clock size={16} />
              {tournament.status === "registration" ? "Tournament starts in" : "Tournament ends in"}
            </div>
            <span className="font-black text-neon text-xl tabular-nums">{countdown}</span>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#141414] border border-[#1E1E1E] rounded-2xl p-5 space-y-3"
        >
          <h2 className="text-white font-bold text-sm uppercase tracking-widest text-gray-400">Prize Breakdown</h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Trophy size={16} className="text-yellow-400" />
                <span className="text-white font-semibold">1st Place</span>
              </div>
              <span className="text-neon font-black">₦{firstPlace.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Trophy size={16} className="text-gray-400" />
                <span className="text-white font-semibold">2nd Place</span>
              </div>
              <span className="text-neon font-bold">₦{secondPlace.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Trophy size={16} className="text-orange-600" />
                <span className="text-white font-semibold">3rd Place</span>
              </div>
              <span className="text-neon font-bold">₦{thirdPlace.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-[#1E1E1E]">
              <div className="flex items-center gap-2 text-sm">
                <Ticket size={16} className="text-purple-400" />
                <span className="text-gray-400">Top 10 (4th–10th)</span>
              </div>
              <span className="text-purple-400 font-semibold text-sm">Free Ticket</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="pt-2"
        >
          {tournament.status === "registration" && !isRegistered && (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleRegister}
              disabled={registering || (state.player?.balance ?? 0) < tournament.entry_fee}
              className="w-full py-4 bg-neon text-black font-black text-lg rounded-xl disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ boxShadow: "0 0 24px #00FF6644" }}
            >
              {registering ? "Registering..." : `Register — ₦${tournament.entry_fee.toLocaleString()}`}
            </motion.button>
          )}

          {tournament.status === "registration" && isRegistered && (
            <div className="w-full py-4 bg-[#141414] border border-neon/40 rounded-xl text-center space-y-1">
              <div className="flex items-center justify-center gap-2 text-neon font-black text-base">
                <CheckCircle size={18} />
                You&apos;re in!
              </div>
              <p className="text-gray-500 text-sm">Tournament starts in {countdown}</p>
            </div>
          )}

          {tournament.status === "active" && isRegistered && !hasAttempted && (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => router.push(`/blitz/${id}/play`)}
              className="w-full py-4 bg-neon text-black font-black text-xl rounded-xl"
              style={{ boxShadow: "0 0 32px #00FF6666" }}
              animate={{ boxShadow: ["0 0 20px #00FF6644", "0 0 40px #00FF6688", "0 0 20px #00FF6644"] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              Start Blitz
            </motion.button>
          )}

          {tournament.status === "active" && isRegistered && hasAttempted && (
            <div className="w-full py-4 bg-[#141414] border border-[#1E1E1E] rounded-xl text-center space-y-1">
              <p className="text-gray-300 font-bold text-base">Attempt submitted</p>
              <p className="text-gray-500 text-sm">Results announced when tournament closes</p>
            </div>
          )}

          {tournament.status === "active" && !isRegistered && (
            <div className="w-full py-4 bg-[#141414] border border-[#1E1E1E] rounded-xl text-center">
              <p className="text-gray-500 text-sm">Registration is closed</p>
            </div>
          )}

          {tournament.status === "scoring" && (
            <div className="w-full py-4 bg-[#141414] border border-yellow-500/30 rounded-xl text-center">
              <p className="text-yellow-400 font-bold text-sm">Scoring in progress...</p>
            </div>
          )}
        </motion.div>
      </div>

      <BottomNavigation />
    </main>
  );
}
