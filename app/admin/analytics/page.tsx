"use client";

import { useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { mockRevenueData, mockHourlyActivity } from "@/lib/mockData";
import { Download } from "lucide-react";

type Range = "today" | "week" | "month";

const summaryCards = [
  { label: "Total Revenue", value: "₦68,400", sub: "+12% vs yesterday", color: "text-neon" },
  { label: "Total Payouts", value: "₦32,500", sub: "47.5% payout rate", color: "text-orange-400" },
  { label: "Net Profit", value: "₦35,900", sub: "52.5% margin", color: "text-gold" },
  { label: "Avg Win Rate", value: "48%", sub: "Door 1: 62%, D3: 30%", color: "text-blue-400" },
];

const weeklyData = [
  { day: "Mon", revenue: 42000, payouts: 19000 },
  { day: "Tue", revenue: 58000, payouts: 27000 },
  { day: "Wed", revenue: 71000, payouts: 33000 },
  { day: "Thu", revenue: 65000, payouts: 29000 },
  { day: "Fri", revenue: 89000, payouts: 42000 },
  { day: "Sat", revenue: 102000, payouts: 49000 },
  { day: "Sun", revenue: 68400, payouts: 32500 },
];

const prizeDistrib = [
  { name: "₦500", value: 58, color: "#00FF66" },
  { name: "₦2,000", value: 30, color: "#FFD700" },
  { name: "₦5,000", value: 12, color: "#FF4444" },
];

export default function AnalyticsPage() {
  const [range, setRange] = useState<Range>("today");
  const chartData = range === "today" ? mockRevenueData : weeklyData;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-white">Analytics</h1>
          <p className="text-gray-400 text-sm mt-0.5">Revenue & performance data</p>
        </div>
        <button
          onClick={() => alert("CSV export coming soon")}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#2A2A2A] text-gray-400 text-sm hover:text-white hover:border-gray-400 transition-colors"
        >
          <Download size={15} />
          Export CSV
        </button>
      </div>

      {/* Date range */}
      <div className="flex bg-card border border-[#2A2A2A] p-1 rounded-xl gap-1">
        {(["today", "week", "month"] as Range[]).map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold capitalize transition-all ${
              range === r ? "bg-neon text-black" : "text-gray-400"
            }`}
          >
            {r === "today" ? "Today" : r === "week" ? "This Week" : "This Month"}
          </button>
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        {summaryCards.map(({ label, value, sub, color }) => (
          <div key={label} className="bg-card border border-[#2A2A2A] rounded-2xl p-4">
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <p className={`text-xl font-black ${color}`}>{value}</p>
            <p className="text-xs text-gray-500 mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* Revenue over time */}
      <div className="bg-card border border-[#2A2A2A] rounded-2xl p-4">
        <h3 className="text-sm font-bold text-white mb-4">Revenue over time</h3>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00FF66" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#00FF66" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey={range === "today" ? "hour" : "day"} tick={{ fill: "#666", fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#666", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={{ background: "#1A1A1A", border: "1px solid #2A2A2A", borderRadius: 12, fontSize: 12 }}
              formatter={(v: number) => [`₦${v.toLocaleString()}`, ""]}
            />
            <Area type="monotone" dataKey="revenue" stroke="#00FF66" strokeWidth={2} fill="url(#revGrad)" name="Revenue" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Win rate per door */}
      <div className="bg-card border border-[#2A2A2A] rounded-2xl p-4">
        <h3 className="text-sm font-bold text-white mb-4">Win rate per door</h3>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={[
            { door: "Door 1", winRate: 62 },
            { door: "Door 2", winRate: 48 },
            { door: "Door 3", winRate: 30 },
          ]}>
            <XAxis dataKey="door" tick={{ fill: "#666", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#666", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
            <Tooltip
              contentStyle={{ background: "#1A1A1A", border: "1px solid #2A2A2A", borderRadius: 12, fontSize: 12 }}
              formatter={(v: number) => [`${v}%`, "Win Rate"]}
            />
            <Bar dataKey="winRate" radius={[6, 6, 0, 0]}>
              <Cell fill="#00FF66" />
              <Cell fill="#FFD700" />
              <Cell fill="#FF4444" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Prize distribution */}
      <div className="bg-card border border-[#2A2A2A] rounded-2xl p-4">
        <h3 className="text-sm font-bold text-white mb-4">Prize distribution</h3>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={prizeDistrib} cx="50%" cy="50%" outerRadius={70} paddingAngle={3} dataKey="value">
              {prizeDistrib.map((entry, i) => <Cell key={i} fill={entry.color} />)}
            </Pie>
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{ background: "#1A1A1A", border: "1px solid #2A2A2A", borderRadius: 12, fontSize: 12 }}
              formatter={(v: number) => [`${v}% of wins`, ""]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Peak hours heatmap */}
      <div className="bg-card border border-[#2A2A2A] rounded-2xl p-4">
        <h3 className="text-sm font-bold text-white mb-4">Peak playing hours (24h)</h3>
        <div className="grid grid-cols-12 gap-1">
          {mockHourlyActivity.map(({ hour, plays }) => {
            const intensity = plays / 30;
            return (
              <div key={hour} className="flex flex-col items-center gap-1">
                <div
                  className="w-full aspect-square rounded-sm transition-all"
                  style={{ background: `rgba(0, 255, 102, ${intensity.toFixed(2)})`, minHeight: 20 }}
                  title={`${hour}:00 — ${plays} plays`}
                />
                {hour % 6 === 0 && (
                  <span className="text-[9px] text-gray-600">{hour}h</span>
                )}
              </div>
            );
          })}
        </div>
        <p className="text-xs text-gray-500 mt-2">Darker = more plays</p>
      </div>
    </div>
  );
}
