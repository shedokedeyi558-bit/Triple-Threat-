"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertCircle, CheckCircle, Info } from "lucide-react";

export type ToastType = "error" | "success" | "info" | "warning";

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration?: number; // ms, default 4000
}

// ── Singleton event bus ───────────────────────────────────────────────────
type ToastListener = (toast: ToastItem) => void;
const listeners: Set<ToastListener> = new Set();

export function showToast(message: string, type: ToastType = "info", duration = 4000) {
  const item: ToastItem = { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, message, type, duration };
  listeners.forEach((fn) => fn(item));
}

// ── Toast container (mount once in layout) ────────────────────────────────
export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const add = useCallback((t: ToastItem) => {
    setToasts((prev) => [...prev.slice(-4), t]); // max 5 visible
    const dur = t.duration ?? 4000;
    if (dur > 0) setTimeout(() => dismiss(t.id), dur);
  }, []);

  const dismiss = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  useEffect(() => {
    listeners.add(add);
    return () => { listeners.delete(add); };
  }, [add]);

  const icon = (type: ToastType) => {
    if (type === "error")   return <AlertCircle size={15} style={{ color: "#f87171", flexShrink: 0 }} />;
    if (type === "success") return <CheckCircle size={15} style={{ color: "#34d399", flexShrink: 0 }} />;
    if (type === "warning") return <AlertCircle size={15} style={{ color: "var(--accent-amber)", flexShrink: 0 }} />;
    return <Info size={15} style={{ color: "var(--accent-indigo)", flexShrink: 0 }} />;
  };

  const borderColor = (type: ToastType) => {
    if (type === "error")   return "rgba(248,113,113,0.3)";
    if (type === "success") return "rgba(52,211,153,0.3)";
    if (type === "warning") return "rgba(232,163,61,0.3)";
    return "rgba(76,111,255,0.3)";
  };

  return (
    <div style={{ position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)", zIndex: 9999, display: "flex", flexDirection: "column", gap: 8, width: "calc(100% - 32px)", maxWidth: 400, pointerEvents: "none" }}>
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            style={{
              display: "flex", alignItems: "flex-start", gap: 10,
              padding: "12px 14px", borderRadius: 10,
              backgroundColor: "#111", border: `1px solid ${borderColor(t.type)}`,
              boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
              pointerEvents: "all",
            }}
          >
            {icon(t.type)}
            <p style={{ fontSize: 13, color: "var(--text-primary)", flex: 1, margin: 0, lineHeight: 1.4 }}>{t.message}</p>
            <button onClick={() => dismiss(t.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, flexShrink: 0, color: "var(--text-muted)" }}>
              <X size={13} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
