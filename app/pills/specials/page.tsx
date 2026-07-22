"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { pillsApi, type PillPack, ApiError } from "@/lib/api";
import { ChevronLeft, ClipboardCheck, ArrowRight, Clock, AlertCircle, Package } from "lucide-react";
import Link from "next/link";

// ── Live expiry countdown for quiz_expires_at ─────────────────────────────
function usePackExpiry(expiresAt?: string | null) {
  const [secondsLeft, setSecondsLeft] = useState<number>(() =>
    expiresAt ? Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)) : -1
  );
  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => {
      const s = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
      setSecondsLeft(s);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);
  if (!expiresAt) return { label: null, expired: false };
  if (secondsLeft <= 0) return { label: "Ended", expired: true };
  const h = Math.floor(secondsLeft / 3600);
  const m = Math.floor((secondsLeft % 3600) / 60);
  const s = secondsLeft % 60;
  const label = h > 0 ? `Ends in ${h}h ${m}m` : m > 0 ? `Ends in ${m}m ${s}s` : `Ends in ${s}s`;
  return { label, expired: false };
}

// ── Special confirm sheet ─────────────────────────────────────────────────
function SpecialConfirmSheet({ pack, balance, bonusBalance, onConfirm, onClose }: {
  pack: PillPack; balance: number; bonusBalance: number;
  onConfirm: () => void; onClose: () => void;
}) {
  const entryFee  = pack.entry_fee  ?? pack.pills[0]?.price ?? 0;
  const prize     = pack.prize_amount ?? pack.pills[0]?.prize ?? 0;
  const qCount    = pack.question_count ?? null;
  const timeMins  = pack.time_limit_minutes ?? null;
  const passReq   = pack.required_correct ?? pack.pass_threshold ?? null;
  const canAfford = balance + bonusBalance >= entryFee;
  const bonusUsed = Math.min(bonusBalance, entryFee);
  const realUsed  = entryFee - bonusUsed;
  const { label: expiryLabel, expired } = usePackExpiry(pack.quiz_expires_at);
  const canStart  = canAfford && !expired;

  const challengePhrase = qCount != null
    ? `Answer ${qCount} questions${timeMins != null ? ` in ${timeMins} minute${timeMins !== 1 ? "s" : ""}` : ""}${passReq != null ? ` — get ${passReq} or more right to win` : " — pass to win"}.`
    : `Complete the exam — pass to win the prize.`;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
      onClick={onClose}>
      <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.85)", backdropFilter: "blur(5px)" }} />
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 340, damping: 32 }}
        onClick={(e) => e.stopPropagation()}
        style={{ position: "relative", width: "100%", maxWidth: 440, borderRadius: "24px 24px 0 0", padding: "28px 24px 36px", backgroundColor: "var(--bg-card)" }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: "#333", margin: "0 auto 20px" }} />

        {/* Identity */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: "rgba(232,163,61,0.12)", border: "1px solid rgba(232,163,61,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Package size={20} style={{ color: "var(--accent-amber)" }} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 8, fontWeight: 800, padding: "2px 6px", borderRadius: 3, textTransform: "uppercase", letterSpacing: "0.07em", backgroundColor: "rgba(232,163,61,0.15)", color: "var(--accent-amber)" }}>SPECIAL</span>
              <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>{pack.name}</p>
            </div>
            <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "2px 0 0" }}>{pack.category}</p>
          </div>
        </div>

        {/* Challenge phrase */}
        <div style={{ borderRadius: 12, padding: "14px 16px", backgroundColor: "rgba(232,163,61,0.06)", border: "1px solid rgba(232,163,61,0.2)", marginBottom: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.55, color: "var(--text-primary)", margin: 0 }}>{challengePhrase}</p>
          <p style={{ fontSize: 12, color: "rgba(232,163,61,0.65)", margin: "4px 0 0" }}>One attempt only · prizes paid instantly on pass</p>
        </div>

        {/* Expiry countdown */}
        {expiryLabel && (
          <div style={{ borderRadius: 8, padding: "8px 12px", marginBottom: 12, backgroundColor: expired ? "rgba(239,68,68,0.08)" : "rgba(232,163,61,0.06)", border: `1px solid ${expired ? "rgba(239,68,68,0.2)" : "rgba(232,163,61,0.15)"}`, display: "flex", alignItems: "center", gap: 6 }}>
            <Clock size={12} style={{ color: expired ? "#f87171" : "var(--accent-amber)", flexShrink: 0 }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: expired ? "#f87171" : "var(--accent-amber)" }}>{expiryLabel}</span>
          </div>
        )}

        {/* Stats grid */}
        <div style={{ display: "grid", gridTemplateColumns: qCount != null ? "1fr 1fr 1fr" : "1fr 1fr", gap: 8, marginBottom: 16 }}>
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

