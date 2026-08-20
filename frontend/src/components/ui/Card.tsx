"use client";

import { type HTMLAttributes, type ReactNode, forwardRef } from "react";
import { cn } from "@/utils/cn";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "glass" | "elevated";
  hover?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

const variants = {
  default: "bg-white border border-border shadow-sm",
  glass: "glass shadow-glass",
  elevated: "bg-white shadow-xl border border-border/50",
};

const paddings = {
  none: "",
  sm: "p-3",
  md: "p-5",
  lg: "p-7",
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = "default", hover = false, padding = "md", className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-xl transition-all duration-300",
          variants[variant],
          hover && "hover:shadow-lg hover:-translate-y-0.5",
          paddings[padding],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("mb-4", className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h3 className={cn("text-lg font-semibold text-fg", className)}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn("text-sm text-muted mt-1", className)}>
      {children}
    </p>
  );
}

export function CardContent({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn(className)}>{children}</div>;
}

export function CardFooter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("mt-4 pt-4 border-t border-border flex items-center", className)}>
      {children}
    </div>
  );
}
