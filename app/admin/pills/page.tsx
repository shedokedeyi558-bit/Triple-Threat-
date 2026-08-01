"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { adminApi, ApiError } from "@/lib/api";
import { Loader2, Plus, Package, Eye, EyeOff, Trash2, BookOpen, BarChart2, TrendingUp, Activity, Clock, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ── Inline live stats strip — mounts when a pack row is expanded ─────────────
function PackStatsMini({ packId }: { packId: string }) {
  const [stats, setStats] = useState<{
    live: number; won: number; lost: number;
    total: number; win_rate: number;
  } | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetch = async () => {
    try {
      const res = await adminApi.getPackLiveStats(packId);
      setStats({ ...res, win_rate: res.win_rate <= 1 ? res.win_rate * 100 : res.win_rate });
    } catch { /* silent */ }
  };

  useEffect(() => {
    fetch();
    timerRef.current = setInterval(fetch, 12000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [packId]);

  if (!stats) return null;

  const hasData = stats.total >= 5;
  const winRateHigh = hasData && stats.win_rate > 70;
  const winRateLow  = hasData && stats.win_rate < 15;
  const barColor = !hasData ? "#333" : winRateHigh ? "#fbbf24" : winRateLow ? "#ef4444" : "#34d399";

  return (
    <div style={{
      margin: "0 16px 0", padding: "10px 12px", borderRadius: 8,
      backgroundColor: "var(--bg-base)", border: "1px solid var(--border-hairline)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
        <Activity size={9} style={{ color: "var(--accent-indigo)" }} className="animate-pulse" />
        <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-muted)" }}>Live</span>
        {hasData && (
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4 }}>
            {winRateHigh && <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 3, backgroundColor: "rgba(251,191,36,0.12)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.2)" }}>Too easy</span>}
            {winRateLow  && <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 3, backgroundColor: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" }}>Low wins</span>}
          </div>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#60a5fa", display: "inline-block" }} className="animate-pulse" />
          <span style={{ fontSize: 11, fontWeight: 700, color: "#60a5fa" }}>{stats.live}</span>
          <span style={{ fontSize: 10, color: "var(--text-muted)" }}>live</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "var(--accent-amber)", display: "inline-block" }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--accent-amber)" }}>{stats.won}</span>
          <span style={{ fontSize: 10, color: "var(--text-muted)" }}>won</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#4b5563", display: "inline-block" }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: "#6b7280" }}>{stats.lost}</span>
          <span style={{ fontSize: 10, color: "var(--text-muted)" }}>lost</span>
        </div>
        {/* Win-rate bar */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 6 }}>
          <TrendingUp size={10} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
          <div style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: "#1E1E1E", overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: 2, width: `${hasData ? stats.win_rate : 0}%`, backgroundColor: barColor, transition: "width 0.5s ease" }} />
          </div>
          <span style={{ fontSize: 11, fontFamily: "monospace", fontWeight: 700, minWidth: 36, textAlign: "right", color: !hasData ? "var(--text-muted)" : barColor }}>
            {hasData ? `${stats.win_rate.toFixed(0)}%` : "—"}
          </span>
        </div>
      </div>
    </div>
  );
}

interface PillPack {
  id: string;
  name: string;
  category: string;
  status: "active" | "inactive" | "draft";
  is_vip?: boolean;
  is_featured?: boolean;
  pills: { id: string; color: string; status: string; prize?: number }[];
  available_count?: number;
  played_count?: number;
  prize_amount?: number;
  entry_fee?: number;
  question_count?: number;
  quiz_expires_at?: string | null;
  created_at?: string;
  max_entries?: number | null;
  entries_made?: number;
  entry_cap_reached?: boolean;
  current_entries?: number;
  // Attempt outcome (populated when entry_cap_reached / someone won/lost)
  latest_attempt?: {
    player_phone?: string;
    passed?: boolean;
    score?: number;
    total_questions?: number;
    completed_at?: string;
    expires_at?: string;      // when the claim window closes
    prize_paid?: number;
  } | null;
}

