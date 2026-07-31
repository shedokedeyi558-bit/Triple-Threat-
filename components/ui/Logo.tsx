import React from "react";
import Image from "next/image";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showMark?: boolean;
  /** "full" = mark + wordmark | "mark" = mark only | "wordmark" = text only */
  variant?: "full" | "mark" | "wordmark";
  /** admin variant uses single-color indigo tinted mark */
  admin?: boolean;
}

const sizeMap = {
  sm: { mark: 20, text: "text-sm" },
  md: { mark: 28, text: "text-base" },
  lg: { mark: 40, text: "text-xl" },
};

export function Logo({ size = "md", variant = "full", admin = false }: LogoProps) {
  const { mark: markSize, text: textSize } = sizeMap[size];

  return (
    <div className="flex items-center gap-2">
      {variant !== "wordmark" && (
        <Image
          src="/bitlyfe-mark.svg"
          alt="BitLyfe"
          width={markSize}
          height={markSize}
          className="flex-shrink-0"
          priority
        />
      )}
      {variant !== "mark" && (
        <span
          className={`font-headline font-semibold ${textSize} leading-none whitespace-nowrap`}
          style={{ color: admin ? "var(--text-primary)" : "var(--text-primary)" }}
        >
          {admin ? "bitlyfe admin" : "bitlyfe"}
        </span>
      )}
    </div>
  );
}
