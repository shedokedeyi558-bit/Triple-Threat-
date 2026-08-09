"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  adminBtaApi, ApiError,
  type BtaQueueEntry, type BtaStatus,
} from "@/lib/api";
import { LudoMatch } from "@/components/ludo/LudoMatch";
import { Loader2, Swords, CheckCircle2, XCircle, RefreshCw } from "lucide-react";

const POLL_MS = 3000;

function fmtNaira(n: number) { return `₦${n.toLocaleString()}`; }
function fmtCountdown(secs: number) {
  if (secs <= 0) return "0:00";
  return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;
}
function maskPhone(ph: string) {
  return ph && ph.length >= 8 ? `${ph.slice(0, 4)}***${ph.slice(-4)}` : ph ?? "—";
}

// ── Availability toggle ────────────────────────────────────────────────────────
function AvailabilityToggle({ status, onToggled }: { status: BtaStatus | null; onToggled: (next: boolean) => void }) {
  const [toggling, setToggling] = useState(false);
  const [toggleErr, setToggleErr] = useState("");
  const available = status?.is_available ?? false;

  const handleToggle = async () => {
    if (toggling || status === null) return;
    const next = !available;
    console.log(`[BTA toggle] clicking: current available=${available}, sending next=${next}`);
    setToggling(true); setToggleErr("");
    try {
      const res = await adminBtaApi.updateSettings({ is_available: next, min_stake: status.min_stake, max_stake: status.max_stake });
      console.log(`[BTA toggle] PUT confirmed: is_available=${res.is_available}`);
      if (res.is_available !== next) setToggleErr(`Backend returned ${res.is_available} — change may not have saved`);
      onToggled(res.is_available);
    } catch (e) {
      console.error("[BTA toggle] PUT failed:", e);
      setToggleErr(e instanceof ApiError ? e.message : "Failed to update — try again");
    } finally { setToggling(false); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Feature available</p>
          <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "1px 0 0" }}>{available ? "Players can send challenges" : "Hidden from players"}</p>
        </div>
        <button onClick={handleToggle} disabled={toggling || status === null}
          style={{ width: 44, height: 24, borderRadius: 12, border: "none", cursor: toggling ? "not-allowed" : "pointer",
            backgroundColor: available ? "var(--accent-indigo)" : "var(--border-subtle)",
            position: "relative", flexShrink: 0, opacity: toggling ? 0.6 : 1, transition: "background-color 0.2s" }}>
          {toggling
            ? <Loader2 size={10} className="animate-spin" style={{ position: "absolute", top: 7, left: 17, color: "#fff" }} />
            : <span style={{ position: "absolute", top: 4, width: 16, height: 16, borderRadius: "50%",
                backgroundColor: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                left: available ? 24 : 4, transition: "left 0.2s" }} />}
        </button>
      </div>
      {toggleErr && <p style={{ fontSize: 11, color: "#f87171", margin: 0 }}>{toggleErr}</p>}
    </div>
  );
}

