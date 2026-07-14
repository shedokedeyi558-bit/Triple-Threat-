"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { predictionsApi, ApiError, type MyPrediction } from "@/lib/api";
import { ChevronLeft, Loader2, Wand2, ArrowRight, CheckCircle2, Clock } from "lucide-react";
import Link from "next/link";

// ─── Category colour map (mirrors play page) ───────────────────────────────
const CAT_COLOR: Record<string, string> = {
  Football: "#4C6FFF", Basketball: "#7C6FE8", Cricket: "#E8A33D",
  Crypto: "#8B5CF6", Politics: "#EC4899", Entertainment: "#FFD700",
  Technology: "#00CFFF", Science: "#00FF66", Food: "#FF6B9D",
  Lifestyle: "#FF8800", "General Knowledge": "#8B5CF6",
  Sports: "#4C6FFF",
};
const catColor = (cat: string) => CAT_COLOR[cat] ?? "#4C6FFF";

// ─── Live countdown for active cards ──────────────────────────────────────
function useCountdown(target: string) {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    const tick = () =>
      setLeft(Math.max(0, Math.floor((new Date(target).getTime() - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);
  const h = Math.floor(left / 3600);
  const m = Math.floor((left % 3600) / 60);
  const s = left % 60;
  const label =
    left <= 0
      ? "Locked"
      : h > 0
      ? `${h}h ${m}m`
      : m > 0
      ? `${m}m ${String(s).padStart(2, "0")}s`
      : `${s}s`;
  return { left, label, expired: left <= 0 };
}

// ─── Active prediction card (ticket-stub style) ───────────────────────────
function ActiveCard({ p, onClick }: { p: MyPrediction; onClick: () => void }) {
  const color = catColor(p.category);
  const countdown = useCountdown(p.countdown_end);
  const submitted = !!p.my_answer;

  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.985 }}
      onClick={onClick}
      style={{
        width: "100%",
        boxSizing: "border-box",
        borderRadius: 12,
        padding: 0,
        textAlign: "left",
        cursor: "pointer",
        backgroundColor: "var(--bg-card)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderLeft: `3px solid ${color}`,
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* faint wash */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: color,
          opacity: 0.03,
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative", padding: "11px 14px 0" }}>
        {/* Row 1: category + countdown */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 7,
          }}
        >
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              padding: "2px 6px",
              borderRadius: 4,
              backgroundColor: `${color}22`,
              color,
              flexShrink: 0,
            }}
          >
            {p.category}
          </span>
          <span
            style={{
              fontSize: 12,
              fontFamily: "'IBM Plex Mono', monospace",
              fontWeight: 800,
              color: countdown.expired ? "var(--text-muted)" : color,
              letterSpacing: "-0.02em",
              flexShrink: 0,
              textDecoration: "none",
            }}
          >
            {countdown.label}
          </span>
        </div>

        {/* Question */}
        <p
          style={{
            fontSize: 13,
            fontWeight: 600,
            lineHeight: 1.4,
            color: "var(--text-primary)",
            margin: "0 0 11px",
          }}
        >
          {p.question}
        </p>
      </div>

      {/* Ticket stub footer */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "8px 14px",
          borderTop: `1px dashed ${color}40`,
          backgroundColor: `${color}08`,
          gap: 8,
        }}
      >
        {/* Status line */}
        <div style={{ minWidth: 0 }}>
          {submitted ? (
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <CheckCircle2
                size={11}
                style={{ color: "var(--accent-indigo)", flexShrink: 0 }}
              />
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {countdown.expired
                  ? "Locked · awaiting result"
                  : `Locked in · result in ${countdown.label}`}
              </span>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <Clock size={11} style={{ color: "var(--accent-amber)", flexShrink: 0 }} />
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--accent-amber)",
                  whiteSpace: "nowrap",
                }}
              >
                Awaiting your answer
              </span>
            </div>
          )}
        </div>

        {/* Action */}
        {!submitted ? (
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: "3px 10px",
              borderRadius: 6,
              backgroundColor: "var(--accent-indigo)",
              color: "#fff",
              flexShrink: 0,
            }}
          >
            Submit now
          </span>
        ) : (
          <div style={{ display: "flex", gap: 12, flexShrink: 0 }}>
            <div style={{ textAlign: "right" }}>
              <p
                style={{
                  fontSize: 9,
                  color: "var(--text-muted)",
                  margin: "0 0 1px",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Entry
              </p>
              <p
                style={{
                  fontSize: 11,
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontWeight: 700,
                  color: "var(--accent-amber)",
                  margin: 0,
                  textDecoration: "none",
                }}
              >
                ₦{p.fee.toLocaleString()}
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p
                style={{
                  fontSize: 9,
                  color: "var(--text-muted)",
                  margin: "0 0 1px",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Prize
              </p>
              <p
                style={{
                  fontSize: 11,
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontWeight: 700,
                  color,
                  margin: 0,
                  textDecoration: "none",
                }}
              >
                ₦{p.prize_per_winner.toLocaleString()}
              </p>
            </div>
          </div>
        )}
      </div>
    </motion.button>
  );
}

// ─── Settled prediction card ──────────────────────────────────────────────
function SettledCard({ p, onClick }: { p: MyPrediction; onClick: () => void }) {
  const color = catColor(p.category);
  const won = p.won === true;
  const lost = p.won === false;
  const pending = p.won === null;

  const dateLabel = new Date(p.participated_at).toLocaleDateString("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.985 }}
      onClick={onClick}
      style={{
        width: "100%",
        boxSizing: "border-box",
        borderRadius: 12,
        padding: 0,
        textAlign: "left",
        cursor: "pointer",
        backgroundColor: "var(--bg-card)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderLeft: `3px solid ${won ? "var(--accent-amber)" : lost ? "rgba(248,113,113,0.6)" : color}`,
        overflow: "hidden",
      }}
    >
      <div style={{ padding: "11px 14px" }}>
        {/* Row 1: category + date */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 7,
          }}
        >
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              padding: "2px 6px",
              borderRadius: 4,
              backgroundColor: `${color}22`,
              color,
            }}
          >
            {p.category}
          </span>
          <span
            style={{
              fontSize: 10,
              color: "var(--text-muted)",
              flexShrink: 0,
            }}
          >
            {dateLabel}
          </span>
        </div>

        {/* Question */}
        <p
          style={{
            fontSize: 13,
            fontWeight: 600,
            lineHeight: 1.4,
            color: "var(--text-primary)",
            margin: "0 0 10px",
          }}
        >
          {p.question}
        </p>

        {/* Answer comparison row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
            marginBottom: 10,
          }}
        >
          <div
            style={{
              borderRadius: 8,
              padding: "7px 10px",
              backgroundColor: "var(--bg-base)",
              border: `1px solid ${won ? "rgba(76,111,255,0.3)" : lost ? "rgba(248,113,113,0.25)" : "var(--border-hairline)"}`,
            }}
          >
            <p
              style={{
                fontSize: 9,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                margin: "0 0 2px",
              }}
            >
              Your answer
            </p>
            <p
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: won
                  ? "var(--accent-indigo)"
                  : lost
                  ? "#f87171"
                  : "var(--text-secondary)",
                margin: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {p.my_answer || "—"}
            </p>
          </div>
          <div
            style={{
              borderRadius: 8,
              padding: "7px 10px",
              backgroundColor: "var(--bg-base)",
              border: "1px solid rgba(232,163,61,0.2)",
            }}
          >
            <p
              style={{
                fontSize: 9,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                margin: "0 0 2px",
              }}
            >
              Correct answer
            </p>
            <p
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: p.correct_answer ? "var(--accent-amber)" : "var(--text-muted)",
                margin: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                fontStyle: p.correct_answer ? "normal" : "italic",
              }}
            >
              {p.correct_answer ?? "Pending reveal"}
            </p>
          </div>
        </div>

        {/* Outcome */}
        {won && (
          <div
            style={{
              padding: "6px 10px",
              borderRadius: 8,
              backgroundColor: "rgba(232,163,61,0.1)",
              border: "1px solid rgba(232,163,61,0.25)",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span
              style={{
                fontSize: 13,
                fontFamily: "'IBM Plex Mono', monospace",
                fontWeight: 800,
                color: "var(--accent-amber)",
                textDecoration: "none",
              }}
            >
              You won ₦{(p.prize_won ?? p.prize_per_winner).toLocaleString()}
            </span>
          </div>
        )}
        {lost && (
          <p
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "var(--text-muted)",
              margin: 0,
            }}
          >
            Not this time
          </p>
        )}
        {pending && (
          <p
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "var(--text-secondary)",
              margin: 0,
              fontStyle: "italic",
            }}
          >
            Awaiting reveal
          </p>
        )}
      </div>
    </motion.button>
  );
}

