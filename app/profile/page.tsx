"use client";

import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { removeToken } from "@/lib/api";
import Link from "next/link";
import { motion } from "framer-motion";
import { LogOut, Wallet, Shield, FileText, ChevronRight, Phone, Trophy, Zap, Target } from "lucide-react";

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

  const initials = player?.name
    ? player.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : player?.phone?.slice(-2) ?? "??";

  return (
    <div className="max-w-2xl mx-auto px-4 lg:px-8 py-6 space-y-5">

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-gradient-to-br from-[#141414] to-[#0D0D0D] border border-[#1E1E1E] rounded-2xl p-6 overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-48 h-48 bg-neon/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-neon/10 border border-neon/20 flex items-center justify-center flex-shrink-0">
            <span className="text-neon font-black text-xl">{initials}</span>
          </div>
          <div>
            <p className="text-white font-black text-xl leading-tight">{player?.name || "Player"}</p>
            <p className="text-gray-500 text-sm mt-0.5">{player?.phone}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-[#1E1E1E]">
          {[
            { icon: <Trophy size={14} className="text-yellow-400" />, label: "Games Played", value: "—" },
            { icon: <Zap size={14} className="text-neon" />, label: "Total Won", value: "—" },
            { icon: <Target size={14} className="text-blue-400" />, label: "Win Rate", value: "—" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="flex items-center justify-center mb-1">{stat.icon}</div>
              <p className="text-white font-black text-lg">{stat.value}</p>
              <p className="text-gray-600 text-[10px] uppercase tracking-wider mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Account */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-[#111] border border-[#1E1E1E] rounded-2xl overflow-hidden"
      >
        <p className="text-[11px] text-gray-600 uppercase tracking-widest font-bold px-5 pt-4 pb-2">Account</p>
        <Link href="/wallet" className="flex items-center gap-4 px-5 py-4 hover:bg-[#1A1A1A] transition-colors border-t border-[#1A1A1A]">
          <div className="w-9 h-9 rounded-xl bg-neon/10 flex items-center justify-center flex-shrink-0">
            <Wallet size={16} className="text-neon" />
          </div>
          <div className="flex-1">
            <p className="text-white font-semibold text-sm">Wallet</p>
            <p className="text-gray-500 text-xs mt-0.5">Deposit, withdraw, transaction history</p>
          </div>
          <ChevronRight size={15} className="text-gray-600" />
        </Link>
        <div className="flex items-center gap-4 px-5 py-4 border-t border-[#1A1A1A]">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
            <Phone size={16} className="text-blue-400" />
          </div>
          <div className="flex-1">
            <p className="text-white font-semibold text-sm">Phone Number</p>
            <p className="text-gray-400 text-xs mt-0.5">{player?.phone}</p>
          </div>
        </div>
      </motion.div>

      {/* More */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-[#111] border border-[#1E1E1E] rounded-2xl overflow-hidden"
      >
        <p className="text-[11px] text-gray-600 uppercase tracking-widest font-bold px-5 pt-4 pb-2">Legal</p>
        <Link href="/terms" className="flex items-center gap-4 px-5 py-4 hover:bg-[#1A1A1A] transition-colors border-t border-[#1A1A1A]">
          <div className="w-9 h-9 rounded-xl bg-[#1A1A1A] flex items-center justify-center flex-shrink-0">
            <FileText size={16} className="text-gray-500" />
          </div>
          <div className="flex-1">
            <p className="text-white font-semibold text-sm">Terms of Service</p>
          </div>
          <ChevronRight size={15} className="text-gray-600" />
        </Link>
        <div className="flex items-center gap-4 px-5 py-4 border-t border-[#1A1A1A]">
          <div className="w-9 h-9 rounded-xl bg-[#1A1A1A] flex items-center justify-center flex-shrink-0">
            <Shield size={16} className="text-gray-500" />
          </div>
          <div className="flex-1">
            <p className="text-white font-semibold text-sm">Privacy Policy</p>
          </div>
          <ChevronRight size={15} className="text-gray-600" />
        </div>
      </motion.div>

      {/* Logout — shown on mobile only since sidebar has it on desktop */}
      <motion.button
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        onClick={handleLogout}
        className="lg:hidden w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl border border-red-900/30 text-red-400 font-bold text-sm hover:bg-red-900/10 transition-colors"
      >
        <LogOut size={16} />
        Log Out
      </motion.button>

      <p className="text-center text-gray-700 text-xs pb-2">BitLyfe © 2026 · All rights reserved</p>
    </div>
  );
}
