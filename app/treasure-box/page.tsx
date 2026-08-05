"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/context/AppContext";
import {
  treasureBoxApi,
  ApiError,
  type TreasureBox,
  type TbAvailableResponse,
  type TbClaimResponse,
  type TbPopResponse,
  type TbBoxState,
  type TbHistoryEntry,
} from "@/lib/api";
import { Trophy, XCircle, Loader2, AlertCircle, RefreshCw } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type Phase = "list" | "play" | "result";

interface PlayState {
  boxId: string;
  totalSlots: number;
  popLimit: number;
  payoutMultiplier: number;
  stake: number;
  popsRemaining: number;
}

interface ResultState {
  outcome: "won" | "lost";
  payout: number;
  newBalance: number;
  treasureSlotIndex?: number;
  stake: number;
  payoutMultiplier: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(n: number) {
  return n.toLocaleString("en-NG");
}

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

// ─── History Row ──────────────────────────────────────────────────────────────
function HistoryRow({ entry }: { entry: TbHistoryEntry }) {
  const inProgress = entry.status === "claimed" && !entry.completed_at;
  const chipColor = entry.outcome === "won"
    ? { bg: "rgba(255,184,77,0.12)", color: "#FFB84D" }
    : inProgress
      ? { bg: "rgba(99,102,241,0.12)", color: "#818CF8" }
      : { bg: "rgba(248,113,113,0.1)", color: "#f87171" };
  const chipLabel = entry.outcome === "won" ? "Won" : inProgress ? "In Progress" : "Lost";

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12, padding: "12px 0",
      borderBottom: "1px solid rgba(255,255,255,0.04)",
    }}>
      <span style={{
        fontSize: 10, fontWeight: 700, letterSpacing: "0.04em",
        padding: "3px 8px", borderRadius: 100,
        backgroundColor: chipColor.bg, color: chipColor.color, flexShrink: 0,
      }}>
        {chipLabel}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
          ₦{fmt(entry.stake)} staked
          {entry.outcome === "won" && entry.payout != null && (
            <span style={{ color: "#FFB84D", marginLeft: 6 }}>+₦{fmt(entry.payout)}</span>
          )}
        </p>
        <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "2px 0 0" }}>
          {entry.pop_limit} pops · {entry.payout_multiplier}x
          {entry.claimed_at && <span> · {fmtDate(entry.claimed_at)}</span>}
        </p>
      </div>
    </div>
  );
}

// ─── Box Card (list phase) ────────────────────────────────────────────────────
function BoxCard({
  box,
  selected,
  onSelect,
}: {
  box: TreasureBox;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.985 }}
      onClick={onSelect}
      style={{
        borderRadius: 18,
        padding: "16px",
        marginBottom: 10,
        background: selected
          ? "linear-gradient(180deg, rgba(255,184,77,0.1) 0%, rgba(255,184,77,0.04) 100%)"
          : "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, transparent 35%), #13151D",
        boxShadow: selected
          ? "0 0 0 1.5px rgba(255,184,77,0.5), 0 16px 32px -12px rgba(0,0,0,0.7)"
          : "0 1px 0 rgba(255,255,255,0.07) inset, 0 16px 32px -12px rgba(0,0,0,0.7)",
        border: selected ? "1px solid rgba(255,184,77,0.35)" : "1px solid rgba(255,255,255,0.04)",
        display: "flex",
        alignItems: "center",
        gap: 14,
        cursor: "pointer",
        transition: "all 0.18s ease",
      }}
    >
      <div style={{ fontSize: 28 }}>🎁</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: 20, fontWeight: 900, fontFamily: "'JetBrains Mono', monospace",
          background: "linear-gradient(180deg,#FFD08A,#FFB84D 60%)",
          WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent",
          margin: "0 0 3px", lineHeight: 1,
        }}>
          {box.payout_multiplier}x
        </p>
        <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>
          {box.total_slots} slots · {box.pop_limit} pops
        </p>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
        style={{
          padding: "8px 16px", borderRadius: 10, border: "none",
          background: selected ? "linear-gradient(135deg,#FFB84D,#B87A17)" : "rgba(255,255,255,0.07)",
          color: selected ? "#08090D" : "var(--text-secondary)",
          fontSize: 12, fontWeight: 700, cursor: "pointer", flexShrink: 0,
        }}
      >
        {selected ? "Staking…" : "Claim"}
      </button>
    </motion.div>
  );
}

