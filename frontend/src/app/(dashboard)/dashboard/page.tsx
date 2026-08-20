"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { AlertPanel } from "@/components/dashboard/AlertPanel";
import { MapPlaceholder } from "@/components/dashboard/MapPlaceholder";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert, Zone } from "@/types";
import {
  Users, AlertTriangle, CreditCard, ShieldCheck, Activity,
  MapPin, Hexagon, ArrowRight, BarChart3, RefreshCw,
} from "lucide-react";
import { cn } from "@/utils/cn";
import Link from "next/link";

interface OverviewData {
  active_tourists: number;
  active_alerts: number;
  ids_issued_today: number;
  total_active_ids: number;
}

const RISK_COLORS: Record<string, string> = {
  low: "success",
  medium: "warning",
  high: "danger",
  restricted: "danger",
};

export default function DashboardOverview() {
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ovRes, alertRes, zoneRes] = await Promise.all([
        api.get("/dashboard/overview"),
        api.get("/alerts", { params: { status: "new", limit: "10" } }),
        api.get("/zones", { params: { active: "true" } }),
      ]);
      setOverview(ovRes.data);
      setAlerts(alertRes.data.data || alertRes.data);
      setZones(zoneRes.data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const highRiskZones = zones.filter((z) => z.risk_level === "high" || z.risk_level === "restricted");
  const newAlertCount = alerts.filter((a) => a.status === "new").length;

  const statCards: { label: string; value: number; color: string; icon: React.ReactNode }[] = overview ? [
    { label: "Active Tourists", value: overview.active_tourists, color: "blue", icon: <Users className="w-6 h-6" /> },
    { label: "Active Alerts", value: overview.active_alerts, color: "red", icon: <AlertTriangle className="w-6 h-6" /> },
    { label: "IDs Issued Today", value: overview.ids_issued_today, color: "green", icon: <CreditCard className="w-6 h-6" /> },
    { label: "Total Active IDs", value: overview.total_active_ids, color: "purple", icon: <ShieldCheck className="w-6 h-6" /> },
    { label: "High-Risk Zones", value: highRiskZones.length, color: "orange", icon: <Hexagon className="w-6 h-6" /> },
    { label: "Alerts (New)", value: newAlertCount, color: "red", icon: <Activity className="w-6 h-6" /> },
  ] : [];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Dashboard Overview"
        subtitle="Real-time monitoring and analytics"
        breadcrumbs={[{ label: "Dashboard" }, { label: "Overview" }]}
        actions={
          <Button variant="ghost" size="sm" onClick={fetchData} icon={<RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />}>
            Refresh
          </Button>
        }
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {loading && Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-border p-5 animate-pulse h-28" />
        ))}
        {!loading && statCards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      {/* Map + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card variant="elevated" padding="none" className="lg:col-span-2 overflow-hidden">
          <MapPlaceholder height="min-h-[450px]" />
        </Card>

        <Card variant="elevated" padding="md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-fg flex items-center gap-2">
              <Activity className="w-4 h-4 text-accent" />
              Recent Alerts
            </h2>
            {newAlertCount > 0 && (
              <Badge variant="danger" size="sm" pulse>
                {newAlertCount} new
              </Badge>
            )}
          </div>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 bg-surface-light/10 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <AlertPanel alerts={alerts} />
          )}
          <Link href="/alerts" className="block mt-3">
            <Button variant="ghost" size="sm" className="w-full" iconRight={<ArrowRight className="w-3.5 h-3.5" />}>
              View All Alerts
            </Button>
          </Link>
        </Card>
      </div>

      {/* Zones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* High-Risk Areas */}
        <Card variant="elevated" padding="none">
          <div className="px-5 py-4 border-b border-border">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Hexagon className="w-4 h-4 text-accent" />
                Current High-Risk Areas
              </CardTitle>
              <Link href="/zones">
                <Button variant="ghost" size="sm" iconRight={<ArrowRight className="w-3.5 h-3.5" />}>
                  Manage
                </Button>
              </Link>
            </div>
          </div>
          <div className="p-5">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-12 bg-surface-light/10 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {highRiskZones.map((zone) => (
                  <div key={zone.id} className="flex items-center gap-3 p-3 rounded-xl bg-bg border border-border">
                    <div className={cn("w-3 h-3 rounded-full shrink-0 animate-pulse",
                      zone.risk_level === "restricted" ? "bg-danger" : "bg-danger"
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-fg truncate">{zone.name}</p>
                      <p className="text-xs text-muted">{zone.risk_level} risk</p>
                    </div>
                    <Badge variant={RISK_COLORS[zone.risk_level] as any || "default"} size="sm">
                      {zone.risk_level}
                    </Badge>
                  </div>
                ))}
                {highRiskZones.length === 0 && (
                  <p className="text-sm text-muted text-center py-4">No high-risk areas</p>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Zone Overview */}
        <Card variant="elevated" padding="none">
          <div className="px-5 py-4 border-b border-border">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              Zone Distribution
            </CardTitle>
          </div>
          <div className="p-5">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-8 bg-surface-light/10 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {zones.map((zone) => {
                    const percentage = zones.length > 0 ? Math.round((1 / zones.length) * 100) : 0;
                    return (
                      <div key={zone.id} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className={cn("w-2 h-2 rounded-full shrink-0",
                              zone.risk_level === "restricted" ? "bg-danger" :
                              zone.risk_level === "high" ? "bg-danger" :
                              zone.risk_level === "medium" ? "bg-warning" : "bg-success"
                            )} />
                            <span className="font-medium text-fg truncate">{zone.name}</span>
                          </div>
                          <span className="text-muted shrink-0">{zone.risk_level}</span>
                        </div>
                        <div className="h-2 rounded-full bg-surface-light/10 overflow-hidden">
                          <div
                            className={cn("h-full rounded-full transition-all duration-500",
                              zone.risk_level === "restricted" ? "bg-danger" :
                              zone.risk_level === "high" ? "bg-danger" :
                              zone.risk_level === "medium" ? "bg-warning" : "bg-success"
                            )}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 pt-4 border-t border-border grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-lg font-bold text-success">{zones.filter((z) => z.risk_level === "low").length}</p>
                    <p className="text-[10px] text-muted uppercase">Low Risk</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-warning">{zones.filter((z) => z.risk_level === "medium").length}</p>
                    <p className="text-[10px] text-muted uppercase">Medium</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-danger">{zones.filter((z) => z.risk_level === "high" || z.risk_level === "restricted").length}</p>
                    <p className="text-[10px] text-muted uppercase">High/Restricted</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
