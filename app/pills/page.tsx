"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { pillsApi, type PillPack, type PillPackPill, ApiError } from "@/lib/api";
import Link from "next/link";
import { AlertCircle, Package, ArrowRight, Clock, ClipboardCheck, Loader2, ChevronRight } from "lucide-react";

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
  const pending  = pack.pills.filter((p) => p.status === "pending").length;
  const hasPending = pending > 0;
  const soldOut = available === 0 && !hasPending;
  const { label: expiryLabel, expired } = usePackExpiry(pack.quiz_expires_at);
  const blocked = soldOut || expired;

  return (
    <motion.button initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} whileTap={{ scale: blocked ? 1 : 0.97 }}
      onClick={blocked ? undefined : onClick}
      className="pack-card"
      style={{
        boxSizing: "border-box", borderRadius: 12, padding: 0,
        textAlign: "left", cursor: blocked ? "default" : "pointer",
        border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-card)",
        display: "flex", flexDirection: "column", opacity: blocked ? 0.55 : 1,
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
        <p className="pack-card-name" style={{ fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
          {pack.name}
        </p>
        {/* Sold-out badge — Standard Pills only, shown when no available pills remain */}
        {soldOut && !hasPending && (
          <p style={{ fontSize: 9, fontWeight: 700, color: "var(--text-muted)", margin: 0, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Sold out
          </p>
        )}
        {/* Resume badge — player has a paid-but-not-answered pill */}
        {hasPending && (
          <p style={{ fontSize: 9, fontWeight: 700, color: "var(--accent-amber)", margin: 0, display: "flex", alignItems: "center", gap: 3 }}>
            Resume available
          </p>
        )}
        {expiryLabel && !soldOut && (
          <p style={{ fontSize: 9, fontWeight: 600, color: expired ? "#f87171" : "var(--accent-amber)", margin: 0, display: "flex", alignItems: "center", gap: 3 }}>
            <Clock size={9} style={{ flexShrink: 0 }} /> {expiryLabel}
          </p>
        )}
      </div>
      <div className="pack-card-footer" style={{ borderTop: "1px solid var(--border-hairline)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {soldOut && !hasPending ? (
            <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", margin: 0 }}>0 left</p>
          ) : hasPending ? (
            <p style={{ fontSize: 11, fontWeight: 700, color: "var(--accent-amber)", margin: 0 }}>Resume</p>
          ) : expired ? (
            <p style={{ fontSize: 12, fontWeight: 700, color: "#f87171", margin: 0 }}>Ended</p>
          ) : (
            <>
              <p style={{ fontSize: 12, fontFamily: "monospace", fontWeight: 700, color: "var(--accent-amber)", margin: 0 }}>₦{price.toLocaleString()}</p>
              <span style={{ fontSize: 9, color: "var(--text-muted)" }}>{available} left</span>
            </>
          )}
        </div>
        <div style={{ width: 24, height: 24, borderRadius: 6, backgroundColor: blocked ? "rgba(255,255,255,0.04)" : `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <ArrowRight size={12} style={{ color: blocked ? "var(--text-muted)" : color, opacity: blocked ? 0.4 : 1 }} />
        </div>
      </div>
    </motion.button>
  );
}

// ── Specials hero card ────────────────────────────────────────────────────
function SpecialsTeaserBanner({ packs, onClick }: { packs: PillPack[]; onClick: () => void }) {
  // Compute live count: active packs whose quiz_expires_at hasn't passed (or has no expiry)
  const now = Date.now();
  const livePacks = packs.filter((p) => {
    if (p.status !== "active") return false;
    if (p.quiz_expires_at && new Date(p.quiz_expires_at).getTime() <= now) return false;
    return true;
  });

  if (livePacks.length === 0) {
    // No live specials — show a quiet "check back" state
    return (
      <motion.button initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} whileTap={{ scale: 0.98 }}
        onClick={onClick}
        style={{
          width: "100%", boxSizing: "border-box", borderRadius: 14, padding: "16px 18px",
          textAlign: "left", cursor: "pointer", position: "relative", overflow: "hidden",
          background: "linear-gradient(135deg, #111 0%, #161200 100%)",
          border: "1px solid rgba(232,163,61,0.15)",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
        }}>
        <div>
          <p style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--accent-amber)", margin: "0 0 4px" }}>Specials</p>
          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)", margin: 0 }}>Check back soon — new challenges dropping</p>
        </div>
        <ArrowRight size={14} style={{ color: "rgba(232,163,61,0.4)", flexShrink: 0 }} />
      </motion.button>
    );
  }

  // Top prize across live packs
  const topPrize = Math.max(...livePacks.map((p) => p.prize_amount ?? p.pills[0]?.prize ?? 0));

  return (
    <motion.button initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="specials-hero-card"
      style={{
        width: "100%", boxSizing: "border-box", borderRadius: 16,
        padding: "18px 18px 16px", textAlign: "left", cursor: "pointer",
        position: "relative", overflow: "hidden",
        background: "linear-gradient(135deg, #1a1200 0%, #251a00 45%, #1a1200 100%)",
        border: "1px solid rgba(232,163,61,0.35)",
      }}>

      {/* CSS diagonal wipe glow — pure CSS, no JS */}
      <div className="specials-wipe" aria-hidden />

      {/* Ambient corner glow */}
      <div style={{ position: "absolute", bottom: -30, right: -30, width: 120, height: 120,
        borderRadius: "50%", backgroundColor: "rgba(232,163,61,0.07)", pointerEvents: "none" }} />

      {/* Row 1: label + live indicator */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, position: "relative" }}>
        <span style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--accent-amber)" }}>
          Specials
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span className="live-dot" />
          <span style={{ fontSize: 10, fontWeight: 700, color: "#4ade80" }}>
            {livePacks.length} live now
          </span>
        </div>
      </div>

      {/* Row 2: top prize label + amount */}
      <div style={{ position: "relative", marginBottom: 10 }}>
        <p style={{ fontSize: 10, color: "rgba(232,163,61,0.55)", margin: "0 0 3px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Top prize this week
        </p>
        <p style={{ fontSize: 30, fontFamily: "monospace", fontWeight: 900, color: "#FFE082",
          margin: 0, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
          ₦{topPrize.toLocaleString()}
        </p>
      </div>

      {/* Row 3: description */}
      <p style={{ fontSize: 12, color: "rgba(232,163,61,0.6)", margin: "0 0 14px", lineHeight: 1.55, position: "relative" }}>
        Exam-format challenges. One shared timer, one attempt each — top scorers split the pool.
      </p>

      {/* CTA */}
      <div style={{ display: "flex", alignItems: "center", gap: 4, position: "relative" }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--accent-amber)",
          textDecoration: "underline", textUnderlineOffset: 3, textDecorationColor: "rgba(232,163,61,0.5)" }}>
          View challenges
        </span>
        <ArrowRight size={13} style={{ color: "var(--accent-amber)" }} />
      </div>

    </motion.button>
  );
}

// ── Hero pack carousel — snap-scrollable, one card per view ─────────────
function HeroCarousel({ packs, onPackClick }: { packs: PillPack[]; onPackClick: (p: PillPack) => void }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Track which card is centred via IntersectionObserver on each card
  useEffect(() => {
    const container = scrollRef.current;
    if (!container || packs.length <= 1) return;
    const cards = Array.from(container.children) as HTMLElement[];
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && e.intersectionRatio >= 0.6) {
            setActiveIdx(cards.indexOf(e.target as HTMLElement));
          }
        });
      },
      { root: container, threshold: 0.6 }
    );
    cards.forEach((c) => obs.observe(c));
    return () => obs.disconnect();
  }, [packs.length]);

  return (
    <div>
      {/* Scroll container */}
      <div
        ref={scrollRef}
        style={{
          display: "flex", overflowX: "auto", overflowY: "hidden",
          scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch",
          gap: 12,
          // Hide scrollbar
          scrollbarWidth: "none", msOverflowStyle: "none",
        }}
        className="hero-carousel"
      >
        {packs.map((pack) => (
          <div key={pack.id} style={{ flex: "0 0 100%", scrollSnapAlign: "start" }}>
            <HeroPack pack={pack} onClick={() => onPackClick(pack)} />
          </div>
        ))}
      </div>

      {/* Dot indicator — only when >1 pack */}
      {packs.length > 1 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 5, marginTop: 10 }}>
          {packs.map((_, i) => (
            <div key={i} style={{
              width: i === activeIdx ? 16 : 5,
              height: 5, borderRadius: 3, transition: "all 0.25s ease",
              backgroundColor: i === activeIdx ? "var(--accent-indigo)" : "var(--border-subtle)",
              opacity: i === activeIdx ? 1 : 0.5,
            }} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Pack row — full-width vertical list item ─────────────────────────────
function PackRow({ pack, onClick }: { pack: PillPack; onClick: () => void }) {
  const color = catColor(pack.category);
  const available = pack.pills.filter((p) => p.status === "available").length;
  const pending   = pack.pills.filter((p) => p.status === "pending").length;
  const hasPending = pending > 0;
  const soldOut   = available === 0 && !hasPending;
  const price     = pack.pills[0]?.price ?? 0;
  const { label: expiryLabel, expired } = usePackExpiry(pack.quiz_expires_at);
  const blocked   = (soldOut && !hasPending) || expired;

  // Secondary line: "N left · M questions" (or state label)
  const qCount = pack.question_count ?? pack.pills.length;
  let subLabel: React.ReactNode;
  if (hasPending) {
    subLabel = <span style={{ color: "var(--accent-amber)", fontWeight: 700 }}>Resume available</span>;
  } else if (soldOut) {
    subLabel = <span style={{ color: "var(--text-muted)" }}>Sold out</span>;
  } else if (expired) {
    subLabel = <span style={{ color: "#f87171" }}>Ended</span>;
  } else {
    subLabel = (
      <span>
        <span style={{ color: "var(--accent-indigo)", fontWeight: 600 }}>{available} left</span>
        {qCount > 0 && <span style={{ color: "var(--text-muted)" }}> · {qCount} question{qCount !== 1 ? "s" : ""}</span>}
      </span>
    );
  }

  return (
    <motion.button
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: blocked ? 1 : 0.985 }}
      onClick={blocked ? undefined : onClick}
      style={{
        width: "100%", boxSizing: "border-box", display: "flex", alignItems: "center", gap: 12,
        padding: "12px 14px", borderRadius: 12, textAlign: "left",
        cursor: blocked ? "default" : "pointer",
        backgroundColor: "var(--bg-card)", border: "1px solid var(--border-hairline)",
        opacity: blocked ? 0.55 : 1,
      }}>
      {/* Category icon */}
      <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0,
        backgroundColor: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center",
        border: `1px solid ${color}25` }}>
        <Package size={18} style={{ color }} />
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em",
          color: "var(--text-muted)", margin: "0 0 2px" }}>
          {pack.category}
        </p>
        <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 3px",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {pack.name}
        </p>
        <p style={{ fontSize: 11, margin: 0, lineHeight: 1 }}>{subLabel}</p>
      </div>

      {/* Right side: price + chevron */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
        {!blocked && !hasPending && (
          <span style={{ fontSize: 13, fontFamily: "monospace", fontWeight: 700, color: "var(--accent-amber)" }}>
            ₦{price.toLocaleString()}
          </span>
        )}
        {hasPending && (
          <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 6,
            backgroundColor: "rgba(232,163,61,0.15)", color: "var(--accent-amber)",
            border: "1px solid rgba(232,163,61,0.3)" }}>
            Resume
          </span>
        )}
        <ChevronRight size={14} style={{ color: blocked ? "var(--border-subtle)" : "var(--text-muted)" }} />
      </div>
    </motion.button>
  );
}

// ── Pre-challenge confirm sheet (standard Pills + Specials) ──────────────
// Standard Pills: two-step — Pay first, then Ready screen before question reveals
type SheetStep = "confirm" | "paying" | "ready";

function PillSheet({ pack, pill, onConfirm, onClose, balance, bonusBalance }: {
  pack: PillPack; pill: PillPackPill;
  onConfirm: (prefetched: import("@/lib/api").PillOpenResponse | null) => void;
  onClose: () => void; balance: number; bonusBalance: number;
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

  // Two-step state — only used for Standard Pills
  const [step, setStep] = useState<SheetStep>("confirm");
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");
  const [prefetched, setPrefetched] = useState<import("@/lib/api").PillOpenResponse | null>(null);
  const [wasResumed, setWasResumed] = useState(false);

  const handlePay = async () => {
    if (paying) return;
    setPaying(true);
    setPayError("");
    try {
      const data = await pillsApi.open(pill.id);
      setPrefetched(data);
      setWasResumed(!!data.resumed);
      setStep("ready");
    } catch (err) {
      setPayError(err instanceof ApiError ? err.message : "Payment failed — please try again");
    } finally {
      setPaying(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
      onClick={step === "ready" ? undefined : onClose}>
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

        {/* CTA — Specials: original single-step. Standard Pills: Pay button */}
        {step !== "ready" && (
          <>
            {payError && <p style={{ textAlign: "center", color: "#f87171", fontSize: 12, marginBottom: 10 }}>{payError}</p>}
            {isSpecial ? (
              <button onClick={canStart ? () => onConfirm(null) : undefined} disabled={!canStart}
                style={{ width: "100%", padding: "14px 0", borderRadius: 11, border: "none",
                  backgroundColor: expired ? "rgba(239,68,68,0.12)" : "var(--accent-amber)",
                  color: expired ? "#f87171" : "#000", fontSize: 14, fontWeight: 800,
                  cursor: canStart ? "pointer" : "not-allowed", opacity: canStart ? 1 : 0.45, marginBottom: 10 }}>
                {expired ? "Entry Closed" : `Start & Pay ₦${entryFee.toLocaleString()}`}
              </button>
            ) : (
              <button onClick={canStart && !paying ? handlePay : undefined} disabled={!canStart || paying}
                style={{ width: "100%", padding: "14px 0", borderRadius: 11, border: "none",
                  backgroundColor: expired ? "rgba(239,68,68,0.12)" : cardColor,
                  color: expired ? "#f87171" : "#000", fontSize: 14, fontWeight: 800,
                  cursor: canStart && !paying ? "pointer" : "not-allowed",
                  opacity: canStart && !paying ? 1 : 0.45, marginBottom: 10,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                {paying
                  ? <><Loader2 size={15} className="animate-spin" />Loading...</>
                  : expired ? "Entry Closed"
                  : pill.status === "pending" ? "Resume"
                  : `Pay ₦${entryFee.toLocaleString()}`
                }
              </button>
            )}
            <button onClick={onClose}
              style={{ width: "100%", padding: "10px 0", border: "none", background: "none", fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", cursor: "pointer" }}>
              Not now
            </button>
          </>
        )}

        {/* Step 2 — Ready screen (Standard Pills only, shown after payment confirms) */}
        {step === "ready" && prefetched && (
          <motion.div key="ready" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            {/* Category hint */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em",
                padding: "3px 10px", borderRadius: 20, backgroundColor: `${cardColor}20`, color: cardColor }}>
                {pack.category}
              </span>
            </div>
            {/* Challenge phrase */}
            <div style={{ borderRadius: 12, padding: "18px 20px", backgroundColor: `${cardColor}10`,
              border: `1px solid ${cardColor}25`, marginBottom: 18, textAlign: "center" }}>
              <p style={{ fontSize: 15, fontWeight: 800, color: "var(--text-primary)", margin: "0 0 8px", lineHeight: 1.4 }}>
                Think you&apos;re sharp enough to get this right?
              </p>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0, lineHeight: 1.55 }}>
                Answer correctly and win{" "}
                <span style={{ fontFamily: "monospace", fontWeight: 800, color: cardColor }}>
                  ₦{prize.toLocaleString()}
                </span>.
                {timerLabel && (
                  <span style={{ color: "var(--text-muted)" }}> You&apos;ll have {timerLabel} on the clock.</span>
                )}
              </p>
            </div>
            {/* Paid confirmation — only shown for fresh payment, not resume */}
            {!wasResumed && (
              <p style={{ textAlign: "center", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 18 }}>
                ✓ ₦{entryFee.toLocaleString()} paid — question is loaded and waiting
              </p>
            )}
            {wasResumed && (
              <p style={{ textAlign: "center", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 18 }}>
                Your question is ready — pick up where you left off
              </p>
            )}
            <button onClick={() => onConfirm(prefetched)}
              style={{ width: "100%", padding: "14px 0", borderRadius: 11, border: "none",
                backgroundColor: cardColor, color: "#000", fontSize: 15, fontWeight: 800,
                cursor: "pointer", marginBottom: 8 }}>
              Start
            </button>
            <p style={{ textAlign: "center", fontSize: 11, color: "var(--text-muted)", margin: 0 }}>
              Timer starts the moment you tap Start
            </p>
          </motion.div>
        )}

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

  // Hero: all explicitly featured packs — no fallback to first pack
  const featuredPacks = filteredPacks.filter((p) => p.is_featured);
  // Standard Packs: everything that isn't featured
  const standardPacks2 = filteredPacks.filter((p) => !p.is_featured);

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
    // Standard pack — prefer a pending (paid, not answered) pill for resume; else first available
    const pendingPill = pack.pills.find((p) => p.status === "pending");
    const firstAvail  = pack.pills.find((p) => p.status === "available");
    const target = pendingPill ?? firstAvail;
    if (target) setSheet({ pack, pill: target });
    // If no available or pending pills, the card is already visually disabled — do nothing
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
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {[1,2,3].map((i) => <div key={i} className="skeleton" style={{ height: 66, borderRadius: 12 }} />)}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

          {/* Category chips */}
          {categories.length > 0 && (
            <CategoryChips categories={categories} active={activeCategory} onChange={setActiveCategory} />
          )}

          {/* Featured today — carousel when multiple featured packs */}
          {featuredPacks.length > 0 && (
            <section>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-muted)", marginBottom: 10 }}>
                Featured today
              </p>
              <HeroCarousel packs={featuredPacks} onPackClick={handlePackClick} />
            </section>
          )}

          {/* Standard Packs — vertical list */}
          {standardPacks2.length > 0 && (
            <section>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10 }}>
                <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-muted)", margin: 0 }}>
                  Standard Packs
                </p>
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                  {standardPacks2.filter(p =>
                    p.pills.some(pill => pill.status === "available" || pill.status === "pending")
                  ).length} available
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {standardPacks2.map((pack) => (
                  <PackRow key={pack.id} pack={pack} onClick={() => handlePackClick(pack)} />
                ))}
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
        onConfirm={(prefetched) => {
          const { pack, pill } = sheet;
          const isSpecial = pack.is_vip || (pack as any).pack_type === "special" || pack.question_count != null;
          setSheet(null);
          if (isSpecial) {
            router.push(`/pills/vip/${pack.id}/play`);
          } else {
            // Store prefetched question in sessionStorage so play page skips the open() call
            if (prefetched) {
              try {
                sessionStorage.setItem(`pill_prefetch_${pill.id}`, JSON.stringify(prefetched));
              } catch { /* quota — silent, play page falls back to open() */ }
            }
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
