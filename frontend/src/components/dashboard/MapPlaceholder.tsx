"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/utils/cn";
import { Navigation, AlertTriangle, Shield } from "lucide-react";
import api from "@/lib/api";

interface CriticalTourist {
  id: string;
  full_name: string;
  current_lat: number | null;
  current_lng: number | null;
  risk_level: string;
  phone?: string;
  block_id?: string;
  window_status?: string;
}

interface ActiveZone {
  id: string;
  name: string;
  risk_level: string;
  polygon_geojson?: any;
}

interface MapPlaceholderProps {
  className?: string;
  height?: string;
}

const RISK_COLORS: Record<string, string> = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#eab308",
  low: "#22c55e",
  unknown: "#6b7280",
};

export function MapPlaceholder({ className, height = "min-h-[450px]" }: MapPlaceholderProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [criticalCount, setCriticalCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    let isCancelled = false;
    let mapInstance: any = null;
    let resizeObserverInstance: ResizeObserver | null = null;

    Promise.all([import("leaflet"), import("leaflet/dist/leaflet.css")])
      .then(async ([L]) => {
        if (isCancelled || !mapContainerRef.current) return;
        if (mapContainerRef.current.classList.contains("leaflet-container")) return;

        // Initialize map centered on Sikkim/Gangtok region
        const map = L.map(mapContainerRef.current, {
          zoomControl: false,
          attributionControl: true,
        }).setView([27.3314, 88.6138], 9);

        mapInstance = map;
        mapRef.current = map;

        // Dark tile layer
        L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 20,
        }).addTo(map);

        L.control.zoom({ position: "topright" }).addTo(map);

        // Fetch active tourists and zones
        try {
          const [touristRes, zoneRes] = await Promise.allSettled([
            api.get("/tracking/tourists"),
            api.get("/zones", { params: { active: "true" } }),
          ]);

          let critCount = 0;
          let actCount = 0;

          // Draw active zones (geofence corridors)
          if (zoneRes.status === "fulfilled") {
            const zones: ActiveZone[] = zoneRes.value.data || [];
            zones.forEach((zone) => {
              if (!zone.polygon_geojson) return;
              try {
                const color = zone.risk_level === "high" || zone.risk_level === "restricted"
                  ? "#ef4444"
                  : zone.risk_level === "medium"
                  ? "#eab308"
                  : "#22c55e";

                L.geoJSON(zone.polygon_geojson, {
                  style: {
                    color,
                    fillColor: color,
                    fillOpacity: zone.risk_level === "high" ? 0.15 : 0.08,
                    weight: zone.risk_level === "high" ? 2 : 1,
                    dashArray: zone.risk_level === "low" ? "4 4" : undefined,
                  },
                }).addTo(map).bindPopup(`
                  <div style="color:#0f172a;font-family:sans-serif;padding:4px 6px">
                    <p style="font-weight:700;font-size:12px;margin:0 0 2px">${zone.name}</p>
                    <p style="font-size:10px;color:#64748b;margin:0">Risk: <b style="color:${color}">${zone.risk_level.toUpperCase()}</b></p>
                  </div>
                `);
              } catch {}
            });
          }

          // Draw tourist markers — only those in active trip window with GPS
          if (touristRes.status === "fulfilled") {
            const tourists: CriticalTourist[] = touristRes.value.data || [];
            const activeTourists = tourists.filter(
              (t) => t.window_status === "active" && t.current_lat != null && t.current_lng != null
            );
            actCount = activeTourists.length;

            activeTourists.forEach((tourist) => {
              const lat = parseFloat(String(tourist.current_lat));
              const lng = parseFloat(String(tourist.current_lng));
              if (!isFinite(lat) || !isFinite(lng)) return;

              const isHighRisk = tourist.risk_level === "high" || tourist.risk_level === "critical";
              if (isHighRisk) critCount++;

              const color = RISK_COLORS[tourist.risk_level] || RISK_COLORS.unknown;
              const pulseClass = isHighRisk ? "animate-ping" : "";
              const size = isHighRisk ? 20 : 14;

              const icon = L.divIcon({
                className: "",
                html: `
                  <div style="position:relative;width:${size}px;height:${size}px">
                    ${isHighRisk ? `<div style="position:absolute;inset:0;border-radius:50%;background:${color};opacity:0.4;animation:ping 1s cubic-bezier(0,0,0.2,1) infinite"></div>` : ""}
                    <div style="position:absolute;inset:0;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 0 8px ${color}"></div>
                  </div>
                `,
                iconSize: [size, size],
                iconAnchor: [size / 2, size / 2],
              });

              L.marker([lat, lng], { icon })
                .addTo(map)
                .bindPopup(`
                  <div style="color:#0f172a;font-family:sans-serif;padding:4px 6px;min-width:150px">
                    ${isHighRisk ? `<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:4px;padding:2px 6px;font-size:10px;font-weight:700;color:#ef4444;margin-bottom:4px">⚠ HIGH RISK</div>` : ""}
                    <p style="font-weight:700;font-size:12px;margin:0 0 2px">${tourist.full_name}</p>
                    <p style="font-size:10px;color:#64748b;margin:0">📞 ${tourist.phone || "—"}</p>
                    ${tourist.block_id ? `<p style="font-size:9px;font-family:monospace;color:#0284c7;margin-top:3px">Hash: ${tourist.block_id.slice(0, 12)}...</p>` : ""}
                  </div>
                `);
            });

            setCriticalCount(critCount);
            setActiveCount(actCount);
          }
        } catch (err) {
          console.warn("Map data load error:", err);
        }

        setTimeout(() => { if (!isCancelled && map) map.invalidateSize(); }, 100);

        const resizeObserver = new ResizeObserver(() => {
          if (!isCancelled && map) map.invalidateSize();
        });
        if (mapContainerRef.current.parentElement) {
          resizeObserver.observe(mapContainerRef.current.parentElement);
        }
        resizeObserverInstance = resizeObserver;
      })
      .catch((err) => {
        console.error("Leaflet loading error:", err);
        setMapError("Failed to initialize map");
      });

    return () => {
      isCancelled = true;
      if (resizeObserverInstance) resizeObserverInstance.disconnect();
      if (mapInstance) { mapInstance.remove(); mapRef.current = null; }
    };
  }, []);

  if (mapError) {
    return (
      <div className={cn("relative bg-slate-950 rounded-xl border border-red-500/20 flex items-center justify-center p-6", height, className)}>
        <div className="text-center">
          <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Navigation className="w-6 h-6 text-red-500" />
          </div>
          <p className="text-sm font-semibold text-slate-200">Map Error</p>
          <p className="text-xs text-red-400/80 mt-1 max-w-xs mx-auto">{mapError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative w-full h-full", height, className)}>
      {/* Header overlay */}
      <div className="absolute top-0 left-0 right-0 z-[500] flex items-center justify-between px-4 py-2.5 bg-gradient-to-b from-slate-950/90 to-transparent pointer-events-none">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          <span className="text-xs font-bold text-white tracking-wide">CRITICAL ALERT MAP</span>
          {criticalCount > 0 && (
            <span className="flex items-center gap-1 bg-red-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
              <AlertTriangle className="w-2.5 h-2.5" />
              {criticalCount} AT RISK
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-[10px] text-white/70">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span> High Risk
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span> Safe Zone
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block"></span> Medium Risk
          </span>
        </div>
      </div>

      {/* Map container */}
      <div
        ref={mapContainerRef}
        className="w-full h-full rounded-xl overflow-hidden shadow-inner"
        style={{ minHeight: "inherit" }}
      />

      {/* Footer overlay */}
      <div className="absolute bottom-0 left-0 right-0 z-[500] px-4 py-2 bg-gradient-to-t from-slate-950/80 to-transparent pointer-events-none">
        <p className="text-[10px] text-white/50 text-center">
          {activeCount > 0
            ? `${activeCount} tourist${activeCount > 1 ? "s" : ""} actively monitored within trip window · Safe corridor geofences shown`
            : "Monitoring active — tourists appear when GPS tracking begins within their trip window"}
        </p>
      </div>
    </div>
  );
}
