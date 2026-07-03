"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authApi, setAdminToken, ApiError } from "@/lib/api";
import { Logo } from "@/components/ui/Logo";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Loader, Check, Mail, Lock } from "lucide-react";

type AdminLoginStep = "credentials" | "success";

export default function AdminLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<AdminLoginStep>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    if (!email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await authApi.adminLogin(email, password);
      setAdminToken(response.token);
      setStep("success");

      setTimeout(() => {
        router.push("/admin");
      }, 1500);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Invalid email or password"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0A0A0A]/80 backdrop-blur-lg border-b border-[#2A2A2A] px-4 py-4">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <Logo size="sm" />
          </Link>
          <span className="text-xs bg-neon/10 text-neon px-3 py-1 rounded-full font-semibold">
            Admin
          </span>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md space-y-8"
        >
          {/* Title */}
          <div className="space-y-4">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
              {step === "credentials" && "Admin Access"}
              {step === "success" && "Welcome!"}
            </h1>
            <p className="text-gray-400 text-sm">
              {step === "credentials" && "Sign in to manage games and players"}
              {step === "success" && "Loading admin dashboard..."}
            </p>
          </div>

          {/* Error Alert */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex gap-3 items-start"
              >
                <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-400">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Login Form */}
          <AnimatePresence mode="wait">
            {step === "credentials" && (
              <motion.form
                key="login-form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onSubmit={handleLogin}
                className="space-y-4"
              >
                {/* Email Field */}
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-300">
                    Email Address
                  </label>
                  <div className="flex items-center gap-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-3 focus-within:border-neon transition-colors">
                    <Mail size={18} className="text-gray-500" />
                    <input
                      type="email"
                      placeholder="admin@bitlyfe.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="flex-1 bg-transparent outline-none text-white placeholder-gray-600"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-300">
                    Password
                  </label>
                  <div className="flex items-center gap-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-3 focus-within:border-neon transition-colors">
                    <Lock size={18} className="text-gray-500" />
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="flex-1 bg-transparent outline-none text-white placeholder-gray-600"
                    />
                  </div>
                </div>

                {/* Login Button */}
                <button
                  type="submit"
                  disabled={loading || !email || !password}
                  className="w-full py-4 px-4 bg-neon text-black font-bold rounded-lg hover:bg-neon/90 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 text-lg"
                >
                  {loading ? (
                    <>
                      <Loader size={20} className="animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In →
                    </>
                  )}
                </button>

                {/* Back to Home */}
                <div className="pt-4 border-t border-[#2A2A2A]">
                  <p className="text-center text-xs text-gray-500">
                    <Link href="/" className="text-neon hover:underline">
                      Back to home
                    </Link>
                  </p>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Success Step */}
          <AnimatePresence mode="wait">
            {step === "success" && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="space-y-4 text-center py-8"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="w-16 h-16 bg-neon/10 rounded-full flex items-center justify-center mx-auto"
                >
                  <Check size={32} className="text-neon" />
                </motion.div>
                <div>
                  <p className="text-gray-400 text-sm mb-2">Access granted</p>
                  <div className="flex gap-1 justify-center">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        animate={{ scale: [1, 1.5, 1] }}
                        transition={{ delay: i * 0.1, duration: 0.6, repeat: Infinity }}
                        className="w-2 h-2 bg-neon rounded-full"
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
