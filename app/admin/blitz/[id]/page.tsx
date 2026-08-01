"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAdmin } from "@/context/AdminContext";
import { adminApi, type BlitzTournament, type BlitzQuestion, ApiError } from "@/lib/api";
import {
  ArrowLeft, Zap, Trophy, Ticket, Plus,
  Trash2, CheckCircle, Loader2, AlertTriangle, Pencil, Image, X, Lock, XCircle,
} from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(n: number) { return `₦${n.toLocaleString()}`; }
function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("en-NG", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

type TStatus = BlitzTournament["status"];

function StatusBadge({ status }: { status: TStatus }) {
  const config: Record<string, string> = {
    draft:        "bg-gray-700/20 text-gray-400 border-gray-700/30",
    registration: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    active:       "bg-[#E8A33D]/20 text-[#E8A33D] border-[#E8A33D]/40",
    scoring:      "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    completed:    "bg-gray-500/20 text-gray-500 border-gray-500/30",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border ${config[status]}`}>
      {status}
    </span>
  );
}

// ── Question form (add new question) ─────────────────────────────────────────
function AddQuestionForm({
  tournamentId,
  onAdded,
  onCancel,
}: {
  tournamentId: string;
  onAdded: (q: BlitzQuestion) => void;
  onCancel: () => void;
}) {
  const [question, setQuestion] = useState("");
  const [format, setFormat] = useState<"multiple_choice" | "type_answer">("multiple_choice");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correct, setCorrect] = useState("");
  const [imageUrl, setImageUrl] = useState<string | undefined>();
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setUploadErr("Max 5 MB"); return; }
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      setUploadErr("JPEG/PNG/WebP/GIF only"); return;
    }
    setUploading(true); setUploadErr("");
    try {
      const res = await adminApi.uploadBlitzQuestionImage(tournamentId, file);
      setImageUrl(res.url);
    } catch { setUploadErr("Upload failed"); }
    finally { setUploading(false); e.target.value = ""; }
  };

  const handleSave = async () => {
    if (!question.trim()) { setErr("Question required"); return; }
    if (!correct.trim()) { setErr("Correct answer required"); return; }
    if (format === "multiple_choice" && options.filter(o => o.trim()).length < 2) {
      setErr("At least 2 options required"); return;
    }
    setSaving(true); setErr("");
    try {
      const res = await adminApi.addBlitzQuestion(tournamentId, {
        question: question.trim(),
        format,
        options: format === "multiple_choice" ? options.filter(o => o.trim()) : undefined,
        correct_answer: correct.trim(),
        order_index: 0,
        ...(imageUrl ? { image_url: imageUrl } : {}),
      });
      onAdded(res.question);
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Failed to add question");
    } finally { setSaving(false); }
  };

  const inp = "w-full border rounded-xl px-3 py-2.5 text-sm outline-none [background-color:var(--bg-base)] [border-color:var(--border-subtle)] [color:var(--text-primary)]";

  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
      className="border rounded-xl p-4 space-y-3"
      style={{ borderColor: "rgba(76,111,255,0.3)", backgroundColor: "rgba(76,111,255,0.04)" }}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--accent-indigo)" }}>Add Question</p>
        <button onClick={onCancel} className="p-1 rounded hover:opacity-70"><X size={14} style={{ color: "var(--text-muted)" }} /></button>
      </div>

      <textarea rows={2} placeholder="Question text…" value={question} onChange={e => setQuestion(e.target.value)}
        className={inp + " resize-none"} />

      {/* Format toggle */}
      <div className="flex gap-2">
        {(["multiple_choice", "type_answer"] as const).map(f => (
          <button key={f} onClick={() => setFormat(f)}
            className="flex-1 py-2 rounded-lg text-xs font-bold transition-all"
            style={{
              backgroundColor: format === f ? "rgba(76,111,255,0.2)" : "transparent",
              border: `1px solid ${format === f ? "rgba(76,111,255,0.5)" : "var(--border-subtle)"}`,
              color: format === f ? "var(--accent-indigo)" : "var(--text-secondary)",
            }}>
            {f === "multiple_choice" ? "Multiple Choice" : "Type Answer"}
          </button>
        ))}
      </div>

      {format === "multiple_choice" && (
        <div className="space-y-1.5">
          {options.map((o, i) => (
            <input key={i} placeholder={`Option ${i + 1}`} value={o}
              onChange={e => { const n = [...options]; n[i] = e.target.value; setOptions(n); }}
              className={inp} />
          ))}
        </div>
      )}

      <input placeholder="Correct answer (exact)" value={correct} onChange={e => setCorrect(e.target.value)} className={inp} />

      {/* Image upload */}
      <div>
        {imageUrl ? (
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="" className="w-16 h-12 object-cover rounded-lg" />
            <button onClick={() => setImageUrl(undefined)}
              className="text-xs font-bold px-2 py-1 rounded"
              style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "#f87171" }}>
              Remove
            </button>
          </div>
        ) : (
          <button onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold"
            style={{ border: "1px dashed var(--border-subtle)", color: "var(--text-muted)" }}>
            <Image size={13} />
            {uploading ? "Uploading…" : "Add image (optional)"}
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden"
          onChange={handleImageUpload} disabled={uploading} />
        {uploadErr && <p className="text-[11px] text-red-400 mt-1">{uploadErr}</p>}
      </div>

      {err && <p className="text-xs text-red-400">{err}</p>}

      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="px-4 py-2 rounded-lg text-xs font-bold"
          style={{ border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
          Cancel
        </button>
        <button onClick={handleSave} disabled={saving}
          className="px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
          style={{ backgroundColor: "var(--accent-indigo)", color: "#fff" }}>
          {saving && <Loader2 size={12} className="animate-spin" />}
          {saving ? "Saving…" : "Add Question"}
        </button>
      </div>
    </motion.div>
  );
}

// ── Delete question confirm ───────────────────────────────────────────────────
function DeleteQConfirm({ onConfirm, onCancel, deleting }: {
  onConfirm: () => void; onCancel: () => void; deleting: boolean;
}) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
      onClick={onCancel}>
      <motion.div initial={{ scale: 0.92 }} animate={{ scale: 1 }} exit={{ scale: 0.92 }}
        onClick={e => e.stopPropagation()}
        className="bg-[#141414] border border-[#1E1E1E] rounded-2xl p-6 max-w-sm w-full space-y-4">
        <div className="flex items-center gap-2">
          <AlertTriangle size={18} style={{ color: "#f87171" }} />
          <h3 className="text-white font-bold">Delete question?</h3>
        </div>
        <p className="text-gray-400 text-sm">This removes the question permanently from this tournament.</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 bg-[#1A1A1A] border border-[#333] rounded-xl text-white text-sm font-semibold">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={deleting}
            className="flex-1 py-2.5 bg-red-500/20 border border-red-500/40 rounded-xl text-red-400 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50">
            {deleting && <Loader2 size={13} className="animate-spin" />}
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Score & Pay confirm ───────────────────────────────────────────────────────
function ScoreConfirm({ onConfirm, onCancel, scoring }: {
  onConfirm: () => void; onCancel: () => void; scoring: boolean;
}) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
      onClick={onCancel}>
      <motion.div initial={{ scale: 0.92 }} animate={{ scale: 1 }} exit={{ scale: 0.92 }}
        onClick={e => e.stopPropagation()}
        className="bg-[#141414] border border-[#1E1E1E] rounded-2xl p-6 max-w-sm w-full space-y-4">
        <h3 className="text-white font-black text-lg">Score &amp; Pay Tournament?</h3>
        <p className="text-gray-400 text-sm">This will score all submissions, pay winners, and mark the tournament as completed. Cannot be undone.</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 bg-[#1A1A1A] border border-[#333] rounded-xl text-white text-sm font-semibold">Cancel</button>
          <button onClick={onConfirm} disabled={scoring}
            className="flex-1 py-3 bg-yellow-500/20 border border-yellow-500/40 rounded-xl text-yellow-400 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50">
            {scoring && <Loader2 size={13} className="animate-spin" />}
            {scoring ? "Scoring…" : "Confirm"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Cancel & Refund confirm ───────────────────────────────────────────────────
function CancelConfirm({ registered, onConfirm, onCancel, cancelling }: {
  registered: number; onConfirm: () => void; onCancel: () => void; cancelling: boolean;
}) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
      onClick={onCancel}>
      <motion.div initial={{ scale: 0.92 }} animate={{ scale: 1 }} exit={{ scale: 0.92 }}
        onClick={e => e.stopPropagation()}
        className="bg-[#141414] border border-[#1E1E1E] rounded-2xl p-6 max-w-sm w-full space-y-4">
        <div className="flex items-center gap-2">
          <AlertTriangle size={18} style={{ color: "#f87171" }} />
          <h3 className="text-white font-black">Cancel tournament?</h3>
        </div>
        {registered > 0 ? (
          <p className="text-gray-400 text-sm">
            This will cancel the tournament and <span className="text-white font-semibold">refund all {registered} registered player{registered !== 1 ? "s" : ""}</span> their entry fees. Cannot be undone.
          </p>
        ) : (
          <p className="text-gray-400 text-sm">
            This will cancel the tournament. No players are registered so no refunds are needed.
          </p>
        )}
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 bg-[#1A1A1A] border border-[#333] rounded-xl text-white text-sm font-semibold">
            Keep it
          </button>
          <button onClick={onConfirm} disabled={cancelling}
            className="flex-1 py-2.5 bg-red-500/20 border border-red-500/40 rounded-xl text-red-400 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50">
            {cancelling && <Loader2 size={13} className="animate-spin" />}
            {cancelling ? "Cancelling…" : registered > 0 ? "Cancel & Refund" : "Cancel"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main detail page ──────────────────────────────────────────────────────────
export default function AdminBlitzDetailPage() {
  const { state } = useAdmin();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  type Detail = BlitzTournament & {
    min_participants?: number;
    registration_start: string;
    tournament_start: string;
    tournament_end: string;
  };

  const [tournament, setTournament] = useState<Detail | null>(null);
  const [questions, setQuestions] = useState<BlitzQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Action states
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showScoreConfirm, setShowScoreConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deletingQ, setDeletingQ] = useState(false);
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [actionMsg, setActionMsg] = useState("");
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Edit state for detail fields
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<{
    entry_fee: number;
    question_count: number;
    max_participants: number | null;
    registration_deadline: string;
  } | null>(null);
  const [editError, setEditError] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => {
    if (!state.isAuthenticated) { router.push("/admin/login"); return; }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.isAuthenticated, id]);

  const load = async () => {
    setLoading(true); setError("");
    try {
      const res = await adminApi.getBlitzDetail(id);
      const raw = (res as any).tournament ?? (res as any).data?.tournament;
      const qs  = (res as any).questions ?? (res as any).data?.questions ?? [];
      // Normalize registered count — backend may use different field names
      if (raw && raw.total_registered == null) {
        raw.total_registered =
          raw.registered_count ??
          raw.total_participants ??
          raw.participant_count ??
          0;
      }
      setTournament(raw);
      setQuestions(qs);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load");
    } finally { setLoading(false); }
  };

  const handlePublish = async () => {
    setActionLoading("publish");
    try { await adminApi.publishBlitz(id); await load(); setActionMsg("Published!"); }
    catch (e) { setError(e instanceof ApiError ? e.message : "Failed"); }
    finally { setActionLoading(null); }
  };

  const handleActivate = async () => {
    setActionLoading("activate");
    try { await adminApi.activateBlitz(id); await load(); setActionMsg("Activated!"); }
    catch (e) { setError(e instanceof ApiError ? e.message : "Failed"); }
    finally { setActionLoading(null); }
  };

  const handleScore = async () => {
    setShowScoreConfirm(false);
    setActionLoading("score");
    try { await adminApi.scoreBlitz(id); await load(); setActionMsg("Scored & paid!"); }
    catch (e) { setError(e instanceof ApiError ? e.message : "Failed"); }
    finally { setActionLoading(null); }
  };

  const handleCancel = async () => {
    setShowCancelConfirm(false);
    setActionLoading("cancel");
    try { await adminApi.cancelBlitz(id); await load(); setActionMsg("Tournament cancelled."); }
    catch (e) { setError(e instanceof ApiError ? e.message : "Failed to cancel"); }
    finally { setActionLoading(null); }
  };

  const handleDeleteQ = async () => {
    if (!deleteTarget) return;
    setDeletingQ(true);
    try {
      await adminApi.deleteBlitzQuestion(id, deleteTarget);
      setQuestions(prev => prev.filter(q => q.id !== deleteTarget));
      setDeleteTarget(null);
    } catch (e) { setError(e instanceof ApiError ? e.message : "Failed to delete"); }
    finally { setDeletingQ(false); }
  };

  const handleEditClick = () => {
    if (!t) return;
    setEditData({
      entry_fee: t.entry_fee,
      question_count: t.question_count,
      max_participants: t.max_participants ?? null,
      registration_deadline: t.registration_start || "",
    });
    setEditMode(true);
    setEditError("");
  };

  const handleEditSave = async () => {
    if (!editData || !t) return;
    setEditError("");
    setEditSaving(true);
    try {
      await adminApi.updateBlitz(id, {
        entry_fee: editData.entry_fee,
        question_count: editData.question_count,
        max_participants: editData.max_participants ?? undefined,
        registration_start: editData.registration_deadline,
      });
      await load();
      setEditMode(false);
      setEditData(null);
      setActionMsg("Settings updated!");
    } catch (e) {
      setEditError(e instanceof ApiError ? e.message : "Failed to save");
    } finally {
      setEditSaving(false);
    }
  };

  const handleEditCancel = () => {
    setEditMode(false);
    setEditData(null);
    setEditError("");
  };

  if (!state.isAuthenticated) return null;

  const t = tournament;

  // Computed prize pool estimate
  const maxPool = t && t.max_participants && t.total_payout_percent
    ? Math.floor(t.entry_fee * t.max_participants * t.total_payout_percent / 100)
    : null;

  const positionPrizes = t?.position_prizes ?? [];

  return (
    <div className="max-w-3xl space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.push("/admin/blitz")}
          className="p-2 rounded-lg border transition-colors"
          style={{ borderColor: "var(--border-subtle)", color: "var(--text-secondary)" }}>
          <ArrowLeft size={16} />
        </button>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Zap size={18} style={{ color: "var(--accent-amber)" }} />
          <h1 className="font-black text-xl text-white truncate">{t?.title ?? "Loading…"}</h1>
          {t && <StatusBadge status={t.status} />}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="text-red-400 text-sm bg-red-900/10 border border-red-900/30 rounded-xl p-3">
          {error}
          <button onClick={() => setError("")} className="ml-2 opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Success flash */}
      <AnimatePresence>
        {actionMsg && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            onAnimationComplete={() => setTimeout(() => setActionMsg(""), 2000)}
            className="text-sm font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2"
            style={{ backgroundColor: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.3)", color: "#34d399" }}>
            <CheckCircle size={14} /> {actionMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-24 rounded-xl animate-pulse bg-[#141414] border border-[#1E1E1E]" />)}
        </div>
      ) : t ? (
        <>
          {/* ── Section 1: Config summary (with edit capability) ── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#141414] border border-[#1E1E1E] rounded-xl p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Tournament Details</p>
              {!editMode && t.total_registered === 0 && t.status === "draft" && (
                <button onClick={handleEditClick}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                  style={{ backgroundColor: "rgba(76,111,255,0.1)", border: "1px solid rgba(76,111,255,0.3)", color: "var(--accent-indigo)" }}>
                  <Pencil size={11} /> Edit
                </button>
              )}
              {!editMode && t.total_registered > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold"
                  style={{ backgroundColor: "rgba(107,114,128,0.15)", border: "1px solid rgba(107,114,128,0.3)", color: "#9ca3af" }}>
                  <Lock size={11} /> Locked — {t.total_registered} player{t.total_registered !== 1 ? "s" : ""} registered
                </div>
              )}
            </div>

            {editMode && editData ? (
              // ── Edit form ──
              <div className="space-y-3 border-t pt-4" style={{ borderColor: "var(--border-hairline)" }}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest mb-1.5 block" style={{ color: "var(--text-muted)" }}>Entry Fee (₦)</label>
                    <input
                      type="number"
                      min="0"
                      value={editData.entry_fee}
                      onChange={(e) => setEditData({ ...editData, entry_fee: Number(e.target.value) })}
                      className="w-full rounded-lg px-3 py-2.5 text-sm font-semibold outline-none"
                      style={{
                        backgroundColor: "var(--bg-base)",
                        borderColor: "var(--border-subtle)",
                        border: "1px solid var(--border-subtle)",
                        color: "var(--text-primary)",
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest mb-1.5 block" style={{ color: "var(--text-muted)" }}>Question Count</label>
                    <input
                      type="number"
                      min="1"
                      value={editData.question_count}
                      onChange={(e) => setEditData({ ...editData, question_count: Number(e.target.value) })}
                      className="w-full rounded-lg px-3 py-2.5 text-sm font-semibold outline-none"
                      style={{
                        backgroundColor: "var(--bg-base)",
                        borderColor: "var(--border-subtle)",
                        border: "1px solid var(--border-subtle)",
                        color: "var(--text-primary)",
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest mb-1.5 block" style={{ color: "var(--text-muted)" }}>Max Players</label>
                    <input
                      type="number"
                      min="1"
                      value={editData.max_participants ?? ""}
                      onChange={(e) => setEditData({ ...editData, max_participants: e.target.value ? Number(e.target.value) : null })}
                      placeholder="Unlimited"
                      className="w-full rounded-lg px-3 py-2.5 text-sm font-semibold outline-none"
                      style={{
                        backgroundColor: "var(--bg-base)",
                        borderColor: "var(--border-subtle)",
                        border: "1px solid var(--border-subtle)",
                        color: "var(--text-primary)",
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest mb-1.5 block" style={{ color: "var(--text-muted)" }}>Registration Deadline</label>
                    <input
                      type="datetime-local"
                      value={editData.registration_deadline ? new Date(editData.registration_deadline).toISOString().slice(0, 16) : ""}
                      onChange={(e) => setEditData({ ...editData, registration_deadline: e.target.value ? new Date(e.target.value).toISOString() : "" })}
                      className="w-full rounded-lg px-3 py-2.5 text-sm font-semibold outline-none"
                      style={{
                        backgroundColor: "var(--bg-base)",
                        borderColor: "var(--border-subtle)",
                        border: "1px solid var(--border-subtle)",
                        color: "var(--text-primary)",
                      }}
                    />
                  </div>
                </div>

                {editError && (
                  <div className="text-xs text-red-400 bg-red-900/10 border border-red-900/30 rounded-lg p-2.5 flex items-center gap-2">
                    <AlertTriangle size={13} className="flex-shrink-0" />
                    {editError}
                  </div>
                )}

                <div className="flex gap-2 justify-end pt-2">
                  <button onClick={handleEditCancel} disabled={editSaving}
                    className="px-4 py-2 rounded-lg text-xs font-bold"
                    style={{ border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
                    Cancel
                  </button>
                  <button onClick={handleEditSave} disabled={editSaving}
                    className="px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
                    style={{ backgroundColor: "var(--accent-indigo)", color: "#fff" }}>
                    {editSaving && <Loader2 size={12} className="animate-spin" />}
                    {editSaving ? "Saving…" : "Save"}
                  </button>
                </div>
              </div>
            ) : (
              // ── Display mode ──
              <>
                {t.description && <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{t.description}</p>}

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { label: "Entry Fee",    value: fmt(t.entry_fee) },
                    { label: "Prize Pool",   value: t.prize_pool > 0 ? fmt(t.prize_pool) : maxPool ? `up to ${fmt(maxPool)}` : t.first_place_percent && t.max_participants ? `up to ${fmt(Math.floor(t.entry_fee * t.max_participants * t.first_place_percent / 100))}` : "₦0" },
                    { label: "Questions",    value: `${questions.length} / ${t.question_count}` },
                    { label: "Per-Q Time",   value: t.per_question_time_seconds ? `${t.per_question_time_seconds}s` : "—" },
                    { label: "Players",      value: t.max_participants ? `${t.total_registered ?? 0} / ${t.max_participants}` : String(t.total_registered ?? 0) },
                    { label: "Cash Winners", value: String(t.cash_winner_count ?? 1) },
                  ].map(s => (
                    <div key={s.label} className="rounded-lg p-3" style={{ backgroundColor: "var(--bg-base)" }}>
                      <p className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>{s.label}</p>
                      <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{s.value}</p>
                    </div>
                  ))}
                </div>

                {/* Prize breakdown */}
                {(t.first_place_percent != null || t.payout_distribution?.length || positionPrizes.length > 0) && (
                  <div className="space-y-1.5">
                    <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Prize Breakdown</p>

                    {t.first_place_percent != null ? (
                      // New simplified model
                      <>
                        {[
                          { rank: "1st", icon: "#facc15", prize: (() => {
                            const liveP = t.prize_pool > 0 ? Math.round(t.prize_pool * t.first_place_percent! / 100) : null;
                            const capP  = maxPool ? Math.round(maxPool * t.first_place_percent! / 100) : null;
                            return liveP ? fmt(liveP) : capP ? `up to ${fmt(capP)}` : `${t.first_place_percent}% of revenue`;
                          })() },
                          { rank: "2nd", icon: "#9ca3af", prize: "🎫 Free entry" },
                          { rank: "3rd", icon: "#ea580c", prize: `🏷️ ${t.third_place_discount_percent ?? "?"}% off next entry` },
                        ].map(row => (
                          <div key={row.rank} className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-1.5">
                              <Trophy size={12} style={{ color: row.icon }} />
                              <span style={{ color: "var(--text-secondary)" }}>{row.rank} Place</span>
                            </span>
                            <span className="font-bold font-mono" style={{ color: row.rank === "1st" ? "var(--accent-amber)" : "var(--accent-violet)" }}>
                              {row.prize}
                            </span>
                          </div>
                        ))}
                      </>
                    ) : (
                      // Legacy model
                      <>
                        {(t.payout_distribution ?? []).map((pct, i) => {
                          const rankPool = maxPool ? Math.floor(maxPool * pct / 100) : null;
                          const label = i === 0 ? "1st" : i === 1 ? "2nd" : i === 2 ? "3rd" : `${i + 1}th`;
                          return (
                            <div key={i} className="flex items-center justify-between text-sm">
                              <span className="flex items-center gap-1.5">
                                <Trophy size={12} style={{ color: i === 0 ? "#facc15" : i === 1 ? "#9ca3af" : "#ea580c" }} />
                                <span style={{ color: "var(--text-secondary)" }}>{label} Place ({pct}%)</span>
                              </span>
                              <span className="font-bold font-mono" style={{ color: "var(--accent-amber)" }}>
                                {rankPool ? `up to ${fmt(rankPool)}` : `${pct}% of pool`}
                              </span>
                            </div>
                          );
                        })}
                        {positionPrizes.map(p => (
                          <div key={p.position} className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-1.5">
                              <Ticket size={12} style={{ color: "var(--accent-violet)" }} />
                              <span style={{ color: "var(--text-secondary)" }}>
                                {p.position === 2 ? "2nd" : p.position === 3 ? "3rd" : `${p.position}th`} Place
                              </span>
                            </span>
                            <span className="font-bold text-purple-400">
                              {p.prize_type === "free_ticket" ? "🎫 Free entry" : `🏷️ ${p.discount_percent ?? "?"}% off`}
                            </span>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                )}

                {/* Timestamps */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t" style={{ borderColor: "var(--border-hairline)" }}>
                  {[
                    { label: "Registration Opens", value: t.registration_start },
                    { label: "Tournament Starts",  value: t.tournament_start },
                    { label: "Tournament Ends",    value: t.tournament_end },
                  ].map(s => (
                    <div key={s.label}>
                      <p className="text-[9px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "var(--text-muted)" }}>{s.label}</p>
                      <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{s.value ? fmtDate(s.value) : "—"}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </motion.div>

          {/* ── Section 2: Questions ── */}
          <div className="bg-[#141414] border border-[#1E1E1E] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E1E1E]">
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Questions</p>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: questions.length >= t.question_count ? "rgba(76,111,255,0.2)" : "rgba(107,114,128,0.2)", color: questions.length >= t.question_count ? "var(--accent-indigo)" : "#9ca3af" }}>
                  {questions.length} / {t.question_count}
                </span>
              </div>
              <button onClick={() => setShowAddQuestion(v => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                style={{ backgroundColor: showAddQuestion ? "rgba(76,111,255,0.2)" : "rgba(76,111,255,0.1)", border: "1px solid rgba(76,111,255,0.3)", color: "var(--accent-indigo)" }}>
                <Plus size={12} /> Add Question
              </button>
            </div>

            {/* Add question form */}
            <AnimatePresence>
              {showAddQuestion && (
                <div className="px-5 pt-4">
                  <AddQuestionForm
                    tournamentId={id}
                    onAdded={q => { setQuestions(prev => [...prev, q]); setShowAddQuestion(false); }}
                    onCancel={() => setShowAddQuestion(false)}
                  />
                </div>
              )}
            </AnimatePresence>

            {questions.length === 0 && !showAddQuestion ? (
              <div className="px-5 py-10 text-center">
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>No questions yet — click &ldquo;Add Question&rdquo; above</p>
              </div>
            ) : (
              <div className="divide-y divide-[#1E1E1E]">
                {questions.map((q, i) => (
                  <motion.div key={q.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-start gap-3 px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                    {/* Question image */}
                    {q.image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={q.image_url} alt="" className="w-14 h-10 object-cover rounded-lg flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                          style={{ backgroundColor: q.format === "multiple_choice" ? "rgba(76,111,255,0.15)" : "rgba(139,92,246,0.15)", color: q.format === "multiple_choice" ? "var(--accent-indigo)" : "var(--accent-violet)" }}>
                          {q.format === "multiple_choice" ? "MC" : "Type"}
                        </span>
                        <span className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>Q{i + 1}</span>
                      </div>
                      <p className="text-sm font-semibold text-white leading-snug">{q.question}</p>
                      {q.options && q.options.length > 0 && (
                        <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                          {q.options.join(" · ")}
                        </p>
                      )}
                      {(q as any).correct_answer && (
                        <p className="text-[11px] mt-0.5">
                          <span style={{ color: "var(--text-muted)" }}>✓ </span>
                          <span className="font-semibold" style={{ color: "var(--accent-indigo)" }}>{(q as any).correct_answer}</span>
                        </p>
                      )}
                    </div>
                    <button onClick={() => setDeleteTarget(q.id)}
                      className="p-1.5 rounded-lg flex-shrink-0 hover:opacity-80 transition-opacity"
                      style={{ backgroundColor: "rgba(239,68,68,0.1)" }}>
                      <Trash2 size={13} style={{ color: "#f87171" }} />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* ── Section 3: Action button ── */}
          <div className="bg-[#141414] border border-[#1E1E1E] rounded-xl p-4 space-y-2">
            {t.status === "draft" && (
              <div className="space-y-2">
                <button onClick={handlePublish} disabled={actionLoading === "publish"}
                  className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ backgroundColor: "transparent", border: "1px solid rgba(76,111,255,0.5)", color: "var(--accent-indigo)" }}>
                  {actionLoading === "publish" ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
                  {actionLoading === "publish" ? "Opening…" : "Open Registration Now (Early)"}
                </button>
                <p className="text-center text-xs" style={{ color: "var(--text-muted)" }}>
                  Optional — registration opens automatically at {fmtDate(t.registration_start)}. Click only to open early.
                </p>
                <button onClick={() => setShowCancelConfirm(true)} disabled={actionLoading === "cancel"}
                  className="w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
                  style={{ backgroundColor: "transparent", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }}>
                  {actionLoading === "cancel" ? <Loader2 size={13} className="animate-spin" /> : <XCircle size={13} />}
                  {actionLoading === "cancel" ? "Cancelling…" : "Discard Tournament"}
                </button>
              </div>
            )}
            {t.status === "registration" && (
              <div className="space-y-2">
                <button onClick={handleActivate} disabled={actionLoading === "activate"}
                  className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ backgroundColor: "transparent", border: "1px solid rgba(76,111,255,0.5)", color: "var(--accent-indigo)" }}>
                  {actionLoading === "activate" ? <Loader2 size={15} className="animate-spin" /> : <Zap size={15} />}
                  {actionLoading === "activate" ? "Going live…" : "Go Live Now (Early)"}
                </button>
                <p className="text-center text-xs" style={{ color: "var(--text-muted)" }}>
                  Optional — tournament goes live automatically at {fmtDate(t.tournament_start)}. Click only to go live early.
                </p>
                <button onClick={() => setShowCancelConfirm(true)} disabled={actionLoading === "cancel"}
                  className="w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
                  style={{ backgroundColor: "transparent", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }}>
                  {actionLoading === "cancel" ? <Loader2 size={13} className="animate-spin" /> : <XCircle size={13} />}
                  {actionLoading === "cancel" ? "Cancelling…" : `Cancel & Refund${(t.total_registered ?? 0) > 0 ? ` (${t.total_registered ?? 0} players)` : ""}`}
                </button>
              </div>
            )}
            {t.status === "active" && t.total_registered > 0 && (
              <div className="space-y-2">
                <button onClick={() => setShowScoreConfirm(true)} disabled={actionLoading === "score"}
                  className="w-full py-3 rounded-xl text-sm font-black flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ backgroundColor: "rgba(234,179,8,0.15)", border: "1px solid rgba(234,179,8,0.4)", color: "#facc15" }}>
                  {actionLoading === "score" ? <Loader2 size={15} className="animate-spin" /> : <Trophy size={15} />}
                  {actionLoading === "score" ? "Scoring…" : "Score & Pay"}
                </button>
                <button onClick={() => setShowCancelConfirm(true)} disabled={actionLoading === "cancel"}
                  className="w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
                  style={{ backgroundColor: "transparent", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }}>
                  {actionLoading === "cancel" ? <Loader2 size={13} className="animate-spin" /> : <XCircle size={13} />}
                  {actionLoading === "cancel" ? "Cancelling…" : `Cancel & Refund All (${t.total_registered ?? 0} players)`}
                </button>
              </div>
            )}
            {t.status === "active" && (t.total_registered ?? 0) === 0 && (
              <div className="space-y-2">
                <div className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                  style={{ border: "1px solid var(--border-subtle)", color: "var(--text-muted)" }}>
                  No participants yet
                </div>
                <button onClick={() => setShowCancelConfirm(true)} disabled={actionLoading === "cancel"}
                  className="w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
                  style={{ backgroundColor: "transparent", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }}>
                  {actionLoading === "cancel" ? <Loader2 size={13} className="animate-spin" /> : <XCircle size={13} />}
                  {actionLoading === "cancel" ? "Cancelling…" : "Cancel Tournament"}
                </button>
              </div>
            )}
            {t.status === "scoring" && (
              <div className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 opacity-50"
                style={{ border: "1px solid rgba(234,179,8,0.3)", color: "#facc15" }}>
                <Loader2 size={15} className="animate-spin" /> Calculating results…
              </div>
            )}
            {t.status === "completed" && (
              <div className="flex gap-2">
                <button onClick={() => router.push(`/admin/blitz/${id}/leaderboard`)}
                  className="flex-1 py-3 rounded-xl text-sm font-black flex items-center justify-center gap-2"
                  style={{ backgroundColor: "rgba(76,111,255,0.1)", border: "1px solid rgba(76,111,255,0.3)", color: "var(--accent-indigo)" }}>
                  <Trophy size={15} /> Leaderboard
                </button>
                <button onClick={() => router.push(`/admin/blitz/${id}/results`)}
                  className="flex-1 py-3 rounded-xl text-sm font-black flex items-center justify-center gap-2"
                  style={{ backgroundColor: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.3)", color: "#34d399" }}>
                  <CheckCircle size={15} /> Results &amp; Audit
                </button>
              </div>
            )}
          </div>
        </>
      ) : null}

      {/* Modals */}
      <AnimatePresence>
        {deleteTarget && (
          <DeleteQConfirm
            onConfirm={handleDeleteQ}
            onCancel={() => setDeleteTarget(null)}
            deleting={deletingQ}
          />
        )}
        {showScoreConfirm && (
          <ScoreConfirm
            onConfirm={handleScore}
            onCancel={() => setShowScoreConfirm(false)}
            scoring={actionLoading === "score"}
          />
        )}
        {showCancelConfirm && (
          <CancelConfirm
            registered={t?.total_registered ?? 0}
            onConfirm={handleCancel}
            onCancel={() => setShowCancelConfirm(false)}
            cancelling={actionLoading === "cancel"}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
