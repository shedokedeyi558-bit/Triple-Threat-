"use client";
import { useApp } from "@/context/AppContext";
import { Wallet, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Props {
  title?: string;
  showBack?: boolean;
  showWallet?: boolean;
}

export function NavBar({ title, showBack = false, showWallet = true }: Props) {
  const { state } = useApp();
  const router = useRouter();

  return (
    <div className="sticky top-0 z-30 bg-bg/95 backdrop-blur border-b border-[#1E1E1E] px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {showBack && (
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full hover:bg-[#1A1A1A] text-gray-400"
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
          </button>
        )}
        {title ? (
          <span className="font-bold text-white text-lg">{title}</span>
        ) : (
          <Link href="/" className="font-black text-neon text-xl uppercase tracking-tight">
            Triple Threat
          </Link>
        )}
      </div>
      {showWallet && state.isAuthenticated && (
        <Link
          href="/wallet"
          className="flex items-center gap-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3 py-1.5 text-sm font-semibold text-neon"
        >
          <Wallet size={16} />
          ₦{state.balance.toLocaleString()}
        </Link>
      )}
    </div>
  );
}
