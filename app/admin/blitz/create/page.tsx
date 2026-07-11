"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAdmin } from "@/context/AdminContext";
import { adminApi, ApiError } from "@/lib/api";
import { ArrowLeft, Plus, Trash2, CheckCircle, Zap } from "lucide-react";
import { generateSampleQuestions, SAMPLE_CATEGORIES, type SampleCategory } from "@/lib/sampleQuestions";

// ─── Types ─────────────────────────────────────────────────────────────────
interface QuestionDraft {
  question: string;
  format: "multiple_choice" | "type_answer";
  options: string[];
  correct_answer: string;
}
interface TournamentDetails {
  title: string; description: string; entry_fee: string;
  question_count: string; time_limit_seconds: string; max_participants: string;
  cash_winner_count: string; payout_distribution: string[];
  total_payout_percent: string; ticket_tier_percent: string; guaranteed_minimum: string;
}
interface TournamentSchedule {
  registration_start: string; tournament_start: string; tournament_end: string;
}

// ─── Shared layout primitives ───────────────────────────────────────────────
// Same HorizontalScrollRow used on Play page — ONE definition, referenced everywhere.
// min-width:0 on both the outer div (flex child) and inner track ensures
// the row can never force its parent wider than 100%.
function HorizontalScrollRow({ children, gap = 8 }: { children: React.ReactNode; gap?: number }) {
  return (
    <div style={{ width: "100%", minWidth: 0, overflowX: "auto", overflowY: "hidden", WebkitOverflowScrolling: "touch" }}>
      <div style={{ display: "flex", alignItems: "center", gap, minWidth: "min-content", paddingBottom: 2 }}>
        {children}
      </div>
    </div>
  );
}

// Full-width input — 100% width, box-sizing border-box, never a fixed pixel width.
const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", border: "1px solid var(--border-subtle)",
  borderRadius: 10, padding: "10px 14px", fontSize: 13, outline: "none",
  backgroundColor: "var(--bg-base)", color: "var(--text-primary)", transition: "border-color .15s",
};
const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 10, fontWeight: 700,
  textTransform: "uppercase", letterSpacing: "0.08em",
  color: "var(--text-secondary)", marginBottom: 6,
};
const sectionHeadStyle: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, textTransform: "uppercase",
  letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 14,
};
// Two-column grid — uses percentage widths, never fixed px, min-width:0 on children.
function FieldGrid({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, width: "100%", minWidth: 0 }}>
      {children}
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ minWidth: 0, width: "100%" }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

// ─── Category chip selector ─────────────────────────────────────────────────
// ONE component, used in all 3 steps via HorizontalScrollRow — not reimplemented per step.
function CategoryChips({ active, onChange }: { active: SampleCategory; onChange: (c: SampleCategory) => void }) {
  return (
    <HorizontalScrollRow gap={6}>
      <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", flexShrink: 0, whiteSpace: "nowrap" }}>
        Category:
      </span>
      {SAMPLE_CATEGORIES.map((cat) => (
        <button
          key={cat}
          type="button"
          onClick={() => onChange(cat)}
          style={{
            flexShrink: 0, whiteSpace: "nowrap",
            padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600,
            border: `1px solid ${active === cat ? "rgba(76,111,255,0.5)" : "var(--border-hairline)"}`,
            backgroundColor: active === cat ? "rgba(76,111,255,0.15)" : "transparent",
            color: active === cat ? "var(--accent-indigo)" : "var(--text-muted)",
            cursor: "pointer",
          }}
        >
          {cat}
        </button>
      ))}
    </HorizontalScrollRow>
  );
}

