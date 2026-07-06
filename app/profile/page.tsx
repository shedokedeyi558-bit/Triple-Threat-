"use client";

import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { removeToken } from "@/lib/api";
import Link from "next/link";
import { motion } from "framer-motion";
import { LogOut, Wallet, Shield, FileText, ChevronRight, Phone } from "lucide-react";

export default function ProfilePage() {
  const { state, dispatch } = useApp();
  const router = useRouter();

  const handleLogout = () => {
    removeToken();
    dispatch({ type: "LOGOUT" });
    localStorage.removeItem("tt_player");
    router.push("/");
  };

  const player = state.player;

  return (
    <div className="h-full px-4 lg:px-8 py-6">

      {/* Desktop: logout top-right */}
      <div className="hidden lg:flex justify-end mb-4">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-red-400 text-sm font-semibold hover:text-red-300 transition-colors"
        >
          <LogOut size={15} /> Log Out
        </button>
      </div>
      {/* On desktop: 2-col. On mobile: single col */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">

        {/* ── LEFT COL: Hero + Stats ── */}
        <div className="lg:col-span-1 space-y-5">

          {/* Logout — mobile only */}
          <motion.button
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onClick={handleLogout}
            className="lg:hidden w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl border border-red-900/30 text-red-400 font-bold text-sm hover:bg-red-900/10 transition-colors"
          >
            <LogOut size={16} /> Log Out
          </motion.button>
        </div>

        {/* ── RIGHT COL: Settings rows ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Account */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 }}
            className="bg-[#111] border border-[#1E1E1E] rounded-2xl overflow-hidden"
          >
            <p className="text-[11px] text-gray-600 uppercase tracking-widest font-bold px-5 pt-4 pb-2">Account</p>
            <Link href="/wallet" className="flex items-center gap-4 px-5 py-4 hover:bg-[#1A1A1A] transition-colors border-t border-[#1A1A1A]">
              <div className="w-10 h-10 rounded-xl bg-neon/10 flex items-center justify-center flex-shrink-0">
                <Wallet size={17} className="text-neon" />
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
            transition={{ delay: 0.1 }}
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

          {/* About */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.14 }}
            className="bg-[#111] border border-[#1E1E1E] rounded-2xl p-5"
          >
            <p className="text-[11px] text-gray-600 uppercase tracking-widest font-bold mb-3">About BitLyfe</p>
            <p className="text-gray-500 text-sm leading-relaxed">
              BitLyfe is a real-money trivia and prediction platform. Pick a pill, answer fast, predict the future — and win real Naira instantly.
            </p>
            <p className="text-gray-700 text-xs mt-4">Version 1.0.0 · BitLyfe © 2026</p>
          </motion.div>

          {/* Logout — mobile only */}
          <motion.button
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            onClick={handleLogout}
            className="lg:hidden w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl border border-red-900/30 text-red-400 font-bold text-sm hover:bg-red-900/10 transition-colors"
          >
            <LogOut size={16} /> Log Out
          </motion.button>

        </div>
      </div>
    </div>
  );
}
