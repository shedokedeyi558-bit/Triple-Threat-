"use client";

import { useEffect, useState } from "react";
import { adminApi, type AdminStats, type RevenuePoint, type DoorStat, ApiError } from "@/lib/api";
import { mockRecentGames } from "@/lib/mockData";
import { TrendingUp, DollarSign, ArrowDownCircle, BarChart3, Loader2 } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { useAdmin } from "@/context/AdminContext";

function formatGameTime(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diff < 1) return "Just now";
  if (diff < 60) return `${diff}m ago`;
  return `${Math.floor(diff / 60)}h ago`;
}

const PIE_COLORS = ["#00FF66", "#FFD700", "#FF4444"];

export default function AdminDashboard() {
  const { state } = useAdmin();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [revenue, setRevenue] = useState<RevenuePoint[]>([]);
  const [doorStats, setDoorStats] = useState<DoorStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      adminApi.getStats(),
      adminApi.getRevenueAnalytics("hourly", 1),
      adminApi.getDoorAnalytics(),
    ])
      .then(([s, r, d]) => {
        setStats(s);
        setRevenue(r.revenue.slice(-8)); // last 8 periods
        setDoorStats(d.doors);
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : "Failed to load dashboard data");
      })
      .finally(() => setLoading(false));
  }, []);

  const statCards = stats
    ? [
        { label: "Plays Today", value: stats.playsToday.toLocaleString(), icon: BarChart3, color: "text-blue-400", bg: "bg-blue-900/20" },
        { label: "Revenue Today", value: `₦${stats.revenueToday.toLocaleString()}`, icon: DollarSign, color: "text-neon", bg: "bg-neon/10" },
        { label: "Payouts Today", value: `₦${stats.payoutsToday.toLocaleString()}`, icon: ArrowDownCircle, color: "text-orange-400", bg: "bg-orange-900/20" },
        { label: "Profit Today", value: `₦${stats.profitToday.toLocaleString()}`, icon: TrendingUp, color: "text-gold", bg: "bg-yellow-900/20" },
      ]
    : [];

  // Pie chart data from door stats
  const pieData = doorStats.map((d, i) => ({
    name: `Door ${d.doorId}`,
    value: d.plays,
    color: PIE_COLORS[i] ?? "#888",
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Dashboard</h1>
        <p className="text-gray-400 text-sm mt-0.5">Welcome back, Admin</p>
      </div>

      {/* Kill switch warning */}
      {state.settings.gameKillSwitch && (
        <div className="bg-red-900/30 border border-red-700 rounded-2xl p-4 text-red-400 font-semibold text-sm">
          ⚠️ GAME KILL SWITCH IS ON — All games are paused
        </div>
      )}

      {error && (
        <div className="bg-red-900/20 border border-red-800/40 rounded-xl p-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Stat cards */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-card border border-[#2A2A2A] rounded-2xl p-4 flex items-center justify-center h-24">
              <Loader2 size={20} className="text-neon animate-spin" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {statCards.map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-card border border-[#2A2A2A] rounded-2xl p-4">
              <div className={`inline-flex p-2 rounded-xl ${bg} mb-3`}>
                <Icon size={18} className={color} />
              </div>
              <div className={`text-xl font-black ${color}`}>{value}</div>
              <div className="text-gray-500 text-xs mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Pending withdrawals alert */}
      {stats && stats.pendingWithdrawals > 0 && (
        <div className="bg-yellow-900/20 border border-yellow-700/40 rounded-2xl p-4 flex items-center justify-between">
          <span className="text-yellow-400 text-sm font-semibold">
            {stats.pendingWithdrawals} pending withdrawal{stats.pendingWithdrawals > 1 ? "s" : ""} need approval
          </span>
          <a href="/admin/withdrawals" className="text-xs text-yellow-300 underline">Review →</a>
        </div>
      )}

      {/* Revenue chart */}
      {!loading && revenue.length > 0 && (
        <div className="bg-card border border-[#2A2A2A] rounded-2xl p-4">
          <h3 className="font-bold text-white mb-4 text-sm">Revenue vs Payouts</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={revenue} barGap={2}>
              <XAxis
                dataKey="period"
                tick={{ fill: "#666", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => v.slice(11, 16) || v.slice(5, 10)}
              />
              <YAxis
                tick={{ fill: "#666", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{ background: "#1A1A1A", border: "1px solid #2A2A2A", borderRadius: 12, fontSize: 12 }}
                labelStyle={{ color: "#fff" }}
                formatter={(v: number) => [`₦${v.toLocaleString()}`, ""]}
              />
              <Bar dataKey="revenue" fill="#00FF66" radius={[4, 4, 0, 0]} name="Revenue" />
              <Bar dataKey="payouts" fill="#FFD700" radius={[4, 4, 0, 0]} name="Payouts" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Door popularity */}
      {!loading && pieData.length > 0 && (
        <div className="bg-card border border-[#2A2A2A] rounded-2xl p-4">
          <h3 className="font-bold text-white mb-4 text-sm">Door Popularity</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{ background: "#1A1A1A", border: "1px solid #2A2A2A", borderRadius: 12, fontSize: 12 }}
                formatter={(v: number) => [`${v} plays`, ""]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent games — uses mock for now, backend /game/recent-winners returns winners only */}
      <div className="bg-card border border-[#2A2A2A] rounded-2xl p-4">
        <h3 className="font-bold text-white mb-4 text-sm">Recent Games</h3>
        <div className="space-y-2">
          {mockRecentGames.map((game) => (
            <div key={game.id} className="flex items-center justify-between py-2 border-b border-[#2A2A2A] last:border-0">
              <div className="flex items-center gap-2">
                <span className="text-lg">{game.status === "won" ? "✅" : "❌"}</span>
                <div>
                  <p className="text-sm text-white font-medium">
                    {state.players.find((p) => p.id === game.playerId)?.phone.replace(/(\d{4})(\d{3})(\d{4})/, "$1***$3") ?? "Unknown"}
                  </p>
                  <p className="text-xs text-gray-500">Door {game.doorId} · {formatGameTime(game.playedAt)}</p>
                </div>
              </div>
              <span className={`text-sm font-bold ${game.status === "won" ? "text-neon" : "text-red-400"}`}>
                {game.status === "won" ? `+₦${game.prize.toLocaleString()}` : "Lost"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
