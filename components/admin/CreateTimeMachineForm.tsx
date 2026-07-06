"use client";

import { useState } from "react";
import { adminApi, ApiError } from "@/lib/api";
import { X, Loader2, Check, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

const categories = ["Football", "Basketball", "Cricket", "Crypto", "Politics", "Entertainment", "Technology", "Science", "Food", "Lifestyle", "General Knowledge"];

interface CreateTimeMachineFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateTimeMachineForm({ isOpen, onClose, onSuccess }: CreateTimeMachineFormProps) {
  const [step, setStep] = useState<"config" | "review">("config");
  const [config, setConfig] = useState({
    question: "",
    category: "Football",
    entry_fee: "" as number | "",
    prize_per_winner: "" as number | "",
    max_slots: "" as number | "",
    countdown_end: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const validateStep = () => {
    setError("");
    if (!config.question.trim()) { setError("Question is required"); return false; }
    if (!config.entry_fee || config.entry_fee <= 0) { setError("Entry fee is required"); return false; }
    if (!config.prize_per_winner || config.prize_per_winner <= 0) { setError("Prize is required"); return false; }
    if (!config.max_slots || config.max_slots <= 0) { setError("Max players is required"); return false; }
    if (!config.countdown_end) { setError("Countdown end is required"); return false; }
    return true;
  };

  const handleCreate = async () => {
    setLoading(true);
    setError("");
    try {
      await adminApi.createGame({
        game_type: "predictions",
        title: config.question.slice(0, 60),
        question: config.question,
        category: config.category,
        entry_fee: config.entry_fee as number,
        prize_per_winner: config.prize_per_winner as number,
        max_slots: config.max_slots as number,
        countdown_end: config.countdown_end,
      } as any);

      setError("");
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create game");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-card border border-[#2A2A2A] rounded-2xl p-6 max-w-2xl w-full my-auto space-y-5"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-white">Create Time Machine</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex gap-2">
          {["config", "review"].map((s, i) => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-all ${["config", "review"].indexOf(step) >= i ? "bg-neon" : "bg-[#2A2A2A]"}`} />
          ))}
        </div>

        {error && <p className="text-red-400 text-sm bg-red-900/10 border border-red-900/30 rounded-lg p-3">{error}</p>}

        {/* Step: Config */}
        {step === "config" && (
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Question *</label>
              <textarea
                rows={3}
                value={config.question}
                onChange={(e) => setConfig({ ...config, question: e.target.value })}
                placeholder="How many goals will Chelsea score?"
                className="w-full bg-[#111] border border-[#2A2A2A] focus:border-neon rounded-lg px-3 py-2 text-sm text-white outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Category</label>
              <select
                value={config.category}
                onChange={(e) => setConfig({ ...config, category: e.target.value })}
                className="w-full bg-[#111] border border-[#2A2A2A] focus:border-neon rounded-lg px-3 py-2 text-sm text-white outline-none"
              >
                {categories.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Entry Fee (₦) *</label>
                <input
                  type="number"
                  min="100"
                  placeholder="500"
                  value={config.entry_fee}
                  onChange={(e) => setConfig({ ...config, entry_fee: e.target.value === "" ? "" : Number(e.target.value) })}
                  className="w-full bg-[#111] border border-[#2A2A2A] focus:border-neon rounded-lg px-3 py-2 text-sm text-white outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Prize/Winner (₦) *</label>
                <input
                  type="number"
                  min="100"
                  placeholder="2000"
                  value={config.prize_per_winner}
                  onChange={(e) => setConfig({ ...config, prize_per_winner: e.target.value === "" ? "" : Number(e.target.value) })}
                  className="w-full bg-[#111] border border-[#2A2A2A] focus:border-neon rounded-lg px-3 py-2 text-sm text-white outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Max Players *</label>
                <input
                  type="number"
                  min="2"
                  placeholder="20"
                  value={config.max_slots}
                  onChange={(e) => setConfig({ ...config, max_slots: e.target.value === "" ? "" : Number(e.target.value) })}
                  className="w-full bg-[#111] border border-[#2A2A2A] focus:border-neon rounded-lg px-3 py-2 text-sm text-white outline-none"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Countdown End *</label>
              <input
                type="datetime-local"
                value={config.countdown_end}
                onChange={(e) => setConfig({ ...config, countdown_end: e.target.value })}
                className="w-full bg-[#111] border border-[#2A2A2A] focus:border-neon rounded-lg px-3 py-2 text-sm text-white outline-none"
              />
            </div>
          </div>
        )}

        {/* Step: Review */}
        {step === "review" && (
          <div className="space-y-3 text-sm">
            <div className="bg-[#111] rounded-xl p-3 space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-gray-400">Type</span><span className="font-bold text-white">TIME MACHINE</span></div>
              <div className="flex justify-between border-t border-[#2A2A2A] pt-2"><span className="text-gray-400">Category</span><span className="font-bold text-white">{config.category}</span></div>
              <div className="flex justify-between border-t border-[#2A2A2A] pt-2"><span className="text-gray-400">Entry Fee</span><span className="font-bold text-neon">₦{Number(config.entry_fee).toLocaleString()}</span></div>
              <div className="flex justify-between border-t border-[#2A2A2A] pt-2"><span className="text-gray-400">Prize/Winner</span><span className="font-bold text-neon">₦{Number(config.prize_per_winner).toLocaleString()}</span></div>
              <div className="flex justify-between border-t border-[#2A2A2A] pt-2"><span className="text-gray-400">Max Players</span><span className="font-bold text-white">{config.max_slots}</span></div>
              <div className="border-t border-[#2A2A2A] pt-2"><span className="text-gray-400 block mb-1">Question</span><p className="text-white text-xs">{config.question}</p></div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 pt-2">
          {step !== "config" && (
            <button
              onClick={() => setStep("config")}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 border border-[#2A2A2A] rounded-lg text-gray-300 text-sm hover:text-white transition-colors disabled:opacity-50"
            >
              <ArrowLeft size={14} /> Back
            </button>
          )}
          {step !== "review" ? (
            <button
              onClick={() => { if (validateStep()) setStep("review"); }}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-neon text-black font-bold text-sm rounded-lg hover:bg-neon/90 transition-colors disabled:opacity-50"
            >
              Review
            </button>
          ) : (
            <button
              onClick={handleCreate}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-neon text-black font-bold text-sm rounded-lg hover:bg-neon/90 transition-colors disabled:opacity-50"
            >
              {loading ? <><Loader2 size={14} className="animate-spin" /> Creating...</> : <><Check size={14} /> Create Game</>}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
