"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { pillsApi, predictionsApi, blitzApi, type PillPack, type PillPackPill, type PredictionData, type BlitzTournament, ApiError } from "@/lib/api";
import { BottomNavigation } from "@/components/ui/BottomNavigation";
import { Wallet, Clock, ChevronRight, Users, Lock, Zap } from "lucide-react";
import Link from "next/link";

// ─── Pill color to tailwind-compatible style ───────────────────────────────────
function pillGlow(color: string) {
  return {
    background: color,
    boxShadow: `0 0 16px ${color}66, 0 0 32px ${color}33`,
  };
}

// ─── Single animated pill icon ─────────────────────────────────────────────────
function PillBead({
  pill,
  index,
  onTap,
}: {
  pill: PillPackPill;
  index: number;
  onTap: (pill: PillPackPill) => void;
}) {
  const played = pill.status === "played";

  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: played ? 0.35 : 1 }}
      transition={{ delay: index * 0.06, type: "spring", stiffness: 320, damping: 22 }}
      whileHover={played ? {} : { scale: 1.18, rotate: [0, -8, 8, 0] }}
      whileTap={played ? {} : { scale: 0.88 }}
      onClick={() => !played && onTap(pill)}
      disabled={played}
      className="relative flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center"
      style={played ? { background: "#333", boxShadow: "none" } : pillGlow(pill.color)}
      aria-label={played ? "Already played" : `Play pill — ₦${pill.price}`}
    >
      {/* Pill capsule shape */}
      <span className="text-[22px] select-none" style={{ filter: played ? "grayscale(1)" : "none" }}>
        💊
      </span>
      {played && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute inset-0 rounded-full flex items-center justify-center"
        >
          <span className="text-[10px] font-black text-gray-500">✓</span>
        </motion.div>
      )}
      {/* Pulse ring on hover */}
      {!played && (
        <motion.span
          className="absolute inset-0 rounded-full pointer-events-none"
          animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0, 0.4] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", delay: index * 0.3 }}
          style={{ border: `2px solid ${pill.color}` }}
        />
      )}
    </motion.button>
  );
}

// ─── Pill Pack card ────────────────────────────────────────────────────────────
function PillPackCard({
  pack,
  onPillTap,
}: {
  pack: PillPack;
  onPillTap: (pack: PillPack, pill: PillPackPill) => void;
}) {
  const available = pack.pills.filter((p) => p.status === "available").length;
  const total = pack.pills.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
      className="bg-[#141414] border border-[#222] rounded-2xl p-4 space-y-4"
    >
      {/* Pack header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500">{pack.category}</p>
          <h3 className="text-white font-black text-lg leading-tight mt-0.5">{pack.name}</h3>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-gray-500">{available}/{total} left</p>
          <div className="flex gap-1 mt-1 justify-end">
            {pack.pills.map((p) => (
              <span
                key={p.id}
                className="w-2 h-2 rounded-full"
                style={{ background: p.status === "available" ? p.color : "#333" }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Pills row */}
      <div className="flex gap-3 items-center flex-wrap">
        {pack.pills.map((pill, i) => (
          <PillBead
            key={pill.id}
            pill={pill}
            index={i}
            onTap={(p) => onPillTap(pack, p)}
          />
        ))}
      </div>

      {/* Entry fee hint */}
      <p className="text-[11px] text-gray-600">
        Tap a pill · ₦{pack.pills[0]?.price.toLocaleString() ?? "—"} per pill
      </p>
    </motion.div>
  );
}

// ─── Prediction row ────────────────────────────────────────────────────────────
function PredictionRow({
  prediction,
  onEnter,
}: {
  prediction: PredictionData;
  onEnter: (p: PredictionData) => void;
}) {
  const end = new Date(prediction.countdown_end);
  const now = new Date();
  const diffMs = end.getTime() - now.getTime();
  const hours = Math.floor(diffMs / 3600000);
  const mins = Math.floor((diffMs % 3600000) / 60000);
  const locked = prediction.status === "locked" || diffMs <= 0;
  const timeLabel = locked ? "Locked" : hours > 0 ? `${hours}h ${mins}m left` : `${mins}m left`;

  return (
    <motion.button
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => !locked && onEnter(prediction)}
      disabled={locked}
      className="w-full bg-[#141414] border border-[#222] rounded-xl p-4 text-left flex items-center justify-between gap-3 disabled:opacity-50"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-purple-400">{prediction.category}</span>
          <span className={`flex items-center gap-1 text-[10px] font-semibold ${locked ? "text-orange-400" : "text-gray-400"}`}>
            {locked ? <Lock size={10} /> : <Clock size={10} />}
            {timeLabel}
          </span>
        </div>
        <p className="text-white text-sm font-semibold leading-tight truncate">{prediction.question}</p>
        <div className="flex items-center gap-3 mt-1.5">
          <span className="flex items-center gap-1 text-[11px] text-gray-500">
            <Users size={10} />
            {prediction.slots_filled}/{prediction.max_slots}
          </span>
          <span className="text-[11px] text-neon font-bold">₦{prediction.fee.toLocaleString()} entry</span>
          <span className="text-[11px] text-gray-400">· ₦{prediction.prize_per_winner.toLocaleString()}/win</span>
        </div>
      </div>
      {!locked && <ChevronRight size={16} className="text-gray-600 flex-shrink-0" />}
    </motion.button>
  );
}

