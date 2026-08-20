"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "./Button";

interface ErrorScreenProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorScreen({
  title = "Something went wrong",
  message = "An unexpected error occurred. Please try again.",
  onRetry,
}: ErrorScreenProps) {
  return (
    <div className="min-h-[400px] flex flex-col items-center justify-center text-center px-4">
      <div className="w-16 h-16 bg-danger-100 rounded-2xl flex items-center justify-center mb-6 animate-bounce-in">
        <AlertTriangle className="w-8 h-8 text-danger" />
      </div>
      <h2 className="text-xl font-semibold text-fg mb-2">{title}</h2>
      <p className="text-sm text-muted max-w-sm mb-6">{message}</p>
      {onRetry && (
        <Button variant="primary" onClick={onRetry} icon={<RefreshCw className="w-4 h-4" />}>
          Try Again
        </Button>
      )}
    </div>
  );
}
