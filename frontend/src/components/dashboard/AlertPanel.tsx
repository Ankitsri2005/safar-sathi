"use client";

import { Alert } from "@/types";
import { cn } from "@/utils/cn";
import { AlertTriangle, Radio, MapPin } from "lucide-react";

interface AlertPanelProps {
  alerts: Alert[];
  className?: string;
}

const severityConfig: Record<string, { bg: string; icon: string; dot: string }> = {
  panic: { bg: "bg-danger-50", icon: "text-danger", dot: "bg-danger" },
  anomaly: { bg: "bg-warning-50", icon: "text-warning", dot: "bg-warning" },
  geofence_breach: { bg: "bg-accent-50", icon: "text-accent", dot: "bg-accent" },
};

const statusBadge: Record<string, string> = {
  new: "bg-danger-100 text-danger",
  under_review: "bg-warning-100 text-warning",
  resolved: "bg-success-100 text-success",
};

export function AlertPanel({ alerts, className }: AlertPanelProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {alerts.length === 0 && (
        <div className="text-center py-8 text-muted">
          <Radio className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No active alerts</p>
        </div>
      )}
      {alerts.map((alert) => {
        const severity = severityConfig[alert.alert_type] || severityConfig.anomaly;
        const isNew = alert.status === "new";

        return (
          <div
            key={alert.id}
            className={cn(
              "flex items-start gap-3 p-3 rounded-xl border transition-all duration-200 hover:shadow-md cursor-pointer",
              isNew ? "border-danger/20 bg-danger-50/30" : "border-border bg-white hover:bg-surface-light/5"
            )}
          >
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", severity.bg)}>
              <AlertTriangle className={cn("w-4 h-4", severity.icon)} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-fg truncate">{alert.tourist_name}</p>
                {isNew && (
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-danger opacity-75 animate-pulse-ring" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-danger" />
                  </span>
                )}
              </div>
              <p className="text-xs text-muted capitalize">
                {alert.alert_type.replace("_", " ")}
              </p>
              {alert.location_name && (
                <div className="flex items-center gap-1 mt-1">
                  <MapPin className="w-3 h-3 text-muted" />
                  <p className="text-xs text-muted truncate">{alert.location_name}</p>
                </div>
              )}
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium", statusBadge[alert.status])}>
                {alert.status.replace("_", " ")}
              </span>
              <p className="text-[10px] text-muted">
                {new Date(alert.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
