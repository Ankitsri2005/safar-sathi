"use client";

import { MapPin, Navigation } from "lucide-react";
import { cn } from "@/utils/cn";

interface MapPlaceholderProps {
  className?: string;
  height?: string;
}

export function MapPlaceholder({ className, height = "min-h-[400px]" }: MapPlaceholderProps) {
  return (
    <div
      className={cn(
        "relative bg-gradient-to-br from-surface to-surface-light rounded-xl border border-border overflow-hidden",
        height,
        className
      )}
    >
      {/* Grid Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="w-full h-full" style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "40px 40px"
        }} />
      </div>

      {/* Center Content */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-float">
            <Navigation className="w-8 h-8 text-primary-light" />
          </div>
          <p className="text-sm font-medium text-white/60">Live Map</p>
          <p className="text-xs text-white/30 mt-1">
            Mapbox integration pending
          </p>
        </div>
      </div>

      {/* Floating Pins */}
      <div className="absolute top-1/4 left-1/3 animate-float" style={{ animationDelay: "1s" }}>
        <MapPin className="w-5 h-5 text-accent drop-shadow-lg" />
      </div>
      <div className="absolute top-1/2 right-1/4 animate-float" style={{ animationDelay: "2s" }}>
        <MapPin className="w-5 h-5 text-success drop-shadow-lg" />
      </div>
      <div className="absolute bottom-1/3 left-1/2 animate-float" style={{ animationDelay: "0.5s" }}>
        <MapPin className="w-5 h-5 text-danger drop-shadow-lg" />
      </div>
    </div>
  );
}
