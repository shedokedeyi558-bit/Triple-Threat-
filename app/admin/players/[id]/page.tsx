"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { adminApi, ApiError,
  type AdminPlayerDetail, type AdminActivityRow,
  type AdminReferralRow, type AdminNote } from "@/lib/api";
import { normalizeWinRate } from "@/lib/playerUtils";
import {
  ArrowLeft, Loader2, Shield, ShieldOff, AlertCircle,
  Activity, Users, MessageSquare, BarChart2, ChevronDown, ChevronUp, Plus,
} from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtNaira = (n: number) => `₦${n.toLocaleString()}`;

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("en-NG", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

const fmtShort = (iso: string) =>
  new Date(iso).toLocaleDateString("en-NG", {
    month: "short", day: "numeric", year: "numeric",
  });

// ── Transaction type → readable label ─────────────────────────────────────────
// Safe fallback: replace underscores, capitalize — never breaks on unknown types
function txTypeLabel(type: string): string {
  return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// Known type → accent color (layered on top of the safe fallback label)
function txTypeColor(type: string): string {
  const t = type.toLowerCase();
  if (t.includes("win") || t.includes("won") || t.includes("payout")) return "var(--accent-amber)";
  if (t.includes("deposit") || t.includes("credit") || t.includes("bonus")) return "#4ADE80";
  if (t.includes("withdraw") || t.includes("debit")) return "#f87171";
  if (t.includes("entry") || t.includes("play") || t.includes("stake") || t.includes("fee")) return "var(--accent-violet)";
  return "var(--text-muted)";
}

// ── Section component ─────────────────────────────────────────────────────────
function Section({ title, icon, children, defaultOpen = true }: {
  title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderRadius: 12, overflow: "hidden", backgroundColor: "var(--bg-card)",
      border: "1px solid var(--border-hairline)" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 14px", background: "none", border: "none", cursor: "pointer",
          borderBottom: open ? "1px solid var(--border-hairline)" : "none" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {icon}
          <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>{title}</p>
        </div>
        {open
          ? <ChevronUp size={14} style={{ color: "var(--text-muted)" }} />
          : <ChevronDown size={14} style={{ color: "var(--text-muted)" }} />}
      </button>
      {open && <div style={{ padding: "14px", display: "flex", flexDirection: "column", gap: 10 }}>{children}</div>}
    </div>
  );
}

// ── Stat cell ─────────────────────────────────────────────────────────────────
function StatCell({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div style={{ borderRadius: 8, padding: "10px 8px", textAlign: "center",
      backgroundColor: "var(--bg-base)", border: "1px solid var(--border-hairline)" }}>
      <p style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em",
        color: "var(--text-muted)", margin: "0 0 4px" }}>{label}</p>
      <p style={{ fontSize: 13, fontWeight: 900, fontFamily: "monospace",
        color: color ?? "var(--text-primary)", margin: 0 }}>{value}</p>
    </div>
  );
}

