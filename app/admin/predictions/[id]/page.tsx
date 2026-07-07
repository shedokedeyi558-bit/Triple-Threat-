"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { adminApi, ApiError } from "@/lib/api";
import {
  Loader2, ArrowLeft, Users, Clock, AlertCircle,
  CheckCircle, Trophy, DollarSign, Lock, TrendingUp
} from "lucide-react";
import { motion } from "framer-motion";

interface Prediction {
  id: string;
  question: string;
  category: string;
  status: "draft" | "active" | "locked" | "completed" | "cancelled";
  entry_fee?: number;
  fee?: number;
  prize_per_winner: number;
  max_slots: number;
  slots_filled: number;
  countdown_end: string;
  answer_revealed_at?: string;
  correct_answer?: string;
}

interface Participant {
  id: string;
  player_phone: string;
  player_name?: string;
  answer: string;
  is_correct: boolean | null;
  amount_won: number;
  participated_at: string;
}

const statusBadge = (s: string) => {
  const map: Record<string, string> = {
    active:    "bg-neon/15 text-neon border border-neon/30",
    locked:    "bg-orange-900/20 text-orange-400 border border-orange-700/30",
    completed: "bg-blue-900/20 text-blue-400 border border-blue-700/30",
    draft:     "bg-gray-800 text-gray-500",
    cancelled: "bg-red-900/20 text-red-400",
  };
  return map[s] ?? "bg-gray-800 text-gray-500";
};