// ── Stake range editor ─────────────────────────────────────────────────────────
function StakeRangeEditor({ status, isAvailableRef }: {
  status: BtaStatus | null; isAvailableRef: React.MutableRefObject<boolean>;
}) {
  const [min, setMin] = useState<number | "">(status?.min_stake ?? "");
  const [max, setMax] = useState<number | "">(status?.max_stake ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState("");
  useEffect(() => { if (status) { setMin(status.min_stake); setMax(status.max_stake); } }, [status]);
  const handleSave = async () => {
    if (!min || !max || Number(min) >= Number(max)) { setErr("Min must be less than max"); return; }
    setSaving(true); setErr("");
    try {
      await adminBtaApi.updateSettings({ is_available: isAvailableRef.current, min_stake: Number(min), max_stake: Number(max) });
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

// ── Request row ────────────────────────────────────────────────────────────────
function RequestRow({ req, onApprove, onReject, acting }: {
  req: BtaQueueEntry; onApprove: (id: string) => void; onReject: (id: string) => void; acting: string | null;
}) {
  const isActing = acting === req.id;
  return (
    <div style={{ borderRadius: 12, padding: "12px 14px", backgroundColor: "var(--bg-card)",
      border: "1px solid var(--border-hairline)", display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
            <span style={{ fontSize: 12, fontWeight: 700, fontFamily: "monospace", color: "var(--accent-amber)" }}>{fmtNaira(req.stake)}</span>
            <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 4, fontWeight: 700,
              backgroundColor: "rgba(255,255,255,0.05)", color: "var(--text-muted)" }}>{req.status}</span>
            <span style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase" }}>{req.game_type}</span>
          </div>
          <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>
            {maskPhone(req.player_phone)} · <span style={{ color: req.time_remaining_seconds < 30 ? "#f87171" : "var(--text-secondary)" }}>
              {fmtCountdown(req.time_remaining_seconds)} left
            </span>
          </p>
        </div>
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          <button onClick={() => onApprove(req.id)} disabled={!!acting}
            style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 8, fontSize: 11, fontWeight: 700, border: "none",
              cursor: acting ? "not-allowed" : "pointer", backgroundColor: "rgba(76,111,255,0.12)", color: "var(--accent-indigo)", opacity: acting ? 0.5 : 1 }}>
            {isActing ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle2 size={11} />} Approve
          </button>
          <button onClick={() => onReject(req.id)} disabled={!!acting}
            style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 8, fontSize: 11, fontWeight: 700, border: "none",
              cursor: acting ? "not-allowed" : "pointer", backgroundColor: "rgba(239,68,68,0.08)", color: "#f87171", opacity: acting ? 0.5 : 1 }}>
            <XCircle size={11} /> Reject
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function AdminBeatTheAdminPage() {
  const [status, setStatus]       = useState<BtaStatus | null>(null);
  const [queue, setQueue]         = useState<BtaQueueEntry[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]         = useState("");
  const [acting, setActing]       = useState<string | null>(null);
  const [activeMatch, setActiveMatch] = useState<{
    matchId: string; stake: number; playerPhone: string;
  } | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isAvailableRef = useRef<boolean>(false);

  const fetchAll = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    setError("");
    try {
      const [statusRes, queueRes] = await Promise.allSettled([
        adminBtaApi.getStatus(),
        adminBtaApi.getQueue(),
      ]);
      if (statusRes.status === "fulfilled") {
        console.log("[BTA state] ref updated to:", statusRes.value.is_available, "— source: poll");
        setStatus(statusRes.value);
        isAvailableRef.current = statusRes.value.is_available;
      } else {
        const reason = statusRes.reason;
        const msg = reason instanceof ApiError ? `${reason.message} (status ${reason.status})` : String(reason);
        console.error("[BTA poll] GET settings failed:", msg);
        if (loading || isManual) {
          setError("Could not load settings — " + (reason instanceof ApiError ? reason.message : "check admin session"));
        }
      }
      if (queueRes.status === "fulfilled") {
        setQueue(queueRes.value?.requests ?? []);
      } else if (isManual) {
        const reason = queueRes.reason;
        setError((prev) => prev || "Could not load queue — " + (reason instanceof ApiError ? reason.message : "check admin session"));
      }
    } catch { /* silent on background poll */ }
    finally { setLoading(false); if (isManual) setRefreshing(false); }
  }, []); // eslint-disable-line

  useEffect(() => {
    // On mount: check for an active match first.
    // If one exists, go straight to the match view without loading the queue.
    // If not, proceed with the normal settings + queue load.
    const boot = async () => {
      try {
        const res = await adminBtaApi.getActiveMatch();
        if (res.active_match) {
          setActiveMatch({
            matchId: res.active_match.match_id,
            stake: res.active_match.stake,
            playerPhone: res.active_match.player_phone,
          });
          setLoading(false);
          // Still load settings in background so toggle/stake range work if admin navigates away
          adminBtaApi.getStatus().then((s) => {
            setStatus(s);
            isAvailableRef.current = s.is_available;
          }).catch(() => { /* silent */ });
          return; // skip fetchAll — match view takes over
        }
      } catch { /* no active match endpoint or failed — fall through to normal load */ }
      fetchAll();
    };
    boot();
    pollRef.current = setInterval(() => fetchAll(), POLL_MS);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchAll]); // eslint-disable-line

  const handleApprove = async (id: string) => {
    setActing(id);
    try {
      const approvedReq = queue.find(r => r.id === id);
      const res = await adminBtaApi.approveRequest(id);
      setActiveMatch({
        matchId: res.match_id,
        stake: approvedReq?.stake ?? 0,
        playerPhone: approvedReq?.player_phone ?? "",
      });
      await fetchAll();
    } catch (e) { setError(e instanceof ApiError ? e.message : "Approve failed"); }
    finally { setActing(null); }
  };

  const handleReject = async (id: string) => {
    setActing(id);
    try { await adminBtaApi.rejectRequest(id); setQueue((q) => q.filter((r) => r.id !== id)); }
    catch (e) { setError(e instanceof ApiError ? e.message : "Reject failed"); }
    finally { setActing(null); }
  };

  const pending = queue.filter((r) => r.status === "pending");

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
            Ludo — manage requests and play matches
          </p>
        </div>
        <button onClick={() => fetchAll(true)} title="Refresh" disabled={refreshing}
          style={{ padding: "6px 8px", borderRadius: 8, border: "1px solid var(--border-subtle)",
            backgroundColor: "transparent", cursor: refreshing ? "not-allowed" : "pointer",
            color: "var(--text-muted)", display: "flex", alignItems: "center", opacity: refreshing ? 0.6 : 1 }}>
          {refreshing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
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

      {/* Settings card */}
      <div style={{ borderRadius: 14, padding: "16px", backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border-hairline)", display: "flex", flexDirection: "column", gap: 16 }}>
        <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.09em", color: "var(--text-muted)", margin: 0 }}>Settings</p>
        {loading && !status ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Loader2 size={14} className="animate-spin" style={{ color: "var(--text-muted)" }} />
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Loading…</span>
          </div>
        ) : (
          <>
            <AvailabilityToggle status={status} onToggled={(v) => {
              isAvailableRef.current = v;
              setStatus((s) => s ? { ...s, is_available: v } : s);
            }} />
            <div style={{ borderTop: "1px solid var(--border-hairline)", paddingTop: 14 }}>
              <StakeRangeEditor status={status} isAvailableRef={isAvailableRef} />
            </div>
          </>
        )}
      </div>

      {/* Pending requests */}
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
          <div style={{ borderRadius: 12, padding: "20px", backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border-hairline)", textAlign: "center" }}>
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

      {/* Active Ludo match — shown after admin approves */}
      {activeMatch && (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.09em", color: "var(--text-muted)", margin: 0 }}>
              Active Match
            </p>
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
              {maskPhone(activeMatch.playerPhone)} · {fmtNaira(activeMatch.stake)}
            </span>
          </div>
          <div style={{ borderRadius: 14, padding: "16px", border: "2px solid rgba(76,111,255,0.25)",
            backgroundColor: "rgba(76,111,255,0.03)" }}>
            <LudoMatch
              matchId={activeMatch.matchId}
              myRole="admin"
              stake={activeMatch.stake}
              rollDice={adminBtaApi.rollDice}
              movePiece={adminBtaApi.movePiece}
              getMatchState={adminBtaApi.getMatchState}
              onMatchComplete={() => {
                setActiveMatch(null);
                fetchAll();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
