"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import { gameApi, type RecentWinner } from "@/lib/api";
import { motion, useInView } from "framer-motion";
import {
  ArrowRight, Wallet, Trophy, Shield, Zap, Swords, Gift, Users, Lock,
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.04 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const } },
};

function CountUp({ to, prefix = "", duration = 2.2 }: { to: number; prefix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / (duration * 1000), 1);
      const e = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
      setVal(Math.round(to * e));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to, duration]);
  return <span ref={ref}>{prefix}{val.toLocaleString("en-NG")}</span>;
}

// ─── Background blobs ─────────────────────────────────────────────────────
function GradientMesh() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="animate-blob-1 absolute -left-[8%] top-[-12%] h-[52vh] w-[52vh] rounded-full blur-[110px]"
        style={{ backgroundColor: "rgba(76,111,255,0.3)" }} />
      <div className="animate-blob-2 absolute right-[-8%] top-[8%] h-[46vh] w-[46vh] rounded-full blur-[120px]"
        style={{ backgroundColor: "rgba(124,111,232,0.22)" }} />
      <div className="animate-blob-3 absolute bottom-[-15%] left-[22%] h-[40vh] w-[40vh] rounded-full blur-[130px]"
        style={{ backgroundColor: "rgba(232,163,61,0.12)" }} />
      <div className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse at center, transparent 30%, var(--brand-bg,#080B14) 88%)" }} />
    </div>
  );
}

// ─── Live winner ticker ───────────────────────────────────────────────────
const FALLBACK_WINNERS = [
  { phone: "0803***7891", amount: 80000,  game: "Blitz" },
  { phone: "0706***2214", amount: 12500,  game: "Beat the Admin" },
  { phone: "0813***0098", amount: 150000, game: "Treasure Box" },
  { phone: "0902***4471", amount: 5000,   game: "Blitz" },
  { phone: "0817***6620", amount: 42000,  game: "Treasure Box" },
  { phone: "0705***1183", amount: 25000,  game: "Beat the Admin" },
  { phone: "0809***9925", amount: 300000, game: "Blitz" },
  { phone: "0814***3307", amount: 18750,  game: "Treasure Box" },
];

const GAME_COLOR: Record<string, string> = {
  Blitz:          "var(--brand-indigo)",
  "Beat the Admin": "var(--brand-violet)",
  "Treasure Box": "var(--brand-amber)",
};

