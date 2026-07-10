"use client";

import { motion } from "framer-motion";
import { NavBar } from "@/components/ui/NavBar";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

interface FAQItem {
  question: string;
  answer: string | React.ReactNode;
}

const faqs: FAQItem[] = [
  {
    question: "How do I deposit funds?",
    answer: "Go to your Wallet, click 'Add Funds', and follow the Paystack payment flow. You can deposit via card, bank transfer, or mobile money. Funds are credited instantly.",
  },
  {
    question: "How long do withdrawals take?",
    answer: "Withdrawal requests are reviewed by our admin team and typically processed within 24 hours. You'll receive your funds to your registered bank account.",
  },
  {
    question: "I think I found a bug, what do I do?",
    answer: (
      <>
        Please report it to us immediately via email at{" "}
        <a href="mailto:support@bitlyfe.com" className="text-neon hover:text-neon/80 underline">
          support@bitlyfe.com
        </a>
        . Include details about what happened and we'll investigate right away.
      </>
    ),
  },
  {
    question: "How are winners determined?",
    answer: (
      <>
        Winners are determined by correct answers. For more details on each game type, check our{" "}
        <Link href="/#how-it-works" className="text-neon hover:text-neon/80 underline">
          How It Works
        </Link>{" "}
        page.
      </>
    ),
  },
];

function FAQCard({ faq, index }: { faq: FAQItem; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      viewport={{ once: true }}
      className="bg-gray-950/50 border border-gray-800 rounded-xl overflow-hidden"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-900/50 transition-colors"
      >
        <h3 className="text-white font-semibold text-left">{faq.question}</h3>
        <ChevronDown
          size={20}
          className={`flex-shrink-0 text-neon transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="border-t border-gray-800 px-6 py-4"
        >
          <p className="text-gray-300 leading-relaxed">{faq.answer}</p>
        </motion.div>
      )}
    </motion.div>
  );
}

export default function SupportPage() {
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
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">Support</h1>
            <p className="text-gray-400 text-lg">Frequently asked questions and help</p>
          </motion.div>

          {/* FAQ Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-3 mb-12"
          >
            {faqs.map((faq, idx) => (
              <FAQCard key={idx} faq={faq} index={idx} />
            ))}
          </motion.div>

          {/* Contact Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-gray-950/50 to-gray-950/30 border border-gray-800 rounded-xl p-8 text-center"
          >
            <h2 className="text-2xl font-bold text-white mb-4">Can't find what you need?</h2>
            <p className="text-gray-300 mb-6">
              Send us an email and we'll get back to you as soon as possible.
            </p>
            <a
              href="mailto:support@bitlyfe.com"
              className="inline-block px-8 py-3 bg-neon text-black font-bold rounded-lg hover:bg-neon/90 transition-colors"
            >
              Contact Support
            </a>
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
