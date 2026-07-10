"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/context/AppContext";
import {
  pillsApi, predictionsApi, blitzApi, playerApi,
  type PillPack, type PillPackPill, type PredictionData, type BlitzTournament, ApiError,
} from "@/lib/api";
import { Clock, ChevronRight, Users, Lock, Zap, Timer, ArrowRight, Plus, Package, Wand2, AlertCircle, X } from "lucide-react";
import Link from "next/link";
import { NotificationBell } from "@/components/ui/NotificationBell";

const categoryColor: Record<string, string> = {
  Football: "#4C6FFF", Basketball: "#7C6FE8", Cricket: "#E8A33D",
  Crypto: "#8B5CF6", Politics: "#EC4899", Entertainment: "#FFD700",
  Technology: "#00CFFF", Science: "#00FF66", Food: "#FF6B9D",
  Lifestyle: "#FF8800", "General Knowledge": "#8B5CF6",
};
const getCategoryColor = (cat: string) => categoryColor[cat] ?? "#4C6FFF";

// ─── Segment Filter ───────────────────────────────────────────────────────
function SegmentFilter({ active, onChange }: { active: "All" | "Pills" | "Predictions" | "Blitz"; onChange: (v: "All" | "Pills" | "Predictions" | "Blitz") => void }) {
  const segments: Array<"All" | "Pills" | "Predictions" | "Blitz"> = ["All", "Pills", "Predictions", "Blitz"];
  return (
    <div className="flex gap-2">
      {segments.map((seg) => (
        <button
          key={seg}
          onClick={() => onChange(seg)}
          className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
          style={{
            backgroundColor: active === seg ? "var(--accent-indigo)" : "transparent",
            color: active === seg ? "#000" : "var(--text-secondary)",
            border: active === seg ? "none" : "1px solid var(--border-subtle)",
          }}
        >
          {seg}
        </button>
      ))}
    </div>
  );
}

