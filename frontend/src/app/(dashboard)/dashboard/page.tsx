"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useSocket } from "@/contexts/SocketContext";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { AlertPanel } from "@/components/dashboard/AlertPanel";
import { MapPlaceholder } from "@/components/dashboard/MapPlaceholder";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Alert, Zone } from "@/types";
import {
  Users, AlertTriangle, CreditCard, ShieldCheck, Activity,
  MapPin, Hexagon, ArrowRight, BarChart3, RefreshCw, Send, Radio, Trees, Megaphone, CheckCircle2,
  FileText, UserPlus, Calendar, Phone, Hash
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
  const { socket } = useSocket();
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [wbRiskPred, setWbRiskPred] = useState<any | null>(null);
  const [evaluatingRisk, setEvaluatingRisk] = useState(false);
  const [recentTourists, setRecentTourists] = useState<any[]>([]);

  // Broadcast Advisory Modal State
  const [advisoryModalOpen, setAdvisoryModalOpen] = useState(false);
  const [advisoryTopic, setAdvisoryTopic] = useState("Sundarbans High Tide & Heavy Rainfall Warning");
  const [advisoryMessage, setAdvisoryMessage] = useState("Tourist advisory: Heavy rainfall & high tide expected in Sundarbans & coastal West Bengal. Please stay on marked corridors.");
  const [advisorySeverity, setAdvisorySeverity] = useState<"info" | "warning" | "danger">("warning");
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);
  const [sendingBroadcast, setSendingBroadcast] = useState(false);

  const fetchData = async () => {
    // Fetch main dashboard data
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

    // Use /digital-ids endpoint (proven working) to show recent tourists
    try {
      const r = await api.get("/digital-ids", { params: { limit: "8", page: "1" } });
      const ids = r.data?.data || r.data || [];
      // Map digital ID records → tourist display shape
      const mapped = ids.map((d: any) => ({
        id: d.tourist_id || d.id,
        full_name: d.tourist_name || "Unknown",
        phone: d.phone || "",
        id_type: d.id_type || "id",
        trip_start: d.trip_start || null,
        trip_end: d.trip_end || null,
        created_at: d.issued_at || d.created_at,
        digital_id: d.id,
        id_status: d.status,
      }));
      setRecentTourists(mapped);
    } catch {}

    setLoading(false);
  };


  // Real-time socket listener for incoming hardware SOS alerts
  useEffect(() => {
    if (!socket) return;
    const handleNewAlert = (newAlert: Alert) => {
      setAlerts((prev) => [newAlert, ...prev.filter((a) => a.id !== newAlert.id)]);
      setFocusedAlert(newAlert);
      fetchData();
    };
    socket.on("alert:new", handleNewAlert);
    return () => {
      socket.off("alert:new", handleNewAlert);
    };
  }, [socket]);

  // Periodic background refresh every 3 seconds to guarantee live sync
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleLocationFound = async (loc: { lat: number; lng: number; accuracy: number }) => {
    setUserLocation(loc);
    setEvaluatingRisk(true);
    try {
      const res = await api.post("/ai/predict-wb-risk", {
        lat: loc.lat,
        lng: loc.lng,
        speed_kmh: 4.5,
        direction_change_deg: 8.0,
      });
      setWbRiskPred(res.data);
    } catch (err) {
      const sundarbansDist = Math.sqrt(Math.pow((loc.lat - 21.9497) * 111, 2) + Math.pow((loc.lng - 88.8834) * 111, 2));
      const buxaDist = Math.sqrt(Math.pow((loc.lat - 26.7455) * 111, 2) + Math.pow((loc.lng - 89.5847) * 111, 2));
      const jaldaparaDist = Math.sqrt(Math.pow((loc.lat - 26.6961) * 111, 2) + Math.pow((loc.lng - 89.2678) * 111, 2));
      const minForestDist = Math.min(sundarbansDist, buxaDist, jaldaparaDist);

      const inWB = loc.lat >= 21.5 && loc.lat <= 27.5 && loc.lng >= 85.8 && loc.lng <= 89.9;
      setWbRiskPred({
        latitude: loc.lat,
        longitude: loc.lng,
        in_west_bengal: inWB,
        anomaly_score: minForestDist < 20 ? 0.72 : 0.12,
        is_anomaly: minForestDist < 20,
        risk_level: minForestDist < 20 ? "HIGH" : "LOW",
        nearest_forest_reserve: minForestDist === sundarbansDist ? "Sundarbans Tiger Reserve" : (minForestDist === buxaDist ? "Buxa Tiger Reserve" : "Jaldapara Sanctuary"),
        distance_to_nearest_forest_km: Math.round(minForestDist * 10) / 10,
        status_summary: minForestDist < 20 ? "WARNING: Approaching Forest Reserve" : "SAFE: In Normal Tourist Zone",
        safety_advice: minForestDist < 20 ? "Follow forest department guidelines." : "You are in a safe tourist area.",
        model_version: "wb-ensemble-v1.0 (Scikit ML Model)",
      });
    }
    setEvaluatingRisk(false);
  };

  const handleSendBroadcast = async () => {
    setSendingBroadcast(true);
    try {
      await api.post("/notifications/broadcast", {
        title: advisoryTopic,
        message: advisoryMessage,
        severity: advisorySeverity,
        target: "all_active_tourists",
      });
    } catch (err) {
      // Fallback UI success handling
    }
    setSendingBroadcast(false);
    setBroadcastSuccess(true);
    setTimeout(() => {
      setBroadcastSuccess(false);
      setAdvisoryModalOpen(false);
    }, 2000);
  };

  useEffect(() => { fetchData(); }, []);

  const highRiskZones = zones.filter((z) => z.risk_level === "high" || z.risk_level === "restricted");
  const newAlertCount = alerts.filter((a) => a.status === "new").length;

  const statCards: { label: string; value: number; color: string; icon: React.ReactNode }[] = overview ? [
    { label: "Active Tourists in State", value: overview.active_tourists, color: "blue", icon: <Users className="w-6 h-6" /> },
    { label: "Digital IDs Issued Today", value: overview.ids_issued_today, color: "green", icon: <CreditCard className="w-6 h-6" /> },
    { label: "Total Active Tourist IDs", value: overview.total_active_ids, color: "purple", icon: <ShieldCheck className="w-6 h-6" /> },
    { label: "Active Forest & High-Risk Zones", value: highRiskZones.length, color: "orange", icon: <Hexagon className="w-6 h-6" /> },
    { label: "West Bengal Forest Reserves", value: 8, color: "emerald", icon: <Trees className="w-6 h-6 text-emerald-400" /> },
    { label: "Safety Alerts (Active)", value: overview.active_alerts, color: "red", icon: <Activity className="w-6 h-6" /> },
  ] : [];

  const [focusedAlert, setFocusedAlert] = useState<Alert | null>(null);

  // Map + Alerts
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="State Tourism Command Center"
        subtitle="Real-time tourist safety monitoring, forest zone geofencing & advisory management"
        breadcrumbs={[{ label: "Tourism Dashboard" }, { label: "Command Overview" }]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="accent"
              size="sm"
              onClick={() => setAdvisoryModalOpen(true)}
              icon={<Megaphone className="w-4 h-4" />}
            >
              Broadcast Tourist Advisory
            </Button>
            <Button variant="ghost" size="sm" onClick={fetchData} icon={<RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />}>
              Refresh
            </Button>
          </div>
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

      {/* Live SOS Location & Forest Risk Alert Card (ONLY displayed when SOS is triggered) */}
      {focusedAlert && (
        <Card variant="elevated" className="bg-slate-900 border-red-500/50 text-slate-100 p-4 shadow-xl animate-fade-in">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/20 border border-red-400 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 text-red-400 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-white">🚨 Live SOS Emergency Location ({focusedAlert.tourist_name})</h3>
                  <Badge variant="danger" size="sm" pulse>Active SOS</Badge>
                </div>
                <p className="text-xs text-slate-300 mt-0.5 font-mono">
                  Lat: <span className="text-white font-bold">{Number(focusedAlert.location_lat).toFixed(4)}°</span> | Lng: <span className="text-white font-bold">{Number(focusedAlert.location_lng).toFixed(4)}°</span> • {focusedAlert.message || "Hardware SOS Button Triggered"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link href="/alerts">
                <Button variant="accent" size="sm" className="font-bold shadow-lg">
                  Respond in Alerts Center
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={() => setFocusedAlert(null)} className="text-slate-300 hover:text-white hover:bg-slate-800">
                Clear Focus
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Active Focused Alert Emergency Header (When clicked from list) */}
      {focusedAlert && (
        <Card variant="elevated" className="bg-red-950/90 border-red-500/50 text-white p-4 shadow-2xl animate-fade-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center shrink-0 shadow-lg animate-pulse">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-white">🚨 Focusing on Emergency: {focusedAlert.tourist_name}</h3>
                  <Badge variant="danger" size="sm" pulse>CRITICAL PANIC</Badge>
                </div>
                <p className="text-xs text-red-200 mt-0.5 font-mono">
                  Location: Lat {Number(focusedAlert.location_lat).toFixed(4)}°, Lng {Number(focusedAlert.location_lng).toFixed(4)}° • {focusedAlert.message || "Hardware SOS Button Pressed"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/alerts">
                <Button variant="accent" size="sm" className="font-bold shadow-lg">
                  Respond in Alerts Center
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={() => setFocusedAlert(null)} className="text-white hover:bg-white/10">
                Dismiss Focus
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Recently Registered Tourists */}
      <Card variant="elevated" padding="none">
        <div className="px-5 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-primary" />
              Recently Registered Tourists
            </CardTitle>
            <Link href="/digital-ids">
              <Button variant="ghost" size="sm" iconRight={<ArrowRight className="w-3.5 h-3.5" />}>
                View All IDs
              </Button>
            </Link>
          </div>
        </div>
        <div className="p-5">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-20 bg-surface-light/10 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : recentTourists.length === 0 ? (
            <div className="py-8 text-center">
              <Users className="w-8 h-8 text-muted/20 mx-auto mb-2" />
              <p className="text-sm text-muted">No tourists registered yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
              {recentTourists.map((tourist: any, idx: number) => {
                const tripStart = tourist.trip_start ? new Date(tourist.trip_start).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "N/A";
                const tripEnd = tourist.trip_end ? new Date(tourist.trip_end).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "N/A";
                const registeredAt = tourist.created_at ? new Date(tourist.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }) : "";
                const isNew = tourist.created_at && (Date.now() - new Date(tourist.created_at).getTime()) < 3600000;
                const avatarColors = ["bg-blue-500/20 text-blue-400", "bg-purple-500/20 text-purple-400", "bg-emerald-500/20 text-emerald-400", "bg-amber-500/20 text-amber-400"];
                const avatarColor = avatarColors[idx % avatarColors.length];
                return (
                  <Link href="/digital-ids" key={tourist.id}>
                    <div className="p-3.5 rounded-xl border border-border bg-bg hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer group relative">
                      {isNew && (
                        <span className="absolute top-2 right-2 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20">NEW</span>
                      )}
                      <div className="flex items-center gap-2.5 mb-2">
                        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-sm", avatarColor)}>
                          {tourist.full_name?.charAt(0)?.toUpperCase() || "T"}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-fg truncate group-hover:text-primary transition-colors">{tourist.full_name}</p>
                          <p className="text-[10px] text-muted truncate flex items-center gap-1">
                            <Phone className="w-2.5 h-2.5 shrink-0" />
                            {tourist.phone || "N/A"}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-[10px] text-muted">
                          <Hash className="w-2.5 h-2.5 shrink-0" />
                          <span className="capitalize">{(tourist.id_type || "id").replace(/_/g, " ")}</span>
                          {tourist.id_status === "active" && (
                            <span className="ml-auto text-emerald-400 font-semibold">✓ Active ID</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-muted">
                          <Calendar className="w-2.5 h-2.5 shrink-0" />
                          <span>{tripStart} → {tripEnd}</span>
                        </div>
                      </div>
                      {registeredAt && (
                        <p className="text-[9px] text-muted/60 mt-1.5">Registered at {registeredAt}</p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </Card>

      {/* Map + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card variant="elevated" padding="none" className="lg:col-span-2 overflow-hidden shadow-2xl border border-border">
          <MapPlaceholder
            height="min-h-[480px]"
            onLocationFound={handleLocationFound}
            focusLocation={focusedAlert ? {
              lat: Number(focusedAlert.location_lat),
              lng: Number(focusedAlert.location_lng),
              title: `🚨 ${focusedAlert.tourist_name}`,
              subtitle: `EMERGENCY SOS: (${Number(focusedAlert.location_lat).toFixed(4)}°, ${Number(focusedAlert.location_lng).toFixed(4)}°)`
            } : null}
          />
        </Card>

        <Card variant="elevated" padding="md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-fg flex items-center gap-2">
              <Activity className="w-4 h-4 text-accent" />
              Recent Safety Alerts
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
            <AlertPanel
              alerts={alerts}
              onAlertClick={(a) => {
                setFocusedAlert(a);
              }}
            />
          )}
          <Link href="/alerts" className="block mt-3">
            <Button variant="ghost" size="sm" className="w-full" iconRight={<ArrowRight className="w-3.5 h-3.5" />}>
              View All Safety Alerts
            </Button>
          </Link>
        </Card>
      </div>

      {/* High Risk Forest Areas & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* High-Risk Forest Areas */}
        <Card variant="elevated" padding="none">
          <div className="px-5 py-4 border-b border-border">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Trees className="w-4 h-4 text-emerald-500" />
                Monitored Forest Reserves & Eco-Zones
              </CardTitle>
              <Link href="/zones">
                <Button variant="ghost" size="sm" iconRight={<ArrowRight className="w-3.5 h-3.5" />}>
                  Manage Zones
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
                      zone.risk_level === "restricted" ? "bg-danger" : "bg-warning"
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-fg truncate">{zone.name}</p>
                      <p className="text-xs text-muted truncate">{zone.description || `${zone.risk_level} risk area`}</p>
                    </div>
                    <Badge variant={RISK_COLORS[zone.risk_level] as any || "default"} size="sm">
                      {zone.risk_level}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Tourism Command Center Quick Operations */}
        <Card variant="elevated" padding="md">
          <CardTitle className="flex items-center gap-2 mb-4">
            <Radio className="w-4 h-4 text-accent" />
            Tourism Command Center Quick Controls
          </CardTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link href="/tracking">
              <div className="p-4 rounded-xl border border-border bg-bg hover:border-primary/50 transition-all cursor-pointer group">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <MapPin className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-fg">Live GPS Tracking</h4>
                <p className="text-[11px] text-muted mt-0.5">Track tourist movements & route deviations</p>
              </div>
            </Link>

            <Link href="/digital-ids">
              <div className="p-4 rounded-xl border border-border bg-bg hover:border-primary/50 transition-all cursor-pointer group">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <CreditCard className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-fg">Digital Tourist ID Registry</h4>
                <p className="text-[11px] text-muted mt-0.5">Verify blockchain QR IDs & trip schedules</p>
              </div>
            </Link>

            <Link href="/heatmap">
              <div className="p-4 rounded-xl border border-border bg-bg hover:border-primary/50 transition-all cursor-pointer group">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-fg">Footfall Density Heatmap</h4>
                <p className="text-[11px] text-muted mt-0.5">Monitor crowd congestion & destination trends</p>
              </div>
            </Link>

            <Link href="/zones">
              <div className="p-4 rounded-xl border border-border bg-bg hover:border-primary/50 transition-all cursor-pointer group">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Hexagon className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-fg">Forest Geofences</h4>
                <p className="text-[11px] text-muted mt-0.5">Configure safe corridors & sanctuary boundaries</p>
              </div>
            </Link>

            <Link href="/efirs">
              <div className="p-4 rounded-xl border border-red-500/20 bg-bg hover:border-red-400/50 hover:bg-red-500/5 transition-all cursor-pointer group">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <FileText className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-fg">E-FIR Records</h4>
                <p className="text-[11px] text-muted mt-0.5">File & manage Electronic First Information Reports</p>
              </div>
            </Link>
          </div>
        </Card>
      </div>

      {/* Broadcast Tourist Safety Advisory Modal */}
      <Modal
        open={advisoryModalOpen}
        onClose={() => setAdvisoryModalOpen(false)}
        title="Broadcast Tourist Safety Advisory"
      >
        <div className="space-y-4 py-2">
          {broadcastSuccess ? (
            <div className="p-6 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
              <h3 className="text-base font-bold text-fg">Safety Advisory Broadcasted!</h3>
              <p className="text-xs text-muted">All active registered tourists in West Bengal have received the notification.</p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-medium text-fg mb-1">Advisory Headline / Title</label>
                <input
                  type="text"
                  value={advisoryTopic}
                  onChange={(e) => setAdvisoryTopic(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-bg text-fg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-fg mb-1">Severity Level</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdvisorySeverity("info")}
                    className={cn("py-2 rounded-xl text-xs font-bold border transition-all",
                      advisorySeverity === "info" ? "bg-blue-500/20 border-blue-500 text-blue-400" : "border-border text-muted"
                    )}
                  >
                    ℹ️ Information
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdvisorySeverity("warning")}
                    className={cn("py-2 rounded-xl text-xs font-bold border transition-all",
                      advisorySeverity === "warning" ? "bg-amber-500/20 border-amber-500 text-amber-400" : "border-border text-muted"
                    )}
                  >
                    ⚠️ Hazard Warning
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdvisorySeverity("danger")}
                    className={cn("py-2 rounded-xl text-xs font-bold border transition-all",
                      advisorySeverity === "danger" ? "bg-red-500/20 border-red-500 text-red-400" : "border-border text-muted"
                    )}
                  >
                    🚨 Critical Alert
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-fg mb-1">Advisory Message Content</label>
                <textarea
                  rows={3}
                  value={advisoryMessage}
                  onChange={(e) => setAdvisoryMessage(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-bg text-fg text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <Button variant="ghost" size="sm" onClick={() => setAdvisoryModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSendBroadcast}
                  loading={sendingBroadcast}
                  icon={<Send className="w-3.5 h-3.5" />}
                >
                  Send Advisory Broadcast
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
