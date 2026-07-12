"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { predictionsApi, type PredictionData } from "@/lib/api";
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
        setError(err instanceof Error ? err.message : "Failed to load predictions");
      }
    };

    fetchPredictions();
    // Refresh every 5 seconds to update countdowns
    const interval = setInterval(fetchPredictions, 5000);
    return () => clearInterval(interval);
  }, [state.isAuthenticated, router, dispatch]);

  const handlePredictionEnter = async (prediction: PredictionData) => {
    if (!state.player) return;
    // Just navigate — enter & pay happens on the play page
    dispatch({ type: "SELECT_PREDICTION", prediction });
    router.push(`/predictions/play/${prediction.id}`);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 lg:px-8 py-6">

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

      {state.pills.predictionsLoading ? (
        <div className="flex justify-center items-center min-h-64">
          <Loader className="animate-spin" size={28} style={{ color: "var(--accent-indigo)" }} />
        </div>
      ) : state.pills.predictions.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {state.pills.predictions.map((prediction) => (
            <PredictionCard
              key={prediction.id}
              prediction={prediction}
              onEnter={handlePredictionEnter}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#141414] border border-[#1E1E1E] flex items-center justify-center mb-4">
            <Loader size={24} className="text-gray-700" />
          </div>
          <p className="text-gray-500 font-semibold">No active predictions right now</p>
          <p className="text-gray-700 text-sm mt-1">Check back soon for new Time Machine events</p>
        </div>
      )}
    </div>
  );
}
