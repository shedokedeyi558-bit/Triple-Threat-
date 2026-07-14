"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { pillsApi, type PillPack, type PillPackPill, ApiError } from "@/lib/api";
import Link from "next/link";
import { AlertCircle, Package, ArrowRight, Zap, Clock, Crown } from "lucide-react";

// Category colour map
const CAT_COLOR: Record<string, string> = {
  Football: "#4C6FFF", Basketball: "#7C6FE8", Cricket: "#E8A33D",
  Crypto: "#8B5CF6", Politics: "#EC4899", Entertainment: "#FFD700",
  Technology: "#00CFFF", Science: "#00FF66", Food: "#FF6B9D",
  Lifestyle: "#FF8800", "General Knowledge": "#8B5CF6", Sports: "#4C6FFF",
  General: "#4C6FFF",
};
const catColor = (cat: string) => CAT_COLOR[cat] ?? "#4C6FFF";

// Format timer for display
function formatTimer(sec?: number) {
  if (!sec) return null;
  return sec >= 60 ? `${Math.floor(sec / 60)}m` : `${sec}s`;
}

// ── Category chip filter ──────────────────────────────────────────────────
function CategoryChips({ categories, active, onChange }: {
  categories: string[]; active: string; onChange: (c: string) => void;
}) {
  return (
    <div style={{ display: "flex", gap: 8, overflowX: "auto", overflowY: "hidden", WebkitOverflowScrolling: "touch", paddingBottom: 2 }}>
      {["All", ...categories].map((cat) => (
        <button key={cat} onClick={() => onChange(cat)}
          style={{
            flexShrink: 0, padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600,
            cursor: "pointer", transition: "all .15s", whiteSpace: "nowrap",
            backgroundColor: active === cat ? "var(--accent-indigo)" : "transparent",
            color: active === cat ? "#fff" : "var(--text-secondary)",
            border: active === cat ? "none" : "1px solid var(--border-subtle)",
          }}>
          {cat}
        </button>
      ))}
    </div>
  );
}

