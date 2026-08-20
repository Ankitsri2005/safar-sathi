"use client";

import { type ReactNode } from "react";
import { cn } from "@/utils/cn";
import { Info, CheckCircle, AlertTriangle, XCircle, X } from "lucide-react";

interface AlertProps {
  variant?: "info" | "success" | "warning" | "error";
  title?: string;
  children: ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

const variants = {
  info: {
    container: "bg-primary-50 border-primary-200 text-primary-dark",
    icon: Info,
    iconColor: "text-primary",
  },
  success: {
    container: "bg-success-50 border-success-200 text-success-dark",
    icon: CheckCircle,
    iconColor: "text-success",
  },
  warning: {
    container: "bg-warning-50 border-warning-200 text-warning-dark",
    icon: AlertTriangle,
    iconColor: "text-warning",
  },
  error: {
    container: "bg-danger-50 border-danger-200 text-danger-dark",
    icon: XCircle,
    iconColor: "text-danger",
  },
};

export function Alert({
  variant = "info",
  title,
  children,
  dismissible = false,
  onDismiss,
  className,
}: AlertProps) {
  const v = variants[variant];
  const Icon = v.icon;

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 rounded-xl border animate-fade-in-up",
        v.container,
        className
      )}
      role="alert"
    >
      <Icon className={cn("w-5 h-5 shrink-0 mt-0.5", v.iconColor)} />
      <div className="flex-1 min-w-0">
        {title && <h4 className="font-semibold text-sm mb-1">{title}</h4>}
        <div className="text-sm">{children}</div>
      </div>
      {dismissible && onDismiss && (
        <button
          onClick={onDismiss}
          className="shrink-0 p-0.5 rounded-lg hover:bg-black/5 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
