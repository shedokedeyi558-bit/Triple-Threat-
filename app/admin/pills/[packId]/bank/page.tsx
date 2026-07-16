"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { adminApi, type PackQuestion, ApiError } from "@/lib/api";
import {
  ChevronLeft, Plus, Pencil, Trash2, AlertTriangle, CheckCircle2,
  ArrowUpDown, ArrowUp, ArrowDown, Loader2, X, Save, BookOpen,
} from "lucide-react";

// ── Difficulty flag ───────────────────────────────────────────────────────────
function DifficultyFlag({ rate, shown }: { rate: number; shown: number }) {
  if (shown < 5) return <span style={{ fontSize: 9, color: "var(--text-muted)" }}>Not enough data</span>;
  if (rate > 85) return (
    <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4,
      backgroundColor: "rgba(251,191,36,0.12)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.25)" }}>
      Too easy
    </span>
  );
  if (rate < 20) return (
    <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4,
      backgroundColor: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.25)" }}>
      Check this
    </span>
  );
  return null;
}

// ── Bank health bar ───────────────────────────────────────────────────────────
function BankHealth({ total, questionCount }: { total: number; questionCount: number | null }) {
  if (questionCount == null) return null;
  const ratio = questionCount > 0 ? total / questionCount : 0;
  const pct = Math.min(100, (ratio / 3) * 100); // 3× is "full coverage"
  const color = ratio < 1 ? "#ef4444" : ratio < 2 ? "#fbbf24" : ratio < 3 ? "#60a5fa" : "#34d399";
  const label = ratio < 1 ? "Under minimum" : ratio < 2 ? "Low coverage" : ratio < 3 ? "Good" : "Full coverage";
  return (
    <div style={{ borderRadius: 10, padding: "12px 14px", border: "1px solid var(--border-hairline)", backgroundColor: "var(--bg-card)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-muted)" }}>
          Bank health
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, color }}>{label}</span>
      </div>
      <div style={{ height: 5, borderRadius: 3, backgroundColor: "#1E1E1E", overflow: "hidden", marginBottom: 6 }}>
        <div style={{ height: "100%", borderRadius: 3, width: `${pct}%`, backgroundColor: color, transition: "width 0.5s ease" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-muted)" }}>
        <span>{total} questions in bank</span>
        <span>{questionCount} drawn per exam · {ratio.toFixed(1)}× coverage</span>
      </div>
    </div>
  );
}

// ── Question form (add / edit) ────────────────────────────────────────────────
const COLORS = ["#4C6FFF","#8B5CF6","#F59E0B","#10B981","#EF4444","#EC4899"];