// ─── Tab button ───────────────────────────────────────────────────────────
function Tab({
  label,
  active,
  count,
  onClick,
}: {
  label: string;
  active: boolean;
  count: number | null;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: "10px 0",
        fontSize: 14,
        fontWeight: 700,
        borderRadius: 8,
        border: "none",
        cursor: "pointer",
        transition: "all 0.15s",
        backgroundColor: active ? "var(--accent-indigo)" : "transparent",
        color: active ? "#fff" : "var(--text-secondary)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
      }}
    >
      {label}
      {count !== null && count > 0 && (
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            padding: "1px 6px",
            borderRadius: 20,
            backgroundColor: active ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.08)",
            color: active ? "#fff" : "var(--text-muted)",
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
}

// ─── Skeleton loader ──────────────────────────────────────────────────────
function CardSkeleton() {
  return (
    <div
      className="skeleton"
      style={{ height: 110, borderRadius: 12, marginBottom: 10 }}
    />
  );
}

// ─── Main page ────────────────────────────────────────────────────────────
export default function MyPredictionsPage() {
  const { state } = useApp();
  const router = useRouter();
  const [tab, setTab] = useState<"active" | "settled">("active");
  const [predictions, setPredictions] = useState<MyPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!state.isAuthenticated) {
      router.push("/auth");
      return;
    }
    fetchMine();
  }, [state.isAuthenticated]); // eslint-disable-line

  const fetchMine = async () => {
    try {
      const res = await predictionsApi.getMine();
      setPredictions(res.predictions ?? []);
    } catch (err) {
      if (err instanceof ApiError) {
        // Backend may not have this endpoint yet — show empty state gracefully
        if (err.status === 404 || err.status === 500) {
          setPredictions([]);
        } else {
          setError(err.message);
        }
      } else {
        setError("Failed to load your predictions");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!state.isAuthenticated) return null;

  // Partition: settled = completed/cancelled, active = everything else
  const active = predictions.filter(
    (p) =>
      p.status === "active" ||
      p.status === "locked" ||
      // also treat "completed but not yet revealed" as active (won === null)
      (p.status === "completed" && p.won === null && p.correct_answer === null)
  );
  const settled = predictions.filter(
    (p) =>
      (p.status === "completed" && (p.won !== null || p.correct_answer !== null)) ||
      p.status === "cancelled"
  );

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 640,
        margin: "0 auto",
        padding: "20px 16px 100px",
        boxSizing: "border-box",
      }}
    >
      {/* Back + title */}
      <div style={{ marginBottom: 20 }}>
        <button
          onClick={() => router.back()}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--text-muted)",
            fontSize: 13,
            fontWeight: 600,
            padding: 0,
            marginBottom: 14,
          }}
        >
          <ChevronLeft size={16} /> Back
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Wand2 size={20} style={{ color: "var(--accent-violet)", flexShrink: 0 }} />
          <h1
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: "var(--text-primary)",
              margin: 0,
            }}
          >
            My Predictions
          </h1>
        </div>
      </div>

      {/* Segment control */}
      <div
        style={{
          display: "flex",
          gap: 4,
          padding: 4,
          borderRadius: 10,
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border-subtle)",
          marginBottom: 20,
        }}
      >
        <Tab
          label="Active"
          active={tab === "active"}
          count={loading ? null : active.length}
          onClick={() => setTab("active")}
        />
        <Tab
          label="Settled"
          active={tab === "settled"}
          count={loading ? null : settled.length}
          onClick={() => setTab("settled")}
        />
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            marginBottom: 16,
            backgroundColor: "rgba(239,68,68,0.06)",
            border: "1px solid rgba(239,68,68,0.2)",
            color: "#f87171",
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      {/* Content */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </motion.div>
        ) : tab === "active" ? (
          <motion.div
            key="active"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
          >
            {active.length === 0 ? (
              <div
                style={{
                  borderRadius: 12,
                  padding: "36px 24px",
                  textAlign: "center",
                  border: "1px solid var(--border-subtle)",
                  backgroundColor: "var(--bg-card)",
                }}
              >
                <Wand2
                  size={28}
                  style={{
                    color: "var(--text-muted)",
                    margin: "0 auto 12px",
                    display: "block",
                  }}
                />
                <p
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    margin: "0 0 6px",
                  }}
                >
                  No active predictions
                </p>
                <p
                  style={{
                    fontSize: 13,
                    color: "var(--text-muted)",
                    margin: "0 0 16px",
                    lineHeight: 1.5,
                  }}
                >
                  Browse open events to get started
                </p>
                <Link
                  href="/play"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    fontSize: 13,
                    fontWeight: 700,
                    color: "var(--accent-indigo)",
                    textDecoration: "none",
                    padding: "8px 16px",
                    borderRadius: 8,
                    border: "1px solid rgba(76,111,255,0.3)",
                    backgroundColor: "rgba(76,111,255,0.08)",
                  }}
                >
                  Browse predictions <ArrowRight size={13} />
                </Link>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {active.map((p) => (
                  <ActiveCard
                    key={p.id}
                    p={p}
                    onClick={() => router.push(`/predictions/play/${p.id}`)}
                  />
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="settled"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
          >
            {settled.length === 0 ? (
              <div
                style={{
                  borderRadius: 12,
                  padding: "36px 24px",
                  textAlign: "center",
                  border: "1px solid var(--border-subtle)",
                  backgroundColor: "var(--bg-card)",
                }}
              >
                <p
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    margin: "0 0 6px",
                  }}
                >
                  Nothing here yet
                </p>
                <p
                  style={{
                    fontSize: 13,
                    color: "var(--text-muted)",
                    margin: 0,
                    lineHeight: 1.5,
                  }}
                >
                  Your results will show up here once predictions are revealed
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {settled.map((p) => (
                  <SettledCard
                    key={p.id}
                    p={p}
                    onClick={() => router.push(`/predictions/play/${p.id}`)}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