function Ticker() {
  const [winners, setWinners] = useState<{ phone: string; amount: number; game: string }[]>(FALLBACK_WINNERS);

  useEffect(() => {
    gameApi.recentWinners()
      .then((data) => {
        if (data && data.length > 0) {
          setWinners(data.map((w: RecentWinner) => ({
            phone: w.phone,
            amount: w.prize,
            game: "Blitz", // recent-winners endpoint is door-game based; label as Blitz
          })));
        }
      })
      .catch(() => { /* keep fallback */ });
  }, []);

  const items = [...winners, ...winners]; // duplicate for seamless loop

  return (
    <section aria-label="Recent winners"
      className="relative flex overflow-hidden border-y py-3"
      style={{ borderColor: "var(--border)", backgroundColor: "rgba(255,255,255,0.025)" }}>
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16"
        style={{ background: "linear-gradient(to right, var(--brand-bg,#080B14), transparent)" }} />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16"
        style={{ background: "linear-gradient(to left, var(--brand-bg,#080B14), transparent)" }} />
      <div className="animate-marquee flex shrink-0 items-center gap-3 pr-3">
        {items.map((w, i) => (
          <div key={i}
            className="flex items-center gap-2 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs"
            style={{ borderColor: "var(--border)", backgroundColor: "rgba(18,22,31,0.6)" }}>
            <Trophy className="h-3 w-3 shrink-0" style={{ color: "var(--brand-amber)" }} />
            <span className="font-mono" style={{ color: "var(--muted-foreground)" }}>{w.phone}</span>
            <span style={{ color: "var(--muted-foreground)" }}>won</span>
            <span className="font-bold font-mono" style={{ color: "var(--brand-green)" }}>
              ₦{w.amount.toLocaleString()}
            </span>
            <span className="rounded px-1.5 py-0.5 text-[9px] font-bold"
              style={{
                backgroundColor: `color-mix(in srgb, ${GAME_COLOR[w.game] ?? "var(--brand-indigo)"} 14%, transparent)`,
                color: GAME_COLOR[w.game] ?? "var(--brand-indigo)",
              }}>
              {w.game}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="relative overflow-hidden" style={{ backgroundColor: "var(--brand-bg)", minHeight: "100svh" }}>
      <GradientMesh />

      {/* Nav */}
      <nav className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-5 sm:px-6">
        <div className="flex items-center gap-2.5">
          <img src="/bitlyfe-mark.svg" alt="BitLyfe" width={38} height={38} />
          <span className="font-display text-xl font-extrabold tracking-tight" style={{ color: "var(--foreground)" }}>
            Bit<span style={{ color: "var(--brand-amber)" }}>lyfe</span>
          </span>
        </div>
        <Link href="/signin"
          className="rounded-full border px-4 py-1.5 text-sm font-semibold backdrop-blur-sm"
          style={{ borderColor: "rgba(255,255,255,0.14)", color: "var(--foreground)", backgroundColor: "rgba(255,255,255,0.04)" }}>
          Sign in
        </Link>
      </nav>

      {/* Copy */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:flex lg:min-h-[80vh] lg:items-center lg:pb-24">
        <motion.div variants={stagger} initial="hidden" animate="show" className="max-w-2xl">

          {/* Live pill */}
          <motion.div variants={fadeUp}
            className="mb-6 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-bold"
            style={{ borderColor: "rgba(34,197,94,0.3)", backgroundColor: "rgba(34,197,94,0.08)", color: "var(--brand-green)" }}>
            <span className="live-dot" />
            Payouts running now
          </motion.div>

          <motion.h1 variants={fadeUp}
            className="font-display font-extrabold leading-[0.92] tracking-tight"
            style={{ color: "var(--foreground)", fontSize: "clamp(2.6rem, 9vw, 5.2rem)" }}>
            Play Smart.<br />
            <span style={{ color: "var(--brand-amber)" }}>Win Real.</span><br />
            Get Paid.
          </motion.h1>

          <motion.p variants={fadeUp}
            className="mt-5 text-base leading-relaxed sm:text-lg"
            style={{ color: "var(--muted-foreground)", maxWidth: "38ch" }}>
            Three high-stakes games. Real Naira prizes. No tricks — your odds are shown upfront.
          </motion.p>

          <motion.div variants={fadeUp} className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/auth"
              className="group inline-flex items-center gap-2 rounded-full px-7 py-4 text-sm font-black transition-transform hover:scale-[1.03] active:scale-100"
              style={{ backgroundColor: "var(--brand-amber)", color: "#080B14", boxShadow: "0 6px 28px -4px rgba(232,163,61,0.55)" }}>
              Get Started
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link href="/signin"
              className="inline-flex items-center gap-2 rounded-full border px-6 py-4 text-sm font-semibold"
              style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}>
              I have an account
            </Link>
          </motion.div>

          <motion.div variants={fadeUp} className="mt-10 flex items-center gap-6 text-xs" style={{ color: "var(--muted-foreground)" }}>
            <div>
              <span className="block font-display text-2xl font-extrabold" style={{ color: "var(--foreground)" }}>₦2.4M+</span>
              paid out this week
            </div>
            <div className="h-8 w-px" style={{ backgroundColor: "var(--border)" }} />
            <div>
              <span className="block font-display text-2xl font-extrabold" style={{ color: "var(--foreground)" }}>12k+</span>
              active players
            </div>
            <div className="h-8 w-px" style={{ backgroundColor: "var(--border)" }} />
            <div>
              <span className="block font-display text-2xl font-extrabold" style={{ color: "var(--foreground)" }}>3</span>
              live game modes
            </div>
          </motion.div>

        </motion.div>
      </div>
    </section>
  );
}

// ─── Game mode showcase ───────────────────────────────────────────────────

// Blitz card — electric, competitive
function BlitzCard() {
  return (
    <motion.article
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-2xl border p-6 sm:p-7"
      style={{ borderColor: "rgba(76,111,255,0.25)", backgroundColor: "rgba(12,16,28,0.7)" }}>

      {/* Subtle top-edge glow */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{ background: "linear-gradient(to right, transparent, rgba(76,111,255,0.7), transparent)" }} />

      {/* Icon */}
      <div className="mb-5 inline-flex items-center justify-center rounded-xl p-3"
        style={{ backgroundColor: "rgba(76,111,255,0.12)", border: "1px solid rgba(76,111,255,0.2)" }}>
        <Zap className="h-6 w-6" style={{ color: "var(--brand-indigo)" }} strokeWidth={2.5} />
      </div>

      {/* Label */}
      <div className="mb-3 flex items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--brand-indigo)" }}>
          Tournament · Multiplayer
        </span>
      </div>

      <h3 className="font-display text-2xl font-extrabold tracking-tight" style={{ color: "var(--foreground)" }}>
        Blitz
      </h3>
      <p className="mt-1 text-base font-semibold" style={{ color: "rgba(76,111,255,0.85)" }}>
        Race the clock. Beat the field.
      </p>
      <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
        Answer questions faster and more accurately than everyone else in the room.
        Prize pool splits among the top finishers — the sharper you are, the bigger your cut.
      </p>

      {/* Feature chips */}
      <div className="mt-5 flex flex-wrap gap-2">
        {["Live leaderboard", "Prize pool", "Timed rounds", "Multiple players"].map((f) => (
          <span key={f} className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
            style={{ backgroundColor: "rgba(76,111,255,0.09)", color: "rgba(76,111,255,0.8)", border: "1px solid rgba(76,111,255,0.18)" }}>
            {f}
          </span>
        ))}
      </div>

      <Link href="/auth"
        className="group mt-6 inline-flex items-center gap-1.5 text-sm font-bold"
        style={{ color: "var(--brand-indigo)" }}>
        Enter a Blitz
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </Link>
    </motion.article>
  );
}

// Beat the Admin card — confident, 1v1 duel energy
function BeatAdminCard() {
  return (
    <motion.article
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.55, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-2xl border p-6 sm:p-7"
      style={{ borderColor: "rgba(124,111,232,0.25)", backgroundColor: "rgba(14,12,28,0.7)" }}>

      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{ background: "linear-gradient(to right, transparent, rgba(124,111,232,0.7), transparent)" }} />

      <div className="mb-5 inline-flex items-center justify-center rounded-xl p-3"
        style={{ backgroundColor: "rgba(124,111,232,0.12)", border: "1px solid rgba(124,111,232,0.2)" }}>
        <Swords className="h-6 w-6" style={{ color: "var(--brand-violet)" }} strokeWidth={2.5} />
      </div>

      <div className="mb-3 flex items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--brand-violet)" }}>
          1v1 · Head to head
        </span>
      </div>

      <h3 className="font-display text-2xl font-extrabold tracking-tight" style={{ color: "var(--foreground)" }}>
        Beat the Admin
      </h3>
      <p className="mt-1 text-base font-semibold" style={{ color: "rgba(124,111,232,0.9)" }}>
        Think you can beat the house? Prove it.
      </p>
      <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
        Go head-to-head against the admin. Answer correctly and double your stake.
        No crowd to beat, no split prizes — just you versus the house. Win or go home.
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {["Double your stake", "1v1 format", "Instant result", "Pure skill"].map((f) => (
          <span key={f} className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
            style={{ backgroundColor: "rgba(124,111,232,0.09)", color: "rgba(124,111,232,0.85)", border: "1px solid rgba(124,111,232,0.18)" }}>
            {f}
          </span>
        ))}
      </div>

      {/* Multiplier callout */}
      <div className="mt-5 inline-flex items-baseline gap-1.5">
        <span className="font-display text-4xl font-black" style={{ color: "var(--brand-violet)" }}>2×</span>
        <span className="text-sm font-semibold" style={{ color: "var(--muted-foreground)" }}>your stake, instantly</span>
      </div>

      <div className="mt-2">
        <Link href="/auth"
          className="group inline-flex items-center gap-1.5 text-sm font-bold"
          style={{ color: "var(--brand-violet)" }}>
          Challenge the admin
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </motion.article>
  );
}

