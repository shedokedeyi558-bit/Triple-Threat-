"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { blitzApi, type BlitzTournament, ApiError } from "@/lib/api";
import { Zap, Users, Clock, Trophy, Timer, ChevronRight } from "lucide-react";

function StatusPill({ status }: { status: BlitzTournament["status"] }) {
  const cfg: Record<string, { label: string; cls: string }> = {
    registration: { label: "Open",     cls: "bg-blue-500/15 text-blue-400 border-blue-500/25" },
    active:       { label: "Live",     cls: "bg-[#E8A33D]/15 text-[#E8A33D] border-[#E8A33D]/30" },
    completed:    { label: "Ended",    cls: "bg-white/5 text-gray-500 border-white/8" },
    draft:        { label: "Soon",     cls: "bg-white/5 text-gray-600 border-white/8" },
    scoring:      { label: "Scoring",  cls: "bg-yellow-500/15 text-yellow-400 border-yellow-500/25" },
  };
  const c = cfg[status] ?? cfg.draft;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border flex-shrink-0 ${c.cls}`}>
      {c.label}
    </span>
  );
}

function useCountdown(target: string) {
  const calc = () => {
    const diff = new Date(target).getTime() - Date.now();
    if (diff <= 0) return { label: "Now", urgent: true };
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    const urgent = diff < 30 * 60 * 1000;
    if (h > 48) return { label: `${Math.floor(h / 24)}d`, urgent: false };
    if (h > 0)  return { label: `${h}h ${m}m`, urgent };
    if (m > 0)  return { label: `${m}m ${s}s`, urgent };
    return { label: `${s}s`, urgent: true };
  };
  const [st, setSt] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setSt(calc()), 1000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);
  return st;
}

function computeMaxPool(t: BlitzTournament): number | null {
  // New model: 1st place gets first_place_percent of total revenue
  if (t.first_place_percent != null && (t.max_participants ?? 0) > 0) {
    return Math.floor(t.entry_fee * t.max_participants! * t.first_place_percent / 100);
  }
  // Legacy model: total_payout_percent of total revenue
  const maxP = t.max_participants ?? 0;
  const pct  = t.total_payout_percent ?? 0;
  if (maxP <= 0 || pct <= 0) return null;
  return Math.floor(t.entry_fee * maxP * pct / 100);
}

function TournamentCard({ t, index }: { t: BlitzTournament; index: number }) {
  const router      = useRouter();
  const isReg       = t.status === "registration";
  const isActive    = t.status === "active";
  const isCompleted = t.status === "completed";
  const isScoring   = t.status === "scoring";

  const countdownTarget = isActive ? t.tournament_end : t.tournament_start;
  const { label: countdownLabel, urgent } = useCountdown(countdownTarget ?? "");

  const livePool       = t.prize_pool ?? 0;
  const maxPool        = computeMaxPool(t);
  const poolDisplay    = livePool > 0 ? `₦${livePool.toLocaleString()}` : maxPool != null ? `₦${maxPool.toLocaleString()}` : "—";
  const poolSub        = livePool > 0 ? null : maxPool != null ? "if full" : null;
  const positionPrizes = t.position_prizes ?? [];

  const accentColor = isActive ? "var(--accent-amber)" : "var(--accent-indigo)";
  const accentBg    = isActive ? "rgba(232,163,61,0.08)" : "rgba(76,111,255,0.06)";
  const accentBord  = isActive ? "rgba(232,163,61,0.2)"  : "rgba(76,111,255,0.18)";

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      onClick={() => router.push(`/blitz/${t.id}`)}
      className="cursor-pointer rounded-2xl overflow-hidden transition-all"
      style={{
        backgroundColor: "var(--bg-card)",
        border: `1px solid ${isActive ? "rgba(232,163,61,0.22)" : "var(--border-subtle)"}`,
        boxShadow: isActive ? "0 0 0 1px rgba(232,163,61,0.08) inset" : "none",
      }}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.99 }}
    >
      {/* Accent top strip for active */}
      {isActive && (
        <div className="h-0.5 w-full" style={{ background: "linear-gradient(90deg, var(--accent-amber) 0%, rgba(232,163,61,0.2) 100%)" }} />
      )}

      <div className="p-4 space-y-3.5">

        {/* ── Row 1: title + badge ── */}
        <div className="flex items-center gap-2 min-w-0">
          <Zap size={15} className="flex-shrink-0" style={{ color: accentColor }} />
          <h3 className="font-black text-[15px] leading-snug text-white truncate flex-1">{t.title}</h3>
          <StatusPill status={t.status} />
        </div>

        {/* ── Row 2: 3 stat chips in a single row ── */}
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { label: "Entry",      value: `₦${t.entry_fee.toLocaleString()}`,   color: "var(--accent-amber)" },
            { label: "Prize Pool", value: poolDisplay, sub: poolSub ?? undefined, color: livePool > 0 ? "var(--text-primary)" : "var(--text-secondary)" },
            { label: "Players",    value: `${t.total_registered}${t.max_participants ? `/${t.max_participants}` : ""}`, color: "var(--text-primary)" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl px-2.5 py-2 text-center"
              style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border-hairline)" }}>
              <p className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>{s.label}</p>
              <p className="font-black text-[13px] font-mono leading-none" style={{ color: s.color }}>{s.value}</p>
              {s.sub && <p className="text-[8px] mt-0.5 font-medium" style={{ color: "var(--text-muted)" }}>{s.sub}</p>}
            </div>
          ))}
        </div>

        {/* ── Row 3: speed + rank rewards (only when present) ── */}
        {(t.per_question_time_seconds != null || positionPrizes.length > 0) && (
          <div className="flex flex-wrap gap-1.5">
            {t.per_question_time_seconds != null && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: "rgba(232,163,61,0.1)", color: "var(--accent-amber)", border: "1px solid rgba(232,163,61,0.2)" }}>
                <Timer size={9} />{t.per_question_time_seconds}s/q
              </span>
            )}
            {positionPrizes.map((p) => (
              <span key={p.position} className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: "rgba(124,111,232,0.1)", color: "var(--accent-violet)", border: "1px solid rgba(124,111,232,0.18)" }}>
                #{p.position} {p.prize_type === "free_ticket" ? "· Free entry 🎫" : `· ${p.discount_percent ?? "?"}% off 🏷️`}
              </span>
            ))}
          </div>
        )}

        {/* ── Row 4: countdown + CTA ── */}
        <div className="flex items-center justify-between gap-2 pt-0.5"
          style={{ borderTop: "1px solid var(--border-hairline)" }}>

          {/* Countdown pill */}
          {(isActive || isReg) ? (
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-black font-mono ${isActive && urgent ? "animate-pulse" : ""}`}
              style={{ backgroundColor: accentBg, border: `1px solid ${accentBord}`, color: accentColor }}>
              <Clock size={11} />
              {isActive ? `Ends ${countdownLabel}` : `Starts ${countdownLabel}`}
            </div>
          ) : isScoring ? (
            <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>Calculating results…</span>
          ) : (
            <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>Tournament ended</span>
          )}

          {/* CTA */}
          <div className={`inline-flex items-center gap-1 text-xs font-black px-3.5 py-1.5 rounded-xl flex-shrink-0 transition-colors ${
            isCompleted || isScoring
              ? "opacity-40"
              : ""
          }`}
            style={{
              backgroundColor: isActive ? "rgba(232,163,61,0.12)" : "rgba(76,111,255,0.1)",
              border: `1px solid ${isActive ? "rgba(232,163,61,0.3)" : "rgba(76,111,255,0.25)"}`,
              color: isActive ? "var(--accent-amber)" : isCompleted || isScoring ? "var(--text-muted)" : "var(--accent-indigo)",
            }}>
            {isReg ? "Register" : isCompleted ? "Results" : isScoring ? "Scoring…" : "View"}
            {!isScoring && <ChevronRight size={11} />}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Section header ────────────────────────────────────────────────────────────