// ── Category colour map ───────────────────────────────────────────────────
const CAT_COLOR: Record<string, string> = {
  Football: "#4C6FFF", Basketball: "#7C6FE8", Cricket: "#E8A33D",
  Crypto: "#8B5CF6", Politics: "#EC4899", Entertainment: "#FFD700",
  Technology: "#00CFFF", Science: "#00FF66", Food: "#FF6B9D",
  Lifestyle: "#FF8800", "General Knowledge": "#8B5CF6", Sports: "#4C6FFF",
  General: "#4C6FFF",
};
const catColor = (cat: string) => CAT_COLOR[cat] ?? "#4C6FFF";

// ── Hero special card ─────────────────────────────────────────────────────
function HeroSpecial({ pack, onClick }: { pack: PillPack; onClick: () => void }) {
  const price = pack.entry_fee ?? pack.pills[0]?.price ?? 0;
  const prize = pack.prize_amount ?? pack.pills[0]?.prize ?? 0;
  const total = pack.pills.length;
  const { label: expiryLabel, expired } = usePackExpiry(pack.quiz_expires_at);

  return (
    <motion.button initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} whileTap={{ scale: expired ? 1 : 0.98 }}
      onClick={expired ? undefined : onClick}
      style={{
        width: "100%", boxSizing: "border-box", borderRadius: 16, padding: 0,
        textAlign: "left", cursor: expired ? "default" : "pointer", overflow: "hidden", position: "relative",
        background: "linear-gradient(135deg, #1a1200 0%, #2c1e00 45%, #1a1200 100%)",
        border: `1.5px solid ${expired ? "rgba(239,68,68,0.35)" : "rgba(232,163,61,0.6)"}`,
        boxShadow: expired ? "none" : "0 0 0 1px rgba(232,163,61,0.12), 0 6px 32px rgba(232,163,61,0.28)",
        opacity: expired ? 0.65 : 1,
      }}>
      {!expired && (
        <motion.div animate={{ x: ["-100%", "200%"] }} transition={{ duration: 3.5, repeat: Infinity, repeatDelay: 2.5 }}
          style={{ position: "absolute", inset: 0, width: "40%", background: "linear-gradient(90deg,transparent,rgba(232,163,61,0.06),transparent)", pointerEvents: "none" }} />
      )}
      <div style={{ height: 2, background: expired ? "rgba(239,68,68,0.4)" : "linear-gradient(90deg,transparent,rgba(232,163,61,0.8),rgba(255,200,80,1),rgba(232,163,61,0.8),transparent)" }} />

      <div style={{ padding: "18px 18px 14px", position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: 9, fontWeight: 900, padding: "2px 8px", borderRadius: 4, background: expired ? "rgba(239,68,68,0.2)" : "linear-gradient(135deg,#E8A33D,#FFD060)", color: expired ? "#f87171" : "#000", letterSpacing: "0.06em" }}>
            {expired ? "ENDED" : "BIGGEST PRIZE"}
          </span>
          <span style={{ fontSize: 10, color: "rgba(232,163,61,0.55)" }}>{pack.category}</span>
          {expiryLabel && !expired && (
            <span style={{ fontSize: 9, fontWeight: 600, color: "var(--accent-amber)", display: "flex", alignItems: "center", gap: 3 }}>
              <Clock size={9} /> {expiryLabel}
            </span>
          )}
        </div>
        <p style={{ fontSize: 20, fontWeight: 800, color: expired ? "rgba(255,255,255,0.5)" : "#FFE082", margin: "0 0 6px", lineHeight: 1.25 }}>{pack.name}</p>
        <p style={{ fontSize: 11, color: "rgba(232,163,61,0.6)", margin: "0 0 16px" }}>
          {total}-question exam · answer to pass · one attempt
        </p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 14 }}>
          <div>
            <p style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", margin: "0 0 3px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Entry</p>
            {expired
              ? <p style={{ fontSize: 15, fontWeight: 700, color: "#f87171", margin: 0 }}>Ended</p>
              : <p style={{ fontSize: 15, fontFamily: "monospace", fontWeight: 700, color: "rgba(232,163,61,0.85)", margin: 0 }}>₦{price.toLocaleString()}</p>
            }
          </div>
          {!expired && (
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", margin: "0 0 3px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Top prize</p>
              <p style={{ fontSize: 22, fontFamily: "monospace", fontWeight: 900, color: "#FFD060", margin: 0 }}>₦{prize.toLocaleString()}</p>
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: "10px 18px", background: expired ? "rgba(239,68,68,0.08)" : "rgba(232,163,61,0.12)", borderTop: `1px solid ${expired ? "rgba(239,68,68,0.2)" : "rgba(232,163,61,0.2)"}`, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <ClipboardCheck size={14} style={{ color: expired ? "#f87171" : "var(--accent-amber)" }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: expired ? "#f87171" : "var(--accent-amber)" }}>
          {expired ? "Entry Closed" : "Enter Special →"}
        </span>
      </div>
    </motion.button>
  );
}

