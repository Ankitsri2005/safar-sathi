"use client";

import { cn } from "@/utils/cn";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";
import type { Toast, ToastVariant } from "@/hooks/useToast";

interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

const icons: Record<ToastVariant, typeof CheckCircle> = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const styles: Record<ToastVariant, string> = {
  success: "bg-success-50 border-success-200 text-success-dark",
  error: "bg-danger-50 border-danger-200 text-danger-dark",
  warning: "bg-warning-50 border-warning-200 text-warning-dark",
  info: "bg-primary-50 border-primary-200 text-primary-dark",
};

const iconColors: Record<ToastVariant, string> = {
  success: "text-success",
  error: "text-danger",
  warning: "text-warning",
  info: "text-primary",
};

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full">
      {toasts.map((toast) => {
        const Icon = icons[toast.variant];
        return (
          <div
            key={toast.id}
            className={cn(
              "flex items-start gap-3 p-4 rounded-xl border shadow-lg animate-slide-down",
              styles[toast.variant]
            )}
          >
            <Icon className={cn("w-5 h-5 shrink-0 mt-0.5", iconColors[toast.variant])} />
            <p className="text-sm font-medium flex-1">{toast.message}</p>
            <button
              onClick={() => onDismiss(toast.id)}
              className="shrink-0 p-0.5 rounded-lg hover:bg-black/5 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
