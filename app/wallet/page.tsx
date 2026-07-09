"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { ArrowDownLeft, ArrowUpRight, Loader2 } from "lucide-react";
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

function TxRow({ tx }: { tx: ApiTransaction }) {
  const isCredit = tx.amount > 0;
  return (
    <div className="flex items-center gap-3 px-5 py-3.5 hover:bg-[#161616] transition-colors">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isCredit ? "bg-neon/10" : "bg-red-500/10"}`}>
        {isCredit
          ? <ArrowDownLeft size={15} className="text-neon" />
          : <ArrowUpRight size={15} className="text-red-400" />
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium truncate">{tx.description}</p>
        <p className="text-gray-600 text-xs mt-0.5">{formatDate(tx.created_at)}</p>
      </div>
      <span className={`font-bold text-sm flex-shrink-0 ${isCredit ? "text-neon" : "text-red-400"}`}>
        {isCredit ? "+" : ""}₦{Math.abs(tx.amount).toLocaleString()}
      </span>
    </div>
  );
}

const inp = "w-full bg-[#0A0A0A] border border-[#1E1E1E] focus:border-neon rounded-xl px-4 py-3.5 text-white text-sm outline-none transition-colors placeholder:text-gray-700";

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
    <div className="px-4 lg:px-8 py-6">

      {/* ── BALANCE ── */}
      <div className="relative bg-gradient-to-br from-[#141414] to-[#0D0D0D] border border-[#1E1E1E] rounded-2xl p-5 mb-6 overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-neon/5 rounded-full blur-3xl pointer-events-none" />
        <p className="text-[11px] text-gray-500 uppercase tracking-widest font-bold mb-1">Available Balance</p>
        <p className="text-neon font-black text-4xl">₦{balance.toLocaleString()}</p>
      </div>

      {/* ── MAIN CONTENT: Actions + History ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Deposit / Withdraw */}
        <div className="bg-[#111] border border-[#1E1E1E] rounded-2xl overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-[#1E1E1E]">
            {(["deposit", "withdraw"] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setDepositError(""); setWithdrawError(""); setWithdrawMsg(""); }}
                className={`flex-1 py-4 text-sm font-bold capitalize transition-all border-b-2 -mb-px ${
                  tab === t ? "border-neon text-neon" : "border-transparent text-gray-500 hover:text-white"
                }`}
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
                    <label className="text-[11px] text-gray-500 font-bold uppercase tracking-widest mb-2 block">Amount (₦)</label>
                    <input
                      type="number" placeholder="Enter amount" value={depositAmt}
                      onChange={(e) => setDepositAmt(e.target.value)}
                      className={inp}
                    />
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {quickAmounts.map((a) => (
                      <button
                        key={a}
                        onClick={() => setDepositAmt(String(a))}
                        className={`py-2.5 rounded-lg border text-xs font-bold transition-all ${
                          depositAmt === String(a) ? "border-neon bg-neon/10 text-neon" : "border-[#1E1E1E] text-gray-400 hover:border-neon/30"
                        }`}
                      >
                        ₦{a >= 1000 ? `${a / 1000}k` : a}
                      </button>
                    ))}
                  </div>
                  {depositError && <p className="text-red-400 text-xs">{depositError}</p>}
                  <button
                    onClick={handleDeposit}
                    disabled={depositLoading || !depositAmt}
                    className="w-full py-4 bg-neon text-black font-black rounded-xl disabled:opacity-40 flex items-center justify-center gap-2 text-sm"
                    style={{ boxShadow: "0 0 20px #00FF6620" }}
                  >
                    {depositLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                    {depositLoading ? "Redirecting..." : "Deposit via Paystack →"}
                  </button>
                  <p className="text-[11px] text-center text-gray-600">Secured by Paystack · Cards, USSD, Bank Transfer</p>
                </>
              ) : (
                <>
                  <div>
                    <label className="text-[11px] text-gray-500 font-bold uppercase tracking-widest mb-2 block">Amount (₦)</label>
                    <input type="number" placeholder="Min ₦1,000" value={withdrawAmt}
                      onChange={(e) => setWithdrawAmt(e.target.value)} className={inp} />
                  </div>
                  <div>
                    <label className="text-[11px] text-gray-500 font-bold uppercase tracking-widest mb-2 block">Bank</label>
                    <select value={bank} onChange={(e) => setBank(e.target.value)} className={inp}>
                      <option value="">Select bank...</option>
                      {banks.map((b) => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] text-gray-500 font-bold uppercase tracking-widest mb-2 block">Account Number</label>
                    <input type="tel" inputMode="numeric" placeholder="10-digit number" value={accNum}
                      onChange={(e) => setAccNum(e.target.value.replace(/\D/g, "").slice(0, 10))} className={inp} />
                  </div>
                  {withdrawMsg && (
                    <div className="bg-neon/10 border border-neon/30 rounded-xl p-3 text-neon text-xs font-semibold text-center">✓ {withdrawMsg}</div>
                  )}
                  {withdrawError && <p className="text-red-400 text-xs">{withdrawError}</p>}
                  <button
                    onClick={handleWithdraw}
                    disabled={withdrawLoading || !withdrawAmt || parseInt(withdrawAmt) < 1000 || !bank || accNum.length < 10}
                    className="w-full py-4 bg-neon text-black font-black rounded-xl disabled:opacity-40 flex items-center justify-center gap-2 text-sm"
                  >
                    {withdrawLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                    {withdrawLoading ? "Processing..." : "Request Withdrawal →"}
                  </button>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Transaction history */}
        <div className="bg-[#111] border border-[#1E1E1E] rounded-2xl overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-[#1E1E1E] flex-shrink-0">
            <p className="text-white font-bold text-sm">Transaction History</p>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-[#1A1A1A]" style={{ maxHeight: "420px" }}>
            {txLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 size={22} className="text-neon animate-spin" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-gray-600 text-sm">No transactions yet</p>
                <p className="text-gray-700 text-xs mt-1">Deposit to get started</p>
              </div>
            ) : (
              transactions.map((tx) => <TxRow key={tx.id} tx={tx} />)
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
