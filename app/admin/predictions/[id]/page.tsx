"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { adminApi, ApiError } from "@/lib/api";
import {
  ArrowLeft, Users, Clock, Eye, Loader2, AlertCircle, CheckCircle2, XCircle,
} from "lucide-react";

interface Participation {
  id: string;
  player_id: string;
  player_phone: string;
  answer: string;
  is_correct: boolean | null;
  amount_won: number;
  participated_at: string;
}

interface PredictionDetail {
  id: string;
  question: string;
  category: string;
  entry_fee: number;
  prize_per_winner: number;
  slots_filled: number;
  max_slots: number;
  status: "active" | "locked" | "completed" | "cancelled";
  countdown_end: string;
  correct_answer?: string | null;
  answer_revealed_at?: string | null;
}

const statusColor: Record<string, string> = {
  active:    "var(--accent-indigo)",
  locked:    "var(--accent-amber)",
  completed: "var(--text-muted)",
  cancelled: "#f87171",
};

const maskPhone = (ph: string) =>
  ph.length >= 8 ? `${ph.slice(0, 4)}***${ph.slice(-4)}` : ph;

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("en-NG", {
    month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

export default function AdminPredictionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [prediction, setPrediction] = useState<PredictionDetail | null>(null);
  const [participants, setParticipants] = useState<Participation[]>([]);
  const [loadingPred, setLoadingPred] = useState(true);
  const [loadingPart, setLoadingPart] = useState(true);
  const [error, setError] = useState("");
  const [revealing, setRevealing] = useState(false);
  const [revealAnswer, setRevealAnswer] = useState("");
  const [revealResult, setRevealResult] = useState<{
    total_participants: number;
    total_correct: number;
    total_paid: number;
  } | null>(null);

  useEffect(() => {
    if (!id) return;

    // Load prediction detail
    adminApi.getPrediction(id)
      .then((res) => setPrediction(res.prediction as PredictionDetail))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load prediction"))
      .finally(() => setLoadingPred(false));

    // Load participants — independent from prediction load
    adminApi.getPredictionParticipants(id)
      .then((res) => setParticipants(res.participations ?? []))
      .catch(() => setParticipants([]))           // silent — participants are bonus info
      .finally(() => setLoadingPart(false));
  }, [id]);

  const handleReveal = async () => {
    if (!revealAnswer.trim()) return;
    if (!window.confirm(`Reveal answer as "${revealAnswer.trim()}"?\n\nThis will evaluate all submissions and pay winners immediately.`)) return;
    setRevealing(true);
    setError("");
    try {
      const res = await adminApi.revealPredictionAnswer(id, revealAnswer.trim());
      setRevealResult({
        total_participants: res.total_participants,
        total_correct: res.total_correct,
        total_paid: res.total_paid,
      });
      // Refresh prediction to show updated status
      const updated = await adminApi.getPrediction(id);
      setPrediction(updated.prediction as PredictionDetail);
      // Refresh participants to show is_correct flags
      const updatedParts = await adminApi.getPredictionParticipants(id);
      setParticipants(updatedParts.participations ?? []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to reveal answer");
    } finally {
      setRevealing(false);
    }
  };

  const isLoading = loadingPred;
  const isPastDeadline = prediction
    ? new Date(prediction.countdown_end).getTime() < Date.now()
    : false;
  const canReveal =
    prediction &&
    prediction.status !== "completed" &&
    prediction.status !== "cancelled" &&
    !prediction.answer_revealed_at;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/admin/predictions")}
          className="p-2 rounded-lg border flex-shrink-0 transition-colors"
          style={{ borderColor: "var(--border-subtle)", color: "var(--text-secondary)" }}
          aria-label="Back"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="min-w-0">
          <h1 className="font-headline text-xl font-semibold truncate" style={{ color: "var(--text-primary)" }}>
            Prediction Detail
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
            Review submissions, then reveal the correct answer
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg p-3 border text-sm"
          style={{ borderColor: "rgba(239,68,68,0.3)", backgroundColor: "rgba(239,68,68,0.06)", color: "#f87171" }}>
          <AlertCircle size={15} className="flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Reveal success banner */}
      {revealResult && (
        <div className="rounded-xl p-4 border"
          style={{ borderColor: "rgba(232,163,61,0.3)", backgroundColor: "rgba(232,163,61,0.08)" }}>
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 size={16} style={{ color: "var(--accent-amber)" }} />
            <p className="font-bold text-sm" style={{ color: "var(--accent-amber)" }}>Answer revealed</p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center text-xs">
            {[
              { label: "Participants", value: revealResult.total_participants },
              { label: "Correct", value: revealResult.total_correct },
              { label: "Total paid", value: `₦${revealResult.total_paid.toLocaleString()}` },
            ].map((s) => (
              <div key={s.label} className="rounded-lg p-2"
                style={{ backgroundColor: "rgba(232,163,61,0.1)" }}>
                <p className="font-black text-sm font-mono" style={{ color: "var(--accent-amber)" }}>{s.value}</p>
                <p style={{ color: "var(--text-muted)" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={28} className="animate-spin" style={{ color: "var(--accent-indigo)" }} />
        </div>
      ) : prediction ? (
        <>
          {/* Prediction summary card */}
          <div className="rounded-xl p-5 border space-y-4"
            style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-card)" }}>
            {/* Status + category row */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                style={{
                  backgroundColor: `${statusColor[prediction.status]}20`,
                  color: statusColor[prediction.status],
                  border: `1px solid ${statusColor[prediction.status]}40`,
                }}>
                {prediction.status}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                style={{ backgroundColor: "rgba(124,111,232,0.1)", color: "var(--accent-violet)", border: "1px solid rgba(124,111,232,0.25)" }}>
                {prediction.category}
              </span>
            </div>

            {/* Question */}
            <p className="text-base font-semibold leading-snug" style={{ color: "var(--text-primary)" }}>
              {prediction.question}
            </p>

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Entry fee", value: `₦${prediction.entry_fee.toLocaleString()}`, color: "var(--accent-indigo)" },
                { label: "Prize/winner", value: `₦${prediction.prize_per_winner.toLocaleString()}`, color: "var(--accent-amber)" },
                { label: "Entries", value: `${prediction.slots_filled}/${prediction.max_slots}`, color: "var(--text-primary)" },
                {
                  label: "Deadline",
                  value: prediction.countdown_end ? fmtDate(prediction.countdown_end) : "—",
                  color: isPastDeadline ? "var(--accent-amber)" : "var(--text-primary)",
                },
              ].map((s) => (
                <div key={s.label} className="rounded-lg p-3 border text-center"
                  style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border-hairline)" }}>
                  <p className="text-[10px] uppercase tracking-wide mb-1 font-bold" style={{ color: "var(--text-muted)" }}>
                    {s.label}
                  </p>
                  <p className="font-black text-sm font-mono" style={{ color: s.color, textDecoration: "none" }}>
                    {s.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Correct answer (if already revealed) */}
            {prediction.correct_answer && (
              <div className="rounded-lg p-3 border"
                style={{ borderColor: "rgba(232,163,61,0.3)", backgroundColor: "rgba(232,163,61,0.06)" }}>
                <p className="text-[10px] uppercase tracking-widest font-bold mb-1" style={{ color: "var(--text-muted)" }}>
                  Correct answer
                </p>
                <p className="font-black text-lg" style={{ color: "var(--accent-amber)" }}>
                  {prediction.correct_answer}
                </p>
                {prediction.answer_revealed_at && (
                  <p className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>
                    Revealed {fmtDate(prediction.answer_revealed_at)}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* ── PARTICIPANTS ──────────────────────────────────────────── */}
          <div className="rounded-xl border overflow-hidden"
            style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-card)" }}>
            {/* Section header */}
            <div className="px-4 py-3 border-b flex items-center justify-between"
              style={{ borderColor: "var(--border-hairline)" }}>
              <div className="flex items-center gap-2">
                <Users size={15} style={{ color: "var(--accent-indigo)" }} />
                <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
                  Participants
                </p>
              </div>
              {!loadingPart && (
                <span className="text-xs font-bold px-2 py-0.5 rounded"
                  style={{ backgroundColor: "rgba(76,111,255,0.1)", color: "var(--accent-indigo)" }}>
                  {participants.length}
                </span>
              )}
            </div>

            {loadingPart ? (
              <div className="flex justify-center py-8">
                <Loader2 size={20} className="animate-spin" style={{ color: "var(--accent-indigo)" }} />
              </div>
            ) : participants.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Clock size={24} style={{ color: "var(--text-muted)", margin: "0 auto 8px" }} />
                <p className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>No entries yet</p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: "var(--border-hairline)" }}>
                {/* Table header */}
                <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-3 px-4 py-2 text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: "var(--text-muted)" }}>
                  <span>Player</span>
                  <span>Answer</span>
                  <span>Submitted</span>
                  <span>Result</span>
                </div>

                {participants.map((p) => (
                  <div key={p.id}
                    className="grid grid-cols-[1fr_1fr_1fr_auto] gap-3 px-4 py-3 items-center">
                    {/* Masked phone */}
                    <span className="text-sm font-mono font-semibold" style={{ color: "var(--text-primary)", textDecoration: "none" }}>
                      {maskPhone(p.player_phone)}
                    </span>

                    {/* Answer */}
                    <span className="text-sm font-semibold truncate"
                      style={{
                        color: p.is_correct === true
                          ? "var(--accent-amber)"
                          : p.is_correct === false
                          ? "#f87171"
                          : "var(--text-secondary)",
                      }}>
                      {p.answer || <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>No answer</span>}
                    </span>

                    {/* Submission time */}
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {fmtDate(p.participated_at)}
                    </span>

                    {/* Correct / wrong / pending indicator */}
                    <span>
                      {p.is_correct === true ? (
                        <CheckCircle2 size={15} style={{ color: "var(--accent-amber)" }} />
                      ) : p.is_correct === false ? (
                        <XCircle size={15} style={{ color: "#f87171" }} />
                      ) : (
                        <span className="w-3 h-3 rounded-full block"
                          style={{ backgroundColor: "var(--border-subtle)" }} />
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── REVEAL ANSWER ─────────────────────────────────────────── */}
          {canReveal && (
            <div className="rounded-xl p-5 border space-y-4"
              style={{ borderColor: "rgba(124,111,232,0.25)", backgroundColor: "rgba(124,111,232,0.04)" }}>
              <div className="flex items-center gap-2">
                <Eye size={16} style={{ color: "var(--accent-violet)" }} />
                <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
                  Reveal Correct Answer
                </p>
              </div>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                Review the submissions above before revealing. Once confirmed, all entries are evaluated and
                winners are paid instantly — this cannot be undone.
              </p>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Enter correct answer..."
                  value={revealAnswer}
                  onChange={(e) => setRevealAnswer(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && revealAnswer.trim() && !revealing) handleReveal(); }}
                  className="flex-1 rounded-xl px-4 py-3 text-sm outline-none"
                  style={{
                    backgroundColor: "var(--bg-base)",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--text-primary)",
                  }}
                />
                <button
                  onClick={handleReveal}
                  disabled={!revealAnswer.trim() || revealing}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-40"
                  style={{ backgroundColor: "var(--accent-violet)", color: "#fff" }}
                >
                  {revealing ? <Loader2 size={15} className="animate-spin" /> : <Eye size={15} />}
                  {revealing ? "Revealing..." : "Reveal"}
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        !error && (
          <div className="text-center py-16">
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Prediction not found</p>
          </div>
        )
      )}
    </div>
  );
}
