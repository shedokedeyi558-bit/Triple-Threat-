"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { blitzApi, pillsApi, predictionsApi } from "@/lib/api";

export default function LandingPage() {
  const { state } = useApp();
  const router = useRouter();

  // Live stats — fail silently, fallbacks always show
  const [liveStats, setLiveStats] = useState({
    pills:       { stat: "Win up to ₦5,000", sub: "Answer in 30 sec · from ₦200" },
    timeMachine: { stat: "Top prize ₦20,000", sub: "Predict right, collect instantly" },
    blitz:       { stat: "Prize pools to ₦100,000", sub: "Next tournament · open now" },
  });

  useEffect(() => {
    // Pills — try to get active packs count
    pillsApi.getPacks().then((res) => {
      const active = res.packs?.filter((p) => p.status === "active").length ?? 0;
      if (active > 0) {
        setLiveStats((prev) => ({
          ...prev,
          pills: { stat: "Win up to ₦5,000", sub: `${active} pack${active > 1 ? "s" : ""} live now · from ₦200` },
        }));
      }
    }).catch(() => {});

    // Time Machine — try to get active predictions count
    predictionsApi.getActive().then((res) => {
      const count = res.predictions?.length ?? 0;
      if (count > 0) {
        const next = res.predictions[0];
        const slots = next?.max_slots
          ? `${next.slots_filled ?? 0}/${next.max_slots} entered`
          : `${count} open`;
        setLiveStats((prev) => ({
          ...prev,
          timeMachine: { stat: "Top prize ₦20,000", sub: slots },
        }));
      }
    }).catch(() => {});

    // Blitz — try to get nearest open tournament
    blitzApi.getAll().then((res) => {
      const open = res.tournaments?.find((t) => t.status === "registration" || t.status === "active");
      if (open) {
        const pool = open.prize_pool > 0
          ? `₦${open.prize_pool.toLocaleString("en-NG")} pool`
          : "Prize pool live";
        setLiveStats((prev) => ({
          ...prev,
          blitz: { stat: "Prize pools to ₦100,000", sub: `${pool} · ${open.total_registered} registered` },
        }));
      }
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redirect to /pills if already authenticated
  useEffect(() => {
    if (state.isAuthenticated) {
      router.push("/pills");
    }
  }, [state.isAuthenticated, router]);

  const gameTickets = [
    {
      title: "Pills",
      description: "30-second knowledge drops",
      accentColor: "var(--accent-indigo)",
      stat: liveStats.pills.stat,
      sub: liveStats.pills.sub,
    },
    {
      title: "Time Machine",
      description: "Lock in your prediction before time's up",
      accentColor: "#a78bfa",
      stat: liveStats.timeMachine.stat,
      sub: liveStats.timeMachine.sub,
    },
    {
      title: "Blitz",
      description: "Live tournaments — outscore everyone",
      accentColor: "var(--accent-amber)",
      stat: liveStats.blitz.stat,
      sub: liveStats.blitz.sub,
    },
  ];

  return (
    <main className="min-h-screen bg-[--bg-base]" style={{ backgroundColor: "var(--bg-base)" }}>
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-[--border-hairline]" style={{ borderColor: "var(--border-hairline)", backgroundColor: "var(--bg-base)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <img src="/bitlyfe-mark.svg" alt="BitLyfe" width={32} height={32} />
            <span className="font-headline text-base font-semibold" style={{ color: "var(--text-primary)" }}>bitlyfe</span>
          </div>

          {/* Desktop Nav */}
          <div className="flex-1" />

          {/* Desktop Login Button */}
          <div className="flex items-center gap-4">
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
        </div>
      </nav>

      {/* Hero Section */}
      <section id="games" className="px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
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
                    borderLeft: `3px solid ${ticket.accentColor}`,
                  }}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-headline font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                          {ticket.title}
                        </h3>
                        <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-secondary)" }}>
                          {ticket.description}
                        </p>
                      </div>
                      <span className="font-mono text-sm font-bold whitespace-nowrap flex-shrink-0" style={{ color: ticket.accentColor }}>
                        {ticket.stat}
                      </span>
                    </div>
                    <p className="text-[10px] mt-2 font-mono" style={{ color: "var(--text-muted)" }}>
                      {ticket.sub}
                    </p>
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
                  borderLeft: `3px solid ${ticket.accentColor}`,
                }}
              >
                <div className="p-3 sm:p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-headline font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                        {ticket.title}
                      </h3>
                      <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-secondary)" }}>
                        {ticket.description}
                      </p>
                    </div>
                    <span className="font-mono text-sm font-bold whitespace-nowrap flex-shrink-0" style={{ color: ticket.accentColor }}>
                      {ticket.stat}
                    </span>
                  </div>
                  <p className="text-[10px] mt-1.5 font-mono" style={{ color: "var(--text-muted)" }}>
                    {ticket.sub}
                  </p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── SEE IT IN ACTION ── */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 lg:py-20 border-t" style={{ borderColor: "var(--border-hairline)" }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Headline & Text */}
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <h2 className="font-headline text-3xl lg:text-4xl font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
                Answer right, get paid on the spot.
              </h2>
              <p className="text-base leading-relaxed mb-6" style={{ color: "var(--text-secondary)" }}>
                No long waits, no complicated withdrawals. Win a round, get your winnings instantly. Play from your phone, cash out whenever you want.
              </p>
              <ul className="space-y-3 text-sm">
                {["Answer questions you know", "Get instant confirmation", "Cash out anytime"].map((item) => (
                  <li key={item} className="flex gap-3" style={{ color: "var(--text-secondary)" }}>
                    <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(76,111,255,0.2)" }}>
                      <span style={{ color: "var(--accent-indigo)" }}>✓</span>
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Right: Mock Win Moment Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex justify-center"
            >
              <div
                className="w-64 h-96 rounded-2xl shadow-2xl p-6 flex flex-col items-center justify-center relative overflow-hidden border"
                style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-card)" }}
              >
                {/* Animated floating +₦ elements */}
                <style>{`
                  @keyframes float-up-0 {
                    0% { transform: translateY(0); opacity: 1; }
                    100% { transform: translateY(-80px); opacity: 0; }
                  }
                  @keyframes float-up-1 {
                    0% { transform: translateY(0); opacity: 1; }
                    100% { transform: translateY(-80px); opacity: 0; }
                  }
                  @keyframes float-up-2 {
                    0% { transform: translateY(0); opacity: 1; }
                    100% { transform: translateY(-80px); opacity: 0; }
                  }
                  .float-up-0 { animation: float-up-0 2s ease-out 0s infinite; }
                  .float-up-1 { animation: float-up-1 2s ease-out 0.5s infinite; }
                  .float-up-2 { animation: float-up-2 2s ease-out 1s infinite; }
                `}</style>
                <div className="absolute float-up-0">
                  <span className="text-xl font-mono font-bold" style={{ color: "var(--accent-indigo)" }}>+₦250</span>
                </div>
                <div className="absolute left-1/4 float-up-1">
                  <span className="text-lg font-mono font-bold" style={{ color: "var(--accent-violet)" }}>+₦100</span>
                </div>
                <div className="absolute right-1/4 float-up-2">
                  <span className="text-xl font-mono font-bold" style={{ color: "var(--accent-amber)" }}>+₦500</span>
                </div>

                {/* Main content */}
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 relative z-10" style={{ backgroundColor: "rgba(249,193,7,0.15)" }}>
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-full h-full rounded-full flex items-center justify-center"
                  >
                    <span className="text-2xl" style={{ color: "var(--accent-amber)" }}>✓</span>
                  </motion.div>
                </div>

                <p className="text-2xl font-mono font-bold text-center mb-3 relative z-10" style={{ color: "var(--text-primary)" }}>
                  Correct!
                </p>
                <p className="text-3xl font-mono font-black text-center mb-6 relative z-10" style={{ color: "var(--accent-indigo)" }}>
                  +₦500
                </p>

                <div className="border-t w-full pt-4 relative z-10" style={{ borderColor: "var(--border-hairline)" }}>
                  <p className="text-xs text-center mb-1" style={{ color: "var(--text-muted)" }}>Your balance</p>
                  <p className="font-mono text-lg font-bold text-center" style={{ color: "var(--accent-indigo)" }}>
                    ₦2,850
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── WHAT'S UP FOR GRABS ── */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 lg:py-20 border-t" style={{ borderColor: "var(--border-hairline)" }}>
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-headline text-3xl lg:text-4xl font-semibold mb-2"
            style={{ color: "var(--text-primary)" }}
          >
            Real naira. Every single mode.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.05 }}
            className="text-sm mb-12"
            style={{ color: "var(--text-secondary)" }}
          >
            Prize pools scale with participation. The more players, the bigger the pot.
          </motion.p>

          {/* Prize cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            {[
              { name: "Pills", upTo: "₦2,000", color: "var(--accent-indigo)", accent: "rgba(76,111,255,0.15)" },
              { name: "Time Machine", upTo: "₦5,000", color: "#A78BFA", accent: "rgba(167,139,250,0.15)" },
              { name: "Blitz", upTo: "₦50,000", color: "var(--accent-amber)", accent: "rgba(251,146,60,0.15)", emphasized: true },
            ].map((prize) => (
              <motion.div
                key={prize.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className={`rounded-2xl p-8 border transition-all ${
                  prize.emphasized
                    ? "lg:scale-105 lg:ring-2"
                    : ""
                }`}
                style={{
                  borderColor: prize.emphasized ? prize.color : "var(--border-subtle)",
                  backgroundColor: prize.accent,
                  ...(prize.emphasized && { boxShadow: `0 0 20px ${prize.color}30`, ringColor: prize.color }),
                }}
              >
                <h3 className="font-headline text-base font-semibold mb-3" style={{ color: prize.color }}>
                  {prize.name}
                </h3>
                <p className="font-mono text-3xl font-black" style={{ color: prize.color }}>
                  {prize.upTo}
                </p>
                <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
                  up to
                </p>
              </motion.div>
            ))}
          </div>

          {/* Disclaimer */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-xs"
            style={{ color: "var(--text-muted)" }}
          >
            Actual prizes depend on entries and current registrations — shown live before you join.
          </motion.p>
        </div>
      </section>

      {/* How It Works - Games Section */}
      <section id="how-it-works" className="px-4 sm:px-6 lg:px-8 py-16 lg:py-20 border-t" style={{ borderColor: "var(--border-hairline)" }}>
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
                <img src="/bitlyfe-mark.svg" alt="BitLyfe" width={16} height={16} />
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
                  <Link href="/#how-it-works" className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    How it works
                  </Link>
                </li>
                <li>
                  <Link href="/support" className="text-xs" style={{ color: "var(--text-secondary)" }}>
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
                  <Link href="/terms" className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    Terms
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link href="/responsible-play" className="text-xs" style={{ color: "var(--text-secondary)" }}>
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
