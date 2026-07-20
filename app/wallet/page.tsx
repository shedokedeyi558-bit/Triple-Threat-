"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { ArrowDownLeft, ArrowUpRight, Loader2, Ticket, Pill, Zap, CheckCircle2, AlertCircle, Search, ChevronDown } from "lucide-react";
import { walletApi, playerApi, referralApi, ApiError, type ApiTransaction, type BankOption } from "@/lib/api";
import { withTimeout } from "@/lib/withTimeout";
import Link from "next/link";

const quickAmounts = [500, 1000, 2000, 5000];

function formatDate(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const time = d.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" });
  if (d.toDateString() === today.toDateString()) return `Today · ${time}`;
  if (d.toDateString() === yesterday.toDateString()) return `Yesterday · ${time}`;
  return d.toLocaleDateString("en-NG", { month: "short", day: "numeric" }) + ` · ${time}`;
}

function formatCountdown(expiresAt: string): string {
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diffMs = expiry.getTime() - now.getTime();
  
  if (diffMs <= 0) return "Expired";
  
  const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  const hours = Math.floor((diffMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  
  if (days > 0) return `expires in ${days}d ${hours}h`;
  return `expires in ${hours}h`;
}

function TxRow({ tx }: { tx: ApiTransaction }) {
  const isCredit = tx.amount > 0;
  return (
    <div className="flex items-center gap-3 px-5 py-3.5 hover:opacity-80 transition-opacity" style={{ backgroundColor: "var(--bg-card)" }}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0`} style={{ backgroundColor: isCredit ? "rgba(232, 163, 61, 0.2)" : "rgba(239, 68, 68, 0.2)" }}>
        {isCredit
          ? <ArrowDownLeft size={15} style={{ color: "var(--accent-amber)" }} />
          : <ArrowUpRight size={15} className="text-red-400" />
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{tx.description}</p>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{formatDate(tx.created_at)}</p>
      </div>
      <span className={`font-bold text-sm flex-shrink-0 font-mono`} style={{ color: isCredit ? "var(--accent-amber)" : "#f87171" }}>
        {isCredit ? "+" : ""}₦{Math.abs(tx.amount).toLocaleString()}
      </span>
    </div>
  );
}

const inp = "w-full rounded-xl px-4 py-3.5 text-sm outline-none transition-colors placeholder:opacity-50";

// ── Bank picker with search ───────────────────────────────────────────────────
function BankPicker({ banks, value, onChange, disabled }: {
  banks: BankOption[];
  value: BankOption | null;
  onChange: (b: BankOption) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = query
    ? banks.filter((b) => b.name.toLowerCase().includes(query.toLowerCase()))
    : banks;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 16px", borderRadius: 12, border: "1px solid var(--border-subtle)",
          backgroundColor: "var(--bg-base)", color: value ? "var(--text-primary)" : "rgba(255,255,255,0.35)",
          fontSize: 14, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.6 : 1,
          textAlign: "left",
        }}
      >
        <span>{value ? value.name : "Select bank..."}</span>
        <ChevronDown size={15} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 50,
          backgroundColor: "var(--bg-card)", border: "1px solid var(--border-subtle)",
          borderRadius: 12, overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        }}>
          {/* Search */}
          <div style={{ padding: "8px 10px", borderBottom: "1px solid var(--border-hairline)", display: "flex", alignItems: "center", gap: 8 }}>
            <Search size={13} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
            <input
              autoFocus
              type="text"
              placeholder="Search banks..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                flex: 1, background: "none", border: "none", outline: "none",
                fontSize: 13, color: "var(--text-primary)",
              }}
            />
          </div>
          {/* List */}
          <div style={{ maxHeight: 220, overflowY: "auto" }}>
            {filtered.length === 0 ? (
              <p style={{ padding: "12px 16px", fontSize: 13, color: "var(--text-muted)" }}>No banks found</p>
            ) : filtered.map((b) => (
              <button
                key={b.code}
                type="button"
                onClick={() => { onChange(b); setOpen(false); setQuery(""); }}
                style={{
                  width: "100%", textAlign: "left", padding: "10px 16px", fontSize: 13, border: "none",
                  backgroundColor: value?.code === b.code ? "rgba(76,111,255,0.1)" : "transparent",
                  color: value?.code === b.code ? "var(--accent-indigo)" : "var(--text-primary)",
                  cursor: "pointer",
                }}
              >
                {b.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function WalletPage() {
  const { state, dispatch } = useApp();
  const [tab, setTab] = useState<"deposit" | "withdraw">("deposit");

  // ── Deposit state ──
  const [depositAmt, setDepositAmt] = useState("");
  const [depositLoading, setDepositLoading] = useState(false);
  const [depositError, setDepositError] = useState("");

  // ── Withdraw state ──
  const [withdrawAmt, setWithdrawAmt] = useState("");
  const [selectedBank, setSelectedBank] = useState<BankOption | null>(null);
  const [accNum, setAccNum] = useState("");
  const [resolvedName, setResolvedName] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawMsg, setWithdrawMsg] = useState("");
  const [withdrawError, setWithdrawError] = useState("");

  // ── Bank list ──
  const [banks, setBanks] = useState<BankOption[]>([]);
  const [banksLoading, setBanksLoading] = useState(false);

  // ── Shared ──
  const [transactions, setTransactions] = useState<ApiTransaction[]>([]);
  const [txLoading, setTxLoading] = useState(true);
  const [tickets, setTickets] = useState<Array<{ code: string; expires_at: string; type?: string }>>([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [spendSummary, setSpendSummary] = useState<{ spent_this_week: number; plays_today: number } | null>(null);

  const refreshBalance = useCallback(async () => {
    try {
      const { balance } = await walletApi.getBalance();
      dispatch({ type: "UPDATE_BALANCE", balance });
    } catch { /* silent */ }
  }, [dispatch]);

  useEffect(() => {
    refreshBalance();
    walletApi.getTransactions()
      .then((data) => setTransactions(data.transactions))
      .catch(() => {})
      .finally(() => setTxLoading(false));
    playerApi.getSpendSummary()
      .then((data) => setSpendSummary(data))
      .catch(() => {});
    referralApi.getTickets()
      .then((data) => setTickets(data.tickets.filter(t => t.status === "active").map(t => ({ code: t.code, expires_at: t.expires_at, type: t.type }))))
      .catch(() => setTickets([]))
      .finally(() => setTicketsLoading(false));
  }, [refreshBalance]);

  // Refetch transactions when player navigates back to this tab
  // (e.g. after winning a pill game) — prevents stale history
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        refreshBalance();
        walletApi.getTransactions()
          .then((data) => setTransactions(data.transactions))
          .catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [refreshBalance]);

  // Load bank list once when withdraw tab is first opened
  const banksLoadedRef = useRef(false);
  const handleTabChange = useCallback((t: "deposit" | "withdraw") => {
    setTab(t);
    setDepositError("");
    setWithdrawError("");
    setWithdrawMsg("");
    if (t === "withdraw" && !banksLoadedRef.current) {
      banksLoadedRef.current = true;
      setBanksLoading(true);
      walletApi.getBanks()
        .then((d) => setBanks(d.banks ?? []))
        .catch(() => setBanks([]))
        .finally(() => setBanksLoading(false));
    }
  }, []);

  // When account number reaches 10 digits and a bank is selected, auto-resolve
  useEffect(() => {
    // Reset resolve state whenever account number or bank changes
    setResolvedName(null);
    setResolveError("");
    setConfirmed(false);

    if (accNum.length === 10 && selectedBank) {
      setResolving(true);
      walletApi.resolveAccount(accNum, selectedBank.code)
        .then((d) => setResolvedName(d.account_name))
        .catch((err) => setResolveError(err instanceof ApiError ? err.message : "Could not verify account"))
        .finally(() => setResolving(false));
    }
  }, [accNum, selectedBank]);

  const handleDeposit = async () => {
    const amt = parseInt(depositAmt, 10);
    if (!amt || amt < 100) { setDepositError("Minimum deposit is ₦100"); return; }
    setDepositError("");
    setDepositLoading(true);
    try {
      const data = await withTimeout(walletApi.deposit(amt), 18000);
      window.location.href = data.authorizationUrl;
    } catch (err) {
      setDepositError(err instanceof ApiError ? err.message : "Deposit failed. Try again.");
      setDepositLoading(false);
    }
  };

  const handleWithdraw = async () => {
    const amt = parseInt(withdrawAmt, 10);
    if (!amt || amt < 1000) { setWithdrawError("Minimum withdrawal is ₦1,000"); return; }
    if (!selectedBank) { setWithdrawError("Select a bank"); return; }
    if (accNum.length < 10) { setWithdrawError("Enter a valid 10-digit account number"); return; }
    if (!confirmed || !resolvedName) { setWithdrawError("Confirm the account name before submitting"); return; }
    if (state.player && state.player.balance < amt) { setWithdrawError("Insufficient balance"); return; }
    setWithdrawError("");
    setWithdrawLoading(true);
    try {
      const data = await withTimeout(
        walletApi.withdraw(amt, accNum, selectedBank.name, selectedBank.code),
        18000
      );
      setWithdrawMsg(data.message);
      dispatch({ type: "UPDATE_BALANCE", balance: data.newBalance });
      setWithdrawAmt("");
      setSelectedBank(null);
      setAccNum("");
      setResolvedName(null);
      setConfirmed(false);
      walletApi.getTransactions().then((d) => setTransactions(d.transactions)).catch(() => {});
    } catch (err) {
      setWithdrawError(err instanceof ApiError ? err.message : "Withdrawal failed. Try again.");
    } finally {
      setWithdrawLoading(false);
    }
  };

  const balance = state.player?.balance ?? 0;
  const bonusBalance = state.player?.bonus_balance ?? 0;
  const totalSpendable = balance + bonusBalance;

  return (
    <div className="px-4 lg:px-8 py-6 min-h-screen" style={{ backgroundColor: "var(--bg-base)" }}>

      {/* ── BALANCE ── */}
      <div className="rounded-2xl p-5 mb-6 border" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}>
        <p className="text-[11px] font-bold mb-1 uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Available Balance</p>
        <p className="font-black text-4xl font-mono" style={{ color: "var(--text-primary)" }}>₦{balance.toLocaleString()}</p>
        {bonusBalance > 0 && (
          <p className="text-xs mt-1" style={{ color: "var(--accent-amber)" }}>
            + ₦{bonusBalance.toLocaleString()} bonus credit (entry fees only, not withdrawable)
          </p>
        )}
        
        {/* Spend summary stat line */}
        {spendSummary && (
          <p className="text-xs mt-3 pt-3 border-t" style={{ color: "var(--text-secondary)", borderColor: "var(--border-subtle)" }}>
            This week: ₦{spendSummary.spent_this_week.toLocaleString()} across {spendSummary.plays_today} plays
          </p>
        )}
      </div>

      {/* ── MAIN CONTENT: 2-column layout on desktop ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: 60% - Deposit/Withdraw + Tickets */}
        <div className="lg:col-span-2 space-y-6">

        {/* Tickets */}
        {tickets.length > 0 && (
          <div className="rounded-2xl overflow-hidden border" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}>
            <div className="px-5 py-4 border-b flex-shrink-0" style={{ borderColor: "var(--border-subtle)" }}>
              <p className="font-bold text-sm flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                <Ticket size={16} style={{ color: "var(--accent-amber)" }} />
                Active Tickets
              </p>
            </div>
            <div className="p-5 space-y-3">
              {ticketsLoading ? (
                <div className="flex justify-center py-6">
                  <Loader2 size={20} className="animate-spin" style={{ color: "var(--accent-amber)" }} />
                </div>
              ) : (
                tickets.map((ticket) => (
                  <div key={ticket.code} className="rounded-xl p-4 flex items-center justify-between border" style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border-subtle)" }}>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-black text-sm tracking-widest font-mono" style={{ color: "var(--accent-amber)" }}>{ticket.code}</p>
                        {ticket.type && (
                          <span className="flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase" style={{ backgroundColor: ticket.type === "pill" ? "rgba(124,111,232,0.15)" : "rgba(232,163,61,0.15)", color: ticket.type === "pill" ? "var(--accent-violet)" : "var(--accent-amber)" }}>
                            {ticket.type === "pill" ? <><Pill size={10} /> Pill</> : <><Zap size={10} /> Blitz</>}
                          </span>
                        )}
                      </div>
                      <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>{formatCountdown(ticket.expires_at)}</p>
                    </div>
                    {ticket.type === "pill" ? (
                      <Link href="/pills" className="px-3 py-2 text-xs font-bold rounded-lg hover:opacity-80 transition-opacity" style={{ backgroundColor: "rgba(124,111,232,0.15)", color: "var(--accent-violet)", border: "1px solid rgba(124,111,232,0.3)" }}>
                        Use on Pills
                      </Link>
                    ) : (
                      <Link href="/blitz" className="px-3 py-2 text-xs font-bold rounded-lg hover:opacity-80 transition-opacity" style={{ backgroundColor: "var(--accent-amber)", color: "#000" }}>
                        Use Ticket
                      </Link>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tickets empty */}
        {tickets.length === 0 && !ticketsLoading && (
          <div className="text-center py-4" style={{ color: "var(--text-muted)" }}>
            <p className="text-sm">No active tickets yet. Win Blitz ranks 4-10 to earn free entry tickets.</p>
          </div>
        )}

        {/* Deposit / Withdraw */}
        <div className="rounded-2xl overflow-hidden border flex flex-col" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}>
          {/* Tabs */}
          <div className="flex border-b" style={{ borderColor: "var(--border-subtle)" }}>
            {(["deposit", "withdraw"] as const).map((t) => (
              <button
                key={t}
                onClick={() => handleTabChange(t)}
                className="flex-1 py-4 text-sm font-bold capitalize transition-all border-b-2 -mb-px active:opacity-70"
                style={{
                  borderColor: tab === t ? "var(--accent-amber)" : "transparent",
                  color: tab === t ? "var(--accent-amber)" : "var(--text-secondary)",
                }}
              >
                {t === "deposit" ? "Deposit" : "Withdraw"}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="p-5 space-y-4"
            >
              {tab === "deposit" ? (
                <>
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-widest mb-2 block" style={{ color: "var(--text-muted)" }}>Amount (₦)</label>
                    <input
                      type="number" placeholder="Enter amount" value={depositAmt}
                      onChange={(e) => setDepositAmt(e.target.value)}
                      className={inp}
                      style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border-subtle)", color: "var(--text-primary)", border: "1px solid" }}
                    />
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {quickAmounts.map((a) => (
                      <button
                        key={a}
                        onClick={() => setDepositAmt(String(a))}
                        className={`py-2.5 rounded-lg border text-xs font-bold transition-all`}
                        style={{
                          borderColor: depositAmt === String(a) ? "var(--accent-amber)" : "var(--border-subtle)",
                          backgroundColor: depositAmt === String(a) ? "rgba(232, 163, 61, 0.1)" : "transparent",
                          color: depositAmt === String(a) ? "var(--accent-amber)" : "var(--text-secondary)",
                        }}
                      >
                        ₦{a >= 1000 ? `${a / 1000}k` : a}
                      </button>
                    ))}
                  </div>
                  {depositError && <p className="text-red-400 text-xs">{depositError}</p>}
                  <button
                    onClick={handleDeposit}
                    disabled={depositLoading || !depositAmt}
                    className="w-full py-4 font-black rounded-xl disabled:opacity-40 flex items-center justify-center gap-2 text-sm"
                    style={{ backgroundColor: "var(--accent-amber)", color: "#000" }}
                  >
                    {depositLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                    {depositLoading ? "Redirecting..." : "Deposit via Paystack →"}
                  </button>
                  <p className="text-[11px] text-center" style={{ color: "var(--text-muted)" }}>Secured by Paystack · Cards, USSD, Bank Transfer</p>
                </>
              ) : (
                <>
                  {/* ── Amount ── */}
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-widest mb-2 block" style={{ color: "var(--text-muted)" }}>Amount (₦)</label>
                    <input type="number" placeholder="Min ₦1,000" value={withdrawAmt}
                      onChange={(e) => setWithdrawAmt(e.target.value)} className={inp}
                      style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border-subtle)", color: "var(--text-primary)", border: "1px solid" }} />
                  </div>

                  {/* ── Bank picker ── */}
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-widest mb-2 block" style={{ color: "var(--text-muted)" }}>Bank</label>
                    {banksLoading ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", borderRadius: 12, border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-base)" }}>
                        <Loader2 size={14} className="animate-spin" style={{ color: "var(--text-muted)" }} />
                        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Loading banks...</span>
                      </div>
                    ) : (
                      <BankPicker
                        banks={banks}
                        value={selectedBank}
                        onChange={(b) => setSelectedBank(b)}
                      />
                    )}
                  </div>

                  {/* ── Account number ── */}
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-widest mb-2 block" style={{ color: "var(--text-muted)" }}>Account Number</label>
                    <input
                      type="tel" inputMode="numeric" placeholder="10-digit number"
                      value={accNum}
                      onChange={(e) => setAccNum(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      className={inp}
                      style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border-subtle)", color: "var(--text-primary)", border: "1px solid" }}
                    />
                  </div>

                  {/* ── Account resolution ── */}
                  {accNum.length === 10 && selectedBank && (
                    <AnimatePresence mode="wait">
                      {resolving && (
                        <motion.div key="resolving"
                          initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 14px", borderRadius: 12, border: "1px solid var(--border-hairline)", backgroundColor: "var(--bg-base)" }}>
                          <Loader2 size={13} className="animate-spin" style={{ color: "var(--text-muted)" }} />
                          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Verifying account...</span>
                        </motion.div>
                      )}

                      {!resolving && resolveError && (
                        <motion.div key="resolve-err"
                          initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 14px", borderRadius: 12, border: "1px solid rgba(239,68,68,0.3)", backgroundColor: "rgba(239,68,68,0.06)" }}>
                          <AlertCircle size={13} style={{ color: "#f87171", flexShrink: 0 }} />
                          <span style={{ fontSize: 12, color: "#f87171" }}>{resolveError}</span>
                        </motion.div>
                      )}

                      {!resolving && resolvedName && (
                        <motion.div key="resolved"
                          initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          style={{ borderRadius: 12, border: "1px solid rgba(76,111,255,0.25)", backgroundColor: "rgba(76,111,255,0.06)", overflow: "hidden" }}>
                          <div style={{ padding: "12px 14px" }}>
                            <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 4 }}>
                              Account name
                            </p>
                            <p style={{ fontSize: 15, fontWeight: 800, color: "var(--accent-indigo)", letterSpacing: "0.01em" }}>
                              {resolvedName}
                            </p>
                          </div>
                          {/* Confirm strip */}
                          {!confirmed ? (
                            <button
                              onClick={() => setConfirmed(true)}
                              style={{
                                width: "100%", padding: "10px 14px", fontSize: 12, fontWeight: 700,
                                border: "none", borderTop: "1px solid rgba(76,111,255,0.2)",
                                backgroundColor: "rgba(76,111,255,0.12)", color: "var(--accent-indigo)",
                                cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 6,
                              }}
                            >
                              <CheckCircle2 size={13} style={{ opacity: 0.6 }} />
                              Yes, this is my account — confirm
                            </button>
                          ) : (
                            <div style={{
                              padding: "10px 14px", fontSize: 12, fontWeight: 700,
                              borderTop: "1px solid rgba(76,111,255,0.2)",
                              backgroundColor: "rgba(76,111,255,0.18)", color: "var(--accent-indigo)",
                              display: "flex", alignItems: "center", gap: 6,
                            }}>
                              <CheckCircle2 size={13} />
                              Account confirmed
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  )}

                  {/* ── Success / Error messages ── */}
                  {withdrawMsg && (
                    <div className="rounded-xl p-3 text-xs font-semibold text-center border" style={{ backgroundColor: "rgba(232, 163, 61, 0.1)", borderColor: "var(--accent-amber)", color: "var(--accent-amber)" }}>
                      {withdrawMsg}
                    </div>
                  )}
                  {withdrawError && <p className="text-red-400 text-xs">{withdrawError}</p>}

                  {/* ── Submit ── */}
                  <button
                    onClick={handleWithdraw}
                    disabled={
                      withdrawLoading ||
                      !withdrawAmt || parseInt(withdrawAmt) < 1000 ||
                      !selectedBank ||
                      accNum.length < 10 ||
                      !confirmed
                    }
                    className="w-full py-4 font-black rounded-xl disabled:opacity-40 flex items-center justify-center gap-2 text-sm"
                    style={{ backgroundColor: "var(--accent-amber)", color: "#000" }}
                  >
                    {withdrawLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                    {withdrawLoading ? "Processing..." : "Request Withdrawal →"}
                  </button>
                  {!confirmed && accNum.length === 10 && selectedBank && !resolving && resolvedName && (
                    <p className="text-[11px] text-center" style={{ color: "var(--text-muted)" }}>
                      Confirm the account name above before submitting
                    </p>
                  )}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        </div>
        
        {/* Right column: 40% - Transaction History (sticky on desktop) */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl overflow-hidden border flex flex-col" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}>
            <div className="px-5 py-4 border-b flex-shrink-0" style={{ borderColor: "var(--border-subtle)" }}>
              <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>Transaction History</p>
            </div>
            <div className="flex-1 overflow-y-auto divide-y" style={{ maxHeight: "600px", borderTopColor: "var(--border-hairline)" }}>
      {txLoading ? (
                <div className="divide-y" style={{ borderColor: "var(--border-hairline)" }}>
                  {[1,2,3,4,5].map((i) => (
                    <div key={i} className="flex items-center gap-3 px-5 py-3.5">
                      <div className="skeleton w-8 h-8 rounded-lg flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="skeleton h-3.5 w-3/4 rounded" />
                        <div className="skeleton h-2.5 w-1/3 rounded" />
                      </div>
                      <div className="skeleton h-4 w-16 rounded flex-shrink-0" />
                    </div>
                  ))}
                </div>
              ) : transactions.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>No transactions yet</p>
                  <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Deposit to get started</p>
                </div>
              ) : (
                transactions.map((tx) => <TxRow key={tx.id} tx={tx} />)
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
