"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { NavBar } from "@/components/ui/NavBar";
import { ArrowDownCircle, ArrowUpCircle, Plus, Minus } from "lucide-react";
import type { Transaction } from "@/lib/types";

const quickAmounts = [500, 1000, 2000, 5000];
const banks = ["GTBank", "Access Bank", "Zenith Bank", "First Bank", "OPay", "PalmPay", "Kuda"];

function formatDate(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  if (isToday) {
    return `Today ${d.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}`;
  }
  return d.toLocaleDateString("en-NG", { month: "short", day: "numeric" }) +
    " " + d.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" });
}

function TxIcon({ type }: { type: Transaction["type"] }) {
  const map = {
    win: <ArrowDownCircle size={16} className="text-neon" />,
    deposit: <ArrowDownCircle size={16} className="text-blue-400" />,
    entry_fee: <ArrowUpCircle size={16} className="text-red-400" />,
    withdrawal: <ArrowUpCircle size={16} className="text-orange-400" />,
    bonus: <Plus size={16} className="text-purple-400" />,
  };
  return map[type] ?? <Minus size={16} className="text-gray-400" />;
}

export default function WalletPage() {
  const { state, dispatch } = useApp();
  const [depositAmt, setDepositAmt] = useState("");
  const [depositLoading, setDepositLoading] = useState(false);
  const [depositDone, setDepositDone] = useState(false);
  const [withdrawAmt, setWithdrawAmt] = useState("");
  const [bank, setBank] = useState("");
  const [accNum, setAccNum] = useState("");
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawDone, setWithdrawDone] = useState(false);
  const [tab, setTab] = useState<"deposit" | "withdraw">("deposit");

  const handleDeposit = async () => {
    const amt = parseInt(depositAmt, 10);
    if (!amt || amt < 100) return;
    setDepositLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    dispatch({ type: "DEPOSIT", amount: amt });
    setDepositLoading(false);
    setDepositDone(true);
    setDepositAmt("");
    setTimeout(() => setDepositDone(false), 3000);
  };

  const handleWithdraw = async () => {
    const amt = parseInt(withdrawAmt, 10);
    if (!amt || amt < 1000 || !bank || accNum.length < 10) return;
    if (state.balance < amt) return;
    setWithdrawLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setWithdrawLoading(false);
    setWithdrawDone(true);
    setWithdrawAmt("");
    setTimeout(() => setWithdrawDone(false), 3000);
  };

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
            ₦{state.balance.toLocaleString()}
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
              {depositDone && (
                <div className="bg-neon/10 border border-neon/30 rounded-xl p-3 text-neon text-sm font-semibold text-center">
                  ✅ Deposit successful!
                </div>
              )}
              <button
                onClick={handleDeposit}
                disabled={depositLoading || !depositAmt}
                className="btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {depositLoading ? (
                  <span className="animate-spin border-2 border-black border-t-transparent rounded-full w-5 h-5" />
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
                  {banks.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
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
              {withdrawDone && (
                <div className="bg-neon/10 border border-neon/30 rounded-xl p-3 text-neon text-sm font-semibold text-center">
                  ✅ Withdrawal request submitted!
                </div>
              )}
              <button
                onClick={handleWithdraw}
                disabled={
                  withdrawLoading ||
                  !withdrawAmt ||
                  parseInt(withdrawAmt) < 1000 ||
                  !bank ||
                  accNum.length < 10 ||
                  state.balance < parseInt(withdrawAmt || "0")
                }
                className="btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {withdrawLoading ? (
                  <span className="animate-spin border-2 border-black border-t-transparent rounded-full w-5 h-5" />
                ) : (
                  "Request Withdrawal →"
                )}
              </button>
            </div>
          </motion.div>
        )}

        {/* Transaction history */}
        <div className="mt-8">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Transaction History</h3>
          <div className="space-y-2">
            {state.transactions.length === 0 && (
              <p className="text-gray-600 text-sm text-center py-4">No transactions yet</p>
            )}
            {state.transactions.map((tx) => (
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
                    <p className="text-xs text-gray-500 mt-0.5">{formatDate(tx.createdAt)}</p>
                  </div>
                </div>
                <span
                  className={`font-bold text-sm ${
                    tx.amount > 0 ? "text-neon" : "text-red-400"
                  }`}
                >
                  {tx.amount > 0 ? "+" : ""}₦{Math.abs(tx.amount).toLocaleString()}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
