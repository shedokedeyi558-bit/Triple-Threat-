"use client";

import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { removeToken, playerApi, referralApi, ApiError, type ReferralStats } from "@/lib/api";
import Link from "next/link";
import { motion } from "framer-motion";
import { LogOut, Wallet, Shield, FileText, ChevronRight, Phone, AlertCircle, Loader2, Users, Copy, Check } from "lucide-react";
import { useState, useEffect } from "react";

export default function ProfilePage() {
  const { state, dispatch } = useApp();
  const router = useRouter();
  const [dailyLimit, setDailyLimit] = useState<string>("");
  const [weeklyLimit, setWeeklyLimit] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [saveError, setSaveError] = useState("");
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    referralApi.getStats().then(setReferralStats).catch(() => {});
  }, []);

  const handleLogout = () => {
    removeToken();
    dispatch({ type: "LOGOUT" });
    localStorage.removeItem("tt_player");
    router.push("/");
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(`https://bitlyfe.app/auth?ref=${code}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleWhatsAppShare = (code: string) => {
    const text = encodeURIComponent(
      `Win real Naira on BitLyfe! Play trivia pills, make predictions and compete in live tournaments. Join with my link and get ₦200 bonus credit on your first game:\nhttps://bitlyfe.app/auth?ref=${code}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
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

        {/* Referrals — spans full width */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="lg:col-span-2 bg-[#111] border border-[#1E1E1E] rounded-2xl p-5 space-y-4"
        >
          <div className="flex items-center gap-2">
            <Users size={15} style={{ color: "var(--accent-amber)" }} />
            <p className="text-[11px] text-gray-600 uppercase tracking-widest font-bold">Referrals</p>
          </div>

          {referralStats ? (
            <>
              {/* Referral code + copy */}
              <div className="rounded-xl p-4 border flex items-center justify-between gap-3"
                style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border-subtle)" }}>
                <div className="min-w-0">
                  <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-1">Your referral link</p>
                  <p className="text-sm font-mono font-bold truncate" style={{ color: "var(--accent-amber)" }}>
                    bitlyfe.app/auth?ref={referralStats.referral_code}
                  </p>
                  <p className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>
                    Friends who join earn you ₦200 bonus credit, usable on any game
                  </p>
                </div>
                <button
                  onClick={() => handleCopyCode(referralStats.referral_code)}
                  className="flex-shrink-0 p-2 rounded-lg transition-colors"
                  style={{ backgroundColor: copied ? "rgba(76,111,255,0.15)" : "rgba(76,111,255,0.1)", color: "var(--accent-indigo)" }}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>

              {/* WhatsApp share */}
              <button
                onClick={() => handleWhatsAppShare(referralStats.referral_code)}
                className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all"
                style={{ backgroundColor: "#25D366", color: "#fff" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Share on WhatsApp
              </button>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Referred", value: referralStats.referred_count, color: "var(--text-primary)" },
                  { label: "Pending", value: referralStats.pending_count, color: "var(--accent-amber)" },
                  { label: "Earned", value: `₦${referralStats.total_earned.toLocaleString()}`, color: "var(--accent-amber)" },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl p-3 text-center border" style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border-hairline)" }}>
                    <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-1">{s.label}</p>
                    <p className="font-black text-base font-mono" style={{ color: s.color }}>{s.value}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <div className="skeleton w-full h-20 rounded-xl" />
            </div>
          )}
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
