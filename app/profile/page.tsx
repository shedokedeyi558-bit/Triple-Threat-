"use client";

import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { removeToken } from "@/lib/api";
import Link from "next/link";
import { ArrowLeft, LogOut } from "lucide-react";
import { motion } from "framer-motion";

export default function ProfilePage() {
  const { state, dispatch } = useApp();
  const router = useRouter();

  const handleLogout = async () => {
    // Clear token
    removeToken();
    // Dispatch logout action
    dispatch({ type: "LOGOUT" });
    // Clear localStorage
    localStorage.removeItem("tt_player");
    // Redirect to home
    router.push("/");
  };

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-black/50 backdrop-blur-md border-b border-[#2A2A2A] px-4 sm:px-6 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <h1 className="font-black text-xl uppercase tracking-tight">Profile</h1>
          <Link
            href="/play"
            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
            title="Go back to games"
          >
            <ArrowLeft size={20} />
          </Link>
        </div>
      </header>

      {/* Content */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-lg mx-auto px-4 py-12 space-y-6"
      >
        {/* Player Info */}
        {state.player && (
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-6 space-y-4">
            <div>
              <p className="text-gray-400 text-sm mb-1">Phone Number</p>
              <p className="text-xl font-bold text-white">{state.player.phone}</p>
            </div>
            {state.player.name && (
              <div>
                <p className="text-gray-400 text-sm mb-1">Name</p>
                <p className="text-xl font-bold text-white">{state.player.name}</p>
              </div>
            )}
            <div>
              <p className="text-gray-400 text-sm mb-1">Balance</p>
              <p className="text-2xl font-bold text-neon">
                ₦{state.player.balance.toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link
            href="/wallet"
            className="block w-full py-4 px-4 bg-neon text-black font-bold rounded-xl hover:bg-neon/90 transition-colors text-center"
          >
            Manage Wallet
          </Link>

          <button
            onClick={handleLogout}
            className="w-full py-4 px-4 bg-red-600/20 border border-red-600/50 text-red-400 font-bold rounded-xl hover:bg-red-600/30 transition-colors flex items-center justify-center gap-2"
          >
            <LogOut size={20} />
            Log Out
          </button>
        </div>

        {/* Info */}
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-6 text-sm text-gray-400 space-y-3">
          <p>BitLyfe © 2026. All rights reserved.</p>
          <Link href="/terms" className="text-neon hover:underline">
            Terms of Service
          </Link>
        </div>
      </motion.section>
    </main>
  );
}
