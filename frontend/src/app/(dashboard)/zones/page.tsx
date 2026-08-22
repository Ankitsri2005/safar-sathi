"use client";

import { useEffect, useState, useRef } from "react";
import api from "@/lib/api";
import { Zone, RiskLevel } from "@/types";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  Plus,
  Trash2,
  Pencil,
  Pause,
  Play,
  Info,
  RotateCcw,
  Check,
  Navigation,
} from "lucide-react";
const RISK_COLORS: Record<string, { stroke: string; bg: string; badge: "success" | "warning" | "danger" | "accent" }> = {
  low: { stroke: "#22c55e", bg: "bg-success-50", badge: "success" },
  medium: { stroke: "#eab308", bg: "bg-warning-50", badge: "warning" },
  high: { stroke: "#ef4444", bg: "bg-danger-50", badge: "danger" },
  restricted: { stroke: "#8b5cf6", bg: "bg-accent-50", badge: "accent" },
};

interface ZonesMapProps {
  zones: Zone[];
  drawingPoints: { lng: number; lat: number }[];
  onMapClick?: (lng: number, lat: number) => void;
  mode: "view" | "draw";
}

function ZonesMap({ zones, drawingPoints, onMapClick, mode }: ZonesMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any | null>(null);
  const zonesLayerGroupRef = useRef<any | null>(null);
  const drawingLayerGroupRef = useRef<any | null>(null);

  // Initialize Map
  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    let isCancelled = false;
    let mapInstance: any = null;
    let resizeObserverInstance: ResizeObserver | null = null;

    Promise.all([
      import("leaflet"),
      import("leaflet/dist/leaflet.css")
    ])
      .then(([L]) => {
        if (isCancelled) return;
        if (!mapContainerRef.current) return;

        // Prevent double initialization
        if (mapContainerRef.current.classList.contains("leaflet-container")) {
          return;
        }

        const map = L.map(mapContainerRef.current, {
          zoomControl: false,
        }).setView([27.3314, 88.6138], 9);

        mapInstance = map;

        L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 20
        }).addTo(map);

        L.control.zoom({ position: "topright" }).addTo(map);

        zonesLayerGroupRef.current = L.featureGroup().addTo(map);
        drawingLayerGroupRef.current = L.featureGroup().addTo(map);

        setTimeout(() => {
          if (!isCancelled && map) {
            map.invalidateSize();
          }
        }, 100);

        mapRef.current = map;

        const resizeObserver = new ResizeObserver(() => {
          if (!isCancelled && map) {
            map.invalidateSize();
          }
        });
        if (mapContainerRef.current.parentElement) {
          resizeObserver.observe(mapContainerRef.current.parentElement);
        }
        resizeObserverInstance = resizeObserver;
      })
      .catch((err) => {
        console.error("Leaflet loading error:", err);
      });

    return () => {
      isCancelled = true;
      if (resizeObserverInstance) {
        resizeObserverInstance.disconnect();
      }
      if (mapInstance) {
        mapInstance.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update Zones Layer
  useEffect(() => {
    const map = mapRef.current;
    const zonesGroup = zonesLayerGroupRef.current;
    if (!map || !zonesGroup) return;

    zonesGroup.clearLayers();

    import("leaflet").then((L) => {
      zones.forEach((zone) => {
        try {
          const geo = typeof zone.polygon_geojson === "string"
            ? JSON.parse(zone.polygon_geojson)
            : zone.polygon_geojson;
          
          const coords = geo?.geometry?.coordinates?.[0];
          if (!coords || coords.length < 3) return;

          const latlngs = coords.map((c: number[]) => [c[1], c[0]] as [number, number]);

          const color =
            zone.risk_level === "low" ? "#22c55e" :
            zone.risk_level === "medium" ? "#eab308" :
            zone.risk_level === "high" ? "#ef4444" :
            zone.risk_level === "restricted" ? "#8b5cf6" : "#94a3b8";

          const poly = L.polygon(latlngs, {
            color,
            weight: 2,
            fillColor: color,
            fillOpacity: 0.2,
          }).addTo(zonesGroup);

          poly.bindTooltip(zone.name, {
            permanent: true,
            direction: "center",
            className: "leaflet-zone-label",
          });
        } catch {}
      });

      // Automatically focus and fit map to match the filtered zones list
      if (zones.length > 0 && zonesGroup.getLayers().length > 0) {
        try {
          map.fitBounds(zonesGroup.getBounds(), { padding: [40, 40], maxZoom: 14 });
        } catch {}
      }
    });
  }, [zones]);

  // Update Drawing Layer
  useEffect(() => {
    const map = mapRef.current;
    const drawingGroup = drawingLayerGroupRef.current;
    if (!map || !drawingGroup) return;

    drawingGroup.clearLayers();

    if (mode !== "draw" || drawingPoints.length === 0) return;

    import("leaflet").then((L) => {
      const latlngs = drawingPoints.map((p) => [p.lat, p.lng] as [number, number]);

      if (drawingPoints.length >= 2) {
        if (drawingPoints.length >= 3) {
          L.polygon(latlngs, {
            color: "#14b8a6",
            weight: 2,
            dashArray: "5, 5",
            fillColor: "#14b8a6",
            fillOpacity: 0.15,
          }).addTo(drawingGroup);
        } else {
          L.polyline(latlngs, {
            color: "#14b8a6",
            weight: 2.5,
            dashArray: "3, 2",
          }).addTo(drawingGroup);
        }
      }

      drawingPoints.forEach((p) => {
        L.circleMarker([p.lat, p.lng], {
          radius: 6,
          fillColor: "#14b8a6",
          fillOpacity: 1,
          color: "#ffffff",
          weight: 2,
        }).addTo(drawingGroup);
      });
    });
  }, [drawingPoints, mode]);

  // Map Click Listener
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const handleMapClick = (e: any) => {
      if (mode !== "draw" || !onMapClick) return;
      onMapClick(e.latlng.lng, e.latlng.lat);
    };

    map.on("click", handleMapClick);
    return () => {
      map.off("click", handleMapClick);
    };
  }, [mode, onMapClick]);

  return <div ref={mapContainerRef} className="w-full h-full" />;
}

