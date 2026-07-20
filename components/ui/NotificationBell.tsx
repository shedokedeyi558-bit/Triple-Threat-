"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, Trophy, TrendingUp, AlertCircle, CheckCircle, Zap, Clock, Megaphone } from "lucide-react";
import { notificationsApi, type Notification } from "@/lib/api";

// ── Persistence key for dismissed IDs ────────────────────────────────────────
const DISMISSED_KEY = "tt_dismissed_notif_ids";

function getDismissed(): Set<string> {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
}

function saveDismissed(ids: Set<string>) {
  try {
    // Cap at 500 to prevent unbounded growth — keep newest entries
    const arr = Array.from(ids);
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(arr.slice(-500)));
  } catch { /* storage full — ignore */ }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function notifIcon(type: Notification["type"]) {
  switch (type) {
    case "win":                  return <Trophy size={14} style={{ color: "var(--accent-amber)" }} />;
    case "prediction_result":    return <TrendingUp size={14} className="text-purple-400" />;
    case "withdrawal_approved":  return <CheckCircle size={14} style={{ color: "var(--accent-indigo)" }} />;
    case "withdrawal_rejected":  return <AlertCircle size={14} className="text-red-400" />;
    case "blitz_starting":       return <Zap size={14} className="text-yellow-400" />;
    case "new_event":            return <Clock size={14} className="text-blue-400" />;
    case "announcement":         return <Megaphone size={14} style={{ color: "var(--accent-amber)" }} />;
    default:                     return <Bell size={14} className="text-gray-400" />;
  }
}

function formatTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (d > 0) return `${d}d ago`;
  if (h > 0) return `${h}h ago`;
  if (m > 0) return `${m}m ago`;
  return "Just now";
}

// ── Panel content (shared between mobile and desktop) ────────────────────────
function PanelContent({
  notifications,
  onDismiss,
  onClearAll,
  onClose,
}: {
  notifications: Notification[];
  onDismiss: (id: string) => void;
  onClearAll: () => void;
  onClose: () => void;
}) {
  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1A1A1A]">
        <p className="text-white font-bold text-sm">Notifications</p>
        <div className="flex items-center gap-2">
          {notifications.length > 0 && (
            <button
              onClick={onClearAll}
              className="text-[11px] font-semibold text-gray-500 hover:text-red-400 transition-colors px-2 py-1 rounded"
            >
              Clear all
            </button>
          )}
          <button onClick={onClose} className="text-gray-600 hover:text-white transition-colors p-1">
            <X size={15} />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="max-h-72 lg:max-h-80 overflow-y-auto">
        <AnimatePresence initial={false}>
          {notifications.length === 0 ? (
            <div className="py-10 text-center">
              <Bell size={24} className="text-gray-700 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No notifications</p>
            </div>
          ) : (
            <div className="divide-y divide-[#1A1A1A]">
              {notifications.map((n) => (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0, overflow: "hidden" }}
                  transition={{ duration: 0.18 }}
                  className={`flex items-start gap-3 px-4 py-3 transition-colors group ${!n.read ? "bg-[#4C6FFF]/[0.03]" : ""}`}
                >
                  <div className="w-7 h-7 rounded-lg bg-[#1A1A1A] flex items-center justify-center flex-shrink-0 mt-0.5">
                    {notifIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold leading-tight ${!n.read ? "text-white" : "text-gray-400"}`}>
                      {n.title}
                    </p>
                    <p className="text-gray-600 text-xs mt-0.5 leading-relaxed">{n.message}</p>
                    <p className="text-gray-700 text-[10px] mt-1">{formatTime(n.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
                    {!n.read && (
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "var(--accent-indigo)" }} />
                    )}
                    {/* Dismiss X — always visible on touch, hover-only on desktop */}
                    <button
                      onClick={() => onDismiss(n.id)}
                      aria-label="Dismiss notification"
                      className="w-5 h-5 rounded flex items-center justify-center text-gray-700 hover:text-gray-300 hover:bg-white/5 transition-colors opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                    >
                      <X size={11} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  // Filter out dismissed IDs before setting state
  const applyDismissed = useCallback((all: Notification[]): Notification[] => {
    const dismissed = getDismissed();
    return dismissed.size === 0 ? all : all.filter((n) => !dismissed.has(n.id));
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await notificationsApi.getAll();
      const visible = applyDismissed(res.notifications);
      setNotifications(visible);
      // Recalculate unread from visible set only
      setUnread(visible.filter((n) => !n.read).length);
    } catch { /* silent */ }
  }, [applyDismissed]);

  useEffect(() => {
    fetchNotifications();
    const id = setInterval(fetchNotifications, 30000);
    return () => clearInterval(id);
  }, [fetchNotifications]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleOpen = async () => {
    const next = !open;
    setOpen(next);
    // Always re-fetch fresh notifications when opening the panel
    if (next) {
      fetchNotifications().then(() => {
        // After fresh fetch, mark all unread as read server-side
        if (unread > 0) {
          notificationsApi.markRead().catch(() => {});
          setUnread(0);
          setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        }
      });
    }
  };

  const handleDismiss = (id: string) => {
    // 1. Remove from visible list immediately
    setNotifications((prev) => {
      const next = prev.filter((n) => n.id !== id);
      setUnread(next.filter((n) => !n.read).length);
      return next;
    });
    // 2. Persist dismissed ID so the 30s poll doesn't resurface it
    const dismissed = getDismissed();
    dismissed.add(id);
    saveDismissed(dismissed);
    // 3. Best-effort mark-read on backend (no delete endpoint exists)
    notificationsApi.markRead(id).catch(() => {});
  };

  const handleClearAll = () => {
    // Persist all current IDs as dismissed
    const dismissed = getDismissed();
    notifications.forEach((n) => dismissed.add(n.id));
    saveDismissed(dismissed);
    // Mark all read on backend (best-effort)
    notificationsApi.markRead().catch(() => {});
    // Clear local state
    setNotifications([]);
    setUnread(0);
  };

  const panelProps = {
    notifications,
    onDismiss: handleDismiss,
    onClearAll: handleClearAll,
    onClose: () => setOpen(false),
  };

  return (
    <div ref={ref} className="relative">
      {/* Bell button */}
      <button
        onClick={handleOpen}
        className="relative w-9 h-9 rounded-xl bg-[#141414] border border-[#1E1E1E] flex items-center justify-center hover:border-[#4C6FFF]/30 transition-colors"
      >
        <Bell size={16} className="text-gray-400" />
        {unread > 0 && (
          <span
            className="absolute -top-1 -right-1 w-4 h-4 text-white text-[9px] font-black rounded-full flex items-center justify-center"
            style={{ backgroundColor: "var(--accent-indigo)" }}
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Mobile overlay */}
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="lg:hidden fixed left-2 right-2 bg-[#111] border border-[#1E1E1E] rounded-2xl overflow-hidden shadow-2xl z-50"
              style={{ top: 64 }}
            >
              <PanelContent {...panelProps} />
            </motion.div>

            {/* Desktop dropdown */}
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="hidden lg:block absolute right-0 top-12 w-80 bg-[#111] border border-[#1E1E1E] rounded-2xl overflow-hidden shadow-2xl z-50"
            >
              <PanelContent {...panelProps} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
