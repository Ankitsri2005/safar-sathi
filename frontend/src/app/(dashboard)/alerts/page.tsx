"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { Alert, AlertStatus, AlertType, ALERT_TYPE_LABELS, type AlertTimelineEntry, type AIAnalysisResult } from "@/types";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import {
  MapPin,
  Clock,
  Search,
  Filter,
  X,
  AlertTriangle,
  Shield,
  ShieldAlert,
  CheckCircle,
  ArrowUpCircle,
  FileText,
  Eye,
  Navigation,
  Timer,
  User,
  Ban,
  MessageSquare,
  Brain,
  Cpu,
  Zap,
} from "lucide-react";

const STATUS_VARIANTS: Record<string, { v: "danger" | "warning" | "success" | "primary" | "accent" | "default"; label: string }> = {
  new: { v: "danger", label: "New" },
  acknowledged: { v: "primary", label: "Acknowledged" },
  under_review: { v: "warning", label: "Under Review" },
  escalated: { v: "accent", label: "Escalated" },
  resolved: { v: "success", label: "Resolved" },
  false_positive: { v: "default", label: "False Positive" },
};

const SEVERITY_VARIANTS: Record<string, { v: "danger" | "warning" | "accent" | "default"; color: string }> = {
  critical: { v: "danger", color: "#ef4444" },
  high: { v: "danger", color: "#f97316" },
  medium: { v: "warning", color: "#eab308" },
  low: { v: "default", color: "#6b7280" },
};

