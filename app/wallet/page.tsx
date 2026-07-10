"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { ArrowDownLeft, ArrowUpRight, Loader2, Ticket } from "lucide-react";
import { walletApi, ApiError, type ApiTransaction } from "@/lib/api";
import Link from "next/link";

const quickAmounts = [500, 1000, 2000, 5000];
const banks = ["GTBank", "Access Bank", "Zenith Bank", "First Bank", "UBA", "OPay", "PalmPay", "Kuda", "Moniepoint"];

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

export default function WalletPage() {
  const { state, dispatch } = useApp();
  const [tab, setTab] = useState<"deposit" | "withdraw">("deposit");
  const [depositAmt, setDepositAmt] = useState("");
  const [depositLoading, setDepositLoading] = useState(false);
  const [depositError, setDepositError] = useState("");
  const [withdrawAmt, setWithdrawAmt] = useState("");
  const [bank, setBank] = useState("");
  const [accNum, setAccNum] = useState("");
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawMsg, setWithdrawMsg] = useState("");
  const [withdrawError, setWithdrawError] = useState("");
  const [transactions, setTransactions] = useState<ApiTransaction[]>([]);
  const [txLoading, setTxLoading] = useState(true);
  const [tickets, setTickets] = useState<Array<{ code: string; expires_at: string }>>([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);

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
    
    // Fetch tickets (mock for now since API endpoint may not exist yet)
    setTickets([
      { code: "BLZ2024001", expires_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString() },
      { code: "BLZ2024002", expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() },
    ]);
    setTicketsLoading(false);
  }, [refreshBalance]);

  const handleDeposit = async () => {
    const amt = parseInt(depositAmt, 10);
    if (!amt || amt < 100) { setDepositError("Minimum deposit is ₦100"); return; }
    setDepositError("");
    setDepositLoading(true);
    try {
      const data = await walletApi.deposit(amt);
      window.location.href = data.authorizationUrl;
    } catch (err) {
      setDepositError(err instanceof ApiError ? err.message : "Deposit failed. Try again.");
      setDepositLoading(false);
    }
  };

  const handleWithdraw = async () => {
    const amt = parseInt(withdrawAmt, 10);
    if (!amt || amt < 1000) { setWithdrawError("Minimum withdrawal is ₦1,000"); return; }
    if (!bank) { setWithdrawError("Select a bank"); return; }
    if (accNum.length < 10) { setWithdrawError("Enter a valid 10-digit account number"); return; }
    if (state.player && state.player.balance < amt) { setWithdrawError("Insufficient balance"); return; }
    setWithdrawError("");
    setWithdrawLoading(true);
    try {
      const data = await walletApi.withdraw(amt, bank, accNum, bank);
      setWithdrawMsg(data.message);
      dispatch({ type: "UPDATE_BALANCE", balance: data.newBalance });
      setWithdrawAmt(""); setBank(""); setAccNum("");
      walletApi.getTransactions().then((d) => setTransactions(d.transactions)).catch(() => {});
    } catch (err) {
      setWithdrawError(err instanceof ApiError ? err.message : "Withdrawal failed. Try again.");
    } finally {
      setWithdrawLoading(false);
    }
  };

  const balance = state.player?.balance ?? 0;

  return (
    <div className="px-4 lg:px-8 py-6 min-h-screen" style={{ backgroundColor: "var(--bg-base)" }}>

      {/* ── BALANCE ── */}
      <div className="rounded-2xl p-5 mb-6 border" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}>
        <p className="text-[11px] font-bold mb-1 uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Available Balance</p>
        <p className="font-black text-4xl font-mono" style={{ color: "var(--text-primary)" }}>₦{balance.toLocaleString()}</p>
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
                      <p className="font-black text-sm tracking-widest font-mono" style={{ color: "var(--accent-amber)" }}>{ticket.code}</p>
                      <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>{formatCountdown(ticket.expires_at)}</p>
                    </div>
                    <Link href="/blitz" className="px-3 py-2 text-xs font-bold rounded-lg hover:opacity-80 transition-opacity" style={{ backgroundColor: "var(--accent-amber)", color: "#000" }}>
                      Use Ticket
                    </Link>
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
                onClick={() => { setTab(t); setDepositError(""); setWithdrawError(""); setWithdrawMsg(""); }}
                className={`flex-1 py-4 text-sm font-bold capitalize transition-all border-b-2 -mb-px`}
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
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-widest mb-2 block" style={{ color: "var(--text-muted)" }}>Amount (₦)</label>
                    <input type="number" placeholder="Min ₦1,000" value={withdrawAmt}
                      onChange={(e) => setWithdrawAmt(e.target.value)} className={inp}
                      style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border-subtle)", color: "var(--text-primary)", border: "1px solid" }} />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-widest mb-2 block" style={{ color: "var(--text-muted)" }}>Bank</label>
                    <select value={bank} onChange={(e) => setBank(e.target.value)} className={inp}
                      style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border-subtle)", color: "var(--text-primary)", border: "1px solid" }}>
                      <option value="">Select bank...</option>
                      {banks.map((b) => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-widest mb-2 block" style={{ color: "var(--text-muted)" }}>Account Number</label>
                    <input type="tel" inputMode="numeric" placeholder="10-digit number" value={accNum}
                      onChange={(e) => setAccNum(e.target.value.replace(/\D/g, "").slice(0, 10))} className={inp}
                      style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border-subtle)", color: "var(--text-primary)", border: "1px solid" }} />
                  </div>
                  {withdrawMsg && (
                    <div className="rounded-xl p-3 text-xs font-semibold text-center border" style={{ backgroundColor: "rgba(232, 163, 61, 0.1)", borderColor: "var(--accent-amber)", color: "var(--accent-amber)" }}>✓ {withdrawMsg}</div>
                  )}
                  {withdrawError && <p className="text-red-400 text-xs">{withdrawError}</p>}
                  <button
                    onClick={handleWithdraw}
                    disabled={withdrawLoading || !withdrawAmt || parseInt(withdrawAmt) < 1000 || !bank || accNum.length < 10}
                    className="w-full py-4 font-black rounded-xl disabled:opacity-40 flex items-center justify-center gap-2 text-sm"
                    style={{ backgroundColor: "var(--accent-amber)", color: "#000" }}
                  >
                    {withdrawLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                    {withdrawLoading ? "Processing..." : "Request Withdrawal →"}
                  </button>
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
                <div className="flex justify-center py-12">
                  <Loader2 size={22} className="animate-spin" style={{ color: "var(--accent-amber)" }} />
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
