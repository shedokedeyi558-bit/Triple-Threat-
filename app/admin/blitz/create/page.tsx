"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAdmin } from "@/context/AdminContext";
import { adminApi, type BlitzQuestion, ApiError } from "@/lib/api";
import { ArrowLeft, Plus, Trash2, CheckCircle, Zap } from "lucide-react";

// ── Sample question pool — cycles to cover any question_count ──────────────
const SAMPLE_QUESTIONS_POOL: QuestionDraft[] = [
  { question: "What is the capital of Nigeria?", format: "type_answer", options: [], correct_answer: "Abuja" },
  { question: "Which planet is known as the Red Planet?", format: "multiple_choice", options: ["Earth", "Mars", "Venus", "Jupiter"], correct_answer: "Mars" },
  { question: "What is 12 × 12?", format: "type_answer", options: [], correct_answer: "144" },
  { question: "What is the capital of France?", format: "type_answer", options: [], correct_answer: "Paris" },
  { question: "Which of these is a programming language?", format: "multiple_choice", options: ["TypeScript", "Banana", "Car", "Tree"], correct_answer: "TypeScript" },
  { question: "What year did World War II end?", format: "type_answer", options: [], correct_answer: "1945" },
  { question: "How many sides does a hexagon have?", format: "multiple_choice", options: ["4", "5", "6", "7"], correct_answer: "6" },
  { question: "What is the largest planet in our solar system?", format: "type_answer", options: [], correct_answer: "Jupiter" },
  { question: "What is the chemical symbol for water?", format: "multiple_choice", options: ["H2O", "CO2", "NaCl", "O2"], correct_answer: "H2O" },
  { question: "How many continents are there on Earth?", format: "type_answer", options: [], correct_answer: "7" },
  { question: "What is the square root of 144?", format: "type_answer", options: [], correct_answer: "12" },
  { question: "Which country has the largest population?", format: "multiple_choice", options: ["India", "USA", "China", "Brazil"], correct_answer: "China" },
  { question: "What is 15% of 200?", format: "type_answer", options: [], correct_answer: "30" },
  { question: "What language is primarily spoken in Brazil?", format: "multiple_choice", options: ["Spanish", "Portuguese", "French", "English"], correct_answer: "Portuguese" },
  { question: "How many seconds are in one hour?", format: "type_answer", options: [], correct_answer: "3600" },
  { question: "What is the speed of light (approx) in km/s?", format: "multiple_choice", options: ["300,000", "150,000", "1,000", "30,000"], correct_answer: "300,000" },
  { question: "What is the atomic number of carbon?", format: "type_answer", options: [], correct_answer: "6" },
  { question: "Which ocean is the largest?", format: "multiple_choice", options: ["Atlantic", "Indian", "Pacific", "Arctic"], correct_answer: "Pacific" },
  { question: "What is 8 to the power of 2?", format: "type_answer", options: [], correct_answer: "64" },
  { question: "Which gas do plants absorb from the atmosphere?", format: "multiple_choice", options: ["Oxygen", "Nitrogen", "Carbon dioxide", "Hydrogen"], correct_answer: "Carbon dioxide" },
];

/**
 * Generate exactly `count` sample questions starting from `offset` index,
 * cycling through the pool if count exceeds pool length.
 */
