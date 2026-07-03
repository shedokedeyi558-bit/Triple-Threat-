"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { NavBar } from "@/components/ui/NavBar";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { gameApi, type ApiDoor, ApiError } from "@/lib/api";
import { Wallet, CreditCard, Smartphone, Landmark, Loader2, Lock } from "lucide-react";
import Link from "next/link";

export default function DoorsPage() {
  const router = useRouter();
  const { state, dispatch } = useApp();
  const [selectedDoor, setSelectedDoor] = useState<ApiDoor | null>(null);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");

  // Load live doors
  useEffect(() => {
    dispatch({ type: "DOORS_LOADING" });
    gameApi.getDoors()
      .then((doors) => dispatch({ type: "SET_DOORS", doors }))
      .catch((err) => dispatch({
        type: "DOORS_ERROR",
        error: err instanceof ApiError ? err.message : "Failed to load doors",
      }));
  }, [dispatch]);

  const handleDoorTap = (door: ApiDoor) => {
    if (!state.isAuthenticated) { router.push("/auth"); return; }
    setSelectedDoor(door);
    setPayError("");
  };

  const handlePay = async () => {
    if (!selectedDoor || !state.player) return;

    if (state.player.balance < selectedDoor.entry_fee) {
      setPayError("Insufficient balance. Please top up your wallet.");
      return;
    }
    setPaying(true);
    setPayError("");

    try {
      const data = await gameApi.play(selectedDoor.id);

      dispatch({ type: "SELECT_DOOR", door: selectedDoor });
      dispatch({
        type: "START_SESSION",
        session: {
          sessionId: data.sessionId,
          doorId: selectedDoor.id,
          question: data.question,
          entryFee: data.entryFee,
        },
      });
      dispatch({ type: "UPDATE_BALANCE", balance: data.newBalance });
      setSelectedDoor(null);
      router.push("/question");
    } catch (err) {
      setPayError(err instanceof ApiError ? err.message : "Payment failed. Try again.");
    } finally {
      setPaying(false);
    }
  };

  const balance = state.player?.balance ?? 0;
  const doors = state.doors;

  return (
    <div className="min-h-dvh bg-[#0A0A0A] flex flex-col">
      <NavBar showWallet />

      <main className="flex-1 px-4 sm:px-6 py-8 sm:py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3">Select Your Challenge</h1>
            <p className="text-lg text-gray-400">
              Choose one of three doors. Each contains a unique question. Answer correctly to win.
            </p>
          </motion.div>

          {/* Loading state */}
          {state.doorsLoading && (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Loader2 size={40} className="text-[#00FF66] animate-spin" />
              <p className="text-gray-400 text-base">Loading challenges...</p>
            </div>
          )}

          {/* Error state */}
          {state.doorsError && !state.doorsLoading && (
            <div className="bg-red-950/40 border border-red-900/60 rounded-xl p-6 text-center mb-8">
              <p className="text-red-400 text-base font-medium mb-4">{state.doorsError}</p>
              <button
                onClick={() => {
                  dispatch({ type: "DOORS_LOADING" });
                  gameApi.getDoors()
                    .then((d) => dispatch({ type: "SET_DOORS", doors: d }))
                    .catch(() => dispatch({ type: "DOORS_ERROR", error: "Failed to load doors" }));
                }}
                className="text-[#00FF66] text-sm font-semibold underline hover:text-[#00FF66]/80 transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {/* Door cards */}
          {!state.doorsLoading && !state.doorsError && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {doors.map((door, i) => (
                  <motion.button
                    key={door.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.12 }}
                    onClick={() => handleDoorTap(door)}
                    whileTap={{ scale: 0.98 }}
                    className="group relative h-48 rounded-xl overflow-hidden transition-all duration-300"
                  >
                    {/* Background gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-900/40 to-black border border-gray-800 group-hover:border-[#00FF66]/40 transition-all duration-300" />
                    
                    {/* Hover effect overlay */}
                    <div className="absolute inset-0 bg-gradient-to-r from-[#00FF66]/0 to-[#00FF66]/0 group-hover:from-[#00FF66]/10 group-hover:to-[#00FF66]/0 transition-all duration-300" />

                    {/* Content */}
                    <div className="relative z-10 h-full flex flex-col items-center justify-center px-6">
                      {/* Door number - large and centered */}
                      <div className="text-6xl font-bold text-gray-700 group-hover:text-[#00FF66] transition-colors duration-300 mb-4">
                        {door.id}
                      </div>
                      
                      {/* Door label */}
                      <div className="text-center">
                        <p className="text-sm text-gray-500 uppercase tracking-widest font-semibold mb-2">
                          Selection {door.id}
                        </p>
                        <p className="text-xs text-gray-600 font-medium">
                          Tap to select
                        </p>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* Balance bar */}
              <motion.div
                className="bg-gradient-to-r from-gray-900/30 to-black border border-gray-800 rounded-xl px-6 py-5 flex items-center justify-between"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div>
                  <p className="text-sm text-gray-500 uppercase tracking-wide font-semibold mb-1">Available Balance</p>
                  <p className="text-[#00FF66] font-bold text-2xl">₦{balance.toLocaleString()}</p>
                </div>
                <Link
                  href="/wallet"
                  className="px-6 py-3 bg-[#00FF66] text-black font-bold rounded-lg hover:bg-[#00FF66]/90 transition-colors active:scale-95"
                >
                  Top Up
                </Link>
              </motion.div>
            </div>
          )}
        </div>
      </main>

      {/* Payment bottom sheet */}
      <BottomSheet
        open={!!selectedDoor}
        onClose={() => setSelectedDoor(null)}
        title={selectedDoor ? `Selection ${selectedDoor.id}` : ""}
      >
        {selectedDoor && (
          <div className="space-y-3">
            {/* Prize highlight */}
            <div className="bg-gradient-to-br from-[#00FF66]/10 to-[#00FF66]/5 border border-[#00FF66]/30 rounded-xl p-4">
              <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-1.5">Maximum Prize</p>
              <p className="text-3xl font-bold text-[#00FF66]">₦{selectedDoor.prize.toLocaleString()}</p>
            </div>

            {/* Entry fee */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 flex items-center justify-between">
              <span className="text-gray-400 text-sm font-medium">Entry Fee</span>
              <span className="text-white font-bold text-lg">₦{selectedDoor.entry_fee.toLocaleString()}</span>
            </div>

            {/* Payment methods */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
              <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-3">Payment Methods</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: CreditCard, label: "Card" },
                  { icon: Smartphone, label: "USSD" },
                  { icon: Smartphone, label: "OPay" },
                  { icon: Smartphone, label: "PalmPay" },
                  { icon: Landmark, label: "Bank Transfer" },
                  { icon: Wallet, label: "Wallet" },
                ].map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="flex items-center gap-2 bg-black/40 rounded-lg px-2.5 py-2.5 border border-gray-800 text-gray-300"
                  >
                    <Icon size={14} />
                    <span className="text-xs font-medium">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Error message */}
            {payError && (
              <div className="bg-red-950/40 border border-red-900/60 rounded-xl p-3 text-xs text-red-400">
                {payError}
                {payError.includes("balance") && (
                  <Link href="/wallet" className="block mt-1.5 text-[#00FF66] underline font-semibold text-xs">
                    Top up wallet →
                  </Link>
                )}
              </div>
            )}

            {/* Action buttons */}
            <button
              onClick={handlePay}
              disabled={paying}
              className="w-full flex items-center justify-center gap-2 bg-[#00FF66] text-black font-bold py-3.5 rounded-xl hover:bg-[#00FF66]/90 disabled:opacity-60 disabled:cursor-not-allowed transition-all active:scale-95 text-sm"
            >
              {paying ? (
                <>
                  <span className="animate-spin border-2 border-black border-t-transparent rounded-full w-4 h-4" />
                  Processing…
                </>
              ) : (
                <>
                  <Lock size={16} />
                  Confirm Entry — ₦{selectedDoor.entry_fee.toLocaleString()}
                </>
              )}
            </button>

            <button
              onClick={() => setSelectedDoor(null)}
              className="w-full text-center text-gray-500 text-sm font-medium py-2.5 hover:text-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
