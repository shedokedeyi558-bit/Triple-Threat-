"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
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
            <h1 className="font-headline text-3xl sm:text-4xl font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Terms of Service</h1>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Last updated: July 2026</p>
          </motion.div>

          {[
            {
              title: null,
              body: "BitLyfe is a skill-and-prediction gaming platform built as a student project. By creating an account, you agree to the following terms:",
            },
            {
              title: "Eligibility",
              body: "You must be 18 or older to deposit funds or participate in paid games.",
            },
            {
              title: "How the Games Work",
              body: null,
              bodyNode: (
                <>
                  Pills, Time Machine, and Blitz are described in full on our{" "}
                  <Link href="/#how-it-works" className="underline font-medium" style={{ color: "var(--accent-indigo)" }}>
                    How It Works
                  </Link>{" "}
                  page. Entry fees and prizes are clearly shown before you commit to any game.
                </>
              ),
            },
            {
              title: "Payments",
              body: "Deposits and withdrawals are processed through Paystack. This platform is currently operating in test mode as part of an academic project; no real transactions are being processed at this time.",
            },
            {
              title: "Fair Play",
              body: "Attempting to exploit bugs, use multiple accounts to gain unfair advantage, or interfere with other players\u2019 ability to play fairly may result in account suspension.",
            },
            {
              title: "Account Balance",
              body: "Your wallet balance reflects funds available for entry fees and prizes. We aim to process withdrawal requests promptly, subject to admin review.",
            },
            {
              title: "Changes",
              body: "These terms may be updated as the platform evolves. Continued use after changes means you accept the update.",
            },
            {
              title: "Contact",
              body: null,
              bodyNode: (
                <>
                  Questions about these terms can be sent through our{" "}
                  <Link href="/support" className="underline font-medium" style={{ color: "var(--accent-indigo)" }}>
                    Support page
                  </Link>
                  .
                </>
              ),
            },
          ].map((section, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
              className="rounded-xl p-5 border"
              style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-card)" }}
            >
              {section.title && (
                <h2 className="font-headline font-semibold text-base mb-2" style={{ color: "var(--text-primary)" }}>
                  {section.title}
                </h2>
              )}
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {section.bodyNode ?? section.body}
              </p>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}
