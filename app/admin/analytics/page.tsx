"use client";

import { useEffect, useState, useCallback } from "react";
import { adminApi, ApiError } from "@/lib/api";
import {
  Loader2, TrendingUp, DollarSign, Users, Gamepad2,
  ArrowDownCircle, ArrowUpCircle, Clock, CheckCircle,
  XCircle, AlertCircle, Calendar, ChevronDown,
} from "lucide-react";

type FilterMode = "today" | "month";

interface Overview {
  money: { total_revenue: number; total_payouts: number; net_profit: number; pending_withdrawal_value: number };
  players: { total_registered: number; new_this_period: number; active_this_period: number };
  games: { pills_played: number; predictions_entered: number; blitz_registrations: number; total_plays: number };
  withdrawals: { total_requested: number; total_approved: number; total_pending: number; total_rejected: number };
}

function MetricRow({ icon, label, value, color = "text-white", highlight = false }: {
  icon: React.ReactNode; label: string; value: string; color?: string; highlight?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between px-4 py-3 rounded-xl ${highlight ? "bg-[#4C6FFF]/5 border border-[#4C6FFF]/20" : "bg-[#111] border border-[#1E1E1E]"}`}>
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg bg-[#1A1A1A] flex items-center justify-center flex-shrink-0 text-sm">
          {icon}
        </div>
        <span className="text-gray-400 text-sm">{label}</span>
      </div>
      <span className={`font-black text-base ${color}`}>{value}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] text-gray-600 uppercase tracking-widest font-bold px-1">{title}</p>
      {children}
    </div>
  );
}

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
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const monthOptions = getMonthOptions();

  const getPeriodParam = () => {
    if (filterMode === "today") return "today";
    return `month:${selectedMonth}`;
  };

  const getPeriodLabel = () => {
    if (filterMode === "today") {
      return new Date().toLocaleDateString("en-NG", {
        weekday: "long", month: "long", day: "numeric", year: "numeric",
      });
    }
    return monthOptions.find((o) => o.value === selectedMonth)?.label ?? selectedMonth;
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await adminApi.getAnalyticsOverview(getPeriodParam());
      setOverview(res as unknown as Overview);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError("Session expired. Log out and log back in.");
      } else {
        setError(err instanceof ApiError ? err.message : "Failed to load analytics");
      }
    } finally {
      setLoading(false);
    }
  }, [filterMode, selectedMonth]); // eslint-disable-line

  useEffect(() => { fetchData(); }, [fetchData]);

  const margin = overview && overview.money.total_revenue > 0
    ? Math.round((overview.money.net_profit / overview.money.total_revenue) * 100) : 0;
  const approvalRate = overview && overview.withdrawals.total_requested > 0
    ? Math.round((overview.withdrawals.total_approved / overview.withdrawals.total_requested) * 100) : 100;

  return (
    <div className="max-w-5xl space-y-6">

      {/* Header + filters */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Analytics</h1>
          <p className="text-gray-500 text-sm mt-0.5">{getPeriodLabel()}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Mode toggle: Today | Month */}
          <div className="flex bg-[#111] border border-[#1E1E1E] p-1 rounded-xl gap-1">
            <button
              onClick={() => setFilterMode("today")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterMode === "today"
                  ? "bg-[#4C6FFF] text-[#042C53]"
                  : "text-gray-400 hover:text-white"
              }`}
            >Today</button>
            <button
              onClick={() => setFilterMode("month")}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterMode === "month"
                  ? "bg-[#4C6FFF] text-[#042C53]"
                  : "text-gray-400 hover:text-white"
              }`}
            ><Calendar size={11} /> Month</button>
          </div>

          {filterMode === "month" && (
            <div className="relative">
              <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}
                className="appearance-none bg-[#111] border border-[#1E1E1E] rounded-xl pl-3 pr-8 py-2 text-white text-xs font-semibold outline-none focus:border-[#4C6FFF]/40 cursor-pointer">
                {monthOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-900/10 border border-red-800/30 rounded-xl p-3 text-red-400 text-sm flex gap-2">
          <AlertCircle size={14} className="flex-shrink-0 mt-0.5" /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin" style={{ color: "var(--accent-indigo)" }} /></div>
      ) : overview ? (
        /* Desktop: 2-col. Mobile: single col */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Left column */}
          <div className="space-y-6">
            <Section title="Money">
              <MetricRow icon={<DollarSign size={13} style={{ color: "var(--accent-amber)" }} />} label="Total Revenue"
                value={`₦${overview.money.total_revenue.toLocaleString()}`} color="text-[#E8A33D]" highlight />
              <MetricRow icon={<ArrowUpCircle size={13} className="text-orange-400" />} label="Total Payouts"
                value={`₦${overview.money.total_payouts.toLocaleString()}`} color="text-orange-400" />
              <MetricRow icon={<TrendingUp size={13} className="text-blue-400" />}
                label={`Net Profit (${margin}% margin)`}
                value={`₦${overview.money.net_profit.toLocaleString()}`}
                color={overview.money.net_profit >= 0 ? "text-blue-400" : "text-red-400"} />
              <MetricRow icon={<Clock size={13} className="text-yellow-400" />} label="Pending Payouts"
                value={`₦${overview.money.pending_withdrawal_value.toLocaleString()}`}
                color={overview.money.pending_withdrawal_value > 0 ? "text-yellow-400" : "text-gray-500"} />
            </Section>

            <Section title="Players">
              <MetricRow icon={<Users size={13} className="text-white" />} label="Total Registered"
                value={overview.players.total_registered.toLocaleString()} />
              <MetricRow icon={<ArrowDownCircle size={13} style={{ color: "var(--accent-indigo)" }} />} label="New This Period"
                value={overview.players.new_this_period.toLocaleString()} color="text-[#4C6FFF]" />
              <MetricRow icon={<Gamepad2 size={13} className="text-purple-400" />} label="Active Players"
                value={overview.players.active_this_period.toLocaleString()} color="text-purple-400" />
            </Section>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            <Section title="Game Activity">
              <MetricRow icon="💊" label="Pills Played"
                value={overview.games.pills_played.toLocaleString()} />
              <MetricRow icon={<Clock size={13} className="text-purple-400" />} label="Predictions Entered"
                value={overview.games.predictions_entered.toLocaleString()} color="text-purple-400" />
              <MetricRow icon="⚡" label="Blitz Registrations"
                value={overview.games.blitz_registrations.toLocaleString()} />
              <MetricRow icon={<TrendingUp size={13} style={{ color: "var(--accent-amber)" }} />} label="Total Plays"
                value={overview.games.total_plays.toLocaleString()} color="text-[#E8A33D]" highlight />
            </Section>

            <Section title="Withdrawals">
              <MetricRow icon={<ArrowUpCircle size={13} className="text-gray-400" />} label="Total Requested"
                value={overview.withdrawals.total_requested.toLocaleString()} />
              <MetricRow icon={<CheckCircle size={13} style={{ color: "var(--accent-indigo)" }} />}
                label={`Approved (${approvalRate}% rate)`}
                value={overview.withdrawals.total_approved.toLocaleString()} color="text-[#4C6FFF]" />
              <MetricRow icon={<Clock size={13} className="text-yellow-400" />}
                label={overview.withdrawals.total_pending > 0 ? "Pending ⚠️" : "Pending"}
                value={overview.withdrawals.total_pending.toLocaleString()}
                color={overview.withdrawals.total_pending > 0 ? "text-yellow-400" : "text-gray-500"} />
              <MetricRow icon={<XCircle size={13} className="text-red-400" />} label="Rejected"
                value={overview.withdrawals.total_rejected.toLocaleString()}
                color={overview.withdrawals.total_rejected > 0 ? "text-red-400" : "text-gray-500"} />
            </Section>
          </div>

        </div>
      ) : null}
    </div>
  );
}
