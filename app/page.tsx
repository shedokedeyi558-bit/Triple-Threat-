"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { TrendingUp, Users, Activity, ArrowRight, Brain } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { removeToken } from "@/lib/api";

// Animated background component
function AnimatedBackground() {
  const equations = ["∑ x²", "π", "√2", "∞", "x = -b ± √b²", "∫", "Δ", "∂", "∇", "∈"];
  const numbers = ["42", "273", "1729", "666", "512", "1024", "2048"];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Floating Brain Icons */}
      {[0, 1, 2, 3].map((i) => (
        <motion.div
          key={`brain-${i}`}
          className="absolute"
          initial={{ opacity: 0, y: Math.random() * 100 - 50 }}
          animate={{
            opacity: [0.05, 0.15, 0.05],
            y: [0, -100, 0],
            x: [0, Math.random() * 50 - 25, 0],
          }}
          transition={{
            duration: 8 + i * 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            left: `${15 + i * 20}%`,
            top: `${10 + i * 15}%`,
          }}
        >
          <Brain size={120} className="text-neon" />
        </motion.div>
      ))}

      {/* Floating Equations */}
      {equations.map((eq, i) => (
        <motion.div
          key={`eq-${i}`}
          className="absolute text-neon/20 font-mono text-lg"
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0.1, 0.3, 0.1],
            y: [0, -80, 0],
          }}
          transition={{
            duration: 6 + i,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.3,
          }}
          style={{
            left: `${Math.random() * 80 + 10}%`,
            top: `${Math.random() * 60 + 20}%`,
          }}
        >
          {eq}
        </motion.div>
      ))}

      {/* Floating Numbers */}
      {numbers.map((num, i) => (
        <motion.div
          key={`num-${i}`}
          className="absolute text-neon/15 font-bold text-2xl"
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0.05, 0.2, 0.05],
            y: [0, 100, 0],
            rotate: [0, 360, 0],
          }}
          transition={{
            duration: 10 + i,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.5,
          }}
          style={{
            right: `${Math.random() * 80 + 5}%`,
            bottom: `${Math.random() * 70 + 10}%`,
          }}
        >
          {num}
        </motion.div>
      ))}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0A0A0A]/40" />
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const { state, dispatch } = useApp();
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = () => {
    removeToken();
    dispatch({ type: "LOGOUT" });
    setShowMenu(false);
    router.push("/");
  };

  return (
    <main className="min-h-dvh bg-bg flex flex-col relative overflow-hidden">
      {/* Animated background */}
      <AnimatedBackground />

      {/* Content with z-index to appear above background */}
      <div className="relative z-10 flex flex-col h-full">
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
                {/* Active Players */}
                <motion.div
                  className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-lg p-3 sm:p-4 text-center hover:border-neon/20 transition-colors cursor-pointer"
                  whileHover={{ scale: 1.05, borderColor: "#00FF66" }}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  viewport={{ once: true }}
                >
                  <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 3, repeat: Infinity }}>
                    <TrendingUp size={18} className="text-neon mx-auto mb-2" />
                  </motion.div>
                  <CountupNumber value={1240} />
                  <div className="text-gray-500 text-xs mt-1">Active Players</div>
                </motion.div>

                {/* Paid Out */}
                <motion.div
                  className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-lg p-3 sm:p-4 text-center hover:border-neon/20 transition-colors cursor-pointer"
                  whileHover={{ scale: 1.05, borderColor: "#00FF66" }}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  viewport={{ once: true }}
                >
                  <motion.div animate={{ rotate: [-360, 0] }} transition={{ duration: 3, repeat: Infinity }}>
                    <Activity size={18} className="text-neon mx-auto mb-2" />
                  </motion.div>
                  <div className="text-white font-bold text-sm sm:text-base">₦2.3M</div>
                  <div className="text-gray-500 text-xs mt-1">Paid Out</div>
                </motion.div>

                {/* Online Now */}
                <motion.div
                  className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-lg p-3 sm:p-4 text-center hover:border-neon/20 transition-colors cursor-pointer"
                  whileHover={{ scale: 1.05, borderColor: "#00FF66" }}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  viewport={{ once: true }}
                >
                  <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                    <Users size={18} className="text-neon mx-auto mb-2" />
                  </motion.div>
                  <CountupNumber value={89} />
                  <div className="text-gray-500 text-xs mt-1">Online Now</div>
                </motion.div>
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
      </div>
    </main>
  );
}

// Countup number component
function CountupNumber({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{
        opacity: 1,
        transition: {
          onComplete: () => {
            const increment = Math.ceil(value / 20);
            let current = 0;
            const timer = setInterval(() => {
              current += increment;
              if (current >= value) {
                setDisplayValue(value);
                clearInterval(timer);
              } else {
                setDisplayValue(current);
              }
            }, 30);
          },
        },
      }}
      viewport={{ once: true }}
    >
      <div className="text-white font-bold text-sm sm:text-base">
        {displayValue.toLocaleString()}
      </div>
    </motion.div>
  );
}
