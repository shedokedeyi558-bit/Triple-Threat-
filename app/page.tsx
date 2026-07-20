"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import { motion, useInView } from "framer-motion";
import {
  ArrowRight, Timer, Sparkles, Zap, Clock, GraduationCap,
  Wallet, MousePointerClick, PartyPopper, Trophy,
} from "lucide-react";

// ── CSS variables bridged to Tailwind inline styles ────────────────────────
// We use inline style objects for the brand colors so no extra Tailwind config needed.

// ── Gradient mesh background ───────────────────────────────────────────────
function GradientMesh() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="animate-blob-1 absolute -left-[10%] top-[-15%] h-[55vh] w-[55vh] rounded-full blur-[100px]"
        style={{ backgroundColor: "rgba(76,111,255,0.40)" }} />
      <div className="animate-blob-2 absolute right-[-10%] top-[10%] h-[50vh] w-[50vh] rounded-full blur-[110px]"
        style={{ backgroundColor: "rgba(124,111,232,0.35)" }} />
      <div className="animate-blob-3 absolute bottom-[-20%] left-[25%] h-[45vh] w-[45vh] rounded-full blur-[120px]"
        style={{ backgroundColor: "rgba(232,163,61,0.20)" }} />
      <div className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse at center, transparent 35%, var(--brand-bg, #080B14) 95%)" }} />
    </div>
  );
}

// ── CountUp ────────────────────────────────────────────────────────────────
function CountUp({ to, duration = 2, prefix = "" }: { to: number; duration?: number; prefix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / (duration * 1000), 1);
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setValue(Math.round(to * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to, duration]);
  return <span ref={ref}>{prefix}{value.toLocaleString("en-NG")}</span>;
}

// ── Winner ticker ─────────────────────────────────────────────────────────
const WINNERS = [
  { phone: "0803***7891", amount: "₦80,000" },
  { phone: "0706***2214", amount: "₦12,500" },
  { phone: "0813***0098", amount: "₦150,000" },
  { phone: "0902***4471", amount: "₦5,000" },
  { phone: "0817***6620", amount: "₦42,000" },
  { phone: "0705***1183", amount: "₦25,000" },
  { phone: "0809***9925", amount: "₦300,000" },
  { phone: "0814***3307", amount: "₦18,750" },
];

