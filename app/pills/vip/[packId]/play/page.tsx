"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { specialsApi, type VipStartResponse, type VipAnswerResponse, ApiError } from "@/lib/api";
import { Confetti } from "@/components/ui/Confetti";
import { X, XCircle, Trophy, Loader2, Clock, ClipboardCheck, BanIcon, AlertTriangle } from "lucide-react";

type Phase = "loading" | "playing" | "exam_complete" | "time_up" | "already_attempted" | "error";

// ── Exit confirmation dialog ──────────────────────────────────────────────────
function ExitDialog({ entryFee, onConfirm, onCancel }: {
  entryFee: number; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 20px" }}
      onClick={onCancel}
    >
      <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)" }} />
      <motion.div
        initial={{ scale: 0.92, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 16 }}
        transition={{ type: "spring", stiffness: 380, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative", width: "100%", maxWidth: 400, borderRadius: 20,
          padding: "28px 24px", backgroundColor: "var(--bg-card)",
          border: "1px solid rgba(239,68,68,0.25)",
          boxShadow: "0 0 48px rgba(239,68,68,0.12)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, textAlign: "center" }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", backgroundColor: "rgba(239,68,68,0.1)", border: "2px solid rgba(239,68,68,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <AlertTriangle size={24} style={{ color: "#f87171" }} />
          </div>
          <div>
            <p style={{ fontSize: 17, fontWeight: 800, color: "var(--text-primary)", margin: "0 0 8px" }}>Leave exam?</p>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.55, margin: 0 }}>
              This is a one-attempt Special. Leaving now forfeits your attempt and your entry fee of{" "}
              <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#f87171" }}>₦{entryFee.toLocaleString()}</span>.
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, width: "100%" }}>
            <button onClick={onCancel}
              style={{ flex: 1, padding: "12px 0", borderRadius: 10, border: "1px solid var(--border-subtle)", backgroundColor: "transparent", color: "var(--text-primary)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              Stay in exam
            </button>
            <button onClick={onConfirm}
              style={{ flex: 1, padding: "12px 0", borderRadius: 10, border: "none", backgroundColor: "rgba(239,68,68,0.15)", color: "#f87171", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              Leave anyway
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Exam timer bar ────────────────────────────────────────────────────────────
function ExamTimerBar({ secondsLeft, totalSeconds }: { secondsLeft: number; totalSeconds: number }) {
  const pct = totalSeconds > 0 ? (secondsLeft / totalSeconds) * 100 : 0;
  const isCritical = pct < 10;
  const isWarning  = pct < 25;
  const barColor   = isCritical ? "#ef4444" : isWarning ? "var(--accent-amber)" : "var(--accent-indigo)";
  const textColor  = isCritical ? "#ef4444" : isWarning ? "var(--accent-amber)" : "var(--text-primary)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <Clock size={14} style={{ flexShrink: 0, color: textColor }} />
      <div style={{ flex: 1, height: 5, borderRadius: 3, backgroundColor: "#1E1E1E", overflow: "hidden" }}>
        <motion.div
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: "linear" }}
          style={{ height: "100%", borderRadius: 3, backgroundColor: barColor }}
        />
      </div>
      <span style={{ fontSize: 13, fontFamily: "monospace", fontWeight: 700, flexShrink: 0, minWidth: 44, textAlign: "right", color: textColor }}>
        {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, "0")}
      </span>
    </div>
  );
}

