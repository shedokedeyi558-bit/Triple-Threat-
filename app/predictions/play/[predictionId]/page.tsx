"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { predictionsApi, ApiError } from "@/lib/api";
import PredictionPlay from "@/components/ui/PredictionPlay";
import PredictionLocked from "@/components/ui/PredictionLocked";
import PredictionResult from "@/components/ui/PredictionResult";
import { AlertCircle, Loader, ChevronLeft } from "lucide-react";

type PageState = "loading" | "play" | "locked" | "result" | "error";

interface StateData {
  pageState: PageState;
  error: string | null;
  userAnswer: string | null;
  result?: {
    won: boolean;
    correctAnswer: string;
    prize: number;
  };
}

export default function PredictionPlayPage() {
  const params = useParams();
  const router = useRouter();
  const { state, dispatch } = useApp();
  const predictionId = params.predictionId as string;

  const [stateData, setStateData] = useState<StateData>({
    pageState: "loading",
    error: null,
    userAnswer: null,
  });

  const [submitting, setSubmitting] = useState(false);

  const prediction = state.pills.activePrediction;

  useEffect(() => {
    if (!state.isAuthenticated) {
      router.push("/auth");
      return;
    }

    if (!prediction) {
      setStateData({
        pageState: "error",
        error: "Prediction not found",
        userAnswer: null,
      });
      return;
    }

    // Check if already locked or get result
    const checkStatus = async () => {
      try {
        const result = await predictionsApi.getResult(predictionId);
        setStateData({
          pageState: "result",
          error: null,
          userAnswer: state.pills.userPredictionAnswer || "",
          result: {
            won: result.won,
            correctAnswer: result.correctAnswer,
            prize: result.prize || 0,
          },
        });
      } catch (err) {
        // Not ready yet, show play state
        setStateData({
          pageState: "play",
          error: null,
          userAnswer: null,
        });
      }
    };

    checkStatus();
  }, [state.isAuthenticated, router, prediction, predictionId, state.pills.userPredictionAnswer]);

  const handleSubmit = async (answer: string) => {
    setSubmitting(true);
    try {
      const result = await predictionsApi.submit(predictionId, answer);
      dispatch({ type: "SET_PREDICTION_ANSWER", answer });
      // Move to locked state
      setStateData({
        pageState: "locked",
        error: null,
        userAnswer: answer,
      });
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Failed to submit prediction";
      setStateData((prev) => ({
        ...prev,
        error: message,
      }));
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

        {stateData.error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 flex gap-3 items-start"
          >
            <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-400">{stateData.error}</p>
          </motion.div>
        )}

        {stateData.pageState === "loading" ? (
          <div className="flex justify-center items-center min-h-96">
            <Loader className="animate-spin text-[#00FF66]" size={32} />
          </div>
        ) : stateData.pageState === "play" && prediction ? (
          <PredictionPlay
            prediction={prediction}
            onSubmit={handleSubmit}
            isLoading={submitting}
          />
        ) : stateData.pageState === "locked" && stateData.userAnswer ? (
          <PredictionLocked answer={stateData.userAnswer} />
        ) : stateData.pageState === "result" && stateData.result ? (
          <PredictionResult
            won={stateData.result.won}
            prize={stateData.result.prize}
            correctAnswer={stateData.result.correctAnswer}
            userAnswer={stateData.userAnswer || ""}
          />
        ) : (
          <div className="text-center py-12">
            <p className="text-[#888]">Unable to load prediction</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
