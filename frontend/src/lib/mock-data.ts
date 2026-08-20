import { AlertType, AlertStatus, RiskLevel, IdStatus, UserRole } from "@/types";

export interface MockTourist {
  id: string;
  full_name: string;
  id_type: string;
  phone: string;
  email: string;
  trip_start: string;
  trip_end: string;
  status: "active" | "expired" | "revoked";
  safety_score: number;
  current_lat: number;
  current_lng: number;
  current_zone: string;
  last_update: string;
  consent_tracking: boolean;
  itinerary: { place: string; lat: number; lng: number; planned_date: string }[];
  movement_history: { lat: number; lng: number; timestamp: string; speed: number }[];
}

export interface MockAlert {
  id: string;
  tourist_id: string;
  tourist_name: string;
  alert_type: AlertType;
  location_lat: number;
  location_lng: number;
  location_name: string | null;
  status: AlertStatus;
  message: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  severity: "low" | "medium" | "high" | "critical";
}

export interface MockZone {
  id: string;
  name: string;
  risk_level: RiskLevel;
  tourist_count: number;
  center_lat: number;
  center_lng: number;
}

export const MOCK_TOURISTS: MockTourist[] = [
  {
    id: "TST-A1B2C3D4-E5F6",
    full_name: "Priya Sharma",
    id_type: "aadhaar",
    phone: "+91 98765 43210",
    email: "priya.sharma@email.com",
    trip_start: "2026-08-15",
    trip_end: "2026-08-25",
    status: "active",
    safety_score: 92,
    current_lat: 27.3389,
    current_lng: 88.6065,
    current_zone: "Gangtok City Center",
    last_update: "2026-08-20T14:32:00Z",
    consent_tracking: true,
    itinerary: [
      { place: "Gangtok", lat: 27.3389, lng: 88.6065, planned_date: "2026-08-15" },
      { place: "Tsomgo Lake", lat: 27.3735, lng: 88.7595, planned_date: "2026-08-18" },
      { place: "Nathula Pass", lat: 27.3950, lng: 88.7800, planned_date: "2026-08-20" },
      { place: "Pelling", lat: 27.3010, lng: 88.2400, planned_date: "2026-08-22" },
    ],
    movement_history: [
      { lat: 27.3389, lng: 88.6065, timestamp: "2026-08-20T10:00:00Z", speed: 0 },
      { lat: 27.3420, lng: 88.6100, timestamp: "2026-08-20T11:00:00Z", speed: 5 },
      { lat: 27.3500, lng: 88.6200, timestamp: "2026-08-20T12:00:00Z", speed: 12 },
      { lat: 27.3600, lng: 88.6350, timestamp: "2026-08-20T13:00:00Z", speed: 8 },
      { lat: 27.3550, lng: 88.6300, timestamp: "2026-08-20T14:00:00Z", speed: 2 },
      { lat: 27.3389, lng: 88.6065, timestamp: "2026-08-20T14:32:00Z", speed: 0 },
    ],
  },
  {
    id: "TST-F7G8H9I0-J1K2",
    full_name: "Arjun Patel",
    id_type: "passport",
    phone: "+91 87654 32109",
    email: "arjun.patel@email.com",
    trip_start: "2026-08-18",
    trip_end: "2026-08-28",
    status: "active",
    safety_score: 67,
    current_lat: 27.4100,
    current_lng: 88.7200,
    current_zone: "East Sikkim — High Risk",
    last_update: "2026-08-20T14:28:00Z",
    consent_tracking: true,
    itinerary: [
      { place: "Gangtok", lat: 27.3389, lng: 88.6065, planned_date: "2026-08-18" },
      { place: "Rumtek Monastery", lat: 27.3800, lng: 88.5700, planned_date: "2026-08-20" },
      { place: "Tsomgo Lake", lat: 27.3735, lng: 88.7595, planned_date: "2026-08-22" },
    ],
    movement_history: [
      { lat: 27.3389, lng: 88.6065, timestamp: "2026-08-20T08:00:00Z", speed: 0 },
      { lat: 27.3600, lng: 88.6500, timestamp: "2026-08-20T09:30:00Z", speed: 25 },
      { lat: 27.3850, lng: 88.6800, timestamp: "2026-08-20T11:00:00Z", speed: 18 },
      { lat: 27.4000, lng: 88.7000, timestamp: "2026-08-20T12:30:00Z", speed: 15 },
      { lat: 27.4100, lng: 88.7200, timestamp: "2026-08-20T14:28:00Z", speed: 3 },
    ],
  },
  {
    id: "TST-L3M4N5O6-P7Q8",
    full_name: "Mei Lin Wong",
    id_type: "passport",
    phone: "+86 138 0013 8000",
    email: "meilin.wong@travel.cn",
    trip_start: "2026-08-10",
    trip_end: "2026-08-20",
    status: "active",
    safety_score: 45,
    current_lat: 27.4500,
    current_lng: 88.7800,
    current_zone: "Restricted Border Area",
    last_update: "2026-08-20T14:15:00Z",
    consent_tracking: true,
    itinerary: [
      { place: "Gangtok", lat: 27.3389, lng: 88.6065, planned_date: "2026-08-10" },
      { place: "Lachung", lat: 27.6900, lng: 88.7400, planned_date: "2026-08-14" },
      { place: "Gurudongmar Lake", lat: 28.0100, lng: 88.7200, planned_date: "2026-08-16" },
    ],
    movement_history: [
      { lat: 27.3389, lng: 88.6065, timestamp: "2026-08-20T06:00:00Z", speed: 0 },
      { lat: 27.3800, lng: 88.6500, timestamp: "2026-08-20T08:00:00Z", speed: 30 },
      { lat: 27.4200, lng: 88.7000, timestamp: "2026-08-20T10:00:00Z", speed: 35 },
      { lat: 27.4500, lng: 88.7800, timestamp: "2026-08-20T14:15:00Z", speed: 5 },
    ],
  },
  {
    id: "TST-R9S0T1U2-V3W4",
    full_name: "David Thompson",
    id_type: "passport",
    phone: "+1 555 0123",
    email: "david.t@travel.us",
    trip_start: "2026-08-12",
    trip_end: "2026-08-22",
    status: "active",
    safety_score: 88,
    current_lat: 27.3100,
    current_lng: 88.6200,
    current_zone: "South Sikkim — Low Risk",
    last_update: "2026-08-20T14:30:00Z",
    consent_tracking: true,
    itinerary: [
      { place: "Namchi", lat: 27.1700, lng: 88.4700, planned_date: "2026-08-12" },
      { place: "Gangtok", lat: 27.3389, lng: 88.6065, planned_date: "2026-08-15" },
      { place: "Ravangla", lat: 27.3000, lng: 88.5800, planned_date: "2026-08-18" },
    ],
    movement_history: [
      { lat: 27.3000, lng: 88.5800, timestamp: "2026-08-20T09:00:00Z", speed: 0 },
      { lat: 27.3050, lng: 88.5900, timestamp: "2026-08-20T10:00:00Z", speed: 4 },
      { lat: 27.3100, lng: 88.6000, timestamp: "2026-08-20T11:00:00Z", speed: 6 },
      { lat: 27.3100, lng: 88.6200, timestamp: "2026-08-20T14:30:00Z", speed: 0 },
    ],
  },
  {
    id: "TST-X5Y6Z7A8-B9C0",
    full_name: "Ananya Reddy",
    id_type: "aadhaar",
    phone: "+91 76543 21098",
    email: "ananya.r@email.com",
    trip_start: "2026-08-19",
    trip_end: "2026-08-27",
    status: "active",
    safety_score: 78,
    current_lat: 27.3600,
    current_lng: 88.6100,
    current_zone: "Gangtok City Center",
    last_update: "2026-08-20T14:25:00Z",
    consent_tracking: true,
    itinerary: [
      { place: "Gangtok", lat: 27.3389, lng: 88.6065, planned_date: "2026-08-19" },
      { place: "Tsomgo Lake", lat: 27.3735, lng: 88.7595, planned_date: "2026-08-22" },
      { place: "Baba Mandir", lat: 27.3900, lng: 88.7700, planned_date: "2026-08-24" },
    ],
    movement_history: [
      { lat: 27.3389, lng: 88.6065, timestamp: "2026-08-20T07:00:00Z", speed: 0 },
      { lat: 27.3450, lng: 88.6080, timestamp: "2026-08-20T09:00:00Z", speed: 3 },
      { lat: 27.3550, lng: 88.6090, timestamp: "2026-08-20T11:00:00Z", speed: 5 },
      { lat: 27.3600, lng: 88.6100, timestamp: "2026-08-20T14:25:00Z", speed: 0 },
    ],
  },
  {
    id: "TST-D1E2F3G4-H5I6",
    full_name: "Rohit Verma",
    id_type: "aadhaar",
    phone: "+91 65432 10987",
    email: "rohit.v@email.com",
    trip_start: "2026-08-01",
    trip_end: "2026-08-10",
    status: "expired",
    safety_score: 85,
    current_lat: 27.3389,
    current_lng: 88.6065,
    current_zone: "Gangtok City Center",
    last_update: "2026-08-10T18:00:00Z",
    consent_tracking: true,
    itinerary: [
      { place: "Gangtok", lat: 27.3389, lng: 88.6065, planned_date: "2026-08-01" },
    ],
    movement_history: [],
  },
];

