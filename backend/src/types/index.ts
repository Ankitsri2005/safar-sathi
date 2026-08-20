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
  password_hash: string;
  full_name: string;
  role: UserRole;
  jurisdiction: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
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
  trip_start: Date;
  trip_end: Date;
  itinerary: ItineraryItem[];
  created_at: Date;
  updated_at: Date;
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
  issued_at: Date;
  expires_at: Date;
}

export interface BlockchainBlock {
  block_id: string;
  tourist_id: string;
  data_hash: string;
  issue_timestamp: Date;
  expiry_timestamp: Date;
  previous_block_hash: string;
  current_block_hash: string;
}

export interface Alert {
  id: string;
  tourist_id: string;
  alert_type: AlertType;
  location_lat: number;
  location_lng: number;
  location_name: string | null;
  status: AlertStatus;
  message: string | null;
  resolved_by: string | null;
  resolved_at: Date | null;
  created_at: Date;
}

export interface Zone {
  id: string;
  name: string;
  risk_level: RiskLevel;
  description: string | null;
  polygon_geojson: string;
  created_at: Date;
  updated_at: Date;
}

export interface LocationPing {
  id: string;
  tourist_id: string;
  lat: number;
  lng: number;
  source: "phone";
  timestamp: Date;
}

export interface Efir {
  id: string;
  alert_id: string;
  tourist_id: string;
  status: EfirStatus;
  pdf_url: string | null;
  filed_by: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface JwtPayload {
  userId: string;
  role: UserRole;
}
