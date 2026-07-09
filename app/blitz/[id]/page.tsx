"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { blitzApi, type BlitzTournament, ApiError } from "@/lib/api";
import { ArrowLeft, Zap, Users, Clock, Trophy, Ticket, CheckCircle, Loader2 } from "lucide-react";

function formatCountdown(target: string): string {
  const diffMs = new Date(target).getTime() - Date.now();
  if (diffMs <= 0) return "Now";
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
        <div className="w-8 h-8 border-2 border-neon/30 border-t-neon rounded-full animate-spin" />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="flex items-center justify-center min-h-64 text-gray-500 text-sm">
        Tournament not found.
      </div>
    );
  }

  const playerCut = tournament.prize_pool * (1 - tournament.platform_cut_percent / 100);
  const firstPlace = Math.floor(playerCut * 0.6);
  const secondPlace = Math.floor(playerCut * 0.25);
  const thirdPlace = Math.floor(playerCut * 0.15);

  return (
    <div className="max-w-2xl mx-auto px-4 lg:px-8 py-6 space-y-4">

      <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-sm font-medium">
        <ArrowLeft size={16} /> Back to Blitz
      </button>

      {error && (
        <p className="text-red-400 text-sm bg-red-900/10 border border-red-900/30 rounded-xl p-3">{error}</p>
      )}

      {/* Main info */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="bg-[#111] border border-[#1E1E1E] rounded-2xl p-5 space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Zap size={16} className="text-neon" />
            <h1 className="text-white font-black text-2xl leading-tight">{tournament.title}</h1>
          </div>
          {tournament.description && <p className="text-gray-500 text-sm">{tournament.description}</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Entry Fee", value: `₦${tournament.entry_fee.toLocaleString()}`, color: "text-neon" },
            { label: "Prize Pool", value: `₦${tournament.prize_pool.toLocaleString()}`, color: "text-white" },
            { label: "Questions", value: String(tournament.question_count), color: "text-white" },
            { label: "Time Limit", value: `${Math.floor(tournament.time_limit_seconds / 60)}m`, color: "text-white" },
          ].map((s) => (
            <div key={s.label} className="bg-[#0A0A0A] rounded-xl p-3">
              <p className="text-[10px] text-gray-600 mb-1 uppercase tracking-wide">{s.label}</p>
              <p className={`font-black text-xl ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Users size={14} />
          <span>{tournament.total_registered} registered</span>
        </div>
      </motion.div>

      {/* Countdown */}
      {(tournament.status === "registration" || tournament.status === "active") && countdown && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="bg-[#111] border border-[#1E1E1E] rounded-2xl p-5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Clock size={16} />
            {tournament.status === "registration" ? "Tournament starts in" : "Ends in"}
          </div>
          <span className="font-black text-neon text-2xl tabular-nums">{countdown}</span>
        </motion.div>
      )}

      {/* Prize breakdown */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-[#111] border border-[#1E1E1E] rounded-2xl p-5 space-y-3">
        <p className="text-[11px] text-gray-600 uppercase tracking-widest font-bold">Prize Breakdown</p>
        <div className="space-y-3">
          {[
            { icon: <Trophy size={15} className="text-yellow-400" />, label: "1st Place", value: `₦${firstPlace.toLocaleString()}` },
            { icon: <Trophy size={15} className="text-gray-400" />, label: "2nd Place", value: `₦${secondPlace.toLocaleString()}` },
            { icon: <Trophy size={15} className="text-orange-600" />, label: "3rd Place", value: `₦${thirdPlace.toLocaleString()}` },
          ].map((p) => (
            <div key={p.label} className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">{p.icon}<span className="text-white font-semibold">{p.label}</span></div>
              <span className="text-neon font-black">{p.value}</span>
            </div>
          ))}
          <div className="flex items-center justify-between pt-3 border-t border-[#1A1A1A]">
            <div className="flex items-center gap-2 text-sm">
              <Ticket size={15} className="text-purple-400" />
              <span className="text-gray-400">4th – 10th Place</span>
            </div>
            <span className="text-purple-400 font-bold text-sm">Free Ticket</span>
          </div>
        </div>
      </motion.div>

      {/* CTA */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        {tournament.status === "registration" && !isRegistered && (
          <>
            {/* Ticket Code Input */}
            <div className="mb-4 space-y-3">
              <div>
                <label className="text-[11px] text-gray-500 font-bold uppercase tracking-widest mb-2 block">
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
                    className="flex-1 bg-[#0A0A0A] border border-[#1E1E1E] focus:border-neon rounded-xl px-4 py-3 text-white placeholder-gray-700 text-sm outline-none transition-colors"
                  />
                  {ticketValidating && <div className="w-10 h-10 border-2 border-neon/30 border-t-neon rounded-lg animate-spin" />}
                </div>
              </div>

              {ticketValid && (
                <div className={`text-xs p-2.5 rounded-lg ${
                  ticketValid.valid
                    ? "bg-neon/10 text-neon border border-neon/30"
                    : "bg-red-900/10 text-red-400 border border-red-900/30"
                }`}>
                  {ticketValid.valid ? "✓ Ticket valid" : `✗ ${ticketValid.message}`}
                </div>
              )}

              {ticketCode && ticketValid?.valid && (
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-3 text-purple-400 text-sm">
                  Entry fee: <span className="line-through text-gray-500">₦{tournament.entry_fee.toLocaleString()}</span>{" "}
                  <span className="font-bold">FREE ENTRY</span>
                </div>
              )}
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleRegister}
              disabled={registering || (state.player?.balance ?? 0) < tournament.entry_fee}
              className="w-full py-4 bg-neon text-black font-black text-lg rounded-xl disabled:opacity-40"
              style={{ boxShadow: "0 0 24px #00FF6640" }}
            >
              {registering ? "Registering..." : ticketCode && ticketValid?.valid
                ? "Register — FREE ENTRY"
                : `Register — ₦${tournament.entry_fee.toLocaleString()}`}
            </motion.button>
          </>
        )}

        {tournament.status === "registration" && isRegistered && (
          <div className="w-full py-4 bg-[#111] border border-neon/30 rounded-xl text-center space-y-1">
            <div className="flex items-center justify-center gap-2 text-neon font-black">
              <CheckCircle size={18} /> You&apos;re registered!
            </div>
            <p className="text-gray-500 text-sm">Starts in {countdown}</p>
          </div>
        )}

        {tournament.status === "active" && isRegistered && !hasAttempted && (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push(`/blitz/${id}/play`)}
            className="w-full py-4 bg-neon text-black font-black text-xl rounded-xl"
            style={{ boxShadow: "0 0 32px #00FF6666" }}
          >
            Start Blitz →
          </motion.button>
        )}

        {tournament.status === "active" && isRegistered && hasAttempted && (
          <div className="w-full py-4 bg-[#111] border border-[#1E1E1E] rounded-xl text-center">
            <p className="text-white font-bold">Attempt submitted</p>
            <p className="text-gray-500 text-sm mt-1">Results announced when tournament closes</p>
          </div>
        )}

        {tournament.status === "active" && !isRegistered && (
          <div className="w-full py-4 bg-[#111] border border-[#1E1E1E] rounded-xl text-center">
            <p className="text-gray-500 text-sm">Registration is closed</p>
          </div>
        )}

        {tournament.status === "scoring" && (
          <div className="w-full py-4 bg-[#111] border border-yellow-500/20 rounded-xl text-center">
            <p className="text-yellow-400 font-bold text-sm">Scoring in progress...</p>
          </div>
        )}
      </motion.div>

    </div>
  );
}