// ─── Dev-tools toolbar (visible on all steps) ───────────────────────────────
function DevTools({
  sampleCategory, setSampleCategory, step, details, setDetails,
  setSchedule, setQuestions, setStep, requiredCount, questions, setNotice, setError,
}: {
  sampleCategory: SampleCategory;
  setSampleCategory: (c: SampleCategory) => void;
  step: number;
  details: TournamentDetails;
  setDetails: (d: TournamentDetails) => void;
  setSchedule: (s: TournamentSchedule) => void;
  setQuestions: React.Dispatch<React.SetStateAction<QuestionDraft[]>>;
  setStep: (s: number) => void;
  requiredCount: number;
  questions: QuestionDraft[];
  setNotice: (n: { text: string; type: "info" | "success" } | null) => void;
  setError: (e: string) => void;
}) {
  const fillAll = () => {
    const existingCount = parseInt(details.question_count);
    const count = existingCount > 0 ? existingCount : 10;
    const usedDefault = !(existingCount > 0);
    const regStart = new Date(Date.now() + 30 * 60 * 1000);
    const tourStart = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const tourEnd = new Date(Date.now() + 3 * 60 * 60 * 1000);
    setDetails({
      title: "Test Blitz #1", description: "Dev test tournament",
      entry_fee: "500", question_count: String(count),
      time_limit_seconds: "300", max_participants: "100",
      cash_winner_count: "3", payout_distribution: ["50", "30", "20"],
      total_payout_percent: "70", ticket_tier_percent: "30", guaranteed_minimum: "",
    });
    setSchedule({
      registration_start: regStart.toISOString().slice(0, 16),
      tournament_start: tourStart.toISOString().slice(0, 16),
      tournament_end: tourEnd.toISOString().slice(0, 16),
    });
    setQuestions(generateSampleQuestions(count, sampleCategory));
    setStep(1);
    setError("");
    setNotice(usedDefault
      ? { text: `No question count set — used default of ${count}`, type: "info" }
      : { text: `Filled with ${count} ${sampleCategory} questions`, type: "success" }
    );
  };

  const generate = () => {
    const needed = requiredCount - questions.length;
    const toAdd = generateSampleQuestions(needed, sampleCategory);
    setQuestions((prev) => [...prev, ...toAdd]);
    setError("");
    setNotice({ text: `Generated ${toAdd.length} ${sampleCategory} question${toAdd.length !== 1 ? "s" : ""}`, type: "success" });
  };

  return (
    <div style={{ width: "100%", minWidth: 0, display: "flex", flexDirection: "column", gap: 8 }}>
      <CategoryChips active={sampleCategory} onChange={setSampleCategory} />
      <button
        type="button"
        onClick={fillAll}
        style={{ width: "100%", boxSizing: "border-box", padding: "8px 0", borderRadius: 10, fontSize: 12, fontWeight: 600, border: "1px solid var(--border-hairline)", color: "var(--text-muted)", backgroundColor: "transparent", cursor: "pointer" }}
      >
        Fill test data · {sampleCategory}
      </button>
      {step === 3 && (
        <button
          type="button"
          onClick={generate}
          disabled={questions.length >= requiredCount}
          style={{ width: "100%", boxSizing: "border-box", padding: "8px 0", borderRadius: 10, fontSize: 12, fontWeight: 600, border: "1px solid var(--border-hairline)", color: "var(--text-muted)", backgroundColor: "transparent", cursor: questions.length >= requiredCount ? "not-allowed" : "pointer", opacity: questions.length >= requiredCount ? 0.4 : 1 }}
        >
          Generate {Math.max(0, requiredCount - questions.length)} · {sampleCategory}
        </button>
      )}
    </div>
  );
}

