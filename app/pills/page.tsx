"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { pillsApi, type PillPack, type PillPackPill, ApiError } from "@/lib/api";
import Link from "next/link";
import { AlertCircle, Package, ArrowRight, Clock, ClipboardCheck } from "lucide-react";

// Category colour map
const CAT_COLOR: Record<string, string> = {
  Football: "#4C6FFF", Basketball: "#7C6FE8", Cricket: "#E8A33D",
  Crypto: "#8B5CF6", Politics: "#EC4899", Entertainment: "#FFD700",
  Technology: "#00CFFF", Science: "#00FF66", Food: "#FF6B9D",
  Lifestyle: "#FF8800", "General Knowledge": "#8B5CF6", Sports: "#4C6FFF",
  General: "#4C6FFF",
};
const catColor = (cat: string) => CAT_COLOR[cat] ?? "#4C6FFF";

// Format timer for display
function formatTimer(sec?: number) {
  if (!sec) return null;
  return sec >= 60 ? `${Math.floor(sec / 60)}m` : `${sec}s`;
}

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

// ── Category chip filter ──────────────────────────────────────────────────
function CategoryChips({ categories, active, onChange }: {
  categories: string[]; active: string; onChange: (c: string) => void;
}) {
  return (
    <div style={{ display: "flex", gap: 8, overflowX: "auto", overflowY: "hidden", WebkitOverflowScrolling: "touch", paddingBottom: 2 }}>
      {["All", ...categories].map((cat) => (
        <button key={cat} onClick={() => onChange(cat)}
          style={{
            flexShrink: 0, padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600,
            cursor: "pointer", transition: "all .15s", whiteSpace: "nowrap",
            backgroundColor: active === cat ? "var(--accent-indigo)" : "transparent",
            color: active === cat ? "#fff" : "var(--text-secondary)",
            border: active === cat ? "none" : "1px solid var(--border-subtle)",
          }}>
          {cat}
        </button>
      ))}
    </div>
  );
}

