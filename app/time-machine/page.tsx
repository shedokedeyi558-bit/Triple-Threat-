"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { predictionsApi, type PredictionData, ApiError } from "@/lib/api";
import PredictionCard from "@/components/ui/PredictionCard";
import { AlertCircle, Loader } from "lucide-react";

export default function TimeMachinePage() {
  const router = useRouter();
  const { state, dispatch } = useApp();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!state.isAuthenticated) {
      router.push("/auth");
      return;
    }

    const fetchPredictions = async () => {
      try {
        dispatch({ type: "PREDICTIONS_LOADING" });
        const data = await predictionsApi.getActive();
        dispatch({ type: "SET_PREDICTIONS", predictions: data.predictions });
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError("Failed to load predictions");
        }
      }
    };

    fetchPredictions();
    // Refresh every 5 seconds to update countdowns
    const interval = setInterval(fetchPredictions, 5000);
    return () => clearInterval(interval);
  }, [state.isAuthenticated, router, dispatch]);

  const handlePredictionEnter = async (prediction: PredictionData) => {
    if (!state.player) return;

    // Check balance
    if (state.player.balance < prediction.fee) {
      setError("Insufficient balance. Please deposit to play.");
      return;
    }

    try {
      // Enter (pay entry fee & register)
      await predictionsApi.enter(prediction.id);
      dispatch({ type: "SELECT_PREDICTION", prediction });
      router.push(`/predictions/play/${prediction.id}`);
    } catch (err) {
      if (err instanceof ApiError) {
        // If already entered, just navigate
        if (err.message.toLowerCase().includes("already") || err.status === 409) {
          dispatch({ type: "SELECT_PREDICTION", prediction });
          router.push(`/predictions/play/${prediction.id}`);
        } else {
          setError(err.message);
        }
      } else {
        setError("Failed to enter prediction");
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] p-4 pt-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-lg mx-auto"
      >
        <div className="mb-6">
          <h1 className="text-3xl font-bold uppercase tracking-tight">Time Machine</h1>
          <p className="text-[#888] text-sm mt-2">Predict the future. Earn rewards.</p>
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

        {state.pills.predictionsLoading ? (
          <div className="flex justify-center items-center min-h-96">
            <Loader className="animate-spin text-[#00FF66]" size={32} />
          </div>
        ) : state.pills.predictions.length > 0 ? (
          <div className="space-y-4 pb-24">
            {state.pills.predictions.map((prediction) => (
              <PredictionCard
                key={prediction.id}
                prediction={prediction}
                onEnter={handlePredictionEnter}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-[#888]">No active predictions right now</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
