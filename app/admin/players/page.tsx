"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { adminApi, type AdminPlayer, ApiError } from "@/lib/api";
import { Search, ChevronDown, ChevronUp, Loader2, ExternalLink } from "lucide-react";

export default function PlayersPage() {
  const router = useRouter();
  const [players, setPlayers] = useState<AdminPlayer[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"" | "active" | "banned">("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  const fetchPlayers = useCallback(async (q?: string, status?: string) => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, string> = {};
      if (q) params.search = q;
      if (status) params.status = status;
      const data = await adminApi.getPlayers(params);
      setPlayers(data.players);
      setTotal(data.total ?? data.players.length);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load players");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPlayers(); }, [fetchPlayers]);

  // Debounce search + filter
  useEffect(() => {
    const t = setTimeout(() => fetchPlayers(search, filter), 400);
    return () => clearTimeout(t);
  }, [search, filter, fetchPlayers]);

  const handleToggleBan = async (player: AdminPlayer) => {
    setToggling(player.id);
    try {
      const res = await adminApi.toggleBan(player.id);
      setPlayers((prev) => prev.map((p) => p.id === player.id ? res.player : p));
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Failed to update player");
    } finally {
      setToggling(null);
    }
  };

  const maskPhone = (ph: string) => `${ph.slice(0, 4)}***${ph.slice(-4)}`;

  const winRate = (p: AdminPlayer) =>
    p.games_played > 0 ? Math.round((p.games_won / p.games_played) * 100) : 0;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black text-white">Players</h1>
        <p className="text-gray-400 text-sm mt-0.5">{total} registered players</p>
      </div>

      {/* Search + Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search by phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-card border border-[#2A2A2A] focus:border-[#4C6FFF] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition-colors"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as "" | "active" | "banned")}
          className="bg-card border border-[#2A2A2A] rounded-xl px-3 py-3 text-sm text-white outline-none"
        >
          <option value="">All</option>
          <option value="active">Active</option>
          <option value="banned">Banned</option>
        </select>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 size={28} className="animate-spin" style={{ color: "var(--accent-indigo)" }} />
        </div>
      )}

      {error && !loading && (
        <div className="text-center py-8 text-red-400 text-sm">{error}</div>
      )}

      {!loading && !error && (
        <div className="space-y-2">
          {players.map((p) => (
            <div key={p.id} className="bg-card border border-[#2A2A2A] rounded-xl overflow-hidden">
              <button
                className="w-full px-4 py-3 flex items-center justify-between text-left"
                onClick={() => setExpanded((prev) => (prev === p.id ? null : p.id))}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${p.status === "active" ? "bg-[#4C6FFF]" : "bg-red-500"}`} />
                  <div>
                    <p className="text-sm text-white font-semibold">{maskPhone(p.phone)}</p>
                    {p.name && <p className="text-xs text-gray-400">{p.name}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-sm" style={{ color: "var(--accent-amber)" }}>
                    ₦{p.balance.toLocaleString()}
                  </span>
                  {expanded === p.id ? (
                    <ChevronUp size={16} className="text-gray-400" />
                  ) : (
                    <ChevronDown size={16} className="text-gray-400" />
                  )}
                </div>
              </button>

              {expanded === p.id && (
                <div className="border-t border-[#2A2A2A] px-4 py-4 space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Played", value: p.games_played },
                      { label: "Won", value: p.games_won },
                      { label: "Win rate", value: `${winRate(p)}%` },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-[#111] rounded-xl p-3 text-center">
                        <p className="text-white font-bold text-sm">{value}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between bg-[#111] rounded-xl p-3">
                    <span className="text-xs text-gray-400">Total won</span>
                    <span className="font-mono font-bold text-sm" style={{ color: "var(--accent-amber)" }}>
                      ₦{p.total_won.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between bg-[#111] rounded-xl p-3">
                    <span className="text-xs text-gray-400">Joined</span>
                    <span className="text-white text-sm">
                      {new Date(p.created_at).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </div>

                  {/* Open detail page */}
                  <button
                    onClick={() => router.push(`/admin/players/${p.id}`)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm border"
                    style={{ backgroundColor: "rgba(76,111,255,0.06)", borderColor: "rgba(76,111,255,0.2)", color: "var(--accent-indigo)" }}
                  >
                    <ExternalLink size={14} /> View full profile
                  </button>

                  <button
                    onClick={() => handleToggleBan(p)}
                    disabled={toggling === p.id}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all active:scale-[0.98] disabled:opacity-50 ${
                      p.status === "active"
                        ? "bg-red-900/30 border border-red-800/40 text-red-400 hover:bg-red-900/50"
                        : "border hover:opacity-80"
                    }`}
                    style={p.status !== "active" ? {
                      backgroundColor: "rgba(76,111,255,0.1)",
                      borderColor: "rgba(76,111,255,0.3)",
                      color: "var(--accent-indigo)",
                    } : undefined}
                  >
                    {toggling === p.id ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : p.status === "active" ? (
                      <><ShieldOff size={15} /> Ban Player</>
                    ) : (
                      <><Shield size={15} /> Unban Player</>
                    )}
                  </button>
                </div>
              )}
            </div>
          ))}

          {players.length === 0 && (
            <div className="text-center py-12 text-gray-500">No players found</div>
          )}
        </div>
      )}
    </div>
  );
}

