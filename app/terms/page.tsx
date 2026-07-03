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
            <p className="text-gray-400 text-lg">Last updated: January 2026</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="prose prose-invert prose-lg max-w-none space-y-8"
          >
            {/* Skill-Based Competition */}
            <section className="bg-gray-950/50 border border-gray-800 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-white mb-4">1. Skill-Based Competition</h2>
              <p className="text-gray-300 leading-relaxed">
                BitLyfe is a skill-based quiz platform where winners are determined by correct answers to questions, not by chance. Your success depends on your knowledge, reasoning ability, and decision-making skills.
              </p>
            </section>

            {/* Eligibility */}
            <section className="bg-gray-950/50 border border-gray-800 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-white mb-4">2. Eligibility (18+)</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                You must be at least 18 years old to use BitLyfe. By creating an account, you confirm that you meet this age requirement and have the legal capacity to enter into this agreement.
              </p>
              <p className="text-gray-300 leading-relaxed">
                Minors are strictly prohibited from participating. We reserve the right to verify your age at any time and suspend accounts that violate this policy.
              </p>
            </section>

            {/* Entry Fees & Prizes */}
            <section className="bg-gray-950/50 border border-gray-800 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-white mb-4">3. Entry Fees & Prizes</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                Each door or challenge requires an entry fee to participate. Entry fees are clearly displayed before you commit to play. Prize amounts vary by door difficulty and game type.
              </p>
              <p className="text-gray-300 leading-relaxed mb-4">
                BitLyfe retains a 20% platform fee from prize pools to cover operational costs. The remaining 80% is distributed to winners.
              </p>
              <p className="text-gray-300 leading-relaxed">
                All fees and prizes are displayed in Nigerian Naira (₦). Entry fees are non-refundable once you submit an answer.
              </p>
            </section>

            {/* Payment & Withdrawals */}
            <section className="bg-gray-950/50 border border-gray-800 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-white mb-4">4. Payment & Withdrawals</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                You can fund your wallet using credit/debit cards, bank transfers, or mobile money (OPay, PalmPay, etc.). All payments are processed securely through Paystack.
              </p>
              <p className="text-gray-300 leading-relaxed mb-4">
                Winnings are credited to your wallet immediately. You can withdraw funds to your Nigerian bank account at any time, subject to a minimum withdrawal amount.
              </p>
              <p className="text-gray-300 leading-relaxed">
                Withdrawals are typically processed within 24 hours. We reserve the right to verify your identity before processing large withdrawals or unusual activity.
              </p>
            </section>

            {/* Fair Play Policy */}
            <section className="bg-gray-950/50 border border-gray-800 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-white mb-4">5. Fair Play Policy</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                BitLyfe is committed to fair play. Cheating, collusion, use of bots or automated tools, or any form of manipulation is strictly prohibited and will result in immediate account suspension.
              </p>
              <p className="text-gray-300 leading-relaxed mb-4">
                Each question has a time limit. Answers submitted after the timer expires will not be accepted.
              </p>
              <p className="text-gray-300 leading-relaxed">
                We use automated systems and manual reviews to detect suspicious activity. If we determine you have violated our fair play policy, we may forfeit your winnings and ban your account.
              </p>
            </section>

            {/* Limitation of Liability */}
            <section className="bg-gray-950/50 border border-gray-800 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-white mb-4">6. Limitation of Liability</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                BitLyfe is provided &quot;as is&quot; without warranties of any kind. We do not guarantee uninterrupted or error-free service.
              </p>
              <p className="text-gray-300 leading-relaxed mb-4">
                We are not liable for losses resulting from technical failures, incorrect questions, payment processor errors, or force majeure events.
              </p>
              <p className="text-gray-300 leading-relaxed">
                Your total liability is limited to the amount you have deposited into your wallet. We are not responsible for indirect, consequential, or punitive damages.
              </p>
            </section>

            {/* Contact */}
            <section className="bg-gray-950/50 border border-gray-800 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-white mb-4">7. Contact</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                If you have questions about these Terms of Service, please contact us:
              </p>
              <p className="text-[#00FF66] font-semibold">
                Email:{" "}
                <a href="mailto:support@bitlyfe.com" className="underline hover:text-[#00FF66]/80 transition-colors">
                  support@bitlyfe.com
                </a>
              </p>
            </section>

            {/* Updates to Terms */}
            <section className="bg-gray-950/50 border border-gray-800 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-white mb-4">Changes to These Terms</h2>
              <p className="text-gray-300 leading-relaxed">
                We may update these Terms from time to time. Changes will be posted on this page with an updated &quot;Last updated&quot; date. Continued use of BitLyfe after changes constitutes acceptance of the new Terms.
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
