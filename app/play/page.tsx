"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/context/AppContext";
import {
  pillsApi, predictionsApi, blitzApi,
  type PillPack, type PillPackPill, type PredictionData, type BlitzTournament, ApiError,
} from "@/lib/api";
import { Clock, ChevronRight, Users, Lock, Zap, Trophy, Timer } from "lucide-react";
import Link from "next/link";

function pillGlow(color: string) {
  return { background: color, boxShadow: `0 0 18px ${color}70, 0 0 36px ${color}30` };
}

// ─── Pill bead ─────────────────────────────────────────────────────────────────
function PillBead({ pill, index, onTap }: { pill: PillPackPill; index: number; onTap: (p: PillPackPill) => void }) {
  const played = pill.status === "played";
  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: played ? 0.3 : 1 }}
      transition={{ delay: index * 0.06, type: "spring", stiffness: 320, damping: 22 }}
      whileHover={played ? {} : { scale: 1.2, rotate: [-6, 6, -6, 0] }}
      whileTap={played ? {} : { scale: 0.85 }}
      onClick={() => !played && onTap(pill)}
      disabled={played}
      className="relative flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center"
      style={played ? { background: "#222" } : pillGlow(pill.color)}
    >
      <span className="text-2xl select-none" style={{ filter: played ? "grayscale(1)" : "none" }}>💊</span>
      {played && (
        <div className="absolute inset-0 rounded-full flex items-center justify-center">
          <span className="text-[10px] font-black text-gray-600">✓</span>
        </div>
      )}
      {!played && (
        <motion.span
          className="absolute inset-0 rounded-full pointer-events-none"
          animate={{ scale: [1, 1.6, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", delay: index * 0.4 }}
          style={{ border: `2px solid ${pill.color}` }}
        />
      )}
    </motion.button>
  );
}

// ─── Pill pack card ─────────────────────────────────────────────────────────────
function PillPackCard({ pack, onPillTap }: { pack: PillPack; onPillTap: (pack: PillPack, pill: PillPackPill) => void }) {
  const available = pack.pills.filter((p) => p.status === "available").length;
  const total = pack.pills.length;
  const pricePerPill = pack.pills[0]?.price ?? 0;
  const prize = pack.pills[0]?.prize ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
      className="bg-[#111] border border-[#1E1E1E] rounded-2xl p-5 space-y-5 hover:border-neon/20 transition-colors"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-1">{pack.category}</p>
          <h3 className="text-white font-black text-xl leading-tight">{pack.name}</h3>
        </div>
        <div className="text-right">
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${
            available > 0 ? "bg-neon/10 text-neon border border-neon/20" : "bg-gray-800 text-gray-500"
          }`}>
            {available}/{total} left
          </span>
        </div>
      </div>

      <div className="flex gap-3 items-center flex-wrap min-h-[48px]">
        {pack.pills.map((pill, i) => (
          <PillBead key={pill.id} pill={pill} index={i} onTap={(p) => onPillTap(pack, p)} />
        ))}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-[#1A1A1A]">
        <div className="flex gap-4">
          <div>
            <p className="text-[10px] text-gray-600 mb-0.5">Entry</p>
            <p className="text-neon font-black text-sm">₦{pricePerPill.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-600 mb-0.5">Prize</p>
            <p className="text-white font-black text-sm">₦{prize.toLocaleString()}</p>
          </div>
        </div>
        <p className="text-[10px] text-gray-600">Tap a pill to play</p>
      </div>
    </motion.div>
  );
}

// ─── Blitz card ────────────────────────────────────────────────────────────────
function BlitzCard({ t, onClick }: { t: BlitzTournament; onClick: () => void }) {
  const isLive = t.status === "active";
  const isOpen = t.status === "registration";

  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full bg-[#111] border border-[#1E1E1E] rounded-2xl p-4 text-left space-y-3 hover:border-neon/30 transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Zap size={14} className="text-neon flex-shrink-0" />
            <p className="text-white font-black text-base truncate">{t.title}</p>
          </div>
          {t.description && <p className="text-gray-500 text-xs line-clamp-1">{t.description}</p>}
        </div>
        <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg flex-shrink-0 ${
          isLive ? "bg-neon/20 text-neon border border-neon/30"
            : isOpen ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
            : "bg-gray-800 text-gray-500"
        }`}>
          {isLive ? "Live" : isOpen ? "Open" : t.status}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-[#0A0A0A] rounded-xl p-2.5 text-center">
          <p className="text-[9px] text-gray-600 uppercase tracking-wide mb-0.5">Entry</p>
          <p className="text-neon font-black text-sm">₦{t.entry_fee.toLocaleString()}</p>
        </div>
        <div className="bg-[#0A0A0A] rounded-xl p-2.5 text-center">
          <p className="text-[9px] text-gray-600 uppercase tracking-wide mb-0.5">Pool</p>
          <p className="text-white font-bold text-sm">₦{t.prize_pool.toLocaleString()}</p>
        </div>
        <div className="bg-[#0A0A0A] rounded-xl p-2.5 text-center">
          <p className="text-[9px] text-gray-600 uppercase tracking-wide mb-0.5">Players</p>
          <p className="text-white font-bold text-sm">{t.total_registered}</p>
        </div>
      </div>
    </motion.button>
  );
}