export const MOCK_ALERTS: MockAlert[] = [
  {
    id: "ALT-001",
    tourist_id: "TST-L3M4N5O6-P7Q8",
    tourist_name: "Mei Lin Wong",
    alert_type: AlertType.RESTRICTED_ZONE_ENTRY,
    location_lat: 27.4500,
    location_lng: 88.7800,
    location_name: "Restricted Border Area",
    status: AlertStatus.NEW,
    message: "Tourist entered restricted zone near border area without authorization.",
    resolved_by: null,
    resolved_at: null,
    created_at: "2026-08-20T14:20:00Z",
    severity: "critical",
  },
  {
    id: "ALT-002",
    tourist_id: "TST-F7G8H9I0-J1K2",
    tourist_name: "Arjun Patel",
    alert_type: AlertType.ROUTE_DEVIATION,
    location_lat: 27.4100,
    location_lng: 88.7200,
    location_name: "East Sikkim",
    status: AlertStatus.UNDER_REVIEW,
    message: "Tourist deviated 12km from planned route.",
    resolved_by: null,
    resolved_at: null,
    created_at: "2026-08-20T13:45:00Z",
    severity: "high",
  },
  {
    id: "ALT-003",
    tourist_id: "TST-L3M4N5O6-P7Q8",
    tourist_name: "Mei Lin Wong",
    alert_type: AlertType.PROLONGED_STOP,
    location_lat: 27.4300,
    location_lng: 88.7500,
    location_name: "East Sikkim",
    status: AlertStatus.NEW,
    message: "Prolonged stop (2+ hours) in high-risk area detected.",
    resolved_by: null,
    resolved_at: null,
    created_at: "2026-08-20T12:00:00Z",
    severity: "high",
  },
  {
    id: "ALT-004",
    tourist_id: "TST-A1B2C3D4-E5F6",
    tourist_name: "Priya Sharma",
    alert_type: AlertType.HIGH_RISK_ZONE_ENTRY,
    location_lat: 27.3500,
    location_lng: 88.6200,
    location_name: "Gangtok Periphery",
    status: AlertStatus.RESOLVED,
    message: "Tourist briefly entered high-risk zone, returned to safe area.",
    resolved_by: "Officer Kumar",
    resolved_at: "2026-08-20T11:00:00Z",
    created_at: "2026-08-20T10:30:00Z",
    severity: "medium",
  },
];

