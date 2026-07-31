"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { useAdmin } from "@/context/AdminContext";
import { adminApi, type BlitzAdminResults, ApiError } from "@/lib/api";
import {
  ArrowLeft, Zap, Trophy, Ticket, CheckCircle2, XCircle,
  AlertTriangle, Clock, Users, Loader2,
} from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(n: number) { return `₦${n.toLocaleString()}`; }

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("en-NG", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function maskPhone(phone: string): string {
  if (phone.length <= 4) return phone;
  return "•••• " + phone.slice(-4);
}

function fmtSecs(ms: number | null): string {
  if (ms == null) return "—";
  return `${(ms / 1000).toFixed(1)}s`;
}

const rankColor = (n: number | null) => {
  if (n === 1) return "#facc15";
  if (n === 2) return "#9ca3af";
  if (n === 3) return "#ea580c";
  return "var(--text-muted)";
};

// ── Status badge ──────────────────────────────────────────────────────────────
function TicketStatusBadge({ status }: { status?: string }) {
  if (!status) return null;
  const cfg: Record<string, { cls: string; label: string }> = {
    unused:  { cls: "bg-blue-500/15 text-blue-400 border-blue-500/25",   label: "Unused" },
    used:    { cls: "bg-gray-500/15 text-gray-400 border-gray-500/25",   label: "Used" },
    expired: { cls: "bg-red-500/15 text-red-400 border-red-500/25",      label: "Expired" },
  };
  const c = cfg[status] ?? cfg.unused;
  return (
    <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${c.cls}`}>
      {c.label}
    </span>
  );
}

// ── Triggered-by badge ────────────────────────────────────────────────────────
function TriggerBadge({ by }: { by: "scheduler" | "admin" | "unknown" }) {
  const cfg = {
    scheduler: { cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25", label: "Scheduler" },
    admin:     { cls: "bg-[#E8A33D]/15 text-[#E8A33D] border-[#E8A33D]/25",      label: "Admin" },
    unknown:   { cls: "bg-gray-700/20 text-gray-500 border-gray-600/20",           label: "Unknown" },
  };
  const c = cfg[by];
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${c.cls}`}>
      {c.label}
    </span>
  );
}