// ── Exam question ─────────────────────────────────────────────────────────────
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
    <div style={{ display: "flex", flexDirection: "column", gap: 24, userSelect: "none" }} onContextMenu={(e) => e.preventDefault()}>
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.09em", color: "var(--accent-amber)", marginBottom: 12 }}>
          Question {questionNum} of {totalQuestions}
        </p>
        <p style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.45, color: "var(--text-primary)", margin: 0 }}>{question}</p>
      </div>

      {format === "multiple_choice" && options && options.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {options.map((opt, i) => (
            <button key={i} onClick={() => setSelected(opt)} disabled={isLoading}
              style={{
                width: "100%", textAlign: "left", padding: "16px 20px", borderRadius: 12,
                border: selected === opt ? "1.5px solid var(--accent-amber)" : "1.5px solid var(--border-subtle)",
                backgroundColor: selected === opt ? "rgba(232,163,61,0.08)" : "var(--bg-card)",
                color: selected === opt ? "var(--accent-amber)" : "var(--text-primary)",
                fontSize: 15, fontWeight: selected === opt ? 600 : 400,
                cursor: isLoading ? "not-allowed" : "pointer", transition: "all 0.12s",
              }}>
              {opt}
            </button>
          ))}
          <button onClick={() => selected && submit(selected)} disabled={!selected || isLoading}
            style={{
              marginTop: 4, width: "100%", padding: "15px 0", borderRadius: 12, border: "none",
              backgroundColor: selected ? "var(--accent-amber)" : "var(--border-subtle)",
              color: selected ? "#000" : "var(--text-muted)", fontSize: 15, fontWeight: 700,
              cursor: !selected || isLoading ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: isLoading ? 0.6 : 1,
            }}>
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : null}
            {isLoading ? "Saving..." : "Next →"}
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input type="text" placeholder="Type your answer..."
            value={typed} onChange={(e) => setTyped(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit(typed)} disabled={isLoading}
            style={{ width: "100%", padding: "16px 20px", borderRadius: 12, boxSizing: "border-box", border: "1.5px solid var(--border-subtle)", backgroundColor: "var(--bg-card)", color: "var(--text-primary)", fontSize: 15, outline: "none" }}
          />
          <button onClick={() => submit(typed)} disabled={!typed.trim() || isLoading}
            style={{
              width: "100%", padding: "15px 0", borderRadius: 12, border: "none",
              backgroundColor: typed.trim() ? "var(--accent-amber)" : "var(--border-subtle)",
              color: typed.trim() ? "#000" : "var(--text-muted)", fontSize: 15, fontWeight: 700,
              cursor: !typed.trim() || isLoading ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: isLoading ? 0.6 : 1,
            }}>
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : null}
            {isLoading ? "Saving..." : "Next →"}
          </button>
        </div>
      )}
      <p style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "center" }}>
        Answers are not revealed until the exam is complete
      </p>
    </div>
  );
}

