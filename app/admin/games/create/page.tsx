"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminApi, ApiError } from "@/lib/api";
import { ArrowLeft, ArrowRight, Loader2, DoorOpen, Zap, Check, X } from "lucide-react";

type Step = "type" | "config" | "doors" | "review";
type GameType = "door_game" | "challenge_game";
type QuestionFormat = "multiple_choice" | "type_answer";
type Difficulty = "Easy" | "Medium" | "Hard";

interface Question {
  text: string;
  format: QuestionFormat;
  difficulty: Difficulty;
  prize: number;
  time_limit: number;
  options?: string[];
  correct_answer: string;
}

interface DoorQuestion {
  door_number: 1 | 2 | 3;
  question: Question;
}

const difficulties: Difficulty[] = ["Easy", "Medium", "Hard"];
const categories = ["Sports", "Football", "Basketball", "Crypto", "Politics", "Entertainment", "Technology", "General Knowledge"];

export default function CreateGamePage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("type");
  const [gameType, setGameType] = useState<GameType | null>(null);
  const [doorConfig, setDoorConfig] = useState({ title: "", description: "", entry_fee: 500 });
  const [challengeConfig, setChallengeConfig] = useState({
    title: "", description: "", category: "Sports", stake_amount: 1000,
    prize_pool: 10000, max_participants: 20, countdown_duration: 60,
  });
  const [doorQuestions, setDoorQuestions] = useState<DoorQuestion[]>([
    { door_number: 1, question: { text: "", format: "multiple_choice", difficulty: "Easy", prize: 500, time_limit: 15, options: ["", "", "", ""], correct_answer: "" } },
    { door_number: 2, question: { text: "", format: "multiple_choice", difficulty: "Medium", prize: 2000, time_limit: 10, options: ["", "", "", ""], correct_answer: "" } },
    { door_number: 3, question: { text: "", format: "multiple_choice", difficulty: "Hard", prize: 5000, time_limit: 10, options: ["", "", "", ""], correct_answer: "" } },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleNext = () => {
    if (step === "type" && gameType) {
      setStep("config");
    } else if (step === "config") {
      if (gameType === "door_game") {
        if (!doorConfig.title.trim()) { setError("Game title is required"); return; }
        setStep("doors");
      } else {
        if (!challengeConfig.title.trim()) { setError("Game title is required"); return; }
        setStep("review");
      }
      setError("");
    } else if (step === "doors" && gameType === "door_game") {
      const allComplete = doorQuestions.every((dq) => {
        const q = dq.question;
        if (!q.text.trim()) return false;
        if (q.format === "multiple_choice" && q.options?.some((o) => !o.trim())) return false;
        if (!q.correct_answer.trim()) return false;
        return true;
      });
      if (!allComplete) { setError("All doors must have complete questions"); return; }
      setError("");
      setStep("review");
    }
  };

  const handleBack = () => {
    if (step === "config") setStep("type");
    else if (step === "doors") setStep("config");
    else if (step === "review") setStep(gameType === "door_game" ? "doors" : "config");
    setError("");
  };

  const handleCreate = async () => {
    setLoading(true);
    try {
      const data = gameType === "door_game"
        ? {
            game_type: "door_game",
            title: doorConfig.title,
            description: doorConfig.description,
            entry_fee: doorConfig.entry_fee,
            door_questions: doorQuestions,
          }
        : {
            game_type: "challenge_game",
            title: challengeConfig.title,
            description: challengeConfig.description,
            category: challengeConfig.category,
            stake_amount: challengeConfig.stake_amount,
            prize_pool: challengeConfig.prize_pool,
            max_participants: challengeConfig.max_participants,
            countdown_duration: challengeConfig.countdown_duration,
          };
      const res = await adminApi.createGame(data as any);
      router.push(`/admin/games/${res.game.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create game");
    } finally {
      setLoading(false);
    }
  };

  const updateDoorQuestion = (doorNum: 1 | 2 | 3, updates: Partial<Question>) => {
    setDoorQuestions((prev) => prev.map((dq) => dq.door_number === doorNum ? { ...dq, question: { ...dq.question, ...updates } } : dq));
  };

  const updateDoorOption = (doorNum: 1 | 2 | 3, optionIdx: number, value: string) => {
    setDoorQuestions((prev) => prev.map((dq) => dq.door_number === doorNum ? { ...dq, question: { ...dq.question, options: dq.question.options?.map((o, i) => i === optionIdx ? value : o) || [] } } : dq));
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center gap-2">
        <div className={`h-1 flex-1 rounded-full ${["type", "config", "doors", "review"].indexOf(step) >= 0 ? "bg-neon" : "bg-[#2A2A2A]"}`} />
        <div className={`h-1 flex-1 rounded-full ${["config", "doors", "review"].indexOf(step) >= 0 ? "bg-neon" : "bg-[#2A2A2A]"}`} />
        <div className={`h-1 flex-1 rounded-full ${gameType === "challenge_game" && ["review"].indexOf(step) >= 0 ? "bg-neon" : gameType === "door_game" && ["doors", "review"].indexOf(step) >= 0 ? "bg-neon" : "bg-[#2A2A2A]"}`} />
        <div className={`h-1 flex-1 rounded-full ${["review"].indexOf(step) >= 0 ? "bg-neon" : "bg-[#2A2A2A]"}`} />
      </div>

      <div className="bg-card border border-[#2A2A2A] rounded-2xl p-6">
        {step === "type" && (
          <div className="space-y-4">
            <div>
              <h1 className="text-2xl font-black text-white mb-2">Create New Game</h1>
              <p className="text-gray-400 text-sm">Choose which type of game you want to create</p>
            </div>
            <div className="space-y-3">
              <button onClick={() => setGameType("door_game")} className={`w-full p-4 rounded-xl border-2 transition-all text-left ${gameType === "door_game" ? "border-neon bg-neon/10" : "border-[#2A2A2A] bg-[#111] hover:border-neon/50"}`}>
                <div className="flex items-start gap-3">
                  <DoorOpen size={24} className={gameType === "door_game" ? "text-neon" : "text-gray-500"} />
                  <div>
                    <h3 className="font-bold text-white">🚪 Door Game</h3>
                    <p className="text-xs text-gray-400 mt-1">Traditional 3-door game with immediate winners. Set custom questions for each door.</p>
                  </div>
                  {gameType === "door_game" && <Check size={20} className="text-neon ml-auto flex-shrink-0" />}
                </div>
              </button>
              <button onClick={() => setGameType("challenge_game")} className={`w-full p-4 rounded-xl border-2 transition-all text-left ${gameType === "challenge_game" ? "border-neon bg-neon/10" : "border-[#2A2A2A] bg-[#111] hover:border-neon/50"}`}>
                <div className="flex items-start gap-3">
                  <Zap size={24} className={gameType === "challenge_game" ? "text-neon" : "text-gray-500"} />
                  <div>
                    <h3 className="font-bold text-white">⚡ Challenge Game</h3>
                    <p className="text-xs text-gray-400 mt-1">Limited-participation prediction game. Admin reveals answer and pays winners.</p>
                  </div>
                  {gameType === "challenge_game" && <Check size={20} className="text-neon ml-auto flex-shrink-0" />}
                </div>
              </button>
            </div>
          </div>
        )}

        {step === "config" && (
          <div className="space-y-4">
            <h1 className="text-2xl font-black text-white">{gameType === "door_game" ? "🚪 Configure Door Game" : "⚡ Configure Challenge"}</h1>
            {error && <div className="bg-red-900/20 border border-red-800/40 rounded-lg p-3 text-red-400 text-sm">{error}</div>}
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Game Title *</label>
                <input type="text" placeholder={gameType === "door_game" ? "e.g., Daily Quiz #42" : "e.g., Football Challenge"} value={gameType === "door_game" ? doorConfig.title : challengeConfig.title} onChange={(e) => gameType === "door_game" ? setDoorConfig({ ...doorConfig, title: e.target.value }) : setChallengeConfig({ ...challengeConfig, title: e.target.value })} className="w-full bg-[#111] border border-[#2A2A2A] focus:border-neon rounded-lg px-3 py-2 text-sm text-white outline-none transition-colors" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Description</label>
                <textarea placeholder="Optional description..." value={gameType === "door_game" ? doorConfig.description : challengeConfig.description} onChange={(e) => gameType === "door_game" ? setDoorConfig({ ...doorConfig, description: e.target.value }) : setChallengeConfig({ ...challengeConfig, description: e.target.value })} className="w-full bg-[#111] border border-[#2A2A2A] focus:border-neon rounded-lg px-3 py-2 text-sm text-white outline-none transition-colors" rows={3} />
              </div>
              {gameType === "door_game" ? (
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Entry Fee (₦) *</label>
                  <input type="number" min="100" value={doorConfig.entry_fee} onChange={(e) => setDoorConfig({ ...doorConfig, entry_fee: Number(e.target.value) })} className="w-full bg-[#111] border border-[#2A2A2A] focus:border-neon rounded-lg px-3 py-2 text-sm text-white outline-none transition-colors" />
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Category *</label>
                    <select value={challengeConfig.category} onChange={(e) => setChallengeConfig({ ...challengeConfig, category: e.target.value })} className="w-full bg-[#111] border border-[#2A2A2A] focus:border-neon rounded-lg px-3 py-2 text-sm text-white outline-none transition-colors">
                      {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Entry Stake (₦) *</label>
                      <input type="number" min="100" value={challengeConfig.stake_amount} onChange={(e) => setChallengeConfig({ ...challengeConfig, stake_amount: Number(e.target.value) })} className="w-full bg-[#111] border border-[#2A2A2A] focus:border-neon rounded-lg px-3 py-2 text-sm text-white outline-none transition-colors" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Prize Pool (₦) *</label>
                      <input type="number" min="1000" value={challengeConfig.prize_pool} onChange={(e) => setChallengeConfig({ ...challengeConfig, prize_pool: Number(e.target.value) })} className="w-full bg-[#111] border border-[#2A2A2A] focus:border-neon rounded-lg px-3 py-2 text-sm text-white outline-none transition-colors" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Max Participants *</label>
                      <input type="number" min="1" max="1000" value={challengeConfig.max_participants} onChange={(e) => setChallengeConfig({ ...challengeConfig, max_participants: Number(e.target.value) })} className="w-full bg-[#111] border border-[#2A2A2A] focus:border-neon rounded-lg px-3 py-2 text-sm text-white outline-none transition-colors" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Countdown (minutes) *</label>
                      <input type="number" min="1" max="1440" value={challengeConfig.countdown_duration} onChange={(e) => setChallengeConfig({ ...challengeConfig, countdown_duration: Number(e.target.value) })} className="w-full bg-[#111] border border-[#2A2A2A] focus:border-neon rounded-lg px-3 py-2 text-sm text-white outline-none transition-colors" />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {step === "doors" && gameType === "door_game" && (
          <div className="space-y-4">
            <h1 className="text-2xl font-black text-white">🚪 Set Questions for Each Door</h1>
            {error && <div className="bg-red-900/20 border border-red-800/40 rounded-lg p-3 text-red-400 text-sm">{error}</div>}
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              {doorQuestions.map((dq) => {
                const q = dq.question;
                return (
                  <div key={dq.door_number} className="bg-[#111] rounded-xl p-4 border border-[#2A2A2A] space-y-3">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-2xl">🚪</span>
                      <h3 className="text-lg font-bold text-white">Door {dq.door_number}</h3>
                      <span className={`text-xs font-bold px-2 py-1 rounded ${q.difficulty === "Easy" ? "bg-green-900/30 text-green-400" : q.difficulty === "Medium" ? "bg-yellow-900/30 text-yellow-400" : "bg-red-900/30 text-red-400"}`}>{q.difficulty}</span>
                      <span className="text-neon font-bold ml-auto">₦{q.prize}</span>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Question *</label>
                      <textarea value={q.text} onChange={(e) => updateDoorQuestion(dq.door_number, { text: e.target.value })} placeholder="Enter the question..." className="w-full bg-black border border-[#2A2A2A] focus:border-neon rounded-lg px-3 py-2 text-sm text-white outline-none transition-colors" rows={2} />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">Format</label>
                        <select value={q.format} onChange={(e) => updateDoorQuestion(dq.door_number, { format: e.target.value as QuestionFormat })} className="w-full bg-black border border-[#2A2A2A] focus:border-neon rounded-lg px-2 py-2 text-xs text-white outline-none">
                          <option value="multiple_choice">Multiple Choice</option>
                          <option value="type_answer">Type Answer</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">Difficulty</label>
                        <select value={q.difficulty} onChange={(e) => updateDoorQuestion(dq.door_number, { difficulty: e.target.value as Difficulty })} className="w-full bg-black border border-[#2A2A2A] focus:border-neon rounded-lg px-2 py-2 text-xs text-white outline-none">
                          {difficulties.map((d) => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">Prize (₦)</label>
                        <input type="number" value={q.prize} onChange={(e) => updateDoorQuestion(dq.door_number, { prize: Number(e.target.value) })} className="w-full bg-black border border-[#2A2A2A] focus:border-neon rounded-lg px-2 py-2 text-xs text-white outline-none" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Time Limit (seconds)</label>
                      <input type="number" value={q.time_limit} onChange={(e) => updateDoorQuestion(dq.door_number, { time_limit: Number(e.target.value) })} className="w-full bg-black border border-[#2A2A2A] focus:border-neon rounded-lg px-3 py-2 text-sm text-white outline-none" />
                    </div>
                    {q.format === "multiple_choice" ? (
                      <div>
                        <label className="text-xs text-gray-400 mb-2 block">Options (4 required) *</label>
                        <div className="space-y-2">
                          {q.options?.map((opt, optIdx) => (
                            <div key={optIdx} className="flex items-center gap-2">
                              <input type="text" value={opt} onChange={(e) => updateDoorOption(dq.door_number, optIdx, e.target.value)} placeholder={`Option ${optIdx + 1}`} className="flex-1 bg-black border border-[#2A2A2A] focus:border-neon rounded-lg px-3 py-2 text-sm text-white outline-none" />
                              <select value={q.correct_answer === opt ? "correct" : ""} onChange={(e) => { if (e.target.value === "correct") updateDoorQuestion(dq.door_number, { correct_answer: opt }); }} className="bg-black border border-[#2A2A2A] focus:border-neon rounded-lg px-2 py-2 text-xs text-white outline-none">
                                <option value="">Wrong</option>
                                <option value="correct">✓ Correct</option>
                              </select>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">Correct Answer *</label>
                        <input type="text" value={q.correct_answer} onChange={(e) => updateDoorQuestion(dq.door_number, { correct_answer: e.target.value })} placeholder="Enter the correct answer" className="w-full bg-black border border-[#2A2A2A] focus:border-neon rounded-lg px-3 py-2 text-sm text-white outline-none" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {step === "review" && (
          <div className="space-y-4">
            <h1 className="text-2xl font-black text-white">Review & Create</h1>
            <div className="bg-[#111] rounded-xl p-4 space-y-3 max-h-96 overflow-y-auto pr-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Game Type</span>
                <span className="text-white font-bold">{gameType === "door_game" ? "🚪 Door Game" : "⚡ Challenge"}</span>
              </div>
              <div className="border-t border-[#2A2A2A] pt-3 flex items-center justify-between">
                <span className="text-gray-400 text-sm">Title</span>
                <span className="text-white font-bold">{gameType === "door_game" ? doorConfig.title : challengeConfig.title}</span>
              </div>
              {gameType === "door_game" ? (
                <>
                  <div className="border-t border-[#2A2A2A] pt-3 flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Entry Fee</span>
                    <span className="text-neon font-bold">₦{doorConfig.entry_fee.toLocaleString()}</span>
                  </div>
                  <div className="border-t border-[#2A2A2A] pt-3 space-y-2">
                    <span className="text-gray-400 text-sm block">Doors</span>
                    {doorQuestions.map((dq) => (
                      <div key={dq.door_number} className="bg-black rounded-lg p-2 text-xs">
                        <p className="text-neon font-bold">Door {dq.door_number} • {dq.question.difficulty} • ₦{dq.question.prize}</p>
                        <p className="text-gray-300 mt-1 line-clamp-2">{dq.question.text}</p>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div className="border-t border-[#2A2A2A] pt-3 flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Category</span>
                    <span className="text-white font-bold">{challengeConfig.category}</span>
                  </div>
                  <div className="border-t border-[#2A2A2A] pt-3 flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Entry Stake</span>
                    <span className="text-neon font-bold">₦{challengeConfig.stake_amount.toLocaleString()}</span>
                  </div>
                  <div className="border-t border-[#2A2A2A] pt-3 flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Prize Pool</span>
                    <span className="text-neon font-bold">₦{challengeConfig.prize_pool.toLocaleString()}</span>
                  </div>
                  <div className="border-t border-[#2A2A2A] pt-3 flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Max Participants / Countdown</span>
                    <span className="text-white font-bold">{challengeConfig.max_participants} / {challengeConfig.countdown_duration}m</span>
                  </div>
                </>
              )}
            </div>
            {error && <div className="bg-red-900/20 border border-red-800/40 rounded-lg p-3 text-red-400 text-sm">{error}</div>}
          </div>
        )}

        <div className="mt-6 flex gap-3">
          {step !== "type" && <button onClick={handleBack} disabled={loading} className="flex items-center gap-2 px-4 py-2 border border-[#2A2A2A] rounded-lg text-gray-300 hover:text-white transition-colors disabled:opacity-50"><ArrowLeft size={16} /> Back</button>}
          {step !== "review" ? (
            <button onClick={handleNext} disabled={!gameType || loading} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-neon text-black font-bold rounded-lg hover:bg-neon/90 transition-colors disabled:opacity-50">Next <ArrowRight size={16} /></button>
          ) : (
            <button onClick={handleCreate} disabled={loading} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-neon text-black font-bold rounded-lg hover:bg-neon/90 transition-colors disabled:opacity-50">{loading ? <><Loader2 size={16} className="animate-spin" /> Creating...</> : <><Check size={16} /> Create & Activate</>}</button>
          )}
        </div>
      </div>
    </div>
  );
}
