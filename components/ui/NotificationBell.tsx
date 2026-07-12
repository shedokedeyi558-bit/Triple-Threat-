"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, Trophy, TrendingUp, AlertCircle, CheckCircle, Zap, Clock } from "lucide-react";
import { notificationsApi, type Notification } from "@/lib/api";

function notifIcon(type: Notification["type"]) {
  switch (type) {
    case "win":                  return <Trophy size={14} style={{ color: "var(--accent-amber)" }} />;
    case "prediction_result":    return <TrendingUp size={14} className="text-purple-400" />;
    case "withdrawal_approved":  return <CheckCircle size={14} style={{ color: "var(--accent-indigo)" }} />;
    case "withdrawal_rejected":  return <AlertCircle size={14} className="text-red-400" />;
    case "blitz_starting":       return <Zap size={14} className="text-yellow-400" />;
    case "new_event":            return <Clock size={14} className="text-blue-400" />;
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

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotifications();
    const id = setInterval(fetchNotifications, 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await notificationsApi.getAll();
      setNotifications(res.notifications);
      setUnread(res.unread_count);
    } catch { /* silent */ }
  };

  const handleOpen = async () => {
    setOpen((v) => !v);
    if (!open && unread > 0) {
      setLoading(true);
      try {
        await notificationsApi.markRead();
        setUnread(0);
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      } catch { /* silent */ }
      finally { setLoading(false); }
    }
  };

  return (
    <div ref={ref} className="relative">
      <button onClick={handleOpen}
        className="relative w-9 h-9 rounded-xl bg-[#141414] border border-[#1E1E1E] flex items-center justify-center hover:border-[#4C6FFF]/30 transition-colors">
        <Bell size={16} className="text-gray-400" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 text-white text-[9px] font-black rounded-full flex items-center justify-center" style={{ backgroundColor: "var(--accent-indigo)" }}>
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-12 w-80 bg-[#111] border border-[#1E1E1E] rounded-2xl overflow-hidden shadow-2xl z-50"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#1A1A1A]">
              <p className="text-white font-bold text-sm">Notifications</p>
              <button onClick={() => setOpen(false)} className="text-gray-600 hover:text-white transition-colors">
                <X size={15} />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-[#1A1A1A]">
              {notifications.length === 0 ? (
                <div className="py-10 text-center">
                  <Bell size={24} className="text-gray-700 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">No notifications yet</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div key={n.id} className={`flex items-start gap-3 px-4 py-3 transition-colors ${!n.read ? "bg-[#4C6FFF]/[0.03]" : ""}`}>
                    <div className="w-7 h-7 rounded-lg bg-[#1A1A1A] flex items-center justify-center flex-shrink-0 mt-0.5">
                      {notifIcon(n.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold leading-tight ${!n.read ? "text-white" : "text-gray-400"}`}>{n.title}</p>
                      <p className="text-gray-600 text-xs mt-0.5 leading-relaxed">{n.message}</p>
                      <p className="text-gray-700 text-[10px] mt-1">{formatTime(n.created_at)}</p>
                    </div>
                    {!n.read && <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-2" style={{ backgroundColor: "var(--accent-indigo)" }} />}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