// ─── Right Now Banner ──────────────────────────────────────────────────────
function RightNowBanner({ upcoming }: { upcoming?: { type: 'blitz' | 'pill' | 'prediction'; title: string; timeMs: number } }) {
  const [countdown, setCountdown] = useState("");

  useEffect(() => {
    if (!upcoming) return;
    const tick = () => {
      const now = Date.now();
      const ms = upcoming.timeMs - now;
      if (ms <= 0) {
        setCountdown("starting now");
        return;
      }
      const mins = Math.floor(ms / 60000);
      const secs = Math.floor((ms % 60000) / 1000);
      setCountdown(`${mins}:${String(secs).padStart(2, "0")}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [upcoming]);

  if (!upcoming) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg px-4 py-3 flex items-center justify-between border"
      style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-card)" }}
    >
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: "var(--accent-amber)" }}></div>
        <div>
          <p className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>RIGHT NOW</p>
          <p className="text-sm font-semibold mt-0.5" style={{ color: "var(--text-primary)" }}>{upcoming.title}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <p className="font-mono text-sm font-bold" style={{ color: "var(--accent-amber)" }}>{countdown}</p>
        <Link href={upcoming.type === 'blitz' ? '/blitz' : upcoming.type === 'pill' ? '/pills' : '/time-machine'} className="text-xs font-semibold underline" style={{ color: "var(--accent-amber)" }}>
          view
        </Link>
      </div>
    </motion.div>
  );
}

// ─── Pack Card (Shows pack, not individual pills) ────────────────────────────
function PackCard({ pack, onClick }: { pack: PillPack; onClick: () => void }) {
  const accentColor = getCategoryColor(pack.category);
  const minPrice = Math.min(...pack.pills.map(p => p.price));
  const maxPrice = Math.max(...pack.pills.map(p => p.price));
  
  return (
    <motion.button
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      onClick={onClick}
      className="flex-shrink-0 w-56 rounded-lg p-4 border transition-all text-left"
      style={{
        borderColor: accentColor,
        backgroundColor: "var(--bg-card)",
        borderWidth: "1.5px",
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1">
          <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            {pack.name}
          </h3>
          <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
            {pack.pills.length} pills inside
          </p>
        </div>
        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: accentColor }}></div>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
          ₦{minPrice.toLocaleString()}–{maxPrice.toLocaleString()}
        </p>
        <ArrowRight size={14} style={{ color: accentColor }} />
      </div>
    </motion.button>
  );
}

// ─── Pill Chip (Horizontal Scroll) ────────────────────────────────────────
function PillChip({ pack, pill, onClick }: { pack: PillPack; pill: PillPackPill; onClick: () => void }) {
  const accentColor = getCategoryColor(pack.category);
  const isLocked = pill.status !== "available";

  return (
    <motion.button
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      onClick={onClick}
      disabled={isLocked}
      className="flex-shrink-0 w-24 sm:w-28 rounded-full p-3 border transition-all flex flex-col items-center gap-2"
      style={{
        borderColor: isLocked ? "var(--border-subtle)" : accentColor,
        backgroundColor: isLocked ? "var(--bg-card)" : "transparent",
        opacity: isLocked ? 0.5 : 1,
        cursor: isLocked ? "not-allowed" : "pointer",
      }}
    >
      {isLocked ? (
        <>
          <Clock size={16} style={{ color: "var(--text-muted)" }} />
          <p className="text-xs font-mono font-bold" style={{ color: "var(--text-muted)" }}>soon</p>
        </>
      ) : (
        <>
          <Package size={16} style={{ backgroundColor: accentColor, color: "#fff", borderRadius: "50%", padding: "4px" }} />
          <p className="text-xs font-mono font-bold" style={{ color: "var(--accent-amber)" }}>₦{pill.price}</p>
        </>
      )}
    </motion.button>
  );
}

// ─── Ticket Stub Prediction Card ───────────────────────────────────────────
function TicketStubPrediction({ prediction, onClick }: { prediction: PredictionData; onClick: () => void }) {
  const [timeLeft, setTimeLeft] = useState(0);
  useEffect(() => {
    const tick = () => setTimeLeft(Math.max(0, Math.floor((new Date(prediction.countdown_end).getTime() - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [prediction.countdown_end]);

  const locked = prediction.status === "locked" || timeLeft <= 0;
  const h = Math.floor(timeLeft / 3600), m = Math.floor((timeLeft % 3600) / 60), s = timeLeft % 60;
  const timeLabel = locked ? "Closed" : h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  const accentColor = getCategoryColor(prediction.category);

  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className="relative w-full rounded-xl border px-4 py-4 text-left transition-all hover:border-opacity-100"
      style={{ borderColor: accentColor, backgroundColor: "var(--bg-card)", borderWidth: "1.5px" }}
    >
      {/* Ticket stub cutouts - left */}
      <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full" style={{ backgroundColor: "var(--bg-base)" }}></div>
      {/* Ticket stub cutouts - right */}
      <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full" style={{ backgroundColor: "var(--bg-base)" }}></div>

      {/* Content */}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs font-mono font-bold uppercase" style={{ color: accentColor }}>
              {prediction.category}
            </p>
            <p className="text-sm font-semibold mt-1 line-clamp-2" style={{ color: "var(--text-primary)" }}>
              {prediction.question}
            </p>
          </div>
          <p className="text-xs font-mono font-bold flex-shrink-0" style={{ color: "var(--text-muted)" }}>
            {timeLabel}
          </p>
        </div>

        <div className="h-px my-2" style={{ borderTop: `1px dashed ${accentColor}` }}></div>

        <div className="flex items-center justify-between text-xs">
          <p className="font-mono font-bold" style={{ color: "var(--accent-amber)" }}>
            ₦{prediction.fee.toLocaleString()}
          </p>
          <p className="font-mono font-bold" style={{ color: accentColor }}>
            ₦{prediction.prize_per_winner.toLocaleString()}
          </p>
        </div>
      </div>
    </motion.button>
  );
}

// ─── Live Blitz Module ─────────────────────────────────────────────────────
function LiveBlitzModule({ tournament, onClick }: { tournament: BlitzTournament; onClick: () => void }) {
  const isLive = tournament.status === "active";
  const isRegistering = tournament.status === "registration";
  const [countdown, setCountdown] = useState("");
  const [maxPrizePool, setMaxPrizePool] = useState<number | null>(null);
  const [currentEstimate, setCurrentEstimate] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => {
      const targetTime = isLive ? new Date(tournament.tournament_end).getTime() : new Date(tournament.tournament_start).getTime();
      const ms = targetTime - Date.now();
      if (ms <= 0) {
        setCountdown(isLive ? "Ending soon" : "Starting now");
        return;
      }
      const hrs = Math.floor(ms / 3600000);
      const mins = Math.floor((ms % 3600000) / 60000);
      if (hrs > 0) {
        setCountdown(`${hrs}h ${mins}m`);
      } else {
        setCountdown(`${mins}m`);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [tournament, isLive]);

  // Poll prize estimates during registration
  useEffect(() => {
    if (!isRegistering) {
      setMaxPrizePool(tournament.prize_pool);
      setCurrentEstimate(tournament.prize_pool);
      return;
    }

    // Simulate prize pool calculation: max = entry_fee * max_participants, current = entry_fee * registered
    const estimatedMax = tournament.entry_fee * (tournament.total_registered * 2); // rough estimate
    setMaxPrizePool(estimatedMax);
    setCurrentEstimate(tournament.entry_fee * tournament.total_registered * 0.8); // 80% goes to pool

    const pollId = setInterval(() => {
      setCurrentEstimate(tournament.entry_fee * tournament.total_registered * 0.8);
    }, 20000); // Poll every 20 seconds

    return () => clearInterval(pollId);
  }, [tournament, isRegistering]);

  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className="w-full rounded-lg border-2 px-6 py-6 text-left transition-all overflow-hidden relative"
      style={{ borderColor: "var(--accent-amber)", backgroundColor: "var(--bg-card)" }}
    >
      {/* Pulse animation background */}
      <div className="absolute inset-0 opacity-10" style={{ backgroundColor: "var(--accent-amber)" }}></div>

      <div className="relative z-10 space-y-4">
        {/* Live indicator */}
        <div className="flex items-center gap-2">
          {isLive && (
            <motion.div
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: "#ef4444" }}
            ></motion.div>
          )}
          <p className="text-xs font-mono font-bold" style={{ color: isLive ? "#ef4444" : "var(--accent-amber)" }}>
            {isLive ? "LIVE" : "STARTS IN"}
          </p>
        </div>

        {/* Title and countdown */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-headline font-semibold text-lg" style={{ color: "var(--text-primary)" }}>
              {tournament.title}
            </p>
          </div>
          <p className="font-mono text-2xl font-bold flex-shrink-0" style={{ color: "var(--accent-amber)" }}>
            {countdown}
          </p>
        </div>

        {/* Prize pool - dynamic display */}
        <div className="space-y-1">
          {maxPrizePool ? (
            <>
              <p className="font-mono text-lg font-bold" style={{ color: "var(--accent-amber)" }}>
                Up to ₦{maxPrizePool.toLocaleString()}
              </p>
              {currentEstimate && isRegistering && (
                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  Currently ₦{currentEstimate.toLocaleString()} · {tournament.total_registered} registered
                </p>
              )}
            </>
          ) : (
            <p className="font-mono text-lg font-bold" style={{ color: "var(--accent-amber)" }}>
              ₦{tournament.prize_pool.toLocaleString()}
            </p>
          )}
        </div>

        {/* Entry button */}
        <button className="w-full py-2 rounded-lg font-semibold text-sm transition-all mt-4" style={{ backgroundColor: "var(--accent-amber)", color: "#000" }}>
          Join • ₦{tournament.entry_fee.toLocaleString()}
        </button>
      </div>
    </motion.button>
  );
}

// ─── Pill confirm sheet ────────────────────────────────────────────────────────
function PillSheet({ pack, pill, onConfirm, onClose, balance }: {
  pack: PillPack; pill: PillPackPill; onConfirm: () => void; onClose: () => void; balance: number;
}) {
  const [error, setError] = useState("");
  const canAfford = balance >= pill.price;
  const accentColor = getCategoryColor(pack.category);
  
  const handleConfirm = async () => {
    setError("");
    try {
      onConfirm();
    } catch (err) {
      if (err instanceof ApiError && err.message.includes("LIMIT_REACHED")) {
        setError("You've reached your set limit for this period.");
      }
    }
  };
  
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end lg:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 340, damping: 32 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full lg:max-w-sm rounded-t-3xl lg:rounded-lg px-6 py-8 space-y-5"
        style={{ backgroundColor: "var(--bg-card)" }}>
        <div className="w-10 h-1 bg-[#333] rounded-full mx-auto lg:hidden" />
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: accentColor }}>
            <Package size={24} style={{ color: "#fff" }} />
          </div>
          <div className="text-center">
            <p className="font-headline font-semibold text-lg" style={{ color: "var(--text-primary)" }}>{pack.name}</p>
            <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>{pack.category}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg p-3 text-center" style={{ backgroundColor: `var(--accent-amber)20`, borderColor: "var(--accent-amber)", border: "1px solid" }}>
            <p className="text-xs mb-1" style={{ color: "var(--text-secondary)" }}>Entry Fee</p>
            <p className="font-mono text-lg font-bold" style={{ color: "var(--accent-amber)" }}>₦{pill.price.toLocaleString()}</p>
          </div>
          <div className="rounded-lg p-3 text-center border" style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border-subtle)" }}>
            <p className="text-xs mb-1" style={{ color: "var(--text-secondary)" }}>Win up to</p>
            <p className="font-mono text-lg font-bold" style={{ color: "var(--text-primary)" }}>₦{pill.prize.toLocaleString()}</p>
          </div>
        </div>
        {!canAfford && (
          <p className="text-center text-red-400 text-sm">
            Insufficient balance. <Link href="/wallet" className="underline font-semibold">Add funds</Link>
          </p>
        )}
        {error && (
          <p className="text-center text-red-400 text-sm">
            {error} <Link href="/profile" className="underline font-semibold">Adjust limits</Link>
          </p>
        )}
        <div className="space-y-3">
          <button onClick={handleConfirm} disabled={!canAfford}
            className="w-full py-3 font-semibold rounded-lg text-sm disabled:opacity-40 transition-opacity"
            style={{ backgroundColor: accentColor, color: "#000" }}>
            Take This Pill
          </button>
          <button onClick={onClose} className="w-full py-3 text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>Cancel</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function PlayPage() {
  const { state } = useApp();
  const router = useRouter();
  const [packs, setPacks] = useState<PillPack[]>([]);
  const [predictions, setPredictions] = useState<PredictionData[]>([]);
  const [blitz, setBlitz] = useState<BlitzTournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sheet, setSheet] = useState<{ pack: PillPack; pill: PillPackPill } | null>(null);
  const [filter, setFilter] = useState<"All" | "Pills" | "Predictions" | "Blitz">("All");
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null);
  const [playsToday, setPlaysToday] = useState(0);
  const [showRapidPlayNudge, setShowRapidPlayNudge] = useState(false);
  const [nudgeDismissedInSession, setNudgeDismissedInSession] = useState(false);

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
      if (pR.status === "fulfilled") setPacks((pR.value.packs ?? []).filter((p) => p.status === "active"));
      if (predR.status === "fulfilled") setPredictions(predR.value.predictions ?? []);
      if (bR.status === "fulfilled") setBlitz(bR.value.tournaments ?? []);
      
      // Check plays today and show nudge if > 5
      if (spendR.status === "fulfilled") {
        setPlaysToday(spendR.value.plays_today ?? 0);
        if ((spendR.value.plays_today ?? 0) > 5 && !nudgeDismissedInSession && !showRapidPlayNudge) {
          setShowRapidPlayNudge(true);
        }
      }
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [nudgeDismissedInSession, showRapidPlayNudge]);

  const showPills = filter === "All" || filter === "Pills";
  const showPredictions = filter === "All" || filter === "Predictions";
  const showBlitz = filter === "All" || filter === "Blitz";

  const liveBlitz = blitz.filter((t) => t.status === "active" || t.status === "registration");
  const featuredBlitz = liveBlitz[0];

  const selectedPack = selectedPackId ? packs.find(p => p.id === selectedPackId) : null;

  if (!state.isAuthenticated) return null;

  return (
    <div className="min-h-full" style={{ backgroundColor: "var(--bg-base)" }}>
      <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-28">
        {error && (
          <div className="flex items-center gap-2 text-red-400 text-sm border rounded-lg p-3" style={{ borderColor: "var(--border-subtle)", backgroundColor: "rgba(239, 68, 68, 0.05)" }}>
            <AlertCircle size={16} className="flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Segment Filter */}
        <SegmentFilter active={filter} onChange={setFilter} />

        {/* Rapid-play nudge toast */}
        <AnimatePresence>
          {showRapidPlayNudge && !nudgeDismissedInSession && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="flex items-center justify-between rounded-lg px-4 py-3 border"
              style={{ backgroundColor: "rgba(232, 163, 61, 0.1)", borderColor: "var(--accent-amber)" }}
            >
              <div className="flex items-center gap-3 flex-1">
                <AlertCircle size={16} style={{ color: "var(--accent-amber)" }} className="flex-shrink-0" />
                <p className="text-sm" style={{ color: "var(--text-primary)" }}>
                  You&apos;ve played {playsToday} times today. Consider <Link href="/profile" className="font-semibold underline">setting a limit</Link> to take breaks.
                </p>
              </div>
              <button
                onClick={() => setNudgeDismissedInSession(true)}
                className="ml-2 p-1 hover:opacity-70 transition-opacity flex-shrink-0"
                style={{ color: "var(--accent-amber)" }}
              >
                <X size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="space-y-6">
            {[200, 160, 180].map((h, i) => (
              <div key={i} className="border rounded-lg animate-pulse" style={{ height: h, borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-card)" }} />
            ))}
          </div>
        ) : (
          <>
            {/* ── DAILY PILLS (pack cards) ── */}
            {showPills && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Package size={18} style={{ color: "var(--accent-indigo)" }} />
                    <div>
                      <h2 className="font-headline font-semibold text-lg" style={{ color: "var(--text-primary)" }}>
                        {packs.length > 0 ? `${packs.length} packs live` : "Daily Pills"}
                      </h2>
                    </div>
                  </div>
                  <Link href="/pills" className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
                    see all
                  </Link>
                </div>

                {selectedPack ? (
                  <>
                    <div className="flex items-center gap-2 mb-4">
                      <button
                        onClick={() => setSelectedPackId(null)}
                        className="p-2 rounded-lg hover:bg-card"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        <ChevronRight size={16} style={{ transform: "rotate(180deg)" }} />
                      </button>
                      <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                        {selectedPack.name}
                      </h3>
                    </div>
                    <div className="overflow-x-auto pb-2 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
                      <div className="flex gap-3">
                        {selectedPack.pills.map((pill) => (
                          <PillChip
                            key={pill.id}
                            pack={selectedPack}
                            pill={pill}
                            onClick={() => setSheet({ pack: selectedPack, pill })}
                          />
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {packs.length === 0 ? (
                      <div className="rounded-lg px-6 py-8 text-center border flex items-center justify-center gap-3" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-card)" }}>
                        <Clock size={16} style={{ color: "var(--text-muted)" }} />
                        <div>
                          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>No packs live</p>
                          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Next pack in [time]</p>
                        </div>
                      </div>
                    ) : (
                      <div className="overflow-x-auto pb-2 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
                        <div className="flex gap-3">
                          {packs.map((pack) => (
                            <PackCard
                              key={pack.id}
                              pack={pack}
                              onClick={() => setSelectedPackId(pack.id)}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </section>
            )}

            {/* ── TIME MACHINE (ticket stub predictions) ── */}
            {showPredictions && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Wand2 size={18} style={{ color: "var(--accent-violet)" }} />
                    <div>
                      <h2 className="font-headline font-semibold text-lg" style={{ color: "var(--text-primary)" }}>
                        {predictions.length > 0 ? `${predictions.length} open` : "Time Machine"}
                      </h2>
                    </div>
                  </div>
                  <Link href="/time-machine" className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
                    see all
                  </Link>
                </div>

                {predictions.length === 0 ? (
                  <div className="rounded-lg px-6 py-8 text-center border-2 flex items-center justify-center gap-3" style={{ borderColor: "var(--accent-violet)", backgroundColor: "var(--bg-card)" }}>
                    <Wand2 size={16} style={{ color: "var(--accent-violet)" }} />
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>No open predictions</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>New events added regularly</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {predictions.slice(0, 4).map((p) => (
                      <TicketStubPrediction
                        key={p.id}
                        prediction={p}
                        onClick={() => router.push(`/predictions/play/${p.id}`)}
                      />
                    ))}
                    {predictions.length > 4 && (
                      <Link href="/time-machine" className="flex items-center justify-center gap-2 py-3 rounded-lg border text-sm font-semibold" style={{ borderColor: "var(--border-subtle)", color: "var(--accent-violet)" }}>
                        +{predictions.length - 4} more <ArrowRight size={14} />
                      </Link>
                    )}
                  </div>
                )}
              </section>
            )}

            {/* ── LIVE BLITZ ── */}
            {showBlitz && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Zap size={18} style={{ color: "var(--accent-amber)" }} />
                    <h2 className="font-headline font-semibold text-lg" style={{ color: "var(--text-primary)" }}>
                      {liveBlitz.length > 0 ? `${liveBlitz.length} upcoming` : "Live Blitz"}
                    </h2>
                  </div>
                  <Link href="/blitz" className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
                    see all
                  </Link>
                </div>

                {liveBlitz.length === 0 ? (
                  <div className="rounded-lg px-6 py-6 flex items-center justify-between border" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-card)" }}>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: "var(--text-secondary)" }}>No active tournaments</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>New Blitz events launch weekly</p>
                    </div>
                    <Link href="/blitz" className="text-xs font-semibold flex items-center gap-1 flex-shrink-0 ml-4" style={{ color: "var(--accent-amber)" }}>
                      Browse <ArrowRight size={12} />
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {featuredBlitz && (
                      <LiveBlitzModule
                        tournament={featuredBlitz}
                        onClick={() => router.push(`/blitz/${featuredBlitz.id}`)}
                      />
                    )}
                    {liveBlitz.slice(1).map((t) => (
                      <div key={t.id} className="rounded-lg px-4 py-3 flex items-center justify-between border" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-card)" }}>
                        <div className="flex-1">
                          <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{t.title}</p>
                          <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>₦{t.prize_pool.toLocaleString()} pool</p>
                        </div>
                        <button
                          onClick={() => router.push(`/blitz/${t.id}`)}
                          className="px-3 py-2 text-xs font-semibold rounded-lg flex-shrink-0 ml-3"
                          style={{ backgroundColor: "var(--accent-amber)", color: "#000" }}
                        >
                          Join
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </div>

      <AnimatePresence>
        {sheet && (
          <PillSheet
            pack={sheet.pack} pill={sheet.pill}
            balance={state.player?.balance ?? 0}
            onConfirm={() => { const pill = sheet.pill; setSheet(null); router.push(`/pills/play/${pill.id}`); }}
            onClose={() => setSheet(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
