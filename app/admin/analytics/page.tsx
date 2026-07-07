"use client";

import { useEffect, useState, useCallback } from "react";
import { adminApi, ApiError } from "@/lib/api";
import {
  Loader2, TrendingUp, DollarSign, Users, Gamepad2,
  ArrowDownCircle, ArrowUpCircle, Clock, CheckCircle,
  XCircle, AlertCircle, Calendar, ChevronDown,
} from "lucide-react";
import { motion } from "framer-motion";

type FilterMode = "day" | "month";

interface Overview {
  money: { total_revenue: number; total_payouts: number; net_profit: number; pending_withdrawal_value: number };
  players: { total_registered: number; new_this_period: number; active_this_period: number };
  games: { pills_played: number; predictions_entered: number; blitz_registrations: number; total_plays: number };
  withdrawals: { total_requested: number; total_approved: number; total_pending: number; total_rejected: number };
}

function StatCard({ icon, label, value, sub, color = "text-white", highlight = false }: {
  icon: React.ReactNode; label: string; value: string; sub?: string; color?: string; highlight?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl p-5 border ${highlight ? "bg-neon/5 border-neon/20" : "bg-[#111] border-[#1E1E1E]"}`}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-xl bg-[#1A1A1A] flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <p className="text-[11px] text-gray-500 uppercase tracking-widest font-bold">{label}</p>
      </div>
      <p className={`font-black text-2xl ${color}`}>{value}</p>
      {sub && <p className="text-gray-600 text-xs mt-1">{sub}</p>}
    </motion.div>
  );
}

// Generate last 12 months as options
function getMonthOptions() {
  const options = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-NG", { month: "long", year: "numeric" });
    options.push({ value, label });
  }
  return options;
}

export default function AnalyticsPage() {
  const [filterMode, setFilterMode] = useState<FilterMode>("month");
  const [selectedDay, setSelectedDay] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const monthOptions = getMonthOptions();

  // Build period string for API
  const getPeriodParam = () => {
    if (filterMode === "day") {
      const today = new Date().toISOString().slice(0, 10);
      if (selectedDay === today) return "today";
      return `day:${selectedDay}`;
    }
    return `month:${selectedMonth}`;
  };

  const getPeriodLabel = () => {
    if (filterMode === "day") {
      return new Date(selectedDay + "T00:00:00").toLocaleDateString("en-NG", {
        weekday: "long", month: "long", day: "numeric", year: "numeric",
      });
    }
    const opt = monthOptions.find((o) => o.value === selectedMonth);
    return opt?.label ?? selectedMonth;
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const period = getPeriodParam();
      const res = await adminApi.getAnalyticsOverview(period as any);
      setOverview(res as unknown as Overview);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, [filterMode, selectedDay, selectedMonth]); // eslint-disable-line

  useEffect(() => { fetchData(); }, [fetchData]);

  const margin = overview && overview.money.total_revenue > 0
    ? Math.round((overview.money.net_profit / overview.money.total_revenue) * 100) : 0;
  const withdrawalApprovalRate = overview && overview.withdrawals.total_requested > 0
    ? Math.round((overview.withdrawals.total_approved / overview.withdrawals.total_requested) * 100) : 100;

  return (
    <div className="space-y-8 max-w-6xl">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white">Analytics</h1>
        <p className="text-gray-500 text-sm mt-0.5">{getPeriodLabel()}</p>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Mode toggle */}
        <div className="flex bg-[#111] border border-[#1E1E1E] p-1 rounded-xl gap-1">
          <button
            onClick={() => { setFilterMode("day"); setSelectedDay(new Date().toISOString().slice(0, 10)); }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              filterMode === "day" && selectedDay === new Date().toISOString().slice(0, 10) ? "bg-neon text-black" : "text-gray-400 hover:text-white"
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setFilterMode("month")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              filterMode === "month" ? "bg-neon text-black" : "text-gray-400 hover:text-white"
            }`}
          >
            <Calendar size={12} /> Month
          </button>
          <button
            onClick={() => setFilterMode("day")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              filterMode === "day" && selectedDay !== new Date().toISOString().slice(0, 10) ? "bg-neon text-black" : "text-gray-400 hover:text-white"
            }`}
          >
            <Calendar size={12} /> Pick Day
          </button>
        </div>

        {/* Month selector */}
        {filterMode === "month" && (
          <div className="relative">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="appearance-none bg-[#111] border border-[#1E1E1E] rounded-xl pl-4 pr-10 py-2.5 text-white text-sm font-semibold outline-none focus:border-neon/40 cursor-pointer"
            >
              {monthOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          </div>
        )}

        {/* Day picker */}
        {filterMode === "day" && (
          <input
            type="date"
            value={selectedDay}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setSelectedDay(e.target.value)}
            className="bg-[#111] border border-[#1E1E1E] rounded-xl px-4 py-2.5 text-white text-sm font-semibold outline-none focus:border-neon/40 cursor-pointer"
          />
        )}
      </div>

      {error && (
        <div className="bg-red-900/10 border border-red-800/30 rounded-xl p-3 text-red-400 text-sm flex gap-2">
          <AlertCircle size={15} className="flex-shrink-0 mt-0.5" /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={28} className="text-neon animate-spin" />
        </div>
      ) : overview ? (
        <div className="space-y-8">

          {/* ── MONEY ── */}
          <section>
            <p className="text-[11px] text-gray-600 uppercase tracking-widest font-bold mb-4">Money</p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={<DollarSign size={15} className="text-neon" />} label="Total Revenue"
                value={`₦${overview.money.total_revenue.toLocaleString()}`} sub="Entry fees collected" color="text-neon" highlight />
              <StatCard icon={<ArrowUpCircle size={15} className="text-orange-400" />} label="Total Payouts"
                value={`₦${overview.money.total_payouts.toLocaleString()}`} sub="Paid to winners" color="text-orange-400" />
              <StatCard icon={<TrendingUp size={15} className="text-blue-400" />} label="Net Profit"
                value={`₦${overview.money.net_profit.toLocaleString()}`} sub={`${margin}% margin`}
                color={overview.money.net_profit >= 0 ? "text-blue-400" : "text-red-400"} />
              <StatCard icon={<Clock size={15} className="text-yellow-400" />} label="Pending Payouts"
                value={`₦${overview.money.pending_withdrawal_value.toLocaleString()}`} sub="Owed to players"
                color={overview.money.pending_withdrawal_value > 0 ? "text-yellow-400" : "text-gray-500"} />
            </div>
          </section>

          {/* ── PLAYERS ── */}
          <section>
            <p className="text-[11px] text-gray-600 uppercase tracking-widest font-bold mb-4">Players</p>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <StatCard icon={<Users size={15} className="text-white" />} label="Total Registered"
                value={overview.players.total_registered.toLocaleString()} sub="All time" color="text-white" />
              <StatCard icon={<ArrowDownCircle size={15} className="text-neon" />} label="New Players"
                value={overview.players.new_this_period.toLocaleString()} sub="Joined this period" color="text-neon" />
              <StatCard icon={<Gamepad2 size={15} className="text-purple-400" />} label="Active Players"
                value={overview.players.active_this_period.toLocaleString()} sub="Played this period" color="text-purple-400" />
            </div>
          </section>

          {/* ── GAMES ── */}
          <section>
            <p className="text-[11px] text-gray-600 uppercase tracking-widest font-bold mb-4">Game Activity</p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={<span className="text-base">💊</span>} label="Pills Played"
                value={overview.games.pills_played.toLocaleString()} sub="Pills opened" color="text-white" />
              <StatCard icon={<Clock size={15} className="text-purple-400" />} label="Predictions Entered"
                value={overview.games.predictions_entered.toLocaleString()} sub="Time Machine entries" color="text-purple-400" />
              <StatCard icon={<span className="text-base">⚡</span>} label="Blitz Registrations"
                value={overview.games.blitz_registrations.toLocaleString()} sub="Tournament sign-ups" color="text-white" />
              <StatCard icon={<TrendingUp size={15} className="text-neon" />} label="Total Plays"
                value={overview.games.total_plays.toLocaleString()} sub="All game types" color="text-neon" highlight />
            </div>
          </section>

          {/* ── WITHDRAWALS ── */}
          <section>
            <p className="text-[11px] text-gray-600 uppercase tracking-widest font-bold mb-4">Withdrawals</p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={<ArrowUpCircle size={15} className="text-gray-400" />} label="Total Requested"
                value={overview.withdrawals.total_requested.toLocaleString()} sub="All requests" color="text-white" />
              <StatCard icon={<CheckCircle size={15} className="text-neon" />} label="Approved"
                value={overview.withdrawals.total_approved.toLocaleString()}
                sub={`${withdrawalApprovalRate}% approval rate`} color="text-neon" />
              <StatCard icon={<Clock size={15} className="text-yellow-400" />} label="Pending"
                value={overview.withdrawals.total_pending.toLocaleString()}
                sub={overview.withdrawals.total_pending > 0 ? "Needs attention" : "All clear"}
                color={overview.withdrawals.total_pending > 0 ? "text-yellow-400" : "text-gray-500"} />
              <StatCard icon={<XCircle size={15} className="text-red-400" />} label="Rejected"
                value={overview.withdrawals.total_rejected.toLocaleString()} sub="Declined"
                color={overview.withdrawals.total_rejected > 0 ? "text-red-400" : "text-gray-500"} />
            </div>
          </section>

        </div>
      ) : null}
    </div>
  );
}
