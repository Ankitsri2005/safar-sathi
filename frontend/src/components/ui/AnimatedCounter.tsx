"use client";

import { useInView } from "@/hooks/useInView";
import { useCountUp } from "@/hooks/useCountUp";
import { cn } from "@/utils/cn";

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  separator?: boolean;
  className?: string;
}

export function AnimatedCounter({
  value,
  duration = 1800,
  prefix = "",
  suffix = "",
  separator = true,
  className,
}: AnimatedCounterProps) {
  const { ref, isInView } = useInView({ threshold: 0.3 });
  const count = useCountUp(isInView ? value : 0, duration);
  const formatted = separator ? count.toLocaleString("en-IN") : String(count);

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
