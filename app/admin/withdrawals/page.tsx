"use client";

import { useState } from "react";
import { useAdmin } from "@/context/AdminContext";
import { CheckCircle, XCircle } from "lucide-react";
import type { WithdrawalStatus } from "@/lib/types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-NG", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default function WithdrawalsPage() {
  const { state, dispatch } = useAdmin();
  const [tab, setTab] = useState<WithdrawalStatus>("pending");
  const [selected, setSelected] = useState<string[]>([]);

  const filtered = state.withdrawals.filter((w) => w.status === tab);

  const toggleSelect = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleBulkApprove = () => {
    selected.forEach((id) => dispatch({ type: "APPROVE_WITHDRAWAL", id }));
    setSelected([]);
  };

  const counts: Record<WithdrawalStatus, number> = {
    pending: state.withdrawals.filter((w) => w.status === "pending").length,
    approved: state.withdrawals.filter((w) => w.status === "approved").length,
    rejected: state.withdrawals.filter((w) => w.status === "rejected").length,
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black text-white">Withdrawal Requests</h1>
        <p className="text-gray-400 text-sm mt-0.5">Approve or reject player withdrawals</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-card border border-[#2A2A2A] p-1 rounded-xl">
        {(["pending", "approved", "rejected"] as WithdrawalStatus[]).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setSelected([]); }}
            className={`flex-1 py-2.5 rounded-lg text-xs font-semibold capitalize transition-all flex items-center justify-center gap-1.5 ${
              tab === t ? "bg-neon text-black" : "text-gray-400"
            }`}
          >
            {t}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === t ? "bg-black/20" : "bg-[#2A2A2A]"}`}>
              {counts[t]}
            </span>
          </button>
        ))}
      </div>

      {/* Bulk actions */}
      {tab === "pending" && selected.length > 0 && (
        <div className="bg-card border border-neon/20 rounded-xl px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-gray-300">{selected.length} selected</span>
          <button
            onClick={handleBulkApprove}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neon/10 text-neon text-xs font-semibold hover:bg-neon/20 transition-colors"
          >
            <CheckCircle size={13} /> Approve Selected
          </button>
        </div>
      )}

      {/* List */}
      <div className="space-y-2">
        {filtered.map((w) => (
          <div
            key={w.id}
            className={`bg-card border rounded-xl p-4 transition-colors ${
              selected.includes(w.id) ? "border-neon" : "border-[#2A2A2A]"
            }`}
          >
            <div className="flex items-start gap-3">
              {tab === "pending" && (
                <input
                  type="checkbox"
                  checked={selected.includes(w.id)}
                  onChange={() => toggleSelect(w.id)}
                  className="mt-1 accent-neon w-4 h-4 flex-shrink-0"
                />
              )}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-white font-semibold">
                    {w.playerPhone.replace(/(\d{4})(\d{3})(\d{4})/, "$1***$3")}
                  </p>
                  <span className={`text-base font-black ${
                    w.status === "approved" ? "text-neon" : w.status === "rejected" ? "text-red-400" : "text-white"
                  }`}>
                    ₦{w.amount.toLocaleString()}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
                  <span>🏦 {w.bankName}</span>
                  <span>📋 {w.accountNumber}</span>
                  <span>⏰ {formatDate(w.createdAt)}</span>
                </div>
              </div>
            </div>

            {tab === "pending" && (
              <div className="flex gap-2 mt-3 pt-3 border-t border-[#2A2A2A]">
                <button
                  onClick={() => dispatch({ type: "APPROVE_WITHDRAWAL", id: w.id })}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-neon/10 border border-neon/30 text-neon text-sm font-semibold hover:bg-neon/20 transition-colors"
                >
                  <CheckCircle size={15} /> Approve
                </button>
                <button
                  onClick={() => dispatch({ type: "REJECT_WITHDRAWAL", id: w.id })}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-red-900/20 border border-red-800/30 text-red-400 text-sm font-semibold hover:bg-red-900/30 transition-colors"
                >
                  <XCircle size={15} /> Reject
                </button>
              </div>
            )}
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-500">No {tab} withdrawals</div>
        )}
      </div>

      {/* Auto-approve setting */}
      <div className="bg-card border border-[#2A2A2A] rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm text-white font-medium">Auto-approve withdrawals</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Auto-approve amounts under ₦{state.settings.autoApproveLimit.toLocaleString()}
            </p>
          </div>
          <button
            onClick={() =>
              dispatch({
                type: "UPDATE_SETTINGS",
                settings: { autoApproveWithdrawals: !state.settings.autoApproveWithdrawals },
              })
            }
            className={`w-12 h-6 rounded-full transition-colors relative ${
              state.settings.autoApproveWithdrawals ? "bg-neon" : "bg-[#2A2A2A]"
            }`}
          >
            <span
              className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${
                state.settings.autoApproveWithdrawals ? "left-7" : "left-1"
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
