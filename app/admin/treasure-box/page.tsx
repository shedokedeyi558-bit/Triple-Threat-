"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { adminTreasureBoxApi, ApiError, type TreasureBoxSettings, type AdminTreasureBox } from "@/lib/api";
import { Gift, Plus, Trash2, Loader2, Save, RefreshCw, AlertTriangle, X } from "lucide-react";

// ── Combinatorics RTP (mirrors settings page formula) ────────────────────────
// P(win) = 1 - C(N - T, P) / C(N, P)
// RTP    = P(win) × payout_multiplier × 100
function logFactorial(n: number): number {
  let r = 0;
  for (let i = 2; i <= n; i++) r += Math.log(i);
  return r;
}
function logComb(n: number, k: number): number {
  if (k < 0 || k > n) return -Infinity;
  if (k === 0 || k === n) return 0;
  return logFactorial(n) - logFactorial(k) - logFactorial(n - k);
}
function calcBoxRtp(totalSlots: number, popLimit: number, payoutMultiplier: number, numTreasures: number): number | null {
  const N = totalSlots, T = numTreasures, P = popLimit;
  if (N <= 0 || T <= 0 || P <= 0 || T > N || P > N) return null;
  const pwin = N - T < P ? 1 : 1 - Math.exp(logComb(N - T, P) - logComb(N, P));
  return pwin * payoutMultiplier * 100;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const AMBER = "#E8A33D";
const UNSAFE_RTP_THRESHOLD = 90; // matches backend
const fmtNaira = (n: number | null) => n != null ? `₦${n.toLocaleString()}` : "—";
const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

const inp = "w-full rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors";
const inpStyle = { backgroundColor: "var(--bg-base)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)" };

// ── Status chip ───────────────────────────────────────────────────────────────
function StatusChip({ status }: { status: string }) {
  const cfg: Record<string, { bg: string; color: string }> = {
    available: { bg: "rgba(74,222,128,0.12)", color: "#4ADE80" },
    claimed:   { bg: "rgba(232,163,61,0.12)",  color: AMBER },
    completed: { bg: "rgba(255,255,255,0.06)",  color: "var(--text-muted)" },
  };
  const c = cfg[status] ?? cfg.completed;
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 100,
      backgroundColor: c.bg, color: c.color }}>
      {status}
    </span>
  );
}

