"use client";

import { motion } from "framer-motion";
import { ChevronDown, AlertCircle } from "lucide-react";
import type { PillData } from "@/lib/api";

interface PillConfirmationProps {
  pill: PillData;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function PillConfirmation({ pill, onConfirm, onCancel }: PillConfirmationProps) {
  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onCancel}
        className="fixed inset-0 bg-black/70 z-40"
      />

      {/* Bottom Sheet */}
      <motion.div
        initial={{ y: 400 }}
        animate={{ y: 0 }}
        exit={{ y: 400 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-[#1A1A1A] rounded-t-3xl border border-[#2A2A2A] p-6 pb-12"
      >
        <div className="flex justify-center mb-6">
          <ChevronDown size={24} className="text-[#888]" />
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="font-bold text-xl uppercase tracking-tight">{pill.category}</h2>
            <p className="text-[#888] text-sm mt-2">{pill.question.substring(0, 100)}</p>
          </div>

          <div className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl p-4 flex items-start gap-3">
            <AlertCircle size={20} className="text-[#00FF66] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold">Cost to open: <span className="text-[#00FF66]">₦{pill.price}</span></p>
              <p className="text-xs text-[#888] mt-1">Prize if correct: ₦{pill.prize}</p>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={onCancel}
              className="flex-1 bg-[#2A2A2A] text-white font-bold uppercase tracking-tight rounded-xl py-3 min-h-12 hover:bg-[#333] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 bg-[#00FF66] text-black font-bold uppercase tracking-tight rounded-xl py-3 min-h-12 hover:bg-[#00DD55] transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
