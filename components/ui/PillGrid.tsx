"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Pill as PillIcon } from "lucide-react";
import type { PillData } from "@/lib/api";
import PillConfirmation from "./PillConfirmation";

interface PillGridProps {
  pills: PillData[];
  onPillSelect: (pill: PillData) => void;
}

export default function PillGrid({ pills, onPillSelect }: PillGridProps) {
  const [selectedPill, setSelectedPill] = useState<PillData | null>(null);

  const handlePillClick = (pill: PillData) => {
    setSelectedPill(pill);
  };

  const handleConfirm = () => {
    if (selectedPill) {
      onPillSelect(selectedPill);
      setSelectedPill(null);
    }
  };

  const handleCancel = () => {
    setSelectedPill(null);
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-4 pb-24">
        {pills.map((pill, idx) => (
          <motion.button
            key={pill.id}
            onClick={() => handlePillClick(pill)}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1, duration: 0.3 }}
            className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-6 min-h-48 flex flex-col items-center justify-center gap-3 hover:border-[#00FF66] transition-colors"
          >
            <PillIcon size={32} className="text-[#00FF66]" />
            <div className="text-center">
              <p className="text-xs text-[#888] uppercase tracking-tight font-bold">{pill.category}</p>
              <p className="text-sm font-bold mt-2">₦{pill.price}</p>
            </div>
          </motion.button>
        ))}
      </div>

      {selectedPill && (
        <PillConfirmation
          pill={selectedPill}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </>
  );
}
