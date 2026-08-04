"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { adminBtaApi, ApiError, type BtaQueueEntry, type BtaMove, type BtaWinner, type BtaStatus } from "@/lib/api";
import { Loader2, Swords, CheckCircle2, XCircle, Clock, RefreshCw, Trophy, Minus } from "lucide-react";

const POLL_MS = 5000;
const MOVES: { value: BtaMove; emoji: string; label: string }[] = [
  { value: "rock",     emoji: "✊", label: "Rock"     },
  { value: "paper",    emoji: "✋", label: "Paper"    },
  { value: "scissors", emoji: "✌️", label: "Scissors" },
];

function fmtNaira(n: number) { return `₦${n.toLocaleString()}`; }
function fmtCountdown(secs: number) {
  if (secs <= 0) return "0:00";
  return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;
}
function maskPhone(ph: string) {
  return ph && ph.length >= 8 ? `${ph.slice(0, 4)}***${ph.slice(-4)}` : ph ?? "—";
}

// ── Availability toggle ───────────────────────────────────────────────────────
function AvailabilityToggle({ status, onToggled }: {
  status: BtaStatus | null;
  onToggled: (next: boolean) => void;
}) {
  const [toggling, setToggling] = useState(false);
  const [localAvail, setLocalAvail] = useState<boolean | null>(null);
  const available = localAvail ?? status?.is_available ?? false;

  const handleToggle = async () => {
    if (toggling || status === null) return;
    const next = !available;
    setLocalAvail(next);
    setToggling(true);
    try {
      const res = await adminBtaApi.updateSettings({ is_available: next });
      setLocalAvail(res.is_available);
      onToggled(res.is_available);
    } catch {
      setLocalAvail(!next); // revert
    } finally {
      setToggling(false);
    }
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div>
        <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Feature available</p>
        <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "1px 0 0" }}>
          {available ? "Players can send challenges" : "Hidden from players"}
        </p>
      </div>
      <button onClick={handleToggle} disabled={toggling || status === null}
        style={{ width: 44, height: 24, borderRadius: 12, border: "none", cursor: toggling ? "not-allowed" : "pointer",
          backgroundColor: available ? "var(--accent-indigo)" : "var(--border-subtle)",
          position: "relative", flexShrink: 0, opacity: toggling ? 0.6 : 1, transition: "background-color 0.2s" }}>
        <span style={{ position: "absolute", top: 4, width: 16, height: 16, borderRadius: "50%",
          backgroundColor: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
          left: available ? 24 : 4, transition: "left 0.2s" }} />
      </button>
    </div>
  );
}

// ── Stake range editor ────────────────────────────────────────────────────────
function StakeRangeEditor({ status }: { status: BtaStatus | null }) {
  const [min, setMin] = useState<number | "">(status?.min_stake ?? "");
  const [max, setMax] = useState<number | "">(status?.max_stake ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (status) { setMin(status.min_stake); setMax(status.max_stake); }
  }, [status]);

  const handleSave = async () => {
    if (!min || !max || Number(min) >= Number(max)) { setErr("Min must be less than max"); return; }
    setSaving(true); setErr("");
    try {
      await adminBtaApi.updateSettings({
        is_available: status?.is_available ?? false,
        min_stake: Number(min), max_stake: Number(max),
      });
      setSaved(true); setTimeout(() => setSaved(false), 2000);
    } catch (e) { setErr(e instanceof ApiError ? e.message : "Save failed"); }
    finally { setSaving(false); }
  };

  const inp: React.CSSProperties = { padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border-subtle)",
    backgroundColor: "var(--bg-base)", color: "var(--text-primary)", fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", margin: 0 }}>Stake Range (₦)</p>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 9, color: "var(--text-muted)", display: "block", marginBottom: 3 }}>Min</label>
          <input type="number" value={min} onChange={e => setMin(e.target.value === "" ? "" : Number(e.target.value))} style={inp} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 9, color: "var(--text-muted)", display: "block", marginBottom: 3 }}>Max</label>
          <input type="number" value={max} onChange={e => setMax(e.target.value === "" ? "" : Number(e.target.value))} style={inp} />
        </div>
        <button onClick={handleSave} disabled={saving}
          style={{ marginTop: 16, padding: "8px 14px", borderRadius: 8, border: "none", fontSize: 12, fontWeight: 700,
            backgroundColor: "var(--accent-indigo)", color: "#fff", cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.6 : 1, flexShrink: 0, display: "flex", alignItems: "center", gap: 4 }}>
          {saving ? <Loader2 size={12} className="animate-spin" /> : null}
          {saved ? "Saved!" : "Save"}
        </button>
      </div>
      {err && <p style={{ fontSize: 11, color: "#f87171", margin: 0 }}>{err}</p>}
    </div>
  );
}