// ─── Pill confirm bottom sheet ─────────────────────────────────────────────────
function PillSheet({
  pack,
  pill,
  onConfirm,
  onClose,
  balance,
}: {
  pack: PillPack;
  pill: PillPackPill;
  onConfirm: () => void;
  onClose: () => void;
  balance: number;
}) {
  const canAfford = balance >= pill.price;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Sheet */}
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 340, damping: 32 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full bg-[#111] border-t border-[#222] rounded-t-3xl px-6 py-8 space-y-6"
      >
        {/* Drag handle */}
        <div className="w-10 h-1 bg-[#333] rounded-full mx-auto -mt-2 mb-4" />

        {/* Pill preview */}
        <div className="flex flex-col items-center gap-3">
          <motion.div
            animate={{ rotate: [0, -10, 10, -10, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="w-20 h-20 rounded-full flex items-center justify-center text-5xl"
            style={pillGlow(pill.color)}
          >
            💊
          </motion.div>
          <div className="text-center">
            <p className="text-white font-black text-xl">{pack.name}</p>
            <p className="text-gray-400 text-sm mt-0.5">{pack.category}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#1A1A1A] rounded-xl p-3 text-center">
            <p className="text-[11px] text-gray-500 mb-1">Entry Fee</p>
            <p className="text-neon font-black text-lg">₦{pill.price.toLocaleString()}</p>
          </div>
          <div className="bg-[#1A1A1A] rounded-xl p-3 text-center">
            <p className="text-[11px] text-gray-500 mb-1">You can win</p>
            <p className="text-white font-black text-lg">₦{pill.prize.toLocaleString()}</p>
          </div>
        </div>

        {!canAfford && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-red-400 text-sm"
          >
            Insufficient balance.{" "}
            <Link href="/wallet" className="underline text-neon">Deposit</Link>
          </motion.p>
        )}

        <div className="space-y-3">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={onConfirm}
            disabled={!canAfford}
            className="w-full py-4 bg-neon text-black font-black text-lg rounded-xl disabled:opacity-40 disabled:cursor-not-allowed"
            style={canAfford ? { boxShadow: "0 0 24px #00FF6644" } : {}}
          >
            Take This Pill
          </motion.button>
          <button
            onClick={onClose}
            className="w-full py-3 text-gray-500 text-sm font-semibold"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function PlayPage() {
  const { state, dispatch } = useApp();
  const router = useRouter();
  const pathname = usePathname();

  const [packs, setPacks] = useState<PillPack[]>([]);
  const [predictions, setPredictions] = useState<PredictionData[]>([]);
  const [blitzTournaments, setBlitzTournaments] = useState<BlitzTournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Pill sheet state
  const [sheet, setSheet] = useState<{ pack: PillPack; pill: PillPackPill } | null>(null);

  useEffect(() => {
    if (!state.isAuthenticated) {
      router.push("/auth");
      return;
    }
    fetchAll();
    const interval = setInterval(fetchAll, 15000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.isAuthenticated]);

  const fetchAll = useCallback(async () => {
    try {
      const [packsRes, predsRes, blitzRes] = await Promise.allSettled([
        pillsApi.getPacks(),
        predictionsApi.getActive(),
        blitzApi.getAll(),
      ]);

      if (packsRes.status === "fulfilled") setPacks(packsRes.value.packs ?? []);
      if (predsRes.status === "fulfilled") setPredictions(predsRes.value.predictions ?? []);
      if (blitzRes.status === "fulfilled") setBlitzTournaments(blitzRes.value.tournaments ?? []);
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handlePillTap = (pack: PillPack, pill: PillPackPill) => {
    setSheet({ pack, pill });
  };

  const handleConfirm = () => {
    if (!sheet) return;
    const { pill } = sheet;
    setSheet(null);
    router.push(`/pills/play/${pill.id}`);
  };

  const handleEnterPrediction = (prediction: PredictionData) => {
    if (!state.player || state.player.balance < prediction.fee) {
      setError("Insufficient balance. Please deposit.");
      return;
    }
    dispatch({ type: "SELECT_PREDICTION", prediction });
    router.push(`/predictions/play/${prediction.id}`);
  };

  if (!state.isAuthenticated) return null;

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white pb-28">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0A0A0A]/90 backdrop-blur-md border-b border-[#1A1A1A] px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <span className="font-black text-xl uppercase tracking-tight">
              <span className="text-white">BIT</span>
              <span className="text-neon">LYFE</span>
            </span>
          </div>

          {/* Desktop nav links — hidden on mobile */}
          <nav className="hidden lg:flex items-center gap-1">
            {[
              { href: "/play", label: "Play", icon: <Zap size={15} /> },
              { href: "/wallet", label: "Wallet", icon: <Wallet size={15} /> },
              { href: "/profile", label: "Profile", icon: <Users size={15} /> },
            ].map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    active ? "text-neon bg-neon/10" : "text-gray-400 hover:text-white hover:bg-[#1A1A1A]"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <Link
            href="/wallet"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141414] border border-[#222] text-neon font-bold text-sm hover:border-neon/40 transition-colors"
          >
            <Wallet size={14} />
            ₦{state.player?.balance.toLocaleString() ?? "0"}
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-6">

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-400 text-sm bg-red-900/10 border border-red-900/30 rounded-xl p-3 mb-6"
          >
            {error}
          </motion.p>
        )}

        {/* Desktop: 3-column grid. Mobile: single column stack */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── PILLS SECTION ── */}
          <section className="lg:col-span-1">
            <div className="mb-4">
              <h2 className="text-white font-black text-xl tracking-tight">Pill Packs</h2>
              <p className="text-gray-500 text-xs mt-0.5">Pick a pill. Answer fast. Win instantly.</p>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="bg-[#141414] border border-[#1E1E1E] rounded-2xl p-4 h-28 animate-pulse" />
                ))}
              </div>
            ) : packs.length === 0 ? (
              <div className="bg-[#141414] border border-[#1E1E1E] rounded-2xl p-8 text-center">
                <p className="text-gray-600 text-sm">No pill packs available right now</p>
              </div>
            ) : (
              <div className="space-y-3">
                {packs.map((pack) => (
                  <PillPackCard key={pack.id} pack={pack} onPillTap={handlePillTap} />
                ))}
              </div>
            )}
          </section>

          {/* ── BLITZ SECTION ── */}
          <section className="lg:col-span-1">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-white font-black text-xl tracking-tight flex items-center gap-2">
                  <Zap size={18} className="text-neon" />
                  Blitz
                </h2>
                <p className="text-gray-500 text-xs mt-0.5">Speed quiz tournaments. Win big.</p>
              </div>
              <Link href="/blitz" className="text-neon text-xs font-bold flex items-center gap-1 hover:underline">
                All <ChevronRight size={14} />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-2">
                {[1].map((i) => (
                  <div key={i} className="bg-[#141414] border border-[#1E1E1E] rounded-xl p-4 h-20 animate-pulse" />
                ))}
              </div>
            ) : (() => {
              const liveBlitz = blitzTournaments.filter(
                (t) => t.status === "active" || t.status === "registration"
              );
              if (liveBlitz.length === 0) {
                return (
                  <div className="bg-[#141414] border border-[#1E1E1E] rounded-2xl p-8 text-center">
                    <p className="text-gray-600 text-sm">No active tournaments right now</p>
                  </div>
                );
              }
              return (
                <div className="space-y-2">
                  {liveBlitz.map((t, i) => (
                    <motion.button
                      key={t.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.07 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => router.push(`/blitz/${t.id}`)}
                      className="w-full bg-[#141414] border border-[#1E1E1E] rounded-xl p-3.5 text-left flex items-center justify-between gap-3 hover:border-neon/30 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Zap size={12} className="text-neon flex-shrink-0" />
                          <p className="text-white font-bold text-sm truncate">{t.title}</p>
                          <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded flex-shrink-0 ${
                            t.status === "active" ? "bg-neon/20 text-neon" : "bg-blue-500/20 text-blue-400"
                          }`}>
                            {t.status === "active" ? "Live" : "Open"}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px]">
                          <span className="text-neon font-semibold">₦{t.entry_fee.toLocaleString()}</span>
                          <span className="text-gray-500">Pool: ₦{t.prize_pool.toLocaleString()}</span>
                          <span className="flex items-center gap-1 text-gray-500">
                            <Users size={10} /> {t.total_registered}
                          </span>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-gray-600 flex-shrink-0" />
                    </motion.button>
                  ))}
                </div>
              );
            })()}
          </section>

          {/* ── TIME MACHINE SECTION ── */}
          <section className="lg:col-span-1">
            <div className="mb-4">
              <h2 className="text-white font-black text-xl tracking-tight">Time Machine</h2>
              <p className="text-gray-500 text-xs mt-0.5">Predict the future. Earn rewards.</p>
            </div>

            {loading ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <div key={i} className="bg-[#141414] border border-[#1E1E1E] rounded-xl p-4 h-20 animate-pulse" />
                ))}
              </div>
            ) : predictions.length === 0 ? (
              <div className="bg-[#141414] border border-[#1E1E1E] rounded-xl p-8 text-center">
                <p className="text-gray-600 text-sm">No active predictions right now</p>
              </div>
            ) : (
              <div className="space-y-2">
                {predictions.map((p) => (
                  <PredictionRow key={p.id} prediction={p} onEnter={handleEnterPrediction} />
                ))}
              </div>
            )}
          </section>

        </div>
      </div>

      {/* Pill confirm sheet */}
      <AnimatePresence>
        {sheet && (
          <PillSheet
            pack={sheet.pack}
            pill={sheet.pill}
            balance={state.player?.balance ?? 0}
            onConfirm={handleConfirm}
            onClose={() => setSheet(null)}
          />
        )}
      </AnimatePresence>

      <BottomNavigation />
    </main>
  );
}
