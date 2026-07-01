import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        neon: "#00FF66",
        gold: "#FFD700",
        bg: "#0A0A0A",
        card: "#1A1A1A",
        "card-hover": "#242424",
        border: "#2A2A2A",
        muted: "#666666",
        danger: "#FF4444",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      scale: {
        "98": "0.98",
      },
      animation: {
        marquee: "marquee 30s linear infinite",
        "pulse-neon": "pulseNeon 2s ease-in-out infinite",
        shake: "shake 0.4s ease-in-out",
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        confetti: "confettiFall 1s ease-out forwards",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(-100%)" },
        },
        pulseNeon: {
          "0%, 100%": { boxShadow: "0 0 8px #00FF66, 0 0 20px #00FF6644" },
          "50%": { boxShadow: "0 0 16px #00FF66, 0 0 40px #00FF6688" },
        },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "20%": { transform: "translateX(-4px)" },
          "40%": { transform: "translateX(4px)" },
          "60%": { transform: "translateX(-4px)" },
          "80%": { transform: "translateX(4px)" },
        },
        fadeIn: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        slideUp: {
          from: { transform: "translateY(100%)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        confettiFall: {
          "0%": { transform: "translateY(-20px) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translateY(100vh) rotate(720deg)", opacity: "0" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