// ─── Stake Input Panel ────────────────────────────────────────────────────────
function StakePanel({
  box,
  minStake,
  maxStake,
  onClaim,
  onCancel,
}: {
  box: TreasureBox;
  minStake: number;
  maxStake: number;
  onClaim: (stake: number) => Promise<void>;
  onCancel: () => void;
}) {
  // Raw string state — lets player type freely, no mid-keystroke clamping
  const [rawStake, setRawStake] = useState(String(minStake));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const chips = [
    { label: "Min", value: minStake },
    { label: "25%", value: Math.floor(maxStake * 0.25) },
    { label: "50%", value: Math.floor(maxStake * 0.5) },
    { label: "Max", value: maxStake },
  ];

  // Parse for validation — NaN or empty = invalid
  const stakeNum = rawStake.trim() === "" ? NaN : Number(rawStake);
  const stakeValid = !isNaN(stakeNum) && stakeNum >= minStake && stakeNum <= maxStake;
  const outOfRange = !isNaN(stakeNum) && rawStake.trim() !== "" && !stakeValid;

  const handleClaim = async () => {
    if (busy || !stakeValid) return;
    setBusy(true);
    setErr("");
    try {
      await onClaim(stakeNum);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong");
      setBusy(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      style={{
        borderRadius: 16, padding: "18px 16px",
        background: "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, transparent 40%), #13151D",
        border: "1px solid rgba(255,184,77,0.2)", marginBottom: 16,
      }}
    >
      <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-secondary)", margin: "0 0 12px" }}>
        Set your stake for this box
      </p>

      {/* Quick chips — tap fills input and player can edit further */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        {chips.map((c) => (
          <button
            key={c.label}
            onClick={() => setRawStake(String(c.value))}
            style={{
              padding: "6px 12px", borderRadius: 8, border: "none",
              background: rawStake === String(c.value) ? "rgba(255,184,77,0.2)" : "rgba(255,255,255,0.06)",
              color: rawStake === String(c.value) ? "#FFB84D" : "var(--text-muted)",
              fontSize: 11, fontWeight: 700, cursor: "pointer",
            }}
          >
            {c.label} ₦{fmt(c.value)}
          </button>
        ))}
      </div>

      {/* Fully free-type text input — player can clear and type any number */}
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={rawStake}
        placeholder={`e.g. ${minStake}`}
        onChange={(e) => {
          // Only allow digits and one optional leading zero
          const raw = e.target.value.replace(/[^0-9]/g, "");
          setRawStake(raw);
        }}
        style={{
          width: "100%", padding: "12px 14px", borderRadius: 10,
          border: `1px solid ${outOfRange ? "rgba(239,68,68,0.45)" : "rgba(255,255,255,0.12)"}`,
          backgroundColor: "rgba(255,255,255,0.05)", color: "var(--text-primary)",
          fontSize: 16, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700,
          outline: "none", boxSizing: "border-box", marginBottom: 4,
        }}
      />

      {/* Range hint / inline validation */}
      <p style={{ fontSize: 10, margin: "0 0 10px", color: outOfRange ? "#f87171" : "var(--text-muted)" }}>
        {outOfRange
          ? `Must be between ₦${fmt(minStake)} and ₦${fmt(maxStake)}`
          : `Min ₦${fmt(minStake)} · Max ₦${fmt(maxStake)}`}
      </p>

      {/* Payout preview — only shown when valid */}
      {stakeValid && (
        <p style={{ fontSize: 12, color: "rgba(255,184,77,0.7)", margin: "0 0 14px" }}>
          If you find the treasure:{" "}
          <strong style={{ color: "#FFB84D" }}>₦{fmt(stakeNum * box.payout_multiplier)}</strong>
        </p>
      )}

      {/* Claim error */}
      {err && (
        <div style={{
          display: "flex", alignItems: "flex-start", gap: 8, padding: "10px 12px",
          borderRadius: 10, marginBottom: 12,
          backgroundColor: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)",
          color: "#f87171", fontSize: 12,
        }}>
          <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} /> {err}
        </div>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={onCancel}
          style={{
            flex: "0 0 auto", padding: "12px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)",
            background: "none", color: "var(--text-muted)", fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleClaim}
          disabled={busy || !stakeValid}
          style={{
            flex: 1, padding: "12px 0", borderRadius: 12, border: "none",
            background: stakeValid ? "linear-gradient(135deg,#FFB84D,#B87A17)" : "rgba(255,255,255,0.06)",
            color: stakeValid ? "#08090D" : "var(--text-muted)", fontSize: 14, fontWeight: 800,
            cursor: busy || !stakeValid ? "not-allowed" : "pointer", opacity: busy ? 0.7 : 1,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}
        >
          {busy ? <Loader2 size={16} className="animate-spin" /> : null}
          {busy ? "Claiming…" : "Claim & Play →"}
        </button>
      </div>
    </motion.div>
  );
}

// ─── Slot Cell (play + result phase) ─────────────────────────────────────────
function SlotCell({
  index,
  state: cellState,
  isPending,
  isDisabled,
  isTreasureReveal,
  onTap,
}: {
  index: number;
  state: "unpopped" | "empty" | "treasure";
  isPending: boolean;
  isDisabled: boolean;
  isTreasureReveal: boolean;
  onTap: () => void;
}) {
  let bg = "rgba(255,255,255,0.05)";
  let border = "1px solid rgba(255,255,255,0.07)";
  let emoji = "🎁";
  let opacity = 1;

  if (isPending) {
    bg = "rgba(255,184,77,0.08)";
    border = "1px solid rgba(255,184,77,0.2)";
    emoji = "…";
  } else if (cellState === "treasure" || isTreasureReveal) {
    bg = "rgba(255,184,77,0.15)";
    border = "1px solid rgba(255,184,77,0.5)";
    emoji = "💰";
  } else if (cellState === "empty") {
    bg = "rgba(255,255,255,0.03)";
    border = "1px solid rgba(255,255,255,0.04)";
    emoji = "💨";
    opacity = 0.55;
  }

  if (isDisabled && cellState === "unpopped" && !isTreasureReveal && !isPending) {
    opacity = 0.35;
  }

  return (
    <motion.button
      initial={false}
      animate={{ scale: cellState !== "unpopped" || isPending ? [1, 1.12, 1] : 1 }}
      transition={{ duration: 0.25 }}
      onClick={isDisabled ? undefined : onTap}
      disabled={isDisabled}
      style={{
        width: "100%", aspectRatio: "1", borderRadius: 10,
        background: bg, border,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 20, cursor: isDisabled ? "default" : "pointer",
        opacity, transition: "background 0.2s, border 0.2s, opacity 0.2s",
        boxShadow: (cellState === "treasure" || isTreasureReveal)
          ? "0 0 12px rgba(255,184,77,0.35)" : "none",
      }}
    >
      {isPending ? <Loader2 size={16} style={{ color: "#FFB84D" }} className="animate-spin" /> : emoji}
    </motion.button>
  );
}

// ─── Slot Grid ────────────────────────────────────────────────────────────────
function SlotGrid({
  totalSlots,
  poppedSlots,
  pendingSlot,
  gameOver,
  treasureSlotIndex,
  onPop,
}: {
  totalSlots: number;
  poppedSlots: Map<number, "empty" | "treasure">;
  pendingSlot: number | null;
  gameOver: boolean;
  treasureSlotIndex?: number;
  onPop: (index: number) => void;
}) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(64px, 1fr))",
      gap: 8,
    }}>
      {Array.from({ length: totalSlots }, (_, i) => {
        const popped = poppedSlots.get(i);
        const isPending = pendingSlot === i;
        const cellState: "unpopped" | "empty" | "treasure" = popped ?? "unpopped";
        const isDisabled =
          gameOver ||
          popped !== undefined ||
          pendingSlot !== null;
        const isTreasureReveal = gameOver && treasureSlotIndex === i && cellState !== "treasure";

        return (
          <SlotCell
            key={i}
            index={i}
            state={cellState}
            isPending={isPending}
            isDisabled={isDisabled}
            isTreasureReveal={isTreasureReveal}
            onTap={() => onPop(i)}
          />
        );
      })}
    </div>
  );
}

