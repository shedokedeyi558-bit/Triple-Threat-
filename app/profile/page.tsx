"use client";

import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { removeToken, playerApi, ApiError } from "@/lib/api";
import Link from "next/link";
import { motion } from "framer-motion";
import { LogOut, Wallet, Shield, FileText, ChevronRight, Phone, AlertCircle, Loader2 } from "lucide-react";
import { useState } from "react";

export default function ProfilePage() {
  const { state, dispatch } = useApp();
  const router = useRouter();
  const [dailyLimit, setDailyLimit] = useState<string>("");
  const [weeklyLimit, setWeeklyLimit] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [saveError, setSaveError] = useState("");

  const handleLogout = () => {
    removeToken();
    dispatch({ type: "LOGOUT" });
    localStorage.removeItem("tt_player");
    router.push("/");
  };

  const handleSaveLimits = async () => {
    setSaveError("");
    setSaveMsg("");
    const daily = dailyLimit ? Number(dailyLimit) : null;
    const weekly = weeklyLimit ? Number(weeklyLimit) : null;
    
    if ((daily && daily <= 0) || (weekly && weekly <= 0)) {
      setSaveError("Limits must be greater than 0");
      return;
    }
    
    setSaving(true);
    try {
      await playerApi.setPlayLimits(daily, weekly);
      setSaveMsg("Limits saved");
      setTimeout(() => setSaveMsg(""), 3000);
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : "Failed to save limits");
    } finally {
      setSaving(false);
    }
  };

  const player = state.player;

  return (
    <div className="px-4 lg:px-8 py-6 max-w-5xl mx-auto w-full">

      {/* Top row: title + logout */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-white font-black text-xl">{player?.name || "Player"}</p>
          <p className="text-gray-500 text-sm mt-0.5">{player?.phone}</p>
        </div>
        <button
          onClick={handleLogout}
          className="hidden lg:flex items-center gap-2 text-red-400 text-sm font-semibold hover:text-red-300 transition-colors"
        >
          <LogOut size={15} /> Log Out
        </button>
      </div>

      {/* 2-col grid on desktop, single col on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Account */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#111] border border-[#1E1E1E] rounded-2xl overflow-hidden"
        >
          <p className="text-[11px] text-gray-600 uppercase tracking-widest font-bold px-5 pt-4 pb-2">Account</p>
          <Link href="/wallet" className="flex items-center gap-4 px-5 py-4 hover:bg-[#1A1A1A] transition-colors border-t border-[#1A1A1A]">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: "rgba(76,111,255,0.1)" }}>
              <Wallet size={17} style={{ color: "var(--accent-indigo)" }} />
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold">Wallet</p>
              <p className="text-gray-500 text-xs mt-0.5">Deposit, withdraw, transaction history</p>
            </div>
            <ChevronRight size={16} className="text-gray-600" />
          </Link>
          <div className="flex items-center gap-4 px-5 py-4 border-t border-[#1A1A1A]">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
              <Phone size={17} className="text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold">Phone Number</p>
              <p className="text-gray-400 text-xs mt-0.5">{player?.phone}</p>
            </div>
          </div>
        </motion.div>

        {/* Legal */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-[#111] border border-[#1E1E1E] rounded-2xl overflow-hidden"
        >
          <p className="text-[11px] text-gray-600 uppercase tracking-widest font-bold px-5 pt-4 pb-2">Legal</p>
          <Link href="/terms" className="flex items-center gap-4 px-5 py-4 hover:bg-[#1A1A1A] transition-colors border-t border-[#1A1A1A]">
            <div className="w-10 h-10 rounded-xl bg-[#1A1A1A] flex items-center justify-center flex-shrink-0">
              <FileText size={17} className="text-gray-500" />
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold">Terms of Service</p>
              <p className="text-gray-500 text-xs mt-0.5">Read our terms and conditions</p>
            </div>
            <ChevronRight size={16} className="text-gray-600" />
          </Link>
          <div className="flex items-center gap-4 px-5 py-4 border-t border-[#1A1A1A] hover:bg-[#1A1A1A] transition-colors cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-[#1A1A1A] flex items-center justify-center flex-shrink-0">
              <Shield size={17} className="text-gray-500" />
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold">Privacy Policy</p>
              <p className="text-gray-500 text-xs mt-0.5">How we handle your data</p>
            </div>
            <ChevronRight size={16} className="text-gray-600" />
          </div>
        </motion.div>

        {/* Play Limits */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 bg-[#111] border border-[#1E1E1E] rounded-2xl p-5 space-y-4"
        >
          <p className="text-[11px] text-gray-600 uppercase tracking-widest font-bold">Play Limits</p>
          <p className="text-gray-500 text-sm">Set optional daily and weekly spending limits to manage your gameplay.</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-gray-500 text-xs mb-1.5 block uppercase tracking-widest font-bold">Daily Limit (₦)</label>
              <input
                type="number"
                placeholder="Optional"
                value={dailyLimit}
                onChange={(e) => setDailyLimit(e.target.value)}
                className="w-full bg-[#0A0A0A] border border-[#1E1E1E] rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-[#4C6FFF]/40 placeholder:text-gray-700"
              />
            </div>
            <div>
              <label className="text-gray-500 text-xs mb-1.5 block uppercase tracking-widest font-bold">Weekly Limit (₦)</label>
              <input
                type="number"
                placeholder="Optional"
                value={weeklyLimit}
                onChange={(e) => setWeeklyLimit(e.target.value)}
                className="w-full bg-[#0A0A0A] border border-[#1E1E1E] rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-[#4C6FFF]/40 placeholder:text-gray-700"
              />
            </div>
          </div>

          {saveError && (
            <div className="flex items-center gap-2 text-red-400 text-xs bg-red-900/10 border border-red-900/30 rounded-lg p-2.5">
              <AlertCircle size={14} className="flex-shrink-0" />
              {saveError}
            </div>
          )}

          {saveMsg && (
            <div className="flex items-center gap-2 text-[#4C6FFF] text-xs bg-[#4C6FFF]/10 border border-[#4C6FFF]/30 rounded-lg p-2.5">
              ✓ {saveMsg}
            </div>
          )}

          <button
            onClick={handleSaveLimits}
            disabled={saving || (!dailyLimit && !weeklyLimit)}
            className="w-full py-2.5 rounded-lg font-bold text-sm disabled:opacity-40 transition-opacity flex items-center justify-center gap-2"
            style={{ backgroundColor: "#4C6FFF", color: "#042C53" }}
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : null}
            {saving ? "Saving..." : "Save Limits"}
          </button>
        </motion.div>

        {/* About — spans full width */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="lg:col-span-2 bg-[#111] border border-[#1E1E1E] rounded-2xl p-5"
        >
          <p className="text-[11px] text-gray-600 uppercase tracking-widest font-bold mb-3">About BitLyfe</p>
          <p className="text-gray-500 text-sm leading-relaxed">
            BitLyfe is a real-money trivia and prediction platform. Pick a pill, answer fast, predict the future — and win real Naira instantly.
          </p>
          <p className="text-gray-700 text-xs mt-4">Version 1.0.0 · BitLyfe © 2026</p>
        </motion.div>

      </div>

      {/* Logout — mobile only */}
      <motion.button
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        onClick={handleLogout}
        className="lg:hidden mt-5 w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl border border-red-900/30 text-red-400 font-bold text-sm hover:bg-red-900/10 transition-colors"
      >
        <LogOut size={16} /> Log Out
      </motion.button>

    </div>
  );
}
