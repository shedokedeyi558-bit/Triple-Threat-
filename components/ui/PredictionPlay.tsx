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

export default function PredictionPlay({ prediction, onSubmit, isLoading = false }: PredictionPlayProps) {
  const [answer, setAnswer] = useState("");
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const diff = Math.max(0, Math.floor((new Date(prediction.countdown_end).getTime() - Date.now()) / 1000));
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

  return (
    <div className="space-y-6 pb-28">
      <div>
        <p className="text-xs text-[#888] uppercase tracking-tight font-bold">{prediction.category}</p>
        <h2 className="text-2xl font-bold mt-4 leading-tight" style={{ color: "var(--text-primary)" }}>{prediction.question}</h2>
      </div>

      {/* Countdown — amber border/icon/text */}
      <div className="bg-[#1A1A1A] rounded-xl p-4 flex items-center gap-3" style={{ border: "1px solid rgba(232,163,61,0.35)" }}>
        <Clock size={20} style={{ color: "var(--accent-amber)" }} />
        <div className="flex-1">
          <p className="text-xs text-[#888] font-bold">Prediction Lock-in</p>
          <p className="font-bold text-lg font-mono" style={{ color: "var(--accent-amber)" }}>{formatTime(timeLeft)}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Entry", value: `₦${prediction.fee}` },
          { label: "Prize", value: `₦${prediction.prize_per_winner}` },
          { label: "Players", value: `${prediction.slots_filled}/${prediction.max_slots}` },
        ].map((s) => (
          <div key={s.label} className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl p-3">
            <p className="text-xs text-[#888] font-bold">{s.label}</p>
            <p className="font-bold mt-1" style={{ color: "var(--text-primary)" }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="space-y-3">
        <label className="text-sm font-bold uppercase tracking-tight text-[#888]">Your Prediction</label>
        <input
          type="text"
          placeholder="Type your prediction..."
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && answer.trim() && !isLoading) onSubmit(answer); }}
          onFocus={(e) => (e.target.style.borderColor = "var(--accent-indigo)")}
          onBlur={(e) => (e.target.style.borderColor = "#2A2A2A")}
          disabled={isLoading}
          className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4 text-white placeholder-[#666] outline-none transition-colors disabled:opacity-50"
        />
      </div>

      {/* CTA — indigo */}
      <motion.button
        onClick={() => onSubmit(answer)}
        disabled={!answer.trim() || isLoading}
        whileHover={{ scale: answer.trim() && !isLoading ? 1.02 : 1 }}
        whileTap={{ scale: answer.trim() && !isLoading ? 0.98 : 1 }}
        className="w-full font-bold uppercase tracking-tight rounded-xl py-3 min-h-12 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        style={{ backgroundColor: "var(--accent-indigo)", color: "#fff" }}
      >
        {isLoading ? "Submitting..." : "Lock In Prediction"}
      </motion.button>
    </div>
  );
}
