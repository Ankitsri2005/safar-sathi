import db from "../config/database";

/**
 * Data retention cleanup service.
 * Runs periodically to enforce data retention policies.
 */

const RETENTION = {
  location_pings_days: 90,    // Keep location pings for 90 days
  notifications_days: 180,    // Keep notifications for 180 days
  audit_logs_days: 365,       // Keep audit logs for 1 year
  alert_cooldowns_days: 30,   // Clean up old cooldown entries
};

/**
 * Expire digital IDs past their expires_at date.
 */
export async function expireDigitalIds(): Promise<number> {
  const result = await db("digital_ids")
    .where("expires_at", "<", new Date())
    .where("status", "!=", "expired")
    .update({ status: "expired", updated_at: new Date() });
  return result;
}

/**
 * Purge location pings older than retention period.
 */
export async function purgeOldLocationPings(): Promise<number> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - RETENTION.location_pings_days);
  const result = await db("location_pings").where("timestamp", "<", cutoff).del();
  return result;
}

/**
 * Purge old notifications.
 */
export async function purgeOldNotifications(): Promise<number> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - RETENTION.notifications_days);
  const result = await db("notifications").where("created_at", "<", cutoff).del();
  return result;
}

/**
 * Purge old audit logs (keep for 1 year by default).
 */
export async function purgeOldAuditLogs(): Promise<number> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - RETENTION.audit_logs_days);
  const result = await db("audit_logs").where("created_at", "<", cutoff).del();
  return result;
}

/**
 * Clean up expired alert cooldown entries.
 */
export async function cleanExpiredCooldowns(): Promise<number> {
  const result = await db("alert_cooldowns")
    .where("expires_at", "<", new Date())
    .del();
  return result;
}

/**
 * Run all retention cleanup tasks.
 * Returns summary of what was cleaned up.
 */
export async function runRetentionCleanup(): Promise<{
  expired_ids: number;
  old_pings: number;
  old_notifications: number;
  old_audit_logs: number;
  expired_cooldowns: number;
}> {
  const [expired_ids, old_pings, old_notifications, old_audit_logs, expired_cooldowns] = await Promise.all([
    expireDigitalIds(),
    purgeOldLocationPings(),
    purgeOldNotifications(),
    purgeOldAuditLogs(),
    cleanExpiredCooldowns(),
  ]);

  console.log("[RETENTION] Cleanup complete:", {
    expired_ids, old_pings, old_notifications, old_audit_logs, expired_cooldowns,
  });

  return { expired_ids, old_pings, old_notifications, old_audit_logs, expired_cooldowns };
}
