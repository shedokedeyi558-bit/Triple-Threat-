"use client";

import { useState } from "react";
import { adminApi, ApiError } from "@/lib/api";
import { X, Plus, Loader2, Check, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const categories = ["Football", "Basketball", "Cricket", "Crypto", "Politics", "Entertainment", "Technology", "Science", "Food", "Lifestyle", "General Knowledge"];

const PILL_COLORS = [
  "#FF4444", "#FF8800", "#FFD700", "#00FF66",
  "#00CFFF", "#8B5CF6", "#EC4899", "#FF6B9D",
];

interface PillEntry {
  question: string;
  format: "multiple_choice" | "type_answer";
  options: string[];
  correct_answer: string;
  timer: number | "";
  color: string;
}

const defaultPill = (): PillEntry => ({
  question: "",
  format: "multiple_choice",
  options: ["", "", "", ""],
  correct_answer: "",
  timer: "",
  color: PILL_COLORS[0],
});

interface CreatePillPackFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreatePillPackForm({ isOpen, onClose, onSuccess }: CreatePillPackFormProps) {
  const [step, setStep] = useState<"config" | "pills" | "review">("config");
  const [packName, setPackName] = useState("Test Pack");
  const [packCategory, setPackCategory] = useState("General Knowledge");
  const [packEntryFee, setPackEntryFee] = useState<number | "">(200);
  const [packPrize, setPackPrize] = useState<number | "">(1000);
  const [pills, setPills] = useState<PillEntry[]>([{
    question: "What is the capital of France?",
    format: "multiple_choice",
    options: ["Berlin", "Paris", "Rome", "Madrid"],
    correct_answer: "Paris",
    timer: 30,
    color: PILL_COLORS[0],
  }]);
  const [activePillIdx, setActivePillIdx] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const activePill = pills[activePillIdx];
  const updatePill = (patch: Partial<PillEntry>) => {
    setPills((prev) => prev.map((p, i) => i === activePillIdx ? { ...p, ...patch } : p));
  };

  const addPill = () => {
    const next = defaultPill();
    next.color = PILL_COLORS[pills.length % PILL_COLORS.length];
    setPills((prev) => [...prev, next]);
    setActivePillIdx(pills.length);
  };

  const removePill = (idx: number) => {
    if (pills.length === 1) return;
    setPills((prev) => prev.filter((_, i) => i !== idx));
    setActivePillIdx(Math.max(0, activePillIdx - 1));
  };

  const validateStep = () => {
    setError("");
    if (step === "config") {
      if (!packName.trim()) { setError("Pack name is required"); return false; }
      if (!packEntryFee || packEntryFee <= 0) { setError("Entry fee is required"); return false; }
      if (!packPrize || packPrize <= 0) { setError("Prize is required"); return false; }
    } else if (step === "pills") {
      for (let i = 0; i < pills.length; i++) {
        const p = pills[i];
        if (!p.question.trim()) { setError(`Pill ${i + 1}: question required`); setActivePillIdx(i); return false; }
        if (!p.timer || p.timer <= 0) { setError(`Pill ${i + 1}: timer required`); setActivePillIdx(i); return false; }
        if (p.format === "multiple_choice" && p.options.some((o) => !o.trim())) {
          setError(`Pill ${i + 1}: all 4 options required`); setActivePillIdx(i); return false;
        }
        if (!p.correct_answer.trim()) { setError(`Pill ${i + 1}: correct answer required`); setActivePillIdx(i); return false; }
      }
    }
    return true;
  };

  const handleCreate = async () => {
    setLoading(true);
    setError("");
    try {
      // 1. Create pack
      const packRes = await adminApi.createPillPack({ name: packName, category: packCategory });
      const packId = packRes.pack.id;

      // 2. Add pills
      for (const pill of pills) {
        await adminApi.addPillToPack(packId, {
          question: pill.question,
          format: pill.format,
          options: pill.format === "multiple_choice" ? pill.options : undefined,
          correct_answer: pill.correct_answer,
          timer: pill.timer as number,
          entry_fee: packEntryFee as number,
          prize: packPrize as number,
          color: pill.color,
        });
      }

      // 3. Activate pack
      await adminApi.updatePillPack(packId, { status: "active" });

      setError("");
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create pack");
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
          <h2 className="text-lg font-black text-white">Create Pill Pack</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex gap-2">
          {["config", "pills", "review"].map((s, i) => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-all ${["config", "pills", "review"].indexOf(step) >= i ? "bg-neon" : "bg-[#2A2A2A]"}`} />
          ))}
        </div>

        {error && <p className="text-red-400 text-sm bg-red-900/10 border border-red-900/30 rounded-lg p-3">{error}</p>}

        {/* Step: Config */}
        {step === "config" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Pack Name *</label>
                <input
                  type="text"
                  value={packName}
                  onChange={(e) => setPackName(e.target.value)}
                  placeholder="e.g. Weekend Pack"
                  className="w-full bg-[#111] border border-[#2A2A2A] focus:border-neon rounded-lg px-3 py-2 text-sm text-white outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Category</label>
                <select
                  value={packCategory}
                  onChange={(e) => setPackCategory(e.target.value)}
                  className="w-full bg-[#111] border border-[#2A2A2A] focus:border-neon rounded-lg px-3 py-2 text-sm text-white outline-none"
                >
                  {categories.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Entry Fee (₦) *</label>
                <input
                  type="number"
                  min="50"
                  placeholder="e.g. 200"
                  value={packEntryFee}
                  onChange={(e) => setPackEntryFee(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full bg-[#111] border border-[#2A2A2A] focus:border-neon rounded-lg px-3 py-2 text-sm text-white outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Prize (₦) *</label>
                <input
                  type="number"
                  min="100"
                  placeholder="e.g. 1000"
                  value={packPrize}
                  onChange={(e) => setPackPrize(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full bg-[#111] border border-[#2A2A2A] focus:border-neon rounded-lg px-3 py-2 text-sm text-white outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step: Pills */}
        {step === "pills" && (
          <div className="space-y-4">
            {/* Pill tabs */}
            <div className="flex items-center gap-2 flex-wrap">
              {pills.map((p, i) => (
                <button
                  key={i}
                  onClick={() => setActivePillIdx(i)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${activePillIdx === i ? "border-neon bg-neon/10 text-neon" : "border-[#2A2A2A] text-gray-400"}`}
                >
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: p.color }} />
                  Pill {i + 1}
                  {pills.length > 1 && (
                    <X size={12} className="ml-1 cursor-pointer" onClick={(e) => { e.stopPropagation(); removePill(i); }} />
                  )}
                </button>
              ))}
              <button
                onClick={addPill}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border border-dashed border-[#2A2A2A] text-gray-500 hover:border-neon hover:text-neon transition-colors"
              >
                <Plus size={12} /> Add
              </button>
            </div>

            {/* Active pill form */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activePillIdx}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-[#111] border border-[#2A2A2A] rounded-xl p-4 space-y-3 text-sm"
              >
                {/* Color picker */}
                <div>
                  <label className="text-xs text-gray-400 mb-2 block">Color</label>
                  <div className="flex gap-2 flex-wrap">
                    {PILL_COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => updatePill({ color: c })}
                        className="w-7 h-7 rounded-full transition-transform hover:scale-110"
                        style={{ background: c, outline: activePill.color === c ? "2px solid white" : "none", outlineOffset: "2px" }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Question *</label>
                  <textarea
                    rows={2}
                    value={activePill.question}
                    onChange={(e) => updatePill({ question: e.target.value })}
                    placeholder="What is...?"
                    className="w-full bg-[#0A0A0A] border border-[#2A2A2A] focus:border-neon rounded-lg px-3 py-2 text-xs text-white outline-none resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Format</label>
                    <select
                      value={activePill.format}
                      onChange={(e) => updatePill({ format: e.target.value as "multiple_choice" | "type_answer", correct_answer: "" })}
                      className="w-full bg-[#0A0A0A] border border-[#2A2A2A] focus:border-neon rounded-lg px-3 py-2 text-xs text-white outline-none"
                    >
                      <option>multiple_choice</option>
                      <option>type_answer</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Timer (secs) *</label>
                    <input
                      type="number"
                      min="10"
                      placeholder="30"
                      value={activePill.timer}
                      onChange={(e) => updatePill({ timer: e.target.value === "" ? "" : Number(e.target.value) })}
                      className="w-full bg-[#0A0A0A] border border-[#2A2A2A] focus:border-neon rounded-lg px-3 py-2 text-xs text-white outline-none"
                    />
                  </div>
                </div>

                {activePill.format === "multiple_choice" && (
                  <div>
                    <label className="text-xs text-gray-400 mb-2 block">Options — tap ✓ for correct</label>
                    <div className="space-y-2">
                      {activePill.options.map((opt, i) => (
                        <div key={i} className="flex gap-2 items-center">
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => {
                              const opts = [...activePill.options];
                              opts[i] = e.target.value;
                              updatePill({ options: opts });
                            }}
                            placeholder={`Option ${i + 1}`}
                            className="flex-1 bg-[#0A0A0A] border border-[#2A2A2A] focus:border-neon rounded-lg px-3 py-1.5 text-xs text-white outline-none"
                          />
                          <button
                            onClick={() => updatePill({ correct_answer: opt })}
                            className={`w-7 h-7 rounded-full border text-xs font-bold flex-shrink-0 transition-colors ${activePill.correct_answer === opt && opt ? "border-neon bg-neon/20 text-neon" : "border-[#2A2A2A] text-gray-600"}`}
                          >
                            ✓
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activePill.format === "type_answer" && (
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Correct Answer *</label>
                    <input
                      type="text"
                      value={activePill.correct_answer}
                      onChange={(e) => updatePill({ correct_answer: e.target.value })}
                      placeholder="e.g. Paris"
                      className="w-full bg-[#0A0A0A] border border-[#2A2A2A] focus:border-neon rounded-lg px-3 py-2 text-xs text-white outline-none"
                    />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        )}

        {/* Step: Review */}
        {step === "review" && (
          <div className="space-y-3 text-sm">
            <div className="bg-[#111] rounded-xl p-3 space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-gray-400">Name</span><span className="font-bold text-white">{packName}</span></div>
              <div className="flex justify-between border-t border-[#2A2A2A] pt-2"><span className="text-gray-400">Category</span><span className="font-bold text-white">{packCategory}</span></div>
              <div className="flex justify-between border-t border-[#2A2A2A] pt-2"><span className="text-gray-400">Pills</span><span className="font-bold text-white">{pills.length}</span></div>
              <div className="flex justify-between border-t border-[#2A2A2A] pt-2"><span className="text-gray-400">Entry Fee</span><span className="font-bold text-neon">₦{(packEntryFee || 0).toLocaleString()}</span></div>
              <div className="flex justify-between border-t border-[#2A2A2A] pt-2"><span className="text-gray-400">Prize</span><span className="font-bold text-neon">₦{(packPrize || 0).toLocaleString()}</span></div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 pt-2">
          {step !== "config" && (
            <button
              onClick={() => setStep(step === "pills" ? "config" : "pills")}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 border border-[#2A2A2A] rounded-lg text-gray-300 text-sm hover:text-white transition-colors disabled:opacity-50"
            >
              <ArrowLeft size={14} /> Back
            </button>
          )}
          {step !== "review" ? (
            <button
              onClick={() => { if (validateStep()) setStep(step === "config" ? "pills" : "review"); }}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-neon text-black font-bold text-sm rounded-lg hover:bg-neon/90 transition-colors disabled:opacity-50"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleCreate}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-neon text-black font-bold text-sm rounded-lg hover:bg-neon/90 transition-colors disabled:opacity-50"
            >
              {loading ? <><Loader2 size={14} className="animate-spin" /> Creating...</> : <><Check size={14} /> Create Pack</>}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
