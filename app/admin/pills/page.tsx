"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { adminApi, ApiError } from "@/lib/api";
import { Loader2, Plus, Package, Eye, EyeOff, Trash2, ClipboardCheck, Star, BookOpen, BarChart2, TrendingUp, Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ── Inline live stats strip — mounts when a pack row is expanded ─────────────
function PackStatsMini({ packId }: { packId: string }) {
  const [stats, setStats] = useState<{
    in_progress: number; won: number; lost: number;
    total_attempts: number; win_rate: number;
  } | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetch = async () => {
    try {
      const res = await adminApi.getPackLiveStats(packId);
      setStats(res);
    } catch { /* silent */ }
  };

  useEffect(() => {
    fetch();
    timerRef.current = setInterval(fetch, 12000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [packId]);

  if (!stats) return null;

  const hasData = stats.total_attempts >= 5;
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
          <span style={{ fontSize: 11, fontWeight: 700, color: "#60a5fa" }}>{stats.in_progress}</span>
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
  pills: { id: string; color: string; status: string }[];
  available_count?: number;
  played_count?: number;
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
  const [featuring, setFeaturing] = useState<string | null>(null);
  const [forceDeleteTarget, setForceDeleteTarget] = useState<PillPack | null>(null);
  const [expandedActions, setExpandedActions] = useState<string | null>(null);

  useEffect(() => { fetchPacks(); }, []);

  const fetchPacks = async () => {
    try {
      const res = await adminApi.getPillPacks();
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

  const handleFeature = async (pack: PillPack) => {
    setFeaturing(pack.id);
    try {
      const newFeatured = !pack.is_featured;
      await adminApi.featurePillPack(pack.id, newFeatured);
      setPacks((prev) => prev.map((p) => ({
        ...p,
        is_featured: p.id === pack.id ? newFeatured : (newFeatured ? false : p.is_featured),
      })));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update featured status");
    } finally {
      setFeaturing(null);
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
          {packs.map((pack, i) => {
            const available = pack.available_count ?? pack.pills.filter((p) => p.status === "available").length;
            const played = pack.played_count ?? pack.pills.filter((p) => p.status === "played").length;
            const total = pack.pills.length;
            const isSpecial = !!pack.is_vip;
            const canSafeDelete = pack.status !== "active" && available === 0;
            const isExpanded = expandedActions === pack.id;

            return (
              <motion.div key={pack.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="border rounded-xl overflow-hidden"
                style={{ borderColor: isSpecial ? "rgba(232,163,61,0.25)" : "var(--border-hairline)", backgroundColor: "var(--bg-card)" }}>

                {/* Main row */}
                <div className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                  onClick={() => setExpandedActions(isExpanded ? null : pack.id)}>
                  {/* Category + name + badges */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 flex-shrink-0">{pack.category}</span>
                      {isSpecial && (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded flex items-center gap-0.5 flex-shrink-0"
                          style={{ backgroundColor: "rgba(232,163,61,0.15)", color: "var(--accent-amber)", border: "1px solid rgba(232,163,61,0.3)" }}>
                          <ClipboardCheck size={8} /> SPECIAL
                        </span>
                      )}
                      {pack.is_featured && !isSpecial && (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded flex items-center gap-0.5 flex-shrink-0"
                          style={{ backgroundColor: "rgba(76,111,255,0.12)", color: "var(--accent-indigo)", border: "1px solid rgba(76,111,255,0.25)" }}>
                          <Star size={8} fill="currentColor" /> FEATURED
                        </span>
                      )}
                      {available === 0 && !isSpecial && (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded flex-shrink-0"
                          style={{ backgroundColor: "rgba(255,255,255,0.05)", color: "var(--text-muted)", border: "1px solid var(--border-hairline)" }}>
                          SOLD OUT
                        </span>
                      )}
                    </div>
                    {/* Name on its own line — wraps freely, no truncate */}
                    <p className="text-sm font-semibold text-white leading-snug">{pack.name}</p>
                  </div>

                  {/* Inline stats — readable labels */}
                  <div className="flex items-center gap-3 flex-shrink-0 text-[11px]">
                    <span className="text-gray-600">{total} pills</span>
                    <span style={{ color: "var(--accent-indigo)" }}>{available} left</span>
                    <span className="text-gray-500">{played} played</span>
                  </div>

                  {/* Status badge */}
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded flex-shrink-0 ${
                    pack.status === "active" ? "bg-[#4C6FFF]/15 text-[#4C6FFF] border border-[#4C6FFF]/30"
                    : pack.status === "inactive" ? "bg-gray-800 text-gray-500"
                    : "bg-yellow-900/20 text-yellow-500"
                  }`}>
                    {pack.status.toUpperCase()}
                  </span>

                  {/* Chevron indicator */}
                  <span className="text-gray-600 flex-shrink-0 text-xs">{isExpanded ? "▲" : "▼"}</span>
                </div>

                {/* Expanded actions */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="border-t overflow-hidden"
                      style={{ borderColor: "var(--border-hairline)" }}>
                      {/* Live stats strip — polls every 12s while row is expanded */}
                      <div className="pt-3 pb-1">
                        <PackStatsMini packId={pack.id} />
                      </div>
                      <div className="px-4 py-3 flex items-center gap-2 flex-wrap">

                        {/* Activate / Deactivate */}
                        <button onClick={() => handleToggleStatus(pack)} disabled={toggling === pack.id}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 ${
                            pack.status === "active"
                              ? "bg-red-900/20 border border-red-700/30 text-red-400"
                              : "bg-[#4C6FFF]/10 border border-[#4C6FFF]/20 text-[#4C6FFF]"
                          }`}>
                          {toggling === pack.id ? <Loader2 size={11} className="animate-spin" /> : pack.status === "active" ? <EyeOff size={11} /> : <Eye size={11} />}
                          {pack.status === "active" ? "Deactivate" : "Activate"}
                        </button>

                        {/* Feature — standard only, active only */}
                        {!isSpecial && pack.status === "active" && (
                          <button onClick={() => handleFeature(pack)} disabled={featuring === pack.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                            style={pack.is_featured
                              ? { backgroundColor: "rgba(76,111,255,0.2)", border: "1px solid rgba(76,111,255,0.4)", color: "var(--accent-indigo)" }
                              : { backgroundColor: "rgba(76,111,255,0.06)", border: "1px solid rgba(76,111,255,0.15)", color: "var(--text-muted)" }}>
                            {featuring === pack.id ? <Loader2 size={11} className="animate-spin" /> : <Star size={11} fill={pack.is_featured ? "currentColor" : "none"} />}
                            {pack.is_featured ? "Featured" : "Set Featured"}
                          </button>
                        )}

                        {/* Safe delete */}
                        {canSafeDelete && (
                          <button onClick={() => handleDelete(pack)} disabled={deleting === pack.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-red-700/30 bg-red-900/20 text-red-400 transition-colors disabled:opacity-50">
                            {deleting === pack.id ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
                            Delete
                          </button>
                        )}

                        {/* View stats — all packs */}
                        <button onClick={() => router.push(`/admin/pills/${pack.id}/stats`)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                          style={{ backgroundColor: "rgba(76,111,255,0.08)", border: "1px solid rgba(76,111,255,0.2)", color: "var(--accent-indigo)" }}>
                          <BarChart2 size={11} /> Stats
                        </button>

                        {/* View pills — Standard packs only */}
                        {!isSpecial && (
                          <button onClick={() => router.push(`/admin/pills/${pack.id}/pills`)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                            style={{ backgroundColor: "rgba(124,111,232,0.08)", border: "1px solid rgba(124,111,232,0.2)", color: "var(--accent-violet)" }}>
                            <Eye size={11} /> View Pills
                          </button>
                        )}

                        {/* Force delete — always */}
                        <button onClick={() => { setForceDeleteTarget(pack); setExpandedActions(null); }}
                          className="ml-auto text-[11px] font-semibold text-gray-600 hover:text-red-400 transition-colors flex items-center gap-1">
                          <Trash2 size={10} /> Force delete
                        </button>

                        {/* Manage bank — Specials only (have a question bank) */}
                        {isSpecial && (
                          <button onClick={() => router.push(`/admin/pills/${pack.id}/bank`)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                            style={{ backgroundColor: "rgba(232,163,61,0.08)", border: "1px solid rgba(232,163,61,0.2)", color: "var(--accent-amber)" }}>
                            <BookOpen size={11} /> Manage Bank
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
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
