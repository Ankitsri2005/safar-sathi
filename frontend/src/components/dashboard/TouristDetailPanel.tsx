"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { type MockTourist, getSafetyColor, getSafetyLabel, formatRelativeTime } from "@/lib/mock-data";
import {
  User,
  MapPin,
  Shield,
  Calendar,
  Clock,
  ArrowLeft,
  Navigation,
  Phone,
  Mail,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  Route,
} from "lucide-react";

interface TouristDetailPanelProps {
  tourist: MockTourist;
  onBack: () => void;
}

function SafetyGauge({ score }: { score: number }) {
  const color = getSafetyColor(score);
  const label = getSafetyLabel(score);
  const colorMap: Record<string, { bar: string; text: string; bg: string }> = {
    success: { bar: "bg-success", text: "text-success", bg: "bg-success-50" },
    warning: { bar: "bg-warning", text: "text-warning", bg: "bg-warning-50" },
    danger: { bar: "bg-danger", text: "text-danger", bg: "bg-danger-50" },
  };
  const c = colorMap[color] || colorMap.success;

  return (
    <div className={`p-3 rounded-xl ${c.bg} border border-${color}-200`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-muted">Safety Score</span>
        <Badge variant={color as any} size="sm">{label}</Badge>
      </div>
      <div className="flex items-end gap-2">
        <span className={`text-3xl font-bold ${c.text}`}>{score}</span>
        <span className="text-xs text-muted mb-1">/ 100</span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-white/60 overflow-hidden">
        <div className={`h-full rounded-full ${c.bar} transition-all duration-500`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

export function TouristDetailPanel({ tourist, onBack }: TouristDetailPanelProps) {
  const isTripValid = new Date(tourist.trip_end) >= new Date("2026-08-20");
  const maskedName = tourist.full_name.split(" ").map((n, i, arr) => i === 0 || i === arr.length - 1 ? n[0] + n.slice(1).replace(/./g, "•") : "•".repeat(n.length)).join(" ");

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} icon={<ArrowLeft className="w-4 h-4" />}>
          Back
        </Button>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-fg truncate">{maskedName}</h3>
          <p className="text-xs font-mono text-muted truncate">{tourist.id}</p>
        </div>
        <Badge variant={tourist.status === "active" ? "success" : "danger"} size="sm" pulse={tourist.status === "active"}>
          {tourist.status}
        </Badge>
      </div>

      {/* Safety Score */}
      <SafetyGauge score={tourist.safety_score} />

      {/* Location Info */}
      <div className="p-3 rounded-xl bg-bg border border-border space-y-2.5">
        <h4 className="text-xs font-semibold text-muted uppercase tracking-wider">Current Location</h4>
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <MapPin className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-fg">{tourist.current_zone}</p>
              <p className="text-xs text-muted font-mono">{tourist.current_lat.toFixed(4)}, {tourist.current_lng.toFixed(4)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-muted shrink-0" />
            <p className="text-xs text-muted">Last update: <span className="font-medium text-fg">{formatRelativeTime(tourist.last_update)}</span></p>
          </div>
        </div>
      </div>

      {/* Trip Validity */}
      <div className={`p-3 rounded-xl border ${isTripValid ? "bg-success-50 border-success-200" : "bg-danger-50 border-danger-200"}`}>
        <div className="flex items-center gap-2 mb-2">
          {isTripValid ? <CheckCircle className="w-4 h-4 text-success" /> : <AlertTriangle className="w-4 h-4 text-danger" />}
          <span className={`text-sm font-medium ${isTripValid ? "text-success" : "text-danger"}`}>
            Trip {isTripValid ? "Active" : "Expired"}
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {new Date(tourist.trip_start).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
          </span>
          <ChevronRight className="w-3 h-3" />
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {new Date(tourist.trip_end).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </span>
        </div>
      </div>

      {/* Contact */}
      <div className="p-3 rounded-xl bg-bg border border-border space-y-2">
        <h4 className="text-xs font-semibold text-muted uppercase tracking-wider">Contact</h4>
        <div className="flex items-center gap-2 text-xs text-muted">
          <Phone className="w-3.5 h-3.5 shrink-0" />
          <span>{tourist.phone}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted">
          <Mail className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{tourist.email}</span>
        </div>
      </div>

      {/* Planned Itinerary */}
      <div className="p-3 rounded-xl bg-bg border border-border space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold text-muted uppercase tracking-wider">Planned Itinerary</h4>
          <Badge variant="outline" size="sm">{tourist.itinerary.length} stops</Badge>
        </div>
        <div className="space-y-1.5">
          {tourist.itinerary.map((stop, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 text-[10px] font-bold">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-medium text-fg">{stop.place}</span>
                <span className="text-muted ml-1.5">
                  {new Date(stop.planned_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </span>
              </div>
              {i < tourist.itinerary.length - 1 && (
                <ChevronRight className="w-3 h-3 text-muted shrink-0" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Recent Movement */}
      {tourist.movement_history.length > 0 && (
        <div className="p-3 rounded-xl bg-bg border border-border space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-muted uppercase tracking-wider">Recent Movement</h4>
            <Badge variant="primary" size="sm" icon={<Navigation className="w-3 h-3" />}>
              {tourist.movement_history.length} points
            </Badge>
          </div>
          <div className="space-y-1">
            {tourist.movement_history.slice(-5).reverse().map((point, i) => (
              <div key={i} className="flex items-center gap-2 text-xs py-1">
                <div className={`w-2 h-2 rounded-full shrink-0 ${i === 0 ? "bg-primary animate-pulse" : "bg-muted/30"}`} />
                <div className="flex-1 min-w-0">
                  <span className="font-mono text-fg">{point.lat.toFixed(4)}, {point.lng.toFixed(4)}</span>
                  {point.speed > 0 && (
                    <span className="text-muted ml-1.5">{point.speed} km/h</span>
                  )}
                </div>
                <span className="text-muted shrink-0">
                  {new Date(point.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Digital ID */}
      <div className="p-3 rounded-xl bg-primary-50 border border-primary-200">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          <span className="text-xs font-medium text-primary">Digital ID: {tourist.id}</span>
        </div>
      </div>
    </div>
  );
}
