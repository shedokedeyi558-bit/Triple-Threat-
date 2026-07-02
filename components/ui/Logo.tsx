import React from "react";
import { Zap } from "lucide-react";

export function Logo({ size = "md", showIcon = true }: { size?: "sm" | "md" | "lg"; showIcon?: boolean }) {
  const sizes = {
    sm: { text: "text-lg", icon: 16 },
    md: { text: "text-2xl", icon: 24 },
    lg: { text: "text-4xl", icon: 32 },
  };

  const currentSize = sizes[size];

  return (
    <div className="flex items-center gap-2">
      {showIcon && (
        <div className="relative">
          {/* Outer glow effect */}
          <div className="absolute inset-0 bg-neon/20 rounded-lg blur-lg" />
          {/* Icon container */}
          <div className="relative bg-gradient-to-br from-neon to-neon/80 rounded-lg p-1.5 sm:p-2">
            <Zap size={currentSize.icon} className="text-black font-bold" strokeWidth={3} />
          </div>
        </div>
      )}
      <div className="flex flex-col items-start leading-none">
        <span className={`font-black uppercase tracking-tight text-white ${currentSize.text}`}>
          BIT
        </span>
        <span className={`font-black uppercase tracking-tight text-neon ${currentSize.text} neon-text-glow`}>
          LYFE
        </span>
      </div>
    </div>
  );
}
