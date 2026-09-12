"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/utils/cn";
import {
  Navigation,
  Crosshair,
  Trees,
  MapPin,
  Search,
  Layers,
  Globe,
  Mountain,
  Map as MapIcon,
  Check,
  AlertTriangle,
} from "lucide-react";

interface MapPlaceholderProps {
  className?: string;
  height?: string;
  onLocationFound?: (location: { lat: number; lng: number; accuracy: number }) => void;
  focusLocation?: { lat: number; lng: number; title?: string; subtitle?: string } | null;
}

// Tile layers definitions for Street, Satellite, and Terrain views
const TILE_SERVERS = {
  streets: {
    name: "Street Map",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
  satellite: {
    name: "Satellite View",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: '&copy; <a href="https://www.esri.com/">Esri</a> &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    maxZoom: 18,
  },
  terrain: {
    name: "Terrain Topo",
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, SRTM | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
    maxZoom: 17,
  },
};

// Key West Bengal Forest Reserves & Restricted Areas for Map Overlay
const WB_FOREST_ZONES = [
  {
    name: "Sundarbans Tiger Reserve Core",
    lat: 21.9497,
    lng: 88.8834,
    radius: 35000,
    risk: "restricted",
    desc: "UNESCO World Heritage Core Biosphere Zone. Restricted Royal Bengal Tiger habitat.",
    color: "#dc2626",
  },
  {
    name: "Buxa Tiger Reserve & Frontier Forest",
    lat: 26.7455,
    lng: 89.5847,
    radius: 25000,
    risk: "restricted",
    desc: "Indo-Bhutan frontier reserve forest. Wild elephant & tiger habitat.",
    color: "#dc2626",
  },
  {
    name: "Jaldapara Rhino Sanctuary",
    lat: 26.6961,
    lng: 89.2678,
    radius: 18000,
    risk: "restricted",
    desc: "Protected One-Horned Rhinoceros & wildlife sanctuary.",
    color: "#ea580c",
  },
  {
    name: "Neora Valley Mountain National Park",
    lat: 27.0425,
    lng: 88.6948,
    radius: 16000,
    risk: "restricted",
    desc: "Kalimpong high-altitude jungle & red panda habitat.",
    color: "#dc2626",
  },
  {
    name: "Singalila National Park & Border Trail",
    lat: 27.1408,
    lng: 88.0772,
    radius: 14000,
    risk: "high",
    desc: "Sandakphu high ridge & Indo-Nepal border forest area.",
    color: "#ca8a04",
  },
  {
    name: "Gorumara National Park",
    lat: 26.7426,
    lng: 88.7961,
    radius: 15000,
    risk: "restricted",
    desc: "Dooars riverine forest sanctuary.",
    color: "#ea580c",
  },
  {
    name: "Mahananda Wildlife Sanctuary",
    lat: 26.8524,
    lng: 88.4239,
    radius: 12000,
    risk: "high",
    desc: "Siliguri foothill elephant movement corridor.",
    color: "#ca8a04",
  },
];

export function MapPlaceholder({ className, height = "min-h-[480px]", onLocationFound, focusLocation }: MapPlaceholderProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const userAccuracyCircleRef = useRef<any>(null);
  const searchMarkerRef = useRef<any>(null);

  const [mapError, setMapError] = useState<string | null>(null);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [mapStyle, setMapStyle] = useState<"streets" | "satellite" | "terrain">("streets");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Smoothly pan & focus on emergency alert location
  useEffect(() => {
    if (!focusLocation || !mapInstanceRef.current || !(window as any).L) return;
    const L = (window as any).L;
    const map = mapInstanceRef.current;
    const { lat, lng, title, subtitle } = focusLocation;

    map.flyTo([lat, lng], 16, { animate: true, duration: 1.2 });

    if (searchMarkerRef.current) map.removeLayer(searchMarkerRef.current);

    const alertIcon = L.divIcon({
      className: "alert-focus-marker",
      html: `<div class="relative flex items-center justify-center">
               <div class="w-14 h-14 rounded-full bg-red-500/40 border-2 border-red-500 animate-ping absolute"></div>
               <div class="w-9 h-9 rounded-full bg-red-600 border-2 border-white shadow-2xl flex items-center justify-center text-white text-base font-bold animate-bounce">
                 🚨
               </div>
             </div>`,
      iconSize: [56, 56],
      iconAnchor: [28, 28],
    });

    searchMarkerRef.current = L.marker([lat, lng], { icon: alertIcon })
      .addTo(map)
      .bindPopup(
        `<div style="font-family: system-ui, sans-serif; padding: 6px; min-width: 190px;">
          <div style="font-weight: 800; color: #dc2626; font-size: 13px; display: flex; align-items: center; gap: 4px;">
            🚨 ${title || "EMERGENCY ALERT"}
          </div>
          <div style="font-size: 12px; color: #0f172a; margin-top: 4px; font-weight: 700;">
            ${subtitle || "Live Hardware SOS Position"}
          </div>
          <div style="font-size: 10px; color: #475569; margin-top: 3px; font-family: monospace;">
            Lat: ${lat.toFixed(4)}° | Lng: ${lng.toFixed(4)}°
          </div>
          <div style="margin-top: 6px; font-size: 10px; background: #fef2f2; color: #b91c1c; padding: 3px 6px; border-radius: 6px; font-weight: 600; text-align: center;">
            CRITICAL SOS DISPATCH
          </div>
        </div>`
      )
      .openPopup();
  }, [focusLocation]);

  // Switch Tile Layer between Street, Satellite, and Terrain
  const changeTileServer = (styleKey: "streets" | "satellite" | "terrain") => {
    setMapStyle(styleKey);
    if (!mapInstanceRef.current || !(window as any).L) return;
    const L = (window as any).L;
    const cfg = TILE_SERVERS[styleKey];

    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }
    tileLayerRef.current = L.tileLayer(cfg.url, {
      attribution: cfg.attribution,
      maxZoom: cfg.maxZoom,
    }).addTo(mapInstanceRef.current);
  };

  // Perform Geocoding Search (Find city/place in West Bengal or India)
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchError(null);

    try {
      const q = encodeURIComponent(searchQuery + ", West Bengal, India");
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${q}&limit=1`);
      const data = await res.json();

      if (data && data.length > 0) {
        const item = data[0];
        const lat = parseFloat(item.lat);
        const lng = parseFloat(item.lon);

        if (mapInstanceRef.current && (window as any).L) {
          const L = (window as any).L;
          const map = mapInstanceRef.current;

          map.flyTo([lat, lng], 12, { animate: true, duration: 1.5 });

          if (searchMarkerRef.current) map.removeLayer(searchMarkerRef.current);

          const searchIcon = L.divIcon({
            className: "search-result-marker",
            html: `<div class="relative flex items-center justify-center">
                     <div class="w-8 h-8 rounded-full bg-red-500/30 border-2 border-red-500 animate-ping absolute"></div>
                     <div class="w-6 h-6 rounded-full bg-red-600 border-2 border-white shadow-xl flex items-center justify-center text-white text-xs font-bold">
                       📍
                     </div>
                   </div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 16],
          });

          searchMarkerRef.current = L.marker([lat, lng], { icon: searchIcon })
            .addTo(map)
            .bindPopup(`<div style="font-family: system-ui, sans-serif; padding: 4px;">
              <div style="font-weight: 700; color: #dc2626; font-size: 13px;">🔍 ${item.display_name.split(",")[0]}</div>
              <div style="font-size: 11px; color: #475569; margin-top: 2px;">${item.display_name}</div>
            </div>`)
            .openPopup();
        }
      } else {
        setSearchError("Location not found. Try another city or landmark.");
      }
    } catch (err) {
      setSearchError("Search service unavailable.");
    }
    setIsSearching(false);
  };

  // Find User's Current Location
  const locateUser = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude: lat, longitude: lng, accuracy } = pos.coords;
        const loc = { lat, lng, accuracy };
        setUserCoords(loc);
        if (onLocationFound) onLocationFound(loc);

        if (mapInstanceRef.current && (window as any).L) {
          const L = (window as any).L;
          const map = mapInstanceRef.current;
          map.flyTo([lat, lng], 14, { animate: true, duration: 1.5 });

          if (userMarkerRef.current) map.removeLayer(userMarkerRef.current);
          if (userAccuracyCircleRef.current) map.removeLayer(userAccuracyCircleRef.current);

          const userIcon = L.divIcon({
            className: "user-current-location-marker",
            html: `<div class="relative flex items-center justify-center">
                     <div class="w-10 h-10 rounded-full bg-blue-500/30 border-2 border-blue-500 animate-ping absolute"></div>
                     <div class="w-6 h-6 rounded-full bg-blue-600 border-2 border-white shadow-2xl flex items-center justify-center">
                       <div class="w-2.5 h-2.5 rounded-full bg-white"></div>
                     </div>
                   </div>`,
            iconSize: [40, 40],
            iconAnchor: [20, 20],
          });

          userMarkerRef.current = L.marker([lat, lng], { icon: userIcon })
            .addTo(map)
            .bindPopup(`<div style="font-family: system-ui, sans-serif; padding: 4px;">
              <div style="font-weight: 700; color: #2563eb; font-size: 13px;">📍 Your Current Live Location</div>
              <div style="font-size: 11px; color: #475569; margin-top: 2px;">Lat: ${lat.toFixed(4)}°, Lng: ${lng.toFixed(4)}°</div>
              <div style="font-size: 10px; color: #64748b; margin-top: 2px;">GPS Accuracy: ±${Math.round(accuracy)} meters</div>
            </div>`)
            .openPopup();

          userAccuracyCircleRef.current = L.circle([lat, lng], {
            radius: Math.min(accuracy, 1500),
            color: "#2563eb",
            fillColor: "#3b82f6",
            fillOpacity: 0.15,
            weight: 2,
          }).addTo(map);
        }
      },
      (err) => {
        setIsLocating(false);
        const fallback = { lat: 22.5726, lng: 88.3639, accuracy: 100 };
        setUserCoords(fallback);
        if (onLocationFound) onLocationFound(fallback);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    let isCancelled = false;
    let resizeObserverInstance: ResizeObserver | null = null;

    Promise.all([import("leaflet"), import("leaflet/dist/leaflet.css")])
      .then(([L]) => {
        if (isCancelled || !mapContainerRef.current) return;
        if (mapContainerRef.current.classList.contains("leaflet-container")) return;

        (window as any).L = L;

        // Center map around West Bengal region (24.0°N, 88.3°E)
        const map = L.map(mapContainerRef.current, {
          zoomControl: false,
          attributionControl: true,
        }).setView([24.0, 88.3], 7);

        mapInstanceRef.current = map;

        // Default Street Map Tile Layer (High Definition OSM Roads & Cities)
        const cfg = TILE_SERVERS.streets;
        tileLayerRef.current = L.tileLayer(cfg.url, {
          attribution: cfg.attribution,
          maxZoom: cfg.maxZoom,
        }).addTo(map);

        L.control.zoom({ position: "topright" }).addTo(map);

        // Render West Bengal Forest Reserves & Restricted Zones
        WB_FOREST_ZONES.forEach((zone) => {
          L.circle([zone.lat, zone.lng], {
            radius: zone.radius,
            color: zone.color,
            fillColor: zone.color,
            fillOpacity: zone.risk === "restricted" ? 0.3 : 0.2,
            weight: 2.5,
            dashArray: zone.risk === "restricted" ? "8, 6" : undefined,
          })
            .addTo(map)
            .bindPopup(
              `<div style="font-family: system-ui, sans-serif; padding: 6px; max-width: 220px;">
                 <div style="font-weight: 700; font-size: 14px; color: ${zone.color}; flex-items: center; gap: 4px;">
                   🌲 ${zone.name}
                 </div>
                 <div style="margin-top: 4px; font-size: 11px; font-weight: 700; text-transform: uppercase; color: ${zone.color};">
                   STATUS: ${zone.risk.toUpperCase()} ZONE
                 </div>
                 <div style="margin-top: 4px; font-size: 11px; color: #334155; line-height: 1.4;">
                   ${zone.desc}
                 </div>
               </div>`
            );

          const forestIcon = L.divIcon({
            className: "forest-zone-marker",
            html: `<div class="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-sm shadow-xl transition-transform hover:scale-110" style="background-color: ${zone.color};">
                     🌲
                   </div>`,
            iconSize: [28, 28],
            iconAnchor: [14, 14],
          });

          L.marker([zone.lat, zone.lng], { icon: forestIcon })
            .addTo(map)
            .bindPopup(`<div style="font-family: system-ui, sans-serif; color: #0f172a; font-weight: 700; font-size: 12px; padding: 2px;">${zone.name}</div>`);
        });

        // Initial state overview view (West Bengal Region)
        setTimeout(() => {
          if (!isCancelled && map) map.invalidateSize();
        }, 150);

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
        setMapError("Failed to load Interactive High-Resolution Map.");
      });

    return () => {
      isCancelled = true;
      if (resizeObserverInstance) resizeObserverInstance.disconnect();
      if (mapInstanceRef.current) mapInstanceRef.current.remove();
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
    <div className={cn("relative w-full h-full rounded-xl overflow-hidden shadow-2xl border border-slate-700/60 group", height, className)}>
      <div ref={mapContainerRef} className="w-full h-full rounded-xl z-0" />

      {/* Top Search Bar & Geocoding */}
      <form
        onSubmit={handleSearch}
        className="absolute top-3 left-3 z-[1000] flex items-center gap-2 max-w-sm w-full bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-1.5 shadow-2xl"
      >
        <div className="relative flex-1 flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search city/place (e.g. Kolkata, Sundarbans)..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-transparent text-white placeholder-slate-400 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={isSearching}
          className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow transition-all shrink-0 flex items-center gap-1"
        >
          {isSearching ? <span className="animate-spin">⌛</span> : "Search"}
        </button>
      </form>

      {/* Top Right Map View Switcher Controls */}
      <div className="absolute top-3 right-12 z-[1000] bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl p-1 shadow-2xl flex items-center gap-1">
        <button
          onClick={() => changeTileServer("streets")}
          className={cn(
            "px-2.5 py-1 text-xs font-semibold rounded-lg flex items-center gap-1 transition-all",
            mapStyle === "streets" ? "bg-blue-600 text-white shadow-md" : "text-slate-300 hover:text-white hover:bg-slate-800"
          )}
        >
          <MapIcon className="w-3.5 h-3.5" />
          <span>Road Map</span>
        </button>
        <button
          onClick={() => changeTileServer("satellite")}
          className={cn(
            "px-2.5 py-1 text-xs font-semibold rounded-lg flex items-center gap-1 transition-all",
            mapStyle === "satellite" ? "bg-blue-600 text-white shadow-md" : "text-slate-300 hover:text-white hover:bg-slate-800"
          )}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Satellite</span>
        </button>
        <button
          onClick={() => changeTileServer("terrain")}
          className={cn(
            "px-2.5 py-1 text-xs font-semibold rounded-lg flex items-center gap-1 transition-all",
            mapStyle === "terrain" ? "bg-blue-600 text-white shadow-md" : "text-slate-300 hover:text-white hover:bg-slate-800"
          )}
        >
          <Mountain className="w-3.5 h-3.5" />
          <span>Terrain</span>
        </button>
      </div>

      {/* Locate Me Button */}
      <button
        onClick={locateUser}
        disabled={isLocating}
        title="Recenter on My Current Location"
        className="absolute top-16 right-3 z-[1000] bg-slate-900/95 hover:bg-slate-800 backdrop-blur-md border border-slate-700/80 text-white p-2.5 rounded-xl shadow-2xl transition-all flex items-center gap-2 text-xs font-semibold group/btn"
      >
        <Crosshair className={cn("w-4 h-4 text-blue-400 group-hover/btn:rotate-90 transition-transform", isLocating && "animate-spin text-amber-400")} />
        <span className="hidden sm:inline">{isLocating ? "Locating..." : "My GPS Location"}</span>
      </button>

      {/* Search Error Toast */}
      {searchError && (
        <div className="absolute top-16 left-3 z-[1000] bg-red-900/90 text-red-200 border border-red-500/40 rounded-xl px-3 py-1.5 text-xs flex items-center gap-2 shadow-xl">
          <AlertTriangle className="w-3.5 h-3.5 text-red-300" />
          <span>{searchError}</span>
        </div>
      )}

      {/* Bottom Live Coordinates Badge */}
      {userCoords && (
        <div className="absolute bottom-3 left-3 z-[1000] bg-slate-900/95 backdrop-blur-md border border-blue-500/40 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-200 flex items-center gap-3 shadow-2xl">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
          <span>Lat: <strong className="text-white">{userCoords.lat.toFixed(4)}°</strong>, Lng: <strong className="text-white">{userCoords.lng.toFixed(4)}°</strong></span>
          <span className="text-slate-600">|</span>
          <span className="text-blue-400 font-sans text-[11px] font-semibold">GPS Accuracy: ±{Math.round(userCoords.accuracy)}m</span>
        </div>
      )}
    </div>
  );
}
