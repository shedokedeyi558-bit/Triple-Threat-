"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { predictionsApi, ApiError, type PredictionData, type MyPrediction } from "@/lib/api";
import { Clock, Users, CheckCircle2, ArrowRight, Wand2 } from "lucide-react";

// Category colour map
const CAT_COLOR: Record<string, string> = {
  Football: "#4C6FFF", Basketball: "#7C6FE8", Cricket: "#E8A33D",
  Crypto: "#8B5CF6", Politics: "#EC4899", Entertainment: "#FFD700",
  Technology: "#00CFFF", Science: "#00FF66", Food: "#FF6B9D",
  Lifestyle: "#FF8800", "General Knowledge": "#8B5CF6", Sports: "#4C6FFF",
};
const catColor = (cat: string) => CAT_COLOR[cat] ?? "#4C6FFF";

// ── Countdown hook ────────────────────────────────────────────────────────
function useCountdown(target: string) {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    const tick = () => setLeft(Math.max(0, Math.floor((new Date(target).getTime() - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);
  const h = Math.floor(left / 3600);
  const m = Math.floor((left % 3600) / 60);
  const s = left % 60;
  const short = left <= 0 ? "Closed" : h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${String(s).padStart(2,"0")}s` : `${s}s`;
  return { left, short, expired: left <= 0 };
}

// ── Segment tabs ──────────────────────────────────────────────────────────
type TabVal = "open" | "mine" | "settled";
function SegTabs({ active, onChange, mineCt, settledCt }: {
  active: TabVal; onChange: (t: TabVal) => void; mineCt: number; settledCt: number;
}) {
  return (
    <div style={{ display: "flex", gap: 4, padding: 4, borderRadius: 10, backgroundColor: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
      {([["open","Open",null],["mine","My picks",mineCt],["settled","Settled",settledCt]] as [TabVal,string,number|null][]).map(([val,label,ct]) => (
        <button key={val} onClick={() => onChange(val)}
          style={{
            flex: 1, padding: "9px 0", fontSize: 13, fontWeight: 700, borderRadius: 8, border: "none",
            cursor: "pointer", transition: "all .15s",
            backgroundColor: active === val ? "var(--accent-indigo)" : "transparent",
            color: active === val ? "#fff" : "var(--text-secondary)",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
          }}>
          {label}
          {ct !== null && ct > 0 && (
            <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 5px", borderRadius: 20, backgroundColor: active === val ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.07)", color: active === val ? "#fff" : "var(--text-muted)" }}>
              {ct}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ── Hero event card (soonest-closing open event) ──────────────────────────
function HeroEvent({ p, onClick }: { p: PredictionData; onClick: () => void }) {
  const color = catColor(p.category);
  const countdown = useCountdown(p.countdown_end);
  const fill = Math.round((p.slots_filled / p.max_slots) * 100);
  return (
    <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} whileTap={{ scale: 0.98 }}
      onClick={onClick}
      style={{
        width: "100%", boxSizing: "border-box", borderRadius: 16, padding: 0, textAlign: "left",
        cursor: "pointer", overflow: "hidden", backgroundColor: "var(--bg-card)",
        border: `1.5px solid ${color}50`, boxShadow: `0 4px 24px ${color}18`, position: "relative",
      }}>
      <div style={{ position: "absolute", top: -30, right: -30, width: 140, height: 140, borderRadius: "50%", backgroundColor: color, opacity: 0.06, pointerEvents: "none" }} />
      <div style={{ height: 3, background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
      <div style={{ padding: "16px 18px 14px", position: "relative" }}>
        {/* Category + countdown */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", padding: "2px 8px", borderRadius: 20, backgroundColor: `${color}20`, color }}>
            {p.category}
          </span>
          <span style={{ fontSize: 15, fontFamily: "monospace", fontWeight: 800, color: countdown.expired ? "var(--text-muted)" : "var(--accent-amber)", letterSpacing: "-0.02em" }}>
            {countdown.expired ? "Closed" : `${countdown.short} left`}
          </span>
        </div>
        {/* Question */}
        <p style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.45, color: "var(--text-primary)", margin: "0 0 14px" }}>
          {p.question}
        </p>
        {/* Entry + prize row */}
        <div style={{ display: "flex", gap: 20, marginBottom: 12 }}>
          <div>
            <p style={{ fontSize: 9, color: "var(--text-muted)", margin: "0 0 2px", textTransform: "uppercase" }}>Entry</p>
            <p style={{ fontSize: 15, fontFamily: "monospace", fontWeight: 700, color: "var(--accent-amber)", margin: 0 }}>₦{p.fee.toLocaleString()}</p>
          </div>
          <div>
            <p style={{ fontSize: 9, color: "var(--text-muted)", margin: "0 0 2px", textTransform: "uppercase" }}>Prize pool</p>
            <p style={{ fontSize: 15, fontFamily: "monospace", fontWeight: 700, color, margin: 0 }}>₦{p.prize_per_winner.toLocaleString()}</p>
          </div>
        </div>
        {/* Participation bar */}
        <div>
          <div style={{ height: 4, borderRadius: 2, backgroundColor: "var(--border-subtle)", overflow: "hidden", marginBottom: 5 }}>
            <motion.div initial={{ width: 0 }} animate={{ width: `${fill}%` }} transition={{ duration: 0.7 }}
              style={{ height: "100%", borderRadius: 2, backgroundColor: color }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 10, color: "var(--text-muted)" }}>
              <Users size={9} style={{ display: "inline", marginRight: 3 }} />{p.slots_filled} of {p.max_slots} spots taken
            </span>
            <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{p.max_slots - p.slots_filled} left</span>
          </div>
        </div>
      </div>
      <div style={{ padding: "8px 18px", backgroundColor: `${color}0D`, borderTop: `1px solid ${color}25`, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color }}>Enter Event <ArrowRight size={12} style={{ display: "inline" }} /></span>
      </div>
    </motion.button>
  );
}

// ── Compact open event row ────────────────────────────────────────────────
function OpenRow({ p, onClick }: { p: PredictionData; onClick: () => void }) {
  const color = catColor(p.category);
  const countdown = useCountdown(p.countdown_end);
  return (
    <motion.button initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} whileTap={{ scale: 0.985 }}
      onClick={onClick}
      style={{
        width: "100%", boxSizing: "border-box", borderRadius: 10, padding: "11px 14px 0",
        textAlign: "left", cursor: "pointer", backgroundColor: "var(--bg-card)",
        border: "1px solid rgba(255,255,255,0.06)", borderLeft: `3px solid ${color}`, overflow: "hidden",
      }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
        <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", padding: "2px 6px", borderRadius: 4, backgroundColor: `${color}22`, color }}>{p.category}</span>
        <span style={{ fontSize: 12, fontFamily: "monospace", fontWeight: 800, color: countdown.expired ? "var(--text-muted)" : color, letterSpacing: "-0.02em" }}>
          {countdown.expired ? "Closed" : countdown.short}
        </span>
      </div>
      <p style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.4, color: "var(--text-primary)", margin: "0 0 11px" }}>{p.question}</p>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderTop: `1px dashed ${color}40` }}>
        <p style={{ fontSize: 11, fontFamily: "monospace", fontWeight: 700, color: "var(--accent-amber)", margin: 0 }}>₦{p.fee.toLocaleString()} entry</p>
        <p style={{ fontSize: 11, fontFamily: "monospace", fontWeight: 700, color, margin: 0 }}>₦{p.prize_per_winner.toLocaleString()} prize</p>
      </div>
    </motion.button>
  );
}

// ── My picks card (active) ────────────────────────────────────────────────
function MineCard({ p, onClick }: { p: MyPrediction; onClick: () => void }) {
  const color = catColor(p.category);
  const countdown = useCountdown(p.countdown_end);
  // Support both state field (new backend) and needs_submission (old)
  const submitted = p.state ? p.state !== "entered_not_submitted" : !p.needs_submission;
  return (
    <motion.button initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} whileTap={{ scale: 0.985 }}
      onClick={onClick}
      style={{ width: "100%", boxSizing: "border-box", borderRadius: 10, padding: "11px 14px 0", textAlign: "left", cursor: "pointer", backgroundColor: "var(--bg-card)", border: "1px solid rgba(255,255,255,0.06)", borderLeft: `3px solid ${color}`, overflow: "hidden", position: "relative" }}>
      <div style={{ position: "absolute", inset: 0, backgroundColor: color, opacity: 0.03, pointerEvents: "none" }} />
      <div style={{ position: "relative" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
          <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", padding: "2px 6px", borderRadius: 4, backgroundColor: `${color}22`, color }}>{p.category}</span>
          <span style={{ fontSize: 12, fontFamily: "monospace", fontWeight: 800, color: countdown.expired ? "var(--text-muted)" : color }}>{countdown.expired ? "Locked" : countdown.short}</span>
        </div>
        <p style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.4, color: "var(--text-primary)", margin: "0 0 11px" }}>{p.question}</p>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderTop: `1px dashed ${color}40`, position: "relative" }}>
        {submitted ? (
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <CheckCircle2 size={11} style={{ color: "var(--accent-indigo)" }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)" }}>
              {countdown.expired ? "Locked · awaiting result" : `Locked in · ${countdown.short} left`}
            </span>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <Clock size={11} style={{ color: "var(--accent-amber)" }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--accent-amber)" }}>Awaiting your answer</span>
          </div>
        )}
        {!submitted && (
          <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 6, backgroundColor: "var(--accent-indigo)", color: "#fff" }}>Submit now</span>
        )}
      </div>
    </motion.button>
  );
}

// ── Settled card ──────────────────────────────────────────────────────────
function SettledCard({ p, onClick }: { p: MyPrediction; onClick: () => void }) {
  const color = catColor(p.category);
  const won = p.won === true;
  const lost = p.won === false;
  return (
    <motion.button initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} whileTap={{ scale: 0.985 }}
      onClick={onClick}
      style={{ width: "100%", boxSizing: "border-box", borderRadius: 10, padding: "11px 14px", textAlign: "left", cursor: "pointer", backgroundColor: "var(--bg-card)", border: "1px solid rgba(255,255,255,0.06)", borderLeft: `3px solid ${won ? "var(--accent-amber)" : lost ? "rgba(248,113,113,0.6)" : color}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
        <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", padding: "2px 6px", borderRadius: 4, backgroundColor: `${color}22`, color }}>{p.category}</span>
        <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{new Date(p.participated_at).toLocaleDateString("en-NG",{month:"short",day:"numeric"})}</span>
      </div>
      <p style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.4, color: "var(--text-primary)", margin: "0 0 10px" }}>{p.question}</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
        <div style={{ borderRadius: 7, padding: "6px 9px", backgroundColor: "var(--bg-base)", border: `1px solid ${won ? "rgba(76,111,255,0.25)" : lost ? "rgba(248,113,113,0.2)" : "var(--border-hairline)"}` }}>
          <p style={{ fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase", margin: "0 0 2px" }}>Your answer</p>
          <p style={{ fontSize: 12, fontWeight: 700, color: won ? "var(--accent-indigo)" : lost ? "#f87171" : "var(--text-secondary)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.my_answer || "—"}</p>
        </div>
        <div style={{ borderRadius: 7, padding: "6px 9px", backgroundColor: "var(--bg-base)", border: "1px solid rgba(232,163,61,0.2)" }}>
          <p style={{ fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase", margin: "0 0 2px" }}>Correct answer</p>
          <p style={{ fontSize: 12, fontWeight: 700, color: p.correct_answer ? "var(--accent-amber)" : "var(--text-muted)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontStyle: p.correct_answer ? "normal" : "italic" }}>{p.correct_answer ?? "Pending reveal"}</p>
        </div>
      </div>
      {won && <p style={{ fontSize: 13, fontFamily: "monospace", fontWeight: 800, color: "var(--accent-amber)", margin: 0 }}>+₦{(p.prize_won ?? p.prize_per_winner).toLocaleString()}</p>}
      {lost && <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", margin: 0 }}>Not this time</p>}
      {!won && !lost && <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", margin: 0, fontStyle: "italic" }}>Awaiting reveal</p>}
    </motion.button>
  );
}

function CardSkeleton() {
  return <div className="skeleton" style={{ height: 100, borderRadius: 10, marginBottom: 10 }} />;
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function EventsPage() {
  const router = useRouter();
  const { state } = useApp();
  const [tab, setTab] = useState<TabVal>("open");
  const [openPreds, setOpenPreds] = useState<PredictionData[]>([]);
  const [myPreds, setMyPreds] = useState<MyPrediction[]>([]);
  const [openLoading, setOpenLoading] = useState(true);
  const [mineLoading, setMineLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!state.isAuthenticated) { router.push("/auth"); return; }
    predictionsApi.getActive()
      .then((d) => setOpenPreds((d.predictions ?? []).filter((p) => p.status === "active" && new Date(p.countdown_end).getTime() > Date.now())))
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load events"))
      .finally(() => setOpenLoading(false));
  }, [state.isAuthenticated, router]);

  // Fetch mine fresh every time the tab is selected — no caching
  const fetchMine = useCallback(async () => {
    setMineLoading(true);
    try {
      const res = await predictionsApi.getMine();
      setMyPreds(res.predictions ?? []);
    } catch (e) {
      console.error("[Events] getMine error:", e);
      if (e instanceof ApiError && (e.status === 404 || e.status === 500)) {
        setMyPreds([]);
      } else {
        setError(e instanceof ApiError ? e.message : "Failed to load your predictions");
      }
    } finally {
      setMineLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "mine" || tab === "settled") fetchMine();
  }, [tab, fetchMine]);

  if (!state.isAuthenticated) return null;

  // Sort open events — soonest closing first
  const sortedOpen = [...openPreds].sort((a, b) => new Date(a.countdown_end).getTime() - new Date(b.countdown_end).getTime());
  const heroEvent = sortedOpen[0] ?? null;
  const restOpen = sortedOpen.slice(1);

  // Helper: determine if a prediction is "active" (in play, awaiting reveal)
  const isActive = (p: MyPrediction) => {
    if (p.state) return p.state === "entered_not_submitted" || p.state === "submitted_waiting";
    return p.status === "active" || p.status === "locked" || (p.status === "completed" && p.won === null && p.correct_answer === null);
  };
  const isSettled = (p: MyPrediction) => {
    if (p.state) return p.state === "completed_won" || p.state === "completed_lost" || p.state === "cancelled";
    return (p.status === "completed" && (p.won !== null || p.correct_answer !== null)) || p.status === "cancelled";
  };

  const active = myPreds.filter(isActive);
  const settled = myPreds.filter(isSettled);

  return (
    <div style={{ width: "100%", maxWidth: "100vw", overflowX: "hidden", boxSizing: "border-box", padding: "20px 16px 100px" }}>

      {/* Segment tabs */}
      <div style={{ marginBottom: 20 }}>
        <SegTabs active={tab} onChange={setTab} mineCt={active.length} settledCt={settled.length} />
      </div>

      {error && (
        <div style={{ padding: "10px 12px", borderRadius: 8, marginBottom: 16, backgroundColor: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", fontSize: 13 }}>
          {error}
        </div>
      )}

      <AnimatePresence mode="wait">

        {/* ── OPEN tab ── */}
        {tab === "open" && (
          <motion.div key="open" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
            {openLoading ? (
              <div>{[1,2,3].map((i) => <CardSkeleton key={i} />)}</div>
            ) : sortedOpen.length === 0 ? (
              <div style={{ borderRadius: 12, padding: "36px 20px", textAlign: "center", border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-card)" }}>
                <Wand2 size={28} style={{ color: "var(--text-muted)", margin: "0 auto 12px", display: "block" }} />
                <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", margin: "0 0 4px" }}>No open events</p>
                <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>New prediction events are added regularly</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {heroEvent && <HeroEvent p={heroEvent} onClick={() => router.push(`/predictions/play/${heroEvent.id}`)} />}
                {restOpen.map((p) => <OpenRow key={p.id} p={p} onClick={() => router.push(`/predictions/play/${p.id}`)} />)}
              </div>
            )}
          </motion.div>
        )}

        {/* ── MY PICKS tab ── */}
        {tab === "mine" && (
          <motion.div key="mine" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
            {mineLoading ? (
              <div>{[1,2,3].map((i) => <CardSkeleton key={i} />)}</div>
            ) : active.length === 0 ? (
              <div style={{ borderRadius: 12, padding: "36px 20px", textAlign: "center", border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-card)" }}>
                <Wand2 size={28} style={{ color: "var(--text-muted)", margin: "0 auto 12px", display: "block" }} />
                <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", margin: "0 0 4px" }}>No active predictions</p>
                <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "0 0 16px" }}>Browse open events to get started</p>
                <button onClick={() => setTab("open")} style={{ fontSize: 13, fontWeight: 700, color: "var(--accent-indigo)", background: "none", border: "1px solid rgba(76,111,255,0.3)", borderRadius: 8, padding: "8px 16px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5 }}>
                  Browse events <ArrowRight size={13} />
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {active.map((p) => <MineCard key={p.id} p={p} onClick={() => router.push(`/predictions/play/${p.id}`)} />)}
              </div>
            )}
          </motion.div>
        )}

        {/* ── SETTLED tab ── */}
        {tab === "settled" && (
          <motion.div key="settled" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
            {mineLoading ? (
              <div>{[1,2,3].map((i) => <CardSkeleton key={i} />)}</div>
            ) : settled.length === 0 ? (
              <div style={{ borderRadius: 12, padding: "36px 20px", textAlign: "center", border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-card)" }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", margin: "0 0 4px" }}>Nothing settled yet</p>
                <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>Results appear here once the admin reveals correct answers</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {settled.map((p) => <SettledCard key={p.id} p={p} onClick={() => router.push(`/predictions/play/${p.id}`)} />)}
              </div>
            )}
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
