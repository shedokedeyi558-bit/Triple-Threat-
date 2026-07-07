"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/context/AppContext";
import {
  pillsApi, predictionsApi, blitzApi,
  type PillPack, type PillPackPill, type PredictionData, type BlitzTournament, ApiError,
} from "@/lib/api";
import { Clock, ChevronRight, Users, Lock, Zap, Trophy, Timer, ArrowRight } from "lucide-react";
import Link from "next/link";

function pillGlow(color: string) {
  return { background: color, boxShadow: `0 0 18px ${color}60, 0 0 36px ${color}25` };
}

// ─── Pill bead ────────────────────────────────────────────────────────────────
function PillBead({ pill, index, onTap }: { pill: PillPackPill; index: number; onTap: (p: PillPackPill) => void }) {
  const played = pill.status === "played";
  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: played ? 0.3 : 1 }}
      transition={{ delay: index * 0.07, type: "spring", stiffness: 300, damping: 20 }}
      whileHover={played ? {} : { scale: 1.25 }}
      whileTap={played ? {} : { scale: 0.85 }}
      onClick={() => !played && onTap(pill)}
      disabled={played}
      className="relative flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center"
      style={played ? { background: "#1A1A1A" } : pillGlow(pill.color)}
    >
      <span className="text-2xl select-none" style={{ filter: played ? "grayscale(1) opacity(0.4)" : "none" }}>💊</span>
      {played && (
        <div className="absolute inset-0 rounded-full flex items-center justify-center">
          <span className="text-[11px] font-black text-gray-600">✓</span>
        </div>
      )}
      {!played && (
        <motion.span
          className="absolute inset-0 rounded-full pointer-events-none"
          animate={{ scale: [1, 1.7, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: index * 0.5 }}
          style={{ border: `2px solid ${pill.color}` }}
        />
      )}
    </motion.button>
  );
}