// ── Score bar ─────────────────────────────────────────────────────────────────
function ScoreBar({ score, total, required }: { score: number; total: number; required: number }) {
  const passed = score >= required;
  const pct = total > 0 ? (score / total) * 100 : 0;
  return (
    <div style={{ width: "100%", maxWidth: 360 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6, color: "var(--text-muted)" }}>
        <span>{score} correct</span>
        <span>{total - score} incorrect</span>
      </div>
      <div style={{ height: 8, borderRadius: 4, backgroundColor: "#1E1E1E", overflow: "hidden", marginBottom: 6 }}>
        <div style={{ height: "100%", borderRadius: 4, width: `${pct}%`, backgroundColor: passed ? "var(--accent-amber)" : "#f87171", transition: "width 0.6s ease" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--text-muted)" }}>
        <span>{score}/{total}</span>
        <span>Pass: {required}/{total}</span>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function SpecialsPlayPage() {
  const params = useParams();
  const router = useRouter();
  const { state, dispatch } = useApp();
  const packId = params.packId as string;

  const [phase, setPhase]               = useState<Phase>("loading");
  const [attemptId, setAttemptId]       = useState<string | null>(null);
  const [currentQ, setCurrentQ]         = useState<VipStartResponse["question"] | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotal]      = useState(10);
  const [requiredCorrect, setRequired]  = useState(8);
  const [packName, setPackName]         = useState("");
  const [entryFee, setEntryFee]         = useState(0);
  const [submitting, setSubmitting]     = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [showExitDialog, setShowExitDialog] = useState(false);
  // End-of-exam state
  const [finalScore, setFinalScore]     = useState(0);
  const [finalPrize, setFinalPrize]     = useState(0);
  const [passed, setPassed]             = useState(false);
  // Exam timer
  const [examSeconds, setExamSeconds]   = useState(0);
  const [totalExamSeconds, setTotalExamS] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTimer = () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } };
  const startTimer = (seconds: number) => {
    stopTimer(); setExamSeconds(seconds); setTotalExamS(seconds);
    timerRef.current = setInterval(() => {
      setExamSeconds((prev) => {
        if (prev <= 1) { stopTimer(); setPhase("time_up"); return 0; }
        return prev - 1;
      });
    }, 1000);
  };
  useEffect(() => () => stopTimer(), []);

  const start = useCallback(async () => {
    if (!state.isAuthenticated) { router.push("/auth"); return; }
    if (!packId || packId === "[packId]") {
      setError(`Invalid pack ID: "${packId}" — check routing`);
      setPhase("error");
      return;
    }
    setPhase("loading"); setError(null); stopTimer();
    try {
      const res: VipStartResponse = await specialsApi.start(packId);
      setAttemptId(res.session_id);
      setPackName(res.pack_name);
      setEntryFee(res.entry_fee);
      setTotal(res.total_questions);
      setRequired(res.required_correct ?? Math.ceil(res.total_questions * 0.7));
      setQuestionIndex(res.current_question_index);
      setCurrentQ(res.question);
      if (res.is_new_attempt && res.new_balance !== undefined) {
        dispatch({ type: "UPDATE_BALANCE", balance: res.new_balance });
      }
      const dur = res.exam_duration ?? res.question.timer;
      startTimer(dur > 0 ? dur : 900);
      setPhase("playing");
    } catch (err) {
      if (err instanceof ApiError && (err.code === "ALREADY_ATTEMPTED" || err.status === 409)) {
        setPhase("already_attempted");
      } else {
        setError(err instanceof ApiError ? err.message : "Failed to start exam");
        setPhase("error");
      }
    }
  }, [packId, state.isAuthenticated, router, dispatch]); // eslint-disable-line

  useEffect(() => { start(); }, [start]);

  const handleAnswer = async (answer: string) => {
    if (!attemptId) return;
    setSubmitting(true);
    try {
      const res: VipAnswerResponse = await specialsApi.answer(attemptId, answer);
      if (res.streak_complete) {
        stopTimer();
        const score = res.score ?? (res.correct ? questionIndex + 1 : questionIndex);
        setFinalScore(score);
        setFinalPrize(res.prize ?? 0);
        setPassed(res.passed ?? score >= requiredCorrect);
        if (res.new_balance !== undefined) dispatch({ type: "UPDATE_BALANCE", balance: res.new_balance });
        setPhase("exam_complete");
      } else if (res.next_question && res.next_question_index !== undefined) {
        setCurrentQ(res.next_question);
        setQuestionIndex(res.next_question_index);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to submit answer");
      setPhase("error");
    } finally { setSubmitting(false); }
  };

  const handleExitConfirm = () => { stopTimer(); router.push("/pills"); };
  const displayQ = questionIndex + 1;
  const balance  = state.player?.balance ?? 0;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0A0A0A", color: "var(--text-primary)", position: "relative", overflowX: "hidden" }}>

      {/* Ambient radial glow — top-center, amber, low opacity */}
      <div style={{
        position: "fixed", top: -120, left: "50%", transform: "translateX(-50%)",
        width: 600, height: 400, borderRadius: "50%",
        background: "radial-gradient(ellipse, rgba(232,163,61,0.07) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0,
      }} />

      {/* ── Immersive top bar (replaces app shell header) ── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 40,
        backgroundColor: "rgba(10,10,10,0.95)", backdropFilter: "blur(14px)",
        borderBottom: "1px solid #1A1A1A",
      }}>
        <div style={{
          maxWidth: 560, margin: "0 auto", padding: "12px 20px",
          display: "flex", flexDirection: "column", gap: 10,
        }}>
          {/* Top row: exit | badge + name | balance */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>

            {/* Exit — only shows a dialog during active attempt */}
            <button
              onClick={() => phase === "playing" ? setShowExitDialog(true) : router.push("/pills")}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "6px 10px", borderRadius: 8, border: "1px solid var(--border-subtle)",
                backgroundColor: "transparent", color: "var(--text-muted)", fontSize: 12, fontWeight: 600,
                cursor: "pointer", flexShrink: 0,
              }}>
              <X size={14} /> Exit
            </button>

            {/* Center: badge + pack name */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, overflow: "hidden" }}>
              <span style={{
                fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 4,
                textTransform: "uppercase", letterSpacing: "0.06em",
                backgroundColor: "rgba(232,163,61,0.15)", color: "var(--accent-amber)",
                boxShadow: "0 0 8px rgba(232,163,61,0.2)",
                display: "flex", alignItems: "center", gap: 4, flexShrink: 0,
              }}>
                <ClipboardCheck size={9} /> SPECIAL
              </span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {packName}
              </span>
            </div>

            {/* Balance — right */}
            <span style={{ fontSize: 12, fontFamily: "monospace", fontWeight: 700, color: "var(--accent-amber)", flexShrink: 0 }}>
              ₦{balance.toLocaleString()}
            </span>
          </div>

          {/* Progress dots — only during playing */}
          {(phase === "playing" || phase === "loading") && (
            <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
              {Array.from({ length: Math.min(totalQuestions, 20) }).map((_, i) => (
                <div key={i} style={{
                  width: 5, height: 5, borderRadius: "50%", transition: "background-color 0.2s",
                  backgroundColor: i < questionIndex ? "var(--accent-amber)" : i === questionIndex && phase === "playing" ? "rgba(232,163,61,0.5)" : "#2A2A2A",
                }} />
              ))}
            </div>
          )}

          {/* Timer bar — only during playing */}
          {phase === "playing" && (
            <ExamTimerBar secondsLeft={examSeconds} totalSeconds={totalExamSeconds} />
          )}
        </div>
      </header>

      {/* ── Main content column ── */}
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "32px 24px 80px", position: "relative", zIndex: 1 }}>
        <AnimatePresence mode="wait">

          {/* Loading */}
          {phase === "loading" && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "55vh", gap: 16 }}>
              <div style={{ width: 60, height: 60, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(232,163,61,0.1)", boxShadow: "0 0 28px rgba(232,163,61,0.25)" }}>
                <Loader2 size={26} className="animate-spin" style={{ color: "var(--accent-amber)" }} />
              </div>
              <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Loading exam...</p>
            </motion.div>
          )}

          {/* Playing */}
          {phase === "playing" && currentQ && (
            <motion.div key={`q-${questionIndex}`}
              initial={{ opacity: 0, x: 28 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -28 }}
              transition={{ duration: 0.18 }}>
              <ExamQuestion
                question={currentQ.question} format={currentQ.format} options={currentQ.options}
                onSubmit={handleAnswer} isLoading={submitting}
                questionNum={displayQ} totalQuestions={totalQuestions}
              />
            </motion.div>
          )}

          {/* Exam complete */}
          {phase === "exam_complete" && (
            <motion.div key="complete" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", damping: 14 }}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24, textAlign: "center", paddingTop: 24 }}>
              {passed && <Confetti />}
              <motion.div animate={passed ? { scale: [1, 1.1, 1], rotate: [0, 4, -4, 0] } : {}}
                transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 2 }}
                style={{
                  width: 108, height: 108, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                  backgroundColor: passed ? "rgba(232,163,61,0.12)" : "rgba(239,68,68,0.1)",
                  boxShadow: passed ? "0 0 48px rgba(232,163,61,0.4)" : "0 0 28px rgba(239,68,68,0.2)",
                  border: passed ? "none" : "2px solid rgba(239,68,68,0.3)",
                }}>
                {passed ? <Trophy size={52} style={{ color: "var(--accent-amber)" }} /> : <XCircle size={48} className="text-red-400" />}
              </motion.div>
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: passed ? "var(--accent-amber)" : "#f87171", marginBottom: 8 }}>
                  {passed ? "Passed" : "Not Passed"}
                </p>
                <h1 style={{ fontSize: 32, fontWeight: 900, color: passed ? "var(--accent-amber)" : "var(--text-primary)", margin: "0 0 6px" }}>
                  {passed ? "Exam Complete!" : "Better Luck Next Time"}
                </h1>
                <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>{packName}</p>
              </div>
              <ScoreBar score={finalScore} total={totalQuestions} required={requiredCorrect} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, width: "100%", maxWidth: 360 }}>
                {[
                  { label: "Score",     value: `${finalScore}/${totalQuestions}`,     color: passed ? "var(--accent-amber)" : "#f87171" },
                  { label: "Pass mark", value: `${requiredCorrect}/${totalQuestions}`, color: "var(--text-muted)" },
                  { label: "Result",    value: passed ? "PASS" : "FAIL",               color: passed ? "var(--accent-amber)" : "#f87171" },
                ].map((s) => (
                  <div key={s.label} style={{ borderRadius: 10, padding: "12px 8px", textAlign: "center", backgroundColor: "var(--bg-card)", border: "1px solid var(--border-hairline)" }}>
                    <p style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", margin: "0 0 4px" }}>{s.label}</p>
                    <p style={{ fontSize: 15, fontFamily: "monospace", fontWeight: 800, color: s.color, margin: 0 }}>{s.value}</p>
                  </div>
                ))}
              </div>
              {passed && finalPrize > 0 && (
                <div style={{ borderRadius: 14, padding: "18px 32px", textAlign: "center", backgroundColor: "rgba(232,163,61,0.08)", border: "1px solid rgba(232,163,61,0.25)" }}>
                  <p style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 6 }}>Prize Credited</p>
                  <p style={{ fontSize: 34, fontFamily: "monospace", fontWeight: 900, color: "var(--accent-amber)", margin: 0 }}>+₦{finalPrize.toLocaleString()}</p>
                </div>
              )}

              <div style={{ display: "flex", gap: 12, width: "100%", maxWidth: 360 }}>
                {passed && (
                  <button onClick={() => router.push("/wallet")}
                    style={{ flex: 1, padding: "13px 0", borderRadius: 10, border: "none", backgroundColor: "var(--accent-amber)", color: "#000", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                    View Wallet
                  </button>
                )}
                <button onClick={() => router.push("/pills")}
                  style={{ flex: passed ? 1 : 2, padding: "13px 0", borderRadius: 10, border: "1px solid var(--border-subtle)", backgroundColor: "transparent", color: "var(--text-primary)", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                  Back to Pills
                </button>
              </div>
            </motion.div>
          )}

          {/* Time up */}
          {phase === "time_up" && (
            <motion.div key="time_up" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, paddingTop: 48, textAlign: "center" }}>
              <div style={{ width: 80, height: 80, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(232,163,61,0.08)", border: "2px solid rgba(232,163,61,0.3)" }}>
                <Clock size={40} style={{ color: "var(--accent-amber)" }} />
              </div>
              <div>
                <h2 style={{ fontSize: 26, fontWeight: 900, color: "var(--text-primary)", marginBottom: 6 }}>Time&apos;s Up</h2>
                <p style={{ fontSize: 14, color: "var(--text-muted)" }}>You reached question {displayQ} of {totalQuestions} before time ran out.</p>
              </div>
              <p style={{ fontSize: 12, color: "var(--text-muted)", maxWidth: 300 }}>This is a one-attempt Special. Re-entry is not available.</p>
              <button onClick={() => router.push("/pills")}
                style={{ padding: "12px 32px", borderRadius: 10, border: "1px solid var(--border-subtle)", backgroundColor: "transparent", color: "var(--text-primary)", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                Back to Pills
              </button>
            </motion.div>
          )}

          {/* Already attempted */}
          {phase === "already_attempted" && (
            <motion.div key="already" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, paddingTop: 48, textAlign: "center" }}>
              <div style={{ width: 80, height: 80, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(239,68,68,0.08)", border: "2px solid rgba(239,68,68,0.25)" }}>
                <BanIcon size={40} className="text-red-400" />
              </div>
              <div>
                <h2 style={{ fontSize: 26, fontWeight: 900, color: "var(--text-primary)", marginBottom: 6 }}>Already Attempted</h2>
                <p style={{ fontSize: 14, color: "var(--text-muted)", maxWidth: 300, lineHeight: 1.6 }}>
                  You&apos;ve already sat this Special exam. Each Special allows only one attempt per player — this one is complete for you.
                </p>
              </div>
              <button onClick={() => router.push("/pills")}
                style={{ padding: "12px 32px", borderRadius: 10, border: "none", backgroundColor: "var(--accent-indigo)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                Browse Other Pills
              </button>
            </motion.div>
          )}

          {/* Error */}
          {phase === "error" && (
            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, paddingTop: 80, textAlign: "center" }}>
              <XCircle size={40} style={{ color: "var(--text-muted)" }} />
              <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>{error || "Something went wrong"}</p>
              <button onClick={start}
                style={{ padding: "11px 28px", borderRadius: 10, border: "none", backgroundColor: "var(--accent-indigo)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                Retry
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Exit confirmation dialog */}
      <AnimatePresence>
        {showExitDialog && (
          <ExitDialog
            entryFee={entryFee}
            onConfirm={handleExitConfirm}
            onCancel={() => setShowExitDialog(false)}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
