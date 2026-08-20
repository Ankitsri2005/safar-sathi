"use client";

import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/utils/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
  iconRight?: ReactNode;
  floating?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, iconRight, floating, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    if (floating && label) {
      return (
        <div className="w-full">
          <div className="relative floating-label-group">
            {icon && (
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted z-10">
                {icon}
              </span>
            )}
            <input
              ref={ref}
              id={inputId}
              placeholder=" "
              className={cn(
                "peer w-full border rounded-lg px-3 pt-5 pb-2 text-sm bg-white transition-all duration-200",
                "border-border focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none",
                "placeholder-transparent",
                error && "border-danger focus:border-danger focus:ring-danger/20",
                icon && "pl-10",
                iconRight && "pr-10",
                className
              )}
              {...props}
            />
            <label
              htmlFor={inputId}
              className={cn(
                "absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted transition-all duration-200 pointer-events-none",
                "peer-focus:top-2.5 peer-focus:scale-[0.8] peer-focus:text-primary",
                "peer-not-placeholder-shown:top-2.5 peer-not-placeholder-shown:scale-[0.8]",
                icon && "left-10",
                error && "peer-focus:text-danger"
              )}
            >
              {label}
            </label>
            {iconRight && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted">
                {iconRight}
              </span>
            )}
          </div>
          {error && (
            <p className="text-danger text-xs mt-1 animate-fade-in">{error}</p>
          )}
        </div>
      );
    }

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-fg mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full border rounded-lg px-3 py-2.5 text-sm bg-white transition-all duration-200",
              "border-border focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none",
              "placeholder:text-muted/50",
              error && "border-danger focus:border-danger focus:ring-danger/20",
              icon && "pl-10",
              iconRight && "pr-10",
              className
            )}
            {...props}
          />
          {iconRight && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted">
              {iconRight}
            </span>
          )}
        </div>
        {error && (
          <p className="text-danger text-xs mt-1 animate-fade-in">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
