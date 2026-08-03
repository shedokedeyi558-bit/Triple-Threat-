"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { adminTreasureBoxApi, ApiError, type TreasureBoxSettings } from "@/lib/api";
import { Save, Loader2, AlertTriangle, Gift } from "lucide-react";

// ── RTP calculation ───────────────────────────────────────────────────────────
// RTP = (pop_limit / total_slots) × payout_multiplier × 100
// House edge = 100 - RTP
function calcRtp(totalSlots: number, popLimit: number, payoutMultiplier: number): number | null {
  if (!totalSlots || !popLimit || !payoutMultiplier || totalSlots <= 0 || popLimit <= 0 || payoutMultiplier <= 0) return null;
  if (popLimit > totalSlots) return null;
  return (popLimit / totalSlots) * payoutMultiplier * 100;
}

type RtpBand = "safe" | "caution" | "unsafe";
function rtpBand(rtp: number): RtpBand {
  if (rtp > 85) return "unsafe";
  if (rtp > 60) return "caution";
  return "safe";
}
const BAND_COLOR: Record<RtpBand, string> = {
  safe:    "#34d399",
  caution: "#fbbf24",
  unsafe:  "#f87171",
};
const BAND_BG: Record<RtpBand, string> = {
  safe:    "rgba(52,211,153,0.08)",
  caution: "rgba(251,191,36,0.08)",
  unsafe:  "rgba(239,68,68,0.08)",
};
const BAND_BORDER: Record<RtpBand, string> = {
  safe:    "rgba(52,211,153,0.2)",
  caution: "rgba(251,191,36,0.2)",
  unsafe:  "rgba(239,68,68,0.25)",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const inp = `w-full rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors`;
const inpStyle = {
  backgroundColor: "var(--bg-base)",
  border: "1px solid var(--border-subtle)",
  color: "var(--text-primary)",
};

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[10px] font-bold uppercase tracking-widest mb-1.5"
      style={{ color: "var(--text-secondary)" }}>
      {children}
    </label>
  );
}

