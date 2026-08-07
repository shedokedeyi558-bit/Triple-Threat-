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
import { Trophy, XCircle, Loader2, AlertCircle, RefreshCw, Gem } from "lucide-react";

// ─── Design tokens ────────────────────────────────────────────────────────────
const GOLD      = "#FFB84D";
const GOLD_DIM  = "#B87A17";
const GOLD_GLOW = "rgba(255,184,77,0.35)";
const SURFACE   = "#13151D";
const S8  = 8;
const S12 = 12;
const S16 = 16;
const S24 = 24;
const S32 = 32;

// RTP bands (mirrors settings page logic)
function rtpBand(pwin: number, multiplier: number) {
  const rtp = pwin * multiplier * 100;
  if (rtp > 90) return { color: "#f87171", label: "High risk", bg: "rgba(248,113,113,0.15)" };
  if (rtp > 60) return { color: "#fbbf24", label: "Medium",    bg: "rgba(251,191,36,0.15)" };
  return            { color: "#4ade80",  label: "Safe",       bg: "rgba(74,222,128,0.12)" };
}

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
  treasureSlotIndexes?: number[];
  stake: number;
  payoutMultiplier: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(n: number) { return n.toLocaleString("en-NG"); }

function fmtDate(iso: string) {
  try { return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }); }
  catch { return iso; }
}

// ─── History Row ──────────────────────────────────────────────────────────────
function HistoryRow({ entry }: { entry: TbHistoryEntry }) {
  const inProgress = entry.status === "claimed" && !entry.completed_at;
  const won = entry.outcome === "won";
  const chip = won
    ? { bg: "rgba(255,184,77,0.12)", color: GOLD, label: "Won" }
    : inProgress
      ? { bg: "rgba(99,102,241,0.12)", color: "#818CF8", label: "In Progress" }
      : { bg: "rgba(248,113,113,0.08)", color: "#f87171", label: "Lost" };

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: S12, padding: "12px 0",
      borderBottom: "1px solid rgba(255,255,255,0.04)",
    }}>
      <span style={{
        fontSize: 10, fontWeight: 700, letterSpacing: "0.04em", whiteSpace: "nowrap",
        padding: "3px 8px", borderRadius: 100,
        backgroundColor: chip.bg, color: chip.color, flexShrink: 0,
      }}>{chip.label}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
          ₦{fmt(entry.stake)} staked
          {won && entry.payout != null && (
            <span style={{ color: GOLD, marginLeft: 6 }}>+₦{fmt(entry.payout)}</span>
          )}
        </p>
        <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "2px 0 0" }}>
          {entry.pop_limit} pops · {entry.payout_multiplier}×
          {entry.claimed_at && <> · {fmtDate(entry.claimed_at)}</>}
        </p>
      </div>
    </div>
  );
}

// ─── Box config card (multiplier selector) ───────────────────────────────────
function BoxConfigCard({
  box,
  isActive,
  count,
  onClick,
}: {
  box: TreasureBox;
  isActive: boolean;
  count: number;
  onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.93 }}
      style={{
        padding: "8px 14px",
        borderRadius: 100,
        border: isActive
          ? `2px solid ${GOLD}`
          : "1.5px solid rgba(255,255,255,0.1)",
        background: isActive
          ? `rgba(255,184,77,0.12)`
          : "rgba(255,255,255,0.04)",
        cursor: "pointer",
        transition: "all 0.15s ease",
        flexShrink: 0,
        display: "inline-flex", alignItems: "center", gap: 6,
        whiteSpace: "nowrap",
      }}
    >
      <span style={{
        fontSize: 14, fontWeight: 900, fontFamily: "'JetBrains Mono', monospace",
        color: isActive ? GOLD : "rgba(255,255,255,0.55)",
      }}>
        {box.payout_multiplier}×
      </span>
      {count > 1 && (
        <span style={{
          fontSize: 10, fontWeight: 600,
          color: isActive ? GOLD : "rgba(255,255,255,0.3)",
        }}>
          {count}
        </span>
      )}
    </motion.button>
  );
}

