"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { vipPillsApi, type VipStartResponse, type VipAnswerResponse, ApiError } from "@/lib/api";
import { Confetti } from "@/components/ui/Confetti";
import PillPlay from "@/components/ui/PillPlay";
import { ChevronLeft, CheckCircle, XCircle, Trophy, Loader2 } from "lucide-react";

type Phase = "loading" | "playing" | "correct_flash" | "streak_complete" | "failed" | "error";

interface QuestionState {
  question: string;
  format: "multiple_choice" | "type_answer";
  options?: string[];
  timer: number;
}

export default function VipPlayPage() {
  const params = useParams();
  const router = useRouter();
  const { state, dispatch } = useApp();
  const packId = params.packId as string;

  const [phase, setPhase] = useState<Phase>("loading");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionState | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0); // 0-based
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [packName, setPackName] = useState("");
  const [prize, setPrize] = useState(0);
  const [entryFee, setEntryFee] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [lastCorrectAnswer, setLastCorrectAnswer] = useState("");
  const [failedAt, setFailedAt] = useState<{ questionNum: number; correctAnswer: string; entryFee: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [totalPrize, setTotalPrize] = useState(0);

  // Start or resume attempt — called on mount and on "Try Again"
  const startOrResume = useCallback(async () => {
    if (!state.isAuthenticated) { router.push("/auth"); return; }
    setPhase("loading");
    setError(null);
    try {
      const res: VipStartResponse = await vipPillsApi.start(packId);
      setSessionId(res.session_id);
      setPackName(res.pack_name);
      setPrize(res.prize);
      setEntryFee(res.entry_fee);
      setTotalQuestions(res.total_questions);
      setQuestionIndex(res.current_question_index);
      setCurrentQuestion(res.question);
      // Only deduct balance if this is a fresh attempt (charged)
      if (res.is_new_attempt && res.new_balance !== undefined) {
        dispatch({ type: "UPDATE_BALANCE", balance: res.new_balance });
      }
      setPhase("playing");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to start VIP session");
      setPhase("error");
    }
  }, [packId, state.isAuthenticated, router, dispatch]);

  useEffect(() => {
    startOrResume();
  }, [startOrResume]);

  const handleAnswer = async (answer: string) => {
    if (!sessionId) return;
    setSubmitting(true);
    try {
      const res: VipAnswerResponse = await vipPillsApi.answer(sessionId, answer);

      if (res.correct) {
        setLastCorrectAnswer(res.correct_answer);
        if (res.streak_complete && res.prize !== undefined) {
          // All 10 correct — full win
          setTotalPrize(res.prize);
          if (res.new_balance !== undefined) {
            dispatch({ type: "UPDATE_BALANCE", balance: res.new_balance });
          }
          setPhase("streak_complete");
        } else if (res.next_question && res.next_question_index !== undefined) {
          // Correct — advance
          setPhase("correct_flash");
          setTimeout(() => {
            setCurrentQuestion(res.next_question!);
            setQuestionIndex(res.next_question_index!);
            setPhase("playing");
          }, 900);
        }
      } else {
        // Wrong answer — fail state
        setFailedAt({
          questionNum: res.question_number,
          correctAnswer: res.correct_answer,
          entryFee: res.entry_fee,
        });
        setPhase("failed");
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to submit answer");
      setPhase("error");
    } finally {
      setSubmitting(false);
    }
  };

  const displayQuestionNum = questionIndex + 1; // 1-based for display

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0A0A0A", color: "var(--text-primary)" }}>
      {/* Header — amber VIP treatment */}
      <header className="sticky top-0 z-40 px-4 py-4 border-b"
        style={{ backgroundColor: "rgba(10,10,10,0.9)", backdropFilter: "blur(12px)", borderColor: "#1A1A1A" }}>
        <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
          <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-[#1A1A1A] transition-colors">
            <ChevronLeft size={22} className="text-gray-400" />
          </button>
          {phase === "playing" || phase === "correct_flash" ? (
            <div className="flex items-center gap-3">
              {/* VIP badge */}
              <span className="text-[10px] font-black px-2 py-0.5 rounded uppercase"
                style={{ backgroundColor: "rgba(232,163,61,0.15)", color: "var(--accent-amber)", boxShadow: "0 0 8px rgba(232,163,61,0.25)" }}>
                VIP
              </span>
              <span className="text-sm font-bold" style={{ color: "var(--accent-amber)" }}>
                Question {displayQuestionNum} of {totalQuestions}
              </span>
            </div>
          ) : (
            <span className="text-sm font-semibold text-gray-400">{packName}</span>
          )}
          {/* Progress dots */}
          <div className="flex gap-1">
            {Array.from({ length: totalQuestions }).map((_, i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full transition-colors"
                style={{ backgroundColor: i < questionIndex ? "var(--accent-amber)" : i === questionIndex && phase === "playing" ? "rgba(232,163,61,0.6)" : "#2A2A2A" }} />
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6">
        <AnimatePresence mode="wait">

          {/* Loading */}
          {phase === "loading" && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "rgba(232,163,61,0.1)", boxShadow: "0 0 24px rgba(232,163,61,0.3)" }}>
                <Loader2 size={28} className="animate-spin" style={{ color: "var(--accent-amber)" }} />
              </div>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading VIP challenge...</p>
            </motion.div>
          )}

          {/* Playing */}
          {(phase === "playing" || phase === "correct_flash") && currentQuestion && (
            <motion.div key={`q-${questionIndex}`}
              initial={{ opacity: 0, y: 32, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}>

              {/* Correct flash overlay */}
              <AnimatePresence>
                {phase === "correct_flash" && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.1 }}
                    className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
                    style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
                  >
                    <div className="rounded-full p-6" style={{ backgroundColor: "rgba(16,185,129,0.15)" }}>
                      <CheckCircle size={64} className="text-emerald-400" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <PillPlay
                question={currentQuestion.question}
                category=""
                format={currentQuestion.format}
                options={currentQuestion.options}
                timer={currentQuestion.timer}
                onSubmit={handleAnswer}
                isLoading={submitting}
              />
            </motion.div>
          )}

          {/* Streak complete — VIP win celebration */}
          {phase === "streak_complete" && (
            <motion.div key="win" initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", damping: 14 }}
              className="flex flex-col items-center justify-center min-h-[70vh] gap-6 text-center px-4">
              <Confetti />
              <motion.div
                animate={{ scale: [1, 1.12, 1], rotate: [0, 4, -4, 0] }}
                transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 2 }}
                className="w-28 h-28 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "rgba(232,163,61,0.15)", boxShadow: "0 0 40px rgba(232,163,61,0.45)" }}>
                <Trophy size={56} style={{ color: "var(--accent-amber)" }} />
              </motion.div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--accent-amber)" }}>
                  VIP Champion
                </p>
                <h1 className="font-black text-4xl mb-2" style={{ color: "var(--accent-amber)" }}>
                  All 10 Correct!
                </h1>
                <p className="text-base" style={{ color: "var(--text-secondary)" }}>
                  You completed {packName}
                </p>
              </div>
              <div className="rounded-2xl px-8 py-5 text-center"
                style={{ backgroundColor: "rgba(232,163,61,0.1)", border: "1px solid rgba(232,163,61,0.3)", boxShadow: "0 0 20px rgba(232,163,61,0.15)" }}>
                <p className="text-[11px] uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Prize Credited</p>
                <p className="font-black text-4xl font-mono" style={{ color: "var(--accent-amber)" }}>
                  +₦{totalPrize.toLocaleString()}
                </p>
              </div>
              <div className="flex gap-3 w-full max-w-sm">
                <button onClick={() => router.push("/wallet")}
                  className="flex-1 py-3 rounded-xl font-bold text-sm"
                  style={{ backgroundColor: "var(--accent-amber)", color: "#000" }}>
                  View Wallet
                </button>
                <button onClick={() => router.push("/play")}
                  className="flex-1 py-3 rounded-xl font-bold text-sm border"
                  style={{ backgroundColor: "transparent", color: "var(--text-primary)", borderColor: "var(--border-subtle)" }}>
                  Back to Play
                </button>
              </div>
            </motion.div>
          )}

          {/* Failed */}
          {phase === "failed" && failedAt && (
            <motion.div key="failed" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-6 pt-8 text-center px-4">
              <div className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "rgba(239,68,68,0.1)", border: "2px solid rgba(239,68,68,0.3)" }}>
                <XCircle size={44} className="text-red-400" />
              </div>
              <div>
                <h2 className="font-black text-2xl text-white mb-1">Wrong Answer</h2>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  Failed on Question {failedAt.questionNum} of {totalQuestions}
                </p>
              </div>
              <div className="w-full max-w-sm space-y-3">
                <div className="rounded-xl p-4 text-left border" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-hairline)" }}>
                  <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>Correct Answer Was</p>
                  <p className="font-bold text-base" style={{ color: "var(--text-primary)" }}>{failedAt.correctAnswer}</p>
                </div>
                <div className="rounded-xl p-4 text-left border" style={{ backgroundColor: "rgba(239,68,68,0.06)", borderColor: "rgba(239,68,68,0.2)" }}>
                  <p className="text-[10px] uppercase tracking-widest mb-1 text-red-400">Entry Fee Lost</p>
                  <p className="font-bold text-base text-red-400 font-mono">₦{failedAt.entryFee.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex gap-3 w-full max-w-sm">
                <button onClick={startOrResume}
                  className="flex-1 py-3 rounded-xl font-bold text-sm"
                  style={{ backgroundColor: "var(--accent-indigo)", color: "#fff" }}>
                  Try Again — ₦{entryFee.toLocaleString()}
                </button>
                <button onClick={() => router.push("/play")}
                  className="flex-1 py-3 rounded-xl font-bold text-sm border"
                  style={{ backgroundColor: "transparent", color: "var(--text-secondary)", borderColor: "var(--border-subtle)" }}>
                  Back
                </button>
              </div>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Starting fresh charges the full entry fee again — this is a new attempt, not a replay.
              </p>
            </motion.div>
          )}

          {/* Error */}
          {phase === "error" && (
            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-4 pt-16 text-center px-4">
              <XCircle size={40} style={{ color: "var(--text-muted)" }} />
              <p style={{ color: "var(--text-secondary)" }}>{error || "Something went wrong"}</p>
              <button onClick={startOrResume}
                className="px-6 py-2.5 rounded-xl font-bold text-sm"
                style={{ backgroundColor: "var(--accent-indigo)", color: "#fff" }}>
                Retry
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
