"use client";

import { useApp } from "@/context/AppContext";
import { Wallet } from "lucide-react";
import Link from "next/link";
import { removeToken } from "@/lib/api";

interface Props {
  title?: string;
  showWallet?: boolean;
}

export function NavBar({ title, showWallet = true }: Props) {
  const { state } = useApp();

  return (
    <div className="sticky top-0 z-30 bg-black/50 backdrop-blur-md border-b border-gray-900 px-4 sm:px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {title ? (
          <span className="font-bold text-white text-lg">{title}</span>
        ) : (
          <Link href="/" className="font-black uppercase tracking-tight text-xl leading-none flex-shrink-0">
            <span className="text-white">BIT</span>
            <span className="text-[#00FF66] neon-text-glow">LYFE</span>
          </Link>
        )}
      </div>

      <div className="flex items-center gap-3">
        {showWallet && state.isAuthenticated && state.player && (
          <Link
            href="/wallet"
            className="flex items-center gap-2 bg-gray-900 border border-gray-800 hover:border-[#00FF66]/40 rounded-xl px-4 py-2 text-sm font-semibold text-[#00FF66] transition-colors"
          >
            <Wallet size={16} />
            ₦{state.player.balance.toLocaleString()}
          </Link>
        )}
        
        {state.isAuthenticated && (
          <button
            onClick={() => {
              removeToken();
              window.location.href = "/auth";
            }}
            className="px-4 py-2 text-sm font-semibold text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors"
          >
            Logout
          </button>
        )}
      </div>
    </div>
  );
}
