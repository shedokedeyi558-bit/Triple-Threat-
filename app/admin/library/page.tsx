"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { adminApi, type PackQuestion, ApiError } from "@/lib/api";
import {
  Plus, Pencil, Trash2, AlertTriangle, ArrowUpDown, ArrowUp, ArrowDown,
  Loader2, X, Save, Library, Upload,
} from "lucide-react";

// ── Difficulty flag ───────────────────────────────────────────────────────────
function DifficultyFlag({ rate, shown }: { rate: number; shown: number }) {
  if (shown < 5) return null;
  if (rate > 85) return <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4, backgroundColor: "rgba(251,191,36,0.12)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.25)" }}>Too easy</span>;
  if (rate < 20) return <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4, backgroundColor: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.25)" }}>Check this</span>;
  return null;
}

// ── Question form ─────────────────────────────────────────────────────────────
function QuestionForm({ initial, onSave, onCancel, saving }: {
  initial?: Partial<PackQuestion>;
  onSave: (data: { question: string; format: "multiple_choice"|"type_answer"; options?: string[]; correct_answer: string; timer: number }) => void;
  onCancel: () => void; saving: boolean;
}) {
  const [question, setQuestion] = useState(initial?.question ?? "");
  const [format, setFormat] = useState<"multiple_choice"|"type_answer">(initial?.format ?? "multiple_choice");
  const [options, setOptions] = useState<string[]>(initial?.options?.length ? initial.options : ["","","",""]);
  const [correct, setCorrect] = useState(initial?.correct_answer ?? "");
  const [timer, setTimer] = useState<number|"">(initial?.timer ?? 30);
  const canSave = question.trim() && correct.trim() && Number(timer) > 0 && (format === "type_answer" || options.filter(o=>o.trim()).length >= 2);
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
      <div style={{ display: "grid", gridTemplateColumns: "1fr 100px", gap: 10 }}>
        <input value={correct} onChange={e => setCorrect(e.target.value)} placeholder="Correct answer *"
          style={{ padding: "9px 12px", borderRadius: 8, border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-base)", color: "var(--text-primary)", fontSize: 13, outline: "none" }} />
        <input type="number" min={5} value={timer} onChange={e => setTimer(e.target.value===""?"":Number(e.target.value))} placeholder="Timer (s)"
          style={{ padding: "9px 12px", borderRadius: 8, border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-base)", color: "var(--text-primary)", fontSize: 13, outline: "none" }} />
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button onClick={onCancel} style={{ padding: "8px 18px", borderRadius: 8, border: "1px solid var(--border-subtle)", backgroundColor: "transparent", color: "var(--text-secondary)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Cancel</button>
        <button onClick={() => canSave && onSave({ question: question.trim(), format, options: format==="multiple_choice"?options.filter(o=>o.trim()):undefined, correct_answer: correct.trim(), timer: Number(timer) })}
          disabled={!canSave || saving}
          style={{ padding: "8px 18px", borderRadius: 8, border: "none", backgroundColor: "var(--accent-indigo)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: canSave && !saving ? "pointer" : "not-allowed", opacity: canSave && !saving ? 1 : 0.45, display: "flex", alignItems: "center", gap: 6 }}>
          {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}

// ── Bulk upload ───────────────────────────────────────────────────────────────
function BulkPanel({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const [raw, setRaw] = useState("");
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");
  const handleUpload = async () => {
    setMsg("");
    let parsed: { question: string; format: "multiple_choice"|"type_answer"; options?: string[]; correct_answer: string; timer: number }[] = [];
    try {
      const t = raw.trim();
      if (t.startsWith("[")) { parsed = JSON.parse(t); }
      else {
        const lines = t.split("\n").filter(l => l.trim());
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].match(/(".*?"|[^,]+)(?=,|$)/g)?.map(c=>c.replace(/^"|"$/g,"").trim())??[];
          if (cols[0] && cols[3]) parsed.push({ question: cols[0], format: (cols[1]??"multiple_choice") as "multiple_choice"|"type_answer", options: cols[2]?cols[2].split("|").map(o=>o.trim()).filter(Boolean):undefined, correct_answer: cols[3], timer: Number(cols[4]??30)||30 });
        }
      }
    } catch { setMsg("Could not parse input."); return; }
    if (!parsed.length) { setMsg("No questions found."); return; }
    setUploading(true);
    try {
      let added = 0;
      for (const q of parsed) { await adminApi.addLibraryQuestion(q); added++; }
      setMsg(`✓ ${added} question${added!==1?"s":""} added to library`);
      setTimeout(() => { onDone(); }, 1200);
    } catch (err) { setMsg(err instanceof ApiError ? err.message : "Upload failed"); }
    finally { setUploading(false); }
  };
  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
      style={{ borderRadius: 12, padding: 18, border: "1px solid rgba(76,111,255,0.25)", backgroundColor: "var(--bg-card)", marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--accent-indigo)" }}>Bulk Upload to Library</span>
        <button onClick={onCancel} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={14} /></button>
      </div>
      <textarea value={raw} onChange={e => setRaw(e.target.value)} rows={7} placeholder='JSON array or CSV (question, format, options|pipe, correct_answer, timer)'
        style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-base)", color: "var(--text-primary)", fontSize: 12, resize: "vertical", outline: "none", fontFamily: "monospace", marginBottom: 8 }} />
      {msg && <p style={{ fontSize: 11, color: msg.startsWith("✓") ? "#34d399" : "#f87171", marginBottom: 8 }}>{msg}</p>}
      <button onClick={handleUpload} disabled={!raw.trim() || uploading}
        style={{ padding: "9px 18px", borderRadius: 8, border: "none", backgroundColor: "var(--accent-indigo)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: !raw.trim() || uploading ? "not-allowed" : "pointer", opacity: !raw.trim() || uploading ? 0.45 : 1, display: "flex", alignItems: "center", gap: 6 }}>
        {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
        {uploading ? "Uploading..." : "Upload"}
      </button>
    </motion.div>
  );
}

type SortDir = "asc"|"desc"|null;

export default function LibraryPage() {
  const [questions, setQuestions]   = useState<PackQuestion[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [sortDir, setSortDir]       = useState<SortDir>(null);
  const [showAdd, setShowAdd]       = useState(false);
  const [showBulk, setShowBulk]     = useState(false);
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

  const sorted = [...questions].sort((a,b) => sortDir==="asc" ? a.correct_rate-b.correct_rate : sortDir==="desc" ? b.correct_rate-a.correct_rate : 0);
  const cycleSortDir = () => setSortDir(d => d===null?"desc":d==="desc"?"asc":null);
  const SortIcon = sortDir==="desc" ? ArrowDown : sortDir==="asc" ? ArrowUp : ArrowUpDown;

  const handleAdd = async (data: { question: string; format: "multiple_choice"|"type_answer"; options?: string[]; correct_answer: string; timer: number }) => {
    setSaving(true);
    try { await adminApi.addLibraryQuestion(data); await load(); setShowAdd(false); }
    catch (err) { setError(err instanceof ApiError ? err.message : "Failed to add"); }
    finally { setSaving(false); }
  };
  const handleEdit = async (data: { question: string; format: "multiple_choice"|"type_answer"; options?: string[]; correct_answer: string; timer: number }) => {
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
          <button onClick={() => { setShowBulk(v => !v); setShowAdd(false); }}
            style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(76,111,255,0.3)", backgroundColor: showBulk ? "rgba(76,111,255,0.1)" : "transparent", color: "var(--accent-indigo)", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
            <Upload size={12} /> Bulk
          </button>
          <button onClick={() => { setShowAdd(true); setShowBulk(false); setEditTarget(null); }}
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
        {showBulk && <BulkPanel onDone={() => { setShowBulk(false); load(); }} onCancel={() => setShowBulk(false)} />}
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
          <div style={{ display: "grid", gridTemplateColumns: "1fr 140px 90px 90px 110px 80px", padding: "9px 16px", borderBottom: "1px solid var(--border-hairline)", backgroundColor: "var(--bg-base)" }}>
            {(["Question","Correct answer","Shown","Correct",<button key="rate" onClick={cycleSortDir} style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", color: sortDir ? "var(--accent-amber)" : "var(--text-muted)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", padding: 0 }}>Rate <SortIcon size={11} /></button>,"Actions"] as (string|React.ReactNode)[]).map((h, i) => (
              <div key={i} style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-muted)" }}>{h}</div>
            ))}
          </div>
          {sorted.map((q, i) => {
            const isEditing = editTarget?.id === q.id;
            return (
              <div key={q.id} style={{ borderBottom: i < sorted.length-1 ? "1px solid var(--border-hairline)" : "none" }}>
                {!isEditing && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 140px 90px 90px 110px 80px", padding: "11px 16px", alignItems: "center" }}>
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
                        <div style={{ height: "100%", borderRadius: 2, width: `${q.correct_rate}%`, backgroundColor: q.times_shown < 5 ? "#333" : q.correct_rate > 85 ? "#fbbf24" : q.correct_rate < 20 ? "#ef4444" : "#34d399" }} />
                      </div>
                      <span style={{ fontSize: 11, fontFamily: "monospace", color: "var(--text-secondary)", minWidth: 34, textAlign: "right" }}>{q.times_shown < 5 ? "—" : `${q.correct_rate.toFixed(0)}%`}</span>
                    </div>
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
