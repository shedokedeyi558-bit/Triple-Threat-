"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { vipPillsApi, type VipStartResponse, type VipAnswerResponse, ApiError } from "@/lib/api";
import { Confetti } from "@/components/ui/Confetti";
import { ChevronLeft, CheckCircle, XCircle, Trophy, Loader2, Clock } from "lucide-react";

type Phase = "loading" | "playing" | "streak_complete" | "time_up" | "failed" | "error";

// ── Exam timer bar ────────────────────────────────────────────────────────────
function ExamTimerBar({ secondsLeft, totalSeconds }: { secondsLeft: number; totalSeconds: number }) {
  const pct = totalSeconds > 0 ? (secondsLeft / totalSeconds) * 100 : 0;
  const isCritical = pct < 10;
  const isWarning  = pct < 25;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <Clock size={13} style={{ flexShrink: 0, color: isCritical ? "#ef4444" : isWarning ? "var(--accent-amber)" : "var(--text-muted)" }} />
      <div style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: "#1E1E1E", overflow: "hidden" }}>
        <motion.div
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: "linear" }}
          style={{ height: "100%", borderRadius: 2, backgroundColor: isCritical ? "#ef4444" : isWarning ? "var(--accent-amber)" : "var(--accent-indigo)" }}
        />
      </div>
      <span style={{
        fontSize: 12, fontFamily: "monospace", fontWeight: 700, flexShrink: 0,
        minWidth: 38, textAlign: "right",
        color: isCritical ? "#ef4444" : isWarning ? "var(--accent-amber)" : "var(--text-primary)",
      }}>
        {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, "0")}
      </span>
    </div>
  );
}

