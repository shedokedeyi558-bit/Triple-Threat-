"use client";

/**
 * LudoMatch — shared game controller + board renderer for Beat the Admin (Ludo).
 * Used by both player (/challenge) and admin (/admin/beat-the-admin) pages.
 *
 * Board geometry:
 *   52-square shared track (positions 0–51).
 *   Player (green) starts/enters at square 0.
 *   Admin (red) starts/enters at square 26.
 *   Home column: positions 52–56 (5 squares, player-specific).
 *   Home (finished): position 57.
 *   Yard: position -1.
 *
 * Safe squares (no captures): [0, 8, 13, 21, 26, 34, 39, 47]
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { LudoMatchState, LudoPiece, LudoRollResponse, LudoMoveResponse, BtaWinner } from "@/lib/api";
import { Loader2, Trophy, XCircle, Star, Home, RotateCcw } from "lucide-react";

// ── Constants ──────────────────────────────────────────────────────────────────
const SAFE_SQUARES = new Set([0, 8, 13, 21, 26, 34, 39, 47]);
const POLL_MS = 3000;

// Board dimensions for the visual grid (15×15 like standard Ludo)
const CELL = 28; // px per cell
const COLS = 15;
const ROWS = 15;

type Side = "player" | "admin";

// ── Board coordinate mapping ───────────────────────────────────────────────────
// Maps absolute track positions (0–51) to [col, row] on a 15×15 grid.
// Standard Ludo layout, green (player) starts at col 1, row 6 (square 0).
// Red (admin) starts at col 8, row 13 (square 26).
const TRACK_COORDS: [number, number][] = [
  // Bottom-left leg (squares 0–5): going right along row 12
  [1,12],[2,12],[3,12],[4,12],[5,12],[6,12],
  // Up leg (6–11): col 6, going up
  [6,11],[6,10],[6,9],[6,8],[6,7],[6,6],
  // Top-left corner (12–13): turning right
  [6,5],[6,4],
  // Top leg (14–18): row 2, going right
  [6,3],[7,3],[8,3],
  // Right turn top (19–20): going right
  [8,4],[8,5],
  // Right leg down (21–25): col 8 going right
  [8,6],[9,6],[10,6],[11,6],[12,6],
  // Right side (26–30): col 13 going down
  [13,6],[13,7],[13,8],[13,9],[13,10],[13,11],
  // Bottom-right corner (31–33): going left
  [13,12],[13,13],[8,13],
  // Bottom leg (34–38): row 8, going left
  [8,13],[7,13],[6,13],[5,13],[4,13],
  // Left turn (39–43): going left then up
  [3,13],[2,13],[1,13],[1,12],[1,11],
  // Left leg (44–51): col 1 going up, then turns
  [1,10],[1,9],[1,8],[1,7],[1,6],[1,5],[1,4],[1,3],
] as [number, number][];

// Home column coords for player (green): col 7, rows 11→7
const PLAYER_HOME_COL: [number, number][] = [
  [7,11],[7,10],[7,9],[7,8],[7,7]
];
// Home column coords for admin (red): col 7, rows 3→7
const ADMIN_HOME_COL: [number, number][] = [
  [7,3],[7,4],[7,5],[7,6],[7,7]
];
// Home centre
const HOME_COORD: [number, number] = [7, 7];

// Yard positions (visual) for each piece
const PLAYER_YARD: [number, number][] = [[2,10],[3,10],[2,11],[3,11]];
const ADMIN_YARD: [number, number][]  = [[11,3],[12,3],[11,4],[12,4]];

function getPieceCoord(piece: LudoPiece, side: Side): [number, number] {
  const { position } = piece;
  if (position === -1) {
    const idx = parseInt(piece.id.slice(1));
    return side === "player" ? PLAYER_YARD[idx] : ADMIN_YARD[idx];
  }
  if (position === 57) return HOME_COORD;
  if (position >= 52 && position <= 56) {
    const col = side === "player" ? PLAYER_HOME_COL : ADMIN_HOME_COL;
    return col[position - 52] ?? HOME_COORD;
  }
  return TRACK_COORDS[position % 52] ?? [0, 0];
}

// ── Dice face component ────────────────────────────────────────────────────────
function DiceFace({ value, rolling }: { value: number | null; rolling: boolean }) {
  const dots: Record<number, [number, number][]> = {
    1: [[50, 50]],
    2: [[25, 25], [75, 75]],
    3: [[25, 25], [50, 50], [75, 75]],
    4: [[25, 25], [75, 25], [25, 75], [75, 75]],
    5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
    6: [[25, 20], [75, 20], [25, 50], [75, 50], [25, 80], [75, 80]],
  };
  return (
    <motion.div
      animate={rolling ? { rotate: [0, 180, 360], scale: [1, 1.2, 1] } : {}}
      transition={{ duration: 0.4 }}
      style={{ width: 44, height: 44, borderRadius: 8, backgroundColor: "var(--bg-card)",
        border: "2px solid var(--border-subtle)", position: "relative", flexShrink: 0 }}>
      {value !== null && dots[value]?.map(([x, y], i) => (
        <div key={i} style={{
          position: "absolute", width: 7, height: 7, borderRadius: "50%",
          backgroundColor: value === 6 ? "var(--accent-indigo)" : "var(--text-primary)",
          left: `calc(${x}% - 3.5px)`, top: `calc(${y}% - 3.5px)`,
        }} />
      ))}
      {value === null && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>—</span>
      </div>}
    </motion.div>
  );
}

// ── Board renderer ─────────────────────────────────────────────────────────────
function LudoBoard({
  matchState,
  myRole,
  movablePieces,
  selectedPiece,
  onSelectPiece,
  capturedPieceId,
}: {
  matchState: LudoMatchState;
  myRole: Side;
  movablePieces: string[];
  selectedPiece: string | null;
  onSelectPiece: (id: string) => void;
  capturedPieceId: string | null;
}) {
  const allPieces = [
    ...matchState.player_pieces.map(p => ({ ...p, side: "player" as Side })),
    ...matchState.admin_pieces.map(p => ({ ...p, side: "admin" as Side })),
  ];

  return (
    <div style={{ position: "relative", width: CELL * COLS, height: CELL * ROWS,
      borderRadius: 12, overflow: "hidden", border: "1px solid var(--border-hairline)",
      backgroundColor: "#1a1a2e", flexShrink: 0, margin: "0 auto" }}>

      {/* Track squares */}
      {TRACK_COORDS.map(([col, row], pos) => {
        const isSafe = SAFE_SQUARES.has(pos);
        const isPlayerStart = pos === 0;
        const isAdminStart = pos === 26;
        return (
          <div key={pos} style={{
            position: "absolute",
            left: col * CELL, top: row * CELL,
            width: CELL, height: CELL,
            border: "0.5px solid rgba(255,255,255,0.06)",
            backgroundColor: isSafe ? "rgba(255,215,0,0.08)"
              : isPlayerStart ? "rgba(74,222,128,0.12)"
              : isAdminStart ? "rgba(248,113,113,0.12)"
              : "rgba(255,255,255,0.02)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {isSafe && <Star size={8} style={{ color: "rgba(255,215,0,0.5)" }} />}
          </div>
        );
      })}

      {/* Player home column (green) */}
      {PLAYER_HOME_COL.map(([col, row], i) => (
        <div key={`phc-${i}`} style={{
          position: "absolute", left: col * CELL, top: row * CELL,
          width: CELL, height: CELL,
          backgroundColor: "rgba(74,222,128,0.15)",
          border: "0.5px solid rgba(74,222,128,0.2)",
        }} />
      ))}

      {/* Admin home column (red) */}
      {ADMIN_HOME_COL.map(([col, row], i) => (
        <div key={`ahc-${i}`} style={{
          position: "absolute", left: col * CELL, top: row * CELL,
          width: CELL, height: CELL,
          backgroundColor: "rgba(248,113,113,0.15)",
          border: "0.5px solid rgba(248,113,113,0.2)",
        }} />
      ))}

      {/* Home centre */}
      <div style={{
        position: "absolute", left: HOME_COORD[0] * CELL, top: HOME_COORD[1] * CELL,
        width: CELL, height: CELL,
        backgroundColor: "rgba(255,255,255,0.08)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Home size={10} style={{ color: "rgba(255,255,255,0.4)" }} />
      </div>

      {/* Player yard area */}
      <div style={{
        position: "absolute", left: 0, top: 7 * CELL,
        width: 6 * CELL, height: 6 * CELL,
        backgroundColor: "rgba(74,222,128,0.04)",
        border: "0.5px solid rgba(74,222,128,0.12)",
        borderRadius: 4,
      }} />

      {/* Admin yard area */}
      <div style={{
        position: "absolute", left: 9 * CELL, top: 0,
        width: 6 * CELL, height: 6 * CELL,
        backgroundColor: "rgba(248,113,113,0.04)",
        border: "0.5px solid rgba(248,113,113,0.12)",
        borderRadius: 4,
      }} />

      {/* Pieces */}
      <AnimatePresence>
        {allPieces.map((piece) => {
          const [col, row] = getPieceCoord(piece, piece.side);
          const isMovable = movablePieces.includes(piece.id);
          const isSelected = selectedPiece === piece.id;
          const isCaptured = capturedPieceId === piece.id;
          const isMyPiece = piece.side === myRole;
          const isFinished = piece.position === 57;
          const color = piece.side === "player" ? "#4ADE80" : "#f87171";
          const borderColor = isSelected ? "#fff"
            : isMovable && isMyPiece ? "#fbbf24"
            : color;

          return (
            <motion.div
              key={piece.id}
              layoutId={piece.id}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{
                opacity: isCaptured ? 0 : 1,
                scale: isSelected ? 1.3 : isMovable && isMyPiece ? 1.15 : 1,
                x: col * CELL + 4,
                y: row * CELL + 4,
              }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              onClick={() => isMovable && isMyPiece ? onSelectPiece(piece.id) : undefined}
              style={{
                position: "absolute", left: 0, top: 0,
                width: CELL - 8, height: CELL - 8,
                borderRadius: "50%",
                backgroundColor: isFinished ? "rgba(255,215,0,0.9)" : color,
                border: `2px solid ${borderColor}`,
                cursor: isMovable && isMyPiece ? "pointer" : "default",
                boxShadow: isSelected
                  ? `0 0 12px ${color}`
                  : isMovable && isMyPiece
                  ? `0 0 8px #fbbf24`
                  : "none",
                display: "flex", alignItems: "center", justifyContent: "center",
                zIndex: isSelected ? 20 : isMovable ? 10 : 5,
              }}>
              <span style={{ fontSize: 7, fontWeight: 900, color: "#000", lineHeight: 1 }}>
                {piece.id.toUpperCase()}
              </span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

// ── Main LudoMatch controller ──────────────────────────────────────────────────
export interface LudoMatchProps {
  matchId: string;
  myRole: Side;                    // "player" or "admin"
  stake: number;
  rollDice: (matchId: string) => Promise<LudoRollResponse>;
  movePiece: (matchId: string, pieceId: string) => Promise<LudoMoveResponse>;
  getMatchState: (matchId: string) => Promise<LudoMatchState>;
  onMatchComplete: (winner: BtaWinner, payout: number) => void;
}

export function LudoMatch({
  matchId, myRole, stake,
  rollDice, movePiece, getMatchState,
  onMatchComplete,
}: LudoMatchProps) {
  const [matchState, setMatchState] = useState<LudoMatchState | null>(null);
  const [rolling, setRolling] = useState(false);
  const [moving, setMoving] = useState(false);
  const [selectedPiece, setSelectedPiece] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [capturedPieceId, setCapturedPieceId] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedRef = useRef(false);

  // Show temporary feedback message
  const flash = useCallback((msg: string, ms = 2500) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), ms);
  }, []);

  // Poll match state (for opponent's moves)
  const poll = useCallback(async () => {
    try {
      const state = await getMatchState(matchId);
      setMatchState(state);
      if (state.status === "completed" && state.winner && !completedRef.current) {
        completedRef.current = true;
        clearInterval(pollRef.current!);
        setTimeout(() => onMatchComplete(state.winner!, state.payout), 1500);
      }
    } catch { /* silent */ }
  }, [matchId, getMatchState, onMatchComplete]);

  // Initial load + start polling
  useEffect(() => {
    poll();
    pollRef.current = setInterval(poll, POLL_MS);
    return () => { clearInterval(pollRef.current!); };
  }, [poll]);

  // Auto-advance when must_pass
  useEffect(() => {
    if (matchState?.must_pass && matchState.current_turn === myRole) {
      flash("No valid moves — turn passes automatically");
      // Poll immediately to get updated state after server auto-passes
      setTimeout(poll, 1200);
    }
  }, [matchState?.must_pass, matchState?.current_turn, myRole, flash, poll]);

  const handleRoll = async () => {
    if (!matchState || rolling) return;
    setRolling(true); setErr("");
    try {
      const res = await rollDice(matchId);
      setMatchState(prev => prev ? {
        ...prev,
        dice_value: res.dice_value,
        dice_rolled: true,
        movable_pieces: res.movable_pieces,
        must_pass: res.must_pass,
        consecutive_sixes: res.consecutive_sixes,
      } : prev);
      if (res.extra_turn) flash(`🎲 Rolled a ${res.dice_value} — roll again after moving!`);
      if (res.must_pass) flash("No valid moves — turn passes");
    } catch (e: any) {
      const code = e?.code ?? "";
      if (code === "WRONG_TURN") setErr("It's not your turn.");
      else if (code === "ALREADY_ROLLED") setErr("Already rolled — pick a piece to move.");
      else setErr(e?.message ?? "Roll failed");
    } finally { setRolling(false); }
  };

  const handleMove = async (pieceId: string) => {
    if (!matchState || moving) return;
    setMoving(true); setErr(""); setSelectedPiece(null);
    try {
      const res = await movePiece(matchId, pieceId);

      // Animate capture
      if (res.captured && res.captured_piece_id) {
        setCapturedPieceId(res.captured_piece_id);
        setTimeout(() => setCapturedPieceId(null), 700);
        flash(`💥 Captured ${res.captured_piece_id.toUpperCase()}!`);
      }
      if (res.reached_home) flash("🏠 Piece reached home!");
      if (res.extra_turn) flash(`🎲 Extra turn — roll again!`);

      // Update board state from response
      setMatchState(prev => prev ? {
        ...prev,
        ...res.board,
        current_turn: res.current_turn,
        status: res.match_resolved ? "completed" : "in_progress",
        winner: res.match_winner,
        pieces_home_count: res.pieces_home_count,
      } : prev);

      if (res.match_resolved && res.match_winner && !completedRef.current) {
        completedRef.current = true;
        clearInterval(pollRef.current!);
        setTimeout(() => onMatchComplete(res.match_winner!, matchState.payout), 1500);
      }
    } catch (e: any) {
      const code = e?.code ?? "";
      if (code === "INVALID_MOVE") setErr("That piece can't move with the current dice value.");
      else if (code === "DICE_NOT_ROLLED") setErr("Roll the dice first.");
      else if (code === "WRONG_TURN") setErr("It's not your turn.");
      else setErr(e?.message ?? "Move failed");
    } finally { setMoving(false); }
  };

  if (!matchState) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
        <Loader2 size={24} className="animate-spin" style={{ color: "var(--accent-indigo)" }} />
      </div>
    );
  }

  const isMyTurn = matchState.current_turn === myRole;
  const canRoll = isMyTurn && !matchState.dice_rolled && !rolling && !moving;
  const canMove = isMyTurn && matchState.dice_rolled && !matchState.must_pass;
  const opponentLabel = myRole === "player" ? "Admin" : "Player";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* Progress bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 14px", borderRadius: 10, backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border-hairline)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#4ADE80", display: "inline-block" }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: "#4ADE80" }}>
            {myRole === "player" ? "You" : "Player"}: {matchState.pieces_home_count.player}/4 home
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
            {isMyTurn ? "🟢 Your turn" : `⏳ ${opponentLabel}'s turn`}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#f87171" }}>
            {myRole === "player" ? "Admin" : "You"}: {matchState.pieces_home_count.admin}/4 home
          </span>
          <span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#f87171", display: "inline-block" }} />
        </div>
      </div>

      {/* Board */}
      <div style={{ overflowX: "auto" }}>
        <LudoBoard
          matchState={matchState}
          myRole={myRole}
          movablePieces={canMove ? matchState.movable_pieces : []}
          selectedPiece={selectedPiece}
          onSelectPiece={(id) => {
            setSelectedPiece(id);
            handleMove(id);
          }}
          capturedPieceId={capturedPieceId}
        />
      </div>

      {/* Controls row */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* Dice */}
        <DiceFace value={matchState.dice_value} rolling={rolling} />

        {/* Roll button */}
        <button
          onClick={handleRoll}
          disabled={!canRoll}
          style={{ flex: 1, padding: "12px 0", borderRadius: 10, border: "none",
            fontWeight: 800, fontSize: 14,
            backgroundColor: canRoll ? "var(--accent-indigo)" : "var(--bg-card)",
            color: canRoll ? "#fff" : "var(--text-muted)",
            cursor: canRoll ? "pointer" : "not-allowed",
            opacity: canRoll ? 1 : 0.5,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          {rolling && <Loader2 size={14} className="animate-spin" />}
          {rolling ? "Rolling…"
            : !isMyTurn ? `${opponentLabel}'s turn`
            : matchState.dice_rolled ? (canMove ? "Pick a piece →" : "Turn passes…")
            : "🎲 Roll Dice"}
        </button>
      </div>

      {/* Feedback / status messages */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            key="feedback"
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ borderRadius: 8, padding: "10px 14px", fontSize: 13, fontWeight: 600,
              textAlign: "center", backgroundColor: "rgba(76,111,255,0.08)",
              border: "1px solid rgba(76,111,255,0.2)", color: "var(--accent-indigo)" }}>
            {feedback}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      {err && (
        <div style={{ borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#f87171",
          backgroundColor: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)" }}>
          {err}
          <button onClick={() => setErr("")} style={{ float: "right", background: "none", border: "none",
            cursor: "pointer", color: "#f87171", fontWeight: 700 }}>✕</button>
        </div>
      )}

      {/* Movable piece hint */}
      {canMove && matchState.movable_pieces.length > 0 && (
        <div style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "center" }}>
          Tap a highlighted piece (
          {matchState.movable_pieces.map(id => id.toUpperCase()).join(", ")}
          ) to move
        </div>
      )}

      {/* Waiting for opponent */}
      {!isMyTurn && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          padding: "10px 0", fontSize: 12, color: "var(--text-muted)" }}>
          <Loader2 size={12} className="animate-spin" />
          Waiting for {opponentLabel}…
        </div>
      )}
    </div>
  );
}
