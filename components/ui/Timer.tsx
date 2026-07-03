"use client";

import { useEffect, useState } from "react";

interface Props {
  endTime: Date;
  format?: "short" | "long"; // "3h 45m 30s" vs "3d 3h 45m 30s"
}

export function Timer({ endTime, format = "short" }: Props) {
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date();
      const diff = endTime.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft("Ended");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (format === "long") {
        if (days > 0) {
          setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
        } else {
          setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
        }
      } else {
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [endTime, format]);

  return <span>{timeLeft}</span>;
}
