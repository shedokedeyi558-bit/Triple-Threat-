"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-dvh flex flex-col" style={{ backgroundColor: "var(--bg-base)" }}>
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b flex items-center gap-3 px-4 sm:px-6 py-4" style={{ borderColor: "var(--border-hairline)", backgroundColor: "var(--bg-base)" }}>
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <Image src="/bitlyfe-mark.svg" alt="BitLyfe" width={28} height={28} />
          <span className="font-headline text-base font-semibold" style={{ color: "var(--text-primary)" }}>bitlyfe</span>
        </Link>
        <div className="flex-1" />
        <Link href="/" className="flex items-center gap-1 text-sm font-medium transition-colors hover:opacity-80" style={{ color: "var(--text-secondary)" }}>
          <ArrowLeft size={16} /> Back
        </Link>
      </header>

      <main className="flex-1 px-4 sm:px-6 py-8 sm:py-12">
        <div className="max-w-2xl mx-auto space-y-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <p className="font-mono text-xs tracking-widest mb-2" style={{ color: "var(--accent-indigo)" }}>LEGAL</p>
            <h1 className="font-headline text-3xl sm:text-4xl font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Privacy Policy</h1>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Last updated: July 2026</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-xl p-5 border"
            style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-card)" }}
          >
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              We collect the minimum information needed to run BitLyfe: your phone number, password (encrypted), and gameplay/transaction history.
            </p>
          </motion.div>

          {[
            {
              title: "What We Store",
              items: [
                "Account details: phone number, password (encrypted), display name",
                "Wallet and transactions: balance, deposit/withdrawal history",
                "Game participation: which games you\u2019ve played, answers submitted, winnings earned",
              ],
            },
            {
              title: "What We Don\u2019t Do",
              items: [
                "We don\u2019t sell your data to third parties.",
                "We don\u2019t share your phone number publicly \u2014 leaderboards and activity feeds show masked identifiers only.",
                "We don\u2019t use your data for marketing or profiling beyond operating the platform.",
              ],
            },
          ].map((section, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              className="rounded-xl p-5 border"
              style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-card)" }}
            >
              <h2 className="font-headline font-semibold text-base mb-3" style={{ color: "var(--text-primary)" }}>
                {section.title}
              </h2>
              <ul className="space-y-2">
                {section.items.map((item, j) => (
                  <li key={j} className="flex gap-2 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    <span className="flex-shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "var(--accent-indigo)" }} />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}

          {[
            {
              title: "Payments",
              body: "Payment processing is handled by Paystack, our third-party payment provider. We do not store your card or bank details directly\u2014Paystack handles all sensitive payment information according to their own privacy policy and PCI compliance standards.",
            },
            {
              title: "Your Control",
              bodyNode: (
                <>
                  You have the right to request your account details or to request deletion of your account and associated data. To exercise these rights, contact us through our{" "}
                  <Link href="/support" className="underline font-medium" style={{ color: "var(--accent-indigo)" }}>
                    Support page
                  </Link>
                  .
                </>
              ),
            },
            {
              title: "Academic Project Notice",
              body: "BitLyfe is currently a student project. Data practices may evolve as the platform develops beyond its current test phase. We will notify users of any significant changes to this policy.",
            },
            {
              title: "Questions?",
              bodyNode: (
                <>
                  Contact us at{" "}
                  <a href="mailto:support@bitlyfe.com" className="underline font-medium" style={{ color: "var(--accent-indigo)" }}>
                    support@bitlyfe.com
                  </a>
                  .
                </>
              ),
            },
          ].map((section, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.05 }}
              className="rounded-xl p-5 border"
              style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-card)" }}
            >
              <h2 className="font-headline font-semibold text-base mb-2" style={{ color: "var(--text-primary)" }}>
                {section.title}
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {"bodyNode" in section ? section.bodyNode : section.body}
              </p>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}