// ── Force-delete confirmation dialog ────────────────────────────────────────
function ForceDeleteDialog({ pack, onConfirm, onCancel, deleting }: {
  pack: PillPack; onConfirm: () => void; onCancel: () => void; deleting: boolean;
}) {
  const [typed, setTyped] = useState("");
  const matches = typed.trim().toLowerCase() === pack.name.trim().toLowerCase();
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)", padding: 16 }}
      onClick={onCancel}>
      <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl p-6 space-y-4 border"
        style={{ backgroundColor: "var(--bg-card)", borderColor: "rgba(239,68,68,0.3)" }}>
        <div>
          <p className="font-bold text-base text-white mb-1">Force delete pack?</p>
          <p className="text-sm text-gray-400 leading-relaxed">
            Permanently deletes <span className="font-semibold text-white">{pack.name}</span> and all its pills. Cannot be undone.
          </p>
        </div>
        <div>
          <label className="text-[11px] uppercase tracking-widest font-bold text-gray-500 block mb-1.5">Type pack name to confirm</label>
          <input type="text" placeholder={pack.name} value={typed} onChange={(e) => setTyped(e.target.value)}
            className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
            style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)" }} />
        </div>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-gray-400 border" style={{ border: "1px solid var(--border-subtle)" }}>Cancel</button>
          <button onClick={onConfirm} disabled={!matches || deleting}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-40"
            style={{ backgroundColor: "#ef4444", color: "#fff" }}>
            {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
            {deleting ? "Deleting..." : "Force Delete"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function AdminPillsPage() {
  const router = useRouter();
  const [packs, setPacks] = useState<PillPack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toggling, setToggling] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [forceDeleteTarget, setForceDeleteTarget] = useState<PillPack | null>(null);
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);

  useEffect(() => { 
    (async () => {
      console.log("[DEBUG] useEffect triggered - showInactive changed to:", showInactive);
      setLoading(true);
      try {
        console.log("[DEBUG] About to call getPillPacks with showInactive =", showInactive);
        const res = await adminApi.getPillPacks(showInactive);
        console.log("[DEBUG] Response received, packs count:", res.packs?.length);
        setPacks(res.packs as PillPack[]);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed to load packs");
      } finally {
        setLoading(false);
      }
    })();
  }, [showInactive]);

  const fetchPacks = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getPillPacks(showInactive);
      setPacks(res.packs as PillPack[]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load packs");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (pack: PillPack) => {
    setToggling(pack.id);
    try {
      const newStatus = pack.status === "active" ? "inactive" : "active";
      await adminApi.updatePillPack(pack.id, { status: newStatus });
      setPacks((prev) => prev.map((p) => p.id === pack.id ? { ...p, status: newStatus } : p));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update");
    } finally {
      setToggling(null);
    }
  };

  const handleDelete = async (pack: PillPack) => {
    const availableCount = pack.available_count ?? pack.pills.filter((p) => p.status === "available").length;
    if (availableCount > 0) {
      setError(`Cannot delete "${pack.name}" — ${availableCount} unplayed pill(s). Use Force Delete to override.`);
      return;
    }
    if (!window.confirm(`Delete "${pack.name}"?\n\nThis cannot be undone.`)) return;
    setDeleting(pack.id);
    try {
      await adminApi.deletePillPack(pack.id);
      setPacks((prev) => prev.filter((p) => p.id !== pack.id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete pack");
    } finally {
      setDeleting(null);
    }
  };

  const handleForceDelete = async () => {
    if (!forceDeleteTarget) return;
    setDeleting(forceDeleteTarget.id);
    try {
      await adminApi.deletePillPackForce(forceDeleteTarget.id);
      setPacks((prev) => prev.filter((p) => p.id !== forceDeleteTarget.id));
      setForceDeleteTarget(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Force delete failed");
      setForceDeleteTarget(null);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Pill Packs</h1>
          <p className="text-gray-500 text-sm mt-0.5">{packs.length} pack{packs.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={() => router.push("/admin/pills/create")}
          className="flex items-center gap-2 px-4 py-2.5 font-bold rounded-xl text-sm"
          style={{ backgroundColor: "var(--accent-indigo)", color: "white" }}>
          <Plus size={15} /> Create New Pack
        </button>
      </div>
      {error && (
        <div className="bg-red-900/20 border border-red-800/40 rounded-xl p-3 text-red-400 text-sm flex items-start justify-between gap-3">
          <span>{error}</span>
          <button onClick={() => setError("")} className="text-red-400 opacity-60 hover:opacity-100 flex-shrink-0 text-xs font-bold">✕</button>
        </div>
      )}

      {/* Search and filters */}
      {!loading && packs.length > 0 && (
        <div className="space-y-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search packs by name or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl outline-none"
              style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)" }}
            />
            {search && (
              <button onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-xs font-bold">
                ✕
              </button>
            )}
          </div>
          {/* Toggle chip for inactive packs */}
          <button
            onClick={() => {
              console.log("[DEBUG] Toggle clicked - current showInactive:", showInactive, "-> will become:", !showInactive);
              setShowInactive(!showInactive);
            }}
            className="px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-2"
            style={showInactive
              ? { backgroundColor: "rgba(76,111,255,0.2)", border: "1px solid rgba(76,111,255,0.4)", color: "var(--accent-indigo)" }
              : { backgroundColor: "rgba(76,111,255,0.08)", border: "1px solid rgba(76,111,255,0.15)", color: "var(--text-muted)" }}>
            {showInactive ? "✓" : "○"} Show inactive & sold-out packs
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 size={28} className="text-[#4C6FFF] animate-spin" /></div>
      ) : packs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Package size={40} className="text-gray-700 mb-4" />
          <p className="text-gray-500 font-semibold">No pill packs yet</p>
          <button onClick={() => router.push("/admin/pills/create")} className="mt-4 text-sm font-bold hover:underline" style={{ color: "var(--accent-indigo)" }}>
            Create First Pack →
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {(() => {
            const q = search.trim().toLowerCase();
            const filtered = q
              ? packs.filter((p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q))
              : packs;
            if (filtered.length === 0) return (
              <p className="text-center py-12 text-sm text-gray-500">No packs match &ldquo;{search}&rdquo;</p>
            );
            return filtered.map((pack, i) => {
            const isSpecial = !!pack.is_vip;
            const prize = pack.prize_amount ?? (pack.pills[0] as any)?.prize ?? null;
            const entryFee = pack.entry_fee ?? null;
            const qCount = pack.question_count ?? pack.pills.length ?? null;
            const attempt = pack.latest_attempt ?? null;
            const isClaimed = pack.entry_cap_reached === true;
            const isWon = isClaimed && attempt?.passed === true;
            const isLost = isClaimed && attempt?.passed === false;
            const canSafeDelete = pack.status !== "active" && (pack.available_count ?? 0) === 0;

            // Status chip config
            type ChipKey = "available" | "claimed" | "won" | "lost" | "inactive";
            const chipConfig: Record<ChipKey, { label: string; bg: string; color: string; border: string }> = {
              available: { label: "Available", bg: "rgba(74,222,128,0.12)", color: "#4ADE80", border: "rgba(74,222,128,0.25)" },
              claimed:   { label: "Claimed",   bg: "rgba(251,191,36,0.12)", color: "#fbbf24", border: "rgba(251,191,36,0.25)" },
              won:       { label: "Won – Paid", bg: "rgba(244,63,94,0.1)",  color: "#fb7185", border: "rgba(244,63,94,0.25)" },
              lost:      { label: "Lost",       bg: "rgba(244,63,94,0.1)",  color: "#fb7185", border: "rgba(244,63,94,0.25)" },
              inactive:  { label: "Inactive",   bg: "rgba(255,255,255,0.05)", color: "#6b7280", border: "rgba(255,255,255,0.08)" },
            };
            const chipKey: ChipKey = pack.status !== "active" ? "inactive"
              : isWon ? "won"
              : isLost ? "lost"
              : isClaimed ? "claimed"
              : "available";
            const chip = chipConfig[chipKey];

            // Outcome line text
            let outcomeLine: { phone?: string; detail: string; detailColor?: string } | null = null;
            if (isClaimed && attempt) {
              const phone = attempt.player_phone ?? "—";
              if (isWon) {
                const ts = attempt.completed_at ? new Date(attempt.completed_at).toLocaleString("en-NG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";
                outcomeLine = { phone, detail: `${ts} · ${attempt.score ?? "—"}/${attempt.total_questions ?? qCount ?? "—"} correct · ₦${(attempt.prize_paid ?? prize ?? 0).toLocaleString()} paid`, detailColor: "#fb7185" };
              } else if (isLost) {
                const ts = attempt.completed_at ? new Date(attempt.completed_at).toLocaleString("en-NG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";
                outcomeLine = { phone, detail: `${ts} · ${attempt.score ?? "—"}/${attempt.total_questions ?? qCount ?? "—"} correct`, detailColor: "#6b7280" };
              } else {
                // Claimed but not yet played — show time remaining
                const msLeft = attempt.expires_at ? new Date(attempt.expires_at).getTime() - Date.now() : null;
                const timeLeft = msLeft === null ? "—"
                  : msLeft <= 0 ? "Expired"
                  : (() => { const h = Math.floor(msLeft / 3600000); const m = Math.floor((msLeft % 3600000) / 60000); return h > 0 ? `${h}h ${m}m to play` : `${m}m to play`; })();
                outcomeLine = { phone, detail: timeLeft, detailColor: msLeft !== null && msLeft < 3600000 ? "#f87171" : "#fbbf24" };
              }
            }

            return (
              <motion.div key={pack.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                style={{ borderRadius: 14, overflow: "hidden", backgroundColor: "var(--bg-card)", border: "1px solid var(--border-hairline)" }}>

                {/* ── Card body ── */}
                <div style={{ padding: "14px 16px" }}>

                  {/* Row 1: name + status chip */}
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 6 }}>
                    <p style={{ fontSize: 15, fontWeight: 800, color: "var(--text-primary)", margin: 0, lineHeight: 1.2 }}>{pack.name}</p>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 9.5, fontWeight: 700, letterSpacing: "0.04em", padding: "3px 9px", borderRadius: 100, flexShrink: 0, backgroundColor: chip.bg, color: chip.color, border: `1px solid ${chip.border}` }}>
                      {chipKey === "available" && <span style={{ width: 5, height: 5, borderRadius: "50%", background: chip.color, boxShadow: `0 0 6px ${chip.color}`, animation: "pill-pulse 1.8s infinite", flexShrink: 0 }} />}
                      {chip.label}
                    </span>
                  </div>

                  {/* Row 2: stat chips — Questions · Entry · Prize */}
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: outcomeLine ? 8 : 0 }}>
                    {[
                      qCount != null ? { label: "Questions", value: `${qCount}Q` } : null,
                      entryFee != null ? { label: "Entry", value: `₦${entryFee.toLocaleString()}` } : null,
                      prize != null ? { label: "Prize", value: `₦${prize.toLocaleString()}` } : null,
                    ].filter(Boolean).map((s) => (
                      <span key={s!.label} style={{ fontSize: 10.5, fontWeight: 600, padding: "2px 8px", borderRadius: 6, backgroundColor: "rgba(255,255,255,0.05)", color: "var(--text-secondary)", border: "1px solid var(--border-hairline)" }}>
                        <span style={{ fontSize: 8.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", marginRight: 3 }}>{s!.label}</span>
                        {s!.value}
                      </span>
                    ))}
                    <span style={{ fontSize: 10.5, fontWeight: 600, padding: "2px 8px", borderRadius: 6, backgroundColor: "rgba(255,255,255,0.05)", color: "var(--text-secondary)", border: "1px solid var(--border-hairline)" }}>
                      <span style={{ fontSize: 8.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", marginRight: 3 }}>{pack.category}</span>
                    </span>
                  </div>

                  {/* Row 3: outcome line (claimed/won/lost only) */}
                  {outcomeLine && (
                    <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 2, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 11.5, fontWeight: 700, fontFamily: "monospace", color: "var(--text-primary)" }}>{outcomeLine.phone}</span>
                      <span style={{ fontSize: 11, color: outcomeLine.detailColor ?? "var(--text-muted)" }}>{outcomeLine.detail}</span>
                    </div>
                  )}
                </div>

                {/* ── Actions row — always visible ── */}
                <div style={{ display: "flex", gap: 6, padding: "10px 16px", borderTop: "1px solid var(--border-hairline)", flexWrap: "wrap" }}>
                  {isSpecial && (
                    <button onClick={() => router.push(`/admin/pills/${pack.id}/bank`)}
                      style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", backgroundColor: "rgba(232,163,61,0.08)", border: "1px solid rgba(232,163,61,0.2)", color: "var(--accent-amber)" }}>
                      <BookOpen size={11} /> Manage Bank
                    </button>
                  )}
                  {isSpecial && (
                    <button onClick={() => router.push(`/admin/pills/${pack.id}/stats`)}
                      style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", backgroundColor: "rgba(76,111,255,0.08)", border: "1px solid rgba(76,111,255,0.2)", color: "var(--accent-indigo)" }}>
                      <BarChart2 size={11} /> Stats
                    </button>
                  )}
                  {!(pack.status !== "active" && (pack.available_count ?? 0) === 0 && !isSpecial) && (
                    <button onClick={() => handleToggleStatus(pack)} disabled={toggling === pack.id}
                      style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", opacity: toggling === pack.id ? 0.5 : 1,
                        ...(pack.status === "active"
                          ? { backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }
                          : { backgroundColor: "rgba(76,111,255,0.08)", border: "1px solid rgba(76,111,255,0.2)", color: "var(--accent-indigo)" }) }}>
                      {toggling === pack.id ? <Loader2 size={11} style={{ animation: "spin .7s linear infinite" }} /> : pack.status === "active" ? <EyeOff size={11} /> : <Eye size={11} />}
                      {pack.status === "active" ? "Deactivate" : "Activate"}
                    </button>
                  )}
                  {canSafeDelete ? (
                    <button onClick={() => handleDelete(pack)} disabled={deleting === pack.id}
                      style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", opacity: deleting === pack.id ? 0.5 : 1, backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
                      {deleting === pack.id ? <Loader2 size={11} style={{ animation: "spin .7s linear infinite" }} /> : <Trash2 size={11} />} Delete
                    </button>
                  ) : (
                    <button onClick={() => setForceDeleteTarget(pack)}
                      style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", backgroundColor: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)", color: "rgba(248,113,113,0.6)" }}>
                      <Trash2 size={11} /> Delete
                    </button>
                  )}
                </div>
              </motion.div>
            );
          });
          })()}
        </div>
      )}

      {/* Force-delete dialog */}
      <AnimatePresence>
        {forceDeleteTarget && (
          <ForceDeleteDialog pack={forceDeleteTarget} onConfirm={handleForceDelete}
            onCancel={() => setForceDeleteTarget(null)} deleting={deleting === forceDeleteTarget.id} />
        )}
      </AnimatePresence>
    </div>
  );
}
