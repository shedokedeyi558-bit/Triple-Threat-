"use client";

import { useEffect, useState, useCallback } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, BarChart, Bar, CartesianGrid,
} from "recharts";
import { adminApi, type AdminStats, ApiError } from "@/lib/api";
import { Loader2, TrendingUp, DollarSign, Gamepad2, Users } from "lucide-react";

type Range = "today" | "week" | "month";

function StatCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="bg-[#141414] border border-[#1E1E1E] rounded-2xl p-4">
      <p className="text-[11px] text-gray-500 mb-1 uppercase tracking-wider">{label}</p>
      <p className={`text-xl font-black ${color}`}>{value}</p>
      <p className="text-[11px] text-gray-600 mt-1">{sub}</p>
    </div>
  );
}

export default function AnalyticsPage() {
  const [range, setRange] = useState<Range>("week");
  const [revenue, setRevenue] = useState<{ period: string; revenue: number; payouts: number; profit: number; plays: number }[]>([]);
  const [activity, setActivity] = useState<{ hour: string; plays: number }[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const rangeParams: Record<Range, { period: "hourly" | "daily"; days: number }> = {
    today: { period: "hourly", days: 1 },
    week: { period: "daily", days: 7 },
    month: { period: "daily", days: 30 },
  };

  const fetchData = useCallback(async (r: Range) => {
    setLoading(true);
    setError("");
    const { period, days } = rangeParams[r];
    try {
      const [revRes, actRes, statsRes] = await Promise.all([
        adminApi.getRevenueAnalytics(period, days),
        adminApi.getActivityAnalytics(),
        adminApi.getStats(),
      ]);
      setRevenue(revRes.revenue ?? []);
      setActivity(actRes.activity ?? []);
      setStats(statsRes);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchData(range); }, [range, fetchData]);

  const totalRevenue = revenue.reduce((s, r) => s + r.revenue, 0);
  const totalPayouts = revenue.reduce((s, r) => s + r.payouts, 0);
  const netProfit = totalRevenue - totalPayouts;
  const totalPlays = revenue.reduce((s, r) => s + r.plays, 0);
  const margin = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0;

  const xFormatter = (v: string) =>
    range === "today" ? v.slice(11, 16) : v.slice(5);

  // Build 24-slot activity heatmap
  const heatmap = Array.from({ length: 24 }, (_, i) => {
    const match = activity.find((a) => {
      const h = new Date(a.hour).getHours();
      return h === i;
    });
    return { hour: i, plays: match?.plays ?? 0 };
  });
  const maxPlays = Math.max(...heatmap.map((h) => h.plays), 1);

  const inputCls = "w-full bg-[#0A0A0A] border border-[#1E1E1E] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-neon/60";

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-white">Analytics</h1>
          <p className="text-gray-500 text-sm mt-0.5">Revenue and performance</p>
        </div>
        <div className="flex bg-[#141414] border border-[#1E1E1E] p-1 rounded-xl gap-1">
          {(["today", "week", "month"] as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                range === r ? "bg-neon text-black" : "text-gray-400 hover:text-white"
              }`}
            >
              {r === "today" ? "Today" : r === "week" ? "7 Days" : "30 Days"}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="text-red-400 text-sm bg-red-900/10 border border-red-900/30 rounded-xl p-3">{error}</div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={28} className="text-neon animate-spin" />
        </div>
      ) : (
        <>
          {/* Summary cards — pulled from live stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              label="Revenue"
              value={`₦${totalRevenue.toLocaleString()}`}
              sub={`${totalPlays} plays`}
              color="text-neon"
            />
            <StatCard
              label="Payouts"
              value={`₦${totalPayouts.toLocaleString()}`}
              sub={`${totalRevenue > 0 ? Math.round((totalPayouts / totalRevenue) * 100) : 0}% of revenue`}
              color="text-orange-400"
            />
            <StatCard
              label="Net Profit"
              value={`₦${netProfit.toLocaleString()}`}
              sub={`${margin}% margin`}
              color="text-yellow-400"
            />
            <StatCard
              label="Total Players"
              value={stats?.totalPlayers.toLocaleString() ?? "—"}
              sub="Registered accounts"
              color="text-blue-400"
            />
          </div>

          {/* Revenue chart */}
          {revenue.length > 0 ? (
            <div className="bg-[#141414] border border-[#1E1E1E] rounded-2xl p-5">
              <h3 className="text-sm font-bold text-white mb-5">Revenue vs Payouts</h3>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={revenue} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00FF66" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#00FF66" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="payGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF8800" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#FF8800" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E1E1E" />
                  <XAxis dataKey="period" tick={{ fill: "#555", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={xFormatter} />
                  <YAxis tick={{ fill: "#555", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ background: "#141414", border: "1px solid #1E1E1E", borderRadius: 10, fontSize: 12 }}
                    formatter={(v: number) => [`₦${v.toLocaleString()}`, ""]}
                    labelFormatter={xFormatter}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#00FF66" strokeWidth={2} fill="url(#revGrad)" name="Revenue" />
                  <Area type="monotone" dataKey="payouts" stroke="#FF8800" strokeWidth={2} fill="url(#payGrad)" name="Payouts" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="bg-[#141414] border border-[#1E1E1E] rounded-2xl p-8 text-center">
              <TrendingUp size={32} className="text-gray-700 mx-auto mb-2" />
              <p className="text-gray-600 text-sm">No revenue data for this period yet</p>
            </div>
          )}

          {/* Plays per period */}
          {revenue.length > 0 && (
            <div className="bg-[#141414] border border-[#1E1E1E] rounded-2xl p-5">
              <h3 className="text-sm font-bold text-white mb-5">Plays per period</h3>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={revenue} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E1E1E" />
                  <XAxis dataKey="period" tick={{ fill: "#555", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={xFormatter} />
                  <YAxis tick={{ fill: "#555", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: "#141414", border: "1px solid #1E1E1E", borderRadius: 10, fontSize: 12 }}
                  />
                  <Bar dataKey="plays" fill="#00FF66" radius={[4, 4, 0, 0]} name="Plays" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Peak hours heatmap */}
          <div className="bg-[#141414] border border-[#1E1E1E] rounded-2xl p-5">
            <h3 className="text-sm font-bold text-white mb-4">Peak hours (24h activity)</h3>
            <div className="flex gap-1">
              {heatmap.map(({ hour, plays }) => (
                <div key={hour} className="flex-1 flex flex-col items-center gap-1.5">
                  <div
                    className="w-full rounded-sm"
                    style={{
                      background: `rgba(0,255,102,${Math.max(0.05, plays / maxPlays).toFixed(2)})`,
                      height: 32,
                    }}
                    title={`${hour}:00 — ${plays} plays`}
                  />
                  {hour % 6 === 0 && (
                    <span className="text-[9px] text-gray-600">{hour}h</span>
                  )}
                </div>
              ))}
            </div>
            <p className="text-[11px] text-gray-600 mt-3">Brighter = more activity</p>
          </div>
        </>
      )}
    </div>
  );
}