// ── Hero pack card (featured / most recent) ───────────────────────────────
function HeroPack({ pack, onClick }: { pack: PillPack; onClick: () => void }) {
  const color = catColor(pack.category);
  const price = pack.pills[0]?.price ?? 0;
  const prize = pack.pills[0]?.prize ?? 0;
  const timer = (pack.pills[0] as any)?.timer as number | undefined;
  const timerLabel = formatTimer(timer);
  const available = pack.pills.filter((p) => p.status === "available").length;

  return (
    <motion.button initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} whileTap={{ scale: 0.98 }}
      onClick={onClick}
      style={{
        width: "100%", boxSizing: "border-box", borderRadius: 16, padding: 0, textAlign: "left",
        cursor: "pointer", overflow: "hidden", border: `1.5px solid ${color}50`,
        backgroundColor: "var(--bg-card)", position: "relative",
        boxShadow: `0 4px 32px ${color}20`,
      }}>
      {/* Radial glow */}
      <div style={{ position: "absolute", top: -40, right: -40, width: 180, height: 180, borderRadius: "50%", backgroundColor: color, opacity: 0.07, pointerEvents: "none" }} />
      <div style={{ height: 3, background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
      <div style={{ padding: "18px 20px", position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", padding: "2px 8px", borderRadius: 20, backgroundColor: `${color}20`, color }}>
            {pack.category}
          </span>
          <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{available}/{pack.pills.length} available</span>
        </div>
        <p style={{ fontSize: 19, fontWeight: 800, color: "var(--text-primary)", margin: "0 0 6px", lineHeight: 1.3 }}>{pack.name}</p>
        <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "0 0 16px" }}>
          Answer fast{timerLabel ? ` in ${timerLabel}` : ""}, win instantly
        </p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ display: "flex", gap: 16 }}>
            <div>
              <p style={{ fontSize: 9, color: "var(--text-muted)", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Entry</p>
              <p style={{ fontSize: 16, fontFamily: "monospace", fontWeight: 700, color: "var(--accent-amber)", margin: 0 }}>₦{price.toLocaleString()}</p>
            </div>
            <div>
              <p style={{ fontSize: 9, color: "var(--text-muted)", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Win up to</p>
              <p style={{ fontSize: 16, fontFamily: "monospace", fontWeight: 700, color, margin: 0 }}>₦{prize.toLocaleString()}</p>
            </div>
          </div>
          <div style={{ padding: "8px 16px", borderRadius: 10, backgroundColor: color, color: "#000", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
            Play <ArrowRight size={13} />
          </div>
        </div>
      </div>
    </motion.button>
  );
}

// ── Grid pack card (2-col) ────────────────────────────────────────────────
function GridPackCard({ pack, onClick }: { pack: PillPack; onClick: () => void }) {
  const color = catColor(pack.category);
  const price = pack.pills[0]?.price ?? 0;
  const available = pack.pills.filter((p) => p.status === "available").length;

  return (
    <motion.button initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} whileTap={{ scale: 0.97 }}
      onClick={onClick}
      style={{
        width: "100%", boxSizing: "border-box", borderRadius: 12, padding: 0,
        textAlign: "left", cursor: "pointer", overflow: "hidden",
        border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-card)", display: "flex", flexDirection: "column",
      }}>
      <div style={{ height: 3, backgroundColor: color, width: "100%" }} />
      <div style={{ padding: "12px 13px 14px", flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
        {/* Icon + category */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", backgroundColor: `${color}20`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Package size={15} style={{ color }} />
          </div>
          <span style={{ fontSize: 9, fontWeight: 700, color: "var(--text-muted)" }}>{available}p left</span>
        </div>
        {/* Name — allow 2-line wrap */}
        <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", margin: 0, lineHeight: 1.35, wordBreak: "break-word" }}>
          {pack.name}
        </p>
        <p style={{ fontSize: 10, color: "var(--text-muted)", margin: 0 }}>{pack.pills.length} pills inside</p>
        <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ fontSize: 12, fontFamily: "monospace", fontWeight: 700, color: "var(--accent-amber)", margin: 0 }}>₦{price.toLocaleString()}</p>
          <ArrowRight size={12} style={{ color }} />
        </div>
      </div>
    </motion.button>
  );
}

// ── VIP banner ────────────────────────────────────────────────────────────
function VipBanner({ packs, onTap }: { packs: PillPack[]; onTap: (pack: PillPack) => void }) {
  if (packs.length === 0) return null;
  return (
    <section>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <Crown size={15} style={{ color: "var(--accent-amber)" }} />
        <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>VIP Challenges</h2>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {packs.map((pack) => {
          const price = pack.pills[0]?.price ?? 0;
          const prize = pack.pills[0]?.prize ?? 0;
          return (
            <motion.button key={pack.id} whileTap={{ scale: 0.97 }} onClick={() => onTap(pack)}
              style={{
                width: "100%", boxSizing: "border-box", borderRadius: 14, padding: "14px 16px",
                textAlign: "left", cursor: "pointer", overflow: "hidden", position: "relative",
                background: "linear-gradient(135deg, #1a1200, #2a1e00, #1a1200)",
                border: "1px solid rgba(232,163,61,0.55)",
                boxShadow: "0 4px 20px rgba(232,163,61,0.2)",
              }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 9, fontWeight: 900, padding: "2px 7px", borderRadius: 4, background: "linear-gradient(135deg,#E8A33D,#FFD060)", color: "#000" }}>VIP</span>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#FFE082", margin: 0 }}>{pack.name}</p>
                </div>
                <Zap size={14} style={{ color: "var(--accent-amber)", opacity: 0.8 }} />
              </div>
              <p style={{ fontSize: 10, color: "rgba(232,163,61,0.6)", margin: "0 0 10px" }}>10 questions · answer all to win</p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <p style={{ fontSize: 12, fontFamily: "monospace", fontWeight: 700, color: "rgba(232,163,61,0.85)", margin: 0 }}>₦{price.toLocaleString()} entry</p>
                <p style={{ fontSize: 16, fontFamily: "monospace", fontWeight: 900, color: "#FFD060", margin: 0 }}>₦{prize.toLocaleString()}</p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}

// ── Pill confirm sheet (2-phase: preview → confirm) ───────────────────────
function PillSheet({ pack, pill, onConfirm, onClose, balance, bonusBalance }: {
  pack: PillPack; pill: PillPackPill; onConfirm: () => void; onClose: () => void;
  balance: number; bonusBalance: number;
}) {
  const [phase, setPhase] = useState<"preview" | "confirm">("preview");
  const color = catColor(pack.category);
  const canAfford = balance + bonusBalance >= pill.price;
  const bonusUsed = Math.min(bonusBalance, pill.price);
  const realUsed = pill.price - bonusUsed;
  const timerSec = (pill as any).timer as number | undefined;
  const timerLabel = formatTimer(timerSec);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
      onClick={onClose}>
      <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)" }} />
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 340, damping: 32 }}
        onClick={(e) => e.stopPropagation()}
        style={{ position: "relative", width: "100%", maxWidth: 420, borderRadius: "24px 24px 0 0", padding: "28px 24px 32px", backgroundColor: "var(--bg-card)" }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: "#333", margin: "0 auto 20px" }} />
        <AnimatePresence mode="wait">
          {phase === "preview" ? (
            <motion.div key="preview" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
              style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", backgroundColor: color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Package size={20} color="#fff" />
                </div>
                <div>
                  <p style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>{pack.name}</p>
                  <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: 0 }}>{pack.category}</p>
                </div>
              </div>
              <div style={{ borderRadius: 12, padding: "14px 16px", backgroundColor: `${color}12`, border: `1px solid ${color}30` }}>
                <p style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.5, color: "var(--text-primary)", margin: 0 }}>
                  {timerLabel ? `Think you can answer this in ${timerLabel}?` : "Think you can answer this correctly?"}
                </p>
                <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "4px 0 0" }}>
                  Get it right and win <span style={{ fontFamily: "monospace", fontWeight: 700, color }}>₦{pill.prize.toLocaleString()}</span>
                  {timerLabel && ` — you'll have ${timerLabel} on the clock`}.
                </p>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: timerLabel ? "1fr 1fr 1fr" : "1fr 1fr", gap: 8 }}>
                <div style={{ borderRadius: 10, padding: "10px 8px", textAlign: "center", border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-base)" }}>
                  <p style={{ fontSize: 9, color: "var(--text-muted)", margin: "0 0 3px", textTransform: "uppercase" }}>Entry</p>
                  <p style={{ fontSize: 14, fontFamily: "monospace", fontWeight: 700, color: "var(--accent-amber)", margin: 0 }}>₦{pill.price.toLocaleString()}</p>
                </div>
                <div style={{ borderRadius: 10, padding: "10px 8px", textAlign: "center", border: `1px solid ${color}40`, backgroundColor: `${color}08` }}>
                  <p style={{ fontSize: 9, color: "var(--text-muted)", margin: "0 0 3px", textTransform: "uppercase" }}>Prize</p>
                  <p style={{ fontSize: 14, fontFamily: "monospace", fontWeight: 700, color, margin: 0 }}>₦{pill.prize.toLocaleString()}</p>
                </div>
                {timerLabel && (
                  <div style={{ borderRadius: 10, padding: "10px 8px", textAlign: "center", border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-base)" }}>
                    <p style={{ fontSize: 9, color: "var(--text-muted)", margin: "0 0 3px", textTransform: "uppercase" }}>Time</p>
                    <p style={{ fontSize: 13, fontFamily: "monospace", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>{timerLabel}</p>
                  </div>
                )}
              </div>
              <button onClick={() => setPhase("confirm")}
                style={{ width: "100%", padding: "13px 0", borderRadius: 10, border: "none", backgroundColor: color, color: "#000", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                {"I'm In — Show Entry Fee"}
              </button>
              <button onClick={onClose} style={{ width: "100%", padding: "10px 0", border: "none", background: "none", fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", cursor: "pointer" }}>
                Not now
              </button>
            </motion.div>
          ) : (
            <motion.div key="confirm" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
              style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Confirm Entry</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div style={{ borderRadius: 10, padding: "10px 12px", textAlign: "center", border: "1px solid var(--accent-amber)", backgroundColor: "rgba(232,163,61,0.08)" }}>
                  <p style={{ fontSize: 11, color: "var(--text-secondary)", margin: "0 0 4px" }}>You Pay</p>
                  <p style={{ fontSize: 17, fontFamily: "monospace", fontWeight: 700, color: "var(--accent-amber)", margin: 0 }}>₦{pill.price.toLocaleString()}</p>
                </div>
                <div style={{ borderRadius: 10, padding: "10px 12px", textAlign: "center", border: `1px solid ${color}40`, backgroundColor: `${color}08` }}>
                  <p style={{ fontSize: 11, color: "var(--text-secondary)", margin: "0 0 4px" }}>You Win</p>
                  <p style={{ fontSize: 17, fontFamily: "monospace", fontWeight: 700, color, margin: 0 }}>₦{pill.prize.toLocaleString()}</p>
                </div>
              </div>
              {bonusUsed > 0 && canAfford && (
                <p style={{ fontSize: 11, textAlign: "center", color: "var(--accent-amber)" }}>
                  ₦{bonusUsed.toLocaleString()} from bonus credit{realUsed > 0 ? ` + ₦${realUsed.toLocaleString()} from balance` : " (fully covered)"}
                </p>
              )}
              {!canAfford && <p style={{ textAlign: "center", color: "#f87171", fontSize: 13 }}>Insufficient balance. <Link href="/wallet" style={{ textDecoration: "underline", fontWeight: 600 }}>Add funds</Link></p>}
              <button onClick={onConfirm} disabled={!canAfford}
                style={{ width: "100%", padding: "13px 0", borderRadius: 10, border: "none", backgroundColor: color, color: "#000", fontSize: 14, fontWeight: 700, cursor: canAfford ? "pointer" : "not-allowed", opacity: canAfford ? 1 : 0.4 }}>
                Pay ₦{pill.price.toLocaleString()} &amp; Start
              </button>
              <button onClick={() => setPhase("preview")} style={{ width: "100%", padding: "10px 0", border: "none", background: "none", fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", cursor: "pointer" }}>
                Back
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function PillsPage() {
  const router = useRouter();
  const { state } = useApp();
  const [allPacks, setAllPacks] = useState<PillPack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sheet, setSheet] = useState<{ pack: PillPack; pill: PillPackPill } | null>(null);
  const [activeCategory, setActiveCategory] = useState("All");

  useEffect(() => {
    if (!state.isAuthenticated) { router.push("/auth"); return; }
    pillsApi.getPacks()
      .then((d) => setAllPacks((d.packs ?? []).filter((p) => p.status === "active")))
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load packs"))
      .finally(() => setLoading(false));
  }, [state.isAuthenticated, router]);

  const standardPacks = allPacks.filter((p) => !p.is_vip);
  const vipPacks = allPacks.filter((p) => p.is_vip);
  const categories = Array.from(new Set(standardPacks.map((p) => p.category))).sort();

  const filteredPacks = activeCategory === "All"
    ? standardPacks
    : standardPacks.filter((p) => p.category === activeCategory);

  const heroPack = filteredPacks[0] ?? null;
  const morePacks = filteredPacks.slice(1);

  if (!state.isAuthenticated) return null;

  const handlePackClick = (pack: PillPack) => {
    if (pack.is_vip) {
      // VIP packs go to the exam flow, not the regular pill flow
      router.push(`/pills/vip/${pack.id}/play`);
      return;
    }
    // Regular packs: open the first available pill's confirm sheet
    const firstAvail = pack.pills.find((p) => p.status === "available");
    if (firstAvail) setSheet({ pack, pill: firstAvail });
  };

  return (
    <div style={{ width: "100%", maxWidth: "100vw", overflowX: "hidden", boxSizing: "border-box", padding: "20px 16px 100px" }}>

      {error && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 8, marginBottom: 16, border: "1px solid var(--border-subtle)", backgroundColor: "rgba(239,68,68,0.05)", color: "#f87171", fontSize: 13 }}>
          <AlertCircle size={15} style={{ flexShrink: 0 }} /> {error}
        </div>
      )}

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="skeleton" style={{ height: 32, width: 200, borderRadius: 20 }} />
          <div className="skeleton" style={{ height: 140, borderRadius: 16 }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[1,2,3,4].map((i) => <div key={i} className="skeleton" style={{ height: 130, borderRadius: 12 }} />)}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

          {/* Category chips */}
          {categories.length > 0 && (
            <CategoryChips categories={categories} active={activeCategory} onChange={setActiveCategory} />
          )}

          {/* Featured today */}
          {heroPack && (
            <section>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-muted)", marginBottom: 10 }}>
                Featured today
              </p>
              <HeroPack pack={heroPack} onClick={() => handlePackClick(heroPack)} />
            </section>
          )}

          {/* More packs — 2-col grid */}
          {morePacks.length > 0 && (
            <section>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-muted)", marginBottom: 10 }}>
                More packs
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {morePacks.map((pack) => (
                  <GridPackCard key={pack.id} pack={pack} onClick={() => handlePackClick(pack)} />
                ))}
              </div>
            </section>
          )}

          {/* Empty state */}
          {filteredPacks.length === 0 && (
            <div style={{ borderRadius: 12, padding: "36px 20px", textAlign: "center", border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-card)" }}>
              <Clock size={28} style={{ color: "var(--text-muted)", margin: "0 auto 12px", display: "block" }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", margin: "0 0 4px" }}>No packs live</p>
              <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>Check back soon — new packs drop regularly</p>
            </div>
          )}

          {/* VIP section */}
          <VipBanner packs={vipPacks} onTap={(pack) => router.push(`/pills/vip/${pack.id}/play`)} />

        </div>
      )}

      {/* Pill confirm sheet */}
      <AnimatePresence>
        {sheet && (
          <PillSheet
            pack={sheet.pack} pill={sheet.pill}
            balance={state.player?.balance ?? 0}
            bonusBalance={state.player?.bonus_balance ?? 0}
            onConfirm={() => { const pill = sheet.pill; setSheet(null); router.push(`/pills/play/${pill.id}`); }}
            onClose={() => setSheet(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
