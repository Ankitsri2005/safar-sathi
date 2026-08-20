export enum UserRole {
  ADMIN = "admin",
  POLICE = "police",
  TOURISM = "tourism_dept",
  VERIFICATION = "verification",
}

export const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.ADMIN]: "Administrator",
  [UserRole.POLICE]: "Police Officer",
  [UserRole.TOURISM]: "Tourism Officer",
  [UserRole.VERIFICATION]: "Verification Officer",
};

export const ROLE_COLORS: Record<UserRole, string> = {
  [UserRole.ADMIN]: "danger",
  [UserRole.POLICE]: "primary",
  [UserRole.TOURISM]: "success",
  [UserRole.VERIFICATION]: "accent",
} as const;

export enum AlertType {
  PANIC = "panic",
  RESTRICTED_ZONE_ENTRY = "restricted_zone_entry",
  HIGH_RISK_ZONE_ENTRY = "high_risk_zone_entry",
  NO_LOCATION_UPDATE = "no_location_update",
  ROUTE_DEVIATION = "route_deviation",
  PROLONGED_STOP = "prolonged_stop",
  MANUAL = "manual",
}

export const ALERT_TYPE_LABELS: Record<string, string> = {
  panic: "Panic Button",
  restricted_zone_entry: "Restricted Zone Entry",
  high_risk_zone_entry: "High-Risk Zone Entry",
  no_location_update: "No Location Update",
  route_deviation: "Route Deviation",
  prolonged_stop: "Prolonged Stop",
  manual: "Manual Alert",
};

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

export const EfirStatusColors: Record<string, string> = {
  draft: "default",
  generated: "primary",
  filed: "success",
  closed: "accent",
  cancelled: "danger",
};

export const EfirStatusLabel: Record<string, string> = {
  draft: "Draft",
  generated: "Generated",
  filed: "Filed",
  closed: "Closed",
  cancelled: "Cancelled",
};

export interface User {
  id: string;
  username: string;
  full_name: string;
  role: UserRole;
  jurisdiction: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
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
  consent_tracking: boolean;
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
  severity: "low" | "medium" | "high" | "critical";
  message: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
}

export interface AlertTimelineEntry {
  action: string;
  performed_by: string | null;
  notes: string | null;
  created_at: string;
}

export interface Zone {
  id: string;
  name: string;
  risk_level: RiskLevel;
  description: string | null;
  polygon_geojson: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Efir {
  id: string;
  efir_number: string;
  alert_id: string;
  tourist_id: string;
  tourist_name: string;
  tourist_id_number: string;
  tourist_id_type: string;
  tourist_phone: string;
  tourist_email: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  status: EfirStatus;
  pdf_url: string | null;
  filed_by: string | null;
  incident_type: string | null;
  incident_severity: string | null;
  incident_date: string | null;
  last_known_lat: number | null;
  last_known_lng: number | null;
  last_known_location_name: string | null;
  location_history: any;
  officer_info: any;
  incident_description: string | null;
  resolution_status: string | null;
  verification_status: string | null;
  blockchain_hash: string | null;
  alert_type: string;
  alert_severity: string;
  alert_lat: number;
  alert_lng: number;
  alert_location_name: string;
  alert_message: string;
  alert_created_at: string;
  officer_name: string;
  officer_role: string;
  officer_jurisdiction: string;
  created_at: string;
  updated_at: string;
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

export interface AIAnalysisResult {
  id: string;
  tourist_id: string;
  anomaly_score: number;
  risk_level: "low" | "medium" | "high" | "critical";
  reasons: string[];
  related_points: { lat: number; lng: number; timestamp: string }[];
  recommended_action: string;
  model_version: string;
  features: Record<string, number>;
  contributions: AIContribution[];
  created_at: string;
}

export interface AIContribution {
  feature: string;
  value: number;
  importance: number;
  normalized_value: number;
  contribution_score: number;
  is_anomalous: boolean;
}

export interface AIStats {
  total_analyses: number;
  anomalies_detected: number;
  high_risk_count: number;
  critical_count: number;
  avg_score: number;
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
  sent_at: string | null;
  delivered_at: string | null;
  next_retry_at: string | null;
  read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface EscalationRule {
  id: string;
  name: string;
  alert_type: string | null;
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
  escalated_from_user_name: string | null;
  escalated_to_user_name: string | null;
  escalation_level: number;
  reason: string | null;
  created_at: string;
}

export type AuditEventType =
  | "login" | "logout" | "tourist_record_access" | "id_verification"
  | "alert_viewing" | "alert_resolution" | "zone_creation" | "zone_modification"
  | "user_modification" | "user_creation" | "user_disable" | "password_reset"
  | "efir_generation" | "data_export" | "system_config" | "escalation";

export const AUDIT_EVENT_LABELS: Record<string, string> = {
  login: "Login",
  logout: "Logout",
  tourist_record_access: "Tourist Record Access",
  id_verification: "ID Verification",
  alert_viewing: "Alert Viewing",
  alert_resolution: "Alert Resolution",
  zone_creation: "Zone Creation",
  zone_modification: "Zone Modification",
  user_modification: "User Modification",
  user_creation: "User Creation",
  user_disable: "User Disabled",
  password_reset: "Password Reset",
  efir_generation: "E-FIR Generation",
  data_export: "Data Export",
  system_config: "System Config",
  escalation: "Escalation",
};

export const AUDIT_EVENT_COLORS: Record<string, string> = {
  login: "text-success",
  logout: "text-muted",
  tourist_record_access: "text-primary",
  id_verification: "text-accent",
  alert_viewing: "text-warning",
  alert_resolution: "text-success",
  zone_creation: "text-primary",
  zone_modification: "text-warning",
  user_modification: "text-danger",
  user_creation: "text-success",
  user_disable: "text-danger",
  password_reset: "text-warning",
  efir_generation: "text-accent",
  data_export: "text-muted",
  system_config: "text-muted",
  escalation: "text-danger",
};

export interface AuditLog {
  id: string;
  user_id: string | null;
  user_name: string | null;
  user_role: string | null;
  event_type: AuditEventType;
  resource_type: string | null;
  resource_id: string | null;
  details: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}
