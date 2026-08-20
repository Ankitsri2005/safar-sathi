"use client";

import { cn } from "@/utils/cn";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  variant?: "ring" | "dots" | "pulse";
  className?: string;
}

const sizeMap = {
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-8 h-8",
};

export function Spinner({ size = "md", variant = "ring", className }: SpinnerProps) {
  if (variant === "dots") {
    return (
      <div className={cn("inline-flex items-center gap-1", className)}>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={cn(
              "rounded-full bg-current",
              size === "sm" ? "w-1 h-1" : size === "md" ? "w-1.5 h-1.5" : "w-2 h-2",
              "animate-pulse-ring"
            )}
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    );
  }

  if (variant === "pulse") {
    return (
      <span
        className={cn(
          "inline-block rounded-full bg-current animate-pulse-ring",
          sizeMap[size],
          className
        )}
      />
    );
  }

  return (
    <svg
      className={cn("animate-spin", sizeMap[size], className)}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
