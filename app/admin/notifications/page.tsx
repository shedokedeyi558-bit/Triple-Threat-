"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { adminNotificationsApi, adminApi, type AdminPlayer, ApiError } from "@/lib/api";
import { Megaphone, Send, CheckCircle, AlertCircle, Loader2, Search, Users, X } from "lucide-react";

const inp = "w-full rounded-lg px-4 py-3 text-sm focus:outline-none transition-colors border"
  + " bg-[var(--bg-base)] border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-gray-600"
  + " focus:border-[var(--accent-indigo)]/50";

// ── Player picker for specific-mode ──────────────────────────────────────────
function PlayerPicker({
  selected,
  onToggle,
  totalCount,
}: {
  selected: Set<string>;
  onToggle: (player: AdminPlayer) => void;
  totalCount: number;
}) {
  const [players, setPlayers] = useState<AdminPlayer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetch = useCallback(async (q?: string) => {
    setLoading(true);
    try {
      const res = await adminApi.getPlayers(q ? { search: q } : {});
      setPlayers(res.players);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const handleSearch = (q: string) => {
    setSearch(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetch(q), 350);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Selected count badge */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <label className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: "var(--text-secondary)" }}>
          Select Players
        </label>
        {selected.size > 0 && (
          <span style={{
            fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 100,
            backgroundColor: "rgba(76,111,255,0.15)", color: "var(--accent-indigo)",
            border: "1px solid rgba(76,111,255,0.3)",
          }}>
            {selected.size} selected
          </span>
        )}
      </div>

      {/* Search */}
      <div style={{ position: "relative" }}>
        <Search size={13} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)",
          color: "var(--text-muted)", pointerEvents: "none" }} />
        <input
          type="text"
          placeholder="Search by phone or name..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          style={{
            width: "100%", boxSizing: "border-box", paddingLeft: 32, paddingRight: 12,
            paddingTop: 9, paddingBottom: 9, borderRadius: 8, fontSize: 13,
            backgroundColor: "var(--bg-base)", border: "1px solid var(--border-subtle)",
            color: "var(--text-primary)", outline: "none",
          }}
        />
      </div>

      {/* Player list */}
      <div style={{
        maxHeight: 260, overflowY: "auto", borderRadius: 10,
        border: "1px solid var(--border-hairline)", backgroundColor: "var(--bg-base)",
      }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 20 }}>
            <Loader2 size={18} className="animate-spin" style={{ color: "var(--accent-indigo)" }} />
          </div>
        ) : players.length === 0 ? (
          <p style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", padding: 16 }}>
            No players found
          </p>
        ) : (
          players.map((p, i) => {
            const isSelected = selected.has(p.id);
            return (
              <label key={p.id} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", cursor: "pointer",
                borderBottom: i < players.length - 1 ? "1px solid var(--border-hairline)" : "none",
                backgroundColor: isSelected ? "rgba(76,111,255,0.05)" : "transparent",
                transition: "background 0.1s",
              }}>
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggle(p)}
                  style={{ width: 14, height: 14, accentColor: "var(--accent-indigo)", flexShrink: 0, cursor: "pointer" }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", margin: 0,
                    fontFamily: "monospace", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {p.name ?? p.phone}
                  </p>
                  {p.name && (
                    <p style={{ fontSize: 10, color: "var(--text-muted)", margin: 0, fontFamily: "monospace" }}>
                      {p.phone}
                    </p>
                  )}
                </div>
                <span style={{
                  fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 4,
                  backgroundColor: p.status === "banned" ? "rgba(239,68,68,0.1)" : "rgba(74,222,128,0.08)",
                  color: p.status === "banned" ? "#f87171" : "#4ADE80",
                }}>
                  {p.status.toUpperCase()}
                </span>
              </label>
            );
          })
        )}
      </div>

      {selected.size > 0 && (
        <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>
          {selected.size} of {totalCount} player{totalCount !== 1 ? "s" : ""} selected
        </p>
      )}
    </div>
  );
}

