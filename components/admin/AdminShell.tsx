"use client";

import { useState } from "react";
import { useAdmin } from "@/context/AdminContext";
import { AdminSidebar } from "./AdminSidebar";
import { AdminLogin } from "./AdminLogin";
import { Menu } from "lucide-react";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { state } = useAdmin();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!state.isAuthenticated) {
    return <AdminLogin />;
  }

  return (
    <div className="min-h-dvh bg-bg flex">
      {/* Desktop sidebar */}
      <div className="hidden md:flex w-56 flex-col flex-shrink-0">
        <AdminSidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative z-10 w-64">
            <AdminSidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile topbar */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-[#1E1E1E] bg-bg">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl hover:bg-card text-gray-400"
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
          <span className="font-black uppercase tracking-tight text-lg leading-none">
            <span className="text-white">BIT</span>
            <span className="text-neon neon-text-glow">LYFE</span>
          </span>
        </div>

        <main className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
