import { v4 as uuidv4 } from "uuid";
import db from "../config/database";
import { Alert, AlertType, AlertStatus } from "../types";

const TABLE = "alerts";
const COOLDOWN_TABLE = "alert_cooldowns";
const TIMELINE_TABLE = "alert_timeline";

// Cooldown periods per alert type (in minutes)
const COOLDOWN_MINUTES: Record<string, number> = {
  [AlertType.PANIC]: 0, // No cooldown for panic
  [AlertType.RESTRICTED_ZONE_ENTRY]: 30,
  [AlertType.HIGH_RISK_ZONE_ENTRY]: 30,
  [AlertType.NO_LOCATION_UPDATE]: 60,
  [AlertType.ROUTE_DEVIATION]: 15,
  [AlertType.PROLONGED_STOP]: 120,
  [AlertType.MANUAL]: 0,
};

// Severity mapping per alert type
const SEVERITY_MAP: Record<string, "low" | "medium" | "high" | "critical"> = {
  [AlertType.PANIC]: "critical",
  [AlertType.RESTRICTED_ZONE_ENTRY]: "critical",
  [AlertType.HIGH_RISK_ZONE_ENTRY]: "high",
  [AlertType.NO_LOCATION_UPDATE]: "medium",
  [AlertType.ROUTE_DEVIATION]: "medium",
  [AlertType.PROLONGED_STOP]: "high",
  [AlertType.MANUAL]: "medium",
};

/**
 * Check if an alert should be suppressed due to cooldown.
 * Returns true if the alert should be created (not suppressed).
 */
async function checkCooldown(
  touristId: string,
  alertType: AlertType
): Promise<boolean> {
  const cooldownMinutes = COOLDOWN_MINUTES[alertType] ?? 30;
  if (cooldownMinutes === 0) return true;

  const lastFired = await db(COOLDOWN_TABLE)
    .where({ tourist_id: touristId, alert_type: alertType })
    .first();

  if (!lastFired) return true;

  const elapsed = Date.now() - new Date(lastFired.last_fired_at).getTime();
  return elapsed > cooldownMinutes * 60 * 1000;
}

/**
 * Record a cooldown firing for duplicate prevention.
 */
async function recordCooldown(
  touristId: string,
  alertType: AlertType
): Promise<void> {
  const existing = await db(COOLDOWN_TABLE)
    .where({ tourist_id: touristId, alert_type: alertType })
    .first();

  if (existing) {
    await db(COOLDOWN_TABLE)
      .where({ id: existing.id })
      .update({ last_fired_at: new Date(), updated_at: new Date() });
  } else {
    await db(COOLDOWN_TABLE).insert({
      id: uuidv4(),
      tourist_id: touristId,
      alert_type: alertType,
      last_fired_at: new Date(),
    });
  }
}

/**
 * Create an alert with duplicate prevention.
 * Returns null if the alert was suppressed by cooldown.
 */
export async function createAlert(data: {
  tourist_id: string;
  alert_type: AlertType;
  location_lat: number;
  location_lng: number;
  location_name?: string;
  message?: string;
  severity?: "low" | "medium" | "high" | "critical";
}): Promise<Alert | null> {
  // Check cooldown (skip for manual alerts)
  if (data.alert_type !== AlertType.MANUAL) {
    const allowed = await checkCooldown(data.tourist_id, data.alert_type);
    if (!allowed) return null;
  }

  const severity = data.severity || SEVERITY_MAP[data.alert_type] || "medium";

  const [alert] = await db(TABLE)
    .insert({
      id: uuidv4(),
      ...data,
      severity,
      status: AlertStatus.NEW,
    })
    .returning("*");

  // Record cooldown
  if (data.alert_type !== AlertType.MANUAL) {
    await recordCooldown(data.tourist_id, data.alert_type);
  }

  // Add timeline entry
  await addTimelineEntry(alert.id, "created", "system", `Alert created: ${data.alert_type}`);

  // Broadcast to connected dashboard clients
  try {
    const { io } = await import("../server");
    io.emit("alert:new", alert);
  } catch {}

  // Send notifications to all active officers
  try {
    const { notifyAlertCreated } = await import("./notification");
    await notifyAlertCreated({ ...alert, tourist_name: data.message });
  } catch {}

  return alert;
}

/**
 * Add a timeline entry to an alert.
 */
export async function addTimelineEntry(
  alertId: string,
  action: string,
  performedBy: string,
  notes?: string
): Promise<void> {
  await db(TIMELINE_TABLE).insert({
    id: uuidv4(),
    alert_id: alertId,
    action,
    performed_by: performedBy,
    notes,
  });
}

