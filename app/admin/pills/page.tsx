"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { adminApi, ApiError } from "@/lib/api";
import { Loader2, Plus, Package, Eye, EyeOff, Trash2 } from "lucide-react";
import { motion } from "framer-motion";

interface PillPack {
  id: string;
  name: string;
  category: string;
  status: "active" | "inactive" | "draft";
  pills: { id: string; color: string; status: string }[];
  available_count?: number;
  played_count?: number;
  expired_count?: number;
}

const statusBadge = (s: string) => {
  switch (s) {
    case "active":   return "bg-neon/15 text-neon border border-neon/30";
    case "inactive": return "bg-gray-800 text-gray-500";
    case "draft":    return "bg-yellow-900/20 text-yellow-500 border border-yellow-700/30";
    default:         return "bg-gray-800 text-gray-500";
  }
};

export default function AdminPillsPage() {
  const router = useRouter();
  const [packs, setPacks] = useState<PillPack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toggling, setToggling] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

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

  const handleDelete = async (pack: PillPack) => {
    const availableCount = pack.available_count ?? pack.pills.filter((p) => p.status === "available").length;
    if (availableCount > 0) {
      setError(`Cannot delete "${pack.name}" — it still has ${availableCount} unplayed pill(s) available to players.`);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Pill Packs</h1>
          <p className="text-gray-500 text-sm mt-0.5">Manage all pill pack games</p>
        </div>
        <button
          onClick={() => router.push("/admin/pills/create")}
          className="flex items-center gap-2 px-4 py-2.5 font-bold rounded-xl hover:opacity-90 text-sm transition-opacity"
          style={{ backgroundColor: "var(--accent-indigo)", color: "white" }}
        >
          <Plus size={15} /> Create New Pack
        </button>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-800/40 rounded-xl p-3 text-red-400 text-sm">{error}</div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={28} className="text-neon animate-spin" />
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
          {packs.map((pack, i) => (
            <motion.div
              key={pack.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card border border-[#2A2A2A] rounded-2xl p-5 space-y-4"
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">{pack.category}</p>
                  <h3 className="text-white font-black text-lg">{pack.name}</h3>
                </div>
                <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg ${statusBadge(pack.status)}`}>
                  {pack.status.toUpperCase()}
                </span>
              </div>

              {/* Pills preview */}
              <div className="flex items-center gap-2 flex-wrap">
                {pack.pills.map((pill) => (
                  <div
                    key={pill.id}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-base"
                    style={{
                      background: pill.color,
                      opacity: pill.status === "played" ? 0.3 : 1,
                      boxShadow: pill.status !== "played" ? `0 0 10px ${pill.color}60` : "none",
                    }}
                  >
                    💊
                  </div>
                ))}
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
                  <p className="text-neon font-bold text-sm">
                    {pack.available_count ?? pack.pills.filter((p) => p.status === "available").length}
                  </p>
                </div>
                <div className="bg-[#111] rounded-xl p-2.5">
                  <p className="text-[10px] text-gray-600 mb-0.5">Played</p>
                  <p className="text-gray-400 font-bold text-sm">
                    {pack.played_count ?? pack.pills.filter((p) => p.status === "played").length}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1 border-t border-[#1E1E1E]">
                <button
                  onClick={() => handleToggleStatus(pack)}
                  disabled={toggling === pack.id}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 ${
                    pack.status === "active"
                      ? "bg-red-900/20 border border-red-700/30 text-red-400 hover:bg-red-900/30"
                      : "bg-neon/10 border border-neon/20 text-neon hover:bg-neon/20"
                  }`}
                >
                  {toggling === pack.id
                    ? <Loader2 size={13} className="animate-spin" />
                    : pack.status === "active" ? <EyeOff size={13} /> : <Eye size={13} />
                  }
                  {pack.status === "active" ? "Deactivate" : "Activate"}
                </button>
                {/* Delete — only show for inactive packs with no available pills */}
                {pack.status !== "active" && (pack.available_count ?? pack.pills.filter(p => p.status === "available").length) === 0 && (
                  <button
                    onClick={() => handleDelete(pack)}
                    disabled={deleting === pack.id}
                    className="px-3 py-2.5 rounded-xl text-xs font-bold border border-red-700/30 bg-red-900/20 text-red-400 hover:bg-red-900/30 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {deleting === pack.id
                      ? <Loader2 size={13} className="animate-spin" />
                      : <Trash2 size={13} />
                    }
                    Delete
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
