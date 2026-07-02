"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { adminApi } from "@/lib/api";
import { ArrowRight, ArrowLeft } from "lucide-react";

type GameType = "door_game" | "challenge_game" | null;
type Step = "type" | "config" | "review";

export default function CreateGamePage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("type");
  const [gameType, setGameType] = useState<GameType>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Door Game config
  const [doorConfig, setDoorConfig] = useState({
    title: "",
    description: "",
    entry_fee: "",
    door_ids: ["", "", ""],
  });

  // Challenge Game config
  const [challengeConfig, setChallengeConfig] = useState({
    title: "",
    description: "",
    category: "",
    stake_amount: "",
    prize_pool: "",
    max_participants: "",
    countdown_duration: "",
  });

  const handleTypeSelect = (type: GameType) => {
    setGameType(type);
    setStep("config");
  };

  const handleCreateGame = async () => {
    setLoading(true);
    setError(null);
    try {
      if (gameType === "door_game") {
        if (!doorConfig.title || !doorConfig.entry_fee) {
          throw new Error("Please fill in all required fields");
        }
        await adminApi.createGame({
          game_type: "door_game",
          title: doorConfig.title,
          description: doorConfig.description,
          entry_fee: parseInt(doorConfig.entry_fee),
          door_ids: doorConfig.door_ids.filter(id => id),
        });
      } else {
        if (!challengeConfig.title || !challengeConfig.category || !challengeConfig.stake_amount || 
            !challengeConfig.prize_pool || !challengeConfig.max_participants || !challengeConfig.countdown_duration) {
          throw new Error("Please fill in all required fields");
        }
        await adminApi.createGame({
          game_type: "challenge_game",
          title: challengeConfig.title,
          description: challengeConfig.description,
          category: challengeConfig.category,
          stake_amount: parseInt(challengeConfig.stake_amount),
          prize_pool: parseInt(challengeConfig.prize_pool),
          max_participants: parseInt(challengeConfig.max_participants),
          countdown_duration: parseInt(challengeConfig.countdown_duration),
        });
      }
      router.push("/admin/games");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create game";
      setError(message);
      setLoading(false);
    }
  };

  return (
    <AdminShell>
      <div className="max-w-2xl mx-auto">
        <AnimatePresence mode="wait">
          {step === "type" && (
            <motion.div
              key="type"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-black text-white mb-2">Create New Game</h1>
                <p className="text-gray-400">Select the type of game you want to create</p>
              </div>

              {error && (
                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 mb-4 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {/* Door Game Option */}
                <button
                  onClick={() => handleTypeSelect("door_game")}
                  className="group bg-card border-2 border-[#2A2A2A] hover:border-neon rounded-lg p-5 sm:p-6 text-left transition-all active:scale-95"
                >
                  <div className="text-3xl sm:text-4xl mb-3">🚪</div>
                  <h2 className="text-white font-bold text-base sm:text-lg mb-2">Door Game</h2>
                  <p className="text-gray-400 text-xs sm:text-sm mb-4 leading-snug">
                    Classic 3-door game with multiple choice or type answer questions
                  </p>
                  <div className="text-neon text-xs sm:text-sm font-semibold flex items-center gap-2 group-hover:gap-3 transition-all">
                    Create <ArrowRight size={16} />
                  </div>
                </button>

                {/* Challenge Game Option */}
                <button
                  onClick={() => handleTypeSelect("challenge_game")}
                  className="group bg-card border-2 border-[#2A2A2A] hover:border-neon rounded-lg p-5 sm:p-6 text-left transition-all active:scale-95"
                >
                  <div className="text-3xl sm:text-4xl mb-3">⚡</div>
                  <h2 className="text-white font-bold text-base sm:text-lg mb-2">Challenge</h2>
                  <p className="text-gray-400 text-xs sm:text-sm mb-4 leading-snug">
                    Limited participation prediction challenge with tagged prize
                  </p>
                  <div className="text-neon text-xs sm:text-sm font-semibold flex items-center gap-2 group-hover:gap-3 transition-all">
                    Create <ArrowRight size={16} />
                  </div>
                </button>
              </div>
            </motion.div>
          )}

          {step === "config" && gameType && (
            <motion.div
              key="config"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <button
                onClick={() => setStep("type")}
                className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 sm:mb-6 transition-colors text-sm"
              >
                <ArrowLeft size={18} />
                Back
              </button>

              <h1 className="text-xl sm:text-3xl font-black text-white mb-4 sm:mb-6">
                {gameType === "door_game" ? "Configure Door Game" : "Configure Challenge"}
              </h1>

              <div className="space-y-3 sm:space-y-4 mb-6">
                {/* Common fields */}
                <div>
                  <label className="block text-xs sm:text-sm text-gray-400 mb-2">Game Title *</label>
                  <input
                    type="text"
                    placeholder="Enter game title"
                    value={gameType === "door_game" ? doorConfig.title : challengeConfig.title}
                    onChange={(e) => {
                      if (gameType === "door_game") {
                        setDoorConfig({ ...doorConfig, title: e.target.value });
                      } else {
                        setChallengeConfig({ ...challengeConfig, title: e.target.value });
                      }
                    }}
                    className="w-full bg-card border border-[#2A2A2A] rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm outline-none focus:border-neon transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm text-gray-400 mb-2">Description</label>
                  <textarea
                    placeholder="Optional description"
                    rows={3}
                    value={gameType === "door_game" ? doorConfig.description : challengeConfig.description}
                    onChange={(e) => {
                      if (gameType === "door_game") {
                        setDoorConfig({ ...doorConfig, description: e.target.value });
                      } else {
                        setChallengeConfig({ ...challengeConfig, description: e.target.value });
                      }
                    }}
                    className="w-full bg-card border border-[#2A2A2A] rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm outline-none focus:border-neon transition-colors"
                  />
                </div>

                {/* Door Game specific */}
                {gameType === "door_game" && (
                  <div>
                    <label className="block text-xs sm:text-sm text-gray-400 mb-2">Entry Fee (₦) *</label>
                    <input
                      type="number"
                      placeholder="500"
                      value={doorConfig.entry_fee}
                      onChange={(e) => setDoorConfig({ ...doorConfig, entry_fee: e.target.value })}
                      className="w-full bg-card border border-[#2A2A2A] rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-white outline-none focus:border-neon transition-colors text-sm"
                    />
                  </div>
                )}

                {/* Challenge Game specific */}
                {gameType === "challenge_game" && (
                  <>
                    <div>
                      <label className="block text-xs sm:text-sm text-gray-400 mb-2">Category *</label>
                      <select
                        value={challengeConfig.category}
                        onChange={(e) => setChallengeConfig({ ...challengeConfig, category: e.target.value })}
                        className="w-full bg-card border border-[#2A2A2A] rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-white outline-none focus:border-neon transition-colors text-sm"
                      >
                        <option value="">Select category...</option>
                        <option value="Sports">Sports</option>
                        <option value="Football">Football</option>
                        <option value="Crypto">Crypto</option>
                        <option value="Politics">Politics</option>
                        <option value="Entertainment">Entertainment</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:gap-4">
                      <div>
                        <label className="block text-xs sm:text-sm text-gray-400 mb-2">Stake (₦) *</label>
                        <input
                          type="number"
                          placeholder="1000"
                          value={challengeConfig.stake_amount}
                          onChange={(e) => setChallengeConfig({ ...challengeConfig, stake_amount: e.target.value })}
                          className="w-full bg-card border border-[#2A2A2A] rounded-lg px-2.5 sm:px-4 py-2.5 sm:py-3 text-white outline-none focus:border-neon transition-colors text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm text-gray-400 mb-2">Prize (₦) *</label>
                        <input
                          type="number"
                          placeholder="50000"
                          value={challengeConfig.prize_pool}
                          onChange={(e) => setChallengeConfig({ ...challengeConfig, prize_pool: e.target.value })}
                          className="w-full bg-card border border-[#2A2A2A] rounded-lg px-2.5 sm:px-4 py-2.5 sm:py-3 text-white outline-none focus:border-neon transition-colors text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:gap-4">
                      <div>
                        <label className="block text-xs sm:text-sm text-gray-400 mb-2">Max Players *</label>
                        <input
                          type="number"
                          placeholder="20"
                          value={challengeConfig.max_participants}
                          onChange={(e) => setChallengeConfig({ ...challengeConfig, max_participants: e.target.value })}
                          className="w-full bg-card border border-[#2A2A2A] rounded-lg px-2.5 sm:px-4 py-2.5 sm:py-3 text-white outline-none focus:border-neon transition-colors text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm text-gray-400 mb-2">Countdown (min) *</label>
                        <input
                          type="number"
                          placeholder="120"
                          value={challengeConfig.countdown_duration}
                          onChange={(e) => setChallengeConfig({ ...challengeConfig, countdown_duration: e.target.value })}
                          className="w-full bg-card border border-[#2A2A2A] rounded-lg px-2.5 sm:px-4 py-2.5 sm:py-3 text-white outline-none focus:border-neon transition-colors text-sm"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button
                  onClick={() => setStep("type")}
                  className="order-2 sm:order-1 py-2.5 sm:py-3 px-4 rounded-lg border border-[#2A2A2A] text-white text-sm font-semibold hover:bg-[#1A1A1A] transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep("review")}
                  className="order-1 sm:order-2 flex-1 sm:flex-1 btn-primary py-2.5 sm:py-3 px-4 flex items-center justify-center gap-2 text-sm sm:text-base font-semibold"
                >
                  Review <ArrowRight size={18} />
                </button>
              </div>
            </motion.div>
          )}

          {step === "review" && gameType && (
            <motion.div
              key="review"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <button
                onClick={() => setStep("config")}
                className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
              >
                <ArrowLeft size={18} />
                Back
              </button>

              <h1 className="text-2xl sm:text-3xl font-black text-white mb-6">Review & Create</h1>

              <div className="bg-card border border-[#2A2A2A] rounded-lg p-6 mb-6 space-y-4">
                {gameType === "door_game" ? (
                  <>
                    <div>
                      <p className="text-gray-400 text-sm">Game Type</p>
                      <p className="text-white font-bold">🚪 Door Game</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Title</p>
                      <p className="text-white font-bold">{doorConfig.title}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Entry Fee</p>
                      <p className="text-neon font-bold">₦{doorConfig.entry_fee}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <p className="text-gray-400 text-sm">Game Type</p>
                      <p className="text-white font-bold">⚡ Challenge Game</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Title</p>
                      <p className="text-white font-bold">{challengeConfig.title}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Category</p>
                      <p className="text-white font-bold">{challengeConfig.category}</p>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-gray-400 text-sm">Entry Stake</p>
                        <p className="text-neon font-bold">₦{challengeConfig.stake_amount}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Prize Pool</p>
                        <p className="text-neon font-bold">₦{challengeConfig.prize_pool}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Max Players</p>
                        <p className="text-neon font-bold">{challengeConfig.max_participants}</p>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep("config")}
                  className="flex-1 py-3 px-4 rounded-lg border border-[#2A2A2A] text-white font-semibold hover:bg-[#1A1A1A] transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleCreateGame}
                  disabled={loading}
                  className="flex-1 btn-primary py-3 px-4 font-semibold disabled:opacity-50"
                >
                  {loading ? "Creating..." : "Create & Activate Game"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AdminShell>
  );
}