// ─── Box Card ─────────────────────────────────────────────────────────────────
function BoxCard({
  box, selected, onSelect,
}: { box: TreasureBox; selected: boolean; onSelect: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, boxShadow: `0 12px 32px -8px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,184,77,0.2)` }}
      whileTap={{ scale: 0.985 }}
      onClick={onSelect}
      style={{
        borderRadius: 18, padding: S16, marginBottom: S12,
        background: selected
          ? `linear-gradient(160deg, rgba(255,184,77,0.1) 0%, rgba(255,184,77,0.03) 100%), ${SURFACE}`
          : `linear-gradient(160deg, rgba(255,255,255,0.05) 0%, transparent 40%), ${SURFACE}`,
        border: selected
          ? `1px solid rgba(255,184,77,0.4)`
          : "1px solid rgba(255,255,255,0.05)",
        boxShadow: selected
          ? `0 0 0 2px rgba(255,184,77,0.15), 0 16px 40px -12px rgba(0,0,0,0.8)`
          : "0 1px 0 rgba(255,255,255,0.06) inset, 0 8px 24px -8px rgba(0,0,0,0.6)",
        display: "flex", alignItems: "center", gap: S16,
        cursor: "pointer", transition: "border 0.15s, box-shadow 0.15s",
      }}
    >
      {/* Chest icon */}
      <div style={{
        width: 48, height: 48, borderRadius: 14, flexShrink: 0,
        background: selected
          ? `linear-gradient(135deg, rgba(255,184,77,0.2), rgba(255,184,77,0.06))`
          : "rgba(255,255,255,0.04)",
        border: selected ? `1px solid rgba(255,184,77,0.3)` : "1px solid rgba(255,255,255,0.06)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 24, boxShadow: selected ? `0 0 12px ${GOLD_GLOW}` : "none",
        transition: "all 0.18s",
      }}>
        🎁
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: 22, fontWeight: 900, fontFamily: "'JetBrains Mono', monospace",
          color: GOLD,
          margin: 0, lineHeight: 1,
        }}>{box.payout_multiplier}×</p>
      </div>

      <motion.button
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
        whileTap={{ scale: 0.94 }}
        style={{
          padding: "9px 18px", borderRadius: 10, border: "none", flexShrink: 0,
          background: selected
            ? `linear-gradient(135deg, ${GOLD}, ${GOLD_DIM})`
            : "rgba(255,255,255,0.06)",
          color: selected ? "#08090D" : "var(--text-secondary)",
          fontSize: 12, fontWeight: 800, cursor: "pointer",
          boxShadow: selected ? `0 4px 14px rgba(255,184,77,0.3)` : "none",
          transition: "all 0.15s",
        }}
      >
        {selected ? "Selected" : "Select"}
      </motion.button>
    </motion.div>
  );
}

