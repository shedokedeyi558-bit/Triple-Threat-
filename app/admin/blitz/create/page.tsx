"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAdmin } from "@/context/AdminContext";
import { adminApi, type BlitzQuestion, ApiError } from "@/lib/api";
import { ArrowLeft, Plus, Trash2, CheckCircle, Zap } from "lucide-react";

interface QuestionDraft {
  question: string;
  format: "multiple_choice" | "type_answer";
  options: string[];
  correct_answer: string;
}

interface TournamentDetails {
  title: string;
  description: string;
  entry_fee: string;
  question_count: string;
  time_limit_seconds: string;
  platform_cut_percent: string;
  max_participants: string;
  cash_winner_count: string;
  payout_distribution: string[];
  total_payout_percent: string;
  ticket_tier_percent: string;
  guaranteed_minimum: string;
}

interface TournamentSchedule {
  registration_start: string;
  tournament_start: string;
  tournament_end: string;
}

export default function AdminBlitzCreatePage() {
  const { state } = useAdmin();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [details, setDetails] = useState<TournamentDetails>({
    title: "",
    description: "",
    entry_fee: "",
    question_count: "",
    time_limit_seconds: "",
    platform_cut_percent: "",
    max_participants: "",
    cash_winner_count: "",
    payout_distribution: [],
    total_payout_percent: "",
    ticket_tier_percent: "",
    guaranteed_minimum: "",
  });

  const [schedule, setSchedule] = useState<TournamentSchedule>({
    registration_start: "",
    tournament_start: "",
    tournament_end: "",
  });

  const [questions, setQuestions] = useState<QuestionDraft[]>([]);
  const [qDraft, setQDraft] = useState<QuestionDraft>({
    question: "",
    format: "multiple_choice",
    options: ["", "", "", ""],
    correct_answer: "",
  });
  const [createdId, setCreatedId] = useState<string | null>(null);

  if (!state.isAuthenticated) {
    router.push("/admin/login");
    return null;
  }

  const requiredCount = parseInt(details.question_count) || 0;

  const validateStep1 = () => {
    if (!details.title.trim()) return "Title is required";
    if (!details.entry_fee || isNaN(Number(details.entry_fee)) || Number(details.entry_fee) <= 0) return "Valid entry fee required";
    if (!details.question_count || isNaN(Number(details.question_count)) || Number(details.question_count) < 1) return "Valid question count required";
    if (!details.time_limit_seconds || isNaN(Number(details.time_limit_seconds)) || Number(details.time_limit_seconds) < 10) return "Time limit must be at least 10 seconds";
    if (!details.max_participants || isNaN(Number(details.max_participants)) || Number(details.max_participants) < 1) return "Valid max participants required";
    if (!details.cash_winner_count || isNaN(Number(details.cash_winner_count)) || Number(details.cash_winner_count) < 1) return "Valid cash winner count required";
    
    const cashWinners = Number(details.cash_winner_count);
    if (details.payout_distribution.length !== cashWinners) return `Payout distribution must have exactly ${cashWinners} entries`;
    
    const totalPayout = details.payout_distribution.reduce((sum, p) => sum + (isNaN(Number(p)) ? 0 : Number(p)), 0);
    if (Math.abs(totalPayout - 100) > 0.01) return `Payout percentages must sum to 100 (currently ${totalPayout.toFixed(1)}%)`;
    
    if (!details.total_payout_percent || isNaN(Number(details.total_payout_percent)) || Number(details.total_payout_percent) < 0 || Number(details.total_payout_percent) > 100) 
      return "Valid total payout percent (0-100) required";
    if (!details.ticket_tier_percent || isNaN(Number(details.ticket_tier_percent)) || Number(details.ticket_tier_percent) < 0 || Number(details.ticket_tier_percent) > 100) 
      return "Valid ticket tier percent (0-100) required";
    
    if (details.guaranteed_minimum && (isNaN(Number(details.guaranteed_minimum)) || Number(details.guaranteed_minimum) < 0))
      return "Guaranteed minimum must be a valid number";
    
    return null;
  };

  const validateStep2 = () => {
    if (!schedule.registration_start) return "Registration start required";
    if (!schedule.tournament_start) return "Tournament start required";
    if (!schedule.tournament_end) return "Tournament end required";
    if (new Date(schedule.tournament_start) <= new Date(schedule.registration_start)) return "Tournament start must be after registration start";
    if (new Date(schedule.tournament_end) <= new Date(schedule.tournament_start)) return "Tournament end must be after tournament start";
    return null;
  };

  const handleStep1Next = () => {
    const err = validateStep1();
    if (err) { setError(err); return; }
    setError("");
    setStep(2);
  };

  const handleStep2Next = () => {
    const err = validateStep2();
    if (err) { setError(err); return; }
    setError("");
    setStep(3);
  };

  const addQuestion = () => {
    if (!qDraft.question.trim()) { setError("Question text required"); return; }
    if (!qDraft.correct_answer.trim()) { setError("Correct answer required"); return; }
    if (qDraft.format === "multiple_choice") {
      const filled = qDraft.options.filter((o) => o.trim());
      if (filled.length < 2) { setError("At least 2 options required"); return; }
    }
    setQuestions((prev) => [...prev, { ...qDraft }]);
    setQDraft({ question: "", format: "multiple_choice", options: ["", "", "", ""], correct_answer: "" });
    setError("");
  };

  const removeQuestion = (index: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePublish = async () => {
    if (questions.length < requiredCount) {
      setError(`Need ${requiredCount} questions, have ${questions.length}`);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await adminApi.createBlitz({
        title: details.title,
        description: details.description || undefined,
        entry_fee: Number(details.entry_fee),
        question_count: Number(details.question_count),
        time_limit_seconds: Number(details.time_limit_seconds),
        registration_start: new Date(schedule.registration_start).toISOString(),
        tournament_start: new Date(schedule.tournament_start).toISOString(),
        tournament_end: new Date(schedule.tournament_end).toISOString(),
        platform_cut_percent: details.platform_cut_percent ? Number(details.platform_cut_percent) : undefined,
      });

      const tournamentId = res.tournament.id;
      setCreatedId(tournamentId);

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        await adminApi.addBlitzQuestion(tournamentId, {
          question: q.question,
          format: q.format,
          options: q.format === "multiple_choice" ? q.options.filter((o) => o.trim()) : undefined,
          correct_answer: q.correct_answer,
          order_index: i + 1,
        });
      }

      await adminApi.publishBlitz(tournamentId);
      router.push("/admin/blitz");
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full bg-[#0A0A0A] border border-[#1E1E1E] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-neon/60 placeholder-gray-700";

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-4 lg:p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => step > 1 ? setStep((s) => s - 1) : router.push("/admin/blitz")}
            className="p-2 rounded-lg bg-[#141414] border border-[#1E1E1E] hover:border-neon/30 transition-colors"
          >
            <ArrowLeft size={18} className="text-gray-400" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <Zap size={18} className="text-neon" />
              <h1 className="font-black text-xl text-white">Create Blitz</h1>
            </div>
            <div className="flex items-center gap-1 mt-1">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`h-1 rounded-full transition-all ${s <= step ? "bg-neon" : "bg-[#1E1E1E]"}`}
                  style={{ width: s <= step ? 24 : 12 }}
                />
              ))}
              <span className="text-gray-500 text-xs ml-1">Step {step}/3</span>
            </div>
          </div>
        </div>

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-400 text-sm bg-red-900/10 border border-red-900/30 rounded-xl p-3"
          >
            {error}
          </motion.p>
        )}

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="bg-[#141414] border border-[#1E1E1E] rounded-2xl p-5 space-y-4"
            >
              <h2 className="text-white font-bold text-base">Tournament Details</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-gray-500 text-xs mb-1.5 block">Title *</label>
                  <input className={inputCls} placeholder="e.g. Weekend Blitz #1" value={details.title} onChange={(e) => setDetails({ ...details, title: e.target.value })} />
                </div>
                <div>
                  <label className="text-gray-500 text-xs mb-1.5 block">Description</label>
                  <textarea className={inputCls + " resize-none"} rows={2} placeholder="Optional description..." value={details.description} onChange={(e) => setDetails({ ...details, description: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-gray-500 text-xs mb-1.5 block">Entry Fee (₦) *</label>
                    <input className={inputCls} type="number" placeholder="" value={details.entry_fee} onChange={(e) => setDetails({ ...details, entry_fee: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-gray-500 text-xs mb-1.5 block">Question Count *</label>
                    <input className={inputCls} type="number" placeholder="" value={details.question_count} onChange={(e) => setDetails({ ...details, question_count: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-gray-500 text-xs mb-1.5 block">Time Limit (seconds) *</label>
                    <input className={inputCls} type="number" placeholder="" value={details.time_limit_seconds} onChange={(e) => setDetails({ ...details, time_limit_seconds: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-gray-500 text-xs mb-1.5 block">Platform Cut %</label>
                    <input className={inputCls} type="number" placeholder="e.g. 20" value={details.platform_cut_percent} onChange={(e) => setDetails({ ...details, platform_cut_percent: e.target.value })} />
                  </div>
                </div>

                {/* Payout Configuration */}
                <div className="pt-4 border-t border-[#1E1E1E] space-y-3">
                  <h3 className="text-white font-semibold text-sm">Payout Configuration</h3>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-gray-500 text-xs mb-1.5 block">Max Participants *</label>
                      <input className={inputCls} type="number" placeholder="e.g. 1000" value={details.max_participants} onChange={(e) => setDetails({ ...details, max_participants: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-gray-500 text-xs mb-1.5 block">Cash Winner Count *</label>
                      <input className={inputCls} type="number" placeholder="e.g. 3" value={details.cash_winner_count} onChange={(e) => {
                        const count = Number(e.target.value);
                        setDetails({ 
                          ...details, 
                          cash_winner_count: e.target.value,
                          payout_distribution: Array(count).fill("").map((_, i) => details.payout_distribution[i] ?? "")
                        });
                      }} />
                    </div>
                  </div>

                  {Number(details.cash_winner_count) > 0 && (
                    <div>
                      <label className="text-gray-500 text-xs mb-1.5 block">Payout Distribution % (must sum to 100) *</label>
                      <div className="space-y-2">
                        {Array.from({ length: Number(details.cash_winner_count) }).map((_, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <span className="text-gray-600 text-xs font-mono w-12">Rank {i + 1}:</span>
                            <input 
                              className={inputCls} 
                              type="number" 
                              placeholder="0" 
                              value={details.payout_distribution[i] ?? ""}
                              onChange={(e) => {
                                const newDist = [...details.payout_distribution];
                                newDist[i] = e.target.value;
                                setDetails({ ...details, payout_distribution: newDist });
                              }}
                            />
                            <span className="text-gray-600 text-xs">%</span>
                          </div>
                        ))}
                      </div>
                      {details.payout_distribution.length > 0 && (
                        <p className="text-gray-600 text-xs mt-2">
                          Total: {details.payout_distribution.reduce((sum, p) => sum + (isNaN(Number(p)) ? 0 : Number(p)), 0).toFixed(1)}%
                        </p>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-gray-500 text-xs mb-1.5 block">Total Payout % *</label>
                      <input className={inputCls} type="number" placeholder="e.g. 70" value={details.total_payout_percent} onChange={(e) => setDetails({ ...details, total_payout_percent: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-gray-500 text-xs mb-1.5 block">Ticket Tier % *</label>
                      <input className={inputCls} type="number" placeholder="e.g. 30" value={details.ticket_tier_percent} onChange={(e) => setDetails({ ...details, ticket_tier_percent: e.target.value })} />
                    </div>
                  </div>

                  <div>
                    <label className="text-gray-500 text-xs mb-1.5 block">Guaranteed Minimum Prize</label>
                    <input className={inputCls} type="number" placeholder="Optional - e.g. 50000" value={details.guaranteed_minimum} onChange={(e) => setDetails({ ...details, guaranteed_minimum: e.target.value })} />
                  </div>
                </div>
              </div>
              <button
                onClick={handleStep1Next}
                className="w-full py-3.5 bg-neon text-black font-black rounded-xl text-sm"
              >
                Next: Schedule
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="bg-[#141414] border border-[#1E1E1E] rounded-2xl p-5 space-y-4"
            >
              <h2 className="text-white font-bold text-base">Schedule</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-gray-500 text-xs mb-1.5 block">Registration Opens *</label>
                  <input className={inputCls} type="datetime-local" value={schedule.registration_start} onChange={(e) => setSchedule({ ...schedule, registration_start: e.target.value })} />
                </div>
                <div>
                  <label className="text-gray-500 text-xs mb-1.5 block">Tournament Starts *</label>
                  <input className={inputCls} type="datetime-local" value={schedule.tournament_start} onChange={(e) => setSchedule({ ...schedule, tournament_start: e.target.value })} />
                </div>
                <div>
                  <label className="text-gray-500 text-xs mb-1.5 block">Tournament Ends *</label>
                  <input className={inputCls} type="datetime-local" value={schedule.tournament_end} onChange={(e) => setSchedule({ ...schedule, tournament_end: e.target.value })} />
                </div>
              </div>
              <button
                onClick={handleStep2Next}
                className="w-full py-3.5 bg-neon text-black font-black rounded-xl text-sm"
              >
                Next: Add Questions
              </button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="space-y-4"
            >
              <div className="bg-[#141414] border border-[#1E1E1E] rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-white font-bold text-base">Add Questions</h2>
                  <span className={`text-xs font-bold px-2 py-1 rounded-lg ${questions.length >= requiredCount ? "bg-neon/20 text-neon" : "bg-gray-700/20 text-gray-400"}`}>
                    {questions.length}/{requiredCount}
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-gray-500 text-xs mb-1.5 block">Question *</label>
                    <textarea
                      className={inputCls + " resize-none"}
                      rows={2}
                      placeholder="Enter question text..."
                      value={qDraft.question}
                      onChange={(e) => setQDraft({ ...qDraft, question: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="text-gray-500 text-xs mb-1.5 block">Format</label>
                    <div className="flex gap-2">
                      {(["multiple_choice", "type_answer"] as const).map((fmt) => (
                        <button
                          key={fmt}
                          onClick={() => setQDraft({ ...qDraft, format: fmt })}
                          className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors ${
                            qDraft.format === fmt
                              ? "bg-neon/20 border-neon/60 text-neon"
                              : "bg-[#0A0A0A] border-[#1E1E1E] text-gray-400"
                          }`}
                        >
                          {fmt === "multiple_choice" ? "Multiple Choice" : "Type Answer"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {qDraft.format === "multiple_choice" && (
                    <div>
                      <label className="text-gray-500 text-xs mb-1.5 block">Options</label>
                      <div className="space-y-2">
                        {qDraft.options.map((opt, i) => (
                          <input
                            key={i}
                            className={inputCls}
                            placeholder={`Option ${i + 1}`}
                            value={opt}
                            onChange={(e) => {
                              const newOpts = [...qDraft.options];
                              newOpts[i] = e.target.value;
                              setQDraft({ ...qDraft, options: newOpts });
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-gray-500 text-xs mb-1.5 block">Correct Answer *</label>
                    <input
                      className={inputCls}
                      placeholder="Exact correct answer"
                      value={qDraft.correct_answer}
                      onChange={(e) => setQDraft({ ...qDraft, correct_answer: e.target.value })}
                    />
                  </div>

                  <button
                    onClick={addQuestion}
                    disabled={questions.length >= requiredCount}
                    className="w-full py-3 bg-[#1E1E1E] border border-[#333] rounded-xl text-white text-sm font-bold hover:border-neon/40 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
                  >
                    <Plus size={16} />
                    Add Question
                  </button>
                </div>
              </div>

              {questions.length > 0 && (
                <div className="space-y-2">
                  {questions.map((q, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-[#141414] border border-[#1E1E1E] rounded-xl p-3 flex items-start justify-between gap-3"
                    >
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        <span className="text-neon font-black text-sm flex-shrink-0 mt-0.5">Q{i + 1}</span>
                        <div className="min-w-0">
                          <p className="text-white text-sm font-semibold truncate">{q.question}</p>
                          <p className="text-gray-500 text-xs mt-0.5 truncate">
                            {q.format === "multiple_choice" ? `MC · ${q.options.filter((o) => o).join(", ")}` : "Type answer"}
                            {" · "}<span className="text-neon">✓ {q.correct_answer}</span>
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeQuestion(i)}
                        className="p-1.5 rounded-lg hover:bg-red-900/20 text-gray-600 hover:text-red-400 transition-colors flex-shrink-0"
                      >
                        <Trash2 size={14} />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}

              {questions.length >= requiredCount && requiredCount > 0 && (
                <motion.button
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handlePublish}
                  disabled={loading}
                  className="w-full py-4 bg-neon text-black font-black text-base rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ boxShadow: "0 0 24px #00FF6644" }}
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle size={18} />
                      Publish Tournament
                    </>
                  )}
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
