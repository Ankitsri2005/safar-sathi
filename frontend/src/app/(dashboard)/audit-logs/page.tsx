"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/utils/cn";
import {
  ClipboardList, Search, Filter, ChevronLeft, ChevronRight,
  RefreshCw, User, Shield, AlertTriangle, MapPin, CreditCard,
  FileText, Key, LogIn, Activity, Download, Clock, Eye,
} from "lucide-react";
import { AUDIT_EVENT_LABELS, AUDIT_EVENT_COLORS, AuditLog } from "@/types";

const EVENT_ICONS: Record<string, typeof LogIn> = {
  login: LogIn,
  logout: LogIn,
  tourist_record_access: User,
  id_verification: CreditCard,
  alert_viewing: Eye,
  alert_resolution: AlertTriangle,
  zone_creation: MapPin,
  zone_modification: MapPin,
  user_modification: User,
  user_creation: User,
  user_disable: User,
  password_reset: Key,
  efir_generation: FileText,
  data_export: Download,
  system_config: Shield,
  escalation: AlertTriangle,
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [eventType, setEventType] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [stats, setStats] = useState<any>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const limit = 30;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page: String(page), limit: String(limit) };
      if (eventType !== "all") params.event_type = eventType;
      if (search) params.search = search;
      if (fromDate) params.from_date = fromDate;
      if (toDate) params.to_date = toDate;
      const r = await api.get("/users/audit", { params });
      setLogs(r.data.data);
      setTotal(r.data.total);
    } catch {}
    setLoading(false);
  }, [page, eventType, search, fromDate, toDate]);

  const fetchStats = async () => {
    try {
      const r = await api.get("/users/audit/stats");
      setStats(r.data);
    } catch {}
  };

  useEffect(() => { fetchLogs(); }, [fetchLogs]);
  useEffect(() => { fetchStats(); }, []);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Audit Logs"
        subtitle="System activity and access records"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Audit Logs" }]}
      />

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 rounded-2xl bg-surface border border-border">
            <p className="text-lg font-bold text-fg">{stats.total_events}</p>
            <p className="text-[11px] text-muted">Total Events</p>
          </div>
          <div className="p-3 rounded-2xl bg-surface border border-border">
            <p className="text-lg font-bold text-primary">{stats.today_events}</p>
            <p className="text-[11px] text-muted">Today</p>
          </div>
          <div className="p-3 rounded-2xl bg-surface border border-border">
            <p className="text-lg font-bold text-accent">{stats.unique_users_today}</p>
            <p className="text-[11px] text-muted">Active Users Today</p>
          </div>
          <div className="p-3 rounded-2xl bg-surface border border-border">
            <p className="text-lg font-bold text-success">
              {stats.top_events?.[0]?.event_type?.replace(/_/g, " ") || "N/A"}
            </p>
            <p className="text-[11px] text-muted">Top Event (7d)</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="Search user, resource..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { setSearch(searchInput); setPage(1); } }}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface border border-border text-sm text-fg placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <select
          value={eventType}
          onChange={(e) => { setEventType(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-xl bg-surface border border-border text-xs text-fg"
        >
          <option value="all">All Events</option>
          {Object.entries(AUDIT_EVENT_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <input
          type="date"
          value={fromDate}
          onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-xl bg-surface border border-border text-xs text-fg"
          placeholder="From"
        />
        <input
          type="date"
          value={toDate}
          onChange={(e) => { setToDate(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-xl bg-surface border border-border text-xs text-fg"
          placeholder="To"
        />
        <Button variant="ghost" size="sm" onClick={() => { fetchLogs(); fetchStats(); }} icon={<RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />}>
          Refresh
        </Button>
      </div>

      {/* Log List */}
      <div className="space-y-2">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && logs.length === 0 && (
          <div className="text-center py-12">
            <ClipboardList className="w-12 h-12 text-muted/20 mx-auto mb-3" />
            <p className="text-sm text-muted">No audit logs found</p>
          </div>
        )}

        {!loading && logs.map((log) => {
          const Icon = EVENT_ICONS[log.event_type] || Activity;
          const colorClass = AUDIT_EVENT_COLORS[log.event_type] || "text-muted";
          const isExpanded = expandedId === log.id;

          return (
            <div
              key={log.id}
              className={cn(
                "rounded-2xl border transition-all overflow-hidden",
                isExpanded ? "bg-surface border-primary/20" : "bg-surface border-border/50 hover:border-border"
              )}
            >
              <div
                className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : log.id)}
              >
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center bg-bg", colorClass)}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-fg">
                      {AUDIT_EVENT_LABELS[log.event_type] || log.event_type}
                    </span>
                    {log.resource_type && (
                      <Badge variant="outline" size="sm">{log.resource_type}</Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-muted mt-0.5 truncate">
                    {log.user_name || "System"} ({log.user_role || "N/A"})
                    {log.resource_id && ` — ${log.resource_id.slice(0, 8)}...`}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-muted">
                    {new Date(log.created_at).toLocaleDateString("en-IN", {
                      day: "2-digit", month: "short", year: "numeric",
                    })}
                  </p>
                  <p className="text-[10px] text-muted/60">
                    {new Date(log.created_at).toLocaleTimeString("en-IN", {
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="px-4 pb-3 pt-1 border-t border-border/50 space-y-1.5">
                  {log.user_id && (
                    <DetailRow label="User ID" value={log.user_id} />
                  )}
                  {log.user_name && (
                    <DetailRow label="User Name" value={log.user_name} />
                  )}
                  {log.user_role && (
                    <DetailRow label="Role" value={log.user_role.replace(/_/g, " ")} />
                  )}
                  {log.resource_type && (
                    <DetailRow label="Resource Type" value={log.resource_type} />
                  )}
                  {log.resource_id && (
                    <DetailRow label="Resource ID" value={log.resource_id} />
                  )}
                  {log.ip_address && (
                    <DetailRow label="IP Address" value={log.ip_address} />
                  )}
                  {log.user_agent && (
                    <DetailRow label="User Agent" value={log.user_agent.slice(0, 80)} />
                  )}
                  {log.details && (
                    <div className="mt-2">
                      <p className="text-[10px] text-muted font-semibold uppercase mb-1">Details</p>
                      <pre className="text-[11px] text-fg bg-bg rounded-lg p-2 overflow-x-auto font-mono">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} icon={<ChevronLeft className="w-4 h-4" />} />
          <span className="text-xs text-muted px-3">Page {page} of {totalPages}</span>
          <Button variant="ghost" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} icon={<ChevronRight className="w-4 h-4" />} />
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2 text-xs">
      <span className="text-muted w-24 shrink-0">{label}</span>
      <span className="text-fg break-words font-mono text-[11px]">{value}</span>
    </div>
  );
}