// ─── Stake Panel ──────────────────────────────────────────────────────────────
function StakePanel({
  box, minStake, maxStake, onClaim, onCancel,
}: {
  box: TreasureBox; minStake: number; maxStake: number;
  onClaim: (stake: number) => Promise<void>; onCancel: () => void;
}) {
  const [rawStake, setRawStake] = useState(String(minStake));
  const [focused, setFocused]   = useState(false);
  const [busy, setBusy]         = useState(false);
  const [err, setErr]           = useState("");

  const stakeNum   = rawStake.trim() === "" ? NaN : Number(rawStake);
  const stakeValid = !isNaN(stakeNum) && stakeNum >= minStake && stakeNum <= maxStake;
  const outOfRange = !isNaN(stakeNum) && rawStake.trim() !== "" && !stakeValid;
  const payout     = stakeValid ? stakeNum * box.payout_multiplier : null;

  const chips = [
    { label: "Min",  value: minStake },
    { label: "¼",    value: Math.floor(maxStake * 0.25) },
    { label: "½",    value: Math.floor(maxStake * 0.5) },
    { label: "Max",  value: maxStake },
  ];

  const handleClaim = async () => {
    if (busy || !stakeValid) return;
    setBusy(true); setErr("");
    try { await onClaim(stakeNum); }
    catch (e) { setErr(e instanceof Error ? e.message : "Something went wrong"); setBusy(false); }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      style={{
        borderRadius: 16, padding: `${S16}px`,
        background: `linear-gradient(160deg, rgba(255,184,77,0.06) 0%, transparent 50%), ${SURFACE}`,
        border: "1px solid rgba(255,184,77,0.18)", marginBottom: S16,
      }}
    >
      <p style={{
        fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
        color: "var(--text-muted)", margin: `0 0 ${S12}px`,
      }}>
        Set your stake
      </p>

      {/* Quick chips */}
      <div style={{ display: "flex", gap: 6, marginBottom: S12, flexWrap: "wrap" }}>
        {chips.map((c) => {
          const isChosen = rawStake === String(c.value);
          return (
            <button key={c.label} onClick={() => setRawStake(String(c.value))} style={{
              padding: "6px 12px", borderRadius: 8, border: "none", cursor: "pointer",
              background: isChosen ? "rgba(255,184,77,0.18)" : "rgba(255,255,255,0.05)",
              color: isChosen ? GOLD : "var(--text-muted)",
              fontSize: 11, fontWeight: 700, transition: "all 0.12s",
            }}>
              {c.label} ₦{fmt(c.value)}
            </button>
          );
        })}
      </div>

      {/* Input */}
      <div style={{ position: "relative", marginBottom: 4 }}>
        <span style={{
          position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
          fontSize: 15, fontWeight: 700, color: focused || stakeValid ? GOLD : "var(--text-muted)",
          transition: "color 0.15s", pointerEvents: "none",
        }}>₦</span>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={rawStake}
          placeholder={`${minStake}`}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={(e) => setRawStake(e.target.value.replace(/[^0-9]/g, ""))}
          style={{
            width: "100%", padding: "13px 14px 13px 28px",
            borderRadius: 12,
            border: `1.5px solid ${outOfRange ? "rgba(239,68,68,0.5)" : focused ? `rgba(255,184,77,0.5)` : "rgba(255,255,255,0.1)"}`,
            backgroundColor: "rgba(255,255,255,0.04)",
            color: "var(--text-primary)",
            fontSize: 18, fontFamily: "'JetBrains Mono', monospace", fontWeight: 800,
            outline: "none", boxSizing: "border-box",
            boxShadow: focused ? `0 0 0 3px rgba(255,184,77,0.1)` : "none",
            transition: "border 0.15s, box-shadow 0.15s",
          }}
        />
      </div>

      <p style={{ fontSize: 10, margin: `0 0 ${S12}px`, color: outOfRange ? "#f87171" : "var(--text-muted)" }}>
        {outOfRange
          ? `Amount must be ₦${fmt(minStake)} – ₦${fmt(maxStake)}`
          : `Min ₦${fmt(minStake)} · Max ₦${fmt(maxStake)}`}
      </p>

      {/* Live payout calculator */}
      <AnimatePresence>
        {payout !== null && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: "hidden", marginBottom: S12 }}
          >
            <div style={{
              borderRadius: 10, padding: "10px 14px",
              background: "rgba(255,184,77,0.07)",
              border: "1px solid rgba(255,184,77,0.18)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                Find the treasure → win
              </span>
              <span style={{
                fontSize: 16, fontWeight: 900, fontFamily: "'JetBrains Mono', monospace",
                color: GOLD,
              }}>
                ₦{fmt(payout)}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      {err && (
        <div style={{
          display: "flex", gap: 8, padding: "10px 12px", borderRadius: 10, marginBottom: S12,
          backgroundColor: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)",
          color: "#f87171", fontSize: 12,
        }}>
          <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} /> {err}
        </div>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={onCancel} style={{
          padding: "13px 16px", borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.08)", background: "none",
          color: "var(--text-muted)", fontSize: 13, fontWeight: 600, cursor: "pointer", flexShrink: 0,
        }}>
          Cancel
        </button>
        <motion.button
          onClick={handleClaim}
          disabled={busy || !stakeValid}
          whileTap={stakeValid ? { scale: 0.97 } : {}}
          style={{
            flex: 1, padding: "13px 0", borderRadius: 12, border: "none",
            background: stakeValid
              ? `linear-gradient(135deg, ${GOLD}, ${GOLD_DIM})`
              : "rgba(255,255,255,0.05)",
            color: stakeValid ? "#08090D" : "var(--text-muted)",
            fontSize: 15, fontWeight: 900, cursor: busy || !stakeValid ? "not-allowed" : "pointer",
            opacity: busy ? 0.7 : 1,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            boxShadow: stakeValid ? `0 6px 20px rgba(255,184,77,0.35)` : "none",
            transition: "background 0.15s, box-shadow 0.15s",
          }}
        >
          {busy && <Loader2 size={16} className="animate-spin" />}
          {busy ? "Claiming…" : "Claim & Play →"}
        </motion.button>
      </div>
    </motion.div>
  );
}

