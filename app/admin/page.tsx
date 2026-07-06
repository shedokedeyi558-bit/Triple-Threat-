"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { adminApi, type AdminStats, type BlitzTournament, ApiError } from "@/lib/api";
import {
  Users, TrendingUp, DollarSign, AlertCircle,
  Plus, Clock, ArrowRight, ShieldAlert, Zap,
} from "lucide-react";

interface RecentPack {
  id: string;
  name: string;
  category: string;
  status: string;
  pills: { id: string; color: string; status: string }[];
}

interface RecentPrediction {
  id: string;
  title: string;
  category: string;
  status: string;
  slots_filled: number;
  max_slots: number;
  countdown_end: string;
}

const badge = (s: string) => {
  switch (s) {
    case "active":       return "bg-neon/15 text-neon";
    case "registration": return "bg-blue-500/20 text-blue-400";
    case "completed":    return "bg-gray-800 text-gray-400";
    case "locked":       return "bg-orange-900/20 text-orange-400";
    case "scoring":      return "bg-yellow-500/20 text-yellow-400";
    default:             return "bg-[#222] text-gray-500";
  }
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [packs, setPacks] = useState<RecentPack[]>([]);
  const [predictions, setPredictions] = useState<RecentPrediction[]>([]);
  const [blitz, setBlitz] = useState<BlitzTournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [statsRes, gamesRes, packsRes, blitzRes] = await Promise.allSettled([
          adminApi.getStats(),
          adminApi.getGames({ limit: 5 }),
          adminApi.getPillPacks(),
          adminApi.getBlitzTournaments(),
        ]);

        if (statsRes.status === "fulfilled") setStats(statsRes.value);
        if (gamesRes.status === "fulfilled") {
          setPredictions(
            (gamesRes.value.games as any[])
              .filter((g) => g.game_type === "predictions")
              .slice(0, 3) as RecentPrediction[]
          );
        }
        if (packsRes.status === "fulfilled") {
          setPacks((packsRes.value.packs || []).slice(0, 3) as RecentPack[]);
        }
        if (blitzRes.status === "fulfilled") {
          setBlitz(
            (blitzRes.value.tournaments || [])
              .filter((t: BlitzTournament) => ["registration", "active", "scoring"].includes(t.status))
              .slice(0, 3)
          );
        }
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const statCards = stats ? [
    {
      icon: <DollarSign size={14} className="text-neon" />,
      label: "Revenue Today",
      value: `₦${stats.revenueToday.toLocaleString()}`,
      sub: `₦${stats.payoutsToday.toLocaleString()} paid out`,
      color: "text-neon",
    },
    {
      icon: <TrendingUp size={14} className="text-yellow-400" />,
      label: "Profit Today",
      value: `₦${stats.profitToday.toLocaleString()}`,
      sub: `${stats.playsToday} plays today`,
      color: "text-yellow-400",
    },
    {
      icon: <Users size={14} className="text-blue-400" />,
      label: "Total Players",
      value: stats.totalPlayers.toLocaleString(),
      sub: "Registered accounts",
      color: "text-white",
    },
    {
      icon: <ShieldAlert size={14} className="text-orange-400" />,
      label: "Pending Withdrawals",
      value: stats.pendingWithdrawals.toString(),
      sub: stats.pendingWithdrawals > 0 ? "Needs attention" : "All clear",
      color: stats.pendingWithdrawals > 0 ? "text-orange-400" : "text-gray-300",
    },
  ] : [];

  return (
    <div className="space-y-6 max-w-5xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">Live overview</p>
        </div>
        <Link
          href="/admin/games/create"
          className="flex items-center gap-2 px-4 py-2.5 bg-neon text-black font-bold rounded-xl hover:bg-neon/90 transition-colors text-sm"
        >
          <Plus size={15} /> Create Game
        </Link>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-800/40 rounded-xl p-3 text-red-400 text-sm flex items-center gap-2">
          <AlertCircle size={14} className="flex-shrink-0" /> {error}
        </div>
      )}

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1,2,3,4].map((i) => <div key={i} className="bg-[#141414] border border-[#1E1E1E] rounded-2xl p-4 h-20 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {statCards.map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="bg-[#141414] border border-[#1E1E1E] rounded-2xl p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                {card.icon}
                <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">{card.label}</span>
              </div>
              <p className={`text-xl font-black ${card.color}`}>{card.value}</p>
              <p className="text-[11px] text-gray-600 mt-1">{card.sub}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* 3-column game sections */}
      <div className="grid lg:grid-cols-3 gap-4">

        {/* Pill Packs */}
        <div className="bg-[#141414] border border-[#1E1E1E] rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-black text-white text-sm">Pill Packs</h2>
            <Link href="/admin/blitz" className="text-[11px] text-neon flex items-center gap-1 hover:underline">
              Manage <ArrowRight size={11} />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-2">{[1,2].map((i) => <div key={i} className="h-12 bg-[#1A1A1A] rounded-xl animate-pulse" />)}</div>
          ) : packs.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-gray-600 text-xs">No packs yet</p>
              <Link href="/admin/games/create" className="text-[11px] text-neon mt-1 inline-block">Create →</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {packs.map((pack) => (
                <div key={pack.id} className="flex items-center justify-between bg-[#0E0E0E] border border-[#1E1E1E] rounded-xl px-3 py-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex gap-0.5 flex-shrink-0">
                      {pack.pills.slice(0, 4).map((p) => (
                        <span key={p.id} className="w-2.5 h-2.5 rounded-full" style={{ background: p.color, opacity: p.status === "played" ? 0.3 : 1 }} />
                      ))}
                    </div>
                    <p className="text-xs font-semibold text-white truncate">{pack.name}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ml-1 ${badge(pack.status)}`}>
                    {pack.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Time Machine */}
        <div className="bg-[#141414] border border-[#1E1E1E] rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-black text-white text-sm">Time Machine</h2>
            <Link href="/admin/games/create" className="text-[11px] text-neon flex items-center gap-1 hover:underline">
              Create <ArrowRight size={11} />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-2">{[1,2].map((i) => <div key={i} className="h-12 bg-[#1A1A1A] rounded-xl animate-pulse" />)}</div>
          ) : predictions.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-gray-600 text-xs">No predictions yet</p>
              <Link href="/admin/games/create" className="text-[11px] text-neon mt-1 inline-block">Create →</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {predictions.map((pred) => {
                const diffH = Math.max(0, Math.floor((new Date(pred.countdown_end).getTime() - Date.now()) / 3600000));
                return (
                  <Link
                    key={pred.id}
                    href={`/admin/games/${pred.id}`}
                    className="flex items-center justify-between bg-[#0E0E0E] border border-[#1E1E1E] rounded-xl px-3 py-2.5 hover:border-neon/20 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-white truncate">{pred.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-gray-600 flex items-center gap-1">
                          <Users size={9} /> {pred.slots_filled}/{pred.max_slots}
                        </span>
                        {pred.status === "active" && (
                          <span className="text-[10px] text-orange-400 flex items-center gap-1">
                            <Clock size={9} /> {diffH}h
                          </span>
                        )}
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ml-1 ${badge(pred.status)}`}>
                      {pred.status}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Blitz */}
        <div className="bg-[#141414] border border-[#1E1E1E] rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-black text-white text-sm flex items-center gap-1.5">
              <Zap size={14} className="text-neon" /> Blitz
            </h2>
            <Link href="/admin/blitz" className="text-[11px] text-neon flex items-center gap-1 hover:underline">
              Manage <ArrowRight size={11} />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-2">{[1,2].map((i) => <div key={i} className="h-12 bg-[#1A1A1A] rounded-xl animate-pulse" />)}</div>
          ) : blitz.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-gray-600 text-xs">No active tournaments</p>
              <Link href="/admin/blitz/create" className="text-[11px] text-neon mt-1 inline-block">Create →</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {blitz.map((t) => (
                <Link
                  key={t.id}
                  href="/admin/blitz"
                  className="flex items-center justify-between bg-[#0E0E0E] border border-[#1E1E1E] rounded-xl px-3 py-2.5 hover:border-neon/20 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-white truncate">{t.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-gray-600 flex items-center gap-1">
                        <Users size={9} /> {t.total_registered}
                      </span>
                      <span className="text-[10px] text-neon font-semibold">₦{t.prize_pool.toLocaleString()}</span>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ml-1 ${badge(t.status)}`}>
                    {t.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Create Blitz", href: "/admin/blitz/create", color: "border-neon/30 text-neon hover:bg-neon/10" },
          { label: "Withdrawals", href: "/admin/withdrawals", color: "border-orange-700/30 text-orange-400 hover:bg-orange-900/10" },
          { label: "Players", href: "/admin/players", color: "border-blue-700/30 text-blue-400 hover:bg-blue-900/10" },
          { label: "Analytics", href: "/admin/analytics", color: "border-yellow-700/30 text-yellow-400 hover:bg-yellow-900/10" },
        ].map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className={`py-3 rounded-xl border text-center text-sm font-semibold transition-colors ${a.color}`}
          >
            {a.label}
          </Link>
        ))}
      </div>

    </div>
  );
}
