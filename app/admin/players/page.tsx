"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { adminApi, type AdminPlayer, ApiError } from "@/lib/api";
import { Search, Loader2, ChevronDown, ChevronUp, ArrowUpDown } from "lucide-react";

// ── Shared utility lives in lib/playerUtils.ts ────────────────────────────────
import { normalizeWinRate } from "@/lib/playerUtils";

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 30) return `${diffDays}d ago`;
  return d.toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" });
}

function fmtNaira(n: number) {
  return `₦${n.toLocaleString()}`;
}

type SortKey = "balance" | "created_at" | "games_played" | "total_won";
type SortDir = "asc" | "desc";

function sortPlayers(players: AdminPlayer[], key: SortKey, dir: SortDir): AdminPlayer[] {
  return [...players].sort((a, b) => {
    let va: number, vb: number;
    if (key === "balance")     { va = a.real_balance ?? a.balance; vb = b.real_balance ?? b.balance; }
    else if (key === "total_won")  { va = a.total_won; vb = b.total_won; }
    else if (key === "games_played") { va = a.games_played; vb = b.games_played; }
    else { va = new Date(a.created_at).getTime(); vb = new Date(b.created_at).getTime(); }
    return dir === "desc" ? vb - va : va - vb;
  });
}

// ── Player row ────────────────────────────────────────────────────────────────
function PlayerRow({ player }: { player: AdminPlayer }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const isBanned = player.status === "banned";
  const balance = player.real_balance ?? player.balance;

  return (
    <div style={{
      borderRadius: 12, overflow: "hidden", backgroundColor: "var(--bg-card)",
      border: "1px solid var(--border-hairline)",
      borderLeft: `3px solid ${isBanned ? "#ef4444" : "var(--border-hairline)"}`,
    }}>
      {/* ── Collapsed row — carries full signal ── */}
      <button
        onClick={() => setExpanded((v) => !v)}
        style={{
          width: "100%", padding: "12px 14px", display: "flex", alignItems: "center",
          gap: 12, background: "none", border: "none", cursor: "pointer", textAlign: "left",
        }}
      >
        {/* Status dot */}
        <span style={{
          width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
          backgroundColor: isBanned ? "#ef4444" : "#4ADE80",
          boxShadow: isBanned ? "none" : "0 0 6px rgba(74,222,128,0.6)",
        }} />

        {/* Identity */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {player.name ?? player.phone}
          </p>
          {player.name && (
            <p style={{ fontSize: 10, color: "var(--text-muted)", margin: 0, fontFamily: "monospace" }}>{player.phone}</p>
          )}
        </div>

        {/* Balance */}
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 800, fontFamily: "monospace", color: "var(--accent-amber)", margin: 0 }}>
            {fmtNaira(balance)}
          </p>
          {(player.bonus_balance ?? 0) > 0 && (
            <p style={{ fontSize: 9, color: "var(--accent-violet)", margin: 0 }}>
              +{fmtNaira(player.bonus_balance)} bonus
            </p>
          )}
        </div>

        {/* Chevron */}
        {expanded
          ? <ChevronUp size={14} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
          : <ChevronDown size={14} style={{ color: "var(--text-muted)", flexShrink: 0 }} />}
      </button>

      {/* ── Expanded detail ── */}
      {expanded && (
        <div style={{ borderTop: "1px solid var(--border-hairline)", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
          {/* Meta row */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", fontSize: 11, color: "var(--text-muted)" }}>
            <span>Joined {fmtDate(player.created_at)}</span>
            {isBanned && <span style={{ color: "#f87171", fontWeight: 700 }}>● Banned</span>}
          </div>

          {/* View full profile */}
          <button
            onClick={() => router.push(`/admin/players/${player.id}`)}
            style={{ padding: "8px 0", borderRadius: 10, fontSize: 12, fontWeight: 700,
              backgroundColor: "rgba(76,111,255,0.08)", border: "1px solid rgba(76,111,255,0.2)",
              color: "var(--accent-indigo)", cursor: "pointer" }}>
            View full profile →
          </button>
        </div>
      )}
    </div>
  );
}

// ── Sort button ───────────────────────────────────────────────────────────────
function SortBtn({ label, active, dir, onClick }: {
  label: string; active: boolean; dir: SortDir; onClick: () => void;
}) {
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 8,
      fontSize: 11, fontWeight: 700, cursor: "pointer",
      backgroundColor: active ? "rgba(76,111,255,0.12)" : "transparent",
      border: `1px solid ${active ? "rgba(76,111,255,0.3)" : "var(--border-hairline)"}`,
      color: active ? "var(--accent-indigo)" : "var(--text-muted)",
    }}>
      {label}
      <ArrowUpDown size={10} style={{ opacity: active ? 1 : 0.4, transform: active && dir === "asc" ? "scaleY(-1)" : "none" }} />
    </button>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function PlayersPage() {
  const [players, setPlayers] = useState<AdminPlayer[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"" | "active" | "banned">("");
  const [sortKey, setSortKey] = useState<SortKey>("balance");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

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

  useEffect(() => {
    const t = setTimeout(() => fetchPlayers(search, filter), 400);
    return () => clearTimeout(t);
  }, [search, filter, fetchPlayers]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => d === "desc" ? "asc" : "desc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  const sorted = sortPlayers(players, sortKey, sortDir);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white">Players</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
          {total} registered
        </p>
      </div>

      {/* Search + Filter */}
      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ position: "relative", flex: 1 }}>
          <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
          <input
            type="text"
            placeholder="Search by phone or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%", boxSizing: "border-box", paddingLeft: 34, paddingRight: 14,
              paddingTop: 10, paddingBottom: 10, borderRadius: 10, fontSize: 13,
              backgroundColor: "var(--bg-card)", border: "1px solid var(--border-subtle)",
              color: "var(--text-primary)", outline: "none",
            }}
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as "" | "active" | "banned")}
          style={{ padding: "10px 12px", borderRadius: 10, fontSize: 13, backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border-subtle)", color: "var(--text-primary)", outline: "none", cursor: "pointer" }}>
          <option value="">All</option>
          <option value="active">Active</option>
          <option value="banned">Banned</option>
        </select>
      </div>

      {/* Sort controls */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em",
          color: "var(--text-muted)", alignSelf: "center" }}>Sort:</span>
        {([
          ["balance", "Balance"] as const,
          ["total_won", "Total Won"] as const,
          ["games_played", "Games"] as const,
          ["created_at", "Joined"] as const,
        ]).map(([key, label]) => (
          <SortBtn key={key} label={label} active={sortKey === key} dir={sortDir} onClick={() => toggleSort(key)} />
        ))}
      </div>

      {/* Error */}
      {error && (
        <div style={{ borderRadius: 10, padding: "10px 14px", backgroundColor: "rgba(239,68,68,0.06)",
          border: "1px solid rgba(239,68,68,0.2)", fontSize: 13, color: "#f87171" }}>
          {error}
        </div>
      )}

      {/* List */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}>
          <Loader2 size={26} className="animate-spin" style={{ color: "var(--accent-indigo)" }} />
        </div>
      ) : sorted.length === 0 ? (
        <p style={{ textAlign: "center", padding: "40px 0", fontSize: 13, color: "var(--text-muted)" }}>
          No players found
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {sorted.map((p) => <PlayerRow key={p.id} player={p} />)}
        </div>
      )}
    </div>
  );
}