// ── Hero pack card (featured / most recent) ───────────────────────────────
function HeroPack({ pack, onClick }: { pack: PillPack; onClick: () => void }) {
  const color = catColor(pack.category);
  const price = pack.pills[0]?.price ?? 0;
  const prize = pack.pills[0]?.prize ?? 0;
  const timer = (pack.pills[0] as any)?.timer as number | undefined;
  const timerLabel = formatTimer(timer);
  const available = pack.pills.filter((p) => p.status === "available").length;
  const { label: expiryLabel, expired } = usePackExpiry(pack.quiz_expires_at);

  return (
    <motion.button initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} whileTap={{ scale: expired ? 1 : 0.98 }}
      onClick={expired ? undefined : onClick}
      style={{
        width: "100%", boxSizing: "border-box", borderRadius: 16, padding: 0, textAlign: "left",
        cursor: expired ? "default" : "pointer", overflow: "hidden", border: `1.5px solid ${color}50`,
        backgroundColor: "var(--bg-card)", position: "relative",
        boxShadow: `0 4px 32px ${color}20`, opacity: expired ? 0.6 : 1,
      }}>
      <div style={{ position: "absolute", top: -40, right: -40, width: 180, height: 180, borderRadius: "50%", backgroundColor: color, opacity: 0.07, pointerEvents: "none" }} />
      <div style={{ height: 3, background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
      <div style={{ padding: "18px 20px", position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", padding: "2px 8px", borderRadius: 20, backgroundColor: `${color}20`, color }}>
            {pack.category}
          </span>
          <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{available}/{pack.pills.length} available</span>
          {expiryLabel && (
            <span style={{ fontSize: 9, fontWeight: 600, color: expired ? "#f87171" : "var(--accent-amber)", display: "flex", alignItems: "center", gap: 3 }}>
              <Clock size={9} /> {expiryLabel}
            </span>
          )}
        </div>
        <p style={{ fontSize: 19, fontWeight: 800, color: "var(--text-primary)", margin: "0 0 6px", lineHeight: 1.3 }}>{pack.name}</p>
        <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "0 0 16px" }}>
          {expired ? "This pack has ended" : `Answer fast${timerLabel ? ` in ${timerLabel}` : ""}, win instantly`}
        </p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ display: "flex", gap: 16 }}>
            <div>
              <p style={{ fontSize: 9, color: "var(--text-muted)", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Entry</p>
              {expired
                ? <p style={{ fontSize: 16, fontWeight: 700, color: "#f87171", margin: 0 }}>Ended</p>
                : <p style={{ fontSize: 16, fontFamily: "monospace", fontWeight: 700, color: "var(--accent-amber)", margin: 0 }}>₦{price.toLocaleString()}</p>
              }
            </div>
            {!expired && (
              <div>
                <p style={{ fontSize: 9, color: "var(--text-muted)", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Win up to</p>
                <p style={{ fontSize: 16, fontFamily: "monospace", fontWeight: 700, color, margin: 0 }}>₦{prize.toLocaleString()}</p>
              </div>
            )}
          </div>
          <div style={{ padding: "8px 16px", borderRadius: 10, backgroundColor: expired ? "rgba(239,68,68,0.15)" : color, color: expired ? "#f87171" : "#000", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
            {expired ? "Ended" : <>Play <ArrowRight size={13} /></>}
          </div>
        </div>
      </div>
    </motion.button>
  );
}

// ── Grid pack card (2-col) ────────────────────────────────────────────────
function GridPackCard({ pack, onClick }: { pack: PillPack; onClick: () => void }) {
  const color = catColor(pack.category);
  const price = pack.pills[0]?.price ?? 0;
  const available = pack.pills.filter((p) => p.status === "available").length;
  const { label: expiryLabel, expired } = usePackExpiry(pack.quiz_expires_at);

  return (
    <motion.button initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} whileTap={{ scale: expired ? 1 : 0.97 }}
      onClick={expired ? undefined : onClick}
      className="pack-card"
      style={{
        boxSizing: "border-box", borderRadius: 12, padding: 0,
        textAlign: "left", cursor: expired ? "default" : "pointer", overflow: "hidden",
        border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-card)",
        display: "flex", flexDirection: "column", opacity: expired ? 0.55 : 1,
      }}>
      <div className="pack-card-body" style={{ display: "flex", flexDirection: "column", flex: 1, gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ width: 30, height: 30, borderRadius: "50%", backgroundColor: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Package size={14} style={{ color }} />
          </div>
          <span style={{
            fontSize: 9, fontFamily: "monospace", fontWeight: 700,
            textTransform: "uppercase", letterSpacing: "0.06em",
            color, padding: "2px 7px", borderRadius: 20, backgroundColor: `${color}18`,
          }}>
            {pack.category}
          </span>
        </div>
        <p className="pack-card-name" style={{ fontWeight: 700, color: "var(--text-primary)", margin: 0, lineHeight: 1.35, wordBreak: "break-word", flexGrow: 1 }}>
          {pack.name}
        </p>
        {expiryLabel && (
          <p style={{ fontSize: 9, fontWeight: 600, color: expired ? "#f87171" : "var(--accent-amber)", margin: 0, display: "flex", alignItems: "center", gap: 3 }}>
            <Clock size={9} style={{ flexShrink: 0 }} /> {expiryLabel}
          </p>
        )}
      </div>
      <div className="pack-card-footer" style={{ borderTop: "1px solid var(--border-hairline)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {expired ? (
            <p style={{ fontSize: 12, fontWeight: 700, color: "#f87171", margin: 0 }}>Ended</p>
          ) : (
            <p style={{ fontSize: 12, fontFamily: "monospace", fontWeight: 700, color: "var(--accent-amber)", margin: 0 }}>₦{price.toLocaleString()}</p>
          )}
          {!expired && <span style={{ fontSize: 9, color: "var(--text-muted)" }}>{available} left</span>}
        </div>
        <div style={{ width: 24, height: 24, borderRadius: 6, backgroundColor: expired ? "rgba(239,68,68,0.08)" : `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <ArrowRight size={12} style={{ color: expired ? "#f87171" : color, opacity: expired ? 0.5 : 1 }} />
        </div>
      </div>
    </motion.button>
  );
}

// ── Specials teaser banner (compact, routes to /pills/specials) ───────────
function SpecialsTeaserBanner({ packs, onClick }: { packs: PillPack[]; onClick: () => void }) {
  if (packs.length === 0) return null;
  const topPrize = Math.max(...packs.map((p) => p.pills[0]?.prize ?? 0));
  return (
    <motion.button initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} whileTap={{ scale: 0.98 }}
      onClick={onClick}
      style={{
        width: "100%", boxSizing: "border-box", borderRadius: 14, padding: "14px 16px",
        textAlign: "left", cursor: "pointer", position: "relative", overflow: "hidden",
        background: "linear-gradient(135deg, #1a1200 0%, #2a1e00 50%, #1a1200 100%)",
        border: "1px solid rgba(232,163,61,0.5)",
        boxShadow: "0 4px 20px rgba(232,163,61,0.18)",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
      }}>
      {/* Shimmer */}
      <motion.div animate={{ x: ["-100%", "200%"] }} transition={{ duration: 4, repeat: Infinity, repeatDelay: 3 }}
        style={{ position: "absolute", top: 0, left: 0, width: "35%", height: "100%", background: "linear-gradient(90deg,transparent,rgba(232,163,61,0.06),transparent)", pointerEvents: "none" }} />
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, position: "relative" }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: "rgba(232,163,61,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <ClipboardCheck size={18} style={{ color: "var(--accent-amber)" }} />
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 800, color: "#FFE082", margin: 0 }}>Specials</p>
          <p style={{ fontSize: 11, color: "rgba(232,163,61,0.65)", margin: "2px 0 0", whiteSpace: "nowrap" }}>
            {packs.length} challenge{packs.length !== 1 ? "s" : ""} live · up to ₦{topPrize.toLocaleString()}
          </p>
        </div>
      </div>
      <ArrowRight size={16} style={{ color: "var(--accent-amber)", flexShrink: 0, opacity: 0.8 }} />
    </motion.button>
  );
}

// ── Pre-challenge confirm sheet (standard Pills + Specials) ──────────────
function PillSheet({ pack, pill, onConfirm, onClose, balance, bonusBalance }: {
  pack: PillPack; pill: PillPackPill; onConfirm: () => void; onClose: () => void;
  balance: number; bonusBalance: number;
}) {
  const isSpecial = pack.question_count != null || pack.is_vip || (pack as any).pack_type === "special";
  const color = isSpecial ? "var(--accent-amber)" : catColor(pack.category);
  const cardColor = catColor(pack.category);

  const entryFee  = pack.entry_fee  ?? pill.price;
  const prize     = pack.prize_amount ?? pill.prize;
  const canAfford = balance + bonusBalance >= entryFee;
  const bonusUsed = Math.min(bonusBalance, entryFee);
  const realUsed  = entryFee - bonusUsed;

  const qCount    = pack.question_count ?? null;
  const timeMins  = pack.time_limit_minutes ?? null;
  const passReq   = pack.required_correct ?? pack.pass_threshold ?? null;

  const { label: expiryLabel, expired } = usePackExpiry(pack.quiz_expires_at);

  const challengePhrase = isSpecial && qCount != null
    ? `Answer ${qCount} questions${timeMins != null ? ` in ${timeMins} minute${timeMins !== 1 ? "s" : ""}` : ""}${passReq != null ? ` — get ${passReq} or more right to win` : " — pass to win"}.`
    : `Answer correctly and win instantly.`;

  const timerSec   = (pill as any).timer as number | undefined;
  const timerLabel = !isSpecial ? formatTimer(timerSec) : null;
  const canStart   = canAfford && !expired;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
      onClick={onClose}>
      <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)" }} />
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 340, damping: 32 }}
        onClick={(e) => e.stopPropagation()}
        style={{ position: "relative", width: "100%", maxWidth: 440, borderRadius: "24px 24px 0 0", padding: "28px 24px 36px", backgroundColor: "var(--bg-card)" }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: "#333", margin: "0 auto 20px" }} />

        {/* Pack identity row */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: isSpecial ? "rgba(232,163,61,0.12)" : `${cardColor}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: isSpecial ? "1px solid rgba(232,163,61,0.3)" : "none" }}>
            <Package size={20} style={{ color: isSpecial ? "var(--accent-amber)" : cardColor }} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {isSpecial && (
                <span style={{ fontSize: 8, fontWeight: 800, padding: "2px 6px", borderRadius: 3, textTransform: "uppercase", letterSpacing: "0.07em", backgroundColor: "rgba(232,163,61,0.15)", color: "var(--accent-amber)" }}>
                  SPECIAL
                </span>
              )}
              <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>{pack.name}</p>
            </div>
            <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "2px 0 0" }}>{pack.category}</p>
          </div>
        </div>

        {/* Expiry countdown */}
        {expiryLabel && (
          <div style={{ borderRadius: 8, padding: "8px 12px", marginBottom: 12, backgroundColor: expired ? "rgba(239,68,68,0.08)" : "rgba(232,163,61,0.06)", border: `1px solid ${expired ? "rgba(239,68,68,0.2)" : "rgba(232,163,61,0.15)"}`, display: "flex", alignItems: "center", gap: 6 }}>
            <Clock size={12} style={{ color: expired ? "#f87171" : "var(--accent-amber)", flexShrink: 0 }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: expired ? "#f87171" : "var(--accent-amber)" }}>
              {expiryLabel}
            </span>
          </div>
        )}

        {/* Challenge phrase */}
        <div style={{ borderRadius: 12, padding: "14px 16px", backgroundColor: isSpecial ? "rgba(232,163,61,0.06)" : `${cardColor}10`, border: `1px solid ${isSpecial ? "rgba(232,163,61,0.2)" : `${cardColor}25`}`, marginBottom: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.55, color: "var(--text-primary)", margin: 0 }}>
            {challengePhrase}
          </p>
          {!isSpecial && (
            <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "4px 0 0" }}>
              Get it right and win{" "}
              <span style={{ fontFamily: "monospace", fontWeight: 700, color: cardColor }}>₦{prize.toLocaleString()}</span>
              {timerLabel ? ` — you'll have ${timerLabel} on the clock` : ""}.
            </p>
          )}
          {isSpecial && (
            <p style={{ fontSize: 12, color: "rgba(232,163,61,0.65)", margin: "4px 0 0" }}>
              One attempt only · prizes paid instantly on pass
            </p>
          )}
        </div>

        {/* Stats grid */}
        <div style={{ display: "grid", gridTemplateColumns: isSpecial && qCount != null ? "1fr 1fr 1fr" : timerLabel ? "1fr 1fr 1fr" : "1fr 1fr", gap: 8, marginBottom: 16 }}>
          <div style={{ borderRadius: 10, padding: "10px 8px", textAlign: "center", border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-base)" }}>
            <p style={{ fontSize: 9, color: "var(--text-muted)", margin: "0 0 3px", textTransform: "uppercase" }}>Entry</p>
            <p style={{ fontSize: 14, fontFamily: "monospace", fontWeight: 700, color: "var(--accent-amber)", margin: 0 }}>₦{entryFee.toLocaleString()}</p>
          </div>
          <div style={{ borderRadius: 10, padding: "10px 8px", textAlign: "center", border: `1px solid ${isSpecial ? "rgba(232,163,61,0.3)" : `${cardColor}40`}`, backgroundColor: isSpecial ? "rgba(232,163,61,0.06)" : `${cardColor}08` }}>
            <p style={{ fontSize: 9, color: "var(--text-muted)", margin: "0 0 3px", textTransform: "uppercase" }}>Prize</p>
            <p style={{ fontSize: 14, fontFamily: "monospace", fontWeight: 700, color: isSpecial ? "var(--accent-amber)" : cardColor, margin: 0 }}>₦{prize.toLocaleString()}</p>
          </div>
          {isSpecial && qCount != null && (
            <div style={{ borderRadius: 10, padding: "10px 8px", textAlign: "center", border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-base)" }}>
              <p style={{ fontSize: 9, color: "var(--text-muted)", margin: "0 0 3px", textTransform: "uppercase" }}>Questions</p>
              <p style={{ fontSize: 14, fontFamily: "monospace", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>{qCount}</p>
            </div>
          )}
          {!isSpecial && timerLabel && (
            <div style={{ borderRadius: 10, padding: "10px 8px", textAlign: "center", border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-base)" }}>
              <p style={{ fontSize: 9, color: "var(--text-muted)", margin: "0 0 3px", textTransform: "uppercase" }}>Time</p>
              <p style={{ fontSize: 13, fontFamily: "monospace", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>{timerLabel}</p>
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

        {/* CTA */}
        <button onClick={canStart ? onConfirm : undefined} disabled={!canStart}
          style={{
            width: "100%", padding: "14px 0", borderRadius: 11, border: "none",
            backgroundColor: expired ? "rgba(239,68,68,0.12)" : isSpecial ? "var(--accent-amber)" : cardColor,
            color: expired ? "#f87171" : "#000", fontSize: 14, fontWeight: 800,
            cursor: canStart ? "pointer" : "not-allowed", opacity: canStart ? 1 : 0.45,
            marginBottom: 10,
          }}>
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

// ── Main page ──────────────────────────────────────────────────────────────
export default function PillsPage() {
  const router = useRouter();
  const { state } = useApp();
  const [allPacks, setAllPacks] = useState<PillPack[]>([]);
  const [specialPacks, setSpecialPacks] = useState<PillPack[]>([]);
  const [loading, setLoading] = useState(true);
  const [packsLoaded, setPacksLoaded] = useState(false);
  const [specialsLoaded, setSpecialsLoaded] = useState(false);
  const [error, setError] = useState("");
  const [sheet, setSheet] = useState<{ pack: PillPack; pill: PillPackPill } | null>(null);
  const [activeCategory, setActiveCategory] = useState("All");

  useEffect(() => {
    if (!state.isAuthenticated) { router.push("/auth"); return; }

    pillsApi.getPacks()
      .then((d) => {
        const active = (d.packs ?? []).filter((p) => p.status === "active");
        const standards = active.filter((p) => !p.is_vip && (p as any).pack_type !== "special");
        const fromPacks = active.filter((p) => p.is_vip || (p as any).pack_type === "special");
        setAllPacks(standards);
        if (fromPacks.length > 0) setSpecialPacks(fromPacks);
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load packs"))
      .finally(() => setPacksLoaded(true));

    pillsApi.getSpecials()
      .then((d) => {
        const active = (d.packs ?? []).filter((p) => p.status === "active");
        if (active.length > 0) {
          setSpecialPacks((prev) => {
            const existing = new Set(prev.map((p) => p.id));
            return [...prev, ...active.filter((p) => !existing.has(p.id))];
          });
        }
      })
      .catch(() => { /* silent — /api/pills/packs fallback handles it */ })
      .finally(() => setSpecialsLoaded(true));
  }, [state.isAuthenticated, router]);

  // Only stop loading when BOTH fetches have settled — prevents empty state flash
  useEffect(() => {
    if (packsLoaded && specialsLoaded) setLoading(false);
  }, [packsLoaded, specialsLoaded]);

  const standardPacks = allPacks;
  const categories = Array.from(new Set(standardPacks.map((p) => p.category))).sort();

  const filteredPacks = activeCategory === "All"
    ? standardPacks
    : standardPacks.filter((p) => p.category === activeCategory);

  // Hero: only show explicitly featured pack — no fallback to first pack
  const featuredPack = filteredPacks.find((p) => p.is_featured) ?? null;
  // Standard Packs: all packs if nothing featured, everything except featured if one exists
  const standardPacks2 = featuredPack
    ? filteredPacks.filter((p) => p !== featuredPack)
    : filteredPacks;

  if (!state.isAuthenticated) return null;

  const handlePackClick = (pack: PillPack) => {
    // All packs go through the confirm sheet — never charge on card tap
    const isSpecial = pack.is_vip || (pack as any).pack_type === "special" || pack.question_count != null;
    if (isSpecial) {
      // Use a synthetic pill-like object for Specials so PillSheet has entry_fee/prize
      const syntheticPill: PillPackPill = {
        id: pack.id,
        color: "var(--accent-amber)",
        price: pack.entry_fee ?? pack.pills[0]?.price ?? 0,
        prize: pack.prize_amount ?? pack.pills[0]?.prize ?? 0,
        status: "available",
      };
      setSheet({ pack, pill: syntheticPill });
      return;
    }
    const firstAvail = pack.pills.find((p) => p.status === "available");
    if (firstAvail) setSheet({ pack, pill: firstAvail });
  };

  return (
    <div style={{ width: "100%", maxWidth: "100vw", overflowX: "hidden", boxSizing: "border-box", padding: "20px 16px 100px" }}>

      {error && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 8, marginBottom: 16, border: "1px solid var(--border-subtle)", backgroundColor: "rgba(239,68,68,0.05)", color: "#f87171", fontSize: 13 }}>
          <AlertCircle size={15} style={{ flexShrink: 0 }} /> {error}
        </div>
      )}

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="skeleton" style={{ height: 32, width: 200, borderRadius: 20 }} />
          <div className="skeleton" style={{ height: 140, borderRadius: 16 }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[1,2,3,4].map((i) => <div key={i} className="skeleton" style={{ height: 130, borderRadius: 12 }} />)}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

          {/* Category chips */}
          {categories.length > 0 && (
            <CategoryChips categories={categories} active={activeCategory} onChange={setActiveCategory} />
          )}

          {/* Featured today */}
          {featuredPack && (
            <section>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-muted)", marginBottom: 10 }}>
                Featured today
              </p>
              <HeroPack pack={featuredPack} onClick={() => handlePackClick(featuredPack)} />
            </section>
          )}

          {/* Standard Packs — horizontal scroll row */}
          {standardPacks2.length > 0 && (
            <section>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-muted)", marginBottom: 10 }}>
                Standard Packs
              </p>
              {/* Horizontal scroll — page height stays fixed regardless of pack count */}
              <div style={{ width: "100%", minWidth: 0, overflowX: "auto", overflowY: "hidden", WebkitOverflowScrolling: "touch" }}>
                <div style={{ display: "flex", gap: 10, minWidth: "min-content", paddingBottom: 4 }}>
                  {standardPacks2.map((pack) => (
                    <GridPackCard key={pack.id} pack={pack} onClick={() => handlePackClick(pack)} />
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Empty state — only after loading completes */}
          {filteredPacks.length === 0 && (
            <div style={{ borderRadius: 12, padding: "36px 20px", textAlign: "center", border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-card)" }}>
              <Clock size={28} style={{ color: "var(--text-muted)", margin: "0 auto 12px", display: "block" }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", margin: "0 0 4px" }}>No packs live</p>
              <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>Check back soon — new packs drop regularly</p>
            </div>
          )}

          {/* Specials teaser — taps through to /pills/specials */}
          <SpecialsTeaserBanner packs={specialPacks} onClick={() => router.push("/pills/specials")} />

        </div>
      )}

      {/* Pill confirm sheet */}
      <AnimatePresence>
        {sheet && (
          <PillSheet
            pack={sheet.pack} pill={sheet.pill}
            balance={state.player?.balance ?? 0}
            bonusBalance={state.player?.bonus_balance ?? 0}
        onConfirm={() => {
          const { pack, pill } = sheet;
          const isSpecial = pack.is_vip || (pack as any).pack_type === "special" || pack.question_count != null;
          setSheet(null);
          if (isSpecial) {
            router.push(`/pills/vip/${pack.id}/play`);
          } else {
            router.push(`/pills/play/${pill.id}`);
          }
        }}
            onClose={() => setSheet(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
