"use client";

import { useState } from "react";
import { useAdmin } from "@/context/AdminContext";
import { Search, Shield, ShieldOff, ChevronDown, ChevronUp } from "lucide-react";

export default function PlayersPage() {
  const { state, dispatch } = useAdmin();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "banned">("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = state.players.filter((p) => {
    const matchSearch = p.phone.includes(search) || (p.name?.toLowerCase().includes(search.toLowerCase()) ?? false);
    const matchFilter = filter === "all" || p.status === filter;
    return matchSearch && matchFilter;
  });

  const maskPhone = (ph: string) => `${ph.slice(0, 4)}***${ph.slice(-4)}`;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black text-white">Players</h1>
        <p className="text-gray-400 text-sm mt-0.5">{state.players.length} registered players</p>
      </div>

      {/* Search + Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search by phone or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-card border border-[#2A2A2A] focus:border-neon rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition-colors"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as "all" | "active" | "banned")}
          className="bg-card border border-[#2A2A2A] rounded-xl px-3 py-3 text-sm text-white outline-none"
        >
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="banned">Banned</option>
        </select>
      </div>

      {/* Player cards */}
      <div className="space-y-2">
        {filtered.map((p) => (
          <div
            key={p.id}
            className="bg-card border border-[#2A2A2A] rounded-xl overflow-hidden"
          >
            <button
              className="w-full px-4 py-3 flex items-center justify-between text-left"
              onClick={() => setExpanded((prev) => (prev === p.id ? null : p.id))}
            >
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${p.status === "active" ? "bg-neon" : "bg-red-500"}`} />
                <div>
                  <p className="text-sm text-white font-semibold">{maskPhone(p.phone)}</p>
                  {p.name && <p className="text-xs text-gray-400">{p.name}</p>}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-neon text-sm font-bold">₦{p.balance.toLocaleString()}</span>
                {expanded === p.id ? (
                  <ChevronUp size={16} className="text-gray-400" />
                ) : (
                  <ChevronDown size={16} className="text-gray-400" />
                )}
              </div>
            </button>

            {expanded === p.id && (
              <div className="border-t border-[#2A2A2A] px-4 py-4 space-y-4">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Games played", value: p.gamesPlayed },
                    { label: "Won", value: p.gamesWon },
                    { label: "Win rate", value: `${Math.round((p.gamesWon / p.gamesPlayed) * 100) || 0}%` },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-[#111] rounded-xl p-3 text-center">
                      <p className="text-white font-bold text-sm">{value}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between bg-[#111] rounded-xl p-3">
                  <span className="text-xs text-gray-400">Total won</span>
                  <span className="text-neon font-bold">₦{p.totalWon.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between bg-[#111] rounded-xl p-3">
                  <span className="text-xs text-gray-400">Joined</span>
                  <span className="text-white text-sm">{p.createdAt}</span>
                </div>

                {/* Ban / Unban */}
                <button
                  onClick={() =>
                    dispatch({
                      type: p.status === "active" ? "BAN_PLAYER" : "UNBAN_PLAYER",
                      id: p.id,
                    })
                  }
                  className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-colors ${
                    p.status === "active"
                      ? "bg-red-900/30 border border-red-800/40 text-red-400 hover:bg-red-900/50"
                      : "bg-neon/10 border border-neon/30 text-neon hover:bg-neon/20"
                  }`}
                >
                  {p.status === "active" ? (
                    <><ShieldOff size={15} /> Ban Player</>
                  ) : (
                    <><Shield size={15} /> Unban Player</>
                  )}
                </button>
              </div>
            )}
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-500">No players found</div>
        )}
      </div>
    </div>
  );
}
