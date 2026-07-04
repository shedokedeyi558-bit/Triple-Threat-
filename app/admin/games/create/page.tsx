"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminApi, ApiError } from "@/lib/api";
import { ArrowLeft, ArrowRight, Loader2, Clock, Check, Plus, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type GameType = "pill_pack" | "predictions";
type Step = "type" | "config" | "review";

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
  timer: number;
  entry_fee: number;
  prize: number;
  color: string;
}

const defaultPill = (): PillEntry => ({
  question: "",
  format: "multiple_choice",
  options: ["", "", "", ""],
  correct_answer: "",
  timer: 30,
  entry_fee: 200,
  prize: 1000,
  color: PILL_COLORS[0],
});

export default function CreateGamePage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("type");
  const [gameType, setGameType] = useState<GameType | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Pill Pack config
  const [packName, setPackName] = useState("");
  const [packCategory, setPackCategory] = useState("General Knowledge");
  const [pills, setPills] = useState<PillEntry[]>([defaultPill()]);
  const [activePillIdx, setActivePillIdx] = useState(0);

  // Prediction config
  const [predConfig, setPredConfig] = useState({
    question: "", category: "Football",
    entry_fee: 500, prize_per_winner: 2000, max_slots: 20, countdown_end: "",
  });

  const activePill = pills[activePillIdx];
  const updatePill = (patch: Partial<PillEntry>) => {
    setPills((prev) => prev.map((p, i) => i === activePillIdx ? { ...p, ...patch } : p));
  };

  const addPill = () => {
    const next = defaultPill();
    next.color = PILL_COLORS[pills.length % PILL_COLORS.length];
    next.entry_fee = pills[0].entry_fee;
    next.prize = pills[0].prize;
    next.timer = pills[0].timer;
    setPills((prev) => [...prev, next]);
    setActivePillIdx(pills.length);
  };

  const removePill = (idx: number) => {
    if (pills.length === 1) return;
    setPills((prev) => prev.filter((_, i) => i !== idx));
    setActivePillIdx(Math.max(0, activePillIdx - 1));
  };

  const validateConfig = () => {
    setError("");
    if (gameType === "pill_pack") {
      if (!packName.trim()) { setError("Pack name is required"); return false; }
      for (let i = 0; i < pills.length; i++) {
        const p = pills[i];
        if (!p.question.trim()) { setError(`Pill ${i + 1}: question is required`); setActivePillIdx(i); return false; }
        if (p.entry_fee <= 0) { setError(`Pill ${i + 1}: entry fee must be > 0`); setActivePillIdx(i); return false; }
        if (p.prize <= 0) { setError(`Pill ${i + 1}: prize must be > 0`); setActivePillIdx(i); return false; }
        if (p.format === "multiple_choice" && p.options.some((o) => !o.trim())) {
          setError(`Pill ${i + 1}: all 4 options required`); setActivePillIdx(i); return false;
        }
        if (!p.correct_answer.trim()) { setError(`Pill ${i + 1}: correct answer required`); setActivePillIdx(i); return false; }
      }
    } else {
      if (!predConfig.question.trim()) { setError("Question is required"); return false; }
      if (!predConfig.countdown_end) { setError("Countdown end is required"); return false; }
    }
    return true;
  };

  const handleNext = () => {
    if (step === "type") {
      if (!gameType) { setError("Select a game type"); return; }
      setError("");
      setStep("config");
    } else if (step === "config") {
      if (!validateConfig()) return;
      setStep("review");
    }
  };

  const handleCreate = async () => {
    setLoading(true);
    setError("");
    try {
      if (gameType === "pill_pack") {
        // 1. Create pack
        const packRes = await adminApi.createPillPack({ name: packName, category: packCategory });
        const packId = packRes.pack.id;

        // 2. Add pills one by one
        for (const pill of pills) {
          await adminApi.addPillToPack(packId, {
            question: pill.question,
            format: pill.format,
            options: pill.format === "multiple_choice" ? pill.options : undefined,
            correct_answer: pill.correct_answer,
            timer: pill.timer,
            entry_fee: pill.entry_fee,
            prize: pill.prize,
            color: pill.color,
          });
        }

        // 3. Activate pack
        await adminApi.updatePillPack(packId, { status: "active" });

        router.push("/admin/games");
      } else {
        const res = await adminApi.createGame({
          game_type: "predictions",
          title: predConfig.question.slice(0, 60),
          question: predConfig.question,
          category: predConfig.category,
          entry_fee: predConfig.entry_fee,
          prize_per_winner: predConfig.prize_per_winner,
          max_slots: predConfig.max_slots,
          countdown_end: predConfig.countdown_end,
        } as any);
        router.push(`/admin/games/${res.game.id}`);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create");
    } finally {
      setLoading(false);
    }
  };

  const stepIdx = ["type", "config", "review"].indexOf(step);

  return (
    <div className="max-w-2xl">
      {/* Progress */}
      <div className="flex gap-2 mb-6">
        {["type", "config", "review"].map((s, i) => (
          <div key={s} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= stepIdx ? "bg-neon" : "bg-[#2A2A2A]"}`} />
        ))}
      </div>

      <div className="bg-card border border-[#2A2A2A] rounded-2xl p-6 space-y-5">

        {/* ── STEP 1: Type ── */}
        {step === "type" && (
          <div className="space-y-4">
            <h1 className="text-2xl font-black text-white">Create New Game</h1>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <div className="space-y-3">
              <button
                onClick={() => setGameType("pill_pack")}
                className={`w-full p-4 rounded-xl border-2 transition-all text-left ${gameType === "pill_pack" ? "border-neon bg-neon/10" : "border-[#2A2A2A] bg-[#111] hover:border-neon/40"}`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl mt-0.5">💊</span>
                  <div className="flex-1">
                    <h3 className="font-black text-white">PILL PACK</h3>
                    <p className="text-xs text-gray-400 mt-1">A set of anonymous questions shown as colored pills. Players pick and pay per pill. Instant results.</p>
                  </div>
                  {gameType === "pill_pack" && <Check size={18} className="text-neon flex-shrink-0 mt-1" />}
                </div>
              </button>

              <button
                onClick={() => setGameType("predictions")}
                className={`w-full p-4 rounded-xl border-2 transition-all text-left ${gameType === "predictions" ? "border-neon bg-neon/10" : "border-[#2A2A2A] bg-[#111] hover:border-neon/40"}`}
              >
                <div className="flex items-start gap-3">
                  <Clock size={22} className={`mt-0.5 ${gameType === "predictions" ? "text-neon" : "text-gray-500"}`} />
                  <div className="flex-1">
                    <h3 className="font-black text-white">TIME MACHINE</h3>
                    <p className="text-xs text-gray-400 mt-1">Open prediction with countdown. Players submit answers before lock. Admin reveals correct answer and pays winners.</p>
                  </div>
                  {gameType === "predictions" && <Check size={18} className="text-neon flex-shrink-0 mt-1" />}
                </div>
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Config — Pill Pack ── */}
        {step === "config" && gameType === "pill_pack" && (
          <div className="space-y-5">
            <h1 className="text-2xl font-black text-white">Configure Pill Pack</h1>
            {error && <p className="text-red-400 text-sm bg-red-900/10 border border-red-900/30 rounded-lg p-3">{error}</p>}

            {/* Pack meta */}
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

            {/* Pill tabs */}
            <div>
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                {pills.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => setActivePillIdx(i)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${activePillIdx === i ? "border-neon bg-neon/10 text-neon" : "border-[#2A2A2A] text-gray-400"}`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: p.color }} />
                    Pill {i + 1}
                    {pills.length > 1 && (
                      <X
                        size={12}
                        className="ml-1 text-gray-500 hover:text-red-400"
                        onClick={(e) => { e.stopPropagation(); removePill(i); }}
                      />
                    )}
                  </button>
                ))}
                <button
                  onClick={addPill}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border border-dashed border-[#2A2A2A] text-gray-500 hover:border-neon hover:text-neon transition-colors"
                >
                  <Plus size={12} /> Add Pill
                </button>
              </div>

              {/* Active pill form */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activePillIdx}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                  className="bg-[#111] border border-[#2A2A2A] rounded-xl p-4 space-y-3"
                >
                  {/* Color picker */}
                  <div>
                    <label className="text-xs text-gray-400 mb-2 block">Pill Color</label>
                    <div className="flex gap-2 flex-wrap">
                      {PILL_COLORS.map((c) => (
                        <button
                          key={c}
                          onClick={() => updatePill({ color: c })}
                          className="w-7 h-7 rounded-full transition-transform hover:scale-110"
                          style={{
                            background: c,
                            outline: activePill.color === c ? `2px solid white` : "none",
                            outlineOffset: "2px",
                          }}
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
                      placeholder="What is the capital of France?"
                      className="w-full bg-[#0A0A0A] border border-[#2A2A2A] focus:border-neon rounded-lg px-3 py-2 text-sm text-white outline-none resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Format</label>
                      <select
                        value={activePill.format}
                        onChange={(e) => updatePill({ format: e.target.value as "multiple_choice" | "type_answer", correct_answer: "" })}
                        className="w-full bg-[#0A0A0A] border border-[#2A2A2A] focus:border-neon rounded-lg px-3 py-2 text-sm text-white outline-none"
                      >
                        <option value="multiple_choice">Multiple Choice</option>
                        <option value="type_answer">Type Answer</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Timer (secs)</label>
                      <input
                        type="number" min="10"
                        value={activePill.timer}
                        onChange={(e) => updatePill({ timer: Number(e.target.value) })}
                        className="w-full bg-[#0A0A0A] border border-[#2A2A2A] focus:border-neon rounded-lg px-3 py-2 text-sm text-white outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Entry Fee (₦)</label>
                      <input
                        type="number" min="50"
                        value={activePill.entry_fee}
                        onChange={(e) => updatePill({ entry_fee: Number(e.target.value) })}
                        className="w-full bg-[#0A0A0A] border border-[#2A2A2A] focus:border-neon rounded-lg px-3 py-2 text-sm text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Prize (₦)</label>
                      <input
                        type="number" min="100"
                        value={activePill.prize}
                        onChange={(e) => updatePill({ prize: Number(e.target.value) })}
                        className="w-full bg-[#0A0A0A] border border-[#2A2A2A] focus:border-neon rounded-lg px-3 py-2 text-sm text-white outline-none"
                      />
                    </div>
                  </div>

                  {activePill.format === "multiple_choice" && (
                    <div>
                      <label className="text-xs text-gray-400 mb-2 block">Options — tap ✓ to mark correct *</label>
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
                              className="flex-1 bg-[#0A0A0A] border border-[#2A2A2A] focus:border-neon rounded-lg px-3 py-2 text-sm text-white outline-none"
                            />
                            <button
                              onClick={() => updatePill({ correct_answer: opt })}
                              className={`w-8 h-8 rounded-full border-2 text-xs font-bold flex-shrink-0 transition-colors ${activePill.correct_answer === opt && opt ? "border-neon bg-neon/20 text-neon" : "border-[#2A2A2A] text-gray-600"}`}
                            >✓</button>
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
                        className="w-full bg-[#0A0A0A] border border-[#2A2A2A] focus:border-neon rounded-lg px-3 py-2 text-sm text-white outline-none"
                      />
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* ── STEP 2: Config — Predictions ── */}
        {step === "config" && gameType === "predictions" && (
          <div className="space-y-4">
            <h1 className="text-2xl font-black text-white">Configure Time Machine</h1>
            {error && <p className="text-red-400 text-sm bg-red-900/10 border border-red-900/30 rounded-lg p-3">{error}</p>}
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Question *</label>
              <textarea rows={3} value={predConfig.question}
                onChange={(e) => setPredConfig({ ...predConfig, question: e.target.value })}
                placeholder="How many goals will Chelsea score?"
                className="w-full bg-[#111] border border-[#2A2A2A] focus:border-neon rounded-lg px-3 py-2 text-sm text-white outline-none" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Category</label>
              <select value={predConfig.category} onChange={(e) => setPredConfig({ ...predConfig, category: e.target.value })}
                className="w-full bg-[#111] border border-[#2A2A2A] focus:border-neon rounded-lg px-3 py-2 text-sm text-white outline-none">
                {categories.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Entry Fee (₦)</label>
                <input type="number" min="100" value={predConfig.entry_fee}
                  onChange={(e) => setPredConfig({ ...predConfig, entry_fee: Number(e.target.value) })}
                  className="w-full bg-[#111] border border-[#2A2A2A] focus:border-neon rounded-lg px-3 py-2 text-sm text-white outline-none" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Prize/Winner (₦)</label>
                <input type="number" min="100" value={predConfig.prize_per_winner}
                  onChange={(e) => setPredConfig({ ...predConfig, prize_per_winner: Number(e.target.value) })}
                  className="w-full bg-[#111] border border-[#2A2A2A] focus:border-neon rounded-lg px-3 py-2 text-sm text-white outline-none" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Max Players</label>
                <input type="number" min="2" value={predConfig.max_slots}
                  onChange={(e) => setPredConfig({ ...predConfig, max_slots: Number(e.target.value) })}
                  className="w-full bg-[#111] border border-[#2A2A2A] focus:border-neon rounded-lg px-3 py-2 text-sm text-white outline-none" />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Countdown End *</label>
              <input type="datetime-local" value={predConfig.countdown_end}
                onChange={(e) => setPredConfig({ ...predConfig, countdown_end: e.target.value })}
                className="w-full bg-[#111] border border-[#2A2A2A] focus:border-neon rounded-lg px-3 py-2 text-sm text-white outline-none" />
            </div>
          </div>
        )}

        {/* ── STEP 3: Review ── */}
        {step === "review" && (
          <div className="space-y-4">
            <h1 className="text-2xl font-black text-white">Review & Create</h1>
            {error && <p className="text-red-400 text-sm bg-red-900/10 border border-red-900/30 rounded-lg p-3">{error}</p>}

            {gameType === "pill_pack" ? (
              <div className="bg-[#111] rounded-xl p-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Pack Name</span>
                  <span className="font-bold text-white">{packName}</span>
                </div>
                <div className="flex justify-between border-t border-[#2A2A2A] pt-3">
                  <span className="text-gray-400">Category</span>
                  <span className="font-bold text-white">{packCategory}</span>
                </div>
                <div className="flex justify-between border-t border-[#2A2A2A] pt-3">
                  <span className="text-gray-400">Pills</span>
                  <span className="font-bold text-white">{pills.length}</span>
                </div>
                <div className="border-t border-[#2A2A2A] pt-3">
                  <p className="text-gray-400 mb-2">Pill colors</p>
                  <div className="flex gap-2">
                    {pills.map((p, i) => (
                      <div key={i} className="w-7 h-7 rounded-full text-center text-xs flex items-center justify-center font-bold"
                        style={{ background: p.color }}>
                        {i + 1}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-between border-t border-[#2A2A2A] pt-3">
                  <span className="text-gray-400">Entry Fee</span>
                  <span className="font-bold text-neon">₦{pills[0].entry_fee.toLocaleString()} / pill</span>
                </div>
                <div className="flex justify-between border-t border-[#2A2A2A] pt-3">
                  <span className="text-gray-400">Prize</span>
                  <span className="font-bold text-neon">₦{pills[0].prize.toLocaleString()} / pill</span>
                </div>
              </div>
            ) : (
              <div className="bg-[#111] rounded-xl p-4 space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-gray-400">Type</span><span className="font-bold text-white">TIME MACHINE</span></div>
                <div className="flex justify-between border-t border-[#2A2A2A] pt-3"><span className="text-gray-400">Category</span><span className="font-bold text-white">{predConfig.category}</span></div>
                <div className="flex justify-between border-t border-[#2A2A2A] pt-3"><span className="text-gray-400">Entry Fee</span><span className="font-bold text-neon">₦{predConfig.entry_fee.toLocaleString()}</span></div>
                <div className="flex justify-between border-t border-[#2A2A2A] pt-3"><span className="text-gray-400">Prize/Winner</span><span className="font-bold text-neon">₦{predConfig.prize_per_winner.toLocaleString()}</span></div>
                <div className="flex justify-between border-t border-[#2A2A2A] pt-3"><span className="text-gray-400">Max Players</span><span className="font-bold text-white">{predConfig.max_slots}</span></div>
                <div className="border-t border-[#2A2A2A] pt-3"><span className="text-gray-400 block mb-1">Question</span><p className="text-white text-xs">{predConfig.question}</p></div>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 pt-2">
          {step !== "type" && (
            <button onClick={() => { setError(""); if (step === "config") { setStep("type"); } else { setStep("config"); } }}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 border border-[#2A2A2A] rounded-lg text-gray-300 hover:text-white transition-colors disabled:opacity-50">
              <ArrowLeft size={16} /> Back
            </button>
          )}
          {step !== "review" ? (
            <button onClick={handleNext} disabled={!gameType}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-neon text-black font-bold rounded-lg hover:bg-neon/90 transition-colors disabled:opacity-50">
              Next <ArrowRight size={16} />
            </button>
          ) : (
            <button onClick={handleCreate} disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-neon text-black font-bold rounded-lg hover:bg-neon/90 transition-colors disabled:opacity-50">
              {loading
                ? <><Loader2 size={16} className="animate-spin" /> Creating...</>
                : <><Check size={16} /> {gameType === "pill_pack" ? "Create Pack" : "Create Game"}</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
