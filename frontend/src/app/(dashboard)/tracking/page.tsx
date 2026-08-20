"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useSocket } from "@/contexts/SocketContext";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  MapPin, Filter, X, Shield, Clock, Navigation, ChevronLeft,
  ChevronRight, AlertTriangle, Phone, Mail, Calendar, CheckCircle,
  Route, Wifi, WifiOff, Layers, Eye, RefreshCw,
} from "lucide-react";
import { cn } from "@/utils/cn";

interface TrackedTourist {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  trip_start: string;
  trip_end: string;
  itinerary: any;
  current_lat: number | null;
  current_lng: number | null;
  last_update: string | null;
  risk_level: string;
  anomaly_score: number;
  is_online: boolean;
}

interface LocationPing {
  id: string;
  tourist_id: string;
  lat: number;
  lng: number;
  source: string;
  timestamp: string;
}

const MAP_BOUNDS = { minLat: 26.5, maxLat: 28.0, minLng: 88.0, maxLng: 89.5 };
const RISK_COLORS: Record<string, string> = {
  low: "#22c55e", medium: "#eab308", high: "#ef4444",
  critical: "#dc2626", unknown: "#94a3b8",
};

function latLngToCanvas(lat: number, lng: number, w: number, h: number) {
  const x = ((lng - MAP_BOUNDS.minLng) / (MAP_BOUNDS.maxLng - MAP_BOUNDS.minLng)) * w;
  const y = h - ((lat - MAP_BOUNDS.minLat) / (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat)) * h;
  return { x, y };
}