// ── Force-save confirmation dialog ────────────────────────────────────────────
function ForceConfirmDialog({
  rtpPct,
  onConfirm,
  onCancel,
  saving,
}: {
  rtpPct: number;
  onConfirm: () => void;
  onCancel: () => void;
  saving: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{
        position: "fixed", inset: 0, zIndex: 60,
        display: "flex", alignItems: "center", justifyContent: "center",
        backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)", padding: 16,
      }}
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 400, borderRadius: 18, padding: "24px 22px",
          backgroundColor: "var(--bg-card)", border: "1px solid rgba(239,68,68,0.35)",
          display: "flex", flexDirection: "column", gap: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
            backgroundColor: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <AlertTriangle size={16} style={{ color: "#f87171" }} />
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 800, color: "var(--text-primary)", margin: "0 0 6px" }}>
              Override unsafe RTP?
            </p>
            <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.55, margin: 0 }}>
              This configuration has an RTP of{" "}
              <span style={{ fontWeight: 800, color: "#f87171" }}>{rtpPct.toFixed(1)}%</span>.
              On average, the house loses money at this setting. Players will win more than they stake.
            </p>
          </div>
        </div>
        <p style={{
          fontSize: 11, color: "#fbbf24", lineHeight: 1.55,
          backgroundColor: "rgba(251,191,36,0.07)", border: "1px solid rgba(251,191,36,0.2)",
          borderRadius: 8, padding: "10px 12px", margin: 0,
        }}>
          Are you sure? This configuration loses money on average.
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, padding: "10px 0", borderRadius: 10, fontSize: 13, fontWeight: 700,
              backgroundColor: "transparent", border: "1px solid var(--border-subtle)",
              color: "var(--text-secondary)", cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={saving}
            style={{
              flex: 1, padding: "10px 0", borderRadius: 10, fontSize: 13, fontWeight: 800,
              backgroundColor: "#ef4444", border: "none", color: "#fff",
              cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.6 : 1,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            {saving && <Loader2 size={13} className="animate-spin" />}
            {saving ? "Saving…" : "Save anyway"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function TreasureBoxSettingsPage() {
  // ── Server state ──
  const [loaded, setLoaded]   = useState(false);
  const [loadErr, setLoadErr] = useState("");

  // ── Form fields ──
  const [totalSlots,       setTotalSlots]       = useState<number | "">("");
  const [popLimit,         setPopLimit]         = useState<number | "">("");
  const [payoutMultiplier, setPayoutMultiplier] = useState<number | "">("");
  const [minStake,         setMinStake]         = useState<number | "">("");
  const [maxStake,         setMaxStake]         = useState<number | "">("");
  const [isAvailable,      setIsAvailable]      = useState(false);

  // ── Save state ──
  const [saving,           setSaving]           = useState(false);
  const [saved,            setSaved]            = useState(false);
  const [saveError,        setSaveError]        = useState("");
  const [unsafeRtpMsg,     setUnsafeRtpMsg]     = useState(""); // from backend UNSAFE_RTP
  const [showForceDialog,  setShowForceDialog]  = useState(false);

  // ── Load current settings on mount ──
  useEffect(() => {
    adminTreasureBoxApi.getSettings()
      .then((res) => {
        const s = res.data;
        setTotalSlots(s.total_slots);
        setPopLimit(s.pop_limit);
        setPayoutMultiplier(s.payout_multiplier);
        setMinStake(s.min_stake);
        setMaxStake(s.max_stake);
        setIsAvailable(s.is_available);
      })
      .catch((err) => setLoadErr(err instanceof ApiError ? err.message : "Failed to load settings"))
      .finally(() => setLoaded(true));
  }, []);

  // ── Live RTP calculation ──
  const rtp = useMemo(
    () => calcRtp(Number(totalSlots), Number(popLimit), Number(payoutMultiplier)),
    [totalSlots, popLimit, payoutMultiplier]
  );
  const band     = rtp !== null ? rtpBand(rtp)   : null;
  const houseEdge = rtp !== null ? 100 - rtp      : null;
  const rtpColor  = band ? BAND_COLOR[band]        : "var(--text-muted)";
  const rtpBg     = band ? BAND_BG[band]           : "rgba(255,255,255,0.03)";
  const rtpBorder = band ? BAND_BORDER[band]       : "var(--border-hairline)";

  // ── Validation ──
  const formValid =
    Number(totalSlots) > 0 &&
    Number(popLimit) > 0 &&
    Number(popLimit) <= Number(totalSlots) &&
    Number(payoutMultiplier) > 0 &&
    Number(minStake) > 0 &&
    Number(maxStake) >= Number(minStake);

  // ── Save (with optional force) ──
  const doSave = async (force = false) => {
    setSaving(true);
    setSaveError("");
    setUnsafeRtpMsg("");
    try {
      await adminTreasureBoxApi.saveSettings({
        total_slots:        Number(totalSlots),
        pop_limit:          Number(popLimit),
        payout_multiplier:  Number(payoutMultiplier),
        min_stake:          Number(minStake),
        max_stake:          Number(maxStake),
        is_available:       isAvailable,
        ...(force ? { force: true } : {}),
      });
      setSaved(true);
      setShowForceDialog(false);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      if (err instanceof ApiError && (err as any).code === "UNSAFE_RTP") {
        setUnsafeRtpMsg(err.message);
      } else {
        setSaveError(err instanceof ApiError ? err.message : "Save failed — try again");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSave = () => {
    if (!formValid) return;
    doSave(false);
  };

  if (!loaded) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 size={28} className="animate-spin" style={{ color: "var(--accent-indigo)" }} />
      </div>
    );
  }

  if (loadErr) {
    return (
      <div className="rounded-xl p-5 border text-sm max-w-lg"
        style={{ borderColor: "rgba(239,68,68,0.3)", backgroundColor: "rgba(239,68,68,0.05)", color: "#f87171" }}>
        {loadErr}
      </div>
    );
  }

  return (
    <>
      <AnimatePresence>
        {showForceDialog && rtp !== null && (
          <ForceConfirmDialog
            rtpPct={rtp}
            onConfirm={() => doSave(true)}
            onCancel={() => setShowForceDialog(false)}
            saving={saving}
          />
        )}
      </AnimatePresence>

      <div className="space-y-6 pb-24 max-w-2xl">

        {/* ── Header ── */}
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Gift size={18} style={{ color: "var(--accent-amber)" }} />
            <h1 className="font-headline text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>
              Treasure Box Settings
            </h1>
          </div>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Configure game parameters. RTP is calculated live as you type.
          </p>
        </div>

        {/* ── Global errors ── */}
        {saveError && (
          <div className="rounded-xl p-3 border text-sm flex items-start justify-between gap-3"
            style={{ borderColor: "rgba(239,68,68,0.3)", backgroundColor: "rgba(239,68,68,0.05)", color: "#f87171" }}>
            <span>{saveError}</span>
            <button onClick={() => setSaveError("")}
              className="font-bold text-xs flex-shrink-0 opacity-60 hover:opacity-100">✕</button>
          </div>
        )}

        {/* ── UNSAFE_RTP error from backend ── */}
        <AnimatePresence>
          {unsafeRtpMsg && (
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{
                borderRadius: 12, padding: "14px 16px",
                backgroundColor: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.3)",
                display: "flex", flexDirection: "column", gap: 12,
              }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <AlertTriangle size={15} style={{ color: "#f87171", flexShrink: 0, marginTop: 1 }} />
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#f87171", margin: "0 0 3px" }}>
                    Unsafe configuration rejected by server
                  </p>
                  <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>
                    {unsafeRtpMsg}
                  </p>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setUnsafeRtpMsg("")}
                  style={{
                    padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 700,
                    backgroundColor: "transparent", border: "1px solid var(--border-subtle)",
                    color: "var(--text-secondary)", cursor: "pointer",
                  }}>
                  Adjust settings
                </button>
                <button onClick={() => setShowForceDialog(true)}
                  style={{
                    padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 800,
                    backgroundColor: "rgba(239,68,68,0.15)", border: "2px solid rgba(239,68,68,0.4)",
                    color: "#f87171", cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 6,
                  }}>
                  <AlertTriangle size={12} />
                  Save anyway
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* ── Game mechanics ── */}
          <div className="rounded-2xl p-5 space-y-4 border md:col-span-2"
            style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}>
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
              Game Mechanics
            </p>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Total Slots</Label>
                <input type="number" min="1" placeholder="e.g. 100" value={totalSlots}
                  onChange={(e) => setTotalSlots(e.target.value === "" ? "" : Number(e.target.value))}
                  className={inp} style={inpStyle} />
                <p className="text-[9px] mt-1" style={{ color: "var(--text-muted)" }}>Total boxes per round</p>
              </div>
              <div>
                <Label>Pop Limit</Label>
                <input type="number" min="1" placeholder="e.g. 10" value={popLimit}
                  onChange={(e) => setPopLimit(e.target.value === "" ? "" : Number(e.target.value))}
                  className={inp} style={inpStyle} />
                <p className="text-[9px] mt-1" style={{ color: "var(--text-muted)" }}>
                  Winners per round
                  {Number(popLimit) > Number(totalSlots) && Number(totalSlots) > 0 && (
                    <span style={{ color: "#f87171" }}> — exceeds total slots</span>
                  )}
                </p>
              </div>
              <div>
                <Label>Payout Multiplier</Label>
                <input type="number" min="0.01" step="0.01" placeholder="e.g. 2.0" value={payoutMultiplier}
                  onChange={(e) => setPayoutMultiplier(e.target.value === "" ? "" : Number(e.target.value))}
                  className={inp} style={inpStyle} />
                <p className="text-[9px] mt-1" style={{ color: "var(--text-muted)" }}>× stake paid to winners</p>
              </div>
            </div>

            {/* ── Live RTP panel ── */}
            <div style={{
              borderRadius: 10, padding: "12px 14px",
              backgroundColor: rtpBg, border: `1px solid ${rtpBorder}`,
              transition: "all 0.2s ease",
            }}>
              {rtp === null ? (
                <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>
                  Enter total slots, pop limit, and multiplier to see live RTP.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{
                      fontSize: 20, fontWeight: 900, fontFamily: "monospace", color: rtpColor,
                    }}>
                      RTP {rtp.toFixed(1)}%
                    </span>
                    <span style={{
                      fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em",
                      padding: "2px 7px", borderRadius: 4,
                      backgroundColor: `${rtpColor}1a`, color: rtpColor,
                    }}>
                      {band === "safe" ? "Safe" : band === "caution" ? "Caution" : "⚠ Unsafe"}
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: 0 }}>
                    At these settings, players win back{" "}
                    <strong style={{ color: rtpColor }}>{rtp.toFixed(1)}%</strong> of their stake on average.
                    House edge:{" "}
                    <strong style={{ color: houseEdge! < 15 ? "#f87171" : "var(--text-primary)" }}>
                      {houseEdge!.toFixed(1)}%
                    </strong>
                    {houseEdge! < 0 && (
                      <span style={{ color: "#f87171" }}> — house loses money on average</span>
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ── Stake range ── */}
          <div className="rounded-2xl p-5 space-y-4 border"
            style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}>
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
              Stake Range (₦)
            </p>
            <div>
              <Label>Minimum Stake</Label>
              <input type="number" min="1" placeholder="e.g. 100" value={minStake}
                onChange={(e) => setMinStake(e.target.value === "" ? "" : Number(e.target.value))}
                className={inp} style={inpStyle} />
            </div>
            <div>
              <Label>Maximum Stake</Label>
              <input type="number" min="1" placeholder="e.g. 10000" value={maxStake}
                onChange={(e) => setMaxStake(e.target.value === "" ? "" : Number(e.target.value))}
                className={inp} style={inpStyle} />
              {Number(maxStake) > 0 && Number(minStake) > 0 && Number(maxStake) < Number(minStake) && (
                <p className="text-[10px] mt-1" style={{ color: "#f87171" }}>Max must be ≥ min</p>
              )}
            </div>
          </div>

          {/* ── Availability ── */}
          <div className="rounded-2xl p-5 border"
            style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: "var(--text-muted)" }}>
              Availability
            </p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  Feature enabled
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                  {isAvailable ? "Players can enter the Treasure Box" : "Hidden from players"}
                </p>
              </div>
              <button
                onClick={() => setIsAvailable((v) => !v)}
                className="w-11 h-6 rounded-full transition-colors relative flex-shrink-0"
                style={{ backgroundColor: isAvailable ? "var(--accent-amber)" : "var(--border-subtle)" }}
                aria-label={isAvailable ? "Disable Treasure Box" : "Enable Treasure Box"}
              >
                <span className="absolute top-1 w-4 h-4 rounded-full shadow transition-all"
                  style={{ backgroundColor: "#fff", left: isAvailable ? "24px" : "4px" }} />
              </button>
            </div>
          </div>

        </div>

        {/* ── Save bar ── */}
        <div className="sticky bottom-0 border-t pt-4 pb-2 -mx-6 px-6"
          style={{ borderColor: "var(--border-hairline)", backgroundColor: "var(--bg-base)" + "e6", backdropFilter: "blur(12px)" }}>
          <button
            onClick={handleSave}
            disabled={saving || !formValid}
            className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
            style={{ backgroundColor: "var(--accent-indigo)", color: "#fff" }}
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {saved ? "Saved!" : saving ? "Saving…" : "Save Settings"}
          </button>
        </div>

      </div>
    </>
  );
}
