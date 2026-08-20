"use client";

import { useState, useCallback, useRef } from "react";

export type ToastVariant = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
}

let toastId = 0;

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const removeToast = useCallback((id: string) => {
    timers.current.delete(id);
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message: string, variant: ToastVariant = "info", duration: number = 4000) => {
      const id = `toast-${++toastId}`;
      setToasts((prev) => [...prev, { id, message, variant }]);

      const timer = setTimeout(() => removeToast(id), duration);
      timers.current.set(id, timer);

      return id;
    },
    [removeToast]
  );

  const toast = {
    success: (msg: string) => addToast(msg, "success"),
    error: (msg: string) => addToast(msg, "error"),
    warning: (msg: string) => addToast(msg, "warning"),
    info: (msg: string) => addToast(msg, "info"),
  };

  return { toasts, toast, removeToast };
}
