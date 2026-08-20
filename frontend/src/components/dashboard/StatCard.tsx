"use client";

import { useCountUp } from "@/hooks/useCountUp";
import { cn } from "@/utils/cn";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  label: string;
  value: number | string;
  icon?: React.ReactNode;
  color?: string;
  trend?: { value: number; direction: "up" | "down" };
  className?: string;
}

const colorMap: Record<string, string> = {
  blue: "bg-primary/10 text-primary",
  red: "bg-danger/10 text-danger",
  green: "bg-success/10 text-success",
  orange: "bg-accent/10 text-accent",
  purple: "bg-purple-100 text-purple-600",
  yellow: "bg-warning/10 text-warning",
};

const barColorMap: Record<string, string> = {
  blue: "bg-primary",
  red: "bg-danger",
  green: "bg-success",
  orange: "bg-accent",
  purple: "bg-purple-500",
  yellow: "bg-warning",
};

export function StatCard({ label, value, icon, color = "blue", trend, className }: StatCardProps) {
  const numericValue = typeof value === "number" ? value : parseInt(String(value), 10);
  const animatedCount = useCountUp(isNaN(numericValue) ? 0 : numericValue, 1200);

  return (
    <div
      className={cn(
        "bg-white rounded-xl border border-border p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted uppercase tracking-wider">{label}</p>
          <p className="text-3xl font-bold text-fg">
            {isNaN(numericValue) ? value : animatedCount}
          </p>
          {trend && (
            <div className={cn("flex items-center gap-1 text-xs font-medium", trend.direction === "up" ? "text-success" : "text-danger")}>
              {trend.direction === "up" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {Math.abs(trend.value)}%
            </div>
          )}
        </div>
        {icon && (
          <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110", colorMap[color])}>
            {icon}
          </div>
        )}
      </div>
      <div className="mt-3 h-1 rounded-full bg-surface-light/10 overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-1000 ease-out", barColorMap[color])} style={{ width: `${Math.min(typeof value === "number" ? (value / 100) * 100 : 50, 100)}%` }} />
      </div>
    </div>
  );
}
