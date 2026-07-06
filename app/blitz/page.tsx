"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { blitzApi, type BlitzTournament, ApiError } from "@/lib/api";
import { Zap, Users, Clock } from "lucide-react";

function StatusBadge({ status }: { status: BlitzTournament["status"] }) {
  const config = {
    registration: { label: "Open", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
    active:        { label: "Live", color: "bg-neon/20 text-neon border-neon/30" },
    completed:     { label: "Ended", color: "bg-gray-700/30 text-gray-500 border-gray-700/30" },
    draft:         { label: "Soon", color: "bg-gray-700/20 text-gray-600 border-gray-700/20" },
    scoring:       { label: "Scoring", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
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

function TournamentCard({ t }: { t: BlitzTournament }) {
  const router = useRouter();
  const isReg = t.status === "registration";
  const isActive = t.status === "active";
  const isCompleted = t.status === "completed";

  return (
    <motion.button
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.99 }}
      onClick={() => router.push(`/blitz/${t.id}`)}
      className="w-full bg-[#111] border border-[#1E1E1E] rounded-2xl p-5 text-left space-y-4 hover:border-neon/30 transition-all"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <Zap size={15} className="text-neon flex-shrink-0" />
            <h3 className="text-white font-black text-lg leading-tight truncate">{t.title}</h3>
          </div>
          {t.description && (
            <p className="text-gray-500 text-xs leading-relaxed line-clamp-2">{t.description}</p>
          )}
        </div>
        <StatusBadge status={t.status} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-[#0A0A0A] rounded-xl p-3 text-center">
          <p className="text-[10px] text-gray-600 mb-1 uppercase tracking-wide">Entry</p>
          <p className="text-neon font-black text-base">₦{t.entry_fee.toLocaleString()}</p>
        </div>
        <div className="bg-[#0A0A0A] rounded-xl p-3 text-center">
          <p className="text-[10px] text-gray-600 mb-1 uppercase tracking-wide">Prize Pool</p>
          <p className="text-white font-black text-base">₦{t.prize_pool.toLocaleString()}</p>
        </div>
        <div className="bg-[#0A0A0A] rounded-xl p-3 text-center">
          <p className="text-[10px] text-gray-600 mb-1 uppercase tracking-wide">Players</p>
          <p className="text-white font-bold text-base flex items-center justify-center gap-1">
            <Users size={12} />{t.total_registered}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Clock size={12} />
          {isReg && `Starts in ${formatCountdown(t.tournament_start)}`}
          {isActive && `Ends in ${formatCountdown(t.tournament_end)}`}
          {isCompleted && "Tournament ended"}
        </div>
        <div className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
          isCompleted
            ? "bg-[#1A1A1A] text-gray-500"
            : "bg-neon/10 text-neon border border-neon/20"
        }`}>
          {isReg ? "Register →" : isActive ? "Play Now →" : isCompleted ? "View Results →" : "View →"}
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

  const active = tournaments.filter((t) => t.status === "active");
  const registration = tournaments.filter((t) => t.status === "registration");
  const completed = tournaments.filter((t) => t.status === "completed");

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
          {active.length > 0 && <Section title="Live Now" items={active} />}
          {registration.length > 0 && <Section title="Registration Open" items={registration} />}
          {completed.length > 0 && <Section title="Completed" items={completed} />}

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
