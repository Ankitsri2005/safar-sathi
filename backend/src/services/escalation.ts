/**
 * Escalation engine — auto-escalates unacknowledged alerts
 * based on configurable rules.
 *
 * Runs as a cron job every 2 minutes.
 */

import db from "../config/database";
import { Alert, AlertStatus, EscalationRule } from "../types";
import { notifyEscalation, sendNotification } from "./notification";
import { NotificationType } from "../types";

const ESCALATION_LOG_TABLE = "escalation_log";
const RULES_TABLE = "escalation_rules";

/**
 * Get the current escalation level for an alert.
 */
async function getCurrentLevel(alertId: string): Promise<number> {
  const last = await db(ESCALATION_LOG_TABLE)
    .where({ alert_id: alertId })
    .orderBy("escalation_level", "desc")
    .first();
  return last?.escalation_level || 0;
}

/**
 * Find the next user to escalate to based on role.
 */
async function findEscalationTarget(role: string): Promise<string | null> {
  const user = await db("users")
    .where({ role, is_active: true })
    .orderBy("created_at", "asc")
    .first();
  return user?.id || null;
}

/**
 * Escalate a single alert based on matching rules.
 */
async function escalateAlert(alert: Alert, rule: EscalationRule): Promise<boolean> {
  const currentLevel = await getCurrentLevel(alert.id);

  // Don't escalate if already at max level (3)
  if (currentLevel >= 3) return false;

  // Check if already escalated to this level by same rule
  const existing = await db(ESCALATION_LOG_TABLE)
    .where({ alert_id: alert.id, escalation_level: currentLevel + 1 })
    .first();
  if (existing) return false;

  // Find target user
  let targetUserId = rule.escalate_to_user_id;
  if (!targetUserId && rule.escalate_to_role) {
    targetUserId = await findEscalationTarget(rule.escalate_to_role);
  }
  if (!targetUserId) return false;

  // Determine previous assignee
  const prevLog = await db(ESCALATION_LOG_TABLE)
    .where({ alert_id: alert.id })
    .orderBy("escalation_level", "desc")
    .first();
  const fromUserId = prevLog?.escalated_to_user_id || null;

  // Record escalation
  await db(ESCALATION_LOG_TABLE).insert({
    id: crypto.randomUUID(),
    alert_id: alert.id,
    escalated_from_user_id: fromUserId,
    escalated_to_user_id: targetUserId,
    escalation_level: currentLevel + 1,
    reason: `Auto-escalated by rule "${rule.name}" after ${rule.escalate_after_minutes}min`,
  });

  // Update alert status
  await db("alerts").where({ id: alert.id }).update({ status: AlertStatus.ESCALATED });

  // Send escalation notification
  await notifyEscalation(alert, targetUserId, currentLevel + 1, rule.name);

  console.log(
    `[ESCALATION] Alert ${alert.id} → Level ${currentLevel + 1} → User ${targetUserId}`
  );

  return true;
}

/**
 * Run the escalation engine — check all active alerts against rules.
 * Called every 2 minutes via cron.
 */
export async function runEscalationCheck(): Promise<{ escalated: number; checked: number }> {
  const now = new Date();
  let escalated = 0;

  // Get all active (new/acknowledged) alerts
  const activeAlerts = await db("alerts")
    .whereIn("status", [AlertStatus.NEW, AlertStatus.ACKNOWLEDGED])
    .select("*");

  // Get active escalation rules, ordered by specificity
  const rules = await db(RULES_TABLE)
    .where({ is_active: true })
    .orderBy("escalate_after_minutes", "asc");

  for (const alert of activeAlerts) {
    const alertAge = (now.getTime() - new Date(alert.created_at).getTime()) / 60000;

    for (const rule of rules) {
      // Match rule to alert
      if (rule.alert_type && rule.alert_type !== alert.alert_type) continue;
      if (rule.severity && rule.severity !== alert.severity) continue;

      // Check if enough time has passed
      if (alertAge >= rule.escalate_after_minutes) {
        const result = await escalateAlert(alert, rule);
        if (result) {
          escalated++;
          break; // Only escalate once per check cycle per alert
        }
      }
    }
  }

  return { escalated, checked: activeAlerts.length };
}

/**
 * Get escalation history for an alert.
 */
export async function getEscalationHistory(alertId: string) {
  return db(ESCALATION_LOG_TABLE)
    .where({ alert_id: alertId })
    .leftJoin("users as from_user", "escalation_log.escalated_from_user_id", "from_user.id")
    .leftJoin("users as to_user", "escalation_log.escalated_to_user_id", "to_user.id")
    .select(
      "escalation_log.*",
      "from_user.full_name as from_user_name",
      "to_user.full_name as to_user_name"
    )
    .orderBy("escalation_level", "asc");
}

/**
 * Get all escalation rules.
 */
export async function getEscalationRules(): Promise<EscalationRule[]> {
  return db(RULES_TABLE).orderBy("escalate_after_minutes", "asc");
}

/**
 * Create or update an escalation rule.
 */
export async function upsertEscalationRule(data: {
  id?: string;
  name: string;
  alert_type?: string;
  severity?: string;
  escalate_after_minutes: number;
  escalate_to_user_id?: string;
  escalate_to_role?: string;
  is_active?: boolean;
}): Promise<EscalationRule> {
  if (data.id) {
    const [rule] = await db(RULES_TABLE)
      .where({ id: data.id })
      .update({ ...data, updated_at: new Date() })
      .returning("*");
    return rule;
  }
  const [rule] = await db(RULES_TABLE).insert(data).returning("*");
  return rule;
}

/**
 * Delete an escalation rule.
 */
export async function deleteEscalationRule(id: string): Promise<void> {
  await db(RULES_TABLE).where({ id }).delete();
}
