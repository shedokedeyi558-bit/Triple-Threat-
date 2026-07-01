"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { TimerBar } from "@/components/ui/TimerBar";
import { gameApi, ApiError } from "@/lib/api";

export default function QuestionPage() {
  const router = useRouter();
  const { state, dispatch } = useApp();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [typedAnswer, setTypedAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [timerRunning, setTimerRunning] = useState(true);
  const [submitError, setSubmitError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const session = state.activeSession;
  const question = session?.question;
  // Use the player-selected format; fall back to the question's own format
  const format = state.selectedFormat ?? question?.format ?? "multiple_choice";

  useEffect(() => {
    if (!session || !question) {
      router.replace("/doors");
      return;
    }
    if (format === "type_answer" && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [session, question, format, router]);

  const submitAnswer = useCallback(
    async (answer: string) => {
      if (submitted || !session) return;
      setSubmitted(true);
      setTimerRunning(false);

      try {
        const result = await gameApi.submit(session.sessionId, answer);
        dispatch({
          type: "END_SESSION",
          result: {
            correct: result.correct,
            prize: result.prize,
            correctAnswer: result.correctAnswer,
            playerAnswer: answer,
          },
        });
        // Small delay so user can see selection highlight before navigating
        setTimeout(() => router.push("/result"), 500);
      } catch (err) {
        setSubmitError(
          err instanceof ApiError ? err.message : "Failed to submit. Please try again."
        );
        // Allow resubmit on error
        setSubmitted(false);
        setTimerRunning(true);
      }
    },
    [submitted, session, dispatch, router]
  );

  const handleTimerExpire = useCallback(() => {
    if (!submitted) submitAnswer("");
  }, [submitted, submitAnswer]);

  const handleOptionClick = (optionText: string) => {
    if (submitted) return;
    setSelectedOption(optionText);
    submitAnswer(optionText);
  };

  const handleTypeSubmit = () => {
    if (submitted || !typedAnswer.trim()) return;
    submitAnswer(typedAnswer.trim());
  };

  if (!session || !question) return null;

  return (
    <div className="min-h-dvh bg-bg flex flex-col">
      {/* Timer */}
      <div className="sticky top-0 z-20 bg-bg px-4 pt-4 pb-2">
        <TimerBar
          duration={question.time_limit}
          onExpire={handleTimerExpire}
          running={timerRunning && !submitError}
        />
      </div>

      <main className="flex-1 px-4 py-4 flex flex-col">
        {/* Door / Prize header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-[#2A2A2A] rounded-2xl px-4 py-3 mb-4 flex items-center justify-between"
        >
          <span className="text-gray-400 font-medium text-sm">🚪 Door {session.doorId}</span>
          <span className="text-neon font-black text-xl">₦{question.prize.toLocaleString()}</span>
        </motion.div>

        {/* Question */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-[#2A2A2A] rounded-2xl p-5 mb-5"
        >
          <p className="text-white font-semibold text-lg leading-snug">{question.text}</p>
        </motion.div>

        {/* Submit error */}
        {submitError && (
          <div className="mb-4 bg-red-900/20 border border-red-800/40 rounded-xl p-3 text-red-400 text-sm">
            {submitError}
          </div>
        )}

        {/* Answer area */}
        <AnimatePresence mode="wait">
          {format === "multiple_choice" && question.options ? (
            <motion.div
              key="mc"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col gap-3"
            >
              {question.options.map((opt, i) => {
                let cls = "option-btn";
                if (selectedOption === opt.text) cls += " selected";
                return (
                  <motion.button
                    key={opt.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className={cls}
                    onClick={() => handleOptionClick(opt.text)}
                    disabled={submitted}
                  >
                    <span className="text-gray-500 mr-2 text-sm">
                      {String.fromCharCode(65 + i)})
                    </span>
                    {opt.text}
                  </motion.button>
                );
              })}
            </motion.div>
          ) : (
            <motion.div key="type" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <input
                ref={inputRef}
                type="text"
                placeholder="Type your answer here..."
                value={typedAnswer}
                onChange={(e) => setTypedAnswer(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleTypeSubmit()}
                disabled={submitted}
                className="w-full bg-card border-2 border-[#2A2A2A] focus:border-neon rounded-xl px-4 py-4 text-white placeholder-gray-500 text-base font-medium outline-none transition-colors mb-4"
              />
              <button
                onClick={handleTypeSubmit}
                disabled={submitted || !typedAnswer.trim()}
                className="btn-primary disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitted ? "Submitted ✓" : "Submit →"}
              </button>
              <p className="text-center text-xs text-gray-500 mt-2">
                Spelling counts · Press Enter or tap Submit
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
