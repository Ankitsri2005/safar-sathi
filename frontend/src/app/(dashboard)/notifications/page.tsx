"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Bell, BellRing, CheckCircle, AlertTriangle, Shield, Cpu, ArrowUp,
  CreditCard, FileText, Clock, Settings, Trash2, Filter, RefreshCw,
  Mail, Smartphone, MessageSquare, Eye, EyeOff, ChevronLeft, ChevronRight,
} from "lucide-react";
import api from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/utils/cn";
import type { Notification, NotificationType, EscalationRule } from "@/types";

const NOTIF_ICONS: Record<string, typeof Bell> = {
  panic_alert: AlertTriangle,
  restricted_zone_entry: Shield,
  high_risk_zone_entry: Shield,
  ai_anomaly: Cpu,
  alert_escalation: ArrowUp,
  digital_id_expiry: CreditCard,
  efir_generation: FileText,
  system: Clock,
};

const NOTIF_COLORS: Record<string, string> = {
  panic_alert: "text-danger bg-danger/10 border-danger/20",
  restricted_zone_entry: "text-danger bg-danger/10 border-danger/20",
  high_risk_zone_entry: "text-warning bg-warning/10 border-warning/20",
  ai_anomaly: "text-accent bg-accent/10 border-accent/20",
  alert_escalation: "text-primary bg-primary/10 border-primary/20",
  digital_id_expiry: "text-muted bg-muted/10 border-muted/20",
  efir_generation: "text-success bg-success/10 border-success/20",
  system: "text-muted bg-muted/10 border-muted/20",
};

const TYPE_LABELS: Record<string, string> = {
  panic_alert: "Panic Alert",
  restricted_zone_entry: "Restricted Zone",
  high_risk_zone_entry: "High-Risk Zone",
  ai_anomaly: "AI Anomaly",
  alert_escalation: "Escalation",
  digital_id_expiry: "ID Expiry",
  efir_generation: "E-FIR",
  system: "System",
};

