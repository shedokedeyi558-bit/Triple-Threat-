"use client";

import { mockAdminStats, mockRecentGames, mockRevenueData, mockDoorPopularity } from "@/lib/mockData";
import { TrendingUp, DollarSign, ArrowDownCircle, BarChart3 } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import { useAdmin } from "@/context/AdminContext";

const statCards = [
  { label: "Plays Today", value: mockAdminStats.playsToday.toLocaleString(), icon: BarChart3, color: "text-blue-400", bg: "bg-blue-900/20" },
  { label: "Revenue Today", value: `₦${mockAdminStats.revenueToday.toLocaleString()}`, icon: DollarSign, color: "text-neon", bg: "bg-neon/10" },
  { label: "Payouts Today", value: `₦${mockAdminStats.payoutsToday.toLocaleString()}`, icon: ArrowDownCircle, color: "text-orange-400", bg: "bg-orange-900/20" },
  { label: "Profit Today", value: `₦${mockAdminStats.profitToday.toLocaleString()}`, icon: TrendingUp, color: "text-gold", bg: "bg-yellow-900/20" },
];

function formatGameTime(iso: string) {
  const d = new Date(iso);
  const diff = Math.floor((Date.now() - d.getTime()) / 60000);
  if (diff < 1) return "Just now";
  if (diff < 60) return `${diff}m ago`;
  return `${Math.floor(diff / 60)}h ago`;
}

export default function AdminDashboard() {
  const { state } = useAdmin();
  const pending = state.withdrawals.filter((w) => w.status === "pending").length;

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

      {/* Stat cards */}
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

      {/* Pending withdrawals alert */}
      {pending > 0 && (
        <div className="bg-yellow-900/20 border border-yellow-700/40 rounded-2xl p-4 flex items-center justify-between">
          <span className="text-yellow-400 text-sm font-semibold">
            {pending} pending withdrawal{pending > 1 ? "s" : ""} need approval
          </span>
          <a href="/admin/withdrawals" className="text-xs text-yellow-300 underline">Review →</a>
        </div>
      )}

      {/* Revenue chart */}
      <div className="bg-card border border-[#2A2A2A] rounded-2xl p-4">
        <h3 className="font-bold text-white mb-4 text-sm">Revenue vs Payouts (today)</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={mockRevenueData} barGap={2}>
            <XAxis dataKey="hour" tick={{ fill: "#666", fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#666", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} />
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

      {/* Door popularity */}
      <div className="bg-card border border-[#2A2A2A] rounded-2xl p-4">
        <h3 className="font-bold text-white mb-4 text-sm">Door Popularity</h3>
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie data={mockDoorPopularity} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
              {mockDoorPopularity.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{ background: "#1A1A1A", border: "1px solid #2A2A2A", borderRadius: 12, fontSize: 12 }}
              formatter={(v: number) => [`${v}%`, ""]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Recent games */}
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
