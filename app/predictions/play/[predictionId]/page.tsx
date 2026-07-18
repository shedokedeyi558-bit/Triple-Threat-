"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { predictionsApi, ApiError, type PredictionData } from "@/lib/api";
import { withTimeout } from "@/lib/withTimeout";
import {
  ChevronLeft, Clock, Users, Lock, CheckCircle2,
  XCircle, Loader2, Timer, Trophy, AlertCircle
} from "lucide-react";

type PageState = "loading" | "detail" | "enter" | "submit" | "locked" | "result" | "error";

interface Result {
  won: boolean;
  correctAnswer: string;
  prize: number;
}

// ─── Countdown hook ────────────────────────────────────────────────────────────
function useCountdown(target: string) {
  const [timeLeft, setTimeLeft] = useState(0);
  useEffect(() => {
    const tick = () => setTimeLeft(Math.max(0, Math.floor((new Date(target).getTime() - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);
  const h = Math.floor(timeLeft / 3600);
  const m = Math.floor((timeLeft % 3600) / 60);
  const s = timeLeft % 60;
  const label = timeLeft <= 0 ? "Expired" : h > 0 ? `${h}h ${m}m ${s}s` : m > 0 ? `${m}m ${s}s` : `${s}s`;
  return { timeLeft, label, expired: timeLeft <= 0 };
}

// ─── Detail view — before entering ────────────────────────────────────────────
function PredictionDetail({
  prediction,
  onEnter,
  entering,
  error,
  bonusBalance,
}: {
  prediction: PredictionData;
  onEnter: () => void;
  entering: boolean;
  error: string | null;
  bonusBalance: number;
}) {
  const countdown = useCountdown(prediction.countdown_end);
  const fill = Math.round((prediction.slots_filled / prediction.max_slots) * 100);
  const lockDate = new Date(prediction.countdown_end).toLocaleDateString("en-NG", {
    weekday: "long", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
  const eventDateLabel = prediction.event_date
    ? new Date(prediction.event_date).toLocaleDateString("en-NG", {
        weekday: "long", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
      })
    : null;

  return (
    <div className="space-y-5">
      {/* Question */}
      <div>
        <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: "var(--accent-violet)" }}>
          {prediction.category}
        </span>
        <h1 className="font-black text-2xl leading-tight mt-2" style={{ color: "var(--text-primary)" }}>
          {prediction.question}
        </h1>
        {eventDateLabel && (
          <div className="flex items-center gap-2 mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
            <Clock size={12} style={{ color: "var(--accent-violet)" }} />
            <span>Event: <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{eventDateLabel}</span></span>
          </div>
        )}
      </div>

      {/* Countdown */}
      <div
        className="rounded-2xl p-5 border flex items-center justify-between"
        style={countdown.expired
          ? { backgroundColor: "rgba(194,65,12,0.08)", borderColor: "rgba(194,65,12,0.25)" }
          : { backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }
        }
      >
        <div>
          <p className="text-[11px] uppercase tracking-widest font-bold mb-1" style={{ color: "var(--text-muted)" }}>
            {countdown.expired ? "Predictions Locked" : "Lock-in Deadline"}
          </p>
          <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>{lockDate}</p>
        </div>
        <div className="text-right">
          {countdown.expired
            ? <Lock size={24} style={{ color: "var(--accent-amber)" }} />
            : <p className="font-black text-2xl tabular-nums font-mono" style={{ color: "var(--accent-amber)" }}>{countdown.label}</p>
          }
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Entry Fee", value: `₦${prediction.fee?.toLocaleString()}`, color: "var(--text-primary)" },
          { label: "Prize/Win", value: `₦${prediction.prize_per_winner?.toLocaleString()}`, color: "var(--accent-amber)" },
          { label: "Players", value: `${prediction.slots_filled}/${prediction.max_slots}`, color: "var(--text-primary)" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl p-3 text-center border" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-hairline)" }}>
            <p className="text-[10px] uppercase tracking-wide mb-1 font-bold" style={{ color: "var(--text-muted)" }}>{s.label}</p>
            <p className="font-black text-lg font-mono" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Participation bar */}
      <div className="rounded-xl p-4 space-y-2 border" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-hairline)" }}>
        <div className="flex justify-between text-xs" style={{ color: "var(--text-muted)" }}>
          <span className="flex items-center gap-1"><Users size={11} /> {prediction.slots_filled} joined</span>
          <span>{fill}% filled</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "var(--bg-base)" }}>
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: "var(--accent-indigo)" }}
            initial={{ width: 0 }}
            animate={{ width: `${fill}%` }}
            transition={{ duration: 0.8 }}
          />
        </div>
        <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{prediction.max_slots - prediction.slots_filled} slots remaining</p>
      </div>

      {/* How it works */}
      <div className="rounded-2xl p-5 space-y-3 border" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-hairline)" }}>
        <p className="text-[11px] uppercase tracking-widest font-bold" style={{ color: "var(--text-muted)" }}>How it works</p>
        {[
          { icon: <Timer size={14} style={{ color: "var(--accent-indigo)" }} />, text: "Pay entry fee and submit your prediction before the deadline" },
          { icon: <Lock size={14} style={{ color: "var(--accent-amber)" }} />, text: "Predictions lock when the countdown ends" },
          { icon: <Trophy size={14} style={{ color: "var(--accent-amber)" }} />, text: "After the event, admin reveals the correct answer — winners get paid instantly" },
        ].map((item, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: "var(--bg-base)" }}>
              {item.icon}
            </div>
            <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>{item.text}</p>
          </div>
        ))}
      </div>

      {error && (
        <div className="rounded-xl p-3 flex gap-2 items-start border" style={{ backgroundColor: "rgba(239,68,68,0.06)", borderColor: "rgba(239,68,68,0.25)" }}>
          <AlertCircle size={15} className="flex-shrink-0 mt-0.5" style={{ color: "#f87171" }} />
          <p className="text-sm" style={{ color: "#f87171" }}>{error}</p>
        </div>
      )}

      {/* CTA */}
      {!countdown.expired && (
        <>
          {/* Bonus breakdown if applicable */}
          {bonusBalance > 0 && (
            <p className="text-xs text-center" style={{ color: "var(--accent-amber)", marginBottom: 4 }}>
              ₦{Math.min(bonusBalance, prediction.fee ?? 0).toLocaleString()} from bonus credit
            </p>
          )}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onEnter}
            disabled={entering}
            className="w-full py-4 font-black text-base rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ backgroundColor: "var(--accent-indigo)", color: "#fff" }}
          >
            {entering ? <Loader2 size={18} className="animate-spin" /> : null}
            {entering ? "Charging..." : `Enter & Pay ₦${prediction.fee?.toLocaleString()}`}
          </motion.button>
        </>
      )}

      {countdown.expired && (
        <div className="w-full py-4 rounded-xl text-center border" style={{ backgroundColor: "var(--bg-card)", borderColor: "rgba(194,65,12,0.3)" }}>
          <p className="font-bold text-sm" style={{ color: "var(--accent-amber)" }}>Predictions are locked for this event</p>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Waiting for admin to reveal the correct answer</p>
        </div>
      )}
    </div>
  );
}

