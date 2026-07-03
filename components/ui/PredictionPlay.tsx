"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import type { PredictionData } from "@/lib/api";

interface PredictionPlayProps {
  prediction: PredictionData;
  onSubmit: (answer: string) => void;
  isLoading?: boolean;
}

export default function PredictionPlay({
  prediction,
  onSubmit,
  isLoading = false,
}: PredictionPlayProps) {
  const [answer, setAnswer] = useState("");
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const end = new Date(prediction.countdown_end).getTime();
      const diff = Math.max(0, Math.floor((end - now) / 1000));
      setTimeLeft(diff);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [prediction.countdown_end]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  };

  const handleSubmit = () => {
    if (answer.trim()) {
      onSubmit(answer);
    }
  };

  return (
    <div className="space-y-6">
      {/* Question */}
      <div>
        <p className="text-xs text-[#888] uppercase tracking-tight font-bold">
          {prediction.category}
        </p>
        <h2 className="text-2xl font-bold mt-4 leading-tight">
          {prediction.question}
        </h2>
      </div>

      {/* Countdown */}
      <div className="bg-[#1A1A1A] border border-[#00FF66] rounded-xl p-4 flex items-center gap-3">
        <Clock size={20} className="text-[#00FF66]" />
        <div className="flex-1">
          <p className="text-xs text-[#888] font-bold">Prediction Lock-in</p>
          <p className="font-bold text-lg text-[#00FF66]">{formatTime(timeLeft)}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl p-3">
          <p className="text-xs text-[#888] font-bold">Entry</p>
          <p className="font-bold mt-1">₦{prediction.fee}</p>
        </div>
        <div className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl p-3">
          <p className="text-xs text-[#888] font-bold">Prize</p>
          <p className="font-bold mt-1">₦{prediction.prize_per_winner}</p>
        </div>
        <div className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl p-3">
          <p className="text-xs text-[#888] font-bold">Participants</p>
          <p className="font-bold mt-1">{prediction.slots_filled}/{prediction.max_slots}</p>
        </div>
      </div>

      {/* Input */}
      <div className="space-y-3">
        <label className="text-sm font-bold uppercase tracking-tight text-[#888]">
          Your Prediction
        </label>
        <input
          type="text"
          placeholder="Type your prediction..."
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && answer.trim() && !isLoading) {
              handleSubmit();
            }
          }}
          disabled={isLoading}
          className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4 text-white placeholder-[#666] focus:border-[#00FF66] focus:outline-none transition-colors disabled:opacity-50"
        />
      </div>

      {/* Submit */}
      <motion.button
        onClick={handleSubmit}
        disabled={!answer.trim() || isLoading}
        whileHover={{ scale: answer.trim() && !isLoading ? 1.02 : 1 }}
        whileTap={{ scale: answer.trim() && !isLoading ? 0.98 : 1 }}
        className="w-full bg-[#00FF66] text-black font-bold uppercase tracking-tight rounded-xl py-3 min-h-12 hover:bg-[#00DD55] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {isLoading ? "Submitting..." : "Lock In Prediction"}
      </motion.button>
    </div>
  );
}
