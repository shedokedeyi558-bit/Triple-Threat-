"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { adminApi, ApiError,
  type AdminPlayerDetail, type AdminActivityRow,
  type AdminReferralRow, type AdminNote } from "@/lib/api";
import {
  ArrowLeft, Loader2, Shield, ShieldOff, AlertCircle,
  Activity, Users, MessageSquare, BarChart2, ChevronDown, ChevronUp, Plus,
} from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────

const maskPhone = (ph: string) =>
  ph && ph.length >= 8 ? `${ph.slice(0, 4)}***${ph.slice(-4)}` : ph ?? "—";

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("en-NG", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });

const fmtShort = (iso: string) =>
  new Date(iso).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" });

// ── Collapsible section ───────────────────────────────────────────────────────

function Section({ title, icon, children, defaultOpen = true }: {
  title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border-hairline)", backgroundColor: "var(--bg-card)" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
        style={{ borderBottom: open ? "1px solid var(--border-hairline)" : "none" }}>
        <div className="flex items-center gap-2">
          {icon}
          <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>{title}</p>
        </div>
        {open ? <ChevronUp size={15} style={{ color: "var(--text-muted)" }} /> : <ChevronDown size={15} style={{ color: "var(--text-muted)" }} />}
      </button>
      {open && <div className="px-4 py-4 space-y-3">{children}</div>}
    </div>
  );
}

// ── Stat cell ────────────────────────────────────────────────────────────────

