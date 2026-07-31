"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { blitzApi, type BlitzResult, ApiError } from "@/lib/api";
import { Trophy, Loader2, ArrowLeft, Copy, CheckCircle, Zap } from "lucide-react";

function formatTime(ms: number): string {
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}.${Math.floor((ms % 1000) / 100)}s`;
}

function trophyColor(pos: number): string {
  if (pos === 1) return "#facc15";
  if (pos === 2) return "#9ca3af";
  if (pos === 3) return "#ea580c";
  return "var(--accent-indigo)";
}

function rankLabel(n: number) {
  if (n === 1) return "1st";
  if (n === 2) return "2nd";
  if (n === 3) return "3rd";
  return `${n}th`;
}

export default function BlitzResultsPage() {
  const { state } = useApp();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [results, setResults] = useState<BlitzResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!state.isAuthenticated) { router.push("/auth"); return; }
    blitzApi.getResults(id)
      .then(setResults)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Results not available yet"))
      .finally(() => setLoading(false));
  }, [state.isAuthenticated, id, router]);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!state.isAuthenticated) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <Loader2 size={32} className="animate-spin" style={{ color: "var(--accent-indigo)" }} />
      </div>
    );
  }

  if (error || !results) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "rgba(239,68,68,0.1)" }}>
          <Zap size={28} className="text-red-400" />
        </div>
        <p className="text-white font-bold text-lg">{error || "Results not available yet"}</p>
        <p className="text-gray-500 text-sm">Results are published when the tournament closes.</p>
        <button
          onClick={() => router.push("/blitz")}
          className="mt-4 px-6 py-3 rounded-xl font-bold text-sm"
          style={{ backgroundColor: "var(--accent-indigo)", color: "#fff" }}
        >
          Back to Blitz
        </button>
      </div>
    );
  }

  const myPrize = results.my_prize ?? results.player?.prize ?? null;
  // Use player.position (real final rank, even outside top 20) if available
  const myPosition = results.player?.position ?? results.my_position;
  const myScore = results.player?.score ?? results.my_score;
  const myPhone = state.player?.phone;

  return (
    <div className="min-h-screen pb-16" style={{ backgroundColor: "var(--bg-base)" }}>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Back */}
        <button
          onClick={() => router.push("/blitz")}
          className="flex items-center gap-2 text-sm font-medium"
          style={{ color: "var(--text-muted)" }}
        >
          <ArrowLeft size={16} /> Back to Blitz
        </button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-5 space-y-1 border"
          style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Zap size={16} style={{ color: "var(--accent-amber)" }} />
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
              Tournament Results
            </p>
          </div>
          <h1 className="text-xl font-black" style={{ color: "var(--text-primary)" }}>
            {results.tournament?.title ?? "Blitz Tournament"}
          </h1>
          {results.tournament && (
            <div className="flex gap-4 mt-2">
              <div>
                <p className="text-[10px] uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Prize Pool</p>
                <p className="font-black text-lg font-mono" style={{ color: "var(--accent-amber)" }}>
                  ₦{results.tournament.prize_pool.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Players</p>
                <p className="font-black text-lg" style={{ color: "var(--text-primary)" }}>
                  {results.tournament.total_registered}
                </p>
              </div>
            </div>
          )}
        </motion.div>

        {/* My Prize */}
        <AnimatePresence>
          {myPrize && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl p-5 border"
              style={{
                backgroundColor:
                  myPrize.prize_type === "cash" ? "rgba(232,163,61,0.06)" :
                  myPrize.prize_type === "free_ticket" ? "rgba(76,111,255,0.06)" :
                  "rgba(124,111,232,0.06)",
                borderColor:
                  myPrize.prize_type === "cash" ? "rgba(232,163,61,0.35)" :
                  myPrize.prize_type === "free_ticket" ? "rgba(76,111,255,0.35)" :
                  "rgba(124,111,232,0.35)",
              }}
            >
              {myPrize.prize_type === "cash" && (
                <>
                  <p className="text-2xl mb-1">🏆</p>
                  <p className="font-black text-xl" style={{ color: "var(--accent-amber)" }}>
                    You won ₦{myPrize.amount.toLocaleString()}!
                  </p>
                  <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                    Credited to your wallet — {rankLabel(myPosition ?? 1)} place
                  </p>
                </>
              )}
              {myPrize.prize_type === "free_ticket" && (
                <>
                  <p className="text-2xl mb-1">🎫</p>
                  <p className="font-black text-xl" style={{ color: "var(--accent-indigo)" }}>
                    Free entry to the next tournament!
                  </p>
                  {myPrize.ticket_code && (
                    <div className="flex items-center gap-3 mt-3">
                      <code className="font-mono font-bold text-sm px-3 py-2 rounded-lg" style={{ backgroundColor: "rgba(76,111,255,0.12)", color: "var(--accent-indigo)" }}>
                        {myPrize.ticket_code}
                      </code>
                      <button
                        onClick={() => handleCopy(myPrize.ticket_code!)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-colors"
                        style={{ backgroundColor: "rgba(76,111,255,0.15)", color: "var(--accent-indigo)" }}
                      >
                        {copied ? <CheckCircle size={12} /> : <Copy size={12} />}
                        {copied ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  )}
                </>
              )}
              {myPrize.prize_type === "discount" && (
                <>
                  <p className="text-2xl mb-1">🏷️</p>
                  <p className="font-black text-xl" style={{ color: "#c084fc" }}>
                    Discount on your next entry!
                  </p>
                  {myPrize.ticket_code && (
                    <div className="flex items-center gap-3 mt-3">
                      <code className="font-mono font-bold text-sm px-3 py-2 rounded-lg" style={{ backgroundColor: "rgba(124,111,232,0.12)", color: "#c084fc" }}>
                        {myPrize.ticket_code}
                      </code>
                      <button
                        onClick={() => handleCopy(myPrize.ticket_code!)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-colors"
                        style={{ backgroundColor: "rgba(124,111,232,0.15)", color: "#c084fc" }}
                      >
                        {copied ? <CheckCircle size={12} /> : <Copy size={12} />}
                        {copied ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  )}
                </>
              )}
              {myPrize.prize_type === null && (
                <>
                  <p className="text-2xl mb-1">💪</p>
                  <p className="font-bold text-lg" style={{ color: "var(--text-primary)" }}>Good effort!</p>
                  <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                    Keep playing — prizes are waiting in the next round.
                  </p>
                </>
              )}
            </motion.div>
          )}
          {!myPrize && results.my_score != null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-2xl p-5 border"
              style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}
            >
              <p className="text-2xl mb-1">💪</p>
              <p className="font-bold text-lg" style={{ color: "var(--text-primary)" }}>Good effort!</p>
              <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                You scored {myScore} • Rank #{myPosition ?? "—"}. Watch for the next tournament.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* My score summary */}
        {myScore != null && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-5 border"
            style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}
          >
            <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
              Your Result
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl p-3" style={{ backgroundColor: "var(--bg-base)" }}>
                <p className="text-[10px] uppercase tracking-wide mb-1 font-bold" style={{ color: "var(--text-muted)" }}>Score</p>
                <p className="font-black text-2xl font-mono" style={{ color: "var(--accent-amber)" }}>{myScore}</p>
              </div>
              <div className="rounded-xl p-3" style={{ backgroundColor: "var(--bg-base)" }}>
                <p className="text-[10px] uppercase tracking-wide mb-1 font-bold" style={{ color: "var(--text-muted)" }}>Final Rank</p>
                <p className="font-black text-2xl font-mono" style={{ color: "var(--text-primary)" }}>
                  #{myPosition ?? "—"}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Leaderboard */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl overflow-hidden border"
          style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}
        >
          <div className="px-5 py-4 border-b" style={{ borderColor: "var(--border-hairline)" }}>
            <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
              Leaderboard
            </p>
          </div>
          <div className="divide-y" style={{ borderColor: "var(--border-hairline)" }}>
            {results.leaderboard.slice(0, 20).map((entry) => {
              const isMe = myPhone && entry.player_phone.slice(-4) === myPhone.slice(-4);
              return (
                <div
                  key={entry.position}
                  className="flex items-center gap-3 px-5 py-3.5"
                  style={{
                    backgroundColor: isMe ? "rgba(232,163,61,0.05)" : "transparent",
                    borderLeft: isMe ? "3px solid var(--accent-amber)" : "3px solid transparent",
                  }}
                >
                  {/* Rank */}
                  <div className="w-8 flex-shrink-0 flex items-center justify-center">
                    {entry.position <= 3 ? (
                      <Trophy size={16} style={{ color: trophyColor(entry.position) }} />
                    ) : (
                      <span className="text-xs font-bold" style={{ color: "var(--text-muted)" }}>
                        #{entry.position}
                      </span>
                    )}
                  </div>

                  {/* Phone */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm" style={{ color: isMe ? "var(--accent-amber)" : "var(--text-primary)" }}>
                      {entry.player_phone}
                      {isMe && <span className="ml-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--accent-amber)" }}>You</span>}
                    </p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {formatTime(entry.total_time_ms)}
                    </p>
                  </div>

                  {/* Score + prize */}
                  <div className="text-right flex-shrink-0">
                    <p className="font-black text-sm font-mono" style={{ color: "var(--text-primary)" }}>
                      {entry.score}
                    </p>
                    {entry.prize_type === "cash" && entry.amount != null && (
                      <p className="text-[10px] font-bold" style={{ color: "var(--accent-amber)" }}>
                        ₦{entry.amount.toLocaleString()}
                      </p>
                    )}
                    {entry.prize_type === "free_ticket" && (
                      <p className="text-[10px] font-bold" style={{ color: "var(--accent-indigo)" }}>🎫 Ticket</p>
                    )}
                    {entry.prize_type === "discount" && (
                      <p className="text-[10px] font-bold" style={{ color: "#c084fc" }}>🏷️ Discount</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => router.push("/blitz")}
          className="w-full py-4 rounded-xl font-black text-base"
          style={{ backgroundColor: "var(--accent-indigo)", color: "#fff" }}
        >
          View Next Tournament →
        </motion.button>
      </div>
    </div>
  );
}
