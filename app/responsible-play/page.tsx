"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Heart, TrendingDown, AlertCircle, Settings } from "lucide-react";

export default function ResponsiblePlayPage() {
  const router = useRouter();

  return (
    <div className="px-4 lg:px-8 py-6 max-w-3xl mx-auto w-full">
      {/* Back button */}
      <motion.button
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft size={16} /> Back
      </motion.button>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-3">
          <Heart size={24} style={{ color: "var(--accent-amber)" }} />
          <h1 className="text-3xl font-black" style={{ color: "var(--text-primary)" }}>Responsible Play</h1>
        </div>
        <p style={{ color: "var(--text-secondary)" }}>We're committed to fostering a safe, enjoyable gaming experience. These tools help you stay in control.</p>
      </motion.div>

      {/* Content grid */}
      <div className="space-y-6">
        
        {/* Why limits matter */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl p-6 border"
          style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgba(232, 163, 61, 0.1)" }}>
              <TrendingDown size={20} style={{ color: "var(--accent-amber)" }} />
            </div>
            <div>
              <h2 className="font-bold text-lg mb-2" style={{ color: "var(--text-primary)" }}>Why Set Limits?</h2>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                Setting daily or weekly spending limits helps you manage your gameplay responsibly. When you reach your limit, you'll be gently reminded and won't be able to play until the next period. This keeps your entertainment enjoyable and within your budget.
              </p>
            </div>
          </div>
        </motion.div>

        {/* How it works */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl p-6 border"
          style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}
        >
          <h2 className="font-bold text-lg mb-4" style={{ color: "var(--text-primary)" }}>How Play Limits Work</h2>
          <div className="space-y-3">
            {[
              { num: "1", title: "Set Your Limits", desc: "Go to your Profile and set a daily or weekly spending cap in Naira." },
              { num: "2", title: "Play Within Budget", desc: "Enter games and win as normal. Your spending is tracked against your limit." },
              { num: "3", title: "Get Notified", desc: "When you're close or reach your limit, we'll show you a friendly notification." },
              { num: "4", title: "Automatic Pause", desc: "Once your limit is reached, you can't enter new games until the next period resets." },
            ].map((step, i) => (
              <div key={i} className="flex gap-3">
                <span className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm" style={{ backgroundColor: "var(--accent-amber)", color: "#000" }}>
                  {step.num}
                </span>
                <div>
                  <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{step.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Resources */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl p-6 border"
          style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgba(76, 111, 255, 0.1)" }}>
              <AlertCircle size={20} style={{ color: "var(--accent-indigo)" }} />
            </div>
            <div>
              <h2 className="font-bold text-lg mb-2" style={{ color: "var(--text-primary)" }}>Need Support?</h2>
              <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--text-secondary)" }}>
                If you're struggling with excessive play or feel your gambling is getting out of control, please reach out for support. Many resources are available.
              </p>
              <div className="space-y-2">
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  <span className="font-semibold" style={{ color: "var(--text-secondary)" }}>BitLyfe Support:</span> support@bitlyfe.com
                </p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  <span className="font-semibold" style={{ color: "var(--text-secondary)" }}>National Helpline:</span> 0800-HELPLINE (24/7)
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <Link
            href="/profile"
            className="flex items-center justify-center gap-2 flex-1 py-3 rounded-lg font-bold text-sm transition-all"
            style={{ backgroundColor: "var(--accent-indigo)", color: "#042C53" }}
          >
            <Settings size={16} /> Set Your Limits Now
          </Link>
          <Link
            href="/play"
            className="flex items-center justify-center gap-2 flex-1 py-3 rounded-lg font-bold text-sm border"
            style={{ borderColor: "var(--border-subtle)", color: "var(--text-primary)" }}
          >
            Back to Play
          </Link>
        </motion.div>

        {/* Footer note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="text-xs text-center pt-4"
          style={{ color: "var(--text-muted)" }}
        >
          BitLyfe is committed to responsible gaming. Play for fun, stay in control.
        </motion.p>
      </div>
    </div>
  );
}
