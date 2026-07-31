"use client";

import { useEffect, useState, useCallback } from "react";
import { adminApi, type AdminWithdrawal, ApiError } from "@/lib/api";
import { CheckCircle, XCircle, Loader2, AlertTriangle } from "lucide-react";

type Tab = "pending" | "approved" | "rejected";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-NG", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default function WithdrawalsPage() {
  const [tab, setTab] = useState<Tab>("pending");
  const [withdrawals, setWithdrawals] = useState<AdminWithdrawal[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [processing, setProcessing] = useState<string | null>(null);
  const [transferWarnings, setTransferWarnings] = useState<Record<string, string>>({});

  const fetchWithdrawals = useCallback(async (status: Tab) => {
    setLoading(true);
    setError("");
    setSelected([]);
    try {
      const data = await adminApi.getWithdrawals(status);
      setWithdrawals(data.withdrawals);
      setTotal(data.total ?? data.withdrawals.length);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load withdrawals");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchWithdrawals(tab); }, [tab, fetchWithdrawals]);

  const handleApprove = async (id: string) => {
    setProcessing(id);
    try {
      const res = await adminApi.approveWithdrawal(id);
      // If Paystack transfer failed, show a warning but still mark approved
      if (res.transferError) {
        setTransferWarnings((prev) => ({ ...prev, [id]: res.transferError! }));
      }
      setWithdrawals((prev) => prev.filter((w) => w.id !== id));
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Approval failed");
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt("Rejection reason (optional):");
    setProcessing(id);
    try {
      await adminApi.rejectWithdrawal(id, reason ?? undefined);
      setWithdrawals((prev) => prev.filter((w) => w.id !== id));
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Rejection failed");
    } finally {
      setProcessing(null);
    }
  };

  const handleBulkApprove = async () => {
    for (const id of selected) {
      await handleApprove(id);
    }
    setSelected([]);
  };

  const toggleSelect = (id: string) =>
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black text-white">Withdrawal Requests</h1>
        <p className="text-gray-400 text-sm mt-0.5">Approve or reject player withdrawals</p>
      </div>

      {/* Tabs — indigo segmented control */}
      <div className="flex gap-1 p-1 rounded-xl border" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}>
        {(["pending", "approved", "rejected"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 py-2.5 rounded-lg text-xs font-semibold capitalize transition-all active:scale-[0.97] active:opacity-80"
            style={{
              backgroundColor: tab === t ? "var(--accent-indigo)" : "transparent",
              color: tab === t ? "white" : "var(--text-secondary)",
              border: tab === t ? "none" : "1px solid transparent",
            }}
          >
            {t}
            {tab === t && total > 0 && (
              <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full bg-white/20">
                {total}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Bulk approve */}
      {tab === "pending" && selected.length > 0 && (
        <div className="border rounded-xl px-4 py-3 flex items-center justify-between" style={{ backgroundColor: "var(--bg-card)", borderColor: "rgba(76,111,255,0.2)" }}>
          <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{selected.length} selected</span>
          <button
            onClick={handleBulkApprove}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95"
            style={{ backgroundColor: "rgba(76,111,255,0.15)", color: "var(--accent-indigo)", border: "1px solid rgba(76,111,255,0.3)" }}
          >
            <CheckCircle size={13} /> Approve Selected
          </button>
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 size={28} className="animate-spin" style={{ color: "var(--accent-indigo)" }} />
        </div>
      )}

      {error && !loading && (
        <div className="text-center py-8 text-red-400 text-sm">{error}</div>
      )}

      {!loading && !error && (
        <div className="space-y-2">
          {withdrawals.map((w) => (
            <div
              key={w.id}
              className="border rounded-xl p-4 transition-colors"
              style={{
                backgroundColor: "var(--bg-card)",
                borderColor: selected.includes(w.id) ? "var(--accent-indigo)" : "var(--border-subtle)",
              }}
            >
              {/* Transfer warning from failed Paystack */}
              {transferWarnings[w.id] && (
                <div className="flex items-start gap-2 bg-yellow-900/20 border border-yellow-700/40 rounded-xl p-3 mb-3 text-yellow-400 text-xs">
                  <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                  <span>Paystack transfer failed: {transferWarnings[w.id]}. Process manually.</span>
                </div>
              )}

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
                    <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                      {w.phone.replace(/(\d{4})(\d{3})(\d{4})/, "$1***$3")}
                      {w.players?.name && (
                        <span className="font-normal ml-2 text-xs" style={{ color: "var(--text-muted)" }}>({w.players.name})</span>
                      )}
                    </p>
                    <span className="text-base font-black font-mono" style={{
                      color: w.status === "approved" ? "var(--accent-amber)" :
                             w.status === "rejected" ? "#f87171" : "var(--text-primary)"
                    }}>
                      ₦{w.amount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
                    <span>🏦 {w.bank_name}</span>
                    <span>📋 {w.account_number}</span>
                    <span>💳 {w.method}</span>
                    <span>⏰ {formatDate(w.created_at)}</span>
                  </div>
                  {w.reject_reason && (
                    <p className="text-xs text-red-400 mt-1.5">Reason: {w.reject_reason}</p>
                  )}
                </div>
              </div>

              {tab === "pending" && (
                <div className="flex gap-2 mt-3 pt-3 border-t" style={{ borderColor: "var(--border-hairline)" }}>
                  <button
                    onClick={() => handleApprove(w.id)}
                    disabled={processing === w.id}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-50"
                    style={{ backgroundColor: "rgba(76,111,255,0.1)", border: "1px solid rgba(76,111,255,0.3)", color: "var(--accent-indigo)" }}
                  >
                    {processing === w.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <><CheckCircle size={15} /> Approve</>
                    )}
                  </button>
                  <button
                    onClick={() => handleReject(w.id)}
                    disabled={processing === w.id}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-red-900/20 border border-red-800/30 text-red-400 text-sm font-semibold hover:bg-red-900/30 transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    <XCircle size={15} /> Reject
                  </button>
                </div>
              )}
            </div>
          ))}

          {withdrawals.length === 0 && (
            <div className="text-center py-12 text-gray-500">No {tab} withdrawals</div>
          )}
        </div>
      )}
    </div>
  );
}
