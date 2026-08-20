import { v4 as uuidv4 } from "uuid";
import db from "../config/database";
import {
  Notification,
  NotificationType,
  NotificationChannel,
  NotificationStatus,
  Alert,
  AlertType,
} from "../types";

const TABLE = "notifications";
const PREFS_TABLE = "notification_preferences";

/**
 * Get notification preferences for a user.
 */
export async function getPreferences(userId: string) {
  let prefs = await db(PREFS_TABLE).where({ user_id: userId }).first();
  if (!prefs) {
    [prefs] = await db(PREFS_TABLE)
      .insert({ id: uuidv4(), user_id: userId })
      .returning("*");
  }
  return prefs;
}

/**
 * Check if a user wants a specific channel for a notification type.
 */
function wantsChannel(
  prefs: any,
  notifType: NotificationType,
  channel: NotificationChannel
): boolean {
  if (channel === NotificationChannel.IN_APP) return prefs[`${notifType}_in_app`] ?? true;
  if (channel === NotificationChannel.PUSH) return prefs[`${notifType}_push`] ?? false;
  if (channel === NotificationChannel.SMS) {
    if (notifType.includes("expiry") || notifType.includes("efir")) return false;
    return prefs[`${notifType}_sms`] ?? false;
  }
  return false;
}

/**
 * Create a notification record.
 */
export async function createNotification(data: {
  recipient_id?: string;
  recipient_phone?: string;
  recipient_email?: string;
  notification_type: NotificationType;
  channel: NotificationChannel;
  title: string;
  body: string;
  metadata?: any;
}): Promise<Notification> {
  const [notif] = await db(TABLE)
    .insert({
      id: uuidv4(),
      ...data,
      status: NotificationStatus.PENDING,
    })
    .returning("*");
  return notif;
}

/**
 * Mark notification as sent.
 */
export async function markSent(id: string): Promise<void> {
  await db(TABLE).where({ id }).update({
    status: NotificationStatus.SENT,
    sent_at: new Date(),
  });
}

/**
 * Mark notification as delivered.
 */
export async function markDelivered(id: string): Promise<void> {
  await db(TABLE).where({ id }).update({
    status: NotificationStatus.DELIVERED,
    delivered_at: new Date(),
  });
}

/**
 * Mark notification as failed with error.
 */
export async function markFailed(id: string, error: string): Promise<void> {
  await db(TABLE).where({ id }).update({
    status: NotificationStatus.FAILED,
    error_message: error,
  });
}

/**
 * Schedule a retry for a failed notification.
 */
export async function scheduleRetry(id: string): Promise<void> {
  const notif = await db(TABLE).where({ id }).first();
  if (!notif) return;

  if (notif.retry_count >= notif.max_retries) {
    await markFailed(id, "Max retries exceeded");
    return;
  }

  const delayMinutes = Math.pow(2, notif.retry_count) * 5; // exponential: 5, 10, 20 min
  const nextRetry = new Date(Date.now() + delayMinutes * 60 * 1000);

  await db(TABLE).where({ id }).update({
    status: NotificationStatus.RETRYING,
    retry_count: notif.retry_count + 1,
    next_retry_at: nextRetry,
  });
}

/**
 * Get pending notifications that are due for retry.
 */
export async function getPendingRetries(): Promise<Notification[]> {
  return db(TABLE)
    .where("status", NotificationStatus.RETRYING)
    .where("next_retry_at", "<=", new Date())
    .orderBy("next_retry_at", "asc")
    .limit(50);
}

/**
 * Send a notification through all enabled channels for a user.
 */
