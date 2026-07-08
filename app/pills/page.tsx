"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { pillsApi, type PillPack, type PillPackPill, ApiError } from "@/lib/api";
import Link from "next/link";
import { AlertCircle, Loader2, ChevronLeft } from "lucide-react";

function pillGlow(color: string) {
  return { background: color, boxShadow: `0 0 18px ${color}60, 0 0 36px ${color}25` };
}

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

function PillPackCard({ pack, onPillTap }: { pack: PillPack; onPillTap: (pack: PillPack, pill: PillPackPill) => void }) {
  const available = pack.pills.filter((p) => p.status === "available").length;
  const entry = pack.pills[0]?.price ?? 0;
  const prize = pack.pills[0]?.prize ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="group bg-[#111] border border-[#1E1E1E] rounded-2xl p-5 hover:border-neon/30 transition-all duration-300 overflow-hidden"
    >
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

// Pill confirm sheet
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

export default function PillsPage() {
  const router = useRouter();
  const { state } = useApp();
  const [packs, setPacks] = useState<PillPack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sheet, setSheet] = useState<{ pack: PillPack; pill: PillPackPill } | null>(null);

  useEffect(() => {
    if (!state.isAuthenticated) { router.push("/auth"); return; }
    pillsApi.getPacks()
      .then((data) => setPacks(data.packs.filter((p) => p.status === "active") ?? []))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load packs"))
      .finally(() => setLoading(false));
  }, [state.isAuthenticated, router]);

  return (
    <div className="px-4 lg:px-8 py-6">

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 flex gap-3 items-start">
          <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 size={24} className="text-neon animate-spin" /></div>
      ) : packs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-4xl mb-4">💊</p>
          <p className="text-gray-500 font-semibold text-lg">No pill packs available</p>
          <p className="text-gray-700 text-sm mt-1">Check back soon — new packs drop regularly</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {packs.map((pack) => (
            <PillPackCard key={pack.id} pack={pack} onPillTap={(pack, pill) => setSheet({ pack, pill })} />
          ))}
        </div>
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