// ── Settings section ──────────────────────────────────────────────────────────
function SettingsSection({ onSaved }: { onSaved: () => void }) {
  const [settings, setSettings] = useState<TreasureBoxSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [unsafeMsg, setUnsafeMsg] = useState("");
  const [showForce, setShowForce] = useState(false);

  useEffect(() => {
    adminTreasureBoxApi.getSettings()
      .then((r) => setSettings(r))
      .catch((e) => setError(e instanceof ApiError ? `${e.status}: ${e.message}` : String(e)))
      .finally(() => setLoading(false));
  }, []);

  const upd = <K extends keyof TreasureBoxSettings>(k: K, v: TreasureBoxSettings[K]) =>
    setSettings((s) => s ? { ...s, [k]: v } : s);

  const doSave = async (force = false) => {
    if (!settings) return;
    setSaving(true); setError(""); setUnsafeMsg("");
    try {
      const res = await adminTreasureBoxApi.saveSettings({ ...settings, ...(force ? { force: true } : {}) });
      setSettings(res);
      setSaved(true); setShowForce(false);
      setTimeout(() => setSaved(false), 2500);
      onSaved();
    } catch (e) {
      if (e instanceof ApiError && (e as any).code === "UNSAFE_RTP") setUnsafeMsg(e.message);
      else setError(e instanceof ApiError ? e.message : "Save failed");
    } finally { setSaving(false); }
  };

  if (loading) return <div className="h-40 rounded-xl animate-pulse" style={{ backgroundColor: "var(--bg-card)" }} />;
  if (!settings) return <p className="text-sm" style={{ color: "#f87171" }}>{error || "Settings unavailable"}</p>;

  const rtp = calcBoxRtp(settings.total_slots, settings.pop_limit, settings.payout_multiplier, 1) ?? 0;
  const rtpColor = rtp > UNSAFE_RTP_THRESHOLD ? "#f87171" : rtp > 60 ? "#fbbf24" : "#34d399";

  return (
    <div className="rounded-2xl p-5 space-y-4 border" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}>
      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Settings</p>

      {error && <p className="text-sm" style={{ color: "#f87171" }}>{error}</p>}

      {/* UNSAFE_RTP error */}
      <AnimatePresence>
        {unsafeMsg && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ borderRadius: 10, padding: "12px 14px", backgroundColor: "rgba(239,68,68,0.07)",
              border: "1px solid rgba(239,68,68,0.3)", display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", gap: 8 }}>
              <AlertTriangle size={14} style={{ color: "#f87171", flexShrink: 0, marginTop: 1 }} />
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: "#f87171", margin: "0 0 3px" }}>Server rejected — unsafe RTP</p>
                <p style={{ fontSize: 11, color: "var(--text-secondary)", margin: 0 }}>{unsafeMsg}</p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setUnsafeMsg("")}
                style={{ padding: "7px 14px", borderRadius: 8, fontSize: 11, fontWeight: 700, border: "1px solid var(--border-subtle)", backgroundColor: "transparent", color: "var(--text-secondary)", cursor: "pointer" }}>
                Adjust
              </button>
              <button onClick={() => setShowForce(true)}
                style={{ padding: "7px 14px", borderRadius: 8, fontSize: 11, fontWeight: 800, border: "2px solid rgba(239,68,68,0.4)", backgroundColor: "rgba(239,68,68,0.12)", color: "#f87171", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                <AlertTriangle size={11} /> Save anyway
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showForce && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center",
              backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)", padding: 16 }}
            onClick={() => setShowForce(false)}>
            <motion.div initial={{ scale: 0.92 }} animate={{ scale: 1 }} exit={{ scale: 0.92 }}
              onClick={(e) => e.stopPropagation()}
              style={{ width: "100%", maxWidth: 380, borderRadius: 18, padding: "24px 22px", backgroundColor: "var(--bg-card)", border: "1px solid rgba(239,68,68,0.35)", display: "flex", flexDirection: "column", gap: 14 }}>
              <p style={{ fontSize: 14, fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>Override unsafe RTP?</p>
              <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: 0, lineHeight: 1.55 }}>
                RTP is <strong style={{ color: "#f87171" }}>{rtp.toFixed(1)}%</strong>. Are you sure? <strong>This configuration loses money on average.</strong>
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setShowForce(false)}
                  style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "1px solid var(--border-subtle)", backgroundColor: "transparent", color: "var(--text-secondary)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                  Cancel
                </button>
                <button onClick={() => doSave(true)} disabled={saving}
                  style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "none", backgroundColor: "#ef4444", color: "#fff", fontSize: 12, fontWeight: 800, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  {saving && <Loader2 size={12} className="animate-spin" />} Save anyway
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-3 gap-3">
        {[
          { key: "total_slots" as const, label: "Total Slots" },
          { key: "pop_limit" as const, label: "Pop Limit" },
          { key: "payout_multiplier" as const, label: "Payout ×", step: 0.01 },
        ].map(({ key, label, step }) => (
          <div key={key}>
            <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "var(--text-secondary)" }}>{label}</label>
            <input type="number" min="0" step={step ?? 1} value={settings[key] as number}
              onChange={(e) => upd(key, Number(e.target.value))}
              className={inp} style={inpStyle} />
          </div>
        ))}
      </div>

      {/* Live RTP */}
      <div style={{ borderRadius: 10, padding: "10px 14px", backgroundColor: "var(--bg-base)", border: `1px solid ${rtpColor}33` }}>
        <span style={{ fontSize: 16, fontWeight: 900, fontFamily: "monospace", color: rtpColor }}>RTP {rtp.toFixed(1)}%</span>
        <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 8 }}>House edge: {(100 - rtp).toFixed(1)}%</span>
        {settings.rtp_percent != null && Math.abs(settings.rtp_percent - rtp) > 0.5 && (
          <span style={{ fontSize: 10, color: "var(--text-muted)", marginLeft: 8 }}>(server: {settings.rtp_percent.toFixed(1)}%)</span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { key: "min_stake" as const, label: "Min Stake (₦)" },
          { key: "max_stake" as const, label: "Max Stake (₦)" },
        ].map(({ key, label }) => (
          <div key={key}>
            <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "var(--text-secondary)" }}>{label}</label>
            <input type="number" min="0" value={settings[key] as number}
              onChange={(e) => upd(key, Number(e.target.value))}
              className={inp} style={inpStyle} />
          </div>
        ))}
      </div>

      {/* Availability */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Feature enabled</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
            {settings.is_available ? "Players can claim boxes" : "Hidden from players"}
          </p>
        </div>
        <button onClick={() => upd("is_available", !settings.is_available)}
          className="w-11 h-6 rounded-full transition-colors relative flex-shrink-0"
          style={{ backgroundColor: settings.is_available ? AMBER : "var(--border-subtle)" }}>
          <span className="absolute top-1 w-4 h-4 rounded-full shadow transition-all"
            style={{ backgroundColor: "#fff", left: settings.is_available ? "24px" : "4px" }} />
        </button>
      </div>

      <button onClick={() => doSave(false)} disabled={saving}
        className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
        style={{ backgroundColor: "var(--accent-indigo)", color: "#fff" }}>
        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
        {saved ? "Saved!" : saving ? "Saving…" : "Save Settings"}
      </button>
    </div>
  );
}

