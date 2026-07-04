"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { adminApi, type AdminStats, ApiError } from "@/lib/api";
import {
  Users, TrendingUp, DollarSign, AlertCircle,
  Loader2, Plus, Clock, ArrowRight, ShieldAlert,
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

const statusPill = (s: string) => {
  switch (s) {
    case "active":    return "bg-neon/15 text-neon";
    case "draft":     return "bg-[#222] text-gray-500";
    case "completed": return "bg-blue-900/20 text-blue-400";
    case "locked":    return "bg-orange-900/20 text-orange-400";
    default:          return "bg-[#222] text-gray-500";
  }
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [packs, setPacks] = useState<RecentPack[]>([]);
  const [predictions, setPredictions] = useState<RecentPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetch = async () => {
      try {
        const [statsRes, gamesRes, packsRes] = await Promise.allSettled([
          adminApi.getStats(),
          adminApi.getGames({ limit: 5 }),
          adminApi.getPillPacks(),
        ]);

        if (statsRes.status === "fulfilled") setStats(statsRes.value);
        if (gamesRes.status === "fulfilled") {
          const games = gamesRes.value.games || [];
          setPredictions(
            (games as any[])
              .filter((g) => g.game_type === "predictions")
              .slice(0, 4) as RecentPrediction[]
          );
        }
        if (packsRes.status === "fulfilled") {
          setPacks((packsRes.value.packs || []).slice(0, 4) as RecentPack[]);
        }
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

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
          <Plus size={16} /> Create Game
        </Link>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-800/40 rounded-xl p-3 text-red-400 text-sm flex items-center gap-2">
          <AlertCircle size={15} className="flex-shrink-0" /> {error}
        </div>
      )}

      {/* ── Stats Row ── */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1,2,3,4].map((i) => (
            <div key={i} className="bg-[#141414] border border-[#1E1E1E] rounded-2xl p-4 h-20 animate-pulse" />
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              icon: <DollarSign size={15} className="text-neon" />,
              label: "Revenue Today",
              value: `₦${stats.revenueToday.toLocaleString()}`,
              sub: `₦${stats.payoutsToday.toLocaleString()} paid out`,
              valueColor: "text-neon",
            },
            {
              icon: <TrendingUp size={15} className="text-yellow-400" />,
              label: "Profit Today",
              value: `₦${stats.profitToday.toLocaleString()}`,
              sub: `${stats.playsToday} plays`,
              valueColor: "text-yellow-400",
            },
            {
              icon: <Users size={15} className="text-blue-400" />,
              label: "Total Players",
              value: stats.totalPlayers.toLocaleString(),
              sub: "Registered accounts",
              valueColor: "text-white",
            },
            {
              icon: <ShieldAlert size={15} className="text-orange-400" />,
              label: "Pending Withdrawals",
              value: stats.pendingWithdrawals.toString(),
              sub: stats.pendingWithdrawals > 0 ? "Needs attention" : "All clear",
              valueColor: stats.pendingWithdrawals > 0 ? "text-orange-400" : "text-white",
            },
          ].map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="bg-[#141414] border border-[#1E1E1E] rounded-2xl p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                {card.icon}
                <span className="text-[11px] text-gray-500 font-medium">{card.label}</span>
              </div>
              <p className={`text-xl font-black ${card.valueColor}`}>{card.value}</p>
              <p className="text-[11px] text-gray-600 mt-1">{card.sub}</p>
            </motion.div>
          ))}
        </div>
      ) : null}

      {/* ── Content Grid ── */}
      <div className="grid lg:grid-cols-2 gap-5">

        {/* Pill Packs */}
        <div className="bg-[#141414] border border-[#1E1E1E] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-black text-white">Pill Packs</h2>
            <Link href="/admin/games?type=pills" className="text-xs text-neon hover:underline flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1,2].map((i) => <div key={i} className="h-14 bg-[#1A1A1A] rounded-xl animate-pulse" />)}
            </div>
          ) : packs.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-gray-600 text-sm">No pill packs yet</p>
              <Link href="/admin/games/create" className="text-xs text-neon mt-2 inline-block hover:underline">
                Create your first pack →
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {packs.map((pack) => (
                <div
                  key={pack.id}
                  className="flex items-center justify-between bg-[#0E0E0E] border border-[#1E1E1E] rounded-xl px-3 py-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Pill color dots */}
                    <div className="flex gap-1 flex-shrink-0">
                      {pack.pills.slice(0, 5).map((p) => (
                        <span
                          key={p.id}
                          className="w-3 h-3 rounded-full"
                          style={{ background: p.color, opacity: p.status === "played" ? 0.3 : 1 }}
                        />
                      ))}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{pack.name}</p>
                      <p className="text-[11px] text-gray-500">{pack.category} · {pack.pills.length} pills</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0 ml-2 ${statusPill(pack.status)}`}>
                    {pack.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Time Machine */}
        <div className="bg-[#141414] border border-[#1E1E1E] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-black text-white">Time Machine</h2>
            <Link href="/admin/games?type=predictions" className="text-xs text-neon hover:underline flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1,2].map((i) => <div key={i} className="h-14 bg-[#1A1A1A] rounded-xl animate-pulse" />)}
            </div>
          ) : predictions.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-gray-600 text-sm">No predictions yet</p>
              <Link href="/admin/games/create" className="text-xs text-neon mt-2 inline-block hover:underline">
                Create a prediction →
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {predictions.map((pred) => {
                const end = new Date(pred.countdown_end);
                const now = new Date();
                const diffH = Math.max(0, Math.floor((end.getTime() - now.getTime()) / 3600000));
                return (
                  <Link
                    key={pred.id}
                    href={`/admin/games/${pred.id}`}
                    className="flex items-center justify-between bg-[#0E0E0E] border border-[#1E1E1E] rounded-xl px-3 py-3 hover:border-neon/30 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white truncate">{pred.title}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-[11px] text-gray-500">{pred.category}</span>
                        <span className="flex items-center gap-1 text-[11px] text-gray-500">
                          <Users size={9} /> {pred.slots_filled}/{pred.max_slots}
                        </span>
                        {pred.status === "active" && (
                          <span className="flex items-center gap-1 text-[11px] text-orange-400">
                            <Clock size={9} /> {diffH}h left
                          </span>
                        )}
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0 ml-2 ${statusPill(pred.status)}`}>
                      {pred.status}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Create Pack", href: "/admin/games/create", color: "border-neon/30 text-neon hover:bg-neon/10" },
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
