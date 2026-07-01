"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { walletApi, ApiError } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { dispatch } = useApp();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const [amount, setAmount] = useState(0);

  useEffect(() => {
    const reference = searchParams.get("reference") || searchParams.get("trxref");
    if (!reference) {
      setStatus("error");
      setMessage("No payment reference found.");
      return;
    }

    walletApi.verifyDeposit(reference)
      .then((data) => {
        setStatus("success");
        setAmount(data.amount);
        setMessage(data.message);
        dispatch({ type: "UPDATE_BALANCE", balance: data.newBalance });
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err instanceof ApiError ? err.message : "Payment verification failed.");
      });
  }, [searchParams, dispatch]);

  return (
    <div className="w-full max-w-sm text-center bg-card border border-[#2A2A2A] rounded-2xl p-8">
      {status === "loading" && (
        <>
          <Loader2 size={40} className="text-neon animate-spin mx-auto mb-4" />
          <p className="text-white font-semibold">Verifying payment...</p>
          <p className="text-gray-400 text-sm mt-1">Please wait, do not close this page</p>
        </>
      )}

      {status === "success" && (
        <>
          <CheckCircle size={48} className="text-neon mx-auto mb-4" />
          <h2 className="text-2xl font-black text-neon mb-2">Payment Confirmed!</h2>
          <p className="text-gray-400 mb-1">₦{amount.toLocaleString()} added to your wallet</p>
          <p className="text-gray-500 text-sm mb-5">{message}</p>
          <button onClick={() => router.push("/wallet")} className="btn-primary">
            Back to Wallet
          </button>
        </>
      )}

      {status === "error" && (
        <>
          <XCircle size={48} className="text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-black text-red-400 mb-2">Verification Failed</h2>
          <p className="text-gray-400 text-sm mb-5">{message}</p>
          <div className="flex flex-col gap-2">
            <button onClick={() => router.push("/wallet")} className="btn-secondary">
              Back to Wallet
            </button>
            <button onClick={() => router.push("/doors")} className="w-full py-3 text-gray-400 text-sm">
              Play anyway
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function VerifyDepositPage() {
  return (
    <div className="min-h-dvh bg-bg flex items-center justify-center px-5">
      <Suspense fallback={
        <div className="text-center">
          <Loader2 size={40} className="text-neon animate-spin mx-auto mb-4" />
          <p className="text-white">Loading...</p>
        </div>
      }>
        <VerifyContent />
      </Suspense>
    </div>
  );
}