function generateSampleQuestions(count: number, offset = 0): QuestionDraft[] {
  return Array.from({ length: count }, (_, i) =>
    SAMPLE_QUESTIONS_POOL[(offset + i) % SAMPLE_QUESTIONS_POOL.length]
  );
}

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
    
    const totalPayoutPercent = isNaN(Number(details.total_payout_percent)) ? 0 : Number(details.total_payout_percent);
    if (totalPayoutPercent < 1 || totalPayoutPercent > 100) 
      return "Total payout percent must be 1-100";
    
    const ticketTierPercent = isNaN(Number(details.ticket_tier_percent)) ? 0 : Number(details.ticket_tier_percent);
    if (ticketTierPercent < 0 || ticketTierPercent > 100) 
      return "Ticket tier percent must be 0-100";
    
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

  const inputCls = "w-full border rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors placeholder-gray-600"
    + " focus:border-[#4C6FFF]/60"
    + " [background-color:var(--bg-base)] [border-color:var(--border-subtle)] [color:var(--text-primary)]";

  const labelCls = "block text-[10px] font-bold uppercase tracking-widest mb-1.5";

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-4 lg:p-6 overflow-x-hidden">
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
                  className="h-1 rounded-full transition-all"
                  style={{
                    backgroundColor: s <= step ? "var(--accent-indigo)" : "var(--border-subtle)",
                    width: s <= step ? 24 : 12,
                  }}
                />
              ))}
              <span className="text-xs ml-1" style={{ color: "var(--text-muted)" }}>Step {step}/3</span>
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

        {/* Test-fill button */}
        <button
          type="button"
          onClick={() => {
            // Read existing question_count if already set; default to 10
            const existingCount = parseInt(details.question_count);
            const count = existingCount > 0 ? existingCount : 10;
            const usedDefault = !(existingCount > 0);

            const regStart = new Date(Date.now() + 30 * 60 * 1000);
            const tourStart = new Date(Date.now() + 2 * 60 * 60 * 1000);
            const tourEnd = new Date(Date.now() + 3 * 60 * 60 * 1000);
            setDetails({
              title: "Test Blitz #1",
              description: "Dev test tournament",
              entry_fee: "500",
              question_count: String(count),
              time_limit_seconds: "300",
              max_participants: "100",
              cash_winner_count: "3",
              payout_distribution: ["50", "30", "20"],
              total_payout_percent: "70",
              ticket_tier_percent: "30",
              guaranteed_minimum: "",
            });
            setSchedule({
              registration_start: regStart.toISOString().slice(0, 16),
              tournament_start: tourStart.toISOString().slice(0, 16),
              tournament_end: tourEnd.toISOString().slice(0, 16),
            });
            setQuestions(generateSampleQuestions(count));
            setStep(1);
            setError(usedDefault ? `No question count set — defaulted to ${count} questions` : "");
          }}
          className="w-full py-2 rounded-xl text-xs font-semibold border transition-colors"
          style={{ borderColor: "var(--border-hairline)", color: "var(--text-muted)", backgroundColor: "transparent" }}
        >
          Fill Test Data (dev only)
        </button>

        {/* Generate sample questions button - only visible on step 3 */}
        {step === 3 && (
          <button
            type="button"
            onClick={() => {
              const needed = requiredCount - questions.length;
              const toAdd = generateSampleQuestions(needed, questions.length);
              setQuestions((prev) => [...prev, ...toAdd]);
              setError(`Generated ${toAdd.length} sample question${toAdd.length !== 1 ? "s" : ""}`);
            }}
            disabled={questions.length >= requiredCount}
            className="w-full py-2 rounded-xl text-xs font-semibold border transition-colors disabled:opacity-50"
            style={{ borderColor: "var(--border-hairline)", color: "var(--text-muted)", backgroundColor: "transparent" }}
          >
            Generate {Math.max(0, requiredCount - questions.length)} sample questions
          </button>
        )}

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="border rounded-2xl p-5 space-y-5"
              style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-card)" }}
            >
              {/* ── Tournament Details ── */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: "var(--text-muted)" }}>Tournament Details</p>
                <div className="space-y-4">
                  <div>
                    <label className={labelCls} style={{ color: "var(--text-secondary)" }}>Title *</label>
                    <input className={inputCls} placeholder="e.g. Weekend Blitz #1" value={details.title} onChange={(e) => setDetails({ ...details, title: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelCls} style={{ color: "var(--text-secondary)" }}>Description</label>
                    <textarea className={inputCls + " resize-none"} rows={2} placeholder="Optional description..." value={details.description} onChange={(e) => setDetails({ ...details, description: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls} style={{ color: "var(--text-secondary)" }}>Entry Fee (₦) *</label>
                      <input className={inputCls} type="number" placeholder="e.g. 500" value={details.entry_fee} onChange={(e) => setDetails({ ...details, entry_fee: e.target.value })} />
                    </div>
                    <div>
                      <label className={labelCls} style={{ color: "var(--text-secondary)" }}>Question Count *</label>
                      <input className={inputCls} type="number" placeholder="e.g. 10" value={details.question_count} onChange={(e) => setDetails({ ...details, question_count: e.target.value })} />
                    </div>
                    <div>
                      <label className={labelCls} style={{ color: "var(--text-secondary)" }}>Time Limit (sec) *</label>
                      <input className={inputCls} type="number" placeholder="e.g. 300" value={details.time_limit_seconds} onChange={(e) => setDetails({ ...details, time_limit_seconds: e.target.value })} />
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Payout Configuration ── */}
              <div className="pt-4 border-t space-y-4" style={{ borderColor: "var(--border-hairline)" }}>
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Payout Configuration</p>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls} style={{ color: "var(--text-secondary)" }}>Max Participants *</label>
                    <input className={inputCls} type="number" placeholder="e.g. 1000" value={details.max_participants} onChange={(e) => setDetails({ ...details, max_participants: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelCls} style={{ color: "var(--text-secondary)" }}>Cash Winners *</label>
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
                    <label className={labelCls} style={{ color: "var(--text-secondary)" }}>Payout Distribution % (must sum to 100) *</label>
                    <div className="space-y-2">
                      {Array.from({ length: Number(details.cash_winner_count) }).map((_, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-xs font-mono w-14 flex-shrink-0" style={{ color: "var(--text-muted)" }}>Rank {i + 1}</span>
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
                          <span className="text-xs flex-shrink-0" style={{ color: "var(--text-muted)" }}>%</span>
                        </div>
                      ))}
                    </div>
                    {details.payout_distribution.length > 0 && (
                      <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
                        Total: {details.payout_distribution.reduce((sum, p) => sum + (isNaN(Number(p)) ? 0 : Number(p)), 0).toFixed(1)}%
                      </p>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls} style={{ color: "var(--text-secondary)" }}>Total Payout % *</label>
                    <input className={inputCls} type="number" placeholder="e.g. 70" value={details.total_payout_percent} onChange={(e) => setDetails({ ...details, total_payout_percent: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelCls} style={{ color: "var(--text-secondary)" }}>Ticket Tier % *</label>
                    <input className={inputCls} type="number" placeholder="e.g. 30" value={details.ticket_tier_percent} onChange={(e) => setDetails({ ...details, ticket_tier_percent: e.target.value })} />
                  </div>
                </div>

                <div>
                  <label className={labelCls} style={{ color: "var(--text-secondary)" }}>Guaranteed Min Prize</label>
                  <input className={inputCls} type="number" placeholder="Optional — e.g. 50000" value={details.guaranteed_minimum} onChange={(e) => setDetails({ ...details, guaranteed_minimum: e.target.value })} />
                </div>

                {/* Live Payout Preview */}
                <div className="mt-6 pt-4 border-t" style={{ borderColor: "var(--border-hairline)" }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>Payout Summary</p>
                  <div className="rounded-xl p-3 space-y-2" style={{ backgroundColor: "rgba(76,111,255,0.08)", borderColor: "var(--border-hairline)", border: "1px solid" }}>
                    <div className="flex justify-between text-xs">
                      <span style={{ color: "var(--text-secondary)" }}>Cash pool:</span>
                      <span className="font-mono font-semibold" style={{ color: "var(--accent-indigo)" }}>{details.total_payout_percent || "0"}% of revenue</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span style={{ color: "var(--text-secondary)" }}>Ticket tier:</span>
                      <span className="font-mono font-semibold" style={{ color: "var(--accent-violet)" }}>{details.ticket_tier_percent || "0"}% of remaining</span>
                    </div>
                    <div className="flex justify-between text-xs pt-2 border-t" style={{ borderColor: "var(--border-hairline)" }}>
                      <span style={{ color: "var(--text-secondary)" }}>Platform keeps:</span>
                      <span className="font-mono font-semibold" style={{ color: "var(--text-primary)" }}>
                        {(100 - (isNaN(Number(details.total_payout_percent)) ? 0 : Number(details.total_payout_percent))).toFixed(0)}% of revenue
                      </span>
                    </div>
                    {Number(details.total_payout_percent) > 90 && (
                      <div className="mt-2 pt-2 border-t text-[10px]" style={{ borderColor: "var(--border-hairline)", color: "var(--accent-amber)" }}>
                        ⚠ Less than 10% platform margin
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={handleStep1Next}
                className="w-full py-3.5 font-black rounded-xl text-sm transition-opacity hover:opacity-90"
                style={{ backgroundColor: "var(--accent-indigo)", color: "white" }}
              >
                Next: Schedule →
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="border rounded-2xl p-5 space-y-5"
              style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-card)" }}
            >
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Schedule</p>
              <div className="space-y-4">
                <div>
                  <label className={labelCls} style={{ color: "var(--text-secondary)" }}>Registration Opens *</label>
                  <input className={inputCls} type="datetime-local" value={schedule.registration_start} onChange={(e) => setSchedule({ ...schedule, registration_start: e.target.value })} />
                </div>
                <div>
                  <label className={labelCls} style={{ color: "var(--text-secondary)" }}>Tournament Starts *</label>
                  <input className={inputCls} type="datetime-local" value={schedule.tournament_start} onChange={(e) => setSchedule({ ...schedule, tournament_start: e.target.value })} />
                </div>
                <div>
                  <label className={labelCls} style={{ color: "var(--text-secondary)" }}>Tournament Ends *</label>
                  <input className={inputCls} type="datetime-local" value={schedule.tournament_end} onChange={(e) => setSchedule({ ...schedule, tournament_end: e.target.value })} />
                </div>
              </div>
              <button
                onClick={handleStep2Next}
                className="w-full py-3.5 font-black rounded-xl text-sm transition-opacity hover:opacity-90"
                style={{ backgroundColor: "var(--accent-indigo)", color: "white" }}
              >
                Next: Add Questions →
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
                  <span className={`text-xs font-bold px-2 py-1 rounded-lg ${questions.length >= requiredCount ? "bg-[#4C6FFF]/20 text-[#4C6FFF]" : "bg-gray-700/20 text-gray-400"}`}>
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
                          className="flex-1 py-2 rounded-xl text-xs font-bold border transition-colors"
                          style={{
                            backgroundColor: qDraft.format === fmt ? "rgba(76,111,255,0.15)" : "#0A0A0A",
                            borderColor: qDraft.format === fmt ? "rgba(76,111,255,0.5)" : "#1E1E1E",
                            color: qDraft.format === fmt ? "var(--accent-indigo)" : "#9ca3af",
                          }}
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
                        <span className="font-black text-sm flex-shrink-0 mt-0.5" style={{ color: "var(--accent-indigo)" }}>Q{i + 1}</span>
                        <div className="min-w-0">
                          <p className="text-white text-sm font-semibold truncate">{q.question}</p>
                          <p className="text-gray-500 text-xs mt-0.5 truncate">
                            {q.format === "multiple_choice" ? `MC · ${q.options.filter((o) => o).join(", ")}` : "Type answer"}
                            {" · "}<span style={{ color: "var(--accent-indigo)" }}>✓ {q.correct_answer}</span>
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
                  className="w-full py-4 font-black text-base rounded-xl disabled:opacity-50 flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
                  style={{ backgroundColor: "var(--accent-indigo)", color: "white" }}
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
