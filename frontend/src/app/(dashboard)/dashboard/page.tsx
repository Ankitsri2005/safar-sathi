"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { OverviewStats, Alert } from "@/types";

export default function DashboardOverview() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [recentAlerts, setRecentAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    api.get("/dashboard/overview").then((r) => setStats(r.data));
    api.get("/alerts/recent").then((r) => setRecentAlerts(r.data));
  }, []);

  const statCards = [
    { label: "Active Tourists", value: stats?.active_tourists ?? "—", color: "bg-blue-500" },
    { label: "Active Alerts", value: stats?.active_alerts ?? "—", color: "bg-red-500" },
    { label: "IDs Issued Today", value: stats?.ids_issued_today ?? "—", color: "bg-green-500" },
    { label: "Total Active IDs", value: stats?.total_active_ids ?? "—", color: "bg-purple-500" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl border p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{card.value}</p>
              </div>
              <div className={`w-3 h-10 rounded-full ${card.color}`} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Placeholder */}
        <div className="lg:col-span-2 bg-white rounded-xl border p-5 min-h-[400px] flex items-center justify-center">
          <div className="text-center text-gray-400">
            <p className="text-lg font-medium">Live Map</p>
            <p className="text-sm mt-1">Tourist locations will render here with Mapbox</p>
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="bg-white rounded-xl border p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Recent Alerts</h2>
          <div className="space-y-3">
            {recentAlerts.length === 0 && (
              <p className="text-sm text-gray-400">No recent alerts</p>
            )}
            {recentAlerts.map((alert) => (
              <div
                key={alert.id}
                className="p-3 rounded-lg bg-gray-50 border text-sm"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{alert.tourist_name}</p>
                    <p className="text-gray-500 text-xs">{alert.alert_type}</p>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      alert.status === "new"
                        ? "bg-red-100 text-red-700"
                        : alert.status === "under_review"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {alert.status}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(alert.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