// ─── Pill Pack card ───────────────────────────────────────────────────────────
function PillPackCard({ pack, onPillTap }: { pack: PillPack; onPillTap: (pack: PillPack, pill: PillPackPill) => void }) {
  const available = pack.pills.filter((p) => p.status === "available").length;
  const entry = pack.pills[0]?.price ?? 0;
  const prize = pack.pills[0]?.prize ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative bg-[#111] border border-[#1E1E1E] rounded-2xl p-5 hover:border-neon/30 transition-all duration-300 overflow-hidden"
    >
      {/* Subtle glow on hover */}
      <div className="absolute inset-0 bg-neon/[0.02] opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none" />

      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-1">{pack.category}</p>
          <h3 className="text-white font-black text-xl">{pack.name}</h3>
        </div>
        <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg ${
          available > 0 ? "bg-neon/10 text-neon border border-neon/20" : "bg-[#1A1A1A] text-gray-600"
        }`}>
          {available}/{pack.pills.length} left
        </span>
      </div>

      {/* Pills */}
      <div className="flex gap-3 items-center mb-5 min-h-[56px]">
        {pack.pills.map((pill, i) => (
          <PillBead key={pill.id} pill={pill} index={i} onTap={(p) => onPillTap(pack, p)} />
        ))}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-[#1A1A1A]">
        <div className="flex gap-5">
          <div>
            <p className="text-[10px] text-gray-600 mb-0.5">Entry</p>
            <p className="text-neon font-black">₦{entry.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-600 mb-0.5">Win up to</p>
            <p className="text-white font-black">₦{prize.toLocaleString()}</p>
          </div>
        </div>
        <p className="text-[11px] text-gray-600 italic">Tap any pill</p>
      </div>
    </motion.div>
  );
}

// ─── Prediction card ──────────────────────────────────────────────────────────
function PredictionCard({ prediction, onClick }: { prediction: PredictionData; onClick: () => void }) {
  const [timeLeft, setTimeLeft] = useState(0);
  useEffect(() => {
    const tick = () => setTimeLeft(Math.max(0, Math.floor((new Date(prediction.countdown_end).getTime() - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [prediction.countdown_end]);

  const locked = prediction.status === "locked" || timeLeft <= 0;
  const h = Math.floor(timeLeft / 3600), m = Math.floor((timeLeft % 3600) / 60), s = timeLeft % 60;
  const timeLabel = locked ? "Locked" : h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${s}s` : `${s}s`;
  const fill = Math.min(100, Math.round((prediction.slots_filled / prediction.max_slots) * 100));

  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full text-left bg-[#111] border border-[#1E1E1E] rounded-2xl p-5 hover:border-purple-500/30 transition-all group"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-purple-400">{prediction.category}</span>
          <span className={`flex items-center gap-1 text-[10px] font-semibold ${locked ? "text-orange-400" : "text-gray-500"}`}>
            {locked ? <Lock size={9} /> : <Timer size={9} />} {timeLabel}
          </span>
        </div>
        <ArrowRight size={14} className="text-gray-600 group-hover:text-purple-400 flex-shrink-0 mt-0.5 transition-colors" />
      </div>

      <p className="text-white font-bold text-sm leading-snug mb-4 line-clamp-2">{prediction.question}</p>

      <div className="flex items-center gap-3 text-xs mb-3">
        <span className="text-neon font-black text-base">₦{prediction.fee.toLocaleString()}</span>
        <span className="text-gray-600">→</span>
        <span className="text-white font-bold">₦{prediction.prize_per_winner.toLocaleString()} /win</span>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between text-[10px] text-gray-600">
          <span className="flex items-center gap-1"><Users size={9} /> {prediction.slots_filled} / {prediction.max_slots}</span>
          <span>{fill}%</span>
        </div>
        <div className="h-1 bg-[#1A1A1A] rounded-full overflow-hidden">
          <motion.div className="h-full bg-purple-500 rounded-full"
            initial={{ width: 0 }} animate={{ width: `${fill}%` }} transition={{ duration: 0.8 }} />
        </div>
      </div>
    </motion.button>
  );
}

// ─── Blitz card ───────────────────────────────────────────────────────────────
function BlitzCard({ t, onClick }: { t: BlitzTournament; onClick: () => void }) {
  const isLive = t.status === "active";
  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full text-left bg-[#111] border border-[#1E1E1E] rounded-2xl p-5 hover:border-neon/30 transition-all group"
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Zap size={14} className="text-neon flex-shrink-0" />
          <p className="text-white font-black truncate">{t.title}</p>
        </div>
        <span className={`text-[10px] font-black px-2 py-0.5 rounded flex-shrink-0 ${
          isLive ? "bg-neon/20 text-neon" : "bg-blue-500/20 text-blue-400"
        }`}>{isLive ? "LIVE" : "OPEN"}</span>
      </div>
      <div className="flex items-center gap-4 text-sm">
        <span className="text-neon font-black">₦{t.entry_fee.toLocaleString()}</span>
        <span className="text-gray-500">Pool: ₦{t.prize_pool.toLocaleString()}</span>
        <span className="text-gray-600 flex items-center gap-1"><Users size={11} />{t.total_registered}</span>
      </div>
    </motion.button>
  );
}

// ─── Pill confirm sheet ───────────────────────────────────────────────────────
function PillSheet({ pack, pill, onConfirm, onClose, balance }: {
  pack: PillPack; pill: PillPackPill; onConfirm: () => void; onClose: () => void; balance: number;
}) {
  const canAfford = balance >= pill.price;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end lg:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 340, damping: 32 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full lg:max-w-sm bg-[#111] border border-[#1E1E1E] lg:rounded-2xl rounded-t-3xl px-6 py-8 space-y-5">
        <div className="w-10 h-1 bg-[#333] rounded-full mx-auto lg:hidden" />
        <div className="flex flex-col items-center gap-4">
          <motion.div animate={{ rotate: [-8, 8, -8, 0] }} transition={{ duration: 0.6 }}
            className="w-20 h-20 rounded-full flex items-center justify-center text-5xl"
            style={pillGlow(pill.color)}>💊</motion.div>
          <div className="text-center">
            <p className="text-white font-black text-xl">{pack.name}</p>
            <p className="text-gray-500 text-sm">{pack.category}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#1A1A1A] rounded-xl p-4 text-center">
            <p className="text-[11px] text-gray-500 mb-1">Entry</p>
            <p className="text-neon font-black text-xl">₦{pill.price.toLocaleString()}</p>
          </div>
          <div className="bg-[#1A1A1A] rounded-xl p-4 text-center">
            <p className="text-[11px] text-gray-500 mb-1">Win up to</p>
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

// ─── Main ─────────────────────────────────────────────────────────────────────
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

  const liveBlitz = blitz.filter((t) => t.status === "active" || t.status === "registration");

  if (!state.isAuthenticated) return null;

  return (
    <div className="px-4 lg:px-8 py-6">
      {error && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-red-400 text-sm bg-red-900/10 border border-red-900/30 rounded-xl p-3 mb-5">{error}</motion.p>
      )}

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => <div key={i} className="bg-[#111] border border-[#1E1E1E] rounded-2xl h-64 animate-pulse" />)}
        </div>
      ) : (
        <>
          {/* ── DESKTOP: Pills left (larger), Predictions + Blitz right ── */}
          <div className="hidden lg:grid lg:grid-cols-5 gap-6">

            {/* Pills — wider column */}
            <div className="lg:col-span-2 space-y-4">
              <div className="mb-2">
                <h2 className="text-white font-black text-xl">Pill Packs</h2>
                <p className="text-gray-500 text-xs mt-0.5">Pick a pill. Answer fast. Win instantly.</p>
              </div>
              {packs.length === 0 ? (
                <div className="bg-[#111] border border-[#1E1E1E] rounded-2xl p-10 text-center">
                  <p className="text-gray-600 text-sm">No pill packs right now</p>
                </div>
              ) : (
                packs.map((p) => (
                  <PillPackCard key={p.id} pack={p} onPillTap={(pack, pill) => setSheet({ pack, pill })} />
                ))
              )}
            </div>

            {/* Right column — Blitz + Predictions stacked */}
            <div className="lg:col-span-3 space-y-6">

              {/* Blitz */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-white font-black text-xl flex items-center gap-2"><Zap size={18} className="text-neon" /> Blitz</h2>
                    <p className="text-gray-500 text-xs mt-0.5">Speed quiz tournaments.</p>
                  </div>
                  <Link href="/blitz" className="text-neon text-xs font-bold flex items-center gap-1 hover:underline">All <ChevronRight size={13} /></Link>
                </div>
                {liveBlitz.length === 0 ? (
                  <div className="bg-[#111] border border-[#1E1E1E] rounded-2xl px-5 py-6 flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 font-semibold text-sm">No active tournaments</p>
                      <p className="text-gray-700 text-xs mt-0.5">Check back soon</p>
                    </div>
                    <Link href="/blitz" className="text-neon text-xs font-bold flex items-center gap-1 hover:underline">
                      Browse all <ArrowRight size={12} />
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {liveBlitz.map((t) => (
                      <BlitzCard key={t.id} t={t} onClick={() => router.push(`/blitz/${t.id}`)} />
                    ))}
                  </div>
                )}
              </div>

              {/* Time Machine */}
              <div>
                <div className="mb-3">
                  <h2 className="text-white font-black text-xl">Time Machine</h2>
                  <p className="text-gray-500 text-xs mt-0.5">Predict the outcome. Win big.</p>
                </div>
                {predictions.length === 0 ? (
                  <div className="bg-[#111] border border-[#1E1E1E] rounded-2xl p-6 text-center">
                    <p className="text-gray-600 text-sm">No active predictions right now</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {predictions.map((p) => (
                      <PredictionCard key={p.id} prediction={p} onClick={() => router.push(`/predictions/play/${p.id}`)} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── MOBILE: stacked sections ── */}
          <div className="lg:hidden space-y-8">

            {/* Pills */}
            <section>
              <div className="mb-4">
                <h2 className="text-white font-black text-xl">Pill Packs</h2>
                <p className="text-gray-500 text-xs mt-0.5">Pick a pill. Answer fast. Win instantly.</p>
              </div>
              {packs.length === 0 ? (
                <div className="bg-[#111] border border-[#1E1E1E] rounded-2xl p-10 text-center">
                  <p className="text-gray-600 text-sm">No pill packs right now</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {packs.map((p) => (
                    <PillPackCard key={p.id} pack={p} onPillTap={(pack, pill) => setSheet({ pack, pill })} />
                  ))}
                </div>
              )}
            </section>

            {/* Blitz */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-white font-black text-xl flex items-center gap-2"><Zap size={18} className="text-neon" /> Blitz</h2>
                  <p className="text-gray-500 text-xs mt-0.5">Speed quiz tournaments.</p>
                </div>
                <Link href="/blitz" className="text-neon text-xs font-bold flex items-center gap-1 hover:underline">All <ChevronRight size={13} /></Link>
              </div>
              {liveBlitz.length === 0 ? (
                <div className="bg-[#111] border border-[#1E1E1E] rounded-2xl px-5 py-6 flex items-center justify-between">
                  <p className="text-gray-500 text-sm">No active tournaments</p>
                  <Link href="/blitz" className="text-neon text-xs font-bold flex items-center gap-1">Browse <ArrowRight size={12} /></Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {liveBlitz.map((t) => <BlitzCard key={t.id} t={t} onClick={() => router.push(`/blitz/${t.id}`)} />)}
                </div>
              )}
            </section>

            {/* Time Machine */}
            <section>
              <div className="mb-4">
                <h2 className="text-white font-black text-xl">Time Machine</h2>
                <p className="text-gray-500 text-xs mt-0.5">Predict the outcome. Win big.</p>
              </div>
              {predictions.length === 0 ? (
                <div className="bg-[#111] border border-[#1E1E1E] rounded-2xl p-6 text-center">
                  <p className="text-gray-600 text-sm">No active predictions</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {predictions.map((p) => (
                    <PredictionCard key={p.id} prediction={p} onClick={() => router.push(`/predictions/play/${p.id}`)} />
                  ))}
                </div>
              )}
            </section>
          </div>
        </>
      )}

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
