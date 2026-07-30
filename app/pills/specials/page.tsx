"use client";

// Specials lobby has moved to /pills — redirect there
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SpecialsRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/pills"); }, [router]);
  return null;
}
