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

// ── Gradient mesh ─────────────────────────────────────────────────────────
function GradientMesh() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="animate-blob-1 absolute -left-[10%] top-[-15%] h-[55vh] w-[55vh] rounded-full blur-[100px]"
        style={{ backgroundColor: "rgba(76,111,255,0.35)" }} />
      <div className="animate-blob-2 absolute right-[-10%] top-[10%] h-[50vh] w-[50vh] rounded-full blur-[110px]"
        style={{ backgroundColor: "rgba(124,111,232,0.28)" }} />
      <div className="animate-blob-3 absolute bottom-[-20%] left-[25%] h-[45vh] w-[45vh] rounded-full blur-[120px]"
        style={{ backgroundColor: "rgba(232,163,61,0.15)" }} />
      <div className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse at center, transparent 35%, var(--brand-bg, #080B14) 90%)" }} />
    </div>
  );
}

// ── CountUp ────────────────────────────────────────────────────────────────
function CountUp({ to, duration = 2, prefix = "" }: { to: number; duration?: number; prefix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
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
      className="relative flex overflow-hidden border-y py-3"
      style={{ borderColor: "var(--border)", backgroundColor: "rgba(255,255,255,0.03)" }}>
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16"
        style={{ background: "linear-gradient(to right, var(--brand-bg,#080B14), transparent)" }} />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16"
        style={{ background: "linear-gradient(to left, var(--brand-bg,#080B14), transparent)" }} />
      <div className="animate-marquee flex shrink-0 items-center gap-3 pr-3">
        {items.map((w, i) => (
          <div key={i} className="flex items-center gap-2 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs"
            style={{ borderColor: "var(--border)", backgroundColor: "rgba(18,22,31,0.5)" }}>
            <Trophy className="h-3 w-3" style={{ color: "var(--brand-amber)" }} />
            <span className="font-mono" style={{ color: "var(--muted-foreground)" }}>{w.phone}</span>
            <span style={{ color: "var(--muted-foreground)" }}>won</span>
            <span className="font-bold" style={{ color: "var(--brand-green)" }}>{w.amount}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Countdown hook ─────────────────────────────────────────────────────────
function useCountdown(seconds: number) {
  const [time, setTime] = useState(seconds);
  useEffect(() => {
    const id = setInterval(() => setTime((t) => (t <= 0 ? seconds : t - 1)), 1000);
    return () => clearInterval(id);
  }, [seconds]);
  return time;
}

// ── Hero ───────────────────────────────────────────────────────────────────
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const } },
};

function FloatingCard() {
  const time = useCountdown(15);
  const pct = (time / 15) * 100;
  return (
    <motion.div
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      className="relative rounded-2xl border p-5 shadow-2xl backdrop-blur-xl"
      style={{ borderColor: "rgba(255,255,255,0.1)", backgroundColor: "rgba(18,22,31,0.75)" }}>
      <motion.div aria-hidden="true"
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 3, repeat: Infinity }}
        className="absolute -inset-px -z-10 rounded-2xl blur-2xl"
        style={{ backgroundColor: "rgba(76,111,255,0.35)" }} />
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold"
          style={{ backgroundColor: "rgba(76,111,255,0.15)", color: "var(--brand-indigo)" }}>
          <span className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ backgroundColor: "var(--brand-indigo)" }} />
          LIVE PILL
        </span>
        <span className="inline-flex items-center gap-1 text-xs font-bold" style={{ color: "var(--brand-amber)" }}>
          <Timer className="h-3.5 w-3.5" />0:{time.toString().padStart(2, "0")}
        </span>
      </div>
      <div className="mt-3 h-1 w-full overflow-hidden rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>
        <div className="h-full rounded-full transition-[width] duration-1000"
          style={{ width: `${pct}%`, backgroundColor: "var(--brand-amber)" }} />
      </div>
      <p className="mt-4 font-display text-base font-bold leading-snug" style={{ color: "var(--foreground)" }}>
        Which Nigerian city is nicknamed the &ldquo;Centre of Excellence&rdquo;?
      </p>
      <div className="mt-3 grid gap-2">
        {["Lagos", "Abuja", "Ibadan", "Kano"].map((opt, i) => (
          <button key={opt}
            className="flex items-center justify-between rounded-lg border px-3 py-2 text-left text-xs font-semibold"
            style={i === 0
              ? { borderColor: "rgba(76,111,255,0.5)", backgroundColor: "rgba(76,111,255,0.12)", color: "var(--foreground)" }
              : { borderColor: "rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.04)", color: "var(--muted-foreground)" }}>
            <span>{opt}</span>
            <span className="grid h-4 w-4 place-items-center rounded border text-[10px]"
              style={{ borderColor: "rgba(255,255,255,0.12)" }}>
              {String.fromCharCode(65 + i)}
            </span>
          </button>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between text-[10px]" style={{ color: "var(--muted-foreground)" }}>
        <span>Entry: ₦200</span>
        <span className="font-bold" style={{ color: "var(--brand-green)" }}>Win up to ₦600,000</span>
      </div>
    </motion.div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden" style={{ backgroundColor: "var(--brand-bg)", minHeight: "100svh" }}>
      <GradientMesh />

      {/* Nav */}
      <div className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-5 sm:px-6">
        <div className="flex items-center gap-2">
          <img src="/bitlyfe-mark.svg" alt="BitLyfe" width={30} height={30} />
          <span className="font-display text-lg font-extrabold tracking-tight" style={{ color: "var(--foreground)" }}>
            Bit<span style={{ color: "var(--brand-amber)" }}>lyfe</span>
          </span>
        </div>
        <Link href="/signin"
          className="rounded-full border px-4 py-1.5 text-sm font-semibold backdrop-blur-sm transition-colors"
          style={{ borderColor: "rgba(255,255,255,0.15)", color: "var(--foreground)", backgroundColor: "rgba(255,255,255,0.05)" }}>
          Sign in
        </Link>
      </div>

      {/* Content — single column on mobile, 2-col on desktop */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-12 pt-4 sm:px-6 lg:grid lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-10 lg:py-16">

        {/* Text block */}
        <motion.div variants={container} initial="hidden" animate="show">
          <motion.span variants={item}
            className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium"
            style={{ borderColor: "rgba(232,163,61,0.3)", backgroundColor: "rgba(232,163,61,0.1)", color: "var(--brand-amber)" }}>
            <Sparkles className="h-3 w-3" />
            Nigerians are cashing out daily. Are you next?
          </motion.span>

          <motion.h1 variants={item}
            className="mt-4 font-display font-extrabold leading-[0.9] tracking-tight"
            style={{ color: "var(--foreground)", fontSize: "clamp(2.6rem, 10vw, 5.5rem)" }}>
            Your Knowledge<br />
            <span style={{ color: "var(--brand-amber)" }}>Is Worth Money.</span>
          </motion.h1>

          <motion.p variants={item} className="mt-4 text-base leading-relaxed sm:text-lg" style={{ color: "var(--muted-foreground)", maxWidth: "42ch" }}>
            Answer one question. ₦200 in. Up to ₦600,000 out — straight to your phone.
            No luck. No algorithm. Just you and what you know.
          </motion.p>

          <motion.div variants={item} className="mt-6 flex flex-wrap items-center gap-3">
            <Link href="/auth"
              className="group inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-bold transition-transform hover:scale-[1.03] active:scale-100"
              style={{ backgroundColor: "var(--brand-amber)", color: "#080B14", boxShadow: "0 6px 24px -4px var(--brand-amber)" }}>
              Play Now
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              Works like an app — add to home screen.
            </span>
          </motion.div>

          <motion.div variants={item} className="mt-8 flex items-center gap-5 text-xs" style={{ color: "var(--muted-foreground)" }}>
            <div>
              <span className="block font-display text-xl font-bold" style={{ color: "var(--foreground)" }}>₦2.4M+</span>
              paid this week
            </div>
            <div className="h-6 w-px" style={{ backgroundColor: "var(--border)" }} />
            <div>
              <span className="block font-display text-xl font-bold" style={{ color: "var(--foreground)" }}>12k+</span>
              daily players
            </div>
          </motion.div>
        </motion.div>

        {/* Floating card — visible on mobile below text, side-by-side on desktop */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mt-10 lg:mt-0 lg:flex lg:justify-end">
          <div className="mx-auto w-full max-w-[340px] lg:max-w-none">
            <FloatingCard />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ── Products ───────────────────────────────────────────────────────────────
const PRODUCTS = [
  { icon: Zap, name: "Pills", tagline: "Answer & win instantly", color: "var(--brand-indigo)",
    description: "Answer a question, win instantly. Timer counts down — beat the clock to cash out." },
  { icon: Clock, name: "Time Machine", tagline: "Predict the future", color: "var(--brand-violet)",
    description: "Enter before the deadline, collect if you're right. Bigger calls, bigger wins." },
  { icon: GraduationCap, name: "Specials", tagline: "Up to ₦600,000 prize", color: "var(--brand-amber)",
    description: "Exam-format challenges. One attempt, no second chances. High stakes for sharp minds." },
];

function Products() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:py-20">
      <div>
        <h2 className="font-display font-extrabold tracking-tight" style={{ color: "var(--foreground)", fontSize: "clamp(1.8rem, 6vw, 3rem)" }}>
          Three ways to <span style={{ color: "var(--brand-indigo)" }}>win</span>
        </h2>
        <p className="mt-2 text-sm leading-relaxed sm:text-base" style={{ color: "var(--muted-foreground)", maxWidth: "44ch" }}>
          Pick your game. Every format pays out the moment you win.
        </p>
      </div>
      {/* Horizontal scroll on mobile, 3-col grid on md+ */}
      <div className="mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 md:grid md:grid-cols-3 md:overflow-visible"
        style={{ scrollbarWidth: "none" }}>
        {PRODUCTS.map((p, i) => (
          <motion.article key={p.name}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="group relative min-w-[78vw] max-w-[78vw] shrink-0 snap-center overflow-hidden rounded-2xl border p-5 sm:min-w-[55vw] sm:max-w-[55vw] md:min-w-0 md:max-w-none"
            style={{ borderColor: "var(--border)", backgroundColor: "rgba(18,22,31,0.5)" }}>
            <div aria-hidden="true"
              className="pointer-events-none absolute -inset-px -z-10 rounded-2xl opacity-0 blur-md transition-opacity duration-500 group-hover:opacity-50"
              style={{ background: p.color }} />
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 4 + i, repeat: Infinity, ease: "easeInOut" }}
              className="grid h-11 w-11 place-items-center rounded-xl"
              style={{ backgroundColor: `color-mix(in srgb, ${p.color} 15%, transparent)` }}>
              <p.icon className="h-6 w-6" style={{ color: p.color }} strokeWidth={2.2} />
            </motion.div>
            <h3 className="mt-4 font-display text-xl font-bold" style={{ color: "var(--foreground)" }}>{p.name}</h3>
            <p className="mt-0.5 text-xs font-semibold" style={{ color: p.color }}>{p.tagline}</p>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--muted-foreground)", wordBreak: "break-word" }}>{p.description}</p>
          </motion.article>
        ))}
      </div>
    </section>
  );
}

