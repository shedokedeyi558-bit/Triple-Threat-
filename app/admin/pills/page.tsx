"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { adminApi, ApiError } from "@/lib/api";
import { Loader2, Plus, Package, Eye, EyeOff, Trash2, ClipboardCheck, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

const statusBadge = (s: string) => {
  switch (s) {
    case "active":   return "bg-[#4C6FFF]/15 text-[#4C6FFF] border border-[#4C6FFF]/30";
    case "inactive": return "bg-gray-800 text-gray-500";
    case "draft":    return "bg-yellow-900/20 text-yellow-500 border border-yellow-700/30";
    default:         return "bg-gray-800 text-gray-500";
  }
};

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
            This permanently deletes <span className="font-semibold text-white">{pack.name}</span> and all its pills, regardless of status. This cannot be undone.
          </p>
        </div>
        <div>
          <label className="text-[11px] uppercase tracking-widest font-bold text-gray-500 block mb-1.5">
            Type the pack name to confirm
          </label>
          <input
            type="text" placeholder={pack.name} value={typed}
            onChange={(e) => setTyped(e.target.value)}
            className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
            style={{ backgroundColor: "var(--bg-base)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)" }}
          />
        </div>
        <div className="flex gap-2 pt-1">
          <button onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold border text-gray-400"
            style={{ border: "1px solid var(--border-subtle)" }}>
            Cancel
          </button>
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
        // Only one pack can be featured — clear others when featuring a new one
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
      setError(`Cannot delete "${pack.name}" — it still has ${availableCount} unplayed pill(s). Deactivate it first, or use Force Delete.`);
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Pill Packs</h1>
          <p className="text-gray-500 text-sm mt-0.5">Manage all pill pack games</p>
        </div>
        <button onClick={() => router.push("/admin/pills/create")}
          className="flex items-center gap-2 px-4 py-2.5 font-bold rounded-xl hover:opacity-90 text-sm transition-opacity"
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
        <div className="flex justify-center py-20">
          <Loader2 size={28} className="text-[#4C6FFF] animate-spin" />
        </div>
      ) : packs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Package size={40} className="text-gray-700 mb-4" />
          <p className="text-gray-500 font-semibold">No pill packs yet</p>
          <p className="text-gray-700 text-sm mt-1">Create your first pack to get started</p>
          <button onClick={() => router.push("/admin/pills/create")}
            className="mt-4 text-sm font-bold hover:underline" style={{ color: "var(--accent-indigo)" }}>
            Create First Pack →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {packs.map((pack, i) => {
            const availableCount = pack.available_count ?? pack.pills.filter((p) => p.status === "available").length;
            const playedCount = pack.played_count ?? pack.pills.filter((p) => p.status === "played").length;
            const isSpecial = !!pack.is_vip;
            const canSafeDelete = pack.status !== "active" && availableCount === 0;

            return (
              <motion.div key={pack.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-card border border-[#2A2A2A] rounded-2xl p-5 space-y-4"
                style={isSpecial ? { borderColor: "rgba(232,163,61,0.3)", boxShadow: "0 0 16px rgba(232,163,61,0.08)" } : {}}>

                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">{pack.category}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-white font-black text-lg leading-tight">{pack.name}</h3>
                      {/* Featured badge — standard packs only */}
                      {pack.is_featured && !isSpecial && (
                        <span className="text-[9px] font-black px-2 py-0.5 rounded flex items-center gap-1 flex-shrink-0"
                          style={{ backgroundColor: "rgba(76,111,255,0.15)", color: "var(--accent-indigo)", border: "1px solid rgba(76,111,255,0.3)" }}>
                          <Star size={9} /> FEATURED
                        </span>
                      )}
                      {/* Special badge */}
                      {isSpecial && (
                        <span className="text-[9px] font-black px-2 py-0.5 rounded flex items-center gap-1 flex-shrink-0"
                          style={{ backgroundColor: "rgba(232,163,61,0.15)", color: "var(--accent-amber)", border: "1px solid rgba(232,163,61,0.3)", boxShadow: "0 0 8px rgba(232,163,61,0.2)" }}>
                          <ClipboardCheck size={9} /> SPECIAL
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg flex-shrink-0 ${statusBadge(pack.status)}`}>
                    {pack.status.toUpperCase()}
                  </span>
                </div>

                {/* Pills preview */}
                <div className="flex items-center gap-2 flex-wrap">
                  {pack.pills.slice(0, 8).map((pill) => (
                    <div key={pill.id} className="w-7 h-7 rounded-full"
                      style={{ background: pill.color, opacity: pill.status === "played" ? 0.25 : 1, boxShadow: pill.status !== "played" ? `0 0 8px ${pill.color}50` : "none" }} />
                  ))}
                  {pack.pills.length > 8 && <span className="text-gray-600 text-xs">+{pack.pills.length - 8} more</span>}
                  <span className="text-gray-500 text-xs ml-1">{pack.pills.length} pill{pack.pills.length !== 1 ? "s" : ""}</span>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-[#111] rounded-xl p-2.5">
                    <p className="text-[10px] text-gray-600 mb-0.5">Total</p>
                    <p className="text-white font-bold text-sm">{pack.pills.length}</p>
                  </div>
                  <div className="bg-[#111] rounded-xl p-2.5">
                    <p className="text-[10px] text-gray-600 mb-0.5">Available</p>
                    <p className="font-bold text-sm" style={{ color: "var(--accent-indigo)" }}>{availableCount}</p>
                  </div>
                  <div className="bg-[#111] rounded-xl p-2.5">
                    <p className="text-[10px] text-gray-600 mb-0.5">Played</p>
                    <p className="text-gray-400 font-bold text-sm">{playedCount}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2 pt-1 border-t border-[#1E1E1E]">
                  <div className="flex gap-2">
                    {/* Activate / Deactivate */}
                    <button onClick={() => handleToggleStatus(pack)} disabled={toggling === pack.id}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 ${
                        pack.status === "active"
                          ? "bg-red-900/20 border border-red-700/30 text-red-400 hover:bg-red-900/30"
                          : "bg-[#4C6FFF]/10 border border-[#4C6FFF]/20 text-[#4C6FFF] hover:bg-[#4C6FFF]/20"
                      }`}>
                      {toggling === pack.id ? <Loader2 size={13} className="animate-spin" /> : pack.status === "active" ? <EyeOff size={13} /> : <Eye size={13} />}
                      {pack.status === "active" ? "Deactivate" : "Activate"}
                    </button>

                    {/* Feature toggle — standard packs only, active only */}
                    {!isSpecial && pack.status === "active" && (
                      <button onClick={() => handleFeature(pack)} disabled={featuring === pack.id}
                        className="px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                        style={pack.is_featured
                          ? { backgroundColor: "rgba(76,111,255,0.2)", border: "1px solid rgba(76,111,255,0.4)", color: "var(--accent-indigo)" }
                          : { backgroundColor: "rgba(76,111,255,0.06)", border: "1px solid rgba(76,111,255,0.15)", color: "var(--text-muted)" }
                        }>
                        {featuring === pack.id
                          ? <Loader2 size={13} className="animate-spin" />
                          : <Star size={13} fill={pack.is_featured ? "currentColor" : "none"} />
                        }
                        {pack.is_featured ? "Featured" : "Feature"}
                      </button>
                    )}

                    {/* Safe delete */}
                    {canSafeDelete && (
                      <button onClick={() => handleDelete(pack)} disabled={deleting === pack.id}
                        className="px-3 py-2.5 rounded-xl text-xs font-bold border border-red-700/30 bg-red-900/20 text-red-400 hover:bg-red-900/30 transition-colors disabled:opacity-50 flex items-center gap-1.5">
                        {deleting === pack.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                        Delete
                      </button>
                    )}
                  </div>

                  {/* Force delete — always available, secondary/muted styling */}
                  <button onClick={() => setForceDeleteTarget(pack)}
                    className="w-full py-1.5 rounded-lg text-[11px] font-semibold text-gray-600 hover:text-red-400 transition-colors flex items-center justify-center gap-1.5">
                    <Trash2 size={11} />
                    Force delete (test packs)
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Force-delete dialog */}
      <AnimatePresence>
        {forceDeleteTarget && (
          <ForceDeleteDialog
            pack={forceDeleteTarget}
            onConfirm={handleForceDelete}
            onCancel={() => setForceDeleteTarget(null)}
            deleting={deleting === forceDeleteTarget.id}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
