"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { TrendingUp, Users, Activity, ArrowRight } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { gameApi, removeToken, type RecentWinner } from "@/lib/api";

function WinnerTicker({ winners }: { winners: string[] }) {
  const text = winners.join(" • ") + " • ";
  return (
    <div className="marquee-container w-full py-2.5 sm:py-3 bg-gradient-to-r from-[#0A0A0A] via-[#00FF66]/5 to-[#0A0A0A] border-y border-[#1A1A1A]">
      <div className="marquee-content text-xs sm:text-sm text-[#00FF66] font-medium">
        {text}
      </div>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const { state, dispatch } = useApp();
  const [winnerLines, setWinnerLines] = useState<string[]>([
    "Player won ₦5,000",
    "Player won ₦3,500",
    "Player won ₦8,200",
  ]);
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = () => {
    removeToken();
    dispatch({ type: "LOGOUT" });
    setShowMenu(false);
    router.push("/");
  };

  useEffect(() => {
    gameApi.recentWinners()
      .then((winners: RecentWinner[]) => {
        if (winners.length > 0) {
          setWinnerLines(
            winners.map((w) => `${w.phone.slice(0, 6)}... won ₦${w.prize.toLocaleString()}`)
          );
        }
      })
      .catch(() => {});
  }, []);

  return (
    <main className="min-h-dvh bg-bg flex flex-col">
      {/* Header with profile */}
      <div className="px-4 sm:px-6 py-4 sm:py-6 border-b border-[#1A1A1A] bg-gradient-to-b from-[#111] to-transparent">
        <div className="flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Logo size="sm" />
          </motion.div>
          {state.isAuthenticated && state.player && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-[#2A2A2A] hover:border-neon/50 transition-colors text-xs"
              >
                <div className="w-6 h-6 rounded-full bg-neon/20 flex items-center justify-center">
                  <span className="text-neon text-xs font-bold">
                    {state.player.name?.charAt(0) || "P"}
                  </span>
                </div>
              </button>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute top-full right-0 mt-2 w-40 bg-[#111] border border-[#2A2A2A] rounded-lg shadow-xl z-10"
                >
                  <button
                    onClick={() => router.push("/wallet")}
                    className="w-full text-left px-4 py-2.5 text-xs text-gray-300 hover:bg-[#1A1A1A] transition-colors"
                  >
                    Wallet
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2.5 text-xs text-red-400 hover:bg-[#1A1A1A] transition-colors border-t border-[#2A2A2A]"
                  >
                    Logout
                  </button>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-8 sm:py-12 w-full">
        {/* Hero container - centered with responsive max-width */}
        <div className="w-full max-w-3xl mx-auto">
          {/* Headline */}
          <motion.div
            className="text-center mb-8 sm:mb-12"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-3 sm:mb-4 leading-tight">
              Test Your Skills.<br />
              <span className="text-neon">Win Real Money.</span>
            </h1>
            <p className="text-gray-400 text-sm sm:text-base font-light">
              Answer quick questions and compete in live challenges. Every answer counts.
            </p>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            className="w-full sm:max-w-sm mx-auto space-y-3 mb-10 sm:mb-14"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <Link
              href={state.isAuthenticated ? "/format" : "/auth"}
              className="w-full btn-primary flex items-center justify-center gap-2 py-3 sm:py-3.5 text-sm sm:text-base font-semibold neon-glow"
            >
              Play Games
              <ArrowRight size={18} />
            </Link>
            <Link
              href={state.isAuthenticated ? "/challenges" : "/auth"}
              className="w-full block py-3 sm:py-3.5 px-4 rounded-lg sm:rounded-xl border border-[#2A2A2A] hover:border-neon/50 text-white text-sm sm:text-base font-semibold transition-colors text-center"
            >
              Explore Challenges
            </Link>
          </motion.div>

          {/* Stats section */}
          <motion.div
            className="w-full mb-10 sm:mb-14"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-lg p-3 sm:p-4 text-center hover:border-neon/20 transition-colors">
                <TrendingUp size={18} className="text-neon mx-auto mb-2" />
                <div className="text-white font-bold text-sm sm:text-base">1,240</div>
                <div className="text-gray-500 text-xs mt-1">Active Players</div>
              </div>
              <div className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-lg p-3 sm:p-4 text-center hover:border-neon/20 transition-colors">
                <Activity size={18} className="text-neon mx-auto mb-2" />
                <div className="text-white font-bold text-sm sm:text-base">₦2.3M</div>
                <div className="text-gray-500 text-xs mt-1">Paid Out</div>
              </div>
              <div className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-lg p-3 sm:p-4 text-center hover:border-neon/20 transition-colors">
                <Users size={18} className="text-neon mx-auto mb-2" />
                <div className="text-white font-bold text-sm sm:text-base">89</div>
                <div className="text-gray-500 text-xs mt-1">Online Now</div>
              </div>
            </div>
          </motion.div>

          {/* Balance section (if logged in) */}
          {state.isAuthenticated && state.player && (
            <motion.div
              className="w-full sm:max-w-sm mx-auto mb-10 sm:mb-14"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <div className="bg-gradient-to-br from-[#0A0A0A] to-[#1A1A1A] border border-neon/10 rounded-lg sm:rounded-xl p-4 sm:p-6 text-center">
                <p className="text-gray-400 text-xs sm:text-sm mb-2">Available Balance</p>
                <p className="text-neon font-black text-3xl sm:text-4xl">
                  ₦{state.player.balance.toLocaleString()}
                </p>
                <Link
                  href="/wallet"
                  className="inline-block mt-3 text-xs sm:text-sm text-gray-400 hover:text-neon transition-colors"
                >
                  Add Funds →
                </Link>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Footer: Winners ticker */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <WinnerTicker winners={winnerLines} />
        <div className="text-center py-3 sm:py-4 text-xs text-gray-600 bg-[#0A0A0A]">
          Last 1 hour winners • Minimum stake ₦500
        </div>
      </motion.div>
    </main>
  );
}