export const MOCK_ZONES: MockZone[] = [
  { id: "Z1", name: "Gangtok City Center", risk_level: RiskLevel.LOW, tourist_count: 3, center_lat: 27.3389, center_lng: 88.6065 },
  { id: "Z2", name: "East Sikkim — High Risk", risk_level: RiskLevel.HIGH, tourist_count: 2, center_lat: 27.4100, center_lng: 88.7200 },
  { id: "Z3", name: "Restricted Border Area", risk_level: RiskLevel.RESTRICTED, tourist_count: 1, center_lat: 27.4500, center_lng: 88.7800 },
  { id: "Z4", name: "South Sikkim — Low Risk", risk_level: RiskLevel.LOW, tourist_count: 1, center_lat: 27.3100, center_lng: 88.6200 },
  { id: "Z5", name: "North Sikkim Mountain Pass", risk_level: RiskLevel.MEDIUM, tourist_count: 0, center_lat: 27.6900, center_lng: 88.7400 },
];

export const MOCK_OVERVIEW = {
  active_tourists: 5,
  active_alerts: 3,
  tourists_in_risk_zones: 2,
  ids_issued_today: 12,
  avg_safety_score: 74,
  high_risk_areas: 2,
};

export function getSafetyColor(score: number): string {
  if (score >= 80) return "success";
  if (score >= 60) return "warning";
  return "danger";
}

