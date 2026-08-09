"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  adminBtaApi, ApiError,
  type BtaQueueEntry, type BtaMove, type BtaWinner, type BtaRoundResult,
  type BtaStatus, type BtaAdminMoveResponse, type BtaAdminMatchDetail,
} from "@/lib/api";
import { Loader2, Swords, CheckCircle2, XCircle, Clock, RefreshCw, Trophy, Minus, RotateCcw, List } from "lucide-react";

const POLL_MS = 3000;
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

// ── Scoreboard ─────────────────────────────────────────────────────────────────
function Scoreboard({ playerWins, adminWins, currentRound, numRounds }: {
  playerWins: number; adminWins: number; currentRound: number; numRounds: number;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center",
      borderRadius: 10, overflow: "hidden", border: "1px solid var(--border-hairline)",
      backgroundColor: "var(--bg-base)" }}>
      <div style={{ flex: 1, textAlign: "center", padding: "8px 6px", borderRight: "1px solid var(--border-hairline)" }}>
        <p style={{ fontSize: 18, fontWeight: 900, color: "var(--accent-indigo)", margin: 0, lineHeight: 1 }}>{playerWins}</p>
        <p style={{ fontSize: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-muted)", margin: "2px 0 0" }}>Player</p>
      </div>
      <div style={{ flex: 1, textAlign: "center", padding: "8px 6px", borderRight: "1px solid var(--border-hairline)" }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", margin: 0, lineHeight: 1 }}>
          R{currentRound}<span style={{ color: "var(--text-muted)", fontWeight: 500 }}>/{numRounds}</span>
        </p>
        <p style={{ fontSize: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-muted)", margin: "2px 0 0" }}>Best of {numRounds}</p>
      </div>
      <div style={{ flex: 1, textAlign: "center", padding: "8px 6px" }}>
        <p style={{ fontSize: 18, fontWeight: 900, color: "var(--accent-amber)", margin: 0, lineHeight: 1 }}>{adminWins}</p>
        <p style={{ fontSize: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-muted)", margin: "2px 0 0" }}>Admin</p>
      </div>
    </div>
  );
}

// ── Availability toggle ────────────────────────────────────────────────────────
// Single source of truth: `status.is_available` from the parent.
// The parent (AdminBeatTheAdminPage) holds `status` state and updates it from
// BOTH the poll (fetchAll → getStatus) and the toggle click (onToggled callback).
// Both update paths use the same adminBtaApi parsing (res.settings.is_available).
// This component has NO local availability state — it only reads from props.
function AvailabilityToggle({ status, onToggled }: { status: BtaStatus | null; onToggled: (next: boolean) => void }) {
  const [toggling, setToggling] = useState(false);
  const [toggleErr, setToggleErr] = useState("");

  // available is read directly from the single source of truth — no local copy
  const available = status?.is_available ?? false;

  const handleToggle = async () => {
    if (toggling || status === null) return;
    // next is derived from the prop value at click time — always current
    const next = !available;
    console.log(`[BTA toggle] clicking: current available=${available}, sending next=${next}`);
    setToggling(true);
    setToggleErr("");
    try {
      const res = await adminBtaApi.updateSettings({
        is_available: next,
        min_stake: status.min_stake,
        max_stake: status.max_stake,
      });
      // res.is_available is now always the correctly-parsed value from res.settings.is_available
      // (parsing happens in api.ts, same path as getStatus)
      console.log(`[BTA toggle] PUT confirmed: is_available=${res.is_available}`);
      if (res.is_available !== next) {
        setToggleErr(`Backend returned ${res.is_available} — change may not have saved`);
      }
      // Update parent's single status state — this is the ONLY place status changes from a toggle
      onToggled(res.is_available);
    } catch (e) {
      console.error("[BTA toggle] PUT failed:", e);
      setToggleErr(e instanceof ApiError ? e.message : "Failed to update — try again");
    } finally {
      setToggling(false);
    }
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
// isAvailableRef: a ref so handleSave always reads the LIVE toggle state, not a
// stale prop snapshot. Without this, saving stake range after toggling would
// silently revert the toggle because status.is_available hadn't propagated yet.
function StakeRangeEditor({ status, isAvailableRef }: {
  status: BtaStatus | null;
  isAvailableRef: React.MutableRefObject<boolean>;
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
      // Read live is_available from ref — never from stale status prop
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
            <span style={{ fontSize: 12, fontWeight: 700, fontFamily: "monospace", color: "var(--accent-amber)" }}>{fmtNaira(req.stake)}</span>
            <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 4, fontWeight: 700,
              backgroundColor: isApproved ? "rgba(76,111,255,0.12)" : "rgba(255,255,255,0.05)",
              color: isApproved ? "var(--accent-indigo)" : "var(--text-muted)" }}>{req.status}</span>
            <span style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{req.game_type}</span>
          </div>
          <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>
            {maskPhone(req.player_phone)} · <span style={{ color: req.time_remaining_seconds < 30 ? "#f87171" : "var(--text-secondary)" }}>{fmtCountdown(req.time_remaining_seconds)} left</span>
          </p>
        </div>
        {isPending && (
          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            <button onClick={() => onApprove(req.id)} disabled={!!acting}
              style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 8, fontSize: 11, fontWeight: 700, border: "none", cursor: acting ? "not-allowed" : "pointer",
                backgroundColor: "rgba(76,111,255,0.12)", color: "var(--accent-indigo)", opacity: acting ? 0.5 : 1 }}>
              {isActing ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle2 size={11} />} Approve
            </button>
            <button onClick={() => onReject(req.id)} disabled={!!acting}
              style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 8, fontSize: 11, fontWeight: 700, border: "none", cursor: acting ? "not-allowed" : "pointer",
                backgroundColor: "rgba(239,68,68,0.08)", color: "#f87171", opacity: acting ? 0.5 : 1 }}>
              <XCircle size={11} /> Reject
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Round history panel ────────────────────────────────────────────────────────
function RoundHistoryPanel({ matchId, onClose }: { matchId: string; onClose: () => void }) {
  const [detail, setDetail] = useState<BtaAdminMatchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    adminBtaApi.getMatchDetail(matchId)
      .then(setDetail)
      .catch(e => setErr(e instanceof ApiError ? e.message : "Failed to load match detail"))
      .finally(() => setLoading(false));
  }, [matchId]);

  const resultColor = (r: BtaRoundResult) =>
    r === "admin" ? "var(--accent-amber)" : r === "player" ? "var(--accent-indigo)" : r === "draw" ? "var(--text-muted)" : "var(--text-muted)";

  return (
    <div style={{ borderRadius: 14, padding: "16px", border: "1px solid var(--border-hairline)",
      backgroundColor: "var(--bg-card)", display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <p style={{ fontSize: 13, fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>Round History</p>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: 16, lineHeight: 1 }}>✕</button>
      </div>
      {loading && <div style={{ display: "flex", justifyContent: "center", padding: "16px 0" }}><Loader2 size={18} className="animate-spin" style={{ color: "var(--accent-indigo)" }} /></div>}
      {err && <p style={{ fontSize: 12, color: "#f87171", margin: 0 }}>{err}</p>}
      {detail && (
        <>
          <div style={{ display: "flex", gap: 12, fontSize: 11, color: "var(--text-muted)" }}>
            <span>Best of {detail.num_rounds}</span>
            <span>Player {detail.player_round_wins} — Admin {detail.admin_round_wins}</span>
            {detail.match_resolved && (
              <span style={{ fontWeight: 700, color: detail.match_winner === "admin" ? "var(--accent-amber)" : detail.match_winner === "player" ? "var(--accent-indigo)" : "var(--text-muted)" }}>
                {detail.match_winner === "admin" ? "Admin wins" : detail.match_winner === "player" ? "Player wins" : "Draw"}
              </span>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {detail.rounds.map((r) => {
              const pEmoji = MOVES.find(m => m.value === r.player_move)?.emoji ?? "?";
              const aEmoji = MOVES.find(m => m.value === r.admin_move)?.emoji ?? "?";
              return (
                <div key={r.round_number} style={{ display: "flex", alignItems: "center", gap: 10,
                  padding: "8px 10px", borderRadius: 8, backgroundColor: "var(--bg-base)",
                  border: "1px solid var(--border-hairline)" }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", width: 16 }}>R{r.round_number}</span>
                  <span style={{ fontSize: 14 }}>{pEmoji}</span>
                  <span style={{ fontSize: 10, color: "var(--text-muted)" }}>vs</span>
                  <span style={{ fontSize: 14 }}>{aEmoji}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, marginLeft: "auto", color: resultColor(r.round_result) }}>
                    {r.round_result === "admin" ? "Admin" : r.round_result === "player" ? "Player" : r.round_result === "draw" ? "Draw" : "—"}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ── Active match panel ─────────────────────────────────────────────────────────
function ActiveMatchPanel({ req, onMoveSubmitted }: { req: BtaQueueEntry; onMoveSubmitted: () => void }) {
  const [selectedMove, setSelectedMove] = useState<BtaMove | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [roundResult, setRoundResult] = useState<BtaAdminMoveResponse | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [err, setErr] = useState("");

  // Local score tracking — seeded from queue entry and updated after each move
  const [score, setScore] = useState({
    numRounds: req.num_rounds ?? 1,
    currentRound: req.current_round ?? 1,
    playerWins: req.player_round_wins ?? 0,
    adminWins: req.admin_round_wins ?? 0,
  });

  // When queue entry updates with new scoreboard fields, sync (but don't stomp local move response state)
  useEffect(() => {
    if (!roundResult) {
      setScore({
        numRounds: req.num_rounds ?? 1,
        currentRound: req.current_round ?? 1,
        playerWins: req.player_round_wins ?? 0,
        adminWins: req.admin_round_wins ?? 0,
      });
    }
  }, [req.num_rounds, req.current_round, req.player_round_wins, req.admin_round_wins]); // eslint-disable-line

  const matchId = req.id;
  const playerAlreadyMoved = req.match?.player_move !== null;
  const adminAlreadyMoved = req.match?.admin_move !== null;

  const handleSubmit = async () => {
    if (!selectedMove || !matchId) return;
    setSubmitting(true); setErr("");
    try {
      const res = await adminBtaApi.submitMove(matchId, selectedMove);
      setRoundResult(res);
      setScore({
        numRounds: res.num_rounds,
        currentRound: res.current_round,
        playerWins: res.player_round_wins,
        adminWins: res.admin_round_wins,
      });
      if (res.match_resolved) {
        setTimeout(onMoveSubmitted, 2800);
      } else if (res.round_result !== null) {
        // Non-resolving round — allow admin to play the next round
        setTimeout(() => {
          setRoundResult(null);
          setSelectedMove(null);
        }, 2000);
      }
    } catch (e) { setErr(e instanceof ApiError ? e.message : "Failed to submit move"); }
    finally { setSubmitting(false); }
  };

  const isDraw = roundResult?.round_result === "draw";
  const adminWonRound = roundResult?.round_result === "admin";
  const matchResolved = roundResult?.match_resolved ?? false;

  return (
    <div style={{ borderRadius: 14, padding: "16px", border: "2px solid rgba(76,111,255,0.3)",
      backgroundColor: "rgba(76,111,255,0.04)", display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 800, color: "var(--accent-indigo)", margin: "0 0 3px" }}>Match in progress</p>
          <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>
            {maskPhone(req.player_phone)} · stake {fmtNaira(req.stake)}
            {playerAlreadyMoved ? " · player has moved" : " · waiting for player"}
          </p>
        </div>
        <button onClick={() => setShowHistory(h => !h)}
          title="Round history"
          style={{ background: "none", border: "1px solid var(--border-hairline)", borderRadius: 6, cursor: "pointer",
            color: "var(--text-muted)", padding: "4px 6px", display: "flex", alignItems: "center", gap: 4, fontSize: 10 }}>
          <List size={12} /> History
        </button>
      </div>

      {/* Scoreboard (best-of-N only) */}
      {score.numRounds > 1 && (
        <Scoreboard playerWins={score.playerWins} adminWins={score.adminWins}
          currentRound={score.currentRound} numRounds={score.numRounds} />
      )}

      {/* Round history panel */}
      {showHistory && <RoundHistoryPanel matchId={matchId} onClose={() => setShowHistory(false)} />}

      {/* Round / match result feedback */}
      {roundResult && (
        <div style={{ textAlign: "center", padding: "8px 0" }}>
          {matchResolved ? (
            <>
              {roundResult.match_winner === "player"
                ? <XCircle size={28} style={{ color: "#f87171", margin: "0 auto 6px" }} />
                : roundResult.match_winner === "draw"
                ? <Minus size={28} style={{ color: "var(--accent-indigo)", margin: "0 auto 6px" }} />
                : <Trophy size={28} style={{ color: "var(--accent-amber)", margin: "0 auto 6px" }} />}
              <p style={{ fontSize: 15, fontWeight: 800, color: "var(--text-primary)", margin: "0 0 4px" }}>
                {roundResult.match_winner === "player" ? "Player wins the match" : roundResult.match_winner === "draw" ? "Match draw" : "Admin wins the match!"}
              </p>
              {score.numRounds > 1 && (
                <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>
                  Final score: Player {score.playerWins} — Admin {score.adminWins}
                </p>
              )}
            </>
          ) : isDraw ? (
            <>
              <RotateCcw size={22} style={{ color: "var(--accent-indigo)", margin: "0 auto 6px" }} />
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--accent-indigo)", margin: "0 0 2px" }}>
                Round {roundResult.round_number} — Draw
              </p>
              <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>Same round replays — submit again</p>
            </>
          ) : (
            <>
              {adminWonRound
                ? <Trophy size={22} style={{ color: "var(--accent-amber)", margin: "0 auto 6px" }} />
                : <XCircle size={22} style={{ color: "#f87171", margin: "0 auto 6px" }} />}
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 2px" }}>
                Round {roundResult.round_number}: {adminWonRound ? "Admin won" : "Player won"}
              </p>
              <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>
                {MOVES.find(m => m.value === roundResult.admin_move)?.emoji} vs {MOVES.find(m => m.value === roundResult.player_move)?.emoji}
              </p>
            </>
          )}
        </div>
      )}

      {/* Move picker — shown when no pending result, admin hasn't moved yet */}
      {!roundResult && !adminAlreadyMoved && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {MOVES.map(({ value, emoji, label }) => (
              <button key={value} onClick={() => setSelectedMove(value)} disabled={submitting}
                style={{ padding: "14px 6px", borderRadius: 12, border: "2px solid", cursor: "pointer",
                  borderColor: selectedMove === value ? "var(--accent-indigo)" : "var(--border-hairline)",
                  backgroundColor: selectedMove === value ? "rgba(76,111,255,0.12)" : "var(--bg-base)",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 4, transition: "all 0.12s" }}>
                <span style={{ fontSize: 28 }}>{emoji}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: selectedMove === value ? "var(--accent-indigo)" : "var(--text-muted)" }}>{label}</span>
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
            {submitting ? "Submitting…" : `Play Move${score.numRounds > 1 ? ` (Round ${score.currentRound})` : ""}`}
          </button>
        </>
      )}

      {/* Already moved, waiting for other side */}
      {!roundResult && adminAlreadyMoved && (
        <p style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center" }}>
          You played {MOVES.find(m => m.value === req.match?.admin_move)?.emoji} — waiting for player…
        </p>
      )}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function AdminBeatTheAdminPage() {
  const [status, setStatus]     = useState<BtaStatus | null>(null);
  const [queue, setQueue]       = useState<BtaQueueEntry[]>([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]       = useState("");
  const [acting, setActing]     = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Live ref for is_available — kept in sync with every settings response and toggle.
  // StakeRangeEditor reads this ref so it never uses a stale prop snapshot when saving.
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
        console.log("[BTA poll] GET settings response:", JSON.stringify(statusRes.value));
        setStatus(statusRes.value);
        isAvailableRef.current = statusRes.value.is_available; // keep ref in sync
      } else {
        setError("Could not load settings — " + (statusRes.reason instanceof ApiError ? statusRes.reason.message : "check admin session"));
      }
      if (queueRes.status === "fulfilled") {
        setQueue(queueRes.value?.requests ?? []);
      } else if (isManual) {
        // Surface queue errors on manual refresh — silent on background polls
        setError((prev) => prev || "Could not load queue — " + (queueRes.reason instanceof ApiError ? queueRes.reason.message : "check admin session"));
      }
    } catch { /* silent on background poll */ }
    finally { setLoading(false); if (isManual) setRefreshing(false); }
  }, []); // eslint-disable-line

  useEffect(() => {
    fetchAll();
    pollRef.current = setInterval(() => fetchAll(), POLL_MS);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchAll]);

  const handleApprove = async (id: string) => {
    setActing(id);
    try { await adminBtaApi.approveRequest(id); await fetchAll(); }
    catch (e) { setError(e instanceof ApiError ? e.message : "Approve failed"); }
    finally { setActing(null); }
  };

  const handleReject = async (id: string) => {
    setActing(id);
    try { await adminBtaApi.rejectRequest(id); setQueue((q) => q.filter((r) => r.id !== id)); }
    catch (e) { setError(e instanceof ApiError ? e.message : "Reject failed"); }
    finally { setActing(null); }
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
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>Rock · Paper · Scissors — manage requests and play matches</p>
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
                isAvailableRef.current = v; // keep ref in sync immediately on toggle
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
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.09em", color: "var(--text-muted)", margin: 0 }}>Pending Requests</p>
          {pending.length > 0 && (
            <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
              backgroundColor: "rgba(232,163,61,0.15)", color: "var(--accent-amber)" }}>{pending.length} waiting</span>
          )}
        </div>
        {loading ? (
          <div style={{ borderRadius: 12, padding: "20px", backgroundColor: "var(--bg-card)", border: "1px solid var(--border-hairline)", textAlign: "center" }}>
            <Loader2 size={20} className="animate-spin" style={{ color: "var(--accent-indigo)", margin: "0 auto" }} />
          </div>
        ) : pending.length === 0 ? (
          <div style={{ borderRadius: 12, padding: "20px 16px", backgroundColor: "var(--bg-card)", border: "1px solid var(--border-hairline)", textAlign: "center" }}>
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

      {/* Active matches */}
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
