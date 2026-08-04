"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { adminTreasureBoxApi, ApiError, type TreasureBoxSettings, type AdminTreasureBox } from "@/lib/api";
import { Gift, Plus, Trash2, Loader2, Save, RefreshCw, AlertTriangle } from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────
const AMBER = "#E8A33D";
const fmtNaira = (n: number | null) => n != null ? `₦${n.toLocaleString()}` : "—";
const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

function calcRtp(s: TreasureBoxSettings): number {
  if (!s.total_slots || !s.pop_limit || !s.payout_multiplier) return 0;
  return (s.pop_limit / s.total_slots) * s.payout_multiplier * 100;
}

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

  const rtp = calcRtp(settings);
  const rtpColor = rtp > 85 ? "#f87171" : rtp > 60 ? "#fbbf24" : "#34d399";

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
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  // Create form
  const [slotInput, setSlotInput] = useState<number | "">("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminTreasureBoxApi.getBoxes({ limit: 50 });
      setBoxes(res.boxes);
      setTotal(res.total);
    } catch (e) { setError(e instanceof ApiError ? `${e.status}: ${e.message}` : String(e)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (slotInput === "") { setCreateError("Enter a slot index"); return; }
    const idx = Number(slotInput);
    if (!Number.isInteger(idx) || idx < 0) { setCreateError("Slot index must be a non-negative integer"); return; }
    setCreating(true); setCreateError("");
    try {
      const res = await adminTreasureBoxApi.createBox(Number(slotInput));
      setBoxes((prev) => [res, ...prev]);
      setTotal((t) => t + 1);
      setSlotInput("");
    } catch (e) { setCreateError(e instanceof ApiError ? e.message : "Create failed"); }
    finally { setCreating(false); }
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
      {/* Create form */}
      <div className="rounded-2xl p-5 border" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}>
        <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>Create Box</p>
        <div className="flex gap-3 items-start">
          <div className="flex-1">
            <label className="block text-xs mb-1.5" style={{ color: "var(--text-secondary)" }}>
              Treasure slot index (0-based)
            </label>
            <input type="number" placeholder="e.g. 7" value={slotInput}
              onChange={(e) => setSlotInput(e.target.value === "" ? "" : Number(e.target.value))}
              className={inp} style={inpStyle} />
            {createError && <p className="text-xs mt-1" style={{ color: "#f87171" }}>{createError}</p>}
          </div>
          <button onClick={handleCreate} disabled={creating || slotInput === ""}
            style={{ marginTop: 20, padding: "12px 18px", borderRadius: 12, border: "none",
              backgroundColor: AMBER, color: "#08090D", fontSize: 13, fontWeight: 800,
              cursor: creating || slotInput === "" ? "not-allowed" : "pointer",
              opacity: slotInput === "" ? 0.45 : 1, display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            {creating ? "Creating…" : "Create"}
          </button>
        </div>
      </div>

      {/* Boxes list */}
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
                style={{ padding: "12px 20px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
                  borderBottom: i < boxes.length - 1 ? "1px solid var(--border-hairline)" : "none" }}>
                <StatusChip status={box.status} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "monospace", color: "var(--text-primary)" }}>
                      {box.total_slots}s · {box.pop_limit}p · {box.payout_multiplier}×
                    </span>
                    {box.stake != null && (
                      <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>stake {fmtNaira(box.stake)}</span>
                    )}
                    {box.outcome && (
                      <span style={{ fontSize: 10, fontWeight: 700,
                        color: box.outcome === "won" ? AMBER : "#f87171" }}>
                        {box.outcome}
                      </span>
                    )}
                    {box.player_phone && (
                      <span style={{ fontSize: 11, fontFamily: "monospace", color: "var(--text-muted)" }}>
                        {maskPhone(box.player_phone)}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 10, color: "var(--text-muted)", margin: "2px 0 0" }}>
                    Created {fmtDate(box.created_at)}
                    {box.completed_at && ` · Completed ${fmtDate(box.completed_at)}`}
                  </p>
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
