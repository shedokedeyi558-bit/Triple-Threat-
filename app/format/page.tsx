"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { NavBar } from "@/components/ui/NavBar";
import { CheckSquare, Keyboard, ArrowRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { QuestionFormat } from "@/lib/types";

const formats: {
  id: QuestionFormat;
  icon: LucideIcon;
  title: string;
  subtitle: string;
  tags: string[];
  color: string;
}[] = [
  {
    id: "multiple_choice",
    icon: CheckSquare,
    title: "Multiple Choice",
    subtitle: "Pick from 4 options",
    tags: ["Easier", "More confident", "4 options shown"],
    color: "border-neon/30 hover:border-neon",
  },
  {
    id: "type_answer",
    icon: Keyboard,
    title: "Type Answer",
    subtitle: "Type the answer yourself",
    tags: ["Spelling counts", "Higher risk", "Higher reward"],
    color: "border-gold/30 hover:border-gold",
  },
];

export default function FormatPage() {
  const router = useRouter();
  const { dispatch, state } = useApp();

  const handleSelect = (format: QuestionFormat) => {
    dispatch({ type: "SET_FORMAT", format });
    router.push("/doors");
  };

  return (
    <div className="min-h-dvh bg-bg flex flex-col">
      <NavBar title="Choose Format" showBack />

      <main className="flex-1 px-3 sm:px-5 py-5 sm:py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 sm:mb-6"
        >
          <h1 className="text-xl sm:text-2xl font-black text-white">How do you want to play?</h1>
          <p className="text-gray-400 text-xs sm:text-sm mt-1">You can change this before each game</p>
        </motion.div>

        <div className="flex flex-col gap-3 sm:gap-4">
          {formats.map(({ id, icon: Icon, title, subtitle, tags, color }, i) => (
            <motion.button
              key={id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => handleSelect(id)}
              className={`w-full text-left bg-card border-2 rounded-lg sm:rounded-2xl p-3.5 sm:p-5 transition-all duration-200 active:scale-95 group ${
                state.selectedFormat === id ? "border-neon shadow-[0_0_16px_#00FF6633]" : color
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 sm:gap-3 min-w-0">
                  <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl flex-shrink-0 ${id === "multiple_choice" ? "bg-neon/10" : "bg-gold/10"}`}>
                    <Icon
                      size={20}
                      className={`${id === "multiple_choice" ? "text-neon" : "text-gold"}`}
                    />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-white font-bold text-sm sm:text-lg">{title}</h2>
                    <p className="text-gray-400 text-xs sm:text-sm">{subtitle}</p>
                  </div>
                </div>
                <ArrowRight size={18} className="text-gray-600 group-hover:text-white transition-colors mt-1 flex-shrink-0" />
              </div>

              <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-3 sm:mt-4">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-[#2A2A2A] text-gray-300 font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </motion.button>
          ))}
        </div>
      </main>
    </div>
  );
}
