"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gamepad2, Wallet, User } from "lucide-react";
import { useApp } from "@/context/AppContext";

export function BottomNav() {
  const pathname = usePathname();
  const { state } = useApp();

  // Only show if authenticated
  if (!state.isAuthenticated) {
    return null;
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  const navItems = [
    { href: "/play", icon: Gamepad2, label: "Play" },
    { href: "/wallet", icon: Wallet, label: "Wallet" },
    { href: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#1A1A1A] border-t border-[#2A2A2A]">
      <div className="max-w-md mx-auto flex">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center py-4 px-3 gap-1 transition-colors ${
                active
                  ? "text-neon"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              <Icon size={24} />
              <span className="text-xs font-semibold">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
