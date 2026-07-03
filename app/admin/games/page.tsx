"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminApi, ApiError } from "@/lib/api";
import { Plus, Loader2, Search, Pill, Clock, Eye } from "lucide-react";

interface Game {
  id: string;
  game_type: "pills" | "predictions";
  title: string;
  question?: string;
  category?: string;
  status: "draft" | "active" | "paused" | "locked" | "completed" | "cancelled";
  entry_fee?: number;
  prize?: number;
  prize_per_winner?: number;
  timer?: number;
  format?: "multiple_choice" | "type_answer";
  max_slots?: number;
  slots_filled?: number;
  countdown_end?: string;
  stats?: { total_players: number; revenue: number };
  created_at: string;
}

const statusColor = (s: Game["status"]) => {
  switch (s) {
    case "active":   return "bg-neon/20 text-neon";
    case "draft":    return "bg-gray-800 text-gray-400";
    case "paused":   return "bg-yellow-900/20 text-yellow-400";
    case "locked":   return "bg-orange-900/20 text-orange-400";
    case "completed": return "bg-blue-900/20 text-blue-400";
    default:         return "bg-gray-800 text-gray-500";
  }
};

export default function GamesPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [typeFilter, setTypeFilter] = useState<"" | "pills" | "predictions">("");
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => { fetchGames(); }, []);

  const fetchGames = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getGames();
      setGames((res.games || []) as unknown as Game[]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load games");
    } finally {
      setLoading(false);
    }
  };

  const filtered = games.filter((g) => {
    if (typeFilter && g.game_type !== typeFilter) return false;
    if (statusFilter && g.status !== statusFilter) return false;
    if (search && !g.title?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const pills = filtered.filter((g) => g.game_type === "pills");
  const predictions = filtered.filter((g) => g.game_type === "predictions");

  const GameCard = ({ game }: { game: Game }) => (
    <div className="bg-card border border-[#2A2A2A] rounded-2xl p-4 hover:border-neon/30 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {game.game_type === "pills"
              ? <Pill size={16} className="text-neon flex-shrink-0" />
              : <Clock size={16} className="text-purple-400 flex-shrink-0" />
            }
            <h3 className="text-sm font-bold text-white truncate">{game.title}</h3>
          </div>
          <p className="text-xs text-gray-500">{game.category}</p>
        </div>
        <span className={`text-xs font-bold px-2 py-1 rounded flex-shrink-0 ml-2 ${statusColor(game.status)}`}>
          {game.status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
        {game.game_type === "pills" ? (
          <>
            <div>
              <p className="text-gray-500">Entry Fee</p>
              <p className="font-bold text-white">₦{game.entry_fee?.toLocaleString() ?? "0"}</p>
            </div>
            <div>
              <p className="text-gray-500">Prize</p>
              <p className="font-bold text-neon">₦{game.prize?.toLocaleString() ?? "0"}</p>
            </div>
            <div>
              <p className="text-gray-500">Timer</p>
              <p className="font-bold text-white">{game.timer ?? 0}s</p>
            </div>
            <div>
              <p className="text-gray-500">Format</p>
              <p className="font-bold text-white">{game.format === "multiple_choice" ? "MC" : "Text"}</p>
            </div>
          </>
        ) : (
          <>
            <div>
              <p className="text-gray-500">Entry Fee</p>
              <p className="font-bold text-white">₦{game.entry_fee?.toLocaleString() ?? "0"}</p>
            </div>
            <div>
              <p className="text-gray-500">Prize/Winner</p>
              <p className="font-bold text-neon">₦{game.prize_per_winner?.toLocaleString() ?? "0"}</p>
            </div>
            <div>
              <p className="text-gray-500">Participants</p>
              <p className="font-bold text-white">{game.slots_filled ?? 0}/{game.max_slots ?? 0}</p>
            </div>
            <div>
              <p className="text-gray-500">Countdown</p>
              <p className="font-bold text-white text-xs truncate">
                {game.countdown_end ? new Date(game.countdown_end).toLocaleDateString() : "-"}
              </p>
            </div>
          </>
        )}
      </div>

      <Link
        href={`/admin/games/${game.id}`}
        className="w-full py-2 px-3 bg-neon/10 border border-neon/30 rounded-lg text-xs font-semibold text-neon hover:bg-neon/20 transition-colors flex items-center justify-center gap-1"
      >
        <Eye size={13} /> View Details
      </Link>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Games</h1>
          <p className="text-gray-400 text-sm mt-0.5">{games.length} total</p>
        </div>
        <Link
          href="/admin/games/create"
          className="flex items-center gap-2 px-4 py-2 bg-neon text-black font-semibold rounded-lg hover:bg-neon/90 transition-colors"
        >
          <Plus size={18} /> Create Game
        </Link>
      </div>

      {error && <div className="bg-red-900/20 border border-red-800/40 rounded-xl p-3 text-red-400 text-sm">{error}</div>}

      {/* Filters */}
      <div className="bg-card border border-[#2A2A2A] rounded-2xl p-4 space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search games..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#111] border border-[#2A2A2A] focus:border-neon rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-600 outline-none transition-colors"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as "" | "pills" | "predictions")}
            className="bg-[#111] border border-[#2A2A2A] rounded-lg px-3 py-2 text-xs text-white outline-none"
          >
            <option value="">All Types</option>
            <option value="pills">PILLS</option>
            <option value="predictions">TIME MACHINE</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#111] border border-[#2A2A2A] rounded-lg px-3 py-2 text-xs text-white outline-none"
          >
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="locked">Locked</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {loading && <div className="flex justify-center py-16"><Loader2 size={32} className="text-neon animate-spin" /></div>}

      {/* PILLS Section */}
      {!loading && pills.length > 0 && (
        <div>
          <h2 className="text-lg font-black text-white mb-3 flex items-center gap-2">
            <Pill size={18} className="text-neon" /> PILLS ({pills.length})
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pills.map((g) => <GameCard key={g.id} game={g} />)}
          </div>
        </div>
      )}

      {/* TIME MACHINE Section */}
      {!loading && predictions.length > 0 && (
        <div>
          <h2 className="text-lg font-black text-white mb-3 flex items-center gap-2">
            <Clock size={18} className="text-purple-400" /> TIME MACHINE ({predictions.length})
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {predictions.map((g) => <GameCard key={g.id} game={g} />)}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-16">
          <Pill size={32} className="text-gray-600 mx-auto mb-3 opacity-40" />
          <p className="text-gray-500 text-sm">No games found</p>
          <Link href="/admin/games/create" className="text-xs text-neon hover:text-white mt-3 inline-block">
            Create your first game →
          </Link>
        </div>
      )}
    </div>
  );
}
