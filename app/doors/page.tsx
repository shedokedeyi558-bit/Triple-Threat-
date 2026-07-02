"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { NavBar } from "@/components/ui/NavBar";
import { DifficultyBadge } from "@/components/ui/DifficultyBadge";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { gameApi, type ApiDoor, ApiError } from "@/lib/api";
import { Wallet, CreditCard, Smartphone, Landmark, Loader2 } from "lucide-react";
import Link from "next/link";

const difficultyColors = {
  Easy: "text-green-400",
  Medium: "text-yellow-400",
  Hard: "text-red-400",
};

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
    <div className="min-h-dvh bg-bg flex flex-col">
      <NavBar showBack showWallet />

      <main className="flex-1 px-3 sm:px-4 py-4 sm:py-5">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 sm:mb-5"
        >
          <h1 className="text-xl sm:text-2xl font-black text-white">Pick your door</h1>
          <p className="text-gray-400 text-xs sm:text-sm mt-1">
            Each door has a question. Answer correctly to win.
          </p>
          {state.selectedFormat && (
            <span className="inline-block mt-2 text-xs px-2.5 sm:px-3 py-1 rounded-full bg-neon/10 text-neon border border-neon/20 font-medium">
              {state.selectedFormat === "multiple_choice" ? "📝 Multiple Choice" : "⌨️ Type Answer"}
            </span>
          )}
        </motion.div>

        {/* Loading state */}
        {state.doorsLoading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 size={32} className="text-neon animate-spin" />
            <p className="text-gray-400 text-sm">Loading doors...</p>
          </div>
        )}

        {/* Error state */}
        {state.doorsError && !state.doorsLoading && (
          <div className="bg-red-900/20 border border-red-800/40 rounded-2xl p-4 text-center">
            <p className="text-red-400 text-sm mb-3">{state.doorsError}</p>
            <button
              onClick={() => {
                dispatch({ type: "DOORS_LOADING" });
                gameApi.getDoors()
                  .then((d) => dispatch({ type: "SET_DOORS", doors: d }))
                  .catch(() => dispatch({ type: "DOORS_ERROR", error: "Failed to load doors" }));
              }}
              className="text-neon text-sm underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Door cards */}
        {!state.doorsLoading && !state.doorsError && (
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {doors.map((door, i) => (
              <motion.button
                key={door.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.12 }}
                onClick={() => handleDoorTap(door)}
                className="door-card min-h-32 sm:min-h-40"
                whileTap={{ scale: 0.95 }}
              >
                <div className="text-3xl sm:text-4xl mb-1">🚪</div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Door {door.id}
                </div>
                <div className={`text-lg sm:text-xl font-black mt-1 ${difficultyColors[door.question.difficulty]}`}>
                  ₦{door.prize.toLocaleString()}
                </div>
                <DifficultyBadge difficulty={door.question.difficulty} />
                <div className="mt-1 sm:mt-2 text-xs text-gray-500 font-medium">Tap to select</div>
              </motion.button>
            ))}
          </div>
        )}

        {/* Wallet bar */}
        <motion.div
          className="mt-4 sm:mt-6 bg-card border border-[#2A2A2A] rounded-lg sm:rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div>
            <p className="text-xs text-gray-400">Wallet balance</p>
            <p className="text-neon font-bold text-base sm:text-lg">₦{balance.toLocaleString()}</p>
          </div>
          <Link
            href="/wallet"
            className="text-xs sm:text-sm font-semibold text-black bg-neon px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl active:scale-95 transition-transform"
          >
            Top up
          </Link>
        </motion.div>
      </main>

      {/* Payment bottom sheet */}
      <BottomSheet
        open={!!selectedDoor}
        onClose={() => setSelectedDoor(null)}
        title={selectedDoor ? `Door ${selectedDoor.id} — ₦${selectedDoor.prize.toLocaleString()} at stake` : ""}
      >
        {selectedDoor && (
          <div className="space-y-3 sm:space-y-4">
            <div className="bg-[#111] rounded-lg sm:rounded-xl p-3 sm:p-4 flex items-center justify-between">
              <span className="text-gray-400 text-xs sm:text-sm">Entry fee</span>
              <span className="text-white font-bold text-base sm:text-lg">₦{selectedDoor.entry_fee.toLocaleString()}</span>
            </div>
            <div className="bg-[#111] rounded-lg sm:rounded-xl p-3 sm:p-4 flex items-center justify-between">
              <span className="text-gray-400 text-xs sm:text-sm">Prize if you win</span>
              <span className="text-neon font-bold text-base sm:text-lg">₦{selectedDoor.prize.toLocaleString()}</span>
            </div>

            <div className="bg-[#111] rounded-lg sm:rounded-xl p-3 sm:p-4">
              <p className="text-xs text-gray-400 mb-2 sm:mb-3">Accepted payments</p>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {[
                  { icon: CreditCard, label: "Card" },
                  { icon: Smartphone, label: "USSD" },
                  { icon: Smartphone, label: "OPay" },
                  { icon: Smartphone, label: "PalmPay" },
                  { icon: Landmark, label: "Transfer" },
                ].map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="flex items-center gap-1 bg-[#2A2A2A] rounded-lg px-2 sm:px-2.5 py-1 sm:py-1.5 text-xs text-gray-300"
                  >
                    <Icon size={12} />
                    {label}
                  </div>
                ))}
              </div>
            </div>

            {payError && (
              <div className="bg-red-900/30 border border-red-800 rounded-lg sm:rounded-xl p-2.5 sm:p-3 text-xs sm:text-sm text-red-400">
                {payError}
                {payError.includes("balance") && (
                  <Link href="/wallet" className="block mt-1 text-neon underline text-xs sm:text-sm">
                    Top up wallet →
                  </Link>
                )}
              </div>
            )}

            <button
              onClick={handlePay}
              disabled={paying}
              className="btn-primary flex items-center justify-center gap-2 disabled:opacity-60 text-sm sm:text-base"
            >
              {paying ? (
                <>
                  <span className="animate-spin border-2 border-black border-t-transparent rounded-full w-5 h-5" />
                  Processing…
                </>
              ) : (
                <>
                  <Wallet size={18} />
                  Pay ₦{selectedDoor.entry_fee.toLocaleString()}
                </>
              )}
            </button>

            <button
              onClick={() => setSelectedDoor(null)}
              className="w-full text-center text-gray-400 text-xs sm:text-sm py-2"
            >
              Cancel
            </button>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
