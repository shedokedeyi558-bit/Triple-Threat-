"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/context/AppContext";
import {
  beatTheAdminApi, walletApi, ApiError,
  type BtaWinner, type BtaStatus,
  type BtaRequest, type BtaHistoryEntry,
} from "@/lib/api";
import { LudoMatch } from "@/components/ludo/LudoMatch";
import { Loader2, Swords, Clock, Trophy, XCircle, Minus } from "lucide-react";

// ── Constants ─────────────────────────────────────────────────────────────────
const GAME_TYPE = "ludo" as const;
const STATUS_POLL_MS  = 7000;
const REQUEST_POLL_MS = 4000;

function fmtCountdown(secs: number): string {
  if (secs <= 0) return "0:00";
  return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;
}
function fmtNaira(n: number) { return `₦${n.toLocaleString()}`; }

function codeToMessage(err: unknown): string {
  if (err instanceof ApiError) {
    switch (err.code) {
      case "MATCH_IN_PROGRESS":   return "A match is in progress — wait for it to finish.";
      case "FEATURE_UNAVAILABLE": return "Beat the Admin is currently unavailable. Check back soon.";
      case "STAKE_OUT_OF_RANGE":  return "Stake is outside the allowed range. Adjust and try again.";
      case "ALREADY_REQUESTED":   return "You already have a pending challenge. Wait for it to be approved or expire.";
    }
    if (err.status === 402) return "Insufficient balance. Top up your wallet and try again.";
    return err.message || "Something went wrong. Try again.";
  }
  return "Something went wrong. Try again.";
}

