"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { motion } from "framer-motion";
import { Pill, Clock, TrendingUp, Users, Zap, ArrowRight, ChevronDown, Gamepad2, DollarSign } from "lucide-react";

interface LiveGame {
  id: string;
  type: "pill" | "prediction";
  title: string;
  category?: string;
  players?: number;
  prize: number;
  timeLeft?: string;
}

export default function LandingPage() {
  const { state } = useApp();
  const router = useRouter();
  const [liveGames, setLiveGames] = useState<LiveGame[]>([]);
  const [loadingGames, setLoadingGames] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Redirect to /play if already authenticated
  useEffect(() => {
    if (state.isAuthenticated) {
      router.push("/play");
    }
  }, [state.isAuthenticated, router]);

  // Fetch live games for preview
  useEffect(() => {
    const fetchLiveGames = async () => {
      try {
        // Fetch from both endpoints to show activity
        const [pillsRes, predictionsRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pills/available`).catch(() => null),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/predictions/active`).catch(() => null),
        ]);

        const games: LiveGame[] = [];

        if (pillsRes?.ok) {
          const pillsData = await pillsRes.json();
          if (pillsData.data?.pills?.slice(0, 2)) {
            pillsData.data.pills.slice(0, 2).forEach((pill: any) => {
              games.push({
                id: pill.id,
                type: "pill",
                title: pill.question?.substring(0, 40) + "..." || "Quick Challenge",
                prize: pill.prize,
              });
            });
          }
        }

        if (predictionsRes?.ok) {
          const predictionsData = await predictionsRes.json();
          if (predictionsData.data?.predictions?.slice(0, 2)) {
            predictionsData.data.predictions.slice(0, 2).forEach((pred: any) => {
              games.push({
                id: pred.id,
                type: "prediction",
                title: pred.question?.substring(0, 40) + "..." || "Prediction",
                players: pred.slots_filled,
                prize: pred.prize_per_winner,
                timeLeft: `${Math.floor(Math.random() * 23) + 1}h`,
              });
            });
          }
        }

        setLiveGames(games.length > 0 ? games : getMockGames());
      } catch {
        setLiveGames(getMockGames());
      } finally {
        setLoadingGames(false);
      }
    };

    fetchLiveGames();
  }, []);

  const getMockGames = (): LiveGame[] => [
    {
      id: "1",
      type: "pill",
      title: "Quick Math Challenge",
      prize: 1000,
    },
    {
      id: "2",
      type: "prediction",
      title: "Football Goal Prediction",
      players: 7,
      prize: 5000,
      timeLeft: "12h",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" },
    },
  };

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white overflow-hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0A0A0A]/80 backdrop-blur-lg border-b border-[#2A2A2A] px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Logo size="sm" />

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            <Link href="/admin" className="text-gray-400 hover:text-white text-sm font-semibold transition-colors">Admin</Link>
            <Link href="/auth" className="text-gray-400 hover:text-white text-sm font-semibold transition-colors">Join</Link>
            <Link href="/signin" className="text-neon font-semibold text-sm hover:text-neon/80 transition-colors">Sign In</Link>
          </div>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-[#1A1A1A] transition-colors"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              }
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile Right Drawer */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Compact Popover Menu - top right corner */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ type: "spring", duration: 0.2 }}
            className="fixed top-16 right-4 z-50 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl py-2 md:hidden shadow-lg"
          >
            <Link href="/admin" onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-2.5 text-gray-400 hover:text-white text-sm font-semibold transition-colors hover:bg-[#2A2A2A]">
              Admin
            </Link>
            <Link href="/auth" onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-2.5 text-gray-400 hover:text-white text-sm font-semibold transition-colors hover:bg-[#2A2A2A]">
              Join
            </Link>
            <Link href="/signin" onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-2.5 text-neon hover:text-neon text-sm font-semibold transition-colors hover:bg-neon/5">
              Sign In
            </Link>
          </motion.div>
        </>
      )}

      {/* Hero Section - Unique Grid Layout */}
      <section className="relative min-h-screen flex items-center justify-center px-4 py-20 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-neon/8 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-neon/5 rounded-full blur-3xl"></div>
          {/* Grid pattern overlay */}
          <div className="absolute inset-0 opacity-[0.02] bg-[linear-gradient(0deg,transparent_24%,rgba(0,255,102,0.05)_25%,rgba(0,255,102,0.05)_26%,transparent_27%,transparent_74%,rgba(0,255,102,0.05)_75%,rgba(0,255,102,0.05)_76%,transparent_77%,transparent),linear-gradient(90deg,transparent_24%,rgba(0,255,102,0.05)_25%,rgba(0,255,102,0.05)_26%,transparent_27%,transparent_74%,rgba(0,255,102,0.05)_75%,rgba(0,255,102,0.05)_76%,transparent_77%,transparent)] bg-[length:50px_50px]"></div>
        </div>

        <div className="relative z-10 w-full max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* Left side - Headline + Value Props */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              {/* Main Headline */}
              <div className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="text-neon text-sm font-black uppercase tracking-widest opacity-80"
                >
                  ◆ Real Money Games
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tighter leading-[1.1]"
                >
                  <span className="block text-white">Think Fast.</span>
                  <span className="block bg-gradient-to-r from-neon via-neon to-neon/60 bg-clip-text text-transparent">Win Big.</span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="text-lg text-gray-400 leading-relaxed max-w-lg"
                >
                  Instant knowledge challenges meet strategic predictions. Play smarter, compete fiercer, earn faster. No gatekeeping—just pure skill and speed.
                </motion.p>
              </div>

              {/* Three unique value props */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="space-y-3"
              >
                {[
                  { icon: Zap, text: "Play in 30 seconds", subtext: "Quick challenges, instant results" },
                  { icon: TrendingUp, text: "Withdraw same day", subtext: "No delays, real money transfers" },
                  { icon: Users, text: "Join 2.5k winners", subtext: "Play with verified players" }
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                    className="flex gap-3 items-start"
                  >
                    <div className="p-2 bg-neon/10 rounded-lg flex-shrink-0 mt-1">
                      <item.icon size={16} className="text-neon" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{item.text}</p>
                      <p className="text-xs text-gray-500">{item.subtext}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              {/* CTA Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.7 }}
                className="pt-4"
              >
                <Link
                  href="/auth"
                  className="inline-flex items-center gap-3 bg-neon text-black font-black px-8 py-4 rounded-full hover:bg-neon/90 transition-all transform hover:scale-105 active:scale-95 text-base uppercase tracking-wide shadow-lg shadow-neon/20"
                >
                  Start Playing <ArrowRight size={18} />
                </Link>
              </motion.div>
            </motion.div>

            {/* Right side - Interactive visual with stats */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="relative h-full min-h-[500px] hidden md:flex items-center justify-center"
            >
              {/* Floating cards showing game types */}
              <div className="relative w-full h-full">
                {/* PILLS card - top left */}
                <motion.div
                  animate={{ y: [0, -20, 0], rotate: [-2, 0, -2] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="absolute top-0 left-0 w-56 bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] border border-neon/30 rounded-2xl p-6 shadow-2xl"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-neon/10 rounded-lg">
                      <Pill size={18} className="text-neon" />
                    </div>
                    <span className="text-xs font-black text-neon uppercase">Pill</span>
                  </div>
                  <p className="text-sm font-bold text-white mb-2">30-Sec Challenge</p>
                  <p className="text-xs text-gray-400 mb-4">Answer fast. Win now.</p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Entry</span>
                      <span className="text-neon font-bold">₦200</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Prize</span>
                      <span className="text-neon font-bold">₦1,000</span>
                    </div>
                  </div>
                </motion.div>

                {/* TIME MACHINE card - bottom right */}
                <motion.div
                  animate={{ y: [0, 20, 0], rotate: [2, 0, 2] }}
                  transition={{ duration: 4, repeat: Infinity, delay: 0.2 }}
                  className="absolute bottom-0 right-0 w-56 bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] border border-purple-500/30 rounded-2xl p-6 shadow-2xl"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-purple-500/10 rounded-lg">
                      <Clock size={18} className="text-purple-400" />
                    </div>
                    <span className="text-xs font-black text-purple-400 uppercase">Prediction</span>
                  </div>
                  <p className="text-sm font-bold text-white mb-2">Strategy Mode</p>
                  <p className="text-xs text-gray-400 mb-4">Predict. Lock. Win.</p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Entry</span>
                      <span className="text-purple-400 font-bold">₦500</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Max Prize</span>
                      <span className="text-purple-400 font-bold">₦2,000+</span>
                    </div>
                  </div>
                </motion.div>

                {/* Center stats hexagon */}
                <motion.div
                  animate={{ scale: [1, 1.05, 1], opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-neon/5 border border-neon/20 rounded-3xl flex items-center justify-center"
                >
                  <div className="text-center">
                    <div className="text-3xl font-black text-neon mb-2">2.5k+</div>
                    <div className="text-sm text-gray-400">Active Players</div>
                    <div className="text-xs text-gray-500 mt-3">₦847k Paid This Month</div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
        >
          <ChevronDown size={24} className="text-neon/50" />
        </motion.div>
      </section>

      {/* Game Modes Section - Asymmetric Layout */}
      <section className="relative py-24 px-4 bg-[#0A0A0A]">
        <div className="max-w-7xl mx-auto">
          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <div className="inline-block mb-4">
              <span className="text-xs font-black text-neon uppercase tracking-widest">◆ Dual Game Engine</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black mb-4">Two Modes. Infinite Possibilities.</h2>
            <p className="text-gray-400 text-lg max-w-2xl">
              Choose your arena. Instant reflexes or strategic thinking. Both paths lead to real money.
            </p>
          </motion.div>

          {/* Asymmetric game mode cards */}
          <div className="grid md:grid-cols-5 gap-6 items-stretch">
            {/* PILLS - Left side (takes up 3 columns) */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              transition={{ delay: 0.1 }}
              viewport={{ once: true }}
              className="md:col-span-3 bg-gradient-to-br from-[#1A1A1A] via-[#111] to-[#0A0A0A] border border-neon/20 rounded-3xl p-10 hover:border-neon/50 transition-all group relative overflow-hidden"
            >
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-neon/0 via-transparent to-neon/0 opacity-0 group-hover:opacity-10 transition-opacity rounded-3xl"></div>

              <div className="relative z-10 space-y-8">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-3 bg-neon/10 rounded-xl group-hover:bg-neon/20 transition-colors">
                        <Pill size={28} className="text-neon" />
                      </div>
                      <span className="px-4 py-1.5 bg-neon/10 text-neon text-xs font-black rounded-full uppercase">Instant</span>
                    </div>
                    <h3 className="text-3xl font-black mb-2">PILLS</h3>
                    <p className="text-gray-400 leading-relaxed">
                      Drop into quick knowledge battles. Reveal your question, answer in real-time, know your fate instantly. Pure speed. Pure reaction.
                    </p>
                  </div>
                </div>

                {/* Features grid */}
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Time", value: "30-60s" },
                    { label: "Mode", value: "MC or Text" },
                    { label: "Payout", value: "Instant" },
                    { label: "Replay", value: "One Shot" }
                  ].map((feat, i) => (
                    <div key={i} className="bg-[#111] border border-[#2A2A2A] rounded-xl p-3 group-hover:border-neon/20 transition-colors">
                      <p className="text-xs text-gray-500 mb-1">{feat.label}</p>
                      <p className="text-sm font-bold text-neon">{feat.value}</p>
                    </div>
                  ))}
                </div>

                {/* Example pricing */}
                <div className="flex items-end justify-between pt-4 border-t border-[#2A2A2A]">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Average Prize</p>
                    <p className="text-2xl font-black text-neon">₦1,000 - ₦5,000</p>
                  </div>
                  <Link
                    href="/auth"
                    className="flex items-center gap-2 px-6 py-3 bg-neon text-black font-bold rounded-lg hover:bg-neon/90 transition-colors"
                  >
                    <Zap size={16} /> Try Now
                  </Link>
                </div>
              </div>
            </motion.div>

            {/* TIME MACHINE - Right side (takes up 2 columns) + Stats */}
            <div className="md:col-span-2 space-y-6">
              {/* TIME MACHINE card */}
              <motion.div
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                transition={{ delay: 0.2 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-purple-900/20 via-[#111] to-[#0A0A0A] border border-purple-500/20 rounded-3xl p-8 hover:border-purple-500/50 transition-all group relative overflow-hidden h-full"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 via-transparent to-purple-500/0 opacity-0 group-hover:opacity-10 transition-opacity rounded-3xl"></div>

                <div className="relative z-10 space-y-6 flex flex-col h-full">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-3 bg-purple-500/10 rounded-xl group-hover:bg-purple-500/20 transition-colors">
                        <Clock size={28} className="text-purple-400" />
                      </div>
                      <span className="px-4 py-1.5 bg-purple-500/10 text-purple-400 text-xs font-black rounded-full uppercase">Strategy</span>
                    </div>
                    <h3 className="text-3xl font-black mb-2">TIME<br/>MACHINE</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      Long-form predictions with countdowns. Think deeper. Play smarter. Higher stakes, bigger prizes.
                    </p>
                  </div>

                  <div className="space-y-2 flex-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Prediction Window</span>
                      <span className="text-purple-400 font-bold">24-48h</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Prize Pool</span>
                      <span className="text-purple-400 font-bold">₦2k-₦20k</span>
                    </div>
                  </div>

                  <Link
                    href="/auth"
                    className="flex items-center justify-center gap-2 px-6 py-2.5 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition-colors text-sm"
                  >
                    <TrendingUp size={16} /> Predict
                  </Link>
                </div>
              </motion.div>

              {/* Live Stats Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-neon/10 to-transparent border border-neon/20 rounded-3xl p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Live Now</p>
                    <p className="text-2xl font-black text-neon">42 Games</p>
                  </div>
                  <div className="w-2 h-2 bg-neon rounded-full animate-pulse"></div>
                </div>
                <p className="text-xs text-gray-400">Tap in now. Next game starts in 5m.</p>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Games Highlight - Carousel-style */}
      {!loadingGames && liveGames.length > 0 && (
        <section className="py-24 px-4 bg-[#0A0A0A]">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="mb-12"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-neon rounded-full animate-pulse"></div>
                      <p className="text-neon font-black text-xs uppercase tracking-wider">Live Right Now</p>
                    </div>
                  </div>
                  <h2 className="text-4xl sm:text-5xl font-black mb-3">Games in Progress</h2>
                  <p className="text-gray-400 max-w-xl">Real players. Real money. Real competition. Jump in anytime.</p>
                </div>
              </div>
            </motion.div>

            {/* Staggered card layout */}
            <div className="grid sm:grid-cols-2 gap-6 mb-8">
              {liveGames.map((game, idx) => (
                <motion.div
                  key={game.id}
                  initial={{ opacity: 0, y: 20, x: idx % 2 === 0 ? -20 : 20 }}
                  whileInView={{ opacity: 1, y: 0, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  viewport={{ once: true }}
                  className={`group relative overflow-hidden rounded-2xl border transition-all hover:border-neon/50 ${
                    idx === 0
                      ? "bg-gradient-to-br from-neon/10 to-transparent border-neon/30 md:col-span-2 lg:col-span-1"
                      : "bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] border-[#2A2A2A]"
                  }`}
                >
                  {/* Shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

                  <div className="relative z-10 p-5 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-lg ${idx === 0 ? "bg-neon/20" : "bg-[#111]"}`}>
                          {game.type === "pill" ? (
                            <Pill size={18} className="text-neon" />
                          ) : (
                            <Clock size={18} className="text-purple-400" />
                          )}
                        </div>
                        <div>
                          <p className={`text-xs font-black uppercase tracking-wide ${idx === 0 ? "text-neon" : "text-gray-400"}`}>
                            {game.type === "pill" ? "Pill Challenge" : "Prediction"}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">{game.category || "Live"}</p>
                        </div>
                      </div>
                      <span className="text-sm font-black text-neon bg-neon/10 px-3 py-1 rounded-lg">
                        ₦{game.prize.toLocaleString()}
                      </span>
                    </div>

                    <p className="text-sm font-semibold text-white line-clamp-2 group-hover:line-clamp-none transition-all">
                      {game.title}
                    </p>

                    <div className={`flex items-center justify-between text-xs border-t border-[#2A2A2A] pt-3 ${idx === 0 ? "text-neon" : "text-gray-500"}`}>
                      {game.type === "prediction" ? (
                        <>
                          <span className="flex items-center gap-1">
                            <Users size={14} /> {game.players || 0} joined
                          </span>
                          <span className="font-semibold">{game.timeLeft} left</span>
                        </>
                      ) : (
                        <>
                          <span>Quick Challenge</span>
                          <span className="font-semibold">⚡ Go!</span>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* CTA to see all */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <Link
                href="/auth"
                className="inline-flex items-center gap-2 px-6 py-3 border border-neon/30 hover:border-neon rounded-full text-neon font-bold hover:bg-neon/5 transition-all"
              >
                View All Games
                <ArrowRight size={18} />
              </Link>
            </motion.div>
          </div>
        </section>
      )}

      {/* How It Works - Unique Flow Visualization */}
      <section className="py-24 px-4 bg-gradient-to-b from-[#0A0A0A] to-[#1A1A1A]/30">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <div className="inline-block mb-4">
              <span className="text-xs font-black text-neon uppercase tracking-widest">◆ Quick Onboarding</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">Four Steps. Full Control.</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">Get verified, fund, play, and cash out. Simple. Fast. No nonsense.</p>
          </motion.div>

          {/* Diagonal flow layout */}
          <div className="grid md:grid-cols-4 gap-8 relative">
            {/* Connection lines for desktop */}
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-neon/0 via-neon/30 to-neon/0 transform -translate-y-1/2"></div>

            {[
              { 
                step: "01", 
                title: "Verify", 
                desc: "Phone number + password signup. 2 minutes max.",
                icon: Users
              },
              { 
                step: "02", 
                title: "Fund", 
                desc: "Deposit via Paystack. Instant credit to your wallet.",
                icon: DollarSign
              },
              { 
                step: "03", 
                title: "Play", 
                desc: "Jump into any PILL or PREDICTION. No waiting.",
                icon: Gamepad2
              },
              { 
                step: "04", 
                title: "Withdraw", 
                desc: "Win money, cash out same day. Your account, your rules.",
                icon: TrendingUp
              },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-6 hover:border-neon/30 transition-all group relative z-10">
                  {/* Step number - floating */}
                  <div className="absolute -top-4 left-6 w-8 h-8 bg-neon text-black rounded-full flex items-center justify-center font-black text-sm group-hover:scale-110 transition-transform">
                    {item.step}
                  </div>

                  <div className="pt-4 space-y-4">
                    <div className="p-3 bg-neon/10 rounded-lg w-fit group-hover:bg-neon/20 transition-colors">
                      <item.icon size={20} className="text-neon" />
                    </div>
                    <h3 className="text-lg font-black text-white">{item.title}</h3>
                    <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
                  </div>
                </div>

                {/* Arrow connector */}
                {idx < 3 && (
                  <motion.div
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-20"
                  >
                    <ArrowRight size={20} className="text-neon/40" />
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Bold and Minimalist */}
      <section className="py-24 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-neon/20 via-[#1A1A1A] to-[#0A0A0A] border border-neon/40 p-16 text-center group">
            {/* Animated background grid */}
            <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(0deg,transparent_24%,rgba(0,255,102,0.1)_25%,rgba(0,255,102,0.1)_26%,transparent_27%,transparent_74%,rgba(0,255,102,0.1)_75%,rgba(0,255,102,0.1)_76%,transparent_77%,transparent),linear-gradient(90deg,transparent_24%,rgba(0,255,102,0.1)_25%,rgba(0,255,102,0.1)_26%,transparent_27%,transparent_74%,rgba(0,255,102,0.1)_75%,rgba(0,255,102,0.1)_76%,transparent_77%,transparent)] bg-[length:60px_60px]"></div>

            {/* Glow effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-neon/0 via-neon/5 to-neon/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>

            <div className="relative z-10 space-y-6">
              <h2 className="text-4xl sm:text-5xl font-black leading-tight">
                Stop Watching.
                <br />
                <span className="text-neon">Start Winning.</span>
              </h2>
              <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
                Join thousands of smart players already earning real money. Your next win is just minutes away.
              </p>

              <div className="pt-6">
                <Link
                  href="/auth"
                  className="inline-flex items-center gap-3 bg-neon text-black font-black px-10 py-5 rounded-full hover:bg-neon/90 transition-all transform hover:scale-105 active:scale-95 text-lg uppercase tracking-wide shadow-2xl shadow-neon/30"
                >
                  Play Now <Zap size={20} />
                </Link>
              </div>

              <p className="text-xs text-gray-500 pt-4">No credit card. Just skill.</p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#2A2A2A] px-4 py-12">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-sm text-gray-500">
          <p>© 2026 BitLyfe. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/terms" className="hover:text-neon transition-colors">
              Terms of Service
            </Link>
            <a href="mailto:support@bitlyfe.com" className="hover:text-neon transition-colors">
              Support
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
