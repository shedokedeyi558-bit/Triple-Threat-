"use client";

import { useEffect, useState, useCallback } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { adminApi, type RevenuePoint, type DoorStat, ApiError } from "@/lib/api";
import { Download, Loader2 } from "lucide-react";

type Range = "today" | "week" | "month";

const DOOR_COLORS = ["#00FF66", "#FFD700", "#FF4444"];
const PRIZE_COLORS = ["#00FF66", "#FFD700", "#FF4444"];

function StatCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="bg-card border border-[#2A2A2A] rounded-2xl p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-xl font-black ${color}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-1">{sub}</p>
    </div>
  );
}

export default function AnalyticsPage() {
  const [range, setRange] = useState<Range>("today");
  const [revenue, setRevenue] = useState<RevenuePoint[]>([]);
  const [doorStats, setDoorStats] = useState<DoorStat[]>([]);
  const [activity, setActivity] = useState<{ hour: string; plays: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const rangeToParams: Record<Range, { period: "hourly" | "daily"; days: number }> = {
    today: { period: "hourly", days: 1 },
    week: { period: "daily", days: 7 },
    month: { period: "daily", days: 30 },
  };

  const fetchData = useCallback(async (r: Range) => {
    setLoading(true);
    setError("");
    const { period, days } = rangeToParams[r];
    try {
      const [revRes, doorRes, actRes] = await Promise.all([
        adminApi.getRevenueAnalytics(period, days),
        adminApi.getDoorAnalytics(),
        adminApi.getActivityAnalytics(),
      ]);
      setRevenue(revRes.revenue);
      setDoorStats(doorRes.doors);
      setActivity(actRes.activity);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchData(range); }, [range, fetchData]);

  // Computed summary from revenue data
  const totalRevenue = revenue.reduce((s, r) => s + r.revenue, 0);
  const totalPayouts = revenue.reduce((s, r) => s + r.payouts, 0);
  const netProfit = totalRevenue - totalPayouts;
  const totalPlays = revenue.reduce((s, r) => s + r.plays, 0);

  // Win rate per door from doorStats
  const doorWinRate = doorStats.map((d, i) => ({
    door: `Door ${d.doorId}`,
    winRate: d.plays > 0 ? Math.round((d.wins / d.plays) * 100) : 0,
    color: DOOR_COLORS[i] ?? "#888",
  }));

  // Prize distribution — use door revenue as proxy
  const prizeDistrib = doorStats.map((d, i) => ({
    name: `Door ${d.doorId}`,
    value: d.plays,
    color: PRIZE_COLORS[i] ?? "#888",
  }));

  // Heatmap — fill 24 slots
  const heatmap = Array.from({ length: 24 }, (_, i) => {
    const hourStr = `${String(i).padStart(2, "0")}:00`;
    const match = activity.find((a) => a.hour.slice(11, 16) === hourStr);
    return { hour: i, plays: match?.plays ?? 0 };
  });
  const maxPlays = Math.max(...heatmap.map((h) => h.plays), 1);

  const xAxisKey = range === "today" ? "period" : "period";
  const xFormatter = (v: string) =>
    range === "today" ? v.slice(11, 16) : v.slice(5);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-white">Analytics</h1>
          <p className="text-gray-400 text-sm mt-0.5">Revenue &amp; performance data</p>
        </div>
        <a
          href={adminApi.getExportUrl("sessions", range === "today" ? 1 : range === "week" ? 7 : 30)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#2A2A2A] text-gray-400 text-sm hover:text-white hover:border-gray-400 transition-colors"
        >
          <Download size={15} />
          Export CSV
        </a>
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

      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 size={28} className="text-neon animate-spin" />
        </div>
      )}

      {error && !loading && (
        <div className="text-center py-8 text-red-400 text-sm">{error}</div>
      )}

      {!loading && !error && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Total Revenue" value={`₦${totalRevenue.toLocaleString()}`} sub={`${totalPlays} plays`} color="text-neon" />
            <StatCard label="Total Payouts" value={`₦${totalPayouts.toLocaleString()}`} sub={`${totalRevenue > 0 ? Math.round((totalPayouts / totalRevenue) * 100) : 0}% payout rate`} color="text-orange-400" />
            <StatCard label="Net Profit" value={`₦${netProfit.toLocaleString()}`} sub={`${totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0}% margin`} color="text-gold" />
            <StatCard
              label="Overall Win Rate"
              value={`${doorStats.reduce((s, d) => s + d.plays, 0) > 0 ? Math.round((doorStats.reduce((s, d) => s + d.wins, 0) / doorStats.reduce((s, d) => s + d.plays, 0)) * 100) : 0}%`}
              sub="across all doors"
              color="text-blue-400"
            />
          </div>

          {/* Revenue over time */}
          {revenue.length > 0 && (
            <div className="bg-card border border-[#2A2A2A] rounded-2xl p-4">
              <h3 className="text-sm font-bold text-white mb-4">Revenue over time</h3>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={revenue}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00FF66" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00FF66" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey={xAxisKey} tick={{ fill: "#666", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={xFormatter} />
                  <YAxis tick={{ fill: "#666", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ background: "#1A1A1A", border: "1px solid #2A2A2A", borderRadius: 12, fontSize: 12 }}
                    formatter={(v: number) => [`₦${v.toLocaleString()}`, ""]}
                    labelFormatter={xFormatter}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#00FF66" strokeWidth={2} fill="url(#revGrad)" name="Revenue" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Win rate per door */}
          {doorWinRate.length > 0 && (
            <div className="bg-card border border-[#2A2A2A] rounded-2xl p-4">
              <h3 className="text-sm font-bold text-white mb-4">Win rate per door</h3>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={doorWinRate}>
                  <XAxis dataKey="door" tick={{ fill: "#666", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#666", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                  <Tooltip
                    contentStyle={{ background: "#1A1A1A", border: "1px solid #2A2A2A", borderRadius: 12, fontSize: 12 }}
                    formatter={(v: number) => [`${v}%`, "Win Rate"]}
                  />
                  <Bar dataKey="winRate" radius={[6, 6, 0, 0]}>
                    {doorWinRate.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Prize distribution */}
          {prizeDistrib.some((p) => p.value > 0) && (
            <div className="bg-card border border-[#2A2A2A] rounded-2xl p-4">
              <h3 className="text-sm font-bold text-white mb-4">Plays by door</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={prizeDistrib} cx="50%" cy="50%" outerRadius={70} paddingAngle={3} dataKey="value">
                    {prizeDistrib.map((entry, i) => <Cell key={i} fill={entry.color} />)}
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

          {/* Peak hours heatmap */}
          <div className="bg-card border border-[#2A2A2A] rounded-2xl p-4">
            <h3 className="text-sm font-bold text-white mb-4">Peak playing hours (last 24h)</h3>
            <div className="grid grid-cols-12 gap-1">
              {heatmap.map(({ hour, plays }) => (
                <div key={hour} className="flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-sm"
                    style={{
                      background: `rgba(0,255,102,${(plays / maxPlays).toFixed(2)})`,
                      minHeight: 20,
                      aspectRatio: "1",
                    }}
                    title={`${hour}:00 — ${plays} plays`}
                  />
                  {hour % 6 === 0 && <span className="text-[9px] text-gray-600">{hour}h</span>}
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">Darker = more plays</p>
          </div>
        </>
      )}
    </div>
  );
}
