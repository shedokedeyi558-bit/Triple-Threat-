"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { adminApi, type PackQuestion, ApiError } from "@/lib/api";
import {
  Plus, Pencil, Trash2, AlertTriangle,
  Loader2, X, Save, Library, AlertCircle,
} from "lucide-react";

// ── Paste panel with preview ──────────────────────────────────────────────────
interface PastedQuestion {
  id: string;
  question: string;
  options: [string, string, string, string];
  correct_answer: "A"|"B"|"C"|"D";
  error?: string;
}

function parseQuestions(raw: string): PastedQuestion[] {
  const blocks = raw.split(/\n\s*\n/).filter(b => b.trim());
  const results: PastedQuestion[] = [];
  let id = 0;

  for (const block of blocks) {
    const lines = block.split("\n").map(l => l.trim()).filter(Boolean);
    const q: Partial<PastedQuestion> = { id: String(id++), options: ["","","",""] as [string, string, string, string] };
    const errors: string[] = [];

    for (const line of lines) {
      if (line.startsWith("Q:")) q.question = line.slice(2).trim();
      else if (line.startsWith("A)")) q.options![0] = line.slice(2).trim();
      else if (line.startsWith("B)")) q.options![1] = line.slice(2).trim();
      else if (line.startsWith("C)")) q.options![2] = line.slice(2).trim();
      else if (line.startsWith("D)")) q.options![3] = line.slice(2).trim();
      else if (line.startsWith("Correct:")) {
        const ans = line.slice(8).trim().toUpperCase();
        if (["A","B","C","D"].includes(ans)) q.correct_answer = ans as "A"|"B"|"C"|"D";
        else errors.push("Correct answer must be A, B, C, or D");
      }
    }

    if (!q.question) errors.push("Missing question text (Q:)");
    if (!q.options!.every(o => o.trim())) errors.push("Missing one or more options");
    if (!q.correct_answer) errors.push("Missing correct answer (Correct:)");

    results.push({
      id: q.id!,
      question: q.question || "",
      options: q.options!,
      correct_answer: q.correct_answer || "A",
      error: errors.length ? errors.join("; ") : undefined,
    });
  }

  return results;
}

function PastePanel({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const [raw, setRaw] = useState("");
  const [parsed, setParsed] = useState<PastedQuestion[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleParse = () => {
    const p = parseQuestions(raw);
    setParsed(p);
    setShowPreview(true);
  };

  const handleEditParsed = (id: string, field: "question" | "options" | "correct_answer", value: string | [string, string, string, string]) => {
    setParsed(prev => prev.map(q => q.id === id ? { ...q, [field]: value, error: undefined } : q));
  };

  const handleSave = async () => {
    const toSave = parsed.filter(q => !q.error && q.question.trim() && q.options.every(o => o.trim()));
    if (!toSave.length) return;

    setSaving(true);
    try {
      for (const q of toSave) {
        await adminApi.addLibraryQuestion({
          question: q.question,
          format: "multiple_choice",
          options: q.options,
          correct_answer: q.correct_answer,
        });
      }
      onDone();
    } catch (err) {
      // Error handling could show a toast or similar
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (!showPreview) {
    return (
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
        style={{ borderRadius: 12, padding: 18, border: "1px solid rgba(76,111,255,0.25)", backgroundColor: "var(--bg-card)", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--accent-indigo)" }}>Paste Questions</span>
          <button onClick={onCancel} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={14} /></button>
        </div>
        <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 10 }}>Paste AI-generated questions, one per block (separated by blank lines). Format: Q: [text], A) [opt], B) [opt], C) [opt], D) [opt], Correct: [A/B/C/D]</p>
        <textarea value={raw} onChange={e => setRaw(e.target.value)} rows={10} placeholder="Q: What is 2+2?
A) 3
B) 4
C) 5
D) 6
Correct: B

