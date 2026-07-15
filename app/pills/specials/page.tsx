"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { pillsApi, type PillPack, ApiError } from "@/lib/api";
import { ChevronLeft, ClipboardCheck, ArrowRight, Clock, AlertCircle } from "lucide-react";

// Category colour map
const CAT_COLOR: Record<string, string> = {
  Football: "#4C6FFF", Basketball: "#7C6FE8", Cricket: "#E8A33D",
  Crypto: "#8B5CF6", Politics: "#EC4899", Entertainment: "#FFD700",
  Technology: "#00CFFF", Science: "#00FF66", Food: "#FF6B9D",
  Lifestyle: "#FF8800", "General Knowledge": "#8B5CF6", Sports: "#4C6FFF",
  General: "#4C6FFF",
};
const catColor = (cat: string) => CAT_COLOR[cat] ?? "#4C6FFF";

// ── Hero special card ─────────────────────────────────────────────────────
function HeroSpecial({ pack, onClick }: { pack: PillPack; onClick: () => void }) {
  const price = pack.pills[0]?.price ?? 0;
  const prize = pack.pills[0]?.prize ?? 0;
  const total = pack.pills.length;

  return (
    <motion.button initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} whileTap={{ scale: 0.98 }}
      onClick={onClick}
      style={{
        width: "100%", boxSizing: "border-box", borderRadius: 16, padding: 0,
        textAlign: "left", cursor: "pointer", overflow: "hidden", position: "relative",
        background: "linear-gradient(135deg, #1a1200 0%, #2c1e00 45%, #1a1200 100%)",
        border: "1.5px solid rgba(232,163,61,0.6)",
        boxShadow: "0 0 0 1px rgba(232,163,61,0.12), 0 6px 32px rgba(232,163,61,0.28)",
      }}>
      {/* Shimmer */}
      <motion.div animate={{ x: ["-100%", "200%"] }} transition={{ duration: 3.5, repeat: Infinity, repeatDelay: 2.5 }}
        style={{ position: "absolute", inset: 0, width: "40%", background: "linear-gradient(90deg,transparent,rgba(232,163,61,0.06),transparent)", pointerEvents: "none" }} />
      {/* Top accent */}
      <div style={{ height: 2, background: "linear-gradient(90deg,transparent,rgba(232,163,61,0.8),rgba(255,200,80,1),rgba(232,163,61,0.8),transparent)" }} />

      <div style={{ padding: "18px 18px 14px", position: "relative" }}>
        {/* Tag */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: 9, fontWeight: 900, padding: "2px 8px", borderRadius: 4, background: "linear-gradient(135deg,#E8A33D,#FFD060)", color: "#000", letterSpacing: "0.06em" }}>
            BIGGEST PRIZE
          </span>
          <span style={{ fontSize: 10, color: "rgba(232,163,61,0.55)" }}>{pack.category}</span>
        </div>
        {/* Pack name */}
        <p style={{ fontSize: 20, fontWeight: 800, color: "#FFE082", margin: "0 0 6px", lineHeight: 1.25 }}>{pack.name}</p>
        {/* Spec line */}
        <p style={{ fontSize: 11, color: "rgba(232,163,61,0.6)", margin: "0 0 16px" }}>
          {total}-question exam · answer to pass · one attempt
        </p>
        {/* Entry + Prize */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 14 }}>
          <div>
            <p style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", margin: "0 0 3px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Entry</p>
            <p style={{ fontSize: 15, fontFamily: "monospace", fontWeight: 700, color: "rgba(232,163,61,0.85)", margin: 0 }}>₦{price.toLocaleString()}</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", margin: "0 0 3px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Top prize</p>
            <p style={{ fontSize: 22, fontFamily: "monospace", fontWeight: 900, color: "#FFD060", margin: 0 }}>₦{prize.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* CTA strip */}
      <div style={{ padding: "10px 18px", background: "rgba(232,163,61,0.12)", borderTop: "1px solid rgba(232,163,61,0.2)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <ClipboardCheck size={14} style={{ color: "var(--accent-amber)" }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--accent-amber)" }}>Enter Special →</span>
      </div>
    </motion.button>
  );
}