const CHANNEL_ICONS: Record<string, typeof Bell> = {
  in_app: Bell,
  push: BellRing,
  sms: MessageSquare,
  email: Mail,
  escalation: ArrowUp,
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [readFilter, setReadFilter] = useState<"all" | "unread" | "read">("all");
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<any>(null);
  const [escalationRules, setEscalationRules] = useState<EscalationRule[]>([]);
  const [showEscalation, setShowEscalation] = useState(false);
  const limit = 20;

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const offset = (page - 1) * limit;
      const r = await api.get(`/notifications?limit=${limit}&offset=${offset}`);
      let data = r.data.data;
      if (typeFilter !== "all") data = data.filter((n: Notification) => n.notification_type === typeFilter);
      if (readFilter === "unread") data = data.filter((n: Notification) => !n.read);
      if (readFilter === "read") data = data.filter((n: Notification) => n.read);
      setNotifications(data);
      setTotal(r.data.total);
    } catch {}
    setLoading(false);
  }, [page, typeFilter, readFilter]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const fetchPreferences = async () => {
    try {
      const r = await api.get("/notifications/preferences");
      setPreferences(r.data);
    } catch {}
  };

  const fetchEscalationRules = async () => {
    try {
      const r = await api.get("/notifications/escalation-rules");
      setEscalationRules(r.data);
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await api.post("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {}
  };

  const markRead = async (id: string) => {
    try {
      await api.post("/notifications/read", { notification_ids: [id] });
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch {}
  };

  const updatePref = async (key: string, value: boolean) => {
    try {
      await api.put("/notifications/preferences", { [key]: value });
      setPreferences((prev: any) => ({ ...prev, [key]: value }));
    } catch {}
  };

  const toggleEscalationRule = async (rule: EscalationRule) => {
    try {
      await api.put(`/notifications/escalation-rules/${rule.id}`, { is_active: !rule.is_active });
      setEscalationRules((prev) => prev.map((r) => r.id === rule.id ? { ...r, is_active: !r.is_active } : r));
    } catch {}
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-fg flex items-center gap-3">
            <Bell className="w-7 h-7 text-primary" />
            Notifications
          </h1>
          <p className="text-sm text-muted mt-1">{total} total, {unreadCount} unread</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => { setShowEscalation(!showEscalation); fetchEscalationRules(); }} icon={<ArrowUp className="w-4 h-4" />}>
            Escalation
          </Button>
          <Button variant="ghost" size="sm" onClick={() => { setShowSettings(!showSettings); fetchPreferences(); }} icon={<Settings className="w-4 h-4" />}>
            Settings
          </Button>
          {unreadCount > 0 && (
            <Button variant="primary" size="sm" onClick={markAllRead} icon={<CheckCircle className="w-4 h-4" />}>
              Mark all read
            </Button>
          )}
        </div>
      </div>

      {/* Escalation Rules Panel */}
      {showEscalation && (
        <div className="p-4 rounded-2xl bg-surface border border-border space-y-3">
          <h3 className="text-sm font-semibold text-fg flex items-center gap-2">
            <ArrowUp className="w-4 h-4 text-primary" />
            Escalation Rules
          </h3>
          <div className="space-y-2">
            {escalationRules.map((rule) => (
              <div key={rule.id} className="flex items-center justify-between p-3 rounded-xl bg-bg border border-border/50">
                <div>
                  <p className="text-xs font-medium text-fg">{rule.name}</p>
                  <p className="text-[11px] text-muted mt-0.5">
                    After {rule.escalate_after_minutes}min → {rule.escalate_to_role || "specific user"}
                    {rule.alert_type && ` (${TYPE_LABELS[rule.alert_type] || rule.alert_type})`}
                    {rule.severity && ` [${rule.severity}]`}
                  </p>
                </div>
                <button
                  onClick={() => toggleEscalationRule(rule)}
                  className={cn(
                    "w-10 h-5 rounded-full transition-colors relative",
                    rule.is_active ? "bg-success" : "bg-border"
                  )}
                >
                  <div className={cn(
                    "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform",
                    rule.is_active ? "translate-x-5" : "translate-x-0.5"
                  )} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && preferences && (
        <div className="p-4 rounded-2xl bg-surface border border-border space-y-3">
          <h3 className="text-sm font-semibold text-fg flex items-center gap-2">
            <Settings className="w-4 h-4 text-primary" />
            Notification Preferences
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { key: "panic_alert_push", label: "Panic Push", icon: BellRing },
              { key: "panic_alert_sms", label: "Panic SMS", icon: MessageSquare },
              { key: "restricted_zone_push", label: "Zone Push", icon: Shield },
              { key: "high_risk_zone_push", label: "High Risk Push", icon: Shield },
              { key: "ai_anomaly_push", label: "AI Push", icon: Cpu },
              { key: "escalation_push", label: "Escalation Push", icon: ArrowUp },
              { key: "sms_enabled", label: "SMS Enabled", icon: Smartphone },
              { key: "push_enabled", label: "Push Enabled", icon: BellRing },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => updatePref(key, !preferences[key])}
                className={cn(
                  "flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-all",
                  preferences[key]
                    ? "bg-success/10 border-success/30 text-success"
                    : "bg-bg border-border text-muted"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1 bg-surface border border-border rounded-xl p-1">
          {(["all", "unread", "read"] as const).map((f) => (
            <button
              key={f}
              onClick={() => { setReadFilter(f); setPage(1); }}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize",
                readFilter === f ? "bg-primary text-white" : "text-muted hover:text-fg"
              )}
            >
              {f}
            </button>
          ))}
        </div>
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          className="px-3 py-1.5 rounded-xl bg-surface border border-border text-xs text-fg"
        >
          <option value="all">All types</option>
          <option value="panic_alert">Panic Alert</option>
          <option value="restricted_zone_entry">Restricted Zone</option>
          <option value="high_risk_zone_entry">High-Risk Zone</option>
          <option value="ai_anomaly">AI Anomaly</option>
          <option value="alert_escalation">Escalation</option>
          <option value="digital_id_expiry">ID Expiry</option>
          <option value="efir_generation">E-FIR</option>
          <option value="system">System</option>
        </select>
      </div>

      {/* Notification List */}
      <div className="space-y-2">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && notifications.length === 0 && (
          <div className="text-center py-12">
            <Bell className="w-12 h-12 text-muted/20 mx-auto mb-3" />
            <p className="text-sm text-muted">No notifications found</p>
          </div>
        )}

        {!loading && notifications.map((n) => {
          const Icon = NOTIF_ICONS[n.notification_type] || Bell;
          const colorClass = NOTIF_COLORS[n.notification_type] || "text-muted bg-muted/10 border-muted/20";
          const ChannelIcon = CHANNEL_ICONS[n.channel] || Bell;

          return (
            <div
              key={n.id}
              className={cn(
                "flex items-start gap-4 p-4 rounded-2xl border transition-all",
                !n.read
                  ? "bg-surface border-primary/20 shadow-sm"
                  : "bg-surface border-border/50 hover:border-border"
              )}
            >
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border", colorClass)}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={cn("text-sm font-medium", !n.read ? "text-fg" : "text-muted")}>
                    {n.title}
                  </p>
                  <Badge variant="outline" size="sm">
                    <ChannelIcon className="w-3 h-3 mr-1" />
                    {n.channel}
                  </Badge>
                  <Badge variant={n.status === "delivered" ? "success" : n.status === "failed" ? "danger" : "warning"} size="sm">
                    {n.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted mt-1">{n.body}</p>
                <div className="flex items-center gap-3 mt-2 text-[11px] text-muted/60">
                  <span>{timeAgo(n.created_at)}</span>
                  {n.retry_count > 0 && <span>Retry #{n.retry_count}</span>}
                  {n.error_message && <span className="text-danger">{n.error_message}</span>}
                  <span className="capitalize">{TYPE_LABELS[n.notification_type] || n.notification_type}</span>
                </div>
              </div>
              {!n.read && (
                <button
                  onClick={() => markRead(n.id)}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-muted hover:text-fg transition-colors"
                  title="Mark as read"
                >
                  <Eye className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            icon={<ChevronLeft className="w-4 h-4" />}
          />
          <span className="text-xs text-muted px-3">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            icon={<ChevronRight className="w-4 h-4" />}
          />
        </div>
      )}
    </div>
  );
}
