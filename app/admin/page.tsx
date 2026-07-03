"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminApi, ApiError } from "@/lib/api";
import { Users, Gamepad2, TrendingUp, DollarSign, AlertCircle, Loader2, Plus } from "lucide-react";

export default function AdminDashboard() {
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const gamesRes = await adminApi.getGames();
        setGames(gamesRes.games || []);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Separate PILLS and TIME_MACHINE games
  const pillsGames = games.filter((g) => g.game_type === "pills");
  const timeMachineGames = games.filter((g) => g.game_type === "predictions");

  const totalPlayers = games.reduce((sum, g) => sum + (g.stats?.total_players || 0), 0);
  const totalRevenue = games.reduce((sum, g) => sum + (g.stats?.revenue || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">Game management hub</p>
        </div>
        <Link
          href="/admin/games/create"
          className="flex items-center gap-2 px-4 py-2 bg-neon text-black font-semibold rounded-lg hover:bg-neon/90 transition-colors"
        >
          <Plus size={18} />
          Create Game
        </Link>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-900/20 border border-red-800/40 rounded-xl p-3 text-red-400 text-sm flex items-start gap-2">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* Key Metrics */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-card border border-[#2A2A2A] rounded-2xl p-4 h-20 flex items-center justify-center">
              <Loader2 size={20} className="text-neon animate-spin" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-card border border-[#2A2A2A] rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Gamepad2 size={16} className="text-neon" />
              <span className="text-xs text-gray-500">Active Games</span>
            </div>
            <div className="text-2xl font-black text-white">{pillsGames.filter(g => g.status === "active").length + timeMachineGames.filter(g => g.status === "active").length}</div>
          </div>

          <div className="bg-card border border-[#2A2A2A] rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users size={16} className="text-blue-400" />
              <span className="text-xs text-gray-500">Players Today</span>
            </div>
            <div className="text-2xl font-black text-white">{totalPlayers.toLocaleString()}</div>
          </div>

          <div className="bg-card border border-[#2A2A2A] rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign size={16} className="text-neon" />
              <span className="text-xs text-gray-500">Revenue Today</span>
            </div>
            <div className="text-2xl font-black text-neon">₦{(totalRevenue / 1000).toFixed(0)}k</div>
          </div>

          <div className="bg-card border border-[#2A2A2A] rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={16} className="text-yellow-400" />
              <span className="text-xs text-gray-500">Games Managed</span>
            </div>
            <div className="text-2xl font-black text-white">{games.length}</div>
          </div>
        </div>
      )}

      {/* Games Overview */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* PILLS Games */}
        <div className="bg-card border border-[#2A2A2A] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black text-white">💊 PILLS</h2>
            <span className="text-sm text-gray-400">{pillsGames.length} total</span>
          </div>

          <div className="space-y-2 mb-4">
            {pillsGames.slice(0, 3).map((game) => (
              <Link
                key={game.id}
                href={`/admin/games/${game.id}`}
                className="block p-3 bg-[#111] rounded-xl hover:border-neon border border-[#2A2A2A] transition-colors"
              >
                <div className="flex items-start justify-between mb-1">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white truncate">{game.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {game.stats?.total_players || 0} plays · ₦{game.stats?.revenue || 0} revenue
                    </p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded flex-shrink-0 ml-2 ${
                    game.status === "active"
                      ? "bg-neon/20 text-neon"
                      : game.status === "draft"
                      ? "bg-gray-800 text-gray-400"
                      : "bg-red-900/20 text-red-400"
                  }`}>
                    {game.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>

          <Link
            href="/admin/games?type=pills"
            className="block text-center py-2 text-sm font-semibold text-neon hover:text-white transition-colors border border-neon/30 rounded-lg"
          >
            View All PILLS →
          </Link>
        </div>

        {/* TIME MACHINE Games */}
        <div className="bg-card border border-[#2A2A2A] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black text-white">⏰ TIME MACHINE</h2>
            <span className="text-sm text-gray-400">{timeMachineGames.length} total</span>
          </div>

          <div className="space-y-2 mb-4">
            {timeMachineGames.slice(0, 3).map((game) => (
              <Link
                key={game.id}
                href={`/admin/games/${game.id}`}
                className="block p-3 bg-[#111] rounded-xl hover:border-neon border border-[#2A2A2A] transition-colors"
              >
                <div className="flex items-start justify-between mb-1">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white truncate">{game.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {game.current_participants || 0} participants · ₦{game.stats?.revenue || 0} revenue
                    </p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded flex-shrink-0 ml-2 ${
                    game.status === "active"
                      ? "bg-neon/20 text-neon"
                      : game.status === "locked"
                      ? "bg-orange-900/20 text-orange-400"
                      : game.status === "completed"
                      ? "bg-gray-800 text-gray-400"
                      : "bg-red-900/20 text-red-400"
                  }`}>
                    {game.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>

          <Link
            href="/admin/games?type=predictions"
            className="block text-center py-2 text-sm font-semibold text-neon hover:text-white transition-colors border border-neon/30 rounded-lg"
          >
            View All TIME MACHINE →
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-card border border-[#2A2A2A] rounded-2xl p-4">
          <p className="text-xs text-gray-500 mb-2">Draft Games</p>
          <p className="text-2xl font-black text-white">{games.filter(g => g.status === "draft").length}</p>
          <p className="text-xs text-gray-400 mt-2">Ready to launch</p>
        </div>

        <div className="bg-card border border-[#2A2A2A] rounded-2xl p-4">
          <p className="text-xs text-gray-500 mb-2">Total Revenue</p>
          <p className="text-2xl font-black text-neon">₦{(totalRevenue / 1000).toFixed(0)}k</p>
          <p className="text-xs text-gray-400 mt-2">All active games</p>
        </div>

        <div className="bg-card border border-[#2A2A2A] rounded-2xl p-4">
          <p className="text-xs text-gray-500 mb-2">Completed Games</p>
          <p className="text-2xl font-black text-white">{games.filter(g => g.status === "completed").length}</p>
          <p className="text-xs text-gray-400 mt-2">With results processed</p>
        </div>
      </div>
    </div>
  );
}
