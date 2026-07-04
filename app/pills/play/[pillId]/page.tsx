"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { pillsApi, type PillOpenResponse, type PillSubmitResponse, ApiError } from "@/lib/api";
import PillPlay from "@/components/ui/PillPlay";
import PillResult from "@/components/ui/PillResult";
import { AlertCircle, ChevronLeft } from "lucide-react";

type Phase = "revealing" | "playing" | "result";

export default function PillPlayPage() {
  const params = useParams();
  const router = useRouter();
  const { state, dispatch } = useApp();
  const pillId = params.pillId as string;

  const [phase, setPhase] = useState<Phase>("revealing");
  const [data, setData] = useState<PillOpenResponse | null>(null);
  const [result, setResult] = useState<PillSubmitResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!state.isAuthenticated) { router.push("/auth"); return; }

    pillsApi.open(pillId)
      .then((d) => {
        setData(d);
        // Short dramatic delay before showing question
        setTimeout(() => setPhase("playing"), 900);
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : "Failed to load pill");
        setPhase("playing");
      });
  }, [state.isAuthenticated, router, pillId]);

  const handleSubmit = async (answer: string) => {
    setSubmitting(true);
    try {
      const res = await pillsApi.submit(pillId, answer);
      dispatch({ type: "UPDATE_BALANCE", balance: res.newBalance });
      setResult(res);
      setPhase("result");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to submit answer");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0A0A0A]/80 backdrop-blur-md border-b border-[#1A1A1A] px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-[#1A1A1A] transition-colors">
            <ChevronLeft size={22} className="text-gray-400" />
          </button>
          <span className="text-sm text-gray-400 font-semibold">Pill</span>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 flex gap-3 items-start"
          >
            <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-400">{error}</p>
          </motion.div>
        )}

        <AnimatePresence mode="wait">

          {/* ── Revealing animation ── */}
          {phase === "revealing" && (
            <motion.div
              key="reveal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center min-h-[60vh] gap-6"
            >
              {/* Spinning pill */}
              <motion.div
                animate={{ rotate: 360, scale: [1, 1.15, 1] }}
                transition={{ rotate: { duration: 1.2, ease: "easeInOut" }, scale: { duration: 0.6, repeat: Infinity } }}
                className="text-7xl"
              >
                💊
              </motion.div>

              {/* Expanding ring */}
              <motion.div
                animate={{ scale: [1, 2.5], opacity: [0.6, 0] }}
                transition={{ duration: 0.9, repeat: Infinity, ease: "easeOut" }}
                className="absolute w-24 h-24 rounded-full border-2 border-neon pointer-events-none"
              />

              <div className="text-center space-y-1">
                <motion.p
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                  className="text-neon font-black text-lg tracking-widest uppercase"
                >
                  Revealing
                </motion.p>
                <p className="text-gray-600 text-xs">Get ready...</p>
              </div>
            </motion.div>
          )}

          {/* ── Question ── */}
          {phase === "playing" && data && (
            <motion.div
              key="playing"
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 280, damping: 26 }}
            >
              <PillPlay
                question={data.question}
                category={data.category}
                format={data.format}
                options={data.options}
                timer={data.timer}
                onSubmit={handleSubmit}
                isLoading={submitting}
              />
            </motion.div>
          )}

          {/* ── Result ── */}
          {phase === "result" && result && data && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
            >
              <PillResult
                won={result.won}
                prize={result.prize ?? 0}
                correctAnswer={result.correctAnswer}
                category={data.category}
              />
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
