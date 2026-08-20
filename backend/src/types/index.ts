export enum UserRole {
  POLICE = "police",
  TOURISM = "tourism_dept",
  ADMIN = "admin",
  VERIFICATION = "verification",
}

export enum AlertType {
  PANIC = "panic",
  RESTRICTED_ZONE_ENTRY = "restricted_zone_entry",
  HIGH_RISK_ZONE_ENTRY = "high_risk_zone_entry",
  NO_LOCATION_UPDATE = "no_location_update",
  ROUTE_DEVIATION = "route_deviation",
  PROLONGED_STOP = "prolonged_stop",
  MANUAL = "manual",
}

export enum AlertStatus {
  NEW = "new",
  ACKNOWLEDGED = "acknowledged",
  UNDER_REVIEW = "under_review",
  ESCALATED = "escalated",
  RESOLVED = "resolved",
  FALSE_POSITIVE = "false_positive",
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
  GENERATED = "generated",
  FILED = "filed",
  CLOSED = "closed",
  CANCELLED = "cancelled",
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
  severity: "low" | "medium" | "high" | "critical";
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
  efir_number: string;
  alert_id: string;
  tourist_id: string;
  status: EfirStatus;
  pdf_url: string | null;
  filed_by: string | null;
  incident_type: string | null;
  incident_severity: string | null;
  incident_date: Date | null;
  last_known_lat: number | null;
  last_known_lng: number | null;
  last_known_location_name: string | null;
  location_history: any;
  officer_info: any;
  incident_description: string | null;
  resolution_status: string | null;
  verification_status: string | null;
  blockchain_hash: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface JwtPayload {
  userId: string;
  role: UserRole;
}

export enum NotificationType {
  PANIC_ALERT = "panic_alert",
  RESTRICTED_ZONE_ENTRY = "restricted_zone_entry",
  HIGH_RISK_ZONE_ENTRY = "high_risk_zone_entry",
  AI_ANOMALY = "ai_anomaly",
  ALERT_ESCALATION = "alert_escalation",
  DIGITAL_ID_EXPIRY = "digital_id_expiry",
  EFIR_GENERATION = "efir_generation",
  SYSTEM = "system",
}

export enum NotificationChannel {
  IN_APP = "in_app",
  PUSH = "push",
  SMS = "sms",
  EMAIL = "email",
  ESCALATION = "escalation",
}

export enum NotificationStatus {
  PENDING = "pending",
  SENT = "sent",
  DELIVERED = "delivered",
  FAILED = "failed",
  RETRYING = "retrying",
}

export interface Notification {
  id: string;
  recipient_id: string | null;
  recipient_phone: string | null;
  recipient_email: string | null;
  notification_type: NotificationType;
  channel: NotificationChannel;
  title: string;
  body: string;
  metadata: any;
  status: NotificationStatus;
  error_message: string | null;
  retry_count: number;
  max_retries: number;
  sent_at: Date | null;
  delivered_at: Date | null;
  next_retry_at: Date | null;
  read: boolean;
  read_at: Date | null;
  created_at: Date;
}

export interface NotificationPreference {
  id: string;
  user_id: string;
  panic_alert_push: boolean;
  panic_alert_sms: boolean;
  panic_alert_in_app: boolean;
  restricted_zone_push: boolean;
  restricted_zone_sms: boolean;
  restricted_zone_in_app: boolean;
  high_risk_zone_push: boolean;
  high_risk_zone_sms: boolean;
  high_risk_zone_in_app: boolean;
  ai_anomaly_push: boolean;
  ai_anomaly_sms: boolean;
  ai_anomaly_in_app: boolean;
  escalation_push: boolean;
  escalation_sms: boolean;
  escalation_in_app: boolean;
  digital_id_expiry_push: boolean;
  digital_id_expiry_in_app: boolean;
  efir_push: boolean;
  efir_in_app: boolean;
  sms_enabled: boolean;
  push_enabled: boolean;
}

export interface EscalationRule {
  id: string;
  name: string;
  alert_type: AlertType | null;
  severity: string | null;
  escalate_after_minutes: number;
  escalate_to_user_id: string | null;
  escalate_to_role: string | null;
  is_active: boolean;
}

export interface EscalationLog {
  id: string;
  alert_id: string;
  escalated_from_user_id: string | null;
  escalated_to_user_id: string | null;
  escalation_level: number;
  reason: string | null;
  created_at: Date;
}