// ── Compact special row ───────────────────────────────────────────────────
function SpecialRow({ pack, onClick }: { pack: PillPack; onClick: () => void }) {
  const price = pack.pills[0]?.price ?? 0;
  const prize = pack.pills[0]?.prize ?? 0;
  const color = catColor(pack.category);
  return (
    <motion.button initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} whileTap={{ scale: 0.98 }}
      onClick={onClick}
      style={{
        width: "100%", boxSizing: "border-box", borderRadius: 12, padding: "12px 14px",
        textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
        background: "linear-gradient(135deg, #1a1200, #2a1e00, #1a1200)",
        border: "1px solid rgba(232,163,61,0.35)",
      }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
          <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color, padding: "1px 5px", borderRadius: 3, backgroundColor: `${color}20` }}>{pack.category}</span>
        </div>
        <p style={{ fontSize: 13, fontWeight: 700, color: "#FFE082", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pack.name}</p>
        <p style={{ fontSize: 10, color: "rgba(232,163,61,0.55)", margin: "2px 0 0" }}>₦{price.toLocaleString()} entry</p>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <p style={{ fontSize: 14, fontFamily: "monospace", fontWeight: 900, color: "#FFD060", margin: 0 }}>₦{prize.toLocaleString()}</p>
        <ArrowRight size={12} style={{ color: "rgba(232,163,61,0.6)", marginTop: 4 }} />
      </div>
    </motion.button>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function SpecialsPage() {
  const router = useRouter();
  const { state } = useApp();
  const [packs, setPacks] = useState<PillPack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!state.isAuthenticated) { router.push("/auth"); return; }

    const isSpecial = (p: PillPack) => p.is_vip === true || (p as any).pack_type === "special";

    Promise.allSettled([pillsApi.getPacks(), pillsApi.getSpecials()])
      .then(([packsR, specialsR]) => {
        const fromPacks = packsR.status === "fulfilled"
          ? (packsR.value.packs ?? []).filter((p) => p.status === "active" && isSpecial(p))
          : [];
        const fromSpecials = specialsR.status === "fulfilled"
          ? (specialsR.value.packs ?? []).filter((p) => p.status === "active")
          : [];
        // Merge, deduplicate by id
        const seen = new Set<string>();
        const all = [...fromPacks, ...fromSpecials].filter((p) => seen.has(p.id) ? false : (seen.add(p.id), true));
        // Sort by prize descending so biggest is always hero
        all.sort((a, b) => (b.pills[0]?.prize ?? 0) - (a.pills[0]?.prize ?? 0));
        setPacks(all);
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load specials"))
      .finally(() => setLoading(false));
  }, [state.isAuthenticated, router]);

  if (!state.isAuthenticated) return null;

  const heroPack = packs[0] ?? null;
  const morePacks = packs.slice(1);

  return (
    <div style={{ width: "100%", maxWidth: "100vw", overflowX: "hidden", boxSizing: "border-box", padding: "0 16px 100px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "20px 0 18px", borderBottom: "1px solid var(--border-hairline)", marginBottom: 20 }}>
        <button onClick={() => router.back()} style={{ padding: 6, borderRadius: 8, border: "none", background: "none", cursor: "pointer", display: "flex", alignItems: "center" }}>
          <ChevronLeft size={20} style={{ color: "var(--text-secondary)" }} />
        </button>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>Specials</h1>
          <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "2px 0 0" }}>One shot, real stakes</p>
        </div>
      </div>

      {error && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 8, marginBottom: 16, border: "1px solid var(--border-subtle)", backgroundColor: "rgba(239,68,68,0.05)", color: "#f87171", fontSize: 13 }}>
          <AlertCircle size={15} style={{ flexShrink: 0 }} /> {error}
        </div>
      )}

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="skeleton" style={{ height: 180, borderRadius: 16 }} />
          {[1,2,3].map((i) => <div key={i} className="skeleton" style={{ height: 72, borderRadius: 12 }} />)}
        </div>
      ) : packs.length === 0 ? (
        <div style={{ borderRadius: 12, padding: "48px 24px", textAlign: "center", border: "1px solid rgba(232,163,61,0.2)", backgroundColor: "rgba(232,163,61,0.04)" }}>
          <Clock size={28} style={{ color: "rgba(232,163,61,0.4)", margin: "0 auto 12px", display: "block" }} />
          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", margin: "0 0 4px" }}>No Specials live right now</p>
          <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>Check back soon</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Hero — biggest prize Special */}
          {heroPack && (
            <HeroSpecial pack={heroPack} onClick={() => router.push(`/pills/vip/${heroPack.id}/play`)} />
          )}

          {/* More specials */}
          {morePacks.length > 0 && (
            <section>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-muted)", marginBottom: 10 }}>
                More specials
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {morePacks.map((pack) => (
                  <SpecialRow key={pack.id} pack={pack} onClick={() => router.push(`/pills/vip/${pack.id}/play`)} />
                ))}
              </div>
            </section>
          )}

        </div>
      )}
    </div>
  );
}