function StatCell({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="rounded-lg p-3 text-center border" style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border-hairline)" }}>
      <p className="text-[10px] uppercase tracking-widest font-bold mb-1" style={{ color: "var(--text-muted)" }}>{label}</p>
      <p className="font-black text-sm font-mono" style={{ color: color ?? "var(--text-primary)" }}>{value}</p>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onCancel}>
      <div className="w-full max-w-sm rounded-2xl p-6 space-y-4 border"
        style={{ backgroundColor: "var(--bg-card)", borderColor: isBanning ? "rgba(239,68,68,0.3)" : "rgba(76,111,255,0.3)" }}
        onClick={(e) => e.stopPropagation()}>
        <div>
          <p className="font-bold text-base mb-1" style={{ color: "var(--text-primary)" }}>
            {isBanning ? "Ban player?" : "Unban player?"}
          </p>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {maskPhone(player.phone)}{player.name ? ` · ${player.name}` : ""}
          </p>
        </div>
        {isBanning && (
          <div>
            <label className="text-[11px] uppercase tracking-widest font-bold block mb-1.5" style={{ color: "var(--text-muted)" }}>
              Reason (required)
            </label>
            <textarea
              rows={3} value={reason} onChange={(e) => setReason(e.target.value)}
              placeholder="Why is this player being banned?"
              className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none"
              style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)" }}
            />
          </div>
        )}
        <div className="flex gap-2">
          <button onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold border"
            style={{ border: "1px solid var(--border-subtle)", color: "var(--text-secondary)", background: "none" }}>
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={loading || (isBanning && !reason.trim())}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-40"
            style={{ backgroundColor: isBanning ? "#ef4444" : "var(--accent-indigo)", color: "#fff" }}>
            {loading ? <Loader2 size={13} className="animate-spin" /> : isBanning ? <ShieldOff size={13} /> : <Shield size={13} />}
            {loading ? "..." : isBanning ? "Ban" : "Unban"}
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

  const [player, setPlayer] = useState<AdminPlayerDetail | null>(null);
  const [activity, setActivity] = useState<AdminActivityRow[]>([]);
  const [actTotal, setActTotal] = useState(0);
  const [actPage, setActPage] = useState(1);
  const [actLoading, setActLoading] = useState(false);
  const [referrals, setReferrals] = useState<AdminReferralRow[]>([]);
  const [referredBy, setReferredBy] = useState<AdminPlayerDetail["referred_by"]>(null);
  const [notes, setNotes] = useState<AdminNote[]>([]);
  const [newNote, setNewNote] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [banModal, setBanModal] = useState(false);
  const [banning, setBanning] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      adminApi.getPlayerDetail(id),
      adminApi.getPlayerActivity(id, 1, 20),
      adminApi.getPlayerReferrals(id),
      adminApi.getPlayerNotes(id),
    ]).then(([detailRes, actRes, refRes, notesRes]) => {
      setPlayer(detailRes.player);
      setActivity(actRes.transactions ?? []);
      setActTotal(actRes.total ?? 0);
      setReferrals(refRes.referrals ?? []);
      setReferredBy(refRes.referred_by ?? null);
      setNotes(notesRes.notes ?? []);
    }).catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load player"))
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
    <div className="rounded-xl p-6 text-center border" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-card)" }}>
      <AlertCircle size={24} style={{ color: "#f87171", margin: "0 auto 8px" }} />
      <p className="text-sm" style={{ color: "#f87171" }}>{error || "Player not found"}</p>
    </div>
  );

  const stats = player.stats;
  const winRate = stats
    ? stats.win_rate
    : player.games_played > 0 ? Math.round((player.games_won / player.games_played) * 100) : 0;

  return (
    <div className="space-y-5 max-w-2xl">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.push("/admin/players")}
          className="p-2 rounded-lg border flex-shrink-0"
          style={{ borderColor: "var(--border-subtle)", color: "var(--text-secondary)" }}>
          <ArrowLeft size={16} />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-headline text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
              {maskPhone(player.phone)}
            </h1>
            <span className={`text-[9px] font-black px-2 py-0.5 rounded border ${
              player.status === "active"
                ? "bg-[#4C6FFF]/15 text-[#4C6FFF] border-[#4C6FFF]/30"
                : "bg-red-900/20 text-red-400 border-red-700/30"
            }`}>{player.status.toUpperCase()}</span>
          </div>
          {player.name && <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>{player.name}</p>}
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Joined {fmtShort(player.created_at)}</p>
        </div>
        {/* Ban button */}
        <button onClick={() => setBanModal(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border flex-shrink-0"
          style={player.status === "active"
            ? { backgroundColor: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.3)", color: "#f87171" }
            : { backgroundColor: "rgba(76,111,255,0.08)", borderColor: "rgba(76,111,255,0.3)", color: "var(--accent-indigo)" }}>
          {player.status === "active" ? <><ShieldOff size={12} /> Ban</> : <><Shield size={12} /> Unban</>}
        </button>
      </div>

      {/* ── Balance ── */}
      <Section title="Balance" icon={<span style={{ fontSize: 14 }}>₦</span>}>
        <div className="grid grid-cols-2 gap-3">
          <StatCell label="Real balance" value={`₦${player.balance.toLocaleString()}`} color="var(--accent-amber)" />
          <StatCell label="Bonus balance" value={`₦${(player.bonus_balance ?? 0).toLocaleString()}`} color="var(--accent-violet)" />
        </div>
        <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
          Total spendable: ₦{(player.balance + (player.bonus_balance ?? 0)).toLocaleString()} · Bonus credit is non-withdrawable
        </p>
      </Section>

      {/* ── Stats ── */}
      <Section title="Stats" icon={<BarChart2 size={14} style={{ color: "var(--accent-indigo)" }} />}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCell label="Played"    value={stats?.games_played ?? player.games_played} />
          <StatCell label="Won"       value={stats?.games_won ?? player.games_won} color="var(--accent-amber)" />
          <StatCell label="Win rate"  value={`${winRate}%`} color={winRate > 50 ? "var(--accent-amber)" : "var(--text-primary)"} />
          <StatCell label="Total won" value={`₦${(stats?.total_won ?? player.total_won).toLocaleString()}`} color="var(--accent-amber)" />
        </div>
        {stats?.total_spent !== undefined && (
          <div className="flex items-center justify-between rounded-lg px-3 py-2 border"
            style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border-hairline)" }}>
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>Total spent</span>
            <span className="text-sm font-mono font-bold" style={{ color: "var(--text-secondary)" }}>₦{stats.total_spent.toLocaleString()}</span>
          </div>
        )}
      </Section>

      {/* ── Activity ── */}
      <Section title="Activity" icon={<Activity size={14} style={{ color: "var(--accent-indigo)" }} />} defaultOpen={false}>
        {activity.length === 0 ? (
          <p className="text-sm text-center py-4" style={{ color: "var(--text-muted)" }}>No transactions yet</p>
        ) : (
          <>
            <div className="divide-y" style={{ borderColor: "var(--border-hairline)" }}>
              {activity.map((tx) => {
                const isCredit = tx.amount > 0;
                return (
                  <div key={tx.id} className="flex items-center gap-3 py-2.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate" style={{ color: "var(--text-primary)" }}>{tx.description}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>{fmtDate(tx.created_at)}</p>
                    </div>
                    <span className="font-mono font-bold text-sm flex-shrink-0"
                      style={{ color: isCredit ? "var(--accent-amber)" : "#f87171" }}>
                      {isCredit ? "+" : ""}₦{Math.abs(tx.amount).toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
            {activity.length < actTotal && (
              <button onClick={loadMoreActivity} disabled={actLoading}
                className="w-full py-2 text-xs font-bold rounded-lg border mt-1 disabled:opacity-40"
                style={{ borderColor: "var(--border-subtle)", color: "var(--text-secondary)", background: "none" }}>
                {actLoading ? <Loader2 size={13} className="animate-spin inline" /> : `Load more (${actTotal - activity.length} remaining)`}
              </button>
            )}
          </>
        )}
      </Section>

      {/* ── Referrals ── */}
      <Section title="Referrals" icon={<Users size={14} style={{ color: "var(--accent-indigo)" }} />} defaultOpen={false}>
        {referredBy && (
          <div className="rounded-lg px-3 py-2.5 border mb-3"
            style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border-hairline)" }}>
            <p className="text-[10px] uppercase tracking-widest font-bold mb-1" style={{ color: "var(--text-muted)" }}>Referred by</p>
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              {maskPhone(referredBy.phone)}{referredBy.name ? ` · ${referredBy.name}` : ""}
            </p>
          </div>
        )}
        {referrals.length === 0 ? (
          <p className="text-sm text-center py-3" style={{ color: "var(--text-muted)" }}>No referrals made</p>
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--border-hairline)" }}>
            {referrals.map((r) => (
              <div key={r.id} className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    {maskPhone(r.phone)}{r.name ? ` · ${r.name}` : ""}
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>{fmtShort(r.created_at)}</p>
                </div>
                <div className="text-right">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                    r.status === "completed" ? "bg-[#4C6FFF]/15 text-[#4C6FFF]" : "bg-gray-800 text-gray-500"
                  }`}>{r.status.toUpperCase()}</span>
                  {r.bonus_amount > 0 && (
                    <p className="text-xs font-mono font-bold mt-0.5" style={{ color: "var(--accent-amber)" }}>
                      +₦{r.bonus_amount.toLocaleString()}
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
        {/* Add note input */}
        <div className="flex gap-2">
          <input
            type="text" placeholder="Add a note..." value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !addingNote) handleAddNote(); }}
            className="flex-1 rounded-xl px-3 py-2.5 text-sm outline-none"
            style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)" }}
          />
          <button onClick={handleAddNote} disabled={!newNote.trim() || addingNote}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold border disabled:opacity-40"
            style={{ backgroundColor: "rgba(76,111,255,0.1)", borderColor: "rgba(76,111,255,0.25)", color: "var(--accent-indigo)" }}>
            {addingNote ? <Loader2 size={13} className="animate-spin" /> : <><Plus size={12} />Add</>}
          </button>
        </div>
        {/* Existing notes */}
        {notes.length === 0 ? (
          <p className="text-sm text-center py-3" style={{ color: "var(--text-muted)" }}>No notes yet</p>
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--border-hairline)" }}>
            {notes.map((n) => (
              <div key={n.id} className="py-2.5">
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>{n.content}</p>
                <p className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>
                  {fmtDate(n.created_at)}{n.created_by ? ` · ${n.created_by}` : ""}
                </p>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* ── Ban history ── */}
      {player.ban_history && player.ban_history.length > 0 && (
        <Section title="Ban history" icon={<ShieldOff size={14} style={{ color: "#f87171" }} />} defaultOpen={false}>
          <div className="divide-y" style={{ borderColor: "var(--border-hairline)" }}>
            {player.ban_history.map((b, i) => (
              <div key={i} className="py-2.5">
                <p className="text-sm" style={{ color: "var(--text-primary)" }}>{b.reason}</p>
                <p className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>
                  {fmtDate(b.banned_at)}{b.banned_by ? ` · ${b.banned_by}` : ""}
                </p>
              </div>
            ))}
          </div>
          {player.ban_reason && (
            <div className="rounded-lg px-3 py-2 border"
              style={{ backgroundColor: "rgba(239,68,68,0.05)", borderColor: "rgba(239,68,68,0.2)" }}>
              <p className="text-[10px] uppercase tracking-widest font-bold mb-1" style={{ color: "var(--text-muted)" }}>Current ban reason</p>
              <p className="text-sm" style={{ color: "#f87171" }}>{player.ban_reason}</p>
            </div>
          )}
        </Section>
      )}

      {/* Ban modal */}
      {banModal && (
        <BanModal
          player={player}
          onConfirm={handleBan}
          onCancel={() => setBanModal(false)}
          loading={banning}
        />
      )}
    </div>
  );
}
