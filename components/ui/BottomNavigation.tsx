"use client";

import { useApp } from "@/context/AppContext";
import { Gamepad2, Wallet, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function BottomNavigation() {
  const { state } = useApp();
  const pathname = usePathname();

  if (!state.isAuthenticated) return null;

  const isActive = (path: string) => {
    if (path === "/play") return pathname.startsWith("/play") || pathname.startsWith("/pills") || pathname.startsWith("/time-machine");
    return pathname.startsWith(path);
  };

  const activeColor = "var(--accent-amber)";

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#0A0A0A] border-t border-[#2A2A2A] z-40 lg:hidden">
      <div className="max-w-lg mx-auto flex items-center justify-around h-20 px-4">
        {[
          { href: "/play", icon: <Gamepad2 size={24} />, label: "Play" },
          { href: "/wallet", icon: <Wallet size={24} />, label: "Wallet" },
          { href: "/profile", icon: <User size={24} />, label: "Profile" },
        ].map(({ href, icon, label }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center justify-center gap-1 py-2 px-4 rounded-lg transition-colors"
            style={{ color: isActive(href) ? activeColor : "#9ca3af" }}
          >
            {icon}
            <span className="text-xs font-semibold">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
