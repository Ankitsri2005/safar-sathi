"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import api from "@/lib/api";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/utils/cn";
import {
  BarChart3, Map, AlertTriangle, Users, Shield, Activity, Brain,
  Clock, TrendingUp, TrendingDown, ChevronDown, RefreshCw, Eye,
  MapPin, Zap, FileText, Lock, ArrowUpRight,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────
interface AnalyticsData {
  alerts_over_time: { date: string; count: number }[];
  alerts_by_type: { alert_type: string; count: number }[];
  alerts_by_severity: { severity: string; count: number }[];
  avg_response_time: { avg_response_minutes: number };
  high_risk_entries: { alert_type: string; count: number }[];
  digital_ids: { active: number; expired: number; revoked: number; total: number };
  ai_anomalies_over_time: { date: string; total_analyses: number; anomalies: number }[];
  false_positives: { total_alerts: number; false_positives: number; false_positive_rate: number };
  tourist_density_heatmap: { grid: any[]; bounds: any; grid_size: number };
  alert_density_heatmap: { grid: any[]; bounds: any; grid_size: number };
  zone_risk_distribution: { risk_level: string; count: number }[];
  alert_status_distribution: { status: string; count: number }[];
  most_visited_zones: { name: string; risk_level: string; visit_count: number }[];
}

const ALERT_TYPE_COLORS: Record<string, string> = {
  panic: "#ef4444",
  restricted_zone_entry: "#f97316",
  high_risk_zone_entry: "#eab308",
  no_location_update: "#6366f1",
  route_deviation: "#8b5cf6",
  prolonged_stop: "#06b6d4",
  manual: "#64748b",
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#eab308",
  low: "#22c55e",
};

const STATUS_COLORS: Record<string, string> = {
  new: "#3b82f6",
  acknowledged: "#8b5cf6",
  under_review: "#f97316",
  escalated: "#ef4444",
  resolved: "#22c55e",
  false_positive: "#64748b",
};

// ── Main Page ──────────────────────────────────────────────────
export default function HeatmapPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [activeTab, setActiveTab] = useState<"overview" | "heatmap" | "charts">("overview");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get(`/dashboard/comprehensive?days=${days}`);
      setData(r.data);
    } catch {}
    setLoading(false);
  }, [days]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Analytics & Heatmaps"
        subtitle="Safety patterns and tourist movement trends"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Analytics" }]}
      />

      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-1 bg-surface border border-border rounded-xl p-1">
          {(["overview", "heatmap", "charts"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-medium transition-all capitalize",
                activeTab === tab ? "bg-primary text-white" : "text-muted hover:text-fg"
              )}
            >
              {tab === "overview" ? "Overview" : tab === "heatmap" ? "Heatmaps" : "Charts"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value))}
            className="px-3 py-2 rounded-xl bg-surface border border-border text-xs text-fg"
          >
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <Button variant="ghost" size="sm" onClick={fetchData} icon={<RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />}>
            Refresh
          </Button>
        </div>
      </div>

      {loading && !data && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {data && activeTab === "overview" && <OverviewTab data={data} />}
      {data && activeTab === "heatmap" && <HeatmapTab data={data} />}
      {data && activeTab === "charts" && <ChartsTab data={data} />}
    </div>
  );
}

