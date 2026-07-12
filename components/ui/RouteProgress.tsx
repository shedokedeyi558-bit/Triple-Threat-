"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// Thin indigo progress bar at the top — fires on route change start,
// completes when the new page renders. Pure DOM manipulation, no state.
export function RouteProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const barRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;

    // Start: shoot to 80% quickly, then slow crawl
    bar.style.width = "0%";
    bar.style.opacity = "1";

    let width = 0;
    const crawl = () => {
      if (width < 80) {
        width = Math.min(80, width + (80 - width) * 0.15 + 0.5);
      } else if (width < 95) {
        width = Math.min(95, width + 0.1);
      }
      bar.style.width = `${width}%`;
      rafRef.current = requestAnimationFrame(crawl);
    };
    rafRef.current = requestAnimationFrame(crawl);

    // Complete: fill to 100% then fade out
    const complete = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      bar.style.width = "100%";
      timerRef.current = setTimeout(() => {
        bar.style.opacity = "0";
        timerRef.current = setTimeout(() => { bar.style.width = "0%"; }, 200);
      }, 150);
    };

    // Complete fires when this effect re-runs (i.e. new page rendered)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (timerRef.current) clearTimeout(timerRef.current);
      complete();
    };
  }, [pathname, searchParams]);

  return <div id="route-progress" ref={barRef} style={{ width: "0%", opacity: 0 }} />;
}
