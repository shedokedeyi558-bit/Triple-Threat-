"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { adminApi, type AdminWithdrawal, ApiError } from "@/lib/api";
import { CheckCircle, XCircle, Loader2, AlertTriangle, Ban } from "lucide-react";

type Tab = "pending" | "approved" | "rejected" | "denied";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-NG", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

// ── Deny confirm dialog ───────────────────────────────────────────────────────
function DenyDialog({
  withdrawal,
  onConfirm,
  onCancel,
  processing,
}: {
  withdrawal: AdminWithdrawal;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
  processing: boolean;
}) {
  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState(false);
  const trimmed = reason.trim();
  const invalid = touched && trimmed.length === 0;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{
        position: "fixed", inset: 0, zIndex: 60,
        display: "flex", alignItems: "center", justifyContent: "center",
        backgroundColor: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)", padding: 16,
      }}
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 420, borderRadius: 18, padding: "24px 22px",
          backgroundColor: "var(--bg-card)", border: "1px solid rgba(249,115,22,0.4)",
          display: "flex", flexDirection: "column", gap: 16,
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <div style={{
            width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
            backgroundColor: "rgba(249,115,22,0.12)", border: "1px solid rgba(249,115,22,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Ban size={17} style={{ color: "#f97316" }} />
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 800, color: "var(--text-primary)", margin: "0 0 4px" }}>
              Deny this withdrawal?
            </p>
            <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.55, margin: 0 }}>
              ₦{withdrawal.amount.toLocaleString()} · {withdrawal.phone}
            </p>
          </div>
        </div>

        {/* Warning */}
        <div style={{
          borderRadius: 10, padding: "11px 13px",
          backgroundColor: "rgba(249,115,22,0.07)", border: "1px solid rgba(249,115,22,0.25)",
          display: "flex", gap: 8,
        }}>
          <AlertTriangle size={14} style={{ color: "#f97316", flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 12, color: "#f97316", fontWeight: 600, margin: 0, lineHeight: 1.5 }}>
            The player will <strong>NOT</strong> be refunded. This cannot be undone.
          </p>
        </div>

        {/* Reason input */}
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)",
            textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>
            Reason <span style={{ color: "#f87171" }}>*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Suspicious activity, duplicate request…"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            onBlur={() => setTouched(true)}
            autoFocus
            style={{
              width: "100%", borderRadius: 10, padding: "10px 14px", fontSize: 13,
              backgroundColor: "var(--bg-base)",
              border: `1px solid ${invalid ? "rgba(248,113,113,0.5)" : "var(--border-subtle)"}`,
              color: "var(--text-primary)", outline: "none", boxSizing: "border-box",
            }}
          />
          {invalid && (
            <p style={{ fontSize: 11, color: "#f87171", margin: "4px 0 0" }}>Reason is required before denying.</p>
          )}
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onCancel}
            style={{
              flex: 1, padding: "10px 0", borderRadius: 10, fontSize: 13, fontWeight: 700,
              backgroundColor: "transparent", border: "1px solid var(--border-subtle)",
              color: "var(--text-secondary)", cursor: "pointer",
            }}>
            Cancel
          </button>
          <button
            onClick={() => { setTouched(true); if (trimmed) onConfirm(trimmed); }}
            disabled={processing}
            style={{
              flex: 1, padding: "10px 0", borderRadius: 10, fontSize: 13, fontWeight: 800,
              backgroundColor: trimmed ? "#f97316" : "rgba(249,115,22,0.3)",
              border: "none", color: "#fff",
              cursor: processing || !trimmed ? "not-allowed" : "pointer",
              opacity: processing ? 0.6 : 1,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}>
            {processing && <Loader2 size={13} className="animate-spin" />}
            {processing ? "Denying…" : "Deny withdrawal"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function WithdrawalsPage() {
  const [tab, setTab] = useState<Tab>("pending");
  const [withdrawals, setWithdrawals] = useState<AdminWithdrawal[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [processing, setProcessing] = useState<string | null>(null);
  const [transferWarnings, setTransferWarnings] = useState<Record<string, string>>({});

  // Deny dialog state
  const [denyTarget, setDenyTarget] = useState<AdminWithdrawal | null>(null);

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

  const handleDenyConfirm = async (reason: string) => {
    if (!denyTarget) return;
    const id = denyTarget.id;
    setProcessing(id);
    try {
      await adminApi.denyWithdrawal(id, reason);
      setWithdrawals((prev) => prev.filter((w) => w.id !== id));
      setDenyTarget(null);
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Deny failed");
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

  const TABS: Tab[] = ["pending", "approved", "rejected", "denied"];

  return (
    <div className="space-y-5">
      {/* Deny dialog */}
      <AnimatePresence>
        {denyTarget && (
          <DenyDialog
            withdrawal={denyTarget}
            onConfirm={handleDenyConfirm}
            onCancel={() => setDenyTarget(null)}
            processing={processing === denyTarget.id}
          />
        )}
      </AnimatePresence>

      <div>
        <h1 className="text-2xl font-black text-white">Withdrawal Requests</h1>
        <p className="text-gray-400 text-sm mt-0.5">Approve, reject, or deny player withdrawals</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl border" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}>
        {TABS.map((t) => {
          const isDenied = t === "denied";
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 py-2.5 rounded-lg text-xs font-semibold capitalize transition-all active:scale-[0.97]"
              style={{
                backgroundColor: tab === t
                  ? isDenied ? "#f97316" : "var(--accent-indigo)"
                  : "transparent",
                color: tab === t ? "white" : "var(--text-secondary)",
                border: "1px solid transparent",
              }}
            >
              {t}
              {tab === t && total > 0 && (
                <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full bg-white/20">
                  {total}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bulk approve bar */}
      {tab === "pending" && selected.length > 0 && (
        <div className="border rounded-xl px-4 py-3 flex items-center justify-between"
          style={{ backgroundColor: "var(--bg-card)", borderColor: "rgba(76,111,255,0.2)" }}>
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
                borderColor: selected.includes(w.id)
                  ? "var(--accent-indigo)"
                  : w.status === "denied" ? "rgba(249,115,22,0.2)" : "var(--border-subtle)",
              }}
            >
              {/* Paystack transfer warning */}
              {transferWarnings[w.id] && (
                <div className="flex items-start gap-2 bg-yellow-900/20 border border-yellow-700/40 rounded-xl p-3 mb-3 text-yellow-400 text-xs">
                  <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                  <span>Transfer failed: {transferWarnings[w.id]}. Process manually.</span>
                </div>
              )}

              <div className="flex items-start gap-3">
                {tab === "pending" && (
                  <input
                    type="checkbox"
                    checked={selected.includes(w.id)}
                    onChange={() => toggleSelect(w.id)}
                    className="mt-1 w-4 h-4 flex-shrink-0"
                  />
                )}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    {/* Unmasked phone number */}
                    <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                      {w.phone}
                      {w.players?.name && (
                        <span className="font-normal ml-2 text-xs" style={{ color: "var(--text-muted)" }}>
                          ({w.players.name})
                        </span>
                      )}
                    </p>
                    <span className="text-base font-black font-mono" style={{
                      color: w.status === "approved" ? "var(--accent-amber)"
                           : w.status === "rejected" ? "#f87171"
                           : w.status === "denied"   ? "#f97316"
                           : "var(--text-primary)",
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
                    <p className="text-xs text-red-400 mt-1.5">Reject reason: {w.reject_reason}</p>
                  )}
                  {w.deny_reason && (
                    <p className="text-xs mt-1.5" style={{ color: "#f97316" }}>Deny reason: {w.deny_reason}</p>
                  )}
                </div>
              </div>

              {/* Action buttons — pending only */}
              {tab === "pending" && (
                <div className="flex gap-2 mt-3 pt-3 border-t" style={{ borderColor: "var(--border-hairline)" }}>
                  {/* Approve */}
                  <button
                    onClick={() => handleApprove(w.id)}
                    disabled={processing === w.id}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-50"
                    style={{ backgroundColor: "rgba(76,111,255,0.10)", border: "1px solid rgba(76,111,255,0.3)", color: "var(--accent-indigo)" }}
                  >
                    {processing === w.id
                      ? <Loader2 size={14} className="animate-spin" />
                      : <><CheckCircle size={15} /> Approve</>
                    }
                  </button>

                  {/* Reject */}
                  <button
                    onClick={() => handleReject(w.id)}
                    disabled={processing === w.id}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-50"
                    style={{ backgroundColor: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }}
                  >
                    <XCircle size={15} /> Reject
                  </button>

                  {/* Deny — visually distinct: orange, Ban icon, permanent */}
                  <button
                    onClick={() => setDenyTarget(w)}
                    disabled={processing === w.id}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-[0.98] disabled:opacity-50"
                    style={{ backgroundColor: "rgba(249,115,22,0.10)", border: "2px solid rgba(249,115,22,0.35)", color: "#f97316" }}
                  >
                    <Ban size={15} /> Deny
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
