"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { adminApi, ApiError } from "@/lib/api";
import { Users, Eye, Clock, AlertCircle, ArrowLeft, Plus } from "lucide-react";

interface PredictionRow {
  id: string;
  question: string;
  category: string;
  entry_fee: number;
  prize_per_winner: number;
  slots_filled: number;
  max_slots: number;
  status: "active" | "locked" | "completed" | "cancelled";
  countdown_end: string;
}

const statusBadge = (s: string) => {
  const config: Record<string, string> = {
    active: "bg-[#4C6FFF]/15 text-[#4C6FFF] border border-[#4C6FFF]/30",
    locked: "bg-orange-900/20 text-orange-400 border border-orange-700/30",
    completed: "bg-gray-800 text-gray-500 border border-gray-700/30",
    cancelled: "bg-red-900/20 text-red-400 border border-red-700/30",
  };
  return config[s] || "bg-gray-800 text-gray-500";
};

export default function AdminPredictionsPage() {
  const router = useRouter();
  const [predictions, setPredictions] = useState<PredictionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revealing, setRevealing] = useState<string | null>(null);

  useEffect(() => { 
    fetchPredictions(); 
  }, []);

  const fetchPredictions = async () => {
    try {
      // Fetch using the predictions API directly
      const res = await adminApi.getGames({ limit: 1000 });
      // Filter games that have prediction characteristics
      const predictions = ((res.games || []) as any[])
        .filter((g) => g.category || g.countdown_end) // Predictions have countdown_end
        .map((g) => ({
          id: g.id,
          question: g.question || "Unnamed prediction",
          category: g.category || "General",
          entry_fee: g.entry_fee || 0,
          prize_per_winner: g.prize_per_winner || 0,
          slots_filled: g.slots_filled || 0,
          max_slots: g.max_slots || 0,
          status: (g.status || "active") as "active" | "locked" | "completed" | "cancelled",
          countdown_end: g.countdown_end || "",
        }));
      setPredictions(predictions);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load predictions");
    } finally {
      setLoading(false);
    }
  };

  const handleRevealAnswer = async (predictionId: string) => {
    const correctAnswer = prompt("Enter the correct answer:");
    if (!correctAnswer) return;
    
    setRevealing(predictionId);
    try {
      await adminApi.revealPredictionAnswer(predictionId, correctAnswer);
      await fetchPredictions();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to reveal answer");
    } finally {
      setRevealing(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/admin")}
            className="p-2 rounded-lg border transition-colors"
            style={{ borderColor: "var(--border-subtle)", color: "var(--text-secondary)" }}
            aria-label="Back to Dashboard"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="font-headline text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>
              Time Machine
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
              Manage all predictions
            </p>
          </div>
        </div>
        <button
          onClick={() => router.push("/admin/predictions/create")}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors"
          style={{ backgroundColor: "var(--accent-indigo)", color: "white" }}
        >
          <Plus size={15} />
          Create
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg p-3 border" style={{ borderColor: "var(--border-subtle)", backgroundColor: "rgba(239, 68, 68, 0.05)", color: "#ef4444" }}>
          <AlertCircle size={16} className="flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#4C6FFF]/30 border-t-[#4C6FFF] rounded-full animate-spin" />
        </div>
      ) : predictions.length === 0 ? (
        <div className="rounded-lg px-6 py-12 text-center border" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-card)" }}>
          <Clock size={32} style={{ color: "var(--text-muted)", margin: "0 auto 12px" }} />
          <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
            No predictions yet
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            Predictions will appear here once created
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {predictions.map((pred, i) => {
            const isPastDeadline = new Date(pred.countdown_end).getTime() < Date.now();
            return (
              <motion.div
                key={pred.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-lg p-4 border" 
                style={{ 
                  borderColor: "var(--border-hairline)", 
                  backgroundColor: "var(--bg-card)" 
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                        {pred.question}
                      </h3>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded border flex-shrink-0 ${statusBadge(pred.status)}`}>
                        {pred.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs flex-wrap" style={{ color: "var(--text-secondary)" }}>
                      <span style={{ color: "var(--accent-indigo)" }}>
                        ₦{pred.entry_fee.toLocaleString()} entry
                      </span>
                      <span>Prize: ₦{pred.prize_per_winner.toLocaleString()}</span>
                      <span className="flex items-center gap-1">
                        <Users size={11} />
                        {pred.slots_filled}/{pred.max_slots}
                      </span>
                      <span style={{ color: "var(--accent-violet)" }}>
                        {pred.category}
                      </span>
                    </div>
                  </div>

                  {isPastDeadline && pred.status === "locked" && (
                    <button
                      onClick={() => handleRevealAnswer(pred.id)}
                      disabled={revealing === pred.id}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg flex-shrink-0 transition-all disabled:opacity-50"
                      style={{
                        backgroundColor: "var(--accent-violet)" + "20",
                        color: "var(--accent-violet)",
                        border: "1px solid var(--accent-violet)" + "40",
                      }}
                    >
                      {revealing === pred.id ? "..." : (
                        <span className="flex items-center gap-1">
                          <Eye size={12} />
                          Reveal
                        </span>
                      )}
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
