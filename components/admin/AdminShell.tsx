"use client";

import { useState } from "react";
import { useAdmin } from "@/context/AdminContext";
import { AdminSidebar } from "./AdminSidebar";
import { AdminLogin } from "./AdminLogin";
import { Menu, X, Package, Clock, Zap, Settings, Home, Users, CreditCard, BarChart2, LogOut } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { removeAdminToken } from "@/lib/api";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { state, dispatch } = useAdmin();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const pathname = usePathname();

  const handleLogout = () => {
    removeAdminToken();
    dispatch({ type: "ADMIN_LOGOUT" });
  };

  if (!state.isAuthenticated) {
    return <AdminLogin />;
  }

  return (
    <div className="min-h-dvh flex" style={{ backgroundColor: "var(--bg-base)" }}>
      {/* ── DESKTOP SIDEBAR ── */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-56 border-r" style={{ borderColor: "var(--border-hairline)", backgroundColor: "var(--bg-card)" }}>
        <AdminSidebar />
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 min-w-0 lg:ml-56 flex flex-col min-h-screen">
        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-4 border-b" style={{ borderColor: "var(--border-hairline)", backgroundColor: "var(--bg-base)" }}>
          <Link href="/admin" className="w-8 h-8 flex items-center justify-center flex-shrink-0">
            <Image
              src="/bitlyfe-mark.svg"
              alt="BitLyfe"
              width={28}
              height={28}
            />
          </Link>
          <span className="font-headline text-sm font-semibold min-w-0 truncate" style={{ color: "var(--text-primary)" }}>
            bitlyfe admin
          </span>
          <div className="flex-1 min-w-0" />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg transition-colors flex-shrink-0"
            style={{ color: "var(--text-secondary)" }}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </header>

        {/* Mobile menu dropdown — only items NOT in the bottom tab bar */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-b px-4 py-3 space-y-1" style={{ borderColor: "var(--border-hairline)", backgroundColor: "var(--bg-base)" }}>
            <p className="text-[10px] font-semibold uppercase tracking-widest px-3 pb-1" style={{ color: "var(--text-muted)" }}>Games</p>
            <Link
              href="/admin/pills"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ color: "var(--text-secondary)" }}
              onClick={() => setMobileMenuOpen(false)}
            >
              <Package size={14} style={{ color: "var(--accent-indigo)" }} /> Pill Packs
            </Link>
            <Link
              href="/admin/predictions"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ color: "var(--text-secondary)" }}
              onClick={() => setMobileMenuOpen(false)}
            >
              <Clock size={14} style={{ color: "var(--accent-violet)" }} /> Time Machine
            </Link>
            <Link
              href="/admin/blitz"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ color: "var(--text-secondary)" }}
              onClick={() => setMobileMenuOpen(false)}
            >
              <Zap size={14} style={{ color: "var(--accent-amber)" }} /> Blitz
            </Link>
            <div className="pt-2 border-t" style={{ borderColor: "var(--border-hairline)" }}>
              <Link
                href="/admin/settings"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{ color: "var(--text-secondary)" }}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Settings size={14} /> Settings
              </Link>
              <button
                onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full text-red-500 hover:bg-red-900/10"
              >
                <LogOut size={14} /> Log out
              </button>
            </div>
          </div>
        )}

        {/* Page content */}
        <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden p-4 lg:p-8 pb-20 lg:pb-8">
          {children}
        </main>
      </div>

      {/* ── MOBILE BOTTOM TAB BAR ── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t" style={{ borderColor: "var(--border-hairline)", backgroundColor: "var(--bg-base)" }}>
        <div className="flex items-center justify-around h-16">
          {[
            { href: "/admin", icon: Home, label: "Home", exact: true },
            { href: "/admin/players", icon: Users, label: "Players", exact: false },
            { href: "/admin/withdrawals", icon: CreditCard, label: "Withdraw", exact: false },
            { href: "/admin/analytics", icon: BarChart2, label: "Stats", exact: false },
          ].map(({ href, icon: Icon, label, exact }) => {
            const isActive = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-lg flex-1 transition-all active:scale-90 active:opacity-60"
                style={{ color: isActive ? "var(--accent-amber)" : "var(--text-muted)" }}
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
