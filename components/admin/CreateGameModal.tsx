"use client";

import { Check, X, Pill, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CreateGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectType: (type: "pill_pack" | "predictions") => void;
}

export function CreateGameModal({ isOpen, onClose, onSelectType }: CreateGameModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-card border border-[#2A2A2A] rounded-2xl p-6 max-w-md w-full space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-white">Create New Game</h2>
              <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => onSelectType("pill_pack")}
                className="w-full p-4 rounded-xl border-2 border-[#2A2A2A] bg-[#111] hover:border-[#E8A33D]/40 transition-all text-left"
              >
                <div className="flex items-start gap-3">
                  <Pill size={24} className="text-[#4C6FFF] flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-black text-white text-sm">PILL PACK</h3>
                    <p className="text-xs text-gray-400 mt-1">Set of anonymous questions as colored pills. Instant results.</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => onSelectType("predictions")}
                className="w-full p-4 rounded-xl border-2 border-[#2A2A2A] bg-[#111] hover:border-[#E8A33D]/40 transition-all text-left"
              >
                <div className="flex items-start gap-3">
                  <Clock size={24} className="text-[#4C6FFF] flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-black text-white text-sm">TIME MACHINE</h3>
                    <p className="text-xs text-gray-400 mt-1">Open prediction with countdown. Reveal answer & pay winners.</p>
                  </div>
                </div>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

