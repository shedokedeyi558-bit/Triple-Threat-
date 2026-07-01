"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { NavBar } from "@/components/ui/NavBar";
import { ArrowDownCircle, ArrowUpCircle, Plus, Minus, Loader2 } from "lucide-react";
import { walletApi, ApiError, type ApiTransaction } from "@/lib/api";

const quickAmounts = [500, 1000, 2000, 5000];
const banks = ["GTBank", "Access Bank", "Zenith Bank", "First Bank", "UBA", "OPay", "PalmPay", "Kuda", "Moniepoint"];

function formatDate(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  if (isToday) {
    return `Today ${d.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}`;
  }
  return (
    d.toLocaleDateString("en-NG", { month: "short", day: "numeric" }) +
    " " +
    d.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })
  );
}

function TxIcon({ type }: { type: string }) {
  const map: Record<string, React.ReactNode> = {
    prize: <ArrowDownCircle size={16} className="text-neon" />,
    deposit: <ArrowDownCircle size={16} className="text-blue-400" />,
    deposit_settled: <ArrowDownCircle size={16} className="text-blue-400" />,
    entry_fee: <ArrowUpCircle size={16} className="text-red-400" />,
    withdrawal_pending: <ArrowUpCircle size={16} className="text-orange-400" />,
    bonus: <Plus size={16} className="text-purple-400" />,
  };
  return <>{map[type] ?? <Minus size={16} className="text-gray-400" />}</>;
}

