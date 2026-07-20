"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Download, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

interface PillResultProps {
  won: boolean;
  prize?: number;
  correctAnswer: string;
  category: string;
  timedOut?: boolean;
  question?: string;
  playerName?: string;
}

// ── Confetti burst ────────────────────────────────────────────────────────────
function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const colors = ["#E8A33D", "#4C6FFF", "#FFD700", "#7C6FE8", "#fff"];
    const pieces = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvas.width,
      y: -10 - Math.random() * 40,
      r: 3 + Math.random() * 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: (Math.random() - 0.5) * 3,
      vy: 2 + Math.random() * 4,
      rot: Math.random() * 360,
      vrot: (Math.random() - 0.5) * 8,
      shape: Math.random() > 0.5 ? "rect" : "circle",
    }));

    let frame = 0;
    const animate = () => {
      if (frame++ > 120) return; // stop after ~2s
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pieces.forEach((p) => {
        p.x += p.vx; p.y += p.vy; p.rot += p.vrot; p.vy += 0.1;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, 1 - frame / 120);
        if (p.shape === "rect") ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r);
        else { ctx.beginPath(); ctx.arc(0, 0, p.r, 0, Math.PI * 2); ctx.fill(); }
        ctx.restore();
      });
      requestAnimationFrame(animate);
    };
    animate();
  }, []);

  return (
    <canvas ref={canvasRef}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 10 }} />
  );
}

// ── Download receipt as image ─────────────────────────────────────────────────
function downloadReceipt(prize: number, category: string, question: string, playerName: string) {
  const W = 720, H = 440;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Background
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, "#0d0d0d");
  grad.addColorStop(1, "#1a1100");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Gold border
  ctx.strokeStyle = "#E8A33D";
  ctx.lineWidth = 3;
  ctx.strokeRect(6, 6, W - 12, H - 12);

  // Inner glow line
  ctx.strokeStyle = "rgba(232,163,61,0.25)";
  ctx.lineWidth = 1;
  ctx.strokeRect(14, 14, W - 28, H - 28);

  // App name
  ctx.fillStyle = "#E8A33D";
  ctx.font = "bold 22px monospace";
  ctx.textAlign = "center";
  ctx.fillText("BITLYFE", W / 2, 56);

  // "WINNER" stamp
  ctx.save();
  ctx.font = "bold 72px sans-serif";
  ctx.fillStyle = "rgba(232,163,61,0.06)";
  ctx.textAlign = "center";
  ctx.fillText("WINNER", W / 2, H / 2 + 26);
  ctx.restore();

  // Prize
  ctx.fillStyle = "#FFE082";
  ctx.font = "bold 54px monospace";
  ctx.textAlign = "center";
  ctx.fillText(`₦${prize.toLocaleString()}`, W / 2, 160);

  // Label
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.font = "600 16px sans-serif";
  ctx.fillText("PRIZE CREDITED TO WALLET", W / 2, 188);

  // Divider
  ctx.strokeStyle = "rgba(232,163,61,0.3)";
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(60, 208); ctx.lineTo(W - 60, 208); ctx.stroke();

  // Category
  ctx.fillStyle = "#E8A33D";
  ctx.font = "bold 13px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(category.toUpperCase(), 60, 238);

  // Question (truncated)
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.font = "500 15px sans-serif";
  const q = question.length > 72 ? question.slice(0, 69) + "…" : question;
  ctx.fillText(q, 60, 262);

  // Player name
  if (playerName) {
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = "500 13px sans-serif";
    ctx.fillText(playerName, 60, 290);
  }

  // Timestamp
  const ts = new Date().toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" });
  ctx.fillStyle = "rgba(255,255,255,0.3)";
  ctx.font = "500 12px monospace";
  ctx.textAlign = "right";
  ctx.fillText(ts, W - 60, 290);

  // Bottom strip
  ctx.fillStyle = "rgba(232,163,61,0.08)";
  ctx.fillRect(0, H - 60, W, 60);
  ctx.fillStyle = "rgba(232,163,61,0.5)";
  ctx.font = "500 12px monospace";
  ctx.textAlign = "center";
  ctx.fillText("bitlyfe.app  ·  Verified win receipt", W / 2, H - 30);

  // Download
  const a = document.createElement("a");
  a.download = `bitlyfe-win-₦${prize.toLocaleString()}.png`;
  a.href = canvas.toDataURL("image/png");
  a.click();
}