// ── Prize cell ────────────────────────────────────────────────────────────────
function PrizeCell({ prize }: { prize: BlitzAdminResults["players"][number]["prize"] }) {
  if (!prize || prize.prize_type === null) {
    return <span style={{ color: "var(--text-muted)" }}>—</span>;
  }
  if (prize.prize_type === "cash") {
    return (
      <span className="font-black font-mono text-sm" style={{ color: "var(--accent-amber)" }}>
        {fmt(prize.amount_credited ?? 0)}
      </span>
    );
  }
  if (prize.prize_type === "free_ticket") {
    return (
      <div className="space-y-0.5">
        <div className="flex items-center gap-1 text-xs font-bold" style={{ color: "var(--accent-violet)" }}>
          <Ticket size={11} /> Free ticket
        </div>
        <TicketStatusBadge status={prize.ticket_status} />
      </div>
    );
  }
  if (prize.prize_type === "discount") {
    return (
      <div className="space-y-0.5">
        <span className="text-xs font-bold" style={{ color: "var(--accent-violet)" }}>
          🏷️ {prize.discount_percent ?? "?"}% off
        </span>
        <div><TicketStatusBadge status={prize.ticket_status} /></div>
      </div>
    );
  }
  return <span style={{ color: "var(--text-muted)" }}>—</span>;
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminBlitzResultsPage() {
  const { state } = useAdmin();
  const router    = useRouter();
  const params    = useParams();
  const id        = params.id as string;

  const [results, setResults]   = useState<BlitzAdminResults | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error,   setError]     = useState("");

  useEffect(() => {
    if (!state.isAuthenticated) { router.push("/admin/login"); return; }
    adminApi.getBlitzResults(id)
      .then(setResults)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load results"))
      .finally(() => setLoading(false));
  }, [state.isAuthenticated, id, router]);

  if (!state.isAuthenticated) return null;

  const t = results?.tournament;
  const rev = results?.revenue;
  const ev  = results?.scoring_event;

  return (
    <div className="max-w-4xl space-y-5">

      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push(`/admin/blitz/${id}`)}
          className="p-2 rounded-lg border transition-colors flex-shrink-0"
          style={{ borderColor: "var(--border-subtle)", color: "var(--text-secondary)" }}>
          <ArrowLeft size={16} />
        </button>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Zap size={18} style={{ color: "var(--accent-amber)" }} />
          <h1 className="font-black text-xl text-white truncate">{t?.title ?? "Tournament Results"}</h1>
          {t && (
            <span className="flex-shrink-0 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border bg-gray-700/20 text-gray-400 border-gray-700/30">
              {t.status}
            </span>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="text-sm rounded-xl p-3 flex items-center gap-2"
          style={{ color: "#f87171", backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}>
          <AlertTriangle size={15} className="flex-shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={26} className="animate-spin" style={{ color: "var(--accent-indigo)" }} />
        </div>
      ) : results ? (
        <>
          {/* ── Section 1: Tournament dates ── */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="bg-[#141414] border border-[#1E1E1E] rounded-xl px-5 py-4">
            <div className="flex flex-wrap items-center gap-4 text-sm" style={{ color: "var(--text-secondary)" }}>
              <div className="flex items-center gap-2">
                <Clock size={13} style={{ color: "var(--text-muted)" }} />
                <span>{t?.tournament_start ? fmtDate(t.tournament_start) : "—"}</span>
              </div>
              <span style={{ color: "var(--text-muted)" }}>→</span>
              <span>{t?.tournament_end ? fmtDate(t.tournament_end) : "—"}</span>
              <div className="flex items-center gap-2 ml-auto">
                <Users size={13} style={{ color: "var(--text-muted)" }} />
                <span className="font-bold" style={{ color: "var(--text-primary)" }}>{t?.total_registered ?? 0} registered</span>
              </div>
            </div>
          </motion.div>

          {/* ── Section 2: Scoring event ── */}
          {ev && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}
              className="bg-[#141414] border border-[#1E1E1E] rounded-xl px-5 py-4">
              <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>Scoring Event</p>
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div>
                  <p className="text-[9px] uppercase font-bold mb-1" style={{ color: "var(--text-muted)" }}>Scored at</p>
                  <p className="font-semibold" style={{ color: "var(--text-primary)" }}>{fmtDate(ev.scored_at)}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase font-bold mb-1" style={{ color: "var(--text-muted)" }}>Triggered by</p>
                  <TriggerBadge by={ev.triggered_by} />
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Section 3: Revenue audit ── */}
          {rev && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
              className="bg-[#141414] border border-[#1E1E1E] rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Revenue Audit</p>
                {/* Math check flag */}
                {rev.math_check.match ? (
                  <div className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg"
                    style={{ backgroundColor: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.3)", color: "#34d399" }}>
                    <CheckCircle2 size={13} /> Balanced
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg"
                    style={{ backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }}>
                    <XCircle size={13} /> Mismatch
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: "Entry Fee",        value: fmt(t?.entry_fee ?? 0),        color: "var(--text-primary)" },
                  { label: "Total Registered", value: String(t?.total_registered ?? 0), color: "var(--text-primary)" },
                  { label: "Revenue Collected", value: fmt(rev.total_revenue_actual), color: "var(--text-primary)" },
                  { label: "Cash Paid Out",    value: fmt(rev.total_cash_paid_out),   color: "#34d399" },
                  { label: "Platform Kept",    value: fmt(rev.platform_kept),         color: "var(--accent-amber)" },
                ].map((s) => (
                  <div key={s.label} className="rounded-lg p-3" style={{ backgroundColor: "var(--bg-base)" }}>
                    <p className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>{s.label}</p>
                    <p className="text-sm font-black font-mono" style={{ color: s.color }}>{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Formula */}
              <div className="rounded-lg px-3 py-2 text-xs font-mono"
                style={{ backgroundColor: "var(--bg-base)", color: "var(--text-muted)", border: "1px solid var(--border-hairline)" }}>
                {rev.math_check.formula}
              </div>

              {/* Discrepancy note */}
              {rev.discrepancy > 0 && (
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  <span style={{ color: "var(--accent-amber)" }}>ℹ</span>{" "}
                  {fmt(rev.discrepancy)} waived via free / discount tickets
                </p>
              )}
            </motion.div>
          )}

          {/* ── Section 4: Player results table ── */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
            className="bg-[#141414] border border-[#1E1E1E] rounded-xl overflow-hidden">

            {/* Table header */}
            <div className="grid gap-2 px-4 py-3 border-b border-[#1E1E1E] text-[10px] font-black uppercase tracking-widest"
              style={{ color: "var(--text-muted)", gridTemplateColumns: "2rem 1fr 3rem 3.5rem 4rem 4.5rem 1fr" }}>
              <span>#</span>
              <span>Player</span>
              <span className="text-center">Sub</span>
              <span className="text-right">Score</span>
              <span className="text-right">Time</span>
              <span className="text-right">Paid</span>
              <span className="text-right">Prize</span>
            </div>

            {results.players.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                No player data
              </div>
            ) : (
              <div className="divide-y divide-[#1A1A1A]">
                {results.players.map((p, i) => (
                  <motion.div key={p.player_id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(i * 0.025, 0.6) }}
                    className="grid gap-2 px-4 py-3 items-center hover:bg-white/[0.015] transition-colors"
                    style={{ gridTemplateColumns: "2rem 1fr 3rem 3.5rem 4rem 4.5rem 1fr" }}>

                    {/* Rank */}
                    <span className="font-black text-sm"
                      style={{ color: p.rank != null ? rankColor(p.rank) : "var(--text-muted)" }}>
                      {p.rank ?? "—"}
                    </span>

                    {/* Player */}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {p.player_name || maskPhone(p.player_phone)}
                      </p>
                      {p.player_name && (
                        <p className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>
                          {maskPhone(p.player_phone)}
                        </p>
                      )}
                    </div>

                    {/* Submitted */}
                    <div className="flex justify-center">
                      {p.submitted
                        ? <CheckCircle2 size={14} style={{ color: "#34d399" }} />
                        : <XCircle size={14} style={{ color: "#6b7280" }} />}
                    </div>

                    {/* Score */}
                    <p className="text-sm font-bold text-right"
                      style={{ color: p.score != null ? "var(--text-primary)" : "var(--text-muted)" }}>
                      {p.score ?? "—"}
                    </p>

                    {/* Time */}
                    <p className="text-xs font-mono text-right" style={{ color: "var(--text-secondary)" }}>
                      {fmtSecs(p.total_time_ms)}
                    </p>

                    {/* Entry paid */}
                    <div className="text-right">
                      {p.entry_fee_paid === 0 ? (
                        <div>
                          <span className="text-[10px] font-black px-1.5 py-0.5 rounded"
                            style={{ backgroundColor: "rgba(52,211,153,0.12)", color: "#34d399", border: "1px solid rgba(52,211,153,0.25)" }}>
                            FREE
                          </span>
                          {p.ticket_code_used && (
                            <p className="text-[9px] font-mono mt-0.5" style={{ color: "var(--text-muted)" }}>
                              {p.ticket_code_used}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs font-mono font-semibold" style={{ color: "var(--text-secondary)" }}>
                          {fmt(p.entry_fee_paid)}
                        </span>
                      )}
                    </div>

                    {/* Prize */}
                    <div className="text-right">
                      <PrizeCell prize={p.prize} />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </>
      ) : null}
    </div>
  );
}
