"use client";

import { forwardRef, useRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/utils/cn";
import { Spinner } from "./Spinner";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "outline" | "accent";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: ReactNode;
  iconRight?: ReactNode;
}

const variants = {
  primary: "bg-primary text-white hover:bg-primary-dark shadow-md hover:shadow-glow active:scale-[0.98]",
  secondary: "bg-surface-light text-white hover:bg-surface-lighter shadow-md active:scale-[0.98]",
  danger: "bg-danger text-white hover:bg-danger-dark shadow-md active:scale-[0.98]",
  ghost: "bg-transparent text-fg hover:bg-surface-light/10 active:scale-[0.98]",
  outline: "bg-transparent text-fg border-2 border-border hover:border-primary hover:text-primary active:scale-[0.98]",
  accent: "bg-accent text-white hover:bg-accent-dark shadow-md hover:shadow-glow-accent active:scale-[0.98]",
};

const sizes = {
  sm: "px-3 py-1.5 text-xs rounded-md gap-1.5",
  md: "px-4 py-2.5 text-sm rounded-lg gap-2",
  lg: "px-6 py-3 text-base rounded-xl gap-2.5",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      icon,
      iconRight,
      className,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const rippleRef = useRef<HTMLSpanElement>(null);

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (rippleRef.current) {
        const btn = e.currentTarget;
        const rect = btn.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        rippleRef.current.style.width = rippleRef.current.style.height = `${size}px`;
        rippleRef.current.style.left = `${x}px`;
        rippleRef.current.style.top = `${y}px`;
        rippleRef.current.classList.remove("animate-ripple");
        void rippleRef.current.offsetWidth;
        rippleRef.current.classList.add("animate-ripple");
      }
      props.onClick?.(e);
    };

    return (
      <button
        ref={ref}
        className={cn(
          "relative inline-flex items-center justify-center font-medium transition-all duration-200 overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:opacity-50 disabled:pointer-events-none",
          variants[variant],
          sizes[size],
          className
        )}
        disabled={disabled || loading}
        onClick={handleClick}
        {...props}
      >
        <span
          ref={rippleRef}
          className="absolute rounded-full bg-white/20 w-0 h-0 pointer-events-none"
          style={{ transform: "scale(0)", opacity: 0 }}
        />
        {loading ? (
          <Spinner size={size === "sm" ? "sm" : "md"} className="text-current" />
        ) : (
          icon && <span className="shrink-0">{icon}</span>
        )}
        {children && <span>{children}</span>}
        {iconRight && <span className="shrink-0">{iconRight}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";
