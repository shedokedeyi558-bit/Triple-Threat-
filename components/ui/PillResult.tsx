"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Download, ArrowRight, CheckCircle2, XCircle, Clock } from "lucide-react";
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

function generateReceiptSerial(): string {
  const now = new Date();
  const ts = now.getTime().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `RCPT-${ts}${rand}`.slice(0, 16);
}

// ── Subtle silver confetti ────────────────────────────────────────────────────
function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const colors = ["#C0C0C0", "#E8E8E8", "#ffffff", "#888", "#4C6FFF"];
    const pieces = Array.from({ length: 70 }, () => ({
      x: Math.random() * canvas.width, y: -10 - Math.random() * 40,
      r: 2 + Math.random() * 4, color: colors[Math.floor(Math.random() * colors.length)],
      vx: (Math.random() - 0.5) * 3, vy: 2 + Math.random() * 3,
      rot: Math.random() * 360, vrot: (Math.random() - 0.5) * 8,
      shape: Math.random() > 0.5 ? "rect" : "circle",
    }));
    let frame = 0;
    const animate = () => {
      if (frame++ > 110) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pieces.forEach((p) => {
        p.x += p.vx; p.y += p.vy; p.rot += p.vrot; p.vy += 0.1;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate((p.rot * Math.PI) / 180);
        ctx.fillStyle = p.color; ctx.globalAlpha = Math.max(0, 1 - frame / 110);
        if (p.shape === "rect") ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r);
        else { ctx.beginPath(); ctx.arc(0, 0, p.r, 0, Math.PI * 2); ctx.fill(); }
        ctx.restore();
      });
      requestAnimationFrame(animate);
    };
    animate();
  }, []);
  return <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 10 }} />;
}

