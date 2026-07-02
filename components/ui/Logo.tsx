import React from "react";

export function Logo({ size = "md", showIcon = true }: { size?: "sm" | "md" | "lg"; showIcon?: boolean }) {
  const sizes = {
    sm: { icon: 24, text: "text-base" },
    md: { icon: 32, text: "text-2xl" },
    lg: { icon: 48, text: "text-4xl" },
  };

  const currentSize = sizes[size];
  const iconSize = currentSize.icon;

  return (
    <div className="flex items-center gap-2">
      {showIcon && (
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="flex-shrink-0"
        >
          {/* Animated glow background */}
          <defs>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Trophy/cup shape with geometric flair */}
          {/* Base hexagon */}
          <polygon
            points="20,2 35,10 35,30 20,38 5,30 5,10"
            fill="none"
            stroke="#00FF66"
            strokeWidth="1.5"
            opacity="0.5"
          />

          {/* Inner trophy silhouette */}
          <g fill="#00FF66" filter="url(#glow)">
            {/* Handle left */}
            <path d="M 15 12 Q 8 15 8 22 Q 8 28 15 28" fill="none" stroke="#00FF66" strokeWidth="2" />
            {/* Handle right */}
            <path d="M 25 12 Q 32 15 32 22 Q 32 28 25 28" fill="none" stroke="#00FF66" strokeWidth="2" />
            {/* Cup body */}
            <rect x="14" y="12" width="12" height="18" rx="2" fill="#00FF66" opacity="0.9" />
            {/* Crown on top */}
            <polygon points="14,10 20,6 26,10" fill="#00FF66" />
            {/* Shine effect */}
            <rect x="16" y="14" width="2" height="10" fill="white" opacity="0.6" rx="1" />
          </g>

          {/* Dynamic accent lines */}
          <line x1="20" y1="2" x2="20" y2="6" stroke="#00FF66" strokeWidth="1" opacity="0.7" />
          <circle cx="20" cy="20" r="15" fill="none" stroke="#00FF66" strokeWidth="0.5" opacity="0.3" />
        </svg>
      )}
      <div className={`font-black uppercase tracking-tight ${currentSize.text} leading-none whitespace-nowrap`}>
        <span className="text-white">BIT</span>
        <span className="text-neon neon-text-glow">LYFE</span>
      </div>
    </div>
  );
}
