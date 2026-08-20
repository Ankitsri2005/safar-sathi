"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Zone, RiskLevel } from "@/types";

export default function ZonesPage() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    risk_level: "medium" as RiskLevel,
    description: "",
  });

  useEffect(() => {
    api.get("/zones").then((r) => setZones(r.data));
  }, []);

  const handleCreate = async () => {
    const polygon = {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [[[88.60, 27.33], [88.62, 27.33], [88.62, 27.35], [88.60, 27.35], [88.60, 27.33]]],
      },
    };
    await api.post("/zones", {
      ...form,
      polygon_geojson: JSON.stringify(polygon),
    });
    const r = await api.get("/zones");
    setZones(r.data);
    setShowForm(false);
    setForm({ name: "", risk_level: "medium", description: "" });
  };

  const riskColors: Record<string, string> = {
    low: "bg-green-100 text-green-700",
    medium: "bg-yellow-100 text-yellow-700",
    high: "bg-orange-100 text-orange-700",
    restricted: "bg-red-100 text-red-700",
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this zone?")) return;
    await api.delete(`/zones/${id}`);
    setZones(zones.filter((z) => z.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Zone Management</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
        >
          {showForm ? "Cancel" : "+ Add Zone"}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border p-5 space-y-4">
          <h2 className="font-semibold">Create New Zone</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Zone Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Risk Level</label>
              <select
                value={form.risk_level}
                onChange={(e) => setForm({ ...form, risk_level: e.target.value as RiskLevel })}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="restricted">Restricted</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
          <p className="text-xs text-gray-400">
            Note: Polygon drawing on map coming soon. Using placeholder coordinates for now.
          </p>
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
          >
            Create Zone
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {zones.map((zone) => (
          <div key={zone.id} className="bg-white rounded-xl border p-5">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{zone.name}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${riskColors[zone.risk_level]}`}>
                  {zone.risk_level}
                </span>
              </div>
              <button
                onClick={() => handleDelete(zone.id)}
                className="text-red-400 hover:text-red-600 text-sm"
              >
                Delete
              </button>
            </div>
            {zone.description && (
              <p className="text-sm text-gray-500 mt-2">{zone.description}</p>
            )}
          </div>
        ))}
        {zones.length === 0 && (
          <p className="text-gray-400 text-sm col-span-full text-center py-8">
            No zones defined yet
          </p>
        )}
      </div>
    </div>
  );
}
