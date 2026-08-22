"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/utils/cn";
import { Navigation } from "lucide-react";

interface MapPlaceholderProps {
  className?: string;
  height?: string;
}

export function MapPlaceholder({ className, height = "min-h-[450px]" }: MapPlaceholderProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    let isCancelled = false;
    let mapInstance: any = null;
    let resizeObserverInstance: ResizeObserver | null = null;

    // Dynamically import Leaflet to avoid Next.js SSR window errors
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

        // Initialize map
        const map = L.map(mapContainerRef.current, {
          zoomControl: false,
          attributionControl: true
        }).setView([27.3314, 88.6138], 9);

        mapInstance = map;

        // Add CartoDB Dark Matter tile layer
        L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 20
        }).addTo(map);

        // Add zoom control at top-right
        L.control.zoom({ position: "topright" }).addTo(map);

        // Add monitored tourist hotspots
        const markerPositions = [
          { lng: 88.6138, lat: 27.3314, title: "Gangtok Command Center", color: "#3b82f6" },
          { lng: 88.5638, lat: 27.4314, title: "High Risk Area Alert", color: "#ef4444" },
          { lng: 88.7138, lat: 27.2314, title: "Safe Tourist Route", color: "#22c55e" },
        ];

        markerPositions.forEach((pos) => {
          // Custom HTML marker icon
          const icon = L.divIcon({
            className: "custom-leaflet-marker",
            html: `<div class="w-4 h-4 rounded-full border-2 border-white shadow-lg flex items-center justify-center" style="background-color: ${pos.color}; box-shadow: 0 0 10px ${pos.color};">
                     <div class="w-1.5 h-1.5 rounded-full bg-white animate-ping"></div>
                   </div>`,
            iconSize: [16, 16],
            iconAnchor: [8, 8],
          });

          L.marker([pos.lat, pos.lng], { icon })
            .addTo(map)
            .bindPopup(`<div style="color: #0f172a; font-weight: 600; font-size: 12px; font-family: system-ui, sans-serif; padding: 2px 4px;">${pos.title}</div>`);
        });

        // Trigger map invalidateSize to ensure correct size rendering on load
        setTimeout(() => {
          if (!isCancelled && map) {
            map.invalidateSize();
          }
        }, 100);

        // Resize observer
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
        setMapError("Failed to initialize Leaflet Map");
      });

    return () => {
      isCancelled = true;
      if (resizeObserverInstance) {
        resizeObserverInstance.disconnect();
      }
      if (mapInstance) {
        mapInstance.remove();
      }
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
    <div
      ref={mapContainerRef}
      className={cn("w-full h-full rounded-xl overflow-hidden shadow-inner", height, className)}
    />
  );
}