/**
 * Get the timeline for an alert.
 */
export async function getAlertTimeline(
  alertId: string
): Promise<{ action: string; performed_by: string | null; notes: string | null; created_at: Date }[]> {
  return db(TIMELINE_TABLE)
    .where({ alert_id: alertId })
    .orderBy("created_at", "asc");
}

export async function listAlerts(filters?: {
  status?: AlertStatus;
  alert_type?: AlertType;
  severity?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{ data: (Alert & { tourist_name: string })[]; total: number }> {
  const page = filters?.page || 1;
  const limit = filters?.limit || 20;

  let query = db(TABLE)
    .join("tourists", "alerts.tourist_id", "tourists.id");

  if (filters?.status) {
    query = query.where("alerts.status", filters.status);
  }
  if (filters?.alert_type) {
    query = query.where("alerts.alert_type", filters.alert_type);
  }
  if (filters?.severity) {
    query = query.where("alerts.severity", filters.severity);
  }
  if (filters?.search) {
    query = query.where(function () {
      this.where("tourists.full_name", "ilike", `%${filters.search}%`)
        .orWhere("alerts.location_name", "ilike", `%${filters.search}%`)
        .orWhere("alerts.message", "ilike", `%${filters.search}%`);
    });
  }

  const countResult = await query.clone().count("alerts.id as total").first();
  const total = parseInt((countResult as any)?.total || "0", 10);

  const data = await query
    .select("alerts.*", "tourists.full_name as tourist_name")
    .orderBy("alerts.created_at", "desc")
    .offset((page - 1) * limit)
    .limit(limit);

  return { data, total };
}

export async function getAlertById(id: string): Promise<(Alert & { tourist_name: string }) | null> {
  const alert = await db(TABLE)
    .join("tourists", "alerts.tourist_id", "tourists.id")
    .select("alerts.*", "tourists.full_name as tourist_name")
    .where("alerts.id", id)
    .first();
  return alert || null;
}

export async function updateAlertStatus(
  id: string,
  status: AlertStatus,
  resolvedBy?: string,
  notes?: string
): Promise<Alert | null> {
  const updateData: Record<string, any> = { status };
  if (status === AlertStatus.RESOLVED && resolvedBy) {
    updateData.resolved_by = resolvedBy;
    updateData.resolved_at = new Date();
  }
  const [alert] = await db(TABLE)
    .where({ id })
    .update(updateData)
    .returning("*");

  if (alert) {
    await addTimelineEntry(id, status, resolvedBy || "system", notes);
  }

  return alert || null;
}

export async function getActiveAlertCount(): Promise<number> {
  const result = await db(TABLE)
    .whereNot("status", AlertStatus.RESOLVED)
    .whereNot("status", AlertStatus.FALSE_POSITIVE)
    .count("id as count")
    .first();
  return parseInt((result as any)?.count || "0", 10);
}

export async function getRecentAlerts(limit: number = 10): Promise<(Alert & { tourist_name: string })[]> {
  return db(TABLE)
    .join("tourists", "alerts.tourist_id", "tourists.id")
    .select("alerts.*", "tourists.full_name as tourist_name")
    .orderBy("alerts.created_at", "desc")
    .limit(limit);
}

export async function getAlertStats(): Promise<{
  total: number;
  new: number;
  acknowledged: number;
  under_review: number;
  escalated: number;
  resolved: number;
  false_positive: number;
}> {
  const rows = await db(TABLE)
    .select("status")
    .count("id as count")
    .groupBy("status");

  const stats = {
    total: 0,
    new: 0,
    acknowledged: 0,
    under_review: 0,
    escalated: 0,
    resolved: 0,
    false_positive: 0,
  };

  for (const row of rows) {
    const count = parseInt((row as any).count || "0", 10);
    stats.total += count;
    const status = (row as any).status as string;
    if (status in stats) {
      (stats as any)[status] = count;
    }
  }

  return stats;
}

export async function updateAlertTriage(
  id: string,
  triageStatus: string,
  triageTranscript: any,
  triageRecordingUrl?: string
): Promise<Alert | null> {
  const [alert] = await db(TABLE)
    .where({ id })
    .update({
      triage_status: triageStatus,
      triage_transcript: typeof triageTranscript === "string" ? triageTranscript : JSON.stringify(triageTranscript),
      triage_recording_url: triageRecordingUrl || null
    })
    .returning("*");
  
  if (alert) {
    await addTimelineEntry(id, `triage_${triageStatus}`, "AI Assistant", `AI completed triage and verified situation.`);
  }
  return alert || null;
}