// Treasure Box card — suspenseful, mystery reveal
function TreasureBoxCard() {
  return (
    <motion.article
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.55, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-2xl border p-6 sm:p-7"
      style={{ borderColor: "rgba(232,163,61,0.25)", backgroundColor: "rgba(18,14,8,0.7)" }}>

      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{ background: "linear-gradient(to right, transparent, rgba(232,163,61,0.7), transparent)" }} />

      <div className="mb-5 inline-flex items-center justify-center rounded-xl p-3"
        style={{ backgroundColor: "rgba(232,163,61,0.12)", border: "1px solid rgba(232,163,61,0.22)" }}>
        <span style={{ fontSize: 22 }}>🎁</span>
      </div>

      <div className="mb-3 flex items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--brand-amber)" }}>
          Discovery · Multiplier
        </span>
      </div>

      <h3 className="font-display text-2xl font-extrabold tracking-tight" style={{ color: "var(--foreground)" }}>
        Treasure Box
      </h3>
      <p className="mt-1 text-base font-semibold" style={{ color: "rgba(232,163,61,0.9)" }}>
        Find it. Win it.
      </p>
      <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
        A box hides treasure across dozens of slots. Pop slots with your stake on the line —
        find the treasure and multiply your money. Suspense on every tap.
      </p>

      {/* Multiplier badges */}
      <div className="mt-5 flex items-center gap-2">
        <span className="text-[11px] font-semibold" style={{ color: "var(--muted-foreground)" }}>Available multipliers:</span>
        {["2×", "6×", "10×"].map((m) => (
          <span key={m} className="rounded px-2 py-0.5 font-display text-sm font-extrabold"
            style={{ backgroundColor: "rgba(232,163,61,0.12)", color: "var(--brand-amber)", border: "1px solid rgba(232,163,61,0.22)" }}>
            {m}
          </span>
        ))}
      </div>

      {/* Fairness callout */}
      <div className="mt-5 flex items-start gap-2.5 rounded-xl p-3"
        style={{ backgroundColor: "rgba(232,163,61,0.05)", border: "1px solid rgba(232,163,61,0.12)" }}>
        <Shield className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "rgba(232,163,61,0.6)" }} />
        <p className="text-[11px] leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
          Every box&apos;s odds are calculated and capped upfront. You see the risk before you stake — no hidden house edges.
        </p>
      </div>

      <Link href="/auth"
        className="group mt-5 inline-flex items-center gap-1.5 text-sm font-bold"
        style={{ color: "var(--brand-amber)" }}>
        Open a box
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </Link>
    </motion.article>
  );
}