// ── Status banner ─────────────────────────────────────────────────────────────
function StatusBanner({ status, onRetry }: { status: BtaStatus | null; onRetry?: () => void }) {
  if (!status) {
    return (
      <div style={{ borderRadius: 12, padding: "12px 16px", backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid var(--border-hairline)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>Checking availability…</p>
        {onRetry && <button onClick={onRetry} style={{ fontSize: 11, fontWeight: 700, color: "var(--accent-indigo)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>Retry</button>}
      </div>
    );
  }
  if (!status.is_available) {
    return (
      <div style={{ borderRadius: 12, padding: "12px 16px", backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid var(--border-hairline)", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 16 }}>😴</span>
        <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>Admin is offline — check back later.</p>
      </div>
    );
  }
  if (status.match_in_progress) {
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

// ── Result screen ─────────────────────────────────────────────────────────────
function ResultScreen({ winner, stake, payout, onPlayAgain }: {
  winner: BtaWinner; stake: number; payout: number; onPlayAgain: () => void;
}) {
  const isWin = winner === "player";
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ textAlign: "center", paddingTop: 8 }}>
        {isWin
          ? <Trophy size={52} style={{ color: "var(--accent-amber)", margin: "0 auto 10px" }} />
          : <XCircle size={52} style={{ color: "#f87171", margin: "0 auto 10px" }} />}
        <h2 style={{ fontSize: 26, fontWeight: 900, color: "var(--text-primary)", margin: "0 0 4px" }}>
          {isWin ? "You Won!" : "You Lost"}
        </h2>
        {isWin
          ? <p style={{ fontSize: 28, fontWeight: 900, fontFamily: "monospace", color: "var(--accent-amber)", margin: 0 }}>+{fmtNaira(payout)}</p>
          : <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: 0 }}>Better luck next time · stake {fmtNaira(stake)}</p>}
      </div>
      <button onClick={onPlayAgain}
        style={{ width: "100%", padding: "14px 0", borderRadius: 14, border: "none",
          background: "var(--accent-indigo)", color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer" }}>
        Play Again
      </button>
    </motion.div>
  );
}

// ── History list ──────────────────────────────────────────────────────────────
function HistoryList({ entries }: { entries: BtaHistoryEntry[] }) {
  if (entries.length === 0) return null;
  return (
    <div style={{ marginTop: 8 }}>
      <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.09em", color: "var(--text-muted)", marginBottom: 10 }}>My Challenges</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {entries.map((e) => {
          const won = e.match?.winner === "player";
          const lost = e.match?.winner === "admin";
          const pending = e.request_status === "pending";
          const expired = e.request_status === "expired";
          const rejected = e.request_status === "rejected";
          const outcomeColor = won ? "var(--accent-amber)" : lost ? "#f87171" : "var(--text-muted)";
          const outcomeLabel = won ? "Won" : lost ? "Lost" : pending ? "Pending" : expired ? "Expired" : rejected ? "Rejected" : "—";
          return (
            <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
              borderRadius: 10, backgroundColor: "var(--bg-card)", border: "1px solid var(--border-hairline)" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: outcomeColor }}>{outcomeLabel}</span>
                  <span style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase" }}>
                    {e.game_type === "ludo" ? "Ludo" : e.game_type === "rps" ? "RPS" : e.game_type}
                  </span>
                </div>
                <p style={{ fontSize: 10, color: "var(--text-muted)", margin: "2px 0 0" }}>
                  {!e.created_at ? "—" : (() => { try { const d = new Date(e.created_at); return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-NG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }); } catch { return "—"; } })()}
                </p>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <p style={{ fontSize: 12, fontWeight: 700, fontFamily: "monospace",
                  color: won ? "var(--accent-amber)" : "var(--text-secondary)", margin: 0 }}>
                  {won ? `+${fmtNaira(e.match!.payout)}` : fmtNaira(e.stake)}
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
  | "loading"        // initial status fetch
  | "lobby"          // status loaded
  | "pending"        // request sent — polling my-request
  | "match"          // approved — Ludo game in progress
  | "result";        // match complete

export default function ChallengePage() {
  const router = useRouter();
  const { state, dispatch } = useApp();

  const [status, setStatus]       = useState<BtaStatus | null>(null);
  const [phase, setPhase]         = useState<PagePhase>("loading");
  const [error, setError]         = useState("");

  // Stake input
  const [stake, setStake]         = useState<number | "">("");

  // Request / match
  const [activeRequest, setActiveRequest] = useState<BtaRequest & { time_remaining_seconds: number } | null>(null);
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  // Final result
  const [finalResult, setFinalResult] = useState<{
    winner: BtaWinner; payout: number;
  } | null>(null);

  // History
  const [history, setHistory]     = useState<BtaHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [requesting, setRequesting] = useState(false);

  const statusIntervalRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const requestIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef       = useRef<ReturnType<typeof setInterval> | null>(null);
  // Stores the active request's expires_at so the 1-second tick can always
  // compute remaining time from the real deadline, not just decrement blindly.
  const expiresAtRef       = useRef<string | null>(null);
  // Tracks the last seen request status so we can detect transitions (e.g. pending → null/expired)
  const prevRequestStatusRef = useRef<string | null>(null);

  const clearRequestPolling = () => {
    if (requestIntervalRef.current) { clearInterval(requestIntervalRef.current); requestIntervalRef.current = null; }
    if (countdownRef.current)       { clearInterval(countdownRef.current);       countdownRef.current = null; }
  };
  const clearStatusPolling = () => {
    if (statusIntervalRef.current)  { clearInterval(statusIntervalRef.current);  statusIntervalRef.current = null; }
  };

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try { const res = await beatTheAdminApi.getHistory(); setHistory(res?.history ?? []); }
    catch { /* silent */ }
    finally { setHistoryLoading(false); }
  }, []);

  // Fetches the latest balance from the server and updates the global context.
  // Called immediately when a refund event is detected (expiry/rejection) so
  // the player sees their stake returned without reloading.
  const refreshBalance = useCallback(async () => {
    try {
      const res = await walletApi.getBalance();
      dispatch({ type: "UPDATE_BALANCE", balance: res.balance, bonus_balance: res.bonus_balance });
    } catch { /* silent — balance will sync on next scheduled fetch */ }
  }, [dispatch]);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await beatTheAdminApi.getStatus();
      setStatus(res);
      setError((prev) => prev.includes("Could not load status") ? "" : prev);
    } catch { setError("Could not load status — check connection and try again."); }
  }, []);

  // ── Poll my-request ────────────────────────────────────────────────────────
  const pollMyRequest = useCallback(async () => {
    try {
      const res = await beatTheAdminApi.getMyRequest();
      const { request, match } = res;

      if (!request) {
        // Request disappeared — it expired or was rejected.
        // If we were previously tracking a pending request, the stake was refunded.
        // Refresh balance immediately so the player sees it restored.
        if (prevRequestStatusRef.current === "pending" || prevRequestStatusRef.current === "approved") {
          refreshBalance();
        }
        prevRequestStatusRef.current = null;
        clearRequestPolling();
        setActiveRequest(null);
        setPhase("lobby");
        fetchHistory();
        return;
      }

      // Detect transition to expired/rejected status (backend may briefly return
      // the entry with status="expired" before dropping it entirely)
      if (
        (request.status === "expired" || request.status === "rejected") &&
        prevRequestStatusRef.current === "pending"
      ) {
        refreshBalance();
      }
      prevRequestStatusRef.current = request.status;

      setActiveRequest(request);

      // Always derive countdown from expires_at — never trust a decremented local counter.
      if (request.expires_at) {
        expiresAtRef.current = request.expires_at;
        const remaining = Math.max(0, Math.floor((new Date(request.expires_at).getTime() - Date.now()) / 1000));
        setCountdown(remaining);
      } else {
        setCountdown(request.time_remaining_seconds ?? 0);
      }

      if (request.status === "approved") {
        if (match?.status === "completed" && match.winner) {
          clearRequestPolling();
          setFinalResult({ winner: match.winner, payout: match.payout });
          setPhase("result");
          fetchHistory();
        } else {
          // Extract match_id — backend may include it in request or match object
          const mid = request.match_id ?? match?.match_id;
          if (mid) setActiveMatchId(mid);
          setPhase((prev) => prev === "pending" ? "match" : prev);
        }
      } else if (request.status === "pending") {
        setPhase("pending");
      }
    } catch { /* silent */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchHistory, refreshBalance]);

  // ── Boot ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!state.isAuthenticated) { router.push("/auth"); return; }
    const boot = async () => {
      // Check for an existing pending/approved request BEFORE showing the lobby.
      // Without this, a reload always shows the challenge form even if the player
      // already has a live request — the pending phase is lost.
      let restoredPhase = false;
      try {
        const myReq = await beatTheAdminApi.getMyRequest();
        if (myReq.request) {
          const { request, match } = myReq;
          setActiveRequest(request);
          prevRequestStatusRef.current = request.status;

          // Derive countdown from expires_at so it's accurate after a reload
          if (request.expires_at) {
            expiresAtRef.current = request.expires_at;
            const remaining = Math.max(0, Math.floor((new Date(request.expires_at).getTime() - Date.now()) / 1000));
            setCountdown(remaining);
          }

          if (request.status === "pending") {
            setPhase("pending");
            restoredPhase = true;
          } else if (request.status === "approved" && match) {
            if (match.status === "completed" && match.winner) {
              setFinalResult({ winner: match.winner, payout: match.payout });
              setPhase("result");
            } else {
              // Match in progress — need matchId from request or match
              const mid = myReq.request?.match_id ?? match?.match_id;
              if (mid) setActiveMatchId(mid);
              setPhase("match");
            }
            restoredPhase = true;
          } else if (request.status === "approved") {
            setPhase("match");
            restoredPhase = true;
          }
        }
      } catch { /* if my-request fails, fall through to lobby */ }

      if (!restoredPhase) {
        // my-request confirmed null — clear any stale error state and show lobby
        setError("");
        setActiveRequest(null);
        prevRequestStatusRef.current = null;
        expiresAtRef.current = null;
        await fetchStatus();
        setPhase("lobby");
        fetchHistory();
      } else {
        // Still fetch status in background so settings are available if needed
        fetchStatus();
        fetchHistory();
      }
    };
    boot();
    statusIntervalRef.current = setInterval(fetchStatus, STATUS_POLL_MS);
    return () => { clearStatusPolling(); clearRequestPolling(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Manage intervals when phase changes ────────────────────────────────────
  useEffect(() => {
    if (phase === "pending") {
      clearStatusPolling();
      if (!requestIntervalRef.current) {
        pollMyRequest();
        requestIntervalRef.current = setInterval(pollMyRequest, REQUEST_POLL_MS);
      }
      if (!countdownRef.current) {
        countdownRef.current = setInterval(() => {
          if (expiresAtRef.current) {
            const remaining = Math.max(0, Math.floor((new Date(expiresAtRef.current).getTime() - Date.now()) / 1000));
            setCountdown(remaining);
          } else {
            setCountdown((c) => Math.max(0, c - 1));
          }
        }, 1000);
      }
    }
    if (phase === "lobby" || phase === "result") {
      clearRequestPolling();
      if (!statusIntervalRef.current) {
        statusIntervalRef.current = setInterval(fetchStatus, STATUS_POLL_MS);
      }
    }
    // match phase: LudoMatch component handles its own polling
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // ── Submit request ─────────────────────────────────────────────────────────
  const handleRequest = async () => {
    if (!stake || Number(stake) <= 0) return;
    setRequesting(true); setError("");
    try {
      const res = await beatTheAdminApi.requestChallenge(Number(stake), GAME_TYPE);
      const remaining = Math.max(0, Math.floor((new Date(res.expires_at).getTime() - Date.now()) / 1000));
      dispatch({ type: "UPDATE_BALANCE", balance: res.new_balance, bonus_balance: res.new_bonus_balance });
      expiresAtRef.current = res.expires_at;
      setActiveRequest({
        request_id: res.request_id,
        game_type: res.game_type,
        stake: res.stake,
        status: "pending",
        expires_at: res.expires_at,
        time_remaining_seconds: remaining,
      });
      setCountdown(remaining);
      setPhase("pending");
    } catch (err) {
      // If ALREADY_REQUESTED, do a fresh server check — the DB may not have a live request
      // (backend race condition or stale cache). If my-request confirms null, clear the error
      // and let the player try again.
      if (err instanceof ApiError && err.code === "ALREADY_REQUESTED") {
        try {
          const myReq = await beatTheAdminApi.getMyRequest();
          if (myReq.request && myReq.request.status === "pending") {
            // There IS a live request — restore the pending screen
            setActiveRequest(myReq.request);
            prevRequestStatusRef.current = "pending";
            if (myReq.request.expires_at) {
              expiresAtRef.current = myReq.request.expires_at;
              const remaining = Math.max(0, Math.floor((new Date(myReq.request.expires_at).getTime() - Date.now()) / 1000));
              setCountdown(remaining);
            }
            setPhase("pending");
            return;
          } else {
            // my-request confirms null — server gave a false positive, let player retry
            setError("Server reported a conflict but no live request was found — please try again.");
            return;
          }
        } catch { /* fall through to generic error */ }
      }
      setError(codeToMessage(err));
    }
    finally { setRequesting(false); }
  };

  // ── Reset to lobby ─────────────────────────────────────────────────────────
  const resetToLobby = () => {
    setFinalResult(null); setActiveRequest(null); setActiveMatchId(null); setStake("");
    setError("");
    expiresAtRef.current = null;
    fetchStatus(); fetchHistory();
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

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Swords size={22} style={{ color: "var(--accent-indigo)", flexShrink: 0 }} />
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 900, letterSpacing: "-0.02em", color: "var(--text-primary)", margin: 0 }}>Beat the Admin</h1>
            <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>Ludo · Double or nothing</p>
          </div>
        </div>

        {/* Loading splash */}
        {phase === "loading" && (
          <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}>
            <Loader2 size={28} className="animate-spin" style={{ color: "var(--accent-indigo)" }} />
          </div>
        )}

        <AnimatePresence mode="wait">

          {/* ── RESULT ── */}
          {phase === "result" && finalResult && (
            <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ResultScreen
                winner={finalResult.winner}
                stake={activeRequest?.stake ?? stakeNum}
                payout={finalResult.payout}
                onPlayAgain={resetToLobby}
              />
            </motion.div>
          )}

          {/* ── LUDO MATCH ── */}
          {phase === "match" && activeMatchId && (
            <motion.div key="match" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div style={{ borderRadius: 12, padding: "10px 14px", marginBottom: 12,
                backgroundColor: "rgba(76,111,255,0.06)", border: "1px solid rgba(76,111,255,0.2)" }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "var(--accent-indigo)", margin: "0 0 2px" }}>Match in progress!</p>
                <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: 0 }}>
                  Stake: {fmtNaira(activeRequest?.stake ?? stakeNum)} → Win: {fmtNaira((activeRequest?.stake ?? stakeNum) * 2)}
                </p>
              </div>
              <LudoMatch
                matchId={activeMatchId}
                myRole="player"
                stake={activeRequest?.stake ?? stakeNum}
                rollDice={beatTheAdminApi.rollDice}
                movePiece={beatTheAdminApi.movePiece}
                getMatchState={beatTheAdminApi.getMatchState}
                onMatchComplete={(winner, payout) => {
                  refreshBalance();
                  setFinalResult({ winner, payout });
                  setPhase("result");
                  fetchHistory();
                }}
              />
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
                Admin will approve or decline. Stake is refunded automatically if no response when the timer expires.
              </p>
            </motion.div>
          )}

          {/* ── LOBBY ── */}
          {phase === "lobby" && (
            <motion.div key="lobby" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <StatusBanner status={status} onRetry={fetchStatus} />
              {error && !error.includes("Could not load status") && (
                <div style={{ borderRadius: 10, padding: "10px 14px", backgroundColor: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", fontSize: 13, color: "#f87171" }}>
                  {error}
                </div>
              )}
              {canChallenge && !error && (
                <div style={{ borderRadius: 14, padding: "18px 16px", backgroundColor: "var(--bg-card)", border: "1px solid var(--border-hairline)", display: "flex", flexDirection: "column", gap: 14 }}>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", display: "block", marginBottom: 8 }}>
                      Stake (₦{minStake.toLocaleString()} – ₦{maxStake.toLocaleString()})
                    </label>
                    <input type="number" inputMode="numeric" min={minStake} max={maxStake} placeholder={`e.g. ${minStake}`}
                      value={stake} onChange={(e) => setStake(e.target.value === "" ? "" : Number(e.target.value))}
                      style={{ width: "100%", boxSizing: "border-box", padding: "12px 14px", borderRadius: 10,
                        border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-base)",
                        color: "var(--text-primary)", fontSize: 16, outline: "none" }} />
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {[minStake, Math.round((minStake + maxStake) / 4), Math.round((minStake + maxStake) / 2), maxStake]
                      .filter((v, i, a) => a.indexOf(v) === i).map((amt) => (
                        <button key={amt} onClick={() => setStake(amt)}
                          style={{ padding: "5px 10px", borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: "pointer",
                            backgroundColor: stake === amt ? "rgba(76,111,255,0.15)" : "transparent",
                            border: `1px solid ${stake === amt ? "var(--accent-indigo)" : "var(--border-hairline)"}`,
                            color: stake === amt ? "var(--accent-indigo)" : "var(--text-muted)" }}>
                          {fmtNaira(amt)}
                        </button>
                      ))}
                  </div>
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

        {/* History */}
        {!historyLoading && <HistoryList entries={history} />}

      </div>
    </>
  );
}