function Ticker() {
  const items = [...WINNERS, ...WINNERS];
  return (
    <section aria-label="Recent winners"
      className="relative flex overflow-hidden border-y py-4"
      style={{ borderColor: "var(--border)", backgroundColor: "rgba(255,255,255,0.03)" }}>
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24"
        style={{ background: "linear-gradient(to right, var(--brand-bg, #080B14), transparent)" }} />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24"
        style={{ background: "linear-gradient(to left, var(--brand-bg, #080B14), transparent)" }} />
      <div className="animate-marquee flex shrink-0 items-center gap-4 pr-4">
        {items.map((w, i) => (
          <div key={i} className="flex items-center gap-2.5 whitespace-nowrap rounded-full border px-4 py-2 text-sm"
            style={{ borderColor: "var(--border)", backgroundColor: "rgba(18,22,31,0.5)" }}>
            <Trophy className="h-4 w-4" style={{ color: "var(--brand-amber)" }} />
            <span className="font-mono" style={{ color: "var(--muted-foreground)" }}>{w.phone}</span>
            <span style={{ color: "var(--muted-foreground)" }}>just won</span>
            <span className="font-bold" style={{ color: "var(--brand-green)" }}>{w.amount}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Countdown hook ────────────────────────────────────────────────────────
function useCountdown(seconds: number) {
  const [time, setTime] = useState(seconds);
  useEffect(() => {
    const id = setInterval(() => setTime((t) => (t <= 0 ? seconds : t - 1)), 1000);
    return () => clearInterval(id);
  }, [seconds]);
  return time;
}

// ── Hero ──────────────────────────────────────────────────────────────────
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};
const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } },
};

function Hero() {
  const time = useCountdown(15);
  const pct = (time / 15) * 100;
  return (
    <section className="relative flex min-h-screen flex-col overflow-hidden" style={{ backgroundColor: "var(--brand-bg)" }}>
      <GradientMesh />
      {/* Nav */}
      <div className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-6">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <img src="/bitlyfe-mark.svg" alt="BitLyfe" width={32} height={32} />
          <span className="font-display text-xl font-extrabold tracking-tight" style={{ color: "var(--foreground)" }}>
            Bit<span style={{ color: "var(--brand-amber)" }}>lyfe</span>
          </span>
        </div>
        <Link href="/signin"
          className="hidden rounded-full border px-5 py-2 text-sm font-semibold backdrop-blur-sm transition-colors hover:bg-white/10 sm:inline-block"
          style={{ borderColor: "rgba(255,255,255,0.15)", color: "var(--foreground)", backgroundColor: "rgba(255,255,255,0.05)" }}>
          Sign in
        </Link>
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto grid w-full max-w-7xl flex-1 items-center gap-12 px-5 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:py-16">
        <motion.div variants={container} initial="hidden" animate="show" className="max-w-2xl">
          <motion.span variants={item}
            className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium"
            style={{ borderColor: "rgba(232,163,61,0.3)", backgroundColor: "rgba(232,163,61,0.1)", color: "var(--brand-amber)" }}>
            <Sparkles className="h-3.5 w-3.5" />
            Nigeria&apos;s fastest real-money trivia
          </motion.span>

          <motion.h1 variants={item}
            className="mt-6 font-display text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl xl:text-8xl"
            style={{ color: "var(--foreground)" }}>
            Real Stakes.<br />
            <span style={{ color: "var(--brand-amber)" }}>Real Fast.</span>
          </motion.h1>

          <motion.p variants={item} className="mt-6 max-w-lg text-lg leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
            Answer a question, predict the future, win instantly. Pay a small entry, beat the clock,
            and cash out — straight to your phone.
          </motion.p>

          <motion.div variants={item} className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link href="/auth"
              className="group inline-flex items-center justify-center gap-2 rounded-full px-7 py-4 text-base font-bold transition-transform hover:scale-[1.03] active:scale-100"
              style={{ backgroundColor: "var(--brand-amber)", color: "#080B14", boxShadow: "0 8px 30px -6px var(--brand-amber)" }}>
              Play Now
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              Works like an app — no App Store needed. Add to home screen.
            </span>
          </motion.div>

          <motion.div variants={item} className="mt-10 flex items-center gap-6 text-sm" style={{ color: "var(--muted-foreground)" }}>
            <div>
              <span className="block font-display text-2xl font-bold" style={{ color: "var(--foreground)" }}>₦2.4M+</span>
              paid this week
            </div>
            <div className="h-8 w-px" style={{ backgroundColor: "var(--border)" }} />
            <div>
              <span className="block font-display text-2xl font-bold" style={{ color: "var(--foreground)" }}>12k+</span>
              daily players
            </div>
          </motion.div>
        </motion.div>

        {/* Floating question pill card */}
        <div className="relative flex justify-center lg:justify-end">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-sm">
            <motion.div
              animate={{ y: [0, -14, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="relative rounded-[2rem] border p-6 shadow-2xl backdrop-blur-xl"
              style={{ borderColor: "rgba(255,255,255,0.1)", backgroundColor: "rgba(18,22,31,0.7)" }}>
              {/* glow pulse */}
              <motion.div aria-hidden="true"
                animate={{ opacity: [0.35, 0.7, 0.35] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -inset-px -z-10 rounded-[2rem] blur-2xl"
                style={{ backgroundColor: "rgba(76,111,255,0.4)" }} />
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold"
                  style={{ backgroundColor: "rgba(76,111,255,0.15)", color: "var(--brand-indigo)" }}>
                  <span className="h-2 w-2 animate-pulse rounded-full" style={{ backgroundColor: "var(--brand-indigo)" }} />
                  LIVE PILL
                </span>
                <span className="inline-flex items-center gap-1.5 text-sm font-bold" style={{ color: "var(--brand-amber)" }}>
                  <Timer className="h-4 w-4" />
                  0:{time.toString().padStart(2, "0")}
                </span>
              </div>
              {/* countdown bar */}
              <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>
                <div className="h-full rounded-full transition-[width] duration-1000 ease-linear"
                  style={{ width: `${pct}%`, backgroundColor: "var(--brand-amber)" }} />
              </div>
              <p className="mt-5 font-display text-xl font-bold leading-snug" style={{ color: "var(--foreground)" }}>
                Which Nigerian city is nicknamed the &ldquo;Centre of Excellence&rdquo;?
              </p>
              <div className="mt-5 grid gap-2.5">
                {["Lagos", "Abuja", "Ibadan", "Kano"].map((opt, i) => (
                  <button key={opt}
                    className="flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-semibold transition-colors"
                    style={i === 0
                      ? { borderColor: "rgba(76,111,255,0.6)", backgroundColor: "rgba(76,111,255,0.15)", color: "var(--foreground)" }
                      : { borderColor: "rgba(255,255,255,0.1)", backgroundColor: "rgba(255,255,255,0.05)", color: "var(--muted-foreground)" }}>
                    <span>{opt}</span>
                    <span className="grid h-5 w-5 place-items-center rounded-md border text-xs" style={{ borderColor: "rgba(255,255,255,0.15)" }}>
                      {String.fromCharCode(65 + i)}
                    </span>
                  </button>
                ))}
              </div>
              <div className="mt-5 flex items-center justify-between text-xs" style={{ color: "var(--muted-foreground)" }}>
                <span>Entry: ₦200</span>
                <span className="font-bold" style={{ color: "var(--brand-green)" }}>Win up to ₦600,000</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ── Products ──────────────────────────────────────────────────────────────
const PRODUCTS = [
  { icon: Zap, name: "Pills", tagline: "Answer & win instantly", color: "var(--brand-indigo)",
    description: "Answer a question, win instantly. Timer counts down in real time — beat the clock to cash out." },
  { icon: Clock, name: "Time Machine", tagline: "Predict the future", color: "var(--brand-violet)",
    description: "Predict the future. Enter before the deadline, collect if you're right. Bigger calls, bigger wins." },
  { icon: GraduationCap, name: "Specials", tagline: "High-stakes challenges · up to ₦600,000", color: "var(--brand-amber)",
    description: "Exam-format challenges. One attempt, no second chances. High stakes for the sharpest minds." },
];

function Products() {
  return (
    <section className="mx-auto w-full max-w-7xl px-5 py-20 lg:py-28">
      <div className="max-w-2xl">
        <h2 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl" style={{ color: "var(--foreground)" }}>
          Three ways to <span style={{ color: "var(--brand-indigo)" }}>win</span>
        </h2>
        <p className="mt-4 text-lg leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
          Pick your game. Every format is fast, fair, and pays out the moment you win.
        </p>
      </div>
      <div className="mt-12 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 md:grid md:grid-cols-3 md:overflow-visible">
        {PRODUCTS.map((p, i) => (
          <motion.article key={p.name}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.55, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="group relative min-w-[80%] shrink-0 snap-center rounded-3xl border p-7 sm:min-w-[60%] md:min-w-0"
            style={{ borderColor: "var(--border)", backgroundColor: "rgba(18,22,31,0.5)" }}>
            {/* animated border glow on hover */}
            <div aria-hidden="true"
              className="pointer-events-none absolute -inset-px -z-10 rounded-3xl opacity-0 blur-md transition-opacity duration-500 group-hover:opacity-60"
              style={{ background: p.color }} />
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4 + i, repeat: Infinity, ease: "easeInOut" }}
              className="grid h-14 w-14 place-items-center rounded-2xl"
              style={{ backgroundColor: `color-mix(in srgb, ${p.color} 18%, transparent)` }}>
              <p.icon className="h-7 w-7" style={{ color: p.color }} strokeWidth={2.2} />
            </motion.div>
            <h3 className="mt-6 font-display text-2xl font-bold" style={{ color: "var(--foreground)" }}>{p.name}</h3>
            <p className="mt-1 text-sm font-semibold" style={{ color: p.color }}>{p.tagline}</p>
            <p className="mt-4 leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{p.description}</p>
          </motion.article>
        ))}
      </div>
    </section>
  );
}

// ── How it works ──────────────────────────────────────────────────────────
const STEPS = [
  { n: "01", icon: Wallet, title: "Pay entry", copy: "Fund your wallet and join a game from as little as ₦200." },
  { n: "02", icon: MousePointerClick, title: "Answer", copy: "Beat the countdown with the right answer or prediction." },
  { n: "03", icon: PartyPopper, title: "Win instantly", copy: "Winnings hit your wallet the moment the round closes." },
];

function HowItWorks() {
  return (
    <section className="relative border-y py-20 lg:py-28"
      style={{ borderColor: "var(--border)", backgroundColor: "rgba(255,255,255,0.02)" }}>
      <div className="mx-auto w-full max-w-7xl px-5">
        <div className="max-w-2xl">
          <h2 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl" style={{ color: "var(--foreground)" }}>
            How it works
          </h2>
          <p className="mt-4 text-lg leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
            Three steps between you and a payout. No middlemen, no waiting.
          </p>
        </div>
        <div className="mt-14 grid gap-10 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <motion.div key={s.n}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="relative">
              <motion.span
                initial={{ opacity: 0, scale: 0.6 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.15 + 0.1, ease: [0.34, 1.56, 0.64, 1] }}
                className="block font-display text-6xl font-extrabold"
                style={{ color: "rgba(76,111,255,0.25)" }}>
                {s.n}
              </motion.span>
              <div className="mt-4 grid h-12 w-12 place-items-center rounded-xl border"
                style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}>
                <s.icon className="h-6 w-6" style={{ color: "var(--brand-amber)" }} strokeWidth={2.2} />
              </div>
              <h3 className="mt-5 font-display text-2xl font-bold" style={{ color: "var(--foreground)" }}>{s.title}</h3>
              <p className="mt-2 leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{s.copy}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Payout CTA ────────────────────────────────────────────────────────────
function Payout() {
  const AVATAR_COLORS = ["var(--brand-indigo)", "var(--brand-violet)", "var(--brand-amber)", "var(--brand-green)", "var(--brand-indigo)"];
  return (
    <section id="play" className="mx-auto w-full max-w-7xl px-5 py-20 lg:py-28">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-[2.5rem] border px-6 py-14 text-center sm:px-12"
        style={{ borderColor: "var(--border)", backgroundColor: "rgba(18,22,31,0.6)" }}>
        <div aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full blur-[100px]"
          style={{ backgroundColor: "rgba(76,111,255,0.25)" }} />
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold"
            style={{ borderColor: "rgba(34,197,94,0.3)", backgroundColor: "rgba(34,197,94,0.1)", color: "var(--brand-green)" }}>
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
                style={{ backgroundColor: "var(--brand-green)" }} />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: "var(--brand-green)" }} />
            </span>
            Live payouts
          </span>
          <p className="mt-6 font-display text-6xl font-extrabold tracking-tight sm:text-7xl lg:text-8xl"
            style={{ color: "var(--foreground)" }}>
            <CountUp to={2400000} prefix="₦" duration={2.4} />
          </p>
          <p className="mt-3 text-lg" style={{ color: "var(--muted-foreground)" }}>paid out this week</p>
          <div className="mt-10 flex items-center justify-center">
            <div className="flex -space-x-3">
              {AVATAR_COLORS.map((c, i) => (
                <span key={i} className="h-11 w-11 rounded-full border-2 blur-[1.5px]"
                  aria-hidden="true"
                  style={{ background: `radial-gradient(circle at 30% 30%, ${c}, transparent 90%)`, backgroundColor: c, borderColor: "var(--brand-bg)" }} />
              ))}
              <span className="grid h-11 w-11 place-items-center rounded-full border-2 text-xs font-bold"
                style={{ backgroundColor: "var(--secondary)", borderColor: "var(--brand-bg)", color: "var(--foreground)" }}>
                +9k
              </span>
            </div>
          </div>
          <p className="mt-4 text-sm" style={{ color: "var(--muted-foreground)" }}>
            Join 9,000+ winners cashing out this week.
          </p>
          <Link href="/auth"
            className="group mt-9 inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 text-base font-bold transition-transform hover:scale-[1.03] active:scale-100"
            style={{ backgroundColor: "var(--brand-amber)", color: "#080B14", boxShadow: "0 8px 30px -6px var(--brand-amber)" }}>
            Play Now
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </motion.div>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="border-t py-10" style={{ borderColor: "var(--border)", backgroundColor: "var(--brand-bg)" }}>
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-6 px-5 sm:flex-row sm:justify-between">
        <div className="flex items-center gap-2">
          <img src="/bitlyfe-mark.svg" alt="BitLyfe" width={28} height={28} />
          <span className="font-display text-lg font-extrabold tracking-tight" style={{ color: "var(--foreground)" }}>
            Bit<span style={{ color: "var(--brand-amber)" }}>lyfe</span>
          </span>
        </div>
        <div className="flex items-center gap-6 text-sm" style={{ color: "var(--muted-foreground)" }}>
          <Link href="/terms" className="transition-colors hover:text-white">Terms</Link>
          <Link href="/privacy" className="transition-colors hover:text-white">Privacy</Link>
          <Link href="/support" className="transition-colors hover:text-white">Support</Link>
        </div>
        <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>© 2026 Bitlyfe</p>
      </div>
    </footer>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────
export default function LandingPage() {
  const { state, hydrated } = useApp();
  const router = useRouter();

  // Redirect authenticated players straight to the app
  useEffect(() => {
    if (hydrated && state.isAuthenticated) router.replace("/pills");
  }, [hydrated, state.isAuthenticated, router]);

  if (hydrated && state.isAuthenticated) return null;

  return (
    <main style={{ backgroundColor: "var(--brand-bg)", color: "var(--foreground)", minHeight: "100vh" }}>
      <Hero />
      <Ticker />
      <Products />
      <HowItWorks />
      <Payout />
      <Footer />
    </main>
  );
}
