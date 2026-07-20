"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

// Shows once per session when the app is launched as an installed PWA.
// Fades out after ~1.8s revealing the actual app underneath.
export function PwaSplash() {
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // Only show when running as standalone PWA (installed to home screen)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as any).standalone === true;

    // Only show once per session
    const shown = sessionStorage.getItem("pwa_splash_shown");
    if (!isStandalone || shown) return;

    sessionStorage.setItem("pwa_splash_shown", "1");
    setVisible(true);

    // Start fade-out after 1.6s
    const fadeTimer = setTimeout(() => setFading(true), 1600);
    // Unmount after fade completes
    const hideTimer = setTimeout(() => setVisible(false), 2100);
    return () => { clearTimeout(fadeTimer); clearTimeout(hideTimer); };
  }, []);

  if (!visible) return null;

  return (
    <>
      <style>{`
        @keyframes pwa-float {
          0%, 100% { transform: translateY(0px) scale(1); }
          50%       { transform: translateY(-8px) scale(1.04); }
        }
        @keyframes pwa-glow-ring {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50%       { opacity: 0.85; transform: scale(1.18); }
        }
        @keyframes pwa-shimmer {
          0%   { transform: translateX(-120%) skewX(-15deg); }
          100% { transform: translateX(220%) skewX(-15deg); }
        }
        @keyframes pwa-fadein-up {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pwa-bar {
          0%   { width: 0%;   margin-left: 0; }
          60%  { width: 70%;  margin-left: 0; }
          100% { width: 0%;   margin-left: 100%; }
        }
        @keyframes pwa-tagline-dot {
          0%, 100% { opacity: 0.3; }
          50%       { opacity: 1; }
        }
      `}</style>

      <div style={{
        position: "fixed", inset: 0, zIndex: 9999,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        // Rich gradient backdrop — not plain black
        background: "radial-gradient(ellipse 80% 60% at 50% 30%, rgba(76,111,255,0.22) 0%, rgba(124,111,232,0.08) 40%, #080B14 72%), #080B14",
        opacity: fading ? 0 : 1,
        transition: "opacity 0.48s ease",
        pointerEvents: fading ? "none" : "all",
        userSelect: "none",
      }}>

        {/* Diagonal shimmer sweep */}
        <div style={{
          position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none",
        }}>
          <div style={{
            position: "absolute", top: 0, left: 0, bottom: 0, width: "30%",
            background: "linear-gradient(105deg, transparent 0%, rgba(232,163,61,0.04) 50%, transparent 100%)",
            animation: "pwa-shimmer 2.2s ease-in-out infinite",
            animationDelay: "0.4s",
          }} />
        </div>

        {/* Ambient glow ring behind logo */}
        <div style={{
          position: "absolute",
          width: 180, height: 180,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(76,111,255,0.28) 0%, transparent 70%)",
          animation: "pwa-glow-ring 2.4s ease-in-out infinite",
          marginTop: -20,
        }} />

        {/* Second outer glow — amber */}
        <div style={{
          position: "absolute",
          width: 260, height: 260,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(232,163,61,0.08) 0%, transparent 65%)",
          animation: "pwa-glow-ring 3s ease-in-out infinite reverse",
          marginTop: -20,
        }} />

        {/* Logo */}
        <div style={{
          position: "relative", zIndex: 1,
          animation: "pwa-float 3.2s ease-in-out infinite",
          filter: "drop-shadow(0 0 24px rgba(76,111,255,0.55)) drop-shadow(0 0 8px rgba(232,163,61,0.2))",
          marginBottom: 28,
        }}>
          <Image src="/bitlyfe-mark.svg" alt="BitLyfe" width={80} height={80} priority />
        </div>

        {/* Wordmark */}
        <p style={{
          position: "relative", zIndex: 1,
          fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em",
          color: "#fff",
          margin: "0 0 6px",
          fontFamily: "sans-serif",
          animation: "pwa-fadein-up 0.5s ease both",
          animationDelay: "0.2s",
          opacity: 0,
        }}>
          bitlyfe
        </p>

        {/* Tagline */}
        <p style={{
          position: "relative", zIndex: 1,
          fontSize: 11, fontWeight: 700, letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: "rgba(232,163,61,0.75)",
          margin: "0 0 52px",
          animation: "pwa-fadein-up 0.5s ease both",
          animationDelay: "0.4s",
          opacity: 0,
        }}>
          Real Stakes
          <span style={{ display: "inline-block", margin: "0 8px", animation: "pwa-tagline-dot 1.4s ease-in-out infinite" }}>·</span>
          Real Fast
        </p>

        {/* Progress bar */}
        <div style={{
          position: "relative", zIndex: 1,
          width: 100, height: 2, borderRadius: 1,
          backgroundColor: "rgba(255,255,255,0.08)",
          overflow: "hidden",
          animation: "pwa-fadein-up 0.5s ease both",
          animationDelay: "0.5s",
          opacity: 0,
        }}>
          <div style={{
            position: "absolute", left: 0, top: 0, height: "100%", borderRadius: 1,
            background: "linear-gradient(90deg, #4C6FFF, #E8A33D)",
            animation: "pwa-bar 1.5s ease-in-out infinite",
            animationDelay: "0.6s",
          }} />
        </div>

        {/* Corner accent dots */}
        {[
          { top: 32, left: 28 }, { top: 32, right: 28 },
          { bottom: 48, left: 28 }, { bottom: 48, right: 28 },
        ].map((pos, i) => (
          <div key={i} style={{
            position: "absolute", ...pos,
            width: 4, height: 4, borderRadius: "50%",
            backgroundColor: "rgba(76,111,255,0.4)",
            animation: `pwa-tagline-dot ${1.2 + i * 0.2}s ease-in-out infinite`,
          }} />
        ))}
      </div>
    </>
  );
}
