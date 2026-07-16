"use client";

import { useState } from "react";
import { adminNotificationsApi, ApiError } from "@/lib/api";
import { Megaphone, Send, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

const inp = "w-full rounded-lg px-4 py-3 text-sm focus:outline-none transition-colors border"
  + " bg-[var(--bg-base)] border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-gray-600"
  + " focus:border-[var(--accent-indigo)]/50";

export default function BroadcastPage() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent_count: number } | null>(null);
  const [error, setError] = useState("");

  const canSend = title.trim().length > 0 && message.trim().length > 0;

  const handleSend = async () => {
    if (!canSend || sending) return;
    setSending(true);
    setError("");
    setResult(null);
    try {
      const res = await adminNotificationsApi.broadcast(title.trim(), message.trim());
      setResult({ sent_count: res.sent_count });
      setTitle("");
      setMessage("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to send notification");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-xl space-y-6 pb-24">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Megaphone size={18} style={{ color: "var(--accent-amber)" }} />
          <h1 className="font-headline text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>
            Broadcast Notification
          </h1>
        </div>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Send a message to all registered players. It will appear in their notification bell immediately.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg p-3 border text-sm"
          style={{ borderColor: "rgba(239,68,68,0.3)", backgroundColor: "rgba(239,68,68,0.05)", color: "#ef4444" }}>
          <AlertCircle size={15} className="flex-shrink-0" />
          {error}
        </div>
      )}

      {result && (
        <div className="flex items-center gap-2 rounded-lg p-3 border text-sm"
          style={{ borderColor: "rgba(76,111,255,0.3)", backgroundColor: "rgba(76,111,255,0.05)", color: "var(--accent-indigo)" }}>
          <CheckCircle size={15} className="flex-shrink-0" />
          Sent to {result.sent_count.toLocaleString()} player{result.sent_count !== 1 ? "s" : ""}
        </div>
      )}

      <div className="rounded-xl p-5 space-y-4 border"
        style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-hairline)" }}>
        <div>
          <label className="text-xs font-semibold uppercase tracking-widest block mb-1.5"
            style={{ color: "var(--text-secondary)" }}>
            Title
          </label>
          <input
            className={inp}
            placeholder="e.g. New Specials pack live!"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={80}
          />
          <p className="text-[10px] mt-1 text-right" style={{ color: "var(--text-muted)" }}>{title.length}/80</p>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-widest block mb-1.5"
            style={{ color: "var(--text-secondary)" }}>
            Message
          </label>
          <textarea
            className={inp + " resize-none"}
            rows={4}
            placeholder="e.g. A new Football Specials pack is live — ₦5,000 entry, ₦50,000 prize. One attempt only."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={300}
          />
          <p className="text-[10px] mt-1 text-right" style={{ color: "var(--text-muted)" }}>{message.length}/300</p>
        </div>

        {/* Preview */}
        {(title || message) && (
          <div className="rounded-lg p-3 border space-y-1"
            style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border-hairline)" }}>
            <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Preview</p>
            <div className="flex items-start gap-3 pt-1">
              <div className="w-7 h-7 rounded-lg bg-[#1A1A1A] flex items-center justify-center flex-shrink-0">
                <Megaphone size={13} style={{ color: "var(--accent-amber)" }} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white leading-tight">{title || "—"}</p>
                <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "var(--text-muted)" }}>{message || "—"}</p>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleSend}
          disabled={!canSend || sending}
          className="w-full py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-40 transition-all"
          style={{ backgroundColor: "var(--accent-amber)", color: "#000" }}
        >
          {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
          {sending ? "Sending..." : "Send to all players"}
        </button>
      </div>
    </div>
  );
}
