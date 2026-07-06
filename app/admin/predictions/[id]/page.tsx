"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { adminApi, ApiError } from "@/lib/api";
import { Loader2, ArrowLeft, Users, Clock, AlertCircle, CheckCircle } from "lucide-react";

interface Prediction {
  id: string;
  title?: string;
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
  answer: string;
  is_correct: boolean | null;
  amount_won: number;
  participated_at: string;
}

const statusColor = (s: string) => {
  switch (s) {
    case "active":    return "bg-neon/20 text-neon";
    case "locked":    return "bg-orange-900/20 text-orange-400";
    case "completed": return "bg-blue-900/20 text-blue-400";
    case "draft":     return "bg-gray-800 text-gray-400";
    default:          return "bg-gray-800 text-gray-500";
  }
};

export default function PredictionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const predId = params.id as string;

  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revealAnswer, setRevealAnswer] = useState("");
  const [showRevealForm, setShowRevealForm] = useState(false);
  const [revealing, setRevealing] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => { fetchData(); }, [predId]); // eslint-disable-line

  const fetchData = async () => {
    try {
      setLoading(true);
      // Try dedicated predictions endpoint first, fallback to unified games endpoint
      let predData: any = null;
      let partsData: any[] = [];

      try {
        const res = await adminApi.getPrediction(predId);
        predData = res.prediction;
      } catch {
        // Fallback: try unified games endpoint
        const res = await adminApi.getGame(predId);
        predData = res.game;
      }

      try {
        const res = await adminApi.getPredictionParticipants(predId);
        partsData = res.participations || [];
      } catch {
        try {
          const res = await adminApi.getGameParticipants(predId);
          partsData = res.participations || [];
        } catch { /* no participants yet */ }
      }

      setPrediction(predData as Prediction);
      setParticipants(partsData);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load prediction");
    } finally {
      setLoading(false);
    }
  };

  // Countdown
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
    if (!revealAnswer.trim()) { alert("Enter correct answer first"); return; }
    setRevealing(true);
    try {
      let res: any;
      try {
        res = await adminApi.revealPredictionAnswer(predId, revealAnswer);
      } catch {
        res = await adminApi.revealGameAnswer(predId, revealAnswer);
      }
      alert(`Done!\n${res.total_participants} participants · ${res.total_correct} correct · ₦${res.total_paid} paid out`);
      setShowRevealForm(false);
      fetchData();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Failed to reveal answer");
    } finally {
      setRevealing(false);
    }
  };

  const maskPhone = (p: string) => `${p.slice(0, 4)}***${p.slice(-4)}`;

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={32} className="text-neon animate-spin" /></div>;

  if (!prediction) return (
    <div className="text-center py-12">
      <p className="text-red-400">{error || "Prediction not found"}</p>
      <button onClick={() => router.back()} className="mt-4 text-sm text-neon">Go back</button>
    </div>
  );

  const fee = prediction.entry_fee ?? prediction.fee ?? 0;

  return (
    <div className="space-y-5">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
        <ArrowLeft size={16} /> Back
      </button>

      {error && (
        <div className="bg-red-900/20 border border-red-800/40 rounded-xl p-3 text-red-400 text-sm flex gap-2">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />{error}
        </div>
      )}

      {/* Header card */}
      <div className="bg-card border border-[#2A2A2A] rounded-2xl p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <Clock size={22} className="text-purple-400 mt-0.5 flex-shrink-0" />
            <div>
              <h1 className="text-xl font-black text-white">Time Machine</h1>
              <p className="text-gray-400 text-sm mt-0.5">{prediction.category}</p>
            </div>
          </div>
          <span className={`text-xs font-bold px-3 py-1 rounded ${statusColor(prediction.status)}`}>
            {prediction.status.toUpperCase()}
          </span>
        </div>

        {/* Question */}
        <div className="bg-[#111] rounded-xl p-3 text-sm text-gray-200">
          {prediction.question}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div>
            <p className="text-gray-500 mb-1">Entry Fee</p>
            <p className="font-bold text-neon text-base">₦{fee.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Prize/Winner</p>
            <p className="font-bold text-neon text-base">₦{prediction.prize_per_winner.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Participants</p>
            <p className="font-bold text-white text-base">{prediction.slots_filled}/{prediction.max_slots}</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Lock-in</p>
            <p className={`font-bold text-sm ${timeLeft === "Locked" ? "text-orange-400" : "text-white"}`}>{timeLeft}</p>
          </div>
        </div>

        {/* Revealed answer */}
        {prediction.correct_answer && (
          <div className="bg-neon/10 border border-neon/30 rounded-xl p-3 flex items-center gap-2">
            <CheckCircle size={16} className="text-neon flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-400">Correct Answer</p>
              <p className="text-neon font-bold">{prediction.correct_answer}</p>
            </div>
          </div>
        )}
      </div>

      {/* Reveal Answer */}
      {(prediction.status === "active" || prediction.status === "locked") && !prediction.correct_answer && (
        <div className="bg-orange-900/20 border border-orange-700/40 rounded-2xl p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-orange-400 font-semibold text-sm">Awaiting Answer Reveal</p>
              <p className="text-xs text-orange-300/70 mt-0.5">{prediction.slots_filled} participants submitted predictions</p>
            </div>
            <button onClick={() => setShowRevealForm(!showRevealForm)}
              className="text-sm text-orange-300 hover:text-orange-100 font-semibold flex-shrink-0">
              {showRevealForm ? "Cancel" : "Reveal Answer"}
            </button>
          </div>
          {showRevealForm && (
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">The Correct Answer</label>
                <input type="text" value={revealAnswer} onChange={(e) => setRevealAnswer(e.target.value)}
                  placeholder="e.g. 3, Yes, Chelsea"
                  className="w-full bg-[#111] border border-[#2A2A2A] focus:border-orange-400 rounded-lg px-3 py-2 text-sm text-white outline-none" />
              </div>
              <button onClick={handleReveal} disabled={revealing}
                className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                {revealing ? <><Loader2 size={14} className="animate-spin" /> Processing...</> : "Reveal & Pay Winners"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Participants table */}
      <div className="bg-card border border-[#2A2A2A] rounded-2xl p-4">
        <h2 className="text-lg font-black text-white mb-4 flex items-center gap-2">
          <Users size={18} /> Participants ({participants.length})
        </h2>
        {participants.length === 0 ? (
          <div className="text-center py-8">
            <Users size={28} className="text-gray-600 mx-auto mb-3 opacity-40" />
            <p className="text-gray-500 text-sm">No participants yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2A2A2A]">
                  <th className="text-left py-2 px-2 text-xs text-gray-500 font-semibold">Phone</th>
                  <th className="text-left py-2 px-2 text-xs text-gray-500 font-semibold">Answer</th>
                  <th className="text-left py-2 px-2 text-xs text-gray-500 font-semibold">Correct?</th>
                  <th className="text-left py-2 px-2 text-xs text-gray-500 font-semibold">Won</th>
                  <th className="text-left py-2 px-2 text-xs text-gray-500 font-semibold">Time</th>
                </tr>
              </thead>
              <tbody>
                {participants.map((p) => (
                  <tr key={p.id} className="border-b border-[#2A2A2A] hover:bg-[#111]">
                    <td className="py-2 px-2 font-mono text-xs text-white">{maskPhone(p.player_phone)}</td>
                    <td className="py-2 px-2 text-gray-300 text-xs">{p.answer}</td>
                    <td className="py-2 px-2">
                      {p.is_correct === null
                        ? <span className="text-gray-500 text-xs">Pending</span>
                        : p.is_correct
                          ? <span className="text-neon text-xs font-bold">✓ Yes</span>
                          : <span className="text-red-400 text-xs font-bold">✗ No</span>}
                    </td>
                    <td className="py-2 px-2 text-neon font-bold text-xs">
                      {p.amount_won > 0 ? `₦${p.amount_won.toLocaleString()}` : "-"}
                    </td>
                    <td className="py-2 px-2 text-gray-500 text-xs">
                      {new Date(p.participated_at).toLocaleTimeString()}
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
