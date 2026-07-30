"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { adminApi, ApiError } from "@/lib/api";
import { ArrowLeft, Package } from "lucide-react";
import { SAMPLE_CATEGORIES, type SampleCategory } from "@/lib/sampleQuestions";

const inputCls =
  "w-full border rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors placeholder-gray-600 focus:border-[#4C6FFF]/60" +
  " [background-color:var(--bg-base)] [border-color:var(--border-subtle)] [color:var(--text-primary)]";

const labelCls = "block text-[10px] font-bold uppercase tracking-widest mb-1.5";

const DRAFT_KEY = "admin_pill_pack_draft_v2";

export default function CreatePillPackPage() {
  const router = useRouter();

  const persist = (patch: object) => {
    try {
      const current = JSON.parse(localStorage.getItem(DRAFT_KEY) || "{}");
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...current, ...patch }));
    } catch { /* ignore */ }
  };

  const saved = () => {
    try { return JSON.parse(localStorage.getItem(DRAFT_KEY) || "{}"); } catch { return {}; }
  };

  const [packName,     setPackName]     = useState<string>(() => saved().packName     ?? "");
  const [packCategory, setPackCategory] = useState<string>(() => saved().packCategory ?? "");
  const [packEntryFee, setPackEntryFee] = useState<number | "">(() => saved().packEntryFee ?? "");
  const [packPrize,    setPackPrize]    = useState<number | "">(() => saved().packPrize    ?? "");

  // Specials fields
  const [qCount,          setQCount]          = useState<number | "">(() => saved().qCount          ?? "");
  const [timeMins,        setTimeMins]        = useState<number | "">(() => saved().timeMins        ?? "");
  const [timeSecs,        setTimeSecs]        = useState<number | "">(() => saved().timeSecs        ?? "");
  const [requiredCorrect, setRequiredCorrect] = useState<number | "">(() => saved().requiredCorrect ?? "");
  const [targetBankSize,  setTargetBankSize]  = useState<number | "">(() => saved().targetBankSize  ?? "");
  const [maxEntries,      setMaxEntries]      = useState<number | "">(() => saved().maxEntries      ?? "");
  const [expiryOption,    setExpiryOption]    = useState<"none"|"24h"|"48h"|"7d"|"custom">(() => saved().expiryOption ?? "none");
  const [expiryCustom,    setExpiryCustom]    = useState<string>(() => saved().expiryCustom ?? "");

  const [loading,       setLoading]       = useState(false);
  const [loadingStep,   setLoadingStep]   = useState("");
  const [createSuccess, setCreateSuccess] = useState(false);
  const [error,         setError]         = useState("");
  const [sampleCategory, setSampleCategory] = useState<SampleCategory>("Mixed");

  useEffect(() => {
    if (error) window.scrollTo({ top: 0, behavior: "smooth" });
  }, [error]);

  const totalTimeSecs = (Number(timeMins) || 0) * 60 + (Number(timeSecs) || 0);

  const handleCreate = async () => {
    if (!packName.trim())     { setError("Pack name required");  return; }
    if (!packCategory.trim()) { setError("Category required");   return; }
    if (!packEntryFee || Number(packEntryFee) <= 0) { setError("Entry fee required"); return; }
    if (!packPrize    || Number(packPrize)    <= 0) { setError("Prize required");     return; }
    if (Number(requiredCorrect) > Number(qCount)) {
      setError("Pass threshold cannot exceed question count"); return;
    }
    if (expiryOption === "custom" && !expiryCustom) {
      setError("Please set a custom expiry date and time"); return;
    }

    setLoading(true); setError("");
    const idempotencyKey = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    try {
      setLoadingStep("Creating pack...");
      const packRes = await adminApi.createPillPack({
        name:          packName.trim(),
        category:      packCategory.trim(),
        entry_fee:     Number(packEntryFee),
        prize:         Number(packPrize),
        is_vip:        true,                          // always Specials
        question_count:     Number(qCount)          || 10,
        total_time_minutes: totalTimeSecs > 0 ? totalTimeSecs / 60 : 15,
        required_correct:   Number(requiredCorrect) || 8,
        ...(targetBankSize ? { target_bank_size: Number(targetBankSize) } : {}),
        ...(maxEntries     ? { max_entries:      Number(maxEntries)     } : {}),
        ...(expiryOption !== "none" ? {
          quiz_expires_at: expiryOption === "custom"
            ? new Date(expiryCustom).toISOString()
            : new Date(Date.now() + ({ "24h": 86400000, "48h": 172800000, "7d": 604800000 } as Record<string, number>)[expiryOption]).toISOString(),
        } : {}),
        idempotency_key: idempotencyKey,
      } as any);

      const packId = (packRes as any).pack?.id ?? (packRes as any).id;
      if (!packId) { setError("Pack created but no ID returned"); setLoading(false); return; }

      localStorage.removeItem(DRAFT_KEY);
      setCreateSuccess(true);
      setLoadingStep("Pack created!");
      setLoading(false);
      setTimeout(() => router.push(`/admin/pills/${packId}/bank?new=1`), 800);
    } catch (err) {
      setError(`Creation failed: ${err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Unknown error"}`);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.push("/admin/pills")}
          className="p-2 rounded-lg border transition-colors"
          style={{ borderColor: "var(--border-subtle)", color: "var(--text-secondary)" }}>
          <ArrowLeft size={16} />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <Package size={18} style={{ color: "var(--accent-amber)" }} />
            <h1 className="font-headline text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
              Create Special Pack
            </h1>
          </div>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            Exam-style pack — questions managed via Question Bank after creation
          </p>
        </div>
      </div>

      {error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="border rounded-xl p-3 text-sm whitespace-pre-line"
          style={{ borderColor: "rgba(239,68,68,0.3)", backgroundColor: "rgba(239,68,68,0.05)", color: "#ef4444" }}>
          {error}
        </motion.div>
      )}

      {createSuccess && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="border rounded-xl p-3 text-sm"
          style={{ borderColor: "rgba(52,211,153,0.3)", backgroundColor: "rgba(52,211,153,0.05)", color: "#34d399" }}>
          ✓ {loadingStep} — redirecting to question bank…
        </motion.div>
      )}

      {/* Dev tools */}
      {process.env.NODE_ENV === "development" && (
        <div className="space-y-2">
          <div className="overflow-x-auto overflow-y-hidden" style={{ WebkitOverflowScrolling: "touch" }}>
            <div className="flex items-center gap-2 flex-nowrap pb-1" style={{ minWidth: "min-content" }}>
              <span className="text-[10px] font-bold uppercase tracking-widest flex-shrink-0" style={{ color: "var(--text-muted)" }}>Category:</span>
              {SAMPLE_CATEGORIES.map((cat) => (
                <button key={cat} type="button" onClick={() => setSampleCategory(cat)}
                  className="px-1.5 py-0.5 rounded-md text-[9px] font-semibold border transition-all flex-shrink-0"
                  style={{
                    backgroundColor: sampleCategory === cat ? "rgba(232,163,61,0.15)" : "transparent",
                    borderColor:     sampleCategory === cat ? "rgba(232,163,61,0.5)"  : "var(--border-hairline)",
                    color:           sampleCategory === cat ? "var(--accent-amber)"   : "var(--text-muted)",
                  }}>
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <button type="button"
            onClick={() => {
              const cat = sampleCategory === "Mixed" ? "General" : sampleCategory;
              setPackName(`${cat} Special Challenge`);
              setPackCategory(cat);
              setPackEntryFee(500);
              setPackPrize(200000);
              setQCount(10);
              setTimeMins(4);
              setTimeSecs(0);
              setRequiredCorrect(10);
              setTargetBankSize(50);
              persist({ packName: `${cat} Special Challenge`, packCategory: cat, packEntryFee: 500, packPrize: 200000, qCount: 10, timeMins: 4, timeSecs: 0, requiredCorrect: 10, targetBankSize: 50 });
              setError("");
            }}
            className="w-full py-2 rounded-xl text-xs font-semibold border transition-colors hover:opacity-80"
            style={{ borderColor: "var(--border-hairline)", color: "var(--text-muted)", backgroundColor: "transparent" }}>
            Fill test data · {sampleCategory}
          </button>
        </div>
      )}

      {/* ── Pack Details ── */}
      <div className="border rounded-2xl p-5 space-y-4"
        style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-card)" }}>
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Pack Details</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 sm:col-span-1">
            <label className={labelCls} style={{ color: "var(--text-secondary)" }}>Pack Name *</label>
            <input className={inputCls} placeholder="e.g. hARD-cORE Biology" value={packName}
              onChange={(e) => { setPackName(e.target.value); persist({ packName: e.target.value }); }} />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className={labelCls} style={{ color: "var(--text-secondary)" }}>Category *</label>
            <input className={inputCls} placeholder="e.g. Nature & Biology" value={packCategory}
              onChange={(e) => { setPackCategory(e.target.value); persist({ packCategory: e.target.value }); }} />
          </div>
          <div>
            <label className={labelCls} style={{ color: "var(--text-secondary)" }}>Entry Fee (₦) *</label>
            <input className={inputCls} type="number" min="50" placeholder="e.g. 500" value={packEntryFee}
              onChange={(e) => { const v = e.target.value === "" ? "" : Number(e.target.value); setPackEntryFee(v); persist({ packEntryFee: v }); }} />
          </div>
          <div>
            <label className={labelCls} style={{ color: "var(--text-secondary)" }}>Prize (₦) *</label>
            <input className={inputCls} type="number" min="100" placeholder="e.g. 200000" value={packPrize}
              onChange={(e) => { const v = e.target.value === "" ? "" : Number(e.target.value); setPackPrize(v); persist({ packPrize: v }); }} />
          </div>
        </div>
      </div>

      {/* ── Exam Config ── */}
      <div className="border rounded-2xl p-5 space-y-4"
        style={{ borderColor: "rgba(232,163,61,0.3)", backgroundColor: "rgba(232,163,61,0.03)" }}>
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--accent-amber)" }}>Exam Configuration</p>

        <div className="grid grid-cols-2 gap-3">
          {/* Question Count */}
          <div>
            <label className={labelCls} style={{ color: "var(--text-secondary)" }}>Question Count *</label>
            <input className={inputCls} type="number" min="1" max="50" placeholder="e.g. 10" value={qCount}
              onChange={(e) => { const v = e.target.value === "" ? "" : Number(e.target.value); setQCount(v); persist({ qCount: v }); }} />
            <p className="text-[9px] mt-1" style={{ color: "var(--text-muted)" }}>drawn per exam from question bank</p>
          </div>

          {/* Required Correct */}
          <div>
            <label className={labelCls} style={{ color: "var(--text-secondary)" }}>Required Correct *</label>
            <input className={inputCls} type="number" min="1" placeholder="e.g. 10" value={requiredCorrect}
              onChange={(e) => { const v = e.target.value === "" ? "" : Number(e.target.value); setRequiredCorrect(v); persist({ requiredCorrect: v }); }} />
            <p className="text-[9px] mt-1" style={{ color: "var(--text-muted)" }}>pass threshold — must not exceed question count</p>
          </div>

          {/* Time Limit */}
          <div className="col-span-2">
            <label className={labelCls} style={{ color: "var(--text-secondary)" }}>Time Limit (seconds) *</label>
            <div className="flex gap-2 items-start">
              <div className="flex-1">
                <input className={inputCls} type="number" min="0" placeholder="minutes"
                  value={timeMins}
                  onChange={(e) => { const v = e.target.value === "" ? "" : Math.max(0, Number(e.target.value)); setTimeMins(v); persist({ timeMins: v }); }} />
                <p className="text-[9px] mt-1" style={{ color: "var(--text-muted)" }}>minutes</p>
              </div>
              <div className="flex-1">
                <input className={inputCls} type="number" min="0" max="59" placeholder="seconds"
                  value={timeSecs}
                  onChange={(e) => { const v = e.target.value === "" ? "" : Math.min(59, Math.max(0, Number(e.target.value))); setTimeSecs(v); persist({ timeSecs: v }); }} />
                <p className="text-[9px] mt-1" style={{ color: "var(--text-muted)" }}>seconds</p>
              </div>
              {totalTimeSecs > 0 && (
                <div className="flex items-center pt-3">
                  <span className="text-xs font-bold" style={{ color: "var(--accent-amber)", whiteSpace: "nowrap" }}>= {totalTimeSecs}s</span>
                </div>
              )}
            </div>
          </div>

          {/* Max Entries */}
          <div>
            <label className={labelCls} style={{ color: "var(--text-secondary)" }}>Max Entries <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(optional)</span></label>
            <input className={inputCls} type="number" min="1" placeholder="e.g. 100" value={maxEntries}
              onChange={(e) => { const v = e.target.value === "" ? "" : Number(e.target.value); setMaxEntries(v); persist({ maxEntries: v }); }} />
            <p className="text-[9px] mt-1" style={{ color: "var(--text-muted)" }}>player cap before entry closes</p>
          </div>

          {/* Target Bank Size */}
          <div>
            <label className={labelCls} style={{ color: "var(--text-secondary)" }}>Target Bank Size <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(optional)</span></label>
            <input className={inputCls} type="number" min="1" placeholder="e.g. 300" value={targetBankSize}
              onChange={(e) => { const v = e.target.value === "" ? "" : Number(e.target.value); setTargetBankSize(v); persist({ targetBankSize: v }); }} />
            <p className="text-[9px] mt-1" style={{ color: "var(--text-muted)" }}>visible goal for question bank coverage</p>
          </div>
        </div>

        {/* Quiz expiry window */}
        <div className="border rounded-xl p-4 space-y-3"
          style={{ borderColor: "rgba(232,163,61,0.15)", backgroundColor: "rgba(232,163,61,0.02)" }}>
          <div>
            <p className={labelCls} style={{ color: "var(--text-secondary)" }}>Quiz Expires At <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(optional)</span></p>
            <p className="text-[10px] mb-2" style={{ color: "var(--text-muted)" }}>
              Auto-blocks new entries after this window. Leave as "No expiry" for indefinite.
            </p>
            <div className="flex gap-2 flex-wrap">
              {([ ["none","No expiry"], ["24h","24h"], ["48h","48h"], ["7d","7 days"], ["custom","Custom"] ] as const).map(([val, label]) => (
                <button key={val} type="button" onClick={() => { setExpiryOption(val); persist({ expiryOption: val }); }}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                  style={{
                    backgroundColor: expiryOption === val ? "rgba(232,163,61,0.2)" : "transparent",
                    border:          expiryOption === val ? "1px solid rgba(232,163,61,0.5)" : "1px solid var(--border-hairline)",
                    color:           expiryOption === val ? "var(--accent-amber)" : "var(--text-muted)",
                  }}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          {expiryOption === "custom" && (
            <div>
              <label className={labelCls} style={{ color: "var(--text-secondary)" }}>Exact date &amp; time <span style={{ color: "#f87171" }}>*</span></label>
              <input type="datetime-local" className={inputCls} value={expiryCustom}
                onChange={(e) => { setExpiryCustom(e.target.value); persist({ expiryCustom: e.target.value }); }} />
            </div>
          )}
        </div>

        {/* Summary */}
        {qCount !== "" && requiredCorrect !== "" && (
          <div className="rounded-lg p-3 text-xs space-y-1"
            style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border-hairline)" }}>
            <p style={{ color: "var(--text-secondary)" }}>
              Players answer <strong style={{ color: "var(--text-primary)" }}>{qCount} questions</strong>
              {totalTimeSecs > 0 && <> in <strong style={{ color: "var(--text-primary)" }}>{timeMins ? `${timeMins}m ` : ""}{timeSecs ? `${timeSecs}s` : ""}</strong></>}
              {(requiredCorrect as string | number) !== "" && <> — need <strong style={{ color: "var(--accent-amber)" }}>{requiredCorrect} correct</strong> to pass and win ₦{(packPrize || 0).toLocaleString()}</>}.
            </p>
            <p style={{ color: "var(--text-muted)" }}>One attempt only. Questions bank is managed separately after creation.</p>
          </div>
        )}
      </div>

      {/* Submit */}
      <button
        onClick={handleCreate}
        disabled={loading || createSuccess}
        className="w-full py-4 rounded-xl font-black text-base transition-all disabled:opacity-50"
        style={{ backgroundColor: "var(--accent-amber)", color: "#000" }}>
        {loading ? loadingStep || "Creating…" : createSuccess ? "✓ Created!" : "Create Special Pack →"}
      </button>

      <p className="text-center text-xs" style={{ color: "var(--text-muted)" }}>
        After creation you'll land in the Question Bank to start building questions.
      </p>
    </div>
  );
}
