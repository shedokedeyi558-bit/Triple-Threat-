import React from "react";

export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: "text-xl",
    md: "text-3xl",
    lg: "text-5xl",
  };
  return (
    <div className="flex flex-col items-center">
      <span className={`font-black uppercase tracking-tight text-neon neon-text-glow ${sizes[size]}`}>
        Triple
      </span>
      <span className={`font-black uppercase tracking-tight text-white ${sizes[size]} -mt-2`}>
        Threat
      </span>
    </div>
  );
}
