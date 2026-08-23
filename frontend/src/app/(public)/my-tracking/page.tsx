"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import Footer from "@/components/layout/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  MOCK_TOURISTS,
  getSafetyColor,
  getSafetyLabel,
  formatRelativeTime,
  type MockTourist,
} from "@/lib/mock-data";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  MapPin,
  Play,
  Square,
  AlertTriangle,
  Phone,
  Hash,
  Search,
  Route,
  Compass,
  Activity,
  Lock,
  Info,
  CheckCircle,
  XCircle,
  Navigation,
  Clock,
  ChevronRight,
} from "lucide-react";
import { SosVoiceRecorderModal } from "@/components/emergency/SosVoiceRecorderModal";

interface LocationState {
  lat: number;
  lng: number;
  accuracy: number;
  speed: number | null;
  heading: number | null;
  timestamp: number;
}

function SafetyGauge({ score }: { score: number }) {
  const color = getSafetyColor(score);
  const label = getSafetyLabel(score);
  const cmap: Record<string, { bar: string; text: string; bg: string; border: string }> = {
    success: { bar: "bg-success", text: "text-success", bg: "bg-success-50", border: "border-success-200" },
    warning: { bar: "bg-warning", text: "text-warning", bg: "bg-warning-50", border: "border-warning-200" },
    danger: { bar: "bg-danger", text: "text-danger", bg: "bg-danger-50", border: "border-danger-200" },
  };
  const c = cmap[color] || cmap.success;
  return (
    <div className={`p-4 rounded-xl ${c.bg} border ${c.border}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-muted flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5" /> Safety Score
        </span>
        <Badge variant={color as any} size="sm" pulse={color === "danger"}>{label}</Badge>
      </div>
      <div className="flex items-end gap-2">
        <span className={`text-4xl font-bold ${c.text}`}>{score}</span>
        <span className="text-sm text-muted mb-1">/ 100</span>
      </div>
      <div className="mt-3 h-2 rounded-full bg-white/60 overflow-hidden">
        <div className={`h-full rounded-full ${c.bar} transition-all duration-700`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

export default function MyTrackingPage() {
  const { t } = useLanguage();
  const [touristId, setTouristId] = useState("");
  const [tourist, setTourist] = useState<MockTourist | null>(null);
  const [lookupError, setLookupError] = useState("");
  const [isTracking, setIsTracking] = useState(false);
  const [location, setLocation] = useState<LocationState | null>(null);
  const [locationError, setLocationError] = useState("");
  const [watchId, setWatchId] = useState<number | null>(null);
  const [showPanicConfirm, setShowPanicConfirm] = useState(false);
  const [showSosVoiceModal, setShowSosVoiceModal] = useState(false);
  const [panicSent, setPanicSent] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);
  const [showConsent, setShowConsent] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [panicCooldown, setPanicCooldown] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  useEffect(() => {
    return () => { if (watchId !== null) navigator.geolocation.clearWatch(watchId); };
  }, [watchId]);

  useEffect(() => {
    if (panicCooldown <= 0) return;
    const t = setTimeout(() => setPanicCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [panicCooldown]);

  const touristRef = useRef<any>(null);

  const executeLookup = async (idToSearch: string) => {
    setLookupError("");
    setTourist(null);
    if (!idToSearch) { setLookupError("Please enter your Tourist ID or Blockchain Hash ID"); return; }

    try {
      const res = await api.get(`/verify-id/${encodeURIComponent(idToSearch)}/latest`);
      const d = res.data;
      if (d && (d.tourist || d.valid)) {
        const touristData = {
          id: d.tourist?.id || idToSearch,
          full_name: d.tourist?.full_name || "Registered Tourist",
          phone: d.tourist?.phone || "N/A",
          email: d.tourist?.email || "N/A",
          emergency_contact_name: d.tourist?.emergency_contact_name || "Emergency Contact",
          emergency_contact_phone: d.tourist?.emergency_contact_phone || "N/A",
          id_type: d.tourist?.id_type || "Aadhaar",
          id_number: d.tourist?.id_number || "Verified",
          trip_start: d.tourist?.trip_start || new Date().toISOString(),
          trip_end: d.tourist?.trip_end || new Date(Date.now() + 7 * 86400000).toISOString(),
          status: d.status || "active",
          safety_score: 98,
          current_lat: 27.3334,
          current_lng: 88.6095,
          current_zone: "Safe Corridor",
          last_update: new Date().toISOString(),
          consent_tracking: true,
          itinerary: [],
          movement_history: [],
          block_id: d.blockId || idToSearch,
        };
        touristRef.current = touristData;
        setTourist(touristData as any);
        setConsentGiven(true);
        return;
      }
    } catch {}

    const found = MOCK_TOURISTS.find((t) => t.id.toLowerCase() === idToSearch.toLowerCase());
    if (found) {
      touristRef.current = found;
      setTourist(found);
      setConsentGiven(found.consent_tracking);
    } else {
      setLookupError("Tourist ID or Blockchain Hash not found. Please check your credentials and try again.");
    }
  };

  const handleLookup = () => {
    executeLookup(touristId.trim());
  };

  const startTracking = useCallback(() => {
    if (!consentGiven) { setShowConsent(true); return; }
    if (!navigator.geolocation) { setLocationError("Geolocation is not supported by your browser"); return; }
    setLocationError("");
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLocation({
          lat,
          lng,
          accuracy: pos.coords.accuracy,
          speed: pos.coords.speed,
          heading: pos.coords.heading,
          timestamp: pos.timestamp,
        });
        setIsTracking(true);
        const currentT = touristRef.current;
        if (currentT?.id) {
          api.post("/location-ping", { tourist_id: currentT.id, lat, lng }).catch(() => {});
        }
      },
      (err) => {
        setLocationError(
          err.code === 1 ? "Location access denied. Please enable location permissions in your browser." :
          err.code === 2 ? "Location unavailable. Please try again." :
          "Location request timed out. Please try again."
        );
        setIsTracking(false);
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
    setWatchId(id);
  }, [consentGiven]);

  const stopTracking = useCallback(() => {
    if (watchId !== null) { navigator.geolocation.clearWatch(watchId); setWatchId(null); }
    setIsTracking(false);
    setLocation(null);
  }, [watchId]);

  const handleConsentAccept = () => {
    setConsentGiven(true);
    setShowConsent(false);
    setTimeout(startTracking, 100);
  };

  const handlePanic = () => {
    setPanicSent(true);
    setShowPanicConfirm(false);
    setPanicCooldown(60);
    setTimeout(() => setPanicSent(false), 5000);
  };

  const isTripActive = tourist ? new Date(tourist.trip_end) >= currentTime : false;

  // Lookup screen
  if (!tourist) {
    return (
      <div className="min-h-screen bg-bg pt-24 pb-12">
        <div className="max-w-lg mx-auto px-4">
          <div className="text-center mb-8 animate-fade-in">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Compass className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-fg">{t("tr_title")}</h1>
            <p className="text-muted mt-2 text-sm">{t("tr_subtitle")}</p>
          </div>

          <Card variant="elevated" className="animate-fade-in-up">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                <Search className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-fg">Access Your Tracking</h2>
                <p className="text-xs text-muted">Enter the Tourist ID from your Digital ID card</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <label className="block text-sm font-medium text-fg mb-1">Tourist ID</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                  <input
                    value={touristId}
                    onChange={(e) => setTouristId(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleLookup()}
                    className="w-full border border-border rounded-xl pl-10 pr-4 py-3 text-sm bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all font-mono"
                    placeholder="e.g. TST-A1B2C3D4-E5F6"
                  />
                </div>
              </div>

              {lookupError && (
                <div className="p-3 rounded-xl bg-danger-50 border border-danger-200 text-danger text-sm flex items-center gap-2 animate-shake">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {lookupError}
                </div>
              )}

              <Button variant="primary" size="lg" onClick={handleLookup} className="w-full" icon={<Search className="w-4 h-4" />}>
                Look Up
              </Button>
            </div>

            <div className="mt-4 p-3 rounded-xl bg-bg border border-border">
              <p className="text-xs text-muted font-medium mb-2">Registered Tourist IDs / Blockchain Hashes:</p>
              <div className="space-y-1">
                {[
                  { label: "Ankit kr Srivastava (Hash ID)", id: "79eb79ae-15f8-473c-af7b-5985039f5e96" },
                  { label: "Rahul Sharma (Hash ID)", id: "61012c47-4821-4ba5-bc9e-c59976bcf2e3" },
                  { label: "Verified Demo Tourist (Aadhaar)", id: "DEMO-TOURIST-2026" },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => { setTouristId(item.id); executeLookup(item.id); }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-mono text-fg hover:bg-surface-light/20 flex items-center justify-between transition-colors"
                  >
                    <span className="text-primary font-sans font-medium">{item.label}</span>
                    <span className="text-muted text-[11px]">{item.id.slice(0, 8)}...</span>
                  </button>
                ))}
              </div>
            </div>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  // Main tracking dashboard
  return (
    <div className="min-h-screen bg-bg pt-24 pb-12">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 animate-fade-in">
          <button onClick={() => { setTourist(null); stopTracking(); }} className="p-2 rounded-lg hover:bg-surface-light/10 text-muted transition-colors">
            <XCircle className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-fg truncate">{tourist.full_name}</h1>
            <p className="text-xs font-mono text-muted truncate">{tourist.id}</p>
          </div>
          <Badge variant={tourist.status === "active" ? "success" : "danger"} size="sm" pulse={tourist.status === "active"}>
            {tourist.status}
          </Badge>
        </div>

        {/* Consent Modal */}
        {showConsent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowConsent(false)} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-scale-in">
              <div className="text-center mb-4">
                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-lg font-bold text-fg">Location Sharing Consent</h2>
              </div>
              <div className="space-y-3 text-sm text-muted mb-6">
                <p>By enabling location sharing, you agree to:</p>
                <ul className="space-y-2">
                  {[
                    "Real-time GPS location monitoring during your trip",
                    "Location data storage on an encrypted blockchain ledger",
                    "Automatic alerts to authorities if safety anomalies are detected",
                    "Emergency contact notification in case of panic or danger",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-success shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-warning-dark bg-warning-50 border border-warning-200 p-2 rounded-lg">
                  You can stop location sharing at any time. Your data is encrypted and protected under government privacy policy.
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setShowConsent(false)}>Decline</Button>
                <Button variant="primary" className="flex-1" onClick={handleConsentAccept}>Accept & Enable</Button>
              </div>
            </div>
          </div>
        )}

        {/* Panic Confirm Modal */}
        {showPanicConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowPanicConfirm(false)} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-scale-in">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-danger rounded-full flex items-center justify-center mx-auto mb-3 animate-pulse">
                  <ShieldAlert className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-xl font-bold text-danger">Send Panic Alert?</h2>
                <p className="text-sm text-muted mt-2">
                  This will immediately alert nearby authorities and your emergency contact with your current location.
                </p>
              </div>
              <div className="bg-danger-50 border border-danger-200 rounded-xl p-3 mb-4">
                <p className="text-xs text-danger text-center font-medium">
                  Only use this in case of genuine emergency. False alerts may result in penalties.
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setShowPanicConfirm(false)}>Cancel</Button>
                <Button variant="danger" className="flex-1" onClick={handlePanic} icon={<ShieldAlert className="w-4 h-4" />}>
                  Send Panic Alert
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4 animate-fade-in">
          {/* Tracking Status */}
          <Card variant="elevated">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-fg flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                Tracking Session
              </h2>
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${isTracking ? "bg-success-100 text-success" : "bg-gray-100 text-gray-500"}`}>
                <div className={`w-2 h-2 rounded-full ${isTracking ? "bg-success animate-pulse" : "bg-gray-400"}`} />
                {isTracking ? "Live" : "Inactive"}
              </div>
            </div>

            <div className="flex gap-3">
              {!isTracking ? (
                <Button variant="primary" className="flex-1" onClick={startTracking} icon={<Play className="w-4 h-4" />}>
                  Start Location Sharing
                </Button>
              ) : (
                <Button variant="danger" className="flex-1" onClick={stopTracking} icon={<Square className="w-4 h-4" />}>
                  Stop Location Sharing
                </Button>
              )}
            </div>

            {locationError && (
              <div className="mt-3 p-3 rounded-xl bg-danger-50 border border-danger-200 text-danger text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {locationError}
              </div>
            )}
          </Card>

          {/* Safety Score */}
          <SafetyGauge score={tourist.safety_score} />

          {/* Current Location */}
          {location && (
            <Card variant="elevated">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-fg">Your Current Location</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-bg border border-border">
                  <p className="text-[10px] text-muted uppercase mb-1">Latitude</p>
                  <p className="text-sm font-mono font-medium text-fg">{location.lat.toFixed(6)}</p>
                </div>
                <div className="p-3 rounded-xl bg-bg border border-border">
                  <p className="text-[10px] text-muted uppercase mb-1">Longitude</p>
                  <p className="text-sm font-mono font-medium text-fg">{location.lng.toFixed(6)}</p>
                </div>
                <div className="p-3 rounded-xl bg-bg border border-border">
                  <p className="text-[10px] text-muted uppercase mb-1">Accuracy</p>
                  <p className="text-sm font-medium text-fg">±{Math.round(location.accuracy)}m</p>
                </div>
                <div className="p-3 rounded-xl bg-bg border border-border">
                  <p className="text-[10px] text-muted uppercase mb-1">Speed</p>
                  <p className="text-sm font-medium text-fg">
                    {location.speed !== null ? `${(location.speed * 3.6).toFixed(1)} km/h` : "Stationary"}
                  </p>
                </div>
              </div>
              <div className="mt-3 p-2 rounded-lg bg-primary-50 border border-primary-200 flex items-center gap-2">
                <Navigation className="w-3.5 h-3.5 text-primary shrink-0" />
                <p className="text-xs text-primary">
                  Last update: {new Date(location.timestamp).toLocaleTimeString("en-IN")}
                </p>
              </div>
            </Card>
          )}

          {/* Zone + Trip Info */}
          <div className="grid grid-cols-2 gap-4">
            <Card variant="elevated" padding="sm">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-accent" />
                <h3 className="text-xs font-semibold text-fg">Current Zone</h3>
              </div>
              <p className="text-sm font-medium text-fg">{tourist.current_zone}</p>
              <p className="text-[10px] text-muted mt-1 font-mono">
                {tourist.current_lat.toFixed(4)}, {tourist.current_lng.toFixed(4)}
              </p>
            </Card>

            <Card variant="elevated" padding="sm">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-primary" />
                <h3 className="text-xs font-semibold text-fg">Trip Status</h3>
              </div>
              <Badge variant={isTripActive ? "success" : "danger"} size="sm">
                {isTripActive ? "Active" : "Expired"}
              </Badge>
              <p className="text-[10px] text-muted mt-2">
                {new Date(tourist.trip_start).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                {" — "}
                {new Date(tourist.trip_end).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            </Card>
          </div>

          {/* Planned Itinerary */}
          <Card variant="elevated">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-fg flex items-center gap-2">
                <Route className="w-4 h-4 text-success" />
                Planned Route
              </h3>
              <Badge variant="outline" size="sm">{tourist.itinerary.length} stops</Badge>
            </div>
            <div className="space-y-2">
              {tourist.itinerary.map((stop, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-bg border border-border">
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-fg truncate">{stop.place}</p>
                    <p className="text-[10px] text-muted">
                      {new Date(stop.planned_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-muted shrink-0" />
                </div>
              ))}
            </div>
          </Card>

          {/* Panic Button */}
          <Card variant="elevated" className="border-2 border-danger/20">
            <div className="text-center">
              <h3 className="text-sm font-semibold text-fg mb-2 flex items-center justify-center gap-2">
                <Phone className="w-4 h-4 text-danger" />
                Emergency Panic Button
              </h3>
              <p className="text-xs text-muted mb-4">
                Press in case of emergency. Authorities and your emergency contact will be alerted immediately.
              </p>

              {panicSent ? (
                <div className="p-4 rounded-xl bg-danger-50 border border-danger-200">
                  <ShieldAlert className="w-8 h-8 text-danger mx-auto mb-2 animate-pulse" />
                  <p className="text-sm font-bold text-danger">Panic Alert & 10s Voice Note Sent!</p>
                  <p className="text-xs text-muted mt-1">Authorities have been notified with your GPS location & audio recording.</p>
                </div>
              ) : (
                <button
                  onClick={() => setShowSosVoiceModal(true)}
                  disabled={panicCooldown > 0}
                  className={`w-28 h-28 rounded-full border-4 transition-all duration-300 flex flex-col items-center justify-center mx-auto ${
                    panicCooldown > 0
                      ? "border-gray-300 bg-gray-100 cursor-not-allowed"
                      : "border-danger bg-danger text-white hover:bg-danger-dark hover:shadow-xl hover:scale-105 active:scale-95 cursor-pointer"
                  }`}
                >
                  {panicCooldown > 0 ? (
                    <>
                      <Clock className="w-6 h-6 text-gray-400 mb-1" />
                      <span className="text-xs font-bold text-gray-400">{panicCooldown}s</span>
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="w-8 h-8 mb-1" />
                      <span className="text-xs font-bold">SOS</span>
                    </>
                  )}
                </button>
              )}

              <div className="mt-4 p-3 rounded-xl bg-bg border border-border text-left">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-muted shrink-0 mt-0.5" />
                  <div className="text-xs text-muted space-y-1">
                    <p>Panic alert sends your current GPS location & 10s voice recording to:</p>
                    <p>• Nearby police stations</p>
                    <p>• Tourism control room</p>
                    <p>• Your registered emergency contact</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Safety Tips */}
          <Card variant="glass" className="p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-success shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-fg mb-1">Safety Tips</h3>
                <ul className="text-xs text-muted space-y-1">
                  <li>• Keep location sharing enabled during your entire trip</li>
                  <li>• Stay within your planned itinerary when possible</li>
                  <li>• Save emergency numbers: 112 (Police), 1363 (Tourist Helpline)</li>
                  <li>• Carry your Digital Tourist ID at all times</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <SosVoiceRecorderModal
        isOpen={showSosVoiceModal}
        onClose={() => setShowSosVoiceModal(false)}
        touristId={tourist?.id}
        currentLat={location?.lat || tourist?.current_lat || 27.3334}
        currentLng={location?.lng || tourist?.current_lng || 88.6095}
        onPanicTriggered={() => {
          setPanicSent(true);
          setPanicCooldown(60);
          setTimeout(() => setPanicSent(false), 5000);
        }}
      />

      <Footer />
    </div>
  );
}
