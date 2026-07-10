"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAdmin } from "@/context/AdminContext";
import { removeAdminToken } from "@/lib/api";
import Image from "next/image";
import {
  LayoutDashboard, Users, CreditCard,
  BarChart2, Settings, LogOut, Package, Clock, Zap
} from "lucide-react";

interface NavGroup {
  name?: string;
  items: Array<{
    href: string;
    label: string;
    icon: React.ComponentType<any>;
    color?: string;
  }>;
}

const navGroups: NavGroup[] = [
  {
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/players", label: "Players", icon: Users },
      { href: "/admin/withdrawals", label: "Withdrawals", icon: CreditCard },
    ],
  },
  {
    name: "Games",
    items: [
      { href: "/admin/pills", label: "Pill Packs", icon: Package, color: "var(--accent-indigo)" },
      { href: "/admin/predictions", label: "Time Machine", icon: Clock, color: "var(--accent-violet)" },
      { href: "/admin/blitz", label: "Blitz", icon: Zap, color: "var(--accent-amber)" },
    ],
  },
  {
    name: "System",
    items: [
      { href: "/admin/analytics", label: "Analytics", icon: BarChart2 },
      { href: "/admin/settings", label: "Settings", icon: Settings },
    ],
  },
];

export function AdminSidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const { dispatch } = useAdmin();

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  return (
    <div className="h-full flex flex-col p-4">
      {/* Logo */}
      <div className="flex items-center gap-3 px-3 py-4 mb-6 border-b" style={{ borderColor: "var(--border-hairline)" }}>
        <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
          <Image
            src="/bitlyfe-mark.svg"
            alt="BitLyfe"
            width={28}
            height={28}
          />
        </div>
        <div>
          <div className="font-headline text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            bitlyfe admin
          </div>
          <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
            Control panel
          </div>
        </div>
      </div>

      {/* Nav Groups */}
      <nav className="flex-1 overflow-y-auto space-y-6">
        {navGroups.map((group, groupIdx) => (
          <div key={groupIdx}>
            {group.name && (
              <div
                className="text-xs font-semibold uppercase tracking-widest px-3 mb-2"
                style={{ color: "var(--text-muted)" }}
              >
                {group.name}
              </div>
            )}
            <div className="space-y-1">
              {group.items.map(({ href, label, icon: Icon, color }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={onClose}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all relative"
                    style={{
                      backgroundColor: active ? "var(--bg-base)" : "transparent",
                      color: active ? "var(--text-primary)" : "var(--text-secondary)",
                      borderLeft: active ? "2px solid var(--accent-indigo)" : "2px solid transparent",
                    }}
                  >
                    <Icon
                      size={16}
                      style={{
                        color: active && color ? color : "currentColor",
                      }}
                    />
                    <span className="text-sm font-medium">{label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div className="border-t pt-4" style={{ borderColor: "var(--border-hairline)" }}>
        <button
          onClick={() => {
            removeAdminToken();
            dispatch({ type: "ADMIN_LOGOUT" });
          }}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg w-full transition-all text-red-500 hover:bg-red-900/10"
        >
          <LogOut size={16} />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
}