function RiskGauge({ riskLevel, score }: { riskLevel: string; score: number }) {
  const colorMap: Record<string, { bar: string; text: string; bg: string }> = {
    low: { bar: "bg-success", text: "text-success", bg: "bg-success-50" },
    medium: { bar: "bg-warning", text: "text-warning", bg: "bg-warning-50" },
    high: { bar: "bg-danger", text: "text-danger", bg: "bg-danger-50" },
    critical: { bar: "bg-danger", text: "text-danger", bg: "bg-danger-50" },
    unknown: { bar: "bg-muted", text: "text-muted", bg: "bg-surface" },
  };
  const c = colorMap[riskLevel] || colorMap.unknown;
  const pct = Math.round(score * 100);
  return (
    <div className={cn("p-3 rounded-xl", c.bg)}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-muted flex items-center gap-1"><Shield className="w-3 h-3" /> Risk</span>
        <Badge variant={riskLevel === "low" ? "success" : riskLevel === "medium" ? "warning" : "danger"} size="sm">{riskLevel}</Badge>
      </div>
      <div className="flex items-end gap-1.5">
        <span className={cn("text-2xl font-bold", c.text)}>{pct}</span>
        <span className="text-[10px] text-muted mb-0.5">/ 100</span>
      </div>
      <div className="mt-2 h-1.5 rounded-full bg-white/60 overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", c.bar)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function TrackingPage() {
  const { connected, socket } = useSocket();
  const { user } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tourists, setTourists] = useState<TrackedTourist[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTourist, setSelectedTourist] = useState<TrackedTourist | null>(null);
  const [selectedPings, setSelectedPings] = useState<LocationPing[]>([]);
  const [hoveredTourist, setHoveredTourist] = useState<string | null>(null);
  const [filterRisk, setFilterRisk] = useState<string>("all");
  const [filterOnline, setFilterOnline] = useState<"all" | "online" | "offline">("all");
  const [livePositions, setLivePositions] = useState<Record<string, { lat: number; lng: number; timestamp: string }>>({});

  const fetchTourists = async () => {
    setLoading(true);
    try {
      const r = await api.get("/tracking/tourists");
      setTourists(r.data);
    } catch {}
    setLoading(false);
  };

  const fetchPings = async (touristId: string) => {
    try {
      const r = await api.get(`/tracking/tourists/${touristId}/pings`, { params: { limit: "50" } });
      setSelectedPings(r.data);
    } catch {
      setSelectedPings([]);
    }
  };

  useEffect(() => { fetchTourists(); }, []);

  useEffect(() => {
    if (!socket) return;
    function onLocationUpdate(data: { tourist_id: string; lat: number; lng: number; timestamp: string }) {
      setLivePositions((prev) => ({ ...prev, [data.tourist_id]: { lat: data.lat, lng: data.lng, timestamp: data.timestamp } }));
      setTourists((prev) =>
        prev.map((t) =>
          t.id === data.tourist_id
            ? { ...t, current_lat: data.lat, current_lng: data.lng, last_update: data.timestamp, is_online: true }
            : t
        )
      );
    }
    socket.on("location:update", onLocationUpdate);
    return () => { socket.off("location:update", onLocationUpdate); };
  }, [socket]);

  const filteredTourists = useMemo(() => {
    return tourists.filter((t) => {
      if (filterRisk !== "all" && t.risk_level !== filterRisk) return false;
      const isOnline = livePositions[t.id] ? true : t.is_online;
      if (filterOnline === "online" && !isOnline) return false;
      if (filterOnline === "offline" && isOnline) return false;
      return true;
    });
  }, [tourists, filterRisk, filterOnline, livePositions]);

  const drawMap = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, "#0f172a");
    grad.addColorStop(1, "#1e293b");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = "rgba(148,163,184,0.06)";
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 50) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let y = 0; y < h; y += 50) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

    ctx.fillStyle = "rgba(148,163,184,0.3)";
    ctx.font = "9px monospace";
    for (let lat = 26.5; lat <= 28.0; lat += 0.5) {
      const { y } = latLngToCanvas(lat, MAP_BOUNDS.minLng, w, h);
      ctx.fillText(`${lat.toFixed(1)}N`, 4, y + 3);
    }
    for (let lng = 88.0; lng <= 89.5; lng += 0.5) {
      const { x } = latLngToCanvas(MAP_BOUNDS.minLat, lng, w, h);
      ctx.fillText(`${lng.toFixed(1)}E`, x - 10, h - 4);
    }

    filteredTourists.forEach((tourist) => {
      const lat = livePositions[tourist.id]?.lat ?? tourist.current_lat;
      const lng = livePositions[tourist.id]?.lng ?? tourist.current_lng;
      if (lat == null || lng == null) return;

      const { x, y } = latLngToCanvas(lat, lng, w, h);
      const safetyColor = RISK_COLORS[tourist.risk_level] || RISK_COLORS.unknown;
      const isSelected = selectedTourist?.id === tourist.id;
      const isHovered = hoveredTourist === tourist.id;
      const hasLive = !!livePositions[tourist.id];

      if (isSelected || isHovered) {
        ctx.beginPath();
        ctx.arc(x, y, isSelected ? 20 : 15, 0, Math.PI * 2);
        ctx.fillStyle = safetyColor;
        ctx.globalAlpha = 0.15;
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      if (hasLive) {
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, Math.PI * 2);
        ctx.strokeStyle = safetyColor;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.4;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      ctx.beginPath();
      ctx.arc(x, y, isSelected ? 7 : 5, 0, Math.PI * 2);
      ctx.fillStyle = safetyColor;
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.stroke();

      if (isSelected || isHovered) {
        const masked = tourist.full_name.split(" ").map((n, i, arr) => i === 0 || i === arr.length - 1 ? n[0] + "\u2022" : "\u2022").join("");
        ctx.fillStyle = "#fff";
        ctx.font = "bold 10px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(masked, x, y - 14);
        ctx.font = "9px monospace";
        ctx.fillStyle = safetyColor;
        ctx.fillText(tourist.risk_level, x, y + 20);
      }
    });

    ctx.fillStyle = "rgba(15,23,42,0.85)";
    ctx.beginPath();
    ctx.roundRect(w - 140, 10, 130, 80, 8);
    ctx.fill();
    ctx.strokeStyle = "rgba(148,163,184,0.2)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = "#94a3b8";
    ctx.font = "bold 9px Inter, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("LEGEND", w - 130, 28);
    [
      { color: "#22c55e", label: "Low Risk" },
      { color: "#eab308", label: "Medium Risk" },
      { color: "#ef4444", label: "High Risk" },
    ].forEach((item, i) => {
      ctx.beginPath();
      ctx.arc(w - 124, 44 + i * 18, 4, 0, Math.PI * 2);
      ctx.fillStyle = item.color;
      ctx.fill();
      ctx.fillStyle = "#cbd5e1";
      ctx.font = "9px Inter, sans-serif";
      ctx.fillText(item.label, w - 114, 48 + i * 18);
    });
  }, [filteredTourists, livePositions, selectedTourist, hoveredTourist]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) { canvas.width = parent.clientWidth; canvas.height = parent.clientHeight; }
      drawMap();
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [drawMap]);

  useEffect(() => { drawMap(); }, [drawMap]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const w = canvas.width;
    const h = canvas.height;
    for (const tourist of filteredTourists) {
      const lat = livePositions[tourist.id]?.lat ?? tourist.current_lat;
      const lng = livePositions[tourist.id]?.lng ?? tourist.current_lng;
      if (lat == null || lng == null) continue;
      const { x, y } = latLngToCanvas(lat, lng, w, h);
      if (Math.sqrt((mx - x) ** 2 + (my - y) ** 2) < 12) {
        const next = selectedTourist?.id === tourist.id ? null : tourist;
        setSelectedTourist(next);
        if (next) fetchPings(next.id);
        return;
      }
    }
    setSelectedTourist(null);
    setSelectedPings([]);
  };

  const handleCanvasHover = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const w = canvas.width;
    const h = canvas.height;
    for (const tourist of filteredTourists) {
      const lat = livePositions[tourist.id]?.lat ?? tourist.current_lat;
      const lng = livePositions[tourist.id]?.lng ?? tourist.current_lng;
      if (lat == null || lng == null) continue;
      const { x, y } = latLngToCanvas(lat, lng, w, h);
      if (Math.sqrt((mx - x) ** 2 + (my - y) ** 2) < 12) {
        setHoveredTourist(tourist.id);
        canvas.style.cursor = "pointer";
        return;
      }
    }
    setHoveredTourist(null);
    canvas.style.cursor = "default";
  };

  const formatTime = (ts: string | null) => {
    if (!ts) return "N/A";
    const diff = Date.now() - new Date(ts).getTime();
    if (diff < 60000) return "just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(ts).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  return (
    <div className="flex h-[calc(100vh-48px)] -m-6 animate-fade-in">
      <div className={cn("flex-shrink-0 border-r border-border bg-white/80 backdrop-blur-xl overflow-y-auto transition-all duration-300", selectedTourist ? "w-96" : "w-80")}>
        {selectedTourist ? (
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => { setSelectedTourist(null); setSelectedPings([]); }} icon={<ChevronLeft className="w-4 h-4" />}>Back</Button>
              <Badge variant={selectedTourist.is_online ? "success" : "default"} size="sm" pulse={selectedTourist.is_online}>
                {selectedTourist.is_online ? "Online" : "Offline"}
              </Badge>
            </div>

            <div>
              <h3 className="text-sm font-bold text-fg">{selectedTourist.full_name}</h3>
              <p className="text-xs font-mono text-muted">{selectedTourist.id}</p>
            </div>

            <RiskGauge riskLevel={selectedTourist.risk_level} score={selectedTourist.anomaly_score} />

            <div className="p-3 rounded-xl bg-bg border border-border space-y-2">
              <h4 className="text-[10px] font-semibold text-muted uppercase">Current Location</h4>
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-fg">
                    {selectedTourist.current_lat?.toFixed(4)}, {selectedTourist.current_lng?.toFixed(4)}
                  </p>
                  <p className="text-xs text-muted">Last ping: {formatTime(selectedTourist.last_update)}</p>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-bg border border-border space-y-2">
              <h4 className="text-[10px] font-semibold text-muted uppercase">Trip</h4>
              <div className="flex items-center gap-3 text-xs text-muted">
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />
                  {new Date(selectedTourist.trip_start).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </span>
                <ChevronRight className="w-3 h-3" />
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />
                  {new Date(selectedTourist.trip_end).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-bg border border-border space-y-1.5">
              <h4 className="text-[10px] font-semibold text-muted uppercase">Contact</h4>
              <div className="flex items-center gap-2 text-xs text-muted"><Phone className="w-3 h-3 shrink-0" />{selectedTourist.phone}</div>
              <div className="flex items-center gap-2 text-xs text-muted"><Mail className="w-3 h-3 shrink-0" />{selectedTourist.email}</div>
            </div>

            {selectedTourist.itinerary && (
              <div className="p-3 rounded-xl bg-bg border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-semibold text-muted uppercase">Planned Route</h4>
                </div>
                <div className="space-y-1.5">
                  {(Array.isArray(selectedTourist.itinerary) ? selectedTourist.itinerary : []).slice(0, 5).map((stop: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 text-[10px] font-bold">{i + 1}</div>
                      <span className="font-medium text-fg">{stop.place || stop.name || JSON.stringify(stop)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedPings.length > 0 && (
              <div className="p-3 rounded-xl bg-bg border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-semibold text-muted uppercase">Movement History</h4>
                  <Badge variant="primary" size="sm" icon={<Navigation className="w-3 h-3" />}>{selectedPings.length} pts</Badge>
                </div>
                <div className="space-y-1">
                  {selectedPings.slice(0, 8).map((ping, i) => (
                    <div key={ping.id} className="flex items-center gap-2 text-xs py-1">
                      <div className={cn("w-2 h-2 rounded-full shrink-0", i === 0 ? "bg-primary animate-pulse" : "bg-muted/30")} />
                      <span className="font-mono text-fg flex-1">{ping.lat.toFixed(4)}, {ping.lng.toFixed(4)}</span>
                      <span className="text-muted shrink-0">{formatTime(ping.timestamp)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-fg flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                Active Tourists
              </h2>
              <div className="flex items-center gap-2">
                <Badge variant="primary" size="sm">{filteredTourists.length}</Badge>
                <Button variant="ghost" size="sm" onClick={fetchTourists} icon={<RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />} />
              </div>
            </div>

            <div className="flex gap-1.5 flex-wrap">
              {["all", "low", "medium", "high", "critical"].map((f) => (
                <button key={f} onClick={() => setFilterRisk(f)}
                  className={cn("px-2 py-1 rounded-lg text-[10px] font-medium transition-all",
                    filterRisk === f ? "bg-primary text-white" : "bg-surface-light/20 text-muted hover:bg-surface-light/30"
                  )}>
                  {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>

            <div className="flex gap-1">
              {(["all", "online", "offline"] as const).map((f) => (
                <button key={f} onClick={() => setFilterOnline(f)}
                  className={cn("px-2 py-0.5 rounded text-[10px]",
                    filterOnline === f ? "bg-primary text-white" : "bg-surface-light/20 text-muted"
                  )}>
                  {f === "all" ? "All" : f === "online" ? "Online" : "Offline"}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-16 bg-surface-light/10 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTourists.map((tourist) => {
                  const isOnline = livePositions[tourist.id] ? true : tourist.is_online;
                  return (
                    <button
                      key={tourist.id}
                      onClick={() => { setSelectedTourist(tourist); fetchPings(tourist.id); }}
                      className="w-full text-left p-3 rounded-xl bg-bg border border-border hover:border-primary/30 hover:shadow-md transition-all group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <div className={cn("w-2.5 h-2.5 rounded-full", isOnline ? "bg-success animate-pulse" : "bg-gray-400")} />
                            <span className="text-xs font-semibold text-fg truncate">{tourist.full_name}</span>
                          </div>
                          <p className="text-[10px] text-muted mt-0.5 ml-4.5 font-mono">{tourist.id.slice(0, 8)}...</p>
                        </div>
                        <Badge variant={tourist.risk_level === "low" ? "success" : tourist.risk_level === "medium" ? "warning" : "danger"} size="sm">
                          {tourist.risk_level}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-2 ml-4 text-[10px] text-muted">
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />
                          {tourist.current_lat?.toFixed(2)}, {tourist.current_lng?.toFixed(2)}
                        </span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatTime(tourist.last_update)}</span>
                      </div>
                    </button>
                  );
                })}
                {filteredTourists.length === 0 && (
                  <div className="text-center py-8 text-sm text-muted">
                    {tourists.length === 0 ? "No tourists registered yet." : "No tourists match filters."}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 relative">
        <canvas ref={canvasRef} className="w-full h-full cursor-crosshair"
          onClick={handleCanvasClick} onMouseMove={handleCanvasHover}
          onMouseLeave={() => setHoveredTourist(null)} />

        <div className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/40 backdrop-blur-sm border border-white/10">
          {connected ? (
            <><Wifi className="w-3.5 h-3.5 text-success" /><span className="text-[10px] font-medium text-success">Live</span></>
          ) : (
            <><WifiOff className="w-3.5 h-3.5 text-warning" /><span className="text-[10px] font-medium text-warning">Offline</span></>
          )}
        </div>

        <div className="absolute top-3 right-3 px-3 py-1.5 rounded-xl bg-black/40 backdrop-blur-sm border border-white/10">
          <span className="text-[10px] font-medium text-white/70">
            {filteredTourists.length} tourist{filteredTourists.length !== 1 ? "s" : ""} visible
          </span>
        </div>
      </div>
    </div>
  );
}
