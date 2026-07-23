"use client";
// Single-screen password reset — no OTP step

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authApi, setToken, ApiError } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, AlertCircle, Loader, Check, ArrowLeft, Eye, EyeOff } from "lucide-react";

const inputStyle = {
  borderColor: "var(--border-subtle)",
  backgroundColor: "var(--bg-card)",
  color: "var(--text-primary)",
};

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { dispatch } = useApp();

  const [phone, setPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const canSubmit =
    phone.length === 10 &&
    newPassword.length >= 6 &&
    newPassword === confirmPassword &&
    !loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setError(null);
    try {
      const response = await authApi.resetPassword(`+234${phone}`, newPassword);

      setToken(response.token);
      dispatch({
        type: "LOGIN",
        player: {
          id: response.player.id,
          phone: response.player.phone,
          name: response.player.name,
          email: "",
          balance: response.player.balance,
        },
        token: response.token,
      });

      setSuccess(true);
      setTimeout(() => router.push("/pills"), 1500);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-white flex flex-col lg:flex-row"
      style={{ backgroundColor: "var(--bg-base)" }}>

      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-50 flex items-center gap-3 px-4 py-4 border-b"
        style={{ borderColor: "var(--border-hairline)", backgroundColor: "var(--bg-base)" }}>
        <Link href="/signin" className="hover:opacity-80">
          <ArrowLeft size={20} style={{ color: "var(--text-secondary)" }} />
        </Link>
        <div className="flex items-center gap-2">
          <img src="/bitlyfe-mark.svg" alt="BitLyfe" width={24} height={24} />
          <span className="font-headline text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            bitlyfe
          </span>
        </div>
      </div>

      {/* Desktop left panel */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="hidden lg:flex w-[45%] flex-col justify-between p-12 border-r"
        style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-hairline)" }}>
        <div className="flex items-center gap-2">
          <img src="/bitlyfe-mark.svg" alt="BitLyfe" width={28} height={28} />
          <span className="font-headline text-base font-semibold" style={{ color: "var(--text-primary)" }}>
            bitlyfe
          </span>
        </div>
        <div className="space-y-6">
          <div className="font-mono text-xs tracking-widest" style={{ color: "var(--accent-amber)" }}>
            REAL STAKES, REAL FAST
          </div>
          <h2 className="font-headline text-3xl font-semibold leading-tight"
            style={{ color: "var(--text-primary)" }}>
            Set a new password.
          </h2>
        </div>
        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>© 2026 bitlyfe</p>
      </motion.div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 lg:py-12 lg:pr-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm">

          <AnimatePresence mode="wait">
            {!success ? (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="space-y-2 mb-8">
                  <h1 className="font-headline text-2xl lg:text-3xl font-semibold"
                    style={{ color: "var(--text-primary)" }}>
                    Forgot password?
                  </h1>
                  <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                    Enter your phone number and choose a new password.
                  </p>
                </div>

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="border rounded-lg p-3 flex gap-3 items-start mb-6"
                      style={{ ...inputStyle, backgroundColor: "rgba(239,68,68,0.05)" }}>
                      <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-400">{error}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Phone */}
                  <div>
                    <label className="block text-xs font-semibold mb-2 uppercase tracking-wider"
                      style={{ color: "var(--text-secondary)" }}>
                      Phone Number
                    </label>
                    <div className="flex items-center gap-2 border rounded-lg px-4 py-3 transition-colors"
                      style={inputStyle}>
                      <span className="font-mono text-sm" style={{ color: "var(--text-secondary)" }}>+234</span>
                      <input
                        type="tel"
                        placeholder="801 234 5678"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(-10))}
                        maxLength={10}
                        className="flex-1 bg-transparent outline-none text-base"
                        style={{ color: "var(--text-primary)" }}
                        autoComplete="tel"
                      />
                    </div>
                  </div>

                  {/* New password */}
                  <div>
                    <label className="block text-xs font-semibold mb-2 uppercase tracking-wider"
                      style={{ color: "var(--text-secondary)" }}>
                      New Password
                    </label>
                    <div className="flex items-center gap-2 border rounded-lg px-4 py-3 transition-colors" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-card)", color: "var(--text-primary)" }}>
                      <input
                        type={showNewPass ? "text" : "password"}
                        placeholder="Min 6 characters"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="flex-1 bg-transparent outline-none text-base"
                      />
                      <button type="button" onClick={() => setShowNewPass(v => !v)} className="flex-shrink-0" style={{ color: "var(--text-secondary)" }} tabIndex={-1}>
                        {showNewPass ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm */}
                  <div>
                    <label className="block text-xs font-semibold mb-2 uppercase tracking-wider"
                      style={{ color: "var(--text-secondary)" }}>
                      Confirm New Password
                    </label>
                    <div className="flex items-center gap-2 border rounded-lg px-4 py-3 transition-colors" style={{ borderColor: confirmPassword && confirmPassword !== newPassword ? "rgba(239,68,68,0.6)" : "var(--border-subtle)", backgroundColor: "var(--bg-card)", color: "var(--text-primary)" }}>
                      <input
                        type={showConfirmPass ? "text" : "password"}
                        placeholder="Repeat password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="flex-1 bg-transparent outline-none text-base"
                      />
                      <button type="button" onClick={() => setShowConfirmPass(v => !v)} className="flex-shrink-0" style={{ color: "var(--text-secondary)" }} tabIndex={-1}>
                        {showConfirmPass ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {confirmPassword && confirmPassword !== newPassword && (
                      <p className="text-xs mt-1 text-red-400">Passwords don&apos;t match</p>
                    )}
                    {confirmPassword && confirmPassword === newPassword && newPassword.length >= 6 && (
                      <p className="text-xs mt-1" style={{ color: "var(--accent-amber)" }}>Passwords match</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={!canSubmit}
                    className="w-full py-3 font-semibold rounded-lg transition-all flex items-center justify-center gap-2 mt-6"
                    style={{
                      backgroundColor: "var(--accent-amber)",
                      color: "#412403",
                      cursor: canSubmit ? "pointer" : "not-allowed",
                      opacity: canSubmit ? 1 : 0.45,
                    }}>
                    {loading ? <Loader size={18} className="animate-spin" /> : null}
                    {loading ? "Updating..." : <>Reset Password <ArrowRight size={18} /></>}
                  </button>
                </form>

                <div className="text-center border-t pt-6 mt-8" style={{ borderColor: "var(--border-hairline)" }}>
                  <Link href="/signin" className="text-xs font-semibold hover:underline"
                    style={{ color: "var(--accent-amber)" }}>
                    Back to sign in
                  </Link>
                </div>
              </motion.div>
            ) : (
              /* Success */
              <motion.div key="success"
                initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-6 py-12">
                <motion.div
                  initial={{ scale: 0, rotate: -15 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.15, type: "spring", stiffness: 280, damping: 18 }}
                  className="relative mx-auto w-20 h-20 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: "rgba(232,163,61,0.12)", border: "1.5px solid rgba(232,163,61,0.35)" }}>
                  <motion.div
                    animate={{ opacity: [0.4, 0.8, 0.4], scale: [1, 1.15, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 rounded-2xl"
                    style={{ backgroundColor: "rgba(232,163,61,0.15)", filter: "blur(8px)" }} />
                  <Check size={36} style={{ color: "var(--accent-amber)", position: "relative" }} strokeWidth={2.5} />
                </motion.div>
                <div>
                  <p className="font-headline text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                    Password updated!
                  </p>
                  <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                    Taking you in...
                  </p>
                </div>
                <div className="flex gap-1.5 justify-center">
                  {[0, 1, 2].map((i) => (
                    <motion.div key={i}
                      animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                      transition={{ delay: i * 0.15, duration: 0.8, repeat: Infinity }}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: "var(--accent-amber)" }} />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