const TYPE_ICONS: Record<string, typeof AlertTriangle> = {
  panic: ShieldAlert,
  restricted_zone_entry: Ban,
  high_risk_zone_entry: AlertTriangle,
  no_location_update: Timer,
  route_deviation: Navigation,
  prolonged_stop: Clock,
  manual: User,
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Alert | null>(null);
  const [timeline, setTimeline] = useState<AlertTimelineEntry[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [escalateNotes, setEscalateNotes] = useState("");
  const [resolveNotes, setResolveNotes] = useState("");
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [stats, setStats] = useState({ total: 0, new: 0, acknowledged: 0, under_review: 0, escalated: 0, resolved: 0, false_positive: 0 });

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: "15" };
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.alert_type = typeFilter;
      if (severityFilter) params.severity = severityFilter;
      if (search) params.search = search;
      const r = await api.get("/alerts", { params });
      setAlerts(r.data.data);
      setTotal(r.data.total);
    } catch {}
    setLoading(false);
  }, [page, statusFilter, typeFilter, severityFilter, search]);

  const fetchStats = async () => {
    try {
      const r = await api.get("/alerts/stats");
      setStats(r.data);
    } catch {}
  };

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);
  useEffect(() => { fetchStats(); }, []);

  const fetchTimeline = async (alertId: string) => {
    try {
      const r = await api.get(`/alerts/${alertId}/timeline`);
      setTimeline(r.data);
    } catch { setTimeline([]); }
  };

  const fetchAIAnalysis = async (touristId: string) => {
    setAiLoading(true);
    setAiAnalysis(null);
    try {
      const r = await api.get(`/ai/tourist/${touristId}?limit=1`);
      if (r.data && r.data.length > 0) {
        setAiAnalysis(r.data[0]);
      }
    } catch {}
    setAiLoading(false);
  };

  const runAIAnalysis = async (touristId: string) => {
    setAiLoading(true);
    try {
      const r = await api.post(`/ai/analyze/${touristId}`);
      setAiAnalysis(r.data);
    } catch {}
    setAiLoading(false);
  };

  const handleSelect = (alert: Alert) => {
    setSelected(alert);
    fetchTimeline(alert.id);
    fetchAIAnalysis(alert.tourist_id);
  };

  const handleStatusUpdate = async (id: string, status: AlertStatus, notes?: string) => {
    setActionLoading(true);
    try {
      await api.patch(`/alerts/${id}`, { status, notes });
      await fetchAlerts();
      await fetchStats();
      setSelected(null);
      setShowEscalateModal(false);
      setShowResolveModal(false);
      setEscalateNotes("");
      setResolveNotes("");
    } catch {}
    setActionLoading(false);
  };

  const handleGenerateEfir = async (alert: Alert) => {
    setActionLoading(true);
    try {
      await api.post(`/efirs/generate/${alert.id}`);
      await fetchAlerts();
    } catch {}
    setActionLoading(false);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader
        title="Alerts Management"
        subtitle="Monitor and respond to safety incidents"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Alerts" }]}
      />

      {/* Stats bar */}
      <div className="grid grid-cols-7 gap-2">
        {[
          { label: "Total", value: stats.total, color: "text-fg" },
          { label: "New", value: stats.new, color: "text-danger", pulse: true },
          { label: "Acknowledged", value: stats.acknowledged, color: "text-primary" },
          { label: "In Review", value: stats.under_review, color: "text-warning" },
          { label: "Escalated", value: stats.escalated, color: "text-accent" },
          { label: "Resolved", value: stats.resolved, color: "text-success" },
          { label: "False +", value: stats.false_positive, color: "text-muted" },
        ].map((s) => (
          <Card key={s.label} variant="elevated" padding="sm" className="text-center">
            <p className={`text-lg font-bold ${s.color} ${s.pulse ? "animate-pulse" : ""}`}>{s.value}</p>
            <p className="text-[9px] text-muted uppercase">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Search + filters */}
      <div className="flex gap-3 items-center flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full border border-border rounded-xl pl-9 pr-4 py-2 text-sm bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
            placeholder="Search tourist, location, message..."
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm border transition-all ${showFilters ? "bg-primary text-white border-primary" : "bg-white border-border text-muted hover:border-primary/30"}`}
        >
          <Filter className="w-3.5 h-3.5" />
          Filters
        </button>
        <span className="text-sm text-muted ml-auto">{total} alerts</span>
      </div>

      {showFilters && (
        <div className="flex gap-3 flex-wrap animate-fade-in">
          <div className="flex gap-1.5">
            {["", "new", "acknowledged", "under_review", "escalated", "resolved", "false_positive"].map((s) => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); setPage(1); }}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all ${statusFilter === s ? "bg-primary text-white" : "bg-surface-light/20 text-muted hover:bg-surface-light/30"}`}
              >
                {s ? STATUS_VARIANTS[s]?.label || s : "All Status"}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5">
            {["", "panic", "restricted_zone_entry", "high_risk_zone_entry", "no_location_update", "route_deviation", "prolonged_stop", "manual"].map((t) => (
              <button
                key={t}
                onClick={() => { setTypeFilter(t); setPage(1); }}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all ${typeFilter === t ? "bg-primary text-white" : "bg-surface-light/20 text-muted hover:bg-surface-light/30"}`}
              >
                {t ? ALERT_TYPE_LABELS[t]?.substring(0, 12) || t : "All Types"}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5">
            {["", "critical", "high", "medium", "low"].map((s) => (
              <button
                key={s}
                onClick={() => { setSeverityFilter(s); setPage(1); }}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all ${severityFilter === s ? "bg-primary text-white" : "bg-surface-light/20 text-muted hover:bg-surface-light/30"}`}
              >
                {s ? s.charAt(0).toUpperCase() + s.slice(1) : "All Severity"}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-5">
        {/* Table */}
        <div className={`${selected ? "w-1/2" : "w-full"} transition-all duration-300`}>
          <Card variant="elevated" padding="none" className="overflow-hidden">
            {alerts.length === 0 ? (
              <div className="p-12 text-center text-sm text-muted">No alerts found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-bg/50">
                      <th className="text-left px-4 py-3 text-[10px] font-semibold text-muted uppercase">Severity</th>
                      <th className="text-left px-4 py-3 text-[10px] font-semibold text-muted uppercase">Tourist</th>
                      <th className="text-left px-4 py-3 text-[10px] font-semibold text-muted uppercase">Type</th>
                      <th className="text-left px-4 py-3 text-[10px] font-semibold text-muted uppercase">Location</th>
                      <th className="text-left px-4 py-3 text-[10px] font-semibold text-muted uppercase">Time</th>
                      <th className="text-left px-4 py-3 text-[10px] font-semibold text-muted uppercase">Status</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {alerts.map((alert) => {
                      const Icon = TYPE_ICONS[alert.alert_type] || AlertTriangle;
                      const sev = SEVERITY_VARIANTS[alert.severity] || SEVERITY_VARIANTS.medium;
                      const sts = STATUS_VARIANTS[alert.status] || STATUS_VARIANTS.new;
                      return (
                        <tr
                          key={alert.id}
                          onClick={() => handleSelect(alert)}
                          className={`border-b border-border/50 cursor-pointer transition-colors hover:bg-primary/5 ${selected?.id === alert.id ? "bg-primary/10" : ""}`}
                        >
                          <td className="px-4 py-3">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: sev.color }} />
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-medium text-fg text-xs">{alert.tourist_name}</p>
                            <p className="text-[10px] text-muted font-mono">{alert.tourist_id.substring(0, 12)}...</p>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <Icon className="w-3.5 h-3.5 text-muted shrink-0" />
                              <span className="text-xs text-fg">{ALERT_TYPE_LABELS[alert.alert_type] || alert.alert_type}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted max-w-[120px] truncate">
                            {alert.location_name || `${alert.location_lat.toFixed(2)}, ${alert.location_lng.toFixed(2)}`}
                          </td>
                          <td className="px-4 py-3 text-xs text-muted whitespace-nowrap">
                            {new Date(alert.created_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={sts.v} size="sm" pulse={alert.status === "new"}>{sts.label}</Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Eye className="w-4 h-4 text-muted hover:text-primary transition-colors" />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
          {total > 15 && (
            <div className="flex justify-center gap-2 mt-3">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Prev</Button>
              <span className="px-3 py-1 text-sm text-muted">Page {page}</span>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page * 15 >= total}>Next</Button>
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selected && (
          <div className="w-1/2 animate-fade-in">
            <Card variant="elevated" className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  {(() => {
                    const Icon = TYPE_ICONS[selected.alert_type] || AlertTriangle;
                    const sev = SEVERITY_VARIANTS[selected.severity] || SEVERITY_VARIANTS.medium;
                    return (
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: sev.color + "20" }}>
                        <Icon className="w-5 h-5" style={{ color: sev.color }} />
                      </div>
                    );
                  })()}
                  <div>
                    <h2 className="text-sm font-bold text-fg">{ALERT_TYPE_LABELS[selected.alert_type]}</h2>
                    <p className="text-xs text-muted">{selected.id}</p>
                  </div>
                </div>
                <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-surface-light/10 text-muted">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Severity + Status */}
              <div className="flex gap-2">
                <Badge variant={SEVERITY_VARIANTS[selected.severity]?.v || "default"} size="sm">
                  {selected.severity}
                </Badge>
                <Badge variant={STATUS_VARIANTS[selected.status]?.v || "default"} size="sm" pulse={selected.status === "new"}>
                  {STATUS_VARIANTS[selected.status]?.label || selected.status}
                </Badge>
              </div>

              {/* Tourist info */}
              <div className="p-3 rounded-xl bg-bg border border-border space-y-2">
                <h4 className="text-[10px] font-semibold text-muted uppercase">Tourist</h4>
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="text-sm font-medium text-fg">{selected.tourist_name}</span>
                </div>
                <p className="text-xs text-muted font-mono ml-5.5">{selected.tourist_id}</p>
              </div>

              {/* Location */}
              <div className="p-3 rounded-xl bg-bg border border-border space-y-2">
                <h4 className="text-[10px] font-semibold text-muted uppercase">Location</h4>
                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-fg">{selected.location_name || "Unknown location"}</p>
                    <p className="text-xs text-muted font-mono">{selected.location_lat.toFixed(4)}, {selected.location_lng.toFixed(4)}</p>
                  </div>
                </div>
                <div className="mt-2 h-32 rounded-lg bg-gradient-to-br from-surface to-surface-light border border-border flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 opacity-10">
                    <div className="w-full h-full" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
                  </div>
                  <div className="relative flex flex-col items-center">
                    <MapPin className="w-6 h-6 text-danger animate-bounce" />
                    <span className="text-[9px] text-white/50 mt-1">{selected.location_lat.toFixed(2)}, {selected.location_lng.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Message */}
              {selected.message && (
                <div className="p-3 rounded-xl bg-warning-50 border border-warning-200">
                  <div className="flex items-start gap-2">
                    <MessageSquare className="w-3.5 h-3.5 text-warning shrink-0 mt-0.5" />
                    <p className="text-xs text-fg">{selected.message}</p>
                  </div>
                </div>
              )}

              {/* Time */}
              <div className="flex items-center gap-2 text-xs text-muted">
                <Clock className="w-3.5 h-3.5" />
                Created: {new Date(selected.created_at).toLocaleString("en-IN")}
              </div>

              {/* Timeline */}
              {timeline.length > 0 && (
                <div className="p-3 rounded-xl bg-bg border border-border space-y-2">
                  <h4 className="text-[10px] font-semibold text-muted uppercase">Incident Timeline</h4>
                  <div className="space-y-2">
                    {timeline.map((entry, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs">
                        <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-fg capitalize">{entry.action.replace("_", " ")}</span>
                            {entry.performed_by && <span className="text-muted">by {entry.performed_by}</span>}
                          </div>
                          {entry.notes && <p className="text-muted mt-0.5">{entry.notes}</p>}
                          <p className="text-[10px] text-muted">{new Date(entry.created_at).toLocaleString("en-IN")}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Analysis */}
              <div className="p-3 rounded-xl bg-gradient-to-br from-accent-50 to-primary-50 border border-accent-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-fg flex items-center gap-1.5">
                    <Brain className="w-4 h-4 text-accent" />
                    AI Analysis
                  </h4>
                  <Button variant="ghost" size="sm" onClick={() => runAIAnalysis(selected.tourist_id)} disabled={aiLoading} icon={<Zap className="w-3 h-3" />}>
                    {aiLoading ? "Analyzing..." : "Run AI"}
                  </Button>
                </div>

                {aiLoading && (
                  <div className="flex items-center gap-2 py-3">
                    <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-muted">Running Isolation Forest analysis...</span>
                  </div>
                )}

                {aiAnalysis && !aiLoading && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <Cpu className="w-3 h-3 text-muted" />
                        <span className="text-[10px] text-muted font-mono">{aiAnalysis.model_version}</span>
                      </div>
                      <Badge
                        variant={aiAnalysis.risk_level === "critical" ? "danger" : aiAnalysis.risk_level === "high" ? "danger" : aiAnalysis.risk_level === "medium" ? "warning" : "success"}
                        size="sm"
                      >
                        Score: {aiAnalysis.anomaly_score.toFixed(3)}
                      </Badge>
                      <Badge
                        variant={aiAnalysis.risk_level === "critical" ? "danger" : aiAnalysis.risk_level === "high" ? "danger" : aiAnalysis.risk_level === "medium" ? "warning" : "success"}
                        size="sm"
                      >
                        {aiAnalysis.risk_level.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="space-y-1">
                      {aiAnalysis.reasons.map((reason, i) => (
                        <div key={i} className="flex items-start gap-1.5 text-xs">
                          <AlertTriangle className="w-3 h-3 text-warning shrink-0 mt-0.5" />
                          <span className="text-fg">{reason}</span>
                        </div>
                      ))}
                    </div>

                    <div className="p-2 rounded-lg bg-white/60 border border-border">
                      <p className="text-[10px] text-muted font-semibold uppercase mb-1">Recommended Action</p>
                      <p className="text-xs text-fg">{aiAnalysis.recommended_action}</p>
                    </div>

                    {/* Top contributing features */}
                    <div className="space-y-1">
                      <p className="text-[10px] text-muted font-semibold uppercase">Top Anomalous Features</p>
                      {aiAnalysis.contributions.filter((c) => c.is_anomalous).slice(0, 3).map((c, i) => (
                        <div key={i} className="flex items-center gap-2 text-[10px]">
                          <span className="text-muted font-mono w-32 truncate">{c.feature.replace(/_/g, " ")}</span>
                          <div className="flex-1 h-1.5 rounded-full bg-white/60 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${c.contribution_score * 100}%`,
                                backgroundColor: c.contribution_score > 0.8 ? "#ef4444" : c.contribution_score > 0.6 ? "#eab308" : "#22c55e",
                              }}
                            />
                          </div>
                          <span className="text-fg font-mono w-8 text-right">{c.value.toFixed(1)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!aiAnalysis && !aiLoading && (
                  <p className="text-xs text-muted text-center py-2">
                    Click "Run AI" to analyze this tourist's movement patterns.
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 flex-wrap">
                {selected.status === "new" && (
                  <Button variant="secondary" size="sm" onClick={() => handleStatusUpdate(selected.id, AlertStatus.ACKNOWLEDGED)} icon={<CheckCircle className="w-3.5 h-3.5" />}>
                    Acknowledge
                  </Button>
                )}
                {(selected.status === "new" || selected.status === "acknowledged") && (
                  <Button variant="secondary" size="sm" onClick={() => handleStatusUpdate(selected.id, AlertStatus.UNDER_REVIEW)} icon={<Eye className="w-3.5 h-3.5" />}>
                    Under Review
                  </Button>
                )}
                {selected.status !== AlertStatus.RESOLVED && selected.status !== AlertStatus.FALSE_POSITIVE && (
                  <Button variant="danger" size="sm" onClick={() => setShowEscalateModal(true)} icon={<ArrowUpCircle className="w-3.5 h-3.5" />}>
                    Escalate
                  </Button>
                )}
                {selected.status !== AlertStatus.RESOLVED && selected.status !== AlertStatus.FALSE_POSITIVE && (
                  <Button variant="primary" size="sm" onClick={() => setShowResolveModal(true)} icon={<CheckCircle className="w-3.5 h-3.5" />}>
                    Resolve
                  </Button>
                )}
                {selected.status !== AlertStatus.RESOLVED && selected.status !== AlertStatus.FALSE_POSITIVE && (
                  <Button variant="outline" size="sm" onClick={() => handleGenerateEfir(selected)} disabled={actionLoading} icon={<FileText className="w-3.5 h-3.5" />}>
                    Generate E-FIR
                  </Button>
                )}
                {selected.status !== AlertStatus.FALSE_POSITIVE && selected.status !== AlertStatus.RESOLVED && (
                  <Button variant="ghost" size="sm" onClick={() => handleStatusUpdate(selected.id, AlertStatus.FALSE_POSITIVE, "Marked as false positive")} icon={<Ban className="w-3.5 h-3.5" />}>
                    False Positive
                  </Button>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Escalate Modal */}
      <Modal open={showEscalateModal} onClose={() => setShowEscalateModal(false)} title="Escalate Alert" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-muted">Escalating will notify senior officers and mark this alert for immediate attention.</p>
          <textarea
            value={escalateNotes}
            onChange={(e) => setEscalateNotes(e.target.value)}
            className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all resize-none"
            rows={3}
            placeholder="Add escalation notes (optional)..."
          />
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setShowEscalateModal(false)}>Cancel</Button>
            <Button variant="danger" className="flex-1" loading={actionLoading} onClick={() => selected && handleStatusUpdate(selected.id, AlertStatus.ESCALATED, escalateNotes || undefined)}>
              Escalate
            </Button>
          </div>
        </div>
      </Modal>

      {/* Resolve Modal */}
      <Modal open={showResolveModal} onClose={() => setShowResolveModal(false)} title="Resolve Alert" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-muted">Mark this alert as resolved. It will no longer appear in the active alerts list.</p>
          <textarea
            value={resolveNotes}
            onChange={(e) => setResolveNotes(e.target.value)}
            className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all resize-none"
            rows={3}
            placeholder="Resolution notes (optional)..."
          />
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setShowResolveModal(false)}>Cancel</Button>
            <Button variant="primary" className="flex-1" loading={actionLoading} onClick={() => selected && handleStatusUpdate(selected.id, AlertStatus.RESOLVED, resolveNotes || undefined)}>
              Resolve Alert
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
