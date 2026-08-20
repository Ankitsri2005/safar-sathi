"use client";

import { useEffect, useState, useRef, useCallback } from "react";
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
} from "lucide-react";

const RISK_COLORS: Record<string, { fill: string; stroke: string; bg: string; badge: "success" | "warning" | "danger" | "accent" }> = {
  low: { fill: "rgba(34,197,94,0.15)", stroke: "#22c55e", bg: "bg-success-50", badge: "success" },
  medium: { fill: "rgba(234,179,8,0.15)", stroke: "#eab308", bg: "bg-warning-50", badge: "warning" },
  high: { fill: "rgba(239,68,68,0.15)", stroke: "#ef4444", bg: "bg-danger-50", badge: "danger" },
  restricted: { fill: "rgba(139,92,246,0.15)", stroke: "#8b5cf6", bg: "bg-accent-50", badge: "accent" },
};

interface MapCanvasProps {
  zones: Zone[];
  drawingPoints: { x: number; y: number }[];
  onCanvasClick?: (x: number, y: number) => void;
  mode: "view" | "draw" | "edit";
  editingZoneId?: string | null;
}

function MapCanvas({ zones, drawingPoints, onCanvasClick, mode, editingZoneId }: MapCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  const toCanvas = useCallback((lat: number, lng: number, w: number, h: number) => {
    const minLat = 26.5, maxLat = 28.0, minLng = 88.0, maxLng = 89.5;
    const x = ((lng - minLng) / (maxLng - minLng)) * w;
    const y = h - ((lat - minLat) / (maxLat - minLat)) * h;
    return { x, y };
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let y = 0; y < h; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

    // Zones
    zones.forEach((zone) => {
      try {
        const geo = typeof zone.polygon_geojson === "string"
          ? JSON.parse(zone.polygon_geojson)
          : zone.polygon_geojson;
        const coords = geo?.geometry?.coordinates?.[0];
        if (!coords || coords.length < 3) return;

        const colors = RISK_COLORS[zone.risk_level] || RISK_COLORS.medium;
        const isHovered = hovered === zone.id;
        const isEditing = editingZoneId === zone.id;

        const points = coords.map((c: number[]) => toCanvas(c[1], c[0], w, h));

        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        points.forEach((p: { x: number; y: number }) => ctx.lineTo(p.x, p.y));
        ctx.closePath();

        ctx.fillStyle = isHovered || isEditing ? colors.fill.replace("0.15", "0.3") : colors.fill;
        ctx.fill();
        ctx.strokeStyle = colors.stroke;
        ctx.lineWidth = isEditing ? 3 : isHovered ? 2.5 : 2;
        ctx.stroke();

        // Label
        const cx = points.reduce((s: number, p: { x: number; y: number }) => s + p.x, 0) / points.length;
        const cy = points.reduce((s: number, p: { x: number; y: number }) => s + p.y, 0) / points.length;
        ctx.fillStyle = colors.stroke;
        ctx.font = "bold 11px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(zone.name, cx, cy - 4);
        ctx.font = "9px Inter, sans-serif";
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.fillText(zone.risk_level.toUpperCase(), cx, cy + 10);
      } catch {}
    });

    // Drawing points
    if (drawingPoints.length > 0) {
      ctx.beginPath();
      ctx.moveTo(drawingPoints[0].x, drawingPoints[0].y);
      drawingPoints.forEach((p) => ctx.lineTo(p.x, p.y));
      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);

      drawingPoints.forEach((p, i) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = i === 0 ? "#22c55e" : "#3b82f6";
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      if (drawingPoints.length >= 3) {
        ctx.beginPath();
        ctx.moveTo(drawingPoints[0].x, drawingPoints[0].y);
        drawingPoints.forEach((p) => ctx.lineTo(p.x, p.y));
        ctx.closePath();
        ctx.fillStyle = "rgba(59,130,246,0.15)";
        ctx.fill();
        ctx.strokeStyle = "#3b82f6";
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
  }, [zones, drawingPoints, hovered, editingZoneId, toCanvas]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
      draw();
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [draw]);

  useEffect(() => { draw(); }, [draw]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onCanvasClick || mode === "view") return;
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    onCanvasClick(e.clientX - rect.left, e.clientY - rect.top);
  };

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-surface to-surface-light rounded-xl border border-border overflow-hidden">
      <canvas
        ref={canvasRef}
        className={`w-full h-full ${mode === "draw" ? "cursor-crosshair" : "cursor-default"}`}
        onClick={handleClick}
        onMouseMove={(e) => {
          if (mode !== "view") return;
          const canvas = canvasRef.current!;
          const rect = canvas.getBoundingClientRect();
          const mx = e.clientX - rect.left;
          const my = e.clientY - rect.top;
          const w = canvas.width;
          const h = canvas.height;
          let found: string | null = null;
          for (const zone of zones) {
            try {
              const geo = typeof zone.polygon_geojson === "string" ? JSON.parse(zone.polygon_geojson) : zone.polygon_geojson;
              const coords = geo?.geometry?.coordinates?.[0];
              if (!coords || coords.length < 3) continue;
              const points = coords.map((c: number[]) => toCanvas(c[1], c[0], w, h));
              let inside = false;
              for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
                const xi = points[i].x, yi = points[i].y;
                const xj = points[j].x, yj = points[j].y;
                if ((yi > my) !== (yj > my) && mx < ((xj - xi) * (my - yi)) / (yj - yi) + xi) inside = !inside;
              }
              if (inside) { found = zone.id; break; }
            } catch {}
          }
          setHovered(found);
        }}
      />
      <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-black/40 text-[10px] text-white/60 backdrop-blur-sm">
        Sikkim Region | 26.5°N–28°N, 88°E–89.5°E
      </div>
    </div>
  );
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
  const [drawingPoints, setDrawingPoints] = useState<{ x: number; y: number }[]>([]);
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

  const canvasToGeo = (cx: number, cy: number, canvasW: number, canvasH: number) => {
    const minLat = 26.5, maxLat = 28.0, minLng = 88.0, maxLng = 89.5;
    const lng = minLng + (cx / canvasW) * (maxLng - minLng);
    const lat = maxLat - (cy / canvasH) * (maxLat - minLat);
    return [lng, lat];
  };

  const handleCanvasClick = (cx: number, cy: number) => {
    if (mode !== "draw") return;
    const canvas = document.querySelector("canvas");
    if (!canvas) return;
    const [lng, lat] = canvasToGeo(cx, cy, canvas.width, canvas.height);
    setDrawingPoints((prev) => [...prev, { x: cx, y: cy, lat, lng } as any]);
  };

  const handleCreate = async () => {
    if (drawingPoints.length < 3) return;
    const canvas = document.querySelector("canvas");
    if (!canvas) return;

    const coords = drawingPoints.map((p: any) => {
      const [lng, lat] = canvasToGeo(p.x, p.y, canvas.width, canvas.height);
      return [lng, lat];
    });
    coords.push(coords[0]);

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
    const canvas = document.querySelector("canvas");
    if (!canvas) return;

    let polygon;
    if (drawingPoints.length >= 3) {
      const coords = drawingPoints.map((p: any) => {
        const [lng, lat] = canvasToGeo(p.x, p.y, canvas.width, canvas.height);
        return [lng, lat];
      });
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
              <MapCanvas
                zones={filteredZones}
                drawingPoints={drawingPoints}
                onCanvasClick={handleCanvasClick}
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