// ── Download receipt as silver/black image ─────────────────────────────────
function downloadReceipt(prize: number, category: string, question: string, playerName: string, receiptSerial: string) {
  const W = 800, H = 1040;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Background: deep black
  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(0, 0, W, H);

  // Subtle diagonal texture
  ctx.strokeStyle = "rgba(192,192,192,0.025)";
  ctx.lineWidth = 1;
  for (let i = -H; i < W + H; i += 24) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + H, H); ctx.stroke();
  }

  // Silver outer border
  ctx.strokeStyle = "#9a9a9a";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(18, 18, W - 36, H - 36);
  // Inner border
  ctx.strokeStyle = "rgba(192,192,192,0.15)";
  ctx.lineWidth = 1;
  ctx.strokeRect(26, 26, W - 52, H - 52);

  // Silver top bar
  const topBar = ctx.createLinearGradient(0, 0, W, 0);
  topBar.addColorStop(0, "rgba(120,120,120,0)");
  topBar.addColorStop(0.5, "#C0C0C0");
  topBar.addColorStop(1, "rgba(120,120,120,0)");
  ctx.fillStyle = topBar; ctx.fillRect(0, 18, W, 2);

  // BITLYFE header
  ctx.fillStyle = "#ffffff"; ctx.font = "bold 22px monospace";
  ctx.textAlign = "left"; ctx.fillText("BITLYFE", 50, 88);
  ctx.fillStyle = "rgba(192,192,192,0.5)"; ctx.font = "700 12px monospace";
  ctx.fillText(receiptSerial, 50, 112);

  // Date/time
  const now = new Date();
  const date = now.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
  const time = now.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  ctx.fillStyle = "rgba(255,255,255,0.3)"; ctx.font = "500 12px monospace";
  ctx.textAlign = "right"; ctx.fillText(date, W - 50, 88);
  ctx.fillText(time, W - 50, 108);

  // Divider
  ctx.strokeStyle = "rgba(192,192,192,0.15)"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(50, 130); ctx.lineTo(W - 50, 130); ctx.stroke();

  // Verified badge (circle + checkmark)
  const cx = W / 2, cy = 200, cr = 38;
  const ring = ctx.createRadialGradient(cx, cy, 0, cx, cy, cr);
  ring.addColorStop(0, "rgba(192,192,192,0.08)");
  ring.addColorStop(1, "rgba(192,192,192,0)");
  ctx.fillStyle = ring; ctx.beginPath(); ctx.arc(cx, cy, cr, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "#C0C0C0"; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(cx, cy, cr, 0, Math.PI * 2); ctx.stroke();
  // Checkmark
  ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 3; ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.beginPath(); ctx.moveTo(cx - 12, cy + 2); ctx.lineTo(cx - 2, cy + 14); ctx.lineTo(cx + 16, cy - 10); ctx.stroke();
  ctx.fillStyle = "#C0C0C0"; ctx.font = "700 11px sans-serif"; ctx.textAlign = "center";
  ctx.fillText("VERIFIED WIN", cx, cy + 60);

  // Prize box
  ctx.fillStyle = "rgba(192,192,192,0.05)";
  roundRect(ctx, 50, 300, W - 100, 190, 12); ctx.fill();
  ctx.strokeStyle = "rgba(192,192,192,0.25)"; ctx.lineWidth = 1;
  roundRect(ctx, 50, 300, W - 100, 190, 12); ctx.stroke();
  ctx.fillStyle = "rgba(192,192,192,0.4)"; ctx.font = "700 13px sans-serif"; ctx.textAlign = "center";
  ctx.fillText("AMOUNT WON", W / 2, 340);
  ctx.fillStyle = "#ffffff"; ctx.font = "900 90px monospace"; ctx.textAlign = "center";
  ctx.fillText(`₦${prize.toLocaleString()}`, W / 2, 440);
  ctx.fillStyle = "rgba(192,192,192,0.35)"; ctx.font = "500 13px sans-serif";
  ctx.fillText("Credited to wallet instantly", W / 2, 472);

  // Divider
  ctx.strokeStyle = "rgba(192,192,192,0.1)"; ctx.lineWidth = 1;
  ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.moveTo(50, 512); ctx.lineTo(W - 50, 512); ctx.stroke();
  ctx.setLineDash([]);

  // Question
  if (question) {
    ctx.fillStyle = "rgba(192,192,192,0.4)"; ctx.font = "700 11px sans-serif"; ctx.textAlign = "left";
    ctx.fillText("QUESTION", 50, 548);
    ctx.fillStyle = "rgba(255,255,255,0.7)"; ctx.font = "500 15px sans-serif";
    const qWords = question.split(" "); let line = ""; let qY = 572;
    qWords.forEach((w) => {
      const test = line + (line ? " " : "") + w;
      if (ctx.measureText(test).width > W - 100) { ctx.fillText(line, 50, qY); line = w; qY += 22; }
      else line = test;
    });
    if (line) { ctx.fillText(line, 50, qY); }
  }

  // Correct answer
  const ansY = question ? 660 : 560;
  ctx.fillStyle = "rgba(192,192,192,0.4)"; ctx.font = "700 11px sans-serif"; ctx.textAlign = "left";
  ctx.fillText("CORRECT ANSWER", 50, ansY);
  ctx.fillStyle = "#ffffff"; ctx.font = "600 17px sans-serif";
  ctx.fillText(`"${question || ""}"`, 50, ansY + 26);

  // Category + player
  ctx.fillStyle = "rgba(192,192,192,0.15)";
  roundRect(ctx, 50, ansY + 50, 130, 32, 6); ctx.fill();
  ctx.strokeStyle = "rgba(192,192,192,0.25)"; roundRect(ctx, 50, ansY + 50, 130, 32, 6); ctx.stroke();
  ctx.fillStyle = "rgba(192,192,192,0.7)"; ctx.font = "700 11px sans-serif"; ctx.textAlign = "center";
  ctx.fillText(category.toUpperCase(), 115, ansY + 71);
  if (playerName) {
    ctx.fillStyle = "rgba(255,255,255,0.25)"; ctx.font = "500 12px sans-serif"; ctx.textAlign = "right";
    ctx.fillText(`Player: ${playerName}`, W - 50, ansY + 71);
  }

  // Footer
  ctx.fillStyle = "rgba(192,192,192,0.05)";
  ctx.fillRect(0, H - 80, W, 80);
  const fBar = ctx.createLinearGradient(0, 0, W, 0);
  fBar.addColorStop(0, "rgba(120,120,120,0)"); fBar.addColorStop(0.5, "#888"); fBar.addColorStop(1, "rgba(120,120,120,0)");
  ctx.fillStyle = fBar; ctx.fillRect(0, H - 80, W, 1);
  ctx.fillStyle = "rgba(192,192,192,0.5)"; ctx.font = "600 11px monospace"; ctx.textAlign = "center";
  ctx.fillText("✓  VERIFIED WIN  ·  BITLYFE.APP", W / 2, H - 45);
  ctx.fillStyle = "rgba(255,255,255,0.15)"; ctx.font = "500 10px monospace";
  ctx.fillText("Your skills, your winnings", W / 2, H - 22);

  const filename = `bitlyfe-win-${receiptSerial}.png`;
  canvas.toBlob((blob) => {
    if (!blob) return;
    if (navigator.canShare && navigator.canShare({ files: [new File([blob], filename, { type: "image/png" })] })) {
      navigator.share({ title: "Bitlyfe Win Receipt", text: `I just won ₦${prize.toLocaleString()} on Bitlyfe!`, files: [new File([blob], filename, { type: "image/png" })] }).catch(() => {});
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.download = filename; a.href = url; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 3000);
  }, "image/png");
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r); ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r); ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r); ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r); ctx.closePath();
}

