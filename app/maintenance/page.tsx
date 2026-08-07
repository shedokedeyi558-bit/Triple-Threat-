"use client";

export default function MaintenancePage() {
  return (
    <div style={{
      minHeight: "100dvh",
      backgroundColor: "#080B14",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px 20px",
      textAlign: "center",
      fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
    }}>
      {/* Icon */}
      <div style={{
        width: 72, height: 72, borderRadius: 20, marginBottom: 24,
        background: "linear-gradient(145deg, rgba(232,163,61,0.18), rgba(232,163,61,0.05))",
        border: "1.5px solid rgba(232,163,61,0.25)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 34,
        boxShadow: "0 0 24px rgba(232,163,61,0.15), 0 8px 24px rgba(0,0,0,0.4)",
      }}>
        🔧
      </div>

      {/* Logo text */}
      <p style={{
        fontSize: 11, fontWeight: 700, letterSpacing: "0.16em",
        textTransform: "uppercase", color: "rgba(255,255,255,0.3)",
        margin: "0 0 16px",
      }}>
        BITLYFE
      </p>

      <h1 style={{
        fontFamily: "'Space Grotesk', system-ui, sans-serif",
        fontSize: "clamp(1.6rem, 7vw, 2.4rem)",
        fontWeight: 800, letterSpacing: "-0.02em",
        color: "#F2EFE9", margin: "0 0 12px", lineHeight: 1.15,
      }}>
        Back soon.
      </h1>

      <p style={{
        fontSize: 15, color: "#8A93A6", lineHeight: 1.65,
        margin: "0 0 32px", maxWidth: "32ch",
      }}>
        We&apos;re running quick maintenance. Games and payouts will resume shortly — no action needed on your end.
      </p>

      {/* Pulsing indicator */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{
          display: "inline-block", width: 8, height: 8, borderRadius: "50%",
          backgroundColor: "#E8A33D",
          animation: "pulse 2s ease-in-out infinite",
        }} />
        <span style={{ fontSize: 13, color: "#8A93A6", fontWeight: 500 }}>
          Estimated downtime: under 30 minutes
        </span>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.4); }
        }
      `}</style>
    </div>
  );
}
