"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { adminApi, ApiError } from "@/lib/api";
import { ArrowLeft, Plus, Package, Trash2, CheckCircle } from "lucide-react";
import {
  generateSamplePills,
  SAMPLE_CATEGORIES,
  type SampleCategory,
} from "@/lib/sampleQuestions";

interface PillDraft {
  question: string;
  format: "multiple_choice" | "type_answer";
  options: string[];
  correct_answer: string;
  timer: number;
  color: string;
}

const PILL_COLORS = [
  "#4C6FFF", // indigo
  "#8B5CF6", // violet
  "#F59E0B", // amber
  "#10B981", // emerald
  "#EF4444", // red
  "#EC4899", // pink
];

const defaultPill = (): PillDraft => ({
  question: "",
  format: "multiple_choice",
  options: ["", "", "", ""],
  correct_answer: "",
  timer: 0,
  color: PILL_COLORS[0],
});

const inputCls =
  "w-full border rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors placeholder-gray-600 focus:border-[#4C6FFF]/60"
  + " [background-color:var(--bg-base)] [border-color:var(--border-subtle)] [color:var(--text-primary)]";

const labelCls = "block text-[10px] font-bold uppercase tracking-widest mb-1.5";

const DRAFT_KEY = "admin_pill_pack_draft";

