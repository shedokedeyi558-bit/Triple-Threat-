"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useApp } from "@/context/AppContext";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { motion } from "framer-motion";
import { Pill, Clock } from "lucide-react";

export default function LandingPage() {
  const { state } = useApp();
  const router = useRouter();

  // Redirect to /play if already authenticated
  useEffect(() => {
    if (state.isAuthenticated) {
      router.push("/play");
    }
  }, [state.isAuthenticated, router]);

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" },
    },
  };

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white flex flex-col">
      {/* Header */}
      <header className="px-4 sm:px-6 py-6">
        <Logo size="md" />
      </header>

      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex-1 px-4 sm:px-6 py-12 flex flex-col justify-center"
      >
        <div className="max-w-2xl mx-auto w-full space-y-12">
          {/* Tagline */}
          <div className="text-center space-y-4">
            <p className="text-gray-400 text-lg">Play smart. Win real.</p>
          </div>

          {/* Game Cards */}
          <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-2 md:gap-6">
            {/* Pills Card */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.1 }}
              className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-6 flex flex-col gap-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-2">Pills</h2>
                  <p className="text-gray-400 text-sm">
                    Pick a pill. Answer fast. Win instantly.
                  </p>
                </div>
                <div className="p-3 bg-[#0A0A0A] rounded-xl">
                  <Pill size={24} className="text-neon" />
                </div>
              </div>
              <Link
                href="/auth"
                className="bg-neon text-black font-bold py-3 px-4 rounded-lg hover:bg-neon/90 transition-colors text-center"
              >
                Get Started
              </Link>
            </motion.div>

            {/* Time Machine Card */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.2 }}
              className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-6 flex flex-col gap-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-2">Time Machine</h2>
                  <p className="text-gray-400 text-sm">
                    Predict the future. Win when you&apos;re right.
                  </p>
                </div>
                <div className="p-3 bg-[#0A0A0A] rounded-xl">
                  <Clock size={24} className="text-neon" />
                </div>
              </div>
              <Link
                href="/auth"
                className="bg-neon text-black font-bold py-3 px-4 rounded-lg hover:bg-neon/90 transition-colors text-center"
              >
                Get Started
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="px-4 sm:px-6 py-8 border-t border-[#2A2A2A]">
        <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <p>© 2026 BitLyfe</p>
          <div className="flex gap-6">
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms
            </Link>
            <a href="mailto:support@bitlyfe.com" className="hover:text-white transition-colors">
              support@bitlyfe.com
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
