export enum UserRole {
  POLICE = "police",
  TOURISM = "tourism_dept",
  ADMIN = "admin",
}

export enum AlertType {
  PANIC = "panic",
  ANOMALY = "anomaly",
  GEOFENCE_BREACH = "geofence_breach",
}

export enum AlertStatus {
  NEW = "new",
  UNDER_REVIEW = "under_review",
  RESOLVED = "resolved",
}

export enum RiskLevel {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  RESTRICTED = "restricted",
}

export enum IdStatus {
  ACTIVE = "active",
  EXPIRED = "expired",
  REVOKED = "revoked",
}

export enum EfirStatus {
  DRAFT = "draft",
  FILED = "filed",
  CLOSED = "closed",
}

export interface User {
  id: string;
  username: string;
  full_name: string;
  role: UserRole;
  jurisdiction: string;
}

export interface Tourist {
  id: string;
  full_name: string;
  id_type: string;
  id_number: string;
  phone: string;
  email: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  photo_url: string | null;
  trip_start: string;
  trip_end: string;
  itinerary: ItineraryItem[];
  created_at: string;
}

export interface ItineraryItem {
  place: string;
  lat: number;
  lng: number;
  planned_date: string;
}

export interface DigitalId {
  id: string;
  tourist_id: string;
  block_id: string;
  qr_data: string;
  status: IdStatus;
  issued_at: string;
  expires_at: string;
  tourist_name?: string;
}

export interface Alert {
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
}

export interface Zone {
  id: string;
  name: string;
  risk_level: RiskLevel;
  description: string | null;
  polygon_geojson: string;
}

export interface Efir {
  id: string;
  alert_id: string;
  tourist_id: string;
  tourist_name: string;
  status: EfirStatus;
  pdf_url: string | null;
  filed_by: string | null;
  created_at: string;
}

export interface OverviewStats {
  active_tourists: number;
  active_alerts: number;
  ids_issued_today: number;
  total_active_ids: number;
}

export interface ActiveTouristLocation {
  id: string;
  full_name: string;
  lat: number;
  lng: number;
  block_id: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
}
