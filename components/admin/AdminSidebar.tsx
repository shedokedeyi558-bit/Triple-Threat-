"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAdmin } from "@/context/AdminContext";
import { removeAdminToken } from "@/lib/api";
import {
  LayoutDashboard, Users, CreditCard,
  BarChart2, Settings, LogOut, X, Plus, Zap
} from "lucide-react";

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/blitz", label: "Blitz", icon: Zap },
  { href: "/admin/games/create", label: "Create Game", icon: Plus },
  { href: "/admin/players", label: "Players", icon: Users },
  { href: "/admin/withdrawals", label: "Withdrawals", icon: CreditCard },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart2 },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminSidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const { dispatch } = useAdmin();

  return (
    <div className="h-full bg-[#111] border-r border-[#1E1E1E] flex flex-col p-3">
      <div className="flex items-center justify-between px-2 py-3 mb-4">
        <div>
          <div className="font-black uppercase tracking-tight text-base leading-none">
            <span className="text-white">BIT</span>
            <span className="text-neon neon-text-glow">LYFE</span>
          </div>
          <div className="text-gray-500 text-xs mt-1">Admin Panel</div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400">
            <X size={18} />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto space-y-1 py-2 pr-2">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={`sidebar-link ${active ? "active" : ""}`}
            >
              <Icon size={17} />
              {label}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={() => { removeAdminToken(); dispatch({ type: "ADMIN_LOGOUT" }); }}
        className="sidebar-link text-red-400 hover:text-red-300 hover:bg-red-900/20 flex-shrink-0"
      >
        <LogOut size={17} />
        Logout
      </button>
    </div>
  );
}
