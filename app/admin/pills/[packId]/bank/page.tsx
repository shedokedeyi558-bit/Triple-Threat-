"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { adminApi, type PackQuestion, type PillPack, ApiError } from "@/lib/api";
import {
  ChevronLeft, Plus, Pencil, Trash2, AlertTriangle,
  ArrowUpDown, ArrowUp, ArrowDown, Loader2, X, Save, BookOpen,
  Upload, Library, Copy, Check,
} from "lucide-react";
import Link from "next/link";

// ── Difficulty flag ───────────────────────────────────────────────────────────
function DifficultyFlag({ rate, shown }: { rate: number; shown: number }) {
  if (shown < 5) return <span style={{ fontSize: 9, color: "var(--text-muted)" }}>No data</span>;
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
  const pct = Math.min(100, (ratio / 3) * 100);
  const color = ratio < 1 ? "#ef4444" : ratio < 2 ? "#fbbf24" : ratio < 3 ? "#60a5fa" : "#34d399";
  const label = ratio < 1 ? "Under minimum" : ratio < 2 ? "Low coverage" : ratio < 3 ? "Good" : "Full coverage";
  return (
    <div style={{ borderRadius: 10, padding: "12px 14px", border: "1px solid var(--border-hairline)", backgroundColor: "var(--bg-card)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-muted)" }}>Bank health</span>
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
        <button onClick={onCancel} style={{ padding: "8px 18px", borderRadius: 8, border: "1px solid var(--border-subtle)", backgroundColor: "transparent", color: "var(--text-secondary)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Cancel</button>
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
          &ldquo;{question.question.slice(0, 80)}{question.question.length > 80 ? "…" : ""}&rdquo;
        </p>
        <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 18 }}>
          This removes the question from the bank. Players who already answered it are unaffected.
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: "1px solid var(--border-subtle)", backgroundColor: "transparent", color: "var(--text-secondary)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Cancel</button>
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

// ── Bulk upload panel ─────────────────────────────────────────────────────────
function BulkUploadPanel({ packId, onDone, onCancel }: { packId: string; onDone: () => void; onCancel: () => void }) {
  const [raw, setRaw] = useState("");
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ inserted: number; errors: { index: number; error: string }[] } | null>(null);
  const [parseError, setParseError] = useState("");

  const exampleCsv = `question,format,options,correct_answer,timer
"What is 2+2?",multiple_choice,"2|3|4|5",4,30
"Name a mammal",type_answer,,Dog,30`;

  const handleUpload = async () => {
    setParseError(""); setResult(null);
    let parsed: { question: string; format: "multiple_choice"|"type_answer"; options?: string[]; correct_answer: string; timer: number }[] = [];
    try {
      // Try JSON first
      const trimmed = raw.trim();
      if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
        const data = JSON.parse(trimmed);
        parsed = Array.isArray(data) ? data : [data];
      } else {
        // CSV parse — skip header
        const lines = trimmed.split("\n").filter(l => l.trim());
        const header = lines[0].toLowerCase();
        if (!header.includes("question")) { setParseError("CSV must have a header row: question, format, options, correct_answer, timer"); return; }
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].match(/(".*?"|[^,]+)(?=,|$)/g)?.map(c => c.replace(/^"|"$/g,"").trim()) ?? [];
          const q = cols[0] ?? ""; const fmt = (cols[1] ?? "multiple_choice") as "multiple_choice"|"type_answer";
          const opts = cols[2] ? cols[2].split("|").map(o=>o.trim()).filter(Boolean) : undefined;
          const ans = cols[3] ?? ""; const t = Number(cols[4] ?? 30);
          if (q && ans) parsed.push({ question: q, format: fmt, options: opts, correct_answer: ans, timer: t || 30 });
        }
      }
    } catch { setParseError("Could not parse input. Use JSON array or CSV format."); return; }
    if (parsed.length === 0) { setParseError("No questions found in input."); return; }
    setUploading(true);
    try {
      const res = await adminApi.bulkUploadQuestions(packId, parsed);
      setResult(res);
      if (res.inserted > 0) setTimeout(() => { onDone(); }, 1500);
    } catch (err) {
      setParseError(err instanceof ApiError ? err.message : "Upload failed");
    } finally { setUploading(false); }
  };

  return (
    <div style={{ borderRadius: 12, padding: 18, border: "1px solid rgba(76,111,255,0.25)", backgroundColor: "var(--bg-card)", marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Upload size={14} style={{ color: "var(--accent-indigo)" }} />
          <p style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--accent-indigo)", margin: 0 }}>Bulk Upload</p>
        </div>
        <button onClick={onCancel} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={14} /></button>
      </div>
      <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 10 }}>
        Paste JSON array or CSV. CSV format: <code style={{ backgroundColor: "#1E1E1E", padding: "1px 4px", borderRadius: 3 }}>question, format, options (pipe-separated), correct_answer, timer</code>
      </p>
      <details style={{ marginBottom: 10 }}>
        <summary style={{ fontSize: 11, color: "var(--text-muted)", cursor: "pointer" }}>Show CSV example</summary>
        <pre style={{ fontSize: 10, color: "var(--text-secondary)", backgroundColor: "#111", padding: "8px 10px", borderRadius: 6, marginTop: 6, overflowX: "auto" }}>{exampleCsv}</pre>
      </details>
      <textarea value={raw} onChange={e => setRaw(e.target.value)} rows={8} placeholder='[{"question":"...","format":"multiple_choice","options":["A","B"],"correct_answer":"A","timer":30}]'
        style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-base)", color: "var(--text-primary)", fontSize: 12, resize: "vertical", outline: "none", fontFamily: "monospace", marginBottom: 10 }} />
      {parseError && <p style={{ fontSize: 11, color: "#f87171", marginBottom: 8 }}>{parseError}</p>}
      {result && (
        <p style={{ fontSize: 11, color: result.inserted > 0 ? "#34d399" : "#f87171", marginBottom: 8 }}>
          {result.inserted > 0 ? `✓ ${result.inserted} question${result.inserted!==1?"s":""} added` : "No questions were added"}
          {result.errors.length > 0 ? ` · ${result.errors.length} error${result.errors.length!==1?"s":""}` : ""}
        </p>
      )}
      <button onClick={handleUpload} disabled={!raw.trim() || uploading}
        style={{ padding: "9px 18px", borderRadius: 8, border: "none", backgroundColor: "var(--accent-indigo)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: !raw.trim() || uploading ? "not-allowed" : "pointer", opacity: !raw.trim() || uploading ? 0.45 : 1, display: "flex", alignItems: "center", gap: 6 }}>
        {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
        {uploading ? "Uploading..." : `Upload${raw.trim() ? "" : " (paste questions first)"}`}
      </button>
    </div>
  );
}

// ── Clone from pack modal ─────────────────────────────────────────────────────
function CloneModal({ packId, currentPackId, onDone, onCancel }: {
  packId: string; currentPackId: string; onDone: () => void; onCancel: () => void;
}) {
  const [packs, setPacks] = useState<{ id: string; name: string }[]>([]);
  const [selected, setSelected] = useState("");
  const [cloning, setCloning] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    adminApi.getPillPacks().then(r => setPacks((r.packs ?? []).filter((p: PillPack) => p.id !== currentPackId).map((p: PillPack) => ({ id: p.id, name: p.name })))).catch(() => {});
  }, [currentPackId]);
  const handleClone = async () => {
    if (!selected) return;
    setCloning(true); setError("");
    try {
      await adminApi.cloneBankFromPack(packId, selected);
      onDone();
    } catch (err) { setError(err instanceof ApiError ? err.message : "Clone failed"); }
    finally { setCloning(false); }
  };
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)", padding: 16 }}
      onClick={onCancel}>
      <motion.div initial={{ scale: 0.92 }} animate={{ scale: 1 }} exit={{ scale: 0.92 }}
        onClick={e => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 400, borderRadius: 16, padding: "24px 22px", backgroundColor: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <Copy size={16} style={{ color: "var(--accent-indigo)" }} />
          <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Clone bank from another pack</p>
        </div>
        <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 14 }}>
          Copies all questions from the selected pack into this pack&apos;s bank as a starting point.
        </p>
        <select value={selected} onChange={e => setSelected(e.target.value)}
          style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-base)", color: "var(--text-primary)", fontSize: 13, outline: "none", marginBottom: 14 }}>
          <option value="">Select source pack…</option>
          {packs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        {error && <p style={{ fontSize: 11, color: "#f87171", marginBottom: 10 }}>{error}</p>}
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: "1px solid var(--border-subtle)", backgroundColor: "transparent", color: "var(--text-secondary)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Cancel</button>
          <button onClick={handleClone} disabled={!selected || cloning}
            style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: "none", backgroundColor: "var(--accent-indigo)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: !selected || cloning ? "not-allowed" : "pointer", opacity: !selected || cloning ? 0.45 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            {cloning ? <Loader2 size={12} className="animate-spin" /> : <Copy size={12} />}
            {cloning ? "Cloning..." : "Clone Bank"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Import from library modal ─────────────────────────────────────────────────
function ImportLibraryModal({ packId, onDone, onCancel }: { packId: string; onDone: () => void; onCancel: () => void }) {
  const [libQ, setLibQ] = useState<PackQuestion[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    adminApi.getLibraryQuestions().then(r => setLibQ(r.questions ?? [])).catch(() => {});
  }, []);
  const toggle = (id: string) => setSelected(s => { const n = new Set(s); if (n.has(id)) { n.delete(id); } else { n.add(id); } return n; });
  const handleImport = async () => {
    if (selected.size === 0) return;
    setImporting(true); setError("");
    try { await adminApi.importFromLibrary(packId, Array.from(selected)); onDone(); }
    catch (err) { setError(err instanceof ApiError ? err.message : "Import failed"); }
    finally { setImporting(false); }
  };
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)", padding: 16 }}
      onClick={onCancel}>
      <motion.div initial={{ scale: 0.92 }} animate={{ scale: 1 }} exit={{ scale: 0.92 }}
        onClick={e => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 520, borderRadius: 16, padding: "24px 22px", backgroundColor: "var(--bg-card)", border: "1px solid var(--border-subtle)", maxHeight: "80vh", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Library size={16} style={{ color: "var(--accent-amber)" }} />
            <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Import from Library</p>
          </div>
          <button onClick={onCancel} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={14} /></button>
        </div>
        <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 12 }}>
          {selected.size > 0 ? `${selected.size} selected` : "Select questions to import into this pack"} ·{" "}
          <Link href="/admin/library" style={{ color: "var(--accent-amber)", textDecoration: "none" }} target="_blank">Open Library</Link>
        </p>
        <div style={{ flex: 1, overflowY: "auto", border: "1px solid var(--border-hairline)", borderRadius: 8, marginBottom: 14 }}>
          {libQ.length === 0 ? (
            <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--text-muted)" }}>
              <Library size={24} style={{ margin: "0 auto 8px", display: "block", opacity: 0.4 }} />
              <p style={{ fontSize: 13 }}>Library is empty</p>
              <Link href="/admin/library" style={{ fontSize: 12, color: "var(--accent-amber)" }} target="_blank">Add questions to library →</Link>
            </div>
          ) : libQ.map((q, i) => (
            <div key={q.id} onClick={() => toggle(q.id)}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", cursor: "pointer", borderBottom: i < libQ.length-1 ? "1px solid var(--border-hairline)" : "none",
                backgroundColor: selected.has(q.id) ? "rgba(232,163,61,0.06)" : "transparent" }}>
              <div style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${selected.has(q.id) ? "var(--accent-amber)" : "var(--border-subtle)"}`, backgroundColor: selected.has(q.id) ? "var(--accent-amber)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {selected.has(q.id) && <Check size={10} style={{ color: "#000" }} />}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 12, fontWeight: 500, color: "var(--text-primary)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{q.question}</p>
                <p style={{ fontSize: 10, color: "var(--text-muted)", margin: "2px 0 0" }}>{q.format === "multiple_choice" ? "MCQ" : "Type"} · ✓ {q.correct_answer}</p>
              </div>
            </div>
          ))}
        </div>
        {error && <p style={{ fontSize: 11, color: "#f87171", marginBottom: 8 }}>{error}</p>}
        <button onClick={handleImport} disabled={selected.size === 0 || importing}
          style={{ padding: "11px 0", borderRadius: 8, border: "none", backgroundColor: "var(--accent-amber)", color: "#000", fontSize: 13, fontWeight: 700, cursor: selected.size === 0 || importing ? "not-allowed" : "pointer", opacity: selected.size === 0 || importing ? 0.45 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          {importing ? <Loader2 size={13} className="animate-spin" /> : <Library size={13} />}
          {importing ? "Importing..." : `Import ${selected.size > 0 ? selected.size : ""} question${selected.size !== 1 ? "s" : ""}`}
        </button>
      </motion.div>
    </motion.div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
type SortDir = "asc" | "desc" | null;

export default function QuestionBankPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isNew = searchParams.get("new") === "1";
  const packId = params.packId as string;

  const [packName, setPackName]           = useState("");
  const [questionCount, setQuestionCount] = useState<number | null>(null);
  const [questions, setQuestions]         = useState<PackQuestion[]>([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState("");
  const [sortDir, setSortDir]             = useState<SortDir>(null);
  const [editTarget, setEditTarget]       = useState<PackQuestion | null>(null);
  const [deleteTarget, setDeleteTarget]   = useState<PackQuestion | null>(null);
  const [showAdd, setShowAdd]             = useState(false);
  const [showBulk, setShowBulk]           = useState(false);
  const [showClone, setShowClone]         = useState(false);
  const [showImport, setShowImport]       = useState(false);
  const [saving, setSaving]               = useState(false);
  const [deleting, setDeleting]           = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await adminApi.getPackQuestions(packId);
      setPackName(res.pack.name);
      setQuestionCount(res.pack.question_count);
      setQuestions(res.questions);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load question bank");
    } finally { setLoading(false); }
  }, [packId]);

  useEffect(() => { load(); }, [load]);

  const sorted = [...questions].sort((a, b) =>
    sortDir === "asc" ? a.correct_rate - b.correct_rate :
    sortDir === "desc" ? b.correct_rate - a.correct_rate : 0
  );
  const cycleSortDir = () => setSortDir(d => d === null ? "desc" : d === "desc" ? "asc" : null);
  const SortIcon = sortDir === "desc" ? ArrowDown : sortDir === "asc" ? ArrowUp : ArrowUpDown;

  const handleAdd = async (data: Parameters<typeof adminApi.addPillToPack>[1]) => {
    setSaving(true);
    try { await adminApi.addPillToPack(packId, { ...data, color: "#4C6FFF" }); await load(); setShowAdd(false); }
    catch (err) { setError(err instanceof ApiError ? err.message : "Failed to add question"); }
    finally { setSaving(false); }
  };
  const handleEdit = async (data: Parameters<typeof adminApi.addPillToPack>[1]) => {
    if (!editTarget) return;
    setSaving(true);
    try { await adminApi.updatePackQuestion(packId, editTarget.id, data); await load(); setEditTarget(null); }
    catch (err) { setError(err instanceof ApiError ? err.message : "Failed to save question"); }
    finally { setSaving(false); }
  };
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try { await adminApi.deletePackQuestion(packId, deleteTarget.id); setQuestions(prev => prev.filter(q => q.id !== deleteTarget.id)); setDeleteTarget(null); }
    catch (err) { setError(err instanceof ApiError ? err.message : "Failed to delete question"); }
    finally { setDeleting(false); }
  };

  const tooEasy   = questions.filter(q => q.times_shown >= 5 && q.correct_rate > 85).length;
  const checkThis = questions.filter(q => q.times_shown >= 5 && q.correct_rate < 20).length;

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", paddingBottom: 60 }}>
      {/* Header — stacked layout prevents text/button collision on mobile */}
      <div style={{ marginBottom: 20 }}>
        {/* Row 1: back button + pack name */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <button onClick={() => router.push("/admin/pills")}
            style={{ padding: "6px 8px", borderRadius: 8, border: "1px solid var(--border-subtle)", backgroundColor: "transparent", cursor: "pointer", display: "flex", alignItems: "center", flexShrink: 0 }}>
            <ChevronLeft size={16} style={{ color: "var(--text-secondary)" }} />
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
            <BookOpen size={15} style={{ color: "var(--accent-indigo)", flexShrink: 0 }} />
            <h1 style={{ fontSize: 17, fontWeight: 800, color: "var(--text-primary)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {loading ? "Loading…" : `${packName} — Question Bank`}
            </h1>
          </div>
        </div>
        {/* Row 2: count + flags, then action buttons below */}
        <div style={{ paddingLeft: 38 }}>
          <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "0 0 10px" }}>
            {questions.length} question{questions.length !== 1 ? "s" : ""} in bank
            {tooEasy > 0 && <span style={{ color: "#fbbf24", marginLeft: 8 }}>· {tooEasy} too easy</span>}
            {checkThis > 0 && <span style={{ color: "#f87171", marginLeft: 8 }}>· {checkThis} to review</span>}
          </p>
          {/* Action buttons — wrap naturally on narrow screens */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <button onClick={() => { setShowBulk(v => !v); setShowAdd(false); }}
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(76,111,255,0.3)", backgroundColor: showBulk ? "rgba(76,111,255,0.1)" : "transparent", color: "var(--accent-indigo)", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
              <Upload size={12} /> Bulk
            </button>
            <button onClick={() => setShowImport(true)}
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(232,163,61,0.3)", backgroundColor: "transparent", color: "var(--accent-amber)", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
              <Library size={12} /> Library
            </button>
            <button onClick={() => setShowClone(true)}
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border-subtle)", backgroundColor: "transparent", color: "var(--text-secondary)", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
              <Copy size={12} /> Clone
            </button>
            <button onClick={() => { setShowAdd(true); setShowBulk(false); setEditTarget(null); }}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", borderRadius: 9, border: "none", backgroundColor: "var(--accent-indigo)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              <Plus size={13} /> Add
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "10px 12px", borderRadius: 8, marginBottom: 14, border: "1px solid rgba(239,68,68,0.3)", backgroundColor: "rgba(239,68,68,0.05)", color: "#f87171", fontSize: 12 }}>
          <span>{error}</span>
          <button onClick={() => setError("")} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", flexShrink: 0 }}><X size={13} /></button>
        </div>
      )}

      {/* Bank health */}
      {!loading && <div style={{ marginBottom: 16 }}><BankHealth total={questions.length} questionCount={questionCount} /></div>}

      {/* Bulk upload */}
      <AnimatePresence>
        {showBulk && <BulkUploadPanel packId={packId} onDone={() => { setShowBulk(false); load(); }} onCancel={() => setShowBulk(false)} />}
      </AnimatePresence>

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
        /* Empty state — special onboarding prompt for newly created packs */
        <div style={{ borderRadius: 14, padding: "40px 24px", textAlign: "center", border: `1px solid ${isNew ? "rgba(232,163,61,0.3)" : "var(--border-hairline)"}`, backgroundColor: isNew ? "rgba(232,163,61,0.04)" : "var(--bg-card)" }}>
          <BookOpen size={32} style={{ margin: "0 auto 16px", display: "block", color: isNew ? "var(--accent-amber)" : "var(--text-muted)", opacity: isNew ? 1 : 0.4 }} />
          {isNew ? (
            <>
              <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>Pack created! Now build your question bank.</p>
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 20 }}>Add questions using any of these methods:</p>
              <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
                <button onClick={() => setShowBulk(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 9, border: "1px solid rgba(76,111,255,0.3)", backgroundColor: "rgba(76,111,255,0.08)", color: "var(--accent-indigo)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                  <Upload size={13} /> Bulk upload CSV/JSON
                </button>
                <button onClick={() => setShowImport(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 9, border: "1px solid rgba(232,163,61,0.3)", backgroundColor: "rgba(232,163,61,0.08)", color: "var(--accent-amber)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                  <Library size={13} /> Import from Library
                </button>
                <button onClick={() => setShowClone(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 9, border: "1px solid var(--border-subtle)", backgroundColor: "transparent", color: "var(--text-secondary)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                  <Copy size={13} /> Clone from another pack
                </button>
                <button onClick={() => setShowAdd(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 9, border: "1px solid var(--border-subtle)", backgroundColor: "transparent", color: "var(--text-secondary)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                  <Plus size={13} /> Add one by one
                </button>
              </div>
            </>
          ) : (
            <>
              <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>No questions yet</p>
              <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Add questions to build the bank</p>
            </>
          )}
        </div>
      ) : (
        <div style={{ borderRadius: 12, border: "1px solid var(--border-hairline)", overflow: "hidden", backgroundColor: "var(--bg-card)" }}>
          {/* Table header */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 140px 90px 90px 110px 80px", gap: 0, padding: "9px 16px", borderBottom: "1px solid var(--border-hairline)", backgroundColor: "var(--bg-base)" }}>
            {([
              { label: "Question" },
              { label: "Correct answer" },
              { label: "Shown" },
              { label: "Correct" },
              { label: <button onClick={cycleSortDir} style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", color: sortDir ? "var(--accent-indigo)" : "var(--text-muted)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", padding: 0 }}>Rate <SortIcon size={11} /></button> },
              { label: "Actions" },
            ] as { label: string | React.ReactNode }[]).map((col, i) => (
              <div key={i} style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-muted)" }}>{col.label}</div>
            ))}
          </div>
          {sorted.map((q, i) => {
            const isEditing = editTarget?.id === q.id;
            const flag = q.times_shown >= 5 ? (q.correct_rate > 85 ? "easy" : q.correct_rate < 20 ? "check" : null) : null;
            return (
              <div key={q.id} style={{ borderBottom: i < sorted.length-1 ? "1px solid var(--border-hairline)" : "none",
                backgroundColor: flag === "easy" ? "rgba(251,191,36,0.03)" : flag === "check" ? "rgba(239,68,68,0.03)" : "transparent" }}>
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
                        <div style={{ height: "100%", borderRadius: 2, width: `${q.correct_rate}%`, backgroundColor: q.times_shown < 5 ? "#333" : q.correct_rate > 85 ? "#fbbf24" : q.correct_rate < 20 ? "#ef4444" : "#34d399" }} />
                      </div>
                      <span style={{ fontSize: 11, fontFamily: "monospace", color: "var(--text-secondary)", minWidth: 34, textAlign: "right" }}>{q.times_shown < 5 ? "—" : `${q.correct_rate.toFixed(0)}%`}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <button onClick={() => { setEditTarget(q); setShowAdd(false); setShowBulk(false); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 6, color: "var(--text-muted)" }} title="Edit"><Pencil size={13} /></button>
                      <button onClick={() => setDeleteTarget(q)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 6, color: "var(--text-muted)" }} title="Delete"><Trash2 size={13} /></button>
                    </div>
                  </div>
                )}
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

      {/* Modals */}
      <AnimatePresence>
        {deleteTarget && <DeleteConfirm question={deleteTarget} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} deleting={deleting} />}
        {showClone && <CloneModal packId={packId} currentPackId={packId} onDone={() => { setShowClone(false); load(); }} onCancel={() => setShowClone(false)} />}
        {showImport && <ImportLibraryModal packId={packId} onDone={() => { setShowImport(false); load(); }} onCancel={() => setShowImport(false)} />}
      </AnimatePresence>
    </div>
  );
}
