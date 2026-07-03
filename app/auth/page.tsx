"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { Logo } from "@/components/ui/Logo";
import { Mail, Lock, Phone, User, ArrowRight } from "lucide-react";
import { authApi, setToken, ApiError } from "@/lib/api";

type AuthMode = "signin" | "signup";

export default function AuthPage() {
  const router = useRouter();
  const { dispatch } = useApp();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Sign In fields
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");

  // Sign Up fields
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpPasswordConfirm, setSignUpPasswordConfirm] = useState("");
  const [signUpPhone, setSignUpPhone] = useState("");
  const [signUpName, setSignUpName] = useState("");

  const handleSignIn = async () => {
    if (!signInEmail || !signInPassword) {
      setError("Please fill in all fields");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const data = await authApi.signIn(signInEmail.trim(), signInPassword);
      setToken(data.token);
      dispatch({
        type: "LOGIN",
        token: data.token,
        player: {
          id: data.player.id,
          email: data.player.email,
          phone: data.player.phone,
          name: data.player.name,
          balance: data.player.balance,
          is_admin: data.player.is_admin,
        },
      });
      // Redirect based on role
      router.push(data.player.is_admin ? "/admin" : "/format");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Sign in failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!signUpEmail || !signUpPassword || !signUpPasswordConfirm || !signUpPhone) {
      setError("Please fill in all required fields");
      return;
    }

    if (signUpPassword !== signUpPasswordConfirm) {
      setError("Passwords do not match");
      return;
    }

    if (signUpPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (signUpPhone.replace(/\D/g, "").length < 10) {
      setError("Please enter a valid phone number");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const data = await authApi.signUp(signUpEmail.trim(), signUpPassword, signUpPhone, signUpName || undefined);
      setToken(data.token);
      dispatch({
        type: "LOGIN",
        token: data.token,
        player: {
          id: data.player.id,
          email: data.player.email,
          phone: data.player.phone,
          name: data.player.name,
          balance: data.player.balance,
          is_admin: data.player.is_admin,
        },
      });
      router.push("/format");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Sign up failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center px-4 sm:px-5 bg-black">
      <motion.div
        className="w-full max-w-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="text-center mb-8">
          <Logo size="md" />
        </div>

        {/* Mode toggle */}
        <div className="flex gap-2 mb-6 bg-gray-900 rounded-lg p-1">
          <button
            onClick={() => { setMode("signin"); setError(""); }}
            className={`flex-1 py-2 rounded-md font-semibold text-sm transition-colors ${
              mode === "signin"
                ? "bg-neon text-black"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setMode("signup"); setError(""); }}
            className={`flex-1 py-2 rounded-md font-semibold text-sm transition-colors ${
              mode === "signup"
                ? "bg-neon text-black"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Sign Up
          </button>
        </div>

        <AnimatePresence mode="wait">
          {mode === "signin" ? (
            <motion.div
              key="signin"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="bg-gray-950 border border-gray-800 rounded-2xl p-6 space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1.5 block">Email</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={signInEmail}
                      onChange={(e) => setSignInEmail(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
                      className="w-full bg-gray-900 border border-gray-800 focus:border-neon rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-600 text-sm outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-1.5 block">Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
                      className="w-full bg-gray-900 border border-gray-800 focus:border-neon rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-600 text-sm outline-none transition-colors"
                    />
                  </div>
                </div>

                {error && (
                  <div className="text-red-400 text-sm bg-red-900/20 border border-red-900/40 rounded-xl p-3">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleSignIn}
                  disabled={loading}
                  className="w-full py-3 bg-neon text-black font-semibold rounded-lg hover:bg-neon/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span className="animate-spin border-2 border-black border-t-transparent rounded-full w-5 h-5" />
                  ) : (
                    <>Sign In <ArrowRight size={18} /></>
                  )}
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="signup"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="bg-gray-950 border border-gray-800 rounded-2xl p-6 space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1.5 block">Email</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={signUpEmail}
                      onChange={(e) => setSignUpEmail(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-800 focus:border-neon rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-600 text-sm outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-1.5 block">Full Name (Optional)</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="text"
                      placeholder="John Doe"
                      value={signUpName}
                      onChange={(e) => setSignUpName(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-800 focus:border-neon rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-600 text-sm outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-1.5 block">Phone Number</label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="tel"
                      inputMode="numeric"
                      placeholder="08012345678"
                      value={signUpPhone}
                      onChange={(e) => setSignUpPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
                      className="w-full bg-gray-900 border border-gray-800 focus:border-neon rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-600 text-sm outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-1.5 block">Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={signUpPassword}
                      onChange={(e) => setSignUpPassword(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-800 focus:border-neon rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-600 text-sm outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-1.5 block">Confirm Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={signUpPasswordConfirm}
                      onChange={(e) => setSignUpPasswordConfirm(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-800 focus:border-neon rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-600 text-sm outline-none transition-colors"
                    />
                  </div>
                </div>

                {error && (
                  <div className="text-red-400 text-sm bg-red-900/20 border border-red-900/40 rounded-xl p-3">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleSignUp}
                  disabled={loading}
                  className="w-full py-3 bg-neon text-black font-semibold rounded-lg hover:bg-neon/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span className="animate-spin border-2 border-black border-t-transparent rounded-full w-5 h-5" />
                  ) : (
                    <>Create Account <ArrowRight size={18} /></>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-center text-gray-500 text-xs mt-6">
          By signing up, you agree to our Terms of Service and Privacy Policy
        </p>
      </motion.div>
    </main>
  );
}
