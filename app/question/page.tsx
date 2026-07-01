"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { TimerBar } from "@/components/ui/TimerBar";

export default function QuestionPage() {
  const router = useRouter();
  const { state, dispatch } = useApp();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [typedAnswer, setTypedAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [timerRunning, setTimerRunning] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  const door = state.selectedDoor;
  const question = door?.question;
  const format = state.selectedFormat ?? question?.format ?? "multiple_choice";

  useEffect(() => {
    if (!door || !question) {
      router.replace("/doors");
    }
    if (format === "type_answer" && inputRef.current) {
      inputRef.current.focus();
    }
  }, [door, question, format, router]);

  const submitAnswer = useCallback(
    (answer: string) => {
      if (submitted || !question) return;
      setSubmitted(true);
      setTimerRunning(false);

      const correctAnswer = question.correctAnswer ?? question.options?.find((o) => o.isCorrect)?.text ?? "";
      const normalize = (s: string) =>
        question.caseSensitive ? s.trim() : s.trim().toLowerCase();

      const isCorrect = normalize(answer) === normalize(correctAnswer);

      setTimeout(() => {
        dispatch({
          type: "END_SESSION",
          won: isCorrect,
          prize: question.prize,
          entryFee: door!.entryFee,
          playerAnswer: answer,
        });
        router.push("/result");
      }, 600);
    },
    [submitted, question, door, dispatch, router]
  );

  const handleTimerExpire = useCallback(() => {
    if (!submitted) {
      submitAnswer("");
    }
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

  if (!door || !question) return null;

  return (
    <div className="min-h-dvh bg-bg flex flex-col">
      {/* Timer */}
      <div className="sticky top-0 z-20 bg-bg px-4 pt-4 pb-2">
        <TimerBar
          duration={question.timeLimit}
          onExpire={handleTimerExpire}
          running={timerRunning}
        />
      </div>

      <main className="flex-1 px-4 py-4 flex flex-col">
        {/* Door / Prize header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-[#2A2A2A] rounded-2xl px-4 py-3 mb-4 flex items-center justify-between"
        >
          <span className="text-gray-400 font-medium text-sm">🚪 Door {door.id}</span>
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
                if (submitted) {
                  if (opt.isCorrect) cls += " correct";
                  else if (selectedOption === opt.text && !opt.isCorrect) cls += " wrong";
                } else if (selectedOption === opt.text) {
                  cls += " selected";
                }

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
              {!question.caseSensitive && (
                <p className="text-center text-xs text-gray-500 mt-2">
                  Not case-sensitive · Spelling counts
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
