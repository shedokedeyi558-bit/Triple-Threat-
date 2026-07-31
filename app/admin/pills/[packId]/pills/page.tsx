"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { adminApi, ApiError } from "@/lib/api";
import { ArrowLeft, Loader2, AlertCircle, CheckCircle2, Clock } from "lucide-react";

type Pill = {
  id: string;
  question: string;
  format: "multiple_choice" | "type_answer";
  options: string[] | null;
  correct_answer: string;
  timer: number;
  price: number;
  prize: number;
  status: "available" | "played";
  color: string;
};

type Pack = {
  id: string;
  name: string;
  category: string;
  status: string;
};

export default function AdminStandardPackPillsPage() {
  const { packId } = useParams<{ packId: string }>();
  const router = useRouter();

  const [pack, setPack] = useState<Pack | null>(null);
  const [pills, setPills] = useState<Pill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!packId) return;
    adminApi.getStandardPackPills(packId)
      .then((res) => {
        setPack(res.pack);
        setPills(res.pills ?? []);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load pills"))
      .finally(() => setLoading(false));
  }, [packId]);

  const available = pills.filter((p) => p.status === "available").length;
  const played    = pills.filter((p) => p.status === "played").length;

  return (
    <div className="space-y-5 max-w-3xl">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/admin/pills")}
          className="p-2 rounded-lg border flex-shrink-0 transition-colors"
          style={{ borderColor: "var(--border-subtle)", color: "var(--text-secondary)" }}
          aria-label="Back to pill packs"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="min-w-0">
          <h1 className="font-headline text-xl font-semibold truncate" style={{ color: "var(--text-primary)" }}>
            {pack ? pack.name : "Pack Pills"}
          </h1>
          {pack && (
            <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
              {pack.category} · {pills.length} pill{pills.length !== 1 ? "s" : ""}
              {pills.length > 0 && ` · ${available} available · ${played} played`}
            </p>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg p-3 border text-sm"
          style={{ borderColor: "rgba(239,68,68,0.3)", backgroundColor: "rgba(239,68,68,0.06)", color: "#f87171" }}>
          <AlertCircle size={15} className="flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-16">
          <Loader2 size={26} className="animate-spin" style={{ color: "var(--accent-indigo)" }} />
        </div>
      )}

      {/* Summary strip */}
      {!loading && pills.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total",     value: pills.length,                        color: "var(--text-primary)" },
            { label: "Available", value: available,                           color: "var(--accent-indigo)" },
            { label: "Played",    value: played,                              color: "var(--text-muted)" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl p-3 border text-center"
              style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-hairline)" }}>
              <p className="text-[10px] uppercase tracking-widest font-bold mb-1" style={{ color: "var(--text-muted)" }}>
                {s.label}
              </p>
              <p className="font-black text-lg font-mono" style={{ color: s.color }}>
                {s.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && pills.length === 0 && (
        <div className="rounded-xl p-10 text-center border"
          style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-card)" }}>
          <p className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>No pills in this pack</p>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            Add pills via Create New Pack or the pack creation form
          </p>
        </div>
      )}

      {/* Pill list — card layout, one card per question */}
      {!loading && pills.length > 0 && (
        <div className="space-y-3">
          {pills.map((pill, i) => (
            <div key={pill.id}
              className="rounded-xl border px-4 py-3 space-y-2"
              style={{
                borderColor: "var(--border-hairline)",
                backgroundColor: "var(--bg-card)",
                opacity: pill.status === "played" ? 0.55 : 1,
              }}>

              {/* Question */}
              <p className="text-sm font-semibold leading-snug" style={{ color: "var(--text-primary)" }}>
                {i + 1}. {pill.question}
              </p>

              {/* MC options */}
              {pill.format === "multiple_choice" && pill.options && pill.options.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {pill.options.map((opt) => {
                    const isCorrect = opt === pill.correct_answer;
                    return (
                      <span key={opt} className="text-[11px] px-2 py-0.5 rounded"
                        style={{
                          backgroundColor: isCorrect ? "rgba(232,163,61,0.15)" : "rgba(255,255,255,0.05)",
                          color: isCorrect ? "var(--accent-amber)" : "var(--text-secondary)",
                          border: isCorrect ? "1px solid rgba(232,163,61,0.3)" : "1px solid var(--border-hairline)",
                          fontWeight: isCorrect ? 700 : 400,
                        }}>
                        {isCorrect && "✓ "}{opt}
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Chips row: answer · timer · status */}
              <div className="flex items-center gap-2 flex-wrap">

                {/* Answer chip — type_answer only */}
                {pill.format === "type_answer" && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded"
                    style={{ backgroundColor: "rgba(232,163,61,0.1)", color: "var(--accent-amber)", border: "1px solid rgba(232,163,61,0.25)" }}>
                    Ans: {pill.correct_answer}
                  </span>
                )}

                {/* Timer chip */}
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded"
                  style={{ backgroundColor: "rgba(255,255,255,0.04)", color: "var(--text-muted)", border: "1px solid var(--border-hairline)" }}>
                  <Clock size={9} /> {pill.timer ? `${pill.timer}s` : "—"}
                </span>

                {/* Status chip */}
                {pill.status === "available" ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded"
                    style={{ backgroundColor: "rgba(76,111,255,0.12)", color: "var(--accent-indigo)", border: "1px solid rgba(76,111,255,0.25)" }}>
                    <CheckCircle2 size={8} /> Open
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded"
                    style={{ backgroundColor: "rgba(255,255,255,0.05)", color: "var(--text-muted)", border: "1px solid var(--border-hairline)" }}>
                    Played
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
