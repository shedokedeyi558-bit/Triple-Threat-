"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { adminApi, type AdminStats, type BlitzTournament, ApiError } from "@/lib/api";
import { CreatePillPackForm } from "@/components/admin/CreatePillPackForm";
import { CreateTimeMachineForm } from "@/components/admin/CreateTimeMachineForm";
import {
  Users, AlertCircle, Banknote, Gamepad2,
  ChevronRight, Package, Clock, Zap,
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
  const [predictions, setPredictions] = useState<RecentPrediction[]>([]);
  const [blitz, setBlitz] = useState<BlitzTournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showPillForm, setShowPillForm] = useState(false);
  const [showTimeMachineForm, setShowTimeMachineForm] = useState(false);

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
            <p className="font-mono text-xl font-bold" style={{ color: "var(--text-primary)" }}>
              ₦{stats.revenueToday.toLocaleString()}
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
              {(blitz.length + predictions.length + packs.filter((p) => p.status === "active").length).toString()}
            </p>
          </motion.div>
        </div>
      ) : null}

      {/* Game Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Pill Packs - Indigo (Desktop) */}
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
          <div className="flex items-center gap-2 mb-4">
            <Package size={14} style={{ color: "var(--accent-indigo)" }} />
            <h2 className="font-headline font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
              Pill Packs
            </h2>
          </div>
          {loading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => <div key={i} className="h-8 rounded animate-pulse" style={{ backgroundColor: "var(--bg-base)" }} />)}
            </div>
          ) : packs.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                No packs yet
              </p>
              <button
                onClick={() => setShowPillForm(true)}
                className="text-xs font-semibold mt-3 inline-block"
                style={{ color: "var(--accent-indigo)" }}
              >
                + create pack
              </button>
            </div>
          ) : (
            <div className="space-y-2 mb-4">
              {packs.map((pack) => (
                <div
                  key={pack.id}
                  className="flex items-center justify-between p-2 rounded-lg"
                  style={{ backgroundColor: "var(--bg-base)" }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex gap-0.5">
                      {pack.pills.slice(0, 3).map((p) => (
                        <span
                          key={p.id}
                          className="w-2 h-2 rounded-full"
                          style={{ background: p.color, opacity: p.status === "played" ? 0.3 : 1 }}
                        />
                      ))}
                    </div>
                    <p className="text-xs font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                      {pack.name}
                    </p>
                  </div>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ml-1 ${statusBadge(pack.status)}`}>
                    {pack.status}
                  </span>
                </div>
              ))}
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
          <div className="flex items-center gap-2 mb-4">
            <Clock size={14} style={{ color: "var(--accent-violet)" }} />
            <h2 className="font-headline font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
              Time Machine
            </h2>
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

        {/* Mobile: Pill Packs */}
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
          <Link
            href="/admin/pills"
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Package size={14} style={{ color: "var(--accent-indigo)" }} />
              <div>
                <h2 className="font-headline font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                  Pill Packs
                </h2>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                  {(() => {
                    const activePacks = packs.filter((p) => p.status === "active");
                    return activePacks.length > 0 ? `${activePacks.length} active` : "No active packs";
                  })()}
                </p>
              </div>
            </div>
            <ChevronRight size={16} style={{ color: "var(--text-muted)" }} />
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
                  {predictions.length > 0 ? `${predictions.length} active` : "No predictions yet"}
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
