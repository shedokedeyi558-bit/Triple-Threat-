"use client";

import { motion } from "framer-motion";
import { CheckCircle, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface PredictionResultProps {
  won: boolean;
  prize: number;
  correctAnswer: string;
  userAnswer: string;
}

export default function PredictionResult({ won, prize, correctAnswer, userAnswer }: PredictionResultProps) {
  const router = useRouter();

  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }} className="space-y-6">
      {/* Result header — amber for win, red for loss */}
      <div className="text-center">
        {won ? (
          <>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 15 }} className="inline-block">
              <CheckCircle size={64} style={{ color: "var(--accent-amber)" }} />
            </motion.div>
            <h2 className="text-3xl font-bold mt-4 uppercase" style={{ color: "var(--accent-amber)" }}>You Won</h2>
          </>
        ) : (
          <>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 15 }} className="inline-block">
              <XCircle size={64} className="text-red-500" />
            </motion.div>
            <h2 className="text-3xl font-bold text-red-500 mt-4 uppercase">You Lost</h2>
          </>
        )}
      </div>

      {/* Prize display — amber */}
      {won && (
        <div className="bg-[#1A1A1A] rounded-2xl p-6 text-center" style={{ border: "1px solid rgba(232,163,61,0.4)" }}>
          <p className="text-sm text-[#888] uppercase tracking-tight font-bold">Prize Won</p>
          <p className="text-4xl font-bold mt-2 font-mono" style={{ color: "var(--accent-amber)" }}>₦{prize}</p>
        </div>
      )}

      {/* Answers comparison */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl p-4">
          <p className="text-xs text-[#888] uppercase tracking-tight font-bold">Your Answer</p>
          <p className="text-lg font-bold mt-2" style={{ color: won ? "var(--accent-indigo)" : "#f87171" }}>{userAnswer}</p>
        </div>
        <div className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl p-4">
          <p className="text-xs text-[#888] uppercase tracking-tight font-bold">Correct</p>
          <p className="text-lg font-bold mt-2" style={{ color: "var(--text-primary)" }}>{correctAnswer}</p>
        </div>
      </div>

      {/* CTAs — indigo for actions */}
      <div className="flex gap-3 pt-4">
        <button
          onClick={() => router.push("/time-machine")}
          className="flex-1 bg-[#1A1A1A] text-white font-bold uppercase tracking-tight rounded-xl py-3 min-h-12 transition-colors"
          style={{ border: "1px solid #2A2A2A" }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent-indigo)")}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#2A2A2A")}
        >
          Back
        </button>
        <button
          onClick={() => router.push(won ? "/wallet" : "/time-machine")}
          className="flex-1 font-bold uppercase tracking-tight rounded-xl py-3 min-h-12 transition-colors"
          style={{ backgroundColor: "var(--accent-indigo)", color: "#fff" }}
        >
          {won ? "Withdraw" : "Play Again"}
        </button>
      </div>
    </motion.div>
  );
}
