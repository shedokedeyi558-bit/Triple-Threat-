"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useApp } from "@/context/AppContext";
import { walletApi, ApiError } from "@/lib/api";
import { Loader2, CheckCircle, XCircle, RefreshCw } from "lucide-react";

// ─── Inner component (needs useSearchParams, must be wrapped in Suspense) ─────
function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { dispatch } = useApp();

  type VerifyStatus = "loading" | "success" | "already" | "failed";
  const [status, setStatus] = useState<VerifyStatus>("loading");
  const [message, setMessage] = useState("");
  const [newBalance, setNewBalance] = useState<number | null>(null);

  useEffect(() => {
    // Squad redirects back with ?transaction_ref=dep_xxx
    // Remap the value into the `reference` param our own API expects
    const transactionRef = searchParams.get("transaction_ref");

    if (!transactionRef) {
      setStatus("failed");
      setMessage("No payment reference found in the URL.");
      setTimeout(() => router.push("/wallet"), 4000);
      return;
    }

    const verify = async () => {
      try {
        // GET /api/wallet/verify?reference={transactionRef}
        const data = await walletApi.verifyDeposit(transactionRef);

        if (data.alreadyProcessed) {
          // Valid non-error state — webhook beat the return, or user refreshed
          setStatus("already");
          setMessage("Payment already processed");
        } else {
          setMessage(data.message || "Deposit successful!");
          setNewBalance(data.newBalance);
          setStatus("success");
        }

        // Refresh balance in app state regardless of path
        try {
          const res = await walletApi.getBalance();
          dispatch({
            type: "UPDATE_BALANCE",
            balance: res.balance,
            bonus_balance: res.bonus_balance ?? 0,
          });
        } catch {
          // non-critical — /wallet will re-fetch on load
        }

        setTimeout(() => router.push("/wallet"), 3000);
      } catch (err) {
        const apiErr = err instanceof ApiError ? err : null;
        const errMsg = apiErr ? apiErr.message : "Payment verification failed.";
        const isNotConfirmed = errMsg.toLowerCase().includes("payment not confirmed");

        setStatus("failed");
        setMessage(
          isNotConfirmed
            ? `Payment not confirmed${apiErr?.status ? ` (status ${apiErr.status})` : ""}. If money was deducted, please contact support.`
            : errMsg
        );
        setTimeout(() => router.push("/wallet"), 5000);
      }
    };

    verify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: "#0A0A0A" }}
    >
      <div className="w-full max-w-sm text-center space-y-6">

        {status === "loading" && (
          <>
            <Loader2
              size={48}
              className="animate-spin mx-auto"
              style={{ color: "var(--accent-indigo)" }}
            />
            <div>
              <h1 className="text-xl font-black text-white">Verifying Payment</h1>
              <p className="text-sm mt-2" style={{ color: "#9ca3af" }}>
                Please wait while we confirm your deposit…
              </p>
            </div>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle size={48} className="mx-auto" style={{ color: "var(--accent-amber)" }} />
            <div>
              <h1 className="text-2xl font-black text-white">Deposit Confirmed</h1>
              <p
                className="font-black text-3xl mt-3 font-mono"
                style={{ color: "var(--accent-amber)" }}
              >
                {message}
              </p>
              {newBalance !== null && (
                <p className="text-sm mt-3" style={{ color: "#9ca3af" }}>
                  New balance:{" "}
                  <span className="font-bold text-white font-mono">
                    ₦{newBalance.toLocaleString()}
                  </span>
                </p>
              )}
              <p className="text-xs mt-4" style={{ color: "#6b7280" }}>
                Redirecting to wallet…
              </p>
            </div>
          </>
        )}

        {status === "already" && (
          <>
            <RefreshCw size={48} className="mx-auto" style={{ color: "var(--accent-indigo)" }} />
            <div>
              <h1 className="text-xl font-black text-white">Payment Already Processed</h1>
              <p className="text-sm mt-2" style={{ color: "#9ca3af" }}>
                This payment was already credited to your wallet.
              </p>
              <p className="text-xs mt-4" style={{ color: "#6b7280" }}>
                Redirecting to wallet…
              </p>
            </div>
          </>
        )}

        {status === "failed" && (
          <>
            <XCircle size={48} className="mx-auto text-red-500" />
            <div>
              <h1 className="text-xl font-black text-white">Verification Failed</h1>
              <p className="text-sm mt-2" style={{ color: "#9ca3af" }}>
                {message}
              </p>
              <p className="text-xs mt-4" style={{ color: "#6b7280" }}>
                Redirecting to wallet…
              </p>
            </div>
          </>
        )}

      </div>
    </div>
  );
}

export default function PaymentVerifyPage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ backgroundColor: "#0A0A0A" }}
        >
          <Loader2
            size={48}
            className="animate-spin"
            style={{ color: "var(--accent-indigo)" }}
          />
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
