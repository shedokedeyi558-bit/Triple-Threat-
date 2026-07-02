import React from "react";
import { Zap } from "lucide-react";

export function Logo({ size = "md", showIcon = true }: { size?: "sm" | "md" | "lg"; showIcon?: boolean }) {
  const sizes = {
    sm: { text: "text-base", icon: 14, padding: "p-1" },
    md: { text: "text-2xl", icon: 24, padding: "p-2" },
    lg: { text: "text-4xl", icon: 32, padding: "p-2.5" },
  };

  const currentSize = sizes[size];

  return (
    <div className="flex items-center gap-2">
      {showIcon && (
        <div className="relative">
          {/* Outer glow effect */}
          <div className="absolute inset-0 bg-neon/20 rounded-lg blur-lg" />
          {/* Icon container */}
          <div className={`relative bg-gradient-to-br from-neon to-neon/80 rounded-lg ${currentSize.padding}`}>
            <Zap size={currentSize.icon} className="text-black font-bold" strokeWidth={3} />
          </div>
        </div>
      )}
      <div className={`font-black uppercase tracking-tight ${currentSize.text} leading-none whitespace-nowrap`}>
        <span className="text-white">BIT</span>
        <span className="text-neon neon-text-glow">LYFE</span>
      </div>
    </div>
  );
}
