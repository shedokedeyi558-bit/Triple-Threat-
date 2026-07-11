"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { adminApi, ApiError } from "@/lib/api";
import { ArrowLeft, Clock, CheckCircle } from "lucide-react";
import {
  generateSamplePrediction,
  SAMPLE_CATEGORIES,
  type SampleCategory,
} from "@/lib/sampleQuestions";

const inputCls =
  "w-full border rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors placeholder-gray-600 focus:border-[#4C6FFF]/60"
  + " [background-color:var(--bg-base)] [border-color:var(--border-subtle)] [color:var(--text-primary)]";

const labelCls = "block text-[10px] font-bold uppercase tracking-widest mb-1.5";

const CATEGORIES = ["Sports", "Finance", "Politics", "Entertainment", "Tech", "Science", "General"];

// Minimum datetime-local value: now + 10 minutes
const minDeadline = () => {
  const d = new Date(Date.now() + 10 * 60 * 1000);
  return d.toISOString().slice(0, 16);
};

export default function CreatePredictionPage() {
  const router = useRouter();

  const [question, setQuestion] = useState("");
  const [category, setCategory] = useState("General");
  const [entryFee, setEntryFee] = useState("");
  const [prizePerWinner, setPrizePerWinner] = useState("");
  const [maxSlots, setMaxSlots] = useState("");
  const [countdownEnd, setCountdownEnd] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState<{ text: string; type: "info" | "success" } | null>(null);
  const [sampleCategory, setSampleCategory] = useState<SampleCategory>("Mixed");

  const validate = (): string | null => {
    if (!question.trim()) return "Question is required";
    if (!entryFee || isNaN(Number(entryFee)) || Number(entryFee) <= 0) return "Valid entry fee required";
    if (!prizePerWinner || isNaN(Number(prizePerWinner)) || Number(prizePerWinner) <= 0) return "Valid prize per winner required";
    if (!maxSlots || isNaN(Number(maxSlots)) || Number(maxSlots) < 1) return "Valid max slots required";
    if (!countdownEnd) return "Lock-in deadline is required";
    if (new Date(countdownEnd) <= new Date()) return "Deadline must be in the future";
    if (eventDate && new Date(eventDate) <= new Date(countdownEnd)) return "Event date must be after the deadline";
    return null;
  };

  const handleCreate = async () => {
    const err = validate();
    if (err) { setError(err); setNotice(null); return; }

    setError("");
    setNotice(null);
    setLoading(true);
    try {
      await adminApi.createPrediction({
        question: question.trim(),
        category,
        entry_fee: Number(entryFee),
        prize_per_winner: Number(prizePerWinner),
        max_slots: Number(maxSlots),
        countdown_end: new Date(countdownEnd).toISOString(),
        event_date: eventDate ? new Date(eventDate).toISOString() : undefined,
      });
      router.push("/admin/predictions");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create prediction");
    } finally {
      setLoading(false);
    }
  };

  const fillTestData = () => {
    const deadline = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const event = new Date(Date.now() + 26 * 60 * 60 * 1000);
    const sample = generateSamplePrediction(sampleCategory);
    setQuestion(sample.question);
    setCategory(sample.category);
    setEntryFee(String(sample.entry_fee));
    setPrizePerWinner(String(sample.prize_per_winner));
    setMaxSlots(String(sample.max_slots));
    setCountdownEnd(deadline.toISOString().slice(0, 16));
    setEventDate(event.toISOString().slice(0, 16));
    setError("");
    setNotice({ text: `Filled with a ${sample.category} prediction · ₦${sample.entry_fee} entry · ₦${sample.prize_per_winner} prize`, type: "success" });
  };

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/admin/predictions")}
          className="p-2 rounded-lg border transition-colors"
          style={{ borderColor: "var(--border-subtle)", color: "var(--text-secondary)" }}
          aria-label="Back"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <Clock size={18} style={{ color: "var(--accent-violet, #a78bfa)" }} />
            <h1 className="font-headline text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
              Create Prediction
            </h1>
          </div>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            Time Machine · New event
          </p>
        </div>
      </div>

      {/* Dev tools: category selector + fill button */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-bold uppercase tracking-widest flex-shrink-0" style={{ color: "var(--text-muted)" }}>
            Q category:
          </span>
          {SAMPLE_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSampleCategory(cat)}
              className="px-2 py-1 rounded-lg text-[10px] font-semibold border transition-all"
              style={{
                backgroundColor: sampleCategory === cat ? "rgba(76,111,255,0.15)" : "transparent",
                borderColor: sampleCategory === cat ? "rgba(76,111,255,0.5)" : "var(--border-hairline)",
                color: sampleCategory === cat ? "var(--accent-indigo)" : "var(--text-muted)",
              }}
            >
              {cat}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={fillTestData}
          className="w-full py-2 rounded-xl text-xs font-semibold border transition-colors hover:opacity-80"
          style={{ borderColor: "var(--border-hairline)", color: "var(--text-muted)", backgroundColor: "transparent" }}
        >
          Fill Test Data (dev only) · {sampleCategory}
        </button>
      </div>

      {/* Error / Notice */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="border rounded-xl p-3 text-sm"
          style={{ borderColor: "rgba(239,68,68,0.3)", backgroundColor: "rgba(239,68,68,0.05)", color: "#ef4444" }}
        >
          {error}
        </motion.div>
      )}
      {notice && (
        <motion.div
          key={notice.text}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="border rounded-xl p-3 text-sm"
          style={notice.type === "success"
            ? { color: "var(--accent-indigo)", backgroundColor: "rgba(76,111,255,0.08)", borderColor: "rgba(76,111,255,0.25)" }
            : { color: "var(--accent-amber)", backgroundColor: "rgba(249,193,7,0.08)", borderColor: "rgba(249,193,7,0.25)" }
          }
        >
          {notice.type === "success" ? "✓ " : "ℹ "}{notice.text}
        </motion.div>
      )}

      {/* Form card */}
      <div
        className="border rounded-2xl p-5 space-y-5"
        style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-card)" }}
      >
        {/* Question */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: "var(--text-muted)" }}>
            Prediction Details
          </p>
          <label className={labelCls} style={{ color: "var(--text-secondary)" }}>Question *</label>
          <textarea
            className={inputCls + " resize-none"}
            rows={3}
            placeholder="e.g. Will Chelsea win the FA Cup final?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
          <p className="text-[10px] mt-1.5" style={{ color: "var(--text-muted)" }}>
            Phrase as a question players can answer Yes/No, a name, a score, etc.
          </p>
        </div>

        {/* Category */}
        <div>
          <label className={labelCls} style={{ color: "var(--text-secondary)" }}>Category *</label>
          <select
            className={inputCls}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Fees & Prizes */}
        <div className="pt-4 border-t space-y-4" style={{ borderColor: "var(--border-hairline)" }}>
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
            Payout Configuration
          </p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelCls} style={{ color: "var(--text-secondary)" }}>Entry Fee (₦) *</label>
              <input
                className={inputCls}
                type="number"
                placeholder="e.g. 500"
                value={entryFee}
                onChange={(e) => setEntryFee(e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls} style={{ color: "var(--text-secondary)" }}>Prize / Winner (₦) *</label>
              <input
                className={inputCls}
                type="number"
                placeholder="e.g. 2000"
                value={prizePerWinner}
                onChange={(e) => setPrizePerWinner(e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls} style={{ color: "var(--text-secondary)" }}>Max Slots *</label>
              <input
                className={inputCls}
                type="number"
                placeholder="e.g. 100"
                value={maxSlots}
                onChange={(e) => setMaxSlots(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div className="pt-4 border-t space-y-4" style={{ borderColor: "var(--border-hairline)" }}>
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
            Schedule
          </p>
          <div>
            <label className={labelCls} style={{ color: "var(--text-secondary)" }}>Lock-in Deadline *</label>
            <input
              className={inputCls}
              type="datetime-local"
              min={minDeadline()}
              value={countdownEnd}
              onChange={(e) => setCountdownEnd(e.target.value)}
            />
            <p className="text-[10px] mt-1.5" style={{ color: "var(--text-muted)" }}>
              Players cannot submit predictions after this time.
            </p>
          </div>
          <div>
            <label className={labelCls} style={{ color: "var(--text-secondary)" }}>Event Date (optional)</label>
            <input
              className={inputCls}
              type="datetime-local"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
            />
            <p className="text-[10px] mt-1.5" style={{ color: "var(--text-muted)" }}>
              When the real-world event occurs — for display only.
            </p>
          </div>
        </div>
      </div>

      {/* Submit */}
      <button
        onClick={handleCreate}
        disabled={loading}
        className="w-full py-4 rounded-xl font-black text-base flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-50"
        style={{ backgroundColor: "var(--accent-indigo)", color: "white" }}
      >
        {loading ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <>
            <CheckCircle size={18} />
            Create Prediction
          </>
        )}
      </button>
    </div>
  );
}
