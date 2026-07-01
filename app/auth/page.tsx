"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { Logo } from "@/components/ui/Logo";
import { Phone, ArrowRight, Shield } from "lucide-react";

export default function AuthPage() {
  const router = useRouter();
  const { dispatch } = useApp();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const maskedPhone = phone ? `${phone.slice(0, 4)}***${phone.slice(-4)}` : "";

  const handleSendOTP = async () => {
    if (phone.length < 10) {
      setError("Enter a valid 10-digit phone number");
      return;
    }
    setError("");
    setLoading(true);
    // Mock API call
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    setStep("otp");
  };

  const handleOtpChange = (val: string, idx: number) => {
    if (!/^\d?$/.test(val)) return;
    const newOtp = [...otp];
    newOtp[idx] = val;
    setOtp(newOtp);
    if (val && idx < 5) {
      document.getElementById(`otp-${idx + 1}`)?.focus();
    }
    // Auto verify
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
    // Mock verification — accept any 6-digit code
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    dispatch({ type: "LOGIN", phone: `0${phone}` });
    router.push("/format");
  };

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center px-5 bg-bg">
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
              <div className="bg-card border border-[#2A2A2A] rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Phone size={18} className="text-neon" />
                  <h2 className="text-white font-bold text-lg">Enter your phone number</h2>
                </div>
                <p className="text-gray-400 text-sm mb-5">We&apos;ll send a verification code via SMS</p>

                <div className="flex items-center gap-2 mb-4">
                  <div className="bg-[#2A2A2A] rounded-xl px-3 py-3.5 text-sm font-semibold text-white whitespace-nowrap">
                    🇳🇬 +234
                  </div>
                  <input
                    type="tel"
                    inputMode="numeric"
                    placeholder="8012345678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    className="flex-1 bg-[#2A2A2A] rounded-xl px-4 py-3.5 text-white placeholder-gray-500 text-sm font-medium outline-none focus:ring-2 focus:ring-neon"
                    onKeyDown={(e) => e.key === "Enter" && handleSendOTP()}
                  />
                </div>

                {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

                <button
                  onClick={handleSendOTP}
                  disabled={loading}
                  className="btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
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
              <div className="bg-card border border-[#2A2A2A] rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Shield size={18} className="text-neon" />
                  <h2 className="text-white font-bold text-lg">Enter OTP</h2>
                </div>
                <p className="text-gray-400 text-sm mb-5">
                  Enter the 6-digit code sent to <span className="text-white font-semibold">{maskedPhone}</span>
                </p>

                <div className="flex gap-2 justify-between mb-5">
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
                      className="w-11 h-12 text-center text-white font-bold text-lg bg-[#2A2A2A] rounded-xl border border-[#2A2A2A] focus:border-neon focus:ring-2 focus:ring-neon/30 outline-none transition-colors"
                      autoFocus={i === 0}
                    />
                  ))}
                </div>

                {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

                <button
                  onClick={() => handleVerify()}
                  disabled={loading}
                  className="btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <span className="animate-spin border-2 border-black border-t-transparent rounded-full w-5 h-5" />
                  ) : (
                    "Verify & Continue"
                  )}
                </button>

                <button
                  onClick={() => setStep("phone")}
                  className="w-full text-center text-gray-400 text-sm mt-3 py-2"
                >
                  Change number
                </button>

                <p className="text-center text-xs text-gray-500 mt-2">
                  Didn&apos;t receive it? Use <span className="text-neon font-bold">123456</span> to demo
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </main>
  );
}
