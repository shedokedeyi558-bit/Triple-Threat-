"use client";

import { motion } from "framer-motion";
import { CheckCircle, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface PillResultProps {
  won: boolean;
  prize?: number;
  correctAnswer: string;
  category: string;
  timedOut?: boolean;
}

export default function PillResult({ won, prize, correctAnswer, category, timedOut = false }: PillResultProps) {
  const router = useRouter();
  const safeAnswer = correctAnswer ?? "";
  const safePrize = prize ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div className="text-center">
        {won ? (
          <>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 15 }} className="inline-block">
              <CheckCircle size={64} style={{ color: "var(--accent-amber)" }} />
            </motion.div>
            <h2 className="text-3xl font-bold mt-4 uppercase" style={{ color: "var(--accent-amber)" }}>Correct</h2>
          </>
        ) : timedOut ? (
          <>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 15 }} className="inline-block">
              <XCircle size={64} className="text-yellow-500" />
            </motion.div>
            <h2 className="text-3xl font-bold text-yellow-500 mt-4 uppercase">Time&apos;s Up</h2>
          </>
        ) : (
          <>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 15 }} className="inline-block">
              <XCircle size={64} className="text-red-500" />
            </motion.div>
            <h2 className="text-3xl font-bold text-red-500 mt-4 uppercase">Wrong</h2>
          </>
        )}
      </div>

      {won && (
        <div className="bg-[#1A1A1A] rounded-2xl p-6 text-center" style={{ border: "1px solid rgba(232,163,61,0.4)" }}>
          <p className="text-sm text-[#888] uppercase tracking-tight font-bold">Prize Won</p>
          <p className="text-4xl font-bold mt-2 font-mono" style={{ color: "var(--accent-amber)" }}>₦{safePrize.toLocaleString()}</p>
        </div>
      )}

      {!won && (
        <div className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl p-4">
          <p className="text-xs text-[#888] uppercase tracking-tight font-bold">Correct Answer</p>
          <p className="text-lg font-bold mt-2" style={{ color: "var(--text-primary)" }}>{safeAnswer || "—"}</p>
        </div>
      )}

      <div className="text-center">
        <p className="text-xs text-[#888]">{category}</p>
      </div>

      <div className="flex gap-3 pt-4">
        {won ? (
          <>
            <button
              onClick={() => router.push("/pills")}
              className="flex-1 font-bold uppercase tracking-tight rounded-xl py-3 min-h-12 transition-colors"
              style={{ backgroundColor: "var(--accent-indigo)", color: "#fff" }}
            >
              Play more
            </button>
            <button
              onClick={() => router.push("/wallet")}
              className="flex-1 font-bold uppercase tracking-tight rounded-xl py-3 min-h-12 transition-colors"
              style={{ backgroundColor: "transparent", color: "var(--text-secondary)", border: "1px solid #2A2A2A" }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent-amber)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#2A2A2A")}
            >
              Withdraw
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => router.back()}
              className="flex-1 bg-[#1A1A1A] font-bold uppercase tracking-tight rounded-xl py-3 min-h-12 transition-colors"
              style={{ color: "var(--text-primary)", border: "1px solid #2A2A2A" }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent-indigo)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#2A2A2A")}
            >
              Try Again
            </button>
            <button
              onClick={() => router.push("/pills")}
              className="flex-1 font-bold uppercase tracking-tight rounded-xl py-3 min-h-12 transition-colors"
              style={{ backgroundColor: "var(--accent-indigo)", color: "#fff" }}
            >
              Back
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
}
