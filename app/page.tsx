"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Zap, Trophy, Users, Clock, Target, Sparkles } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { removeToken } from "@/lib/api";
import { Logo } from "@/components/ui/Logo";



// Feature card component
function FeatureCard({ icon: Icon, title, description, delay }: {
  icon: React.ComponentType<Record<string, unknown>>;
  title: string;
  description: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      viewport={{ once: true }}
      className="p-8 rounded-lg border border-gray-800 bg-gray-950 hover:border-neon hover:bg-gray-900 transition-all group"
    >
      <div className="mb-4">
        <Icon size={32} className="text-neon group-hover:text-neon/80 transition-colors" />
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-400 text-base">{description}</p>
    </motion.div>
  );
}

// Stat card component
function StatCard({ number, label, delay }: { number: string; label: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay }}
      viewport={{ once: true }}
      className="text-center"
    >
      <div className="text-4xl sm:text-5xl font-bold text-neon mb-2">{number}</div>
      <div className="text-gray-400 text-base sm:text-lg font-medium">{label}</div>
    </motion.div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const { state, dispatch } = useApp();
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = () => {
    removeToken();
    dispatch({ type: "LOGOUT" });
    setShowMenu(false);
    router.push("/");
  };

  return (
    <main className="min-h-dvh bg-[#0A0A0A] flex flex-col relative overflow-hidden">
      {/* Subtle background elements */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 right-0 w-96 h-96 bg-neon/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-neon/5 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col w-full">
        {/* Header */}
        <header className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-900 bg-black/50 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Logo size="sm" />
            </motion.div>
            <nav className="hidden md:flex items-center gap-12">
              <Link href="#features" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">
                Why Us
              </Link>
              <Link href="#how-it-works" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">
                How It Works
              </Link>
              <Link href="#" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">
                FAQ
              </Link>
            </nav>
            {state.isAuthenticated && state.player ? (
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="flex items-center gap-2 px-4 py-2 rounded-md hover:bg-gray-900 transition-colors text-sm"
                >
                  <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                    <span className="text-white text-xs font-semibold">
                      {state.player.name?.charAt(0) || "P"}
                    </span>
                  </div>
                  <span className="hidden sm:inline text-gray-300 font-medium">{state.player.name}</span>
                </button>
                {showMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-full right-0 mt-2 w-48 bg-gray-900 border border-gray-800 rounded-lg shadow-xl z-10"
                  >
                    <button
                      onClick={() => router.push("/wallet")}
                      className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors border-b border-gray-800"
                    >
                      Wallet
                    </button>
                    <button
                      onClick={() => router.push("/format")}
                      className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors border-b border-gray-800"
                    >
                      Play Games
                    </button>
                    <button
                      onClick={() => router.push("/challenges")}
                      className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors border-b border-gray-800"
                    >
                      Challenges
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-gray-800 transition-colors"
                    >
                      Logout
                    </button>
                  </motion.div>
                )}
              </div>
            ) : (
              <Link
                href="/auth"
                className="px-6 py-2 rounded-md bg-neon text-black font-semibold text-sm hover:bg-neon/90 transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </header>

        {/* Hero Section */}
        <section className="relative py-20 sm:py-32 md:py-40 px-4 bg-[#0A0A0A]">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6">
                Compete for Real.
                <br />
                <span className="text-[#00FF66]">Win Real Cash.</span>
              </h1>
              
              <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto mb-10">
                Skill-based competitions with instant payouts. No luck, no nonsense.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href={state.isAuthenticated ? "/format" : "/auth"}
                  className="px-8 py-4 bg-[#00FF66] text-black font-semibold rounded-lg hover:bg-[#00dd55] transition-colors text-lg"
                >
                  Start Earning Now
                </Link>
                <Link
                  href={state.isAuthenticated ? "/challenges" : "/auth"}
                  className="px-8 py-4 border border-gray-700 text-white font-semibold rounded-lg hover:bg-gray-900 transition-all text-lg"
                >
                  See Challenges
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 sm:py-20 px-4 border-t border-gray-900 bg-[#0A0A0A]">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12">
              <StatCard number="45K+" label="Active Players" delay={0} />
              <StatCard number="₦1.8M" label="Paid Out" delay={0.1} />
              <StatCard number="500+" label="Daily Games" delay={0.2} />
              <StatCard number="98%" label="On-time Payouts" delay={0.3} />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 sm:py-28 px-4 border-t border-gray-900 bg-[#0A0A0A]">
          <div className="max-w-6xl mx-auto">
            <motion.div
              className="text-center mb-16"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
                Why Players Choose Us
              </h2>
              <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                A transparent, fair, and rewarding gaming experience
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              <FeatureCard
                icon={Trophy}
                title="Real Money Prizes"
                description="Compete for actual cash rewards. No fake points or virtual credits. You win, you get paid."
                delay={0}
              />
              <FeatureCard
                icon={Zap}
                title="Instant Results"
                description="Know your results immediately. Fast, reliable, and transparent scoring system."
                delay={0.1}
              />
              <FeatureCard
                icon={Users}
                title="Fair Matchmaking"
                description="Play against people at your skill level. Our algorithm ensures balanced competition."
                delay={0.2}
              />
              <FeatureCard
                icon={Clock}
                title="Play Anytime"
                description="Games available 24/7. New challenges added hourly. Play when it suits you."
                delay={0.3}
              />
              <FeatureCard
                icon={Target}
                title="Skill-Based"
                description="Your intelligence and ability determine success, not luck. Pure competition."
                delay={0.4}
              />
              <FeatureCard
                icon={Sparkles}
                title="Instant Payouts"
                description="Win and withdraw the same day. Direct to your bank account within 24 hours."
                delay={0.5}
              />
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-20 sm:py-28 px-4 border-t border-gray-900 bg-[#0A0A0A]">
          <div className="max-w-4xl mx-auto">
            <motion.div
              className="text-center mb-16"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
                How It Works
              </h2>
              <p className="text-lg text-gray-400">
                Get started in three simple steps
              </p>
            </motion.div>

            <div className="space-y-8">
              {[
                {
                  step: "1",
                  title: "Create Account & Verify",
                  description: "Sign up with your details. Verification takes just 2 minutes. We keep your data secure and encrypted.",
                },
                {
                  step: "2",
                  title: "Fund Your Account",
                  description: "Add funds through our secure payment gateway. We accept all major payment methods.",
                },
                {
                  step: "3",
                  title: "Play & Withdraw",
                  description: "Compete in real-time games. Win money. Withdraw directly to your bank account.",
                },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className="flex gap-6 items-start"
                >
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-14 w-14 rounded-full bg-neon text-black border-4 border-neon/20">
                      <span className="font-bold text-lg">{item.step}</span>
                    </div>
                  </div>
                  <div className="pt-2 flex-grow">
                    <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
                    <p className="text-gray-400 text-base leading-relaxed">{item.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Escape the Matrix Section */}
        <section className="py-20 sm:py-28 px-4 border-t border-gray-900 bg-[#0A0A0A]">
          <div className="max-w-3xl mx-auto">
            <motion.div
              className="relative p-12 rounded-xl border border-neon/30 bg-gradient-to-br from-neon/5 via-black to-black overflow-hidden"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-neon/5 to-transparent pointer-events-none" />
              <div className="relative z-10 text-center">
                <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
                  Escape the Matrix
                </h2>
                <p className="text-lg text-gray-400 mb-10">
                  Break free from the ordinary. Compete in mind-bending challenges that test your intelligence. Are you ready to unplug?
                </p>
                <Link
                  href={state.isAuthenticated ? "/challenges" : "/auth"}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-neon text-black font-semibold rounded-lg hover:bg-neon/90 transition-colors text-lg shadow-lg hover:shadow-neon/50"
                >
                  Enter Now
                  <ArrowRight size={20} />
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-16 sm:py-20 px-4 border-t border-gray-900 bg-gray-950">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-4 gap-12 mb-12">
              <div>
                <h4 className="font-bold text-white mb-4 text-lg">BitLyfe</h4>
                <p className="text-gray-400">
                  The platform for skill-based gaming and real cash rewards. Fair. Transparent. Rewarding.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-white mb-4 text-lg">Games</h4>
                <ul className="space-y-3 text-sm text-gray-400">
                  <li><Link href="#" className="hover:text-white transition-colors">Trivia</Link></li>
                  <li><Link href="#" className="hover:text-white transition-colors">Puzzles</Link></li>
                  <li><Link href="#" className="hover:text-white transition-colors">Challenges</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-white mb-4 text-lg">Support</h4>
                <ul className="space-y-3 text-sm text-gray-400">
                  <li><Link href="#" className="hover:text-white transition-colors">Help Center</Link></li>
                  <li><Link href="#" className="hover:text-white transition-colors">Contact</Link></li>
                  <li><Link href="#" className="hover:text-white transition-colors">FAQ</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-white mb-4 text-lg">Legal</h4>
                <ul className="space-y-3 text-sm text-gray-400">
                  <li><Link href="#" className="hover:text-white transition-colors">Terms</Link></li>
                  <li><Link href="#" className="hover:text-white transition-colors">Privacy</Link></li>
                  <li><Link href="#" className="hover:text-white transition-colors">Responsible Gaming</Link></li>
                </ul>
              </div>
            </div>

            <div className="border-t border-gray-800 pt-8 text-center text-gray-500 text-sm">
              <p>&copy; 2024 BitLyfe. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
