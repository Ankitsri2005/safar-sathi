import { v4 as uuidv4 } from "uuid";
import db from "../config/database";
import { Alert, AlertType, AlertStatus } from "../types";

const TABLE = "alerts";

export async function createAlert(data: {
  tourist_id: string;
  alert_type: AlertType;
  location_lat: number;
  location_lng: number;
  location_name?: string;
  message?: string;
}): Promise<Alert> {
  const [alert] = await db(TABLE)
    .insert({
      id: uuidv4(),
      ...data,
      status: AlertStatus.NEW,
    })
    .returning("*");
  return alert;
}

export async function listAlerts(filters?: {
  status?: AlertStatus;
  alert_type?: AlertType;
  page?: number;
  limit?: number;
}): Promise<{ data: (Alert & { tourist_name: string })[]; total: number }> {
  const page = filters?.page || 1;
  const limit = filters?.limit || 20;

  let query = db(TABLE)
    .join("tourists", "alerts.tourist_id", "tourists.id")
    .select("alerts.*", "tourists.full_name as tourist_name");

  if (filters?.status) {
    query = query.where("alerts.status", filters.status);
  }
  if (filters?.alert_type) {
    query = query.where("alerts.alert_type", filters.alert_type);
  }

  const countResult = await query.clone().count("alerts.id as total").first();
  const total = parseInt((countResult as any)?.total || "0", 10);

  const data = await query
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
  resolvedBy?: string
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
  return alert || null;
}

export async function getActiveAlertCount(): Promise<number> {
  const result = await db(TABLE)
    .whereNot("status", AlertStatus.RESOLVED)
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