// ── Overview Tab ───────────────────────────────────────────────
function OverviewTab({ data }: { data: AnalyticsData }) {
  const cards = [
    { label: "Avg Response Time", value: `${data.avg_response_time.avg_response_minutes.toFixed(0)}m`, icon: Clock, color: "text-primary", bg: "bg-primary/10" },
    { label: "False Positive Rate", value: `${data.false_positives.false_positive_rate}%`, icon: TrendingDown, color: "text-warning", bg: "bg-warning/10" },
    { label: "Active Digital IDs", value: data.digital_ids.active, icon: Lock, color: "text-success", bg: "bg-success/10" },
    { label: "Expired IDs", value: data.digital_ids.expired, icon: FileText, color: "text-muted", bg: "bg-muted/10" },
    { label: "High-Risk Entries", value: data.high_risk_entries.reduce((s, e) => s + parseInt(e.count as any), 0), icon: AlertTriangle, color: "text-danger", bg: "bg-danger/10" },
    { label: "AI Anomalies", value: data.ai_anomalies_over_time.reduce((s, e) => s + parseInt(e.anomalies as any), 0), icon: Brain, color: "text-accent", bg: "bg-accent/10" },
  ];

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {cards.map((c) => (
          <div key={c.label} className="p-3 rounded-2xl bg-surface border border-border">
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mb-2", c.bg)}>
              <c.icon className={cn("w-4 h-4", c.color)} />
            </div>
            <p className="text-lg font-bold text-fg">{c.value}</p>
            <p className="text-[11px] text-muted">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card variant="elevated" padding="lg">
          <h3 className="text-sm font-semibold text-fg mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            Alerts by Type
          </h3>
          <BarChart
            data={data.alerts_by_type.map((d) => ({
              label: d.alert_type.replace(/_/g, " "),
              value: parseInt(d.count as any),
              color: ALERT_TYPE_COLORS[d.alert_type] || "#6b7280",
            }))}
            height={200}
          />
        </Card>

        <Card variant="elevated" padding="lg">
          <h3 className="text-sm font-semibold text-fg mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-warning" />
            Alerts by Severity
          </h3>
          <DonutChart
            data={data.alerts_by_severity.map((d) => ({
              label: d.severity,
              value: parseInt(d.count as any),
              color: SEVERITY_COLORS[d.severity] || "#6b7280",
            }))}
            size={180}
          />
        </Card>
      </div>

      {/* Most Visited Zones */}
      <Card variant="elevated" padding="lg">
        <h3 className="text-sm font-semibold text-fg mb-4 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" />
          Most Visited Zones
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {data.most_visited_zones.slice(0, 10).map((z, i) => (
            <div key={i} className="p-3 rounded-xl bg-bg border border-border/50">
              <p className="text-xs font-medium text-fg truncate">{z.name}</p>
              <p className="text-lg font-bold text-primary mt-1">{parseInt(z.visit_count as any)}</p>
              <Badge variant={z.risk_level === "high" || z.risk_level === "restricted" ? "danger" : z.risk_level === "medium" ? "warning" : "success"} size="sm">
                {z.risk_level}
              </Badge>
            </div>
          ))}
        </div>
      </Card>

      {/* Alert Status Distribution */}
      <Card variant="elevated" padding="lg">
        <h3 className="text-sm font-semibold text-fg mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-accent" />
          Alert Status Distribution
        </h3>
        <div className="flex items-end gap-2 h-32">
          {data.alert_status_distribution.map((d) => {
            const maxCount = Math.max(...data.alert_status_distribution.map((s) => parseInt(s.count as any)));
            const height = maxCount > 0 ? (parseInt(d.count as any) / maxCount) * 100 : 0;
            return (
              <div key={d.status} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] font-mono text-fg">{parseInt(d.count as any)}</span>
                <div
                  className="w-full rounded-t-lg transition-all duration-500"
                  style={{ height: `${height}%`, backgroundColor: STATUS_COLORS[d.status] || "#6b7280" }}
                />
                <span className="text-[9px] text-muted capitalize truncate w-full text-center">{d.status.replace(/_/g, " ")}</span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

// ── Heatmap Tab ────────────────────────────────────────────────
function HeatmapTab({ data }: { data: AnalyticsData }) {
  const [heatmapType, setHeatmapType] = useState<"tourist" | "alert">("tourist");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setHeatmapType("tourist")}
          className={cn("px-4 py-2 rounded-xl text-xs font-medium transition-all", heatmapType === "tourist" ? "bg-primary text-white" : "bg-surface border border-border text-muted")}
        >
          <Users className="w-3.5 h-3.5 inline mr-1.5" />
          Tourist Density
        </button>
        <button
          onClick={() => setHeatmapType("alert")}
          className={cn("px-4 py-2 rounded-xl text-xs font-medium transition-all", heatmapType === "alert" ? "bg-danger text-white" : "bg-surface border border-border text-muted")}
        >
          <AlertTriangle className="w-3.5 h-3.5 inline mr-1.5" />
          Alert Density
        </button>
      </div>

      <Card variant="elevated" padding="lg">
        <h3 className="text-sm font-semibold text-fg mb-4">
          {heatmapType === "tourist" ? "Tourist Density Heatmap" : "Alert Density Heatmap"} — Sikkim Region
        </h3>
        <HeatmapCanvas
          grid={heatmapType === "tourist" ? data.tourist_density_heatmap.grid : data.alert_density_heatmap.grid}
          bounds={heatmapType === "tourist" ? data.tourist_density_heatmap.bounds : data.alert_density_heatmap.bounds}
          gridSize={data.tourist_density_heatmap.grid_size}
          colorScheme={heatmapType === "tourist" ? "blue" : "red"}
          valueKey={heatmapType === "tourist" ? "tourist_count" : "alert_count"}
        />
        <div className="flex items-center justify-center gap-4 mt-4">
          <span className="text-[10px] text-muted">Low</span>
          <div className="flex gap-0.5">
            {[0.2, 0.4, 0.6, 0.8, 1.0].map((o) => (
              <div
                key={o}
                className="w-6 h-3 rounded-sm"
                style={{
                  backgroundColor: heatmapType === "tourist"
                    ? `rgba(59, 130, 246, ${o})`
                    : `rgba(239, 68, 68, ${o})`,
                }}
              />
            ))}
          </div>
          <span className="text-[10px] text-muted">High</span>
        </div>
      </Card>

      {/* Zone Overlay */}
      <Card variant="elevated" padding="lg">
        <h3 className="text-sm font-semibold text-fg mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          Zone Risk Distribution
        </h3>
        <div className="grid grid-cols-4 gap-3">
          {data.zone_risk_distribution.map((z) => (
            <div key={z.risk_level} className="p-3 rounded-xl bg-bg border border-border/50 text-center">
              <Badge variant={z.risk_level === "high" || z.risk_level === "restricted" ? "danger" : z.risk_level === "medium" ? "warning" : "success"} size="md">
                {z.risk_level}
              </Badge>
              <p className="text-2xl font-bold text-fg mt-2">{parseInt(z.count as any)}</p>
              <p className="text-[10px] text-muted">zones</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ── Charts Tab ─────────────────────────────────────────────────
function ChartsTab({ data }: { data: AnalyticsData }) {
  return (
    <div className="space-y-6">
      {/* Alerts Over Time */}
      <Card variant="elevated" padding="lg">
        <h3 className="text-sm font-semibold text-fg mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          Alerts Over Time
        </h3>
        <LineChart
          data={data.alerts_over_time.map((d) => ({
            label: new Date(d.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
            value: parseInt(d.count as any),
          }))}
          color="#3b82f6"
          height={200}
        />
      </Card>

      {/* AI Anomalies Over Time */}
      <Card variant="elevated" padding="lg">
        <h3 className="text-sm font-semibold text-fg mb-4 flex items-center gap-2">
          <Brain className="w-4 h-4 text-accent" />
          AI Anomalies Over Time
        </h3>
        <LineChart
          data={data.ai_anomalies_over_time.map((d) => ({
            label: new Date(d.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
            value: parseInt(d.anomalies as any),
          }))}
          color="#8b5cf6"
          height={180}
          secondaryData={data.ai_anomalies_over_time.map((d) => ({
            label: new Date(d.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
            value: parseInt(d.total_analyses as any),
          }))}
          secondaryColor="#c4b5fd"
        />
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* High-Risk Zone Entries */}
        <Card variant="elevated" padding="lg">
          <h3 className="text-sm font-semibold text-fg mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-danger" />
            High-Risk Zone Entries
          </h3>
          <BarChart
            data={data.high_risk_entries.map((d) => ({
              label: d.alert_type.replace(/_/g, " "),
              value: parseInt(d.count as any),
              color: d.alert_type.includes("restricted") ? "#ef4444" : "#f97316",
            }))}
            height={160}
          />
        </Card>

        {/* Digital IDs */}
        <Card variant="elevated" padding="lg">
          <h3 className="text-sm font-semibold text-fg mb-4 flex items-center gap-2">
            <Lock className="w-4 h-4 text-success" />
            Digital ID Status
          </h3>
          <DonutChart
            data={[
              { label: "Active", value: data.digital_ids.active, color: "#22c55e" },
              { label: "Expired", value: data.digital_ids.expired, color: "#eab308" },
              { label: "Revoked", value: data.digital_ids.revoked, color: "#ef4444" },
            ]}
            size={160}
          />
        </Card>
      </div>

      {/* False Positive Summary */}
      <Card variant="elevated" padding="lg">
        <h3 className="text-sm font-semibold text-fg mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-warning" />
          False Positive Summary
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-xl bg-bg border border-border/50">
            <p className="text-2xl font-bold text-fg">{data.false_positives.total_alerts}</p>
            <p className="text-xs text-muted mt-1">Total Alerts</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-bg border border-border/50">
            <p className="text-2xl font-bold text-warning">{data.false_positives.false_positives}</p>
            <p className="text-xs text-muted mt-1">False Positives</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-bg border border-border/50">
            <p className="text-2xl font-bold text-danger">{data.false_positives.false_positive_rate}%</p>
            <p className="text-xs text-muted mt-1">False Positive Rate</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ── Canvas Components ──────────────────────────────────────────

function HeatmapCanvas({
  grid, bounds, gridSize, colorScheme, valueKey,
}: {
  grid: any[]; bounds: any; gridSize: number; colorScheme: "blue" | "red"; valueKey: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width = canvas.offsetWidth * 2;
    const H = canvas.height = 400 * 2;
    ctx.scale(1, 1);

    // Background
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, W, H);

    // Grid
    const cellW = W / gridSize;
    const cellH = H / gridSize;

    // Find max value
    const maxVal = Math.max(1, ...grid.map((g: any) => parseInt(g[valueKey] || "0")));

    // Draw cells
    for (const cell of grid) {
      const row = parseInt(cell.row);
      const col = parseInt(cell.col);
      const val = parseInt(cell[valueKey] || "0");
      const intensity = Math.min(1, val / maxVal);

      if (intensity > 0) {
        const x = col * cellW;
        const y = row * cellH;

        if (colorScheme === "blue") {
          ctx.fillStyle = `rgba(59, 130, 246, ${intensity * 0.8})`;
        } else {
          const r = Math.round(239 * intensity + 59 * (1 - intensity));
          const g = Math.round(68 * intensity + 130 * (1 - intensity));
          ctx.fillStyle = `rgba(${r}, ${g}, 68, ${intensity * 0.8})`;
        }

        ctx.beginPath();
        ctx.roundRect(x + 1, y + 1, cellW - 2, cellH - 2, 3);
        ctx.fill();

        // Show value if high enough
        if (intensity > 0.3 && cellW > 30) {
          ctx.fillStyle = "#ffffff";
          ctx.font = `bold ${Math.min(14, cellW / 4)}px sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(String(val), x + cellW / 2, y + cellH / 2);
        }
      }
    }

    // Grid lines
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= gridSize; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellW, 0);
      ctx.lineTo(i * cellW, H);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * cellH);
      ctx.lineTo(W, i * cellH);
      ctx.stroke();
    }

    // Labels
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`${bounds.max_lat}°N`, 5, 15);
    ctx.fillText(`${bounds.min_lat}°N`, 5, H - 5);
    ctx.textAlign = "right";
    ctx.fillText(`${bounds.max_lng}°E`, W - 5, 15);
    ctx.fillText(`${bounds.min_lng}°E`, W - 5, H - 5);
  }, [grid, bounds, gridSize, colorScheme, valueKey]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full rounded-xl"
      style={{ height: 400 }}
    />
  );
}

function BarChart({ data, height = 200 }: { data: { label: string; value: number; color: string }[]; height?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width = canvas.offsetWidth * 2;
    const H = canvas.height = height * 2;
    ctx.scale(1, 1);

    ctx.fillStyle = "transparent";
    ctx.fillRect(0, 0, W, H);

    const maxVal = Math.max(1, ...data.map((d) => d.value));
    const barW = Math.min(60, (W - 80) / data.length - 8);
    const startX = 60;
    const chartH = H - 60;

    // Y-axis
    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
      const y = 20 + (chartH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(W - 10, y);
      ctx.stroke();

      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.font = "10px sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(String(Math.round(maxVal * (1 - i / 4))), startX - 5, y + 4);
    }

    // Bars
    data.forEach((d, i) => {
      const barH = (d.value / maxVal) * chartH;
      const x = startX + i * (barW + 8) + 4;
      const y = 20 + chartH - barH;

      // Bar with gradient
      const grad = ctx.createLinearGradient(x, y, x, 20 + chartH);
      grad.addColorStop(0, d.color);
      grad.addColorStop(1, d.color + "60");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(x, y, barW, barH, [4, 4, 0, 0]);
      ctx.fill();

      // Value on top
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(String(d.value), x + barW / 2, y - 5);

      // Label
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.font = "9px sans-serif";
      ctx.save();
      ctx.translate(x + barW / 2, 20 + chartH + 10);
      ctx.rotate(-0.4);
      ctx.textAlign = "right";
      const words = d.label.split(" ");
      words.forEach((w, wi) => ctx.fillText(w, 0, wi * 11));
      ctx.restore();
    });
  }, [data, height]);

  return <canvas ref={canvasRef} className="w-full rounded-xl" style={{ height }} />;
}

function LineChart({
  data, color, height = 200, secondaryData, secondaryColor,
}: {
  data: { label: string; value: number }[];
  color: string;
  height?: number;
  secondaryData?: { label: string; value: number }[];
  secondaryColor?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width = canvas.offsetWidth * 2;
    const H = canvas.height = height * 2;
    ctx.scale(1, 1);

    ctx.fillStyle = "transparent";
    ctx.fillRect(0, 0, W, H);

    const allValues = [...data.map((d) => d.value), ...(secondaryData?.map((d) => d.value) || [])];
    const maxVal = Math.max(1, ...allValues);
    const chartH = H - 50;
    const chartW = W - 60;
    const startX = 50;

    // Grid
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
      const y = 20 + (chartH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(W - 10, y);
      ctx.stroke();

      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.font = "10px sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(String(Math.round(maxVal * (1 - i / 4))), startX - 5, y + 4);
    }

    // Draw line function
    const drawLine = (points: { label: string; value: number }[], strokeColor: string, fill: boolean) => {
      if (points.length < 2) return;
      const stepX = chartW / (points.length - 1);

      ctx.beginPath();
      points.forEach((p, i) => {
        const x = startX + i * stepX;
        const y = 20 + chartH - (p.value / maxVal) * chartH;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2;
      ctx.stroke();

      if (fill) {
        ctx.lineTo(startX + (points.length - 1) * stepX, 20 + chartH);
        ctx.lineTo(startX, 20 + chartH);
        ctx.closePath();
        ctx.fillStyle = strokeColor + "20";
        ctx.fill();
      }

      // Dots
      points.forEach((p, i) => {
        const x = startX + i * stepX;
        const y = 20 + chartH - (p.value / maxVal) * chartH;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = strokeColor;
        ctx.fill();
      });
    };

    if (secondaryData) drawLine(secondaryData, secondaryColor || "#ccc", true);
    drawLine(data, color, true);

    // X-axis labels
    const labelStep = Math.max(1, Math.floor(data.length / 8));
    data.forEach((d, i) => {
      if (i % labelStep === 0 || i === data.length - 1) {
        const x = startX + i * (chartW / (data.length - 1));
        ctx.fillStyle = "rgba(255,255,255,0.4)";
        ctx.font = "9px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(d.label, x, H - 8);
      }
    });
  }, [data, color, height, secondaryData, secondaryColor]);

  return <canvas ref={canvasRef} className="w-full rounded-xl" style={{ height }} />;
}

function DonutChart({ data, size = 180 }: { data: { label: string; value: number; color: string }[]; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const S = size * 2;
    canvas.width = S;
    canvas.height = S;

    const total = data.reduce((s, d) => s + d.value, 0);
    if (total === 0) return;

    const cx = S / 2, cy = S / 2;
    const outerR = S / 2 - 10;
    const innerR = outerR * 0.6;

    let startAngle = -Math.PI / 2;
    data.forEach((d) => {
      const sliceAngle = (d.value / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(cx, cy, outerR, startAngle, startAngle + sliceAngle);
      ctx.arc(cx, cy, innerR, startAngle + sliceAngle, startAngle, true);
      ctx.closePath();
      ctx.fillStyle = d.color;
      ctx.fill();
      startAngle += sliceAngle;
    });

    // Center text
    ctx.fillStyle = "#ffffff";
    ctx.font = `bold ${S / 8}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(total), cx, cy - 8);
    ctx.font = `${S / 14}px sans-serif`;
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.fillText("Total", cx, cy + 14);
  }, [data, size]);

  return (
    <div className="flex items-center gap-6">
      <canvas ref={canvasRef} style={{ width: size, height: size }} />
      <div className="space-y-2">
        {data.map((d) => (
          <div key={d.label} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
            <span className="text-xs text-muted capitalize">{d.label}</span>
            <span className="text-xs font-semibold text-fg ml-auto">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
