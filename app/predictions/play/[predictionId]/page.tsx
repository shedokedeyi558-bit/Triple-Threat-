"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { predictionsApi, ApiError, type PredictionData } from "@/lib/api";
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
}: {
  prediction: PredictionData;
  onEnter: () => void;
  entering: boolean;
  error: string | null;
}) {
  const countdown = useCountdown(prediction.countdown_end);
  const fill = Math.round((prediction.slots_filled / prediction.max_slots) * 100);
  const lockDate = new Date(prediction.countdown_end).toLocaleDateString("en-NG", {
    weekday: "long", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
  });

  const eventDateLabel = prediction.event_date
    ? new Date(prediction.event_date).toLocaleDateString("en-NG", {
        weekday: "long", month: "long", day: "numeric",
        hour: "2-digit", minute: "2-digit",
      })
    : null;

  return (
    <div className="space-y-5">
      {/* Question */}
      <div>
        <span className="text-[10px] font-black uppercase tracking-widest text-purple-400">{prediction.category}</span>
        <h1 className="text-white font-black text-2xl leading-tight mt-2">{prediction.question}</h1>
        {eventDateLabel && (
          <div className="flex items-center gap-2 mt-2 text-gray-400 text-xs">
            <Clock size={12} className="text-purple-400" />
            <span>Event: <span className="text-white font-semibold">{eventDateLabel}</span></span>
          </div>
        )}
      </div>

      {/* Countdown */}
      <div className={`rounded-2xl p-5 border flex items-center justify-between ${
        countdown.expired ? "bg-orange-900/10 border-orange-700/30" : "bg-[#111] border-[#1E1E1E]"
      }`}>
        <div>
          <p className="text-[11px] text-gray-500 uppercase tracking-widest font-bold mb-1">
            {countdown.expired ? "Predictions Locked" : "Lock-in Deadline"}
          </p>
          <p className="text-white font-bold text-sm">{lockDate}</p>
        </div>
        <div className="text-right">
          {countdown.expired
            ? <Lock size={24} className="text-orange-400" />
            : <p className="text-neon font-black text-2xl tabular-nums">{countdown.label}</p>
          }
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Entry Fee", value: `₦${prediction.fee?.toLocaleString()}`, color: "text-neon" },
          { label: "Prize/Win", value: `₦${prediction.prize_per_winner?.toLocaleString()}`, color: "text-white" },
          { label: "Players", value: `${prediction.slots_filled}/${prediction.max_slots}`, color: "text-white" },
        ].map((s) => (
          <div key={s.label} className="bg-[#111] border border-[#1E1E1E] rounded-xl p-3 text-center">
            <p className="text-[10px] text-gray-600 uppercase tracking-wide mb-1">{s.label}</p>
            <p className={`font-black text-lg ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Participation bar */}
      <div className="bg-[#111] border border-[#1E1E1E] rounded-xl p-4 space-y-2">
        <div className="flex justify-between text-xs text-gray-500">
          <span className="flex items-center gap-1"><Users size={11} /> {prediction.slots_filled} joined</span>
          <span>{fill}% filled</span>
        </div>
        <div className="h-2 bg-[#1A1A1A] rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-neon rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${fill}%` }}
            transition={{ duration: 0.8 }}
          />
        </div>
        <p className="text-[11px] text-gray-600">{prediction.max_slots - prediction.slots_filled} slots remaining</p>
      </div>

      {/* How it works */}
      <div className="bg-[#111] border border-[#1E1E1E] rounded-2xl p-5 space-y-3">
        <p className="text-[11px] text-gray-500 uppercase tracking-widest font-bold">How it works</p>
        {[
          { icon: <Timer size={14} className="text-blue-400" />, text: "Pay entry fee and submit your prediction before the deadline" },
          { icon: <Lock size={14} className="text-orange-400" />, text: "Predictions lock when the countdown ends" },
          { icon: <Trophy size={14} className="text-neon" />, text: "After the event, admin reveals the correct answer — winners get paid instantly" },
        ].map((item, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-[#1A1A1A] flex items-center justify-center flex-shrink-0 mt-0.5">
              {item.icon}
            </div>
            <p className="text-gray-400 text-xs leading-relaxed">{item.text}</p>
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-red-900/10 border border-red-800/30 rounded-xl p-3 flex gap-2 items-start">
          <AlertCircle size={15} className="text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* CTA */}
      {!countdown.expired && (
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onEnter}
          disabled={entering}
          className="w-full py-4 bg-neon text-black font-black text-base rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
          style={{ boxShadow: "0 0 24px #00FF6630" }}
        >
          {entering ? <Loader2 size={18} className="animate-spin" /> : null}
          {entering ? "Processing..." : `Enter & Pay ₦${prediction.fee?.toLocaleString()}`}
        </motion.button>
      )}

      {countdown.expired && (
        <div className="w-full py-4 bg-[#111] border border-orange-700/30 rounded-xl text-center">
          <p className="text-orange-400 font-bold text-sm">Predictions are locked for this event</p>
          <p className="text-gray-600 text-xs mt-1">Waiting for admin to reveal the correct answer</p>
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
}: {
  prediction: PredictionData;
  onSubmit: (answer: string) => void;
  submitting: boolean;
  error: string | null;
}) {
  const [answer, setAnswer] = useState("");
  const countdown = useCountdown(prediction.countdown_end);

  return (
    <div className="space-y-5">
      <div>
        <span className="text-[10px] font-black uppercase tracking-widest text-purple-400">{prediction.category}</span>
        <h1 className="text-white font-black text-2xl leading-tight mt-2">{prediction.question}</h1>
      </div>

      <div className="bg-neon/5 border border-neon/20 rounded-xl p-4 flex items-center gap-3">
        <CheckCircle2 size={18} className="text-neon flex-shrink-0" />
        <p className="text-neon text-sm font-semibold">Entry paid — now submit your prediction</p>
      </div>

      <div className={`rounded-xl p-4 flex items-center justify-between ${
        countdown.expired ? "bg-orange-900/10 border border-orange-700/30" : "bg-[#111] border border-[#1E1E1E]"
      }`}>
        <p className="text-gray-400 text-sm">{countdown.expired ? "Locked" : "Lock-in in"}</p>
        {countdown.expired
          ? <Lock size={16} className="text-orange-400" />
          : <p className="text-neon font-black tabular-nums">{countdown.label}</p>
        }
      </div>

      {!countdown.expired && (
        <>
          <div className="space-y-2">
            <label className="text-[11px] text-gray-500 font-bold uppercase tracking-widest block">
              Your Prediction
            </label>
            <input
              type="text"
              placeholder="Type your answer..."
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && answer.trim() && !submitting) onSubmit(answer); }}
              autoFocus
              className="w-full bg-[#0A0A0A] border border-[#1E1E1E] focus:border-neon rounded-xl px-4 py-4 text-white text-lg outline-none transition-colors placeholder:text-gray-700"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-900/10 border border-red-900/30 rounded-xl p-3">{error}</p>
          )}

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => onSubmit(answer)}
            disabled={!answer.trim() || submitting}
            className="w-full py-4 bg-neon text-black font-black text-base rounded-xl disabled:opacity-40 flex items-center justify-center gap-2"
            style={{ boxShadow: "0 0 20px #00FF6630" }}
          >
            {submitting ? <Loader2 size={18} className="animate-spin" /> : null}
            {submitting ? "Locking in..." : "Lock In Prediction"}
          </motion.button>
        </>
      )}

      {countdown.expired && (
        <div className="bg-[#111] border border-orange-700/30 rounded-xl p-4 text-center">
          <p className="text-orange-400 font-bold text-sm">Deadline passed — predictions are now locked</p>
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
}: {
  answer: string;
  predictionId: string;
  setResult: React.Dispatch<React.SetStateAction<Result | null>>;
  setPageState: React.Dispatch<React.SetStateAction<PageState>>;
  onNotParticipant?: () => void;
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
          // Not a participant — show error and call callback
          alert("You didn't enter this prediction");
          onNotParticipant?.();
        } else if (err.code === "NOT_REVEALED") {
          // Result not revealed yet
          alert("Result not available yet — check back soon");
        } else {
          alert("Result not available yet — check back soon");
        }
      } else {
        console.error("Failed to check result:", err);
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
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-neon/10 border-2 border-neon/20 mb-5">
          <CheckCircle2 size={40} className="text-neon" />
        </div>
        <h2 className="text-white font-black text-2xl">Prediction Submitted!</h2>
        <p className="text-gray-500 text-sm mt-1">Your answer is locked in</p>
      </motion.div>

      <div className="bg-[#111] border border-neon/20 rounded-2xl p-5 text-center">
        <p className="text-[11px] text-gray-500 uppercase tracking-widest font-bold mb-2">Your Prediction</p>
        {answer
          ? <p className="text-neon font-black text-3xl">{answer}</p>
          : <p className="text-gray-600 text-sm italic">Your answer was submitted in a previous session</p>
        }
      </div>

      <div className="bg-[#111] border border-[#1E1E1E] rounded-2xl p-5 space-y-4">
        <p className="text-[11px] text-gray-500 uppercase tracking-widest font-bold">What happens next</p>
        {[
          { icon: <Clock size={14} className="text-orange-400" />, title: "Event takes place", desc: "The real-world event plays out" },
          { icon: <CheckCircle2 size={14} className="text-blue-400" />, title: "Admin reveals the answer", desc: "After the event, the correct answer is marked" },
          { icon: <Trophy size={14} className="text-neon" />, title: "Winners paid instantly", desc: "Prize credited to your wallet automatically" },
        ].map((s, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#1A1A1A] flex items-center justify-center flex-shrink-0">{s.icon}</div>
            <div>
              <p className="text-white text-sm font-semibold">{s.title}</p>
              <p className="text-gray-600 text-xs mt-0.5">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-orange-900/10 border border-orange-800/20 rounded-xl p-4 text-center">
        <p className="text-orange-300/80 text-xs leading-relaxed">
          Come back after the event to see if you won. You&apos;ll see the result on this page.
        </p>
        <button
          onClick={handleCheckResult}
          disabled={checking}
          className="mt-3 text-neon text-xs font-bold hover:underline block mx-auto disabled:opacity-50 flex items-center justify-center gap-1"
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
        <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full mb-5 ${
          won ? "bg-neon/10 border-2 border-neon/30" : "bg-red-500/10 border-2 border-red-500/30"
        }`}>
          {won
            ? <Trophy size={44} className="text-neon" />
            : <XCircle size={44} className="text-red-400" />
          }
        </div>
        <h2 className={`font-black text-3xl ${won ? "text-neon" : "text-white"}`}>
          {won ? `You Won ₦${prize.toLocaleString()}!` : "Better Luck Next Time"}
        </h2>
        <p className="text-gray-500 text-sm mt-1">{won ? "Prize has been added to your wallet" : "Keep playing — big wins ahead"}</p>
      </motion.div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#111] border border-[#1E1E1E] rounded-xl p-4 text-center">
          <p className="text-[11px] text-gray-500 uppercase tracking-widest mb-1">Your Answer</p>
          <p className={`font-black text-lg ${won ? "text-neon" : "text-red-400"}`}>{userAnswer || "—"}</p>
        </div>
        <div className="bg-[#111] border border-neon/20 rounded-xl p-4 text-center">
          <p className="text-[11px] text-gray-500 uppercase tracking-widest mb-1">Correct Answer</p>
          <p className="text-neon font-black text-lg">{correctAnswer}</p>
        </div>
      </div>

      {won && (
        <div className="bg-neon/10 border border-neon/20 rounded-xl p-4 text-center">
          <p className="text-neon font-black text-xl">+₦{prize.toLocaleString()}</p>
          <p className="text-gray-500 text-xs mt-1">Credited to your wallet</p>
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

  useEffect(() => {
    if (!state.isAuthenticated) { router.push("/auth"); return; }
    init();
  }, [state.isAuthenticated, predictionId]); // eslint-disable-line

  // Poll for result every 10s when in locked state
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
            // Not a participant — stop polling and show error
            console.warn("Player is not a participant in this prediction");
            setNotParticipant(true);
            setError("You didn't enter this prediction");
            setPageState("error");
          }
          // NOT_REVEALED — keep polling
          else if (err.code === "NOT_REVEALED") {
            // Silent — keep polling
          }
        } else if (err instanceof ApiError && err.status !== 404) {
          console.error("Result poll error:", err.message);
        }
      }
    };
    // Check immediately on mount
    poll();
    const id = setInterval(poll, 10000);
    return () => clearInterval(id);
  }, [pageState, predictionId, notParticipant]);

  const init = async () => {
    try {
      // Check if answer already revealed
      try {
        const res = await predictionsApi.getResult(predictionId);
        if (res?.correctAnswer) {
          setResult({ won: res.won, correctAnswer: res.correctAnswer, prize: res.prize || 0 });
          setPageState("result");
          return;
        }
      } catch { /* not revealed yet */ }

      // Load prediction from active list
      const listRes = await predictionsApi.getActive();
      const found = listRes.predictions.find((p) => p.id === predictionId);

      if (!found) {
        setError("This prediction is no longer available");
        setPageState("error");
        return;
      }

      setPrediction(found);

      // If locked, try to restore player's previously submitted answer
      if (found.status === "locked" || new Date(found.countdown_end) < new Date()) {
        try {
          const myAnswer = await predictionsApi.getMyAnswer(predictionId);
          setUserAnswer(myAnswer.answer);
        } catch { /* not submitted yet */ }
        setPageState("locked");
        return;
      }

      // Check if player already entered (but hasn't submitted yet)
      // getMyAnswer returns 404 if not participated at all
      try {
        const myAnswer = await predictionsApi.getMyAnswer(predictionId);
        // Already submitted — show locked state
        setUserAnswer(myAnswer.answer);
        setPageState("locked");
        return;
      } catch (err) {
        if (err instanceof ApiError && err.status !== 404) {
          // Entered but not submitted yet → go to submit step
          setPageState("submit");
          return;
        }
        // 404 = not entered at all → show detail/enter
      }

      setPageState("detail");
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
      await predictionsApi.enter(predictionId);
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
        setError("Failed to enter prediction");
      }
    } finally {
      setEntering(false);
    }
  };

  const handleSubmit = async (answer: string) => {
    setSubmitting(true);
    setError(null);
    try {
      await predictionsApi.submit(predictionId, answer);
      setUserAnswer(answer);
      setPageState("locked");
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409 || err.message.toLowerCase().includes("already submitted")) {
          setUserAnswer(answer);
          setPageState("locked");
        } else if (err.message.toLowerCase().includes("not participated")) {
          setError(null);
          setPageState("detail");
        } else {
          setError(err.message);
        }
      } else {
        setError("Failed to submit");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 lg:px-8 py-6 pb-28">
      {/* Back */}
      <button onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-sm font-medium mb-6">
        <ChevronLeft size={18} /> Back
      </button>

      <AnimatePresence mode="wait">
        {pageState === "loading" && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex justify-center items-center min-h-64">
            <Loader2 size={28} className="text-neon animate-spin" />
          </motion.div>
        )}

        {pageState === "detail" && prediction && (
          <motion.div key="detail" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <PredictionDetail prediction={prediction} onEnter={handleEnter} entering={entering} error={error} />
          </motion.div>
        )}

        {pageState === "submit" && prediction && (
          <motion.div key="submit" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <PredictionSubmit prediction={prediction} onSubmit={handleSubmit} submitting={submitting} error={error} />
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
            <XCircle size={40} className="text-gray-600 mx-auto" />
            <p className="text-gray-400">{error || "Something went wrong"}</p>
            <button onClick={() => router.back()} className="text-neon text-sm font-bold hover:underline">Go back</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
