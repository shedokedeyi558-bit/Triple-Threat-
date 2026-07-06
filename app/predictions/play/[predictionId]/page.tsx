"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { predictionsApi, ApiError, type PredictionData } from "@/lib/api";
import PredictionLocked from "@/components/ui/PredictionLocked";
import PredictionResult from "@/components/ui/PredictionResult";
import { AlertCircle, Loader, ChevronLeft, Clock, Loader2 } from "lucide-react";

type PageState = "loading" | "enter" | "submit" | "locked" | "result" | "error";

export default function PredictionPlayPage() {
  const params = useParams();
  const router = useRouter();
  const { state, dispatch } = useApp();
  const predictionId = params.predictionId as string;

  const [pageState, setPageState] = useState<PageState>("loading");
  const [prediction, setPrediction] = useState<PredictionData | null>(null);
  const [answer, setAnswer] = useState("");
  const [userAnswer, setUserAnswer] = useState<string | null>(null);
  const [result, setResult] = useState<{ won: boolean; correctAnswer: string; prize: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [entering, setEntering] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!state.isAuthenticated) { router.push("/auth"); return; }

    const init = async () => {
      try {
        // 1. Try result — only shows if admin has revealed answer
        //    Silently ignore ALL errors here — backend may return various errors
        //    for unregistered players or unrevealed answers
        try {
          const res = await predictionsApi.getResult(predictionId);
          if (res && res.correctAnswer) {
            setResult({ won: res.won, correctAnswer: res.correctAnswer, prize: res.prize || 0 });
            setPageState("result");
            return;
          }
        } catch {
          // Ignore all errors — result not ready, player not entered, etc.
        }

        // 2. Load the prediction
        const listRes = await predictionsApi.getActive();
        const found = listRes.predictions.find((p) => p.id === predictionId);

        if (!found) {
          setError("Prediction not found or no longer active");
          setPageState("error");
          return;
        }

        setPrediction(found);

        // 3. If locked/expired, show locked state
        if (found.status === "locked" || new Date(found.countdown_end) < new Date()) {
          setPageState("locked");
          return;
        }

        // 4. Default: show enter button
        setPageState("enter");
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed to load prediction");
        setPageState("error");
      }
    };

    init();
  }, [state.isAuthenticated, predictionId, router]);

  // Countdown ticker
  useEffect(() => {
    if (!prediction) return;
    const tick = () => {
      const diff = Math.max(0, Math.floor((new Date(prediction.countdown_end).getTime() - Date.now()) / 1000));
      setTimeLeft(diff);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [prediction]);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}h ${m}m ${sec}s`;
    if (m > 0) return `${m}m ${sec}s`;
    return `${sec}s`;
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
        // Backend returns already_entered: true with 409 — skip to submit
        if (err.status === 409 || err.message.toLowerCase().includes("already")) {
          setError(null);
          setPageState("submit");
        } else if (err.message.toLowerCase().includes("not participated")) {
          // Player somehow got here without entering — show enter button cleanly
          setError(null);
          setPageState("enter");
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

  const handleSubmit = async () => {
    if (!answer.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await predictionsApi.submit(predictionId, answer);
      setUserAnswer(answer);
      setPageState("locked");
    } catch (err) {
      if (err instanceof ApiError) {
        // Already submitted — treat as locked
        if (err.status === 409 || err.message.toLowerCase().includes("already submitted")) {
          setUserAnswer(answer);
          setPageState("locked");
        } else if (err.message.toLowerCase().includes("not participated")) {
          // Haven't entered yet — send back to enter step
          setError(null);
          setPageState("enter");
        } else {
          setError(err.message);
        }
      } else {
        setError("Failed to submit prediction");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] p-4 pt-6 pb-28">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-lg mx-auto">

        {/* Header */}
        <div className="flex items-center gap-2 mb-6">
          <button onClick={() => router.back()} className="p-2 hover:bg-[#1A1A1A] rounded-lg transition-colors">
            <ChevronLeft size={24} />
          </button>
          <span className="text-sm text-[#888]">Time Machine</span>
        </div>

        {/* Error — only from submit/enter actions */}
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 flex gap-3 items-start">
            <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-400">{error}</p>
          </motion.div>
        )}

        {/* Loading */}
        {pageState === "loading" && (
          <div className="flex justify-center items-center min-h-96">
            <Loader className="animate-spin text-[#00FF66]" size={32} />
          </div>
        )}

        {/* ENTER or SUBMIT state — prediction info always visible */}
        {(pageState === "enter" || pageState === "submit") && prediction && (
          <div className="space-y-6">
            <div>
              <p className="text-xs text-[#888] uppercase tracking-tight font-bold">{prediction.category}</p>
              <h2 className="text-2xl font-bold mt-3 leading-tight">{prediction.question}</h2>
            </div>

            {/* Countdown */}
            <div className="bg-[#1A1A1A] border border-[#00FF66] rounded-xl p-4 flex items-center gap-3">
              <Clock size={20} className="text-[#00FF66]" />
              <div>
                <p className="text-xs text-[#888] font-bold">Prediction Lock-in</p>
                <p className="font-bold text-lg text-[#00FF66]">{formatTime(timeLeft)}</p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Entry", value: `₦${prediction.fee}` },
                { label: "Prize", value: `₦${prediction.prize_per_winner}` },
                { label: "Players", value: `${prediction.slots_filled}/${prediction.max_slots}` },
              ].map((s) => (
                <div key={s.label} className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl p-3">
                  <p className="text-xs text-[#888] font-bold">{s.label}</p>
                  <p className="font-bold mt-1">{s.value}</p>
                </div>
              ))}
            </div>

            {/* ENTER step */}
            {pageState === "enter" && (
              <motion.button
                onClick={handleEnter}
                disabled={entering}
                whileTap={{ scale: 0.97 }}
                className="w-full bg-[#00FF66] text-black font-bold uppercase tracking-tight rounded-xl py-4 text-base disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {entering
                  ? <><Loader2 size={18} className="animate-spin" /> Entering...</>
                  : `Enter & Pay ₦${prediction.fee}`}
              </motion.button>
            )}

            {/* SUBMIT step */}
            {pageState === "submit" && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-bold uppercase tracking-tight text-[#888] block mb-2">
                    Your Prediction
                  </label>
                  <input
                    type="text"
                    placeholder="Type your answer..."
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && answer.trim() && !submitting) handleSubmit(); }}
                    autoFocus
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4 text-white placeholder-[#666] focus:border-[#00FF66] focus:outline-none transition-colors"
                  />
                </div>
                <motion.button
                  onClick={handleSubmit}
                  disabled={!answer.trim() || submitting}
                  whileTap={{ scale: 0.97 }}
                  className="w-full bg-[#00FF66] text-black font-bold uppercase tracking-tight rounded-xl py-4 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting
                    ? <><Loader2 size={18} className="animate-spin" /> Submitting...</>
                    : "Lock In Prediction"}
                </motion.button>
              </div>
            )}
          </div>
        )}

        {/* LOCKED */}
        {pageState === "locked" && <PredictionLocked answer={userAnswer || ""} />}

        {/* RESULT */}
        {pageState === "result" && result && (
          <PredictionResult
            won={result.won}
            prize={result.prize}
            correctAnswer={result.correctAnswer}
            userAnswer={userAnswer || ""}
          />
        )}

        {/* ERROR page */}
        {pageState === "error" && (
          <div className="text-center py-12 space-y-3">
            <p className="text-[#888]">{error || "Unable to load prediction"}</p>
            <button onClick={() => router.back()} className="text-[#00FF66] text-sm font-bold">
              Go back
            </button>
          </div>
        )}

      </motion.div>
    </div>
  );
}
