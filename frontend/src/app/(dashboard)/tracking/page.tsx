"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { ActiveTouristLocation } from "@/types";

export default function TrackingPage() {
  const [tourists, setTourists] = useState<ActiveTouristLocation[]>([]);
  const [selected, setSelected] = useState<ActiveTouristLocation | null>(null);

  useEffect(() => {
    api.get("/dashboard/active-tourists").then((r) => setTourists(r.data));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Live Tourist Tracking</h1>

      <div className="flex gap-6">
        {/* Map */}
        <div className="flex-1 bg-white rounded-xl border min-h-[500px] flex items-center justify-center">
          <div className="text-center text-gray-400">
            <p className="text-lg font-medium">Live Tracking Map</p>
            <p className="text-sm mt-1">
              {tourists.length} active tourists — Mapbox integration pending
            </p>
          </div>
        </div>

        {/* Side Panel */}
        <div className="w-80 bg-white rounded-xl border p-5">
          <h2 className="font-semibold mb-4">Active Tourists</h2>
          {selected ? (
            <div className="space-y-3 text-sm">
              <button
                onClick={() => setSelected(null)}
                className="text-blue-600 text-xs"
              >
                ← Back to list
              </button>
              <p className="font-medium text-lg">{selected.full_name}</p>
              <div className="space-y-1 text-gray-600">
                <p>ID: {selected.id.slice(0, 8)}...</p>
                <p>Lat: {selected.lat.toFixed(4)}</p>
                <p>Lng: {selected.lng.toFixed(4)}</p>
                <p>Block: {selected.block_id.slice(0, 8)}...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {tourists.length === 0 && (
                <p className="text-sm text-gray-400">No active tourists</p>
              )}
              {tourists.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelected(t)}
                  className="w-full text-left p-3 rounded-lg hover:bg-gray-50 border text-sm"
                >
                  <p className="font-medium">{t.full_name}</p>
                  <p className="text-xs text-gray-400">
                    {t.lat.toFixed(2)}, {t.lng.toFixed(2)}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