// ── Boxes section ─────────────────────────────────────────────────────────────
function BoxesSection() {
  const [boxes, setBoxes] = useState<AdminTreasureBox[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<{ total_slots: number; pop_limit: number; payout_multiplier: number } | null>(null);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  // Create form — array of slot indexes
  const [slotIndexes, setSlotIndexes] = useState<number[]>([]);
  const [slotInput, setSlotInput] = useState<number | "">("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  // UNSAFE_RTP force-confirm for box creation
  const [unsafeRtp, setUnsafeRtp] = useState<{ msg: string; rtpPct: number } | null>(null);
  const [showForceCreate, setShowForceCreate] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [res, cfg] = await Promise.all([
        adminTreasureBoxApi.getBoxes({ limit: 50 }),
        adminTreasureBoxApi.getSettings(),
      ]);
      setBoxes(res.boxes);
      setTotal(res.total);
      setSettings({ total_slots: cfg.total_slots, pop_limit: cfg.pop_limit, payout_multiplier: cfg.payout_multiplier });
    } catch (e) { setError(e instanceof ApiError ? `${e.status}: ${e.message}` : String(e)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Max treasures cap: floor(total_slots / 2)
  const maxTreasures = settings ? Math.floor(settings.total_slots / 2) : Infinity;
  const atCap = slotIndexes.length >= maxTreasures;

  // Live client-side RTP preview for the create form
  const previewRtp = settings && slotIndexes.length > 0
    ? calcBoxRtp(settings.total_slots, settings.pop_limit, settings.payout_multiplier, slotIndexes.length)
    : null;
  const previewUnsafe = previewRtp !== null && previewRtp > UNSAFE_RTP_THRESHOLD;

  const addSlot = () => {
    if (slotInput === "") { setCreateError("Enter a slot index"); return; }
    const idx = Number(slotInput);
    if (!Number.isInteger(idx) || idx < 0) { setCreateError("Slot index must be a non-negative integer"); return; }
    if (settings && idx >= settings.total_slots) { setCreateError(`Index must be 0–${settings.total_slots - 1}`); return; }
    if (slotIndexes.includes(idx)) { setCreateError("This index is already added"); return; }
    if (atCap) { setCreateError(`Max ${maxTreasures} treasure(s) for ${settings?.total_slots}-slot box`); return; }
    setSlotIndexes((prev) => [...prev, idx]);
    setSlotInput("");
    setCreateError("");
  };

  const removeSlot = (idx: number) => setSlotIndexes((prev) => prev.filter((v) => v !== idx));

  const doCreate = async (force = false) => {
    setCreating(true); setCreateError(""); setUnsafeRtp(null);
    try {
      const res = await adminTreasureBoxApi.createBox({ treasure_slot_indexes: slotIndexes, ...(force ? { force: true } : {}) });
      setBoxes((prev) => [res, ...prev]);
      setTotal((t) => t + 1);
      setSlotIndexes([]);
      setShowForceCreate(false);
    } catch (e) {
      if (e instanceof ApiError && (e as any).code === "UNSAFE_RTP") {
        const body = (e as any).body ?? {};
        setUnsafeRtp({ msg: e.message, rtpPct: body.rtp_percent ?? previewRtp ?? 0 });
      } else {
        setCreateError(e instanceof ApiError ? e.message : "Create failed");
      }
    } finally { setCreating(false); }
  };

  const handleCreate = () => {
    if (slotIndexes.length === 0) { setCreateError("Add at least one slot index"); return; }
    doCreate(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this box?")) return;
    setDeleting(id);
    try {
      await adminTreasureBoxApi.deleteBox(id);
      setBoxes((prev) => prev.filter((b) => b.id !== id));
      setTotal((t) => t - 1);
    } catch (e) { setError(e instanceof ApiError ? e.message : "Delete failed"); }
    finally { setDeleting(null); }
  };

  const maskPhone = (ph: string | null) =>
    ph && ph.length >= 8 ? `${ph.slice(0, 4)}***${ph.slice(-4)}` : ph ?? "—";

  return (
    <div className="space-y-4">
      {/* ── Force-create confirm dialog (UNSAFE_RTP) ── */}
      <AnimatePresence>
        {showForceCreate && unsafeRtp && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center",
              justifyContent: "center", backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)", padding: 16 }}
            onClick={() => setShowForceCreate(false)}>
            <motion.div initial={{ scale: 0.92 }} animate={{ scale: 1 }} exit={{ scale: 0.92 }}
              onClick={(e) => e.stopPropagation()}
              style={{ width: "100%", maxWidth: 380, borderRadius: 18, padding: "24px 22px",
                backgroundColor: "var(--bg-card)", border: "1px solid rgba(239,68,68,0.35)",
                display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                  backgroundColor: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)",
                  display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <AlertTriangle size={16} style={{ color: "#f87171" }} />
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 800, color: "var(--text-primary)", margin: "0 0 6px" }}>
                    Override unsafe RTP?
                  </p>
                  <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.55, margin: 0 }}>
                    This box has an RTP of{" "}
                    <strong style={{ color: "#f87171" }}>{unsafeRtp.rtpPct.toFixed(1)}%</strong>.
                    The house loses money on average at this setting.
                  </p>
                </div>
              </div>
              <p style={{ fontSize: 11, color: "#fbbf24", lineHeight: 1.55,
                backgroundColor: "rgba(251,191,36,0.07)", border: "1px solid rgba(251,191,36,0.2)",
                borderRadius: 8, padding: "10px 12px", margin: 0 }}>
                {unsafeRtp.msg}
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setShowForceCreate(false)}
                  style={{ flex: 1, padding: "10px 0", borderRadius: 10, fontSize: 12, fontWeight: 700,
                    backgroundColor: "transparent", border: "1px solid var(--border-subtle)",
                    color: "var(--text-secondary)", cursor: "pointer" }}>Cancel</button>
                <button onClick={() => doCreate(true)} disabled={creating}
                  style={{ flex: 1, padding: "10px 0", borderRadius: 10, fontSize: 12, fontWeight: 800,
                    backgroundColor: "#ef4444", border: "none", color: "#fff",
                    cursor: creating ? "not-allowed" : "pointer", opacity: creating ? 0.6 : 1,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  {creating && <Loader2 size={12} className="animate-spin" />}
                  {creating ? "Creating…" : "Create anyway"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Create form ── */}
      <div className="rounded-2xl p-5 border" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}>
        <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>Create Box</p>

        {/* Slot index input + add button */}
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs mb-1.5" style={{ color: "var(--text-secondary)" }}>
              Add treasure slot index (0-based)
              {settings && (
                <span style={{ color: "var(--text-muted)", marginLeft: 6 }}>
                  max {maxTreasures} treasure{maxTreasures !== 1 ? "s" : ""} for {settings.total_slots}-slot box
                </span>
              )}
            </label>
            <input type="number" placeholder="e.g. 7" value={slotInput}
              min={0} max={settings ? settings.total_slots - 1 : undefined}
              disabled={atCap}
              onChange={(e) => setSlotInput(e.target.value === "" ? "" : Number(e.target.value))}
              onKeyDown={(e) => e.key === "Enter" && addSlot()}
              className={inp} style={{ ...inpStyle, opacity: atCap ? 0.5 : 1 }} />
          </div>
          <button onClick={addSlot} disabled={atCap || slotInput === ""}
            style={{ padding: "12px 14px", borderRadius: 12, border: "none",
              backgroundColor: atCap ? "var(--border-subtle)" : "var(--accent-indigo)",
              color: atCap ? "var(--text-muted)" : "#fff", fontSize: 13, fontWeight: 700,
              cursor: atCap || slotInput === "" ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
            <Plus size={14} /> Add
          </button>
        </div>

        {/* Chip list of added slot indexes */}
        {slotIndexes.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
            {slotIndexes.map((idx) => (
              <span key={idx} style={{ display: "inline-flex", alignItems: "center", gap: 4,
                padding: "3px 8px 3px 10px", borderRadius: 100,
                backgroundColor: "rgba(232,163,61,0.12)", border: "1px solid rgba(232,163,61,0.3)",
                color: AMBER, fontSize: 11, fontWeight: 700, fontFamily: "monospace" }}>
                {idx}
                <button onClick={() => removeSlot(idx)}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 0, lineHeight: 1,
                    color: AMBER, opacity: 0.7, display: "flex", alignItems: "center" }}>
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Live RTP preview for this specific box */}
        {previewRtp !== null && (
          <div style={{ marginTop: 10, borderRadius: 8, padding: "8px 12px",
            backgroundColor: previewUnsafe ? "rgba(239,68,68,0.07)" : "rgba(255,255,255,0.03)",
            border: `1px solid ${previewUnsafe ? "rgba(239,68,68,0.25)" : "var(--border-hairline)"}` }}>
            <span style={{ fontSize: 13, fontWeight: 800, fontFamily: "monospace",
              color: previewUnsafe ? "#f87171" : previewRtp > 60 ? "#fbbf24" : "#34d399" }}>
              Box RTP {previewRtp.toFixed(1)}%
            </span>
            <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 8 }}>
              {slotIndexes.length} treasure{slotIndexes.length !== 1 ? "s" : ""}
              {previewUnsafe && " · exceeds 90% — will require force"}
            </span>
          </div>
        )}

        {createError && <p className="text-xs mt-2" style={{ color: "#f87171" }}>{createError}</p>}

        {/* UNSAFE_RTP inline banner (after rejection) */}
        <AnimatePresence>
          {unsafeRtp && !showForceCreate && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ marginTop: 10, borderRadius: 10, padding: "12px 14px",
                backgroundColor: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.3)",
                display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", gap: 8 }}>
                <AlertTriangle size={14} style={{ color: "#f87171", flexShrink: 0, marginTop: 1 }} />
                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "#f87171", margin: "0 0 3px" }}>
                    Server rejected — unsafe RTP ({unsafeRtp.rtpPct.toFixed(1)}%)
                  </p>
                  <p style={{ fontSize: 11, color: "var(--text-secondary)", margin: 0 }}>{unsafeRtp.msg}</p>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setUnsafeRtp(null)}
                  style={{ padding: "7px 14px", borderRadius: 8, fontSize: 11, fontWeight: 700,
                    border: "1px solid var(--border-subtle)", backgroundColor: "transparent",
                    color: "var(--text-secondary)", cursor: "pointer" }}>Adjust</button>
                <button onClick={() => setShowForceCreate(true)}
                  style={{ padding: "7px 14px", borderRadius: 8, fontSize: 11, fontWeight: 800,
                    border: "2px solid rgba(239,68,68,0.4)", backgroundColor: "rgba(239,68,68,0.12)",
                    color: "#f87171", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                  <AlertTriangle size={11} /> Create anyway
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button onClick={handleCreate} disabled={creating || slotIndexes.length === 0}
          style={{ marginTop: 14, width: "100%", padding: "12px 0", borderRadius: 12, border: "none",
            backgroundColor: AMBER, color: "#08090D", fontSize: 13, fontWeight: 800,
            cursor: creating || slotIndexes.length === 0 ? "not-allowed" : "pointer",
            opacity: slotIndexes.length === 0 ? 0.4 : 1,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          {creating ? "Creating…" : `Create Box${slotIndexes.length > 0 ? ` (${slotIndexes.length} treasure${slotIndexes.length !== 1 ? "s" : ""})` : ""}`}
        </button>
      </div>

      {/* ── Boxes list ── */}
      <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border-hairline)" }}>
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
            All Boxes <span style={{ color: "var(--text-secondary)" }}>({total})</span>
          </p>
          <button onClick={load} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4 }}>
            <RefreshCw size={13} />
          </button>
        </div>

        {error && <p className="px-5 py-3 text-sm" style={{ color: "#f87171" }}>{error}</p>}

        {loading ? (
          <div className="p-5 flex justify-center"><Loader2 size={20} className="animate-spin" style={{ color: AMBER }} /></div>
        ) : boxes.length === 0 ? (
          <p className="px-5 py-6 text-sm text-center" style={{ color: "var(--text-muted)" }}>No boxes yet — create one above.</p>
        ) : (
          <div>
            {boxes.map((box, i) => (
              <div key={box.id}
                style={{ padding: "12px 20px", display: "flex", alignItems: "flex-start", gap: 12, flexWrap: "wrap",
                  borderBottom: i < boxes.length - 1 ? "1px solid var(--border-hairline)" : "none" }}>
                <div style={{ paddingTop: 2 }}><StatusChip status={box.status} /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Row 1: config + stake + outcome + phone */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "monospace", color: "var(--text-primary)" }}>
                      {box.total_slots}s · {box.pop_limit}p · {box.payout_multiplier}×
                    </span>
                    {/* num_treasures — always present */}
                    <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 4,
                      backgroundColor: "rgba(232,163,61,0.10)", color: AMBER, fontWeight: 700 }}>
                      {box.num_treasures} treasure{box.num_treasures !== 1 ? "s" : ""}
                    </span>
                    {/* rtp_percent — always present */}
                    {box.rtp_percent != null && (() => {
                      const unsafe = box.rtp_percent > UNSAFE_RTP_THRESHOLD;
                      return (
                        <span style={{ fontSize: 10, fontWeight: 700, fontFamily: "monospace",
                          color: unsafe ? "#f87171" : box.rtp_percent > 60 ? "#fbbf24" : "#34d399" }}>
                          RTP {box.rtp_percent.toFixed(1)}%
                        </span>
                      );
                    })()}
                    {box.stake != null && (
                      <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>stake {fmtNaira(box.stake)}</span>
                    )}
                    {box.outcome && (
                      <span style={{ fontSize: 10, fontWeight: 700, color: box.outcome === "won" ? AMBER : "#f87171" }}>
                        {box.outcome}
                      </span>
                    )}
                    {box.player_phone && (
                      <span style={{ fontSize: 11, fontFamily: "monospace", color: "var(--text-muted)" }}>
                        {maskPhone(box.player_phone)}
                      </span>
                    )}
                  </div>
                  {/* Row 2: dates */}
                  <p style={{ fontSize: 10, color: "var(--text-muted)", margin: "2px 0 0" }}>
                    Created {fmtDate(box.created_at)}
                    {box.completed_at && ` · Completed ${fmtDate(box.completed_at)}`}
                  </p>
                  {/* Row 3: treasure_slot_indexes — ONLY when status === 'completed' AND field present */}
                  {box.status === "completed" && box.treasure_slot_indexes && box.treasure_slot_indexes.length > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 4, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em",
                        color: "var(--text-muted)" }}>slots</span>
                      {box.treasure_slot_indexes.map((idx) => (
                        <span key={idx} style={{ fontSize: 10, fontWeight: 700, fontFamily: "monospace",
                          padding: "1px 6px", borderRadius: 4,
                          backgroundColor: "rgba(52,211,153,0.10)", color: "#34d399" }}>
                          {idx}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {box.status === "available" && (
                  <button onClick={() => handleDelete(box.id)} disabled={deleting === box.id}
                    style={{ padding: "5px 10px", borderRadius: 8, border: "1px solid rgba(239,68,68,0.25)",
                      backgroundColor: "rgba(239,68,68,0.07)", color: "#f87171", cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, flexShrink: 0,
                      opacity: deleting === box.id ? 0.5 : 1 }}>
                    {deleting === box.id ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
                    Delete
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminTreasureBoxPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="space-y-6 max-w-3xl pb-16">
      <div className="flex items-center gap-2">
        <Gift size={18} style={{ color: AMBER }} />
        <h1 className="text-2xl font-black text-white">Treasure Box</h1>
      </div>

      <SettingsSection onSaved={() => setRefreshKey((k) => k + 1)} />
      <BoxesSection key={refreshKey} />
    </div>
  );
}