export function getSafetyLabel(score: number): string {
  if (score >= 80) return "Safe";
  if (score >= 60) return "Caution";
  return "At Risk";
}

export function getRiskColor(level: RiskLevel): string {
  switch (level) {
    case RiskLevel.LOW: return "success";
    case RiskLevel.MEDIUM: return "warning";
    case RiskLevel.HIGH: return "danger";
    case RiskLevel.RESTRICTED: return "danger";
    default: return "default";
  }
}

export function formatRelativeTime(dateStr: string): string {
  const now = new Date("2026-08-20T14:35:00Z");
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

export interface MockDigitalId {
  id: string;
  tourist_id: string;
  block_id: string;
  tourist_name: string;
  id_type: string;
  photo_url: string | null;
  trip_start: string;
  trip_end: string;
  status: IdStatus;
  issued_at: string;
  expires_at: string;
}

export const MOCK_DIGITAL_IDS: MockDigitalId[] = [
  {
    id: "DID-001",
    tourist_id: "TST-A1B2C3D4-E5F6",
    block_id: "BLK-9F8E7D6C-5A4B",
    tourist_name: "Priya Sharma",
    id_type: "Aadhaar",
    photo_url: null,
    trip_start: "2026-08-15",
    trip_end: "2026-08-25",
    status: IdStatus.ACTIVE,
    issued_at: "2026-08-15T10:30:00Z",
    expires_at: "2026-08-25T23:59:59Z",
  },
  {
    id: "DID-002",
    tourist_id: "TST-F7G8H9I0-J1K2",
    block_id: "BLK-1A2B3C4D-5E6F",
    tourist_name: "Arjun Patel",
    id_type: "Passport",
    photo_url: null,
    trip_start: "2026-08-18",
    trip_end: "2026-08-28",
    status: IdStatus.ACTIVE,
    issued_at: "2026-08-18T09:00:00Z",
    expires_at: "2026-08-28T23:59:59Z",
  },
  {
    id: "DID-003",
    tourist_id: "TST-L3M4N5O6-P7Q8",
    block_id: "BLK-7G8H9I0J-1K2L",
    tourist_name: "Mei Lin Wong",
    id_type: "Passport",
    photo_url: null,
    trip_start: "2026-08-10",
    trip_end: "2026-08-20",
    status: IdStatus.ACTIVE,
    issued_at: "2026-08-10T14:15:00Z",
    expires_at: "2026-08-20T23:59:59Z",
  },
  {
    id: "DID-004",
    tourist_id: "TST-D1E2F3G4-H5I6",
    block_id: "BLK-M3N4O5P6-Q7R8",
    tourist_name: "Rohit Verma",
    id_type: "Aadhaar",
    photo_url: null,
    trip_start: "2026-08-01",
    trip_end: "2026-08-10",
    status: IdStatus.EXPIRED,
    issued_at: "2026-08-01T08:00:00Z",
    expires_at: "2026-08-10T23:59:59Z",
  },
  {
    id: "DID-005",
    tourist_id: "TST-X5Y6Z7A8-B9C0",
    block_id: "BLK-S1T2U3V4-W5X6",
    tourist_name: "Ananya Reddy",
    id_type: "Aadhaar",
    photo_url: null,
    trip_start: "2026-08-19",
    trip_end: "2026-08-27",
    status: IdStatus.REVOKED,
    issued_at: "2026-08-19T11:00:00Z",
    expires_at: "2026-08-27T23:59:59Z",
  },
];

export function lookupDigitalId(touristId: string, blockId?: string): MockDigitalId | null {
  return MOCK_DIGITAL_IDS.find(
    (d) =>
      d.tourist_id.toLowerCase() === touristId.toLowerCase() &&
      (!blockId || d.block_id.toLowerCase() === blockId.toLowerCase())
  ) || null;
}

export function maskName(name: string): string {
  if (!name) return "••••••••";
  const parts = name.trim().split(" ");
  if (parts.length === 1) {
    return parts[0][0] + parts[0].slice(1).replace(/./g, "•");
  }
  return parts
    .map((p, i) =>
      i === 0 || i === parts.length - 1
        ? p[0] + p.slice(1).replace(/./g, "•")
        : "•".repeat(p.length)
    )
    .join(" ");
}
