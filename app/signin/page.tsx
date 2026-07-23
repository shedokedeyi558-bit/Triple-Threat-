"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { authApi, setToken, ApiError } from "@/lib/api";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Loader, Check, ArrowLeft, ArrowRight, Eye, EyeOff } from "lucide-react";

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

  const [showForgot, setShowForgot] = useState(false);
  const [fpPhone, setFpPhone] = useState("");
  const [fpNewPass, setFpNewPass] = useState("");
  const [fpConfirm, setFpConfirm] = useState("");
  const [showFpNew, setShowFpNew] = useState(false);
  const [showFpConfirm, setShowFpConfirm] = useState(false);
  const [fpLoading, setFpLoading] = useState(false);
  const [fpError, setFpError] = useState<string | null>(null);
  const [fpDone, setFpDone] = useState(false);

  const handlePhoneChange = (value: string) => {
    setPhone(value.replace(/\D/g, "").slice(-10));
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length !== 10) { setError("Enter a valid 10-digit phone number"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true); setError(null);
    try {
      const res = await authApi.phoneSignIn(`+234${phone}`, password);
      setToken(res.token);
      dispatch({ type: "LOGIN", player: { id: res.player.id, phone: res.player.phone, name: res.player.name, email: "", balance: res.player.balance }, token: res.token });
      setStep("success");
      setTimeout(() => router.push("/pills"), 1200);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Sign in failed. Check your phone and password.");
    } finally { setLoading(false); }
  };

  const handleFpReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fpPhone.length !== 10) { setFpError("Enter a valid 10-digit phone number"); return; }
    if (fpNewPass.length < 6) { setFpError("Password must be at least 6 characters"); return; }
    if (fpNewPass !== fpConfirm) { setFpError("Passwords don't match"); return; }
    setFpLoading(true); setFpError(null);
    try {
      const res = await authApi.resetPassword(`+234${fpPhone}`, fpNewPass);
      setToken(res.token);
      dispatch({ type: "LOGIN", player: { id: res.player.id, phone: res.player.phone, name: res.player.name, email: "", balance: res.player.balance }, token: res.token });
      setFpDone(true);
      setTimeout(() => router.push("/pills"), 1500);
    } catch (err) {
      setFpError(err instanceof ApiError ? err.message : "Reset failed.");
    } finally { setFpLoading(false); }
  };

  const resetForgotFlow = () => {
    setShowForgot(false);
    setFpPhone(""); setFpNewPass(""); setFpConfirm(""); setFpError(null); setFpDone(false);
  };

  const inputStyle = { borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-card)", color: "var(--text-primary)" };

  return (
    <div className="min-h-screen text-white flex flex-col lg:flex-row" style={{ backgroundColor: "var(--bg-base)" }}>

      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-50 flex items-center gap-3 px-4 py-4 border-b"
        style={{ borderColor: "var(--border-hairline)", backgroundColor: "var(--bg-base)" }}>
        <button onClick={() => showForgot ? resetForgotFlow() : router.push("/")} className="hover:opacity-80">
          <ArrowLeft size={20} style={{ color: "var(--text-secondary)" }} />
        </button>
        <div className="flex items-center gap-2">
          <img src="/bitlyfe-mark.svg" alt="BitLyfe" width={24} height={24} />
          <span className="font-headline text-sm font-semibold" style={{ color: "var(--text-primary)" }}>bitlyfe</span>
        </div>
      </div>

      {/* Desktop left panel */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
        className="hidden lg:flex w-[45%] flex-col justify-between p-12 border-r"
        style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-hairline)" }}>
        <div className="flex items-center gap-2">
          <img src="/bitlyfe-mark.svg" alt="BitLyfe" width={28} height={28} />
          <span className="font-headline text-base font-semibold" style={{ color: "var(--text-primary)" }}>bitlyfe</span>
        </div>
        <div className="space-y-8">
          <div className="font-mono text-xs tracking-widest" style={{ color: "var(--accent-amber)" }}>REAL STAKES, REAL FAST</div>
          <div>
            <h2 className="font-headline text-3xl font-semibold leading-tight mb-6" style={{ color: "var(--text-primary)" }}>
              Pick up right where you left off.
            </h2>
            <div className="space-y-3">
              {[{ label: "Pills", color: "var(--accent-indigo)" }, { label: "Time Machine", color: "var(--accent-violet)" }, { label: "Blitz", color: "var(--accent-amber)" }].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>© 2026 bitlyfe</p>
      </motion.div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 lg:py-12 lg:pr-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="w-full max-w-sm">
          <AnimatePresence mode="wait">

            {/* ── FORGOT PASSWORD FLOW ── */}
            {showForgot && (
              <motion.div key="forgot" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} className="space-y-8">
                <div>
                  <button onClick={resetForgotFlow} className="flex items-center gap-2 text-sm mb-4 hover:opacity-80" style={{ color: "var(--text-secondary)" }}>
                    <ArrowLeft size={15} /> Back to sign in
                  </button>
                  <h1 className="font-headline text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>
                    {fpDone ? "Password updated!" : "Reset password"}
                  </h1>
                  <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                    {fpDone ? "Taking you in..." : "Enter your phone number and choose a new password."}
                  </p>
                </div>

                <AnimatePresence>
                  {fpError && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="border rounded-lg p-3 flex gap-3 items-start" style={{ ...inputStyle, backgroundColor: "rgba(239,68,68,0.05)" }}>
                      <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-400">{fpError}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {!fpDone && (
                  <form onSubmit={handleFpReset} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Phone Number</label>
                      <div className="flex items-center gap-2 border rounded-lg px-4 py-3" style={inputStyle}>
                        <span className="font-mono text-sm" style={{ color: "var(--text-secondary)" }}>+234</span>
                        <input type="tel" placeholder="801 234 5678" value={fpPhone}
                          onChange={(e) => setFpPhone(e.target.value.replace(/\D/g, "").slice(-10))}
                          maxLength={10} className="flex-1 bg-transparent outline-none text-base" style={{ color: "var(--text-primary)" }} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>New Password</label>
                      <div className="flex items-center gap-2 border rounded-lg px-4 py-3 transition-colors" style={inputStyle}>
                        <input type={showFpNew ? "text" : "password"} placeholder="Min 6 characters" value={fpNewPass} onChange={(e) => setFpNewPass(e.target.value)}
                          className="flex-1 bg-transparent outline-none text-base" style={{ color: "var(--text-primary)" }} />
                        <button type="button" onClick={() => setShowFpNew(v => !v)} className="flex-shrink-0" style={{ color: "var(--text-secondary)" }} tabIndex={-1}>
                          {showFpNew ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Confirm Password</label>
                      <div className="flex items-center gap-2 border rounded-lg px-4 py-3 transition-colors" style={{ ...inputStyle, borderColor: fpConfirm && fpConfirm !== fpNewPass ? "rgba(239,68,68,0.6)" : "var(--border-subtle)" }}>
                        <input type={showFpConfirm ? "text" : "password"} placeholder="Repeat password" value={fpConfirm} onChange={(e) => setFpConfirm(e.target.value)}
                          className="flex-1 bg-transparent outline-none text-base" style={{ color: "var(--text-primary)" }} />
                        <button type="button" onClick={() => setShowFpConfirm(v => !v)} className="flex-shrink-0" style={{ color: "var(--text-secondary)" }} tabIndex={-1}>
                          {showFpConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      {fpConfirm && fpConfirm !== fpNewPass && <p className="text-xs mt-1 text-red-400">Passwords don&apos;t match</p>}
                    </div>
                    <button type="submit"
                      disabled={fpLoading || fpPhone.length !== 10 || fpNewPass.length < 6 || fpNewPass !== fpConfirm}
                      className="w-full py-3 font-semibold rounded-lg flex items-center justify-center gap-2 mt-6"
                      style={{ backgroundColor: "var(--accent-amber)", color: "#412403",
                        opacity: (fpPhone.length !== 10 || fpNewPass.length < 6 || fpNewPass !== fpConfirm) ? 0.45 : 1,
                        cursor: (fpPhone.length !== 10 || fpNewPass.length < 6 || fpNewPass !== fpConfirm) ? "not-allowed" : "pointer" }}>
                      {fpLoading ? <Loader size={18} className="animate-spin" /> : null}
                      {fpLoading ? "Updating..." : <>Reset Password <ArrowRight size={18} /></>}
                    </button>
                  </form>
                )}

                {fpDone && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center gap-1.5">
                    {[0, 1, 2].map((i) => (
                      <motion.div key={i} animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ delay: i * 0.15, duration: 0.8, repeat: Infinity }}
                        className="w-2 h-2 rounded-full" style={{ backgroundColor: "var(--accent-amber)" }} />
                    ))}
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* ── SIGN IN ── */}
            {!showForgot && step === "credentials" && (
              <motion.div key="credentials" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                <div>
                  <h1 className="font-headline text-2xl lg:text-3xl font-semibold" style={{ color: "var(--text-primary)" }}>Welcome back.</h1>
                  <p className="text-sm mt-2" style={{ color: "var(--text-secondary)" }}>Enter your phone and password to continue.</p>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                      className="border rounded-lg p-3 flex gap-3 items-start" style={{ ...inputStyle, backgroundColor: "rgba(239,68,68,0.05)" }}>
                      <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-400">{error}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleSignIn} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Phone Number</label>
                    <div className="flex items-center gap-2 border rounded-lg px-4 py-3 transition-colors" style={inputStyle}>
                      <span className="font-mono text-sm" style={{ color: "var(--text-secondary)" }}>+234</span>
                      <input type="tel" placeholder="801 234 5678" value={phone} onChange={(e) => handlePhoneChange(e.target.value)}
                        maxLength={10} className="flex-1 bg-transparent outline-none text-base" style={{ color: "var(--text-primary)" }} autoComplete="tel" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Password</label>
                      <button type="button" onClick={() => { setShowForgot(true); setError(null); }}
                        className="text-xs font-semibold hover:underline" style={{ color: "var(--accent-amber)" }}>
                        Forgot password?
                      </button>
                    </div>
                    <div className="flex items-center gap-2 border rounded-lg px-4 py-3 transition-colors" style={inputStyle}>
                      <input type={showPassword ? "text" : "password"} placeholder="Your password" value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="flex-1 bg-transparent outline-none text-base" style={{ color: "var(--text-primary)" }} autoComplete="current-password" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="flex-shrink-0" style={{ color: "var(--text-secondary)" }} tabIndex={-1}>
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <button type="submit" disabled={loading || phone.length !== 10 || password.length < 6}
                    className="w-full py-3 font-semibold rounded-lg transition-all flex items-center justify-center gap-2 mt-6"
                    style={{ backgroundColor: "var(--accent-amber)", color: "#412403", cursor: loading || phone.length !== 10 || password.length < 6 ? "not-allowed" : "pointer", opacity: phone.length !== 10 || password.length < 6 ? 0.45 : 1 }}>
                    {loading ? <><Loader size={18} className="animate-spin" /> Signing in...</> : <>Sign In <ArrowRight size={18} /></>}
                  </button>
                </form>

                <div className="text-center border-t pt-6" style={{ borderColor: "var(--border-hairline)" }}>
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    New player?{" "}
                    <Link href="/auth" className="font-semibold hover:underline" style={{ color: "var(--accent-amber)" }}>Create an account</Link>
                  </p>
                </div>
                <div className="text-center">
                  <Link href="/" className="text-xs font-semibold hover:underline" style={{ color: "var(--accent-amber)" }}>Back to home</Link>
                </div>
              </motion.div>
            )}

            {/* ── SUCCESS ── */}
            {!showForgot && step === "success" && (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="text-center space-y-6 py-12">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ backgroundColor: "rgba(232,163,61,0.1)" }}>
                  <Check size={32} style={{ color: "var(--accent-amber)" }} />
                </motion.div>
                <div>
                  <h2 className="font-headline text-xl font-semibold mb-1" style={{ color: "var(--text-primary)" }}>You&apos;re in.</h2>
                  <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Taking you to the games...</p>
                </div>
                <div className="flex gap-1.5 justify-center">
                  {[0, 1, 2].map((i) => (
                    <motion.div key={i} animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                      transition={{ delay: i * 0.15, duration: 0.8, repeat: Infinity }}
                      className="w-2 h-2 rounded-full" style={{ backgroundColor: "var(--accent-amber)" }} />
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
