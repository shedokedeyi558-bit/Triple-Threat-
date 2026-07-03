"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminApi, ApiError } from "@/lib/api";
import { Plus, Loader2, Search, Filter, Zap, DoorOpen, Eye, Play, Pause, RotateCcw, X } from "lucide-react";

interface Game {
  id: string;
  game_type: "door_game" | "challenge_game";
  title: string;
  description?: string;
  status: "draft" | "active" | "paused" | "locked" | "ended" | "closed";
  // Door game fields
  entry_fee?: number;
  // Challenge fields
  category?: string;
  stake_amount?: number;
  prize_pool?: number;
  max_participants?: number;
  current_participants?: number;
  countdown_duration?: number;
  ends_at?: string;
  answer_revealed_at?: string;
  // Stats
  stats?: {
    total_players: number;
    revenue: number;
  };
  created_at: string;
}

export default function GamesPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [typeFilter, setTypeFilter] = useState<"" | "door_game" | "challenge_game">("");
  const [statusFilter, setStatusFilter] = useState<"" | "draft" | "active" | "paused" | "locked" | "ended" | "closed">("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getGames();
      setGames(res.games || []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load games");
    } finally {
      setLoading(false);
    }
  };

  const filteredGames = games.filter((g) => {
    if (typeFilter && g.game_type !== typeFilter) return false;
    if (statusFilter && g.status !== statusFilter) return false;
    if (search && !g.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const doorGames = filteredGames.filter((g) => g.game_type === "door_game");
  const challengeGames = filteredGames.filter((g) => g.game_type === "challenge_game");

  const getStatusColor = (status: Game["status"]) => {
    switch (status) {
      case "active":
        return "bg-neon/20 text-neon";
      case "draft":
        return "bg-gray-800 text-gray-400";
      case "paused":
        return "bg-yellow-900/20 text-yellow-400";
      case "locked":
        return "bg-orange-900/20 text-orange-400";
      case "ended":
      case "closed":
        return "bg-gray-800 text-gray-500";
      default:
        return "bg-gray-800 text-gray-400";
    }
  };

  const GameCard = ({ game }: { game: Game }) => (
    <div className="bg-card border border-[#2A2A2A] rounded-2xl p-4 hover:border-neon/30 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{game.game_type === "door_game" ? "🚪" : "⚡"}</span>
            <h3 className="text-sm font-bold text-white truncate">{game.title}</h3>
          </div>
          <p className="text-xs text-gray-500 truncate">{game.description || "No description"}</p>
        </div>
        <span className={`text-xs font-bold px-2 py-1 rounded flex-shrink-0 ml-2 ${getStatusColor(game.status)}`}>
          {game.status}
        </span>
      </div>

      {/* Game-specific info */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {game.game_type === "door_game" ? (
          <>
            <div className="text-xs">
              <p className="text-gray-500">Entry Fee</p>
              <p className="font-bold text-white">₦{game.entry_fee?.toLocaleString() || "0"}</p>
            </div>
            <div className="text-xs">
              <p className="text-gray-500">Players</p>
              <p className="font-bold text-white">{game.stats?.total_players || 0}</p>
            </div>
          </>
        ) : (
          <>
            <div className="text-xs">
              <p className="text-gray-500">Participants</p>
              <p className="font-bold text-white">
                {game.current_participants || 0}/{game.max_participants || 0}
              </p>
            </div>
            <div className="text-xs">
              <p className="text-gray-500">Stake</p>
              <p className="font-bold text-white">₦{game.stake_amount?.toLocaleString() || "0"}</p>
            </div>
          </>
        )}
      </div>

      {/* Revenue / Prize Pool */}
      <div className="bg-[#111] rounded-lg p-2 mb-3 text-xs">
        {game.game_type === "door_game" ? (
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Revenue</span>
            <span className="font-bold text-neon">₦{game.stats?.revenue?.toLocaleString() || "0"}</span>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Prize Pool</span>
            <span className="font-bold text-neon">₦{game.prize_pool?.toLocaleString() || "0"}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <Link
        href={`/admin/games/${game.id}`}
        className="w-full py-2 px-3 bg-neon/10 border border-neon/30 rounded-lg text-xs font-semibold text-neon hover:bg-neon/20 transition-colors flex items-center justify-center gap-1"
      >
        <Eye size={13} />
        View Details
      </Link>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Games Management</h1>
          <p className="text-gray-400 text-sm mt-1">{games.length} total games</p>
        </div>
        <Link
          href="/admin/games/create"
          className="flex items-center gap-2 px-4 py-2 bg-neon text-black font-semibold rounded-lg hover:bg-neon/90 transition-colors"
        >
          <Plus size={18} />
          Create Game
        </Link>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-800/40 rounded-xl p-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-card border border-[#2A2A2A] rounded-2xl p-4 space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search games by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#111] border border-[#2A2A2A] focus:border-neon rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-600 outline-none transition-colors"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="bg-[#111] border border-[#2A2A2A] rounded-lg px-3 py-2 text-xs text-white outline-none"
          >
            <option value="">All Types</option>
            <option value="door_game">🚪 Door Games</option>
            <option value="challenge_game">⚡ Challenges</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-[#111] border border-[#2A2A2A] rounded-lg px-3 py-2 text-xs text-white outline-none"
          >
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="locked">Locked</option>
            <option value="ended">Ended</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-16">
          <Loader2 size={32} className="text-neon animate-spin" />
        </div>
      )}

      {/* Door Games Section */}
      {!loading && doorGames.length > 0 && (
        <div>
          <h2 className="text-lg font-black text-white mb-3 flex items-center gap-2">
            <DoorOpen size={20} className="text-neon" />
            Door Games ({doorGames.length})
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {doorGames.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        </div>
      )}

      {/* Challenge Games Section */}
      {!loading && challengeGames.length > 0 && (
        <div>
          <h2 className="text-lg font-black text-white mb-3 flex items-center gap-2">
            <Zap size={20} className="text-yellow-400" />
            Challenge Games ({challengeGames.length})
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {challengeGames.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredGames.length === 0 && (
        <div className="text-center py-12">
          <Zap size={32} className="text-gray-600 mx-auto mb-3 opacity-50" />
          <p className="text-gray-500 text-sm">No games found</p>
          <Link href="/admin/games/create" className="text-xs text-neon hover:text-white mt-3 inline-block">
            Create your first game →
          </Link>
        </div>
      )}
    </div>
  );
}