function Games() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:py-20">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.5 }}
        className="mb-10">
        <h2 className="font-display font-extrabold tracking-tight"
          style={{ color: "var(--foreground)", fontSize: "clamp(1.75rem, 5.5vw, 2.8rem)" }}>
          Three ways to <span style={{ color: "var(--brand-amber)" }}>win</span>
        </h2>
        <p className="mt-2 text-sm leading-relaxed sm:text-base" style={{ color: "var(--muted-foreground)", maxWidth: "44ch" }}>
          Pick your format. Each one pays out differently — find yours.
        </p>
      </motion.div>

      <div className="grid gap-5 md:grid-cols-3">
        <BlitzCard />
        <BeatAdminCard />
        <TreasureBoxCard />
      </div>
    </section>
  );
}

// ─── How it works ─────────────────────────────────────────────────────────
const STEPS = [
  { n: "01", icon: Wallet,    title: "Create & fund", copy: "Sign up free. Add money to your wallet via card, transfer, or USSD — takes 60 seconds." },
  { n: "02", icon: Zap,       title: "Pick a game",   copy: "Enter Blitz, go 1v1 against the admin, or stake on a Treasure Box. Odds shown before you commit." },
  { n: "03", icon: Trophy,    title: "Win & withdraw", copy: "Win? Your balance updates instantly. Withdraw to your bank account — no waiting, no tricks." },
];

