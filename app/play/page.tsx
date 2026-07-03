"use client";

import { useApp } from "@/context/AppContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Logo } from "@/components/ui/Logo";
import { BottomNavigation } from "@/components/ui/BottomNavigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { Pill, Clock } from "lucide-react";

export default function PlayPage() {
  const { state } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!state.isAuthenticated) {
      router.push("/auth");
    }
  }, [state.isAuthenticated, router]);

  if (!state.isAuthenticated) return null;

  const containerVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" },
    },
  };

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white pb-32">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-black/50 backdrop-blur-md border-b border-[#2A2A2A] px-4 sm:px-6 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-black text-xl uppercase tracking-tight">Select Game</h1>
            <p className="text-xs text-gray-500 mt-1">Choose your game mode</p>
          </div>
          <Link
            href="/wallet"
            className="px-3 py-2 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] text-neon font-semibold text-sm hover:border-neon/40 transition-colors"
          >
            ₦{state.player?.balance.toLocaleString()}
          </Link>
        </div>
      </header>

      {/* Content */}
      <section className="max-w-lg mx-auto px-4 py-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          {/* Pills Card */}
          <Link href="/pills">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-6 cursor-pointer hover:border-neon/40 transition-colors group min-h-[140px] flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start gap-4 mb-3">
                  <div className="p-3 rounded-xl bg-neon/10 group-hover:bg-neon/20 transition-colors">
                    <Pill className="text-neon" size={32} />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-white">Pills</h2>
                    <p className="text-sm text-gray-500 mt-1">Quick answers</p>
                  </div>
                </div>
              </div>
              <p className="text-gray-400 text-sm">
                Pick a pill. Answer fast. Win instantly.
              </p>
            </motion.div>
          </Link>

          {/* Time Machine Card */}
          <Link href="/time-machine">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-6 cursor-pointer hover:border-neon/40 transition-colors group min-h-[140px] flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start gap-4 mb-3">
                  <div className="p-3 rounded-xl bg-neon/10 group-hover:bg-neon/20 transition-colors">
                    <Clock className="text-neon" size={32} />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-white">Time Machine</h2>
                    <p className="text-sm text-gray-500 mt-1">Make predictions</p>
                  </div>
                </div>
              </div>
              <p className="text-gray-400 text-sm">
                Predict the future. Win when you&apos;re right.
              </p>
            </motion.div>
          </Link>
        </motion.div>
      </section>

      <BottomNavigation />
    </main>
  );
}