export default function WalletPage() {
  const { state, dispatch } = useApp();
  const [tab, setTab] = useState<"deposit" | "withdraw">("deposit");

  // Deposit state
  const [depositAmt, setDepositAmt] = useState("");
  const [depositLoading, setDepositLoading] = useState(false);
  const [depositError, setDepositError] = useState("");

  // Withdraw state
  const [withdrawAmt, setWithdrawAmt] = useState("");
  const [bank, setBank] = useState("");
  const [accNum, setAccNum] = useState("");
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawMsg, setWithdrawMsg] = useState("");
  const [withdrawError, setWithdrawError] = useState("");

  // Transactions
  const [transactions, setTransactions] = useState<ApiTransaction[]>([]);
  const [txLoading, setTxLoading] = useState(true);

  // Balance refresh
  const refreshBalance = useCallback(async () => {
    try {
      const { balance } = await walletApi.getBalance();
      dispatch({ type: "UPDATE_BALANCE", balance });
    } catch {
      // non-critical
    }
  }, [dispatch]);

  // Load transactions + fresh balance on mount
  useEffect(() => {
    refreshBalance();
    walletApi.getTransactions()
      .then((data) => setTransactions(data.transactions))
      .catch(() => {})
      .finally(() => setTxLoading(false));
  }, [refreshBalance]);

  // Paystack deposit — opens authorization_url in same tab
  const handleDeposit = async () => {
    const amt = parseInt(depositAmt, 10);
    if (!amt || amt < 100) {
      setDepositError("Minimum deposit is ₦100");
      return;
    }
    setDepositError("");
    setDepositLoading(true);
    try {
      const data = await walletApi.deposit(amt);
      // Redirect to Paystack hosted page
      window.location.href = data.authorizationUrl;
    } catch (err) {
      setDepositError(err instanceof ApiError ? err.message : "Deposit failed. Try again.");
      setDepositLoading(false);
    }
  };

  const handleWithdraw = async () => {
    const amt = parseInt(withdrawAmt, 10);
    if (!amt || amt < 1000) { setWithdrawError("Minimum withdrawal is ₦1,000"); return; }
    if (!bank) { setWithdrawError("Please select a bank"); return; }
    if (accNum.length < 10) { setWithdrawError("Enter a valid 10-digit account number"); return; }
    if (state.player && state.player.balance < amt) {
      setWithdrawError("Insufficient balance");
      return;
    }
    setWithdrawError("");
    setWithdrawLoading(true);
    try {
      const data = await walletApi.withdraw(amt, bank, accNum, bank);
      setWithdrawMsg(data.message);
      dispatch({ type: "UPDATE_BALANCE", balance: data.newBalance });
      setWithdrawAmt("");
      setBank("");
      setAccNum("");
      // Reload transactions
      walletApi.getTransactions()
        .then((d) => setTransactions(d.transactions))
        .catch(() => {});
    } catch (err) {
      setWithdrawError(err instanceof ApiError ? err.message : "Withdrawal failed. Try again.");
    } finally {
      setWithdrawLoading(false);
    }
  };

  const balance = state.player?.balance ?? 0;

  return (
    <div className="min-h-dvh bg-bg flex flex-col">
      <NavBar title="My Wallet" showBack showWallet={false} />

      <main className="flex-1 px-4 py-5 pb-10">
        {/* Balance */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <p className="text-gray-400 text-sm mb-1">Available balance</p>
          <p className="text-neon font-black text-5xl neon-text-glow">
            ₦{balance.toLocaleString()}
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="flex bg-card border border-[#2A2A2A] rounded-xl p-1 mb-5">
          {(["deposit", "withdraw"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all capitalize ${
                tab === t ? "bg-neon text-black" : "text-gray-400"
              }`}
            >
              {t === "deposit" ? "💰 Deposit" : "🏦 Withdraw"}
            </button>
          ))}
        </div>

        {tab === "deposit" ? (
          <motion.div key="deposit" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-1.5 block">Enter amount (₦)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={depositAmt}
                  onChange={(e) => setDepositAmt(e.target.value)}
                  className="w-full bg-card border border-[#2A2A2A] focus:border-neon rounded-xl px-4 py-3.5 text-white text-lg font-bold outline-none transition-colors"
                />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-2">Quick picks</p>
                <div className="grid grid-cols-4 gap-2">
                  {quickAmounts.map((a) => (
                    <button
                      key={a}
                      onClick={() => setDepositAmt(String(a))}
                      className={`py-2.5 rounded-xl border text-sm font-bold transition-all ${
                        depositAmt === String(a)
                          ? "border-neon bg-neon/10 text-neon"
                          : "border-[#2A2A2A] text-gray-300"
                      }`}
                    >
                      ₦{a.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>
              {depositError && (
                <p className="text-red-400 text-sm">{depositError}</p>
              )}
              <button
                onClick={handleDeposit}
                disabled={depositLoading || !depositAmt}
                className="btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {depositLoading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  "Deposit via Paystack →"
                )}
              </button>
              <p className="text-xs text-center text-gray-500">
                Secured by Paystack · Cards, USSD, Bank Transfer
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div key="withdraw" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-1.5 block">Amount (min ₦1,000)</label>
                <input
                  type="number"
                  placeholder="1000"
                  value={withdrawAmt}
                  onChange={(e) => setWithdrawAmt(e.target.value)}
                  className="w-full bg-card border border-[#2A2A2A] focus:border-neon rounded-xl px-4 py-3.5 text-white text-lg font-bold outline-none transition-colors"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1.5 block">Select bank</label>
                <select
                  value={bank}
                  onChange={(e) => setBank(e.target.value)}
                  className="w-full bg-card border border-[#2A2A2A] focus:border-neon rounded-xl px-4 py-3.5 text-white outline-none"
                >
                  <option value="">Choose bank...</option>
                  {banks.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1.5 block">Account number</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="0123456789"
                  value={accNum}
                  onChange={(e) => setAccNum(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  className="w-full bg-card border border-[#2A2A2A] focus:border-neon rounded-xl px-4 py-3.5 text-white outline-none transition-colors"
                />
              </div>
              {withdrawMsg && (
                <div className="bg-neon/10 border border-neon/30 rounded-xl p-3 text-neon text-sm font-semibold text-center">
                  ✅ {withdrawMsg}
                </div>
              )}
              {withdrawError && (
                <p className="text-red-400 text-sm">{withdrawError}</p>
              )}
              <button
                onClick={handleWithdraw}
                disabled={
                  withdrawLoading ||
                  !withdrawAmt ||
                  parseInt(withdrawAmt) < 1000 ||
                  !bank ||
                  accNum.length < 10
                }
                className="btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {withdrawLoading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  "Request Withdrawal →"
                )}
              </button>
            </div>
          </motion.div>
        )}

        {/* Transaction history */}
        <div className="mt-8">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
            Transaction History
          </h3>
          {txLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 size={24} className="text-neon animate-spin" />
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.length === 0 && (
                <p className="text-gray-600 text-sm text-center py-4">No transactions yet</p>
              )}
              {transactions.map((tx) => (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-card border border-[#2A2A2A] rounded-xl px-4 py-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <TxIcon type={tx.type} />
                    <div>
                      <p className="text-sm text-white font-medium leading-tight">{tx.description}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{formatDate(tx.created_at)}</p>
                    </div>
                  </div>
                  <span className={`font-bold text-sm ${tx.amount > 0 ? "text-neon" : "text-red-400"}`}>
                    {tx.amount > 0 ? "+" : ""}₦{Math.abs(tx.amount).toLocaleString()}
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
