"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Download, ArrowRight, Check } from "lucide-react";
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

// Generate a unique receipt serial number
function generateReceiptSerial(): string {
  const now = new Date();
  const timestamp = now.getTime().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `RCPT-${timestamp}${random}`.slice(0, 15);
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
function downloadReceipt(prize: number, category: string, question: string, playerName: string, receiptSerial: string) {
  const W = 800, H = 1000;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Background with gradient
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, "#0a0800");
  grad.addColorStop(0.5, "#1a1100");
  grad.addColorStop(1, "#0d0d0d");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Diagonal texture overlay
  ctx.strokeStyle = "rgba(232,163,61,0.03)";
  ctx.lineWidth = 1;
  for (let i = -H; i < W; i += 20) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + H, H);
    ctx.stroke();
  }

  // Gold ornamental border
  ctx.strokeStyle = "#E8A33D";
  ctx.lineWidth = 2;
  ctx.strokeRect(20, 20, W - 40, H - 40);
  ctx.strokeStyle = "rgba(232,163,61,0.15)";
  ctx.lineWidth = 1;
  ctx.strokeRect(30, 30, W - 60, H - 60);

  // ── Top section: BITLYFE + Date + Serial ──
  ctx.fillStyle = "#E8A33D";
  ctx.font = "bold 28px monospace";
  ctx.textAlign = "left";
  ctx.fillText("BITLYFE", 50, 90);

  const date = new Date().toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.font = "500 13px monospace";
  ctx.textAlign = "right";
  ctx.fillText(date, W - 50, 90);

  // Serial number
  ctx.fillStyle = "rgba(232,163,61,0.6)";
  ctx.font = "700 12px monospace";
  ctx.textAlign = "left";
  ctx.fillText(receiptSerial, 50, 120);

  // ── Verified badge (circle with checkmark) ──
  const badgeX = W / 2, badgeY = 180;
  const badgeR = 35;
  ctx.strokeStyle = "#E8A33D";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(badgeX, badgeY, badgeR, 0, Math.PI * 2);
  ctx.stroke();
  
  // Checkmark inside
  ctx.strokeStyle = "#E8A33D";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(badgeX - 10, badgeY + 2);
  ctx.lineTo(badgeX - 2, badgeY + 12);
  ctx.lineTo(badgeX + 14, badgeY - 8);
  ctx.stroke();

  // "VERIFIED WIN" text
  ctx.fillStyle = "#E8A33D";
  ctx.font = "700 11px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("VERIFIED WIN", badgeX, badgeY + 60);

  // ── Prize section (largest focal point) ──
  ctx.fillStyle = "rgba(232,163,61,0.08)";
  ctx.fillRect(50, 270, W - 100, 200);
  ctx.strokeStyle = "rgba(232,163,61,0.3)";
  ctx.lineWidth = 1;
  ctx.strokeRect(50, 270, W - 100, 200);

  // Prize label
  ctx.fillStyle = "rgba(232,163,61,0.5)";
  ctx.font = "700 14px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("AMOUNT WON", W / 2, 310);

  // Prize amount - LARGE
  ctx.fillStyle = "#FFE082";
  ctx.font = "900 96px monospace";
  ctx.textAlign = "center";
  ctx.fillText(`₦${prize.toLocaleString()}`, W / 2, 410);

  // "Credited to Wallet"
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.font = "500 13px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Credited to Wallet", W / 2, 450);

  // ── Question/Category section ──
  ctx.fillStyle = "rgba(232,163,61,0.05)";
  ctx.fillRect(50, 490, W - 100, 1);
  
  ctx.fillStyle = "#E8A33D";
  ctx.font = "700 12px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("CORRECT ANSWER", 50, 530);

  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.font = "600 18px sans-serif";
  ctx.textAlign = "left";
  const answer = question.length > 60 ? question.slice(0, 57) + "…" : question;
  ctx.fillText(answer, 50, 565);

  // Category badge
  ctx.fillStyle = "rgba(232,163,61,0.15)";
  ctx.fillRect(50, 600, 120, 40);
  ctx.strokeStyle = "rgba(232,163,61,0.4)";
  ctx.lineWidth = 1;
  ctx.strokeRect(50, 600, 120, 40);
  ctx.fillStyle = "rgba(232,163,61,0.8)";
  ctx.font = "700 12px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(category.toUpperCase(), 110, 625);

  // Player info
  if (playerName) {
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.font = "500 12px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`Player: ${playerName}`, 50, 680);
  }

  // Timestamp
  const ts = new Date().toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.font = "500 11px monospace";
  ctx.textAlign = "right";
  ctx.fillText(`${ts}`, W - 50, 680);

  // ── Footer ──
  ctx.fillStyle = "rgba(232,163,61,0.08)";
  ctx.fillRect(0, H - 100, W, 100);
  
  ctx.fillStyle = "rgba(232,163,61,0.6)";
  ctx.font = "700 12px monospace";
  ctx.textAlign = "center";
  ctx.fillText("✓ Verified win receipt", W / 2, H - 50);

  ctx.fillStyle = "rgba(255,255,255,0.2)";
  ctx.font = "500 11px monospace";
  ctx.textAlign = "center";
  ctx.fillText("bitlyfe.app — Your skills, your winnings", W / 2, H - 25);

  // Save: Web Share API (mobile) → desktop download fallback
  const filename = `bitlyfe-win-${receiptSerial}.png`;
  canvas.toBlob((blob) => {
    if (!blob) return;

    if (navigator.canShare && navigator.canShare({ files: [new File([blob], filename, { type: "image/png" })] })) {
      navigator.share({
        title: "Bitlyfe Win Receipt",
        text: `I just won ₦${prize.toLocaleString()} on Bitlyfe!`,
        files: [new File([blob], filename, { type: "image/png" })],
      }).catch(() => {/* silent */});
      return;
    }

    // Desktop: download via blob URL
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.download = filename;
    a.href = url;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 3000);
  }, "image/png");
}