// ── Request row ───────────────────────────────────────────────────────────────
function RequestRow({ req, onApprove, onReject, acting }: {
  req: BtaQueueEntry;
  onApprove: (id: string) => void;
  onReject:  (id: string) => void;
  acting: string | null; // request_id currently being actioned
}) {
  const isPending = req.status === "pending";
  const isApproved = req.status === "approved";
  const isActing = acting === req.id;

  return (
    <div style={{ borderRadius: 12, padding: "12px 14px", backgroundColor: "var(--bg-card)",
      border: `1px solid ${isApproved ? "rgba(76,111,255,0.3)" : "var(--border-hairline)"}`,
      display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
            <span style={{ fontSize: 12, fontWeight: 700, fontFamily: "monospace",
              color: "var(--accent-amber)" }}>{fmtNaira(req.stake)}</span>
            <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 4, fontWeight: 700,
              backgroundColor: isApproved ? "rgba(76,111,255,0.12)" : "rgba(255,255,255,0.05)",
              color: isApproved ? "var(--accent-indigo)" : "var(--text-muted)" }}>
              {req.status}
            </span>
            <span style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {req.game_type}
            </span>
          </div>
          <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>
            {maskPhone(req.player_phone)} ·{" "}
            <span style={{ color: req.time_remaining_seconds < 30 ? "#f87171" : "var(--text-secondary)" }}>
              {fmtCountdown(req.time_remaining_seconds)} left
            </span>
          </p>
        </div>
        {isPending && (
          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            <button onClick={() => onApprove(req.id)} disabled={!!acting}
              style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 8,
                fontSize: 11, fontWeight: 700, border: "none", cursor: acting ? "not-allowed" : "pointer",
                backgroundColor: "rgba(76,111,255,0.12)", color: "var(--accent-indigo)", opacity: acting ? 0.5 : 1 }}>
              {isActing ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle2 size={11} />}
              Approve
            </button>
            <button onClick={() => onReject(req.id)} disabled={!!acting}
              style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 8,
                fontSize: 11, fontWeight: 700, border: "none", cursor: acting ? "not-allowed" : "pointer",
                backgroundColor: "rgba(239,68,68,0.08)", color: "#f87171", opacity: acting ? 0.5 : 1 }}>
              <XCircle size={11} /> Reject
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Active match panel ────────────────────────────────────────────────────────
function ActiveMatchPanel({ req, onMoveSubmitted }: {
  req: BtaQueueEntry;
  onMoveSubmitted: () => void;
}) {
  const [selectedMove, setSelectedMove] = useState<BtaMove | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ winner: BtaWinner; admin_move: BtaMove; player_move: BtaMove; payout: number } | null>(null);
  const [err, setErr] = useState("");
  const matchId = req.match?.status === "in_progress" ? req.id : null;
  const playerAlreadyMoved = req.match?.player_move !== null;
  const adminAlreadyMoved = req.match?.admin_move !== null;

  const handleSubmit = async () => {
    if (!selectedMove || !matchId) return;
    setSubmitting(true); setErr("");
    try {
      const res = await adminBtaApi.submitMove(matchId, selectedMove);
      setResult(res);
      setTimeout(onMoveSubmitted, 2500);
    } catch (e) { setErr(e instanceof ApiError ? e.message : "Failed to submit move"); }
    finally { setSubmitting(false); }
  };

  return (
    <div style={{ borderRadius: 14, padding: "16px", border: "2px solid rgba(76,111,255,0.3)",
      backgroundColor: "rgba(76,111,255,0.04)", display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <p style={{ fontSize: 13, fontWeight: 800, color: "var(--accent-indigo)", margin: "0 0 3px" }}>
          Match in progress
        </p>
        <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>
          {maskPhone(req.player_phone)} · stake {fmtNaira(req.stake)}
          {playerAlreadyMoved ? " · player has moved" : " · waiting for player"}
        </p>
      </div>

      {result ? (
        <div style={{ textAlign: "center", padding: "8px 0" }}>
          {result.winner === "player"
            ? <XCircle size={32} style={{ color: "#f87171", margin: "0 auto 6px" }} />
            : result.winner === "draw"
            ? <Minus size={32} style={{ color: "var(--accent-indigo)", margin: "0 auto 6px" }} />
            : <Trophy size={32} style={{ color: "var(--accent-amber)", margin: "0 auto 6px" }} />}
          <p style={{ fontSize: 15, fontWeight: 800, color: "var(--text-primary)", margin: "0 0 4px" }}>
            {result.winner === "player" ? "Player wins" : result.winner === "draw" ? "Draw" : "Admin wins"}
          </p>
          <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>
            {MOVES.find(m => m.value === result.admin_move)?.emoji} vs {MOVES.find(m => m.value === result.player_move)?.emoji}
            {result.payout > 0 && ` · payout ${fmtNaira(result.payout)}`}
          </p>
        </div>
      ) : adminAlreadyMoved ? (
        <p style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center" }}>
          You played {MOVES.find(m => m.value === req.match?.admin_move)?.emoji} — waiting for player…
        </p>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {MOVES.map(({ value, emoji, label }) => (
              <button key={value} onClick={() => setSelectedMove(value)} disabled={submitting}
                style={{ padding: "14px 6px", borderRadius: 12, border: "2px solid", cursor: "pointer",
                  borderColor: selectedMove === value ? "var(--accent-indigo)" : "var(--border-hairline)",
                  backgroundColor: selectedMove === value ? "rgba(76,111,255,0.12)" : "var(--bg-base)",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 4, transition: "all 0.12s" }}>
                <span style={{ fontSize: 28 }}>{emoji}</span>
                <span style={{ fontSize: 10, fontWeight: 700,
                  color: selectedMove === value ? "var(--accent-indigo)" : "var(--text-muted)" }}>{label}</span>
              </button>
            ))}
          </div>
          {err && <p style={{ fontSize: 11, color: "#f87171", margin: 0 }}>{err}</p>}
          <button onClick={handleSubmit} disabled={!selectedMove || submitting}
            style={{ width: "100%", padding: "12px 0", borderRadius: 10, border: "none", fontWeight: 800,
              fontSize: 13, backgroundColor: "var(--accent-indigo)", color: "#fff",
              cursor: !selectedMove || submitting ? "not-allowed" : "pointer",
              opacity: !selectedMove || submitting ? 0.45 : 1,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            {submitting && <Loader2 size={14} className="animate-spin" />}
            {submitting ? "Submitting…" : "Play Move"}
          </button>
        </>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminBeatTheAdminPage() {
  const [status, setStatus]   = useState<BtaStatus | null>(null);
  const [queue, setQueue]     = useState<BtaQueueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [acting, setActing]   = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      const [statusRes, queueRes] = await Promise.allSettled([
        adminBtaApi.getStatus(),
        adminBtaApi.getQueue(),
      ]);
      if (statusRes.status === "fulfilled") setStatus(statusRes.value);
      if (queueRes.status === "fulfilled")  setQueue(queueRes.value?.requests ?? []);
      if (statusRes.status === "rejected" && queueRes.status === "rejected") {
        setError("Failed to load — check admin session");
      }
    } catch { /* silent on poll */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchAll();
    pollRef.current = setInterval(fetchAll, POLL_MS);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchAll]);

  const handleApprove = async (id: string) => {
    setActing(id);
    try {
      await adminBtaApi.approveRequest(id);
      await fetchAll();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Approve failed");
    } finally { setActing(null); }
  };

  const handleReject = async (id: string) => {
    setActing(id);
    try {
      await adminBtaApi.rejectRequest(id);
      setQueue((q) => q.filter((r) => r.id !== id));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Reject failed");
    } finally { setActing(null); }
  };

  const pending  = queue.filter((r) => r.status === "pending");
  const approved = queue.filter((r) => r.status === "approved");

  return (
    <div className="space-y-6 max-w-2xl pb-16">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Swords size={18} style={{ color: "var(--accent-indigo)" }} />
            <h1 className="text-2xl font-black text-white">Beat the Admin</h1>
          </div>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
            Rock · Paper · Scissors — manage requests and play matches
          </p>
        </div>
        <button onClick={fetchAll} title="Refresh"
          style={{ padding: "6px 8px", borderRadius: 8, border: "1px solid var(--border-subtle)",
            backgroundColor: "transparent", cursor: "pointer", color: "var(--text-muted)", display: "flex", alignItems: "center" }}>
          <RefreshCw size={14} />
        </button>
      </div>

      {error && (
        <div style={{ borderRadius: 10, padding: "10px 14px", backgroundColor: "rgba(239,68,68,0.06)",
          border: "1px solid rgba(239,68,68,0.2)", fontSize: 13, color: "#f87171",
          display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>{error}</span>
          <button onClick={() => setError("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#f87171", fontSize: 12, fontWeight: 700 }}>✕</button>
        </div>
      )}

      {/* ── Settings card ── */}
      <div style={{ borderRadius: 14, padding: "16px", backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border-hairline)", display: "flex", flexDirection: "column", gap: 16 }}>
        <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.09em",
          color: "var(--text-muted)", margin: 0 }}>Settings</p>
        {loading && !status ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Loader2 size={14} className="animate-spin" style={{ color: "var(--text-muted)" }} />
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Loading…</span>
          </div>
        ) : (
          <>
            <AvailabilityToggle status={status} onToggled={(v) => setStatus((s) => s ? { ...s, is_available: v } : s)} />
            <div style={{ borderTop: "1px solid var(--border-hairline)", paddingTop: 14 }}>
              <StakeRangeEditor status={status} />
            </div>
          </>
        )}
      </div>

      {/* ── Pending requests ── */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.09em", color: "var(--text-muted)", margin: 0 }}>
            Pending Requests
          </p>
          {pending.length > 0 && (
            <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
              backgroundColor: "rgba(232,163,61,0.15)", color: "var(--accent-amber)" }}>
              {pending.length} waiting
            </span>
          )}
        </div>
        {loading ? (
          <div style={{ borderRadius: 12, padding: "20px", backgroundColor: "var(--bg-card)", border: "1px solid var(--border-hairline)", textAlign: "center" }}>
            <Loader2 size={20} className="animate-spin" style={{ color: "var(--accent-indigo)", margin: "0 auto" }} />
          </div>
        ) : pending.length === 0 ? (
          <div style={{ borderRadius: 12, padding: "20px 16px", backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border-hairline)", textAlign: "center" }}>
            <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>No pending requests right now</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <AnimatePresence>
              {pending.map((req) => (
                <motion.div key={req.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <RequestRow req={req} onApprove={handleApprove} onReject={handleReject} acting={acting} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ── Active matches ── */}
      {approved.length > 0 && (
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.09em",
            color: "var(--text-muted)", marginBottom: 10 }}>Active Match</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {approved.map((req) => (
              <ActiveMatchPanel key={req.id} req={req} onMoveSubmitted={fetchAll} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
