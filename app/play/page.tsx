"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/context/AppContext";
import {
  pillsApi, predictionsApi, blitzApi,
  type PillPack, type PillPackPill, type PredictionData, type BlitzTournament, ApiError,
} from "@/lib/api";
import { Clock, ChevronRight, Users, Lock, Zap, Timer, ArrowRight, Plus } from "lucide-react";
import Link from "next/link";
import { NotificationBell } from "@/components/ui/NotificationBell";

function pillGlow(color: string) {
  return { background: color, boxShadow: `0 0 24px ${color}70, 0 0 48px ${color}30` };
}

const categoryColor: Record<string, string> = {
  Football: "#00FF66", Basketball: "#FF8800", Cricket: "#00CFFF",
  Crypto: "#8B5CF6", Politics: "#EC4899", Entertainment: "#FFD700",
  Technology: "#00CFFF", Science: "#00FF66", Food: "#FF6B9D",
  Lifestyle: "#FF8800", "General Knowledge": "#8B5CF6",
};
const getCategoryColor = (cat: string) => categoryColor[cat] ?? "#00FF66";

// ─── Pill Pack Card — large hero style ────────────────────────────────────────
function PillPackCard({ pack, onTap }: { pack: PillPack; onTap: (pack: PillPack, pill: PillPackPill) => void }) {
  const available = pack.pills.filter((p) => p.status === "available");
  const entry = pack.pills[0]?.price ?? 0;
  const prize = pack.pills[0]?.prize ?? 0;
  const mainColor = available[0]?.color ?? "#8B5CF6";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative rounded-2xl overflow-hidden cursor-pointer group"
      style={{ background: `linear-gradient(135deg, #111 60%, ${mainColor}18)` }}
      onClick={() => available[0] && onTap(pack, available[0])}
    >
      <div className="absolute inset-0 border border-[#1E1E1E] group-hover:border-opacity-60 rounded-2xl transition-all"
        style={{ borderColor: `${mainColor}30` }} />

      <div className="p-5">
        {/* Top: name + available count */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: mainColor }}>
              {pack.category}
            </p>
            <h3 className="text-white font-black text-2xl leading-tight">{pack.name}</h3>
          </div>
          <span className="text-[10px] font-black px-2.5 py-1 rounded-lg border"
            style={{ color: mainColor, borderColor: `${mainColor}40`, background: `${mainColor}15` }}>
            {available.length}/{pack.pills.length} left
          </span>
        </div>

        {/* Pill visual — hero size */}
        <div className="flex items-center justify-center py-4 relative">
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="text-[80px] select-none drop-shadow-2xl"
            style={{ filter: `drop-shadow(0 0 20px ${mainColor}80)` }}
          >
            💊
          </motion.div>
          {/* Subtle glow behind */}
          <div className="absolute w-32 h-32 rounded-full blur-3xl pointer-events-none"
            style={{ background: `${mainColor}20` }} />
        </div>

        {/* Bottom: price info + tap hint */}
        <div className="flex items-center justify-between mt-2 pt-4 border-t"
          style={{ borderColor: `${mainColor}20` }}>
          <div className="flex gap-5">
            <div>
              <p className="text-[10px] text-gray-600 mb-0.5 uppercase tracking-wide">Entry</p>
              <p className="font-black text-white">₦{entry.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-600 mb-0.5 uppercase tracking-wide">Win up to</p>
              <p className="font-black" style={{ color: mainColor }}>₦{prize.toLocaleString()}</p>
            </div>
          </div>
          <span className="text-[11px] text-gray-600 italic">Tap to play</span>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Prediction / Event Card ──────────────────────────────────────────────────
function EventCard({ prediction, onClick }: { prediction: PredictionData; onClick: () => void }) {
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
  const fill = Math.min(100, Math.round((prediction.slots_filled / prediction.max_slots) * 100));
  const accentColor = getCategoryColor(prediction.category);

  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className="w-full text-left bg-[#111] border border-[#1E1E1E] rounded-2xl overflow-hidden hover:border-opacity-60 transition-all"
      style={{ borderColor: `${accentColor}20` }}
    >
      {/* Colored left accent bar */}
      <div className="flex">
        <div className="w-1 flex-shrink-0 rounded-l-2xl" style={{ background: accentColor }} />
        <div className="flex-1 p-4">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: accentColor }}>
                  {prediction.category}
                </span>
                {locked && (
                  <span className="flex items-center gap-0.5 text-[10px] text-orange-400 font-semibold">
                    <Lock size={9} /> Closed
                  </span>
                )}
              </div>
              <p className="text-white font-bold text-sm leading-snug line-clamp-2">{prediction.question}</p>
            </div>
            {/* Countdown */}
            <div className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg flex-shrink-0 ${
              locked ? "bg-orange-900/20 text-orange-400" : "bg-[#1A1A1A] text-neon"
            }`}>
              {!locked && <Clock size={10} />}
              <span className="text-[11px] font-black tabular-nums">{timeLabel}</span>
            </div>
          </div>

          {/* Entry + prize */}
          <div className="flex items-center gap-2 mb-3 text-xs">
            <span className="font-black text-base text-neon">₦{prediction.fee.toLocaleString()}</span>
            <span className="text-gray-600">→</span>
            <span className="text-white font-bold">₦{prediction.prize_per_winner.toLocaleString()} /win</span>
          </div>

          {/* Fill bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-gray-600">
              <span><Users size={9} className="inline mr-1" />Participation</span>
              <span className="font-bold" style={{ color: fill > 70 ? accentColor : undefined }}>{fill}% Full</span>
            </div>
            <div className="h-1.5 bg-[#1A1A1A] rounded-full overflow-hidden">
              <motion.div className="h-full rounded-full"
                style={{ background: accentColor }}
                initial={{ width: 0 }} animate={{ width: `${fill}%` }} transition={{ duration: 0.8 }} />
            </div>
          </div>
        </div>
      </div>
    </motion.button>
  );
}

// ─── Blitz Featured Card ───────────────────────────────────────────────────────
function BlitzFeaturedCard({ t, onClick }: { t: BlitzTournament; onClick: () => void }) {
  const isLive = t.status === "active";
  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full text-left rounded-2xl overflow-hidden bg-[#111] border border-[#1E1E1E] hover:border-neon/30 transition-all"
    >
      {/* Banner area */}
      <div className="relative h-28 bg-gradient-to-br from-[#0D1A0D] via-[#111] to-[#0A0F0A] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 opacity-20"
          style={{ background: "radial-gradient(ellipse at center, #00FF66 0%, transparent 70%)" }} />
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="text-6xl select-none z-10">⚡</motion.div>
        {isLive && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-500/90 px-2.5 py-1 rounded-lg">
            <motion.div animate={{ opacity: [1, 0, 1] }} transition={{ duration: 1, repeat: Infinity }}
              className="w-1.5 h-1.5 rounded-full bg-white" />
            <span className="text-white text-[10px] font-black">LIVE</span>
          </div>
        )}
      </div>
      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <p className="text-white font-black text-lg leading-tight">{t.title}</p>
            <p className="text-gray-500 text-xs mt-0.5 flex items-center gap-1">
              <Clock size={10} /> {isLive ? "Ends" : "Starts"} soon
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-[10px] text-gray-600 uppercase tracking-wide">Prize Pool</p>
            <p className="text-neon font-black text-xl">₦{t.prize_pool.toLocaleString()}</p>
          </div>
        </div>
        <motion.div whileTap={{ scale: 0.97 }}
          className="w-full py-3 rounded-xl bg-neon text-black font-black text-sm flex items-center justify-center gap-2"
          style={{ boxShadow: "0 0 20px #00FF6640" }}>
          ENTRY: ₦{t.entry_fee.toLocaleString()} ▶
        </motion.div>
      </div>
    </motion.button>
  );
}

// ─── Blitz compact row ─────────────────────────────────────────────────────────
function BlitzRow({ t, onClick }: { t: BlitzTournament; onClick: () => void }) {
  return (
    <motion.button
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full flex items-center gap-3 bg-[#111] border border-[#1E1E1E] rounded-xl px-4 py-3 hover:border-neon/20 transition-colors"
    >
      <div className="w-9 h-9 rounded-xl bg-neon/10 flex items-center justify-center flex-shrink-0">
        <Zap size={16} className="text-neon" />
      </div>
      <div className="flex-1 min-w-0 text-left">
        <p className="text-white font-bold text-sm truncate">{t.title}</p>
        <p className="text-gray-600 text-xs">₦{t.prize_pool.toLocaleString()} pool</p>
      </div>
      <button className="px-3 py-1.5 rounded-lg bg-neon/10 border border-neon/30 text-neon text-xs font-bold flex-shrink-0">
        Join
      </button>
    </motion.button>
  );
}

// ─── Pill confirm sheet ────────────────────────────────────────────────────────
function PillSheet({ pack, pill, onConfirm, onClose, balance }: {
  pack: PillPack; pill: PillPackPill; onConfirm: () => void; onClose: () => void; balance: number;
}) {
  const canAfford = balance >= pill.price;
  const mainColor = pill.color;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end lg:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 340, damping: 32 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full lg:max-w-sm rounded-t-3xl lg:rounded-2xl px-6 py-8 space-y-5"
        style={{ background: `linear-gradient(160deg, #111 70%, ${mainColor}12)` }}>
        <div className="w-10 h-1 bg-[#333] rounded-full mx-auto lg:hidden" />
        <div className="flex flex-col items-center gap-3">
          <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 1.5, repeat: Infinity }}
            className="text-7xl select-none"
            style={{ filter: `drop-shadow(0 0 30px ${mainColor}90)` }}>💊</motion.div>
          <div className="text-center">
            <p className="text-white font-black text-2xl">{pack.name}</p>
            <p className="text-gray-500 text-sm">{pack.category}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl p-4 text-center" style={{ background: `${mainColor}10`, border: `1px solid ${mainColor}30` }}>
            <p className="text-[11px] text-gray-500 mb-1">Entry Fee</p>
            <p className="font-black text-xl" style={{ color: mainColor }}>₦{pill.price.toLocaleString()}</p>
          </div>
          <div className="bg-[#1A1A1A] border border-[#222] rounded-xl p-4 text-center">
            <p className="text-[11px] text-gray-500 mb-1">Win up to</p>
            <p className="text-white font-black text-xl">₦{pill.prize.toLocaleString()}</p>
          </div>
        </div>
        {!canAfford && (
          <p className="text-center text-red-400 text-sm">
            Insufficient balance. <Link href="/wallet" className="underline" style={{ color: mainColor }}>Add funds</Link>
          </p>
        )}
        <div className="space-y-3">
          <motion.button whileTap={{ scale: 0.97 }} onClick={onConfirm} disabled={!canAfford}
            className="w-full py-4 font-black text-black text-lg rounded-xl disabled:opacity-40"
            style={{ background: mainColor, boxShadow: `0 0 30px ${mainColor}50` }}>
            Take This Pill
          </motion.button>
          <button onClick={onClose} className="w-full py-3 text-gray-500 text-sm font-semibold">Cancel</button>
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

  useEffect(() => {
    if (!state.isAuthenticated) { router.push("/auth"); return; }
    fetchAll();
    const id = setInterval(fetchAll, 15000);
    return () => clearInterval(id);
  }, [state.isAuthenticated]); // eslint-disable-line

  const fetchAll = useCallback(async () => {
    try {
      const [pR, predR, bR] = await Promise.allSettled([
        pillsApi.getPacks(),
        predictionsApi.getActive(),
        blitzApi.getAll(),
      ]);
      if (pR.status === "fulfilled") setPacks((pR.value.packs ?? []).filter((p) => p.status === "active"));
      if (predR.status === "fulfilled") setPredictions(predR.value.predictions ?? []);
      if (bR.status === "fulfilled") setBlitz(bR.value.tournaments ?? []);
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const liveBlitz = blitz.filter((t) => t.status === "active" || t.status === "registration");
  const featuredBlitz = liveBlitz[0];
  const otherBlitz = liveBlitz.slice(1);

  if (!state.isAuthenticated) return null;

  return (
    <div className="min-h-full">
      {/* ── APP HEADER ── (custom — overrides AppShell top bar on mobile) */}
      <header className="sticky top-0 z-40 bg-[#0A0A0A]/95 backdrop-blur-md border-b border-[#1A1A1A] px-4 lg:px-8 py-3 lg:hidden">
        <div className="flex items-center justify-between">
          <span className="font-black text-xl uppercase tracking-tight">
            <span className="text-white">BIT</span><span className="text-neon">LYFE</span>
          </span>
          <div className="flex items-center gap-2">
            <Link href="/wallet"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#141414] border border-[#1E1E1E] text-neon font-bold text-sm hover:border-neon/40 transition-colors">
              ₦{state.player?.balance.toLocaleString() ?? "0"}
              <span className="w-4 h-4 rounded-full bg-neon/20 border border-neon/30 flex items-center justify-center text-neon text-[10px] font-black">+</span>
            </Link>
            <NotificationBell />
          </div>
        </div>
      </header>

      <div className="px-4 lg:px-8 py-5 space-y-8 pb-28">
        {error && (
          <p className="text-red-400 text-sm bg-red-900/10 border border-red-900/30 rounded-xl p-3">{error}</p>
        )}

        {loading ? (
          <div className="space-y-6">
            {[200, 160, 180].map((h, i) => (
              <div key={i} className="bg-[#111] border border-[#1E1E1E] rounded-2xl animate-pulse" style={{ height: h }} />
            ))}
          </div>
        ) : (
          <>
            {/* ── DAILY PILLS ── */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-white font-black text-2xl">Daily Pills</h2>
                  <p className="text-gray-500 text-xs mt-0.5">Take your shot at glory</p>
                </div>
                <Link href="/pills" className="text-neon text-xs font-black uppercase tracking-wide flex items-center gap-1 hover:underline">
                  SEE ALL <ChevronRight size={13} />
                </Link>
              </div>

              {packs.length === 0 ? (
                <div className="bg-[#111] border border-[#1E1E1E] rounded-2xl p-8 text-center">
                  <motion.div animate={{ rotate: [0, -12, 12, -8, 0] }} transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 4 }}
                    className="text-5xl mx-auto w-fit mb-3">💊</motion.div>
                  <p className="text-white font-bold">New packs drop regularly</p>
                  <p className="text-gray-600 text-xs mt-1">Fresh pills incoming — check back soon</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {packs.slice(0, 4).map((p) => {
                    const avail = p.pills.filter((pl) => pl.status === "available");
                    return (
                      <PillPackCard key={p.id} pack={p} onTap={(pack, pill) => setSheet({ pack, pill })} />
                    );
                  })}
                </div>
              )}
              {packs.length > 4 && (
                <Link href="/pills" className="mt-3 flex items-center justify-center gap-2 py-3 rounded-xl border border-[#1E1E1E] text-neon text-sm font-bold hover:bg-neon/5 transition-colors">
                  +{packs.length - 4} more packs <ArrowRight size={14} />
                </Link>
              )}
            </section>

            {/* ── UPCOMING EVENTS (Time Machine) ── */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-white font-black text-2xl">Upcoming Events</h2>
                  <p className="text-gray-500 text-xs mt-0.5">Predict. Win big.</p>
                </div>
                <Link href="/time-machine" className="text-neon text-xs font-black uppercase tracking-wide flex items-center gap-1 hover:underline">
                  SEE ALL <ChevronRight size={13} />
                </Link>
              </div>

              {predictions.length === 0 ? (
                <div className="bg-[#111] border border-[#1E1E1E] rounded-2xl p-6 text-center">
                  <p className="text-3xl mb-2">🔮</p>
                  <p className="text-white font-bold text-sm">No open predictions</p>
                  <p className="text-gray-600 text-xs mt-1">New events added regularly</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {predictions.slice(0, 3).map((p) => (
                    <EventCard key={p.id} prediction={p} onClick={() => router.push(`/predictions/play/${p.id}`)} />
                  ))}
                  {predictions.length > 3 && (
                    <Link href="/time-machine" className="flex items-center justify-center gap-2 py-3 rounded-xl border border-[#1E1E1E] text-neon text-sm font-bold hover:bg-neon/5 transition-colors">
                      +{predictions.length - 3} more events <ArrowRight size={14} />
                    </Link>
                  )}
                </div>
              )}
            </section>

            {/* ── LIVE BLITZ ── */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-white font-black text-2xl flex items-center gap-2">
                    <Zap size={20} className="text-neon" /> Live Blitz
                  </h2>
                  <p className="text-gray-500 text-xs mt-0.5">Speed quiz tournaments.</p>
                </div>
                <Link href="/blitz" className="text-neon text-xs font-black uppercase tracking-wide flex items-center gap-1 hover:underline">
                  SEE ALL <ChevronRight size={13} />
                </Link>
              </div>

              {liveBlitz.length === 0 ? (
                <div className="bg-[#111] border border-[#1E1E1E] rounded-2xl px-5 py-6 flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 font-semibold text-sm">No active tournaments</p>
                    <p className="text-gray-700 text-xs mt-0.5">New Blitz events launch weekly</p>
                  </div>
                  <Link href="/blitz" className="text-neon text-xs font-bold flex items-center gap-1 hover:underline flex-shrink-0 ml-4">
                    Browse all <ArrowRight size={12} />
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {featuredBlitz && (
                    <BlitzFeaturedCard t={featuredBlitz} onClick={() => router.push(`/blitz/${featuredBlitz.id}`)} />
                  )}
                  {otherBlitz.map((t) => (
                    <BlitzRow key={t.id} t={t} onClick={() => router.push(`/blitz/${t.id}`)} />
                  ))}
                </div>
              )}
            </section>
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
