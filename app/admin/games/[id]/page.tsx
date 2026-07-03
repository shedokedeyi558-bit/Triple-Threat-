"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { adminApi, ApiError } from "@/lib/api";
import {
  Loader2, ArrowLeft, Play, Pause, RotateCcw, X, Clock,
  Users, DollarSign, Award, Eye, Check, AlertCircle,
} from "lucide-react";

interface Game {
  id: string;
  game_type: "door_game" | "challenge_game";
  title: string;
  description?: string;
  status: "draft" | "active" | "paused" | "locked" | "ended" | "closed";
  entry_fee?: number;
  category?: string;
  stake_amount?: number;
  prize_pool?: number;
  max_participants?: number;
  current_participants?: number;
  countdown_duration?: number;
  ends_at?: string;
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

  useEffect(() => {
    fetchGameData();
  }, [gameId]);

  const fetchGameData = async () => {
    try {
      setLoading(true);
      const [gameRes, partRes] = await Promise.all([
        adminApi.getGame(gameId),
        adminApi.getGameParticipants(gameId),
      ]);
      setGame(gameRes.game);
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
      let res;
      switch (action) {
        case "activate":
          res = await adminApi.activateGame(gameId);
          break;
        case "pause":
          res = await adminApi.pauseGame(gameId);
          break;
        case "resume":
          res = await adminApi.resumeGame(gameId);
          break;
        case "end":
          res = await adminApi.endGame(gameId);
          break;
      }
      setGame((prev) => prev ? { ...prev, status: action === "activate" ? "active" : action === "pause" ? "paused" : action === "resume" ? "active" : "ended" } : null);
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevealAnswer = async () => {
    if (!revealAnswer.trim()) {
      alert("Please enter the correct answer");
      return;
    }
    setActionLoading(true);
    try {
      const res = await adminApi.revealGameAnswer(gameId, revealAnswer);
      alert(`Answer revealed!\n${res.total_participants} total participants\n${res.total_correct} got it correct\n₦${res.total_paid} paid out`);
      setShowRevealForm(false);
      fetchGameData();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Reveal failed");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 size={32} className="text-neon animate-spin" />
      </div>
    );
  }

  if (!game) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400">Game not found</p>
        <button
          onClick={() => router.back()}
          className="mt-4 text-sm text-neon hover:text-white"
        >
          Go back
        </button>
      </div>
    );
  }

  const getStatusColor = (status: Game["status"]) => {
    switch (status) {
      case "active":
        return "bg-neon/20 text-neon";
      case "draft":
        return "bg-gray-800 text-gray-400";
      case "paused":
        return "bg-yellow-900/20 text-yellow-400";
      case "locked":
        return "bg-orange-900/20 text-orange-400";
      case "ended":
      case "closed":
        return "bg-red-900/20 text-red-400";
      default:
        return "bg-gray-800 text-gray-400";
    }
  };

  const maskPhone = (phone: string) => `${phone.slice(0, 4)}***${phone.slice(-4)}`;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Games
      </button>

