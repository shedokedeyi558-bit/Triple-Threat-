"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAdmin } from "@/context/AdminContext";
import {
  LayoutDashboard, FileQuestion, DoorOpen, Users, CreditCard,
  BarChart2, Settings, LogOut, X
} from "lucide-react";

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/questions", label: "Questions", icon: FileQuestion },
  { href: "/admin/doors", label: "Door Settings", icon: DoorOpen },
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
          <div className="text-neon font-black text-base uppercase tracking-tight">Triple Threat</div>
          <div className="text-gray-500 text-xs mt-0.5">Admin Panel</div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400">
            <X size={18} />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-1">
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
        onClick={() => dispatch({ type: "ADMIN_LOGOUT" })}
        className="sidebar-link text-red-400 hover:text-red-300 hover:bg-red-900/20 mt-2"
      >
        <LogOut size={17} />
        Logout
      </button>
    </div>
  );
}
