"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminApi, ApiError } from "@/lib/api";
import { ArrowLeft, ArrowRight, Loader2, Pill, Clock, Check } from "lucide-react";

type Step = "type" | "config" | "review";
type GameType = "pills" | "predictions";

const categories = ["Football", "Basketball", "Cricket", "Crypto", "Politics", "Entertainment", "Technology", "Science", "Food", "Lifestyle", "General Knowledge"];

export default function CreateGamePage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("type");
  const [gameType, setGameType] = useState<GameType | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // PILLS config
  const [pillsConfig, setPillsConfig] = useState({
    question: "",
    category: "General Knowledge",
    entry_fee: 200,
    prize: 1000,
    timer: 30,
    format: "multiple_choice" as "multiple_choice" | "type_answer",
    options: ["", "", "", ""],
    correct_answer: "",
  });

  // TIME MACHINE (predictions) config
  const [predConfig, setPredConfig] = useState({
    question: "",
    category: "Football",
    entry_fee: 500,
    prize_per_winner: 2000,
    max_slots: 20,
    countdown_end: "",
  });

  const handleNext = () => {
    setError("");
    if (step === "type") {
      if (!gameType) { setError("Select a game type"); return; }
      setStep("config");
    } else if (step === "config") {
      if (gameType === "pills") {
        if (!pillsConfig.question.trim()) { setError("Question is required"); return; }
        if (pillsConfig.entry_fee <= 0) { setError("Entry fee must be greater than 0"); return; }
        if (pillsConfig.prize <= 0) { setError("Prize must be greater than 0"); return; }
        if (pillsConfig.timer <= 0) { setError("Timer must be greater than 0"); return; }
        if (pillsConfig.format === "multiple_choice" && pillsConfig.options.some(o => !o.trim())) {
          setError("All 4 answer options are required"); return;
        }
        if (!pillsConfig.correct_answer.trim()) { setError("Correct answer is required"); return; }
      } else {
        if (!predConfig.question.trim()) { setError("Question is required"); return; }
        if (predConfig.entry_fee <= 0) { setError("Entry fee must be greater than 0"); return; }
        if (predConfig.prize_per_winner <= 0) { setError("Prize must be greater than 0"); return; }
        if (predConfig.max_slots <= 0) { setError("Max participants must be greater than 0"); return; }
        if (!predConfig.countdown_end) { setError("Countdown end date/time is required"); return; }
      }
      setStep("review");
    }
  };

  const handleBack = () => {
    setError("");
    if (step === "config") setStep("type");
    if (step === "review") setStep("config");
  };

  const handleCreate = async () => {
    setLoading(true);
    setError("");
    try {
      const payload = gameType === "pills"
        ? {
            game_type: "pills" as const,
            title: pillsConfig.question.slice(0, 60),
            question: pillsConfig.question,
            category: pillsConfig.category,
            entry_fee: pillsConfig.entry_fee,
            prize: pillsConfig.prize,
            timer: pillsConfig.timer,
            format: pillsConfig.format,
            options: pillsConfig.format === "multiple_choice" ? pillsConfig.options : undefined,
            correct_answer: pillsConfig.correct_answer,
          }
        : {
            game_type: "predictions" as const,
            title: predConfig.question.slice(0, 60),
            question: predConfig.question,
            category: predConfig.category,
            entry_fee: predConfig.entry_fee,
            prize_per_winner: predConfig.prize_per_winner,
            max_slots: predConfig.max_slots,
            countdown_end: predConfig.countdown_end,
          };

      const res = await adminApi.createGame(payload as any);
      router.push(`/admin/games/${res.game.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create game");
    } finally {
      setLoading(false);
    }
  };

  const steps: Step[] = ["type", "config", "review"];
  const stepIdx = steps.indexOf(step);

  return (
    <div className="max-w-2xl">
      {/* Step indicators */}
      <div className="flex gap-2 mb-6">
        {steps.map((s, i) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full transition-colors ${i <= stepIdx ? "bg-neon" : "bg-[#2A2A2A]"}`}
          />
        ))}
      </div>

      <div className="bg-card border border-[#2A2A2A] rounded-2xl p-6 space-y-5">

        {/* STEP 1: Choose Type */}
        {step === "type" && (
          <div className="space-y-4">
            <div>
              <h1 className="text-2xl font-black text-white mb-1">Create New Game</h1>
              <p className="text-gray-400 text-sm">Choose which type of game to create</p>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => setGameType("pills")}
                className={`w-full p-4 rounded-xl border-2 transition-all text-left ${gameType === "pills" ? "border-neon bg-neon/10" : "border-[#2A2A2A] bg-[#111] hover:border-neon/50"}`}
              >
                <div className="flex items-start gap-3">
                  <Pill size={22} className={gameType === "pills" ? "text-neon mt-0.5" : "text-gray-500 mt-0.5"} />
                  <div className="flex-1">
                    <h3 className="font-bold text-white">PILLS</h3>
                    <p className="text-xs text-gray-400 mt-1">
                      Anonymous single-question challenge. Player pays to reveal, answers with a timer, gets instant result. One-time play per pill.
                    </p>
                  </div>
                  {gameType === "pills" && <Check size={18} className="text-neon flex-shrink-0" />}
                </div>
              </button>

              <button
                onClick={() => setGameType("predictions")}
                className={`w-full p-4 rounded-xl border-2 transition-all text-left ${gameType === "predictions" ? "border-neon bg-neon/10" : "border-[#2A2A2A] bg-[#111] hover:border-neon/50"}`}
              >
                <div className="flex items-start gap-3">
                  <Clock size={22} className={gameType === "predictions" ? "text-neon mt-0.5" : "text-gray-500 mt-0.5"} />
                  <div className="flex-1">
                    <h3 className="font-bold text-white">TIME MACHINE</h3>
                    <p className="text-xs text-gray-400 mt-1">
                      Open prediction question with category and countdown. Players submit text answers before lock. Admin marks correct answers and pays winners.
                    </p>
                  </div>
                  {gameType === "predictions" && <Check size={18} className="text-neon flex-shrink-0" />}
                </div>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Configure */}
        {step === "config" && gameType === "pills" && (
          <div className="space-y-4">
            <h1 className="text-2xl font-black text-white">Configure PILL</h1>
            {error && <div className="bg-red-900/20 border border-red-800/40 rounded-lg p-3 text-red-400 text-sm">{error}</div>}
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Question *</label>
              <textarea
                rows={3}
                value={pillsConfig.question}
                onChange={(e) => setPillsConfig({ ...pillsConfig, question: e.target.value })}
                placeholder="What is the capital of France?"
                className="w-full bg-[#111] border border-[#2A2A2A] focus:border-neon rounded-lg px-3 py-2 text-sm text-white outline-none transition-colors"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Category</label>
                <select
                  value={pillsConfig.category}
                  onChange={(e) => setPillsConfig({ ...pillsConfig, category: e.target.value })}
                  className="w-full bg-[#111] border border-[#2A2A2A] focus:border-neon rounded-lg px-3 py-2 text-sm text-white outline-none"
                >
                  {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Answer Format</label>
                <select
                  value={pillsConfig.format}
                  onChange={(e) => setPillsConfig({ ...pillsConfig, format: e.target.value as "multiple_choice" | "type_answer" })}
                  className="w-full bg-[#111] border border-[#2A2A2A] focus:border-neon rounded-lg px-3 py-2 text-sm text-white outline-none"
                >
                  <option value="multiple_choice">Multiple Choice</option>
                  <option value="type_answer">Type Answer</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Entry Fee (₦) *</label>
                <input
                  type="number" min="50"
                  value={pillsConfig.entry_fee}
                  onChange={(e) => setPillsConfig({ ...pillsConfig, entry_fee: Number(e.target.value) })}
                  className="w-full bg-[#111] border border-[#2A2A2A] focus:border-neon rounded-lg px-3 py-2 text-sm text-white outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Prize (₦) *</label>
                <input
                  type="number" min="100"
                  value={pillsConfig.prize}
                  onChange={(e) => setPillsConfig({ ...pillsConfig, prize: Number(e.target.value) })}
                  className="w-full bg-[#111] border border-[#2A2A2A] focus:border-neon rounded-lg px-3 py-2 text-sm text-white outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Timer (secs) *</label>
                <input
                  type="number" min="10"
                  value={pillsConfig.timer}
                  onChange={(e) => setPillsConfig({ ...pillsConfig, timer: Number(e.target.value) })}
                  className="w-full bg-[#111] border border-[#2A2A2A] focus:border-neon rounded-lg px-3 py-2 text-sm text-white outline-none"
                />
              </div>
            </div>
            {pillsConfig.format === "multiple_choice" && (
              <div>
                <label className="text-xs text-gray-400 mb-2 block">Answer Options (4 required) *</label>
                <div className="space-y-2">
                  {pillsConfig.options.map((opt, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const opts = [...pillsConfig.options];
                          opts[i] = e.target.value;
                          setPillsConfig({ ...pillsConfig, options: opts });
                        }}
                        placeholder={`Option ${i + 1}`}
                        className="flex-1 bg-[#111] border border-[#2A2A2A] focus:border-neon rounded-lg px-3 py-2 text-sm text-white outline-none"
                      />
                      <button
                        onClick={() => setPillsConfig({ ...pillsConfig, correct_answer: opt })}
                        className={`w-8 h-8 rounded-full border-2 text-xs font-bold flex-shrink-0 transition-colors ${pillsConfig.correct_answer === opt && opt ? "border-neon bg-neon/20 text-neon" : "border-[#2A2A2A] text-gray-600"}`}
                      >✓</button>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">Tap ✓ on the correct option</p>
              </div>
            )}
            {pillsConfig.format === "type_answer" && (
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Correct Answer *</label>
                <input
                  type="text"
                  value={pillsConfig.correct_answer}
                  onChange={(e) => setPillsConfig({ ...pillsConfig, correct_answer: e.target.value })}
                  placeholder="e.g. Paris"
                  className="w-full bg-[#111] border border-[#2A2A2A] focus:border-neon rounded-lg px-3 py-2 text-sm text-white outline-none"
                />
              </div>
            )}
          </div>
        )}

        {step === "config" && gameType === "predictions" && (
          <div className="space-y-4">
            <h1 className="text-2xl font-black text-white">Configure TIME MACHINE</h1>
            {error && <div className="bg-red-900/20 border border-red-800/40 rounded-lg p-3 text-red-400 text-sm">{error}</div>}
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Prediction Question *</label>
              <textarea
                rows={3}
                value={predConfig.question}
                onChange={(e) => setPredConfig({ ...predConfig, question: e.target.value })}
                placeholder="How many goals will Chelsea score against Fulham on Saturday?"
                className="w-full bg-[#111] border border-[#2A2A2A] focus:border-neon rounded-lg px-3 py-2 text-sm text-white outline-none transition-colors"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Category *</label>
              <select
                value={predConfig.category}
                onChange={(e) => setPredConfig({ ...predConfig, category: e.target.value })}
                className="w-full bg-[#111] border border-[#2A2A2A] focus:border-neon rounded-lg px-3 py-2 text-sm text-white outline-none"
              >
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Entry Fee (₦) *</label>
                <input
                  type="number" min="100"
                  value={predConfig.entry_fee}
                  onChange={(e) => setPredConfig({ ...predConfig, entry_fee: Number(e.target.value) })}
                  className="w-full bg-[#111] border border-[#2A2A2A] focus:border-neon rounded-lg px-3 py-2 text-sm text-white outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Prize/Winner (₦) *</label>
                <input
                  type="number" min="100"
                  value={predConfig.prize_per_winner}
                  onChange={(e) => setPredConfig({ ...predConfig, prize_per_winner: Number(e.target.value) })}
                  className="w-full bg-[#111] border border-[#2A2A2A] focus:border-neon rounded-lg px-3 py-2 text-sm text-white outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Max Players *</label>
                <input
                  type="number" min="2"
                  value={predConfig.max_slots}
                  onChange={(e) => setPredConfig({ ...predConfig, max_slots: Number(e.target.value) })}
                  className="w-full bg-[#111] border border-[#2A2A2A] focus:border-neon rounded-lg px-3 py-2 text-sm text-white outline-none"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Countdown End (date & time) *</label>
              <input
                type="datetime-local"
                value={predConfig.countdown_end}
                onChange={(e) => setPredConfig({ ...predConfig, countdown_end: e.target.value })}
                className="w-full bg-[#111] border border-[#2A2A2A] focus:border-neon rounded-lg px-3 py-2 text-sm text-white outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">Players can only submit before this time</p>
            </div>
          </div>
        )}

        {/* STEP 3: Review */}
        {step === "review" && (
          <div className="space-y-4">
            <h1 className="text-2xl font-black text-white">Review & Create</h1>
            {error && <div className="bg-red-900/20 border border-red-800/40 rounded-lg p-3 text-red-400 text-sm">{error}</div>}
            <div className="bg-[#111] rounded-xl p-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Game Type</span>
                <span className="font-bold text-white">{gameType === "pills" ? "PILLS" : "TIME MACHINE"}</span>
              </div>
              {gameType === "pills" ? (
                <>
                  <div className="border-t border-[#2A2A2A] pt-3 flex justify-between">
                    <span className="text-gray-400">Category</span>
                    <span className="font-bold text-white">{pillsConfig.category}</span>
                  </div>
                  <div className="border-t border-[#2A2A2A] pt-3 flex justify-between">
                    <span className="text-gray-400">Format</span>
                    <span className="font-bold text-white">{pillsConfig.format === "multiple_choice" ? "Multiple Choice" : "Type Answer"}</span>
                  </div>
                  <div className="border-t border-[#2A2A2A] pt-3 flex justify-between">
                    <span className="text-gray-400">Entry Fee</span>
                    <span className="font-bold text-neon">₦{pillsConfig.entry_fee.toLocaleString()}</span>
                  </div>
                  <div className="border-t border-[#2A2A2A] pt-3 flex justify-between">
                    <span className="text-gray-400">Prize</span>
                    <span className="font-bold text-neon">₦{pillsConfig.prize.toLocaleString()}</span>
                  </div>
                  <div className="border-t border-[#2A2A2A] pt-3 flex justify-between">
                    <span className="text-gray-400">Timer</span>
                    <span className="font-bold text-white">{pillsConfig.timer}s</span>
                  </div>
                  <div className="border-t border-[#2A2A2A] pt-3">
                    <span className="text-gray-400 block mb-1">Question</span>
                    <p className="text-white text-xs">{pillsConfig.question}</p>
                  </div>
                  <div className="border-t border-[#2A2A2A] pt-3 flex justify-between">
                    <span className="text-gray-400">Correct Answer</span>
                    <span className="font-bold text-neon">{pillsConfig.correct_answer}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="border-t border-[#2A2A2A] pt-3 flex justify-between">
                    <span className="text-gray-400">Category</span>
                    <span className="font-bold text-white">{predConfig.category}</span>
                  </div>
                  <div className="border-t border-[#2A2A2A] pt-3 flex justify-between">
                    <span className="text-gray-400">Entry Fee</span>
                    <span className="font-bold text-neon">₦{predConfig.entry_fee.toLocaleString()}</span>
                  </div>
                  <div className="border-t border-[#2A2A2A] pt-3 flex justify-between">
                    <span className="text-gray-400">Prize / Winner</span>
                    <span className="font-bold text-neon">₦{predConfig.prize_per_winner.toLocaleString()}</span>
                  </div>
                  <div className="border-t border-[#2A2A2A] pt-3 flex justify-between">
                    <span className="text-gray-400">Max Players</span>
                    <span className="font-bold text-white">{predConfig.max_slots}</span>
                  </div>
                  <div className="border-t border-[#2A2A2A] pt-3 flex justify-between">
                    <span className="text-gray-400">Countdown End</span>
                    <span className="font-bold text-white">{new Date(predConfig.countdown_end).toLocaleString()}</span>
                  </div>
                  <div className="border-t border-[#2A2A2A] pt-3">
                    <span className="text-gray-400 block mb-1">Question</span>
                    <p className="text-white text-xs">{predConfig.question}</p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 pt-2">
          {step !== "type" && (
            <button
              onClick={handleBack}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 border border-[#2A2A2A] rounded-lg text-gray-300 hover:text-white transition-colors disabled:opacity-50"
            >
              <ArrowLeft size={16} /> Back
            </button>
          )}
          {step !== "review" ? (
            <button
              onClick={handleNext}
              disabled={!gameType}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-neon text-black font-bold rounded-lg hover:bg-neon/90 transition-colors disabled:opacity-50"
            >
              Next <ArrowRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleCreate}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-neon text-black font-bold rounded-lg hover:bg-neon/90 transition-colors disabled:opacity-50"
            >
              {loading ? <><Loader2 size={16} className="animate-spin" /> Creating...</> : <><Check size={16} /> Create Game</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