export async function sendNotification(data: {
  recipient_id?: string;
  notification_type: NotificationType;
  title: string;
  body: string;
  metadata?: any;
  alert_id?: string;
  alert?: Alert;
  recipient_phone?: string;
}): Promise<Notification[]> {
  const results: Notification[] = [];

  // Always create in-app notification
  const inApp = await createNotification({
    recipient_id: data.recipient_id,
    notification_type: data.notification_type,
    channel: NotificationChannel.IN_APP,
    title: data.title,
    body: data.body,
    metadata: { ...data.metadata, alert_id: data.alert_id },
  });
  await markSent(inApp.id);
  await markDelivered(inApp.id);
  results.push(inApp);

  // Broadcast real-time via Socket.IO
  try {
    const { io } = await import("../server");
    if (data.recipient_id) {
      io.to(`user:${data.recipient_id}`).emit("notification:new", inApp);
    }
    io.emit("notification:broadcast", inApp);
  } catch {}

  // Check user preferences for push/SMS
  if (data.recipient_id) {
    const prefs = await getPreferences(data.recipient_id);

    // Push notification
    if (wantsChannel(prefs, data.notification_type, NotificationChannel.PUSH)) {
      const push = await createNotification({
        recipient_id: data.recipient_id,
        notification_type: data.notification_type,
        channel: NotificationChannel.PUSH,
        title: data.title,
        body: data.body,
        metadata: data.metadata,
      });
      try {
        const { sendPushNotification } = await import("./push");
        await sendPushNotification(data.recipient_id, data.title, data.body, data.metadata);
        await markSent(push.id);
        await markDelivered(push.id);
      } catch (err: any) {
        await scheduleRetry(push.id);
      }
      results.push(push);
    }

    // SMS notification
    if (
      wantsChannel(prefs, data.notification_type, NotificationChannel.SMS) &&
      prefs.sms_enabled
    ) {
      const phone = data.recipient_phone || prefs.recipient_phone;
      if (phone) {
        const sms = await createNotification({
          recipient_id: data.recipient_id,
          recipient_phone: phone,
          notification_type: data.notification_type,
          channel: NotificationChannel.SMS,
          title: data.title,
          body: data.body,
          metadata: data.metadata,
        });
        try {
          const { sendSMS } = await import("./sms");
          await sendSMS(phone, data.body);
          await markSent(sms.id);
          await markDelivered(sms.id);
        } catch (err: any) {
          await scheduleRetry(sms.id);
        }
        results.push(sms);
      }
    }
  }

  return results;
}

/**
 * Notify about a new alert — sends to all eligible officers.
 */
export async function notifyAlertCreated(alert: Alert & { tourist_name?: string }): Promise<void> {
  const officers = await db("users").where({ is_active: true }).select("id", "role");
  const title = getAlertTitle(alert.alert_type);
  const body = `${title} — Tourist: ${alert.tourist_name || alert.tourist_id}`;

  for (const officer of officers) {
    await sendNotification({
      recipient_id: officer.id,
      notification_type: alertToNotifType(alert.alert_type),
      title,
      body,
      metadata: {
        alert_id: alert.id,
        tourist_id: alert.tourist_id,
        severity: alert.severity,
        location_lat: alert.location_lat,
        location_lng: alert.location_lng,
      },
      alert_id: alert.id,
    });
  }
}

/**
 * Notify about alert escalation.
 */
export async function notifyEscalation(
  alert: Alert,
  escalatedTo: string,
  level: number,
  reason: string
): Promise<void> {
  const title = `Alert Escalated (Level ${level})`;
  const body = `Alert for tourist ${alert.tourist_id} escalated. Reason: ${reason}`;

  await sendNotification({
    recipient_id: escalatedTo,
    notification_type: NotificationType.ALERT_ESCALATION,
    title,
    body,
    metadata: {
      alert_id: alert.id,
      tourist_id: alert.tourist_id,
      severity: alert.severity,
      escalation_level: level,
      reason,
    },
    alert_id: alert.id,
  });
}

/**
 * Notify about digital ID expiry.
 */
