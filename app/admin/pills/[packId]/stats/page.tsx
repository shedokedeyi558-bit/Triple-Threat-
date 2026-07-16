"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { adminApi } from "@/lib/api";
import { ChevronLeft, BookOpen, Activity, Loader2, TrendingUp, Users, Trophy, XCircle, BarChart2 } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

const POLL_MS = 12000;

// ── Win-rate bar ──────────────────────────────────────────────────────────────
function WinRateBar({ rate, attempts }: { rate: number; attempts: number }) {
  const hasData = attempts >= 5;
  const color = !hasData ? "#333" : rate > 70 ? "#fbbf24" : rate < 15 ? "#ef4444" : "#34d399";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: "#1E1E1E", overflow: "hidden" }}>
        <div style={{ height: "100%", borderRadius: 3, width: `${hasData ? rate : 0}%`, backgroundColor: color, transition: "width 0.6s ease" }} />
      </div>
      <span style={{ fontSize: 13, fontFamily: "monospace", fontWeight: 700, minWidth: 44, textAlign: "right",
        color: !hasData ? "var(--text-muted)" : color }}>
        {hasData ? `${rate.toFixed(1)}%` : "—"}
      </span>
    </div>
  );
}

// ── Difficulty flag ───────────────────────────────────────────────────────────
function WinRateFlag({ rate, attempts }: { rate: number; attempts: number }) {
  if (attempts < 5) return null;
  if (rate > 70) return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4,
      backgroundColor: "rgba(251,191,36,0.12)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.25)" }}>
      Too easy — review questions
    </span>
  );
  if (rate < 15) return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4,
      backgroundColor: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.25)" }}>
      Low win rate — check question difficulty
    </span>
  );
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4,
      backgroundColor: "rgba(52,211,153,0.1)", color: "#34d399", border: "1px solid rgba(52,211,153,0.2)" }}>
      Healthy win rate
    </span>
  );
}

// ── Stat tile ─────────────────────────────────────────────────────────────────
function StatTile({ label, value, color, icon }: { label: string; value: string | number; color: string; icon: React.ReactNode }) {
  return (
    <div style={{ borderRadius: 12, padding: "14px 12px", textAlign: "center",
      border: "1px solid var(--border-hairline)", backgroundColor: "var(--bg-card)" }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}>{icon}</div>
      <p style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", margin: "0 0 5px" }}>{label}</p>
      <p style={{ fontSize: 20, fontFamily: "monospace", fontWeight: 900, color, margin: 0 }}>{value}</p>
    </div>
  );
}