Q: What is the capital of France?
A) London
B) Berlin
C) Paris
D) Madrid
Correct: C"
          style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-base)", color: "var(--text-primary)", fontSize: 12, resize: "vertical", outline: "none", fontFamily: "monospace", marginBottom: 12 }} />
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onCancel} style={{ padding: "8px 18px", borderRadius: 8, border: "1px solid var(--border-subtle)", backgroundColor: "transparent", color: "var(--text-secondary)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Cancel</button>
          <button onClick={handleParse} disabled={!raw.trim()}
            style={{ padding: "8px 18px", borderRadius: 8, border: "none", backgroundColor: "var(--accent-indigo)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: !raw.trim() ? "not-allowed" : "pointer", opacity: !raw.trim() ? 0.45 : 1 }}>
            Preview
          </button>
        </div>
      </motion.div>
    );
  }

  const validCount = parsed.filter(q => !q.error && q.question.trim() && q.options.every(o => o.trim())).length;
  const errorCount = parsed.filter(q => q.error || !q.question.trim() || !q.options.every(o => o.trim())).length;

  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
      style={{ borderRadius: 12, padding: 18, border: "1px solid rgba(76,111,255,0.25)", backgroundColor: "var(--bg-card)", marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div>
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--accent-indigo)" }}>Preview ({validCount} valid{errorCount > 0 ? `, ${errorCount} needs fix` : ""})</span>
        </div>
        <button onClick={() => { setShowPreview(false); setParsed([]); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={14} /></button>
      </div>

      <div style={{ borderRadius: 12, border: "1px solid var(--border-hairline)", overflow: "hidden", backgroundColor: "transparent", maxHeight: 500, overflowY: "auto", marginBottom: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 150px 80px", padding: "9px 16px", borderBottom: "1px solid var(--border-hairline)", backgroundColor: "var(--bg-base)", position: "sticky", top: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-muted)" }}>Question & Options</div>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-muted)" }}>Correct</div>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-muted)" }}>Status</div>
        </div>

        {parsed.map((q, i) => {
          const hasError = q.error || !q.question.trim() || !q.options.every(o => o.trim());
          return (
            <div key={q.id} style={{ borderBottom: i < parsed.length - 1 ? "1px solid var(--border-hairline)" : "none", backgroundColor: hasError ? "rgba(239,68,68,0.03)" : "var(--bg-card)" }}>
              <div style={{ padding: "12px 16px", display: "grid", gridTemplateColumns: "1fr 150px 80px", gap: 12, alignItems: "flex-start" }}>
                <div>
                  <input value={q.question} onChange={e => handleEditParsed(q.id, "question", e.target.value)} 
                    style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-base)", color: "var(--text-primary)", fontSize: 12, marginBottom: 8, boxSizing: "border-box", outline: "none" }} />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 6 }}>
                    {(["A","B","C","D"] as const).map((letter, idx) => (
                      <input key={letter} value={q.options[idx]} onChange={e => { const opts = [...q.options]; opts[idx] = e.target.value; handleEditParsed(q.id, "options", opts as [string, string, string, string]); }}
                        placeholder={`${letter})`}
                        style={{ padding: "4px 6px", borderRadius: 4, border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-base)", color: "var(--text-primary)", fontSize: 11, boxSizing: "border-box", outline: "none" }} />
                    ))}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {(["A","B","C","D"] as const).map((letter) => (
                    <label key={letter} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, cursor: "pointer", color: q.correct_answer === letter ? "var(--accent-indigo)" : "var(--text-muted)" }}>
                      <input type="radio" name={`correct-${q.id}`} checked={q.correct_answer === letter} onChange={() => handleEditParsed(q.id, "correct_answer", letter)} style={{ cursor: "pointer" }} />
                      {letter}
                    </label>
                  ))}
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
                  {hasError ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <AlertCircle size={14} style={{ color: "#f87171" }} />
                      <span style={{ fontSize: 10, color: "#f87171" }}>{q.error || "Incomplete"}</span>
                    </div>
                  ) : (
                    <span style={{ fontSize: 10, color: "#34d399", fontWeight: 600 }}>✓ Ready</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button onClick={() => { setShowPreview(false); setParsed([]); }} style={{ padding: "8px 18px", borderRadius: 8, border: "1px solid var(--border-subtle)", backgroundColor: "transparent", color: "var(--text-secondary)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Back to Paste</button>
        <button onClick={handleSave} disabled={validCount === 0 || saving}
          style={{ padding: "8px 18px", borderRadius: 8, border: "none", backgroundColor: "var(--accent-indigo)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: validCount === 0 || saving ? "not-allowed" : "pointer", opacity: validCount === 0 || saving ? 0.45 : 1, display: "flex", alignItems: "center", gap: 6 }}>
          {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
          {saving ? "Saving..." : `Save ${validCount} Question${validCount !== 1 ? "s" : ""}`}
        </button>
      </div>
    </motion.div>
  );
}

// ── Question form ─────────────────────────────────────────────────────────────
function QuestionForm({ initial, onSave, onCancel, saving }: {
  initial?: Partial<PackQuestion>;
  onSave: (data: { question: string; format: "multiple_choice"|"type_answer"; options?: string[]; correct_answer: string }) => void;
  onCancel: () => void; saving: boolean;
}) {
  const [question, setQuestion] = useState(initial?.question ?? "");
  const [format, setFormat] = useState<"multiple_choice"|"type_answer">(initial?.format ?? "multiple_choice");
  const [options, setOptions] = useState<string[]>(initial?.options?.length ? initial.options : ["","","",""]);
  const [correct, setCorrect] = useState(initial?.correct_answer ?? "");
  const canSave = question.trim() && correct.trim() && (format === "type_answer" || options.filter(o=>o.trim()).length >= 2);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <textarea value={question} onChange={e => setQuestion(e.target.value)} rows={2} placeholder="Question text..."
        style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-base)", color: "var(--text-primary)", fontSize: 13, resize: "vertical", outline: "none" }} />
      <div style={{ display: "flex", gap: 6 }}>
        {(["multiple_choice","type_answer"] as const).map(f => (
          <button key={f} onClick={() => setFormat(f)} style={{ flex: 1, padding: "7px 0", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", border: "1px solid", backgroundColor: format===f ? "rgba(76,111,255,0.12)" : "transparent", borderColor: format===f ? "rgba(76,111,255,0.4)" : "var(--border-subtle)", color: format===f ? "var(--accent-indigo)" : "var(--text-muted)" }}>
            {f === "multiple_choice" ? "Multiple choice" : "Type answer"}
          </button>
        ))}
      </div>
      {format === "multiple_choice" && options.map((o, i) => (
        <input key={i} value={o} onChange={e => { const n=[...options]; n[i]=e.target.value; setOptions(n); }} placeholder={`Option ${i+1}`}
          style={{ padding: "9px 12px", borderRadius: 8, border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-base)", color: "var(--text-primary)", fontSize: 13, outline: "none" }} />
      ))}
      <div style={{ display: "flex", gap: 10 }}>
        <input value={correct} onChange={e => setCorrect(e.target.value)} placeholder="Correct answer *"
          style={{ padding: "9px 12px", borderRadius: 8, border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-base)", color: "var(--text-primary)", fontSize: 13, outline: "none", flex: 1 }} />
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button onClick={onCancel} style={{ padding: "8px 18px", borderRadius: 8, border: "1px solid var(--border-subtle)", backgroundColor: "transparent", color: "var(--text-secondary)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Cancel</button>
        <button onClick={() => canSave && onSave({ question: question.trim(), format, options: format==="multiple_choice"?options.filter(o=>o.trim()):undefined, correct_answer: correct.trim() })}
          disabled={!canSave || saving}
          style={{ padding: "8px 18px", borderRadius: 8, border: "none", backgroundColor: "var(--accent-indigo)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: canSave && !saving ? "pointer" : "not-allowed", opacity: canSave && !saving ? 1 : 0.45, display: "flex", alignItems: "center", gap: 6 }}>
          {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}



export default function LibraryPage() {
  const [questions, setQuestions]   = useState<PackQuestion[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [showAdd, setShowAdd]       = useState(false);
  const [showPaste, setShowPaste]   = useState(false);
  const [editTarget, setEditTarget] = useState<PackQuestion | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PackQuestion | null>(null);
  const [saving, setSaving]         = useState(false);
  const [deleting, setDeleting]     = useState(false);

  const load = useCallback(async () => {
    try { const r = await adminApi.getLibraryQuestions(); setQuestions(r.questions ?? []); }
    catch (err) { setError(err instanceof ApiError ? err.message : "Failed to load library"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const sorted = [...questions];

  const handleAdd = async (data: { question: string; format: "multiple_choice"|"type_answer"; options?: string[]; correct_answer: string }) => {
    setSaving(true);
    try { await adminApi.addLibraryQuestion(data); await load(); setShowAdd(false); }
    catch (err) { setError(err instanceof ApiError ? err.message : "Failed to add"); }
    finally { setSaving(false); }
  };
  const handleEdit = async (data: { question: string; format: "multiple_choice"|"type_answer"; options?: string[]; correct_answer: string }) => {
    if (!editTarget) return;
    setSaving(true);
    try { await adminApi.updateLibraryQuestion(editTarget.id, data); await load(); setEditTarget(null); }
    catch (err) { setError(err instanceof ApiError ? err.message : "Failed to save"); }
    finally { setSaving(false); }
  };
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try { await adminApi.deleteLibraryQuestion(deleteTarget.id); setQuestions(prev => prev.filter(q => q.id !== deleteTarget.id)); setDeleteTarget(null); }
    catch (err) { setError(err instanceof ApiError ? err.message : "Failed to delete"); }
    finally { setDeleting(false); }
  };

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", paddingBottom: 60 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
            <Library size={18} style={{ color: "var(--accent-amber)" }} />
            <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>Draft Library</h1>
          </div>
          <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>{questions.length} question{questions.length!==1?"s":""} · Unattached question pool</p>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => { setShowPaste(true); setShowAdd(false); setEditTarget(null); }}
            style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(76,111,255,0.3)", backgroundColor: showPaste ? "rgba(76,111,255,0.1)" : "transparent", color: "var(--accent-indigo)", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
            <Plus size={12} /> Paste
          </button>
          <button onClick={() => { setShowAdd(true); setShowPaste(false); setEditTarget(null); }}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", borderRadius: 9, border: "none", backgroundColor: "var(--accent-amber)", color: "#000", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            <Plus size={13} /> Add Question
          </button>
        </div>
      </div>

      {error && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "10px 12px", borderRadius: 8, marginBottom: 14, border: "1px solid rgba(239,68,68,0.3)", backgroundColor: "rgba(239,68,68,0.05)", color: "#f87171", fontSize: 12 }}>
          {error}<button onClick={() => setError("")} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer" }}><X size={13} /></button>
        </div>
      )}

      <AnimatePresence>
        {showPaste && <PastePanel onDone={() => { setShowPaste(false); load(); }} onCancel={() => setShowPaste(false)} />}
        {showAdd && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            style={{ borderRadius: 12, padding: 18, border: "1px solid rgba(232,163,61,0.3)", backgroundColor: "var(--bg-card)", marginBottom: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--accent-amber)", marginBottom: 14 }}>New library question</p>
            <QuestionForm onSave={handleAdd} onCancel={() => setShowAdd(false)} saving={saving} />
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}><Loader2 size={28} className="animate-spin" style={{ color: "var(--accent-amber)" }} /></div>
      ) : questions.length === 0 ? (
        <div style={{ borderRadius: 14, padding: "48px 24px", textAlign: "center", border: "1px solid var(--border-hairline)", backgroundColor: "var(--bg-card)" }}>
          <Library size={32} style={{ margin: "0 auto 12px", display: "block", opacity: 0.4, color: "var(--text-muted)" }} />
          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>Library is empty</p>
          <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Add questions here to reuse them across multiple Specials packs</p>
        </div>
      ) : (
        <div style={{ borderRadius: 12, border: "1px solid var(--border-hairline)", overflow: "hidden", backgroundColor: "var(--bg-card)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 140px 80px", padding: "9px 16px", borderBottom: "1px solid var(--border-hairline)", backgroundColor: "var(--bg-base)" }}>
            {(["Question","Correct answer","Actions"] as string[]).map((h, i) => (
              <div key={i} style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-muted)" }}>{h}</div>
            ))}
          </div>
          {sorted.map((q, i) => {
            const isEditing = editTarget?.id === q.id;
            return (
              <div key={q.id} style={{ borderBottom: i < sorted.length-1 ? "1px solid var(--border-hairline)" : "none" }}>
                {!isEditing && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 140px 80px", padding: "11px 16px", alignItems: "center" }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 500, color: "var(--text-primary)", margin: "0 0 3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{q.question}</p>
                      <span style={{ fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase" }}>{q.format === "multiple_choice" ? "MCQ" : "Type"}</span>
                    </div>
                    <p style={{ fontSize: 11, color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{q.correct_answer}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <button onClick={() => { setEditTarget(q); setShowAdd(false); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 6, color: "var(--text-muted)" }}><Pencil size={13} /></button>
                      <button onClick={() => setDeleteTarget(q)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 6, color: "var(--text-muted)" }}><Trash2 size={13} /></button>
                    </div>
                  </div>
                )}
                {isEditing && (
                  <div style={{ padding: "14px 16px", borderTop: "1px solid rgba(232,163,61,0.2)", backgroundColor: "rgba(232,163,61,0.02)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                      <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--accent-amber)", margin: 0 }}>Editing</p>
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

      <AnimatePresence>
        {deleteTarget && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)", padding: 16 }}
            onClick={() => setDeleteTarget(null)}>
            <motion.div initial={{ scale: 0.92 }} animate={{ scale: 1 }} exit={{ scale: 0.92 }}
              onClick={e => e.stopPropagation()}
              style={{ width: "100%", maxWidth: 360, borderRadius: 16, padding: "24px 22px", backgroundColor: "var(--bg-card)", border: "1px solid rgba(239,68,68,0.25)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <AlertTriangle size={18} style={{ color: "#f87171" }} />
                <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Remove from library?</p>
              </div>
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 18 }}>This only removes the question from the library pool — it does not affect any packs that already imported it.</p>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setDeleteTarget(null)} style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: "1px solid var(--border-subtle)", backgroundColor: "transparent", color: "var(--text-secondary)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Cancel</button>
                <button onClick={handleDelete} disabled={deleting}
                  style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: "none", backgroundColor: "#ef4444", color: "#fff", fontSize: 12, fontWeight: 700, cursor: deleting?"not-allowed":"pointer", opacity: deleting?0.6:1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                  {deleting ? "Removing..." : "Remove"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
