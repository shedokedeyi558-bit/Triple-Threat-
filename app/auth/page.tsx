"use client";

import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { motion } from "framer-motion";
import { AlertCircle, Loader2 } from "lucide-react";
import { authApi } from "@/lib/api";
import { setToken } from "@/lib/api";

type Step = "phone" | "otp";

export default function AuthPage() {
  const { dispatch } = useApp();
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkbox, setCheckbox] = useState(false);

  const handlePhoneChange = (value: string) => {
    // Only allow digits, max 10
    const cleaned = value.replace(/\D/g, "").slice(0, 10);
    setPhone(cleaned);
  };

  const handleOtpChange = (index: number, value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length > 1) return;

    const newOtp = [...otp];
    newOtp[index] = cleaned;
    setOtp(newOtp);

    // Auto-advance to next box
    if (cleaned && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!phone || phone.length !== 10) {
      setError("Please enter a valid 10-digit phone number");
      return;
    }

    if (!checkbox) {
      setError("You must confirm you are 18 or older");
      return;
    }

    setLoading(true);
    try {
      // Register with +234 prefix
      await authApi.register(`+234${phone}`);
      setStep("otp");
    } catch (err: any) {
      setError(err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      setError("Please enter a 6-digit code");
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.verifyOtp(`+234${phone}`, otpCode);

      // Store token and player info
      setToken(res.token);
      dispatch({
        type: "LOGIN",
        player: {
          id: res.player.id,
          email: "",
          phone: res.player.phone,
          name: res.player.name,
          balance: res.player.balance,
        },
        token: res.token,
      });

      router.push("/play");
    } catch (err: any) {
      setError(err.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white flex flex-col">
      <header className="px-4 sm:px-6 py-6">
        <Logo size="md" />
      </header>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 flex items-center justify-center px-4"
      >
        <div className="w-full max-w-sm">
          {step === "phone" ? (
            <form onSubmit={handlePhoneSubmit} className="space-y-6">
              <div className="text-center mb-8">
                <h1 className="text-2xl font-black uppercase mb-2">Get Started</h1>
                <p className="text-gray-400">Enter your phone number to begin</p>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-900/20 border border-red-700/50 rounded-lg p-4 flex gap-3"
                >
                  <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-red-300 text-sm">{error}</p>
                </motion.div>
              )}

              <div>
                <label className="text-sm font-semibold text-gray-300 block mb-3">
                  Phone Number
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">
                    +234
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="8012345678"
                    maxLength={10}
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 py-4 pl-16 text-white placeholder-gray-600 focus:outline-none focus:border-neon transition-colors"
                  />
                </div>
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checkbox}
                  onChange={(e) => setCheckbox(e.target.checked)}
                  className="w-5 h-5 rounded accent-neon mt-1 cursor-pointer"
                />
                <span className="text-sm text-gray-400">
                  I confirm I am 18 years or older and agree to the Terms of Service
                </span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-neon text-black font-bold py-4 rounded-xl hover:bg-neon/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {loading && <Loader2 size={20} className="animate-spin" />}
                Send Code
              </button>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit} className="space-y-6">
              <div className="text-center mb-8">
                <h1 className="text-2xl font-black uppercase mb-2">Verify Code</h1>
                <p className="text-gray-400">
                  We sent a 6-digit code to<br />
                  <span className="text-neon">+234{phone}</span>
                </p>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-900/20 border border-red-700/50 rounded-lg p-4 flex gap-3"
                >
                  <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-red-300 text-sm">{error}</p>
                </motion.div>
              )}

              <div>
                <label className="text-sm font-semibold text-gray-300 block mb-4">
                  Enter Code
                </label>
                <div className="flex gap-2 justify-between">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`otp-${idx}`}
                      type="text"
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      maxLength={1}
                      inputMode="numeric"
                      className="w-12 h-14 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-center text-xl font-bold text-white focus:outline-none focus:border-neon transition-colors"
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-neon text-black font-bold py-4 rounded-xl hover:bg-neon/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {loading && <Loader2 size={20} className="animate-spin" />}
                Verify
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep("phone");
                  setError(null);
                }}
                className="w-full text-gray-400 hover:text-white py-2 transition-colors"
              >
                Back
              </button>
            </form>
          )}
        </div>
      </motion.div>

      <footer className="px-4 py-6 text-center text-xs text-gray-600">
        <p>Terms apply. Must be 18+</p>
      </footer>
    </main>
  );
}