function QuestionForm({ initial, onSave, onCancel, saving }: {
  initial?: Partial<PackQuestion>;
  onSave: (data: Omit<PackQuestion, "id"|"times_shown"|"times_correct"|"correct_rate"|"status"|"created_at">) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [question, setQuestion] = useState(initial?.question ?? "");
  const [format, setFormat] = useState<"multiple_choice"|"type_answer">(initial?.format ?? "multiple_choice");
  const [options, setOptions] = useState<string[]>(initial?.options?.length ? initial.options : ["","","",""]);
  const [correct, setCorrect] = useState(initial?.correct_answer ?? "");
  const [timer, setTimer] = useState<number|"">(initial?.timer ?? 30);

  const canSave = question.trim() && correct.trim() && Number(timer) > 0 &&
    (format === "type_answer" || options.filter(o => o.trim()).length >= 2);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <label style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-muted)", display: "block", marginBottom: 5 }}>Question *</label>
        <textarea value={question} onChange={e => setQuestion(e.target.value)} rows={2}
          style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-base)", color: "var(--text-primary)", fontSize: 13, resize: "vertical", outline: "none" }}
          placeholder="Question text..." />
      </div>

      {/* Format toggle */}
      <div style={{ display: "flex", gap: 6 }}>
        {(["multiple_choice","type_answer"] as const).map(f => (
          <button key={f} onClick={() => setFormat(f)}
            style={{ flex: 1, padding: "7px 0", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", border: "1px solid",
              backgroundColor: format===f ? "rgba(76,111,255,0.12)" : "transparent",
              borderColor: format===f ? "rgba(76,111,255,0.4)" : "var(--border-subtle)",
              color: format===f ? "var(--accent-indigo)" : "var(--text-muted)" }}>
            {f === "multiple_choice" ? "Multiple choice" : "Type answer"}
          </button>
        ))}
      </div>

      {format === "multiple_choice" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-muted)" }}>Options</label>
          {options.map((o, i) => (
            <input key={i} value={o} onChange={e => { const n=[...options]; n[i]=e.target.value; setOptions(n); }}
              placeholder={`Option ${i+1}`}
              style={{ padding: "9px 12px", borderRadius: 8, border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-base)", color: "var(--text-primary)", fontSize: 13, outline: "none" }} />
          ))}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 100px", gap: 10 }}>
        <div>
          <label style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-muted)", display: "block", marginBottom: 5 }}>Correct answer *</label>
          <input value={correct} onChange={e => setCorrect(e.target.value)} placeholder="Exact correct answer"
            style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px", borderRadius: 8, border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-base)", color: "var(--text-primary)", fontSize: 13, outline: "none" }} />
        </div>
        <div>
          <label style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-muted)", display: "block", marginBottom: 5 }}>Timer (s) *</label>
          <input type="number" min={5} value={timer} onChange={e => setTimer(e.target.value===""?"":Number(e.target.value))}
            style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px", borderRadius: 8, border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-base)", color: "var(--text-primary)", fontSize: 13, outline: "none" }} />
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button onClick={onCancel} style={{ padding: "8px 18px", borderRadius: 8, border: "1px solid var(--border-subtle)", backgroundColor: "transparent", color: "var(--text-secondary)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
          Cancel
        </button>
        <button onClick={() => canSave && onSave({ question: question.trim(), format, options: format==="multiple_choice" ? options.filter(o=>o.trim()) : undefined, correct_answer: correct.trim(), timer: Number(timer) })}
          disabled={!canSave || saving}
          style={{ padding: "8px 18px", borderRadius: 8, border: "none", backgroundColor: "var(--accent-indigo)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: canSave && !saving ? "pointer" : "not-allowed", opacity: canSave && !saving ? 1 : 0.45, display: "flex", alignItems: "center", gap: 6 }}>
          {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}

// ── Delete confirmation ───────────────────────────────────────────────────────
function DeleteConfirm({ question, onConfirm, onCancel, deleting }: {
  question: PackQuestion; onConfirm: () => void; onCancel: () => void; deleting: boolean;
}) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)", padding: 16 }}
      onClick={onCancel}>
      <motion.div initial={{ scale: 0.92 }} animate={{ scale: 1 }} exit={{ scale: 0.92 }}
        onClick={e => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 380, borderRadius: 16, padding: "24px 22px", backgroundColor: "var(--bg-card)", border: "1px solid rgba(239,68,68,0.25)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <AlertTriangle size={18} style={{ color: "#f87171", flexShrink: 0 }} />
          <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Delete question?</p>
        </div>
        <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.55, marginBottom: 18 }}>
          "{question.question.slice(0, 80)}{question.question.length > 80 ? "…" : ""}"
        </p>
        <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 18 }}>
          This removes the question from the bank. Players who already answered it are unaffected.
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: "1px solid var(--border-subtle)", backgroundColor: "transparent", color: "var(--text-secondary)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            Cancel
          </button>
          <button onClick={onConfirm} disabled={deleting}
            style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: "none", backgroundColor: "#ef4444", color: "#fff", fontSize: 12, fontWeight: 700, cursor: deleting ? "not-allowed" : "pointer", opacity: deleting ? 0.6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
type SortDir = "asc" | "desc" | null;

