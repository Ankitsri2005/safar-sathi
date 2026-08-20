"use client";

import { type ReactNode } from "react";
import { cn } from "@/utils/cn";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 px-4 text-center", className)}>
      <div className="w-16 h-16 rounded-2xl bg-surface-light/10 flex items-center justify-center mb-4 animate-fade-in">
        {icon || <Inbox className="w-8 h-8 text-muted" />}
      </div>
      <h3 className="text-lg font-semibold text-fg mb-1">{title}</h3>
      {description && <p className="text-sm text-muted max-w-sm mb-4">{description}</p>}
      {action}
    </div>
  );
}
