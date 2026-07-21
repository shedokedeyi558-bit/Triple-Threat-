"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authApi, ApiError } from "@/lib/api";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, AlertCircle, Loader, Check, ArrowLeft } from "lucide-react";

type ForgotStep = "phone" | "reset" | "success";

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [step, setStep] = useState<ForgotStep>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputStyle = {
    borderColor: "var(--border-subtle)",
    backgroundColor: "var(--bg-card)",
    color: "var(--text-primary)",
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length !== 10) {
      setError("Enter a valid 10-digit phone number");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await authApi.forgotPassword(`+234${phone}`);
      setStep("reset");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to send reset code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError("Enter the 6-digit code");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await authApi.resetPassword(`+234${phone}`, otp, newPassword);
      setStep("success");
      setTimeout(() => router.push("/signin"), 2500);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Reset failed. Please check your code and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen text-white flex flex-col lg:flex-row"
      style={{ backgroundColor: "var(--bg-base)" }}
    >
      {/* Mobile top bar */}
      <div
        className="lg:hidden sticky top-0 z-50 flex items-center gap-3 px-4 py-4 border-b"
        style={{ borderColor: "var(--border-hairline)", backgroundColor: "var(--bg-base)" }}
      >
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
        style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-hairline)" }}
      >
        <div className="flex items-center gap-2">
          <img src="/bitlyfe-mark.svg" alt="BitLyfe" width={28} height={28} />
          <span className="font-headline text-base font-semibold" style={{ color: "var(--text-primary)" }}>
            bitlyfe
          </span>
        </div>
        <div className="space-y-8">
          <div className="font-mono text-xs tracking-widest" style={{ color: "var(--accent-amber)" }}>
            REAL STAKES, REAL FAST
          </div>
          <div>
            <h2
              className="font-headline text-3xl font-semibold leading-tight mb-6"
              style={{ color: "var(--text-primary)" }}
            >
              Reset your password.
            </h2>
            <div className="space-y-3">
              {[
                { label: "Pills", color: "var(--accent-indigo)" },
                { label: "Time Machine", color: "var(--accent-violet)" },
                { label: "Blitz", color: "var(--accent-amber)" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
          © 2026 bitlyfe
        </p>
      </motion.div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 lg:py-12 lg:pr-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm"
        >
          <AnimatePresence mode="wait">
            {/* ── STEP 1: PHONE ── */}
            {step === "phone" && (
              <motion.div
                key="phone"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <div>
                  <h1
                    className="font-headline text-2xl lg:text-3xl font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Forgot password?
                  </h1>
                  <p className="text-sm mt-2" style={{ color: "var(--text-secondary)" }}>
                    Enter your phone number and we&apos;ll send you a reset code.
                  </p>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="border rounded-lg p-3 flex gap-3 items-start"
                      style={{ ...inputStyle, backgroundColor: "rgba(239,68,68,0.05)" }}
                    >
                      <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-400">{error}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label
                      className="block text-xs font-semibold mb-2 uppercase tracking-wider"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Phone Number
                    </label>
                    <div
                      className="flex items-center gap-2 border rounded-lg px-4 py-3 transition-colors"
                      style={inputStyle}
                    >
                      <span className="font-mono text-sm" style={{ color: "var(--text-secondary)" }}>
                        +234
                      </span>
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
                    <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                      Nigerian number required
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || phone.length !== 10}
                    className="w-full py-3 font-semibold rounded-lg transition-all flex items-center justify-center gap-2 mt-6"
                    style={{
                      backgroundColor: "var(--accent-amber)",
                      color: "#412403",
                      cursor: loading || phone.length !== 10 ? "not-allowed" : "pointer",
                      opacity: phone.length !== 10 ? 0.45 : 1,
                    }}
                  >
                    {loading ? (
                      <Loader size={18} className="animate-spin" />
                    ) : null}
                    {loading ? "Sending..." : <>Send Reset Code <ArrowRight size={18} /></>}
                  </button>
                </form>

                <div className="text-center border-t pt-6" style={{ borderColor: "var(--border-hairline)" }}>
                  <Link
                    href="/signin"
                    className="text-xs font-semibold hover:underline"
                    style={{ color: "var(--accent-amber)" }}
                  >
                    Back to sign in
                  </Link>
                </div>
              </motion.div>
            )}

            {/* ── STEP 2: OTP + NEW PASSWORD ── */}
            {step === "reset" && (
              <motion.div
                key="reset"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                className="space-y-8"
              >
                <div>
                  <button
                    onClick={() => { setStep("phone"); setError(null); }}
                    className="flex items-center gap-2 text-sm mb-4 hover:opacity-80"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    <ArrowLeft size={15} /> Back
                  </button>
                  <h1
                    className="font-headline text-2xl lg:text-3xl font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Set new password
                  </h1>
                  <p className="text-sm mt-2" style={{ color: "var(--text-secondary)" }}>
                    Code sent to +234{phone}. Enter it below along with your new password.
                  </p>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="border rounded-lg p-3 flex gap-3 items-start"
                      style={{ ...inputStyle, backgroundColor: "rgba(239,68,68,0.05)" }}
                    >
                      <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-400">{error}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleReset} className="space-y-4">
                  <div>
                    <label
                      className="block text-xs font-semibold mb-2 uppercase tracking-wider"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Verification Code
                    </label>
                    <input
                      type="text"
                      placeholder="000000"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      maxLength={6}
                      className="w-full border rounded-lg px-4 py-3 outline-none text-2xl tracking-widest font-bold text-center"
                      style={inputStyle}
                    />
                    <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                      6-digit code sent to your phone
                    </p>
                  </div>

                  <div>
                    <label
                      className="block text-xs font-semibold mb-2 uppercase tracking-wider"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      New Password
                    </label>
                    <input
                      type="password"
                      placeholder="Min 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full border rounded-lg px-4 py-3 outline-none text-base"
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label
                      className="block text-xs font-semibold mb-2 uppercase tracking-wider"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      placeholder="Repeat password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full border rounded-lg px-4 py-3 outline-none text-base"
                      style={{
                        ...inputStyle,
                        borderColor:
                          confirmPassword && confirmPassword !== newPassword
                            ? "rgba(239,68,68,0.6)"
                            : "var(--border-subtle)",
                      }}
                    />
                    {confirmPassword && confirmPassword !== newPassword && (
                      <p className="text-xs mt-1 text-red-400">Passwords don&apos;t match</p>
                    )}
                    {confirmPassword && confirmPassword === newPassword && newPassword.length >= 6 && (
                      <p className="text-xs mt-1" style={{ color: "var(--accent-amber)" }}>
                        Passwords match
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={
                      loading ||
                      otp.length !== 6 ||
                      newPassword.length < 6 ||
                      newPassword !== confirmPassword
                    }
                    className="w-full py-3 font-semibold rounded-lg transition-all flex items-center justify-center gap-2 mt-6"
                    style={{
                      backgroundColor: "var(--accent-amber)",
                      color: "#412403",
                      cursor:
                        loading ||
                        otp.length !== 6 ||
                        newPassword.length < 6 ||
                        newPassword !== confirmPassword
                          ? "not-allowed"
                          : "pointer",
                      opacity:
                        otp.length !== 6 ||
                        newPassword.length < 6 ||
                        newPassword !== confirmPassword
                          ? 0.45
                          : 1,
                    }}
                  >
                    {loading ? <Loader size={18} className="animate-spin" /> : null}
                    {loading ? "Updating..." : <>Update Password <ArrowRight size={18} /></>}
                  </button>
                </form>

                <div className="text-center border-t pt-6" style={{ borderColor: "var(--border-hairline)" }}>
                  <Link
                    href="/signin"
                    className="text-xs font-semibold hover:underline"
                    style={{ color: "var(--accent-amber)" }}
                  >
                    Back to sign in
                  </Link>
                </div>
              </motion.div>
            )}

            {/* ── SUCCESS ── */}
            {step === "success" && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-center space-y-6 py-12"
              >
                <motion.div
                  initial={{ scale: 0, rotate: -15 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.15, type: "spring", stiffness: 280, damping: 18 }}
                  className="relative mx-auto w-20 h-20 rounded-2xl flex items-center justify-center"
                  style={{
                    backgroundColor: "rgba(232,163,61,0.12)",
                    border: "1.5px solid rgba(232,163,61,0.35)",
                  }}
                >
                  <motion.div
                    animate={{ opacity: [0.4, 0.8, 0.4], scale: [1, 1.15, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 rounded-2xl"
                    style={{ backgroundColor: "rgba(232,163,61,0.15)", filter: "blur(8px)" }}
                  />
                  <Check
                    size={36}
                    style={{ color: "var(--accent-amber)", position: "relative" }}
                    strokeWidth={2.5}
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <p className="font-headline text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                    Password updated!
                  </p>
                  <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                    Redirecting you to sign in...
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="flex gap-1.5 justify-center"
                >
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                      transition={{ delay: i * 0.15, duration: 0.8, repeat: Infinity }}
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: "var(--accent-amber)" }}
                    />
                  ))}
                </motion.div>

                <Link
                  href="/signin"
                  className="inline-block text-xs font-semibold hover:underline"
                  style={{ color: "var(--accent-amber)" }}
                >
                  Back to sign in
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