// ── Ban modal ─────────────────────────────────────────────────────────────────
function BanModal({ player, onConfirm, onCancel, loading }: {
  player: AdminPlayerDetail;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [reason, setReason] = useState("");
  const isBanning = player.status === "active";
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center",
      justifyContent: "center", backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", padding: 16 }}
      onClick={onCancel}>
      <div style={{ width: "100%", maxWidth: 380, borderRadius: 18, padding: "24px 22px",
        backgroundColor: "var(--bg-card)", border: `1px solid ${isBanning ? "rgba(239,68,68,0.3)" : "rgba(76,111,255,0.3)"}`,
        display: "flex", flexDirection: "column", gap: 14 }}
        onClick={(e) => e.stopPropagation()}>
        <div>
          <p style={{ fontSize: 14, fontWeight: 800, color: "var(--text-primary)", margin: "0 0 4px" }}>
            {isBanning ? "Ban player?" : "Unban player?"}
          </p>
          <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: 0 }}>
            {player.phone}{player.name ? ` · ${player.name}` : ""}
          </p>
        </div>
        {isBanning && (
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em",
              display: "block", marginBottom: 6, color: "var(--text-muted)" }}>Reason (required)</label>
            <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)}
              placeholder="Why is this player being banned?"
              style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 10,
                fontSize: 13, backgroundColor: "var(--bg-base)", border: "1px solid var(--border-subtle)",
                color: "var(--text-primary)", outline: "none", resize: "vertical" }} />
          </div>
        )}
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onCancel}
            style={{ flex: 1, padding: "10px 0", borderRadius: 10, fontSize: 12, fontWeight: 700,
              border: "1px solid var(--border-subtle)", backgroundColor: "transparent",
              color: "var(--text-secondary)", cursor: "pointer" }}>
            Cancel
          </button>
          <button onClick={() => onConfirm(reason)}
            disabled={loading || (isBanning && !reason.trim())}
            style={{ flex: 1, padding: "10px 0", borderRadius: 10, fontSize: 12, fontWeight: 800,
              border: "none", backgroundColor: isBanning ? "#ef4444" : "var(--accent-indigo)",
              color: "#fff", cursor: loading || (isBanning && !reason.trim()) ? "not-allowed" : "pointer",
              opacity: loading || (isBanning && !reason.trim()) ? 0.45 : 1,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            {loading ? <Loader2 size={13} className="animate-spin" />
              : isBanning ? <ShieldOff size={13} /> : <Shield size={13} />}
            {loading ? "…" : isBanning ? "Ban" : "Unban"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminPlayerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [player, setPlayer]         = useState<AdminPlayerDetail | null>(null);
  const [activity, setActivity]     = useState<AdminActivityRow[]>([]);
  const [actTotal, setActTotal]     = useState(0);
  const [actPage, setActPage]       = useState(1);
  const [actLoading, setActLoading] = useState(false);
  const [referrals, setReferrals]   = useState<AdminReferralRow[]>([]);
  const [referredBy, setReferredBy] = useState<AdminPlayerDetail["referred_by"]>(null);
  const [notes, setNotes]           = useState<AdminNote[]>([]);
  const [newNote, setNewNote]       = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [banModal, setBanModal]     = useState(false);
  const [banning, setBanning]       = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      adminApi.getPlayerDetail(id),
      adminApi.getPlayerActivity(id, 1, 20).catch(() => ({ transactions: [], total: 0 })),
      adminApi.getPlayerReferrals(id).catch(() => ({ referred_by: null, referrals: [] })),
      adminApi.getPlayerNotes(id).catch(() => ({ notes: [] })),
    ])
      .then(([playerRes, actRes, refRes, notesRes]) => {
        setPlayer(playerRes.player);
        setActivity(actRes.transactions ?? []);
        setActTotal(actRes.total ?? 0);
        setReferrals(refRes.referrals ?? []);
        setReferredBy(refRes.referred_by ?? null);
        setNotes(notesRes.notes ?? []);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load player"))
      .finally(() => setLoading(false));
  }, [id]);

  const loadMoreActivity = useCallback(async () => {
    if (!id) return;
    setActLoading(true);
    try {
      const next = actPage + 1;
      const res = await adminApi.getPlayerActivity(id, next, 20);
      setActivity((prev) => [...prev, ...(res.transactions ?? [])]);
      setActPage(next);
    } catch { /* silent */ }
    finally { setActLoading(false); }
  }, [id, actPage]);

  const handleAddNote = async () => {
    if (!newNote.trim() || !id) return;
    setAddingNote(true);
    try {
      const res = await adminApi.addPlayerNote(id, newNote.trim());
      setNotes((prev) => [res.note, ...prev]);
      setNewNote("");
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Failed to add note");
    } finally { setAddingNote(false); }
  };

  const handleBan = async (reason: string) => {
    if (!id || !player) return;
    setBanning(true);
    try {
      const res = player.status === "active"
        ? await adminApi.banWithReason(id, reason)
        : await adminApi.toggleBan(id);
      setPlayer((p) => p ? { ...p, status: res.player.status, ban_reason: (res.player as any).ban_reason } : p);
      setBanModal(false);
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Failed to update ban status");
    } finally { setBanning(false); }
  };

  if (loading) return (
    <div className="flex justify-center py-24">
      <Loader2 size={28} className="animate-spin" style={{ color: "var(--accent-indigo)" }} />
    </div>
  );

  if (error || !player) return (
    <div style={{ borderRadius: 12, padding: "24px", textAlign: "center", backgroundColor: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
      <AlertCircle size={22} style={{ color: "#f87171", margin: "0 auto 8px" }} />
      <p style={{ fontSize: 13, color: "#f87171" }}>{error || "Player not found"}</p>
    </div>
  );

  // ── Derived stats — stats is now always present per backend guarantee
  const stats       = player.stats!;
  const gamesPlayed = stats.games_played;
  const gamesWon    = stats.games_won;
  const totalWon    = stats.total_won;
  const totalSpent  = stats.total_spent;
  const winRatePct  = normalizeWinRate(stats.win_rate);
  const netPnl      = totalWon - totalSpent;
  const balance     = player.real_balance ?? player.balance ?? 0;
  const isBanned    = player.status === "banned";

  return (
    <div className="space-y-4 max-w-2xl pb-16">

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <button onClick={() => router.push("/admin/players")}
          style={{ padding: "7px 8px", borderRadius: 8, border: "1px solid var(--border-subtle)",
            backgroundColor: "transparent", cursor: "pointer", color: "var(--text-secondary)", flexShrink: 0 }}>
          <ArrowLeft size={16} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <h1 style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)", margin: 0,
              fontFamily: "monospace" }}>{player.phone}</h1>
            <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 4, letterSpacing: "0.05em",
              backgroundColor: isBanned ? "rgba(239,68,68,0.12)" : "rgba(76,111,255,0.12)",
              color: isBanned ? "#f87171" : "var(--accent-indigo)",
              border: `1px solid ${isBanned ? "rgba(239,68,68,0.3)" : "rgba(76,111,255,0.25)"}` }}>
              {player.status.toUpperCase()}
            </span>
          </div>
          {player.name && (
            <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "2px 0 0" }}>{player.name}</p>
          )}
          {player.email && (
            <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "1px 0 0" }}>{player.email}</p>
          )}
          <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "2px 0 0" }}>
            Joined {fmtShort(player.created_at)}
          </p>
        </div>
        <button onClick={() => setBanModal(true)}
          style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 10,
            fontSize: 11, fontWeight: 700, flexShrink: 0, cursor: "pointer", border: "1px solid",
            ...(isBanned
              ? { backgroundColor: "rgba(76,111,255,0.08)", borderColor: "rgba(76,111,255,0.3)", color: "var(--accent-indigo)" }
              : { backgroundColor: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.3)", color: "#f87171" }) }}>
          {isBanned ? <Shield size={12} /> : <ShieldOff size={12} />}
          {isBanned ? "Unban" : "Ban"}
        </button>
      </div>

      {/* ── Balance ── */}
      <Section title="Balance" icon={<span style={{ fontSize: 13, color: "var(--accent-amber)" }}>₦</span>}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <StatCell label="Real balance"  value={fmtNaira(balance)} color="var(--accent-amber)" />
          <StatCell label="Bonus balance" value={fmtNaira(player.bonus_balance ?? 0)} color="var(--accent-violet)" />
        </div>
        <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>
          Total spendable: <strong style={{ color: "var(--text-secondary)" }}>
            {fmtNaira(balance + (player.bonus_balance ?? 0))}
          </strong> · Bonus is non-withdrawable
        </p>
      </Section>

      {/* ── Stats ── */}
      <Section title="Stats" icon={<BarChart2 size={14} style={{ color: "var(--accent-indigo)" }} />}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
          <StatCell label="Games played" value={gamesPlayed} />
          <StatCell label="Games won"    value={gamesWon} color="var(--accent-amber)" />
          {winRatePct !== null && (
            <StatCell label="Win rate" value={`${winRatePct}%`}
              color={winRatePct >= 50 ? "var(--accent-amber)" : "var(--text-primary)"} />
          )}
          <StatCell label="Total won"   value={fmtNaira(totalWon)}   color="var(--accent-amber)" />
          <StatCell label="Total spent" value={fmtNaira(totalSpent)} color="var(--text-secondary)" />
          <StatCell label="Net P&L"
            value={`${netPnl >= 0 ? "+" : ""}${fmtNaira(netPnl)}`}
            color={netPnl >= 0 ? "#4ADE80" : "#f87171"} />
        </div>
      </Section>

      {/* ── Activity ── */}
      <Section title={`Activity (${actTotal})`}
        icon={<Activity size={14} style={{ color: "var(--accent-indigo)" }} />}
        defaultOpen={false}>
        {activity.length === 0 ? (
          <p style={{ fontSize: 13, textAlign: "center", color: "var(--text-muted)", padding: "12px 0" }}>
            No transactions yet
          </p>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {activity.map((tx, i) => {
                const isCredit = tx.amount > 0;
                return (
                  <div key={tx.id} style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "10px 0",
                    borderBottom: i < activity.length - 1 ? "1px solid var(--border-hairline)" : "none",
                  }}>
                    {/* Type badge */}
                    <span style={{
                      fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4, flexShrink: 0,
                      backgroundColor: "rgba(255,255,255,0.05)", color: txTypeColor(tx.type),
                      border: "1px solid rgba(255,255,255,0.06)", textTransform: "uppercase", letterSpacing: "0.04em",
                    }}>
                      {txTypeLabel(tx.type)}
                    </span>
                    {/* Description + date */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, color: "var(--text-primary)", margin: 0,
                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {tx.description}
                      </p>
                      <p style={{ fontSize: 10, color: "var(--text-muted)", margin: "1px 0 0" }}>
                        {fmtDate(tx.created_at)}
                      </p>
                    </div>
                    {/* Amount */}
                    <span style={{ fontSize: 13, fontWeight: 800, fontFamily: "monospace", flexShrink: 0,
                      color: isCredit ? "var(--accent-amber)" : "#f87171" }}>
                      {isCredit ? "+" : ""}₦{Math.abs(tx.amount).toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
            {activity.length < actTotal && (
              <button onClick={loadMoreActivity} disabled={actLoading}
                style={{ width: "100%", padding: "8px 0", borderRadius: 8, fontSize: 11, fontWeight: 700,
                  border: "1px solid var(--border-subtle)", backgroundColor: "transparent",
                  color: "var(--text-secondary)", cursor: actLoading ? "not-allowed" : "pointer", opacity: actLoading ? 0.5 : 1,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                {actLoading && <Loader2 size={12} className="animate-spin" />}
                {actLoading ? "Loading…" : `Load more (${actTotal - activity.length} remaining)`}
              </button>
            )}
          </>
        )}
      </Section>

      {/* ── Referrals ── */}
      <Section title="Referrals" icon={<Users size={14} style={{ color: "var(--accent-indigo)" }} />} defaultOpen={false}>
        {referredBy && (
          <div style={{ borderRadius: 8, padding: "10px 12px", backgroundColor: "var(--bg-base)",
            border: "1px solid var(--border-hairline)", marginBottom: 4 }}>
            <p style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em",
              color: "var(--text-muted)", margin: "0 0 3px" }}>Referred by</p>
            <p style={{ fontSize: 13, fontWeight: 700, fontFamily: "monospace", color: "var(--text-primary)", margin: 0 }}>
              {referredBy.phone}{referredBy.name ? ` · ${referredBy.name}` : ""}
            </p>
          </div>
        )}
        {referrals.length === 0 ? (
          <p style={{ fontSize: 13, textAlign: "center", color: "var(--text-muted)", padding: "8px 0" }}>No referrals</p>
        ) : (
          <div>
            {referrals.map((r) => (
              <div key={r.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "9px 0", borderBottom: "1px solid var(--border-hairline)" }}>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, fontFamily: "monospace", color: "var(--text-primary)", margin: 0 }}>
                    {r.phone}{r.name ? ` · ${r.name}` : ""}
                  </p>
                  <p style={{ fontSize: 10, color: "var(--text-muted)", margin: "1px 0 0" }}>{fmtShort(r.created_at)}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4,
                    backgroundColor: r.status === "completed" ? "rgba(76,111,255,0.12)" : "rgba(255,255,255,0.05)",
                    color: r.status === "completed" ? "var(--accent-indigo)" : "var(--text-muted)" }}>
                    {r.status.toUpperCase()}
                  </span>
                  {(r.bonus_amount ?? 0) > 0 && (
                    <p style={{ fontSize: 11, fontFamily: "monospace", fontWeight: 700, color: "var(--accent-amber)", margin: "2px 0 0" }}>
                      +{fmtNaira(r.bonus_amount)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* ── Notes ── */}
      <Section title="Notes" icon={<MessageSquare size={14} style={{ color: "var(--accent-indigo)" }} />} defaultOpen={false}>
        <div style={{ display: "flex", gap: 8 }}>
          <input type="text" placeholder="Add a note…" value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !addingNote) handleAddNote(); }}
            style={{ flex: 1, padding: "9px 12px", borderRadius: 8, fontSize: 12, outline: "none",
              backgroundColor: "var(--bg-base)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)" }} />
          <button onClick={handleAddNote} disabled={!newNote.trim() || addingNote}
            style={{ padding: "9px 14px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer",
              backgroundColor: "rgba(76,111,255,0.1)", border: "1px solid rgba(76,111,255,0.25)",
              color: "var(--accent-indigo)", opacity: !newNote.trim() ? 0.45 : 1,
              display: "flex", alignItems: "center", gap: 5 }}>
            {addingNote ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
            Add
          </button>
        </div>
        {notes.length === 0 ? (
          <p style={{ fontSize: 12, textAlign: "center", color: "var(--text-muted)", padding: "8px 0" }}>No notes</p>
        ) : notes.map((n) => (
          <div key={n.id} style={{ padding: "10px 0", borderBottom: "1px solid var(--border-hairline)" }}>
            <p style={{ fontSize: 12, color: "var(--text-primary)", margin: "0 0 3px", lineHeight: 1.5 }}>{n.content}</p>
            <p style={{ fontSize: 10, color: "var(--text-muted)", margin: 0 }}>
              {fmtDate(n.created_at)}{n.created_by ? ` · ${n.created_by}` : ""}
            </p>
          </div>
        ))}
      </Section>

      {/* ── Ban history ── */}
      {player.ban_history && player.ban_history.length > 0 && (
        <Section title="Ban History" icon={<ShieldOff size={14} style={{ color: "#f87171" }} />} defaultOpen={false}>
          {player.ban_reason && (
            <div style={{ borderRadius: 8, padding: "10px 12px", backgroundColor: "rgba(239,68,68,0.05)",
              border: "1px solid rgba(239,68,68,0.2)", marginBottom: 4 }}>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em",
                color: "var(--text-muted)", margin: "0 0 3px" }}>Current ban reason</p>
              <p style={{ fontSize: 12, color: "#f87171", margin: 0 }}>{player.ban_reason}</p>
            </div>
          )}
          {player.ban_history.map((b, i) => (
            <div key={i} style={{ padding: "9px 0", borderBottom: "1px solid var(--border-hairline)" }}>
              <p style={{ fontSize: 12, color: "var(--text-primary)", margin: "0 0 2px" }}>{b.reason}</p>
              <p style={{ fontSize: 10, color: "var(--text-muted)", margin: 0 }}>
                {fmtDate(b.banned_at)}{b.banned_by ? ` · ${b.banned_by}` : ""}
              </p>
            </div>
          ))}
        </Section>
      )}

      {/* Ban modal */}
      {banModal && (
        <BanModal player={player} onConfirm={handleBan} onCancel={() => setBanModal(false)} loading={banning} />
      )}
    </div>
  );
}
