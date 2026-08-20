"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Alert, AlertStatus, AlertType } from "@/types";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Alert | null>(null);

  const fetchAlerts = () => {
    const params: Record<string, string> = { page: String(page), limit: "15" };
    if (statusFilter) params.status = statusFilter;
    if (typeFilter) params.alert_type = typeFilter;
    api.get("/alerts", { params }).then((r) => {
      setAlerts(r.data.data);
      setTotal(r.data.total);
    });
  };

  useEffect(() => {
    fetchAlerts();
  }, [page, statusFilter, typeFilter]);

  const handleStatusUpdate = async (id: string, status: AlertStatus) => {
    await api.patch(`/alerts/${id}`, { status });
    fetchAlerts();
    setSelected(null);
  };

  const statusColors: Record<string, string> = {
    new: "bg-red-100 text-red-700",
    under_review: "bg-yellow-100 text-yellow-700",
    resolved: "bg-green-100 text-green-700",
  };

  const typeLabels: Record<string, string> = {
    panic: "Panic Button",
    anomaly: "Anomaly",
    geofence_breach: "Geofence Breach",
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Alerts Management</h1>

      {/* Filters */}
      <div className="flex gap-4">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          <option value="">All Status</option>
          <option value="new">New</option>
          <option value="under_review">Under Review</option>
          <option value="resolved">Resolved</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          <option value="">All Types</option>
          <option value="panic">Panic Button</option>
          <option value="anomaly">Anomaly</option>
          <option value="geofence_breach">Geofence Breach</option>
        </select>
        <span className="text-sm text-gray-500 self-center">{total} alerts</span>
      </div>

      <div className="flex gap-6">
        {/* Table */}
        <div className={`${selected ? "w-1/2" : "w-full"} transition-all`}>
          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Tourist</th>
                  <th className="text-left px-4 py-3 font-medium">Type</th>
                  <th className="text-left px-4 py-3 font-medium">Location</th>
                  <th className="text-left px-4 py-3 font-medium">Time</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((alert) => (
                  <tr
                    key={alert.id}
                    onClick={() => setSelected(alert)}
                    className="border-b hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-4 py-3">{alert.tourist_name}</td>
                    <td className="px-4 py-3">{typeLabels[alert.alert_type]}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {alert.location_name || `${alert.location_lat.toFixed(2)}, ${alert.location_lng.toFixed(2)}`}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {new Date(alert.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[alert.status]}`}>
                        {alert.status.replace("_", " ")}
                      </span>
                    </td>
                  </tr>
                ))}
                {alerts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                      No alerts found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {total > 15 && (
            <div className="flex justify-center gap-2 mt-4">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 border rounded text-sm disabled:opacity-50"
              >
                Prev
              </button>
              <span className="px-3 py-1 text-sm text-gray-500">Page {page}</span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page * 15 >= total}
                className="px-3 py-1 border rounded text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selected && (
          <div className="w-1/2 bg-white rounded-xl border p-5 space-y-4">
            <div className="flex justify-between items-start">
              <h2 className="font-semibold text-lg">Alert Detail</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>

            <div className="space-y-2 text-sm">
              <p><span className="text-gray-500">Tourist:</span> {selected.tourist_name}</p>
              <p><span className="text-gray-500">Type:</span> {typeLabels[selected.alert_type]}</p>
              <p><span className="text-gray-500">Location:</span> {selected.location_lat}, {selected.location_lng}</p>
              <p><span className="text-gray-500">Time:</span> {new Date(selected.created_at).toLocaleString()}</p>
              {selected.message && (
                <p><span className="text-gray-500">Message:</span> {selected.message}</p>
              )}
            </div>

            <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-400 text-center">
              Map showing last known location
            </div>

            <div className="flex gap-2">
              {selected.status === "new" && (
                <button
                  onClick={() => handleStatusUpdate(selected.id, AlertStatus.UNDER_REVIEW)}
                  className="px-3 py-2 bg-yellow-500 text-white rounded-lg text-sm hover:bg-yellow-600"
                >
                  Mark Under Review
                </button>
              )}
              {selected.status !== AlertStatus.RESOLVED && (
                <button
                  onClick={() => handleStatusUpdate(selected.id, AlertStatus.RESOLVED)}
                  className="px-3 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600"
                >
                  Mark Resolved
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
