"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Clock, ArrowLeft, Trophy } from "lucide-react";
import { useRouter } from "next/navigation";

interface PredictionLockedProps {
  answer: string;
}

export default function PredictionLocked({ answer }: PredictionLockedProps) {
  const router = useRouter();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-5 pb-28"
    >
      {/* Success header */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 14, delay: 0.1 }}
        className="text-center pt-4"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#00FF66]/10 border-2 border-[#00FF66]/30 mb-4">
          <CheckCircle2 size={40} className="text-[#00FF66]" />
        </div>
        <h2 className="text-2xl font-black text-white uppercase tracking-tight">Prediction Submitted!</h2>
        <p className="text-[#888] text-sm mt-1">Your answer has been locked in</p>
      </motion.div>

      {/* Your answer */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-[#1A1A1A] border border-[#00FF66]/30 rounded-2xl p-5 text-center"
      >
        <p className="text-xs text-[#888] uppercase tracking-widest font-bold mb-2">Your Prediction</p>
        <p className="text-3xl font-black text-[#00FF66]">{answer || "—"}</p>
      </motion.div>

      {/* What happens next */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-[#111] border border-[#2A2A2A] rounded-2xl p-5 space-y-4"
      >
        <p className="text-xs text-[#888] uppercase tracking-widest font-bold">What happens next</p>

        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center flex-shrink-0 mt-0.5">
            <Clock size={16} className="text-orange-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Event takes place</p>
            <p className="text-xs text-[#666] mt-0.5">The real-world event plays out after the prediction window closes</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center flex-shrink-0 mt-0.5">
            <CheckCircle2 size={16} className="text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Admin reveals the answer</p>
            <p className="text-xs text-[#666] mt-0.5">Once the event is complete, the admin marks the correct answer</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center flex-shrink-0 mt-0.5">
            <Trophy size={16} className="text-[#00FF66]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Winners get paid instantly</p>
            <p className="text-xs text-[#666] mt-0.5">If your prediction is correct, the prize is credited to your wallet automatically</p>
          </div>
        </div>
      </motion.div>

      {/* Notice */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="bg-orange-900/10 border border-orange-800/30 rounded-xl p-4 text-center"
      >
        <p className="text-xs text-orange-300/80 leading-relaxed">
          Come back after the event to see your result. You&apos;ll see a win or loss notification on this page.
        </p>
      </motion.div>

      {/* Back button */}
      <motion.button
        onClick={() => router.push("/play")}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        whileTap={{ scale: 0.97 }}
        className="w-full bg-[#1A1A1A] text-white border border-[#2A2A2A] font-bold uppercase tracking-tight rounded-xl py-3.5 hover:border-[#00FF66] transition-colors flex items-center justify-center gap-2"
      >
        <ArrowLeft size={18} />
        Back to Play
      </motion.button>
    </motion.div>
  );
}