// ── Main component ────────────────────────────────────────────────────────────
export default function PillResult({
  won, prize, correctAnswer, category, timedOut = false, question = "", playerName = "",
}: PillResultProps) {
  const router = useRouter();
  const safePrize = prize ?? 0;
  const safeAnswer = correctAnswer ?? "";

  return (
    <div style={{ position: "relative", minHeight: won ? 520 : "auto" }}>
      {won && <Confetti />}

      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, type: "spring", stiffness: 280, damping: 24 }}
        style={{ position: "relative", zIndex: 1 }}
      >
        {won ? (
          /* ── WIN RECEIPT ── */
          <div style={{
            borderRadius: 20, overflow: "hidden",
            background: "linear-gradient(160deg, #1a1100 0%, #0d0d0d 50%, #0a0800 100%)",
            border: "1.5px solid rgba(232,163,61,0.6)",
            boxShadow: "0 0 40px rgba(232,163,61,0.2), 0 0 0 1px rgba(232,163,61,0.08) inset",
          }}>
            {/* Top bar */}
            <div style={{ height: 3, background: "linear-gradient(90deg, transparent, #E8A33D, #FFD700, #E8A33D, transparent)" }} />

            {/* App name strip */}
            <div style={{ padding: "12px 20px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.14em", color: "rgba(232,163,61,0.7)", textTransform: "uppercase" }}>
                Bitlyfe
              </span>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", fontFamily: "monospace" }}>
                {new Date().toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            </div>

            {/* Winner check + prize */}
            <div style={{ padding: "20px 20px 24px", textAlign: "center" }}>
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.15 }}
                style={{ display: "inline-block", marginBottom: 10 }}>
                <CheckCircle size={56} style={{ color: "#E8A33D" }} />
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.18em", color: "rgba(232,163,61,0.6)", textTransform: "uppercase", margin: "0 0 4px" }}>
                Correct Answer
              </motion.p>

              <motion.p
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.5)", margin: "0 0 18px", fontStyle: "italic" }}>
                &ldquo;{safeAnswer || category}&rdquo;
              </motion.p>

              {/* Prize amount */}
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4, type: "spring" }}
                style={{ borderRadius: 14, padding: "18px 24px",
                  background: "linear-gradient(135deg, rgba(232,163,61,0.12) 0%, rgba(255,215,0,0.06) 100%)",
                  border: "1px solid rgba(232,163,61,0.35)", marginBottom: 14 }}>
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(232,163,61,0.55)", margin: "0 0 6px" }}>
                  Prize credited to wallet
                </p>
                <p style={{ fontSize: 44, fontFamily: "monospace", fontWeight: 900, color: "#FFE082", margin: 0, lineHeight: 1.1, letterSpacing: "-0.02em" }}>
                  ₦{safePrize.toLocaleString()}
                </p>
              </motion.div>

              {/* Category badge */}
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em",
                padding: "3px 10px", borderRadius: 20,
                backgroundColor: "rgba(232,163,61,0.1)", color: "rgba(232,163,61,0.7)",
                border: "1px solid rgba(232,163,61,0.2)" }}>
                {category}
              </span>
            </div>

            {/* Dashed tear line */}
            <div style={{ margin: "0 20px", borderTop: "1px dashed rgba(232,163,61,0.2)" }} />

            {/* Receipt footer */}
            <div style={{ padding: "12px 20px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", fontFamily: "monospace" }}>
                Verified win · bitlyfe.app
              </span>
              <button
                onClick={() => downloadReceipt(safePrize, category, question, playerName)}
                style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700,
                  color: "rgba(232,163,61,0.7)", background: "none", border: "none", cursor: "pointer",
                  padding: "4px 8px", borderRadius: 6, transition: "color 0.15s" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#E8A33D")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "rgba(232,163,61,0.7)")}
              >
                <Download size={12} /> Save receipt
              </button>
            </div>
          </div>
        ) : (
          /* ── LOSS / TIMEOUT ── */
          <div className="space-y-5">
            <div className="text-center">
              {timedOut ? (
                <>
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 15 }} className="inline-block">
                    <XCircle size={64} className="text-yellow-500" />
                  </motion.div>
                  <h2 className="text-3xl font-bold text-yellow-500 mt-4 uppercase">Time&apos;s Up</h2>
                </>
              ) : (
                <>
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 15 }} className="inline-block">
                    <XCircle size={64} className="text-red-500" />
                  </motion.div>
                  <h2 className="text-3xl font-bold text-red-500 mt-4 uppercase">Wrong</h2>
                </>
              )}
            </div>
            <div className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl p-4">
              <p className="text-xs text-[#888] uppercase tracking-tight font-bold">Correct Answer</p>
              <p className="text-lg font-bold mt-2" style={{ color: "var(--text-primary)" }}>{safeAnswer || "—"}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-[#888]">{category}</p>
            </div>
          </div>
        )}

        {/* CTA buttons */}
        <div className="flex gap-3 pt-5">
          {won ? (
            <>
              <button onClick={() => router.push("/pills")}
                className="flex-1 font-bold uppercase tracking-tight rounded-xl py-3.5 min-h-12 text-sm flex items-center justify-center gap-2"
                style={{ backgroundColor: "var(--accent-indigo)", color: "#fff" }}>
                Play more <ArrowRight size={14} />
              </button>
              <button onClick={() => router.push("/wallet")}
                className="flex-1 font-bold uppercase tracking-tight rounded-xl py-3.5 min-h-12 text-sm"
                style={{ background: "none", color: "rgba(232,163,61,0.7)", border: "1px solid rgba(232,163,61,0.25)" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(232,163,61,0.6)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(232,163,61,0.25)")}>
                Withdraw
              </button>
            </>
          ) : (
            <>
              <button onClick={() => router.back()}
                className="flex-1 bg-[#1A1A1A] font-bold uppercase tracking-tight rounded-xl py-3.5 min-h-12 text-sm transition-colors"
                style={{ color: "var(--text-primary)", border: "1px solid #2A2A2A" }}>
                Try Again
              </button>
              <button onClick={() => router.push("/pills")}
                className="flex-1 font-bold uppercase tracking-tight rounded-xl py-3.5 min-h-12 text-sm"
                style={{ backgroundColor: "var(--accent-indigo)", color: "#fff" }}>
                Back
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
