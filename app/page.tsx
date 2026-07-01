"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { Users, Trophy, TrendingUp } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { gameApi, type RecentWinner } from "@/lib/api";
import { recentWinners as fallbackWinners } from "@/lib/mockData";

const stats = [
  { icon: TrendingUp, label: "Played today", value: "342" },
  { icon: Trophy, label: "Paid out today", value: "₦128,400" },
  { icon: Users, label: "Online now", value: "12" },
];

function WinnerTicker({ winners }: { winners: string[] }) {
  const text = winners.join(" • ") + " • ";
  return (
    <div className="marquee-container w-full py-2 bg-[#111] border-y border-[#2A2A2A]">
      <div className="marquee-content text-sm text-yellow-400 font-medium">
        🏆 {text}🏆 {text}
      </div>
    </div>
  );
}

export default function HomePage() {
  const { state } = useApp();
  const [winnerLines, setWinnerLines] = useState<string[]>(fallbackWinners);

  useEffect(() => {
    gameApi.recentWinners()
      .then((winners: RecentWinner[]) => {
        if (winners.length > 0) {
          setWinnerLines(
            winners.map((w) => `${w.phone} won ₦${w.prize.toLocaleString()}`)
          );
        }
      })
      .catch(() => { /* keep fallback */ });
  }, []);

  return (
    <main className="min-h-dvh flex flex-col bg-bg">
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

        {state.isAuthenticated && state.player && (
          <motion.div
            className="mt-6 w-full max-w-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <div className="bg-card border border-[#2A2A2A] rounded-xl px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">Your balance</p>
                <p className="text-neon font-bold text-xl">₦{state.player.balance.toLocaleString()}</p>
              </div>
              <Link href="/wallet" className="text-sm text-gray-400 underline">
                Top up
              </Link>
            </div>
          </motion.div>
        )}
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
        <WinnerTicker winners={winnerLines} />
        <p className="text-center text-xs text-gray-600 py-2">
          Entry fee ₦500 · Win up to ₦5,000
        </p>
      </motion.div>
    </main>
  );
}