export default function ZonesPage() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deactivateId, setDeactivateId] = useState<string | null>(null);
  const [filterRisk, setFilterRisk] = useState<string>("all");
  const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive">("all");
  const [mode, setMode] = useState<"view" | "draw">("view");
  const [drawingPoints, setDrawingPoints] = useState<{ lng: number; lat: number }[]>([]);
  const [form, setForm] = useState({ name: "", risk_level: RiskLevel.MEDIUM, description: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadZones();
  }, []);

  const loadZones = async () => {
    setLoading(true);
    try {
      const r = await api.get("/zones");
      setZones(r.data);
    } catch {}
    setLoading(false);
  };

  const filteredZones = zones.filter((z) => {
    if (filterRisk !== "all" && z.risk_level !== filterRisk) return false;
    if (filterActive === "active" && !z.is_active) return false;
    if (filterActive === "inactive" && z.is_active) return false;
    return true;
  });

  const handleMapClick = (lng: number, lat: number) => {
    if (mode !== "draw") return;
    setDrawingPoints((prev) => [...prev, { lng, lat }]);
  };

  const handleCreate = async () => {
    if (drawingPoints.length < 3) return;

    const coords = drawingPoints.map((p) => [p.lng, p.lat]);
    coords.push(coords[0]); // Close polygon

    const polygon = {
      type: "Feature",
      geometry: { type: "Polygon", coordinates: [coords] },
    };

    try {
      await api.post("/zones", {
        ...form,
        polygon_geojson: JSON.stringify(polygon),
      });
      await loadZones();
      resetForm();
    } catch {}
  };

  const handleUpdate = async () => {
    if (!editingZone) return;

    let polygon;
    if (drawingPoints.length >= 3) {
      const coords = drawingPoints.map((p) => [p.lng, p.lat]);
      coords.push(coords[0]);
      polygon = { type: "Feature", geometry: { type: "Polygon", coordinates: [coords] } };
    } else {
      polygon = typeof editingZone.polygon_geojson === "string"
        ? JSON.parse(editingZone.polygon_geojson)
        : editingZone.polygon_geojson;
    }

    try {
      await api.put(`/zones/${editingZone.id}`, {
        ...form,
        polygon_geojson: JSON.stringify(polygon),
      });
      await loadZones();
      resetForm();
    } catch {}
  };

  const handleDeactivate = async () => {
    if (!deactivateId) return;
    try {
      await api.patch(`/zones/${deactivateId}/deactivate`);
      await loadZones();
    } catch {}
    setDeactivateId(null);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/zones/${deleteId}`);
      await loadZones();
    } catch {}
    setDeleteId(null);
  };

  const resetForm = () => {
    setForm({ name: "", risk_level: RiskLevel.MEDIUM, description: "" });
    setDrawingPoints([]);
    setShowForm(false);
    setEditingZone(null);
    setMode("view");
  };

  const startEdit = (zone: Zone) => {
    setEditingZone(zone);
    setForm({ name: zone.name, risk_level: zone.risk_level, description: zone.description || "" });
    setShowForm(true);
    setMode("view");
    setDrawingPoints([]);
  };

  const activeZones = zones.filter((z) => z.is_active);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Zone Management"
        subtitle="Define and manage safety zones with risk levels"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Zones" }]}
        actions={
          <div className="flex gap-2">
            <Button
              variant={mode === "draw" ? "danger" : "outline"}
              size="sm"
              onClick={() => { setMode(mode === "draw" ? "view" : "draw"); setDrawingPoints([]); }}
              icon={mode === "draw" ? <RotateCcw className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            >
              {mode === "draw" ? "Cancel Drawing" : "Draw Zone"}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => { setShowForm(true); setEditingZone(null); setForm({ name: "", risk_level: RiskLevel.MEDIUM, description: "" }); }}
              icon={<Plus className="w-4 h-4" />}
            >
              Add Zone
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map */}
        <div className="lg:col-span-2">
          <Card variant="elevated" padding="none" className="overflow-hidden">
            <div className="h-[500px]">
              <ZonesMap
                zones={filteredZones}
                drawingPoints={drawingPoints}
                onMapClick={handleMapClick}
                mode={mode === "draw" ? "draw" : "view"}
              />
            </div>
            {mode === "draw" && (
              <div className="p-3 border-t border-border bg-bg/50 flex items-center justify-between">
                <p className="text-xs text-muted">
                  Click on the map to place polygon points. Minimum 3 points required.
                  {drawingPoints.length > 0 && ` (${drawingPoints.length} points placed)`}
                </p>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setDrawingPoints([])} icon={<RotateCcw className="w-3.5 h-3.5" />}>
                    Reset
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={drawingPoints.length < 3 || !form.name}
                    onClick={editingZone ? handleUpdate : handleCreate}
                    icon={<Check className="w-3.5 h-3.5" />}
                  >
                    {editingZone ? "Update Zone" : "Save Zone"}
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar: Filters + Zone List */}
        <div className="space-y-4">
          {/* Filters */}
          <Card variant="elevated">
            <h3 className="text-sm font-semibold text-fg mb-3">Filters</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted mb-1 block">Risk Level</label>
                <div className="flex flex-wrap gap-1.5">
                  {["all", "low", "medium", "high", "restricted"].map((r) => (
                    <button
                      key={r}
                      onClick={() => setFilterRisk(r)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                        filterRisk === r
                          ? "bg-primary text-white"
                          : "bg-surface-light/20 text-muted hover:bg-surface-light/30"
                      }`}
                    >
                      {r === "all" ? "All" : r.charAt(0).toUpperCase() + r.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-muted mb-1 block">Status</label>
                <div className="flex gap-1.5">
                  {(["all", "active", "inactive"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setFilterActive(s)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                        filterActive === s
                          ? "bg-primary text-white"
                          : "bg-surface-light/20 text-muted hover:bg-surface-light/30"
                      }`}
                    >
                      {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <Card variant="elevated" padding="sm">
              <p className="text-[10px] text-muted uppercase">Total Zones</p>
              <p className="text-2xl font-bold text-fg">{zones.length}</p>
            </Card>
            <Card variant="elevated" padding="sm">
              <p className="text-[10px] text-muted uppercase">Active</p>
              <p className="text-2xl font-bold text-success">{activeZones.length}</p>
            </Card>
          </div>

          {/* Zone List */}
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {filteredZones.length === 0 ? (
              <EmptyState
                title="No zones found"
                description={zones.length === 0 ? "Draw a zone on the map or click Add Zone." : "No zones match the current filters."}
              />
            ) : (
              filteredZones.map((zone) => {
                const colors = RISK_COLORS[zone.risk_level] || RISK_COLORS.medium;
                return (
                  <Card
                    key={zone.id}
                    variant="default"
                    padding="sm"
                    className={`transition-all hover:shadow-md ${!zone.is_active ? "opacity-50" : ""}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-fg truncate">{zone.name}</h4>
                          {!zone.is_active && <Badge variant="danger" size="sm">Inactive</Badge>}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={colors.badge} size="sm">{zone.risk_level}</Badge>
                        </div>
                        {zone.description && (
                          <p className="text-xs text-muted mt-1.5 line-clamp-2">{zone.description}</p>
                        )}
                      </div>
                      <div className="flex gap-1 ml-2 shrink-0">
                        <button
                          onClick={() => startEdit(zone)}
                          className="p-1.5 rounded-lg hover:bg-primary-50 text-muted hover:text-primary transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeactivateId(zone.id)}
                          className="p-1.5 rounded-lg hover:bg-warning-50 text-muted hover:text-warning transition-colors"
                          title={zone.is_active ? "Deactivate" : "Activate"}
                        >
                          {zone.is_active ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => setDeleteId(zone.id)}
                          className="p-1.5 rounded-lg hover:bg-danger-50 text-muted hover:text-danger transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Create / Edit Modal */}
      <Modal
        open={showForm}
        onClose={resetForm}
        title={editingZone ? "Edit Zone" : "Create New Zone"}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-fg mb-1">Zone Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
              placeholder="e.g. Gangtok City Center"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-fg mb-1">Risk Level</label>
            <div className="grid grid-cols-4 gap-2">
              {(["low", "medium", "high", "restricted"] as const).map((level) => {
                const colors = RISK_COLORS[level];
                return (
                  <button
                    key={level}
                    onClick={() => setForm({ ...form, risk_level: level as RiskLevel })}
                    className={`p-2.5 rounded-xl border-2 text-xs font-medium transition-all text-center ${
                      form.risk_level === level
                        ? `${colors.bg} border-current text-fg`
                        : "border-border bg-white hover:border-gray-300 text-muted"
                    }`}
                    style={form.risk_level === level ? { borderColor: colors.stroke, color: colors.stroke } : {}}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-fg mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all resize-none"
              rows={3}
              placeholder="Describe this zone's purpose and boundaries..."
            />
          </div>

          {mode !== "draw" && (
            <div className="p-3 rounded-xl bg-primary-50 border border-primary-200 flex items-start gap-2">
              <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-primary">
                To draw a polygon on the map, click <strong>Draw Zone</strong> in the header first, then click on the map to place points.
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={resetForm}>Cancel</Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={editingZone ? handleUpdate : handleCreate}
              disabled={!form.name}
            >
              {editingZone ? "Update Zone" : "Create Zone"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Deactivate Confirm */}
      <ConfirmDialog
        open={!!deactivateId}
        onClose={() => setDeactivateId(null)}
        onConfirm={handleDeactivate}
        title="Deactivate Zone"
        message="This zone will be deactivated and no longer used for spatial containment checks. You can reactivate it later."
        confirmLabel="Deactivate"
      />

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Zone"
        message="This will permanently delete this zone. This action cannot be undone."
        confirmLabel="Delete Zone"
      />
    </div>
  );
}
