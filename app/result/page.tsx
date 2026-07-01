"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { Confetti } from "@/components/ui/Confetti";
import Link from "next/link";

export default function ResultPage() {
  const router = useRouter();
  const { state, dispatch } = useApp();

  const session = state.activeSession;
  const result = session?.result;

  useEffect(() => {
    if (!session || !result) {
      router.replace("/doors");
    }
  }, [session, result, router]);

  const handlePlayAgain = () => {
    dispatch({ type: "CLEAR_SESSION" });
    router.push("/doors");
  };

  if (!session || !result) return null;

  const balance = state.player?.balance ?? 0;

  return (
    <div className="min-h-dvh bg-bg flex flex-col items-center justify-center px-5">
      {result.correct && <Confetti />}

      <motion.div
        className="w-full max-w-sm"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", damping: 18 }}
      >
        <div className="bg-card border border-[#2A2A2A] rounded-3xl p-7 text-center">
          {result.correct ? (
            <>
              <motion.div
                className="text-6xl mb-3"
                animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                🎉
              </motion.div>
              <h1 className="text-3xl font-black text-neon neon-text-glow mb-1">CORRECT!</h1>
              <p className="text-gray-400 text-sm mb-5">Great job! You got it right.</p>

              <div className="bg-[#00FF6611] border border-neon/30 rounded-2xl py-5 px-4 mb-6">
                <p className="text-gray-400 text-sm">You won</p>
                <p className="text-neon font-black text-4xl mt-1">
                  ₦{result.prize.toLocaleString()}
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <Link
                  href="/wallet"
                  className="btn-primary block text-center"
                  onClick={() => dispatch({ type: "CLEAR_SESSION" })}
                >
                  💰 Withdraw now
                </Link>
                <button onClick={handlePlayAgain} className="btn-secondary">
                  🔄 Play again
                </button>
              </div>

              <div className="mt-5 bg-[#111] rounded-xl px-4 py-2 text-sm">
                <span className="text-gray-400">Wallet: </span>
                <span className="text-neon font-bold">₦{balance.toLocaleString()}</span>
              </div>
            </>
          ) : (
            <>
              <div className="text-6xl mb-3">❌</div>
              <h1 className="text-3xl font-black text-red-400 mb-1">WRONG!</h1>
              <p className="text-gray-400 text-sm mb-5">Better luck next time.</p>

              <div className="bg-[#1E1010] border border-red-900/50 rounded-2xl p-4 mb-5 text-left space-y-3">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">The correct answer was</p>
                  <p className="text-white font-bold">{result.correctAnswer}</p>
                </div>
                {result.playerAnswer ? (
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">You answered</p>
                    <p className="text-red-400 font-medium">{result.playerAnswer}</p>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm italic">Time ran out — no answer submitted</p>
                )}
              </div>

              <div className="flex flex-col gap-3">
                <button onClick={handlePlayAgain} className="btn-primary">
                  🔄 Try again
                </button>
                <Link href="/wallet" className="btn-secondary block text-center">
                  💰 Top up wallet
                </Link>
              </div>

              <div className="mt-5 bg-[#111] rounded-xl px-4 py-2 text-sm">
                <span className="text-gray-400">Wallet: </span>
                <span className="text-white font-bold">₦{balance.toLocaleString()}</span>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
