"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAdmin } from "@/context/AdminContext";
import { AdminShell } from "@/components/admin/AdminShell";
import { adminApi, Game } from "@/lib/api";
import { Loader2, Plus } from "lucide-react";

export default function AdminGamesPage() {
  const router = useRouter();
  const { state } = useAdmin();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "door_game" | "challenge_game">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "active" | "paused" | "ended">("active");

  useEffect(() => {
    if (!state.isAuthenticated) {
      router.push("/admin");
      return;
    }
    loadGames();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.isAuthenticated, router, filter, statusFilter]);

  const loadGames = async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page: 1, limit: 50 };
      if (filter !== "all") params.type = filter;
      if (statusFilter !== "all") params.status = statusFilter;
      
      const response = await adminApi.getGames(params);
      setGames(response.games);
    } catch (err) {
      console.error("Failed to load games:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredGames = games.filter((g) => {
    if (filter !== "all" && g.game_type !== filter) return false;
    if (statusFilter !== "all" && g.status !== statusFilter) return false;
    return true;
  });

  const statusColors = {
    draft: "bg-gray-900/30 text-gray-400",
    active: "bg-neon/20 text-neon",
    paused: "bg-yellow-900/20 text-yellow-400",
    ended: "bg-red-900/20 text-red-400",
    archived: "bg-gray-900/20 text-gray-500",
  };

  return (
    <AdminShell>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">Games</h1>
            <p className="text-gray-400 text-xs sm:text-sm mt-1">Create and manage all game types</p>
          </div>
          <Link
            href="/admin/games/create"
            className="w-full sm:w-auto flex items-center justify-center gap-2 btn-primary text-sm sm:text-base py-2.5 sm:py-3"
          >
            <Plus size={18} />
            <span>New Game</span>
          </Link>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="bg-card border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-white text-xs sm:text-sm outline-none focus:border-neon transition-colors"
          >
            <option value="all">All Game Types</option>
            <option value="door_game">Door Games Only</option>
            <option value="challenge_game">Challenges Only</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-card border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-white text-xs sm:text-sm outline-none focus:border-neon transition-colors"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="ended">Ended</option>
          </select>
        </div>

        {/* Games List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 size={32} className="text-neon animate-spin" />
          </div>
        ) : filteredGames.length === 0 ? (
          <div className="bg-card border border-[#2A2A2A] rounded-lg p-8 text-center">
            <p className="text-gray-400 mb-3">No games found</p>
            <Link href="/admin/games/create" className="text-neon text-sm underline">
              Create your first game →
            </Link>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {filteredGames.map((game, idx) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Link href={`/admin/games/${game.id}`}>
                  <button className="w-full bg-card border border-[#2A2A2A] hover:border-neon/50 rounded-lg p-3 sm:p-4 text-left transition-colors active:scale-95">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
                      {/* Left: Title and meta */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-lg sm:text-2xl flex-shrink-0">
                            {game.game_type === "door_game" ? "🚪" : "⚡"}
                          </span>
                          <h3 className="text-white font-bold text-sm sm:text-base truncate">
                            {game.title}
                          </h3>
                          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${statusColors[game.status]}`}>
                            {game.status}
                          </span>
                        </div>
                        <p className="text-gray-400 text-xs">
                          {new Date(game.created_at).toLocaleDateString()}
                        </p>
                      </div>

                      {/* Right: Stats - responsive layout */}
                      <div className="flex items-center gap-3 sm:gap-4 text-right">
                        {game.game_type === "door_game" && (
                          <>
                            <div className="hidden sm:block">
                              <div className="text-white font-bold text-sm">
                                ₦{game.entry_fee?.toLocaleString()}
                              </div>
                              <div className="text-gray-500 text-xs">Entry</div>
                            </div>
                            <div>
                              <div className="text-neon font-bold text-sm sm:text-base">
                                {game.stats?.total_players || 0}
                              </div>
                              <div className="text-gray-500 text-xs">Players</div>
                            </div>
                          </>
                        )}

                        {game.game_type === "challenge_game" && (
                          <>
                            <div>
                              <div className="text-white font-bold text-sm sm:text-base">
                                {game.current_participants}/{game.max_participants}
                              </div>
                              <div className="text-gray-500 text-xs">Joined</div>
                            </div>
                            <div className="hidden sm:block">
                              <div className="text-neon font-bold text-sm">
                                ₦{game.stake_amount?.toLocaleString()}
                              </div>
                              <div className="text-gray-500 text-xs">Stake</div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </button>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
