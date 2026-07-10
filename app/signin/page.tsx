"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { authApi, setToken, ApiError } from "@/lib/api";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Loader, Check, ArrowLeft, ArrowRight, Eye, EyeOff } from "lucide-react";
import Image from "next/image";

type SignInStep = "credentials" | "success";

export default function SignInPage() {
  const router = useRouter();
  const { dispatch } = useApp();

  const [step, setStep] = useState<SignInStep>("credentials");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePhoneChange = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    setPhone(cleaned.slice(-10));
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length !== 10) {
      setError("Enter a valid 10-digit phone number");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const fullPhone = `+234${phone}`;
      const response = await authApi.phoneSignIn(fullPhone, password);

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
      setTimeout(() => router.push("/play"), 1200);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Sign in failed. Check your phone and password."
      );
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
          <img src="/bitlyfe-mark.svg" alt="BitLyfe" width={16} height={16} />
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
        {/* Logo */}
        <div className="flex items-center gap-2">
          <img src="/bitlyfe-mark.svg" alt="BitLyfe" width={20} height={20} />
          <span className="font-headline text-base font-semibold" style={{ color: "var(--text-primary)" }}>bitlyfe</span>
        </div>

        {/* Center Content */}
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

        {/* Footer */}
        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>© 2026 bitlyfe</p>
      </motion.div>

      {/* Right Panel / Mobile Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 lg:py-12 lg:pr-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm"
        >
          <AnimatePresence mode="wait">
            {step === "credentials" && (
              <motion.div
                key="credentials"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                {/* Heading */}
                <div>
                  <h1 className="font-headline text-2xl lg:text-3xl font-semibold" style={{ color: "var(--text-primary)" }}>
                    Welcome back.
                  </h1>
                  <p className="text-sm mt-2" style={{ color: "var(--text-secondary)" }}>
                    Enter your phone and password to continue.
                  </p>
                </div>

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="border rounded-lg p-3 flex gap-3 items-start"
                      style={{ borderColor: "var(--border-subtle)", backgroundColor: "rgba(239, 68, 68, 0.05)" }}
                    >
                      <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-400">{error}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Form */}
                <form onSubmit={handleSignIn} className="space-y-4">
                  {/* Phone */}
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
                        autoComplete="tel"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                      Password
                    </label>
                    <div className="flex items-center gap-2 border rounded-lg px-4 py-3 focus-within:border-opacity-100 transition-colors" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-card)" }}>
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="flex-1 bg-transparent outline-none text-base"
                        style={{ color: "var(--text-primary)" }}
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="transition-colors flex-shrink-0"
                        style={{ color: "var(--text-secondary)" }}
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading || phone.length !== 10 || password.length < 6}
                    className="w-full py-3 font-semibold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 mt-6"
                    style={{
                      backgroundColor: loading || phone.length !== 10 || password.length < 6 ? "var(--text-muted)" : "var(--accent-amber)",
                      color: loading || phone.length !== 10 || password.length < 6 ? "var(--bg-base)" : "#412403",
                      cursor: loading || phone.length !== 10 || password.length < 6 ? "not-allowed" : "pointer",
                      opacity: loading || phone.length !== 10 || password.length < 6 ? 0.5 : 1,
                    }}
                  >
                    {loading ? (
                      <>
                        <Loader size={18} className="animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        Sign In <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                </form>

                {/* Footer links */}
                <div className="text-center border-t pt-6" style={{ borderColor: "var(--border-hairline)" }}>
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    New player?{" "}
                    <Link href="/auth" className="font-semibold hover:underline" style={{ color: "var(--accent-amber)" }}>
                      Create an account
                    </Link>
                  </p>
                </div>

                {/* Back to home link */}
                <div className="text-center pt-4">
                  <Link href="/" className="text-xs font-semibold hover:underline" style={{ color: "var(--accent-amber)" }}>
                    Back to home
                  </Link>
                </div>
              </motion.div>
            )}

            {step === "success" && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-center space-y-6 py-12"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
                  style={{ backgroundColor: "rgba(232, 163, 61, 0.1)", borderColor: "var(--accent-amber)" }}
                >
                  <Check size={32} style={{ color: "var(--accent-amber)" }} />
                </motion.div>

                <div>
                  <h2 className="font-headline text-xl font-semibold mb-1" style={{ color: "var(--text-primary)" }}>You&apos;re in.</h2>
                  <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Taking you to the games...</p>
                </div>

                <div className="flex gap-1.5 justify-center">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                      transition={{ delay: i * 0.15, duration: 0.8, repeat: Infinity }}
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: "var(--accent-amber)" }}
                    />
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