function HowItWorks() {
  return (
    <section className="relative border-y py-14 lg:py-20"
      style={{ borderColor: "var(--border)", backgroundColor: "rgba(255,255,255,0.018)" }}>
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}>
          <h2 className="font-display font-extrabold tracking-tight"
            style={{ color: "var(--foreground)", fontSize: "clamp(1.75rem, 5.5vw, 2.8rem)" }}>
            How it works
          </h2>
          <p className="mt-2 text-sm leading-relaxed sm:text-base" style={{ color: "var(--muted-foreground)" }}>
            Three steps between you and a payout.
          </p>
        </motion.div>

        <div className="mt-10 grid gap-10 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <motion.div key={s.n}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}>
              <span className="block font-display text-5xl font-extrabold"
                style={{ color: "rgba(76,111,255,0.16)", lineHeight: 1 }}>{s.n}</span>
              <div className="mt-4 grid h-11 w-11 place-items-center rounded-xl border"
                style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}>
                <s.icon className="h-5 w-5" style={{ color: "var(--brand-amber)" }} strokeWidth={2.2} />
              </div>
              <h3 className="mt-4 font-display text-lg font-bold" style={{ color: "var(--foreground)" }}>{s.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{s.copy}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Trust signals ─────────────────────────────────────────────────────────
function TrustSignals() {
  const TRUST = [
    { icon: Lock,    label: "Secure payments",    detail: "Deposits and withdrawals via Squad — PCI-compliant, bank-grade security." },
    { icon: Shield,  label: "Transparent odds",   detail: "Every game's payout odds are shown before you stake. No hidden house edges, ever." },
    { icon: Trophy,  label: "Instant payouts",    detail: "Winnings hit your wallet the moment your round resolves. Withdraw to bank within minutes." },
    { icon: Users,   label: "Real players",        detail: "12,000+ active players this week. Live leaderboards, real competition." },
  ];

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:py-20">
      <motion.div
        initial={{ opacity: 0, y: 22 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.5 }}
        className="mb-10">
        <h2 className="font-display font-extrabold tracking-tight"
          style={{ color: "var(--foreground)", fontSize: "clamp(1.75rem, 5.5vw, 2.8rem)" }}>
          Why BitLyfe?
        </h2>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TRUST.map((t, i) => (
          <motion.div key={t.label}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.45, delay: i * 0.08 }}
            className="rounded-2xl border p-5"
            style={{ borderColor: "var(--border)", backgroundColor: "rgba(18,22,31,0.5)" }}>
            <div className="mb-4 grid h-10 w-10 place-items-center rounded-xl border"
              style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}>
              <t.icon className="h-5 w-5" style={{ color: "var(--brand-amber)" }} strokeWidth={2.2} />
            </div>
            <p className="font-display text-sm font-bold" style={{ color: "var(--foreground)" }}>{t.label}</p>
            <p className="mt-1.5 text-xs leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{t.detail}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ─── Social proof + CTA ───────────────────────────────────────────────────
function Payout() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-10 pb-16 sm:px-6 lg:py-16">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-2xl border px-6 py-10 text-center sm:rounded-[2rem] sm:px-10 sm:py-14"
        style={{ borderColor: "var(--border)", backgroundColor: "rgba(18,22,31,0.65)" }}>

        <div aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 rounded-full blur-[90px]"
          style={{ backgroundColor: "rgba(232,163,61,0.14)" }} />

        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold"
            style={{ borderColor: "rgba(34,197,94,0.3)", backgroundColor: "rgba(34,197,94,0.08)", color: "var(--brand-green)" }}>
            <span className="live-dot" />
            Live payouts
          </span>

          <p className="mt-4 font-display font-extrabold tracking-tight"
            style={{ color: "var(--foreground)", fontSize: "clamp(2.4rem, 8vw, 4.5rem)" }}>
            <CountUp to={2400000} prefix="₦" />
          </p>
          <p className="mt-1 text-sm" style={{ color: "var(--muted-foreground)" }}>paid out this week</p>

          <p className="mt-4 text-base font-semibold" style={{ color: "var(--foreground)" }}>
            Join 12,000+ players winning right now.
          </p>
          <p className="mt-1 text-sm" style={{ color: "var(--muted-foreground)", maxWidth: "36ch", margin: "4px auto 0" }}>
            Your knowledge, your instincts, your call. The house doesn&apos;t know you yet.
          </p>

          <Link href="/auth"
            className="group mt-8 inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-black transition-transform hover:scale-[1.03] active:scale-100"
            style={{ backgroundColor: "var(--brand-amber)", color: "#080B14", boxShadow: "0 6px 28px -4px rgba(232,163,61,0.5)" }}>
            Start Playing Free
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <p className="mt-3 text-xs" style={{ color: "var(--muted-foreground)" }}>
            No entry fee to sign up · Works instantly on mobile
          </p>
        </div>
      </motion.div>
    </section>
  );
}

