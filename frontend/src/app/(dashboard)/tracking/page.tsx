"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useSocket } from "@/contexts/SocketContext";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  MapPin, Clock, Navigation, ChevronLeft,
  ChevronRight, Phone, Mail, Calendar, Wifi, WifiOff, RefreshCw, Shield, AlertTriangle
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
  block_id: string | null;
  digital_id_status?: string;
  window_status?: "active" | "upcoming" | "expired";
  is_in_trip_window?: boolean;
  current_lat: number | null;
  current_lng: number | null;
  last_update: string | null;
  risk_level: string;
  anomaly_score: number;
  is_online: boolean;
  geofences?: Array<{
    id: string;
    name: string;
    risk_level: string;
    description: string;
    polygon_geojson: any;
  }>;
}

interface LocationPing {
  id: string;
  tourist_id: string;
  lat: number;
  lng: number;
  source: string;
  timestamp: string;
}

const RISK_COLORS: Record<string, string> = {
  low: "#22c55e",
  medium: "#eab308",
  high: "#ef4444",
  critical: "#dc2626",
  unknown: "#94a3b8",
};

function formatCoord(val: any, decimals = 2): string {
  if (val === null || val === undefined) return "N/A";
  const num = typeof val === "number" ? val : parseFloat(val);
  return isNaN(num) ? "N/A" : num.toFixed(decimals);
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
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any | null>(null);
  const markersRef = useRef<Record<string, any>>({});
  const routeLayerRef = useRef<any | null>(null);
  const geofenceLayerRef = useRef<any | null>(null);
  const hasCenteredRef = useRef(false);
  
  const [tourists, setTourists] = useState<TrackedTourist[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTourist, setSelectedTourist] = useState<TrackedTourist | null>(null);
  const [selectedPings, setSelectedPings] = useState<LocationPing[]>([]);
  const [filterWindow, setFilterWindow] = useState<"all" | "active" | "upcoming" | "expired">("all");
  const [filterRisk, setFilterRisk] = useState<string>("all");
  const [filterOnline, setFilterOnline] = useState<"all" | "online" | "offline">("all");
  const [livePositions, setLivePositions] = useState<Record<string, { lat: number; lng: number; timestamp: string }>>({});
  const [isSimulating, setIsSimulating] = useState(false);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const simIntervalRef = useRef<any>(null);

  // Stop simulation on unmount
  useEffect(() => {
    return () => {
      if (simIntervalRef.current) {
        clearInterval(simIntervalRef.current);
      }
    };
  }, []);

  // Stop simulation if selected tourist changes
  useEffect(() => {
    if (simIntervalRef.current) {
      clearInterval(simIntervalRef.current);
      simIntervalRef.current = null;
    }
    setIsSimulating(false);
  }, [selectedTourist]);

  const toggleSimulation = async () => {
    if (!selectedTourist) return;

    if (isSimulating) {
      if (simIntervalRef.current) {
        clearInterval(simIntervalRef.current);
        simIntervalRef.current = null;
      }
      setIsSimulating(false);
      return;
    }

    setIsSimulating(true);
    
    // Initial coords: center around itinerary stop, live position, current lat or default Gangtok
    const firstStop = Array.isArray(selectedTourist.itinerary) && selectedTourist.itinerary[0];
    let currentLat = parseFloat(
      String(livePositions[selectedTourist.id]?.lat ?? selectedTourist.current_lat ?? (firstStop?.lat ?? 27.3314))
    );
    let currentLng = parseFloat(
      String(livePositions[selectedTourist.id]?.lng ?? selectedTourist.current_lng ?? (firstStop?.lng ?? 88.6138))
    );

    let stepCount = 0;
    
    const sendSimulatedPing = async () => {
      try {
        stepCount++;
        
        // Add a slight path trend (walking/moving) plus small noise
        const latOffset = 0.0015 * Math.sin(stepCount / 2.5) + (Math.random() - 0.5) * 0.0008;
        const lngOffset = 0.0015 * Math.cos(stepCount / 2.5) + (Math.random() - 0.5) * 0.0008;
        
        currentLat = parseFloat((currentLat + latOffset).toFixed(8));
        currentLng = parseFloat((currentLng + lngOffset).toFixed(8));

        // 1. Post simulated ping
        await api.post("/location-ping", {
          tourist_id: selectedTourist.id,
          lat: Number(currentLat),
          lng: Number(currentLng)
        }).catch((err) => {
          console.warn("Location ping fallback:", err?.response?.data || err?.message);
        });

        // 2. Trigger AI analysis for the tourist to update safety score/digital twin reasons (once 3+ pings exist)
        await api.post(`/ai/analyze/${selectedTourist.id}`).catch(() => {});

        // 3. Re-fetch pings list in the sidebar to keep history in sync
        fetchPings(selectedTourist.id);
        
        // 4. Update the current list of tourists to refresh UI immediately
        setTourists((prev) =>
          prev.map((t) =>
            t.id === selectedTourist.id
              ? { ...t, current_lat: currentLat, current_lng: currentLng, last_update: new Date().toISOString(), is_online: true }
              : t
          )
        );
      } catch (err) {
        console.error("Simulation error:", err);
      }
    };

    // Send first ping immediately
    await sendSimulatedPing();

    // Start interval every 4 seconds
    simIntervalRef.current = setInterval(sendSimulatedPing, 4000);
  };

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

  useEffect(() => {
    fetchTourists();
  }, []);

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
    return () => {
      socket.off("location:update", onLocationUpdate);
    };
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

  const activeSelectedTourist = useMemo(() => {
    if (!selectedTourist) return null;
    return tourists.find((t) => t.id === selectedTourist.id) || selectedTourist;
  }, [tourists, selectedTourist]);

  // 1. Initialize Leaflet Map
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
        }).setView([27.3314, 88.6138], 9.5);

        mapInstance = map;

        L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 20
        }).addTo(map);

        L.control.zoom({ position: "topright" }).addTo(map);

        const routeGroup = L.featureGroup().addTo(map);
        routeLayerRef.current = routeGroup;

        const geofenceGroup = L.featureGroup().addTo(map);
        geofenceLayerRef.current = geofenceGroup;

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

  // 2. Synchronize markers for filteredTourists and livePositions
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    import("leaflet").then((L) => {
      const currentTouristsMap: Record<string, boolean> = {};

      filteredTourists.forEach((tourist) => {
        const lat = parseFloat(String(livePositions[tourist.id]?.lat ?? tourist.current_lat));
        const lng = parseFloat(String(livePositions[tourist.id]?.lng ?? tourist.current_lng));
        if (!isFinite(lat) || !isFinite(lng)) return;

        currentTouristsMap[tourist.id] = true;

        const color = RISK_COLORS[tourist.risk_level] || RISK_COLORS.unknown;
        const isSelected = selectedTourist?.id === tourist.id;

        let marker = markersRef.current[tourist.id];

        const iconHtml = `
          <div class="w-5 h-5 rounded-full border-2 border-white shadow-lg flex items-center justify-center transition-transform" style="background-color: ${color}; box-shadow: 0 0 10px ${color}; transform: ${isSelected ? "scale(1.3)" : "scale(1)"};">
            <div class="w-2 h-2 rounded-full bg-white ${tourist.is_online ? "animate-ping" : ""}"></div>
          </div>
        `;
        const icon = L.divIcon({
          className: `custom-marker-icon-${tourist.id}`,
          html: iconHtml,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        });

        if (!marker) {
          const popup = L.popup({ offset: [0, -10] }).setContent(`
            <div style="color: #0f172a; padding: 4px; font-family: sans-serif;">
              <h4 style="font-weight: 700; font-size: 13px; margin: 0 0 4px 0;">${tourist.full_name}</h4>
              <p style="font-size: 11px; margin: 0 0 2px 0;">Risk: <span style="font-weight: 600; color: ${color};">${tourist.risk_level.toUpperCase()}</span></p>
              <p style="font-size: 10px; color: #64748b; margin: 0;">Phone: ${tourist.phone}</p>
              ${tourist.block_id ? `<p style="font-size: 9px; font-family: monospace; color: #0284c7; margin-top: 4px;">Hash: ${tourist.block_id.slice(0, 8)}...</p>` : ''}
            </div>
          `);

          marker = L.marker([lat, lng], { icon })
            .addTo(map)
            .bindPopup(popup);

          marker.on("click", () => {
            selectTouristWithDetails(tourist);
          });

          markersRef.current[tourist.id] = marker;
        } else {
          marker.setLatLng([lat, lng]);
          marker.setIcon(icon);
        }
      });

      Object.keys(markersRef.current).forEach((id) => {
        if (!currentTouristsMap[id]) {
          map.removeLayer(markersRef.current[id]);
          delete markersRef.current[id];
        }
      });
    });
  }, [filteredTourists, livePositions, selectedTourist]);

  const selectTouristWithDetails = async (tourist: TrackedTourist) => {
    setSelectedTourist(tourist);
    fetchPings(tourist.id);
    try {
      const res = await api.get(`/tracking/tourists/${tourist.id}`);
      setSelectedTourist((prev) => prev?.id === tourist.id ? { ...prev, ...res.data } : prev);
    } catch {}
  };

  // 3. Center map on selection (uses live pos -> current_lat -> first itinerary stop)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedTourist) return;

    const firstStop = Array.isArray(selectedTourist.itinerary) && selectedTourist.itinerary[0];
    const lat = livePositions[selectedTourist.id]?.lat ?? selectedTourist.current_lat ?? (firstStop?.lat ? Number(firstStop.lat) : null);
    const lng = livePositions[selectedTourist.id]?.lng ?? selectedTourist.current_lng ?? (firstStop?.lng ? Number(firstStop.lng) : null);

    if (lat != null && lng != null) {
      map.flyTo([lat, lng], 13, {
        animate: true,
        duration: 1.5,
      });

      const marker = markersRef.current[selectedTourist.id];
      if (marker) {
        setTimeout(() => {
          if (!marker.isPopupOpen()) {
            marker.openPopup();
          }
        }, 800);
      }
    }
  }, [selectedTourist]);

  // 4. Draw selected tourist's movement trail and Auto-Generated Geofences
  useEffect(() => {
    const map = mapRef.current;
    const routeGroup = routeLayerRef.current;
    const geofenceGroup = geofenceLayerRef.current;
    if (!map || !routeGroup || !geofenceGroup) return;

    routeGroup.clearLayers();
    geofenceGroup.clearLayers();

    if (!selectedTourist) return;

    import("leaflet").then((L) => {
      // 4A. Draw Movement Pings Trail
      if (selectedPings.length > 0) {
        const sortedPings = [...selectedPings].sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        const latlngs = sortedPings.map((p) => [p.lat, p.lng]);

        L.polyline(latlngs as any, {
          color: "#60a5fa",
          weight: 8,
          opacity: 0.3,
        }).addTo(routeGroup);

        L.polyline(latlngs as any, {
          color: "#3b82f6",
          weight: 4,
          opacity: 0.8,
        }).addTo(routeGroup);
      }

      // 4B. Draw Auto-Generated Safe Geofences
      if (selectedTourist.geofences && selectedTourist.geofences.length > 0) {
        selectedTourist.geofences.forEach((geo) => {
          try {
            const rawGeo = typeof geo.polygon_geojson === "string" ? JSON.parse(geo.polygon_geojson) : geo.polygon_geojson;
            if (rawGeo && rawGeo.coordinates && rawGeo.coordinates[0]) {
              const polyCoords = rawGeo.coordinates[0].map((coord: number[]) => [coord[1], coord[0]]);
              L.polygon(polyCoords, {
                color: "#10b981",
                fillColor: "#10b981",
                fillOpacity: 0.15,
                weight: 2,
                dashArray: "5, 5",
              })
                .bindPopup(`<b>${geo.name}</b><br/><span style="font-size: 11px; color: #64748b;">${geo.description || "Safe Itinerary Geofence"}</span>`)
                .addTo(geofenceGroup);
            }
          } catch (e) {
            console.warn("Geofence parse error:", e);
          }
        });
      } else if (Array.isArray(selectedTourist.itinerary)) {
        // Fallback: draw circular safe zones around itinerary stops
        selectedTourist.itinerary.forEach((stop: any) => {
          if (stop.lat && stop.lng) {
            L.circle([stop.lat, stop.lng], {
              radius: 1200,
              color: "#10b981",
              fillColor: "#10b981",
              fillOpacity: 0.15,
              weight: 2,
              dashArray: "5, 5",
            })
              .bindPopup(`<b>Safe Zone: ${stop.place || "Itinerary"}</b><br/><span style="font-size: 11px; color: #64748b;">Planned for ${stop.planned_date || "Trip"}</span>`)
              .addTo(geofenceGroup);
          }
        });
      }
    });
  }, [selectedPings, selectedTourist]);

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
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
        {activeSelectedTourist ? (
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => { setSelectedTourist(null); setSelectedPings([]); }} icon={<ChevronLeft className="w-4 h-4" />}>Back</Button>
              <Badge variant={activeSelectedTourist.is_online ? "success" : "default"} size="sm" pulse={activeSelectedTourist.is_online}>
                {activeSelectedTourist.is_online ? "Online" : "Offline"}
              </Badge>
              {activeSelectedTourist.window_status === "active" && (
                <Badge variant="success" size="sm">In Window</Badge>
              )}
            </div>

            <div>
              <h3 className="text-sm font-bold text-fg">{activeSelectedTourist.full_name}</h3>
              <p className="text-xs font-mono text-muted">{activeSelectedTourist.id}</p>
            </div>

            {/* Blockchain Hash ID Banner */}
            {activeSelectedTourist.block_id && (
              <div className="p-2.5 rounded-xl bg-primary/5 border border-primary/20 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wider flex items-center gap-1">
                    <Shield className="w-3 h-3" /> Blockchain Hash ID
                  </span>
                  <button
                    onClick={() => handleCopyHash(activeSelectedTourist.block_id!)}
                    className="text-[10px] font-medium text-primary hover:underline"
                  >
                    {copiedHash === activeSelectedTourist.block_id ? "Copied!" : "Copy"}
                  </button>
                </div>
                <p className="text-[11px] font-mono text-fg break-all select-all bg-white px-2 py-1 rounded border border-primary/10">
                  {activeSelectedTourist.block_id}
                </p>
              </div>
            )}

            {/* Selected Trip Interval */}
            <div className="p-2.5 rounded-xl bg-bg border border-border text-xs space-y-1">
              <span className="text-[10px] font-semibold text-muted uppercase flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Monitoring Interval
              </span>
              <p className="font-medium text-fg">
                {new Date(activeSelectedTourist.trip_start).toLocaleDateString()} &rarr; {new Date(activeSelectedTourist.trip_end).toLocaleDateString()}
              </p>
              <p className="text-[10px] text-muted">
                {activeSelectedTourist.window_status === "active"
                  ? "🟢 Currently within active tracking window"
                  : activeSelectedTourist.window_status === "upcoming"
                  ? "🟡 Scheduled upcoming trip"
                  : "⚪ Trip completed / monitoring ended"}
              </p>
            </div>

            <div className="p-3 rounded-xl border border-primary/20 bg-primary/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Device Simulator</span>
                {isSimulating && (
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted leading-relaxed">
                {isSimulating 
                  ? "Sending live GPS coordinates & triggering AI Digital Twin risk calculations every 4s..."
                  : "Simulate live GPS pings to test real-time mapping, AI digital twin scoring, and spatial crowd checks."}
              </p>
              <Button
                variant={isSimulating ? "danger" : "primary"}
                size="sm"
                onClick={toggleSimulation}
                className="w-full justify-center"
                icon={<Navigation className={cn("w-3.5 h-3.5", isSimulating && "animate-pulse")} />}
              >
                {isSimulating ? "Stop Simulation" : "Start Live Simulation"}
              </Button>
            </div>

            <RiskGauge riskLevel={activeSelectedTourist.risk_level} score={activeSelectedTourist.anomaly_score} />

            <div className="p-3 rounded-xl bg-bg border border-border space-y-2">
              <h4 className="text-[10px] font-semibold text-muted uppercase">Current Location</h4>
              {activeSelectedTourist.current_lat != null && activeSelectedTourist.current_lng != null ? (
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-mono font-medium text-fg">
                      {formatCoord(activeSelectedTourist.current_lat, 4)}, {formatCoord(activeSelectedTourist.current_lng, 4)}
                    </p>
                    <p className="text-muted text-[10px] mt-0.5">Last update: {formatTime(activeSelectedTourist.last_update)}</p>
                  </div>
                </div>
              ) : (
                <div className="text-xs space-y-1 bg-surface-light/10 p-2.5 rounded-lg border border-border">
                  <div className="flex items-center gap-1.5 text-warning-dark font-medium">
                    <Clock className="w-3.5 h-3.5 text-warning" />
                    <span>GPS Inactive (Trip Starts {new Date(activeSelectedTourist.trip_start).toLocaleDateString()})</span>
                  </div>
                  <p className="text-[10px] text-muted">
                    Privacy protection active. Real-time GPS coordinates will begin streaming once the trip interval arrives.
                  </p>
                </div>
              )}
            </div>

            {/* Safe Geofences & Itinerary */}
            {activeSelectedTourist.itinerary && (
              <div className="p-3 rounded-xl bg-bg border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-semibold text-muted uppercase">Safe Geofence Corridor</h4>
                  <Badge variant="success" size="sm">Geofenced</Badge>
                </div>
                <div className="space-y-1.5 text-xs">
                  {(Array.isArray(activeSelectedTourist.itinerary) ? activeSelectedTourist.itinerary : []).map((stop: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 p-1.5 rounded-lg bg-surface-light/10">
                      <div className="w-5 h-5 rounded-full bg-success/10 text-success flex items-center justify-center shrink-0 text-[10px] font-bold">{i + 1}</div>
                      <span className="font-medium text-fg truncate">{stop.place || stop.name || JSON.stringify(stop)}</span>
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
                      <span className="font-mono text-fg flex-1">{formatCoord(ping.lat, 4)}, {formatCoord(ping.lng, 4)}</span>
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
                Tracked Tourists
              </h2>
              <div className="flex items-center gap-2">
                <Badge variant="primary" size="sm">{filteredTourists.length}</Badge>
                <Button variant="ghost" size="sm" onClick={fetchTourists} icon={<RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />} />
              </div>
            </div>

            {/* Trip Interval Window Filter Tabs */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted uppercase">Trip Window</span>
              <div className="grid grid-cols-2 gap-1">
                {(["all", "active", "upcoming", "expired"] as const).map((w) => (
                  <button
                    key={w}
                    onClick={() => setFilterWindow(w)}
                    className={cn(
                      "px-2 py-1 rounded-lg text-[10px] font-medium transition-all text-center",
                      filterWindow === w
                        ? "bg-primary text-white shadow-sm"
                        : "bg-surface-light/20 text-muted hover:bg-surface-light/30"
                    )}
                  >
                    {w === "all" ? "All Trips" : w === "active" ? "🟢 In Window" : w === "upcoming" ? "🟡 Upcoming" : "⚪ Completed"}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-1.5 flex-wrap">
              {["all", "low", "medium", "high", "critical"].map((f) => (
                <button key={f} onClick={() => setFilterRisk(f)}
                  className={cn("px-2 py-1 rounded-lg text-[10px] font-medium transition-all",
                    filterRisk === f ? "bg-primary text-white" : "bg-surface-light/20 text-muted hover:bg-surface-light/30"
                  )}>
                  {f === "all" ? "All Risk" : f.charAt(0).toUpperCase() + f.slice(1)}
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
                  const isWindowActive = tourist.window_status === "active";
                  return (
                    <button
                      key={tourist.id}
                      onClick={() => selectTouristWithDetails(tourist)}
                      className="w-full text-left p-3 rounded-xl bg-bg border border-border hover:border-primary/30 hover:shadow-md transition-all group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <div className={cn("w-2.5 h-2.5 rounded-full", isOnline ? "bg-success animate-pulse" : "bg-gray-400")} />
                            <span className="text-xs font-semibold text-fg truncate">{tourist.full_name}</span>
                          </div>
                          {tourist.block_id && (
                            <p className="text-[10px] text-primary/80 mt-0.5 ml-4.5 font-mono">
                              #{tourist.block_id.slice(0, 8)}...
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge variant={tourist.risk_level === "low" ? "success" : tourist.risk_level === "medium" ? "warning" : "danger"} size="sm">
                            {tourist.risk_level}
                          </Badge>
                          {isWindowActive ? (
                            <span className="text-[9px] font-bold text-success bg-success/10 px-1.5 py-0.5 rounded">In Window</span>
                          ) : tourist.window_status === "upcoming" ? (
                            <span className="text-[9px] text-warning bg-warning/10 px-1.5 py-0.5 rounded">Upcoming</span>
                          ) : (
                            <span className="text-[9px] text-muted bg-surface-light/20 px-1.5 py-0.5 rounded">Completed</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-2 ml-4 text-[10px] text-muted">
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />
                          {formatCoord(tourist.current_lat, 2)}, {formatCoord(tourist.current_lng, 2)}
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
        <div ref={mapContainerRef} className="w-full h-full shadow-inner" />

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
