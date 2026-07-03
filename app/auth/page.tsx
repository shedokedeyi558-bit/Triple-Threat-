"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { authApi, setToken, ApiError } from "@/lib/api";
import { Logo } from "@/components/ui/Logo";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, AlertCircle, Loader, Check, ArrowLeft } from "lucide-react";

type AuthStep = "phone" | "password" | "otp" | "success";

export default function AuthPage() {
  const router = useRouter();
  const { dispatch } = useApp();
  const [step, setStep] = useState<AuthStep>("phone");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formattedPhone, setFormattedPhone] = useState("");
  const [checkbox, setCheckbox] = useState(false);

  // Format phone number
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

    setLoading(true);
    setError(null);

    try {
      const fullPhone = `+234${phone}`;
      await authApi.register(fullPhone);
      setStep("password");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to send OTP. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (!checkbox) {
      setError("You must confirm you are 18 or older");
      return;
    }

    setError(null);
    setStep("otp");
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const fullPhone = `+234${phone}`;
      // Pass password so the backend stores it alongside OTP verification
      const response = await authApi.verifyOtp(fullPhone, otp, password);

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

      setTimeout(() => {
        router.push("/play");
      }, 1500);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Invalid OTP. Please try again."
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
          className="w-full max-w-md space-y-8"
        >
          {/* Progress Indicator */}
          <div className="space-y-4">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
              {step === "phone" && "Join BitLyfe"}
              {step === "password" && "Create Password"}
              {step === "otp" && "Verify Your Number"}
              {step === "success" && "Welcome!"}
            </h1>
            <p className="text-gray-400 text-sm">
              {step === "phone" && "Enter your phone number to get started"}
              {step === "password" && "You'll use this to sign in next time"}
              {step === "otp" && `We sent a code to ${formattedPhone}`}
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
                className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex gap-3 items-start"
              >
                <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
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
                <div className="relative">
                  <label className="block text-sm font-semibold mb-2 text-gray-300">
                    Phone Number
                  </label>
                  <div className="flex items-center gap-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-3 focus-within:border-neon transition-colors">
                    <span className="text-gray-500">+234</span>
                    <input
                      type="tel"
                      placeholder="801 234 5678"
                      value={phone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      maxLength={10}
                      className="flex-1 bg-transparent outline-none text-white placeholder-gray-600"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Nigerian number required</p>
                </div>

                <button
                  type="submit"
                  disabled={loading || phone.length !== 10}
                  className="w-full py-4 px-4 bg-neon text-black font-bold rounded-lg hover:bg-neon/90 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 text-lg"
                >
                  {loading ? (
                    <>
                      <Loader size={20} className="animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      Continue <ArrowRight size={20} />
                    </>
                  )}
                </button>

                <p className="text-center text-xs text-gray-500">
                  Already have an account?{" "}
                  <Link href="/signin" className="text-neon hover:underline">
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
                  <label className="block text-sm font-semibold mb-2 text-gray-300">
                    Password
                  </label>
                  <input
                    type="password"
                    placeholder="Enter a strong password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white placeholder-gray-600 outline-none focus:border-neon transition-colors"
                  />
                  <p className="text-xs text-gray-500 mt-2">Minimum 6 characters</p>
                </div>

                {/* 18+ Agreement */}
                <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checkbox}
                      onChange={(e) => setCheckbox(e.target.checked)}
                      className="w-5 h-5 rounded bg-[#0A0A0A] border border-[#2A2A2A] accent-neon mt-0.5"
                    />
                    <span className="text-sm text-gray-300">
                      I confirm I&apos;m 18 years or older and agree to the{" "}
                      <Link href="/terms" className="text-neon hover:underline">
                        Terms of Service
                      </Link>
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading || password.length < 6 || !checkbox}
                  className="w-full py-4 px-4 bg-neon text-black font-bold rounded-lg hover:bg-neon/90 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 text-lg"
                >
                  {loading ? (
                    <>
                      <Loader size={20} className="animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    <>
                      Next <ArrowRight size={20} />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep("phone");
                    setPassword("");
                    setCheckbox(false);
                    setError(null);
                  }}
                  className="w-full py-2 text-gray-400 text-sm hover:text-white transition-colors"
                >
                  Back
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          {/* OTP Step */}
          <AnimatePresence mode="wait">
            {step === "otp" && (
              <motion.form
                key="otp-form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onSubmit={handleVerifyOTP}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-300">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    maxLength={6}
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white placeholder-gray-600 outline-none focus:border-neon transition-colors text-center text-2xl tracking-widest font-bold"
                  />
                  <p className="text-xs text-gray-500 mt-2">6-digit code sent to your phone</p>
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full py-4 px-4 bg-neon text-black font-bold rounded-lg hover:bg-neon/90 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 text-lg"
                >
                  {loading ? (
                    <>
                      <Loader size={20} className="animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      Verify <ArrowRight size={20} />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep("phone");
                    setOtp("");
                    setError(null);
                  }}
                  className="w-full py-2 text-gray-400 text-sm hover:text-white transition-colors"
                >
                  Change phone number
                </button>
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
                  <p className="text-gray-400 text-sm mb-2">Redirecting...</p>
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

          {/* Footer Links */}
          <div className="border-t border-[#2A2A2A] pt-6">
            <p className="text-center text-xs text-gray-500">
              By signing up, you agree to our{" "}
              <Link href="/terms" className="text-neon hover:underline">
                Terms of Service
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