// ─── Referral snippet ────────────────────────────────────────────────────
function ReferralSnippet() {
  return (
    <section className="border-t py-10" style={{ borderColor: "var(--border)", backgroundColor: "rgba(255,255,255,0.015)" }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border"
              style={{ borderColor: "rgba(76,111,255,0.25)", backgroundColor: "rgba(76,111,255,0.08)" }}>
              <Gift className="h-5 w-5" style={{ color: "var(--brand-indigo)" }} />
            </div>
            <div>
              <p className="font-display text-base font-bold" style={{ color: "var(--foreground)" }}>
                Invite friends — both of you win
              </p>
              <p className="mt-1 text-sm" style={{ color: "var(--muted-foreground)", maxWidth: "46ch" }}>
                Refer a friend, get ₦200 bonus when they play their first game.
                New players get 15% of their first deposit matched (up to ₦1,000).
              </p>
            </div>
          </div>
          <Link href="/auth"
            className="shrink-0 rounded-full border px-5 py-2.5 text-sm font-bold"
            style={{ borderColor: "rgba(76,111,255,0.3)", color: "var(--brand-indigo)", backgroundColor: "rgba(76,111,255,0.08)" }}>
            Sign up &amp; refer
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="border-t py-8" style={{ borderColor: "var(--border)", backgroundColor: "var(--brand-bg)" }}>
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-4 px-4 sm:flex-row sm:justify-between sm:px-6">
        <div className="flex items-center gap-2">
          <img src="/bitlyfe-mark.svg" alt="BitLyfe" width={26} height={26} />
          <span className="font-display text-base font-extrabold tracking-tight" style={{ color: "var(--foreground)" }}>
            Bit<span style={{ color: "var(--brand-amber)" }}>lyfe</span>
          </span>
        </div>
        <div className="flex items-center gap-5 text-xs" style={{ color: "var(--muted-foreground)" }}>
          <Link href="/terms"   className="transition-colors hover:text-white">Terms</Link>
          <Link href="/privacy" className="transition-colors hover:text-white">Privacy</Link>
          <Link href="/support" className="transition-colors hover:text-white">Support</Link>
          <Link href="/admin"   className="transition-colors hover:text-white opacity-30 hover:opacity-100">Admin</Link>
        </div>
        <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>© 2026 Bitlyfe</p>
      </div>
    </footer>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────
export default function LandingPage() {
  const { state, hydrated } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (hydrated && state.isAuthenticated) router.replace("/treasure-box");
  }, [hydrated, state.isAuthenticated, router]);

  if (hydrated && state.isAuthenticated) return null;

  return (
    <main style={{ backgroundColor: "var(--brand-bg)", color: "var(--foreground)", minHeight: "100vh" }}>
      <Hero />
      <Ticker />
      <Games />
      <HowItWorks />
      <TrustSignals />
      <ReferralSnippet />
      <Payout />
      <Footer />
    </main>
  );
}
