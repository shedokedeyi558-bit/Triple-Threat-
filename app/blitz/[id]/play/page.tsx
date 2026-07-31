"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { blitzApi, type BlitzQuestion, type BlitzAttemptStart, ApiError } from "@/lib/api";
import { handleNumericInputChange } from "@/lib/inputUtils";
import { CheckCircle, Zap } from "lucide-react";

type Phase = "loading" | "preloading" | "countdown" | "quiz" | "submitting" | "done";

interface ScoreResult {
  score: number;
  total: number;
  rank_estimate: number;
  time_taken_ms: number;
}

// Preload all question images before the quiz starts so the timer doesn't tick
// while images are still loading over the network.
async function preloadImages(questions: BlitzQuestion[]) {
  const urls = questions.filter((q) => q.image_url).map((q) => q.image_url!);
  if (urls.length === 0) return;
  await Promise.all(
    urls.map(
      (url) =>
        new Promise<void>((resolve) => {
          const img = new window.Image();
          img.onload = () => resolve();
          img.onerror = () => resolve(); // never block the quiz on a failed image
          img.src = url;
        })
    )
  );
}

export default function BlitzPlayPage() {
  const { state } = useApp();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [phase, setPhase] = useState<Phase>("loading");
  const [attempt, setAttempt] = useState<BlitzAttemptStart | null>(null);
  const [countdown, setCountdown] = useState(3);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<{ question_id: string; answer: string; time_taken_ms?: number }[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [typeInput, setTypeInput] = useState("");

  // Global timer — full quiz duration
  const [timeLeft, setTimeLeft] = useState(0);

  // Per-question timer — resets on every question; null means disabled
  const [perQTimeLeft, setPerQTimeLeft] = useState<number | null>(null);
  const [perQTotal, setPerQTotal] = useState<number | null>(null);

  const [result, setResult] = useState<ScoreResult | null>(null);
  const [error, setError] = useState("");
  const [hiddenImages, setHiddenImages] = useState<Set<string>>(new Set());

  const globalTimerRef = useRef<NodeJS.Timeout | null>(null);
  const perQTimerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const questionStartTimeRef = useRef<number>(0);
  const submittedRef = useRef(false);
  const answersRef = useRef<{ question_id: string; answer: string; time_taken_ms?: number }[]>([]);
  const perQTimeLeftRef = useRef<number | null>(null);

  useEffect(() => {
    if (!state.isAuthenticated) {
      router.push("/auth");
      return;
    }
    initAttempt();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.isAuthenticated]);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  const clearPerQTimer = () => {
    if (perQTimerRef.current) {
      clearInterval(perQTimerRef.current);
      perQTimerRef.current = null;
    }
  };

  const submitAnswers = useCallback(
    async (finalAnswers: { question_id: string; answer: string; time_taken_ms?: number }[]) => {
      if (submittedRef.current) return;
      submittedRef.current = true;
      if (globalTimerRef.current) clearInterval(globalTimerRef.current);
      clearPerQTimer();
      setPhase("submitting");
      const timeTaken = Date.now() - startTimeRef.current;
      try {
        const res = await blitzApi.submitAttempt(id, finalAnswers);
        setResult({
          score: res.score,
          total: res.total_questions,
          rank_estimate: res.rank_estimate,
          time_taken_ms: res.total_time_ms ?? timeTaken,
        });
        setPhase("done");
      } catch (err) {
        if (err instanceof ApiError) setError(err.message);
        setPhase("done");
      }
    },
    [id]
  );

  const initAttempt = async () => {
    try {
      const res = await blitzApi.startAttempt(id);

      // Preload images before the countdown so the timer doesn't start while loading
      if (res.questions.some((q) => q.image_url)) {
        setPhase("preloading");
        await preloadImages(res.questions);
      }

      setAttempt(res);
      setTimeLeft(res.time_limit_seconds);

      if (res.per_question_time_seconds) {
        setPerQTotal(res.per_question_time_seconds);
        setPerQTimeLeft(res.per_question_time_seconds);
        perQTimeLeftRef.current = res.per_question_time_seconds;
      }

      setPhase("countdown");
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      setPhase("loading"); // stay on loading with error
    }
  };

  // 3-2-1-GO countdown
  useEffect(() => {
    if (phase !== "countdown") return;
    if (countdown <= 0) {
      setPhase("quiz");
      startTimeRef.current = Date.now();
      questionStartTimeRef.current = Date.now();
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, countdown]);

  // Global timer — ticks once per second, auto-submits at zero
  useEffect(() => {
    if (phase !== "quiz" || !attempt) return;

    globalTimerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(globalTimerRef.current!);
          submitAnswers(answersRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (globalTimerRef.current) clearInterval(globalTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Per-question timer — starts/resets when currentQ or phase changes
  const startPerQTimer = useCallback(
    (totalSecs: number) => {
      clearPerQTimer();
      setPerQTimeLeft(totalSecs);
      perQTimeLeftRef.current = totalSecs;

      perQTimerRef.current = setInterval(() => {
        perQTimeLeftRef.current = (perQTimeLeftRef.current ?? 1) - 1;
        setPerQTimeLeft(perQTimeLeftRef.current);

        if (perQTimeLeftRef.current <= 0) {
          clearPerQTimer();
          // Auto-skip: record blank answer and advance
          if (!submittedRef.current && attempt) {
            const q = attempt.questions[currentQ];
            const timeTakenMs = totalSecs * 1000;
            const newAnswers = [...answersRef.current, { question_id: q.id, answer: "", time_taken_ms: timeTakenMs }];
            setAnswers(newAnswers);
            answersRef.current = newAnswers;
            setSelectedOption(null);
            setTypeInput("");
            questionStartTimeRef.current = Date.now();

            if (currentQ + 1 >= attempt.questions.length) {
              submitAnswers(newAnswers);
            } else {
              setCurrentQ((c) => c + 1);
              // reset will happen via the currentQ useEffect below
            }
          }
        }
      }, 1000);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [attempt, currentQ, submitAnswers]
  );

  // Reset per-question timer whenever we advance to a new question
  useEffect(() => {
    if (phase !== "quiz" || perQTotal == null) return;
    startPerQTimer(perQTotal);
    return () => clearPerQTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, currentQ, perQTotal]);

  const advanceQuestion = useCallback(
    (answer: string) => {
      if (!attempt) return;
      const q = attempt.questions[currentQ];
      const timeTakenMs = Date.now() - questionStartTimeRef.current;
      const newAnswers = [...answersRef.current, { question_id: q.id, answer, time_taken_ms: timeTakenMs }];
      setAnswers(newAnswers);
      answersRef.current = newAnswers;
      setSelectedOption(null);
      setTypeInput("");
      clearPerQTimer();
      questionStartTimeRef.current = Date.now();

      if (currentQ + 1 >= attempt.questions.length) {
        submitAnswers(newAnswers);
      } else {
        setCurrentQ((c) => c + 1);
      }
    },
    [attempt, currentQ, submitAnswers]
  );

  const handleOptionSelect = (option: string) => {
    setSelectedOption(option);
    setTimeout(() => advanceQuestion(option), 600);
  };

  const handleTypeSubmit = () => {
    const trimmed = typeInput.trim();
    if (!trimmed) return;
    advanceQuestion(trimmed);
  };

  if (!state.isAuthenticated) return null;

  const totalSeconds = attempt?.time_limit_seconds ?? 1;
  const timerPercent = (timeLeft / totalSeconds) * 100;
  const timerColor = timeLeft < 30 ? "#FF4444" : timeLeft < 60 ? "#FFD700" : "var(--accent-indigo)";
  const isUrgent = timeLeft < 30;

  // Per-question bar values
  const perQPercent = perQTotal != null && perQTimeLeft != null ? (perQTimeLeft / perQTotal) * 100 : null;
  const perQUrgent = perQTimeLeft != null && perQTotal != null && perQTimeLeft <= Math.min(3, Math.ceil(perQTotal * 0.25));

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white flex flex-col overflow-hidden">
      <AnimatePresence mode="wait">

        {/* ── Loading / Preloading ── */}
        {(phase === "loading" || phase === "preloading") && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center gap-4"
          >
            <div className="w-10 h-10 border-2 rounded-full animate-spin" style={{ borderColor: "rgba(76,111,255,0.3)", borderTopColor: "var(--accent-indigo)" }} />
            {phase === "preloading" && (
              <p className="text-gray-500 text-xs">Loading images...</p>
            )}
            {error && <p className="text-red-400 text-sm px-4 text-center">{error}</p>}
          </motion.div>
        )}

        {/* ── 3-2-1-GO ── */}
        {phase === "countdown" && (
          <motion.div
            key="countdown"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center gap-6 bg-[#0A0A0A]"
          >
            <div className="flex items-center gap-3 mb-4">
              <Zap size={28} style={{ color: "var(--accent-amber)" }} />
              <span className="font-black text-2xl uppercase tracking-tight text-white">BLITZ</span>
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={countdown}
                initial={{ scale: 3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="font-black text-[140px] leading-none"
                style={{ color: "var(--accent-amber)", textShadow: "0 0 60px rgba(232,163,61,0.5)" }}
              >
                {countdown === 0 ? "GO" : countdown}
              </motion.div>
            </AnimatePresence>
            <p className="text-gray-500 text-sm uppercase tracking-widest">Get ready</p>
            {perQTotal != null && (
              <p className="text-gray-600 text-xs">{perQTotal}s per question</p>
            )}
          </motion.div>
        )}

        {/* ── Quiz ── */}
        {phase === "quiz" && attempt && (
          <motion.div
            key="quiz"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col"
          >
            {/* Global timer bar — top of screen */}
            <div className="relative h-1.5 bg-[#1E1E1E] flex-shrink-0">
              <motion.div
                className="absolute top-0 left-0 h-full rounded-full transition-colors"
                style={{ background: timerColor, width: `${timerPercent}%` }}
                animate={isUrgent ? { opacity: [1, 0.4, 1] } : { opacity: 1 }}
                transition={isUrgent ? { duration: 0.6, repeat: Infinity } : {}}
              />
            </div>

            {/* Header row — Q counter + global clock */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#1E1E1E]">
              <span className="text-gray-500 text-sm font-semibold">
                Q {currentQ + 1}/{attempt.questions.length}
              </span>
              <motion.span
                className="font-black text-lg tabular-nums"
                style={{ color: timerColor }}
                animate={isUrgent ? { scale: [1, 1.08, 1] } : { scale: 1 }}
                transition={isUrgent ? { duration: 0.5, repeat: Infinity } : {}}
              >
                {timeLeft}s
              </motion.span>
            </div>

            <div className="flex-1 flex flex-col px-4 py-5 max-w-lg mx-auto w-full">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentQ}
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ type: "spring", stiffness: 300, damping: 28 }}
                  className="flex-1 flex flex-col"
                >
                  {(() => {
                    const q: BlitzQuestion = attempt.questions[currentQ];
                    const imageHidden = hiddenImages.has(q.id);
                    return (
                      <>
                        {/* Per-question progress bar — amber, directly above question text */}
                        {perQPercent !== null && (
                          <div className="relative h-1 bg-[#1E1E1E] rounded-full mb-4 flex-shrink-0 overflow-hidden">
                            <motion.div
                              className="absolute top-0 left-0 h-full rounded-full"
                              style={{
                                width: `${perQPercent}%`,
                                background: perQUrgent ? "#FF4444" : "#E8A33D",
                                transition: "width 1s linear",
                              }}
                              animate={perQUrgent ? { opacity: [1, 0.4, 1] } : { opacity: 1 }}
                              transition={perQUrgent ? { duration: 0.5, repeat: Infinity } : {}}
                            />
                            {/* Per-question countdown number */}
                            {perQTimeLeft != null && (
                              <span
                                className="absolute right-0 -top-5 text-[10px] font-bold tabular-nums"
                                style={{ color: perQUrgent ? "#FF4444" : "#E8A33D" }}
                              >
                                {perQTimeLeft}s
                              </span>
                            )}
                          </div>
                        )}

                        {/* Question image (if present) — load eagerly, hide silently on error */}
                        {q.image_url && !imageHidden && (
                          <img
                            src={q.image_url}
                            alt="Question image"
                            loading="eager"
                            onError={() => setHiddenImages((s) => new Set(s).add(q.id))}
                            className="w-full max-h-48 object-contain rounded-lg mb-4 flex-shrink-0"
                          />
                        )}

                        {/* Question text */}
                        <h2 className="text-white font-black text-xl leading-snug mb-6 flex-shrink-0">
                          {q.question}
                        </h2>

                        {/* Multiple choice */}
                        {q.format === "multiple_choice" && q.options && (
                          <div className="space-y-3 flex-1">
                            {q.options.map((option) => (
                              <motion.button
                                key={option}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => !selectedOption && handleOptionSelect(option)}
                                disabled={!!selectedOption}
                                className={`w-full text-left p-4 rounded-xl border font-semibold text-sm transition-all ${
                                  selectedOption === option
                                    ? "bg-[#4C6FFF]/20 border-[#4C6FFF] text-[#4C6FFF]"
                                    : selectedOption
                                    ? "bg-[#141414] border-[#1E1E1E] text-gray-600"
                                    : "bg-[#141414] border-[#1E1E1E] text-white hover:border-[#4C6FFF]/40"
                                }`}
                              >
                                {option}
                              </motion.button>
                            ))}
                          </div>
                        )}

                        {/* Type answer */}
                        {q.format === "type_answer" && (
                          <div className="space-y-3 flex-1">
                            <input
                              type="text"
                              value={typeInput}
                              onChange={(e) => handleNumericInputChange(e, setTypeInput, q.answer_input_mode === "numeric")}
                              onKeyDown={(e) => e.key === "Enter" && handleTypeSubmit()}
                              inputMode={q.answer_input_mode === "numeric" ? "decimal" : "text"}
                              placeholder="Type your answer..."
                              className="w-full bg-[#141414] border border-[#1E1E1E] rounded-xl px-4 py-3 text-white placeholder-gray-600 text-base font-semibold focus:outline-none"
                              style={{ borderColor: "#1E1E1E" }}
                              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent-indigo)")}
                              onBlur={(e) => (e.currentTarget.style.borderColor = "#1E1E1E")}
                              autoFocus
                            />
                            <motion.button
                              whileTap={{ scale: 0.97 }}
                              onClick={handleTypeSubmit}
                              disabled={!typeInput.trim()}
                              className="w-full py-3.5 font-black text-base rounded-xl disabled:opacity-30"
                              style={{ backgroundColor: "var(--accent-indigo)", color: "#fff" }}
                            >
                              Submit Answer
                            </motion.button>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* ── Submitting ── */}
        {phase === "submitting" && (
          <motion.div
            key="submitting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center gap-4"
          >
            <div className="w-12 h-12 border-2 rounded-full animate-spin" style={{ borderColor: "rgba(76,111,255,0.3)", borderTopColor: "var(--accent-indigo)" }} />
            <p className="text-gray-400 text-sm">Submitting answers...</p>
          </motion.div>
        )}

        {/* ── Done ── */}
        {phase === "done" && (
          <motion.div
            key="done"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex flex-col px-4 py-10 max-w-lg mx-auto w-full"
          >
            <div className="flex-1 flex flex-col items-center justify-center space-y-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
              >
                <CheckCircle size={72} style={{ color: "var(--accent-amber)" }} />
              </motion.div>

              <div className="text-center space-y-1">
                <h1 className="text-white font-black text-4xl">
                  {result?.score ?? 0}
                  <span className="text-gray-500 text-2xl">/{result?.total ?? 0}</span>
                </h1>
                <p className="text-gray-400 text-sm">correct answers</p>
              </div>

              <div className="w-full bg-[#141414] border border-[#1E1E1E] rounded-2xl p-5 space-y-3">
                {result && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 text-sm">Time taken</span>
                      <span className="text-white font-bold text-sm">
                        {Math.floor(result.time_taken_ms / 60000)}m{" "}
                        {Math.floor((result.time_taken_ms % 60000) / 1000)}s
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 text-sm">Rank estimate</span>
                      <span className="font-black text-lg" style={{ color: "var(--accent-amber)" }}>
                        #{result.rank_estimate}
                      </span>
                    </div>
                  </>
                )}
                {error && <p className="text-red-400 text-sm">{error}</p>}
              </div>

              <p className="text-gray-600 text-xs text-center leading-relaxed">
                Results are announced when the tournament closes.
              </p>
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => router.push("/blitz")}
              className="w-full py-4 bg-[#141414] border border-[#1E1E1E] rounded-xl text-white font-bold text-base hover:border-[#4C6FFF]/30 transition-colors"
            >
              Back to Lobby
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