// ─── Slot Cell ────────────────────────────────────────────────────────────────
function SlotCell({
  state: cellState, isPending, isDisabled, isTreasureReveal, onTap,
}: {
  state: "unpopped" | "empty" | "treasure";
  isPending: boolean; isDisabled: boolean;
  isTreasureReveal: boolean; onTap: () => void;
}) {
  const isRevealed = cellState !== "unpopped" || isTreasureReveal;
  const isTreasure = cellState === "treasure" || isTreasureReveal;
  const isEmpty    = cellState === "empty";

  return (
    <motion.button
      onClick={isDisabled ? undefined : onTap}
      disabled={isDisabled}
      whileHover={!isDisabled && !isRevealed ? { y: -3, boxShadow: `0 8px 20px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,184,77,0.3)` } : {}}
      whileTap={!isDisabled ? { scale: 0.93 } : {}}
      animate={
        isPending
          ? { scale: [1, 0.95, 1], transition: { repeat: Infinity, duration: 0.6 } }
          : isRevealed
            ? { scale: [1, 1.1, 1], transition: { duration: 0.25, ease: "easeOut" } }
            : {}
      }
      style={{
        width: "100%", aspectRatio: "1",
        borderRadius: 12,
        background: isPending
          ? "rgba(255,184,77,0.07)"
          : isTreasure
            ? `linear-gradient(145deg, rgba(255,184,77,0.22), rgba(255,184,77,0.08))`
            : isEmpty
              ? "rgba(255,255,255,0.02)"
              : "linear-gradient(145deg, rgba(255,255,255,0.07), rgba(255,255,255,0.03))",
        border: isPending
          ? "1.5px solid rgba(255,184,77,0.3)"
          : isTreasure
            ? `1.5px solid rgba(255,184,77,0.6)`
            : isEmpty
              ? "1px solid rgba(255,255,255,0.04)"
              : "1.5px solid rgba(255,255,255,0.08)",
        boxShadow: isTreasure
          ? `0 0 16px rgba(255,184,77,0.4), 0 4px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15)`
          : isRevealed && !isEmpty
            ? "none"
            : !isRevealed
              ? "0 4px 12px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.07)"
              : "none",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: isDisabled ? "default" : "pointer",
        opacity: isDisabled && !isRevealed && !isTreasureReveal ? 0.3 : isEmpty ? 0.45 : 1,
        transition: "background 0.2s, border 0.2s, box-shadow 0.2s, opacity 0.2s",
        fontSize: 16,
      }}
    >
      {isPending
        ? <Loader2 size={14} style={{ color: GOLD }} className="animate-spin" />
        : isTreasure
          ? <Gem size={16} style={{ color: GOLD }} />
          : isEmpty
            ? <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.2)", letterSpacing: "0.04em" }}>MISS</span>
            : <span style={{ fontSize: 13, opacity: 0.35 }}>🎁</span>
      }
    </motion.button>
  );
}