// ─── Submit view — after entering ─────────────────────────────────────────────
function PredictionSubmit({
  prediction,
  onSubmit,
  submitting,
  error,
  submitAttempted,
}: {
  prediction: PredictionData;
  onSubmit: (answer: string) => void;
  submitting: boolean;
  error: string | null;
  submitAttempted: boolean;
}) {
  const [answer, setAnswer] = useState("");
  const countdown = useCountdown(prediction.countdown_end);

  // When countdown expires and NO submit was ever initiated, lock without any network call
  const timesUpNoSubmit = countdown.expired && !submitAttempted && !submitting;

  return (
    <div className="space-y-5">
      <div>
        <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: "var(--accent-violet)" }}>
          {prediction.category}
        </span>
        <h1 className="font-black text-2xl leading-tight mt-2" style={{ color: "var(--text-primary)" }}>
          {prediction.question}
        </h1>
      </div>

      {/* Entry paid confirmation */}
      <div className="rounded-xl p-4 flex items-center gap-3 border" style={{ backgroundColor: "rgba(76,111,255,0.06)", borderColor: "rgba(76,111,255,0.2)" }}>
        <CheckCircle2 size={18} className="flex-shrink-0" style={{ color: "var(--accent-indigo)" }} />
        <p className="text-sm font-semibold" style={{ color: "var(--accent-indigo)" }}>Entry paid — submit your prediction before the deadline</p>
      </div>

      <div
        className="rounded-xl p-4 flex items-center justify-between border"
        style={countdown.expired
          ? { backgroundColor: "rgba(194,65,12,0.08)", borderColor: "rgba(194,65,12,0.25)" }
          : { backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }
        }
      >
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{countdown.expired ? "Locked" : "Lock-in in"}</p>
        {countdown.expired
          ? <Lock size={16} style={{ color: "var(--accent-amber)" }} />
          : <p className="font-black tabular-nums font-mono" style={{ color: "var(--accent-amber)" }}>{countdown.label}</p>
        }
      </div>

      {/* Active input state */}
      {!countdown.expired && (
        <>
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-widest block" style={{ color: "var(--text-muted)" }}>
              Your Prediction
            </label>
            <input
              type="text"
              placeholder="Type your answer..."
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && answer.trim() && !submitting) onSubmit(answer); }}
              autoFocus
              className="w-full rounded-xl px-4 py-4 text-lg outline-none transition-colors"
              style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)" }}
            />
          </div>

          {error && (
            <p className="text-sm rounded-xl p-3" style={{ color: "#f87171", backgroundColor: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.25)" }}>{error}</p>
          )}

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => onSubmit(answer)}
            disabled={!answer.trim() || submitting}
            className="w-full py-4 font-black text-base rounded-xl disabled:opacity-40 flex items-center justify-center gap-2"
            style={{ backgroundColor: "var(--accent-indigo)", color: "#fff" }}
          >
            {submitting ? <Loader2 size={18} className="animate-spin" /> : null}
            {submitting ? "Submitting…" : "Lock In Prediction"}
          </motion.button>

          {submitting && (
            <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
              Connecting… will retry once if this takes a moment
            </p>
          )}
        </>
      )}

      {/* Time's up — no submit was initiated */}
      {timesUpNoSubmit && (
        <div className="rounded-xl p-5 text-center border space-y-2"
          style={{ backgroundColor: "rgba(107,114,128,0.06)", borderColor: "rgba(107,114,128,0.2)" }}>
          <Lock size={22} className="mx-auto" style={{ color: "#6b7280" }} />
          <p className="font-bold text-sm" style={{ color: "var(--text-secondary)" }}>Time&apos;s up — no prediction submitted</p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            The deadline passed before you submitted. Your entry fee is retained but no answer is locked in.
          </p>
        </div>
      )}

      {/* Locked while submit is in-flight */}
      {countdown.expired && !timesUpNoSubmit && !submitting && (
        <div className="rounded-xl p-4 text-center border" style={{ backgroundColor: "var(--bg-card)", borderColor: "rgba(194,65,12,0.25)" }}>
          <p className="font-bold text-sm" style={{ color: "var(--accent-amber)" }}>Deadline passed — predictions are now locked</p>
        </div>
      )}
    </div>
  );
}