export default function AdminPredictionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const predId = params.id as string;

  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revealAnswer, setRevealAnswer] = useState("");
  const [revealing, setRevealing] = useState(false);
  const [revealResult, setRevealResult] = useState<{ total: number; correct: number; paid: number } | null>(null);
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => { fetchData(); }, [predId]); // eslint-disable-line

  const fetchData = async () => {
    try {
      setLoading(true);
      const [gameRes, partRes] = await Promise.allSettled([
        adminApi.getGame(predId),
        adminApi.getGameParticipants(predId),
      ]);
      if (gameRes.status === "fulfilled") setPrediction(gameRes.value.game as unknown as Prediction);
      if (partRes.status === "fulfilled") setParticipants(partRes.value.participations || []);
      if (gameRes.status === "rejected") setError("Failed to load prediction");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load prediction");
    } finally {
      setLoading(false);
    }
  };

  // Live countdown
  useEffect(() => {
    if (!prediction?.countdown_end) return;
    const tick = () => {
      const diff = Math.max(0, new Date(prediction.countdown_end).getTime() - Date.now());
      if (diff === 0) { setTimeLeft("Locked"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(h > 0 ? `${h}h ${m}m ${s}s` : m > 0 ? `${m}m ${s}s` : `${s}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [prediction]);

  const handleReveal = async () => {
    if (!revealAnswer.trim()) return;
    setRevealing(true);
    try {
      const res = await adminApi.revealGameAnswer(predId, revealAnswer);
      setRevealResult({ total: res.total_participants, correct: res.total_correct, paid: res.total_paid });
      await fetchData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to reveal answer");
    } finally {
      setRevealing(false);
    }
  };

  const maskPhone = (p: string) => `${p.slice(0, 4)}***${p.slice(-4)}`;

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 size={28} className="text-neon animate-spin" />
      </div>
    );
  }

  if (!prediction) {
    return (
      <div className="text-center py-16">
        <p className="text-red-400">{error || "Prediction not found"}</p>
        <button onClick={() => router.back()} className="mt-4 text-sm text-neon">Go back</button>
      </div>
    );
  }

  const fee = prediction.entry_fee ?? prediction.fee ?? 0;
  const totalRevenue = participants.length * fee;
  const totalPaid = participants.reduce((s, p) => s + p.amount_won, 0);
  const profit = totalRevenue - totalPaid;
  const correctCount = participants.filter((p) => p.is_correct === true).length;
  const isLocked = prediction.status === "locked" || new Date(prediction.countdown_end) < new Date();
  const canReveal = (prediction.status === "active" || prediction.status === "locked") && !prediction.correct_answer;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Back */}
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
        <ArrowLeft size={16} /> Back to Dashboard
      </button>

      {error && (
        <div className="bg-red-900/20 border border-red-800/40 rounded-xl p-3 text-red-400 text-sm flex gap-2">
          <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />{error}
        </div>
      )}

      {/* Reveal success */}
      {revealResult && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-neon/10 border border-neon/30 rounded-2xl p-4 flex items-start gap-3">
          <CheckCircle size={18} className="text-neon flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-neon font-bold text-sm">Answer Revealed & Winners Paid!</p>
            <p className="text-gray-400 text-xs mt-1">
              {revealResult.total} participants · {revealResult.correct} correct · ₦{revealResult.paid.toLocaleString()} paid out
            </p>
          </div>
        </motion.div>
      )}

      {/* Top section: 2 cols on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Question + meta */}
        <div className="lg:col-span-2 bg-card border border-[#2A2A2A] rounded-2xl p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Clock size={16} className="text-purple-400" />
                <span className="text-gray-500 text-xs uppercase tracking-widest font-bold">{prediction.category}</span>
              </div>
              <h1 className="text-white font-black text-xl leading-tight">{prediction.question}</h1>
            </div>
            <span className={`text-xs font-black px-3 py-1.5 rounded-lg flex-shrink-0 ${statusBadge(isLocked ? "locked" : prediction.status)}`}>
              {isLocked && prediction.status === "active" ? "LOCKED" : prediction.status.toUpperCase()}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Entry Fee", value: `₦${fee.toLocaleString()}`, color: "text-neon" },
              { label: "Prize/Winner", value: `₦${prediction.prize_per_winner.toLocaleString()}`, color: "text-white" },
              { label: "Participants", value: `${prediction.slots_filled}/${prediction.max_slots}`, color: "text-white" },
              { label: isLocked ? "Status" : "Lock-in", value: isLocked ? "Locked" : timeLeft, color: isLocked ? "text-orange-400" : "text-white" },
            ].map((s) => (
              <div key={s.label} className="bg-[#111] rounded-xl p-3">
                <p className="text-[10px] text-gray-600 uppercase tracking-wide mb-1">{s.label}</p>
                <p className={`font-black text-base ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Revealed answer */}
          {prediction.correct_answer && (
            <div className="bg-neon/10 border border-neon/30 rounded-xl p-3 flex items-center gap-3">
              <CheckCircle size={16} className="text-neon flex-shrink-0" />
              <div>
                <p className="text-[11px] text-gray-500">Correct Answer</p>
                <p className="text-neon font-black text-lg">{prediction.correct_answer}</p>
              </div>
            </div>
          )}
        </div>

        {/* Revenue summary */}
        <div className="space-y-3">
          {[
            { icon: <DollarSign size={15} className="text-neon" />, label: "Total Revenue", value: `₦${totalRevenue.toLocaleString()}`, color: "text-neon" },
            { icon: <Trophy size={15} className="text-yellow-400" />, label: "Total Paid Out", value: `₦${totalPaid.toLocaleString()}`, color: "text-yellow-400" },
            { icon: <TrendingUp size={15} className="text-blue-400" />, label: "Platform Profit", value: `₦${profit.toLocaleString()}`, color: profit >= 0 ? "text-blue-400" : "text-red-400" },
            { icon: <Users size={15} className="text-purple-400" />, label: "Correct Predictions", value: `${correctCount} / ${participants.length}`, color: "text-white" },
          ].map((s) => (
            <div key={s.label} className="bg-card border border-[#2A2A2A] rounded-xl p-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#1A1A1A] flex items-center justify-center flex-shrink-0">{s.icon}</div>
              <div>
                <p className="text-[11px] text-gray-500">{s.label}</p>
                <p className={`font-black text-base ${s.color}`}>{s.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reveal Answer Panel */}
      {canReveal && (
        <div className="bg-orange-900/10 border border-orange-700/30 rounded-2xl p-5 space-y-4">
          <div className="flex items-start gap-3">
            <Lock size={18} className="text-orange-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-orange-400 font-bold">Ready to Reveal Answer</p>
              <p className="text-gray-500 text-xs mt-0.5">
                {participants.length} player{participants.length !== 1 ? "s" : ""} submitted predictions. Enter the correct answer to pay winners.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <input
              type="text"
              value={revealAnswer}
              onChange={(e) => setRevealAnswer(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && revealAnswer.trim()) handleReveal(); }}
              placeholder="e.g. 3 goals, Yes, Chelsea wins"
              className="flex-1 bg-[#111] border border-[#2A2A2A] focus:border-orange-400 rounded-xl px-4 py-3 text-sm text-white outline-none"
            />
            <button
              onClick={handleReveal}
              disabled={revealing || !revealAnswer.trim()}
              className="px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl text-sm disabled:opacity-50 flex items-center gap-2 transition-colors"
            >
              {revealing ? <Loader2 size={14} className="animate-spin" /> : null}
              {revealing ? "Processing..." : "Reveal & Pay"}
            </button>
          </div>
        </div>
      )}

      {/* Participants table */}
      <div className="bg-card border border-[#2A2A2A] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#2A2A2A] flex items-center justify-between">
          <h2 className="text-white font-black flex items-center gap-2">
            <Users size={16} /> Participants
          </h2>
          <span className="text-gray-500 text-sm">{participants.length} total</span>
        </div>

        {participants.length === 0 ? (
          <div className="py-12 text-center">
            <Users size={28} className="text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No participants yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1E1E1E] bg-[#0D0D0D]">
                  <th className="text-left py-3 px-4 text-xs text-gray-600 font-semibold uppercase tracking-wider">Player</th>
                  <th className="text-left py-3 px-4 text-xs text-gray-600 font-semibold uppercase tracking-wider">Answer</th>
                  <th className="text-left py-3 px-4 text-xs text-gray-600 font-semibold uppercase tracking-wider">Correct?</th>
                  <th className="text-left py-3 px-4 text-xs text-gray-600 font-semibold uppercase tracking-wider">Prize Won</th>
                  <th className="text-left py-3 px-4 text-xs text-gray-600 font-semibold uppercase tracking-wider">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A1A1A]">
                {participants.map((p) => (
                  <tr key={p.id} className="hover:bg-[#111] transition-colors">
                    <td className="py-3 px-4 font-mono text-xs text-white">{maskPhone(p.player_phone)}</td>
                    <td className="py-3 px-4 text-gray-300 text-sm font-semibold">{p.answer}</td>
                    <td className="py-3 px-4">
                      {p.is_correct === null
                        ? <span className="text-gray-500 text-xs px-2 py-1 bg-gray-800 rounded-lg">Pending</span>
                        : p.is_correct
                          ? <span className="text-neon text-xs font-bold px-2 py-1 bg-neon/10 rounded-lg">✓ Correct</span>
                          : <span className="text-red-400 text-xs font-bold px-2 py-1 bg-red-900/20 rounded-lg">✗ Wrong</span>
                      }
                    </td>
                    <td className="py-3 px-4">
                      {p.amount_won > 0
                        ? <span className="text-neon font-black">₦{p.amount_won.toLocaleString()}</span>
                        : <span className="text-gray-600">—</span>
                      }
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-xs">
                      {new Date(p.participated_at).toLocaleString("en-NG", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
