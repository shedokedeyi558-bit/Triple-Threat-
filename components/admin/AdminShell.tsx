"use client";

import { useState } from "react";
import { useAdmin } from "@/context/AdminContext";
import { AdminSidebar } from "./AdminSidebar";
import { AdminLogin } from "./AdminLogin";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { state } = useAdmin();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      <div className="flex-1 lg:ml-56 flex flex-col min-h-screen">
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
          <span className="font-headline text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            bitlyfe admin
          </span>
          <div className="flex-1" />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg transition-colors"
            style={{
              color: "var(--text-secondary)",
            }}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </header>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-b px-4 py-3 space-y-2" style={{ borderColor: "var(--border-hairline)", backgroundColor: "var(--bg-base)" }}>
            <Link
              href="/admin/players"
              className="block px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ color: "var(--text-secondary)" }}
              onClick={() => setMobileMenuOpen(false)}
            >
              Players
            </Link>
            <Link
              href="/admin/withdrawals"
              className="block px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ color: "var(--text-secondary)" }}
              onClick={() => setMobileMenuOpen(false)}
            >
              Withdrawals
            </Link>
            <Link
              href="/admin/analytics"
              className="block px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ color: "var(--text-secondary)" }}
              onClick={() => setMobileMenuOpen(false)}
            >
              Analytics
            </Link>
            <Link
              href="/admin/settings"
              className="block px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ color: "var(--text-secondary)" }}
              onClick={() => setMobileMenuOpen(false)}
            >
              Settings
            </Link>
          </div>
        )}

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 lg:p-8 pb-20 lg:pb-8">
          {children}
        </main>
      </div>

      {/* ── MOBILE BOTTOM TAB NAR ── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 border-t px-0 h-16" style={{ borderColor: "var(--border-hairline)", backgroundColor: "var(--bg-base)" }}>
        <div className="flex items-center justify-around h-full">
          <Link
            href="/admin"
            className="flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-lg transition-colors flex-1"
            style={{ color: "var(--text-secondary)" }}
          >
            <span className="text-lg">🏠</span>
            <span className="text-[10px] font-semibold">Home</span>
          </Link>
          <Link
            href="/admin/players"
            className="flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-lg transition-colors flex-1"
            style={{ color: "var(--text-secondary)" }}
          >
            <span className="text-lg">👥</span>
            <span className="text-[10px] font-semibold">Players</span>
          </Link>
          <Link
            href="/admin/withdrawals"
            className="flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-lg transition-colors flex-1"
            style={{ color: "var(--text-secondary)" }}
          >
            <span className="text-lg">💸</span>
            <span className="text-[10px] font-semibold">Withdraw</span>
          </Link>
          <Link
            href="/admin/analytics"
            className="flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-lg transition-colors flex-1"
            style={{ color: "var(--text-secondary)" }}
          >
            <span className="text-lg">📊</span>
            <span className="text-[10px] font-semibold">Stats</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
