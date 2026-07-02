"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { NavBar } from "@/components/ui/NavBar";
import { Loader2, Flame, Clock, Users } from "lucide-react";
import Link from "next/link";

interface Challenge {
  id: string;
  title: string;
  description: string;
  category: string;
  stake_amount: number;
  prize_pool: number;
  max_participants: number;
  current_participants: number;
  status: "active" | "locked" | "ended" | "closed";
  countdown_duration: number;
  ends_at: string;
  is_user_joined: boolean;
}

export default function ChallengesPage() {
  const router = useRouter();
  const { state } = useApp();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!state.isAuthenticated) {
      router.push("/auth");
      return;
    }
    // TODO: Fetch from API
    setLoading(false);
  }, [state.isAuthenticated, router]);

  const categoryColors: Record<string, string> = {
    "Sports": "bg-red-900/30 text-red-400",
    "Football": "bg-blue-900/30 text-blue-400",
    "Crypto": "bg-yellow-900/30 text-yellow-400",
    "Politics": "bg-purple-900/30 text-purple-400",
  };

  const statusBadge: Record<string, string> = {
    "active": "bg-neon/20 text-neon",
    "locked": "bg-yellow-900/20 text-yellow-400",
    "ended": "bg-gray-900/20 text-gray-400",
    "closed": "bg-gray-900/20 text-gray-400",
  };

  const getTimeRemaining = (endsAt: string) => {
    const now = new Date();
    const end = new Date(endsAt);
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return "Ended";
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m left`;
    return `${minutes}m left`;
  };

  return (
    <div className="min-h-dvh bg-bg flex flex-col">
      <NavBar title="Daily Challenges" showBack showWallet />

      <main className="flex-1 px-3 sm:px-4 py-4 sm:py-5">
        {error && (
          <div className="bg-red-900/20 border border-red-800 rounded-lg p-3 text-red-400 text-sm mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 size={32} className="text-neon animate-spin" />
          </div>
        ) : challenges.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-sm">No active challenges right now</p>
            <p className="text-gray-500 text-xs mt-1">Check back soon!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {challenges.map((challenge, idx) => (
              <motion.div
                key={challenge.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Link href={`/challenges/${challenge.id}`}>
                  <button className="w-full bg-card border border-[#2A2A2A] hover:border-neon/50 rounded-lg sm:rounded-xl p-3 sm:p-4 text-left transition-all active:scale-95">
                    {/* Header with title and status */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-white font-bold text-sm sm:text-base leading-tight truncate">
                          {challenge.title}
                        </h3>
                        <p className="text-gray-400 text-xs mt-1 line-clamp-1">
                          {challenge.description}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 font-medium ${statusBadge[challenge.status]}`}>
                        {challenge.status === "active" ? "🔴 Live" : challenge.status}
                      </span>
                    </div>

                    {/* Category and tags */}
                    <div className="flex items-center gap-2 flex-wrap mb-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${categoryColors[challenge.category] || "bg-gray-900/30 text-gray-400"}`}>
                        {challenge.category}
                      </span>
                      <span className="text-xs text-neon font-bold">
                        ₦{challenge.stake_amount.toLocaleString()}
                      </span>
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      <div className="bg-[#111] rounded-lg p-2 text-center">
                        <div className="text-neon font-black text-sm">
                          ₦{challenge.prize_pool.toLocaleString()}
                        </div>
                        <div className="text-gray-500 text-xs mt-0.5">Prize</div>
                      </div>
                      <div className="bg-[#111] rounded-lg p-2 text-center">
                        <div className="text-white font-bold text-sm">
                          {challenge.current_participants}/{challenge.max_participants}
                        </div>
                        <div className="text-gray-500 text-xs mt-0.5">Joined</div>
                      </div>
                      <div className="bg-[#111] rounded-lg p-2 text-center">
                        <div className="text-yellow-400 font-bold text-sm">
                          {getTimeRemaining(challenge.ends_at)}
                        </div>
                        <div className="text-gray-500 text-xs mt-0.5">Time</div>
                      </div>
                    </div>

                    {/* Join status */}
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-medium ${challenge.is_user_joined ? "text-neon" : "text-gray-500"}`}>
                        {challenge.is_user_joined ? "✓ You joined" : "Join challenge"}
                      </span>
                      {challenge.status === "locked" && (
                        <span className="text-xs text-yellow-400">Challenge locked</span>
                      )}
                    </div>
                  </button>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
