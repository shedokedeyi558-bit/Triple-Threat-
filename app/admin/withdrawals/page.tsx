"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { adminApi, type AdminWithdrawal, ApiError } from "@/lib/api";
import { CheckCircle, XCircle, Loader2, AlertTriangle, Ban, Banknote, MoreHorizontal } from "lucide-react";

type Tab = "pending" | "approved" | "rejected" | "denied" | "paid_manual";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-NG", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

// ── Shared dialog shell ───────────────────────────────────────────────────────
function DialogShell({
  borderColor,
  onBackdropClick,
  children,
}: {
  borderColor: string;
  onBackdropClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{
        position: "fixed", inset: 0, zIndex: 60,
        display: "flex", alignItems: "center", justifyContent: "center",
        backgroundColor: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)", padding: 16,
      }}
      onClick={onBackdropClick}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 440, borderRadius: 18, padding: "24px 22px",
          backgroundColor: "var(--bg-card)", border: `1px solid ${borderColor}`,
          display: "flex", flexDirection: "column", gap: 16,
        }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

// ── Deny dialog ───────────────────────────────────────────────────────────────
function DenyDialog({
  withdrawal, onConfirm, onCancel, processing,
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
    <DialogShell borderColor="rgba(249,115,22,0.4)" onBackdropClick={onCancel}>
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

      <div>
        <label style={{
          fontSize: 11, fontWeight: 700, color: "var(--text-secondary)",
          textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6,
        }}>
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
        {invalid && <p style={{ fontSize: 11, color: "#f87171", margin: "4px 0 0" }}>Reason is required before denying.</p>}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={onCancel} style={{
          flex: 1, padding: "10px 0", borderRadius: 10, fontSize: 13, fontWeight: 700,
          backgroundColor: "transparent", border: "1px solid var(--border-subtle)",
          color: "var(--text-secondary)", cursor: "pointer",
        }}>Cancel</button>
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
    </DialogShell>
  );
}

