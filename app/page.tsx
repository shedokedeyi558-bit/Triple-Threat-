"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { motion } from "framer-motion";
import { Pill, Clock, TrendingUp, Users, Zap, ArrowRight, ChevronDown } from "lucide-react";

interface LiveGame {
  id: string;
  type: "pill" | "prediction";
  title: string;
  players?: number;
  prize: number;
  timeLeft?: string;
}

export default function LandingPage() {
  const { state } = useApp();
  const router = useRouter();
  const [liveGames, setLiveGames] = useState<LiveGame[]>([]);
  const [loadingGames, setLoadingGames] = useState(true);

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
          <Link href="/auth" className="text-neon font-semibold text-sm hover:text-neon/80 transition-colors">
            Sign In
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 py-20 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-neon/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-neon/3 rounded-full blur-3xl"></div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 max-w-3xl mx-auto text-center space-y-8"
        >
          {/* Main Headline */}
          <div className="space-y-4">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tighter leading-tight"
            >
              Play Smart.
              <br />
              <span className="text-neon">Win Real.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg sm:text-xl text-gray-400 max-w-xl mx-auto leading-relaxed"
            >
              Test your knowledge and prediction skills against real challenges. Compete, win, withdraw real earnings instantly.
            </motion.p>
          </div>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Link
              href="/auth"
              className="inline-flex items-center gap-3 bg-neon text-black font-bold px-8 py-4 rounded-xl hover:bg-neon/90 transition-all transform hover:scale-105 active:scale-95 text-lg"
            >
              Join Now <ArrowRight size={20} />
            </Link>
          </motion.div>

          {/* Social Proof */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12 pt-8 border-t border-[#2A2A2A]"
          >
            <div className="text-center">
              <p className="text-2xl font-bold text-neon">2.5k+</p>
              <p className="text-sm text-gray-400">Active Players</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-neon">₦847k</p>
              <p className="text-sm text-gray-400">Paid Out</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-neon">98%</p>
              <p className="text-sm text-gray-400">User Retention</p>
            </div>
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
        >
          <ChevronDown size={24} className="text-neon/50" />
        </motion.div>
      </section>

      {/* Game Modes Section */}
      <section className="relative py-20 px-4 bg-gradient-to-b from-[#0A0A0A] to-[#1A1A1A]/20">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">Two Ways to Win</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Choose your challenge. From instant reactions to strategic predictions, there&apos;s something for everyone.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Pills Card */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              transition={{ delay: 0.1 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] border border-[#2A2A2A] rounded-2xl p-8 hover:border-neon/30 transition-all group"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="p-4 bg-neon/10 rounded-xl group-hover:bg-neon/20 transition-colors">
                  <Pill size={32} className="text-neon" />
                </div>
                <span className="px-3 py-1 bg-neon/10 text-neon text-xs font-bold rounded-full">INSTANT</span>
              </div>

              <h3 className="text-2xl font-bold mb-3">Pills</h3>
              <p className="text-gray-400 mb-6 leading-relaxed">
                Test your knowledge instantly. Pick a question, answer fast, get results immediately. Perfect for quick wins.
              </p>

              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-sm">
                  <Zap size={16} className="text-neon flex-shrink-0" />
                  <span>Instant results</span>
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <Zap size={16} className="text-neon flex-shrink-0" />
                  <span>30-second timer</span>
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <Zap size={16} className="text-neon flex-shrink-0" />
                  <span>Win or lose instantly</span>
                </li>
              </ul>

              <Link
                href="/auth"
                className="w-full py-3 px-4 bg-neon text-black font-bold rounded-lg hover:bg-neon/90 transition-colors text-center"
              >
                Try Pills
              </Link>
            </motion.div>

            {/* Time Machine Card */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              transition={{ delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] border border-[#2A2A2A] rounded-2xl p-8 hover:border-neon/30 transition-all group"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="p-4 bg-neon/10 rounded-xl group-hover:bg-neon/20 transition-colors">
                  <Clock size={32} className="text-neon" />
                </div>
                <span className="px-3 py-1 bg-neon/10 text-neon text-xs font-bold rounded-full">STRATEGIC</span>
              </div>

              <h3 className="text-2xl font-bold mb-3">Time Machine</h3>
              <p className="text-gray-400 mb-6 leading-relaxed">
                Make strategic predictions with real-world outcomes. Bigger prizes, more players, higher stakes. Think ahead.
              </p>

              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-sm">
                  <TrendingUp size={16} className="text-neon flex-shrink-0" />
                  <span>Strategic predictions</span>
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <TrendingUp size={16} className="text-neon flex-shrink-0" />
                  <span>Higher prizes</span>
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <TrendingUp size={16} className="text-neon flex-shrink-0" />
                  <span>Real-world events</span>
                </li>
              </ul>

              <Link
                href="/auth"
                className="w-full py-3 px-4 bg-neon text-black font-bold rounded-lg hover:bg-neon/90 transition-colors text-center"
              >
                Try Predictions
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Live Games Highlight */}
      {!loadingGames && liveGames.length > 0 && (
        <section className="py-20 px-4 bg-[#0A0A0A]">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="mb-12"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-2 h-2 bg-neon rounded-full animate-pulse"></div>
                <p className="text-neon font-semibold text-sm uppercase tracking-wider">Live Now</p>
              </div>
              <h2 className="text-4xl sm:text-5xl font-bold mb-3">Active Games</h2>
              <p className="text-gray-400">See what&apos;s happening right now. Join the action.</p>
            </motion.div>

            <div className="grid sm:grid-cols-2 gap-4">
              {liveGames.map((game, idx) => (
                <motion.div
                  key={game.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] border border-[#2A2A2A] rounded-xl p-4 hover:border-neon/30 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {game.type === "pill" ? (
                        <Pill size={20} className="text-neon" />
                      ) : (
                        <Clock size={20} className="text-neon" />
                      )}
                      <span className="text-xs font-semibold uppercase text-gray-400">
                        {game.type === "pill" ? "Pills" : "Prediction"}
                      </span>
                    </div>
                    <span className="text-neon font-bold text-sm">₦{game.prize.toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-gray-300 mb-3 line-clamp-2">{game.title}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    {game.type === "prediction" ? (
                      <>
                        <span className="flex items-center gap-1">
                          <Users size={14} /> {game.players} players
                        </span>
                        <span>{game.timeLeft} left</span>
                      </>
                    ) : (
                      <span>Quick challenge</span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              viewport={{ once: true }}
              className="mt-8 text-center"
            >
              <Link
                href="/auth"
                className="inline-flex items-center gap-2 text-neon font-semibold hover:gap-3 transition-all"
              >
                See all games <ArrowRight size={18} />
              </Link>
            </motion.div>
          </div>
        </section>
      )}

      {/* How It Works */}
      <section className="py-20 px-4 bg-gradient-to-b from-[#0A0A0A] to-[#1A1A1A]/20">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-4xl sm:text-5xl font-bold text-center mb-16"
          >
            How It Works
          </motion.h2>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: "1", title: "Sign Up", desc: "Create account with phone in seconds" },
              { step: "2", title: "Fund Account", desc: "Deposit via Paystack instantly" },
              { step: "3", title: "Play", desc: "Join any active game or challenge" },
              { step: "4", title: "Withdraw", desc: "Winnings to your bank same day" },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                viewport={{ once: true }}
                className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-6 text-center"
              >
                <div className="w-12 h-12 bg-neon/10 text-neon rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-gray-400">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto bg-gradient-to-r from-neon/10 to-neon/5 border border-neon/30 rounded-2xl p-12 text-center"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to Win?</h2>
          <p className="text-gray-400 mb-8 text-lg">
            Join thousands of players already winning real money. No hidden fees. Instant payouts.
          </p>
          <Link
            href="/auth"
            className="inline-flex items-center gap-2 bg-neon text-black font-bold px-8 py-4 rounded-xl hover:bg-neon/90 transition-all text-lg"
          >
            Start Playing Now <ArrowRight size={20} />
          </Link>
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
