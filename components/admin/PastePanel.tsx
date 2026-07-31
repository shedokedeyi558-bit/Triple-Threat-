"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { adminApi } from "@/lib/api";
import { Loader2, X, Save, AlertCircle } from "lucide-react";
import { parseQuestions, type PastedQuestion } from "@/lib/parseQuestions";

export { type PastedQuestion };

export function PastePanel({ onDone, onCancel, onSaveOverride }: {
  onDone: () => void;
  onCancel: () => void;
  /** When provided, called instead of saving to the library. */
  onSaveOverride?: (questions: PastedQuestion[]) => Promise<void>;
}) {
  const [raw, setRaw] = useState("");
  const [parsed, setParsed] = useState<PastedQuestion[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleParse = () => {
    setParsed(parseQuestions(raw));
    setShowPreview(true);
  };

  const handleSave = async () => {
    const toSave = parsed.filter(q => !q.error && q.question.trim() && q.options.every(o => o.trim()));
    if (!toSave.length) return;
    setSaving(true);
    try {
      if (onSaveOverride) {
        await onSaveOverride(toSave);
      } else {
        for (const q of toSave) {
          await adminApi.addLibraryQuestion({
            question: q.question,
            format: "multiple_choice",
            options: q.options,
            correct_answer: q.correct_answer,
          });
        }
      }
      onDone();
    } catch {
      // silent — parent controls error display
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
        <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 10 }}>
          Paste AI-generated questions below. Format: Q: [text], A) [opt], B) [opt], C) [opt], D) [opt], Correct: [A/B/C/D]
        </p>
        <textarea value={raw} onChange={e => setRaw(e.target.value)} rows={10}
          placeholder={`Q: What is 2+2?\nA) 3\nB) 4\nC) 5\nD) 6\nCorrect: B\n\nQ: What is the capital of France?\nA) London\nB) Berlin\nC) Paris\nD) Madrid\nCorrect: C`}
          style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-base)", color: "var(--text-primary)", fontSize: 12, resize: "vertical", outline: "none", fontFamily: "monospace", marginBottom: 12 }} />
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onCancel}
            style={{ padding: "8px 18px", borderRadius: 8, border: "1px solid var(--border-subtle)", backgroundColor: "transparent", color: "var(--text-secondary)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            Cancel
          </button>
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
        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--accent-indigo)" }}>
          Preview ({validCount} valid{errorCount > 0 ? `, ${errorCount} needs fix` : ""})
        </span>
        <button onClick={() => { setShowPreview(false); setParsed([]); }}
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
          <X size={14} />
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 500, overflowY: "auto", marginBottom: 12 }}>
        {parsed.map((q, i) => {
          const hasError = q.error || !q.question.trim() || !q.options.every(o => o.trim());
          const correctText = q.options[["A", "B", "C", "D"].indexOf(q.correct_answer)];
          return (
            <div key={q.id} style={{ borderRadius: 10, border: `1px solid ${hasError ? "rgba(239,68,68,0.3)" : "rgba(52,211,153,0.2)"}`, backgroundColor: hasError ? "rgba(239,68,68,0.03)" : "rgba(52,211,153,0.02)", padding: "10px 14px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", flexShrink: 0 }}>Q{i + 1}</span>
                {hasError
                  ? <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <AlertCircle size={12} style={{ color: "#f87171", flexShrink: 0 }} />
                      <span style={{ fontSize: 10, color: "#f87171", textAlign: "right" }}>{q.error}</span>
                    </div>
                  : <span style={{ fontSize: 10, color: "#34d399", fontWeight: 700 }}>✓ Ready</span>
                }
              </div>
              <p style={{ fontSize: 12, fontWeight: 500, color: "var(--text-primary)", margin: "0 0 6px", lineHeight: 1.4 }}>
                {q.question || <em style={{ color: "var(--text-muted)" }}>No question text</em>}
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, marginBottom: 6 }}>
                {(["A", "B", "C", "D"] as const).map((letter, idx) => (
                  <span key={letter} style={{ fontSize: 11, padding: "3px 7px", borderRadius: 5,
                    backgroundColor: q.correct_answer === letter ? "rgba(52,211,153,0.12)" : "var(--bg-base)",
                    color: q.correct_answer === letter ? "#34d399" : "var(--text-secondary)",
                    border: `1px solid ${q.correct_answer === letter ? "rgba(52,211,153,0.3)" : "var(--border-hairline)"}`,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    <strong>{letter})</strong> {q.options[idx] || <em style={{ opacity: 0.4 }}>empty</em>}
                  </span>
                ))}
              </div>
              {!hasError && (
                <p style={{ fontSize: 10, color: "#34d399", margin: 0 }}>✓ Correct: {q.correct_answer}) {correctText}</p>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button onClick={() => { setShowPreview(false); setParsed([]); }}
          style={{ padding: "8px 18px", borderRadius: 8, border: "1px solid var(--border-subtle)", backgroundColor: "transparent", color: "var(--text-secondary)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
          Back to Paste
        </button>
        <button onClick={handleSave} disabled={validCount === 0 || saving}
          style={{ padding: "8px 18px", borderRadius: 8, border: "none", backgroundColor: "var(--accent-indigo)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: validCount === 0 || saving ? "not-allowed" : "pointer", opacity: validCount === 0 || saving ? 0.45 : 1, display: "flex", alignItems: "center", gap: 6 }}>
          {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
          {saving ? "Saving..." : `Save ${validCount} Question${validCount !== 1 ? "s" : ""}`}
        </button>
      </div>
    </motion.div>
  );
}
