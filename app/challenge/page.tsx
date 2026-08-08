"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/context/AppContext";
import {
  beatTheAdminApi, ApiError,
  type BtaMove, type BtaWinner, type BtaStatus,
  type BtaRequest, type BtaMatch, type BtaMoveResponse,
  type BtaHistoryEntry,
} from "@/lib/api";
import { Loader2, Swords, Clock, Trophy, XCircle, Minus, RefreshCw, ChevronDown } from "lucide-react";
import Link from "next/link";

// ── Constants ─────────────────────────────────────────────────────────────────
const GAME_TYPE = "rps" as const; // swap to a variable/prop when adding more game types
const STATUS_POLL_MS  = 7000;
const REQUEST_POLL_MS = 4000;

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtCountdown(secs: number): string {
  if (secs <= 0) return "0:00";
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function fmtNaira(n: number) {
  return `₦${n.toLocaleString()}`;
}

// ── Move icons (emoji + label — easily swapped for SVG later) ─────────────────
const MOVES: { value: BtaMove; emoji: string; label: string }[] = [
  { value: "rock",     emoji: "✊", label: "Rock"     },
  { value: "paper",    emoji: "✋", label: "Paper"    },
  { value: "scissors", emoji: "✌️", label: "Scissors" },
];

// ── Error code → user-friendly copy ──────────────────────────────────────────
function codeToMessage(err: unknown): string {
  if (err instanceof ApiError) {
    switch ((err as any).code) {
      case "MATCH_IN_PROGRESS":  return "A match is currently in progress — wait for it to finish before sending a new challenge.";
      case "FEATURE_UNAVAILABLE": return "Beat the Admin is currently unavailable. Check back soon.";
      case "STAKE_OUT_OF_RANGE":  return "Your stake is outside the allowed range. Adjust and try again.";
      case "ALREADY_REQUESTED":   return "You already have a pending challenge request. Wait for it to be approved or expire.";
    }
    if (err.status === 402) return "Insufficient balance. Top up your wallet and try again.";
    return err.message || "Something went wrong. Try again.";
  }
  return "Something went wrong. Try again.";
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusBanner({ status, onRetry }: { status: BtaStatus | null; onRetry?: () => void }) {
  if (!status) {
    return (
      <div style={{ borderRadius: 12, padding: "12px 16px", backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid var(--border-hairline)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>Checking availability…</p>
        {onRetry && (
          <button onClick={onRetry} style={{ fontSize: 11, fontWeight: 700, color: "var(--accent-indigo)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            Retry
          </button>
        )}
      </div>
    );
  }
  const { is_available, match_in_progress } = status;

  if (!is_available) {
    return (
      <div style={{ borderRadius: 12, padding: "12px 16px", backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid var(--border-hairline)", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 16 }}>😴</span>
        <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>Admin is offline — check back later.</p>
      </div>
    );
  }
  if (match_in_progress) {
    return (
      <div style={{ borderRadius: 12, padding: "12px 16px", backgroundColor: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.2)", display: "flex", alignItems: "center", gap: 8 }}>
        <Clock size={15} style={{ color: "#fbbf24", flexShrink: 0 }} />
        <p style={{ fontSize: 13, color: "#fbbf24", margin: 0 }}>A match is ongoing — try again in a few minutes.</p>
      </div>
    );
  }
  return (
    <div style={{ borderRadius: 12, padding: "12px 16px", backgroundColor: "rgba(74,222,128,0.07)", border: "1px solid rgba(74,222,128,0.2)", display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ADE80", boxShadow: "0 0 8px rgba(74,222,128,0.7)", display: "inline-block", flexShrink: 0, animation: "bta-pulse 1.8s infinite" }} />
      <p style={{ fontSize: 13, color: "#4ADE80", margin: 0, fontWeight: 600 }}>Admin is available — send a challenge!</p>
    </div>
  );
}

function ResultScreen({
  winner, adminMove, playerMove, stake, payout,
  onPlayAgain,
}: {
  winner: BtaWinner; adminMove: BtaMove | null; playerMove: BtaMove | null;
  stake: number; payout: number; onPlayAgain: () => void;
}) {
  const isWin  = winner === "player";
  const isDraw = winner === "draw";
  const playerEmoji = MOVES.find(m => m.value === playerMove)?.emoji ?? "?";
  const adminEmoji  = MOVES.find(m => m.value === adminMove)?.emoji  ?? "?";

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Outcome header */}
      <div style={{ textAlign: "center", paddingTop: 8 }}>
        {isWin ? (
          <Trophy size={52} style={{ color: "var(--accent-amber)", margin: "0 auto 10px" }} />
        ) : isDraw ? (
          <Minus size={52} style={{ color: "var(--accent-indigo)", margin: "0 auto 10px" }} />
        ) : (
          <XCircle size={52} style={{ color: "#f87171", margin: "0 auto 10px" }} />
        )}
        <h2 style={{ fontSize: 26, fontWeight: 900, color: "var(--text-primary)", margin: "0 0 4px" }}>
          {isWin ? "You Won!" : isDraw ? "Draw!" : "You Lost"}
        </h2>
        {isWin && (
          <p style={{ fontSize: 28, fontWeight: 900, fontFamily: "monospace", color: "var(--accent-amber)", margin: 0 }}>
            +{fmtNaira(payout)}
          </p>
        )}
        {isDraw && (
          <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: 0 }}>
            Stake refunded · {fmtNaira(payout)}
          </p>
        )}
      </div>
      {/* Move comparison */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 10,
        borderRadius: 12, padding: "14px 16px", backgroundColor: "var(--bg-card)", border: "1px solid var(--border-hairline)" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", margin: "0 0 6px" }}>You</p>
          <span style={{ fontSize: 36 }}>{playerEmoji}</span>
          <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", margin: "4px 0 0", textTransform: "capitalize" }}>{playerMove}</p>
        </div>
        <span style={{ fontSize: 12, fontWeight: 800, color: "var(--text-muted)" }}>VS</span>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", margin: "0 0 6px" }}>Admin</p>
          <span style={{ fontSize: 36 }}>{adminEmoji}</span>
          <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", margin: "4px 0 0", textTransform: "capitalize" }}>{adminMove}</p>
        </div>
      </div>
      <button onClick={onPlayAgain}
        style={{ width: "100%", padding: "14px 0", borderRadius: 14, border: "none",
          background: "var(--accent-indigo)", color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer" }}>
        Play Again
      </button>
    </motion.div>
  );
}

function HistoryList({ entries }: { entries: BtaHistoryEntry[] }) {
  if (entries.length === 0) return null;

  return (
    <div style={{ marginTop: 8 }}>
      <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.09em", color: "var(--text-muted)", marginBottom: 10 }}>
        My Challenges
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {entries.map((e) => {
          const won  = e.match?.winner === "player";
          const draw = e.match?.winner === "draw";
          const lost = e.match?.winner === "admin";
          const pending   = e.request_status === "pending";
          const expired   = e.request_status === "expired";
          const rejected  = e.request_status === "rejected";
          const hasResult = !!e.match;

          const outcomeColor = won ? "var(--accent-amber)" : draw ? "var(--accent-indigo)" : lost ? "#f87171" : "var(--text-muted)";
          const outcomeLabel = won ? "Won" : draw ? "Draw" : lost ? "Lost"
            : pending ? "Pending" : expired ? "Expired" : rejected ? "Rejected" : "—";

          const playerEmoji = e.match?.player_move ? MOVES.find(m => m.value === e.match!.player_move)?.emoji : null;
          const adminEmoji  = e.match?.admin_move  ? MOVES.find(m => m.value === e.match!.admin_move)?.emoji  : null;

          return (
            <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 10,
              padding: "10px 12px", borderRadius: 10, backgroundColor: "var(--bg-card)",
              border: "1px solid var(--border-hairline)" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: outcomeColor }}>{outcomeLabel}</span>
                  {hasResult && playerEmoji && adminEmoji && (
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{playerEmoji} vs {adminEmoji}</span>
                  )}
                </div>
                <p style={{ fontSize: 10, color: "var(--text-muted)", margin: "2px 0 0" }}>
                  {(() => {
                    // expired entries may have null/undefined created_at at runtime
                    if (!e.created_at) return "—";
                    try {
                      const d = new Date(e.created_at);
                      if (isNaN(d.getTime())) return "—";
                      return d.toLocaleDateString("en-NG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
                    } catch { return "—"; }
                  })()}
                </p>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <p style={{ fontSize: 12, fontWeight: 700, fontFamily: "monospace",
                  color: won ? "var(--accent-amber)" : draw ? "var(--accent-indigo)" : "var(--text-secondary)", margin: 0 }}>
                  {won ? `+${fmtNaira(e.match!.payout)}` : draw ? fmtNaira(e.match!.payout) : fmtNaira(e.stake)}
                </p>
                <p style={{ fontSize: 9, color: "var(--text-muted)", margin: "1px 0 0" }}>stake {fmtNaira(e.stake)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
type PagePhase =
  | "loading"          // initial status fetch
  | "lobby"            // status loaded — show status banner + stake input
  | "pending"          // request sent — polling my-request
  | "waiting_admin"    // move submitted, match_resolved: false — keep polling
  | "move"             // approved — show RPS buttons
  | "result";          // match resolved

export default function ChallengePage() {
  const router = useRouter();
  const { state, dispatch } = useApp();

  // ── Status ──
  const [status, setStatus]         = useState<BtaStatus | null>(null);
  const [phase, setPhase]           = useState<PagePhase>("loading");
  const [error, setError]           = useState("");

  // ── Stake input ──
  const [stake, setStake]           = useState<number | "">("");

  // ── Request / match state ──
  const [activeRequest, setActiveRequest] = useState<BtaRequest & { time_remaining_seconds: number } | null>(null);
  const [activeMatch, setActiveMatch]     = useState<BtaMatch | null>(null);
  const [countdown, setCountdown]         = useState(0);

  // ── Move ──
  const [selectedMove, setSelectedMove]   = useState<BtaMove | null>(null);
  const [submittingMove, setSubmittingMove] = useState(false);

  // ── Result ──
  const [result, setResult]         = useState<BtaMoveResponse | null>(null);

  // ── History ──
  const [history, setHistory]       = useState<BtaHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [requesting, setRequesting] = useState(false);

  // ── Refs for intervals ──
  const statusIntervalRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const requestIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef       = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearRequestPolling = () => {
    if (requestIntervalRef.current) { clearInterval(requestIntervalRef.current); requestIntervalRef.current = null; }
    if (countdownRef.current)       { clearInterval(countdownRef.current);       countdownRef.current = null; }
  };
  const clearStatusPolling = () => {
    if (statusIntervalRef.current)  { clearInterval(statusIntervalRef.current);  statusIntervalRef.current = null; }
  };

  // ── Fetch history ─────────────────────────────────────────────────────────
  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await beatTheAdminApi.getHistory();
      setHistory(res?.history ?? []);
    } catch { /* silent */ }
    finally { setHistoryLoading(false); }
  }, []);

  // ── Poll status ───────────────────────────────────────────────────────────
  const fetchStatus = useCallback(async () => {
    try {
      const res = await beatTheAdminApi.getStatus();
      setStatus(res);
      setError((prev) => prev === "Could not load status — check connection and try again." ? "" : prev);
    } catch (err) {
      setError("Could not load status — check connection and try again.");
    }
  }, []);

  // ── Poll my-request ────────────────────────────────────────────────────────
  const pollMyRequest = useCallback(async () => {
    try {
      const res = await beatTheAdminApi.getMyRequest();
      const { request, match } = res;

      if (!request) {
        // Transitioned from pending → null: expired or rejected
        // History will surface the reason; show lobby + reload history
        clearRequestPolling();
        setActiveRequest(null);
        setActiveMatch(null);
        setPhase("lobby");
        fetchHistory();
        return;
      }

      setActiveRequest(request);
      // Update live countdown from server value
      setCountdown(request.time_remaining_seconds ?? 0);

      if (request.status === "approved" && match) {
        setActiveMatch(match);
        if (match.status === "completed" && match.winner) {
          // Match resolved while we were polling (admin already played)
          clearRequestPolling();
          setResult({
            move_recorded: true,
            match_resolved: true,
            winner: match.winner,
            admin_move: match.admin_move ?? undefined,
            player_move: match.player_move ?? undefined,
          });
          setPhase("result");
          fetchHistory();
        } else {
          setPhase("move");
        }
      } else if (request.status === "approved" && !match) {
        setPhase("move");
      } else if (phase === "waiting_admin") {
        // Already submitted move — keep polling for resolution
        if (match?.status === "completed" && match.winner) {
          clearRequestPolling();
          setResult({
            move_recorded: true,
            match_resolved: true,
            winner: match.winner,
            admin_move: match.admin_move ?? undefined,
            player_move: match.player_move ?? undefined,
          });
          setPhase("result");
          fetchHistory();
        }
      }
    } catch { /* silent */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, fetchHistory]);

  // ── Boot ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!state.isAuthenticated) { router.push("/auth"); return; }

    const boot = async () => {
      await fetchStatus();
      setPhase("lobby");
      fetchHistory();
    };
    boot();

    // Status poll — only while in lobby
    statusIntervalRef.current = setInterval(fetchStatus, STATUS_POLL_MS);

    return () => {
      clearStatusPolling();
      clearRequestPolling();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Start request polling when phase enters pending/waiting_admin ─────────
  useEffect(() => {
    if (phase === "pending" || phase === "waiting_admin") {
      clearStatusPolling(); // don't need status poll while a request is live
      if (!requestIntervalRef.current) {
        pollMyRequest(); // immediate first check
        requestIntervalRef.current = setInterval(pollMyRequest, REQUEST_POLL_MS);
      }
      // Live countdown tick
      if (!countdownRef.current) {
        countdownRef.current = setInterval(() => {
          setCountdown((c) => Math.max(0, c - 1));
        }, 1000);
      }
    }
    if (phase === "lobby" || phase === "result") {
      clearRequestPolling();
      // Restart status poll
      if (!statusIntervalRef.current) {
        statusIntervalRef.current = setInterval(fetchStatus, STATUS_POLL_MS);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // ── Submit request ────────────────────────────────────────────────────────
  const handleRequest = async () => {
    if (!stake || Number(stake) <= 0) return;
    setRequesting(true);
    setError("");
    try {
      const res = await beatTheAdminApi.requestChallenge(Number(stake), GAME_TYPE);
      // request() already unwraps json.data, so res IS the payload directly
      dispatch({ type: "UPDATE_BALANCE", balance: res.new_balance, bonus_balance: res.new_bonus_balance });
      setActiveRequest({
        request_id: res.request_id,
        game_type: res.game_type,
        stake: res.stake,
        status: "pending",
        expires_at: res.expires_at,
        time_remaining_seconds: Math.max(0, Math.floor((new Date(res.expires_at).getTime() - Date.now()) / 1000)),
      });
      setCountdown(Math.max(0, Math.floor((new Date(res.expires_at).getTime() - Date.now()) / 1000)));
      setPhase("pending");
    } catch (err) {
      setError(codeToMessage(err));
    } finally {
      setRequesting(false);
    }
  };

  // ── Submit move ───────────────────────────────────────────────────────────
  const handleMove = async () => {
    if (!selectedMove || !activeRequest) return;
    setSubmittingMove(true);
    setError("");
    try {
      const res = await beatTheAdminApi.submitMove(activeRequest.request_id, selectedMove);
      if (res.match_resolved) {
        clearRequestPolling();
        setResult(res);
        setPhase("result");
        fetchHistory();
      } else {
        setPhase("waiting_admin");
      }
    } catch (err) {
      setError(codeToMessage(err));
    } finally {
      setSubmittingMove(false);
    }
  };

  // ── Reset to lobby ────────────────────────────────────────────────────────
  const resetToLobby = () => {
    setResult(null);
    setActiveRequest(null);
    setActiveMatch(null);
    setSelectedMove(null);
    setError("");
    setStake("");
    fetchStatus();
    fetchHistory();
    setPhase("lobby");
  };

  if (!state.isAuthenticated) return null;

  const canChallenge = status?.is_available && !status?.match_in_progress;
  const minStake = status?.min_stake ?? 100;
  const maxStake = status?.max_stake ?? 10000;
  const stakeNum = Number(stake);
  const stakeValid = stakeNum >= minStake && stakeNum <= maxStake;

  return (
    <>
      <style>{`
        @keyframes bta-pulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(74,222,128,0.5); }
          70%      { box-shadow: 0 0 0 6px rgba(74,222,128,0); }
        }
      `}</style>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "20px 16px 40px", display: "flex", flexDirection: "column", gap: 20 }}>

        {/* ── Page header ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Swords size={22} style={{ color: "var(--accent-indigo)", flexShrink: 0 }} />
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 900, letterSpacing: "-0.02em", color: "var(--text-primary)", margin: 0 }}>
              Beat the Admin
            </h1>
            <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>Rock · Paper · Scissors · Double or nothing</p>
          </div>
        </div>

        {/* ── Loading splash ── */}
        {phase === "loading" && (
          <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}>
            <Loader2 size={28} className="animate-spin" style={{ color: "var(--accent-indigo)" }} />
          </div>
        )}

        <AnimatePresence mode="wait">

          {/* ── RESULT ── */}
          {phase === "result" && result?.match_resolved && (
            <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ResultScreen
                winner={result.winner!}
                adminMove={result.admin_move ?? null}
                playerMove={result.player_move ?? null}
                stake={activeRequest?.stake ?? stakeNum}
                payout={
                  result.winner === "player" ? (activeRequest?.stake ?? stakeNum) * 2
                  : result.winner === "draw"  ? (activeRequest?.stake ?? stakeNum)
                  : 0
                }
                onPlayAgain={resetToLobby}
              />
            </motion.div>
          )}

          {/* ── MOVE UI ── */}
          {(phase === "move" || phase === "waiting_admin") && (
            <motion.div key="move" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ borderRadius: 12, padding: "14px 16px", backgroundColor: "rgba(76,111,255,0.06)", border: "1px solid rgba(76,111,255,0.2)" }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "var(--accent-indigo)", margin: "0 0 2px" }}>Challenge approved!</p>
                <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: 0 }}>
                  Stake: {fmtNaira(activeRequest?.stake ?? stakeNum)} → Win: {fmtNaira((activeRequest?.stake ?? stakeNum) * 2)}
                </p>
              </div>

              {phase === "waiting_admin" ? (
                <div style={{ textAlign: "center", padding: "24px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                  <Loader2 size={28} className="animate-spin" style={{ color: "var(--accent-indigo)" }} />
                  <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: 0 }}>Waiting for admin to play…</p>
                </div>
              ) : (
                <>
                  <p style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 0 }}>Choose your move</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                    {MOVES.map(({ value, emoji, label }) => (
                      <button key={value} onClick={() => setSelectedMove(value)} disabled={submittingMove}
                        style={{
                          padding: "18px 8px", borderRadius: 14, border: "2px solid",
                          borderColor: selectedMove === value ? "var(--accent-indigo)" : "var(--border-hairline)",
                          backgroundColor: selectedMove === value ? "rgba(76,111,255,0.12)" : "var(--bg-card)",
                          cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                          transition: "all 0.15s", transform: selectedMove === value ? "scale(1.04)" : "scale(1)",
                        }}>
                        <span style={{ fontSize: 32 }}>{emoji}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: selectedMove === value ? "var(--accent-indigo)" : "var(--text-secondary)" }}>{label}</span>
                      </button>
                    ))}
                  </div>
                  <button onClick={handleMove} disabled={!selectedMove || submittingMove}
                    style={{ width: "100%", padding: "14px 0", borderRadius: 14, border: "none",
                      backgroundColor: "var(--accent-indigo)", color: "#fff", fontSize: 15, fontWeight: 800,
                      cursor: !selectedMove || submittingMove ? "not-allowed" : "pointer",
                      opacity: !selectedMove || submittingMove ? 0.45 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    {submittingMove && <Loader2 size={16} className="animate-spin" />}
                    {submittingMove ? "Submitting…" : "Lock In Move"}
                  </button>
                </>
              )}
            </motion.div>
          )}

          {/* ── PENDING ── */}
          {phase === "pending" && (
            <motion.div key="pending" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ borderRadius: 14, padding: "20px 18px", backgroundColor: "var(--bg-card)", border: "1px solid var(--border-hairline)", textAlign: "center" }}>
                <Loader2 size={28} className="animate-spin" style={{ color: "var(--accent-amber)", margin: "0 auto 12px" }} />
                <p style={{ fontSize: 15, fontWeight: 800, color: "var(--text-primary)", margin: "0 0 4px" }}>Waiting for approval</p>
                <p style={{ fontSize: 28, fontWeight: 900, fontFamily: "monospace", color: countdown < 30 ? "#f87171" : "var(--accent-amber)", margin: "6px 0 0" }}>
                  {fmtCountdown(countdown)}
                </p>
                <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>Stake: {fmtNaira(activeRequest?.stake ?? stakeNum)}</p>
              </div>
              <p style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", margin: 0 }}>
                Admin will approve or decline. If no response, your stake is refunded automatically when the timer expires.
              </p>
            </motion.div>
          )}

          {/* ── LOBBY ── */}
          {phase === "lobby" && (
            <motion.div key="lobby" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Status banner */}
              <StatusBanner status={status} onRetry={fetchStatus} />

              {/* Error (non-status errors only, e.g. failed challenge request) */}
              {error && !error.includes("Could not load status") && (
                <div style={{ borderRadius: 10, padding: "10px 14px", backgroundColor: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", fontSize: 13, color: "#f87171" }}>
                  {error}
                </div>
              )}

              {/* Stake input — only shown when available */}
              {canChallenge && (
                <div style={{ borderRadius: 14, padding: "18px 16px", backgroundColor: "var(--bg-card)", border: "1px solid var(--border-hairline)", display: "flex", flexDirection: "column", gap: 14 }}>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", display: "block", marginBottom: 8 }}>
                      Stake (₦{minStake.toLocaleString()} – ₦{maxStake.toLocaleString()})
                    </label>
                    <input
                      type="number" inputMode="numeric"
                      min={minStake} max={maxStake}
                      placeholder={`e.g. ${minStake}`}
                      value={stake}
                      onChange={(e) => setStake(e.target.value === "" ? "" : Number(e.target.value))}
                      style={{ width: "100%", boxSizing: "border-box", padding: "12px 14px", borderRadius: 10,
                        border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-base)",
                        color: "var(--text-primary)", fontSize: 16, outline: "none" }}
                    />
                  </div>
                  {/* Quick amounts */}
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {[minStake, Math.round((minStake + maxStake) / 4), Math.round((minStake + maxStake) / 2), maxStake].filter((v, i, a) => a.indexOf(v) === i).map((amt) => (
                      <button key={amt} onClick={() => setStake(amt)}
                        style={{ padding: "5px 10px", borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: "pointer",
                          backgroundColor: stake === amt ? "rgba(76,111,255,0.15)" : "transparent",
                          border: `1px solid ${stake === amt ? "var(--accent-indigo)" : "var(--border-hairline)"}`,
                          color: stake === amt ? "var(--accent-indigo)" : "var(--text-muted)" }}>
                        {fmtNaira(amt)}
                      </button>
                    ))}
                  </div>
                  {/* Payout preview */}
                  {stakeValid && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 12px", borderRadius: 8,
                      backgroundColor: "rgba(76,111,255,0.06)", border: "1px solid rgba(76,111,255,0.15)" }}>
                      <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Stake {fmtNaira(stakeNum)}</span>
                      <span style={{ fontSize: 13, color: "var(--text-muted)" }}>→</span>
                      <span style={{ fontSize: 15, fontWeight: 800, fontFamily: "monospace", color: "var(--accent-indigo)" }}>Win {fmtNaira(stakeNum * 2)}</span>
                    </div>
                  )}
                  <button onClick={handleRequest} disabled={!stakeValid || requesting}
                    style={{ width: "100%", padding: "14px 0", borderRadius: 14, border: "none",
                      background: "linear-gradient(135deg, var(--accent-indigo), #7C6FE8)",
                      color: "#fff", fontSize: 15, fontWeight: 800,
                      cursor: !stakeValid || requesting ? "not-allowed" : "pointer",
                      opacity: !stakeValid || requesting ? 0.45 : 1,
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    {requesting && <Loader2 size={16} className="animate-spin" />}
                    {requesting ? "Sending…" : "Challenge Admin →"}
                  </button>
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>

        {/* ── History ── */}
        {historyLoading && history.length === 0 ? null : <HistoryList entries={history} />}

      </div>
    </>
  );
}