      {error && (
        <div className="bg-red-900/20 border border-red-800/40 rounded-xl p-3 text-red-400 text-sm flex items-start gap-2">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* Game Header */}
      <div className="bg-card border border-[#2A2A2A] rounded-2xl p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">{game.game_type === "door_game" ? "🚪" : "⚡"}</span>
              <div>
                <h1 className="text-2xl font-black text-white">{game.title}</h1>
                <p className="text-gray-400 text-sm">{game.description || "No description"}</p>
              </div>
            </div>
          </div>
          <span className={`text-sm font-bold px-3 py-1 rounded ${getStatusColor(game.status)}`}>
            {game.status.toUpperCase()}
          </span>
        </div>

        {/* Game Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {game.game_type === "door_game" ? (
            <>
              <div>
                <p className="text-xs text-gray-500 mb-1">Entry Fee</p>
                <p className="text-lg font-bold text-neon">₦{game.entry_fee?.toLocaleString() || "0"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Players Today</p>
                <p className="text-lg font-bold text-white">{game.stats?.total_players || 0}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Revenue</p>
                <p className="text-lg font-bold text-neon">₦{game.stats?.revenue?.toLocaleString() || "0"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Created</p>
                <p className="text-lg font-bold text-white">{new Date(game.created_at).toLocaleDateString()}</p>
              </div>
            </>
          ) : (
            <>
              <div>
                <p className="text-xs text-gray-500 mb-1">Stake</p>
                <p className="text-lg font-bold text-neon">₦{game.stake_amount?.toLocaleString() || "0"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Participants</p>
                <p className="text-lg font-bold text-white">
                  {game.current_participants || 0}/{game.max_participants || 0}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Prize Pool</p>
                <p className="text-lg font-bold text-neon">₦{game.prize_pool?.toLocaleString() || "0"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Countdown</p>
                <p className="text-lg font-bold text-white">{game.countdown_duration || 0}m</p>
              </div>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 flex-wrap">
          {game.status === "draft" && (
            <button
              onClick={() => handleAction("activate")}
              disabled={actionLoading}
              className="flex items-center gap-2 px-4 py-2 bg-neon/10 border border-neon/30 rounded-lg text-neon hover:bg-neon/20 transition-colors text-sm font-semibold disabled:opacity-50"
            >
              <Play size={16} />
              Activate
            </button>
          )}
          {game.status === "active" && (
            <>
              <button
                onClick={() => handleAction("pause")}
                disabled={actionLoading}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-900/20 border border-yellow-700/30 rounded-lg text-yellow-400 hover:bg-yellow-900/30 transition-colors text-sm font-semibold disabled:opacity-50"
              >
                <Pause size={16} />
                Pause
              </button>
              <button
                onClick={() => handleAction("end")}
                disabled={actionLoading}
                className="flex items-center gap-2 px-4 py-2 bg-red-900/20 border border-red-700/30 rounded-lg text-red-400 hover:bg-red-900/30 transition-colors text-sm font-semibold disabled:opacity-50"
              >
                <X size={16} />
                End Game
              </button>
            </>
          )}
          {game.status === "paused" && (
            <button
              onClick={() => handleAction("resume")}
              disabled={actionLoading}
              className="flex items-center gap-2 px-4 py-2 bg-neon/10 border border-neon/30 rounded-lg text-neon hover:bg-neon/20 transition-colors text-sm font-semibold disabled:opacity-50"
            >
              <RotateCcw size={16} />
              Resume
            </button>
          )}
        </div>
      </div>

      {/* Challenge Reveal Section */}
      {game.game_type === "challenge_game" && game.status === "active" && !game.answer_revealed_at && (
        <div className="bg-orange-900/20 border border-orange-700/40 rounded-2xl p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-orange-400 font-semibold text-sm">
                ⏱️ Challenge Active - Awaiting Answer Reveal
              </p>
              <p className="text-xs text-orange-300/70 mt-1">
                {game.current_participants || 0} participants have submitted their answers
              </p>
            </div>
            <button
              onClick={() => setShowRevealForm(!showRevealForm)}
              className="text-sm text-orange-300 hover:text-orange-200 font-semibold flex-shrink-0"
            >
              {showRevealForm ? "Cancel" : "Reveal Answer"}
            </button>
          </div>

          {showRevealForm && (
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Enter Correct Answer</label>
                <input
                  type="text"
                  value={revealAnswer}
                  onChange={(e) => setRevealAnswer(e.target.value)}
                  placeholder="e.g., 7, Chelsea, Yes"
                  className="w-full bg-[#111] border border-[#2A2A2A] focus:border-orange-400 rounded-lg px-3 py-2 text-sm text-white outline-none"
                />
              </div>
              <button
                onClick={handleRevealAnswer}
                disabled={actionLoading}
                className="w-full py-2 px-4 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg text-sm transition-colors disabled:opacity-50"
              >
                {actionLoading ? "Processing..." : "Reveal & Calculate Winners"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Participants Section */}
      {participants.length > 0 && (
        <div className="bg-card border border-[#2A2A2A] rounded-2xl p-4">
          <h2 className="text-lg font-black text-white mb-4 flex items-center gap-2">
            <Users size={20} />
            Participants ({participants.length})
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2A2A2A]">
                  <th className="text-left py-2 px-3 text-xs text-gray-500 font-semibold">Phone</th>
                  <th className="text-left py-2 px-3 text-xs text-gray-500 font-semibold">Answer</th>
                  {game.game_type === "challenge_game" && (
                    <>
                      <th className="text-left py-2 px-3 text-xs text-gray-500 font-semibold">Correct?</th>
                      <th className="text-left py-2 px-3 text-xs text-gray-500 font-semibold">Won</th>
                    </>
                  )}
                  <th className="text-left py-2 px-3 text-xs text-gray-500 font-semibold">Time</th>
                </tr>
              </thead>
              <tbody>
                {participants.map((p) => (
                  <tr key={p.id} className="border-b border-[#2A2A2A] hover:bg-[#111] transition-colors">
                    <td className="py-2 px-3 text-white font-mono text-xs">{maskPhone(p.player_phone)}</td>
                    <td className="py-2 px-3 text-gray-300">{p.answer}</td>
                    {game.game_type === "challenge_game" && (
                      <>
                        <td className="py-2 px-3">
                          {p.is_correct === null ? (
                            <span className="text-xs text-gray-500">-</span>
                          ) : p.is_correct ? (
                            <span className="text-xs text-neon font-bold">✓ Yes</span>
                          ) : (
                            <span className="text-xs text-red-400 font-bold">✗ No</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-neon font-bold">
                          {p.amount_won > 0 ? `₦${p.amount_won.toLocaleString()}` : "-"}
                        </td>
                      </>
                    )}
                    <td className="py-2 px-3 text-gray-500 text-xs">
                      {new Date(p.participated_at).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty Participants State */}
      {participants.length === 0 && (
        <div className="bg-card border border-[#2A2A2A] rounded-2xl p-8 text-center">
          <Users size={32} className="text-gray-600 mx-auto mb-3 opacity-50" />
          <p className="text-gray-500">No participants yet</p>
        </div>
      )}
    </div>
  );
}
