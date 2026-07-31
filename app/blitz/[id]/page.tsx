"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { blitzApi, type BlitzTournament, ApiError } from "@/lib/api";
import { ArrowLeft, Zap, Users, Clock, Trophy, Ticket, CheckCircle, Loader2, Timer } from "lucide-react";

function formatCountdown(target: string): string {
  const ms = new Date(target).getTime() - Date.now();
  if (ms <= 0) return "Ended";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  if (h > 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
  return h > 0 ? `${h}h ${m}m` : `${m}m ${s}s`;
}

export default function BlitzDetailPage() {
  const { state, dispatch } = useApp();
  const router  = useRouter();
  const params  = useParams();
  const id      = params.id as string;

  const [tournament,    setTournament]    = useState<BlitzTournament | null>(null);
  const [isRegistered,  setIsRegistered]  = useState(false);
  const [hasAttempted,  setHasAttempted]  = useState(false);
  const [loading,       setLoading]       = useState(true);
  const [registering,   setRegistering]   = useState(false);
  const [error,         setError]         = useState("");
  const [countdown,     setCountdown]     = useState("");
  const [ticketCode,    setTicketCode]    = useState("");
  const [ticketValidating, setTicketValidating] = useState(false);
  const [ticketValid,   setTicketValid]   = useState<{ valid: boolean; message?: string } | null>(null);

  useEffect(() => {
    if (!state.isAuthenticated) { router.push("/auth"); return; }
    blitzApi.getOne(id)
      .then((res) => { setTournament(res.tournament); setIsRegistered(res.is_registered); setHasAttempted(res.has_attempted); })
      .catch((err) => { if (err instanceof ApiError) setError(err.message); })
      .finally(() => setLoading(false));
  }, [state.isAuthenticated, id, router]);

  useEffect(() => {
    if (!state.isAuthenticated) return;
    const poll = setInterval(async () => {
      try {
        const res = await blitzApi.getOne(id);
        setTournament(res.tournament);
        setIsRegistered(res.is_registered);
        setHasAttempted(res.has_attempted);
      } catch { /* silent */ }
    }, 30000);
    return () => clearInterval(poll);
  }, [state.isAuthenticated, id]);

  useEffect(() => {
    if (!tournament) return;
    const tick = () => {
      if (tournament.status === "registration") setCountdown(formatCountdown(tournament.tournament_start));
      else if (tournament.status === "active")  setCountdown(formatCountdown(tournament.tournament_end));
    };
    tick();
    const id2 = setInterval(tick, 1000);
    return () => clearInterval(id2);
  }, [tournament]);

  useEffect(() => {
    if (tournament?.status === "completed") router.replace(`/blitz/${id}/results`);
  }, [tournament, id, router]);

  const handleRegister = async () => {
    if (!tournament) return;
    setRegistering(true); setError("");
    try {
      const res = await blitzApi.register(id, ticketCode || undefined);
      setIsRegistered(true);
      dispatch({ type: "UPDATE_BALANCE", balance: res.newBalance, bonus_balance: res.newBonusBalance ?? state.player?.bonus_balance ?? 0 });
    } catch (err) {
      if (err instanceof ApiError) {
        if      (err.code === "TICKET_EXPIRED")      { setError("This ticket has expired."); setTicketValid({ valid: false, message: "Expired" }); }
        else if (err.code === "TICKET_ALREADY_USED") { setError("This ticket was already used."); setTicketValid({ valid: false, message: "Already used" }); }
        else if (err.code === "TICKET_NOT_FOUND")    { setError("Invalid ticket code."); setTicketValid({ valid: false, message: "Not found" }); }
        else if (err.status === 402)                 setError("Not enough balance. Top up your wallet.");
        else if (err.status === 409)                 { setError("You're already registered."); setIsRegistered(true); }
        else                                         setError(err.message);
      }
    } finally { setRegistering(false); }
  };

  const validateTicket = async (code: string) => {
    if (!code.trim()) { setTicketValid(null); return; }
    setTicketValidating(true);
    try {
      setTicketValid(code.length >= 6 ? { valid: true } : { valid: false, message: "Invalid format" });
    } finally { setTicketValidating(false); }
  };

  if (!state.isAuthenticated) return null;

  if (loading) return (
    <div className="flex items-center justify-center min-h-64">
      <Loader2 size={22} className="animate-spin" style={{ color: "var(--accent-indigo)" }} />
    </div>
  );

  if (!tournament) return (
    <div className="flex items-center justify-center min-h-64 text-sm" style={{ color: "var(--text-muted)" }}>
      Tournament not found.
    </div>
  );

  // ── Prize model ───────────────────────────────────────────────────────────
  const cashWinnerCount = tournament.cash_winner_count ?? 3;
  const payoutDist      = tournament.payout_distribution?.length ? tournament.payout_distribution : [60, 25, 15];
  const totalPayoutPct  = tournament.total_payout_percent ?? (100 - (tournament.platform_cut_percent ?? 30));
  const maxParticipants = tournament.max_participants ?? 0;
  const livePool        = tournament.prize_pool ?? 0;
  const hasLivePool     = livePool > 0;
  const ceilingPool     = maxParticipants > 0 && totalPayoutPct > 0
    ? Math.floor(tournament.entry_fee * maxParticipants * totalPayoutPct / 100)
    : null;
  const poolDisplay     = hasLivePool ? `₦${livePool.toLocaleString()}` : ceilingPool != null ? `up to ₦${ceilingPool.toLocaleString()}` : "₦0";
  const cashPrizes      = Array.from({ length: cashWinnerCount }, (_, i) => {
    const pct          = payoutDist[i] ?? 0;
    const livePrize    = hasLivePool && pct > 0 ? Math.floor(livePool * pct / 100) : null;
    const ceilingPrize = !hasLivePool && ceilingPool != null && pct > 0 ? Math.floor(ceilingPool * pct / 100) : null;
    return { rank: i + 1, pct, livePrize, ceilingPrize };
  });
  const positionPrizes  = tournament.position_prizes ?? [];
  const rankLabel       = (n: number) => n === 1 ? "1st" : n === 2 ? "2nd" : n === 3 ? "3rd" : `${n}th`;
  const trophyColor     = (n: number) => n === 1 ? "#facc15" : n === 2 ? "#9ca3af" : "#ea580c";
  const totalBalance    = (state.player?.balance ?? 0) + (state.player?.bonus_balance ?? 0);
  const canAfford       = totalBalance >= tournament.entry_fee;

  const isReg    = tournament.status === "registration";
  const isActive = tournament.status === "active";

  const accentColor = isActive ? "var(--accent-amber)" : "var(--accent-indigo)";
  const accentBg    = isActive ? "rgba(232,163,61,0.07)" : "rgba(76,111,255,0.06)";
  const accentBord  = isActive ? "rgba(232,163,61,0.2)"  : "rgba(76,111,255,0.18)";

  return (
    <div className="max-w-lg mx-auto px-4 py-5 space-y-3">

      {/* Back */}
      <button onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm font-medium transition-colors mb-1"
        style={{ color: "var(--text-muted)" }}>
        <ArrowLeft size={15} /> Back
      </button>

      {error && (
        <div className="text-sm rounded-xl px-4 py-3" style={{ color: "#f87171", backgroundColor: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)" }}>
          {error}
        </div>
      )}

      {/* ── Hero card ── */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl overflow-hidden"
        style={{ backgroundColor: "var(--bg-card)", border: `1px solid ${isActive ? "rgba(232,163,61,0.22)" : "var(--border-subtle)"}` }}>

        {/* Accent strip */}
        {(isActive || isReg) && (
          <div className="h-0.5" style={{ background: `linear-gradient(90deg, ${accentColor} 0%, transparent 100%)` }} />
        )}

        <div className="p-5 space-y-4">

          {/* Title row */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Zap size={16} style={{ color: accentColor }} />
              <h1 className="font-black text-xl leading-tight text-white flex-1 min-w-0 truncate">{tournament.title}</h1>
              <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                isActive
                  ? "bg-[#E8A33D]/15 text-[#E8A33D] border-[#E8A33D]/3"
                  : isReg
                  ? "bg-blue-500/15 text-blue-400 border-blue-500/25"
                  : "bg-white/5 text-gray-500 border-white/8"
              }`}>
                {isActive ? "Live" : isReg ? "Open" : tournament.status}
              </span>
            </div>
            {tournament.description && (
              <p className="text-sm ml-[24px]" style={{ color: "var(--text-muted)" }}>{tournament.description}</p>
            )}
          </div>

          {/* Stat row: 4 chips */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Entry Fee",  value: `₦${tournament.entry_fee.toLocaleString()}`,  color: "var(--accent-amber)" },
              { label: "Prize Pool", value: poolDisplay, color: hasLivePool ? "var(--accent-amber)" : "var(--text-secondary)", sub: hasLivePool ? "live" : ceilingPool ? "est. max" : undefined },
              { label: "Questions",  value: `${tournament.question_count} Qs`,            color: "var(--text-primary)" },
              { label: "Time Limit", value: tournament.time_limit_seconds > 0 ? `${Math.floor(tournament.time_limit_seconds / 60)}m` : "—", color: "var(--text-primary)" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl px-3 py-2.5"
                style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border-hairline)" }}>
                <p className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>{s.label}</p>
                <p className="font-black text-base font-mono leading-none" style={{ color: s.color }}>{s.value}</p>
                {s.sub && <p className="text-[9px] mt-0.5" style={{ color: "var(--text-muted)" }}>{s.sub}</p>}
              </div>
            ))}
          </div>

          {/* Players + speed row */}
          <div className="flex items-center flex-wrap gap-2">
            <div className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl"
              style={{ backgroundColor: "rgba(76,111,255,0.07)", border: "1px solid rgba(76,111,255,0.15)", color: "var(--accent-indigo)" }}>
              <Users size={12} />
              <span className="font-bold">
                {tournament.total_registered}{tournament.max_participants ? ` / ${tournament.max_participants}` : ""} players
              </span>
            </div>
            {tournament.per_question_time_seconds != null && (
              <div className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl"
                style={{ backgroundColor: "rgba(232,163,61,0.08)", border: "1px solid rgba(232,163,61,0.2)", color: "var(--accent-amber)" }}>
                <Timer size={12} />
                <span className="font-bold">{tournament.per_question_time_seconds}s per question</span>
              </div>
            )}
          </div>

          {/* Countdown strip — only when live or open */}
          {(isActive || isReg) && countdown && (
            <div className="flex items-center justify-between rounded-xl px-4 py-3"
              style={{ backgroundColor: accentBg, border: `1px solid ${accentBord}` }}>
              <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: accentColor }}>
                <Clock size={14} />
                {isActive ? "Ends in" : "Starts in"}
              </div>
              <span className="font-black text-xl tabular-nums font-mono" style={{ color: accentColor }}>
                {countdown}
              </span>
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Prize breakdown ── */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }}
        className="rounded-2xl p-4 space-y-2.5"
        style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>

        <div className="flex items-center justify-between mb-1">
          <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Prize Breakdown</p>
          <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
            {hasLivePool ? "live pool" : ceilingPool ? "at max capacity" : ""}
          </p>
        </div>

        {cashPrizes.map((p) => (
          <div key={p.rank} className="flex items-center justify-between py-1">
            <div className="flex items-center gap-2">
              <Trophy size={14} style={{ color: trophyColor(p.rank) }} />
              <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{rankLabel(p.rank)} Place</span>
            </div>
            <span className="font-black text-sm font-mono" style={{ color: p.livePrize != null ? "var(--accent-amber)" : "var(--text-secondary)" }}>
              {p.livePrize != null
                ? `₦${p.livePrize.toLocaleString()}`
                : p.ceilingPrize != null
                ? `up to ₦${p.ceilingPrize.toLocaleString()}`
                : `${p.pct}% of pool`}
            </span>
          </div>
        ))}

        {(() => {
          const nonCash = positionPrizes.filter(p => p.position > cashWinnerCount);
          return nonCash.length > 0 ? (
            <>
              <div className="my-1" style={{ borderTop: "1px solid var(--border-hairline)" }} />
              {nonCash.map((p) => (
                <div key={p.position} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2">
                    <Ticket size={14} style={{ color: "var(--accent-violet)" }} />
                    <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{rankLabel(p.position)} Place</span>
                  </div>
                  <span className="font-bold text-sm" style={{ color: "var(--accent-violet)" }}>
                    {p.prize_type === "free_ticket" ? "🎫 Free next entry" : `🏷️ ${p.discount_percent ?? "?"}% off`}
                  </span>
                </div>
              ))}
            </>
          ) : null;
        })()}
      </motion.div>

      {/* ── CTA ── */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
        className="space-y-3">

        {/* Registration open — not yet registered */}
        {tournament.status === "registration" && !isRegistered && (
          <div className="rounded-2xl p-4 space-y-3"
            style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>

            <label className="text-[10px] font-black uppercase tracking-widest block" style={{ color: "var(--text-muted)" }}>
              Have a free ticket?
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ticket code (optional)"
                value={ticketCode}
                onChange={(e) => { setTicketCode(e.target.value.toUpperCase()); validateTicket(e.target.value.toUpperCase()); }}
                className="flex-1 rounded-xl px-4 py-2.5 text-sm outline-none"
                style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)" }}
              />
              {ticketValidating && <Loader2 size={18} className="animate-spin self-center flex-shrink-0" style={{ color: "var(--accent-indigo)" }} />}
            </div>

            {ticketValid && (
              <p className="text-xs px-3 py-2 rounded-lg font-semibold" style={
                ticketValid.valid
                  ? { backgroundColor: "rgba(76,111,255,0.08)", color: "var(--accent-indigo)", border: "1px solid rgba(76,111,255,0.2)" }
                  : { backgroundColor: "rgba(239,68,68,0.07)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" }
              }>
                {ticketValid.valid ? "✓ Ticket valid — FREE entry" : `✗ ${ticketValid.message}`}
              </p>
            )}

            {!canAfford && !(ticketCode && ticketValid?.valid) && (
              <p className="text-xs text-center" style={{ color: "#f87171" }}>
                Insufficient balance. <a href="/wallet" style={{ textDecoration: "underline", fontWeight: 700 }}>Add funds →</a>
              </p>
            )}

            {!ticketCode && (state.player?.bonus_balance ?? 0) > 0 && canAfford && (
              <p className="text-xs text-center" style={{ color: "var(--accent-amber)" }}>
                ₦{Math.min(state.player?.bonus_balance ?? 0, tournament.entry_fee).toLocaleString()} from bonus credit
              </p>
            )}

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleRegister}
              disabled={registering || (!(ticketCode && ticketValid?.valid) && !canAfford)}
              className="w-full py-3.5 font-black text-base rounded-xl disabled:opacity-40 transition-opacity"
              style={{ backgroundColor: "var(--accent-indigo)", color: "#fff" }}>
              {registering ? "Registering…" : ticketCode && ticketValid?.valid
                ? "Register — FREE ENTRY"
                : `Register — ₦${tournament.entry_fee.toLocaleString()}`}
            </motion.button>
          </div>
        )}

        {/* Registration open — already registered */}
        {tournament.status === "registration" && isRegistered && (
          <div className="rounded-2xl px-5 py-4 flex items-center gap-3"
            style={{ backgroundColor: "rgba(76,111,255,0.07)", border: "1px solid rgba(76,111,255,0.18)" }}>
            <CheckCircle size={20} style={{ color: "var(--accent-indigo)", flexShrink: 0 }} />
            <div>
              <p className="font-black text-sm" style={{ color: "var(--accent-indigo)" }}>You&apos;re registered!</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Starts in {countdown}</p>
            </div>
          </div>
        )}

        {/* Active — ready to play */}
        {tournament.status === "active" && isRegistered && !hasAttempted && (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push(`/blitz/${id}/play`)}
            className="w-full py-4 font-black text-lg rounded-2xl"
            style={{ background: "linear-gradient(135deg, var(--accent-amber) 0%, #f59e0b 100%)", color: "#000" }}>
            Start Blitz →
          </motion.button>
        )}

        {/* Active — already played */}
        {tournament.status === "active" && isRegistered && hasAttempted && (
          <div className="rounded-2xl px-5 py-4 text-center"
            style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
            <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>Attempt submitted ✓</p>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Results posted when tournament closes</p>
          </div>
        )}

        {/* Active — missed registration */}
        {tournament.status === "active" && !isRegistered && (
          <div className="rounded-2xl px-5 py-4 text-center"
            style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
            <p className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>Registration closed</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>This tournament is already live</p>
          </div>
        )}

        {/* Scoring */}
        {tournament.status === "scoring" && (
          <div className="rounded-2xl px-5 py-4 text-center"
            style={{ backgroundColor: "rgba(232,163,61,0.06)", border: "1px solid rgba(232,163,61,0.2)" }}>
            <p className="font-bold text-sm" style={{ color: "var(--accent-amber)" }}>⚡ Calculating results…</p>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Results will appear automatically</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