export default function QuestionBankPage() {
  const params = useParams();
  const router = useRouter();
  const packId = params.packId as string;

  const [packName, setPackName]         = useState("");
  const [questionCount, setQuestionCount] = useState<number | null>(null);
  const [questions, setQuestions]       = useState<PackQuestion[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState("");

  const [sortDir, setSortDir]           = useState<SortDir>(null);
  const [editTarget, setEditTarget]     = useState<PackQuestion | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PackQuestion | null>(null);
  const [showAdd, setShowAdd]           = useState(false);
  const [saving, setSaving]             = useState(false);
  const [deleting, setDeleting]         = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await adminApi.getPackQuestions(packId);
      setPackName(res.pack.name);
      setQuestionCount(res.pack.question_count);
      setQuestions(res.questions);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load question bank");
    } finally {
      setLoading(false);
    }
  }, [packId]);

  useEffect(() => { load(); }, [load]);

  // Sort by correct_rate
  const sorted = [...questions].sort((a, b) => {
    if (sortDir === "asc")  return a.correct_rate - b.correct_rate;
    if (sortDir === "desc") return b.correct_rate - a.correct_rate;
    return 0;
  });

  const cycleSortDir = () => setSortDir(d => d === null ? "desc" : d === "desc" ? "asc" : null);
  const SortIcon = sortDir === "desc" ? ArrowDown : sortDir === "asc" ? ArrowUp : ArrowUpDown;

  const handleAdd = async (data: Parameters<typeof adminApi.addPillToPack>[1]) => {
    setSaving(true);
    try {
      await adminApi.addPillToPack(packId, { ...data, color: "#4C6FFF" });
      await load();
      setShowAdd(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to add question");
    } finally { setSaving(false); }
  };

  const handleEdit = async (data: Parameters<typeof adminApi.addPillToPack>[1]) => {
    if (!editTarget) return;
    setSaving(true);
    try {
      await adminApi.updatePackQuestion(packId, editTarget.id, data);
      await load();
      setEditTarget(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save question");
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminApi.deletePackQuestion(packId, deleteTarget.id);
      setQuestions(prev => prev.filter(q => q.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete question");
    } finally { setDeleting(false); }
  };

  const tooEasy   = questions.filter(q => q.times_shown >= 5 && q.correct_rate > 85).length;
  const checkThis = questions.filter(q => q.times_shown >= 5 && q.correct_rate < 20).length;

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", paddingBottom: 60 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button onClick={() => router.push("/admin/pills")}
          style={{ padding: "6px 8px", borderRadius: 8, border: "1px solid var(--border-subtle)", backgroundColor: "transparent", cursor: "pointer", display: "flex", alignItems: "center" }}>
          <ChevronLeft size={16} style={{ color: "var(--text-secondary)" }} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <BookOpen size={16} style={{ color: "var(--accent-indigo)", flexShrink: 0 }} />
            <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {loading ? "Loading…" : `${packName} — Question Bank`}
            </h1>
          </div>
          <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "2px 0 0" }}>
            {questions.length} question{questions.length !== 1 ? "s" : ""} in bank
            {tooEasy > 0 && <span style={{ color: "#fbbf24", marginLeft: 8 }}>· {tooEasy} too easy</span>}
            {checkThis > 0 && <span style={{ color: "#f87171", marginLeft: 8 }}>· {checkThis} to review</span>}
          </p>
        </div>
        <button onClick={() => { setShowAdd(true); setEditTarget(null); }}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", borderRadius: 9, border: "none", backgroundColor: "var(--accent-indigo)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
          <Plus size={13} /> Add Question
        </button>
      </div>

      {error && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "10px 12px", borderRadius: 8, marginBottom: 14, border: "1px solid rgba(239,68,68,0.3)", backgroundColor: "rgba(239,68,68,0.05)", color: "#f87171", fontSize: 12 }}>
          <span>{error}</span>
          <button onClick={() => setError("")} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", flexShrink: 0 }}><X size={13} /></button>
        </div>
      )}

      {/* Bank health */}
      {!loading && (
        <div style={{ marginBottom: 16 }}>
          <BankHealth total={questions.length} questionCount={questionCount} />
        </div>
      )}

      {/* Add form */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            style={{ borderRadius: 12, padding: 18, border: "1px solid rgba(76,111,255,0.3)", backgroundColor: "var(--bg-card)", marginBottom: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--accent-indigo)", marginBottom: 14 }}>New question</p>
            <QuestionForm onSave={handleAdd} onCancel={() => setShowAdd(false)} saving={saving} />
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
          <Loader2 size={28} className="animate-spin" style={{ color: "var(--accent-indigo)" }} />
        </div>
      ) : questions.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text-muted)" }}>
          <BookOpen size={32} style={{ margin: "0 auto 12px", display: "block", opacity: 0.4 }} />
          <p style={{ fontSize: 14, fontWeight: 600 }}>No questions yet</p>
          <p style={{ fontSize: 12, marginTop: 4 }}>Add questions to build the bank</p>
        </div>
      ) : (
        <div style={{ borderRadius: 12, border: "1px solid var(--border-hairline)", overflow: "hidden", backgroundColor: "var(--bg-card)" }}>
          {/* Table header */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 140px 90px 90px 110px 80px", gap: 0, padding: "9px 16px", borderBottom: "1px solid var(--border-hairline)", backgroundColor: "var(--bg-base)" }}>
            {[
              { label: "Question", flex: true },
              { label: "Correct answer" },
              { label: "Shown" },
              { label: "Correct" },
              { label: <button onClick={cycleSortDir} style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", color: sortDir ? "var(--accent-indigo)" : "var(--text-muted)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", padding: 0 }}>
                Rate <SortIcon size={11} />
              </button> },
              { label: "Actions" },
            ].map((col, i) => (
              <div key={i} style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-muted)" }}>
                {col.label}
              </div>
            ))}
          </div>

          {/* Rows */}
          {sorted.map((q, i) => {
            const isEditing = editTarget?.id === q.id;
            const flag = q.times_shown >= 5 ? (q.correct_rate > 85 ? "easy" : q.correct_rate < 20 ? "check" : null) : null;
            return (
              <div key={q.id} style={{ borderBottom: i < sorted.length-1 ? "1px solid var(--border-hairline)" : "none",
                backgroundColor: flag === "easy" ? "rgba(251,191,36,0.03)" : flag === "check" ? "rgba(239,68,68,0.03)" : "transparent" }}>

                {/* Normal row */}
                {!isEditing && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 140px 90px 90px 110px 80px", gap: 0, padding: "11px 16px", alignItems: "center" }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 500, color: "var(--text-primary)", margin: "0 0 3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{q.question}</p>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase" }}>{q.format === "multiple_choice" ? "MCQ" : "Type"}</span>
                        <DifficultyFlag rate={q.correct_rate} shown={q.times_shown} />
                      </div>
                    </div>
                    <p style={{ fontSize: 11, color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{q.correct_answer}</p>
                    <p style={{ fontSize: 12, fontFamily: "monospace", color: "var(--text-secondary)" }}>{q.times_shown}</p>
                    <p style={{ fontSize: 12, fontFamily: "monospace", color: "var(--text-secondary)" }}>{q.times_correct}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: "#1E1E1E", overflow: "hidden" }}>
                        <div style={{ height: "100%", borderRadius: 2, width: `${q.correct_rate}%`,
                          backgroundColor: q.times_shown < 5 ? "#333" : q.correct_rate > 85 ? "#fbbf24" : q.correct_rate < 20 ? "#ef4444" : "#34d399" }} />
                      </div>
                      <span style={{ fontSize: 11, fontFamily: "monospace", color: "var(--text-secondary)", minWidth: 34, textAlign: "right" }}>
                        {q.times_shown < 5 ? "—" : `${q.correct_rate.toFixed(0)}%`}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <button onClick={() => { setEditTarget(q); setShowAdd(false); }}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 6, color: "var(--text-muted)" }}
                        title="Edit">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => setDeleteTarget(q)}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 6, color: "var(--text-muted)" }}
                        title="Delete">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Inline edit */}
                {isEditing && (
                  <div style={{ padding: "14px 16px", borderTop: "1px solid rgba(76,111,255,0.2)", backgroundColor: "rgba(76,111,255,0.03)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                      <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--accent-indigo)", margin: 0 }}>Editing</p>
                      <button onClick={() => setEditTarget(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={14} /></button>
                    </div>
                    <QuestionForm initial={q} onSave={handleEdit} onCancel={() => setEditTarget(null)} saving={saving} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Delete confirm dialog */}
      <AnimatePresence>
        {deleteTarget && (
          <DeleteConfirm question={deleteTarget} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} deleting={deleting} />
        )}
      </AnimatePresence>
    </div>
  );
}