// ── Confirm dialog ────────────────────────────────────────────────────────────
function ConfirmDialog({
  mode,
  selectedCount,
  totalCount,
  title,
  onConfirm,
  onCancel,
  sending,
}: {
  mode: "all" | "specific";
  selectedCount: number;
  totalCount: number;
  title: string;
  onConfirm: () => void;
  onCancel: () => void;
  sending: boolean;
}) {
  const recipient = mode === "all"
    ? `all ${totalCount} registered players`
    : `${selectedCount} selected player${selectedCount !== 1 ? "s" : ""}`;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center",
      justifyContent: "center", backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", padding: 16,
    }} onClick={onCancel}>
      <div style={{
        width: "100%", maxWidth: 380, borderRadius: 18, padding: "24px 22px",
        backgroundColor: "var(--bg-card)", border: "1px solid rgba(232,163,61,0.3)",
        display: "flex", flexDirection: "column", gap: 14,
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
          <Megaphone size={16} style={{ color: "var(--accent-amber)", flexShrink: 0, marginTop: 1 }} />
          <div>
            <p style={{ fontSize: 14, fontWeight: 800, color: "var(--text-primary)", margin: "0 0 4px" }}>
              Send notification?
            </p>
            <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>
              "{title}" will be sent to <strong style={{ color: "var(--text-primary)" }}>{recipient}</strong>.
              This cannot be undone.
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onCancel}
            style={{ flex: 1, padding: "10px 0", borderRadius: 10, fontSize: 12, fontWeight: 700,
              border: "1px solid var(--border-subtle)", backgroundColor: "transparent",
              color: "var(--text-secondary)", cursor: "pointer" }}>
            Cancel
          </button>
          <button onClick={onConfirm} disabled={sending}
            style={{ flex: 1, padding: "10px 0", borderRadius: 10, fontSize: 12, fontWeight: 800,
              border: "none", backgroundColor: "var(--accent-amber)", color: "#000",
              cursor: sending ? "not-allowed" : "pointer", opacity: sending ? 0.6 : 1,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            {sending && <Loader2 size={13} className="animate-spin" />}
            {sending ? "Sending…" : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function BroadcastPage() {
  const [title, setTitle]     = useState("");
  const [message, setMessage] = useState("");
  const [mode, setMode]       = useState<"all" | "specific">("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [sending, setSending] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [result, setResult]   = useState<{ sent_count: number } | null>(null);
  const [error, setError]     = useState("");

  // Load total player count for "all" mode confirmation message
  useEffect(() => {
    adminApi.getPlayers({ limit: 1 } as any)
      .then((res) => setTotalPlayers(res.total ?? res.players.length))
      .catch(() => {});
  }, []);

  const togglePlayer = (player: AdminPlayer) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(player.id)) next.delete(player.id);
      else next.add(player.id);
      return next;
    });
  };

  const canSend =
    title.trim().length > 0 &&
    message.trim().length > 0 &&
    (mode === "all" || selectedIds.size > 0);

  const handleSend = async () => {
    if (!canSend || sending) return;
    setSending(true);
    setError("");
    setResult(null);
    setShowConfirm(false);
    try {
      const ids = mode === "specific" ? Array.from(selectedIds) : undefined;
      const res = await adminNotificationsApi.broadcast(title.trim(), message.trim(), ids);
      setResult({ sent_count: res.sent_count });
      setTitle("");
      setMessage("");
      setSelectedIds(new Set());
      setMode("all");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to send notification");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-xl space-y-6 pb-24">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Megaphone size={18} style={{ color: "var(--accent-amber)" }} />
          <h1 className="font-headline text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>
            Broadcast Notification
          </h1>
        </div>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Send a message to all players or specific recipients. Appears in their notification bell immediately.
        </p>
      </div>

      {/* Feedback */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg p-3 border text-sm"
          style={{ borderColor: "rgba(239,68,68,0.3)", backgroundColor: "rgba(239,68,68,0.05)", color: "#ef4444" }}>
          <AlertCircle size={15} className="flex-shrink-0" /> {error}
        </div>
      )}
      {result && (
        <div className="flex items-center gap-2 rounded-lg p-3 border text-sm"
          style={{ borderColor: "rgba(76,111,255,0.3)", backgroundColor: "rgba(76,111,255,0.05)", color: "var(--accent-indigo)" }}>
          <CheckCircle size={15} className="flex-shrink-0" />
          Sent to {result.sent_count.toLocaleString()} player{result.sent_count !== 1 ? "s" : ""}
        </div>
      )}

      <div className="rounded-xl p-5 space-y-5 border"
        style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-hairline)" }}>

        {/* ── Recipient toggle ── */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-widest block mb-2"
            style={{ color: "var(--text-secondary)" }}>Send to</label>
          <div style={{ display: "flex", borderRadius: 10, overflow: "hidden",
            border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-base)" }}>
            {(["all", "specific"] as const).map((m) => (
              <button key={m} onClick={() => { setMode(m); setSelectedIds(new Set()); }}
                style={{
                  flex: 1, padding: "9px 0", fontSize: 12, fontWeight: 700, border: "none",
                  cursor: "pointer", transition: "all 0.15s",
                  backgroundColor: mode === m ? "var(--accent-amber)" : "transparent",
                  color: mode === m ? "#000" : "var(--text-muted)",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}>
                {m === "all"
                  ? <><Users size={12} /> All Players {totalPlayers > 0 ? `(${totalPlayers})` : ""}</>
                  : <><Send size={12} /> Specific Players</>}
              </button>
            ))}
          </div>
        </div>

        {/* ── Specific player picker ── */}
        {mode === "specific" && (
          <PlayerPicker
            selected={selectedIds}
            onToggle={togglePlayer}
            totalCount={totalPlayers}
          />
        )}

        {/* ── Title ── */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-widest block mb-1.5"
            style={{ color: "var(--text-secondary)" }}>Title</label>
          <input className={inp} placeholder="e.g. New Specials pack live!"
            value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} />
          <p className="text-[10px] mt-1 text-right" style={{ color: "var(--text-muted)" }}>{title.length}/80</p>
        </div>

        {/* ── Message ── */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-widest block mb-1.5"
            style={{ color: "var(--text-secondary)" }}>Message</label>
          <textarea className={inp + " resize-none"} rows={4}
            placeholder="e.g. A new Football Specials pack is live — ₦5,000 entry, ₦50,000 prize."
            value={message} onChange={(e) => setMessage(e.target.value)} maxLength={300} />
          <p className="text-[10px] mt-1 text-right" style={{ color: "var(--text-muted)" }}>{message.length}/300</p>
        </div>

        {/* ── Preview ── */}
        {(title || message) && (
          <div className="rounded-lg p-3 border space-y-1"
            style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border-hairline)" }}>
            <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Preview</p>
            <div className="flex items-start gap-3 pt-1">
              <div className="w-7 h-7 rounded-lg bg-[#1A1A1A] flex items-center justify-center flex-shrink-0">
                <Megaphone size={13} style={{ color: "var(--accent-amber)" }} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white leading-tight">{title || "—"}</p>
                <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "var(--text-muted)" }}>{message || "—"}</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Send button ── */}
        <button
          onClick={() => setShowConfirm(true)}
          disabled={!canSend || sending}
          className="w-full py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-40 transition-all"
          style={{ backgroundColor: "var(--accent-amber)", color: "#000" }}
        >
          {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
          {sending ? "Sending…"
            : mode === "all"
            ? "Send to all players"
            : selectedIds.size === 0
            ? "Select players first"
            : `Send to ${selectedIds.size} player${selectedIds.size !== 1 ? "s" : ""}`}
        </button>
      </div>

      {/* ── Confirmation dialog ── */}
      {showConfirm && (
        <ConfirmDialog
          mode={mode}
          selectedCount={selectedIds.size}
          totalCount={totalPlayers}
          title={title}
          onConfirm={handleSend}
          onCancel={() => setShowConfirm(false)}
          sending={sending}
        />
      )}
    </div>
  );
}
