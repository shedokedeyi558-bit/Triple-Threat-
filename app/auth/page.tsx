"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { authApi, setToken, ApiError } from "@/lib/api";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, AlertCircle, Loader, Check, ArrowLeft, Eye, EyeOff } from "lucide-react";

type AuthStep = "phone" | "password" | "success";

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { dispatch } = useApp();
  const [step, setStep] = useState<AuthStep>("phone");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formattedPhone, setFormattedPhone] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [checkbox, setCheckbox] = useState(false);
  // Silently capture referral code from URL — no UI needed
  const [refCode] = useState(() => searchParams.get("ref") || "");

  const handlePhoneChange = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    const trimmed = cleaned.slice(-10);
    setPhone(trimmed);

    if (trimmed.length === 10) {
      setFormattedPhone(`+234 ${trimmed.slice(0, 3)} ${trimmed.slice(3, 6)} ${trimmed.slice(6)}`);
    } else {
      setFormattedPhone(trimmed ? `+234 ${trimmed}` : "");
    }
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length !== 10) {
      setError("Please enter a valid 10-digit phone number");
      return;
    }
    setError(null);
    setStep("password");
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (!checkbox) {
      setError("You must confirm you are 18 or older");
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const fullPhone = `+234${phone}`;
      const response = await authApi.register(fullPhone, password, refCode || undefined);

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

      setStep("success");
      setTimeout(() => router.push("/pills"), 1500);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[--bg-base] text-white flex flex-col lg:flex-row" style={{ backgroundColor: "var(--bg-base)" }}>
      {/* Mobile Top Bar */}
      <div className="lg:hidden sticky top-0 z-50 flex items-center gap-3 px-4 py-4 border-b" style={{ borderColor: "var(--border-hairline)", backgroundColor: "var(--bg-base)" }}>
        <Link href="/" className="hover:opacity-80 transition-opacity">
          <ArrowLeft size={20} style={{ color: "var(--text-secondary)" }} />
        </Link>
        <div className="flex items-center gap-2">
          <img src="/bitlyfe-mark.svg" alt="BitLyfe" width={24} height={24} />
          <span className="font-headline text-sm font-semibold" style={{ color: "var(--text-primary)" }}>bitlyfe</span>
        </div>
      </div>

      {/* Desktop Left Panel */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="hidden lg:flex w-[45%] flex-col justify-between p-12 border-r"
        style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-hairline)" }}
      >
        <div className="flex items-center gap-2">
          <img src="/bitlyfe-mark.svg" alt="BitLyfe" width={28} height={28} />
          <span className="font-headline text-base font-semibold" style={{ color: "var(--text-primary)" }}>bitlyfe</span>
        </div>

        <div className="space-y-8">
          <div className="font-mono text-xs tracking-widest" style={{ color: "var(--accent-amber)" }}>
            REAL STAKES, REAL FAST
          </div>

          <div>
            <h2 className="font-headline text-3xl font-semibold leading-tight mb-6" style={{ color: "var(--text-primary)" }}>
              Pick up right where you left off.
            </h2>
            
            <div className="space-y-3">
              {[
                { label: "Pills", color: "var(--accent-indigo)" },
                { label: "Time Machine", color: "var(--accent-violet)" },
                { label: "Blitz", color: "var(--accent-amber)" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>© 2026 bitlyfe</p>
      </motion.div>

      {/* Right Panel / Mobile Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 lg:py-12 lg:pr-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm space-y-8"
        >
          {/* Progress Indicator */}
          <div className="space-y-2">
            <h1 className="font-headline text-2xl lg:text-3xl font-semibold" style={{ color: "var(--text-primary)" }}>
              {step === "phone" && "Join BitLyfe"}
              {step === "password" && "Create Password"}
              {step === "success" && "Welcome!"}
            </h1>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              {step === "phone" && "Enter your phone number to get started"}
              {step === "password" && "You'll use this to sign in next time"}
              {step === "success" && "You're all set. Let's go!"}
            </p>
          </div>

          {/* Error Alert */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="border rounded-lg p-3 flex gap-3 items-start"
                style={{ borderColor: "var(--border-subtle)", backgroundColor: "rgba(239, 68, 68, 0.05)" }}
              >
                <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-400">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Phone Step */}
          <AnimatePresence mode="wait">
            {step === "phone" && (
              <motion.form
                key="phone-form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onSubmit={handleSendOTP}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                    Phone Number
                  </label>
                  <div className="flex items-center gap-2 border rounded-lg px-4 py-3 focus-within:border-opacity-100 transition-colors" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-card)" }}>
                    <span className="font-mono text-sm" style={{ color: "var(--text-secondary)" }}>+234</span>
                    <input
                      type="tel"
                      placeholder="801 234 5678"
                      value={phone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      maxLength={10}
                      className="flex-1 bg-transparent outline-none text-base"
                      style={{ color: "var(--text-primary)" }}
                    />
                  </div>
                  <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Nigerian number required</p>
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
                    <>
                      <Loader size={18} className="animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      Continue <ArrowRight size={18} />
                    </>
                  )}
                </button>

                <p className="text-center text-xs" style={{ color: "var(--text-secondary)" }}>
                  Already have an account?{" "}
                  <Link href="/signin" className="font-semibold hover:underline" style={{ color: "var(--accent-amber)" }}>
                    Sign in
                  </Link>
                </p>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Password Step */}
          <AnimatePresence mode="wait">
            {step === "password" && (
              <motion.form
                key="password-form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onSubmit={handleSetPassword}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                    Password
                  </label>
                  <div className="flex items-center gap-2 border rounded-lg px-4 py-3 transition-colors" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-card)", color: "var(--text-primary)" }}>
                    <input
                      type={showPass ? "text" : "password"}
                      placeholder="Enter a strong password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="flex-1 bg-transparent outline-none text-base"
                    />
                    <button type="button" onClick={() => setShowPass(v => !v)} className="flex-shrink-0" style={{ color: "var(--text-secondary)" }} tabIndex={-1}>
                      {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Minimum 6 characters</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                    Confirm Password
                  </label>
                  <div className="flex items-center gap-2 border rounded-lg px-4 py-3 transition-colors" style={{ borderColor: confirmPassword && confirmPassword !== password ? "rgba(239,68,68,0.6)" : "var(--border-subtle)", backgroundColor: "var(--bg-card)", color: "var(--text-primary)" }}>
                    <input
                      type={showConfirmPass ? "text" : "password"}
                      placeholder="Re-enter your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="flex-1 bg-transparent outline-none text-base"
                    />
                    <button type="button" onClick={() => setShowConfirmPass(v => !v)} className="flex-shrink-0" style={{ color: "var(--text-secondary)" }} tabIndex={-1}>
                      {showConfirmPass ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {confirmPassword && confirmPassword !== password && (
                    <p className="text-xs mt-1 text-red-400">Passwords do not match</p>
                  )}
                  {confirmPassword && confirmPassword === password && password.length >= 6 && (
                    <p className="text-xs mt-1" style={{ color: "var(--accent-amber)" }}>Passwords match</p>
                  )}
                </div>

                <div className="border rounded-lg p-4" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-card)" }}>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checkbox}
                      onChange={(e) => setCheckbox(e.target.checked)}
                      className="w-5 h-5 rounded mt-0.5"
                      style={{ borderColor: "var(--border-subtle)", accentColor: "var(--accent-amber)" }}
                    />
                    <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                      I confirm I&apos;m 18 years or older and agree to the{" "}
                      <Link href="/terms" className="font-semibold hover:underline" style={{ color: "var(--accent-amber)" }}>
                        Terms of Service
                      </Link>
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading || password.length < 6 || confirmPassword !== password || !checkbox}
                  className="w-full py-3 font-semibold rounded-lg transition-all flex items-center justify-center gap-2 mt-6"
                  style={{
                    backgroundColor: "var(--accent-amber)",
                    color: "#412403",
                    cursor: loading || password.length < 6 || confirmPassword !== password || !checkbox ? "not-allowed" : "pointer",
                    opacity: password.length < 6 || confirmPassword !== password || !checkbox ? 0.45 : 1,
                  }}
                >
                  {loading ? (
                    <>
                      <Loader size={18} className="animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      Create Account <ArrowRight size={18} />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep("phone");
                    setPassword("");
                    setConfirmPassword("");
                    setCheckbox(false);
                    setError(null);
                  }}
                  className="w-full py-2 text-sm hover:underline transition-colors"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Back
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Success Step */}
          <AnimatePresence mode="wait">
            {step === "success" && (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="text-center py-6 space-y-5"
              >
                {/* Animated check */}
                <motion.div
                  initial={{ scale: 0, rotate: -15 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.15, type: "spring", stiffness: 280, damping: 18 }}
                  className="relative mx-auto w-20 h-20 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: "rgba(232,163,61,0.12)", border: "1.5px solid rgba(232,163,61,0.35)" }}
                >
                  {/* Glow pulse */}
                  <motion.div
                    animate={{ opacity: [0.4, 0.8, 0.4], scale: [1, 1.15, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 rounded-2xl"
                    style={{ backgroundColor: "rgba(232,163,61,0.15)", filter: "blur(8px)" }}
                  />
                  <Check size={36} style={{ color: "var(--accent-amber)", position: "relative" }} strokeWidth={2.5} />
                </motion.div>

                {/* Headline */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}>
                  <p className="font-headline text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                    You&apos;re in! 🎉
                  </p>
                  <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                    Account created. Time to put that knowledge to work.
                  </p>
                </motion.div>

                {/* Animated loading dots */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="flex flex-col items-center gap-3">
                  <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>
                    Taking you in
                  </p>
                  <div className="flex gap-1.5">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        animate={{ scale: [1, 1.6, 1], opacity: [0.4, 1, 0.4] }}
                        transition={{ delay: i * 0.15, duration: 0.8, repeat: Infinity }}
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: "var(--accent-amber)" }}
                      />
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer Links — hidden on success step */}
          {step !== "success" && (
          <div className="border-t pt-6" style={{ borderColor: "var(--border-hairline)" }}>
            <p className="text-center text-xs" style={{ color: "var(--text-secondary)" }}>
              By signing up, you agree to our{" "}
              <Link href="/terms" className="font-semibold hover:underline" style={{ color: "var(--accent-amber)" }}>
                Terms of Service
              </Link>
            </p>

            {/* Back to home link */}
            <div className="text-center pt-4">
              <Link href="/" className="text-xs font-semibold hover:underline" style={{ color: "var(--accent-amber)" }}>
                Back to home
              </Link>
            </div>
          </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={null}>
      <AuthForm />
    </Suspense>
  );
}
