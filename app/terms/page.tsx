"use client";

import { motion } from "framer-motion";
import { NavBar } from "@/components/ui/NavBar";
import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-dvh bg-[#0A0A0A] flex flex-col">
      <NavBar />

      <main className="flex-1 px-4 sm:px-6 py-8 sm:py-12">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">Terms of Service</h1>
            <p className="text-gray-400 text-lg">Last updated: July 2026</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="prose prose-invert prose-lg max-w-none space-y-8"
          >
            {/* Overview */}
            <section className="bg-gray-950/50 border border-gray-800 rounded-xl p-6">
              <p className="text-gray-300 leading-relaxed">
                BitLyfe is a skill-and-prediction gaming platform built as a student project. By creating an account, you agree to the following terms:
              </p>
            </section>

            {/* Eligibility */}
            <section className="bg-gray-950/50 border border-gray-800 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-white mb-4">Eligibility</h2>
              <p className="text-gray-300 leading-relaxed">
                You must be 18 or older to deposit funds or participate in paid games.
              </p>
            </section>

            {/* How the Games Work */}
            <section className="bg-gray-950/50 border border-gray-800 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-white mb-4">How the Games Work</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                Pills, Time Machine, and Blitz are described in full on our How It Works page. Entry fees and prizes are clearly shown before you commit to any game.
              </p>
              <Link href="/#how-it-works" className="text-neon hover:text-neon/80 underline inline-block">
                View How It Works →
              </Link>
            </section>

            {/* Payments */}
            <section className="bg-gray-950/50 border border-gray-800 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-white mb-4">Payments</h2>
              <p className="text-gray-300 leading-relaxed">
                Deposits and withdrawals are processed through Paystack. This platform is currently operating in test mode as part of an academic project; no real transactions are being processed at this time.
              </p>
            </section>

            {/* Fair Play */}
            <section className="bg-gray-950/50 border border-gray-800 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-white mb-4">Fair Play</h2>
              <p className="text-gray-300 leading-relaxed">
                Attempting to exploit bugs, use multiple accounts to gain unfair advantage, or interfere with other players&apos; ability to play fairly may result in account suspension.
              </p>
            </section>

            {/* Account Balance */}
            <section className="bg-gray-950/50 border border-gray-800 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-white mb-4">Account Balance</h2>
              <p className="text-gray-300 leading-relaxed">
                Your wallet balance reflects funds available for entry fees and prizes. We aim to process withdrawal requests promptly, subject to admin review.
              </p>
            </section>

            {/* Changes */}
            <section className="bg-gray-950/50 border border-gray-800 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-white mb-4">Changes</h2>
              <p className="text-gray-300 leading-relaxed">
                These terms may be updated as the platform evolves. Continued use after changes means you accept the update.
              </p>
            </section>

            {/* Contact */}
            <section className="bg-gray-950/50 border border-gray-800 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-white mb-4">Contact</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                Questions about these terms can be sent through our Support page.
              </p>
              <Link href="/support" className="text-neon hover:text-neon/80 underline inline-block">
                Go to Support →
              </Link>
            </section>
          </motion.div>

          {/* Back to home button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-12 text-center"
          >
            <Link
              href="/"
              className="inline-block px-8 py-3 bg-[#00FF66] text-black font-bold rounded-lg hover:bg-[#00FF66]/90 transition-colors"
            >
              Back to Home
            </Link>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