function SectionHeader({ title, count }: { title: string; count: number }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <h2 className="text-[11px] font-black uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>{title}</h2>
      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
        style={{ backgroundColor: "var(--bg-base)", color: "var(--text-muted)", border: "1px solid var(--border-hairline)" }}>
        {count}
      </span>
    </div>
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

  return (
    <div className="max-w-2xl mx-auto px-4 py-5 space-y-6">

      {error && (
        <p className="text-sm rounded-xl p-3" style={{ color: "#f87171", backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>{error}</p>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl h-36 animate-pulse" style={{ backgroundColor: "var(--bg-card)" }} />
          ))}
        </div>
      ) : tournaments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
            style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
            <Zap size={26} style={{ color: "var(--text-muted)" }} />
          </div>
          <p className="font-bold text-sm" style={{ color: "var(--text-secondary)" }}>No tournaments right now</p>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Check back soon for new Blitz events</p>
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <section>
              <SectionHeader title="Live Now" count={active.length} />
              <div className="space-y-3">
                {active.map((t, i) => <TournamentCard key={t.id} t={t} index={i} />)}
              </div>
            </section>
          )}
          {registration.length > 0 && (
            <section>
              <SectionHeader title="Registration Open" count={registration.length} />
              <div className="space-y-3">
                {registration.map((t, i) => <TournamentCard key={t.id} t={t} index={i} />)}
              </div>
            </section>
          )}
          {scoring.length > 0 && (
            <section>
              <SectionHeader title="Calculating Results" count={scoring.length} />
              <div className="space-y-3">
                {scoring.map((t, i) => <TournamentCard key={t.id} t={t} index={i} />)}
              </div>
            </section>
          )}
          {completed.length > 0 && (
            <section>
              <SectionHeader title="Completed" count={completed.length} />
              <div className="space-y-3">
                {completed.map((t, i) => <TournamentCard key={t.id} t={t} index={i} />)}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
