"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { adminApi, type AdminStats, type BlitzTournament, ApiError } from "@/lib/api";
import { CreatePillPackForm } from "@/components/admin/CreatePillPackForm";
import { CreateTimeMachineForm } from "@/components/admin/CreateTimeMachineForm";
import {
  Users, AlertCircle, Banknote, Gamepad2,
  ChevronRight, Package, Clock, Zap, Activity,
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

const statusBadge = (s: string) => {
  switch (s) {
    case "active":       return "bg-[#4C6FFF]/15 text-[#4C6FFF]";
    case "registration": return "bg-blue-500/20 text-blue-400";
    case "completed":    return "bg-gray-800 text-gray-400";
    case "locked":       return "bg-orange-900/20 text-orange-400";
    case "scoring":      return "bg-yellow-500/20 text-yellow-400";
    default:             return "text-[--text-muted]";
  }
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [packs, setPacks] = useState<RecentPack[]>([]);
  const [totalActivePacks, setTotalActivePacks] = useState(0);
  const [predictions, setPredictions] = useState<RecentPrediction[]>([]);
  const [blitz, setBlitz] = useState<BlitzTournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showPillForm, setShowPillForm] = useState(false);
  const [showTimeMachineForm, setShowTimeMachineForm] = useState(false);

  // Live pack stats — polled every 12s independently of the main load
  interface PackLiveStat {
    pack_id: string; pack_name: string;
    in_progress: number; won: number; lost: number;
    total_attempts: number; win_rate: number;
  }
  const [liveStats, setLiveStats] = useState<PackLiveStat[]>([]);
  const liveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchLiveStats = async () => {
    try {
      const res = await adminApi.getAllPacksLiveStats();
      setLiveStats(res.packs ?? []);
    } catch { /* silent — widget degrades gracefully */ }
  };

  useEffect(() => {
    fetchLiveStats();
    liveTimerRef.current = setInterval(fetchLiveStats, 12000);
    return () => { if (liveTimerRef.current) clearInterval(liveTimerRef.current); };
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [statsRes, gamesRes, packsRes, blitzRes] = await Promise.allSettled([
          adminApi.getStats(),
          adminApi.getGames({ limit: 20, game_type: "predictions" }),
          adminApi.getPillPacks(),
          adminApi.getBlitzTournaments(),
        ]);

        if (statsRes.status === "fulfilled") setStats(statsRes.value);
        if (gamesRes.status === "fulfilled") {
          setPredictions(
            ((gamesRes.value.games as any[]) || [])
              .filter((g) => g.category || g.countdown_end)
              .slice(0, 3) as RecentPrediction[]
          );
        }
        if (packsRes.status === "fulfilled") {
          const allPacks = (packsRes.value.packs || []) as RecentPack[];
          setTotalActivePacks(allPacks.filter((p) => p.status === "active").length);
          setPacks(allPacks.slice(0, 3));
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-headline text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>
          Dashboard
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          Live overview
        </p>
      </div>

      {error && (
        <div className="rounded-xl p-4 border flex items-center gap-3" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)", color: "var(--text-secondary)" }}>
          <AlertCircle size={16} className="flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Stats Row - 4 Cards */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-xl p-4 border animate-pulse"
              style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-hairline)" }}
            />
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Players - Indigo */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
            className="rounded-xl p-4 border"
            style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-hairline)" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Users size={14} style={{ color: "var(--accent-indigo)" }} />
              <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                Players
              </span>
            </div>
            <p className="font-mono text-xl font-bold" style={{ color: "var(--text-primary)" }}>
              {stats.totalPlayers.toLocaleString()}
            </p>
          </motion.div>

          {/* Revenue - Amber */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-xl p-4 border"
            style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-hairline)" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Banknote size={14} style={{ color: "var(--accent-amber)" }} />
              <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                Revenue Today
              </span>
            </div>
            <p className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
              <span>₦</span><span className="font-mono">{stats.revenueToday.toLocaleString()}</span>
            </p>
          </motion.div>

          {/* Pending Withdrawals - Amber */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl p-4 border"
            style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-hairline)" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle size={14} style={{ color: "var(--accent-amber)" }} />
              <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                Pending Withdrawals
              </span>
            </div>
            <p className="font-mono text-xl font-bold" style={{ color: "var(--text-primary)" }}>
              {stats.pendingWithdrawals}
            </p>
          </motion.div>

          {/* Active Games - Violet */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-xl p-4 border"
            style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-hairline)" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Gamepad2 size={14} style={{ color: "var(--accent-violet)" }} />
              <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                Active Games
              </span>
            </div>
            <p className="font-mono text-xl font-bold" style={{ color: "var(--text-primary)" }}>
              {(blitz.length + (stats?.predictions?.live ?? predictions.filter(p => p.status === "active" || p.status === "locked").length) + totalActivePacks).toString()}
            </p>
          </motion.div>
        </div>
      ) : null}

      {/* Game Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Pill Packs - Indigo (Desktop) — with live per-pack stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl p-4 border hidden lg:block"
          style={{
            backgroundColor: "var(--bg-card)",
            borderColor: "var(--border-hairline)",
            borderLeft: "3px solid var(--accent-indigo)",
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Package size={14} style={{ color: "var(--accent-indigo)" }} />
              <h2 className="font-headline font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                Pill Packs
              </h2>
            </div>
            <div className="flex items-center gap-1.5">
              <Activity size={10} style={{ color: "var(--accent-indigo)" }} className="animate-pulse" />
              <span className="text-[9px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Live</span>
            </div>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => <div key={i} className="h-10 rounded animate-pulse" style={{ backgroundColor: "var(--bg-base)" }} />)}
            </div>
          ) : liveStats.length === 0 && packs.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>No packs yet</p>
              <button onClick={() => setShowPillForm(true)} className="text-xs font-semibold mt-3 inline-block" style={{ color: "var(--accent-indigo)" }}>
                + create pack
              </button>
            </div>
          ) : (
            <div className="space-y-2 mb-4">
              {(liveStats.length > 0 ? liveStats.slice(0, 4) : packs.map(p => ({
                pack_id: p.id, pack_name: p.name,
                in_progress: 0, won: 0, lost: 0, total_attempts: 0, win_rate: 0,
              }))).map((s) => {
                const winRateHigh = s.total_attempts >= 5 && s.win_rate > 70;
                const winRateLow  = s.total_attempts >= 5 && s.win_rate < 15;
                return (
                  <div key={s.pack_id} className="rounded-lg p-2.5" style={{ backgroundColor: "var(--bg-base)" }}>
                    {/* Pack name + win rate flag */}
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <p className="text-xs font-semibold truncate" style={{ color: "var(--text-primary)" }}>{s.pack_name}</p>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {winRateHigh && (
                          <span style={{ fontSize: 8, fontWeight: 700, padding: "1px 5px", borderRadius: 3, backgroundColor: "rgba(251,191,36,0.12)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.2)" }}>
                            Too easy
                          </span>
                        )}
                        {winRateLow && (
                          <span style={{ fontSize: 8, fontWeight: 700, padding: "1px 5px", borderRadius: 3, backgroundColor: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" }}>
                            Low wins
                          </span>
                        )}
                        {s.total_attempts >= 5 && (
                          <span className="text-[10px] font-mono font-bold" style={{ color: winRateHigh ? "#fbbf24" : winRateLow ? "#f87171" : "var(--text-secondary)" }}>
                            {s.win_rate.toFixed(0)}% win
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Live counters */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                        <span className="text-[10px] font-semibold text-blue-400">{s.in_progress}</span>
                        <span className="text-[9px]" style={{ color: "var(--text-muted)" }}>live</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "var(--accent-amber)" }} />
                        <span className="text-[10px] font-semibold" style={{ color: "var(--accent-amber)" }}>{s.won}</span>
                        <span className="text-[9px]" style={{ color: "var(--text-muted)" }}>won</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-600" />
                        <span className="text-[10px] font-semibold text-gray-500">{s.lost}</span>
                        <span className="text-[9px]" style={{ color: "var(--text-muted)" }}>lost</span>
                      </div>
                      {/* Win rate mini bar */}
                      {s.total_attempts >= 5 && (
                        <div className="flex-1 h-1 rounded-full overflow-hidden ml-1" style={{ backgroundColor: "#1E1E1E" }}>
                          <div className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${s.win_rate}%`, backgroundColor: winRateHigh ? "#fbbf24" : winRateLow ? "#ef4444" : "#34d399" }} />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <Link
            href="/admin/pills"
            className="text-xs font-semibold block text-center py-2 rounded-lg transition-colors"
            style={{ color: "var(--accent-indigo)", backgroundColor: "var(--accent-indigo)" + "15" }}
          >
            Manage all packs
          </Link>
        </motion.div>

        {/* Time Machine - Violet (Desktop) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="rounded-xl p-4 border hidden lg:block"
          style={{
            backgroundColor: "var(--bg-card)",
            borderColor: "var(--border-hairline)",
            borderLeft: "3px solid var(--accent-violet)",
          }}
        >
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <Clock size={14} style={{ color: "var(--accent-violet)" }} />
              <h2 className="font-headline font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                Time Machine
              </h2>
            </div>
            {!loading && (() => {
              const live = stats?.predictions?.live ?? predictions.filter(p => p.status === "active" || p.status === "locked").length;
              return live > 0 ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ backgroundColor: "rgba(124,111,232,0.15)", color: "var(--accent-violet)" }}>
                  {live} live
                </span>
              ) : null;
            })()}
          </div>
          {loading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => <div key={i} className="h-8 rounded animate-pulse" style={{ backgroundColor: "var(--bg-base)" }} />)}
            </div>
          ) : predictions.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                No predictions yet
              </p>
              <button
                onClick={() => setShowTimeMachineForm(true)}
                className="text-xs font-semibold mt-3 inline-block"
                style={{ color: "var(--accent-violet)" }}
              >
                + create prediction
              </button>
            </div>
          ) : (
            <div className="space-y-2 mb-4">
              {predictions.map((pred) => {
                const diffH = Math.max(0, Math.floor((new Date(pred.countdown_end).getTime() - Date.now()) / 3600000));
                return (
                  <div
                    key={pred.id}
                    className="flex items-center justify-between p-2 rounded-lg"
                    style={{ backgroundColor: "var(--bg-base)" }}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                        {pred.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px]" style={{ color: "var(--text-muted)" }}>
                          {pred.slots_filled}/{pred.max_slots}
                        </span>
                        {pred.status === "active" && (
                          <span className="text-[9px] font-semibold" style={{ color: "var(--accent-amber)" }}>
                            {diffH}h
                          </span>
                        )}
                      </div>
                    </div>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ml-1 ${statusBadge(pred.status)}`}>
                      {pred.status}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
          <Link
            href="/admin/predictions"
            className="text-xs font-semibold block text-center py-2 rounded-lg transition-colors"
            style={{ color: "var(--accent-violet)", backgroundColor: "var(--accent-violet)" + "15" }}
          >
            Manage all predictions
          </Link>
        </motion.div>

        {/* Blitz - Amber (Desktop) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl p-4 border hidden lg:block"
          style={{
            backgroundColor: "var(--bg-card)",
            borderColor: "var(--border-hairline)",
            borderLeft: "3px solid var(--accent-amber)",
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Zap size={14} style={{ color: "var(--accent-amber)" }} />
            <h2 className="font-headline font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
              Blitz
            </h2>
          </div>
          {loading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => <div key={i} className="h-8 rounded animate-pulse" style={{ backgroundColor: "var(--bg-base)" }} />)}
            </div>
          ) : blitz.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                No active tournaments
              </p>
              <Link
                href="/admin/blitz/create"
                className="text-xs font-semibold mt-3 inline-block"
                style={{ color: "var(--accent-amber)" }}
              >
                + create tournament
              </Link>
            </div>
          ) : (
            <div className="space-y-2 mb-4">
              {blitz.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-2 rounded-lg"
                  style={{ backgroundColor: "var(--bg-base)" }}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                      {t.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[9px]" style={{ color: "var(--text-muted)" }}>
                        {t.total_registered} players
                      </span>
                      <span className="text-[9px] font-semibold" style={{ color: "var(--accent-amber)" }}>
                        ₦{t.prize_pool.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ml-1 ${statusBadge(t.status)}`}>
                    {t.status}
                  </span>
                </div>
              ))}
            </div>
          )}
          <Link
            href="/admin/blitz"
            className="text-xs font-semibold block text-center py-2 rounded-lg transition-colors"
            style={{ color: "var(--accent-amber)", backgroundColor: "var(--accent-amber)" + "15" }}
          >
            Manage all tournaments
          </Link>
        </motion.div>

        {/* Mobile: Pill Packs — aggregated live stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:hidden rounded-xl p-4 border"
          style={{
            backgroundColor: "var(--bg-card)",
            borderColor: "var(--border-hairline)",
            borderLeft: "3px solid var(--accent-indigo)",
          }}
        >
          <Link href="/admin/pills" className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <Package size={14} style={{ color: "var(--accent-indigo)", flexShrink: 0 }} />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h2 className="font-headline font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                    Pill Packs
                  </h2>
                  {liveStats.length > 0 && (
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                      <span className="text-[9px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Live</span>
                    </div>
                  )}
                </div>
                {liveStats.length > 0 ? (() => {
                  const totalLive = liveStats.reduce((s, p) => s + p.in_progress, 0);
                  const totalWon  = liveStats.reduce((s, p) => s + p.won, 0);
                  const totalLost = liveStats.reduce((s, p) => s + p.lost, 0);
                  const totalAttempts = liveStats.reduce((s, p) => s + p.total_attempts, 0);
                  const aggWinRate = totalAttempts > 0 ? Math.round((totalWon / totalAttempts) * 100) : null;
                  const winRateHigh = aggWinRate != null && totalAttempts >= 10 && aggWinRate > 70;
                  return (
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-[11px] font-semibold text-blue-400">{totalLive} live</span>
                      <span className="text-[11px] font-semibold" style={{ color: "var(--accent-amber)" }}>{totalWon} won</span>
                      <span className="text-[11px] font-semibold text-gray-500">{totalLost} lost</span>
                      {aggWinRate != null && totalAttempts >= 10 && (
                        <span className="text-[11px] font-semibold" style={{ color: winRateHigh ? "#fbbf24" : "var(--text-muted)" }}>
                          {aggWinRate}% win rate{winRateHigh ? " · Too easy" : ""}
                        </span>
                      )}
                    </div>
                  );
                })() : (
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                    {totalActivePacks > 0 ? `${totalActivePacks} active` : "No active packs"}
                  </p>
                )}
              </div>
            </div>
            <ChevronRight size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
          </Link>
        </motion.div>

        {/* Mobile: Time Machine */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="lg:hidden rounded-xl p-4 border"
          style={{
            backgroundColor: "var(--bg-card)",
            borderColor: "var(--border-hairline)",
            borderLeft: "3px solid var(--accent-violet)",
          }}
        >
          <Link
            href="/admin/predictions"
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Clock size={14} style={{ color: "var(--accent-violet)" }} />
              <div>
                <h2 className="font-headline font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                  Time Machine
                </h2>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                  {(() => {
                    const live = stats?.predictions?.live ?? predictions.filter(p => p.status === "active" || p.status === "locked").length;
                    return live > 0 ? `${live} live` : "No active events";
                  })()}
                </p>
              </div>
            </div>
            <ChevronRight size={16} style={{ color: "var(--text-muted)" }} />
          </Link>
        </motion.div>

        {/* Mobile: Blitz */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:hidden rounded-xl p-4 border"
          style={{
            backgroundColor: "var(--bg-card)",
            borderColor: "var(--border-hairline)",
            borderLeft: "3px solid var(--accent-amber)",
          }}
        >
          <Link
            href="/admin/blitz"
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Zap size={14} style={{ color: "var(--accent-amber)" }} />
              <div>
                <h2 className="font-headline font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                  Blitz
                </h2>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                  {blitz.length > 0 ? `${blitz.length} active` : "No tournaments yet"}
                </p>
              </div>
            </div>
            <ChevronRight size={16} style={{ color: "var(--text-muted)" }} />
          </Link>
        </motion.div>
      </div>

      {/* Modals */}
      <CreatePillPackForm
        isOpen={showPillForm}
        onClose={() => setShowPillForm(false)}
        onSuccess={() => window.location.reload()}
      />

      <CreateTimeMachineForm
        isOpen={showTimeMachineForm}
        onClose={() => setShowTimeMachineForm(false)}
        onSuccess={() => window.location.reload()}
      />
    </div>
  );
}
