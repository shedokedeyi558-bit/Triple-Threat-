"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { Logo } from "@/components/ui/Logo";
import { Phone, ArrowRight, Shield } from "lucide-react";
import { authApi, setToken, ApiError } from "@/lib/api";

export default function AuthPage() {
  const router = useRouter();
  const { dispatch } = useApp();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isReturning, setIsReturning] = useState(false); // Track if returning player

  // Normalise to the format the backend expects (e.g. 08012345678)
  const fullPhone = `0${phone}`;
  const maskedPhone = phone ? `0${phone.slice(0, 3)}***${phone.slice(-4)}` : "";

  const handleSendOTP = async () => {
    if (phone.length < 10) {
      setError("Enter a valid 10-digit phone number");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const response = await authApi.register(fullPhone);
      setIsReturning(response.isExisting); // Set flag based on backend response
      setStep("otp");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to send OTP. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (val: string, idx: number) => {
    if (!/^\d?$/.test(val)) return;
    const newOtp = [...otp];
    newOtp[idx] = val;
    setOtp(newOtp);
    if (val && idx < 5) {
      document.getElementById(`otp-${idx + 1}`)?.focus();
    }
    if (newOtp.every((d) => d !== "") && idx === 5) {
      handleVerify(newOtp.join(""));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      document.getElementById(`otp-${idx - 1}`)?.focus();
    }
  };

  const handleVerify = async (code?: string) => {
    const codeToVerify = code || otp.join("");
    if (codeToVerify.length < 6) {
      setError("Enter all 6 digits");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const data = await authApi.verifyOtp(fullPhone, codeToVerify);
      setToken(data.token);
      dispatch({
        type: "LOGIN",
        token: data.token,
        player: {
          id: data.player.id,
          phone: data.player.phone,
          name: data.player.name,
          balance: data.player.balance,
        },
      });
      router.push("/format");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Verification failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center px-4 sm:px-5 bg-bg">
      <motion.div
        className="w-full max-w-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="text-center mb-6 sm:mb-8">
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
              <div className="bg-card border border-[#2A2A2A] rounded-2xl p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Phone size={18} className="text-neon flex-shrink-0" />
                  <h2 className="text-white font-bold text-base sm:text-lg">Enter your phone number</h2>
                </div>
                <p className="text-gray-400 text-xs sm:text-sm mb-5">
                  We&apos;ll send a verification code via SMS
                </p>

                <div className="flex items-center gap-2 mb-4">
                  <div className="bg-[#2A2A2A] rounded-lg sm:rounded-xl px-2 sm:px-3 py-2.5 sm:py-3.5 text-xs sm:text-sm font-semibold text-white whitespace-nowrap">
                    🇳🇬 +234
                  </div>
                  <input
                    type="tel"
                    inputMode="numeric"
                    placeholder="8012345678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    className="flex-1 bg-[#2A2A2A] rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3.5 text-white placeholder-gray-500 text-sm font-medium outline-none focus:ring-2 focus:ring-neon"
                    onKeyDown={(e) => e.key === "Enter" && handleSendOTP()}
                  />
                </div>

                {error && <p className="text-red-400 text-xs sm:text-sm mb-3">{error}</p>}

                <button
                  onClick={handleSendOTP}
                  disabled={loading}
                  className="btn-primary flex items-center justify-center gap-2 disabled:opacity-50 text-sm sm:text-base"
                >
                  {loading ? (
                    <span className="animate-spin border-2 border-black border-t-transparent rounded-full w-5 h-5" />
                  ) : (
                    <>Send OTP <ArrowRight size={18} /></>
                  )}
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="otp"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="bg-card border border-[#2A2A2A] rounded-2xl p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Shield size={18} className="text-neon flex-shrink-0" />
                  <h2 className="text-white font-bold text-base sm:text-lg">
                    {isReturning ? "Welcome back!" : "Create account"}
                  </h2>
                </div>
                <p className="text-gray-400 text-xs sm:text-sm mb-5">
                  {isReturning ? "Enter the verification code sent to " : "Enter the 6-digit code sent to "}
                  <span className="text-white font-semibold">{maskedPhone}</span>
                </p>

                <div className="flex gap-1.5 sm:gap-2 justify-between mb-5">
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      id={`otp-${i}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(e.target.value, i)}
                      onKeyDown={(e) => handleKeyDown(e, i)}
                      className="flex-1 aspect-square min-w-0 max-w-12 sm:max-w-none text-center text-white font-bold text-base sm:text-lg bg-[#2A2A2A] rounded-lg sm:rounded-xl border border-[#2A2A2A] focus:border-neon focus:ring-2 focus:ring-neon/30 outline-none transition-colors"
                      autoFocus={i === 0}
                    />
                  ))}
                </div>

                {error && <p className="text-red-400 text-xs sm:text-sm mb-3">{error}</p>}

                <button
                  onClick={() => handleVerify()}
                  disabled={loading}
                  className="btn-primary flex items-center justify-center gap-2 disabled:opacity-50 text-sm sm:text-base"
                >
                  {loading ? (
                    <span className="animate-spin border-2 border-black border-t-transparent rounded-full w-5 h-5" />
                  ) : (
                    "Verify & Continue"
                  )}
                </button>

                <button
                  onClick={() => { setStep("phone"); setError(""); setIsReturning(false); }}
                  className="w-full text-center text-gray-400 text-xs sm:text-sm mt-3 py-2"
                >
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
