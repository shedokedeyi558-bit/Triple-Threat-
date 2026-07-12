"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAdmin } from "@/context/AdminContext";
import { adminApi, type BlitzTournament, ApiError } from "@/lib/api";
import { Plus, Zap, Users, ChevronRight, Trophy } from "lucide-react";

function StatusBadge({ status }: { status: BlitzTournament["status"] }) {
  const config: Record<string, string> = {
    draft: "bg-gray-700/20 text-gray-400 border-gray-700/30",
    registration: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    active: "bg-[#E8A33D]/20 text-[#E8A33D] border-[#E8A33D]/40",
    scoring: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    completed: "bg-gray-500/20 text-gray-500 border-gray-500/30",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border ${config[status]}`}>
      {status}
    </span>
  );
}

export default function AdminBlitzPage() {
  const { state } = useAdmin();
  const router = useRouter();

  const [tournaments, setTournaments] = useState<BlitzTournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmScore, setConfirmScore] = useState<string | null>(null);

  useEffect(() => {
    if (!state.isAuthenticated) {
      router.push("/admin/login");
      return;
    }
    fetchTournaments();
  }, [state.isAuthenticated, router]);

  const fetchTournaments = async () => {
    try {
      const res = await adminApi.getBlitzTournaments();
      setTournaments(res.tournaments);
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (id: string) => {
    setActionLoading(id + ":activate");
    try {
      await adminApi.activateBlitz(id);
      await fetchTournaments();
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleScore = async (id: string) => {
    setConfirmScore(null);
    setActionLoading(id + ":score");
    try {
      await adminApi.scoreBlitz(id);
      await fetchTournaments();
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  if (!state.isAuthenticated) return null;

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap size={22} style={{ color: "var(--accent-amber)" }} />
          <h1 className="font-black text-2xl text-white">Blitz Tournaments</h1>
        </div>
        <button
          onClick={() => router.push("/admin/blitz/create")}
          className="flex items-center gap-2 px-4 py-2 font-bold text-sm rounded-xl hover:opacity-90 transition-opacity"
          style={{ backgroundColor: "var(--accent-indigo)", color: "white" }}
        >
          <Plus size={16} />
          Create Blitz
        </button>
      </div>

      {error && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-red-400 text-sm bg-red-900/10 border border-red-900/30 rounded-xl p-3"
        >
          {error}
        </motion.p>
        )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-[#141414] border border-[#1E1E1E] rounded-xl p-4 h-20 animate-pulse" />
          ))}
        </div>
      ) : tournaments.length === 0 ? (
        <div className="border rounded-2xl p-16 text-center" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-card)" }}>
          <Zap size={40} className="mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
          <p className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>No blitz tournaments yet</p>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Create one with the button above</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tournaments.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-[#141414] border border-[#1E1E1E] rounded-xl p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-white font-bold text-base truncate">{t.title}</h3>
                    <StatusBadge status={t.status} />
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                    <span className="text-[#E8A33D] font-semibold">₦{t.entry_fee.toLocaleString()} entry</span>
                    <span>Pool: ₦{t.prize_pool.toLocaleString()}</span>
                    <span className="flex items-center gap-1">
                      <Users size={11} />
                      {t.total_registered} registered
                    </span>
                    <span>{t.question_count} questions</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {t.status === "draft" && (
                    <button
                      onClick={() => router.push(`/admin/blitz/${t.id}/setup`)}
                      className="px-3 py-1.5 text-xs font-bold bg-[#1E1E1E] border border-[#333] text-white rounded-lg hover:border-[#4C6FFF]/40 transition-colors flex items-center gap-1"
                    >
                      Add Questions
                      <ChevronRight size={12} />
                    </button>
                  )}
                  {t.status === "registration" && (
                    <button
                      onClick={() => handleActivate(t.id)}
                      disabled={actionLoading === t.id + ":activate"}
                      className="px-3 py-1.5 text-xs font-bold bg-[#4C6FFF]/10 border border-[#4C6FFF]/40 text-[#4C6FFF] rounded-lg hover:bg-[#4C6FFF]/20 transition-colors disabled:opacity-50"
                    >
                      {actionLoading === t.id + ":activate" ? "..." : "Activate"}
                    </button>
                  )}
                  {(t.status === "active" || t.status === "scoring") && (
                    <button
                      onClick={() => setConfirmScore(t.id)}
                      disabled={actionLoading === t.id + ":score"}
                      className="px-3 py-1.5 text-xs font-bold bg-yellow-500/10 border border-yellow-500/40 text-yellow-400 rounded-lg hover:bg-yellow-500/20 transition-colors disabled:opacity-50"
                    >
                      {actionLoading === t.id + ":score" ? "..." : "Score & Pay"}
                    </button>
                  )}
                  {t.status === "completed" && (
                    <button
                      onClick={() => router.push(`/admin/blitz/${t.id}/leaderboard`)}
                      className="px-3 py-1.5 text-xs font-bold bg-[#1E1E1E] border border-[#333] text-white rounded-lg hover:border-[#4C6FFF]/40 transition-colors flex items-center gap-1"
                    >
                      <Trophy size={12} />
                      Leaderboard
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {confirmScore && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
          onClick={() => setConfirmScore(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#141414] border border-[#1E1E1E] rounded-2xl p-6 max-w-sm w-full space-y-4"
          >
            <h3 className="text-white font-black text-lg">Score & Pay Tournament?</h3>
            <p className="text-gray-400 text-sm">This will score all submissions, pay out winners, and mark the tournament as completed. This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmScore(null)}
                className="flex-1 py-3 bg-[#1A1A1A] border border-[#333] rounded-xl text-white text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => handleScore(confirmScore)}
                className="flex-1 py-3 bg-yellow-500/20 border border-yellow-500/40 rounded-xl text-yellow-400 text-sm font-bold"
              >
                Confirm
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