// ─── Slot Grid ────────────────────────────────────────────────────────────────
function SlotGrid({
  totalSlots, poppedSlots, pendingSlot, gameOver, treasureSlotIndexes, onPop,
}: {
  totalSlots: number;
  poppedSlots: Map<number, "empty" | "treasure">;
  pendingSlot: number | null;
  gameOver: boolean;
  treasureSlotIndexes?: number[];
  onPop: (i: number) => void;
}) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(60px, 1fr))",
      gap: S16,
    }}>
      {Array.from({ length: totalSlots }, (_, i) => {
        const popped     = poppedSlots.get(i);
        const cellState: "unpopped" | "empty" | "treasure" = popped ?? "unpopped";
        const isPending  = pendingSlot === i;
        const isDisabled = gameOver || popped !== undefined || pendingSlot !== null;
        const isTreasureReveal = gameOver &&
          (treasureSlotIndexes?.includes(i) ?? false) &&
          cellState !== "treasure";

        return (
          <SlotCell
            key={i}
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

// ─── FilteredBoxList ──────────────────────────────────────────────────────────
function FilteredBoxList({
  boxes, multipliers, hasMultipleConfigs,
  selectedBox, onSelect, minStake, maxStake, onClaim, onCancel,
  activeMultiplier, onMultiplierChange,
}: {
  boxes: TreasureBox[]; multipliers: number[]; hasMultipleConfigs: boolean;
  selectedBox: TreasureBox | null; onSelect: (b: TreasureBox) => void;
  minStake: number; maxStake: number;
  onClaim: (id: string, stake: number) => Promise<void>; onCancel: () => void;
  activeMultiplier: number | null; onMultiplierChange: (m: number) => void;
}) {
  const filtered = hasMultipleConfigs && activeMultiplier !== null
    ? boxes.filter((b) => b.payout_multiplier === activeMultiplier)
    : boxes;

  // Use first box of each multiplier group for card display
  const configCards: TreasureBox[] = multipliers
    .map((m) => boxes.find((b) => b.payout_multiplier === m))
    .filter(Boolean) as TreasureBox[];

  return (
    <>
      {/* Config cards — pill tabs, wrap naturally, no overflow */}
      {hasMultipleConfigs && (
        <div style={{
          display: "flex", gap: 8, flexWrap: "wrap",
          marginBottom: S16,
        }}>
          {configCards.map((box) => {
            const count = boxes.filter((b) => b.payout_multiplier === box.payout_multiplier).length;
            return (
              <BoxConfigCard
                key={box.payout_multiplier}
                box={box}
                isActive={activeMultiplier === box.payout_multiplier}
                count={count}
                onClick={() => onMultiplierChange(box.payout_multiplier)}
              />
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

  const [phase, setPhase] = useState<Phase>("list");

  const [availability, setAvailability]     = useState<TbAvailableResponse | null>(null);
  const [listLoading, setListLoading]       = useState(true);
  const [listError, setListError]           = useState("");
  const [selectedBox, setSelectedBox]       = useState<TreasureBox | null>(null);
  const [selectedMultiplier, setSelectedMultiplier] = useState<number | null>(null);

  const [playState, setPlayState]           = useState<PlayState | null>(null);
  const [poppedSlots, setPoppedSlots]       = useState<Map<number, "empty" | "treasure">>(new Map());
  const [pendingSlot, setPendingSlot]       = useState<number | null>(null);
  const [popError, setPopError]             = useState("");

  const [resultState, setResultState]       = useState<ResultState | null>(null);
  const [history, setHistory]               = useState<TbHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    if (!appState.isAuthenticated) router.push("/auth");
  }, [appState.isAuthenticated, router]);

  const loadAvailable = useCallback(() => {
    setListLoading(true); setListError("");
    treasureBoxApi.getAvailable()
      .then((res) => setAvailability(res))
      .catch((e) => setListError(e instanceof ApiError ? e.message : "Failed to load boxes"))
      .finally(() => setListLoading(false));
  }, []);

  useEffect(() => {
    if (!availability?.boxes?.length) return;
    setSelectedMultiplier((prev) => {
      if (prev !== null) return prev;
      const ms = Array.from(new Set(availability.boxes.map((b) => b.payout_multiplier))).sort((a, b) => b - a);
      return ms[0] ?? null;
    });
  }, [availability]);

  useEffect(() => {
    if (!appState.isAuthenticated) return;
    loadAvailable();
    treasureBoxApi.getHistory()
      .then((res) => setHistory(res.history))
      .catch(() => {})
      .finally(() => setHistoryLoading(false));
  }, [appState.isAuthenticated, loadAvailable]);

  const handleClaim = async (boxId: string, stake: number) => {
    try {
      const res = await treasureBoxApi.claimBox(boxId, stake);
      const claim: TbClaimResponse = res;
      dispatch({ type: "UPDATE_BALANCE", balance: claim.new_balance, bonus_balance: claim.new_bonus_balance } as any);
      setPlayState({
        boxId: claim.box_id, totalSlots: claim.total_slots, popLimit: claim.pop_limit,
        payoutMultiplier: claim.payout_multiplier, stake: claim.stake, popsRemaining: claim.pops_remaining,
      });
      setPoppedSlots(new Map()); setPendingSlot(null); setPhase("play");
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.code === "BOX_ALREADY_CLAIMED") { loadAvailable(); setSelectedBox(null); throw new Error("This box was just claimed by another player. Choose a different one."); }
        if (e.code === "STAKE_OUT_OF_RANGE")  throw new Error(e.message);
        if (e.code === "FEATURE_UNAVAILABLE") throw new Error("Treasure Box is currently unavailable.");
        if (e.status === 402)                 throw new Error("Insufficient balance. Top up your wallet.");
      }
      throw e;
    }
  };

  useEffect(() => {
    if (phase !== "play" || !playState) return;
    treasureBoxApi.getBoxState(playState.boxId).then((res) => {
      const s: TbBoxState = res;
      const rebuilt = new Map<number, "empty" | "treasure">();
      for (const pop of s.pops) rebuilt.set(pop.slot_index, pop.was_treasure ? "treasure" : "empty");
      setPoppedSlots(rebuilt);
      setPlayState((prev) => prev ? { ...prev, popsRemaining: s.pops_remaining } : prev);
      if (s.game_over) {
        setResultState({ outcome: s.outcome ?? "lost", payout: s.payout ?? 0, newBalance: appState.player?.balance ?? 0, treasureSlotIndexes: s.treasure_slot_indexes, stake: s.stake, payoutMultiplier: s.payout_multiplier });
        setPhase("result");
      }
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, playState?.boxId]);

  const handlePop = async (slotIndex: number) => {
    if (!playState || pendingSlot !== null) return;
    setPendingSlot(slotIndex); setPopError("");
    try {
      const res = await treasureBoxApi.popSlot(playState.boxId, slotIndex);
      const pop: TbPopResponse = res;
      setPoppedSlots((prev) => { const n = new Map(prev); n.set(slotIndex, pop.was_treasure ? "treasure" : "empty"); return n; });
      setPendingSlot(null);
      if (pop.game_over) {
        if (pop.new_balance !== undefined) dispatch({ type: "UPDATE_BALANCE", balance: pop.new_balance, bonus_balance: appState.player?.bonus_balance ?? 0 } as any);
        setResultState({ outcome: pop.outcome ?? "lost", payout: pop.payout ?? 0, newBalance: pop.new_balance ?? appState.player?.balance ?? 0, treasureSlotIndexes: pop.treasure_slot_indexes, stake: playState.stake, payoutMultiplier: playState.payoutMultiplier });
        setPhase("result");
      } else {
        setPlayState((prev) => prev ? { ...prev, popsRemaining: pop.pops_remaining ?? prev.popsRemaining - 1 } : prev);
      }
    } catch (e) {
      setPendingSlot(null);
      if (e instanceof ApiError) {
        if (e.code === "SLOT_ALREADY_POPPED") return;
        if (e.code === "POP_LIMIT_REACHED") { setResultState({ outcome: "lost", payout: 0, newBalance: appState.player?.balance ?? 0, stake: playState.stake, payoutMultiplier: playState.payoutMultiplier }); setPhase("result"); return; }
        if (e.code === "GAME_ALREADY_OVER") {
          treasureBoxApi.getBoxState(playState.boxId).then((r) => {
            if (r.game_over) { setResultState({ outcome: r.outcome ?? "lost", payout: r.payout ?? 0, newBalance: appState.player?.balance ?? 0, treasureSlotIndexes: r.treasure_slot_indexes, stake: r.stake, payoutMultiplier: r.payout_multiplier }); setPhase("result"); }
          }).catch(() => {}); return;
        }
      }
      setPopError(e instanceof Error ? e.message : "Something went wrong. Try again.");
    }
  };

  const goToList = () => {
    setPhase("list"); setSelectedBox(null); setSelectedMultiplier(null);
    setPlayState(null); setPoppedSlots(new Map()); setPendingSlot(null);
    setResultState(null); setPopError(""); loadAvailable();
  };

  if (!appState.isAuthenticated) return null;

  // ─── RENDER ────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes tb-pulse { 0%,100%{opacity:.5}50%{opacity:.9} }
        @keyframes tb-glow  { 0%,100%{box-shadow:0 0 12px rgba(255,184,77,0.35)} 50%{box-shadow:0 0 24px rgba(255,184,77,0.65)} }
        ::-webkit-scrollbar{width:0;height:0}
      `}</style>

      <div style={{
        width: "100%", maxWidth: 480, margin: "0 auto",
        padding: `${S24}px ${S16}px 96px`, boxSizing: "border-box",
        fontFamily: "'Inter', -apple-system, sans-serif",
      }}>

        {/* ── Branded Header */}
        <div style={{ marginBottom: S32, textAlign: "center" }}>
          {/* Icon */}
          <div style={{
            width: 64, height: 64, borderRadius: 20, margin: "0 auto 16px",
            background: `linear-gradient(145deg, rgba(255,184,77,0.18), rgba(255,184,77,0.05))`,
            border: `1.5px solid rgba(255,184,77,0.25)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 30, boxShadow: `0 0 24px rgba(255,184,77,0.2), 0 8px 24px rgba(0,0,0,0.4)`,
          }}>
            🎁
          </div>
          <h1 style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: 28, fontWeight: 900, letterSpacing: "-0.02em",
            color: GOLD,
            margin: "0 0 6px",
          }}>
            Treasure Box
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0, letterSpacing: "0.03em" }}>
            Discover Your Fortune
          </p>
        </div>

        {/* ── Phase content */}
        <AnimatePresence mode="wait">

          {/* ════ LIST PHASE ════════════════════════════════════════════════ */}
          {phase === "list" && (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22 }}
            >
              {listLoading ? (
                <div style={{ display: "flex", flexDirection: "column", gap: S12 }}>
                  {[1, 2, 3].map((i) => (
                    <div key={i} style={{
                      borderRadius: 18, height: 80,
                      background: `linear-gradient(90deg, #12141B 0%, #1a1c26 50%, #12141B 100%)`,
                      backgroundSize: "200% 100%",
                      animation: "tb-pulse 1.8s ease-in-out infinite",
                    }} />
                  ))}
                </div>
              ) : listError ? (
                <div style={{
                  display: "flex", flexDirection: "column", alignItems: "center",
                  gap: S12, padding: `${S32}px 0`, textAlign: "center",
                }}>
                  <AlertCircle size={28} style={{ color: "#f87171" }} />
                  <p style={{ fontSize: 14, color: "#f87171", margin: 0 }}>{listError}</p>
                  <button onClick={loadAvailable} style={{
                    padding: "8px 18px", borderRadius: 10,
                    border: "1px solid rgba(255,255,255,0.1)", background: "none",
                    color: "var(--text-secondary)", fontSize: 13, cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 6,
                  }}>
                    <RefreshCw size={13} /> Retry
                  </button>
                </div>
              ) : !availability?.is_available || !availability?.boxes?.length ? (
                <div style={{
                  display: "flex", flexDirection: "column", alignItems: "center",
                  justifyContent: "center", minHeight: "40vh", textAlign: "center", gap: S16,
                }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: 18,
                    background: "rgba(255,184,77,0.06)", border: "1px solid rgba(255,184,77,0.12)",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32,
                  }}>🎁</div>
                  <div>
                    <p style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 4px" }}>
                      No boxes available right now
                    </p>
                    <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
                      Check back soon — new boxes drop regularly
                    </p>
                  </div>
                </div>
              ) : (() => {
                const boxes = availability.boxes;
                const multipliers = Array.from(new Set(boxes.map((b) => b.payout_multiplier))).sort((a, b) => b - a);
                return (
                  <FilteredBoxList
                    boxes={boxes}
                    multipliers={multipliers}
                    hasMultipleConfigs={multipliers.length > 1}
                    selectedBox={selectedBox}
                    onSelect={(box) => setSelectedBox(box)}
                    minStake={availability.min_stake}
                    maxStake={availability.max_stake}
                    onClaim={(id, stake) => handleClaim(id, stake)}
                    onCancel={() => setSelectedBox(null)}
                    activeMultiplier={selectedMultiplier}
                    onMultiplierChange={setSelectedMultiplier}
                  />
                );
              })()}
            </motion.div>
          )}

          {/* ════ PLAY PHASE ════════════════════════════════════════════════ */}
          {phase === "play" && playState && (
            <motion.div
              key="play"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22 }}
            >
              {/* Stats strip */}
              <div style={{
                display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
                gap: 1, borderRadius: 16, overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.07)",
                marginBottom: S24,
                background: "rgba(255,255,255,0.07)",
              }}>
                {[
                  { label: "Staked",    value: `₦${fmt(playState.stake)}` },
                  { label: "Pops left", value: String(playState.popsRemaining), highlight: true },
                  { label: "Win if",    value: `₦${fmt(playState.stake * playState.payoutMultiplier)}` },
                ].map((item, i) => (
                  <div key={i} style={{
                    padding: "12px 8px", textAlign: "center",
                    background: item.highlight ? "rgba(255,184,77,0.06)" : SURFACE,
                  }}>
                    <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)", margin: "0 0 4px" }}>
                      {item.label}
                    </p>
                    <p style={{
                      fontSize: 14, fontWeight: 900, fontFamily: "'JetBrains Mono', monospace",
                      color: item.highlight ? GOLD : "var(--text-primary)", margin: 0,
                    }}>
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Pop error */}
              {popError && (
                <div style={{
                  display: "flex", gap: 8, padding: "10px 14px", borderRadius: 10, marginBottom: S16,
                  backgroundColor: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)",
                  color: "#f87171", fontSize: 12,
                }}>
                  <AlertCircle size={13} style={{ flexShrink: 0, marginTop: 1 }} /> {popError}
                </div>
              )}

              <SlotGrid
                totalSlots={playState.totalSlots}
                poppedSlots={poppedSlots}
                pendingSlot={pendingSlot}
                gameOver={false}
                onPop={handlePop}
              />

              <p style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "center", marginTop: S16, letterSpacing: "0.02em" }}>
                {playState.popsRemaining === 1
                  ? "Last pop — choose wisely"
                  : `Tap a slot to open it · ${playState.popsRemaining} pops remaining`}
              </p>
            </motion.div>
          )}

          {/* ════ RESULT PHASE ══════════════════════════════════════════════ */}
          {phase === "result" && resultState && playState && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.26, ease: "easeOut" }}
            >
              {resultState.outcome === "won" ? (
                /* ── WIN BANNER ── */
                <div style={{
                  borderRadius: 20, padding: `${S32}px ${S24}px`, marginBottom: S24,
                  textAlign: "center",
                  background: `linear-gradient(160deg, rgba(255,184,77,0.14) 0%, rgba(255,184,77,0.04) 100%), ${SURFACE}`,
                  border: "1px solid rgba(255,184,77,0.3)",
                  boxShadow: `0 0 40px rgba(255,184,77,0.1), 0 16px 48px -16px rgba(0,0,0,0.7)`,
                }}>
                  <motion.div
                    animate={{ scale: [1, 1.15, 1], rotate: [0, -4, 4, 0] }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    style={{ display: "inline-block", marginBottom: S16 }}
                  >
                    <Trophy size={44} style={{ color: GOLD, filter: `drop-shadow(0 0 12px ${GOLD_GLOW})` }} />
                  </motion.div>
                  <p style={{
                    fontFamily: "Georgia, 'Times New Roman', serif",
                    fontSize: 22, fontWeight: 900, color: "var(--text-primary)", margin: "0 0 12px",
                  }}>
                    You found it!
                  </p>
                  <p style={{
                    fontSize: 40, fontWeight: 900, fontFamily: "'JetBrains Mono', monospace",
                    color: GOLD,
                    margin: "0 0 10px", lineHeight: 1,
                    filter: `drop-shadow(0 2px 12px rgba(255,184,77,0.3))`,
                  }}>
                    +₦{fmt(resultState.payout)}
                  </p>
                  <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>
                    New balance:{" "}
                    <strong style={{ color: "var(--text-primary)" }}>₦{fmt(resultState.newBalance)}</strong>
                  </p>
                </div>
              ) : (
                /* ── LOSS BANNER ── */
                <div style={{
                  borderRadius: 20, padding: `${S24}px ${S24}px`, marginBottom: S24,
                  background: `linear-gradient(160deg, rgba(99,102,241,0.07) 0%, transparent 100%), ${SURFACE}`,
                  border: "1px solid rgba(255,255,255,0.07)",
                  boxShadow: "0 16px 40px -16px rgba(0,0,0,0.7)",
                }}>
                  <div style={{ textAlign: "center", marginBottom: S16 }}>
                    <XCircle size={40} style={{ color: "#94a3b8", marginBottom: S12 }} />
                    <p style={{
                      fontFamily: "Georgia, 'Times New Roman', serif",
                      fontSize: 20, fontWeight: 900, color: "var(--text-primary)", margin: "0 0 6px",
                    }}>
                      Just missed it
                    </p>
                    <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0, lineHeight: 1.55 }}>
                      You didn&apos;t uncover the treasure this time. The
                      {resultState.treasureSlotIndexes && resultState.treasureSlotIndexes.length > 1 ? " treasures were" : " treasure was"}{" "}
                      hidden in the glowing slot{resultState.treasureSlotIndexes && resultState.treasureSlotIndexes.length > 1 ? "s" : ""} below.
                    </p>
                  </div>
                </div>
              )}

              {/* Grid — frozen, treasures glowing */}
              <SlotGrid
                totalSlots={playState.totalSlots}
                poppedSlots={poppedSlots}
                pendingSlot={null}
                gameOver={true}
                treasureSlotIndexes={resultState.treasureSlotIndexes}
                onPop={() => {}}
              />

              {/* Slot legend (loss only) */}
              {resultState.outcome === "lost" && resultState.treasureSlotIndexes && resultState.treasureSlotIndexes.length > 0 && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 8, marginTop: S16, justifyContent: "center",
                }}>
                  <Gem size={13} style={{ color: GOLD }} />
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    {resultState.treasureSlotIndexes.length === 1
                      ? `Treasure was at slot #${resultState.treasureSlotIndexes[0] + 1}`
                      : `Treasures at slots ${resultState.treasureSlotIndexes.map((i) => `#${i + 1}`).join(", ")}`}
                  </span>
                </div>
              )}

              <motion.button
                onClick={goToList}
                whileTap={{ scale: 0.97 }}
                style={{
                  width: "100%", marginTop: S24, padding: "15px 0", borderRadius: 14, border: "none",
                  background: `linear-gradient(135deg, ${GOLD}, ${GOLD_DIM})`,
                  color: "#08090D", fontSize: 15, fontWeight: 900, cursor: "pointer",
                  boxShadow: `0 6px 24px rgba(255,184,77,0.3)`,
                  letterSpacing: "0.01em",
                }}
              >
                Open Another Box
              </motion.button>
            </motion.div>
          )}

        </AnimatePresence>

        {/* ── Recent Games */}
        <div style={{ marginTop: S32 }}>
          <p style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "0.13em", textTransform: "uppercase",
            color: "var(--text-muted)", margin: `0 0 ${S8}px`,
          }}>
            Recent Games
          </p>
          {historyLoading ? (
            <div style={{ padding: "16px 0", display: "flex", alignItems: "center", gap: 8, color: "var(--text-muted)", fontSize: 12 }}>
              <Loader2 size={14} className="animate-spin" /> Loading…
            </div>
          ) : history.length === 0 ? (
            <p style={{ fontSize: 12, color: "var(--text-muted)", padding: "12px 0" }}>
              No games played yet.
            </p>
          ) : (
            <div style={{ maxHeight: 400, overflowY: "auto", paddingRight: 8 }}>
              {history.map((entry) => <HistoryRow key={entry.id} entry={entry} />)}
            </div>
          )}
        </div>

      </div>
    </>
  );
}
