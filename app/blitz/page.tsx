"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { blitzApi, type BlitzTournament, ApiError } from "@/lib/api";
import { BottomNavigation } from "@/components/ui/BottomNavigation";
import { Wallet, Zap, Users, Clock } from "lucide-react";
import Link from "next/link";

function StatusBadge({ status }: { status: BlitzTournament["status"] }) {
  const config = {
    registration: { label: "Registration", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
    active: { label: "Active", color: "bg-neon/20 text-neon border-neon/40" },
    completed: { label: "Completed", color: "bg-gray-500/20 text-gray-400 border-gray-500/30" },
    draft: { label: "Draft", color: "bg-gray-700/20 text-gray-500 border-gray-700/30" },
    scoring: { label: "Scoring", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  };
  const c = config[status];
  return (
    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest border ${c.color}`}>
      {c.label}
    </span>
  );
}

function formatCountdown(target: string): string {
  const now = new Date();
  const end = new Date(target);
  const diffMs = end.getTime() - now.getTime();
  if (diffMs <= 0) return "Ended";
  const hours = Math.floor(diffMs / 3600000);
  const mins = Math.floor((diffMs % 3600000) / 60000);
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}

function TournamentCard({ t }: { t: BlitzTournament }) {
  const router = useRouter();
  const isActive = t.status === "active";
  const isReg = t.status === "registration";
  const isCompleted = t.status === "completed";

  const countdown = isReg
    ? `Starts in ${formatCountdown(t.tournament_start)}`
    : isActive
    ? `Ends in ${formatCountdown(t.tournament_end)}`
    : null;

  const ctaLabel = isReg
    ? "Register"
    : isActive
    ? "Play Now"
    : isCompleted
    ? "View Results"
    : "View";

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => router.push(`/blitz/${t.id}`)}
      className="w-full bg-[#141414] border border-[#1E1E1E] rounded-2xl p-4 text-left space-y-3 hover:border-neon/30 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Zap size={14} className="text-neon flex-shrink-0" />
            <h3 className="text-white font-black text-lg leading-tight truncate">{t.title}</h3>
          </div>
          {t.description && (
            <p className="text-gray-500 text-xs leading-relaxed">{t.description}</p>
          )}
        </div>
        <StatusBadge status={t.status} />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="bg-[#0A0A0A] rounded-lg p-2">
          <p className="text-[10px] text-gray-500 mb-0.5">Entry</p>
          <p className="text-neon font-bold text-sm">₦{t.entry_fee.toLocaleString()}</p>
        </div>
        <div className="bg-[#0A0A0A] rounded-lg p-2">
          <p className="text-[10px] text-gray-500 mb-0.5">Prize Pool</p>
          <p className="text-white font-bold text-sm">₦{t.prize_pool.toLocaleString()}</p>
        </div>
        <div className="bg-[#0A0A0A] rounded-lg p-2">
          <p className="text-[10px] text-gray-500 mb-0.5">Players</p>
          <p className="text-white font-bold text-sm flex items-center gap-1">
            <Users size={12} />
            {t.total_registered}
          </p>
        </div>
      </div>

      {countdown && (
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <Clock size={12} />
          {countdown}
        </div>
      )}

      <div className="pt-2">
        <div className="w-full py-2.5 bg-neon/10 border border-neon/40 rounded-lg text-neon font-bold text-sm text-center">
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
    if (!state.isAuthenticated) {
      router.push("/auth");
      return;
    }
    fetchTournaments();
  }, [state.isAuthenticated, router]);

  const fetchTournaments = async () => {
    try {
      const res = await blitzApi.getAll();
      setTournaments(res.tournaments);
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!state.isAuthenticated) return null;

  const active = tournaments.filter((t) => t.status === "active");
  const registration = tournaments.filter((t) => t.status === "registration");
  const completed = tournaments.filter((t) => t.status === "completed");

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white pb-28">
      <header className="sticky top-0 z-40 bg-[#0A0A0A]/90 backdrop-blur-md border-b border-[#1A1A1A] px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap size={24} className="text-neon" />
            <span className="font-black text-2xl uppercase tracking-tight text-white">BLITZ</span>
          </div>
          <Link
            href="/wallet"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141414] border border-[#222] text-neon font-bold text-sm hover:border-neon/40 transition-colors"
          >
            <Wallet size={14} />
            ₦{state.player?.balance.toLocaleString() ?? "0"}
          </Link>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-400 text-sm bg-red-900/10 border border-red-900/30 rounded-xl p-3"
          >
            {error}
          </motion.p>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="bg-[#141414] border border-[#1E1E1E] rounded-2xl p-4 h-40 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {active.length > 0 && (
              <section>
                <h2 className="text-white font-bold text-sm uppercase tracking-widest text-gray-400 mb-3">
                  Active Tournaments
                </h2>
                <div className="space-y-3">
                  {active.map((t) => (
                    <TournamentCard key={t.id} t={t} />
                  ))}
                </div>
              </section>
            )}

            {registration.length > 0 && (
              <section>
                <h2 className="text-white font-bold text-sm uppercase tracking-widest text-gray-400 mb-3">
                  Registration Open
                </h2>
                <div className="space-y-3">
                  {registration.map((t) => (
                    <TournamentCard key={t.id} t={t} />
                  ))}
                </div>
              </section>
            )}

            {completed.length > 0 && (
              <section>
                <h2 className="text-white font-bold text-sm uppercase tracking-widest text-gray-400 mb-3">
                  Completed
                </h2>
                <div className="space-y-3">
                  {completed.map((t) => (
                    <TournamentCard key={t.id} t={t} />
                  ))}
                </div>
              </section>
            )}

            {tournaments.length === 0 && (
              <div className="bg-[#141414] border border-[#1E1E1E] rounded-2xl p-12 text-center">
                <Zap size={48} className="text-gray-700 mx-auto mb-3" />
                <p className="text-gray-600 text-sm">No tournaments available right now</p>
              </div>
            )}
          </>
        )}
      </div>

      <BottomNavigation />
    </main>
  );
}
