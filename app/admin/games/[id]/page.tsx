"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { adminApi, ApiError } from "@/lib/api";
import { Loader2, ArrowLeft, Play, Pause, RotateCcw, X, Users, AlertCircle, Clock, Pill } from "lucide-react";

interface Game {
  id: string;
  game_type: "pills" | "predictions";
  title: string;
  question?: string;
  category?: string;
  status: "draft" | "active" | "paused" | "locked" | "completed" | "cancelled";
  entry_fee?: number;
  prize?: number;
  prize_per_winner?: number;
  timer?: number;
  format?: "multiple_choice" | "type_answer";
  options?: string[];
  correct_answer?: string;
  max_slots?: number;
  slots_filled?: number;
  countdown_end?: string;
  answer_revealed_at?: string;
  stats?: { total_players: number; revenue: number };
  created_at: string;
}

interface Participant {
  id: string;
  player_phone: string;
  answer: string;
  is_correct: boolean | null;
  amount_won: number;
  participated_at: string;
}

const statusColor = (s: Game["status"]) => {
  switch (s) {
    case "active":    return "bg-neon/20 text-neon";
    case "draft":     return "bg-gray-800 text-gray-400";
    case "paused":    return "bg-yellow-900/20 text-yellow-400";
    case "locked":    return "bg-orange-900/20 text-orange-400";
    case "completed": return "bg-blue-900/20 text-blue-400";
    default:          return "bg-gray-800 text-gray-500";
  }
};

