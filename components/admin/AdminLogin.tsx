"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAdmin } from "@/context/AdminContext";
import { ArrowLeft, AlertCircle, Loader, ArrowRight, Eye, EyeOff, Lock, Shield } from "lucide-react";
import { authApi, setAdminToken, ApiError } from "@/lib/api";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

export function AdminLogin() {
  const router = useRouter();
  const { dispatch: adminDispatch } = useAdmin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await authApi.adminLogin(email.trim(), password);
      
      setAdminToken(data.token);
      
      adminDispatch({ type: "ADMIN_LOGIN", token: data.token });
      
      router.push("/admin");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Login failed. Check your credentials.");
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
          <Image
            src="/bitlyfe-mark.svg"
            alt="BitLyfe"
            width={24}
            height={24}
          />
          <span className="font-headline text-sm font-semibold" style={{ color: "var(--text-primary)" }}>bitlyfe admin</span>
        </div>
      </div>

      {/* Desktop Left Panel - Indigo Accent */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="hidden lg:flex w-[45%] flex-col justify-between p-12 border-r"
        style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-hairline)" }}
      >
        <div className="flex items-center gap-3">
          <Image
            src="/bitlyfe-mark.svg"
            alt="BitLyfe"
            width={28}
            height={28}
          />
          <span className="font-headline text-base font-semibold" style={{ color: "var(--text-primary)" }}>Admin</span>
        </div>

        <div className="space-y-8">
          <div className="font-mono text-xs tracking-widest" style={{ color: "var(--accent-indigo)" }}>
            RESTRICTED ACCESS
          </div>

          <div>
            <h2 className="font-headline text-3xl font-semibold leading-tight" style={{ color: "var(--text-primary)" }}>
              Admin sign in.
            </h2>
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
          className="w-full max-w-sm space-y-6"
        >
          <div className="space-y-2">
            <h1 className="font-headline text-2xl lg:text-3xl font-semibold" style={{ color: "var(--text-primary)" }}>
              Admin sign in.
            </h1>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Enter your credentials to access the admin panel.
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
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                Email
              </label>
              <input
                type="email"
                placeholder="admin@bitlyfe.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border rounded-lg px-4 py-3 outline-none transition-colors text-base"
                style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-card)", color: "var(--text-primary)" }}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                Password
              </label>
              <div className="flex items-center gap-2 border rounded-lg px-4 py-3 focus-within:border-opacity-100 transition-colors" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-card)" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-base"
                  style={{ color: "var(--text-primary)" }}
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
              disabled={loading || !email || !password}
              className="w-full py-3 font-semibold rounded-lg transition-all flex items-center justify-center gap-2 mt-6"
              style={{
                backgroundColor: "var(--accent-indigo)",
                color: "white",
                cursor: loading || !email || !password ? "not-allowed" : "pointer",
                opacity: !email || !password ? 0.45 : 1,
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

          {/* Security Note */}
          <div className="border rounded-lg p-3 flex gap-2 items-start" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-card)" }}>
            <Shield size={14} className="flex-shrink-0 mt-0.5" style={{ color: "var(--text-muted)" }} />
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Restricted access. Sessions expire after 30 minutes of inactivity.
            </p>
          </div>

          {/* Back Link */}
          <div className="text-center border-t pt-4" style={{ borderColor: "var(--border-hairline)" }}>
            <Link href="/" className="text-xs font-semibold hover:underline" style={{ color: "var(--accent-indigo)" }}>
              Back to home
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
