"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { NavBar } from "@/components/ui/NavBar";
import { adminApi, type Game, ApiError } from "@/lib/api";
import { Loader2, Clock, Lock, Target, Users } from "lucide-react";
import Link from "next/link";

interface GameWithCountdown extends Game {
  timeLeft?: string;
}

export default function GamesPage() {
  const router = useRouter();
  const { state } = useApp();
  const [games, setGames] = useState<GameWithCountdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch games
  useEffect(() => {
    setLoading(true);
    setError("");
    adminApi
      .getGames()
      .then((res) => {
        // Only show active and locked games to players
        const activeGames = (res.games || []).filter(
          (g: Game) => g.status === "active" || g.status === "locked"
        );
        setGames(activeGames);
      })
      .catch((err) => {
        setError(
          err instanceof ApiError
            ? err.message
            : "Failed to load games"
        );
      })
      .finally(() => setLoading(false));
  }, []);

  // Update countdowns every second
  useEffect(() => {
    const interval = setInterval(() => {
      setGames((prevGames) =>
        prevGames.map((game) => {
          if (!game.ends_at) return game;

          const now = new Date().getTime();
          const end = new Date(game.ends_at).getTime();
          const diffMs = end - now;

          if (diffMs <= 0) {
            return { ...game, timeLeft: "Ended" };
          }

          const diffSecs = Math.floor(diffMs / 1000);
          const hours = Math.floor(diffSecs / 3600);
          const mins = Math.floor((diffSecs % 3600) / 60);
          const secs = diffSecs % 60;

          let timeLeft = "";
          if (hours > 0) {
            timeLeft = `${hours}h ${mins}m`;
          } else if (mins > 0) {
            timeLeft = `${mins}m ${secs}s`;
          } else {
            timeLeft = `${secs}s`;
          }

          return { ...game, timeLeft };
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!state.isAuthenticated) {
    return (
      <div className="min-h-dvh bg-[#0A0A0A] flex flex-col items-center justify-center px-4">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Please log in to view games</p>
          <Link href="/auth" className="text-[#00FF66] underline hover:text-[#00FF66]/80 transition-colors">
            Go to login
          </Link>
        </div>
      </div>
    );
  }

  const doorGames = games.filter((g) => g.game_type === "door_game");
  const challengeGames = games.filter((g) => g.game_type === "challenge_game");

  return (
    <div className="min-h-dvh bg-[#0A0A0A] flex flex-col">
      <NavBar showWallet />

      <main className="flex-1 px-4 sm:px-6 py-8 sm:py-12">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight mb-3">
              Available Games
            </h1>
            <p className="text-lg text-gray-400">
              Browse and join available games to compete and win
            </p>
          </motion.div>

          {/* Loading state */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 size={40} className="text-[#00FF66] animate-spin" />
              <p className="text-gray-400 text-base">Loading available games...</p>
            </div>
          )}

          {/* Error state */}
          {error && !loading && (
            <div className="bg-red-950/40 border border-red-900/60 rounded-xl p-6 text-center mb-8">
              <p className="text-red-400 text-base font-medium">{error}</p>
            </div>
          )}

          {/* Games sections */}
          {!loading && (
            <div className="space-y-16">
              {/* Selection Games Section */}
              <section>
                <div className="mb-8">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-1.5 h-8 bg-[#00FF66] rounded-full" />
                    <h2 className="text-3xl font-bold text-white">Selection Games</h2>
                  </div>
                  {doorGames.length > 0 && (
                    <p className="text-gray-500 ml-7 text-base">
                      {doorGames.length} game{doorGames.length !== 1 ? 's' : ''} available • Choose strategically to maximize returns
                    </p>
                  )}
                </div>

                {doorGames.length === 0 ? (
                  <div className="bg-gray-950/50 border border-gray-800 rounded-xl p-12 text-center">
                    <Target size={32} className="mx-auto text-gray-700 mb-4" />
                    <p className="text-gray-400 text-base">No selection games available at this time</p>
                    <p className="text-gray-600 text-sm mt-2">Check back soon for new opportunities</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {doorGames.map((game, i) => (
                      <motion.button
                        key={game.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        onClick={() => router.push(`/doors`)}
                        className="group relative bg-gradient-to-br from-gray-900/40 to-black border border-gray-800 hover:border-[#00FF66]/40 rounded-xl p-7 text-left transition-all duration-300 active:scale-95 hover:shadow-2xl hover:shadow-[#00FF66]/10 overflow-hidden"
                      >
                        {/* Gradient overlay on hover */}
                        <div className="absolute inset-0 bg-gradient-to-r from-[#00FF66]/0 to-[#00FF66]/0 group-hover:from-[#00FF66]/5 group-hover:to-[#00FF66]/0 transition-all duration-300" />
                        
                        <div className="relative z-10">
                          <div className="mb-6">
                            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#00FF66] transition-colors">
                              {game.title}
                            </h3>
                            <p className="text-sm text-gray-400">
                              {game.description || "Choose your strategy and win"}
                            </p>
                          </div>

                          <div className="grid grid-cols-3 gap-4 mb-6 pb-6 border-b border-gray-800">
                            <div>
                              <p className="text-xs text-gray-600 uppercase tracking-wide font-semibold mb-2">
                                Entry Fee
                              </p>
                              <p className="text-lg font-bold text-[#00FF66]">
                                ₦{game.entry_fee?.toLocaleString() || "0"}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 uppercase tracking-wide font-semibold mb-2">
                                Players
                              </p>
                              <p className="text-lg font-bold text-white">
                                {game.stats?.total_players || 0}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 uppercase tracking-wide font-semibold mb-2">
                                Status
                              </p>
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-[#00FF66]" />
                                <p className="text-sm font-semibold text-[#00FF66]">
                                  Active
                                </p>
                              </div>
                            </div>
                          </div>

                          {game.timeLeft && (
                            <div className="flex items-center gap-3 text-gray-400">
                              <Clock size={16} />
                              <span className="text-sm">
                                Ends in <span className="text-white font-semibold">{game.timeLeft}</span>
                              </span>
                            </div>
                          )}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                )}
              </section>

              {/* Prediction Games Section */}
              <section>
                <div className="mb-8">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-1.5 h-8 bg-amber-500 rounded-full" />
                    <h2 className="text-3xl font-bold text-white">Prediction Games</h2>
                  </div>
                  {challengeGames.length > 0 && (
                    <p className="text-gray-500 ml-7 text-base">
                      {challengeGames.length} game{challengeGames.length !== 1 ? 's' : ''} available • Limited spots, higher stakes
                    </p>
                  )}
                </div>

                {challengeGames.length === 0 ? (
                  <div className="bg-gray-950/50 border border-gray-800 rounded-xl p-12 text-center">
                    <Target size={32} className="mx-auto text-gray-700 mb-4" />
                    <p className="text-gray-400 text-base">No prediction games available at this time</p>
                    <p className="text-gray-600 text-sm mt-2">Check back soon for new challenges</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {challengeGames.map((game, i) => (
                      <motion.button
                        key={game.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        onClick={() => router.push(`/challenges/${game.id}`)}
                        className="group relative bg-gradient-to-br from-gray-900/40 to-black border border-gray-800 hover:border-amber-500/40 rounded-xl p-7 text-left transition-all duration-300 active:scale-95 hover:shadow-2xl hover:shadow-amber-500/10 overflow-hidden"
                      >
                        {/* Gradient overlay on hover */}
                        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/0 to-amber-500/0 group-hover:from-amber-500/5 group-hover:to-amber-500/0 transition-all duration-300" />
                        
                        <div className="relative z-10">
                          <div className="mb-6">
                            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-amber-400 transition-colors">
                              {game.title}
                            </h3>
                            <p className="text-sm text-gray-400">
                              {game.category || "Test your prediction skills"}
                            </p>
                          </div>

                          <div className="grid grid-cols-3 gap-4 mb-6 pb-6 border-b border-gray-800">
                            <div>
                              <p className="text-xs text-gray-600 uppercase tracking-wide font-semibold mb-2">
                                Stake
                              </p>
                              <p className="text-lg font-bold text-amber-400">
                                ₦{game.stake_amount?.toLocaleString() || "0"}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 uppercase tracking-wide font-semibold mb-2">
                                Participants
                              </p>
                              <p className="text-lg font-bold text-white">
                                {game.current_participants || 0}<span className="text-gray-600">/{game.max_participants || 10}</span>
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 uppercase tracking-wide font-semibold mb-2">
                                Status
                              </p>
                              <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${game.status === "locked" ? "bg-red-500" : "bg-[#00FF66]"}`} />
                                <p className={`text-sm font-semibold ${game.status === "locked" ? "text-red-400" : "text-[#00FF66]"}`}>
                                  {game.status === "locked" ? "Locked" : "Active"}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {game.status === "locked" ? (
                              <>
                                <Lock size={16} className="text-red-500" />
                                <span className="text-sm text-red-400 font-medium">
                                  Game closed for new entries
                                </span>
                              </>
                            ) : (
                              <>
                                <Clock size={16} className="text-gray-500" />
                                <span className="text-sm text-gray-400">
                                  Ends in <span className="text-white font-semibold">{game.timeLeft || "Counting..."}</span>
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                )}
              </section>

              {/* Empty state */}
              {doorGames.length === 0 && challengeGames.length === 0 && (
                <div className="bg-gradient-to-br from-gray-900/30 to-black border border-gray-800 rounded-xl p-16 text-center">
                  <Users size={40} className="mx-auto text-gray-700 mb-6" />
                  <p className="text-white font-semibold text-xl mb-3">
                    No Games Available
                  </p>
                  <p className="text-gray-500 text-base max-w-md mx-auto">
                    There are currently no active games. Our admins are preparing new competitions. Check back shortly.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