// ─── Prediction card ───────────────────────────────────────────────────────────
function PredictionCard({ prediction, onEnter }: { prediction: PredictionData; onEnter: (p: PredictionData) => void }) {
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
  const timeLabel = locked ? "Locked" : h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${s}s` : `${s}s`;
  const fill = Math.round((prediction.slots_filled / prediction.max_slots) * 100);

  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onEnter(prediction)}
      className="w-full bg-[#111] border border-[#1E1E1E] rounded-2xl p-4 text-left space-y-3 hover:border-neon/20 transition-all"
    >
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[10px] font-black uppercase tracking-widest text-purple-400">{prediction.category}</span>
          <span className={`flex items-center gap-1 text-[10px] font-semibold ${locked ? "text-orange-400" : "text-gray-500"}`}>
            {locked ? <Lock size={9} /> : <Timer size={9} />} {timeLabel}
          </span>
        </div>
        <p className="text-white font-bold text-sm leading-snug line-clamp-2">{prediction.question}</p>
      </div>

      <div className="flex items-center gap-3 text-[11px]">
        <span className="text-neon font-black">₦{prediction.fee.toLocaleString()}</span>
        <span className="text-gray-600">entry</span>
        <span className="text-gray-400 font-semibold">→ ₦{prediction.prize_per_winner.toLocaleString()}/win</span>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between text-[10px] text-gray-600">
          <span className="flex items-center gap-1"><Users size={9} /> {prediction.slots_filled}/{prediction.max_slots} joined</span>
          <span>{fill}%</span>
        </div>
        <div className="h-1.5 bg-[#1A1A1A] rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-neon rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${fill}%` }}
            transition={{ duration: 0.6 }}
          />
        </div>
      </div>

      {!locked && (
        <div className="flex items-center justify-end">
          <span className="text-neon text-xs font-bold flex items-center gap-1">Predict <ChevronRight size={12} /></span>
        </div>
      )}    </motion.button>
  );
}

