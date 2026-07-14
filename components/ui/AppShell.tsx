"use client";

import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Pill, CalendarClock, Wallet, User, LogOut, Loader2 } from "lucide-react";
import { removeToken } from "@/lib/api";
import { useRouter } from "next/navigation";
import { NotificationBell } from "@/components/ui/NotificationBell";

const navItems = [
  { href: "/pills",   label: "Pills",   icon: Pill },
  { href: "/events",  label: "Events",  icon: CalendarClock },
  { href: "/wallet",  label: "Wallet",  icon: Wallet },
  { href: "/profile", label: "Profile", icon: User },
];

// Pages that render the app shell (player-facing)
const SHELL_PATHS = ["/pills", "/events", "/blitz", "/wallet", "/profile", "/time-machine", "/predictions"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { state, dispatch, hydrated } = useApp();
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const isProtected = SHELL_PATHS.some((p) => pathname.startsWith(p));

  if (!hydrated && isProtected) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: "rgba(76,111,255,0.3)", borderTopColor: "var(--accent-indigo)" }} />
      </div>
    );
  }

  const showShell = state.isAuthenticated && isProtected;
  if (!showShell) return <>{children}</>;

  const isActive = (href: string) => {
    if (href === "/pills")  return pathname === "/pills" || pathname.startsWith("/pills/");
    if (href === "/events") return pathname === "/events" || pathname.startsWith("/predictions") || pathname.startsWith("/time-machine");
    return pathname.startsWith(href);
  };

  const handleLogout = () => {
    if (loggingOut) return;
    setLoggingOut(true);
    removeToken();
    dispatch({ type: "LOGOUT" });
    localStorage.removeItem("tt_player");
    router.push("/");
  };

  return (
    <div className="flex min-h-screen bg-[--bg-base]" style={{ backgroundColor: "var(--bg-base)" }}>

      {/* ── ICON RAIL — desktop only ── */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-16 bg-[--bg-card] border-r z-40"
        style={{ borderColor: "var(--border-hairline)", backgroundColor: "var(--bg-card)" }}>
        {/* Logo */}
        <div className="px-3 py-5 border-b flex items-center justify-center" style={{ borderColor: "var(--border-hairline)" }}>
          <Link href="/pills" className="flex items-center justify-center w-8 h-8">
            <Image src="/bitlyfe-mark.svg" alt="BitLyfe" width={28} height={28} priority />
          </Link>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-2 py-4 space-y-4 flex flex-col items-center">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className="w-10 h-10 flex items-center justify-center rounded-lg transition-all relative group"
                style={{
                  backgroundColor: active ? "var(--accent-amber)" : "transparent",
                  color: active ? "#000" : "var(--text-secondary)",
                  borderLeft: active ? "3px solid var(--accent-amber)" : "3px solid transparent",
                }}
                title={label}
              >
                <Icon size={18} />
                <div className="absolute left-12 bg-black px-2 py-1 rounded text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" style={{ color: "var(--text-primary)" }}>
                  {label}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-2 pb-6">
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-10 h-10 flex items-center justify-center rounded-lg transition-all text-red-600 hover:bg-red-900/20 relative group disabled:opacity-60"
            title="Log out"
          >
            {loggingOut ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
            <div className="absolute left-12 bg-black px-2 py-1 rounded text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" style={{ color: "var(--text-primary)" }}>
              Log out
            </div>
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 lg:ml-16 flex flex-col min-h-screen">
        {/* Top bar — desktop */}
        <header className="hidden lg:flex sticky top-0 z-30 bg-[--bg-base]/90 backdrop-blur-md border-b px-8 py-4 items-center justify-between"
          style={{ borderColor: "var(--border-hairline)", backgroundColor: "var(--bg-base)" }}>
          <h1 className="font-headline text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
            {navItems.find((n) => isActive(n.href))?.label ?? "BitLyfe"}
          </h1>
          <div className="flex items-center gap-4">
            <Link href="/wallet" className="flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors"
              style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-card)" }}>
              <span className="font-mono font-semibold text-sm" style={{ color: "var(--accent-amber)" }}>
                ₦{state.player?.balance.toLocaleString() ?? "0"}
              </span>
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0" style={{ backgroundColor: "var(--accent-amber)", color: "#000" }}>+</span>
            </Link>
            <NotificationBell />
          </div>
        </header>

        {/* Top bar — mobile only */}
        <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 border-b"
          style={{ borderColor: "var(--border-hairline)", backgroundColor: "var(--bg-base)" }}>
          <Link href="/pills" className="flex items-center justify-center w-7 h-7">
            <Image src="/bitlyfe-mark.svg" alt="BitLyfe" width={24} height={24} priority />
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/wallet" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border"
              style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-card)" }}>
              <span className="font-mono font-semibold text-sm" style={{ color: "var(--accent-amber)" }}>
                ₦{state.player?.balance.toLocaleString() ?? "0"}
              </span>
              <span className="w-4 h-4 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0" style={{ backgroundColor: "var(--accent-amber)", color: "#000" }}>+</span>
            </Link>
            <NotificationBell />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 pb-28 lg:pb-8 overflow-x-hidden">
          {children}
        </main>
      </div>

      {/* ── BOTTOM TAB NAV — mobile only ── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t"
        style={{ borderColor: "var(--border-hairline)", backgroundColor: "var(--bg-base)" }}>
        <div className="flex items-center justify-around h-16">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-lg transition-colors flex-1"
                style={{ color: active ? "var(--accent-amber)" : "var(--text-muted)" }}
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
