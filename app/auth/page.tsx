"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { Logo } from "@/components/ui/Logo";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { authApi, setToken, ApiError } from "@/lib/api";
import Link from "next/link";

type Step = "phone" | "otp";

export default function AuthPage() {
  const router = useRouter();
  const { dispatch } = useApp();
  
  const [step, setStep] = useState<Step>("phone");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Phone step
  const [phoneDigits, setPhoneDigits] = useState("");
  const [isOver18, setIsOver18] = useState(false);

  // OTP step
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [fullPhone, setFullPhone] = useState("");

  const handleSendOTP = async () => {
    if (phoneDigits.length !== 10) {
      setError("Please enter a valid 10-digit phone number");
      return;
    }
    if (!isOver18) {
      setError("You must confirm you are 18 years or older");
      return;
    }

    const phone = `234${phoneDigits}`;
    setFullPhone(phone);
    setError("");
    setLoading(true);

    try {
      await authApi.register(phone);
      setStep("otp");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to send OTP. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      setError("Please enter the complete 6-digit code");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const data = await authApi.verifyOtp(fullPhone, otpCode);
      setToken(data.token);
      dispatch({
        type: "LOGIN",
        token: data.token,
        player: {
          id: data.player.id,
          email: "", // Phone-only auth
          phone: data.player.phone,
          name: data.player.name,
          balance: data.player.balance,
          is_admin: false,
        },
      });
      router.push("/format");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Verification failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-advance
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleChangeNumber = () => {
    setStep("phone");
    setOtp(["", "", "", "", "", ""]);
    setError("");
  };

  const maskedPhone = fullPhone ? `+234${fullPhone.slice(3, 6)}****${fullPhone.slice(-3)}` : "";

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

        <AnimatePresence mode="wait">
          {step === "phone" ? (
            <motion.div
              key="phone"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="bg-gray-950 border border-gray-800 rounded-2xl p-6 space-y-5">
                <div className="text-center mb-2">
                  <h1 className="text-2xl font-bold text-white mb-2">Welcome to BitLyfe</h1>
                  <p className="text-sm text-gray-400">Enter your phone number to continue</p>
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-1.5 block">Phone Number</label>
                  <div className="flex items-center gap-2">
                    <div className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white text-sm font-medium">
                      +234
                    </div>
                    <input
                      type="tel"
                      inputMode="numeric"
                      placeholder="8012345678"
                      value={phoneDigits}
                      onChange={(e) => setPhoneDigits(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      onKeyDown={(e) => e.key === "Enter" && handleSendOTP()}
                      className="flex-1 bg-gray-900 border border-gray-800 focus:border-[#00FF66] rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Age confirmation checkbox */}
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isOver18}
                    onChange={(e) => setIsOver18(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-[#00FF66] cursor-pointer"
                  />
                  <span className="text-sm text-gray-300">
                    I confirm I am 18 years or older
                  </span>
                </label>

                {error && (
                  <div className="text-red-400 text-sm bg-red-900/20 border border-red-900/40 rounded-xl p-3">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleSendOTP}
                  disabled={loading || phoneDigits.length !== 10 || !isOver18}
                  className="w-full py-3 bg-[#00FF66] text-black font-semibold rounded-lg hover:bg-[#00FF66]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span className="animate-spin border-2 border-black border-t-transparent rounded-full w-5 h-5" />
                  ) : (
                    <>Send OTP <ArrowRight size={18} /></>
                  )}
                </button>

                <p className="text-center text-gray-500 text-xs mt-4">
                  By continuing you agree to our{" "}
                  <Link href="/terms" className="text-[#00FF66] underline">
                    Terms of Service
                  </Link>
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="otp"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="bg-gray-950 border border-gray-800 rounded-2xl p-6 space-y-5">
                <div className="text-center mb-2">
                  <h1 className="text-2xl font-bold text-white mb-2">Enter verification code</h1>
                  <p className="text-sm text-gray-400">
                    A 6-digit code was sent to {maskedPhone}
                  </p>
                </div>

                {/* OTP inputs */}
                <div className="flex gap-2 justify-center">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => { otpRefs.current[index] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className="w-12 h-14 bg-gray-900 border border-gray-800 focus:border-[#00FF66] rounded-xl text-white text-center text-xl font-bold outline-none transition-colors"
                    />
                  ))}
                </div>

                {error && (
                  <div className="text-red-400 text-sm bg-red-900/20 border border-red-900/40 rounded-xl p-3">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleVerifyOTP}
                  disabled={loading || otp.join("").length !== 6}
                  className="w-full py-3 bg-[#00FF66] text-black font-semibold rounded-lg hover:bg-[#00FF66]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span className="animate-spin border-2 border-black border-t-transparent rounded-full w-5 h-5" />
                  ) : (
                    <>Verify & Continue <ArrowRight size={18} /></>
                  )}
                </button>

                <button
                  onClick={handleChangeNumber}
                  className="w-full text-center text-gray-400 text-sm font-medium py-2 hover:text-[#00FF66] transition-colors flex items-center justify-center gap-2"
                >
                  <ArrowLeft size={16} />
                  Change number
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </main>
  );
}
