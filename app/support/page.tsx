"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { useState } from "react";

interface FAQItem {
  question: string;
  answer: string | React.ReactNode;
}

const faqs: FAQItem[] = [
  {
    question: "How do I deposit funds?",
    answer: "Go to your Wallet, tap Add Funds, and follow the Paystack payment flow. You can deposit via card, bank transfer, or mobile money. Funds are credited instantly.",
  },
  {
    question: "How long do withdrawals take?",
    answer: "Withdrawal requests are reviewed by our admin team and typically processed within 24 hours. Funds are sent to your registered bank account.",
  },
  {
    question: "I think I found a bug, what do I do?",
    answer: (
      <>
        Please report it to us immediately at{" "}
        <a href="mailto:support@bitlyfe.com" className="underline font-medium" style={{ color: "var(--accent-indigo)" }}>
          support@bitlyfe.com
        </a>
        . Include details about what happened and we&apos;ll investigate right away.
      </>
    ),
  },
  {
    question: "How are winners determined?",
    answer: (
      <>
        Winners are determined by correct answers. For details on each game type, see our{" "}
        <Link href="/#how-it-works" className="underline font-medium" style={{ color: "var(--accent-indigo)" }}>
          How It Works
        </Link>{" "}
        section.
      </>
    ),
  },
];

function FAQCard({ faq, index }: { faq: FAQItem; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="rounded-xl border overflow-hidden"
      style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-card)" }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-5 py-4 flex items-center justify-between text-left transition-colors hover:bg-black/10"
      >
        <h3 className="text-sm font-semibold pr-4" style={{ color: "var(--text-primary)" }}>{faq.question}</h3>
        <ChevronDown
          size={16}
          className={`flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          style={{ color: "var(--accent-indigo)" }}
        />
      </button>
      {open && (
        <div className="border-t px-5 py-4" style={{ borderColor: "var(--border-hairline)" }}>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{faq.answer}</p>
        </div>
      )}
    </motion.div>
  );
}

export default function SupportPage() {
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
            <p className="font-mono text-xs tracking-widest mb-2" style={{ color: "var(--accent-indigo)" }}>HELP</p>
            <h1 className="font-headline text-3xl sm:text-4xl font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Support</h1>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Frequently asked questions</p>
          </motion.div>

          {/* FAQ Cards */}
          <div className="space-y-2">
            {faqs.map((faq, idx) => (
              <FAQCard key={idx} faq={faq} index={idx} />
            ))}
          </div>

          {/* Contact */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="rounded-xl p-6 border text-center"
            style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-card)" }}
          >
            <h2 className="font-headline font-semibold text-base mb-2" style={{ color: "var(--text-primary)" }}>
              Can&apos;t find what you need?
            </h2>
            <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
              Send us an email and we&apos;ll get back to you as soon as possible.
            </p>
            <a
              href="mailto:support@bitlyfe.com"
              className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ backgroundColor: "var(--accent-indigo)", color: "white" }}
            >
              Contact Support
            </a>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
