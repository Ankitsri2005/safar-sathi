import db from "../config/database";

export type AuditEventType =
  | "login" | "logout" | "tourist_record_access" | "id_verification"
  | "alert_viewing" | "alert_resolution" | "zone_creation" | "zone_modification"
  | "user_modification" | "user_creation" | "user_disable" | "password_reset"
  | "efir_generation" | "data_export" | "system_config" | "escalation";

interface AuditLogData {
  user_id?: string;
  user_name?: string;
  user_role?: string;
  event_type: AuditEventType;
  resource_type?: string;
  resource_id?: string;
  details?: any;
  ip_address?: string;
  user_agent?: string;
}

/**
 * Record an audit event.
 */
export async function logAudit(data: AuditLogData): Promise<void> {
  try {
    await db("audit_logs").insert({
      ...data,
      created_at: new Date(),
    });
  } catch (err) {
    console.error("[AUDIT] Failed to log:", err);
  }
}

/**
 * Record audit from an Express request context.
 */
export async function logFromRequest(
  req: any,
  eventType: AuditEventType,
  data?: Partial<AuditLogData>
): Promise<void> {
  await logAudit({
    user_id: req.user?.userId,
    user_name: req.user?.full_name,
    user_role: req.user?.role,
    event_type: eventType,
    ip_address: req.ip || req.connection?.remoteAddress,
    user_agent: req.headers?.["user-agent"],
    ...data,
  });
}

/**
 * List audit logs with filters and pagination.
 */
export async function listAuditLogs(filters?: {
  user_id?: string;
  event_type?: AuditEventType;
  resource_type?: string;
  search?: string;
  from_date?: string;
  to_date?: string;
  page?: number;
  limit?: number;
}): Promise<{ data: any[]; total: number }> {
  const page = filters?.page || 1;
  const limit = filters?.limit || 50;

  let query = db("audit_logs").select("*");

  if (filters?.user_id) {
    query = query.where("user_id", filters.user_id);
  }
  if (filters?.event_type) {
    query = query.where("event_type", filters.event_type);
  }
  if (filters?.resource_type) {
    query = query.where("resource_type", filters.resource_type);
  }
  if (filters?.from_date) {
    query = query.where("created_at", ">=", filters.from_date);
  }
  if (filters?.to_date) {
    query = query.where("created_at", "<=", filters.to_date);
  }
  if (filters?.search) {
    query = query.where(function () {
      this.where("user_name", "ilike", `%${filters.search}%`)
        .orWhere("resource_type", "ilike", `%${filters.search}%`)
        .orWhereRaw("details::text ILIKE ?", [`%${filters.search}%`]);
    });
  }

  const countResult = await query.clone().count("id as total").first();
  const total = parseInt((countResult as any)?.total || "0", 10);

  const data = await query
    .orderBy("created_at", "desc")
    .offset((page - 1) * limit)
    .limit(limit);

  return { data, total };
}

/**
 * Get audit stats summary.
 */
export async function getAuditStats(): Promise<{
  total_events: number;
  today_events: number;
  unique_users_today: number;
  top_events: { event_type: string; count: number }[];
}> {
  const [totalRow] = await db("audit_logs").count("id as count");
  const [todayRow] = await db("audit_logs")
    .whereRaw("DATE(created_at) = CURRENT_DATE")
    .count("id as count");
  const [uniqueRow] = await db("audit_logs")
    .whereRaw("DATE(created_at) = CURRENT_DATE")
    .countDistinct("user_id as count");

  const topEvents = await db("audit_logs")
    .whereRaw("created_at >= NOW() - INTERVAL '7 days'")
    .select("event_type")
    .count("id as count")
    .groupBy("event_type")
    .orderBy("count", "desc")
    .limit(10);

  return {
    total_events: parseInt((totalRow as any)?.count || "0", 10),
    today_events: parseInt((todayRow as any)?.count || "0", 10),
    unique_users_today: parseInt((uniqueRow as any)?.count || "0", 10),
    top_events: topEvents,
  };
}

/**
 * Get user activity summary.
 */
export async function getUserActivity(userId: string): Promise<{
  total_events: number;
  last_login: any;
  event_breakdown: { event_type: string; count: number }[];
}> {
  const [totalRow] = await db("audit_logs").where({ user_id: userId }).count("id as count");
  const lastLogin = await db("audit_logs")
    .where({ user_id: userId, event_type: "login" })
    .orderBy("created_at", "desc")
    .first();
  const breakdown = await db("audit_logs")
    .where({ user_id: userId })
    .select("event_type")
    .count("id as count")
    .groupBy("event_type")
    .orderBy("count", "desc");

  return {
    total_events: parseInt((totalRow as any)?.count || "0", 10),
    last_login: lastLogin || null,
    event_breakdown: breakdown,
  };
}