// ── Exam question UI (no per-question timer) ──────────────────────────────────
function ExamQuestion({ question, format, options, onSubmit, isLoading, questionNum, totalQuestions }: {
  question: string; format: "multiple_choice" | "type_answer"; options?: string[];
  onSubmit: (a: string) => void; isLoading: boolean;
  questionNum: number; totalQuestions: number;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [typed, setTyped] = useState("");

  useEffect(() => { setSelected(null); setTyped(""); }, [question]);

  const submit = (ans: string) => { if (!ans.trim() || isLoading) return; onSubmit(ans.trim()); };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--accent-amber)", marginBottom: 8 }}>
          Question {questionNum} of {totalQuestions}
        </p>
        <p style={{ fontSize: 17, fontWeight: 600, lineHeight: 1.5, color: "var(--text-primary)", margin: 0 }}>{question}</p>
      </div>

      {format === "multiple_choice" && options && options.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {options.map((opt, i) => (
            <button key={i} onClick={() => setSelected(opt)} disabled={isLoading}
              style={{
                width: "100%", textAlign: "left", padding: "13px 16px", borderRadius: 10,
                border: selected === opt ? "1.5px solid var(--accent-amber)" : "1.5px solid var(--border-subtle)",
                backgroundColor: selected === opt ? "rgba(232,163,61,0.08)" : "var(--bg-card)",
                color: selected === opt ? "var(--accent-amber)" : "var(--text-primary)",
                fontSize: 14, fontWeight: selected === opt ? 600 : 400,
                cursor: isLoading ? "not-allowed" : "pointer", transition: "all 0.12s",
              }}>
              {opt}
            </button>
          ))}
          <button onClick={() => selected && submit(selected)} disabled={!selected || isLoading}
            style={{
              marginTop: 4, width: "100%", padding: "13px 0", borderRadius: 10, border: "none",
              backgroundColor: selected ? "var(--accent-amber)" : "var(--border-subtle)",
              color: selected ? "#000" : "var(--text-muted)",
              fontSize: 14, fontWeight: 700,
              cursor: !selected || isLoading ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              opacity: isLoading ? 0.6 : 1,
            }}>
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : null}
            {isLoading ? "Submitting..." : "Confirm Answer"}
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input type="text" placeholder="Type your answer..."
            value={typed} onChange={(e) => setTyped(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit(typed)}
            disabled={isLoading}
            style={{
              width: "100%", padding: "13px 16px", borderRadius: 10, boxSizing: "border-box",
              border: "1.5px solid var(--border-subtle)", backgroundColor: "var(--bg-card)",
              color: "var(--text-primary)", fontSize: 14, outline: "none",
            }}
          />
          <button onClick={() => submit(typed)} disabled={!typed.trim() || isLoading}
            style={{
              width: "100%", padding: "13px 0", borderRadius: 10, border: "none",
              backgroundColor: typed.trim() ? "var(--accent-amber)" : "var(--border-subtle)",
              color: typed.trim() ? "#000" : "var(--text-muted)",
              fontSize: 14, fontWeight: 700,
              cursor: !typed.trim() || isLoading ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              opacity: isLoading ? 0.6 : 1,
            }}>
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : null}
            {isLoading ? "Submitting..." : "Confirm Answer"}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function VipPlayPage() {
  const params = useParams();
  const router = useRouter();
  const { state, dispatch } = useApp();
  const packId = params.packId as string;

  const [phase, setPhase]                 = useState<Phase>("loading");
  const [sessionId, setSessionId]         = useState<string | null>(null);
  const [currentQuestion, setCurrentQ]   = useState<VipStartResponse["question"] | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotal]        = useState(10);
  const [packName, setPackName]           = useState("");
  const [entryFee, setEntryFee]           = useState(0);
  const [submitting, setSubmitting]       = useState(false);
  const [failedAt, setFailedAt]           = useState<{ questionNum: number; correctAnswer: string; entryFee: number } | null>(null);
  const [error, setError]                 = useState<string | null>(null);
  const [totalPrize, setTotalPrize]       = useState(0);
  const [examSeconds, setExamSeconds]     = useState(0);
  const [totalExamSeconds, setTotalExamS] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTimer = () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } };

  const startTimer = (seconds: number) => {
    stopTimer();
    setExamSeconds(seconds);
    setTotalExamS(seconds);
    timerRef.current = setInterval(() => {
      setExamSeconds((prev) => {
        if (prev <= 1) { stopTimer(); setPhase("time_up"); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => () => stopTimer(), []);

  const startOrResume = useCallback(async () => {
    if (!state.isAuthenticated) { router.push("/auth"); return; }
    setPhase("loading"); setError(null); stopTimer();
    try {
      const res: VipStartResponse = await vipPillsApi.start(packId);
      setSessionId(res.session_id);
      setPackName(res.pack_name);
      setEntryFee(res.entry_fee);
      setTotal(res.total_questions);
      setQuestionIndex(res.current_question_index);
      setCurrentQ(res.question);
      if (res.is_new_attempt && res.new_balance !== undefined) {
        dispatch({ type: "UPDATE_BALANCE", balance: res.new_balance });
      }
      // Use exam_duration if backend provides it; fall back to question.timer
      const examDuration = (res as any).exam_duration ?? res.question.timer;
      startTimer(examDuration > 0 ? examDuration : 300);
      setPhase("playing");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to start VIP session");
      setPhase("error");
    }
  }, [packId, state.isAuthenticated, router, dispatch]); // eslint-disable-line

  useEffect(() => { startOrResume(); }, [startOrResume]);

  const handleAnswer = async (answer: string) => {
    if (!sessionId) return;
    setSubmitting(true);
    try {
      const res: VipAnswerResponse = await vipPillsApi.answer(sessionId, answer);
      if (res.correct) {
        if (res.streak_complete && res.prize !== undefined) {
          stopTimer();
          setTotalPrize(res.prize);
          if (res.new_balance !== undefined) dispatch({ type: "UPDATE_BALANCE", balance: res.new_balance });
          setPhase("streak_complete");
        } else if (res.next_question && res.next_question_index !== undefined) {
          // Instant advance — no animation delay, exam feel
          setCurrentQ(res.next_question);
          setQuestionIndex(res.next_question_index);
          // Timer keeps running — no reset between questions
        }
      } else {
        stopTimer();
        setFailedAt({ questionNum: res.question_number, correctAnswer: res.correct_answer, entryFee: res.entry_fee });
        setPhase("failed");
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to submit answer");
      setPhase("error");
    } finally { setSubmitting(false); }
  };

  const displayQ = questionIndex + 1;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0A0A0A", color: "var(--text-primary)" }}>

      {/* Sticky header */}
      <header className="sticky top-0 z-40 px-4 py-3 border-b"
        style={{ backgroundColor: "rgba(10,10,10,0.95)", backdropFilter: "blur(12px)", borderColor: "#1A1A1A" }}>
        <div className="max-w-lg mx-auto" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-[#1A1A1A] transition-colors">
              <ChevronLeft size={20} className="text-gray-400" />
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 4, textTransform: "uppercase", backgroundColor: "rgba(232,163,61,0.15)", color: "var(--accent-amber)", boxShadow: "0 0 8px rgba(232,163,61,0.2)" }}>
                VIP
              </span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>{packName}</span>
            </div>
            {/* Progress dots */}
            <div style={{ display: "flex", gap: 4 }}>
              {Array.from({ length: totalQuestions }).map((_, i) => (
                <div key={i} style={{
                  width: 6, height: 6, borderRadius: "50%", transition: "background-color 0.2s",
                  backgroundColor: i < questionIndex ? "var(--accent-amber)" : i === questionIndex && phase === "playing" ? "rgba(232,163,61,0.5)" : "#2A2A2A",
                }} />
              ))}
            </div>
          </div>
          {phase === "playing" && (
            <ExamTimerBar secondsLeft={examSeconds} totalSeconds={totalExamSeconds} />
          )}
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6">
        <AnimatePresence mode="wait">

          {/* Loading */}
          {phase === "loading" && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "55vh", gap: 16 }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(232,163,61,0.1)", boxShadow: "0 0 24px rgba(232,163,61,0.25)" }}>
                <Loader2 size={24} className="animate-spin" style={{ color: "var(--accent-amber)" }} />
              </div>
              <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Loading exam...</p>
            </motion.div>
          )}

          {/* Playing */}
          {phase === "playing" && currentQuestion && (
            <motion.div key={`q-${questionIndex}`}
              initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.18 }}>
              <ExamQuestion
                question={currentQuestion.question}
                format={currentQuestion.format}
                options={currentQuestion.options}
                onSubmit={handleAnswer}
                isLoading={submitting}
                questionNum={displayQ}
                totalQuestions={totalQuestions}
              />
            </motion.div>
          )}

          {/* Win */}
          {phase === "streak_complete" && (
            <motion.div key="win" initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", damping: 14 }}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "70vh", gap: 24, textAlign: "center", padding: "0 16px" }}>
              <Confetti />
              <motion.div animate={{ scale: [1, 1.1, 1], rotate: [0, 4, -4, 0] }}
                transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 2 }}
                style={{ width: 100, height: 100, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(232,163,61,0.12)", boxShadow: "0 0 40px rgba(232,163,61,0.4)" }}>
                <Trophy size={48} style={{ color: "var(--accent-amber)" }} />
              </motion.div>
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--accent-amber)", marginBottom: 8 }}>VIP Champion</p>
                <h1 style={{ fontSize: 32, fontWeight: 900, color: "var(--accent-amber)", margin: "0 0 6px" }}>All {totalQuestions} Correct!</h1>
                <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>You completed {packName}</p>
              </div>
              <div style={{ borderRadius: 16, padding: "18px 32px", textAlign: "center", backgroundColor: "rgba(232,163,61,0.08)", border: "1px solid rgba(232,163,61,0.25)" }}>
                <p style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 6 }}>Prize Credited</p>
                <p style={{ fontSize: 34, fontFamily: "monospace", fontWeight: 900, color: "var(--accent-amber)", margin: 0 }}>+₦{totalPrize.toLocaleString()}</p>
              </div>
              <div style={{ display: "flex", gap: 12, width: "100%", maxWidth: 320 }}>
                <button onClick={() => router.push("/wallet")} style={{ flex: 1, padding: "12px 0", borderRadius: 10, border: "none", backgroundColor: "var(--accent-amber)", color: "#000", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>View Wallet</button>
                <button onClick={() => router.push("/pills")} style={{ flex: 1, padding: "12px 0", borderRadius: 10, border: "1px solid var(--border-subtle)", backgroundColor: "transparent", color: "var(--text-primary)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Back to Pills</button>
              </div>
            </motion.div>
          )}

          {/* Time up */}
          {phase === "time_up" && (
            <motion.div key="time_up" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, paddingTop: 48, textAlign: "center" }}>
              <div style={{ width: 72, height: 72, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(232,163,61,0.08)", border: "2px solid rgba(232,163,61,0.3)" }}>
                <Clock size={36} style={{ color: "var(--accent-amber)" }} />
              </div>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 900, color: "var(--text-primary)", marginBottom: 6 }}>Time&apos;s Up</h2>
                <p style={{ fontSize: 13, color: "var(--text-muted)" }}>You reached question {displayQ} of {totalQuestions} before time ran out.</p>
              </div>
              <div style={{ borderRadius: 12, padding: "14px 20px", border: "1px solid rgba(239,68,68,0.2)", backgroundColor: "rgba(239,68,68,0.05)", width: "100%", maxWidth: 320 }}>
                <p style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "#f87171", marginBottom: 4 }}>Entry Fee Lost</p>
                <p style={{ fontSize: 20, fontFamily: "monospace", fontWeight: 700, color: "#f87171", margin: 0 }}>₦{entryFee.toLocaleString()}</p>
              </div>
              <div style={{ display: "flex", gap: 12, width: "100%", maxWidth: 320 }}>
                <button onClick={startOrResume} style={{ flex: 1, padding: "12px 0", borderRadius: 10, border: "none", backgroundColor: "var(--accent-indigo)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Try Again — ₦{entryFee.toLocaleString()}</button>
                <button onClick={() => router.push("/pills")} style={{ flex: 1, padding: "12px 0", borderRadius: 10, border: "1px solid var(--border-subtle)", backgroundColor: "transparent", color: "var(--text-secondary)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Back</button>
              </div>
              <p style={{ fontSize: 11, color: "var(--text-muted)", maxWidth: 280 }}>Trying again starts a fresh attempt at full entry fee.</p>
            </motion.div>
          )}

          {/* Failed */}
          {phase === "failed" && failedAt && (
            <motion.div key="failed" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, paddingTop: 48, textAlign: "center" }}>
              <div style={{ width: 72, height: 72, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(239,68,68,0.08)", border: "2px solid rgba(239,68,68,0.25)" }}>
                <XCircle size={36} className="text-red-400" />
              </div>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 900, color: "var(--text-primary)", marginBottom: 6 }}>Wrong Answer</h2>
                <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Failed on question {failedAt.questionNum} of {totalQuestions}</p>
              </div>
              <div style={{ width: "100%", maxWidth: 320, display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ borderRadius: 10, padding: "12px 16px", textAlign: "left", border: "1px solid var(--border-hairline)", backgroundColor: "var(--bg-card)" }}>
                  <p style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 4 }}>Correct answer was</p>
                  <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>{failedAt.correctAnswer}</p>
                </div>
                <div style={{ borderRadius: 10, padding: "12px 16px", textAlign: "left", border: "1px solid rgba(239,68,68,0.2)", backgroundColor: "rgba(239,68,68,0.05)" }}>
                  <p style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.08em", color: "#f87171", marginBottom: 4 }}>Entry fee lost</p>
                  <p style={{ fontSize: 15, fontFamily: "monospace", fontWeight: 700, color: "#f87171", margin: 0 }}>₦{failedAt.entryFee.toLocaleString()}</p>
                </div>
              </div>
              <div style={{ display: "flex", gap: 12, width: "100%", maxWidth: 320 }}>
                <button onClick={startOrResume} style={{ flex: 1, padding: "12px 0", borderRadius: 10, border: "none", backgroundColor: "var(--accent-indigo)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Try Again — ₦{entryFee.toLocaleString()}</button>
                <button onClick={() => router.push("/pills")} style={{ flex: 1, padding: "12px 0", borderRadius: 10, border: "1px solid var(--border-subtle)", backgroundColor: "transparent", color: "var(--text-secondary)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Back</button>
              </div>
              <p style={{ fontSize: 11, color: "var(--text-muted)" }}>Trying again starts a fresh attempt at full entry fee.</p>
            </motion.div>
          )}

          {/* Error */}
          {phase === "error" && (
            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, paddingTop: 80, textAlign: "center" }}>
              <XCircle size={36} style={{ color: "var(--text-muted)" }} />
              <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>{error || "Something went wrong"}</p>
              <button onClick={startOrResume} style={{ padding: "10px 24px", borderRadius: 10, border: "none", backgroundColor: "var(--accent-indigo)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Retry</button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