// ── Compact special row ───────────────────────────────────────────────────
function SpecialRow({ pack, onClick }: { pack: PillPack; onClick: () => void }) {
  const price = pack.entry_fee ?? pack.pills[0]?.price ?? 0;
  const prize = pack.prize_amount ?? pack.pills[0]?.prize ?? 0;
  const color = catColor(pack.category);
  const { label: expiryLabel, expired } = usePackExpiry(pack.quiz_expires_at);

  return (
    <motion.button initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} whileTap={{ scale: expired ? 1 : 0.98 }}
      onClick={expired ? undefined : onClick}
      style={{
        width: "100%", boxSizing: "border-box", borderRadius: 12, padding: "12px 14px",
        textAlign: "left", cursor: expired ? "default" : "pointer",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
        background: "linear-gradient(135deg, #1a1200, #2a1e00, #1a1200)",
        border: `1px solid ${expired ? "rgba(239,68,68,0.2)" : "rgba(232,163,61,0.35)"}`,
        opacity: expired ? 0.6 : 1,
      }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
          <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color, padding: "1px 5px", borderRadius: 3, backgroundColor: `${color}20` }}>{pack.category}</span>
          {expiryLabel && (
            <span style={{ fontSize: 9, fontWeight: 600, color: expired ? "#f87171" : "var(--accent-amber)", display: "flex", alignItems: "center", gap: 2 }}>
              <Clock size={8} /> {expiryLabel}
            </span>
          )}
        </div>
        <p style={{ fontSize: 13, fontWeight: 700, color: expired ? "rgba(255,255,255,0.45)" : "#FFE082", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pack.name}</p>
        <p style={{ fontSize: 10, color: expired ? "#f87171" : "rgba(232,163,61,0.55)", margin: "2px 0 0" }}>
          {expired ? "Entry closed" : `₦${price.toLocaleString()} entry`}
        </p>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        {!expired && <p style={{ fontSize: 14, fontFamily: "monospace", fontWeight: 900, color: "#FFD060", margin: 0 }}>₦{prize.toLocaleString()}</p>}
        <ArrowRight size={12} style={{ color: expired ? "#f87171" : "rgba(232,163,61,0.6)", marginTop: 4, opacity: expired ? 0.4 : 1 }} />
      </div>
    </motion.button>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function SpecialsPage() {
  const router = useRouter();
  const { state } = useApp();
  const [packs, setPacks] = useState<PillPack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmPack, setConfirmPack] = useState<PillPack | null>(null);

  useEffect(() => {
    if (!state.isAuthenticated) { router.push("/auth"); return; }

    const isSpecial = (p: PillPack) => p.is_vip === true || (p as any).pack_type === "special";

    Promise.allSettled([pillsApi.getPacks(), pillsApi.getSpecials()])
      .then(([packsR, specialsR]) => {
        const fromPacks = packsR.status === "fulfilled"
          ? (packsR.value.packs ?? []).filter((p) => p.status === "active" && isSpecial(p))
          : [];
        const fromSpecials = specialsR.status === "fulfilled"
          ? (specialsR.value.packs ?? []).filter((p) => p.status === "active")
          : [];
        // Merge, deduplicate by id
        const seen = new Set<string>();
        const all = [...fromPacks, ...fromSpecials].filter((p) => seen.has(p.id) ? false : (seen.add(p.id), true));
        // Sort by prize descending so biggest is always hero
        all.sort((a, b) => (b.pills[0]?.prize ?? 0) - (a.pills[0]?.prize ?? 0));
        setPacks(all);
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load specials"))
      .finally(() => setLoading(false));
  }, [state.isAuthenticated, router]);

  if (!state.isAuthenticated) return null;

  const heroPack = packs[0] ?? null;
  const morePacks = packs.slice(1);

  return (
    <div style={{ width: "100%", maxWidth: "100vw", overflowX: "hidden", boxSizing: "border-box", padding: "0 16px 100px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "20px 0 18px", borderBottom: "1px solid var(--border-hairline)", marginBottom: 20 }}>
        <button onClick={() => router.back()} style={{ padding: 6, borderRadius: 8, border: "none", background: "none", cursor: "pointer", display: "flex", alignItems: "center" }}>
          <ChevronLeft size={20} style={{ color: "var(--text-secondary)" }} />
        </button>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>Specials</h1>
          <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "2px 0 0" }}>One shot, real stakes</p>
        </div>
      </div>

      {error && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 8, marginBottom: 16, border: "1px solid var(--border-subtle)", backgroundColor: "rgba(239,68,68,0.05)", color: "#f87171", fontSize: 13 }}>
          <AlertCircle size={15} style={{ flexShrink: 0 }} /> {error}
        </div>
      )}

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="skeleton" style={{ height: 180, borderRadius: 16 }} />
          {[1,2,3].map((i) => <div key={i} className="skeleton" style={{ height: 72, borderRadius: 12 }} />)}
        </div>
      ) : packs.length === 0 ? (
        <div style={{ borderRadius: 12, padding: "48px 24px", textAlign: "center", border: "1px solid rgba(232,163,61,0.2)", backgroundColor: "rgba(232,163,61,0.04)" }}>
          <Clock size={28} style={{ color: "rgba(232,163,61,0.4)", margin: "0 auto 12px", display: "block" }} />
          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", margin: "0 0 4px" }}>No special challenge is live right now</p>
          <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>Check back soon</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Hero — biggest prize Special */}
          {heroPack && (
            <HeroSpecial pack={heroPack} onClick={() => setConfirmPack(heroPack)} />
          )}

          {/* More specials */}
          {morePacks.length > 0 && (
            <section>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-muted)", marginBottom: 10 }}>
                More specials
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {morePacks.map((pack) => (
                  <SpecialRow key={pack.id} pack={pack} onClick={() => setConfirmPack(pack)} />
                ))}
              </div>
            </section>
          )}

        </div>
      )}

      {/* Confirm sheet */}
      <AnimatePresence>
        {confirmPack && (
          <SpecialConfirmSheet
            pack={confirmPack}
            balance={state.player?.balance ?? 0}
            bonusBalance={state.player?.bonus_balance ?? 0}
            onConfirm={() => { const p = confirmPack; setConfirmPack(null); router.push(`/pills/vip/${p.id}/play`); }}
            onClose={() => setConfirmPack(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
