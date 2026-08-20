"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, BellRing, Check, CheckCheck, Trash2, AlertTriangle, Shield, CreditCard, FileText, Cpu, ArrowUp, Clock } from "lucide-react";
import api from "@/lib/api";
import { cn } from "@/utils/cn";
import { useSocket } from "@/contexts/SocketContext";
import type { Notification, NotificationType } from "@/types";

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
  panic_alert: "text-danger bg-danger/10",
  restricted_zone_entry: "text-danger bg-danger/10",
  high_risk_zone_entry: "text-warning bg-warning/10",
  ai_anomaly: "text-accent bg-accent/10",
  alert_escalation: "text-primary bg-primary/10",
  digital_id_expiry: "text-muted bg-muted/10",
  efir_generation: "text-success bg-success/10",
  system: "text-muted bg-muted/10",
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

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const { socket } = useSocket();

  const fetchUnread = useCallback(async () => {
    try {
      const r = await api.get("/notifications/unread-count");
      setUnreadCount(r.data.count);
    } catch {}
  }, []);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get("/notifications?limit=15");
      setNotifications(r.data.data);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUnread();
  }, [fetchUnread]);

  // Listen for real-time notifications via Socket.IO
  useEffect(() => {
    if (!socket) return;
    const handler = (notif: Notification) => {
      setUnreadCount((c) => c + 1);
      setNotifications((prev) => [notif, ...prev].slice(0, 15));
    };
    socket.on("notification:broadcast", handler);
    return () => { socket.off("notification:broadcast", handler); };
  }, [socket]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const toggle = () => {
    if (!open) fetchNotifications();
    setOpen(!open);
  };

  const markAllRead = async () => {
    try {
      await api.post("/notifications/read-all");
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {}
  };

  const markRead = async (id: string) => {
    try {
      await api.post("/notifications/read", { notification_ids: [id] });
      setUnreadCount((c) => Math.max(0, c - 1));
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch {}
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        onClick={toggle}
        className="relative p-2 rounded-xl hover:bg-white/5 transition-colors"
        title="Notifications"
      >
        {unreadCount > 0 ? (
          <BellRing className="w-5 h-5 text-primary-light animate-pulse" />
        ) : (
          <Bell className="w-5 h-5 text-gray-400" />
        )}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 animate-bounce-in">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-96 max-h-[500px] bg-surface-light rounded-2xl border border-border shadow-2xl overflow-hidden z-50 animate-fade-in-down">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold text-fg">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-primary hover:text-primary-light transition-colors flex items-center gap-1"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark all read
                </button>
              )}
            </div>
          </div>

          {/* Notification List */}
          <div className="overflow-y-auto max-h-[400px] divide-y divide-border/50">
            {loading && (
              <div className="flex items-center justify-center py-8">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {!loading && notifications.length === 0 && (
              <div className="py-8 text-center">
                <Bell className="w-8 h-8 text-muted/30 mx-auto mb-2" />
                <p className="text-xs text-muted">No notifications</p>
              </div>
            )}

            {!loading && notifications.map((n) => {
              const Icon = NOTIF_ICONS[n.notification_type] || Bell;
              const colorClass = NOTIF_COLORS[n.notification_type] || "text-muted bg-muted/10";

              return (
                <div
                  key={n.id}
                  className={cn(
                    "flex items-start gap-3 px-4 py-3 hover:bg-white/3 transition-colors cursor-pointer",
                    !n.read && "bg-primary/3"
                  )}
                  onClick={() => !n.read && markRead(n.id)}
                >
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", colorClass)}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-xs font-medium", !n.read ? "text-fg" : "text-muted")}>
                      {n.title}
                    </p>
                    <p className="text-[11px] text-muted truncate mt-0.5">{n.body}</p>
                    <p className="text-[10px] text-muted/60 mt-1">{timeAgo(n.created_at)}</p>
                  </div>
                  {!n.read && (
                    <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-border text-center">
            <a
              href="/notifications"
              onClick={() => setOpen(false)}
              className="text-xs text-primary hover:text-primary-light transition-colors"
            >
              View all notifications
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
