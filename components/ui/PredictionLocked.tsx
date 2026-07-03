"use client";

import { motion } from "framer-motion";
import { Lock, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface PredictionLockedProps {
  answer: string;
}

export default function PredictionLocked({ answer }: PredictionLockedProps) {
  const router = useRouter();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 text-center"
    >
      {/* Icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", damping: 15 }}
        className="inline-block"
      >
        <Lock size={64} className="text-[#00FF66]" />
      </motion.div>

      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold uppercase tracking-tight">Prediction Locked</h2>
        <p className="text-[#888] mt-2">Waiting for admin to mark the results</p>
      </div>

      {/* Your Answer */}
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-6">
        <p className="text-xs text-[#888] uppercase tracking-tight font-bold">Your Prediction</p>
        <p className="text-2xl font-bold text-[#00FF66] mt-3">{answer}</p>
      </div>

      {/* Info */}
      <div className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl p-4 space-y-2 text-left">
        <p className="text-sm text-[#888]">
          Your prediction is now locked in. Once the admin reveals the correct answer, you&apos;ll see your results.
        </p>
        <p className="text-xs text-[#666]">
          Check back soon for results!
        </p>
      </div>

      {/* Button */}
      <motion.button
        onClick={() => router.push("/time-machine")}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full bg-[#1A1A1A] text-white border border-[#2A2A2A] font-bold uppercase tracking-tight rounded-xl py-3 min-h-12 hover:border-[#00FF66] transition-colors flex items-center justify-center gap-2"
      >
        <ArrowLeft size={18} />
        Back to Predictions
      </motion.button>
    </motion.div>
  );
}
