"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/context/AppContext";
import {
  pillsApi, predictionsApi, blitzApi, playerApi,
  type PillPack, type PillPackPill, type PredictionData, type BlitzTournament, ApiError,
} from "@/lib/api";
import { Clock, ChevronLeft, Zap, ArrowRight, Package, Wand2, AlertCircle, X } from "lucide-react";
import Link from "next/link";

// Feature flag — set NEXT_PUBLIC_BLITZ_ENABLED=true in env to re-enable
const BLITZ_ENABLED = process.env.NEXT_PUBLIC_BLITZ_ENABLED === "true";

// ─── Category colour map ───────────────────────────────────────────────────
const CAT_COLOR: Record<string, string> = {
  Football: "#4C6FFF", Basketball: "#7C6FE8", Cricket: "#E8A33D",
  Crypto: "#8B5CF6", Politics: "#EC4899", Entertainment: "#FFD700",
  Technology: "#00CFFF", Science: "#00FF66", Food: "#FF6B9D",
  Lifestyle: "#FF8800", "General Knowledge": "#8B5CF6",
  Sports: "#4C6FFF",
};
const catColor = (cat: string) => CAT_COLOR[cat] ?? "#4C6FFF";

// ─── HorizontalScrollRow ──────────────────────────────────────────────────
// ONE shared component for every horizontally-scrolling section.
// Defensive properties that prevent the parent from being pushed wide:
//   - overflow-x: auto  → enables scroll
//   - overflow-y: hidden → no vertical bar
//   - white-space: nowrap → single line
//   - min-width: 0 on the div itself AND on the inner track → flex child won't
//     force the row wider than its container (the most common cause of page-
//     level overflow in this app)
//   - -webkit-overflow-scrolling: touch → iOS momentum scrolling
function HorizontalScrollRow({ children, gap = 12 }: { children: React.ReactNode; gap?: number }) {
  return (
    <div
      style={{
        width: "100%",
        minWidth: 0,
        overflowX: "auto",
        overflowY: "hidden",
        WebkitOverflowScrolling: "touch",
      }}
    >
      <div
        style={{
          display: "flex",
          gap,
          minWidth: "min-content",
          paddingBottom: 4,
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ─── Segment filter ───────────────────────────────────────────────────────
type FilterVal = "All" | "Pills" | "Predictions" | "Blitz";
const SEGMENTS: FilterVal[] = BLITZ_ENABLED
  ? ["All", "Pills", "Predictions", "Blitz"]
  : ["All", "Pills", "Predictions"];

function SegmentFilter({ active, onChange }: { active: FilterVal; onChange: (v: FilterVal) => void }) {
  return (
    <HorizontalScrollRow gap={8}>
      {SEGMENTS.map((seg) => (
        <button
          key={seg}
          onClick={() => onChange(seg)}
          style={{
            flexShrink: 0,
            padding: "8px 16px",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            transition: "all .15s",
            backgroundColor: active === seg ? "var(--accent-indigo)" : "transparent",
            color: active === seg ? "#000" : "var(--text-secondary)",
            border: active === seg ? "none" : "1px solid var(--border-subtle)",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          {seg}
        </button>
      ))}
    </HorizontalScrollRow>
  );
}

// ─── Pack card ────────────────────────────────────────────────────────────
function PackCard({ pack, onClick }: { pack: PillPack; onClick: () => void }) {
  const color = catColor(pack.category);
  const price = pack.pills.length > 0 ? pack.pills[0].price : 0;
  return (
    <motion.button
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      style={{
        flexShrink: 0,
        width: 148,
        borderRadius: 10,
        overflow: "hidden",
        backgroundColor: "var(--bg-card)",
        textAlign: "left",
        cursor: "pointer",
        border: `1px solid ${color}44`,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Coloured top stripe */}
      <div style={{ height: 3, backgroundColor: color, width: "100%" }} />

      <div style={{ padding: "10px 11px 11px", flex: 1, display: "flex", flexDirection: "column", gap: 7 }}>
        {/* Category + count on same line, category truncates if needed */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>
            {pack.category}
          </span>
          <span style={{ fontSize: 9, fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0, padding: "1px 5px", borderRadius: 20, backgroundColor: `${color}20`, color }}>
            {pack.pills.length}p
          </span>
        </div>

        {/* Pack name */}
        <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", margin: 0, lineHeight: 1.3 }}>
          {pack.name}
        </p>

        {/* Price + arrow */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto" }}>
          <p style={{ fontSize: 11, fontFamily: "monospace", fontWeight: 700, color: "var(--accent-amber)", margin: 0 }}>
            ₦{price.toLocaleString()}
          </p>
          <ArrowRight size={12} style={{ color, flexShrink: 0 }} />
        </div>
      </div>
    </motion.button>
  );
}

// ─── Pill chip (inside-pack view) ─────────────────────────────────────────
function PillChip({ pack, pill, onClick }: { pack: PillPack; pill: PillPackPill; onClick: () => void }) {
  const color = catColor(pack.category);
  const locked = pill.status !== "available";
  return (
    <motion.button
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      onClick={onClick}
      disabled={locked}
      style={{
        flexShrink: 0,
        width: 88,
        borderRadius: 44,
        padding: 12,
        border: `1.5px solid ${locked ? "var(--border-subtle)" : color}`,
        backgroundColor: "var(--bg-card)",
        opacity: locked ? 0.5 : 1,
        cursor: locked ? "not-allowed" : "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
      }}
    >
      {locked ? (
        <>
          <Clock size={15} style={{ color: "var(--text-muted)" }} />
          <span style={{ fontSize: 11, fontFamily: "monospace", fontWeight: 700, color: "var(--text-muted)" }}>soon</span>
        </>
      ) : (
        <>
          <Package size={15} style={{ color: "#fff", backgroundColor: color, borderRadius: "50%", padding: 3 }} />
          <span style={{ fontSize: 11, fontFamily: "monospace", fontWeight: 700, color: "var(--accent-amber)" }}>₦{pill.price}</span>
        </>
      )}
    </motion.button>
  );
}

// ─── Prediction card — "event ticket" aesthetic ───────────────────────────
// Distinct from Pills:
//   - Full-width stacked layout (no horizontal scroll)
//   - Accent color left border (3px) + faint background tint
//   - Countdown clock is the dominant visual — large mono font, top-right
//   - Category pill-badge top-left
//   - Entry / Prize on a dashed divider row (ticket stub feel)
function PredictionCard({ prediction, onClick }: { prediction: PredictionData; onClick: () => void }) {
  const [timeLeft, setTimeLeft] = useState(0);
  useEffect(() => {
    const tick = () => setTimeLeft(Math.max(0, Math.floor((new Date(prediction.countdown_end).getTime() - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [prediction.countdown_end]);

  const locked = prediction.status === "locked" || timeLeft <= 0;
  const h = Math.floor(timeLeft / 3600);
  const m = Math.floor((timeLeft % 3600) / 60);
  const s = timeLeft % 60;
  const timeLabel = locked
    ? "Closed"
    : h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    : `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  const color = catColor(prediction.category);

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.985 }}
      onClick={onClick}
      style={{
        width: "100%",
        boxSizing: "border-box",
        borderRadius: 12,
        padding: "0",
        textAlign: "left",
        cursor: "pointer",
        backgroundColor: "var(--bg-card)",
        border: `1px solid rgba(255,255,255,0.06)`,
        borderLeft: `3px solid ${color}`,
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Faint category-color background wash */}
      <div style={{ position: "absolute", inset: 0, backgroundColor: color, opacity: 0.03, pointerEvents: "none" }} />

      <div style={{ position: "relative", padding: "11px 14px 0" }}>
        {/* Row 1: category badge + countdown */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
          <span style={{
            fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em",
            padding: "2px 6px", borderRadius: 4,
            backgroundColor: `${color}22`, color,
          }}>
            {prediction.category}
          </span>
          <span style={{
            fontSize: 13, fontFamily: "monospace", fontWeight: 800,
            color: locked ? "var(--text-muted)" : color,
            letterSpacing: "-0.02em",
          }}>
            {timeLabel}
          </span>
        </div>

        {/* Question */}
        <p style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.4, color: "var(--text-primary)", margin: "0 0 11px" }}>
          {prediction.question}
        </p>
      </div>

      {/* Ticket stub divider + footer */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "7px 15px",
        borderTop: `1px dashed ${color}40`,
        backgroundColor: `${color}08`,
      }}>
        <div>
          <p style={{ fontSize: 9, color: "var(--text-muted)", margin: "0 0 1px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Entry</p>
          <p style={{ fontSize: 12, fontFamily: "monospace", fontWeight: 700, color: "var(--accent-amber)", margin: 0 }}>
            ₦{prediction.fee.toLocaleString()}
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: 9, color: "var(--text-muted)", margin: "0 0 1px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Prize pool</p>
          <p style={{ fontSize: 12, fontFamily: "monospace", fontWeight: 700, color, margin: 0 }}>
            ₦{prediction.prize_per_winner.toLocaleString()}
          </p>
        </div>
      </div>
    </motion.button>
  );
}

// ─── Live Blitz module ────────────────────────────────────────────────────
function BlitzModule({ tournament, onClick }: { tournament: BlitzTournament; onClick: () => void }) {
  const isLive = tournament.status === "active";
  const isReg = tournament.status === "registration";
  const [countdown, setCountdown] = useState("");
  const [estimate, setEstimate] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => {
      const target = isLive
        ? new Date(tournament.tournament_end).getTime()
        : new Date(tournament.tournament_start).getTime();
      const ms = target - Date.now();
      if (ms <= 0) { setCountdown(isLive ? "Ending soon" : "Starting now"); return; }
      const hrs = Math.floor(ms / 3600000);
      const mins = Math.floor((ms % 3600000) / 60000);
      setCountdown(hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [tournament, isLive]);

  useEffect(() => {
    if (isReg) {
      setEstimate(tournament.entry_fee * tournament.total_registered * 0.8);
    } else {
      setEstimate(tournament.prize_pool);
    }
  }, [tournament, isReg]);

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      style={{
        width: "100%",
        boxSizing: "border-box",
        borderRadius: 10,
        padding: "20px 20px",
        textAlign: "left",
        cursor: "pointer",
        border: "2px solid var(--accent-amber)",
        backgroundColor: "var(--bg-card)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", inset: 0, backgroundColor: "var(--accent-amber)", opacity: 0.06 }} />
      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          {isLive && (
            <motion.div
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 1.4, repeat: Infinity }}
              style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#ef4444" }}
            />
          )}
          <span style={{ fontSize: 11, fontFamily: "monospace", fontWeight: 700, color: isLive ? "#ef4444" : "var(--accent-amber)" }}>
            {isLive ? "LIVE" : "STARTS IN"}
          </span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
          <p style={{ fontSize: 17, fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>{tournament.title}</p>
          <span style={{ fontSize: 22, fontFamily: "monospace", fontWeight: 700, flexShrink: 0, color: "var(--accent-amber)" }}>
            {countdown}
          </span>
        </div>
        <p style={{ fontSize: 16, fontFamily: "monospace", fontWeight: 700, color: "var(--accent-amber)", margin: "0 0 4px" }}>
          ₦{(estimate ?? tournament.prize_pool).toLocaleString()}
        </p>
        {isReg && (
          <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "0 0 14px" }}>
            {tournament.total_registered} registered
          </p>
        )}
        <div style={{ width: "100%", padding: "8px 0", borderRadius: 8, backgroundColor: "var(--accent-amber)", textAlign: "center", fontSize: 13, fontWeight: 600, color: "#000", marginTop: 8 }}>
          Join · ₦{tournament.entry_fee.toLocaleString()}
        </div>
      </div>
    </motion.button>
  );
}

// ─── Pill confirm sheet ────────────────────────────────────────────────────
function PillSheet({ pack, pill, onConfirm, onClose, balance, bonusBalance }: {
  pack: PillPack; pill: PillPackPill; onConfirm: () => void; onClose: () => void; balance: number; bonusBalance: number;
}) {
  const [err, setErr] = useState("");
  const color = catColor(pack.category);
  const totalAvailable = balance + bonusBalance;
  const canAfford = totalAvailable >= pill.price;
  // How much comes from bonus vs real balance
  const bonusUsed = Math.min(bonusBalance, pill.price);
  const realUsed = pill.price - bonusUsed;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
      onClick={onClose}
    >
      <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)" }} />
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 340, damping: 32 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative", width: "100%", maxWidth: 420,
          borderRadius: "24px 24px 0 0", padding: "28px 24px 32px",
          backgroundColor: "var(--bg-card)",
        }}
      >
        <div style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: "#333", margin: "0 auto 20px" }} />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", backgroundColor: color, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Package size={22} color="#fff" />
          </div>
          <p style={{ fontSize: 17, fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>{pack.name}</p>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>{pack.category}</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
          <div style={{ borderRadius: 10, padding: "10px 12px", textAlign: "center", border: "1px solid var(--accent-amber)", backgroundColor: "rgba(232,163,61,0.08)" }}>
            <p style={{ fontSize: 11, color: "var(--text-secondary)", margin: "0 0 4px" }}>Entry Fee</p>
            <p style={{ fontSize: 17, fontFamily: "monospace", fontWeight: 700, color: "var(--accent-amber)", margin: 0 }}>₦{pill.price.toLocaleString()}</p>
          </div>
          <div style={{ borderRadius: 10, padding: "10px 12px", textAlign: "center", border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-base)" }}>
            <p style={{ fontSize: 11, color: "var(--text-secondary)", margin: "0 0 4px" }}>Win up to</p>
            <p style={{ fontSize: 17, fontFamily: "monospace", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>₦{pill.prize.toLocaleString()}</p>
          </div>
        </div>
        {/* Bonus breakdown — only shown when bonus contributes */}
        {bonusUsed > 0 && canAfford && (
          <p style={{ fontSize: 11, textAlign: "center", marginBottom: 12, color: "var(--accent-amber)" }}>
            ₦{bonusUsed.toLocaleString()} from bonus credit{realUsed > 0 ? ` + ₦${realUsed.toLocaleString()} from balance` : " (fully covered)"}
          </p>
        )}
        {!canAfford && <p style={{ textAlign: "center", color: "#f87171", fontSize: 13, marginBottom: 10 }}>Insufficient balance. <Link href="/wallet" style={{ textDecoration: "underline", fontWeight: 600 }}>Add funds</Link></p>}
        {err && <p style={{ textAlign: "center", color: "#f87171", fontSize: 13, marginBottom: 10 }}>{err} <Link href="/profile" style={{ textDecoration: "underline", fontWeight: 600 }}>Adjust limits</Link></p>}
        <button
          onClick={() => { setErr(""); onConfirm(); }}
          disabled={!canAfford}
          style={{ width: "100%", padding: "13px 0", borderRadius: 10, border: "none", backgroundColor: color, color: "#000", fontSize: 14, fontWeight: 600, cursor: canAfford ? "pointer" : "not-allowed", opacity: canAfford ? 1 : 0.4, marginBottom: 10 }}
        >
          Take This Pill
        </button>
        <button onClick={onClose} style={{ width: "100%", padding: "12px 0", border: "none", background: "none", fontSize: 14, fontWeight: 600, color: "var(--text-secondary)", cursor: "pointer" }}>
          Cancel
        </button>
      </motion.div>
    </motion.div>
  );
}

// ─── Section header ────────────────────────────────────────────────────────
function SectionHeader({ icon, title, href, linkLabel = "see all" }: {
  icon: React.ReactNode; title: string; href: string; linkLabel?: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
        {icon}
        <h2 style={{ fontSize: 17, fontWeight: 600, color: "var(--text-primary)", margin: 0, whiteSpace: "nowrap" }}>
          {title}
        </h2>
      </div>
      <Link href={href} style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", flexShrink: 0, marginLeft: 8, textDecoration: "none" }}>
        {linkLabel}
      </Link>
    </div>
  );
}

// ─── Empty state card ──────────────────────────────────────────────────────
function EmptyCard({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div style={{
      width: "100%", boxSizing: "border-box", borderRadius: 10, padding: "28px 20px",
      display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
      border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-card)",
    }}>
      {icon}
      <div>
        <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>{title}</p>
        <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>{subtitle}</p>
      </div>
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────
export default function PlayPage() {
  const { state } = useApp();
  const router = useRouter();
  const [packs, setPacks] = useState<PillPack[]>([]);
  const [vipPacks, setVipPacks] = useState<PillPack[]>([]);
  const [predictions, setPredictions] = useState<PredictionData[]>([]);
  const [blitz, setBlitz] = useState<BlitzTournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sheet, setSheet] = useState<{ pack: PillPack; pill: PillPackPill } | null>(null);
  const [filter, setFilter] = useState<FilterVal>("All");
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null);
  const [playsToday, setPlaysToday] = useState(0);
  const [nudgeDismissed, setNudgeDismissed] = useState(false);

  useEffect(() => {
    if (!state.isAuthenticated) { router.push("/auth"); return; }
    fetchAll();
    const id = setInterval(fetchAll, 15000);
    return () => clearInterval(id);
  }, [state.isAuthenticated]); // eslint-disable-line

  const fetchAll = useCallback(async () => {
    try {
      const [pR, predR, bR, spendR] = await Promise.allSettled([
        pillsApi.getPacks(),
        predictionsApi.getActive(),
        blitzApi.getAll(),
        playerApi.getSpendSummary(),
      ]);
      if (pR.status === "fulfilled") {
        const allPacks = (pR.value.packs ?? []).filter((p) => p.status === "active");
        // Separate VIP from standard — they render in different sections
        setPacks(allPacks.filter((p) => !p.is_vip));
        setVipPacks(allPacks.filter((p) => p.is_vip));
      }
      if (predR.status === "fulfilled") setPredictions(predR.value.predictions ?? []);
      if (bR.status === "fulfilled") setBlitz(bR.value.tournaments ?? []);
      if (spendR.status === "fulfilled") setPlaysToday(spendR.value.plays_today ?? 0);
    } catch (e) {
      if (e instanceof ApiError) setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const showPills = filter === "All" || filter === "Pills";
  const showPred  = filter === "All" || filter === "Predictions";
  const showBlitz = BLITZ_ENABLED && (filter === "All" || filter === "Blitz");
  const liveBlitz = blitz.filter((t) => t.status === "active" || t.status === "registration");
  const selectedPack = selectedPackId ? packs.find((p) => p.id === selectedPackId) ?? null : null;

  if (!state.isAuthenticated) return null;

  return (
    // ONE page wrapper. width:100%, overflow-x:hidden, box-sizing:border-box.
    // This is the only place overflow-x containment is set — not on html/body
    // (which breaks iOS scroll) and not scattered per-section.
    <div style={{
      width: "100%",
      maxWidth: "100vw",
      overflowX: "hidden",
      boxSizing: "border-box",
      padding: "20px 16px 100px",
      minHeight: "100%",
    }}>

      {/* Error banner */}
      {error && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 8, marginBottom: 16, border: "1px solid var(--border-subtle)", backgroundColor: "rgba(239,68,68,0.05)", color: "#f87171", fontSize: 13 }}>
          <AlertCircle size={15} style={{ flexShrink: 0 }} />
          {error}
        </div>
      )}

      {/* Responsible-play nudge */}
      <AnimatePresence>
        {playsToday > 5 && !nudgeDismissed && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 8, marginBottom: 16, border: "1px solid var(--accent-amber)", backgroundColor: "rgba(232,163,61,0.08)" }}
          >
            <p style={{ fontSize: 13, color: "var(--text-primary)", margin: 0 }}>
              You&apos;ve played {playsToday} times today.{" "}
              <Link href="/profile" style={{ fontWeight: 600, textDecoration: "underline", color: "inherit" }}>Set a limit</Link>
            </p>
            <button onClick={() => setNudgeDismissed(true)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--accent-amber)", padding: 4, flexShrink: 0 }}>
              <X size={15} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── SEGMENT FILTER ── */}
      <div style={{ marginBottom: 24 }}>
        <SegmentFilter active={filter} onChange={setFilter} />
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          {/* Skeleton — Pills section */}
          <div>
            <div className="skeleton" style={{ height: 20, width: 120, borderRadius: 6, marginBottom: 14 }} />
            <div style={{ display: "flex", gap: 12, overflow: "hidden" }}>
              {[1,2].map((i) => (
                <div key={i} className="skeleton" style={{ flexShrink: 0, width: 200, height: 96, borderRadius: 10 }} />
              ))}
            </div>
          </div>
          {/* Skeleton — Predictions section */}
          <div>
            <div className="skeleton" style={{ height: 20, width: 160, borderRadius: 6, marginBottom: 14 }} />
            {[1,2].map((i) => (
              <div key={i} className="skeleton" style={{ height: 110, borderRadius: 12, marginBottom: 10 }} />
            ))}
          </div>
          {/* Skeleton — Blitz section */}
          <div>
            <div className="skeleton" style={{ height: 20, width: 100, borderRadius: 6, marginBottom: 14 }} />
            <div className="skeleton" style={{ height: 140, borderRadius: 10 }} />
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* ── VIP PACKS — amber glow section, above standard pills ── */}
          {showPills && vipPacks.length > 0 && (
            <section>
              <SectionHeader
                icon={
                  <span style={{ fontSize: 11, fontWeight: 800, padding: "2px 6px", borderRadius: 4, backgroundColor: "rgba(232,163,61,0.15)", color: "var(--accent-amber)", boxShadow: "0 0 8px rgba(232,163,61,0.25)", flexShrink: 0 }}>
                    VIP
                  </span>
                }
                title="VIP Challenges"
                href="/pills"
              />
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {vipPacks.map((pack) => {
                  const color = catColor(pack.category);
                  const price = pack.pills.length > 0 ? pack.pills[0].price : 0;
                  const prize = pack.pills.length > 0 ? pack.pills[0].prize : 0;
                  return (
                    <motion.button
                      key={pack.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => router.push(`/pills/vip/${pack.id}/play`)}
                      style={{
                        width: "100%", boxSizing: "border-box", borderRadius: 14,
                        padding: "16px 18px", textAlign: "left", cursor: "pointer",
                        backgroundColor: "var(--bg-card)",
                        border: "1.5px solid rgba(232,163,61,0.5)",
                        boxShadow: "0 0 16px rgba(232,163,61,0.15)",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                            <span style={{ fontSize: 10, fontWeight: 800, padding: "1px 6px", borderRadius: 4, backgroundColor: "rgba(232,163,61,0.15)", color: "var(--accent-amber)" }}>VIP</span>
                            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>{pack.name}</p>
                          </div>
                          <p style={{ fontSize: 11, color: "var(--text-secondary)", margin: 0 }}>10 questions · answer all to win</p>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <p style={{ fontSize: 10, color: "var(--text-muted)", margin: "0 0 2px" }}>Prize</p>
                          <p style={{ fontSize: 15, fontFamily: "monospace", fontWeight: 700, color: "var(--accent-amber)", margin: 0 }}>₦{prize.toLocaleString()}</p>
                        </div>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <p style={{ fontSize: 11, fontFamily: "monospace", color: "var(--text-muted)", margin: 0 }}>₦{price.toLocaleString()} entry</p>
                        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--accent-amber)" }}>Start Challenge →</span>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── PILL PACKS (standard only) ── */}
          {showPills && (
            <section>
              <SectionHeader
                icon={
                  <span style={{
                    fontSize: 10, fontWeight: 800, padding: "3px 9px",
                    borderRadius: 20, letterSpacing: "0.06em",
                    backgroundColor: "rgba(76,111,255,0.15)",
                    color: "var(--accent-indigo)",
                    border: "1px solid rgba(76,111,255,0.25)",
                    flexShrink: 0,
                  }}>
                    PILLS
                  </span>
                }
                title={packs.length > 0 ? `${packs.length} pack${packs.length !== 1 ? "s" : ""} live` : "Daily Pills"}
                href="/pills"
              />

              {selectedPack ? (
                <>
                  <button
                    onClick={() => setSelectedPackId(null)}
                    style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", fontSize: 13, marginBottom: 12, padding: 0 }}
                  >
                    <ChevronLeft size={15} /> {selectedPack.name}
                  </button>
                  <HorizontalScrollRow>
                    {selectedPack.pills.map((pill) => (
                      <PillChip key={pill.id} pack={selectedPack} pill={pill} onClick={() => setSheet({ pack: selectedPack, pill })} />
                    ))}
                  </HorizontalScrollRow>
                </>
              ) : packs.length === 0 ? (
                <EmptyCard icon={<Clock size={16} style={{ color: "var(--text-muted)" }} />} title="No packs live" subtitle="Check back soon" />
              ) : (
                <HorizontalScrollRow>
                  {packs.map((pack) => (
                    <PackCard key={pack.id} pack={pack} onClick={() => setSelectedPackId(pack.id)} />
                  ))}
                </HorizontalScrollRow>
              )}
            </section>
          )}

          {/* ── TIME MACHINE ── */}
          {showPred && (
            <section>
              <SectionHeader
                icon={<Wand2 size={17} style={{ color: "var(--accent-violet)", flexShrink: 0 }} />}
                title={predictions.length > 0 ? `${predictions.length} open event${predictions.length !== 1 ? "s" : ""}` : "Time Machine"}
                href="/time-machine"
                linkLabel={predictions.length > 0 ? "see all" : ""}
              />
              {predictions.length === 0 ? (
                <EmptyCard icon={<Wand2 size={16} style={{ color: "var(--accent-violet)" }} />} title="No open predictions" subtitle="New events added regularly" />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {predictions.slice(0, 4).map((p) => (
                    <PredictionCard key={p.id} prediction={p} onClick={() => router.push(`/predictions/play/${p.id}`)} />
                  ))}
                  {predictions.length > 4 && (
                    <Link href="/time-machine" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px 0", borderRadius: 8, border: "1px solid var(--border-subtle)", fontSize: 13, fontWeight: 600, color: "var(--accent-violet)", textDecoration: "none" }}>
                      +{predictions.length - 4} more <ArrowRight size={13} />
                    </Link>
                  )}
                </div>
              )}
            </section>
          )}

          {/* ── LIVE BLITZ ── */}
          {showBlitz && (
            <section>
              <SectionHeader
                icon={<Zap size={17} style={{ color: "var(--accent-amber)", flexShrink: 0 }} />}
                title={liveBlitz.length > 0 ? `${liveBlitz.length} upcoming` : "Live Blitz"}
                href="/blitz"
              />
              {liveBlitz.length === 0 ? (
                <div style={{ width: "100%", boxSizing: "border-box", borderRadius: 10, padding: "20px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-card)" }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-secondary)", margin: 0 }}>No active tournaments</p>
                    <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>New Blitz events launch weekly</p>
                  </div>
                  <Link href="/blitz" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: "var(--accent-amber)", textDecoration: "none", flexShrink: 0, marginLeft: 12 }}>
                    Browse <ArrowRight size={12} />
                  </Link>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {liveBlitz.map((t) => (
                    <BlitzModule key={t.id} tournament={t} onClick={() => router.push(`/blitz/${t.id}`)} />
                  ))}
                </div>
              )}
            </section>
          )}

        </div>
      )}

      {/* Pill confirm sheet */}
      <AnimatePresence>
        {sheet && (
          <PillSheet
            pack={sheet.pack} pill={sheet.pill}
            balance={state.player?.balance ?? 0}
            bonusBalance={state.player?.bonus_balance ?? 0}
            onConfirm={() => { const pill = sheet.pill; setSheet(null); router.push(`/pills/play/${pill.id}`); }}
            onClose={() => setSheet(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
