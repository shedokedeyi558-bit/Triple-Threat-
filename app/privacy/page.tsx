"use client";

import { motion } from "framer-motion";
import { NavBar } from "@/components/ui/NavBar";
import Link from "next/link";

export default function PrivacyPage() {
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
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">Privacy Policy</h1>
            <p className="text-gray-400 text-lg">Last updated: July 2026</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="prose prose-invert prose-lg max-w-none space-y-8"
          >
            {/* Information Collection */}
            <section className="bg-gray-950/50 border border-gray-800 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-white mb-4">Information We Collect</h2>
              <p className="text-gray-300 leading-relaxed">
                We collect the minimum information needed to run BitLyfe: your phone number, password (encrypted), and gameplay/transaction history. This is used solely to create your account, process deposits/withdrawals, and maintain your game records.
              </p>
            </section>

            {/* What We Store */}
            <section className="bg-gray-950/50 border border-gray-800 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-white mb-4">What We Store</h2>
              <ul className="text-gray-300 leading-relaxed space-y-3">
                <li className="flex gap-3">
                  <span className="text-neon flex-shrink-0">•</span>
                  <span><strong>Account details:</strong> Phone number, password (encrypted), display name</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-neon flex-shrink-0">•</span>
                  <span><strong>Wallet & transactions:</strong> Balance, deposit/withdrawal history</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-neon flex-shrink-0">•</span>
                  <span><strong>Game participation:</strong> Which games you&apos;ve played, answers submitted, winnings earned</span>
                </li>
              </ul>
            </section>

            {/* What We Don't Do */}
            <section className="bg-gray-950/50 border border-gray-800 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-white mb-4">What We Don&apos;t Do</h2>
              <ul className="text-gray-300 leading-relaxed space-y-3">
                <li className="flex gap-3">
                  <span className="text-neon flex-shrink-0">•</span>
                  <span>We don&apos;t sell your data to third parties.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-neon flex-shrink-0">•</span>
                  <span>We don&apos;t share your phone number publicly — leaderboards and activity feeds show masked identifiers only.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-neon flex-shrink-0">•</span>
                  <span>We don&apos;t use your data for marketing or profiling beyond operating the platform.</span>
                </li>
              </ul>
            </section>

            {/* Payments */}
            <section className="bg-gray-950/50 border border-gray-800 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-white mb-4">Payments</h2>
              <p className="text-gray-300 leading-relaxed">
                Payment processing is handled by Paystack, our third-party payment provider. We do not store your card or bank details directly—Paystack handles all sensitive payment information according to their own privacy policy and PCI compliance standards.
              </p>
            </section>

            {/* Your Control */}
            <section className="bg-gray-950/50 border border-gray-800 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-white mb-4">Your Control</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                You have the right to request your account details or to request deletion of your account and associated data.
              </p>
              <p className="text-gray-300 leading-relaxed">
                To exercise these rights, please contact us through our <Link href="/support" className="text-neon hover:text-neon/80 underline">Support page</Link>.
              </p>
            </section>

            {/* Academic Project Notice */}
            <section className="bg-gray-950/50 border border-gray-800 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-white mb-4">Academic Project Notice</h2>
              <p className="text-gray-300 leading-relaxed">
                BitLyfe is currently a student project. Data practices may evolve as the platform develops beyond its current test phase. We will notify users of any significant changes to this policy.
              </p>
            </section>

            {/* Questions */}
            <section className="bg-gray-950/50 border border-gray-800 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-white mb-4">Questions?</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                If you have questions about this Privacy Policy or how we handle your data, please contact us:
              </p>
              <p className="text-[#00FF66] font-semibold">
                Email:{" "}
                <a href="mailto:support@bitlyfe.com" className="underline hover:text-[#00FF66]/80 transition-colors">
                  support@bitlyfe.com
                </a>
              </p>
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