// ── Main component ────────────────────────────────────────────────────────────
export default function PillResult({
  won, prize, correctAnswer, category, timedOut = false, question = "", playerName = "",
}: PillResultProps) {
  const router = useRouter();
  const safePrize = prize ?? 0;
  const safeAnswer = correctAnswer ?? "";
  const receiptSerial = useRef(generateReceiptSerial()).current;
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
  const timeStr = now.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  return (
    <div style={{ position: "relative", minHeight: won ? 540 : "auto" }}>
      {won && <Confetti />}
      <motion.div initial={{ opacity: 0, scale: 0.93 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, type: "spring", stiffness: 260, damping: 22 }}
        style={{ position: "relative", zIndex: 1 }}>

        {won ? (
          /* ── WIN RECEIPT — silver/black/white ── */
          <div style={{
            borderRadius: 20, overflow: "hidden",
            background: "linear-gradient(160deg, #0e0e0e 0%, #161616 55%, #0a0a0a 100%)",
            border: "1.5px solid rgba(192,192,192,0.35)",
            boxShadow: "0 0 0 1px rgba(255,255,255,0.04) inset, 0 24px 64px rgba(0,0,0,0.7)",
            position: "relative",
          }}>
            {/* Diagonal texture */}
            <div style={{
              position: "absolute", inset: 0, pointerEvents: "none",
              backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 22px, rgba(192,192,192,0.018) 22px, rgba(192,192,192,0.018) 44px)",
            }} />
            {/* Silver top accent */}
            <div style={{ height: 2, background: "linear-gradient(90deg, transparent, #a0a0a0, #e8e8e8, #a0a0a0, transparent)" }} />

            <div style={{ position: "relative", zIndex: 1, padding: "24px 24px 20px" }}>

              {/* Header row */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 800, letterSpacing: "0.2em", color: "#ffffff", textTransform: "uppercase" }}>BITLYFE</p>
                  <p style={{ margin: "3px 0 0", fontSize: 10, fontFamily: "monospace", fontWeight: 700, letterSpacing: "0.1em", color: "rgba(192,192,192,0.5)" }}>{receiptSerial}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ margin: 0, fontSize: 11, fontFamily: "monospace", color: "rgba(255,255,255,0.4)" }}>{dateStr}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 11, fontFamily: "monospace", color: "rgba(255,255,255,0.25)" }}>{timeStr}</p>
                </div>
              </div>

              {/* Silver hairline divider */}
              <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(192,192,192,0.2), transparent)", marginBottom: 20 }} />

              {/* Verified badge */}
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 320, damping: 18, delay: 0.15 }}
                  style={{ display: "inline-flex", alignItems: "center", justifyContent: "center",
                    width: 60, height: 60, borderRadius: "50%",
                    border: "1.5px solid rgba(192,192,192,0.5)",
                    background: "radial-gradient(circle, rgba(192,192,192,0.08) 0%, transparent 70%)",
                    marginBottom: 8 }}>
                  <CheckCircle2 size={28} style={{ color: "#e0e0e0" }} />
                </motion.div>
                <p style={{ margin: 0, fontSize: 10, fontWeight: 800, letterSpacing: "0.18em", color: "rgba(192,192,192,0.7)", textTransform: "uppercase" }}>
                  Verified Win
                </p>
              </div>

              {/* Prize box */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 260 }}
                style={{
                  borderRadius: 14, padding: "18px 20px 14px", marginBottom: 20, textAlign: "center",
                  background: "linear-gradient(135deg, rgba(192,192,192,0.07) 0%, rgba(255,255,255,0.03) 100%)",
                  border: "1px solid rgba(192,192,192,0.2)",
                }}>
                <p style={{ margin: "0 0 6px", fontSize: 9, fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(192,192,192,0.45)" }}>Amount Won</p>
                <p style={{ margin: 0, fontSize: 56, fontFamily: "monospace", fontWeight: 900, color: "#ffffff", letterSpacing: "-0.02em", lineHeight: 1 }}>
                  ₦{safePrize.toLocaleString()}
                </p>
                <p style={{ margin: "8px 0 0", fontSize: 11, fontWeight: 600, color: "rgba(192,192,192,0.4)" }}>Credited to wallet</p>
              </motion.div>

              {/* Dashed divider */}
              <div style={{ borderTop: "1px dashed rgba(192,192,192,0.15)", margin: "0 0 16px" }} />

              {/* Question */}
              {question && (
                <div style={{ marginBottom: 14 }}>
                  <p style={{ margin: "0 0 5px", fontSize: 9, fontWeight: 800, letterSpacing: "0.13em", textTransform: "uppercase", color: "rgba(192,192,192,0.4)" }}>Question</p>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>{question}</p>
                </div>
              )}

              {/* Correct answer */}
              <div style={{ marginBottom: 16 }}>
                <p style={{ margin: "0 0 5px", fontSize: 9, fontWeight: 800, letterSpacing: "0.13em", textTransform: "uppercase", color: "rgba(192,192,192,0.4)" }}>Correct Answer</p>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#ffffff", fontStyle: "italic" }}>&ldquo;{safeAnswer || "—"}&rdquo;</p>
              </div>

              {/* Category badge */}
              <div style={{ marginBottom: 16 }}>
                <span style={{
                  display: "inline-block", padding: "4px 12px", borderRadius: 20,
                  backgroundColor: "rgba(192,192,192,0.08)", border: "1px solid rgba(192,192,192,0.2)",
                  fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
                  color: "rgba(192,192,192,0.6)", textTransform: "uppercase",
                }}>
                  {category}
                </span>
              </div>

              {/* Footer attestation */}
              <div style={{ borderTop: "1px solid rgba(192,192,192,0.08)", paddingTop: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <CheckCircle2 size={11} style={{ color: "rgba(192,192,192,0.4)" }} />
                <p style={{ margin: 0, fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "rgba(192,192,192,0.35)", textTransform: "uppercase" }}>
                  Verified win · bitlyfe.app
                </p>
              </div>

              {/* Save Receipt button */}
              <button
                onClick={() => downloadReceipt(safePrize, category, question || safeAnswer, playerName, receiptSerial)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  width: "100%", marginTop: 14,
                  padding: "10px 0", borderRadius: 10,
                  fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                  color: "rgba(255,255,255,0.55)", backgroundColor: "transparent",
                  border: "1px solid rgba(192,192,192,0.2)", cursor: "pointer",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => { const b = e.currentTarget; b.style.borderColor = "rgba(192,192,192,0.5)"; b.style.color = "#fff"; b.style.backgroundColor = "rgba(192,192,192,0.06)"; }}
                onMouseLeave={(e) => { const b = e.currentTarget; b.style.borderColor = "rgba(192,192,192,0.2)"; b.style.color = "rgba(255,255,255,0.55)"; b.style.backgroundColor = "transparent"; }}
              >
                <Download size={13} /> Save Receipt
              </button>
            </div>
          </div>

        ) : (
          /* ── LOSS / TIMEOUT ── */
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ textAlign: "center", paddingTop: 8 }}>
              {timedOut ? (
                <>
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 14 }}
                    style={{ display: "inline-block", marginBottom: 10 }}>
                    <Clock size={56} style={{ color: "#888" }} />
                  </motion.div>
                  <p style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 900, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.05em" }}>Time&apos;s Up</p>
                  <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.35)" }}>You ran out of time</p>
                </>
              ) : (
                <>
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 14 }}
                    style={{ display: "inline-block", marginBottom: 10 }}>
                    <XCircle size={56} style={{ color: "#888" }} />
                  </motion.div>
                  <p style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 900, color: "#bbb", textTransform: "uppercase", letterSpacing: "0.05em" }}>Wrong Answer</p>
                  <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.35)" }}>Better luck next time</p>
                </>
              )}
            </div>

            <div style={{
              borderRadius: 14, padding: "16px 18px",
              backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(192,192,192,0.12)",
            }}>
              {question && (
                <div style={{ marginBottom: 12 }}>
                  <p style={{ margin: "0 0 4px", fontSize: 9, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(192,192,192,0.4)" }}>Question</p>
                  <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.45 }}>{question}</p>
                </div>
              )}
              <p style={{ margin: "0 0 4px", fontSize: 9, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(192,192,192,0.4)" }}>Correct Answer</p>
              <p style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#e0e0e0" }}>{safeAnswer || "—"}</p>
            </div>

            <div style={{ textAlign: "center" }}>
              <span style={{
                display: "inline-block", padding: "4px 12px", borderRadius: 20,
                backgroundColor: "rgba(192,192,192,0.06)", border: "1px solid rgba(192,192,192,0.15)",
                fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "rgba(192,192,192,0.45)", textTransform: "uppercase",
              }}>
                {category}
              </span>
            </div>
          </div>
        )}

        {/* CTA buttons */}
        <div style={{ display: "flex", gap: 10, paddingTop: 18 }}>
          {won ? (
            <>
              <button onClick={() => router.push("/pills")}
                style={{ flex: 1, padding: "13px 0", borderRadius: 12, border: "none", backgroundColor: "var(--accent-indigo)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                Play More <ArrowRight size={14} />
              </button>
              <button onClick={() => router.push("/wallet")}
                style={{ flex: 1, padding: "13px 0", borderRadius: 12, border: "1px solid rgba(192,192,192,0.25)", backgroundColor: "transparent", color: "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                Withdraw
              </button>
            </>
          ) : (
            <>
              <button onClick={() => router.back()}
                style={{ flex: 1, padding: "13px 0", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", backgroundColor: "rgba(255,255,255,0.04)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                Try Again
              </button>
              <button onClick={() => router.push("/pills")}
                style={{ flex: 1, padding: "13px 0", borderRadius: 12, border: "none", backgroundColor: "var(--accent-indigo)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                Back
              </button>
            </>
          )}
        </div>

      </motion.div>
    </div>
  );
}
