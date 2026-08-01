"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { pillsApi, type PillPack, ApiError } from "@/lib/api";
import { Clock, Lock, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatSeconds(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return sec > 0 ? `${m}m ${sec}s` : `${m}m`;
}

function usePackExpiry(expiresAt?: string | null) {
  const [secondsLeft, setSecondsLeft] = useState<number>(() =>
    expiresAt ? Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)) : -1
  );
  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => setSecondsLeft(Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);
  if (!expiresAt) return { label: null, expired: false };
  if (secondsLeft <= 0) return { label: "Ended", expired: true };
  const h = Math.floor(secondsLeft / 3600);
  const m = Math.floor((secondsLeft % 3600) / 60);
  const s = secondsLeft % 60;
  return {
    label: h > 0 ? `Ends in ${h}h ${m}m` : m > 0 ? `Ends in ${m}m ${s}s` : `Ends in ${s}s`,
    expired: false,
  };
}

// ── Confirm bottom sheet ──────────────────────────────────────────────────────
function ConfirmSheet({ pack, balance, bonusBalance, onConfirm, onClose }: {
  pack: PillPack; balance: number; bonusBalance: number;
  onConfirm: () => void; onClose: () => void;
}) {
  const entryFee    = pack.entry_fee ?? 0;
  const prize       = pack.prize_amount ?? 0;
  const qCount      = pack.question_count ?? null;
  const rawSecs     = pack.total_time_seconds ?? (pack.time_limit_minutes != null ? pack.time_limit_minutes * 60 : null);
  const timeDisplay = rawSecs != null ? formatSeconds(rawSecs) : null;
  const passReq     = pack.required_correct ?? (pack as any).pass_threshold ?? null;
  const total       = (balance ?? 0) + (bonusBalance ?? 0);
  const canAfford   = total >= entryFee;
  const bonusUsed   = Math.min(bonusBalance ?? 0, entryFee);
  const realUsed    = entryFee - bonusUsed;
  const { label: expiryLabel, expired } = usePackExpiry(pack.quiz_expires_at);
  const canStart    = canAfford && !expired;

  const challengePhrase = qCount != null
    ? `Answer ${qCount} question${qCount !== 1 ? "s" : ""}${timeDisplay != null ? ` in ${timeDisplay}` : ""}${passReq != null ? ` — get ${passReq === qCount ? passReq : `${passReq} or more`} right to win` : " — pass to win"}.`
    : "Complete the exam — pass to win the prize.";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
      onClick={onClose}>
      <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.85)", backdropFilter: "blur(5px)" }} />
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 340, damping: 32 }}
        onClick={(e) => e.stopPropagation()}
        style={{ position: "relative", width: "100%", maxWidth: 440, borderRadius: "24px 24px 0 0", padding: "28px 24px 40px", backgroundColor: "#12141B" }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: "#333", margin: "0 auto 20px" }} />

        {/* Identity */}
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 19, fontWeight: 800, letterSpacing: "-0.01em", color: "#F5F6F8", margin: "0 0 3px" }}>{pack.name}</p>
          <p style={{ fontSize: 12, color: "#83889A", margin: 0 }}>{pack.category}</p>
        </div>

        {/* Challenge phrase */}
        <div style={{ borderRadius: 12, padding: "14px 16px", background: "linear-gradient(180deg,rgba(255,184,77,0.07),transparent)", border: "1px solid rgba(255,184,77,0.15)", marginBottom: 14 }}>
          <p style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.55, color: "#F5F6F8", margin: 0 }}>{challengePhrase}</p>
          <p style={{ fontSize: 12, color: "rgba(255,184,77,0.6)", margin: "4px 0 0" }}>One attempt only · prize paid instantly on pass</p>
        </div>

        {/* Expiry */}
        {expiryLabel && (
          <div style={{ borderRadius: 8, padding: "8px 12px", marginBottom: 12,
            backgroundColor: expired ? "rgba(239,68,68,0.08)" : "rgba(255,184,77,0.06)",
            border: `1px solid ${expired ? "rgba(239,68,68,0.2)" : "rgba(255,184,77,0.15)"}`,
            display: "flex", alignItems: "center", gap: 6 }}>
            <Clock size={12} style={{ color: expired ? "#f87171" : "#FFB84D", flexShrink: 0 }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: expired ? "#f87171" : "#FFB84D" }}>{expiryLabel}</span>
          </div>
        )}

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: qCount != null ? "1fr 1fr 1fr" : "1fr 1fr", gap: 8, marginBottom: 14 }}>
          {[
            { label: "Entry", value: `₦${entryFee.toLocaleString()}`, amber: true },
            { label: "Prize", value: `₦${prize.toLocaleString()}`, amber: true },
            ...(qCount != null ? [{ label: "Questions", value: String(qCount), amber: false }] : []),
          ].map((s) => (
            <div key={s.label} style={{ borderRadius: 10, padding: "10px 8px", textAlign: "center", border: "1px solid rgba(255,255,255,0.06)", backgroundColor: "rgba(255,255,255,0.03)" }}>
              <p style={{ fontSize: 9, color: "#4A4F5E", margin: "0 0 3px", textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</p>
              <p style={{ fontSize: 14, fontFamily: "'JetBrains Mono', monospace", fontVariantNumeric: "tabular-nums", fontWeight: 700, color: s.amber ? "#FFB84D" : "#F5F6F8", margin: 0 }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Bonus hint */}
        {bonusUsed > 0 && canAfford && !expired && (
          <p style={{ fontSize: 11, textAlign: "center", color: "#FFB84D", marginBottom: 10 }}>
            ₦{bonusUsed.toLocaleString()} from bonus credit{realUsed > 0 ? ` + ₦${realUsed.toLocaleString()} from balance` : " (fully covered)"}
          </p>
        )}
        {!canAfford && !expired && (
          <p style={{ textAlign: "center", color: "#f87171", fontSize: 13, marginBottom: 10 }}>
            Insufficient balance. <Link href="/wallet" style={{ textDecoration: "underline", fontWeight: 600 }}>Add funds</Link>
          </p>
        )}
        {expired && (
          <p style={{ textAlign: "center", color: "#f87171", fontSize: 13, fontWeight: 600, marginBottom: 10 }}>This pack has ended</p>
        )}

        <button onClick={canStart ? onConfirm : undefined} disabled={!canStart}
          style={{ width: "100%", padding: "14px 0", borderRadius: 14, border: "none",
            background: expired ? "rgba(239,68,68,0.12)" : "linear-gradient(135deg, #FFB84D, #B87A17)",
            color: expired ? "#f87171" : "#08090D",
            fontSize: 15, fontWeight: 800, cursor: canStart ? "pointer" : "not-allowed", opacity: canStart ? 1 : 0.45, marginBottom: 10 }}>
          {expired ? "Entry Closed" : `Start & Pay ₦${entryFee.toLocaleString()}`}
        </button>
        <button onClick={onClose}
          style={{ width: "100%", padding: "10px 0", border: "none", background: "none", fontSize: 13, fontWeight: 600, color: "#83889A", cursor: "pointer" }}>
          Not now
        </button>
      </motion.div>
    </motion.div>
  );
}

// ── Pack card — v4 glass panel ────────────────────────────────────────────────
function PackCard({ pack, onTap }: { pack: PillPack; onTap: () => void }) {
  const entryFee    = pack.entry_fee ?? 0;
  const prize       = pack.prize_amount ?? 0;
  const qCount      = pack.question_count ?? null;
  const rawSecs     = pack.total_time_seconds ?? (pack.time_limit_minutes != null ? pack.time_limit_minutes * 60 : null);
  const timeDisplay = rawSecs != null ? formatSeconds(rawSecs) : null;
  const { expired } = usePackExpiry(pack.quiz_expires_at);
  // Global claim status — entry_cap_reached is set by backend when entries_made >= max_entries.
  // This is identical for every player viewing the list (not per-player).
  const isClaimed   = pack.entry_cap_reached === true || expired;
  const disabled    = isClaimed;

  // Meta line: "15Q · 2m10s · ₦1,500 entry"
  const metaParts = [
    qCount != null ? `${qCount}Q` : null,
    timeDisplay,
    `₦${entryFee.toLocaleString()} entry`,
  ].filter(Boolean);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={disabled ? {} : { scale: 0.985 }}
      onClick={disabled ? undefined : onTap}
      style={{
        position: "relative",
        borderRadius: 18,
        padding: "16px",
        marginBottom: 10,
        background: `linear-gradient(180deg, rgba(255,255,255,0.06) 0%, transparent 35%), #13151D`,
        boxShadow: "0 1px 0 rgba(255,255,255,0.07) inset, 0 16px 32px -12px rgba(0,0,0,0.7)",
        border: "1px solid rgba(255,255,255,0.04)",
        display: "flex",
        alignItems: "center",
        gap: 14,
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? "default" : "pointer",
        transition: "opacity 0.2s ease",
      }}
    >
      {/* Left: info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 15.5, fontWeight: 800, letterSpacing: "-0.01em", color: "#F5F6F8", margin: "0 0 3px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {pack.name}
        </p>
        <p style={{ fontSize: 11, color: "#83889A", margin: 0 }}>
          {metaParts.map((part, i) => (
            <span key={i}>
              {i === 0 ? <b style={{ color: "#4A4F5E", fontWeight: 600 }}>{part}</b> : part}
              {i < metaParts.length - 1 && <span style={{ color: "#4A4F5E" }}> · </span>}
            </span>
          ))}
        </p>

        {/* Status chip */}
        {!isClaimed ? (
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            fontSize: 9.5, fontWeight: 700, letterSpacing: "0.02em",
            padding: "3px 8px 3px 6px", borderRadius: 100, marginTop: 8,
            backgroundColor: "rgba(74,222,128,0.12)", color: "#4ADE80",
          }}>
            <span style={{
              width: 5, height: 5, borderRadius: "50%", background: "#4ADE80",
              boxShadow: "0 0 6px rgba(74,222,128,0.8)",
              animation: "pill-pulse 1.8s infinite",
              flexShrink: 0,
            }} />
            Available
          </span>
        ) : (
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            fontSize: 9.5, fontWeight: 700, letterSpacing: "0.02em",
            padding: "3px 8px 3px 6px", borderRadius: 100, marginTop: 8,
            backgroundColor: "rgba(255,255,255,0.05)", color: "#4A4F5E",
          }}>
            <Lock size={9} style={{ flexShrink: 0 }} />
            Claimed
          </span>
        )}
      </div>

      {/* Right: prize */}
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <p style={{ fontSize: 8, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "#4A4F5E", margin: "0 0 2px" }}>Prize</p>
        <p style={{
          fontSize: 19, fontWeight: 800, lineHeight: 1,
          fontFamily: "'JetBrains Mono', monospace", fontVariantNumeric: "tabular-nums",
          ...(isClaimed
            ? { color: "#4A4F5E" }
            : { background: "linear-gradient(180deg,#FFD08A,#FFB84D 60%)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }
          ),
        }}>
          ₦{prize.toLocaleString()}
        </p>
      </div>

      {/* Lock icon (claimed only) */}
      {isClaimed && (
        <div style={{ width: 30, height: 30, borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Lock size={13} style={{ color: "#4A4F5E" }} />
        </div>
      )}
    </motion.div>
  );
}

// ── Group label ───────────────────────────────────────────────────────────────
function GroupLabel({ children, first }: { children: React.ReactNode; first?: boolean }) {
  return (
    <p style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.13em", textTransform: "uppercase", color: "#4A4F5E", padding: `${first ? 8 : 20}px 2px 10px` }}>
      {children}
    </p>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function PillsPage() {
  const router = useRouter();
  const { state } = useApp();
  const [packs, setPacks] = useState<PillPack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmPack, setConfirmPack] = useState<PillPack | null>(null);

  useEffect(() => {
    if (!state.isAuthenticated) { router.push("/auth"); return; }
    pillsApi.getSpecials()
      .then((res) => {
        const all = (res.packs ?? []).filter((p) => p.status === "active");
        all.sort((a, b) => (b.prize_amount ?? 0) - (a.prize_amount ?? 0));
        setPacks(all);
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load pill packs"))
      .finally(() => setLoading(false));
  }, [state.isAuthenticated, router]);

  if (!state.isAuthenticated) return null;

  // Group by category
  const groups = packs.reduce<Record<string, PillPack[]>>((acc, p) => {
    const key = p.category || "General";
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});

  return (
    <>
      {/* Pulse animation keyframe injected once */}
      <style>{`
        @keyframes pill-pulse {
          0%   { box-shadow: 0 0 0 0 rgba(74,222,128,0.5); }
          70%  { box-shadow: 0 0 0 6px rgba(74,222,128,0); }
          100% { box-shadow: 0 0 0 0 rgba(74,222,128,0); }
        }
      `}</style>

      <div style={{ maxWidth: 420, margin: "0 auto", padding: "0 0 80px", fontFamily: "'Inter', sans-serif" }}>

        {/* Page header */}
        <div style={{ marginBottom: 16 }}>
          <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-0.025em", color: "#F5F6F8", margin: "0 0 5px" }}>Pills</h1>
          <p style={{ fontSize: 12.5, color: "#83889A", margin: 0 }}>One pack. One shot. Winner takes it.</p>
        </div>

        {error && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 10, marginBottom: 16, backgroundColor: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", fontSize: 13 }}>
            <AlertCircle size={15} style={{ flexShrink: 0 }} /> {error}
          </div>
        )}

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ borderRadius: 18, height: 88, backgroundColor: "#12141B", animation: "pulse 1.5s infinite" }} />
            ))}
          </div>
        ) : packs.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "50vh", textAlign: "center", gap: 12 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: "rgba(255,184,77,0.07)", border: "1px solid rgba(255,184,77,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Loader2 size={24} style={{ color: "rgba(255,184,77,0.3)" }} />
            </div>
            <p style={{ fontSize: 15, fontWeight: 700, color: "#F5F6F8", margin: 0 }}>No pill packs live right now</p>
            <p style={{ fontSize: 13, color: "#83889A", margin: 0 }}>Check back soon — new packs drop regularly</p>
          </div>
        ) : (
          Object.entries(groups).map(([category, items], groupIdx) => (
            <div key={category}>
              <GroupLabel first={groupIdx === 0}>{category}</GroupLabel>
              {items.map((pack) => (
                <PackCard key={pack.id} pack={pack} onTap={() => setConfirmPack(pack)} />
              ))}
            </div>
          ))
        )}
      </div>

      {/* Confirm sheet */}
      <AnimatePresence>
        {confirmPack && (
          <ConfirmSheet
            pack={confirmPack}
            balance={state.player?.balance ?? 0}
            bonusBalance={state.player?.bonus_balance ?? 0}
            onConfirm={() => {
              const p = confirmPack;
              setConfirmPack(null);
              router.push(`/pills/vip/${p.id}/play`);
            }}
            onClose={() => setConfirmPack(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
