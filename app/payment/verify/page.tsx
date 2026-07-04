"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { walletApi, ApiError } from "@/lib/api";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Suspense } from "react";

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { dispatch } = useApp();

  const [status, setStatus] = useState<"loading" | "success" | "failed">("loading");
  const [message, setMessage] = useState("");
  const [amount, setAmount] = useState(0);

  useEffect(() => {
    const reference = searchParams.get("reference") || searchParams.get("trxref");

    if (!reference) {
      setStatus("failed");
      setMessage("No payment reference found.");
      return;
    }

    const verify = async () => {
      try {
        const data = await walletApi.verifyDeposit(reference);
        setAmount(data.amount);
        setMessage(data.message || "Deposit successful!");
        setStatus("success");

        // Refresh balance in app state
        try {
          const { balance } = await walletApi.getBalance();
          dispatch({ type: "UPDATE_BALANCE", balance });
        } catch {
          // non-critical
        }

        // Redirect to wallet after 3 seconds
        setTimeout(() => router.push("/wallet"), 3000);
      } catch (err) {
        setStatus("failed");
        setMessage(
          err instanceof ApiError ? err.message : "Payment verification failed. Contact support if money was deducted."
        );
        setTimeout(() => router.push("/wallet"), 4000);
      }
    };

    verify();
  }, [searchParams, dispatch, router]);

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center space-y-6">
        {status === "loading" && (
          <>
            <Loader2 size={48} className="text-neon animate-spin mx-auto" />
            <div>
              <h1 className="text-xl font-black text-white">Verifying Payment</h1>
              <p className="text-gray-400 text-sm mt-2">Please wait while we confirm your deposit...</p>
            </div>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle size={48} className="text-neon mx-auto" />
            <div>
              <h1 className="text-2xl font-black text-white">Deposit Confirmed</h1>
              {amount > 0 && (
                <p className="text-neon font-black text-3xl mt-2">+₦{amount.toLocaleString()}</p>
              )}
              <p className="text-gray-400 text-sm mt-2">{message}</p>
              <p className="text-gray-500 text-xs mt-3">Redirecting to wallet...</p>
            </div>
          </>
        )}

        {status === "failed" && (
          <>
            <XCircle size={48} className="text-red-500 mx-auto" />
            <div>
              <h1 className="text-xl font-black text-white">Verification Failed</h1>
              <p className="text-gray-400 text-sm mt-2">{message}</p>
              <p className="text-gray-500 text-xs mt-3">Redirecting to wallet...</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function PaymentVerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <Loader2 size={48} className="text-neon animate-spin" />
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