export default function PackStatsPage() {
  const params = useParams();
  const router = useRouter();
  const packId = params.packId as string;

  const [packName, setPackName]         = useState("");
  const [isSpecial, setIsSpecial]       = useState(false);
  const [questionCount, setQuestionCount] = useState<number | null>(null);
  const [bankSize, setBankSize]         = useState<number | null>(null);
  const [stats, setStats]               = useState<{
    in_progress: number; won: number; lost: number;
    total_attempts: number; win_rate: number;
  } | null>(null);
  const [loading, setLoading]           = useState(true);
  const [lastUpdated, setLastUpdated]   = useState<Date | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const res = await adminApi.getPackLiveStats(packId);
      setStats({
        in_progress:    res.in_progress,
        won:            res.won,
        lost:           res.lost,
        total_attempts: res.total_attempts,
        win_rate:       res.win_rate,
      });
      setLastUpdated(new Date());
    } catch { /* silent on poll — only show error on first load */ }
  }, [packId]);

  useEffect(() => {
    // Load pack metadata (name, question_count, bank size) from question bank endpoint
    const loadMeta = async () => {
      try {
        const res = await adminApi.getPackQuestions(packId);
        setPackName(res.pack.name);
        setQuestionCount(res.pack.question_count);
        setIsSpecial(res.pack.question_count != null);
        setBankSize(res.questions.length);
      } catch {
        // Fallback — stats page still useful without bank meta
      }
    };

    const loadAll = async () => {
      await Promise.allSettled([loadMeta(), fetchStats()]);
      setLoading(false);
    };

    loadAll();
    timerRef.current = setInterval(fetchStats, POLL_MS);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [packId, fetchStats]);

  const hasData = (stats?.total_attempts ?? 0) >= 5;
  const coverageRatio = questionCount && bankSize != null && questionCount > 0
    ? bankSize / questionCount : null;
  const coverageColor = coverageRatio == null ? "var(--text-muted)"
    : coverageRatio < 1 ? "#ef4444"
    : coverageRatio < 2 ? "#fbbf24"
    : "#34d399";

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", paddingBottom: 60 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <button onClick={() => router.push("/admin/pills")}
          style={{ padding: "6px 8px", borderRadius: 8, border: "1px solid var(--border-subtle)", backgroundColor: "transparent", cursor: "pointer", display: "flex", alignItems: "center" }}>
          <ChevronLeft size={16} style={{ color: "var(--text-secondary)" }} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <BarChart2 size={16} style={{ color: "var(--accent-indigo)", flexShrink: 0 }} />
            <h1 style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {loading ? "Loading…" : (packName || "Pack Stats")}
            </h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
            <Activity size={9} style={{ color: "var(--accent-indigo)" }} className="animate-pulse" />
            <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>
              Live · refreshes every 12s
              {lastUpdated && ` · updated ${lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`}
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
          <Loader2 size={28} className="animate-spin" style={{ color: "var(--accent-indigo)" }} />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Live counters */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
              <StatTile label="Live"     value={stats?.in_progress ?? 0}  color="#60a5fa"
                icon={<span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" style={{ display: "inline-block" }} />} />
              <StatTile label="Won"      value={stats?.won ?? 0}           color="var(--accent-amber)"
                icon={<Trophy size={14} style={{ color: "var(--accent-amber)" }} />} />
              <StatTile label="Lost"     value={stats?.lost ?? 0}          color="#6b7280"
                icon={<XCircle size={14} style={{ color: "#6b7280" }} />} />
              <StatTile label="Total"    value={stats?.total_attempts ?? 0} color="var(--text-secondary)"
                icon={<Users size={14} style={{ color: "var(--text-muted)" }} />} />
            </div>
          </motion.div>

          {/* Win rate */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            style={{ borderRadius: 12, padding: "16px", border: "1px solid var(--border-hairline)", backgroundColor: "var(--bg-card)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <TrendingUp size={13} style={{ color: "var(--accent-indigo)" }} />
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-muted)" }}>Win Rate</span>
              </div>
              {stats && <WinRateFlag rate={stats.win_rate} attempts={stats.total_attempts} />}
            </div>
            {stats && <WinRateBar rate={stats.win_rate} attempts={stats.total_attempts} />}
            {!hasData && (
              <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 8 }}>
                Rate shown after 5 or more completed attempts.
              </p>
            )}
          </motion.div>

          {/* Bank health — only for Specials with question_count */}
          {isSpecial && questionCount != null && bankSize != null && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              style={{ borderRadius: 12, padding: "16px", border: "1px solid var(--border-hairline)", backgroundColor: "var(--bg-card)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <BookOpen size={13} style={{ color: "var(--accent-amber)" }} />
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-muted)" }}>Question Bank</span>
                </div>
                <Link href={`/admin/pills/${packId}/bank`}
                  style={{ fontSize: 11, fontWeight: 700, color: "var(--accent-amber)", textDecoration: "none" }}>
                  Manage Bank →
                </Link>
              </div>
              {/* Coverage bar */}
              <div style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-muted)", marginBottom: 5 }}>
                  <span>{bankSize} questions in bank</span>
                  <span>{questionCount} drawn per exam</span>
                </div>
                <div style={{ height: 5, borderRadius: 3, backgroundColor: "#1E1E1E", overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: 3, transition: "width 0.5s ease",
                    width: `${Math.min(100, ((coverageRatio ?? 0) / 3) * 100)}%`,
                    backgroundColor: coverageColor }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--text-muted)", marginTop: 4 }}>
                  <span style={{ color: coverageColor, fontWeight: 600 }}>
                    {coverageRatio == null ? "—"
                      : coverageRatio < 1 ? "Under minimum"
                      : coverageRatio < 2 ? "Low coverage"
                      : coverageRatio < 3 ? "Good"
                      : "Full coverage"} · {coverageRatio?.toFixed(1) ?? "—"}×
                  </span>
                  <span>3× = ideal</span>
                </div>
              </div>
              {/* Diagnostic connection */}
              {hasData && stats && stats.win_rate > 70 && (
                <div style={{ marginTop: 10, padding: "8px 10px", borderRadius: 8, backgroundColor: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.2)", fontSize: 11, color: "#fbbf24", lineHeight: 1.5 }}>
                  High win rate detected. Check the question bank for easy questions — questions with &gt;85% correct rate may be the cause.
                </div>
              )}
            </motion.div>
          )}

        </div>
      )}
    </div>
  );
}
