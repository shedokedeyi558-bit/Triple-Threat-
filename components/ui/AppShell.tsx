"use client";

import { useApp } from "@/context/AppContext";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Gamepad2, Wallet, User, LogOut, Pill, Clock } from "lucide-react";
import { removeToken } from "@/lib/api";
import { useRouter } from "next/navigation";

const navItems = [
  { href: "/play",         label: "Play",         icon: Gamepad2 },
  { href: "/pills",        label: "Pill Packs",   icon: Pill },
  { href: "/time-machine", label: "Time Machine", icon: Clock },
  { href: "/wallet",       label: "Wallet",       icon: Wallet },
  { href: "/profile",      label: "Profile",      icon: User },
];

// Pages that should show the app shell (player-facing)
const SHELL_PATHS = ["/play", "/pills", "/blitz", "/wallet", "/profile", "/time-machine", "/predictions"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { state, dispatch } = useApp();
  const pathname = usePathname();
  const router = useRouter();

  const showShell = state.isAuthenticated && SHELL_PATHS.some((p) => pathname.startsWith(p));
  if (!showShell) return <>{children}</>;

  const isActive = (href: string) => {
    if (href === "/play") return pathname === "/play";
    return pathname.startsWith(href);
  };

  const handleLogout = () => {
    removeToken();
    dispatch({ type: "LOGOUT" });
    localStorage.removeItem("tt_player");
    router.push("/");
  };

  return (
    <div className="flex min-h-screen bg-[#0A0A0A]">

      {/* ── SIDEBAR — desktop only ── */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-60 bg-[#0D0D0D] border-r border-[#1A1A1A] z-40">
        {/* Logo */}
        <div className="px-6 py-6 border-b border-[#1A1A1A]">
          <Link href="/play" className="font-black text-2xl uppercase tracking-tight leading-none">
            <span className="text-white">BIT</span>
            <span className="text-neon">LYFE</span>
          </Link>
          <p className="text-gray-600 text-xs mt-1">Play Smart. Win Real.</p>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  active
                    ? "bg-neon/10 text-neon border border-neon/20"
                    : "text-gray-400 hover:text-white hover:bg-[#1A1A1A]"
                }`}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 pb-6 border-t border-[#1A1A1A] pt-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-gray-500 hover:text-red-400 hover:bg-red-900/10 transition-all"
          >
            <LogOut size={16} />
            Log Out
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 lg:ml-60 flex flex-col min-h-screen">
        {/* Top bar — desktop */}
        <header className="hidden lg:flex sticky top-0 z-30 bg-[#0A0A0A]/90 backdrop-blur-md border-b border-[#1A1A1A] px-8 py-4 items-center justify-between">
          <div>
            <h1 className="text-white font-black text-lg capitalize">
              {navItems.find((n) => isActive(n.href))?.label ?? "BitLyfe"}
            </h1>
          </div>
          <Link
            href="/wallet"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#141414] border border-[#1E1E1E] text-neon font-bold text-sm hover:border-neon/40 transition-colors"
          >
            <Wallet size={14} />
            ₦{state.player?.balance.toLocaleString() ?? "0"}
          </Link>
        </header>

        {/* Page content */}
        <main className="flex-1 pb-28 lg:pb-8">
          {children}
        </main>
      </div>

      {/* ── BOTTOM NAV — mobile only ── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#0A0A0A] border-t border-[#1A1A1A] z-40">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-xl transition-colors ${
                  active ? "text-neon" : "text-gray-500 hover:text-white"
                }`}
              >
                <Icon size={20} />
                <span className="text-[10px] font-semibold">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

    </div>
  );
}
