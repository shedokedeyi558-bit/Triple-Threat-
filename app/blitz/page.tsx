"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { blitzApi, type BlitzTournament, ApiError } from "@/lib/api";
import { Zap, Users, Clock, Trophy, Timer } from "lucide-react";

function StatusBadge({ status }: { status: BlitzTournament["status"] }) {
  const config = {
    registration: { label: "Open",    color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
    active:        { label: "Live",    color: "bg-[#E8A33D]/20 text-[#E8A33D] border-[#E8A33D]/30" },
    completed:     { label: "Ended",  color: "bg-gray-700/30 text-gray-500 border-gray-700/30" },
    draft:         { label: "Soon",   color: "bg-gray-700/20 text-gray-600 border-gray-700/20" },
    scoring:       { label: "Scoring",color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  };
  const c = config[status] ?? config.draft;
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border flex-shrink-0 ${c.color}`}>
      {c.label}
    </span>
  );
}

// Live ticking countdown
function useCountdown(target: string) {
  const calc = () => {
    const diff = new Date(target).getTime() - Date.now();
    if (diff <= 0) return { label: "Now", urgent: true };
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    const urgent = diff < 30 * 60 * 1000; // < 30 min
    if (h > 48) return { label: `${Math.floor(h / 24)}d`, urgent: false };
    if (h > 0)  return { label: `${h}h ${m}m`, urgent };
    if (m > 0)  return { label: `${m}m ${s}s`, urgent };
    return { label: `${s}s`, urgent: true };
  };
  const [state, setState] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setState(calc()), 1000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);
  return state;
}

// Compute the potential max prize pool from tournament metadata
function computeMaxPool(t: BlitzTournament): number | null {
  const maxP = t.max_participants ?? 0;
  const pct  = t.total_payout_percent ?? 0;
  if (maxP <= 0 || pct <= 0) return null;
  return Math.floor(t.entry_fee * maxP * pct / 100);
}

function TournamentCard({ t }: { t: BlitzTournament }) {
  const router      = useRouter();
  const isReg       = t.status === "registration";
  const isActive    = t.status === "active";
  const isCompleted = t.status === "completed";
  const isScoring   = t.status === "scoring";

  const countdownTarget = isActive ? t.tournament_end : t.tournament_start;
  const { label: countdownLabel, urgent } = useCountdown(countdownTarget ?? "");

  const livePool    = t.prize_pool ?? 0;
  const maxPool     = computeMaxPool(t);
  const poolDisplay = livePool > 0
    ? `₦${livePool.toLocaleString()}`
    : maxPool != null ? `Up to ₦${maxPool.toLocaleString()}` : "₦0";
  const poolIsEstimate = livePool === 0 && maxPool != null;

  const positionPrizes = t.position_prizes ?? [];

  const ctaLabel    = isReg ? "Register →" : isCompleted ? "View Results →" : isScoring ? "Scoring…" : "View →";
  const ctaDisabled = isCompleted || isScoring;

  const cardBorder = isActive
    ? "border-[#E8A33D]/25 hover:border-[#E8A33D]/50"
    : "border-[#1E1E1E] hover:border-[#4C6FFF]/30";

  return (
    <motion.button
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.99 }}
      onClick={() => router.push(`/blitz/${t.id}`)}
      className={`w-full bg-[#111] border rounded-2xl p-5 text-left transition-all ${cardBorder}`}
    >
      {/* ── Header: title + LIVE badge ── */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Zap size={14} className="flex-shrink-0" style={{ color: "var(--accent-amber)" }} />
            <h3 className="text-white font-black text-base leading-tight truncate">{t.title}</h3>
            <StatusBadge status={t.status} />
          </div>
          {t.description ? (
            <p className="text-xs leading-relaxed line-clamp-2 ml-[22px]" style={{ color: "var(--text-muted)" }}>
              {t.description}
            </p>
          ) : isActive ? (
            <p className="text-xs ml-[22px]" style={{ color: "var(--text-muted)" }}>
              Tournament is live — answers being submitted now
            </p>
          ) : isReg ? (
            <p className="text-xs ml-[22px]" style={{ color: "var(--text-muted)" }}>
              Registration is open — grab your spot
            </p>
          ) : null}
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {[
          {
            icon: <Zap size={11} style={{ color: "var(--accent-amber)" }} />,
            label: "Entry",
            value: `₦${t.entry_fee.toLocaleString()}`,
            valueColor: "var(--accent-amber)",
          },
          {
            icon: <Trophy size={11} style={{ color: livePool > 0 ? "var(--accent-amber)" : "var(--text-muted)" }} />,
            label: "Prize Pool",
            value: poolDisplay,
            valueColor: livePool > 0 ? "var(--text-primary)" : "var(--text-muted)",
            sub: poolIsEstimate ? "estimated" : undefined,
          },
          {
            icon: <Users size={11} style={{ color: "var(--accent-indigo)" }} />,
            label: "Players",
            value: `${t.total_registered}${t.max_participants ? `/${t.max_participants}` : ""}`,
            valueColor: "var(--text-primary)",
          },
        ].map((s) => (
          <div key={s.label} className="rounded-xl p-2.5 text-center"
            style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border-hairline)" }}>
            <div className="flex items-center justify-center gap-1 mb-1">
              {s.icon}
              <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>{s.label}</p>
            </div>
            <p className="font-black text-sm font-mono leading-tight" style={{ color: s.valueColor }}>{s.value}</p>
            {s.sub && <p className="text-[9px] mt-0.5" style={{ color: "var(--text-muted)" }}>{s.sub}</p>}
          </div>
        ))}
      </div>

      {/* ── Rank rewards ── */}
      {(positionPrizes.length > 0 || t.per_question_time_seconds != null) && (
        <div className="mb-3 space-y-1.5">
          {positionPrizes.length > 0 && (
            <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
              Leaderboard rewards
            </p>
          )}
          <div className="flex flex-wrap gap-1.5">
            {t.per_question_time_seconds != null && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md"
                style={{ backgroundColor: "rgba(232,163,61,0.1)", color: "var(--accent-amber)", border: "1px solid rgba(232,163,61,0.2)" }}>
                <Timer size={9} />{t.per_question_time_seconds}s per question
              </span>
            )}
            {positionPrizes.map((p) => (
              <span key={p.position} className="text-[10px] font-bold px-2 py-1 rounded-md"
                style={{ backgroundColor: "rgba(124,111,232,0.1)", color: "var(--accent-violet)", border: "1px solid rgba(124,111,232,0.2)" }}>
                #{p.position} · {p.prize_type === "free_ticket" ? "Free entry 🎫" : `${p.discount_percent ?? "?"}% off 🏷️`}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Footer: countdown + CTA ── */}
      <div className="flex items-center justify-between gap-3 pt-3"
        style={{ borderTop: "1px solid var(--border-hairline)" }}>

        {/* Countdown */}
        {(isActive || isReg) && (
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${isActive && urgent ? "animate-pulse" : ""}`}
            style={{
              backgroundColor: isActive
                ? urgent ? "rgba(232,163,61,0.15)" : "rgba(232,163,61,0.08)"
                : "rgba(76,111,255,0.08)",
              border: `1px solid ${isActive
                ? urgent ? "rgba(232,163,61,0.45)" : "rgba(232,163,61,0.2)"
                : "rgba(76,111,255,0.2)"}`,
            }}>
            <Clock size={13} style={{ color: isActive ? "var(--accent-amber)" : "var(--accent-indigo)", flexShrink: 0 }} />
            <span className="font-black text-sm font-mono"
              style={{ color: isActive ? "var(--accent-amber)" : "var(--accent-indigo)" }}>
              {isActive ? `Ends ${countdownLabel}` : `Starts ${countdownLabel}`}
            </span>
          </div>
        )}
        {isCompleted && (
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>Tournament ended</span>
        )}
        {isScoring && (
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>Calculating results…</span>
        )}

        {/* CTA */}
        <div className={`text-xs font-black px-4 py-2 rounded-xl transition-colors flex-shrink-0 ${
          ctaDisabled
            ? "opacity-40 cursor-default"
            : isActive
            ? "bg-[#E8A33D]/12 border border-[#E8A33D]/35 text-[#E8A33D]"
            : "bg-[#4C6FFF]/10 border border-[#4C6FFF]/25 text-[#4C6FFF]"
        }`}>
          {ctaLabel}
        </div>
      </div>
    </motion.button>
  );
}

export default function BlitzLobbyPage() {
  const { state } = useApp();
  const router = useRouter();
  const [tournaments, setTournaments] = useState<BlitzTournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!state.isAuthenticated) { router.push("/auth"); return; }
    blitzApi.getAll()
      .then((res) => setTournaments(res.tournaments))
      .catch((err) => { if (err instanceof ApiError) setError(err.message); })
      .finally(() => setLoading(false));
  }, [state.isAuthenticated, router]);

  if (!state.isAuthenticated) return null;

  const active       = tournaments.filter((t) => t.status === "active");
  const registration = tournaments.filter((t) => t.status === "registration");
  const scoring      = tournaments.filter((t) => t.status === "scoring");
  const completed    = tournaments.filter((t) => t.status === "completed");

  const Section = ({ title, items }: { title: string; items: BlitzTournament[] }) => (
    <section className="space-y-3">
      <h2 className="text-[11px] text-gray-500 uppercase tracking-widest font-bold">{title}</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {items.map((t) => <TournamentCard key={t.id} t={t} />)}
      </div>
    </section>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 lg:px-8 py-6 space-y-8">
      {error && (
        <p className="text-red-400 text-sm bg-red-900/10 border border-red-900/30 rounded-xl p-3">{error}</p>
      )}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-[#111] border border-[#1E1E1E] rounded-2xl p-5 h-44 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {active.length > 0       && <Section title="Live Now"            items={active} />}
          {registration.length > 0 && <Section title="Registration Open"   items={registration} />}
          {scoring.length > 0      && <Section title="Calculating Results" items={scoring} />}
          {completed.length > 0    && <Section title="Completed"           items={completed} />}
          {tournaments.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#141414] border border-[#1E1E1E] flex items-center justify-center mb-4">
                <Zap size={28} className="text-gray-700" />
              </div>
              <p className="text-gray-500 font-semibold">No tournaments right now</p>
              <p className="text-gray-700 text-sm mt-1">Check back soon for new Blitz events</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
