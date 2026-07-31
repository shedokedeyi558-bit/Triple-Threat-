"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { pillsApi, type PillPack, ApiError } from "@/lib/api";
import { hasAttempted } from "@/lib/attemptedSpecials";
import { Clock, Package, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";

// ── Live expiry countdown ─────────────────────────────────────────────────
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

// ── Confirm bottom sheet ──────────────────────────────────────────────────
function ConfirmSheet({ pack, balance, bonusBalance, onConfirm, onClose }: {
  pack: PillPack; balance: number; bonusBalance: number;
  onConfirm: () => void; onClose: () => void;
}) {
  const entryFee = pack.entry_fee ?? 0;
  const prize    = pack.prize_amount ?? 0;
  const qCount   = pack.question_count ?? null;
  const timeMins = pack.time_limit_minutes ?? null;
  const passReq  = pack.required_correct ?? (pack as any).pass_threshold ?? null;
  const total    = (balance ?? 0) + (bonusBalance ?? 0);
  const canAfford = total >= entryFee;
  const bonusUsed = Math.min(bonusBalance ?? 0, entryFee);
  const realUsed  = entryFee - bonusUsed;
  const { label: expiryLabel, expired } = usePackExpiry(pack.quiz_expires_at);
  const canStart = canAfford && !expired;

  const challengePhrase = qCount != null
    ? `Answer ${qCount} question${qCount !== 1 ? "s" : ""}${timeMins != null ? ` in ${timeMins} minute${timeMins !== 1 ? "s" : ""}` : ""}${passReq != null ? ` — get ${passReq === qCount ? passReq : `${passReq} or more`} right to win` : " — pass to win"}.`
    : "Complete the exam — pass to win the prize.";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
      onClick={onClose}>
      <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.85)", backdropFilter: "blur(5px)" }} />
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 340, damping: 32 }}
        onClick={(e) => e.stopPropagation()}
        style={{ position: "relative", width: "100%", maxWidth: 440, borderRadius: "24px 24px 0 0", padding: "28px 24px 40px", backgroundColor: "var(--bg-card)" }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: "#333", margin: "0 auto 20px" }} />

        {/* Identity */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: "rgba(232,163,61,0.12)", border: "1px solid rgba(232,163,61,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Package size={20} style={{ color: "var(--accent-amber)" }} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
              <span style={{ fontSize: 8, fontWeight: 800, padding: "2px 6px", borderRadius: 3, textTransform: "uppercase", letterSpacing: "0.07em", backgroundColor: "rgba(232,163,61,0.15)", color: "var(--accent-amber)" }}>SPECIAL</span>
              <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>{pack.name}</p>
            </div>
            <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: 0 }}>{pack.category}</p>
          </div>
        </div>

        {/* Challenge phrase */}
        <div style={{ borderRadius: 12, padding: "14px 16px", backgroundColor: "rgba(232,163,61,0.06)", border: "1px solid rgba(232,163,61,0.2)", marginBottom: 14 }}>
          <p style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.55, color: "var(--text-primary)", margin: 0 }}>{challengePhrase}</p>
          <p style={{ fontSize: 12, color: "rgba(232,163,61,0.65)", margin: "4px 0 0" }}>One attempt only · prizes paid instantly on pass</p>
        </div>

        {/* Expiry */}
        {expiryLabel && (
          <div style={{ borderRadius: 8, padding: "8px 12px", marginBottom: 12, backgroundColor: expired ? "rgba(239,68,68,0.08)" : "rgba(232,163,61,0.06)", border: `1px solid ${expired ? "rgba(239,68,68,0.2)" : "rgba(232,163,61,0.15)"}`, display: "flex", alignItems: "center", gap: 6 }}>
            <Clock size={12} style={{ color: expired ? "#f87171" : "var(--accent-amber)", flexShrink: 0 }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: expired ? "#f87171" : "var(--accent-amber)" }}>{expiryLabel}</span>
          </div>
        )}

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: qCount != null ? "1fr 1fr 1fr" : "1fr 1fr", gap: 8, marginBottom: 14 }}>
          <div style={{ borderRadius: 10, padding: "10px 8px", textAlign: "center", border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-base)" }}>
            <p style={{ fontSize: 9, color: "var(--text-muted)", margin: "0 0 3px", textTransform: "uppercase" }}>Entry</p>
            <p style={{ fontSize: 14, fontFamily: "monospace", fontWeight: 700, color: "var(--accent-amber)", margin: 0 }}>₦{entryFee.toLocaleString()}</p>
          </div>
          <div style={{ borderRadius: 10, padding: "10px 8px", textAlign: "center", border: "1px solid rgba(232,163,61,0.3)", backgroundColor: "rgba(232,163,61,0.06)" }}>
            <p style={{ fontSize: 9, color: "var(--text-muted)", margin: "0 0 3px", textTransform: "uppercase" }}>Prize</p>
            <p style={{ fontSize: 14, fontFamily: "monospace", fontWeight: 700, color: "var(--accent-amber)", margin: 0 }}>₦{prize.toLocaleString()}</p>
          </div>
          {qCount != null && (
            <div style={{ borderRadius: 10, padding: "10px 8px", textAlign: "center", border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-base)" }}>
              <p style={{ fontSize: 9, color: "var(--text-muted)", margin: "0 0 3px", textTransform: "uppercase" }}>Questions</p>
              <p style={{ fontSize: 14, fontFamily: "monospace", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>{qCount}</p>
            </div>
          )}
        </div>

        {/* Bonus breakdown */}
        {bonusUsed > 0 && canAfford && !expired && (
          <p style={{ fontSize: 11, textAlign: "center", color: "var(--accent-amber)", marginBottom: 10 }}>
            ₦{bonusUsed.toLocaleString()} from bonus credit{realUsed > 0 ? ` + ₦${realUsed.toLocaleString()} from balance` : " (fully covered)"}
          </p>
        )}
        {!canAfford && !expired && (
          <p style={{ textAlign: "center", color: "#f87171", fontSize: 13, marginBottom: 10 }}>
            Insufficient balance. <Link href="/wallet" style={{ textDecoration: "underline", fontWeight: 600 }}>Add funds</Link>
          </p>
        )}
        {expired && (
          <p style={{ textAlign: "center", color: "#f87171", fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
            This special has ended
          </p>
        )}

        <button onClick={canStart ? onConfirm : undefined} disabled={!canStart}
          style={{ width: "100%", padding: "14px 0", borderRadius: 11, border: "none", backgroundColor: expired ? "rgba(239,68,68,0.12)" : "var(--accent-amber)", color: expired ? "#f87171" : "#000", fontSize: 14, fontWeight: 800, cursor: canStart ? "pointer" : "not-allowed", opacity: canStart ? 1 : 0.45, marginBottom: 10 }}>
          {expired ? "Entry Closed" : `Start & Pay ₦${entryFee.toLocaleString()}`}
        </button>
        <button onClick={onClose}
          style={{ width: "100%", padding: "10px 0", border: "none", background: "none", fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", cursor: "pointer" }}>
          Not now
        </button>
      </motion.div>
    </motion.div>
  );
}

// ── Full-width pack card ───────────────────────────────────────────────────
function PackCard({ pack, playerId, onTap }: {
  pack: PillPack; playerId: string | null; onTap: () => void;
}) {
  const entryFee = pack.entry_fee ?? 0;
  const prize    = pack.prize_amount ?? 0;
  const qCount   = pack.question_count ?? null;
  const timeMins = pack.time_limit_minutes ?? null;
  const passReq  = pack.required_correct ?? (pack as any).pass_threshold ?? null;
  const { label: expiryLabel, expired } = usePackExpiry(pack.quiz_expires_at);
  const isAttempted = pack.user_attempted === true || hasAttempted(playerId, pack.id);
  const disabled = isAttempted || expired;

  const challengePhrase = qCount != null
    ? `Answer ${qCount} question${qCount !== 1 ? "s" : ""}${timeMins != null ? ` in ${timeMins} minute${timeMins !== 1 ? "s" : ""}` : ""}${passReq != null ? ` — get ${passReq === qCount ? passReq : `${passReq} or more`} right to win` : " — pass to win"}.`
    : "Complete the exam — pass to win the prize.";

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      style={{ borderRadius: 18, overflow: "hidden", border: `1px solid ${isAttempted ? "rgba(139,92,246,0.35)" : expired ? "rgba(239,68,68,0.25)" : "rgba(232,163,61,0.3)"}`, backgroundColor: "var(--bg-card)", opacity: disabled ? 0.7 : 1 }}>

      {/* Top stripe */}
      <div style={{ height: 3, background: isAttempted ? "rgba(139,92,246,0.6)" : expired ? "rgba(239,68,68,0.5)" : "linear-gradient(90deg, transparent, rgba(232,163,61,0.8), #FFD060, rgba(232,163,61,0.8), transparent)" }} />

      <div style={{ padding: "18px 18px 0" }}>
        {/* Header row — name + badges */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 4 }}>
              <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 4, textTransform: "uppercase", letterSpacing: "0.07em", backgroundColor: "rgba(232,163,61,0.15)", color: "var(--accent-amber)" }}>SPECIAL</span>
              <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{pack.category}</span>
              {isAttempted && (
                <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 4, textTransform: "uppercase", letterSpacing: "0.06em", backgroundColor: "rgba(139,92,246,0.2)", color: "#c084fc" }}>Attempted</span>
              )}
              {expiryLabel && (
                <span style={{ fontSize: 9, fontWeight: 600, color: expired ? "#f87171" : "var(--accent-amber)", display: "flex", alignItems: "center", gap: 3 }}>
                  <Clock size={9} /> {expiryLabel}
                </span>
              )}
            </div>
            <p style={{ fontSize: 18, fontWeight: 800, color: isAttempted ? "#c084fc" : "var(--text-primary)", margin: 0, lineHeight: 1.25 }}>{pack.name}</p>
          </div>
          {/* Prize — top right */}
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <p style={{ fontSize: 9, color: "var(--text-muted)", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Prize</p>
            <p style={{ fontSize: 20, fontFamily: "monospace", fontWeight: 900, color: "var(--accent-amber)", margin: 0 }}>₦{prize.toLocaleString()}</p>
          </div>
        </div>

        {/* Challenge phrase */}
        <div style={{ borderRadius: 10, padding: "12px 14px", backgroundColor: "rgba(232,163,61,0.05)", border: "1px solid rgba(232,163,61,0.15)", marginBottom: 14 }}>
          <p style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.55, color: "var(--text-primary)", margin: 0 }}>{challengePhrase}</p>
          <p style={{ fontSize: 11, color: "rgba(232,163,61,0.6)", margin: "3px 0 0" }}>One attempt only · prizes paid instantly on pass</p>
        </div>

        {/* Stats row */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <div style={{ flex: 1, borderRadius: 8, padding: "8px 10px", textAlign: "center", backgroundColor: "var(--bg-base)", border: "1px solid var(--border-hairline)" }}>
            <p style={{ fontSize: 9, color: "var(--text-muted)", margin: "0 0 2px", textTransform: "uppercase" }}>Entry</p>
            <p style={{ fontSize: 14, fontFamily: "monospace", fontWeight: 700, color: "var(--accent-amber)", margin: 0 }}>₦{entryFee.toLocaleString()}</p>
          </div>
          {qCount != null && (
            <div style={{ flex: 1, borderRadius: 8, padding: "8px 10px", textAlign: "center", backgroundColor: "var(--bg-base)", border: "1px solid var(--border-hairline)" }}>
              <p style={{ fontSize: 9, color: "var(--text-muted)", margin: "0 0 2px", textTransform: "uppercase" }}>Questions</p>
              <p style={{ fontSize: 14, fontFamily: "monospace", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>{qCount}</p>
            </div>
          )}
          {timeMins != null && (
            <div style={{ flex: 1, borderRadius: 8, padding: "8px 10px", textAlign: "center", backgroundColor: "var(--bg-base)", border: "1px solid var(--border-hairline)" }}>
              <p style={{ fontSize: 9, color: "var(--text-muted)", margin: "0 0 2px", textTransform: "uppercase" }}>Time</p>
              <p style={{ fontSize: 14, fontFamily: "monospace", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>{timeMins}m</p>
            </div>
          )}
        </div>
      </div>

      {/* CTA footer */}
      <motion.button
        whileTap={disabled ? {} : { scale: 0.98 }}
        onClick={disabled ? undefined : onTap}
        disabled={disabled}
        style={{
          width: "100%", padding: "14px 0", border: "none",
          backgroundColor: isAttempted ? "rgba(139,92,246,0.15)" : expired ? "rgba(239,68,68,0.1)" : "var(--accent-amber)",
          color: isAttempted ? "#c084fc" : expired ? "#f87171" : "#000",
          fontSize: 14, fontWeight: 800, cursor: disabled ? "not-allowed" : "pointer",
          borderTop: `1px solid ${isAttempted ? "rgba(139,92,246,0.2)" : expired ? "rgba(239,68,68,0.15)" : "rgba(232,163,61,0.3)"}`,
        }}>
        {isAttempted ? "Already Attempted" : expired ? "Entry Closed" : `Start & Pay ₦${entryFee.toLocaleString()}`}
      </motion.button>
    </motion.div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────
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
        // Sort by prize descending — biggest prizes first
        all.sort((a, b) => (b.prize_amount ?? 0) - (a.prize_amount ?? 0));
        setPacks(all);
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load challenges"))
      .finally(() => setLoading(false));
  }, [state.isAuthenticated, router]);

  if (!state.isAuthenticated) return null;

  const playerId = state.player?.id ?? null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-28">

      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: "var(--text-primary)", margin: "0 0 4px" }}>Challenges</h1>
        <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>One shot. Sharp minds only.</p>
      </div>

      {error && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 10, marginBottom: 16, backgroundColor: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171", fontSize: 13 }}>
          <AlertCircle size={15} style={{ flexShrink: 0 }} /> {error}
        </div>
      )}

      {loading ? (
        /* Skeleton */
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse" style={{ borderRadius: 18, height: 280, backgroundColor: "var(--bg-card)", border: "1px solid var(--border-hairline)" }} />
          ))}
        </div>
      ) : packs.length === 0 ? (
        /* Empty state — full-screen centred, no card wrapper */
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "55vh", textAlign: "center", gap: 12 }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: "rgba(232,163,61,0.08)", border: "1px solid rgba(232,163,61,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Loader2 size={28} style={{ color: "rgba(232,163,61,0.3)" }} />
          </div>
          <p style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>No challenges live right now</p>
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>Check back soon — new challenges drop regularly</p>
        </div>
      ) : (
        /* Full-width cards, one per pack, no section labels */
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {packs.map((pack) => (
            <PackCard key={pack.id} pack={pack} playerId={playerId} onTap={() => setConfirmPack(pack)} />
          ))}
        </div>
      )}

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
    </div>
  );
}
