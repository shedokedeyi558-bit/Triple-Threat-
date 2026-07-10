"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Menu, X } from "lucide-react";

export default function LandingPage() {
  const { state } = useApp();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Redirect to /play if already authenticated
  useEffect(() => {
    if (state.isAuthenticated) {
      router.push("/play");
    }
  }, [state.isAuthenticated, router]);

  const gameTickets = [
    {
      title: "Pills",
      description: "30-second knowledge challenges",
      accent: "indigo",
      accentColor: "var(--accent-indigo)",
      priceRange: "₦200 → ₦1,000",
    },
    {
      title: "Time Machine",
      description: "Predict the outcome, lock it in before time runs out",
      accent: "violet",
      accentColor: "var(--accent-violet)",
      priceRange: "₦500 → ₦2,000",
    },
    {
      title: "Blitz",
      description: "Live tournaments — outscore everyone, outrun the clock",
      accent: "amber",
      accentColor: "var(--accent-amber)",
      priceRange: "Winner takes 40%",
    },
  ];

  return (
    <main className="min-h-screen bg-[--bg-base]" style={{ backgroundColor: "var(--bg-base)" }}>
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-[--border-hairline]" style={{ borderColor: "var(--border-hairline)", backgroundColor: "var(--bg-base)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-5 h-5" style={{ backgroundColor: "var(--accent-amber)" }}></div>
            <span className="font-headline text-base font-semibold" style={{ color: "var(--text-primary)" }}>bitlyfe</span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="#games" className="text-sm" style={{ color: "var(--text-secondary)" }}>Games</Link>
            <Link href="#how-it-works" className="text-sm" style={{ color: "var(--text-secondary)" }}>How it works</Link>
            <Link href="/blitz" className="text-sm" style={{ color: "var(--text-secondary)" }}>Leaderboard</Link>
          </div>

          {/* Desktop Login Button */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/signin"
              className="px-4 py-2 text-sm font-medium border rounded-full transition-colors"
              style={{
                color: "var(--text-secondary)",
                borderColor: "var(--border-subtle)",
              }}
            >
              Log in
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2"
            style={{ color: "var(--text-secondary)" }}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden border-t px-4 py-4 space-y-4"
            style={{ borderColor: "var(--border-hairline)" }}
          >
            <Link href="#games" className="block text-sm" style={{ color: "var(--text-secondary)" }}>Games</Link>
            <Link href="#how-it-works" className="block text-sm" style={{ color: "var(--text-secondary)" }}>How it works</Link>
            <Link href="/blitz" className="block text-sm" style={{ color: "var(--text-secondary)" }}>Leaderboard</Link>
            <Link href="/signin" className="block text-sm font-medium" style={{ color: "var(--accent-amber)" }}>Log in</Link>
          </motion.div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-12 items-center">
            {/* Left Column */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              {/* Eyebrow */}
              <div className="font-mono text-xs tracking-widest" style={{ color: "var(--accent-amber)" }}>
                REAL STAKES, REAL FAST
              </div>

              {/* Headline */}
              <h1 className="font-headline text-3xl sm:text-4xl lg:text-5xl leading-tight" style={{ color: "var(--text-primary)" }}>
                Your knowledge is worth something.
              </h1>

              {/* Subtext */}
              <p className="text-sm sm:text-base max-w-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                Play quick challenges or strategic predictions. Verify your skill, build your winnings, cash out same day. No gatekeeping—just pure competition.
              </p>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
                <Link
                  href="/auth"
                  className="flex items-center justify-center gap-2 px-6 py-3 font-medium text-sm rounded-lg transition-all"
                  style={{
                    backgroundColor: "var(--accent-amber)",
                    color: "#000",
                  }}
                >
                  Play now <ArrowRight size={16} />
                </Link>
                <Link
                  href="#how-it-works"
                  className="flex items-center justify-center px-6 py-3 font-medium text-sm border rounded-lg transition-colors"
                  style={{
                    borderColor: "var(--border-subtle)",
                    color: "var(--text-secondary)",
                  }}
                >
                  See how it works
                </Link>
              </div>
            </motion.div>

            {/* Right Column - Game Ticket Cards */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-3 hidden lg:block"
            >
              {gameTickets.map((ticket, idx) => (
                <motion.div
                  key={ticket.title}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 + idx * 0.1 }}
                  className="rounded-r-xl overflow-hidden"
                  style={{
                    backgroundColor: "var(--bg-card)",
                    borderLeft: `2px solid ${ticket.accentColor}`,
                  }}
                >
                  <div className="p-4 flex items-start justify-between">
                    <div>
                      <h3 className="font-headline font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                        {ticket.title}
                      </h3>
                      <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
                        {ticket.description}
                      </p>
                    </div>
                    <span className="font-mono text-xs whitespace-nowrap ml-4" style={{ color: ticket.accentColor }}>
                      {ticket.priceRange}
                    </span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Mobile - Stack Game Tickets Below Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="lg:hidden space-y-2 mt-12"
          >
            {gameTickets.map((ticket, idx) => (
              <div
                key={ticket.title}
                className="rounded-r-xl overflow-hidden"
                style={{
                  backgroundColor: "var(--bg-card)",
                  borderLeft: `2px solid ${ticket.accentColor}`,
                }}
              >
                <div className="p-3 sm:p-4 flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-headline font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                      {ticket.title}
                    </h3>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                      {ticket.description}
                    </p>
                  </div>
                  <span className="font-mono text-xs whitespace-nowrap ml-3" style={{ color: ticket.accentColor }}>
                    {ticket.priceRange}
                  </span>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>
      <section className="px-4 sm:px-6 lg:px-8 py-16 lg:py-20 border-t" style={{ borderColor: "var(--border-hairline)" }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-headline text-2xl sm:text-3xl" style={{ color: "var(--text-primary)" }}>
              Three steps to start playing
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {[
              {
                number: "1",
                title: "Fund your wallet",
                description: "Add funds via Paystack. Takes seconds.",
              },
              {
                number: "2",
                title: "Pick your mode",
                description: "Pills for instant wins. Predictions for strategy. Blitz for tournaments.",
              },
              {
                number: "3",
                title: "Play and cash out",
                description: "Win instantly or wait for results. Withdraw to your bank anytime.",
              },
            ].map((step, idx) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                viewport={{ once: true }}
                className="rounded-xl p-6 border"
                style={{
                  backgroundColor: "var(--bg-card)",
                  borderColor: "var(--border-subtle)",
                }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center font-headline font-semibold text-xs mb-4"
                  style={{
                    backgroundColor: "var(--accent-amber)",
                    color: "#000",
                  }}
                >
                  {step.number}
                </div>
                <h3 className="font-headline font-semibold text-base mb-2" style={{ color: "var(--text-primary)" }}>
                  {step.title}
                </h3>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t px-4 sm:px-6 lg:px-8 py-12" style={{ borderColor: "var(--border-hairline)" }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            {/* Logo Column */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-4 h-4" style={{ backgroundColor: "var(--accent-amber)" }}></div>
                <span className="font-headline text-sm font-semibold" style={{ color: "var(--text-primary)" }}>bitlyfe</span>
              </div>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                Real stakes, real fast
              </p>
            </div>

            {/* Games Column */}
            <div>
              <h4 className="font-headline font-semibold text-xs mb-4 uppercase tracking-wider" style={{ color: "var(--text-primary)" }}>
                Games
              </h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/pills" className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    Pills
                  </Link>
                </li>
                <li>
                  <Link href="/time-machine" className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    Time Machine
                  </Link>
                </li>
                <li>
                  <Link href="/blitz" className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    Blitz
                  </Link>
                </li>
              </ul>
            </div>

            {/* Info Column */}
            <div>
              <h4 className="font-headline font-semibold text-xs mb-4 uppercase tracking-wider" style={{ color: "var(--text-primary)" }}>
                Info
              </h4>
              <ul className="space-y-2">
                <li>
                  <Link href="#how-it-works" className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    How it works
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    Leaderboard
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    Support
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal Column */}
            <div>
              <h4 className="font-headline font-semibold text-xs mb-4 uppercase tracking-wider" style={{ color: "var(--text-primary)" }}>
                Legal
              </h4>
              <ul className="space-y-2">
                <li>
                  <Link href="#" className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    Terms
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    Responsible play
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs" style={{ borderColor: "var(--border-hairline)", color: "var(--text-secondary)" }}>
            <span>© 2026 bitlyfe</span>
            <span>Payments secured by Paystack</span>
            <Link href="/admin" className="hover:underline">
              Admin
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center sm:items-start">
      <div className="font-mono text-sm sm:text-base font-medium" style={{ color: "var(--text-primary)" }}>
        {value}
      </div>
      <div className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
        {label}
      </div>
    </div>
  );
}
