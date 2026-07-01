"use client";

import { useEffect, useState, useCallback } from "react";
import { adminApi, type AdminQuestion, ApiError } from "@/lib/api";
import { DifficultyBadge } from "@/components/ui/DifficultyBadge";
import { Plus, Trash2, Edit2, Download, Loader2 } from "lucide-react";
import { QuestionModal } from "@/components/admin/QuestionModal";
import type { Difficulty } from "@/lib/types";

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<AdminQuestion[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminQuestion | null>(null);

  const fetchQuestions = useCallback(async (q?: string) => {
    setLoading(true);
    setError("");
    try {
      const data = await adminApi.getQuestions(q ? { search: q } : undefined);
      setQuestions(data.questions);
      setTotal(data.total ?? data.questions.length);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load questions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchQuestions(); }, [fetchQuestions]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => fetchQuestions(search), 400);
    return () => clearTimeout(t);
  }, [search, fetchQuestions]);

  const toggleSelect = (id: string) =>
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this question?")) return;
    try {
      await adminApi.deleteQuestion(id);
      setQuestions((prev) => prev.filter((q) => q.id !== id));
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Delete failed");
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selected.length} question(s)?`)) return;
    await Promise.all(selected.map((id) => adminApi.deleteQuestion(id)));
    setQuestions((prev) => prev.filter((q) => !selected.includes(q.id)));
    setSelected([]);
  };

  const handleSaved = (q: AdminQuestion) => {
    setQuestions((prev) => {
      const idx = prev.findIndex((x) => x.id === q.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = q;
        return next;
      }
      return [q, ...prev];
    });
    setModalOpen(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-white">Question Bank</h1>
          <p className="text-gray-400 text-sm">{total} questions total</p>
        </div>
        <div className="flex gap-2">
          <a
            href={adminApi.getExportUrl("sessions")}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-[#2A2A2A] text-gray-400 text-sm hover:text-white hover:border-gray-400 transition-colors"
          >
            <Download size={15} />
            Export CSV
          </a>
          <button
            onClick={() => { setEditing(null); setModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neon text-black font-bold text-sm active:scale-95 transition-transform"
          >
            <Plus size={16} />
            Add Question
          </button>
        </div>
      </div>

      <input
        type="text"
        placeholder="Search questions..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full bg-card border border-[#2A2A2A] focus:border-neon rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition-colors"
      />

      {selected.length > 0 && (
        <div className="bg-card border border-[#2A2A2A] rounded-xl px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-gray-300">{selected.length} selected</span>
          <button
            onClick={handleBulkDelete}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-900/30 text-red-400 text-xs font-semibold hover:bg-red-900/50 transition-colors"
          >
            <Trash2 size={13} /> Delete
          </button>
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 size={28} className="text-neon animate-spin" />
        </div>
      )}

      {error && !loading && (
        <div className="text-center py-8 text-red-400 text-sm">{error}</div>
      )}

      {!loading && !error && (
        <div className="space-y-2">
          {questions.map((q) => (
            <div
              key={q.id}
              className={`bg-card border rounded-xl p-4 transition-colors ${
                selected.includes(q.id) ? "border-neon" : "border-[#2A2A2A]"
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={selected.includes(q.id)}
                  onChange={() => toggleSelect(q.id)}
                  className="mt-1 accent-neon w-4 h-4 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    {q.door_id && <span className="text-xs font-bold text-gray-500">Door {q.door_id}</span>}
                    {q.difficulty && <DifficultyBadge difficulty={q.difficulty as Difficulty} />}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      q.status === "active" ? "bg-neon/10 text-neon" : "bg-gray-800 text-gray-500"
                    }`}>
                      {q.status}
                    </span>
                    <span className="text-xs text-gray-500 bg-[#2A2A2A] px-2 py-0.5 rounded-full">
                      {q.format === "multiple_choice" ? "MC" : "Type"}
                    </span>
                  </div>
                  <p className="text-sm text-white font-medium leading-snug line-clamp-2">{q.text}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-neon font-bold text-sm">₦{q.prize.toLocaleString()}</span>
                    <span className="text-xs text-gray-500">{q.time_limit}s timer</span>
                    <span className="text-xs text-gray-500">
                      {new Date(q.created_at).toLocaleDateString("en-NG", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => { setEditing(q); setModalOpen(true); }}
                    className="p-2 rounded-lg hover:bg-[#2A2A2A] text-gray-400 hover:text-white transition-colors"
                    aria-label="Edit"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    onClick={() => handleDelete(q.id)}
                    className="p-2 rounded-lg hover:bg-red-900/30 text-gray-400 hover:text-red-400 transition-colors"
                    aria-label="Delete"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {questions.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No questions found. Add one to get started.
            </div>
          )}
        </div>
      )}

      <QuestionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        question={editing}
        onSaved={handleSaved}
      />
    </div>
  );
}
