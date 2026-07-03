"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface PillPlayProps {
  question: string;
  category: string;
  format: "multiple_choice" | "type_answer";
  options?: string[];
  timer: number;
  onSubmit: (answer: string) => void;
  isLoading?: boolean;
}

export default function PillPlay({
  question,
  category,
  format,
  options,
  timer,
  onSubmit,
  isLoading = false,
}: PillPlayProps) {
  const [timeLeft, setTimeLeft] = useState(timer);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [textAnswer, setTextAnswer] = useState("");

  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  const progress = ((timer - timeLeft) / timer) * 100;
  const isTimeRunningOut = timeLeft <= 5;

  const handleSubmit = () => {
    const answer = format === "multiple_choice" ? selectedOption : textAnswer;
    if (answer) {
      onSubmit(answer);
    }
  };

  const isValid =
    format === "multiple_choice" ? selectedOption !== null : textAnswer.trim() !== "";

  return (
    <div className="space-y-6">
      {/* Category & Question */}
      <div>
        <p className="text-xs text-[#888] uppercase tracking-tight font-bold">{category}</p>
        <h2 className="text-2xl font-bold mt-4 leading-tight">{question}</h2>
      </div>

      {/* Timer Bar */}
      <div className="space-y-2">
        <div className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl overflow-hidden h-2">
          <motion.div
            className={`h-full ${isTimeRunningOut ? "bg-red-500" : "bg-[#00FF66]"}`}
            initial={{ width: "100%" }}
            animate={{ width: `${100 - progress}%` }}
            transition={{ type: "linear", duration: 0.1 }}
          />
        </div>
        <div className="flex justify-between items-center px-1">
          <p className="text-xs text-[#888]">Time remaining</p>
          <p className={`font-bold ${isTimeRunningOut ? "text-red-500" : "text-[#00FF66]"}`}>
            {timeLeft}s
          </p>
        </div>
      </div>

      {/* Answer Section */}
      {format === "multiple_choice" ? (
        <div className="space-y-3">
          {options?.map((option, idx) => (
            <motion.button
              key={idx}
              onClick={() => setSelectedOption(option)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full p-4 rounded-xl font-bold uppercase tracking-tight transition-all min-h-12 ${
                selectedOption === option
                  ? "bg-[#00FF66] text-black border border-[#00FF66]"
                  : "bg-[#1A1A1A] text-white border border-[#2A2A2A] hover:border-[#00FF66]"
              }`}
            >
              {option}
            </motion.button>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Type your answer..."
            value={textAnswer}
            onChange={(e) => setTextAnswer(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && isValid && !isLoading) {
                handleSubmit();
              }
            }}
            disabled={isLoading}
            className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4 text-white placeholder-[#666] focus:border-[#00FF66] focus:outline-none transition-colors disabled:opacity-50"
          />
        </div>
      )}

      {/* Submit Button */}
      <motion.button
        onClick={handleSubmit}
        disabled={!isValid || isLoading}
        whileHover={{ scale: isValid && !isLoading ? 1.02 : 1 }}
        whileTap={{ scale: isValid && !isLoading ? 0.98 : 1 }}
        className="w-full bg-[#00FF66] text-black font-bold uppercase tracking-tight rounded-xl py-3 min-h-12 hover:bg-[#00DD55] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {isLoading ? "Submitting..." : "Submit"}
      </motion.button>
    </div>
  );
}
