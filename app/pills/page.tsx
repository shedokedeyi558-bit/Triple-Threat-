"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { pillsApi, type PillData, ApiError } from "@/lib/api";
import PillGrid from "@/components/ui/PillGrid";
import { AlertCircle, Loader } from "lucide-react";

export default function PillsPage() {
  const router = useRouter();
  const { state, dispatch } = useApp();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!state.isAuthenticated) {
      router.push("/auth");
      return;
    }

    const fetchPills = async () => {
      try {
        dispatch({ type: "PILLS_LOADING" });
        const data = await pillsApi.getAvailable();
        dispatch({ type: "SET_PILLS", pills: data.pills });
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError("Failed to load pills");
        }
      }
    };

    fetchPills();
  }, [state.isAuthenticated, router, dispatch]);

  const handlePillSelect = async (pill: PillData) => {
    if (!state.player) return;

    // Check balance
    if (state.player.balance < pill.price) {
      setError("Insufficient balance. Please deposit to play.");
      return;
    }

    try {
      dispatch({ type: "SELECT_PILL", pill });
      router.push(`/pills/play/${pill.id}`);
    } catch {
      setError("Failed to select pill");
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
          <h1 className="text-3xl font-bold uppercase tracking-tight">Pick a Pill</h1>
          <p className="text-[#888] text-sm mt-2">Answer fast. Win real.</p>
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

        {state.pills.pillsLoading ? (
          <div className="flex justify-center items-center min-h-96">
            <Loader className="animate-spin text-[#00FF66]" size={32} />
          </div>
        ) : state.pills.pills.length > 0 ? (
          <PillGrid
            pills={state.pills.pills}
            onPillSelect={handlePillSelect}
          />
        ) : (
          <div className="text-center py-12">
            <p className="text-[#888]">No pills available right now</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
