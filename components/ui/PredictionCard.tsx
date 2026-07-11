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
      className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-6 hover:border-[#4C6FFF] transition-colors"
    >
      <div className="space-y-4">
        {/* Header */}
        <div>
          <p className="text-xs uppercase tracking-tight font-bold" style={{ color: "var(--accent-violet)" }}>
            {prediction.category}
          </p>
          <h3 className="text-lg font-bold mt-2 line-clamp-2" style={{ color: "var(--text-primary)" }}>
            {prediction.question}
          </h3>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl p-3">
            <p className="text-xs font-bold" style={{ color: "var(--text-muted)" }}>Entry</p>
            <p className="text-lg font-bold font-mono" style={{ color: "var(--text-primary)" }}>₦{prediction.fee}</p>
          </div>
          <div className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl p-3">
            <p className="text-xs font-bold" style={{ color: "var(--text-muted)" }}>Prize</p>
            <p className="text-lg font-bold font-mono" style={{ color: "var(--accent-amber)" }}>₦{prediction.prize_per_winner}</p>
          </div>
        </div>

        {/* Countdown */}
        <div className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl p-3 flex items-center gap-2">
          <Clock size={16} style={{ color: "var(--text-secondary)" }} />
          <div className="flex-1">
            <p className="text-xs font-bold" style={{ color: "var(--text-muted)" }}>
              {isLocked ? "Locked" : "Closes in"}
            </p>
            <p className="font-bold text-sm" style={{ color: isLocked ? "var(--accent-amber)" : "var(--text-primary)" }}>
              {formatTime(timeLeft)}
            </p>
          </div>
        </div>

        {/* Slots Bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <p className="font-bold" style={{ color: "var(--text-muted)" }}>Slots</p>
            <p className="font-bold" style={{ color: "var(--text-primary)" }}>
              {prediction.slots_filled}/{prediction.max_slots}
            </p>
          </div>
          <div className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-full overflow-hidden h-2">
            <motion.div
              className="h-full"
              style={{ backgroundColor: "var(--accent-indigo)" }}
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
          className="w-full font-bold uppercase tracking-tight rounded-xl py-3 min-h-12 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          style={isLocked
            ? { backgroundColor: "var(--bg-card)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }
            : { backgroundColor: "var(--accent-indigo)", color: "#fff" }
          }
        >
          <TrendingUp size={18} />
          {isLocked ? "Locked" : "Enter"}
        </motion.button>
      </div>
    </motion.div>
  );
}
