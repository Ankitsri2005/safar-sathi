"use client";

import { type ReactNode } from "react";
import { cn } from "@/utils/cn";

interface BadgeProps {
  variant?: "default" | "primary" | "success" | "warning" | "danger" | "accent" | "outline";
  size?: "sm" | "md";
  pulse?: boolean;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

const variants = {
  default: "bg-gray-100 text-gray-700",
  primary: "bg-primary-100 text-primary",
  success: "bg-success-100 text-success",
  warning: "bg-warning-100 text-warning",
  danger: "bg-danger-100 text-danger",
  accent: "bg-accent-100 text-accent",
  outline: "bg-transparent border border-current",
};

const sizes = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-xs",
};

export function Badge({
  variant = "default",
  size = "sm",
  pulse = false,
  icon,
  children,
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium",
        variants[variant],
        sizes[size],
        className
      )}
    >
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span className={cn("absolute inline-flex h-full w-full rounded-full opacity-75 animate-pulse-ring", variant === "danger" ? "bg-danger" : variant === "success" ? "bg-success" : variant === "warning" ? "bg-warning" : variant === "primary" ? "bg-primary" : "bg-gray-500")} />
          <span className={cn("relative inline-flex rounded-full h-2 w-2", variant === "danger" ? "bg-danger" : variant === "success" ? "bg-success" : variant === "warning" ? "bg-warning" : variant === "primary" ? "bg-primary" : "bg-gray-500")} />
        </span>
      )}
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </span>
  );
}