// ── How it works ───────────────────────────────────────────────────────────
const STEPS = [
  { n: "01", icon: Wallet, title: "Pay entry", copy: "Fund your wallet and join a game from ₦200." },
  { n: "02", icon: MousePointerClick, title: "Answer", copy: "Beat the countdown with the right answer." },
  { n: "03", icon: PartyPopper, title: "Win instantly", copy: "Winnings hit your wallet the moment the round closes." },
];

function HowItWorks() {
  return (
    <section className="relative border-y py-12 lg:py-20"
      style={{ borderColor: "var(--border)", backgroundColor: "rgba(255,255,255,0.02)" }}>
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <h2 className="font-display font-extrabold tracking-tight" style={{ color: "var(--foreground)", fontSize: "clamp(1.8rem, 6vw, 3rem)" }}>
          How it works
        </h2>
        <p className="mt-2 text-sm leading-relaxed sm:text-base" style={{ color: "var(--muted-foreground)" }}>
          Three steps between you and a payout.
        </p>
        <div className="mt-10 grid gap-8 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <motion.div key={s.n}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}>
              <span className="block font-display text-5xl font-extrabold"
                style={{ color: "rgba(76,111,255,0.2)" }}>{s.n}</span>
              <div className="mt-3 grid h-10 w-10 place-items-center rounded-xl border"
                style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}>
                <s.icon className="h-5 w-5" style={{ color: "var(--brand-amber)" }} strokeWidth={2.2} />
              </div>
              <h3 className="mt-4 font-display text-lg font-bold" style={{ color: "var(--foreground)" }}>{s.title}</h3>
              <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{s.copy}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Payout CTA ─────────────────────────────────────────────────────────────
function Payout() {
  const AVATAR_COLORS = ["var(--brand-indigo)", "var(--brand-violet)", "var(--brand-amber)", "var(--brand-green)", "var(--brand-indigo)"];
  return (
    <section id="play" className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-2xl border px-5 py-8 text-center sm:rounded-[2rem] sm:px-10 sm:py-12"
        style={{ borderColor: "var(--border)", backgroundColor: "rgba(18,22,31,0.6)" }}>
        <div aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-0 h-56 w-56 -translate-x-1/2 rounded-full blur-[80px]"
          style={{ backgroundColor: "rgba(76,111,255,0.2)" }} />
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold"
            style={{ borderColor: "rgba(34,197,94,0.3)", backgroundColor: "rgba(34,197,94,0.1)", color: "var(--brand-green)" }}>
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
                style={{ backgroundColor: "var(--brand-green)" }} />
              <span className="relative inline-flex h-2 w-2 rounded-full"
                style={{ backgroundColor: "var(--brand-green)" }} />
            </span>
            Live payouts
          </span>
          <p className="mt-3 font-display font-extrabold tracking-tight"
            style={{ color: "var(--foreground)", fontSize: "clamp(2.2rem, 8vw, 4rem)" }}>
            <CountUp to={2400000} prefix="₦" duration={2.2} />
          </p>
          <p className="mt-1 text-sm" style={{ color: "var(--muted-foreground)" }}>paid out this week</p>
          <div className="mt-5 flex items-center justify-center">
            <div className="flex -space-x-2">
              {AVATAR_COLORS.map((c, i) => (
                <span key={i} className="h-9 w-9 rounded-full border-2 blur-[1px]" aria-hidden="true"
                  style={{ background: `radial-gradient(circle at 30% 30%, ${c}, transparent 90%)`, backgroundColor: c, borderColor: "var(--brand-bg)" }} />
              ))}
              <span className="grid h-9 w-9 place-items-center rounded-full border-2 text-[10px] font-bold"
                style={{ backgroundColor: "var(--secondary)", borderColor: "var(--brand-bg)", color: "var(--foreground)" }}>
                +9k
              </span>
            </div>
          </div>
          <p className="mt-3 text-xs" style={{ color: "var(--muted-foreground)" }}>
            Join 9,000+ winners cashing out this week.
          </p>
          <Link href="/auth"
            className="group mt-6 inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-bold transition-transform hover:scale-[1.03] active:scale-100"
            style={{ backgroundColor: "var(--brand-amber)", color: "#080B14", boxShadow: "0 6px 24px -4px var(--brand-amber)" }}>
            Play Now
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </motion.div>
    </section>
  );
}

// ── Footer ──────────────────────────────────────────────────────────────────
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
          <Link href="/terms" className="transition-colors hover:text-white">Terms</Link>
          <Link href="/privacy" className="transition-colors hover:text-white">Privacy</Link>
          <Link href="/support" className="transition-colors hover:text-white">Support</Link>
          <Link href="/admin/login" className="transition-colors hover:text-white opacity-40 hover:opacity-100">Admin</Link>
        </div>
        <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>© 2026 Bitlyfe</p>
      </div>
    </footer>
  );
}

// ── Main ────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const { state, hydrated } = useApp();
  const router = useRouter();

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
