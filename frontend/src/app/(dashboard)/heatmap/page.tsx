"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function HeatmapPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [days, setDays] = useState(30);

  useEffect(() => {
    api.get(`/dashboard/analytics?days=${days}`).then((r) => setAnalytics(r.data));
  }, [days]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Heatmap & Analytics</h1>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Heatmap */}
        <div className="bg-white rounded-xl border p-5 min-h-[400px] flex items-center justify-center">
          <div className="text-center text-gray-400">
            <p className="text-lg font-medium">Tourist Density Heatmap</p>
            <p className="text-sm mt-1">Kepler.gl / deck.gl integration</p>
          </div>
        </div>

        {/* Charts */}
        <div className="bg-white rounded-xl border p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Alerts Over Time</h2>
          <div className="space-y-2">
            {analytics?.overTime?.map((item: any) => (
              <div key={item.date} className="flex items-center gap-2 text-sm">
                <span className="text-gray-500 w-24">{item.date}</span>
                <div
                  className="bg-blue-500 h-4 rounded"
                  style={{ width: `${Math.min(Number(item.count) * 20, 200)}px` }}
                />
                <span className="text-gray-700">{item.count}</span>
              </div>
            ))}
            {(!analytics?.overTime || analytics.overTime.length === 0) && (
              <p className="text-sm text-gray-400">No data available</p>
            )}
          </div>
        </div>

        {/* Most Visited Zones */}
        <div className="bg-white rounded-xl border p-5 lg:col-span-2">
          <h2 className="font-semibold text-gray-900 mb-4">Most Visited Zones</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {analytics?.topZones?.map((zone: any) => (
              <div key={zone.name} className="p-3 rounded-lg bg-gray-50 border text-sm">
                <p className="font-medium">{zone.name}</p>
                <p className="text-xs text-gray-500">
                  Risk: {zone.risk_level} · {zone.visit_count} visits
                </p>
              </div>
            ))}
            {(!analytics?.topZones || analytics.topZones.length === 0) && (
              <p className="text-sm text-gray-400">No zone data yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
