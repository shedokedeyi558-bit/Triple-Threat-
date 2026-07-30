"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { Loader2 } from "lucide-react";

// Standard pills have been removed. The Pills tab now goes directly to Specials.
export default function PillsRedirectPage() {
  const { state } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!state.isAuthenticated) {
      router.replace("/auth");
    } else {
      router.replace("/pills/specials");
    }
  }, [state.isAuthenticated, router]);

  return (
    <div className="flex items-center justify-center min-h-64">
      <Loader2 size={24} className="animate-spin" style={{ color: "var(--accent-indigo)" }} />
    </div>
  );
}
