"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { WinnersTicker } from "@/components/ui/WinnersTicker";
import { Users, Trophy, TrendingUp } from "lucide-react";
import { useApp } from "@/context/AppContext";

const stats = [
  { icon: TrendingUp, label: "Played today", value: "342" },
  { icon: Trophy, label: "Paid out today", value: "₦128,400" },
  { icon: Users, label: "Online now", value: "12" },
];

export default function HomePage() {
  const { state } = useApp();

  return (
    <main className="min-h-dvh flex flex-col bg-bg">
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 pt-12 pb-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Logo size="lg" />
        </motion.div>

        <motion.p
          className="mt-4 text-gray-400 text-base font-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Three doors. Three questions. One shot.
        </motion.p>

        <motion.div
          className="mt-8 w-full max-w-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Link
            href={state.isAuthenticated ? "/format" : "/auth"}
            className="btn-primary block text-center neon-glow"
          >
            🎮 Play Now
          </Link>
        </motion.div>

        {/* Live stats */}
        <motion.div
          className="mt-8 w-full max-w-sm grid grid-cols-3 gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {stats.map(({ icon: Icon, label, value }) => (
            <div key={label} className="bg-card border border-[#2A2A2A] rounded-xl p-3 text-center">
              <Icon size={18} className="text-neon mx-auto mb-1" />
              <div className="text-white font-bold text-sm">{value}</div>
              <div className="text-gray-500 text-xs mt-0.5 leading-tight">{label}</div>
            </div>
          ))}
        </motion.div>

        {/* Wallet shortcut if logged in */}
        {state.isAuthenticated && (
          <motion.div
            className="mt-6 w-full max-w-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <div className="bg-card border border-[#2A2A2A] rounded-xl px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">Your balance</p>
                <p className="text-neon font-bold text-xl">₦{state.balance.toLocaleString()}</p>
              </div>
              <Link href="/wallet" className="text-sm text-gray-400 underline">
                Top up
              </Link>
            </div>
          </motion.div>
        )}
      </div>

      {/* Winners ticker */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        <WinnersTicker />
        <p className="text-center text-xs text-gray-600 py-2">
          Entry fee ₦500 · Win up to ₦5,000
        </p>
      </motion.div>
    </main>
  );
}