// ─── Pill confirm sheet ────────────────────────────────────────────────────────
function PillSheet({ pack, pill, onConfirm, onClose, balance }: {
  pack: PillPack; pill: PillPackPill; onConfirm: () => void; onClose: () => void; balance: number;
}) {
  const canAfford = balance >= pill.price;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end lg:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 340, damping: 32 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full lg:max-w-md bg-[#111] border border-[#222] lg:rounded-2xl rounded-t-3xl px-6 py-8 space-y-6"
      >
        <div className="w-10 h-1 bg-[#333] rounded-full mx-auto lg:hidden" />
        <div className="flex flex-col items-center gap-4">
          <motion.div
            animate={{ rotate: [0, -12, 12, -8, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 0.7 }}
            className="w-20 h-20 rounded-full flex items-center justify-center text-5xl"
            style={pillGlow(pill.color)}
          >💊</motion.div>
          <div className="text-center">
            <p className="text-white font-black text-xl">{pack.name}</p>
            <p className="text-gray-500 text-sm">{pack.category}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#1A1A1A] rounded-xl p-4 text-center">
            <p className="text-[11px] text-gray-500 mb-1">Entry Fee</p>
            <p className="text-neon font-black text-xl">₦{pill.price.toLocaleString()}</p>
          </div>
          <div className="bg-[#1A1A1A] rounded-xl p-4 text-center">
            <p className="text-[11px] text-gray-500 mb-1">Prize</p>
            <p className="text-white font-black text-xl">₦{pill.prize.toLocaleString()}</p>
          </div>
        </div>
        {!canAfford && (
          <p className="text-center text-red-400 text-sm">
            Insufficient balance. <Link href="/wallet" className="text-neon underline">Deposit</Link>
          </p>
        )}
        <div className="space-y-3">
          <motion.button whileTap={{ scale: 0.97 }} onClick={onConfirm} disabled={!canAfford}
            className="w-full py-4 bg-neon text-black font-black text-lg rounded-xl disabled:opacity-40"
            style={canAfford ? { boxShadow: "0 0 24px #00FF6640" } : {}}>
            Take This Pill
          </motion.button>
          <button onClick={onClose} className="w-full py-3 text-gray-500 text-sm font-semibold">Cancel</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Section header ────────────────────────────────────────────────────────────
function SectionHeader({ icon, title, sub, action }: {
  icon?: React.ReactNode; title: string; sub: string; action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div>
        <h2 className="text-white font-black text-lg tracking-tight flex items-center gap-2">
          {icon}{title}
        </h2>
        <p className="text-gray-500 text-xs mt-0.5">{sub}</p>
      </div>
      {action}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="bg-[#111] border border-[#1E1E1E] rounded-2xl p-10 text-center">
      <p className="text-gray-600 text-sm">{text}</p>
    </div>
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
      if (pR.status === "fulfilled") setPacks(pR.value.packs ?? []);
      if (predR.status === "fulfilled") setPredictions(predR.value.predictions ?? []);
      if (bR.status === "fulfilled") setBlitz(bR.value.tournaments ?? []);
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleEnterPrediction = (p: PredictionData) => {
    // Navigate to detail page — enter & pay happens there
    router.push(`/predictions/play/${p.id}`);
  };

  const liveBlitz = blitz.filter((t) => t.status === "active" || t.status === "registration");

  if (!state.isAuthenticated) return null;

  return (
    <div className="px-4 lg:px-8 py-6">

      {error && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-red-400 text-sm bg-red-900/10 border border-red-900/30 rounded-xl p-3 mb-5">
          {error}
        </motion.p>
      )}

      {/* ── DESKTOP: 3 columns | MOBILE: stacked ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* ── PILL PACKS ── (col 1) */}
        <section>
          <SectionHeader title="Pill Packs" sub="Pick a pill. Answer fast. Win instantly." />
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => <div key={i} className="bg-[#111] border border-[#1E1E1E] rounded-2xl h-36 animate-pulse" />)}
            </div>
          ) : packs.length === 0 ? (
            <EmptyState text="No pill packs available right now" />
          ) : (
            <div className="space-y-3">
              {packs.map((p) => <PillPackCard key={p.id} pack={p} onPillTap={(pack, pill) => setSheet({ pack, pill })} />)}
            </div>
          )}
        </section>

        {/* ── BLITZ ── (col 2) */}
        <section>
          <SectionHeader
            icon={<Zap size={17} className="text-neon" />}
            title="Blitz"
            sub="Speed quiz tournaments. Win big."
            action={
              <Link href="/blitz" className="text-neon text-xs font-bold flex items-center gap-1 hover:underline mt-1">
                All <ChevronRight size={13} />
              </Link>
            }
          />
          {loading ? (
            <div className="space-y-3">
              {[1].map((i) => <div key={i} className="bg-[#111] border border-[#1E1E1E] rounded-2xl h-28 animate-pulse" />)}
            </div>
          ) : liveBlitz.length === 0 ? (
            <div className="bg-[#111] border border-[#1E1E1E] rounded-2xl p-10 text-center space-y-2">
              <Trophy size={28} className="text-gray-700 mx-auto" />
              <p className="text-gray-600 text-sm">No active tournaments</p>
              <Link href="/blitz" className="text-neon text-xs font-bold hover:underline">Browse all →</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {liveBlitz.map((t) => (
                <BlitzCard key={t.id} t={t} onClick={() => router.push(`/blitz/${t.id}`)} />
              ))}
            </div>
          )}
        </section>

        {/* ── TIME MACHINE ── (col 3) */}
        <section>
          <SectionHeader title="Time Machine" sub="Predict the future. Earn rewards." />
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => <div key={i} className="bg-[#111] border border-[#1E1E1E] rounded-2xl h-28 animate-pulse" />)}
            </div>
          ) : predictions.length === 0 ? (
            <EmptyState text="No active predictions right now" />
          ) : (
            <div className="space-y-3">
              {predictions.map((p) => (
                <PredictionCard key={p.id} prediction={p} onEnter={handleEnterPrediction} />
              ))}
            </div>
          )}
        </section>

      </div>

      {/* Pill confirm sheet */}
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