export async function notifyDigitalIdExpiry(
  touristId: string,
  touristName: string,
  expiresAt: Date
): Promise<void> {
  const officers = await db("users").where({ is_active: true }).select("id");
  const title = "Digital ID Expiring";
  const body = `Tourist ${touristName}'s digital ID expires at ${expiresAt.toISOString()}`;

  for (const officer of officers) {
    await sendNotification({
      recipient_id: officer.id,
      notification_type: NotificationType.DIGITAL_ID_EXPIRY,
      title,
      body,
      metadata: { tourist_id: touristId, expires_at: expiresAt },
    });
  }
}

/**
 * Notify about E-FIR generation.
 */
export async function notifyEfirGenerated(
  efirId: string,
  alertId: string,
  touristId: string
): Promise<void> {
  const officers = await db("users").where({ is_active: true }).select("id");
  const title = "E-FIR Generated";
  const body = `E-FIR ${efirId} generated for alert ${alertId}`;

  for (const officer of officers) {
    await sendNotification({
      recipient_id: officer.id,
      notification_type: NotificationType.EFIR_GENERATION,
      title,
      body,
      metadata: { efir_id: efirId, alert_id: alertId, tourist_id: touristId },
    });
  }
}

/**
 * Get user notifications.
 */
export async function getUserNotifications(
  userId: string,
  limit = 20,
  offset = 0
): Promise<{ data: Notification[]; total: number }> {
  const [countRow] = await db(TABLE)
    .where({ recipient_id: userId })
    .count("id as total");

  const data = await db(TABLE)
    .where({ recipient_id: userId })
    .orderBy("created_at", "desc")
    .offset(offset)
    .limit(limit);

  return { data, total: parseInt((countRow as any)?.total || "0", 10) };
}

/**
 * Get unread count for a user.
 */
export async function getUnreadCount(userId: string): Promise<number> {
  const [row] = await db(TABLE)
    .where({ recipient_id: userId, read: false })
    .count("id as count");
  return parseInt((row as any)?.count || "0", 10);
}

/**
 * Mark notifications as read.
 */
export async function markAsRead(userId: string, notificationIds?: string[]): Promise<void> {
  const query = db(TABLE).where({ recipient_id: userId, read: false });
  if (notificationIds?.length) {
    query.whereIn("id", notificationIds);
  }
  await query.update({ read: true, read_at: new Date() });
}

/**
 * Mark all as read for a user.
 */
export async function markAllAsRead(userId: string): Promise<void> {
  await db(TABLE)
    .where({ recipient_id: userId, read: false })
    .update({ read: true, read_at: new Date() });
}

// ── Helpers ────────────────────────────────────────────────────

function getAlertTitle(type: AlertType): string {
  const titles: Record<string, string> = {
    [AlertType.PANIC]: "🚨 PANIC ALERT",
    [AlertType.RESTRICTED_ZONE_ENTRY]: "Restricted Zone Entry",
    [AlertType.HIGH_RISK_ZONE_ENTRY]: "High-Risk Zone Entry",
    [AlertType.NO_LOCATION_UPDATE]: "No Location Update",
    [AlertType.ROUTE_DEVIATION]: "Route Deviation Detected",
    [AlertType.PROLONGED_STOP]: "Prolonged Stop Detected",
    [AlertType.MANUAL]: "Manual Alert",
  };
  return titles[type] || "Alert";
}

function alertToNotifType(type: AlertType): NotificationType {
  const map: Record<string, NotificationType> = {
    [AlertType.PANIC]: NotificationType.PANIC_ALERT,
    [AlertType.RESTRICTED_ZONE_ENTRY]: NotificationType.RESTRICTED_ZONE_ENTRY,
    [AlertType.HIGH_RISK_ZONE_ENTRY]: NotificationType.HIGH_RISK_ZONE_ENTRY,
    [AlertType.NO_LOCATION_UPDATE]: NotificationType.AI_ANOMALY,
    [AlertType.ROUTE_DEVIATION]: NotificationType.AI_ANOMALY,
    [AlertType.PROLONGED_STOP]: NotificationType.AI_ANOMALY,
    [AlertType.MANUAL]: NotificationType.SYSTEM,
  };
  return map[type] || NotificationType.SYSTEM;
}
