"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Clock, TrendingUp } from "lucide-react";
import type { PredictionData } from "@/lib/api";

interface PredictionCardProps {
  prediction: PredictionData;
  onEnter: (prediction: PredictionData) => void;
}

export default function PredictionCard({ prediction, onEnter }: PredictionCardProps) {
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
    if (seconds <= 0) return "Locked";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  };

  const isLocked = timeLeft <= 0;
  const fillPercentage =
    ((prediction.slots_filled / prediction.max_slots) * 100) || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-6 hover:border-[#00FF66] transition-colors"
    >
      <div className="space-y-4">
        {/* Header */}
        <div>
          <p className="text-xs text-[#888] uppercase tracking-tight font-bold">
            {prediction.category}
          </p>
          <h3 className="text-lg font-bold mt-2 line-clamp-2">
            {prediction.question}
          </h3>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl p-3">
            <p className="text-xs text-[#888] font-bold">Entry</p>
            <p className="text-lg font-bold text-[#00FF66]">₦{prediction.fee}</p>
          </div>
          <div className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl p-3">
            <p className="text-xs text-[#888] font-bold">Prize</p>
            <p className="text-lg font-bold">₦{prediction.prize_per_winner}</p>
          </div>
        </div>

        {/* Countdown */}
        <div className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl p-3 flex items-center gap-2">
          <Clock size={16} className="text-[#00FF66]" />
          <div className="flex-1">
            <p className="text-xs text-[#888] font-bold">Closes in</p>
            <p className={`font-bold text-sm ${isLocked ? "text-red-500" : "text-white"}`}>
              {formatTime(timeLeft)}
            </p>
          </div>
        </div>

        {/* Slots Bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <p className="text-[#888] font-bold">Slots</p>
            <p className="text-white font-bold">
              {prediction.slots_filled}/{prediction.max_slots}
            </p>
          </div>
          <div className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-full overflow-hidden h-2">
            <motion.div
              className="h-full bg-[#00FF66]"
              initial={{ width: 0 }}
              animate={{ width: `${fillPercentage}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Button */}
        <motion.button
          onClick={() => onEnter(prediction)}
          disabled={isLocked}
          whileHover={{ scale: isLocked ? 1 : 1.02 }}
          whileTap={{ scale: isLocked ? 1 : 0.98 }}
          className="w-full bg-[#00FF66] text-black font-bold uppercase tracking-tight rounded-xl py-3 min-h-12 hover:bg-[#00DD55] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
          <TrendingUp size={18} />
          {isLocked ? "Locked" : "Enter"}
        </motion.button>
      </div>
    </motion.div>
  );
}
