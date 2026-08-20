import { Router, Request, Response } from "express";
import { authenticate, authorize } from "../middleware/auth";
import { UserRole } from "../types";
import {
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  getPreferences,
  sendNotification,
  NotificationType,
} from "../services/notification";
import {
  runEscalationCheck,
  getEscalationHistory,
  getEscalationRules,
  upsertEscalationRule,
  deleteEscalationRule,
} from "../services/escalation";
import { registerDeviceToken, removeDeviceToken } from "../services/push";
import db from "../config/database";

const router = Router();
router.use(authenticate);

// ── Notifications ──────────────────────────────────────────────

// Get notifications for current user
router.get("/", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;
    const result = await getUserNotifications(userId, limit, offset);
    res.json(result);
  } catch {
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// Get unread count
router.get("/unread-count", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const count = await getUnreadCount(userId);
    res.json({ count });
  } catch {
    res.status(500).json({ error: "Failed to fetch count" });
  }
});

// Mark specific notifications as read
router.post("/read", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { notification_ids } = req.body;
    await markAsRead(userId, notification_ids);
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Failed to mark as read" });
  }
});

// Mark all as read
router.post("/read-all", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    await markAllAsRead(userId);
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Failed to mark all as read" });
  }
});

// Send a test notification
router.post("/test", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const result = await sendNotification({
      recipient_id: userId,
      notification_type: NotificationType.SYSTEM,
      title: "Test Notification",
      body: "This is a test notification from the system.",
      metadata: { test: true },
    });
    res.json({ sent: result.length });
  } catch {
    res.status(500).json({ error: "Failed to send test notification" });
  }
});

// ── Preferences ────────────────────────────────────────────────

router.get("/preferences", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const prefs = await getPreferences(userId);
    res.json(prefs);
  } catch {
    res.status(500).json({ error: "Failed to fetch preferences" });
  }
});

router.put("/preferences", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const updates = req.body;
    delete updates.id;
    delete updates.user_id;
    delete updates.created_at;
    delete updates.updated_at;

    const existing = await getPreferences(userId);
    const [updated] = await db("notification_preferences")
      .where({ id: existing.id })
      .update({ ...updates, updated_at: new Date() })
      .returning("*");
    res.json(updated);
  } catch {
    res.status(500).json({ error: "Failed to update preferences" });
  }
});

// ── Device Token (for push) ────────────────────────────────────

router.post("/device-token", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { token, platform } = req.body;
    if (!token) return res.status(400).json({ error: "token required" });
    await registerDeviceToken(userId, token, platform || "web");
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Failed to register device" });
  }
});

router.delete("/device-token", async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    await removeDeviceToken(token);
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Failed to remove device" });
  }
});

// ── Escalation Rules (admin only) ─────────────────────────────

router.get("/escalation-rules", async (req: Request, res: Response) => {
  try {
    const rules = await getEscalationRules();
    res.json(rules);
  } catch {
    res.status(500).json({ error: "Failed to fetch escalation rules" });
  }
});

router.post("/escalation-rules", authorize(UserRole.ADMIN), async (req: Request, res: Response) => {
  try {
    const rule = await upsertEscalationRule(req.body);
    res.status(201).json(rule);
  } catch {
    res.status(500).json({ error: "Failed to create escalation rule" });
  }
});

router.put("/escalation-rules/:id", authorize(UserRole.ADMIN), async (req: Request, res: Response) => {
  try {
    const rule = await upsertEscalationRule({ ...req.body, id: req.params.id });
    res.json(rule);
  } catch {
    res.status(500).json({ error: "Failed to update escalation rule" });
  }
});

router.delete("/escalation-rules/:id", authorize(UserRole.ADMIN), async (req: Request, res: Response) => {
  try {
    await deleteEscalationRule(req.params.id);
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Failed to delete escalation rule" });
  }
});

// Get escalation history for an alert
router.get("/escalation-history/:alertId", async (req: Request, res: Response) => {
  try {
    const history = await getEscalationHistory(req.params.alertId);
    res.json(history);
  } catch {
    res.status(500).json({ error: "Failed to fetch escalation history" });
  }
});

// Trigger escalation check manually
router.post("/escalation-check", async (_req: Request, res: Response) => {
  try {
    const result = await runEscalationCheck();
    res.json(result);
  } catch {
    res.status(500).json({ error: "Escalation check failed" });
  }
});

export default router;