// ─── Main page ──────────────────────────────────────────────────────────────
export default function AdminBlitzCreatePage() {
  const { state } = useAdmin();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState<{ text: string; type: "info" | "success" } | null>(null);
  const [loading, setLoading] = useState(false);
  const [sampleCategory, setSampleCategory] = useState<SampleCategory>("Mixed");

  const [details, setDetails] = useState<TournamentDetails>({
    title: "", description: "", entry_fee: "", question_count: "",
    time_limit_seconds: "", max_participants: "", cash_winner_count: "",
    payout_distribution: [], total_payout_percent: "", ticket_tier_percent: "", guaranteed_minimum: "",
  });
  const [schedule, setSchedule] = useState<TournamentSchedule>({
    registration_start: "", tournament_start: "", tournament_end: "",
  });
  const [questions, setQuestions] = useState<QuestionDraft[]>([]);
  const [qDraft, setQDraft] = useState<QuestionDraft>({
    question: "", format: "multiple_choice", options: ["", "", "", ""], correct_answer: "",
  });

  if (!state.isAuthenticated) { router.push("/admin/login"); return null; }

  const requiredCount = parseInt(details.question_count) || 0;

  // ── Validation ──────────────────────────────────────────────────────────
  const validateStep1 = (): string | null => {
    if (!details.title.trim()) return "Title is required";
    if (!details.entry_fee || isNaN(Number(details.entry_fee)) || Number(details.entry_fee) <= 0) return "Valid entry fee required";
    if (!details.question_count || Number(details.question_count) < 1) return "Valid question count required";
    if (!details.time_limit_seconds || Number(details.time_limit_seconds) < 10) return "Time limit must be at least 10 seconds";
    if (!details.max_participants || Number(details.max_participants) < 1) return "Valid max participants required";
    if (!details.cash_winner_count || Number(details.cash_winner_count) < 1) return "Valid cash winner count required";
    const cashWinners = Number(details.cash_winner_count);
    if (details.payout_distribution.length !== cashWinners) return `Payout distribution must have exactly ${cashWinners} entries`;
    const total = details.payout_distribution.reduce((s, p) => s + (isNaN(Number(p)) ? 0 : Number(p)), 0);
    if (Math.abs(total - 100) > 0.01) return `Payout percentages must sum to 100 (currently ${total.toFixed(1)}%)`;
    const tp = Number(details.total_payout_percent);
    if (isNaN(tp) || tp < 1 || tp > 100) return "Total payout percent must be 1–100";
    const tt = Number(details.ticket_tier_percent);
    if (isNaN(tt) || tt < 0 || tt > 100) return "Ticket tier percent must be 0–100";
    return null;
  };
  const validateStep2 = (): string | null => {
    if (!schedule.registration_start) return "Registration start required";
    if (!schedule.tournament_start) return "Tournament start required";
    if (!schedule.tournament_end) return "Tournament end required";
    if (new Date(schedule.tournament_start) <= new Date(schedule.registration_start)) return "Tournament must start after registration";
    if (new Date(schedule.tournament_end) <= new Date(schedule.tournament_start)) return "Tournament end must be after start";
    return null;
  };

  // ── Submit ──────────────────────────────────────────────────────────────
  const handlePublish = async () => {
    if (questions.length < requiredCount) { setError(`Need ${requiredCount} questions, have ${questions.length}`); return; }
    setLoading(true); setError("");
    try {
      const res = await adminApi.createBlitz({
        title: details.title, description: details.description || undefined,
        entry_fee: Number(details.entry_fee), question_count: Number(details.question_count),
        time_limit_seconds: Number(details.time_limit_seconds),
        registration_start: new Date(schedule.registration_start).toISOString(),
        tournament_start: new Date(schedule.tournament_start).toISOString(),
        tournament_end: new Date(schedule.tournament_end).toISOString(),
      });
      const id = res.tournament.id;
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        await adminApi.addBlitzQuestion(id, {
          question: q.question, format: q.format,
          options: q.format === "multiple_choice" ? q.options.filter((o) => o.trim()) : undefined,
          correct_answer: q.correct_answer, order_index: i + 1,
        });
      }
      await adminApi.publishBlitz(id);
      router.push("/admin/blitz");
    } catch (e) {
      if (e instanceof ApiError) setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Shared dev tools props ──────────────────────────────────────────────
  const devToolsProps = {
    sampleCategory, setSampleCategory, step, details, setDetails,
    setSchedule, setQuestions, setStep, requiredCount, questions, setNotice, setError,
  };

  return (
    // ONE page wrapper — width:100%, max-width:100vw, overflow-x:hidden, box-sizing:border-box.
    // Applied once, wrapping ALL 3 steps. Never repeated per-step.
    <div style={{ width: "100%", maxWidth: "100vw", overflowX: "hidden", boxSizing: "border-box", padding: "20px 16px 80px", minHeight: "100vh", backgroundColor: "var(--bg-base)" }}>
      <div style={{ width: "100%", maxWidth: 640, margin: "0 auto", minWidth: 0 }}>

        {/* ── Page header ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, minWidth: 0 }}>
          <button
            onClick={() => step > 1 ? setStep(step - 1) : router.push("/admin/blitz")}
            style={{ padding: 8, borderRadius: 8, border: "1px solid #1E1E1E", backgroundColor: "#141414", cursor: "pointer", flexShrink: 0 }}
          >
            <ArrowLeft size={16} color="#9ca3af" />
          </button>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Zap size={16} color="var(--accent-indigo)" />
              <h1 style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)", margin: 0, whiteSpace: "nowrap" }}>Create Blitz</h1>
            </div>
            {/* Step progress — flex children each have min-width:0 */}
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 6 }}>
              {[1, 2, 3].map((s) => (
                <div key={s} style={{ height: 4, borderRadius: 2, transition: "all .2s", flexShrink: 0, backgroundColor: s <= step ? "var(--accent-indigo)" : "var(--border-subtle)", width: s <= step ? 24 : 10 }} />
              ))}
              <span style={{ fontSize: 11, marginLeft: 4, color: "var(--text-muted)", flexShrink: 0 }}>Step {step}/3</span>
            </div>
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ width: "100%", boxSizing: "border-box", padding: "10px 14px", borderRadius: 10, marginBottom: 16, border: "1px solid rgba(239,68,68,0.3)", backgroundColor: "rgba(239,68,68,0.06)", color: "#f87171", fontSize: 13 }}
          >
            {error}
          </motion.div>
        )}

        {/* ── Notice ── */}
        {notice && (
          <motion.div key={notice.text} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{
              width: "100%", boxSizing: "border-box", padding: "10px 14px", borderRadius: 10, marginBottom: 16, fontSize: 13,
              ...(notice.type === "success"
                ? { border: "1px solid rgba(76,111,255,0.25)", backgroundColor: "rgba(76,111,255,0.08)", color: "var(--accent-indigo)" }
                : { border: "1px solid rgba(249,193,7,0.25)", backgroundColor: "rgba(249,193,7,0.08)", color: "var(--accent-amber)" }),
            }}
          >
            {notice.type === "success" ? "✓ " : "ℹ "}{notice.text}
          </motion.div>
        )}

        {/* ── Dev tools — visible on all steps ── */}
        <div style={{ marginBottom: 20 }}>
          <DevTools {...devToolsProps} />
        </div>

        {/* ── Steps ── */}
        <AnimatePresence mode="wait">

          {/* ────────────────────── STEP 1 ────────────────────── */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              style={{ width: "100%", minWidth: 0, boxSizing: "border-box", borderRadius: 14, padding: "20px 16px", border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-card)", display: "flex", flexDirection: "column", gap: 20 }}
            >
              {/* Tournament details */}
              <div>
                <p style={sectionHeadStyle}>Tournament Details</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <Field label="Title *">
                    <input style={inputStyle} placeholder="e.g. Weekend Blitz #1" value={details.title} onChange={(e) => setDetails({ ...details, title: e.target.value })} />
                  </Field>
                  <Field label="Description">
                    <textarea style={{ ...inputStyle, resize: "none" }} rows={2} placeholder="Optional description..." value={details.description} onChange={(e) => setDetails({ ...details, description: e.target.value })} />
                  </Field>
                  {/* Two-column grid — min-width:0 on both container and children */}
                  <FieldGrid>
                    <Field label="Entry Fee (₦) *">
                      <input style={inputStyle} type="number" placeholder="500" value={details.entry_fee} onChange={(e) => setDetails({ ...details, entry_fee: e.target.value })} />
                    </Field>
                    <Field label="Question Count *">
                      <input style={inputStyle} type="number" placeholder="10" value={details.question_count} onChange={(e) => setDetails({ ...details, question_count: e.target.value })} />
                    </Field>
                    <Field label="Time Limit (sec) *">
                      <input style={inputStyle} type="number" placeholder="300" value={details.time_limit_seconds} onChange={(e) => setDetails({ ...details, time_limit_seconds: e.target.value })} />
                    </Field>
                    <Field label="Max Participants *">
                      <input style={inputStyle} type="number" placeholder="1000" value={details.max_participants} onChange={(e) => setDetails({ ...details, max_participants: e.target.value })} />
                    </Field>
                  </FieldGrid>
                </div>
              </div>

              {/* Payout configuration */}
              <div style={{ borderTop: "1px solid var(--border-hairline)", paddingTop: 16 }}>
                <p style={sectionHeadStyle}>Payout Configuration</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <FieldGrid>
                    <Field label="Cash Winners *">
                      <input style={inputStyle} type="number" placeholder="3" value={details.cash_winner_count}
                        onChange={(e) => {
                          const count = Number(e.target.value);
                          setDetails({ ...details, cash_winner_count: e.target.value,
                            payout_distribution: Array(count).fill("").map((_, i) => details.payout_distribution[i] ?? "") });
                        }}
                      />
                    </Field>
                    <Field label="Guaranteed Min">
                      <input style={inputStyle} type="number" placeholder="Optional" value={details.guaranteed_minimum} onChange={(e) => setDetails({ ...details, guaranteed_minimum: e.target.value })} />
                    </Field>
                  </FieldGrid>

                  {/* Payout distribution rows */}
                  {Number(details.cash_winner_count) > 0 && (
                    <div>
                      <label style={labelStyle}>Payout Distribution % (must sum to 100) *</label>
                      {Array.from({ length: Number(details.cash_winner_count) }).map((_, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, minWidth: 0 }}>
                          <span style={{ fontSize: 11, fontFamily: "monospace", color: "var(--text-muted)", flexShrink: 0, width: 52 }}>Rank {i + 1}</span>
                          <input style={{ ...inputStyle, flex: 1, minWidth: 0 }} type="number" placeholder="0"
                            value={details.payout_distribution[i] ?? ""}
                            onChange={(e) => { const d = [...details.payout_distribution]; d[i] = e.target.value; setDetails({ ...details, payout_distribution: d }); }}
                          />
                          <span style={{ fontSize: 12, color: "var(--text-muted)", flexShrink: 0 }}>%</span>
                        </div>
                      ))}
                      <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                        Total: {details.payout_distribution.reduce((s, p) => s + (isNaN(Number(p)) ? 0 : Number(p)), 0).toFixed(1)}%
                      </p>
                    </div>
                  )}

                  <FieldGrid>
                    <Field label="Total Payout % *">
                      <input style={inputStyle} type="number" placeholder="70" value={details.total_payout_percent} onChange={(e) => setDetails({ ...details, total_payout_percent: e.target.value })} />
                    </Field>
                    <Field label="Ticket Tier % *">
                      <input style={inputStyle} type="number" placeholder="30" value={details.ticket_tier_percent} onChange={(e) => setDetails({ ...details, ticket_tier_percent: e.target.value })} />
                    </Field>
                  </FieldGrid>

                  {/* Payout preview */}
                  <div style={{ borderRadius: 10, padding: "12px 14px", border: "1px solid var(--border-hairline)", backgroundColor: "rgba(76,111,255,0.06)" }}>
                    <p style={{ ...sectionHeadStyle, marginBottom: 10 }}>Payout Summary</p>
                    {[
                      { label: "Cash pool:", value: `${details.total_payout_percent || "0"}% of revenue`, color: "var(--accent-indigo)" },
                      { label: "Ticket tier:", value: `${details.ticket_tier_percent || "0"}% of remaining`, color: "var(--accent-violet)" },
                      { label: "Platform keeps:", value: `${(100 - (isNaN(Number(details.total_payout_percent)) ? 0 : Number(details.total_payout_percent))).toFixed(0)}% of revenue`, color: "var(--text-primary)" },
                    ].map(({ label, value, color }) => (
                      <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, minWidth: 0 }}>
                        <span style={{ fontSize: 12, color: "var(--text-secondary)", minWidth: 0 }}>{label}</span>
                        <span style={{ fontSize: 12, fontFamily: "monospace", fontWeight: 600, color, flexShrink: 0, marginLeft: 8 }}>{value}</span>
                      </div>
                    ))}
                    {Number(details.total_payout_percent) > 90 && (
                      <p style={{ fontSize: 11, color: "var(--accent-amber)", marginTop: 8 }}>⚠ Less than 10% platform margin</p>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => { const e = validateStep1(); if (e) { setError(e); return; } setError(""); setNotice(null); setStep(2); }}
                style={{ width: "100%", boxSizing: "border-box", padding: "13px 0", borderRadius: 10, border: "none", backgroundColor: "var(--accent-indigo)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}
              >
                Next: Schedule →
              </button>
            </motion.div>
          )}

          {/* ────────────────────── STEP 2 ────────────────────── */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              style={{ width: "100%", minWidth: 0, boxSizing: "border-box", borderRadius: 14, padding: "20px 16px", border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-card)", display: "flex", flexDirection: "column", gap: 16 }}
            >
              <p style={sectionHeadStyle}>Schedule</p>
              <Field label="Registration Opens *">
                <input style={inputStyle} type="datetime-local" value={schedule.registration_start} onChange={(e) => setSchedule({ ...schedule, registration_start: e.target.value })} />
              </Field>
              <Field label="Tournament Starts *">
                <input style={inputStyle} type="datetime-local" value={schedule.tournament_start} onChange={(e) => setSchedule({ ...schedule, tournament_start: e.target.value })} />
              </Field>
              <Field label="Tournament Ends *">
                <input style={inputStyle} type="datetime-local" value={schedule.tournament_end} onChange={(e) => setSchedule({ ...schedule, tournament_end: e.target.value })} />
              </Field>
              <button
                onClick={() => { const e = validateStep2(); if (e) { setError(e); return; } setError(""); setNotice(null); setStep(3); }}
                style={{ width: "100%", boxSizing: "border-box", padding: "13px 0", borderRadius: 10, border: "none", backgroundColor: "var(--accent-indigo)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}
              >
                Next: Add Questions →
              </button>
            </motion.div>
          )}

          {/* ────────────────────── STEP 3 ────────────────────── */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              style={{ width: "100%", minWidth: 0, display: "flex", flexDirection: "column", gap: 14 }}
            >
              {/* Question entry card */}
              <div style={{ width: "100%", minWidth: 0, boxSizing: "border-box", borderRadius: 14, padding: "16px 16px", border: "1px solid #1E1E1E", backgroundColor: "#141414", display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", minWidth: 0 }}>
                  <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Add Questions</h2>
                  <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 8px", borderRadius: 6, flexShrink: 0, backgroundColor: questions.length >= requiredCount ? "rgba(76,111,255,0.2)" : "rgba(107,114,128,0.2)", color: questions.length >= requiredCount ? "var(--accent-indigo)" : "#9ca3af" }}>
                    {questions.length}/{requiredCount}
                  </span>
                </div>

                <Field label="Question *">
                  <textarea style={{ ...inputStyle, resize: "none" }} rows={2} placeholder="Enter question text..."
                    value={qDraft.question} onChange={(e) => setQDraft({ ...qDraft, question: e.target.value })} />
                </Field>

                <div>
                  <label style={labelStyle}>Format</label>
                  {/* Format toggle — flex children with min-width:0 */}
                  <div style={{ display: "flex", gap: 8, width: "100%", minWidth: 0 }}>
                    {(["multiple_choice", "type_answer"] as const).map((fmt) => (
                      <button key={fmt} onClick={() => setQDraft({ ...qDraft, format: fmt })}
                        style={{ flex: 1, minWidth: 0, padding: "9px 0", borderRadius: 10, fontSize: 12, fontWeight: 700, border: `1px solid ${qDraft.format === fmt ? "rgba(76,111,255,0.5)" : "#1E1E1E"}`, backgroundColor: qDraft.format === fmt ? "rgba(76,111,255,0.15)" : "#0A0A0A", color: qDraft.format === fmt ? "var(--accent-indigo)" : "#9ca3af", cursor: "pointer" }}
                      >
                        {fmt === "multiple_choice" ? "Multiple Choice" : "Type Answer"}
                      </button>
                    ))}
                  </div>
                </div>

                {qDraft.format === "multiple_choice" && (
                  <div>
                    <label style={labelStyle}>Options</label>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {qDraft.options.map((opt, i) => (
                        <input key={i} style={inputStyle} placeholder={`Option ${i + 1}`} value={opt}
                          onChange={(e) => { const o = [...qDraft.options]; o[i] = e.target.value; setQDraft({ ...qDraft, options: o }); }} />
                      ))}
                    </div>
                  </div>
                )}

                <Field label="Correct Answer *">
                  <input style={inputStyle} placeholder="Exact correct answer" value={qDraft.correct_answer}
                    onChange={(e) => setQDraft({ ...qDraft, correct_answer: e.target.value })} />
                </Field>

                <button
                  onClick={() => {
                    if (!qDraft.question.trim()) { setError("Question text required"); return; }
                    if (!qDraft.correct_answer.trim()) { setError("Correct answer required"); return; }
                    if (qDraft.format === "multiple_choice" && qDraft.options.filter((o) => o.trim()).length < 2) { setError("At least 2 options required"); return; }
                    setQuestions((prev) => [...prev, { ...qDraft }]);
                    setQDraft({ question: "", format: "multiple_choice", options: ["", "", "", ""], correct_answer: "" });
                    setError(""); setNotice(null);
                  }}
                  disabled={questions.length >= requiredCount}
                  style={{ width: "100%", boxSizing: "border-box", padding: "11px 0", borderRadius: 10, fontSize: 13, fontWeight: 700, border: "1px solid #333", backgroundColor: "#1E1E1E", color: "var(--text-primary)", cursor: questions.length >= requiredCount ? "not-allowed" : "pointer", opacity: questions.length >= requiredCount ? 0.4 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                >
                  <Plus size={15} /> Add Question
                </button>
              </div>

              {/* Added questions list — each item has min-width:0 so text truncates, not overflows */}
              {questions.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {questions.map((q, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                      style={{ width: "100%", minWidth: 0, boxSizing: "border-box", borderRadius: 10, padding: "10px 12px", border: "1px solid #1E1E1E", backgroundColor: "#141414", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 8, flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: "var(--accent-indigo)", flexShrink: 0, marginTop: 1 }}>Q{i + 1}</span>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{q.question}</p>
                          <p style={{ fontSize: 11, color: "#6b7280", margin: "3px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {q.format === "multiple_choice" ? `MC · ${q.options.filter(Boolean).join(", ")}` : "Type answer"}
                            {" · "}<span style={{ color: "var(--accent-indigo)" }}>✓ {q.correct_answer}</span>
                          </p>
                        </div>
                      </div>
                      <button onClick={() => setQuestions((prev) => prev.filter((_, idx) => idx !== i))}
                        style={{ padding: 6, borderRadius: 6, border: "none", background: "none", cursor: "pointer", color: "#6b7280", flexShrink: 0 }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Publish button — only shows when all questions added */}
              {questions.length >= requiredCount && requiredCount > 0 && (
                <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  onClick={handlePublish} disabled={loading}
                  style={{ width: "100%", boxSizing: "border-box", padding: "14px 0", borderRadius: 10, border: "none", backgroundColor: "var(--accent-indigo)", color: "#fff", fontSize: 15, fontWeight: 800, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                >
                  {loading
                    ? <div style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", animation: "spin 0.7s linear infinite" }} />
                    : <><CheckCircle size={17} /> Publish Tournament</>
                  }
                </motion.button>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
