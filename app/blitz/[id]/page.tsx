"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { blitzApi, type BlitzTournament, ApiError } from "@/lib/api";
import { ArrowLeft, Zap, Users, Clock, Trophy, Ticket, CheckCircle, Loader2 } from "lucide-react";

function formatCountdown(target: string): string {
  const diffMs = new Date(target).getTime() - Date.now();
  if (diffMs <= 0) return "Ended";
  const h = Math.floor(diffMs / 3600000);
  const m = Math.floor((diffMs % 3600000) / 60000);
  const s = Math.floor((diffMs % 60000) / 1000);
  if (h > 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
  return h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`;
}

export default function BlitzDetailPage() {
  const { state, dispatch } = useApp();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [tournament, setTournament] = useState<BlitzTournament | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [hasAttempted, setHasAttempted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState("");
  const [ticketCode, setTicketCode] = useState("");
  const [ticketValidating, setTicketValidating] = useState(false);
  const [ticketValid, setTicketValid] = useState<{ valid: boolean; message?: string } | null>(null);

  useEffect(() => {
    if (!state.isAuthenticated) { router.push("/auth"); return; }
    blitzApi.getOne(id)
      .then((res) => {
        setTournament(res.tournament);
        setIsRegistered(res.is_registered);
        setHasAttempted(res.has_attempted);
      })
      .catch((err) => { if (err instanceof ApiError) setError(err.message); })
      .finally(() => setLoading(false));
  }, [state.isAuthenticated, id, router]);

  useEffect(() => {
    if (!tournament) return;
    const tick = () => {
      if (tournament.status === "registration") setCountdown(formatCountdown(tournament.tournament_start));
      else if (tournament.status === "active") setCountdown(formatCountdown(tournament.tournament_end));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [tournament]);

  useEffect(() => {
    if (tournament?.status === "completed") router.replace(`/blitz/${id}/results`);
  }, [tournament, id, router]);

  const handleRegister = async () => {
    if (!tournament) return;
    setRegistering(true);
    setError("");
    try {
      await blitzApi.register(id, ticketCode || undefined);
      setIsRegistered(true);
      dispatch({ type: "UPDATE_BALANCE", balance: (state.player?.balance ?? 0) - (ticketCode ? 0 : tournament.entry_fee) });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === "TICKET_EXPIRED") {
          setError("This ticket has expired. Proceed with paid entry instead.");
          setTicketValid({ valid: false, message: "Expired" });
        } else if (err.code === "TICKET_ALREADY_USED") {
          setError("This ticket was already used.");
          setTicketValid({ valid: false, message: "Already used" });
        } else {
          setError(err.message);
        }
      }
    } finally {
      setRegistering(false);
    }
  };

  const validateTicket = async (code: string) => {
    if (!code.trim()) {
      setTicketValid(null);
      return;
    }
    setTicketValidating(true);
    try {
      // Validate by attempting to register with dry-run (we'll catch the response)
      // For now, assume it's valid if it's 6+ chars (backend will validate on register)
      if (code.length >= 6) {
        setTicketValid({ valid: true });
      } else {
        setTicketValid({ valid: false, message: "Invalid format" });
      }
    } finally {
      setTicketValidating(false);
    }
  };

  if (!state.isAuthenticated) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Loader2 size={24} className="animate-spin" style={{ color: "var(--accent-indigo)" }} />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="flex items-center justify-center min-h-64 text-sm" style={{ color: "var(--text-muted)" }}>
        Tournament not found.
      </div>
    );
  }

  // ── Prize model ────────────────────────────────────────────────────────────
  const cashWinnerCount = tournament.cash_winner_count ?? 3;
  const payoutDist = tournament.payout_distribution ?? [60, 25, 15];
  const totalPayoutPct = tournament.total_payout_percent ?? (100 - (tournament.platform_cut_percent ?? 30));
  const ticketTierPct = tournament.ticket_tier_percent ?? 0;

  // Live pool (from actual registrations)
  const currentPool = tournament.prize_pool > 0 ? tournament.prize_pool : null;

  // Ceiling pool: max_participants × entry_fee × totalPayoutPct — always calculable
  const maxParticipants = tournament.max_participants ?? 0;
  const ceilingPool = maxParticipants > 0
    ? Math.floor(tournament.entry_fee * maxParticipants * totalPayoutPct / 100)
    : null;

  // What to show in the Prize Pool stat card
  const poolDisplay = currentPool
    ? `₦${currentPool.toLocaleString()}`
    : ceilingPool
    ? `up to ₦${ceilingPool.toLocaleString()}`
    : "—";

  // Per-rank rows — use ceiling pool for "up to ₦X" figures; never show "—"
  const cashPrizes: { rank: number; pct: number; ceiling: number | null; live: number | null }[] = Array.from(
    { length: cashWinnerCount },
    (_, i) => {
      const pct = payoutDist[i] ?? 0;
      return {
        rank: i + 1,
        pct,
        ceiling: ceilingPool != null ? Math.floor(ceilingPool * pct / 100) : null,
        live: currentPool != null ? Math.floor(currentPool * pct / 100) : null,
      };
    }
  );

  const hasTicketTier = ticketTierPct > 0;
  const rankLabel = (n: number) => n === 1 ? "1st Place" : n === 2 ? "2nd Place" : n === 3 ? "3rd Place" : `${n}th Place`;
  const trophyColor = (n: number) => n === 1 ? "#facc15" : n === 2 ? "#9ca3af" : n === 3 ? "#ea580c" : "var(--accent-indigo)";

  return (
    <div className="max-w-2xl mx-auto px-4 lg:px-8 py-6 space-y-4">

      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm font-medium transition-colors" style={{ color: "var(--text-muted)" }}>
        <ArrowLeft size={16} /> Back to Blitz
      </button>

      {error && (
        <p className="text-sm rounded-xl p-3" style={{ color: "#f87171", backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}>{error}</p>
      )}

      {/* Main info */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-5 space-y-4 border" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Zap size={16} style={{ color: "var(--accent-indigo)" }} />
            <h1 className="font-black text-2xl leading-tight" style={{ color: "var(--text-primary)" }}>{tournament.title}</h1>
          </div>
          {tournament.description && <p className="text-sm" style={{ color: "var(--text-muted)" }}>{tournament.description}</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Entry Fee", value: `₦${tournament.entry_fee.toLocaleString()}`, color: "var(--text-primary)" },
            { label: "Prize Pool", value: poolDisplay, color: "var(--accent-amber)" },
            { label: "Questions", value: String(tournament.question_count), color: "var(--text-primary)" },
            { label: "Time Limit", value: `${Math.floor(tournament.time_limit_seconds / 60)}m`, color: "var(--text-primary)" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl p-3" style={{ backgroundColor: "var(--bg-base)" }}>
              <p className="text-[10px] uppercase tracking-wide mb-1 font-bold" style={{ color: "var(--text-muted)" }}>{s.label}</p>
              <p className="font-black text-xl font-mono" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
          <Users size={14} />
          <span>{tournament.total_registered} registered{tournament.max_participants ? ` / ${tournament.max_participants} max` : ""}</span>
        </div>
      </motion.div>

      {/* Countdown */}
      {(tournament.status === "registration" || tournament.status === "active") && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-5 flex items-center justify-between border" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}>
          <div className="flex items-center gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
            <Clock size={16} />
            {tournament.status === "registration" ? "Tournament starts in" : "Ends in"}
          </div>
          <div className="text-right">
            <span className="font-black text-2xl tabular-nums font-mono" style={{ color: countdown === "Ended" ? "var(--text-muted)" : "var(--accent-amber)" }}>
              {countdown}
            </span>
            {countdown === "Ended" && (
              <p className="text-xs mt-1" style={{ color: "var(--accent-amber)" }}>Awaiting results</p>
            )}
          </div>
        </motion.div>
      )}

      {/* Prize breakdown — dynamic from cash_winner_count + payout_distribution */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="rounded-2xl p-5 space-y-3 border" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}>
        <div className="flex items-center justify-between">
          <p className="text-[11px] uppercase tracking-widest font-bold" style={{ color: "var(--text-muted)" }}>Prize Breakdown</p>
          <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
            {currentPool ? "live pool" : ceilingPool ? "at max capacity" : ""}
          </p>
        </div>
        <div className="space-y-3">
          {cashPrizes.map((p) => (
            <div key={p.rank} className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Trophy size={15} style={{ color: trophyColor(p.rank) }} />
                <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{rankLabel(p.rank)}</span>
                <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>({p.pct}%)</span>
              </div>
              <div className="text-right">
                {p.live != null ? (
                  <span className="font-black font-mono" style={{ color: "var(--accent-amber)" }}>
                    ₦{p.live.toLocaleString()}
                  </span>
                ) : p.ceiling != null ? (
                  <span className="font-black font-mono" style={{ color: "var(--text-secondary)" }}>
                    up to ₦{p.ceiling.toLocaleString()}
                  </span>
                ) : (
                  <span className="font-black font-mono" style={{ color: "var(--text-muted)" }}>—</span>
                )}
              </div>
            </div>
          ))}
          {hasTicketTier && (
            <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: "var(--border-hairline)" }}>
              <div className="flex items-center gap-2 text-sm">
                <Ticket size={15} style={{ color: "var(--accent-violet)" }} />
                <span style={{ color: "var(--text-secondary)" }}>
                  {cashWinnerCount + 1}th+ Place
                </span>
              </div>
              <span className="font-bold text-sm" style={{ color: "var(--accent-violet)" }}>Free Ticket ({ticketTierPct}%)</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* CTA */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        {tournament.status === "registration" && !isRegistered && (
          <>
            {/* Ticket Code Input */}
            <div className="mb-4 space-y-3">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest mb-2 block" style={{ color: "var(--text-muted)" }}>
                  Have a free ticket?
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter ticket code (optional)"
                    value={ticketCode}
                    onChange={(e) => {
                      setTicketCode(e.target.value.toUpperCase());
                      validateTicket(e.target.value.toUpperCase());
                    }}
                    className="flex-1 rounded-xl px-4 py-3 text-sm outline-none transition-colors"
                    style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)" }}
                  />
                  {ticketValidating && <Loader2 size={20} className="animate-spin self-center" style={{ color: "var(--accent-indigo)" }} />}
                </div>
              </div>

              {ticketValid && (
                <div className="text-xs p-2.5 rounded-lg" style={
                  ticketValid.valid
                    ? { backgroundColor: "rgba(76,111,255,0.08)", color: "var(--accent-indigo)", border: "1px solid rgba(76,111,255,0.25)" }
                    : { backgroundColor: "rgba(239,68,68,0.08)", color: "#f87171", border: "1px solid rgba(239,68,68,0.25)" }
                }>
                  {ticketValid.valid ? "✓ Ticket valid" : `✗ ${ticketValid.message}`}
                </div>
              )}

              {ticketCode && ticketValid?.valid && (
                <div className="rounded-xl p-3 text-sm" style={{ backgroundColor: "rgba(124,111,232,0.1)", border: "1px solid rgba(124,111,232,0.3)", color: "var(--accent-violet)" }}>
                  Entry fee: <span className="line-through" style={{ color: "var(--text-muted)" }}>₦{tournament.entry_fee.toLocaleString()}</span>{" "}
                  <span className="font-bold">FREE ENTRY</span>
                </div>
              )}
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleRegister}
              disabled={registering || (state.player?.balance ?? 0) < tournament.entry_fee}
              className="w-full py-4 font-black text-lg rounded-xl disabled:opacity-40 transition-opacity"
              style={{ backgroundColor: "var(--accent-indigo)", color: "#fff" }}
            >
              {registering ? "Registering..." : ticketCode && ticketValid?.valid
                ? "Register — FREE ENTRY"
                : `Register — ₦${tournament.entry_fee.toLocaleString()}`}
            </motion.button>
          </>
        )}

        {tournament.status === "registration" && isRegistered && (
          <div className="w-full py-4 rounded-xl text-center space-y-1 border" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}>
            <div className="flex items-center justify-center gap-2 font-black" style={{ color: "var(--accent-indigo)" }}>
              <CheckCircle size={18} /> You&apos;re registered!
            </div>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Starts in {countdown}</p>
          </div>
        )}

        {tournament.status === "active" && isRegistered && !hasAttempted && (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push(`/blitz/${id}/play`)}
            className="w-full py-4 font-black text-xl rounded-xl"
            style={{ backgroundColor: "var(--accent-amber)", color: "#000" }}
          >
            Start Blitz →
          </motion.button>
        )}

        {tournament.status === "active" && isRegistered && hasAttempted && (
          <div className="w-full py-4 rounded-xl text-center border" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}>
            <p className="font-bold" style={{ color: "var(--text-primary)" }}>Attempt submitted</p>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Results announced when tournament closes</p>
          </div>
        )}

        {tournament.status === "active" && !isRegistered && (
          <div className="w-full py-4 rounded-xl text-center border" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Registration is closed</p>
          </div>
        )}

        {tournament.status === "scoring" && (
          <div className="w-full py-4 rounded-xl text-center border" style={{ backgroundColor: "var(--bg-card)", borderColor: "rgba(234,179,8,0.25)" }}>
            <p className="font-bold text-sm" style={{ color: "var(--accent-amber)" }}>Scoring in progress...</p>
          </div>
        )}
      </motion.div>

    </div>
  );
}
