"use client";
import { useEffect, useRef, useState } from "react";

interface Props {
  duration: number;
  onExpire: () => void;
  running: boolean;
}

export function TimerBar({ duration, onExpire, running }: Props) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const expiredRef = useRef(false);

  useEffect(() => {
    setTimeLeft(duration);
    expiredRef.current = false;
  }, [duration]);

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          if (!expiredRef.current) {
            expiredRef.current = true;
            setTimeout(onExpire, 0);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, onExpire]);

  const pct = (timeLeft / duration) * 100;
  const isLow = timeLeft <= 3;
  const isMid = timeLeft <= 5 && timeLeft > 3;

  const barColor = isLow ? "bg-red-500" : isMid ? "bg-yellow-400" : "bg-[#4C6FFF]";

  return (
    <div className={`w-full ${isLow ? "animate-shake" : ""}`}>
      <div className="flex justify-between text-xs font-semibold mb-1 px-1">
        <span className="text-gray-400">Time</span>
        <span className={isLow ? "text-red-400" : "text-[#4C6FFF]"}>
          {timeLeft}s
        </span>
      </div>
      <div className="w-full h-3 bg-[#2A2A2A] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
