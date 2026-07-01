"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { NavBar } from "@/components/ui/NavBar";
import { DifficultyBadge } from "@/components/ui/DifficultyBadge";
import { BottomSheet } from "@/components/ui/BottomSheet";
import type { Door } from "@/lib/types";
import { Wallet, CreditCard, Smartphone, Landmark } from "lucide-react";
import Link from "next/link";

const DOOR_EMOJIS = ["🚪", "🚪", "🚪"];

const difficultyColors = {
  Easy: "text-green-400",
  Medium: "text-yellow-400",
  Hard: "text-red-400",
};

export default function DoorsPage() {
  const router = useRouter();
  const { state, dispatch } = useApp();
  const [selectedDoor, setSelectedDoor] = useState<Door | null>(null);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");

  const handleDoorTap = (door: Door) => {
    if (!state.isAuthenticated) {
      router.push("/auth");
      return;
    }
    setSelectedDoor(door);
    setPayError("");
  };

  const handlePay = async () => {
    if (!selectedDoor) return;
    if (state.balance < selectedDoor.entryFee) {
      setPayError("Insufficient balance. Please top up your wallet.");
      return;
    }
    setPaying(true);
    setPayError("");
    // Mock Paystack payment — simulate 1.5s processing
    await new Promise((r) => setTimeout(r, 1500));
    setPaying(false);

    dispatch({ type: "SELECT_DOOR", door: selectedDoor });
    dispatch({
      type: "START_SESSION",
      session: {
        doorId: selectedDoor.id,
        questionId: selectedDoor.questionId,
        entryFee: selectedDoor.entryFee,
        prize: selectedDoor.prize,
      },
    });
    // Deduct entry fee from balance
    dispatch({ type: "SET_BALANCE", balance: state.balance - selectedDoor.entryFee });
    setSelectedDoor(null);
    router.push("/question");
  };

  return (
    <div className="min-h-dvh bg-bg flex flex-col">
      <NavBar showBack showWallet />

      <main className="flex-1 px-4 py-5">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5"
        >
          <h1 className="text-2xl font-black text-white">Pick your door</h1>
          <p className="text-gray-400 text-sm mt-1">Each door has a question. Answer correctly to win.</p>
          {state.selectedFormat && (
            <span className="inline-block mt-2 text-xs px-3 py-1 rounded-full bg-neon/10 text-neon border border-neon/20 font-medium">
              {state.selectedFormat === "multiple_choice" ? "📝 Multiple Choice" : "⌨️ Type Answer"}
            </span>
          )}
        </motion.div>

        <div className="grid grid-cols-3 gap-3">
          {state.doors.map((door, i) => (
            <motion.button
              key={door.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.12 }}
              onClick={() => handleDoorTap(door)}
              className="door-card min-h-[160px]"
              whileTap={{ scale: 0.95 }}
            >
              <div className="text-4xl mb-1">{DOOR_EMOJIS[i]}</div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Door {door.id}</div>
              <div className={`text-xl font-black mt-1 ${difficultyColors[door.difficulty]}`}>
                ₦{door.prize.toLocaleString()}
              </div>
              <DifficultyBadge difficulty={door.difficulty} />
              <div className="mt-2 text-xs text-gray-500 font-medium">Tap to select</div>
            </motion.button>
          ))}
        </div>

        {/* Wallet bar */}
        <motion.div
          className="mt-6 bg-card border border-[#2A2A2A] rounded-2xl px-4 py-3 flex items-center justify-between"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div>
            <p className="text-xs text-gray-400">Wallet balance</p>
            <p className="text-neon font-bold text-lg">₦{state.balance.toLocaleString()}</p>
          </div>
          <Link
            href="/wallet"
            className="text-sm font-semibold text-black bg-neon px-4 py-2 rounded-xl active:scale-95 transition-transform"
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
          <div className="space-y-4">
            <div className="bg-[#111] rounded-xl p-4 flex items-center justify-between">
              <span className="text-gray-400 text-sm">Entry fee</span>
              <span className="text-white font-bold text-lg">₦{selectedDoor.entryFee.toLocaleString()}</span>
            </div>
            <div className="bg-[#111] rounded-xl p-4 flex items-center justify-between">
              <span className="text-gray-400 text-sm">Prize if you win</span>
              <span className="text-neon font-bold text-lg">₦{selectedDoor.prize.toLocaleString()}</span>
            </div>

            <div className="bg-[#111] rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-3">Accepted payments</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { icon: CreditCard, label: "Card" },
                  { icon: Smartphone, label: "USSD" },
                  { icon: Smartphone, label: "OPay" },
                  { icon: Smartphone, label: "PalmPay" },
                  { icon: Landmark, label: "Transfer" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-1.5 bg-[#2A2A2A] rounded-lg px-2.5 py-1.5 text-xs text-gray-300">
                    <Icon size={12} />
                    {label}
                  </div>
                ))}
              </div>
            </div>

            {payError && (
              <div className="bg-red-900/30 border border-red-800 rounded-xl p-3 text-sm text-red-400">
                {payError}
                <Link href="/wallet" className="block mt-1 text-neon underline text-sm">
                  Top up wallet →
                </Link>
              </div>
            )}

            <button
              onClick={handlePay}
              disabled={paying}
              className="btn-primary flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {paying ? (
                <>
                  <span className="animate-spin border-2 border-black border-t-transparent rounded-full w-5 h-5" />
                  Processing…
                </>
              ) : (
                <>
                  <Wallet size={18} />
                  Pay ₦{selectedDoor.entryFee.toLocaleString()}
                </>
              )}
            </button>

            <button
              onClick={() => setSelectedDoor(null)}
              className="w-full text-center text-gray-400 text-sm py-2"
            >
              Cancel
            </button>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