export default function GameDetailPage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.id as string;

  const [game, setGame] = useState<Game | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [revealAnswer, setRevealAnswer] = useState("");
  const [showRevealForm, setShowRevealForm] = useState(false);

  useEffect(() => { fetchGameData(); }, [gameId]);  // eslint-disable-line

  const fetchGameData = async () => {
    try {
      setLoading(true);
      const [gameRes, partRes] = await Promise.all([
        adminApi.getGame(gameId),
        adminApi.getGameParticipants(gameId),
      ]);
      setGame(gameRes.game as unknown as Game);
      setParticipants(partRes.participations || []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load game");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: "activate" | "pause" | "resume" | "end") => {
    setActionLoading(true);
    try {
      switch (action) {
        case "activate": await adminApi.activateGame(gameId); break;
        case "pause":    await adminApi.pauseGame(gameId); break;
        case "resume":   await adminApi.resumeGame(gameId); break;
        case "end":      await adminApi.endGame(gameId); break;
      }
      setGame((prev) => prev ? {
        ...prev,
        status: action === "activate" || action === "resume" ? "active" : action === "pause" ? "paused" : "completed"
      } : null);
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevealAnswer = async () => {
    if (!revealAnswer.trim()) { alert("Enter the correct answer first"); return; }
    setActionLoading(true);
    try {
      const res = await adminApi.revealGameAnswer(gameId, revealAnswer);
      alert(`Answer revealed!\n${res.total_participants} participants\n${res.total_correct} correct\n₦${res.total_paid} paid out`);
      setShowRevealForm(false);
      fetchGameData();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Reveal failed");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={32} className="text-neon animate-spin" /></div>;

  if (!game) return (
    <div className="text-center py-12">
      <p className="text-red-400">Game not found</p>
      <button onClick={() => router.back()} className="mt-4 text-sm text-neon">Go back</button>
    </div>
  );

  const maskPhone = (p: string) => `${p.slice(0, 4)}***${p.slice(-4)}`;
  const isPills = game.game_type === "pills";

  return (
    <div className="space-y-5">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
        <ArrowLeft size={16} /> Back to Games
      </button>

      {error && (
        <div className="bg-red-900/20 border border-red-800/40 rounded-xl p-3 text-red-400 text-sm flex gap-2 items-start">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />{error}
        </div>
      )}

      {/* Game Header */}
      <div className="bg-card border border-[#2A2A2A] rounded-2xl p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3">
            {isPills
              ? <Pill size={22} className="text-neon mt-0.5 flex-shrink-0" />
              : <Clock size={22} className="text-purple-400 mt-0.5 flex-shrink-0" />
            }
            <div>
              <h1 className="text-xl font-black text-white">{game.title}</h1>
              <p className="text-gray-400 text-sm mt-0.5">{isPills ? "PILL" : "TIME MACHINE"} · {game.category}</p>
            </div>
          </div>
          <span className={`text-xs font-bold px-3 py-1 rounded ${statusColor(game.status)}`}>
            {game.status.toUpperCase()}
          </span>
        </div>

        {/* Question */}
        {game.question && (
          <div className="bg-[#111] rounded-xl p-3 mb-4 text-sm text-gray-200">
            {game.question}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-xs">
          <div>
            <p className="text-gray-500 mb-1">Entry Fee</p>
            <p className="font-bold text-neon text-base">₦{game.entry_fee?.toLocaleString() ?? "0"}</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">{isPills ? "Prize" : "Prize/Winner"}</p>
            <p className="font-bold text-neon text-base">₦{(isPills ? game.prize : game.prize_per_winner)?.toLocaleString() ?? "0"}</p>
          </div>
          {isPills ? (
            <>
              <div>
                <p className="text-gray-500 mb-1">Timer</p>
                <p className="font-bold text-white text-base">{game.timer ?? 0}s</p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">Format</p>
                <p className="font-bold text-white text-base">{game.format === "multiple_choice" ? "MC" : "Text"}</p>
              </div>
            </>
          ) : (
            <>
              <div>
                <p className="text-gray-500 mb-1">Participants</p>
                <p className="font-bold text-white text-base">{game.slots_filled ?? 0}/{game.max_slots ?? 0}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">Countdown End</p>
                <p className="font-bold text-white text-xs">{game.countdown_end ? new Date(game.countdown_end).toLocaleString() : "-"}</p>
              </div>
            </>
          )}
        </div>

        {/* MC Options (for pills) */}
        {isPills && game.format === "multiple_choice" && game.options && game.options.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-2">Answer Options</p>
            <div className="grid grid-cols-2 gap-2">
              {game.options.map((opt, i) => (
                <div key={i} className={`p-2 rounded-lg text-xs border ${opt === game.correct_answer ? "border-neon bg-neon/10 text-neon font-bold" : "border-[#2A2A2A] text-gray-300"}`}>
                  {String.fromCharCode(65 + i)}) {opt}
                  {opt === game.correct_answer && " ✓"}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Correct answer (pills text format) */}
        {isPills && game.format === "type_answer" && game.correct_answer && (
          <div className="mb-4 bg-neon/10 border border-neon/30 rounded-xl p-3">
            <p className="text-xs text-gray-400 mb-0.5">Correct Answer</p>
            <p className="text-neon font-bold">{game.correct_answer}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 flex-wrap">
          {game.status === "draft" && (
            <button
              onClick={() => handleAction("activate")}
              disabled={actionLoading}
              className="flex items-center gap-2 px-4 py-2 bg-neon/10 border border-neon/30 rounded-lg text-neon hover:bg-neon/20 transition-colors text-sm font-semibold disabled:opacity-50"
            >
              <Play size={15} /> Activate
            </button>
          )}
          {game.status === "active" && (
            <>
              <button onClick={() => handleAction("pause")} disabled={actionLoading}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-900/20 border border-yellow-700/30 rounded-lg text-yellow-400 hover:bg-yellow-900/30 text-sm font-semibold disabled:opacity-50">
                <Pause size={15} /> Pause
              </button>
              <button onClick={() => handleAction("end")} disabled={actionLoading}
                className="flex items-center gap-2 px-4 py-2 bg-red-900/20 border border-red-700/30 rounded-lg text-red-400 hover:bg-red-900/30 text-sm font-semibold disabled:opacity-50">
                <X size={15} /> End Game
              </button>
            </>
          )}
          {game.status === "paused" && (
            <button onClick={() => handleAction("resume")} disabled={actionLoading}
              className="flex items-center gap-2 px-4 py-2 bg-neon/10 border border-neon/30 rounded-lg text-neon hover:bg-neon/20 text-sm font-semibold disabled:opacity-50">
              <RotateCcw size={15} /> Resume
            </button>
          )}
        </div>
      </div>

      {/* TIME MACHINE: Reveal Answer */}
      {!isPills && (game.status === "active" || game.status === "locked") && !game.answer_revealed_at && (
        <div className="bg-orange-900/20 border border-orange-700/40 rounded-2xl p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-orange-400 font-semibold text-sm">Awaiting Answer Reveal</p>
              <p className="text-xs text-orange-300/70 mt-0.5">{game.slots_filled ?? 0} participants have submitted predictions</p>
            </div>
            <button
              onClick={() => setShowRevealForm(!showRevealForm)}
              className="text-sm text-orange-300 hover:text-orange-100 font-semibold flex-shrink-0"
            >
              {showRevealForm ? "Cancel" : "Reveal Answer"}
            </button>
          </div>
          {showRevealForm && (
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Enter the Correct Answer</label>
                <input
                  type="text"
                  value={revealAnswer}
                  onChange={(e) => setRevealAnswer(e.target.value)}
                  placeholder="e.g. 3 goals, Yes, Chelsea"
                  className="w-full bg-[#111] border border-[#2A2A2A] focus:border-orange-400 rounded-lg px-3 py-2 text-sm text-white outline-none"
                />
              </div>
              <button
                onClick={handleRevealAnswer}
                disabled={actionLoading}
                className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg text-sm disabled:opacity-50"
              >
                {actionLoading ? "Processing..." : "Reveal & Pay Winners"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Participants */}
      {participants.length > 0 && (
        <div className="bg-card border border-[#2A2A2A] rounded-2xl p-4">
          <h2 className="text-lg font-black text-white mb-4 flex items-center gap-2">
            <Users size={18} /> Participants ({participants.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2A2A2A]">
                  <th className="text-left py-2 px-2 text-xs text-gray-500 font-semibold">Phone</th>
                  <th className="text-left py-2 px-2 text-xs text-gray-500 font-semibold">Answer</th>
                  {!isPills && (
                    <>
                      <th className="text-left py-2 px-2 text-xs text-gray-500 font-semibold">Correct?</th>
                      <th className="text-left py-2 px-2 text-xs text-gray-500 font-semibold">Won</th>
                    </>
                  )}
                  <th className="text-left py-2 px-2 text-xs text-gray-500 font-semibold">Time</th>
                </tr>
              </thead>
              <tbody>
                {participants.map((p) => (
                  <tr key={p.id} className="border-b border-[#2A2A2A] hover:bg-[#111]">
                    <td className="py-2 px-2 font-mono text-xs text-white">{maskPhone(p.player_phone)}</td>
                    <td className="py-2 px-2 text-gray-300">{p.answer}</td>
                    {!isPills && (
                      <>
                        <td className="py-2 px-2">
                          {p.is_correct === null ? <span className="text-gray-500 text-xs">-</span>
                            : p.is_correct ? <span className="text-neon text-xs font-bold">✓ Yes</span>
                            : <span className="text-red-400 text-xs font-bold">✗ No</span>}
                        </td>
                        <td className="py-2 px-2 text-neon font-bold text-xs">
                          {p.amount_won > 0 ? `₦${p.amount_won.toLocaleString()}` : "-"}
                        </td>
                      </>
                    )}
                    <td className="py-2 px-2 text-gray-500 text-xs">{new Date(p.participated_at).toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {participants.length === 0 && (
        <div className="bg-card border border-[#2A2A2A] rounded-2xl p-8 text-center">
          <Users size={28} className="text-gray-600 mx-auto mb-3 opacity-40" />
          <p className="text-gray-500 text-sm">No participants yet</p>
        </div>
      )}
    </div>
  );
}