// ── Main component ────────────────────────────────────────────────────────────
export default function PillResult({
  won, prize, correctAnswer, category, timedOut = false, question = "", playerName = "",
}: PillResultProps) {
  const router = useRouter();
  const safePrize = prize ?? 0;
  const safeAnswer = correctAnswer ?? "";
  const receiptSerial = useRef(generateReceiptSerial()).current;

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
          /* ── WIN RECEIPT CERTIFICATE ── */
          <div style={{
            borderRadius: 24, overflow: "hidden",
            background: "linear-gradient(135deg, #0a0800 0%, #1a1100 50%, #0d0d0d 100%)",
            border: "2px solid rgba(232,163,61,0.5)",
            boxShadow: "0 0 60px rgba(232,163,61,0.15), 0 0 0 1px rgba(232,163,61,0.1) inset",
            position: "relative",
          }}>
            {/* Diagonal texture background */}
            <div style={{
              position: "absolute", inset: 0,
              backgroundImage: `repeating-linear-gradient(
                45deg,
                transparent,
                transparent 20px,
                rgba(232,163,61,0.02) 20px,
                rgba(232,163,61,0.02) 40px
              )`,
              pointerEvents: "none",
            }} />

            {/* Gold top accent line */}
            <div style={{ height: 2, background: "linear-gradient(90deg, transparent, #E8A33D, #FFD700, #E8A33D, transparent)" }} />

            <div style={{ position: "relative", zIndex: 1, padding: "28px 28px 24px" }}>
              {/* ── Header: BITLYFE + Date ── */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.2em", color: "#E8A33D", textTransform: "uppercase", margin: 0, marginBottom: 2 }}>
                    BITLYFE
                  </p>
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "rgba(232,163,61,0.6)", fontFamily: "monospace", margin: 0 }}>
                    {receiptSerial}
                  </p>
                </div>
                <p style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.3)", fontFamily: "monospace", margin: 0, textAlign: "right" }}>
                  {new Date().toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}<br />
                  {new Date().toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </p>
              </div>

              {/* ── Verified Badge (Refined Checkmark) ── */}
              <div style={{ textAlign: "center", marginBottom: 16 }}>
                <motion.div
                  initial={{ scale: 0, rotate: -30 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.15 }}
                  style={{
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    width: 64, height: 64,
                    borderRadius: "50%",
                    border: "2px solid #E8A33D",
                    backgroundColor: "rgba(232,163,61,0.05)",
                    marginBottom: 8,
                  }}>
                  <Check size={32} style={{ color: "#E8A33D", strokeWidth: 2.5 }} />
                </motion.div>
                <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.15em", color: "#E8A33D", textTransform: "uppercase", margin: 0 }}>
                  Verified Win
                </p>
              </div>

              {/* ── Prize Box (Focal Point) ── */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.25, type: "spring" }}
                style={{
                  borderRadius: 16, padding: "20px 24px",
                  background: "linear-gradient(135deg, rgba(232,163,61,0.12) 0%, rgba(255,215,0,0.06) 100%)",
                  border: "1.5px solid rgba(232,163,61,0.4)",
                  marginBottom: 18,
                  textAlign: "center",
                }}>
                <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(232,163,61,0.5)", margin: "0 0 8px" }}>
                  Amount Won
                </p>
                <p style={{ fontSize: 52, fontFamily: "monospace", fontWeight: 900, color: "#FFE082", margin: 0, letterSpacing: "-0.02em" }}>
                  ₦{safePrize.toLocaleString()}
                </p>
                <p style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", margin: "8px 0 0" }}>
                  Credited to Wallet
                </p>
              </motion.div>

              {/* ── Divider ── */}
              <div style={{ margin: "16px 0", borderTop: "1px dashed rgba(232,163,61,0.2)" }} />

              {/* ── Correct Answer ── */}
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(232,163,61,0.5)", margin: "0 0 6px" }}>
                  Correct Answer
                </p>
                <p style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.85)", margin: 0, fontStyle: "italic", lineHeight: 1.4 }}>
                  &ldquo;{safeAnswer || "—"}&rdquo;
                </p>
              </div>

              {/* ── Category Badge ── */}
              <div style={{
                display: "inline-block",
                padding: "5px 12px", borderRadius: 16,
                backgroundColor: "rgba(232,163,61,0.1)", border: "1px solid rgba(232,163,61,0.3)",
                fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
                color: "rgba(232,163,61,0.7)", textTransform: "uppercase",
                marginBottom: 16,
              }}>
                {category}
              </div>

              {/* ── Footer ── */}
              <div style={{ textAlign: "center", paddingTop: 10, borderTop: "1px solid rgba(232,163,61,0.1)" }}>
                <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "rgba(232,163,61,0.5)", margin: "8px 0 2px", textTransform: "uppercase" }}>
                  ✓ Verified win · bitlyfe.app
                </p>
              </div>

              {/* ── Save Button ── */}
              <button
                onClick={() => downloadReceipt(safePrize, category, question || safeAnswer, playerName, receiptSerial)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  width: "100%", marginTop: 12,
                  padding: "8px 0",
                  fontSize: 11, fontWeight: 700, letterSpacing: "0.08em",
                  color: "rgba(232,163,61,0.6)", backgroundColor: "transparent",
                  border: "1px solid rgba(232,163,61,0.2)", borderRadius: 10,
                  cursor: "pointer", transition: "all 0.15s",
                  textTransform: "uppercase",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(232,163,61,0.5)";
                  (e.currentTarget as HTMLButtonElement).style.color = "#E8A33D";
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(232,163,61,0.05)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(232,163,61,0.2)";
                  (e.currentTarget as HTMLButtonElement).style.color = "rgba(232,163,61,0.6)";
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
                }}
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

        {/* CTA buttons — Play More + Withdraw (Save integrated above) */}
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