// ─── Filtered Box List with multiplier chips ─────────────────────────────────
function FilteredBoxList({
  boxes, multipliers, hasMultipleConfigs,
  selectedBox, onSelect, minStake, maxStake, onClaim, onCancel,
}: {
  boxes: TreasureBox[];
  multipliers: number[];
  hasMultipleConfigs: boolean;
  selectedBox: TreasureBox | null;
  onSelect: (box: TreasureBox) => void;
  minStake: number;
  maxStake: number;
  onClaim: (boxId: string, stake: number) => Promise<void>;
  onCancel: () => void;
}) {
  const [activeMultiplier, setActiveMultiplier] = useState<number | null>(null);

  // Default to first (highest) multiplier on first render when chips are shown
  useEffect(() => {
    if (hasMultipleConfigs && multipliers.length > 0) {
      setActiveMultiplier(multipliers[0]);
    }
  }, [hasMultipleConfigs, multipliers]);

  const filtered = hasMultipleConfigs && activeMultiplier !== null
    ? boxes.filter((b) => b.payout_multiplier === activeMultiplier)
    : boxes;

  return (
    <>
      {/* Filter chips — only shown when more than one multiplier exists */}
      {hasMultipleConfigs && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
          {multipliers.map((m) => {
            const isActive = activeMultiplier === m;
            const count = boxes.filter((b) => b.payout_multiplier === m).length;
            return (
              <button
                key={m}
                onClick={() => setActiveMultiplier(m)}
                style={{
                  padding: "6px 12px", borderRadius: 100, border: "none", cursor: "pointer",
                  fontSize: 12, fontWeight: 700, transition: "all 0.15s",
                  background: isActive
                    ? "linear-gradient(135deg,#FFB84D,#B87A17)"
                    : "rgba(255,255,255,0.06)",
                  color: isActive ? "#08090D" : "var(--text-muted)",
                  boxShadow: isActive ? "0 2px 8px rgba(255,184,77,0.25)" : "none",
                }}
              >
                {m}x{count > 1 ? ` (${count})` : ""}
              </button>
            );
          })}
        </div>
      )}

      {/* Box list */}
      {filtered.map((box) => (
        <div key={box.id}>
          <BoxCard
            box={box}
            selected={selectedBox?.id === box.id}
            onSelect={() => onSelect(box)}
          />
          <AnimatePresence>
            {selectedBox?.id === box.id && (
              <StakePanel
                box={box}
                minStake={minStake}
                maxStake={maxStake}
                onClaim={(stake) => onClaim(box.id, stake)}
                onCancel={onCancel}
              />
            )}
          </AnimatePresence>
        </div>
      ))}
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TreasureBoxPage() {
  const router = useRouter();
  const { state: appState, dispatch } = useApp();

  // ── Phase state
  const [phase, setPhase] = useState<Phase>("list");

  // ── List phase state
  const [availability, setAvailability] = useState<TbAvailableResponse | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [selectedBox, setSelectedBox] = useState<TreasureBox | null>(null);

  // ── Play phase state
  const [playState, setPlayState] = useState<PlayState | null>(null);
  const [poppedSlots, setPoppedSlots] = useState<Map<number, "empty" | "treasure">>(new Map());
  const [pendingSlot, setPendingSlot] = useState<number | null>(null);
  const [popError, setPopError] = useState("");

  // ── Result phase state
  const [resultState, setResultState] = useState<ResultState | null>(null);

  // ── History state
  const [history, setHistory] = useState<TbHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  // ── Auth guard
  useEffect(() => {
    if (!appState.isAuthenticated) router.push("/auth");
  }, [appState.isAuthenticated, router]);

  // ── Load available boxes + history on mount
  const loadAvailable = useCallback(() => {
    setListLoading(true);
    setListError("");
    treasureBoxApi.getAvailable()
      .then((res) => setAvailability(res))
      .catch((e) => setListError(e instanceof ApiError ? e.message : "Failed to load boxes"))
      .finally(() => setListLoading(false));
  }, []);

  useEffect(() => {
    if (!appState.isAuthenticated) return;
    loadAvailable();
    treasureBoxApi.getHistory()
      .then((res) => setHistory(res.history))
      .catch(() => {/* silent */})
      .finally(() => setHistoryLoading(false));
  }, [appState.isAuthenticated, loadAvailable]);

  // ── Claim handler
  const handleClaim = async (boxId: string, stake: number) => {
    try {
      const res = await treasureBoxApi.claimBox(boxId, stake);
      const claim: TbClaimResponse = res;

      // Update balance in global state
      dispatch({
        type: "UPDATE_BALANCE",
        balance: claim.new_balance,
        bonus_balance: claim.new_bonus_balance,
      } as any);

      // Transition to play
      setPlayState({
        boxId: claim.box_id,
        totalSlots: claim.total_slots,
        popLimit: claim.pop_limit,
        payoutMultiplier: claim.payout_multiplier,
        stake: claim.stake,
        popsRemaining: claim.pops_remaining,
      });
      setPoppedSlots(new Map());
      setPendingSlot(null);
      setPhase("play");
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.code === "BOX_ALREADY_CLAIMED") {
          loadAvailable();
          setSelectedBox(null);
          throw new Error("This box was just claimed by another player. Choose a different one.");
        }
        if (e.code === "STAKE_OUT_OF_RANGE") throw new Error(e.message);
        if (e.code === "FEATURE_UNAVAILABLE") throw new Error("Treasure Box is currently unavailable.");
        if (e.status === 402) throw new Error("Insufficient balance. Top up your wallet.");
      }
      throw e;
    }
  };

  // ── Resume in-progress game on play phase mount
  useEffect(() => {
    if (phase !== "play" || !playState) return;
    treasureBoxApi.getBoxState(playState.boxId)
      .then((res) => {
        const s: TbBoxState = res;
        // Reconstruct poppedSlots from pops history
        const rebuilt = new Map<number, "empty" | "treasure">();
        for (const pop of s.pops) {
          rebuilt.set(pop.slot_index, pop.was_treasure ? "treasure" : "empty");
        }
        setPoppedSlots(rebuilt);
        setPlayState((prev) => prev ? { ...prev, popsRemaining: s.pops_remaining } : prev);
        if (s.game_over) {
          setResultState({
            outcome: s.outcome ?? "lost",
            payout: s.payout ?? 0,
            newBalance: appState.player?.balance ?? 0,
            treasureSlotIndex: s.treasure_slot_index,
            stake: s.stake,
            payoutMultiplier: s.payout_multiplier,
          });
          setPhase("result");
        }
      })
      .catch(() => {/* non-fatal — game state from claim response is used */});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, playState?.boxId]);

  // ── Pop handler
  const handlePop = async (slotIndex: number) => {
    if (!playState || pendingSlot !== null) return;
    setPendingSlot(slotIndex);
    setPopError("");
    try {
      const res = await treasureBoxApi.popSlot(playState.boxId, slotIndex);
      const pop: TbPopResponse = res;

      setPoppedSlots((prev) => {
        const next = new Map(prev);
        next.set(slotIndex, pop.was_treasure ? "treasure" : "empty");
        return next;
      });
      setPendingSlot(null);

      if (pop.game_over) {
        // Update balance if provided
        if (pop.new_balance !== undefined) {
          dispatch({ type: "UPDATE_BALANCE", balance: pop.new_balance, bonus_balance: appState.player?.bonus_balance ?? 0 } as any);
        }
        setResultState({
          outcome: pop.outcome ?? "lost",
          payout: pop.payout ?? 0,
          newBalance: pop.new_balance ?? appState.player?.balance ?? 0,
          treasureSlotIndex: pop.treasure_slot_index,
          stake: playState.stake,
          payoutMultiplier: playState.payoutMultiplier,
        });
        setPhase("result");
      } else {
        setPlayState((prev) =>
          prev ? { ...prev, popsRemaining: pop.pops_remaining ?? prev.popsRemaining - 1 } : prev
        );
      }
    } catch (e) {
      setPendingSlot(null);
      if (e instanceof ApiError) {
        if (e.code === "SLOT_ALREADY_POPPED") return; // UI should prevent, ignore
        if (e.code === "POP_LIMIT_REACHED") {
          setResultState({
            outcome: "lost",
            payout: 0,
            newBalance: appState.player?.balance ?? 0,
            stake: playState.stake,
            payoutMultiplier: playState.payoutMultiplier,
          });
          setPhase("result");
          return;
        }
        if (e.code === "GAME_ALREADY_OVER") {
          // Re-sync with server
          treasureBoxApi.getBoxState(playState.boxId).then((r) => {
            const s = r;
            if (s.game_over) {
              setResultState({
                outcome: s.outcome ?? "lost",
                payout: s.payout ?? 0,
                newBalance: appState.player?.balance ?? 0,
                treasureSlotIndex: s.treasure_slot_index,
                stake: s.stake,
                payoutMultiplier: s.payout_multiplier,
              });
              setPhase("result");
            }
          }).catch(() => {});
          return;
        }
      }
      setPopError(e instanceof Error ? e.message : "Something went wrong. Try again.");
    }
  };

  // ── Reset to list phase
  const goToList = () => {
    setPhase("list");
    setSelectedBox(null);
    setPlayState(null);
    setPoppedSlots(new Map());
    setPendingSlot(null);
    setResultState(null);
    setPopError("");
    loadAvailable();
  };

  if (!appState.isAuthenticated) return null;

  // ─── RENDER ────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes tb-spin { to { transform: rotate(360deg); } }
        @keyframes tb-pulse { 0%,100% { opacity: 0.6; } 50% { opacity: 1; } }
      `}</style>

      <div style={{
        width: "100%", maxWidth: 480, margin: "0 auto",
        padding: "20px 16px 80px", boxSizing: "border-box",
        fontFamily: "'Inter', sans-serif",
      }}>

        {/* ── Page header */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-0.025em", color: "var(--text-primary)", margin: "0 0 4px" }}>
            Treasure Box
          </h1>
          <p style={{ fontSize: 12.5, color: "var(--text-muted)", margin: 0 }}>
            Pick a box, pop the slots, find the treasure.
          </p>
        </div>

        {/* ── Phase content */}
        <AnimatePresence mode="wait">

          {/* ════ LIST PHASE ════════════════════════════════════════════════ */}
          {phase === "list" && (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              {listLoading ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[1, 2, 3].map((i) => (
                    <div key={i} style={{ borderRadius: 18, height: 80, backgroundColor: "#12141B", animation: "tb-pulse 1.5s infinite" }} />
                  ))}
                </div>
              ) : listError ? (
                <div style={{
                  display: "flex", flexDirection: "column", alignItems: "center",
                  gap: 12, padding: "32px 0", textAlign: "center",
                }}>
                  <AlertCircle size={28} style={{ color: "#f87171" }} />
                  <p style={{ fontSize: 14, color: "#f87171", margin: 0 }}>{listError}</p>
                  <button onClick={loadAvailable} style={{
                    padding: "8px 18px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)",
                    background: "none", color: "var(--text-secondary)", fontSize: 13, cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 6,
                  }}>
                    <RefreshCw size={13} /> Retry
                  </button>
                </div>
              ) : !availability?.is_available || !availability?.boxes?.length ? (
                <div style={{
                  display: "flex", flexDirection: "column", alignItems: "center",
                  justifyContent: "center", minHeight: "40vh", textAlign: "center", gap: 12,
                }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: 16,
                    backgroundColor: "rgba(255,184,77,0.07)", border: "1px solid rgba(255,184,77,0.12)",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28,
                  }}>🎁</div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                    No boxes available right now
                  </p>
                  <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
                    Check back soon — new boxes drop regularly
                  </p>
                </div>
              ) : (
                <>
                  {(() => {
                    const boxes = availability.boxes;
                    // Derive distinct multipliers, sorted descending
                    const multipliers = Array.from(
                      new Set(boxes.map((b) => b.payout_multiplier))
                    ).sort((a, b) => b - a);
                    const hasMultipleConfigs = multipliers.length > 1;

                    return (
                      <FilteredBoxList
                        boxes={boxes}
                        multipliers={multipliers}
                        hasMultipleConfigs={hasMultipleConfigs}
                        selectedBox={selectedBox}
                        onSelect={(box) => setSelectedBox(box)}
                        minStake={availability.min_stake}
                        maxStake={availability.max_stake}
                        onClaim={(boxId, stake) => handleClaim(boxId, stake)}
                        onCancel={() => setSelectedBox(null)}
                      />
                    );
                  })()}
                </>
              )}
            </motion.div>
          )}

          {/* ════ PLAY PHASE ════════════════════════════════════════════════ */}
          {phase === "play" && playState && (
            <motion.div
              key="play"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              {/* Header strip */}
              <div style={{
                display: "flex", gap: 0, marginBottom: 16, borderRadius: 14,
                overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)",
              }}>
                {[
                  { label: "Stake", value: `₦${fmt(playState.stake)}` },
                  { label: "Pops left", value: String(playState.popsRemaining) },
                  { label: "Potential", value: `₦${fmt(playState.stake * playState.payoutMultiplier)}` },
                ].map((item, i) => (
                  <div key={i} style={{
                    flex: 1, padding: "10px 8px", textAlign: "center",
                    backgroundColor: "rgba(255,255,255,0.03)",
                    borderRight: i < 2 ? "1px solid rgba(255,255,255,0.06)" : "none",
                  }}>
                    <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", margin: "0 0 3px" }}>
                      {item.label}
                    </p>
                    <p style={{ fontSize: 13, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: "var(--text-primary)", margin: 0 }}>
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Pop error */}
              {popError && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "10px 14px",
                  borderRadius: 10, marginBottom: 12,
                  backgroundColor: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)",
                  color: "#f87171", fontSize: 12,
                }}>
                  <AlertCircle size={13} style={{ flexShrink: 0 }} /> {popError}
                </div>
              )}

              {/* Grid */}
              <SlotGrid
                totalSlots={playState.totalSlots}
                poppedSlots={poppedSlots}
                pendingSlot={pendingSlot}
                gameOver={false}
                onPop={handlePop}
              />

              <p style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "center", marginTop: 16 }}>
                Tap a box to pop it. The treasure is hidden in one slot.
              </p>
            </motion.div>
          )}

          {/* ════ RESULT PHASE ══════════════════════════════════════════════ */}
          {phase === "result" && resultState && playState && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Outcome banner */}
              <div style={{
                borderRadius: 18, padding: "24px 20px", marginBottom: 16, textAlign: "center",
                background: resultState.outcome === "won"
                  ? "linear-gradient(180deg, rgba(255,184,77,0.12) 0%, rgba(255,184,77,0.04) 100%)"
                  : "linear-gradient(180deg, rgba(248,113,113,0.1) 0%, rgba(248,113,113,0.03) 100%)",
                border: resultState.outcome === "won"
                  ? "1px solid rgba(255,184,77,0.3)"
                  : "1px solid rgba(248,113,113,0.25)",
              }}>
                {resultState.outcome === "won" ? (
                  <>
                    <Trophy size={36} style={{ color: "#FFB84D", marginBottom: 10 }} />
                    <p style={{ fontSize: 20, fontWeight: 900, color: "var(--text-primary)", margin: "0 0 6px" }}>
                      You found it!
                    </p>
                    <p style={{
                      fontSize: 28, fontWeight: 900, fontFamily: "'JetBrains Mono', monospace",
                      background: "linear-gradient(180deg,#FFD08A,#FFB84D 60%)",
                      WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent",
                      margin: "0 0 8px",
                    }}>
                      +₦{fmt(resultState.payout)}
                    </p>
                    <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>
                      New balance: <strong style={{ color: "var(--text-primary)" }}>₦{fmt(resultState.newBalance)}</strong>
                    </p>
                  </>
                ) : (
                  <>
                    <XCircle size={36} style={{ color: "#f87171", marginBottom: 10 }} />
                    <p style={{ fontSize: 20, fontWeight: 900, color: "var(--text-primary)", margin: "0 0 6px" }}>
                      Better luck next time
                    </p>
                    {resultState.treasureSlotIndex !== undefined && (
                      <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>
                        The treasure was in slot <strong style={{ color: "#FFB84D" }}>#{resultState.treasureSlotIndex + 1}</strong>
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* Grid (frozen, treasure revealed) */}
              <SlotGrid
                totalSlots={playState.totalSlots}
                poppedSlots={poppedSlots}
                pendingSlot={null}
                gameOver={true}
                treasureSlotIndex={resultState.treasureSlotIndex}
                onPop={() => {}}
              />

              <button
                onClick={goToList}
                style={{
                  width: "100%", marginTop: 20, padding: "14px 0", borderRadius: 14, border: "none",
                  background: "linear-gradient(135deg,#FFB84D,#B87A17)",
                  color: "#08090D", fontSize: 15, fontWeight: 800, cursor: "pointer",
                }}
              >
                Play Another Box
              </button>
            </motion.div>
          )}

        </AnimatePresence>

        {/* ── History section (always visible) */}
        <div style={{ marginTop: 36 }}>
          <p style={{
            fontSize: 9.5, fontWeight: 700, letterSpacing: "0.13em", textTransform: "uppercase",
            color: "var(--text-muted)", margin: "0 0 4px",
          }}>
            Recent Games
          </p>
          {historyLoading ? (
            <div style={{ padding: "16px 0", display: "flex", alignItems: "center", gap: 8, color: "var(--text-muted)", fontSize: 12 }}>
              <Loader2 size={14} className="animate-spin" /> Loading history…
            </div>
          ) : history.length === 0 ? (
            <p style={{ fontSize: 12, color: "var(--text-muted)", padding: "12px 0" }}>
              No games played yet.
            </p>
          ) : (
            history.map((entry) => <HistoryRow key={entry.id} entry={entry} />)
          )}
        </div>

      </div>
    </>
  );
}
