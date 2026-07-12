"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2 } from "lucide-react";
import { adminApi, type AdminQuestion, ApiError } from "@/lib/api";

interface Props {
  open: boolean;
  onClose: () => void;
  question: AdminQuestion | null;
  onSaved: (q: AdminQuestion) => void;
}

const empty = (): Partial<AdminQuestion> => ({
  door_id: 1,
  text: "",
  format: "multiple_choice",
  difficulty: "Easy",
  prize: 500,
  time_limit: 15,
  options: [
    { id: "a", text: "" },
    { id: "b", text: "" },
    { id: "c", text: "" },
    { id: "d", text: "" },
  ],
  correct_answer: "",
  case_sensitive: false,
  spelling_tolerance: "strict",
  status: "active",
});

export function QuestionModal({ open, onClose, question, onSaved }: Props) {
  const [form, setForm] = useState<Partial<AdminQuestion>>(empty());
  const [correctOptionIdx, setCorrectOptionIdx] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (question) {
      setForm({ ...question });
      // Determine correct option index from correct_answer matching an option
      const idx = (question.options ?? []).findIndex(
        (o) => o.text.toLowerCase() === (question.correct_answer ?? "").toLowerCase()
      );
      setCorrectOptionIdx(idx >= 0 ? idx : 0);
    } else {
      setForm(empty());
      setCorrectOptionIdx(0);
    }
    setError("");
  }, [question, open]);

  const set = <K extends keyof AdminQuestion>(key: K, val: AdminQuestion[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  const handleOptionChange = (idx: number, text: string) => {
    const opts = [...(form.options ?? [])];
    opts[idx] = { ...opts[idx], text };
    set("options", opts);
    // Keep correct_answer in sync for MC
    if (idx === correctOptionIdx && form.format === "multiple_choice") {
      set("correct_answer", text);
    }
  };

  const handleSetCorrect = (idx: number) => {
    setCorrectOptionIdx(idx);
    set("correct_answer", form.options?.[idx]?.text ?? "");
  };

  const handleSave = async () => {
    if (!form.text?.trim()) { setError("Question text is required"); return; }
    if (!form.correct_answer?.trim()) { setError("Correct answer is required"); return; }
    if (!form.prize || form.prize <= 0) { setError("Prize must be greater than 0"); return; }

    setSaving(true);
    setError("");

    const payload: Partial<AdminQuestion> = {
      door_id: form.door_id,
      text: form.text,
      format: form.format,
      difficulty: form.difficulty,
      prize: form.prize,
      time_limit: form.time_limit,
      correct_answer: form.correct_answer,
      case_sensitive: form.case_sensitive,
      spelling_tolerance: form.spelling_tolerance,
      status: form.status,
      options: form.format === "multiple_choice" ? form.options : null,
    };

    try {
      let saved: AdminQuestion;
      if (question) {
        const res = await adminApi.updateQuestion(question.id, payload);
        saved = res.question;
      } else {
        const res = await adminApi.createQuestion(payload);
        saved = res.question;
      }
      onSaved(saved);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Save failed. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-4 top-4 bottom-4 z-50 bg-[#141414] border border-[#2A2A2A] rounded-2xl overflow-y-auto md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-lg"
          >
            {/* Header */}
            <div className="sticky top-0 bg-[#141414] border-b border-[#2A2A2A] px-5 py-4 flex items-center justify-between z-10">
              <h2 className="text-white font-bold text-lg">
                {question ? "Edit Question" : "Add New Question"}
                {form.door_id ? ` — Door ${form.door_id}` : ""}
              </h2>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-gray-400">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Question text */}
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Question *</label>
                <textarea
                  rows={3}
                  value={form.text}
                  onChange={(e) => set("text", e.target.value)}
                  placeholder="Enter your question..."
                  className="w-full bg-[#1A1A1A] border border-[#2A2A2A] focus:border-[#4C6FFF] rounded-xl px-4 py-3 text-white text-sm resize-none outline-none transition-colors"
                />
              </div>

              {/* Row: Door, Prize, Difficulty */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">Door</label>
                  <select
                    value={form.door_id ?? ""}
                    onChange={(e) => set("door_id", e.target.value ? Number(e.target.value) : null as unknown as number)}
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3 py-2.5 text-white text-sm outline-none"
                  >
                    <option value="">None</option>
                    {[1, 2, 3].map((d) => <option key={d} value={d}>Door {d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">Prize (₦) *</label>
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
                    value={form.difficulty ?? ""}
                    onChange={(e) => set("difficulty", e.target.value as AdminQuestion["difficulty"])}
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
                    onChange={(e) => set("format", e.target.value as AdminQuestion["format"])}
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
                    value={form.time_limit}
                    onChange={(e) => set("time_limit", Number(e.target.value))}
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3 py-2.5 text-white text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => set("status", e.target.value as AdminQuestion["status"])}
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
                  <label className="text-xs text-gray-400 mb-2 block">
                    Options — tap ✓ to mark correct answer
                  </label>
                  <div className="space-y-2">
                    {(form.options ?? []).map((opt, i) => (
                      <div key={opt.id} className="flex items-center gap-2">
                        <span className="text-gray-500 text-sm w-5 flex-shrink-0">
                          {String.fromCharCode(65 + i)})
                        </span>
                        <input
                          type="text"
                          placeholder={`Option ${String.fromCharCode(65 + i)}`}
                          value={opt.text}
                          onChange={(e) => handleOptionChange(i, e.target.value)}
                          className="flex-1 bg-[#1A1A1A] border border-[#2A2A2A] focus:border-[#4C6FFF] rounded-xl px-3 py-2.5 text-white text-sm outline-none transition-colors"
                        />
                        <button
                          onClick={() => handleSetCorrect(i)}
                          className={`w-8 h-8 flex-shrink-0 rounded-full border-2 text-xs font-bold transition-colors ${
                            correctOptionIdx === i
                              ? "border-[#4C6FFF] bg-[#4C6FFF]/20 text-[#4C6FFF]"
                              : "border-[#2A2A2A] text-gray-600 hover:border-gray-400"
                          }`}
                          aria-label="Mark as correct"
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
                    <label className="text-xs text-gray-400 mb-1.5 block">Correct answer *</label>
                    <input
                      type="text"
                      value={form.correct_answer}
                      onChange={(e) => set("correct_answer", e.target.value)}
                      placeholder="e.g. Au"
                      className="w-full bg-[#1A1A1A] border border-[#2A2A2A] focus:border-[#4C6FFF] rounded-xl px-4 py-3 text-white text-sm outline-none transition-colors"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-400 mb-1.5 block">Case sensitive</label>
                      <select
                        value={form.case_sensitive ? "yes" : "no"}
                        onChange={(e) => set("case_sensitive", e.target.value === "yes")}
                        className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3 py-2.5 text-white text-sm outline-none"
                      >
                        <option value="no">No</option>
                        <option value="yes">Yes</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1.5 block">Spelling</label>
                      <select
                        value={form.spelling_tolerance}
                        onChange={(e) => set("spelling_tolerance", e.target.value as "strict" | "lenient")}
                        className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3 py-2.5 text-white text-sm outline-none"
                      >
                        <option value="strict">Strict</option>
                        <option value="lenient">Lenient (±1 char)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-900/20 border border-red-800/40 rounded-xl p-3 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl border border-[#2A2A2A] text-gray-400 font-semibold text-sm hover:text-white hover:border-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-3 rounded-xl text-sm font-bold active:scale-95 transition-transform disabled:opacity-60 flex items-center justify-center gap-2"
                  style={{ backgroundColor: "var(--accent-indigo)", color: "#fff" }}
                >
                  {saving ? <Loader2 size={15} className="animate-spin" /> : null}
                  {saving ? "Saving…" : "Save Question"}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
