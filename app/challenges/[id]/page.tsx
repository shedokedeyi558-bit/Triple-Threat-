"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter, useParams } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { NavBar } from "@/components/ui/NavBar";
import { Loader2, Users, Clock, TrendingUp } from "lucide-react";

interface ChallengeDetail {
  id: string;
  title: string;
  description: string;
  category: string;
  stake_amount: number;
  prize_pool: number;
  max_participants: number;
  current_participants: number;
  status: "active" | "locked" | "ended" | "closed";
  ends_at: string;
  my_participation: {
    answer: string;
    is_correct: boolean | null;
    amount_won: number;
  } | null;
  correct_answer: string | null;
  has_ended: boolean;
}

export default function ChallengeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { state, dispatch } = useApp();
  const [challenge, setChallenge] = useState<ChallengeDetail | null>(null);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");

  const challengeId = params.id as string;

  useEffect(() => {
    if (!state.isAuthenticated) {
      router.push("/auth");
      return;
    }
    // TODO: Fetch challenge details from API
    setLoading(false);
  }, [state.isAuthenticated, router]);

  const handleJoinChallenge = async () => {
    if (!answer.trim()) {
      setError("Please enter your answer");
      return;
    }

    if (!state.player || state.player.balance < (challenge?.stake_amount || 0)) {
      setError("Insufficient balance. Please top up your wallet.");
      return;
    }

    setJoining(true);
    setError("");

    try {
      // TODO: Call API to join challenge
      // const result = await challengeApi.join(challengeId, answer);
      // dispatch({ type: "UPDATE_BALANCE", balance: result.newBalance });
      // setAnswer("");
      // Refresh challenge data
      alert("Challenge joined successfully!"); // Placeholder
    } catch (err: any) {
      setError(err.message || "Failed to join challenge");
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-dvh bg-bg flex flex-col">
        <NavBar title="Challenge" />
        <div className="flex-1 flex justify-center items-center">
          <Loader2 size={32} className="text-neon animate-spin" />
        </div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="min-h-dvh bg-bg flex flex-col">
        <NavBar title="Challenge" />
        <div className="flex-1 flex justify-center items-center">
          <p className="text-gray-400">Challenge not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-bg flex flex-col">
      <NavBar title={challenge.category} />

      <main className="flex-1 px-3 sm:px-4 py-4 sm:py-5 pb-6">
        {/* Challenge title */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 sm:mb-6"
        >
          <h1 className="text-xl sm:text-2xl font-black text-white leading-tight mb-2">
            {challenge.title}
          </h1>
          <p className="text-gray-400 text-sm">{challenge.description}</p>
        </motion.div>

        {/* Prize and stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-3 sm:gap-4 mb-6"
        >
          <div className="bg-card border border-[#2A2A2A] rounded-lg sm:rounded-xl p-4">
            <p className="text-gray-400 text-xs sm:text-sm mb-1">Prize Pool</p>
            <p className="text-neon font-black text-2xl sm:text-3xl">
              ₦{challenge.prize_pool.toLocaleString()}
            </p>
          </div>
          <div className="bg-card border border-[#2A2A2A] rounded-lg sm:rounded-xl p-4">
            <p className="text-gray-400 text-xs sm:text-sm mb-1">Entry Stake</p>
            <p className="text-white font-black text-2xl sm:text-3xl">
              ₦{challenge.stake_amount.toLocaleString()}
            </p>
          </div>
        </motion.div>

        {/* Participation stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-[#2A2A2A] rounded-lg sm:rounded-xl p-4 sm:p-5 mb-6 space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-neon" />
              <span className="text-gray-400 text-sm">Participants</span>
            </div>
            <span className="text-white font-bold">
              {challenge.current_participants}/{challenge.max_participants}
            </span>
          </div>
          <div className="w-full bg-[#111] rounded-full h-2">
            <div
              className="bg-neon h-full rounded-full transition-all"
              style={{
                width: `${(challenge.current_participants / challenge.max_participants) * 100}%`,
              }}
            />
          </div>
          {challenge.status === "locked" && (
            <p className="text-xs text-yellow-400 mt-2">Challenge is locked - max participants reached</p>
          )}
        </motion.div>

        {/* Result (if ended and user participated) */}
        {challenge.has_ended && challenge.my_participation && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`rounded-lg sm:rounded-xl p-4 sm:p-5 mb-6 ${
              challenge.my_participation.is_correct
                ? "bg-neon/10 border border-neon/30"
                : "bg-red-900/10 border border-red-800/30"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                {challenge.my_participation.is_correct ? "✅ Correct!" : "❌ Incorrect"}
              </span>
              {challenge.my_participation.is_correct && (
                <span className="text-neon font-bold">
                  +₦{challenge.my_participation.amount_won.toLocaleString()}
                </span>
              )}
            </div>
            {challenge.correct_answer && (
              <p className="text-xs text-gray-400">
                Correct answer: <span className="text-white font-bold">{challenge.correct_answer}</span>
              </p>
            )}
          </motion.div>
        )}

        {/* Join form (if active and not joined) */}
        {challenge.status === "active" && !challenge.my_participation && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-4"
          >
            <div>
              <label className="text-sm text-gray-400 mb-2 block font-medium">Your Answer</label>
              <input
                type="text"
                placeholder="Enter your answer..."
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                disabled={joining}
                className="w-full bg-card border border-[#2A2A2A] focus:border-neon rounded-lg sm:rounded-xl px-3 sm:px-4 py-3 sm:py-4 text-white placeholder-gray-500 text-sm sm:text-base outline-none transition-colors"
              />
            </div>

            {error && (
              <div className="bg-red-900/20 border border-red-800 rounded-lg p-3 text-red-400 text-sm">
                {error}
                {error.includes("balance") && (
                  <button
                    onClick={() => router.push("/wallet")}
                    className="block mt-1 text-neon underline text-xs"
                  >
                    Top up wallet →
                  </button>
                )}
              </div>
            )}

            <button
              onClick={handleJoinChallenge}
              disabled={joining || !answer.trim()}
              className="btn-primary flex items-center justify-center gap-2 disabled:opacity-50 w-full text-sm sm:text-base"
            >
              {joining ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Joining...
                </>
              ) : (
                <>
                  Join Challenge & Stake ₦{challenge.stake_amount.toLocaleString()}
                </>
              )}
            </button>
          </motion.div>
        )}

        {/* Already joined message */}
        {challenge.my_participation && !challenge.has_ended && (
          <div className="bg-neon/10 border border-neon/30 rounded-lg sm:rounded-xl p-4 text-center">
            <p className="text-neon font-medium text-sm">
              ✓ You joined with answer: <span className="font-bold">{challenge.my_participation.answer}</span>
            </p>
            <p className="text-gray-400 text-xs mt-1">
              Waiting for challenge to end...
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
