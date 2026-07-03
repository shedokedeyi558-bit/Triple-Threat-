"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { authApi, setToken, ApiError } from "@/lib/api";
import { Logo } from "@/components/ui/Logo";
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
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0A0A0A]/80 backdrop-blur-lg border-b border-[#2A2A2A] px-4 py-4">
        <div className="max-w-md mx-auto grid grid-cols-3 items-center">
          <Link href="/" className="hover:opacity-80 transition-opacity justify-self-start">
            <ArrowLeft size={24} className="text-gray-400 hover:text-white" />
          </Link>
          <Link href="/" className="hover:opacity-80 transition-opacity justify-self-center">
            <Logo size="sm" />
          </Link>
          <div />
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
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
                  <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">
                    Welcome back.
                  </h1>
                  <p className="text-gray-400 text-sm">
                    Enter your phone and password to pick up where you left off.
                  </p>
                </div>

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex gap-3 items-start"
                    >
                      <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-400">{error}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Form */}
                <form onSubmit={handleSignIn} className="space-y-4">
                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-300">
                      Phone Number
                    </label>
                    <div className="flex items-center gap-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-3 focus-within:border-neon transition-colors">
                      <span className="text-gray-500 text-sm font-medium">+234</span>
                      <input
                        type="tel"
                        placeholder="801 234 5678"
                        value={phone}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        maxLength={10}
                        className="flex-1 bg-transparent outline-none text-white placeholder-gray-600"
                        autoComplete="tel"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-300">
                      Password
                    </label>
                    <div className="flex items-center gap-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-3 focus-within:border-neon transition-colors">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="flex-1 bg-transparent outline-none text-white placeholder-gray-600"
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-gray-500 hover:text-gray-300 transition-colors flex-shrink-0"
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
                    className="w-full py-4 bg-neon text-black font-bold rounded-lg hover:bg-neon/90 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 text-base mt-2"
                  >
                    {loading ? (
                      <>
                        <Loader size={20} className="animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        Sign In <ArrowRight size={20} />
                      </>
                    )}
                  </button>
                </form>

                {/* Footer links */}
                <div className="text-center space-y-2 border-t border-[#2A2A2A] pt-6">
                  <p className="text-xs text-gray-500">
                    New player?{" "}
                    <Link href="/auth" className="text-neon hover:underline font-semibold">
                      Create an account
                    </Link>
                  </p>
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
                  className="w-20 h-20 bg-neon/10 border border-neon/30 rounded-full flex items-center justify-center mx-auto"
                >
                  <Check size={36} className="text-neon" />
                </motion.div>

                <div>
                  <h2 className="text-2xl font-black mb-1">You&apos;re in.</h2>
                  <p className="text-gray-400 text-sm">Taking you to the games...</p>
                </div>

                <div className="flex gap-1.5 justify-center">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                      transition={{ delay: i * 0.15, duration: 0.8, repeat: Infinity }}
                      className="w-2 h-2 bg-neon rounded-full"
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
