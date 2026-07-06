"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { predictionsApi, ApiError, type PredictionData } from "@/lib/api";
import PredictionPlay from "@/components/ui/PredictionPlay";
import PredictionLocked from "@/components/ui/PredictionLocked";
import PredictionResult from "@/components/ui/PredictionResult";
import { AlertCircle, Loader, ChevronLeft } from "lucide-react";

type PageState = "loading" | "play" | "locked" | "result" | "error";

export default function PredictionPlayPage() {
  const params = useParams();
  const router = useRouter();
  const { state, dispatch } = useApp();
  const predictionId = params.predictionId as string;

  const [pageState, setPageState] = useState<PageState>("loading");
  const [prediction, setPrediction] = useState<PredictionData | null>(null);
  const [userAnswer, setUserAnswer] = useState<string | null>(null);
  const [result, setResult] = useState<{ won: boolean; correctAnswer: string; prize: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!state.isAuthenticated) {
      router.push("/auth");
      return;
    }

    const init = async () => {
      try {
        // 1. Try to get result first (if already answered + revealed)
        try {
          const res = await predictionsApi.getResult(predictionId);
          setResult({ won: res.won, correctAnswer: res.correctAnswer, prize: res.prize || 0 });
          setPageState("result");
          return;
        } catch {
          // Not revealed yet — continue
        }

        // 2. Load active predictions list to find this one
        const listRes = await predictionsApi.getActive();
        const found = listRes.predictions.find((p) => p.id === predictionId);

        if (!found) {
          setError("Prediction not found or no longer active");
          setPageState("error");
          return;
        }

        setPrediction(found);

        // 3. Check if locked (countdown passed)
        const isLocked = found.status === "locked" || new Date(found.countdown_end) < new Date();
        if (isLocked) {
          setUserAnswer(state.pills.userPredictionAnswer || "");
          setPageState("locked");
          return;
        }

        // 4. Show play state
        setPageState("play");
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed to load prediction");
        setPageState("error");
      }
    };

    init();
  }, [state.isAuthenticated, predictionId, router, state.pills.userPredictionAnswer]);

  const handleSubmit = async (answer: string) => {
    setSubmitting(true);
    setError(null);
    try {
      await predictionsApi.submit(predictionId, answer);
      dispatch({ type: "SET_PREDICTION_ANSWER", answer });
      setUserAnswer(answer);
      setPageState("locked");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to submit prediction");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] p-4 pt-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="max-w-lg mx-auto"
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-[#1A1A1A] rounded-lg transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <span className="text-sm text-[#888]">Time Machine</span>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 flex gap-3 items-start"
          >
            <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-400">{error}</p>
          </motion.div>
        )}

        {pageState === "loading" && (
          <div className="flex justify-center items-center min-h-96">
            <Loader className="animate-spin text-[#00FF66]" size={32} />
          </div>
        )}

        {pageState === "play" && prediction && (
          <PredictionPlay
            prediction={prediction}
            onSubmit={handleSubmit}
            isLoading={submitting}
          />
        )}

        {pageState === "locked" && (
          <PredictionLocked answer={userAnswer || ""} />
        )}

        {pageState === "result" && result && (
          <PredictionResult
            won={result.won}
            prize={result.prize}
            correctAnswer={result.correctAnswer}
            userAnswer={userAnswer || ""}
          />
        )}

        {pageState === "error" && !error && (
          <div className="text-center py-12">
            <p className="text-[#888]">Unable to load prediction</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