export default function CreatePillPackPage() {
  const router = useRouter();

  // Persist to localStorage — declared first so updateDraft can reference it
  const persist = (patch: object) => {
    try {
      const current = JSON.parse(localStorage.getItem(DRAFT_KEY) || "{}");
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...current, ...patch }));
    } catch { /* ignore */ }
  };

  // Restore from localStorage once — use useState initializer so it only runs on mount
  const [packName, setPackName] = useState<string>(() => {
    try { return JSON.parse(localStorage.getItem(DRAFT_KEY) || "null")?.packName ?? ""; } catch { return ""; }
  });
  const [packCategory, setPackCategory] = useState<string>(() => {
    try { return JSON.parse(localStorage.getItem(DRAFT_KEY) || "null")?.packCategory ?? ""; } catch { return ""; }
  });
  const [packEntryFee, setPackEntryFee] = useState<number | "">(() => {
    try { return JSON.parse(localStorage.getItem(DRAFT_KEY) || "null")?.packEntryFee ?? ""; } catch { return ""; }
  });
  const [packPrize, setPackPrize] = useState<number | "">(() => {
    try { return JSON.parse(localStorage.getItem(DRAFT_KEY) || "null")?.packPrize ?? ""; } catch { return ""; }
  });
  const [pills, setPills] = useState<PillDraft[]>(() => {
    try { return JSON.parse(localStorage.getItem(DRAFT_KEY) || "null")?.pills ?? []; } catch { return []; }
  });
  const [draft, setDraft] = useState<PillDraft>(() => {
    try { return JSON.parse(localStorage.getItem(DRAFT_KEY) || "null")?.draft ?? defaultPill(); } catch { return defaultPill(); }
  });

  // Auto-persist draft — persist is defined above, safe to reference
  const updateDraft = (patch: Partial<PillDraft>) => {
    const updated = { ...draft, ...patch };
    setDraft(updated);
    persist({ draft: updated });
  };
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>("");
  const [createSuccess, setCreateSuccess] = useState(false);
  const [error, setError] = useState("");
  const [isVip, setIsVip] = useState(false);
  const [formOpen, setFormOpen] = useState(true);
  const [sampleCategory, setSampleCategory] = useState<SampleCategory>("Mixed");
  const [sampleCount, setSampleCount] = useState("5");

  // Scroll to top whenever error is set
  useEffect(() => {
    if (error) window.scrollTo({ top: 0, behavior: "smooth" });
  }, [error]);

  const addPill = () => {
    if (!draft.question.trim()) { setError("Question text required"); return; }
    if (!draft.correct_answer.trim()) { setError("Correct answer required"); return; }
    if (!draft.timer || draft.timer <= 0) { setError("Timer must be greater than 0 (e.g. 10, 30)"); return; }
    if (draft.format === "multiple_choice") {
      const filled = draft.options.filter((o) => o.trim());
      if (filled.length < 2) { setError("At least 2 options required"); return; }
    }
    const newPills = [...pills, { ...draft }];
    setPills(newPills);
    const newDraft = { ...defaultPill(), color: PILL_COLORS[newPills.length % PILL_COLORS.length] };
    setDraft(newDraft);
    persist({ pills: newPills, draft: newDraft });
    setError("");
    setFormOpen(false);
  };

  const removePill = (i: number) => {
    const newPills = pills.filter((_, idx) => idx !== i);
    setPills(newPills);
    persist({ pills: newPills });
  };

  const handleCreate = async () => {
    if (!packName.trim()) { setError("Pack name required"); return; }
    if (!packCategory.trim()) { setError("Category required"); return; }
    if (!packEntryFee || Number(packEntryFee) <= 0) { setError("Entry fee required"); return; }
    if (!packPrize || Number(packPrize) <= 0) { setError("Prize required"); return; }
    if (pills.length === 0) { setError("Add at least one pill"); return; }
    if (isVip && pills.length < 10) { setError(`VIP packs require at least 10 questions — ${pills.length} added so far`); return; }

    // Validate all pills before hitting the backend
    for (let i = 0; i < pills.length; i++) {
      const p = pills[i];
      if (!p.question.trim()) { setError(`Pill ${i + 1}: question is empty`); return; }
      if (!p.correct_answer.trim()) { setError(`Pill ${i + 1}: correct answer is empty`); return; }
      if (!p.timer || p.timer <= 0) { setError(`Pill ${i + 1}: timer must be greater than 0`); return; }
      if (p.format === "multiple_choice" && p.options.filter((o) => o.trim()).length < 2) {
        setError(`Pill ${i + 1}: multiple choice needs at least 2 options`); return;
      }
    }

    setLoading(true);
    setError("");
    // Idempotency key — prevents duplicate pack creation on double-tap/retry
    const idempotencyKey = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    // Step 1: Create pack
    let packId: string;
    try {
      setLoadingStep("Creating pack...");
      const packRes = await adminApi.createPillPack({
        name: packName.trim(),
        category: packCategory.trim(),
        entry_fee: Number(packEntryFee),
        prize: Number(packPrize),
        is_vip: isVip,
        idempotency_key: idempotencyKey,
      } as any);
      packId = (packRes as any).pack?.id ?? (packRes as any).id;
      if (!packId) {
        setError("Pack created but no ID returned from backend");
        setLoading(false);
        return;
      }
    } catch (err) {
      console.error("Pack creation failed:", err);
      setError(`Pack creation failed: ${err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Unknown error"}`);
      setLoading(false);
      return;
    }

    // Step 2: Add pills sequentially — await each fully, surface individual failures
    const failed: { index: number; question: string; error: string }[] = [];
    for (let i = 0; i < pills.length; i++) {
      setLoadingStep(`Saving pill ${i + 1} of ${pills.length}...`);
      const pill = pills[i];
      try {
        await adminApi.addPillToPack(packId, {
          question: pill.question.trim(),
          format: pill.format,
          options: pill.format === "multiple_choice" ? pill.options.filter((o) => o.trim()) : undefined,
          correct_answer: pill.correct_answer.trim(),
          timer: pill.timer,
          color: pill.color,
        });
      } catch (err) {
        const msg = err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Unknown error";
        console.error(`Pill ${i + 1} failed:`, err);
        failed.push({ index: i + 1, question: pill.question.slice(0, 40), error: msg });
      }
    }

    // If any pills failed, report them and stop — don't activate a partial pack
    if (failed.length > 0) {
      const details = failed.map((f) => `Pill ${f.index} ("${f.question}…"): ${f.error}`).join("\n");
      setError(`${failed.length} of ${pills.length} pills failed to save:\n${details}\n\nThe pack was created but not activated. Fix the issues and try again.`);
      setLoading(false);
      return;
    }

    // Step 3: All pills saved — activate the pack
    try {
      setLoadingStep("Activating pack...");
      await adminApi.updatePillPack(packId, { status: "active" });
    } catch (err) {
      setError(`All ${pills.length} pills saved but pack activation failed: ${err instanceof ApiError ? err.message : "Unknown error"}`);
      setLoading(false);
      return;
    }

    // Full success — show confirmation before navigating
    localStorage.removeItem(DRAFT_KEY);
    setCreateSuccess(true);
    setLoadingStep("Pack created!");
    setLoading(false);
    setTimeout(() => router.push("/admin/pills"), 1200);
  };

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/admin/pills")}
          className="p-2 rounded-lg border transition-colors"
          style={{ borderColor: "var(--border-subtle)", color: "var(--text-secondary)" }}
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <Package size={18} style={{ color: "var(--accent-indigo)" }} />
            <h1 className="font-headline text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
              Create Pill Pack
            </h1>
          </div>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            {pills.length} pill{pills.length !== 1 ? "s" : ""} added
          </p>
        </div>
      </div>

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

      {/* ── VIP / Standard toggle ── */}
      <div className="flex gap-2 p-1 rounded-xl border" style={{ borderColor: "var(--border-hairline)", backgroundColor: "var(--bg-card)" }}>
        <button
          type="button"
          onClick={() => setIsVip(false)}
          className="flex-1 py-2.5 rounded-lg text-sm font-bold transition-all"
          style={{
            backgroundColor: !isVip ? "var(--accent-indigo)" : "transparent",
            color: !isVip ? "#fff" : "var(--text-secondary)",
          }}
        >
          Standard Pack
        </button>
        <button
          type="button"
          onClick={() => setIsVip(true)}
          className="flex-1 py-2.5 rounded-lg text-sm font-bold transition-all"
          style={{
            backgroundColor: isVip ? "var(--accent-amber)" : "transparent",
            color: isVip ? "#000" : "var(--text-secondary)",
            boxShadow: isVip ? "0 0 12px rgba(232,163,61,0.35)" : "none",
          }}
        >
          VIP Pack
        </button>
      </div>
      {isVip && (
        <p className="text-[11px] px-1" style={{ color: "var(--accent-amber)" }}>
          VIP packs require 10+ questions. Players answer all questions sequentially to win.
          {pills.length > 0 && pills.length < 10 && ` (${pills.length}/10 added)`}
        </p>
      )}

      {/* Dev tools: category selector + count + fill button */}
      <div className="space-y-2 w-full">
        {/* Category chips — horizontally scrollable on mobile */}
        <div className="overflow-x-auto overflow-y-hidden whitespace-nowrap" style={{ WebkitOverflowScrolling: "touch", scrollBehavior: "smooth" }}>
          <div className="flex items-center gap-2 flex-nowrap pb-1" style={{ minWidth: "min-content" }}>
            <span className="text-[10px] font-bold uppercase tracking-widest flex-shrink-0" style={{ color: "var(--text-muted)" }}>
              Category:
            </span>
            {SAMPLE_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSampleCategory(cat)}
                className="px-1.5 py-0.5 rounded-md text-[9px] font-semibold border transition-all flex-shrink-0"
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
        </div>

        {/* Count + Fill row */}
        <div className="flex gap-2">
          <div className="flex items-center gap-1.5 border rounded-xl px-3" style={{ borderColor: "var(--border-hairline)" }}>
            <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>Pills:</span>
            <input
              type="number"
              min="1"
              max="20"
              value={sampleCount}
              onChange={(e) => setSampleCount(e.target.value)}
              className="w-10 bg-transparent text-xs text-center outline-none py-2"
              style={{ color: "var(--text-primary)" }}
            />
          </div>
          <button
            type="button"
            onClick={() => {
              const count = Math.max(1, Math.min(20, parseInt(sampleCount) || 5));
              const sampled = generateSamplePills(count, sampleCategory);
              const cat = sampleCategory === "Mixed" ? "General" : sampleCategory;
              setPackName(`${cat} Quick-Fire Pack`);
              setPackCategory(cat);
              setPills(
                sampled.map((q, i) => ({
                  question: q.question,
                  format: q.format,
                  options: q.options.length ? q.options : ["", "", "", ""],
                  correct_answer: q.correct_answer,
                  timer: q.timer,
                  color: PILL_COLORS[i % PILL_COLORS.length],
                }))
              );
              setPackEntryFee(sampled[0]?.entry_fee ?? 200);
              setPackPrize(sampled[0]?.prize ?? 1000);
              persist({
                packName: `${cat} Quick-Fire Pack`,
                packCategory: cat,
                packEntryFee: sampled[0]?.entry_fee ?? 200,
                packPrize: sampled[0]?.prize ?? 1000,
                pills: sampled.map((q, i) => ({
                  question: q.question,
                  format: q.format,
                  options: q.options.length ? q.options : ["", "", "", ""],
                  correct_answer: q.correct_answer,
                  timer: q.timer,
                  color: PILL_COLORS[i % PILL_COLORS.length],
                })),
                draft: defaultPill(),
              });
              setFormOpen(false);
              setError("");
            }}
            className="flex-1 py-2 rounded-xl text-xs font-semibold border transition-colors hover:opacity-80 truncate"
            style={{ borderColor: "var(--border-hairline)", color: "var(--text-muted)", backgroundColor: "transparent" }}
          >
            Fill test data · {sampleCategory}
          </button>
        </div>
      </div>

      {/* Pack Info */}
      <div
        className="border rounded-2xl p-5 space-y-4"
        style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-card)" }}
      >
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Pack Details</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls} style={{ color: "var(--text-secondary)" }}>Pack Name *</label>
            <input
              className={inputCls}
              placeholder="e.g. Science Pack 1"
              value={packName}
              onChange={(e) => { setPackName(e.target.value); persist({ packName: e.target.value }); }}
            />
          </div>
          <div>
            <label className={labelCls} style={{ color: "var(--text-secondary)" }}>Category *</label>
            <input
              className={inputCls}
              placeholder="e.g. Science"
              value={packCategory}
              onChange={(e) => { setPackCategory(e.target.value); persist({ packCategory: e.target.value }); }}
            />
          </div>
          <div>
            <label className={labelCls} style={{ color: "var(--text-secondary)" }}>Entry Fee (₦) *</label>
            <input
              className={inputCls}
              type="number"
              min="50"
              placeholder="e.g. 200"
              value={packEntryFee}
              onChange={(e) => { const v = e.target.value === "" ? "" : Number(e.target.value); setPackEntryFee(v); persist({ packEntryFee: v }); }}
            />
          </div>
          <div>
            <label className={labelCls} style={{ color: "var(--text-secondary)" }}>Prize per Pill (₦) *</label>
            <input
              className={inputCls}
              type="number"
              min="100"
              placeholder="e.g. 1000"
              value={packPrize}
              onChange={(e) => { const v = e.target.value === "" ? "" : Number(e.target.value); setPackPrize(v); persist({ packPrize: v }); }}
            />
          </div>
        </div>
        <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
          All pills in this pack share the same entry fee and prize.
        </p>
      </div>

      {/* Add Pill Form — collapsible */}
      <div
        className="border rounded-2xl overflow-hidden"
        style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-card)" }}
      >
        {/* Header — always visible, toggles the form */}
        <button
          type="button"
          onClick={() => setFormOpen((o) => !o)}
          className="w-full flex items-center justify-between px-5 py-4 text-left"
        >
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
            Add Pill
          </p>
          <span className="text-xs font-semibold" style={{ color: "var(--accent-indigo)" }}>
            {formOpen ? "▲ Collapse" : "▼ Expand"}
          </span>
        </button>

        {formOpen && (
          <div className="px-5 pb-5 space-y-4 border-t" style={{ borderColor: "var(--border-hairline)" }}>
            <div className="pt-4">
              <label className={labelCls} style={{ color: "var(--text-secondary)" }}>Question *</label>
              <textarea
                className={inputCls + " resize-none"}
                rows={2}
                placeholder="Enter question text..."
                value={draft.question}
                onChange={(e) => updateDraft({ question: e.target.value })}
              />
            </div>

            {/* Format Toggle */}
            <div>
              <label className={labelCls} style={{ color: "var(--text-secondary)" }}>Format</label>
              <div className="flex gap-2">
                {(["multiple_choice", "type_answer"] as const).map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => updateDraft({ format: fmt })}
                    className="flex-1 py-2 rounded-xl text-xs font-bold border transition-colors active:scale-95"
                    style={{
                      backgroundColor: draft.format === fmt ? "rgba(76,111,255,0.15)" : "var(--bg-base)",
                      borderColor: draft.format === fmt ? "rgba(76,111,255,0.5)" : "var(--border-subtle)",
                      color: draft.format === fmt ? "var(--accent-indigo)" : "var(--text-secondary)",
                    }}
                  >
                    {fmt === "multiple_choice" ? "Multiple Choice" : "Type Answer"}
                  </button>
                ))}
              </div>
            </div>

            {draft.format === "multiple_choice" && (
              <div>
                <label className={labelCls} style={{ color: "var(--text-secondary)" }}>Options</label>
                <div className="space-y-2">
                  {draft.options.map((opt, i) => (
                    <input
                      key={i}
                      className={inputCls}
                      placeholder={`Option ${i + 1}`}
                      value={opt}
                      onChange={(e) => {
                        const newOpts = [...draft.options];
                        newOpts[i] = e.target.value;
                        updateDraft({ options: newOpts });
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className={labelCls} style={{ color: "var(--text-secondary)" }}>Correct Answer *</label>
              <input
                className={inputCls}
                placeholder="Exact correct answer"
                value={draft.correct_answer}
                onChange={(e) => updateDraft({ correct_answer: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls} style={{ color: "var(--text-secondary)" }}>Timer (sec)</label>
                <input
                  className={inputCls}
                  type="number"
                  min="5"
                  placeholder=""
                  value={draft.timer || ""}
                  onChange={(e) => updateDraft({ timer: Number(e.target.value) })}
                />
              </div>
            </div>

            {/* Color picker */}
            <div>
              <label className={labelCls} style={{ color: "var(--text-secondary)" }}>Pill Color</label>
              <div className="flex gap-2 flex-wrap">
                {PILL_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => updateDraft({ color: c })}
                    className="w-8 h-8 rounded-full transition-all active:scale-90"
                    style={{
                      backgroundColor: c,
                      outline: draft.color === c ? `2px solid white` : "none",
                      outlineOffset: 2,
                      opacity: draft.color === c ? 1 : 0.5,
                    }}
                  />
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={addPill}
              className="w-full py-3 rounded-xl text-sm font-bold border flex items-center justify-center gap-2 transition-all hover:border-[#4C6FFF]/50 active:scale-[0.98]"
              style={{ borderColor: "var(--border-subtle)", color: "var(--text-secondary)", backgroundColor: "var(--bg-base)" }}
            >
              <Plus size={15} />
              Add Pill to Pack
            </button>
          </div>
        )}
      </div>

      {/* Pills list — fixed height scroll container so page doesn't grow */}
      {pills.length > 0 && (
        <div>
          <div className="flex items-center justify-between px-1 mb-2">
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
              Pills ({pills.length})
            </p>
            {!formOpen && (
              <button
                type="button"
                onClick={() => setFormOpen(true)}
                className="text-xs font-semibold flex items-center gap-1"
                style={{ color: "var(--accent-indigo)" }}
              >
                <Plus size={12} /> Add another
              </button>
            )}
          </div>
          <div className="space-y-2 overflow-y-auto pr-0.5" style={{ maxHeight: "320px" }}>
            {pills.map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 border rounded-xl p-3"
                style={{ borderColor: "var(--border-hairline)", backgroundColor: "var(--bg-card)" }}
              >
                <div className="w-8 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{p.question}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {p.timer}s · ✓ {p.correct_answer}
                  </p>
                </div>
                <button
                  onClick={() => removePill(i)}
                  className="p-1.5 rounded-lg flex-shrink-0 transition-colors hover:text-red-400"
                  style={{ color: "var(--text-muted)" }}
                >
                  <Trash2 size={14} />
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Publish */}
      {pills.length > 0 && packName.trim() && packCategory.trim() && (
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={handleCreate}
          disabled={loading || createSuccess}
          className="w-full py-4 rounded-xl font-black text-base flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-60"
          style={{ backgroundColor: createSuccess ? "rgba(76,111,255,0.3)" : "var(--accent-indigo)", color: "white" }}
        >
          {createSuccess ? (
            <><CheckCircle size={18} /> Pack Created!</>
          ) : loading ? (
            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin flex-shrink-0" />{loadingStep}</>
          ) : (
            <><CheckCircle size={18} />Create Pack ({pills.length} pill{pills.length !== 1 ? "s" : ""})</>
          )}
        </motion.button>
      )}
    </div>
  );
}
