"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { pillsApi, type PillOpenResponse, type PillSubmitResponse, ApiError } from "@/lib/api";
import PillPlay from "@/components/ui/PillPlay";
import PillResult from "@/components/ui/PillResult";
import { AlertCircle, Loader, ChevronLeft } from "lucide-react";

interface PillState {
  loading: boolean;
  error: string | null;
  data: PillOpenResponse | null;
  submitted: boolean;
  result: PillSubmitResponse | null;
}

export default function PillPlayPage() {
  const params = useParams();
  const router = useRouter();
  const { state, dispatch } = useApp();
  const pillId = params.pillId as string;

  const [pillState, setPillState] = useState<PillState>({
    loading: true,
    error: null,
    data: null,
    submitted: false,
    result: null,
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!state.isAuthenticated) {
      router.push("/auth");
      return;
    }

    const openPill = async () => {
      try {
        const data = await pillsApi.open(pillId);
        setPillState((prev) => ({
          ...prev,
          loading: false,
          data,
        }));
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : "Failed to load pill";
        setPillState((prev) => ({
          ...prev,
          loading: false,
          error: message,
        }));
      }
    };

    openPill();
  }, [state.isAuthenticated, router, pillId]);

  const handleSubmit = async (answer: string) => {
    setSubmitting(true);
    try {
      const result = await pillsApi.submit(pillId, answer);
      dispatch({ type: "UPDATE_BALANCE", balance: result.newBalance });
      setPillState((prev) => ({
        ...prev,
        submitted: true,
        result,
      }));
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Failed to submit answer";
      setPillState((prev) => ({
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
          <span className="text-sm text-[#888]">Pills</span>
        </div>

        {pillState.error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 flex gap-3 items-start"
          >
            <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-400">{pillState.error}</p>
          </motion.div>
        )}

        {pillState.loading ? (
          <div className="flex justify-center items-center min-h-96">
            <Loader className="animate-spin text-[#00FF66]" size={32} />
          </div>
        ) : pillState.submitted && pillState.result ? (
          <PillResult
            won={pillState.result.won}
            prize={pillState.result.prize || 0}
            correctAnswer={pillState.result.correctAnswer}
            category={pillState.data?.category || ""}
          />
        ) : pillState.data ? (
          <PillPlay
            question={pillState.data.question}
            category={pillState.data.category}
            format={pillState.data.format}
            options={pillState.data.options}
            timer={pillState.data.timer}
            onSubmit={handleSubmit}
            isLoading={submitting}
          />
        ) : null}
      </motion.div>
    </div>
  );
}
