"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAdmin } from "@/context/AdminContext";
import { X } from "lucide-react";
import type { Question, QuestionFormat, Difficulty } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  question: Question | null;
}

const emptyQuestion = (): Partial<Question> => ({
  doorId: 1,
  text: "",
  format: "multiple_choice",
  difficulty: "Easy",
  prize: 500,
  timeLimit: 15,
  options: [
    { id: "a", text: "", isCorrect: true },
    { id: "b", text: "", isCorrect: false },
    { id: "c", text: "", isCorrect: false },
    { id: "d", text: "", isCorrect: false },
  ],
  correctAnswer: "",
  caseSensitive: false,
  spellingTolerance: "strict",
  status: "active",
});

export function QuestionModal({ open, onClose, question }: Props) {
  const { dispatch } = useAdmin();
  const [form, setForm] = useState<Partial<Question>>(emptyQuestion());

  useEffect(() => {
    if (question) setForm({ ...question });
    else setForm(emptyQuestion());
  }, [question, open]);

  const set = (key: keyof Question, val: unknown) => setForm((f) => ({ ...f, [key]: val }));

  const handleOptionChange = (idx: number, text: string) => {
    const opts = [...(form.options ?? [])];
    opts[idx] = { ...opts[idx], text };
    set("options", opts);
  };

  const handleSetCorrect = (idx: number) => {
    const opts = (form.options ?? []).map((o, i) => ({ ...o, isCorrect: i === idx }));
    set("options", opts);
  };

  const handleSave = () => {
    if (!form.text?.trim()) return;
    if (question) {
      dispatch({ type: "UPDATE_QUESTION", question: form as Question });
    } else {
      dispatch({
        type: "ADD_QUESTION",
        question: {
          ...form,
          id: `q${Date.now()}`,
          createdAt: new Date().toISOString().split("T")[0],
        } as Question,
      });
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-4 top-4 bottom-4 z-50 bg-[#141414] border border-[#2A2A2A] rounded-2xl overflow-y-auto md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-lg"
          >
            <div className="sticky top-0 bg-[#141414] border-b border-[#2A2A2A] px-5 py-4 flex items-center justify-between z-10">
              <h2 className="text-white font-bold text-lg">
                {question ? "Edit Question" : "Add New Question"} — Door {form.doorId}
              </h2>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-gray-400">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Question text */}
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Question</label>
                <textarea
                  rows={3}
                  value={form.text}
                  onChange={(e) => set("text", e.target.value)}
                  placeholder="Enter your question..."
                  className="w-full bg-[#1A1A1A] border border-[#2A2A2A] focus:border-neon rounded-xl px-4 py-3 text-white text-sm resize-none outline-none transition-colors"
                />
              </div>

              {/* Row: Door, Prize, Difficulty */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">Door</label>
                  <select
                    value={form.doorId}
                    onChange={(e) => set("doorId", Number(e.target.value))}
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3 py-2.5 text-white text-sm outline-none"
                  >
                    {[1, 2, 3].map((d) => <option key={d} value={d}>Door {d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">Prize (₦)</label>
                  <input
                    type="number"
                    value={form.prize}
                    onChange={(e) => set("prize", Number(e.target.value))}
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3 py-2.5 text-white text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">Difficulty</label>
                  <select
                    value={form.difficulty}
                    onChange={(e) => set("difficulty", e.target.value as Difficulty)}
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3 py-2.5 text-white text-sm outline-none"
                  >
                    {["Easy", "Medium", "Hard"].map((d) => <option key={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              {/* Row: Format, Time, Status */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">Format</label>
                  <select
                    value={form.format}
                    onChange={(e) => set("format", e.target.value as QuestionFormat)}
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3 py-2.5 text-white text-sm outline-none"
                  >
                    <option value="multiple_choice">MC</option>
                    <option value="type_answer">Type</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">Time (s)</label>
                  <input
                    type="number"
                    value={form.timeLimit}
                    onChange={(e) => set("timeLimit", Number(e.target.value))}
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3 py-2.5 text-white text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => set("status", e.target.value as "active" | "inactive")}
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3 py-2.5 text-white text-sm outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* MC options */}
              {form.format === "multiple_choice" && (
                <div>
                  <label className="text-xs text-gray-400 mb-2 block">Options (select correct answer)</label>
                  <div className="space-y-2">
                    {(form.options ?? []).map((opt, i) => (
                      <div key={opt.id} className="flex items-center gap-2">
                        <span className="text-gray-500 text-sm w-5 flex-shrink-0">{String.fromCharCode(65 + i)})</span>
                        <input
                          type="text"
                          placeholder={`Option ${String.fromCharCode(65 + i)}`}
                          value={opt.text}
                          onChange={(e) => handleOptionChange(i, e.target.value)}
                          className="flex-1 bg-[#1A1A1A] border border-[#2A2A2A] focus:border-neon rounded-xl px-3 py-2.5 text-white text-sm outline-none transition-colors"
                        />
                        <button
                          onClick={() => handleSetCorrect(i)}
                          className={`w-8 h-8 flex-shrink-0 rounded-full border-2 transition-colors ${
                            opt.isCorrect
                              ? "border-neon bg-neon/20 text-neon"
                              : "border-[#2A2A2A] text-gray-600 hover:border-gray-400"
                          }`}
                          aria-label={`Set option ${String.fromCharCode(65 + i)} as correct`}
                        >
                          ✓
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Type answer options */}
              {form.format === "type_answer" && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-400 mb-1.5 block">Correct answer</label>
                    <input
                      type="text"
                      value={form.correctAnswer}
                      onChange={(e) => set("correctAnswer", e.target.value)}
                      placeholder="e.g. Au"
                      className="w-full bg-[#1A1A1A] border border-[#2A2A2A] focus:border-neon rounded-xl px-4 py-3 text-white text-sm outline-none transition-colors"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-400 mb-1.5 block">Case sensitive</label>
                      <select
                        value={form.caseSensitive ? "yes" : "no"}
                        onChange={(e) => set("caseSensitive", e.target.value === "yes")}
                        className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3 py-2.5 text-white text-sm outline-none"
                      >
                        <option value="no">No</option>
                        <option value="yes">Yes</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1.5 block">Spelling</label>
                      <select
                        value={form.spellingTolerance}
                        onChange={(e) => set("spellingTolerance", e.target.value as "strict" | "lenient")}
                        className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3 py-2.5 text-white text-sm outline-none"
                      >
                        <option value="strict">Strict</option>
                        <option value="lenient">Lenient</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-[#2A2A2A] text-gray-400 font-semibold text-sm hover:text-white hover:border-gray-400 transition-colors">
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 py-3 rounded-xl bg-neon text-black font-bold text-sm active:scale-95 transition-transform"
                >
                  Save Question
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
