"use client";

import { type ReactNode, type CSSProperties } from "react";
import { useInView } from "@/hooks/useInView";
import { cn } from "@/utils/cn";

interface AnimateOnScrollProps {
  children: ReactNode;
  className?: string;
  animation?: "fade-in-up" | "fade-in-down" | "fade-in-left" | "fade-in-right" | "scale-in" | "fade-in";
  delay?: number;
  duration?: number;
  style?: CSSProperties;
}

const animationClasses = {
  "fade-in-up": "animate-fade-in-up",
  "fade-in-down": "animate-fade-in-down",
  "fade-in-left": "animate-fade-in-left",
  "fade-in-right": "animate-fade-in-right",
  "scale-in": "animate-scale-in",
  "fade-in": "animate-fade-in",
};

export function AnimateOnScroll({
  children,
  className,
  animation = "fade-in-up",
  delay = 0,
  duration,
  style,
}: AnimateOnScrollProps) {
  const { ref, isInView } = useInView({ threshold: 0.1, rootMargin: "0px 0px -30px 0px" });

  return (
    <div
      ref={ref}
      className={cn(
        isInView ? animationClasses[animation] : "opacity-0",
        className
      )}
      style={{
        animationDelay: `${delay}ms`,
        animationDuration: duration ? `${duration}ms` : undefined,
        animationFillMode: "both",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
