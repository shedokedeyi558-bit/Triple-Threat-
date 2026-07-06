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

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#0A0A0A] border-t border-[#2A2A2A] z-40 lg:hidden">
      <div className="max-w-lg mx-auto flex items-center justify-around h-20 px-4">
        <Link
          href="/play"
          className={`flex flex-col items-center justify-center gap-1 py-2 px-4 rounded-lg transition-colors ${
            isActive("/play")
              ? "text-neon"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <Gamepad2 size={24} />
          <span className="text-xs font-semibold">Play</span>
        </Link>

        <Link
          href="/wallet"
          className={`flex flex-col items-center justify-center gap-1 py-2 px-4 rounded-lg transition-colors ${
            isActive("/wallet")
              ? "text-neon"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <Wallet size={24} />
          <span className="text-xs font-semibold">Wallet</span>
        </Link>

        <Link
          href="/profile"
          className={`flex flex-col items-center justify-center gap-1 py-2 px-4 rounded-lg transition-colors ${
            isActive("/profile")
              ? "text-neon"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <User size={24} />
          <span className="text-xs font-semibold">Profile</span>
        </Link>
      </div>
    </nav>
  );
}