// ─── Locked / Waiting state ────────────────────────────────────────────────────
function PredictionWaiting({
  answer,
  predictionId,
  setResult,
  setPageState,
  onNotParticipant,
  submittedByPlayer,
}: {
  answer: string;
  predictionId: string;
  setResult: React.Dispatch<React.SetStateAction<Result | null>>;
  setPageState: React.Dispatch<React.SetStateAction<PageState>>;
  onNotParticipant?: () => void;
  submittedByPlayer?: boolean;
}) {
  const [checking, setChecking] = useState(false);

  const handleCheckResult = async () => {
    setChecking(true);
    try {
      const res = await predictionsApi.getResult(predictionId);
      if (res?.correctAnswer) {
        setResult({ won: res.won, correctAnswer: res.correctAnswer, prize: res.prize || 0 });
        setPageState("result");
      } else {
        alert("Result not available yet — check back soon");
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        if (err.code === "NOT_PARTICIPANT") {
          alert("You didn't enter this prediction");
          onNotParticipant?.();
        } else {
          // NOT_REVEALED or any other 404
          alert("Result not available yet — check back soon");
        }
      } else {
        alert("Error checking result — please try again");
      }
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="space-y-5">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="text-center pt-4">
        {/* Icon — indigo = submitted, gray = timed out unanswered */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-5"
          style={submittedByPlayer === false
            ? { backgroundColor: "rgba(107,114,128,0.1)", border: "2px solid rgba(107,114,128,0.2)" }
            : { backgroundColor: "rgba(76,111,255,0.1)", border: "2px solid rgba(76,111,255,0.2)" }}>
          {submittedByPlayer === false
            ? <Lock size={40} style={{ color: "#6b7280" }} />
            : <CheckCircle2 size={40} style={{ color: "var(--accent-indigo)" }} />}
        </div>
        {submittedByPlayer === false ? (
          <>
            <h2 className="font-black text-2xl" style={{ color: "var(--text-primary)" }}>Time&apos;s up — not submitted</h2>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>The deadline passed before an answer was locked in</p>
          </>
        ) : (
          <>
            <h2 className="font-black text-2xl" style={{ color: "var(--text-primary)" }}>Prediction Submitted!</h2>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Your answer is locked in</p>
          </>
        )}
      </motion.div>

      <div className="rounded-2xl p-5 text-center border"
        style={{ backgroundColor: "var(--bg-card)", borderColor: "rgba(76,111,255,0.2)" }}>
        <p className="text-[11px] uppercase tracking-widest font-bold mb-2" style={{ color: "var(--text-muted)" }}>Your Prediction</p>
        {answer
          ? <p className="font-black text-3xl font-mono" style={{ color: "var(--accent-indigo)" }}>{answer}</p>
          : <p className="text-sm italic" style={{ color: "var(--text-muted)" }}>Your answer was submitted in a previous session</p>
        }
      </div>

      <div className="rounded-2xl p-5 space-y-4 border"
        style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-hairline)" }}>
        <p className="text-[11px] uppercase tracking-widest font-bold" style={{ color: "var(--text-muted)" }}>What happens next</p>
        {[
          { icon: <Clock size={14} style={{ color: "var(--accent-amber)" }} />, title: "Event takes place", desc: "The real-world event plays out" },
          { icon: <CheckCircle2 size={14} style={{ color: "var(--accent-indigo)" }} />, title: "Admin reveals the answer", desc: "After the event, the correct answer is marked" },
          { icon: <Trophy size={14} style={{ color: "var(--accent-amber)" }} />, title: "Winners paid instantly", desc: "Prize credited to your wallet automatically" },
        ].map((s, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "var(--bg-base)" }}>{s.icon}</div>
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{s.title}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{s.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl p-4 text-center border"
        style={{ backgroundColor: "rgba(232,163,61,0.06)", borderColor: "rgba(232,163,61,0.2)" }}>
        <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          Come back after the event to see if you won. You&apos;ll see the result on this page.
        </p>
        <button
          onClick={handleCheckResult}
          disabled={checking}
          className="mt-3 text-xs font-bold hover:underline flex items-center justify-center gap-1 mx-auto disabled:opacity-50"
          style={{ color: "var(--accent-amber)" }}
        >
          {checking ? <Loader2 size={12} className="animate-spin" /> : null}
          {checking ? "Checking..." : "Check result now →"}
        </button>
      </div>
    </div>
  );
}

// ─── Result state ──────────────────────────────────────────────────────────────
function PredictionResult({ won, correctAnswer, prize, userAnswer }: {
  won: boolean; correctAnswer: string; prize: number; userAnswer: string;
}) {
  return (
    <div className="space-y-5">
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 14 }} className="text-center pt-4">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full mb-5"
          style={won
            ? { backgroundColor: "rgba(232,163,61,0.1)", border: "2px solid rgba(232,163,61,0.3)" }
            : { backgroundColor: "rgba(239,68,68,0.1)", border: "2px solid rgba(239,68,68,0.3)" }
          }>
          {won
            ? <Trophy size={44} style={{ color: "var(--accent-amber)" }} />
            : <XCircle size={44} style={{ color: "#f87171" }} />
          }
        </div>
        <h2 className="font-black text-3xl" style={{ color: won ? "var(--accent-amber)" : "var(--text-primary)" }}>
          {won ? `You Won ₦${prize.toLocaleString()}!` : "Better Luck Next Time"}
        </h2>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          {won ? "Prize has been added to your wallet" : "Keep playing — big wins ahead"}
        </p>
      </motion.div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl p-4 text-center border" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-hairline)" }}>
          <p className="text-[11px] uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>Your Answer</p>
          <p className="font-black text-lg" style={{ color: won ? "var(--accent-indigo)" : "#f87171" }}>
            {userAnswer || "—"}
          </p>
        </div>
        <div className="rounded-xl p-4 text-center border"
          style={{ backgroundColor: "var(--bg-card)", borderColor: "rgba(232,163,61,0.25)" }}>
          <p className="text-[11px] uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>Correct Answer</p>
          <p className="font-black text-lg" style={{ color: "var(--accent-amber)" }}>{correctAnswer}</p>
        </div>
      </div>

      {won && (
        <div className="rounded-xl p-4 text-center border"
          style={{ backgroundColor: "rgba(232,163,61,0.08)", borderColor: "rgba(232,163,61,0.25)" }}>
          <p className="font-black text-xl font-mono" style={{ color: "var(--accent-amber)" }}>
            +₦{prize.toLocaleString()}
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Credited to your wallet</p>
        </div>
      )}
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function PredictionPlayPage() {
  const params = useParams();
  const router = useRouter();
  const { state, dispatch } = useApp();
  const predictionId = params.predictionId as string;

  const [pageState, setPageState] = useState<PageState>("loading");
  const [prediction, setPrediction] = useState<PredictionData | null>(null);
  const [userAnswer, setUserAnswer] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [entering, setEntering] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notParticipant, setNotParticipant] = useState(false);
  // Track whether the player ever initiated a submit — used to distinguish
  // "time's up without submitting" from "submitted (even via retry)"
  const submitAttemptedRef = useRef(false);

  useEffect(() => {
    if (!state.isAuthenticated) { router.push("/auth"); return; }
    init();
  }, [state.isAuthenticated, predictionId]); // eslint-disable-line

  // Poll for result every 10s when in locked/waiting state
  useEffect(() => {
    if (pageState !== "locked" || notParticipant) return;
    const poll = async () => {
      try {
        const res = await predictionsApi.getResult(predictionId);
        if (res?.correctAnswer) {
          setResult({ won: res.won, correctAnswer: res.correctAnswer, prize: res.prize || 0 });
          setPageState("result");
        }
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          if (err.code === "NOT_PARTICIPANT") {
            setNotParticipant(true);
            setError("You didn't enter this prediction");
            setPageState("error");
          }
          // NOT_REVEALED — keep polling silently
        }
        // other errors — keep polling, don't surface
      }
    };
    poll();
    const id = setInterval(poll, 10000);
    return () => clearInterval(id);
  }, [pageState, predictionId, notParticipant]);

  const init = async () => {
    try {
      // ── 1. Check if result is already revealed ──────────────────────────────
      try {
        const res = await predictionsApi.getResult(predictionId);
        if (res?.correctAnswer) {
          setResult({ won: res.won, correctAnswer: res.correctAnswer, prize: res.prize || 0 });
          setPageState("result");
          return;
        }
      } catch { /* not revealed yet — continue */ }

      // ── 2. Load prediction data ─────────────────────────────────────────────
      // Primary: dedicated single-prediction endpoint (works for locked predictions too).
      // Fallback: active-list filter (only works while prediction is still open).
      // Backend flag: if GET /api/predictions/:id doesn't exist yet on Railway,
      //   the getOne call returns 404 and we fall through to the active list.
      let found: PredictionData | null = null;
      try {
        const oneRes = await predictionsApi.getOne(predictionId);
        found = oneRes.prediction ?? null;
      } catch {
        // getOne not available or failed — try active list
        try {
          const listRes = await predictionsApi.getActive();
          found = listRes.predictions.find((p) => p.id === predictionId) ?? null;
        } catch {
          // both failed
        }
      }

      if (!found) {
        setError("This prediction is no longer available");
        setPageState("error");
        return;
      }

      setPrediction(found);

      // ── 3. Check player's prior participation ───────────────────────────────
      // If locked (by status or expired countdown), check if the player has an answer.
      const isLocked = found.status === "locked" || new Date(found.countdown_end) < new Date();
      if (isLocked) {
        try {
          const myAnswer = await predictionsApi.getMyAnswer(predictionId);
          setUserAnswer(myAnswer.answer || null);
        } catch {
          // getMyAnswer failed — try falling back to my-predictions to check state
          try {
            const mine = await predictionsApi.getMine();
            const match = mine.predictions.find((p) => p.id === predictionId);
            if (match && (match.my_answer || (match as any).state === "submitted_waiting")) {
              setUserAnswer(match.my_answer || "submitted");
            }
          } catch { /* stay null — show as unsubmitted */ }
        }
        setPageState("locked");
        return;
      }

      // Still open — check if player already entered (paid) or submitted.
      try {
        const myAnswer = await predictionsApi.getMyAnswer(predictionId);
        setUserAnswer(myAnswer.answer || null);
        setPageState("locked");
        return;
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          // Try my-predictions as fallback before showing detail
          try {
            const mine = await predictionsApi.getMine();
            const match = mine.predictions.find((p) => p.id === predictionId);
            if (match) {
              setUserAnswer(match.my_answer || ((match as any).state === "submitted_waiting" ? "submitted" : null));
              setPageState("locked");
              return;
            }
          } catch { /* not found in mine either — not entered */ }
          setPageState("detail");
          return;
        }
        throw err;
      }

    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load prediction");
      setPageState("error");
    }
  };

  const handleEnter = async () => {
    if (!prediction) return;
    setEntering(true);
    setError(null);
    try {
      await withTimeout(predictionsApi.enter(predictionId), 15000);
      dispatch({ type: "UPDATE_BALANCE", balance: (state.player?.balance ?? 0) - (prediction.fee ?? 0) });
      setPageState("submit");
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409 || err.message.toLowerCase().includes("already")) {
          setPageState("submit");
        } else {
          setError(err.message);
        }
      } else {
        setError(err instanceof Error ? err.message : "Failed to enter prediction");
      }
    } finally {
      setEntering(false);
    }
  };

  const handleSubmit = async (answer: string) => {
    submitAttemptedRef.current = true;
    setSubmitting(true);
    setError(null);

    // Stable idempotency key for this answer — same key used on retry
    const idempotencyKey = `${predictionId}:${answer}:${Date.now()}`;

    const attemptSubmit = () =>
      withTimeout(predictionsApi.submit(predictionId, answer, idempotencyKey), 8000);

    try {
      await attemptSubmit();
      setUserAnswer(answer);
      setPageState("locked");
    } catch (firstErr) {
      // On timeout, retry once with the same idempotency key
      const isTimeout = firstErr instanceof Error &&
        firstErr.message.toLowerCase().includes("taking longer");
      if (isTimeout) {
        try {
          await attemptSubmit();
          setUserAnswer(answer);
          setPageState("locked");
          return;
        } catch (retryErr) {
          // Retry also timed out or failed — fall through to error handling below
          if (retryErr instanceof ApiError) {
            // Check same-answer 409 on retry too
            if (retryErr.status === 409 || retryErr.message.toLowerCase().includes("already submitted")) {
              // If the server locked our answer in — treat as success
              setUserAnswer(answer);
              setPageState("locked");
              return;
            }
          }
          setError("Unable to reach the server — please check your connection and try again");
          return;
        }
      }

      // Not a timeout — handle original error
      if (firstErr instanceof ApiError) {
        if (firstErr.status === 409 || firstErr.message.toLowerCase().includes("already submitted")) {
          // Same answer already locked — success, not an error
          setUserAnswer(answer);
          setPageState("locked");
        } else if (firstErr.message.toLowerCase().includes("not participated")) {
          setError(null);
          setPageState("detail");
        } else {
          // Genuine conflict (different locked answer) or server error
          setError(firstErr.message);
        }
      } else {
        setError(firstErr instanceof Error ? firstErr.message : "Failed to submit");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 lg:px-8 py-6 pb-28">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm font-medium mb-6 transition-colors"
        style={{ color: "var(--text-muted)" }}
      >
        <ChevronLeft size={18} /> Back
      </button>

      <AnimatePresence mode="wait">
        {pageState === "loading" && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex justify-center items-center min-h-64">
            <Loader2 size={28} className="animate-spin" style={{ color: "var(--accent-indigo)" }} />
          </motion.div>
        )}

        {pageState === "detail" && prediction && (
          <motion.div key="detail" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <PredictionDetail prediction={prediction} onEnter={handleEnter} entering={entering} error={error} bonusBalance={state.player?.bonus_balance ?? 0} />
          </motion.div>
        )}

        {pageState === "submit" && prediction && (
          <motion.div key="submit" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <PredictionSubmit prediction={prediction} onSubmit={handleSubmit} submitting={submitting} error={error} submitAttempted={submitAttemptedRef.current} />
          </motion.div>
        )}

        {pageState === "locked" && (
          <motion.div key="locked" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <PredictionWaiting
              answer={userAnswer || ""}
              predictionId={predictionId}
              setResult={setResult}
              setPageState={setPageState}
              onNotParticipant={() => setNotParticipant(true)}
              submittedByPlayer={!!userAnswer}
            />
          </motion.div>
        )}

        {pageState === "result" && result && (
          <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <PredictionResult
              won={result.won}
              correctAnswer={result.correctAnswer}
              prize={result.prize}
              userAnswer={userAnswer || ""}
            />
          </motion.div>
        )}

        {pageState === "error" && (
          <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-center py-16 space-y-4">
            <XCircle size={40} className="mx-auto" style={{ color: "var(--text-muted)" }} />
            <p style={{ color: "var(--text-secondary)" }}>{error || "Something went wrong"}</p>
            <button
              onClick={() => router.back()}
              className="text-sm font-bold hover:underline"
              style={{ color: "var(--accent-indigo)" }}
            >
              Go back
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