// ── Mark as Paid (Manual) dialog ──────────────────────────────────────────────
function MarkPaidDialog({
  withdrawal, onConfirm, onCancel, processing,
}: {
  withdrawal: AdminWithdrawal;
  onConfirm: (reference: string) => void;
  onCancel: () => void;
  processing: boolean;
}) {
  const [reference, setReference] = useState("");

  const accountName   = withdrawal.account_name ?? "—";
  const accountNumber = withdrawal.account_number;
  const bankName      = withdrawal.bank_name;

  return (
    <DialogShell borderColor="rgba(34,197,94,0.35)" onBackdropClick={onCancel}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{
          width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
          backgroundColor: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Banknote size={17} style={{ color: "#22c55e" }} />
        </div>
        <div>
          <p style={{ fontSize: 14, fontWeight: 800, color: "var(--text-primary)", margin: "0 0 4px" }}>
            Mark as Paid (Manual)
          </p>
          <p style={{ fontSize: 18, fontWeight: 900, color: "#22c55e", margin: 0, fontFamily: "monospace" }}>
            ₦{withdrawal.amount.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Confirmation question */}
      <div style={{
        borderRadius: 10, padding: "13px 14px",
        backgroundColor: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)",
        display: "flex", flexDirection: "column", gap: 6,
      }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: "#22c55e", margin: 0 }}>
          Have you already sent this payment?
        </p>
        <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: 0, lineHeight: 1.6 }}>
          Confirm you have transferred{" "}
          <strong style={{ color: "var(--text-primary)" }}>₦{withdrawal.amount.toLocaleString()}</strong>{" "}
          to{" "}
          <strong style={{ color: "var(--text-primary)" }}>{accountName}</strong>{" "}
          at{" "}
          <strong style={{ color: "var(--text-primary)" }}>{bankName}</strong>{" "}
          (account <strong style={{ color: "var(--text-primary)", fontFamily: "monospace" }}>{accountNumber}</strong>).
        </p>
        <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>
          This marks the withdrawal as paid without processing a Squad transfer.
        </p>
      </div>

      {/* Reference / note (optional) */}
      <div>
        <label style={{
          fontSize: 11, fontWeight: 700, color: "var(--text-secondary)",
          textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6,
        }}>
          Reference / Note <span style={{ color: "var(--text-muted)", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span>
        </label>
        <input
          type="text"
          placeholder="e.g. OPay ref #XYZ123, Opay app screenshot sent…"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          style={{
            width: "100%", borderRadius: 10, padding: "10px 14px", fontSize: 13,
            backgroundColor: "var(--bg-base)", border: "1px solid var(--border-subtle)",
            color: "var(--text-primary)", outline: "none", boxSizing: "border-box",
          }}
        />
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={onCancel} style={{
          flex: 1, padding: "10px 0", borderRadius: 10, fontSize: 13, fontWeight: 700,
          backgroundColor: "transparent", border: "1px solid var(--border-subtle)",
          color: "var(--text-secondary)", cursor: "pointer",
        }}>Cancel</button>
        <button
          onClick={() => onConfirm(reference.trim())}
          disabled={processing}
          style={{
            flex: 1, padding: "10px 0", borderRadius: 10, fontSize: 13, fontWeight: 800,
            backgroundColor: "#22c55e", border: "none", color: "#fff",
            cursor: processing ? "not-allowed" : "pointer", opacity: processing ? 0.6 : 1,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}>
          {processing && <Loader2 size={13} className="animate-spin" />}
          {processing ? "Marking…" : "Yes, mark as paid"}
        </button>
      </div>
    </DialogShell>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function WithdrawalsPage() {
  const [tab, setTab]               = useState<Tab>("pending");
  const [withdrawals, setWithdrawals] = useState<AdminWithdrawal[]>([]);
  const [total, setTotal]           = useState(0);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [selected, setSelected]     = useState<string[]>([]);
  const [processing, setProcessing] = useState<string | null>(null);
  const [transferWarnings, setTransferWarnings] = useState<Record<string, string>>({});

  const [denyTarget, setDenyTarget]         = useState<AdminWithdrawal | null>(null);
  const [markPaidTarget, setMarkPaidTarget] = useState<AdminWithdrawal | null>(null);
  // Track which cards have the Squad overflow option expanded
  const [squadExpanded, setSquadExpanded]   = useState<Record<string, boolean>>({});

  const fetchWithdrawals = useCallback(async (status: Tab) => {
    setLoading(true); setError(""); setSelected([]);
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
      if (res.transferError) setTransferWarnings((prev) => ({ ...prev, [id]: res.transferError! }));
      setWithdrawals((prev) => prev.filter((w) => w.id !== id));
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Approval failed");
    } finally { setProcessing(null); }
  };

  const handleReject = async (id: string) => {
    const reason = prompt("Rejection reason (optional):");
    setProcessing(id);
    try {
      await adminApi.rejectWithdrawal(id, reason ?? undefined);
      setWithdrawals((prev) => prev.filter((w) => w.id !== id));
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Rejection failed");
    } finally { setProcessing(null); }
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
    } finally { setProcessing(null); }
  };

  const handleMarkPaidConfirm = async (reference: string) => {
    if (!markPaidTarget) return;
    const id = markPaidTarget.id;
    setProcessing(id);
    try {
      await adminApi.markPaidManual(id, reference || undefined);
      setWithdrawals((prev) => prev.filter((w) => w.id !== id));
      setMarkPaidTarget(null);
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Mark as paid failed");
    } finally { setProcessing(null); }
  };

  const handleBulkApprove = async () => {
    for (const id of selected) await handleApprove(id);
    setSelected([]);
  };

  const toggleSelect = (id: string) =>
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const TAB_CONFIG: { key: Tab; label: string; activeColor: string }[] = [
    { key: "pending",     label: "Pending",      activeColor: "var(--accent-indigo)" },
    { key: "approved",    label: "Approved",     activeColor: "var(--accent-indigo)" },
    { key: "paid_manual", label: "Paid (Manual)", activeColor: "#22c55e" },
    { key: "rejected",    label: "Rejected",     activeColor: "var(--accent-indigo)" },
    { key: "denied",      label: "Denied",       activeColor: "#f97316" },
  ];

  return (
    <div className="space-y-5">
      {/* Dialogs */}
      <AnimatePresence>
        {denyTarget && (
          <DenyDialog
            withdrawal={denyTarget}
            onConfirm={handleDenyConfirm}
            onCancel={() => setDenyTarget(null)}
            processing={processing === denyTarget.id}
          />
        )}
        {markPaidTarget && (
          <MarkPaidDialog
            withdrawal={markPaidTarget}
            onConfirm={handleMarkPaidConfirm}
            onCancel={() => setMarkPaidTarget(null)}
            processing={processing === markPaidTarget.id}
          />
        )}
      </AnimatePresence>

      <div>
        <h1 className="text-2xl font-black text-white">Withdrawal Requests</h1>
        <p className="text-gray-400 text-sm mt-0.5">
          Approve via Squad, mark as manually paid, reject, or deny player withdrawals
        </p>
      </div>

      {/* Tabs — 5 tabs, scroll on small screens */}
      <div className="flex gap-1 p-1 rounded-xl border overflow-x-auto"
        style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}>
        {TAB_CONFIG.map(({ key, label, activeColor }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all active:scale-[0.97] whitespace-nowrap px-2"
            style={{
              backgroundColor: tab === key ? activeColor : "transparent",
              color: tab === key ? "white" : "var(--text-secondary)",
              border: "1px solid transparent",
              minWidth: 80,
            }}
          >
            {label}
            {tab === key && total > 0 && (
              <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full bg-white/20">
                {total}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Bulk approve (pending only) */}
      {tab === "pending" && selected.length > 0 && (
        <div className="border rounded-xl px-4 py-3 flex items-center justify-between"
          style={{ backgroundColor: "var(--bg-card)", borderColor: "rgba(76,111,255,0.2)" }}>
          <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{selected.length} selected</span>
          <button
            onClick={handleBulkApprove}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95"
            style={{ backgroundColor: "rgba(76,111,255,0.15)", color: "var(--accent-indigo)", border: "1px solid rgba(76,111,255,0.3)" }}
          >
            <CheckCircle size={13} /> Approve (Auto — Squad)
          </button>
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 size={28} className="animate-spin" style={{ color: "var(--accent-indigo)" }} />
        </div>
      )}
      {error && !loading && <div className="text-center py-8 text-red-400 text-sm">{error}</div>}

      {!loading && !error && (
        <div className="space-y-2">
          {withdrawals.map((w) => (
            <div
              key={w.id}
              className="border rounded-xl p-4 transition-colors"
              style={{
                backgroundColor: "var(--bg-card)",
                borderColor: selected.includes(w.id) ? "var(--accent-indigo)"
                  : w.status === "denied"      ? "rgba(249,115,22,0.2)"
                  : w.status === "paid_manual" ? "rgba(34,197,94,0.2)"
                  : "var(--border-subtle)",
              }}
            >
              {/* Transfer warning */}
              {transferWarnings[w.id] && (
                <div className="flex items-start gap-2 bg-yellow-900/20 border border-yellow-700/40 rounded-xl p-3 mb-3 text-yellow-400 text-xs">
                  <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                  <span>Squad transfer failed: {transferWarnings[w.id]}. Use &quot;Mark as Paid&quot; if you processed this manually.</span>
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
                <div className="flex-1 min-w-0">
                  {/* Row 1: phone + amount */}
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                      {w.phone}
                      {w.players?.name && (
                        <span className="font-normal ml-2 text-xs" style={{ color: "var(--text-muted)" }}>
                          ({w.players.name})
                        </span>
                      )}
                    </p>
                    <span className="text-base font-black font-mono" style={{
                      color: w.status === "approved"    ? "var(--accent-amber)"
                           : w.status === "rejected"    ? "#f87171"
                           : w.status === "denied"      ? "#f97316"
                           : w.status === "paid_manual" ? "#22c55e"
                           : "var(--text-primary)",
                    }}>
                      ₦{w.amount.toLocaleString()}
                    </span>
                  </div>

                  {/* Row 2: bank details — admin verification panel */}
                  <div className="rounded-lg px-3 py-2.5 mb-2" style={{
                    backgroundColor: "var(--bg-base)", border: "1px solid var(--border-hairline)",
                  }}>
                    {/* Account name — primary verification target */}
                    <div className="mb-1.5">
                      <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        Account holder
                      </span>
                      <p style={{
                        fontSize: 13, fontWeight: 800, color: "var(--text-primary)", margin: "2px 0 0",
                        fontFamily: w.account_name ? "inherit" : "inherit",
                        opacity: w.account_name ? 1 : 0.45,
                      }}>
                        {w.account_name ?? (
                          <span style={{ color: "#fbbf24", fontSize: 12, fontWeight: 600 }}>
                            ⚠ Name not on record — verify manually via OPay
                          </span>
                        )}
                      </p>
                    </div>
                    {/* Account number + bank */}
                    <div className="flex flex-wrap gap-x-5 gap-y-0.5">
                      <span style={{ fontSize: 12, fontFamily: "monospace", fontWeight: 700, color: "var(--text-secondary)" }}>
                        {w.account_number}
                      </span>
                      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{w.bank_name}</span>
                    </div>
                  </div>

                  {/* Row 3: metadata */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
                    <span>💳 {w.method}</span>
                    <span>⏰ {formatDate(w.created_at)}</span>
                  </div>

                  {/* Status-specific reasons/references */}
                  {w.reject_reason && (
                    <p className="text-xs text-red-400 mt-1.5">Reject reason: {w.reject_reason}</p>
                  )}
                  {w.denial_reason && (
                    <p className="text-xs mt-1.5" style={{ color: "#f97316" }}>Denial reason: {w.denial_reason}</p>
                  )}
                  {w.manual_reference && (
                    <p className="text-xs mt-1.5" style={{ color: "#22c55e" }}>
                      Manual ref: {w.manual_reference}
                    </p>
                  )}
                </div>
              </div>

              {/* Action buttons — pending only */}
              {tab === "pending" && (
                <div className="mt-3 pt-3 border-t" style={{ borderColor: "var(--border-hairline)" }}>
                  {/* Primary row: 3 buttons + ⋯ */}
                  <div className="flex gap-2">
                    {/* Mark Paid — primary action, prominent green */}
                    <button
                      onClick={() => setMarkPaidTarget(w)}
                      disabled={processing === w.id}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-[0.98] disabled:opacity-50"
                      style={{ backgroundColor: "rgba(34,197,94,0.12)", border: "2px solid rgba(34,197,94,0.4)", color: "#22c55e" }}
                    >
                      {processing === w.id
                        ? <Loader2 size={13} className="animate-spin" />
                        : <><Banknote size={13} /> Mark Paid</>
                      }
                    </button>

                    {/* Reject */}
                    <button
                      onClick={() => handleReject(w.id)}
                      disabled={processing === w.id}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all active:scale-[0.98] disabled:opacity-50"
                      style={{ backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171" }}
                    >
                      <XCircle size={13} /> Reject
                    </button>

                    {/* Deny */}
                    <button
                      onClick={() => setDenyTarget(w)}
                      disabled={processing === w.id}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-[0.98] disabled:opacity-50"
                      style={{ backgroundColor: "rgba(249,115,22,0.08)", border: "2px solid rgba(249,115,22,0.3)", color: "#f97316" }}
                    >
                      <Ban size={13} /> Deny
                    </button>

                    {/* ⋯ overflow — Squad auto-transfer hidden here */}
                    <button
                      onClick={() => setSquadExpanded((prev) => ({ ...prev, [w.id]: !prev[w.id] }))}
                      disabled={processing === w.id}
                      title="More options"
                      className="flex items-center justify-center rounded-xl text-xs font-bold transition-all active:scale-[0.98] disabled:opacity-50"
                      style={{
                        width: 36, flexShrink: 0,
                        backgroundColor: squadExpanded[w.id] ? "rgba(76,111,255,0.12)" : "rgba(255,255,255,0.04)",
                        border: squadExpanded[w.id] ? "1px solid rgba(76,111,255,0.3)" : "1px solid var(--border-hairline)",
                        color: squadExpanded[w.id] ? "var(--accent-indigo)" : "var(--text-muted)",
                      }}
                    >
                      <MoreHorizontal size={14} />
                    </button>
                  </div>

                  {/* Squad overflow — only shown when ⋯ is tapped */}
                  {squadExpanded[w.id] && (
                    <div className="mt-2 rounded-xl p-2.5" style={{ backgroundColor: "rgba(76,111,255,0.05)", border: "1px solid rgba(76,111,255,0.15)" }}>
                      <p className="text-[10px] font-semibold mb-2" style={{ color: "var(--text-muted)" }}>
                        ⚠ Squad auto-transfer is currently blocked (EDD pending). Use Mark Paid above instead.
                      </p>
                      <button
                        onClick={() => handleApprove(w.id)}
                        disabled={processing === w.id}
                        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all active:scale-[0.98] disabled:opacity-50"
                        style={{ backgroundColor: "rgba(76,111,255,0.10)", border: "1px solid rgba(76,111,255,0.25)", color: "var(--accent-indigo)" }}
                      >
                        {processing === w.id
                          ? <Loader2 size={12} className="animate-spin" />
                          : <><CheckCircle size={12} /> Approve via Squad (Auto-transfer)</>
                        }
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {withdrawals.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No {TAB_CONFIG.find((t) => t.key === tab)?.label.toLowerCase()} withdrawals
            </div>
          )}
        </div>
      )}
    </div>
  );
}
