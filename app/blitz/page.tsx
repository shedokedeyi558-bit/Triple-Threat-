"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { blitzApi, type BlitzTournament, ApiError } from "@/lib/api";
import { Zap, Users, Clock } from "lucide-react";

function StatusBadge({ status }: { status: BlitzTournament["status"] }) {
  const config = {
    registration: { label: "Open",    color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
    active:        { label: "Live",    color: "bg-[#E8A33D]/20 text-[#E8A33D] border-[#E8A33D]/30" },
    completed:     { label: "Ended",  color: "bg-gray-700/30 text-gray-500 border-gray-700/30" },
    draft:         { label: "Soon",   color: "bg-gray-700/20 text-gray-600 border-gray-700/20" },
    scoring:       { label: "Scoring",color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  };
  const c = config[status] ?? config.draft;
  return (
    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${c.color}`}>
      {c.label}
    </span>
  );
}

function formatCountdown(target: string) {
  const diff = new Date(target).getTime() - Date.now();
  if (diff <= 0) return "Now";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h > 48) return `${Math.floor(h / 24)}d`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

// Compute the potential max prize pool from tournament metadata
function computeMaxPool(t: BlitzTournament): number | null {
  const maxP = t.max_participants ?? 0;
  const pct  = t.total_payout_percent ?? 0;
  if (maxP <= 0 || pct <= 0) return null;
  return Math.floor(t.entry_fee * maxP * pct / 100);
}

function TournamentCard({ t }: { t: BlitzTournament }) {
  const router  = useRouter();
  const isReg   = t.status === "registration";
  const isActive = t.status === "active";
  const isCompleted = t.status === "completed";
  const isScoring   = t.status === "scoring";

  // Bug 2 — prize pool display: show live pool once players join, else "up to ₦X"
  const livePool = t.prize_pool ?? 0;
  const maxPool  = computeMaxPool(t);
  const poolDisplay = livePool > 0
    ? `₦${livePool.toLocaleString()}`
    : maxPool != null
    ? `Up to ₦${maxPool.toLocaleString()}`
    : "₦0";

  // Bug 1 — lobby CTA: never show "Play Now" from list (registration state unknown)
  // active → "View →" (detail page resolves registered state)
  // registration → "Register →"
  // completed → "View Results →"
  // scoring → "Scoring..."
  const ctaLabel = isReg
    ? "Register →"
    : isActive
    ? "View →"
    : isCompleted
    ? "View Results →"
    : isScoring
    ? "Scoring…"
    : "View →";

  const ctaClass = isCompleted || isScoring
    ? "bg-[#1A1A1A] text-gray-500"
    : "bg-[#4C6FFF]/10 text-[#4C6FFF] border border-[#4C6FFF]/20";

  return (
    <motion.button
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.99 }}
      onClick={() => router.push(`/blitz/${t.id}`)}
      className="w-full bg-[#111] border border-[#1E1E1E] rounded-2xl p-5 text-left space-y-4 hover:border-[#4C6FFF]/30 transition-all"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <Zap size={15} style={{ color: "var(--accent-amber)" }} className="flex-shrink-0" />
            <h3 className="text-white font-black text-lg leading-tight truncate">{t.title}</h3>
          </div>
          {t.description && (
            <p className="text-gray-500 text-xs leading-relaxed line-clamp-2">{t.description}</p>
          )}
        </div>
        <StatusBadge status={t.status} />
      </div>

      {/* Stats — Bug 2: pool, Bug 3: players X/Y */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-[#0A0A0A] rounded-xl p-3 text-center">
          <p className="text-[10px] text-gray-600 mb-1 uppercase tracking-wide">Entry</p>
          <p className="font-black text-base font-mono" style={{ color: "var(--accent-amber)" }}>
            ₦{t.entry_fee.toLocaleString()}
          </p>
        </div>
        <div className="bg-[#0A0A0A] rounded-xl p-3 text-center">
          <p className="text-[10px] text-gray-600 mb-1 uppercase tracking-wide">Prize Pool</p>
          <p className={`font-black font-mono leading-tight ${livePool > 0 ? "text-white text-base" : "text-[10px] text-gray-400"}`}>
            {poolDisplay}
          </p>
        </div>
        <div className="bg-[#0A0A0A] rounded-xl p-3 text-center">
          <p className="text-[10px] text-gray-600 mb-1 uppercase tracking-wide">Players</p>
          {/* Bug 3 — show X / Y */}
          <p className="text-white font-bold text-sm flex items-center justify-center gap-1">
            <Users size={12} />
            {t.total_registered}{t.max_participants ? `/${t.max_participants}` : ""}
          </p>
        </div>
      </div>

      {/* Speed badge + position prizes */}
      <div className="flex flex-wrap items-center gap-2">
        {t.per_question_time_seconds != null && (
          <span className="text-[10px] font-bold px-2 py-1 rounded-md"
            style={{ backgroundColor: "rgba(232,163,61,0.12)", color: "var(--accent-amber)", border: "1px solid rgba(232,163,61,0.25)" }}>
            ⚡ {t.per_question_time_seconds}s/question
          </span>
        )}
        {(t.position_prizes ?? []).map((p) => (
          <span key={p.position} className="text-[10px] font-bold px-2 py-1 rounded-md"
            style={{ backgroundColor: "rgba(124,111,232,0.1)", color: "var(--accent-violet)", border: "1px solid rgba(124,111,232,0.2)" }}>
            #{p.position}: {p.prize_type === "free_ticket" ? "Free entry 🎫" : `${p.discount_percent ?? "?"}% off 🏷️`}
          </span>
        ))}
      </div>

      {/* Footer — Bug 1: corrected CTA labels */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Clock size={12} />
          {isReg       && `Starts in ${formatCountdown(t.tournament_start)}`}
          {isActive    && `Ends in ${formatCountdown(t.tournament_end)}`}
          {isCompleted && "Tournament ended"}
          {isScoring   && "Calculating results…"}
        </div>
        <div className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${ctaClass}`}>
          {ctaLabel}
        </div>
      </div>
    </motion.button>
  );
}

export default function BlitzLobbyPage() {
  const { state } = useApp();
  const router = useRouter();
  const [tournaments, setTournaments] = useState<BlitzTournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!state.isAuthenticated) { router.push("/auth"); return; }
    blitzApi.getAll()
      .then((res) => setTournaments(res.tournaments))
      .catch((err) => { if (err instanceof ApiError) setError(err.message); })
      .finally(() => setLoading(false));
  }, [state.isAuthenticated, router]);

  if (!state.isAuthenticated) return null;

  const active       = tournaments.filter((t) => t.status === "active");
  const registration = tournaments.filter((t) => t.status === "registration");
  const scoring      = tournaments.filter((t) => t.status === "scoring");
  const completed    = tournaments.filter((t) => t.status === "completed");

  const Section = ({ title, items }: { title: string; items: BlitzTournament[] }) => (
    <section className="space-y-3">
      <h2 className="text-[11px] text-gray-500 uppercase tracking-widest font-bold">{title}</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {items.map((t) => <TournamentCard key={t.id} t={t} />)}
      </div>
    </section>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 lg:px-8 py-6 space-y-8">
      {error && (
        <p className="text-red-400 text-sm bg-red-900/10 border border-red-900/30 rounded-xl p-3">{error}</p>
      )}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-[#111] border border-[#1E1E1E] rounded-2xl p-5 h-44 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {active.length > 0       && <Section title="Live Now"            items={active} />}
          {registration.length > 0 && <Section title="Registration Open"   items={registration} />}
          {scoring.length > 0      && <Section title="Calculating Results" items={scoring} />}
          {completed.length > 0    && <Section title="Completed"           items={completed} />}
          {tournaments.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#141414] border border-[#1E1E1E] flex items-center justify-center mb-4">
                <Zap size={28} className="text-gray-700" />
              </div>
              <p className="text-gray-500 font-semibold">No tournaments right now</p>
              <p className="text-gray-700 text-sm mt-1">Check back soon for new Blitz events</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
