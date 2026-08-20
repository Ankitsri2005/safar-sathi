import { Router, Request, Response } from "express";
import { authenticate, authorize } from "../middleware/auth";
import { validateUserUpdate, validatePasswordReset } from "../middleware/validation";
import { UserRole } from "../types";
import * as um from "../services/userManager";
import * as audit from "../services/audit";

const router = Router();
router.use(authenticate);

// ── User CRUD ──────────────────────────────────────────────────

router.get("/", async (req: Request, res: Response) => {
  try {
    const { role, is_active, search, page, limit } = req.query;
    const result = await um.listUsers({
      role: role as UserRole | undefined,
      is_active: is_active !== undefined ? is_active === "true" : undefined,
      search: search as string | undefined,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });
    res.json(result);
  } catch {
    res.status(500).json({ error: "Failed to list users" });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const user = await um.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch {
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

router.post("/", authorize(UserRole.ADMIN), async (req: Request, res: Response) => {
  try {
    const { username, password, full_name, role, jurisdiction, email, phone } = req.body;
    if (!username || !password || !full_name || !role) {
      return res.status(400).json({ error: "username, password, full_name, role are required" });
    }
    const user = await um.createUser({ username, password, full_name, role, jurisdiction, email, phone });
    res.status(201).json({
      id: user.id, username: user.username, full_name: user.full_name,
      role: user.role, jurisdiction: user.jurisdiction,
    });
  } catch (err: any) {
    if (err.code === "23505") return res.status(409).json({ error: "Username already exists" });
    res.status(500).json({ error: "Failed to create user" });
  }
});

router.put("/:id", authorize(UserRole.ADMIN), validateUserUpdate, async (req: Request, res: Response) => {
  try {
    const user = await um.updateUser(req.params.id, req.body);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch {
    res.status(500).json({ error: "Failed to update user" });
  }
});

router.patch("/:id/disable", authorize(UserRole.ADMIN), async (req: Request, res: Response) => {
  try {
    const user = await um.disableUser(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch {
    res.status(500).json({ error: "Failed to disable user" });
  }
});

router.patch("/:id/enable", authorize(UserRole.ADMIN), async (req: Request, res: Response) => {
  try {
    const user = await um.enableUser(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch {
    res.status(500).json({ error: "Failed to enable user" });
  }
});

router.post("/:id/reset-password", authorize(UserRole.ADMIN), validatePasswordReset, async (req: Request, res: Response) => {
  try {
    const { password } = req.body;
    const ok = await um.resetPassword(req.params.id, password);
    if (!ok) return res.status(404).json({ error: "User not found" });
    res.json({ ok: true, message: "Password reset successfully" });
  } catch {
    res.status(500).json({ error: "Failed to reset password" });
  }
});

// ── Audit Logs ─────────────────────────────────────────────────

router.get("/audit/stats", authorize(UserRole.ADMIN), async (_req: Request, res: Response) => {
  try {
    const stats = await audit.getAuditStats();
    res.json(stats);
  } catch {
    res.status(500).json({ error: "Failed to fetch audit stats" });
  }
});

router.get("/audit/activity/:userId", authorize(UserRole.ADMIN), async (req: Request, res: Response) => {
  try {
    const activity = await audit.getUserActivity(req.params.userId);
    res.json(activity);
  } catch {
    res.status(500).json({ error: "Failed to fetch user activity" });
  }
});

router.get("/audit", authorize(UserRole.ADMIN), async (req: Request, res: Response) => {
  try {
    const { user_id, event_type, resource_type, search, from_date, to_date, page, limit } = req.query;
    const result = await audit.listAuditLogs({
      user_id: user_id as string | undefined,
      event_type: event_type as any,
      resource_type: resource_type as string | undefined,
      search: search as string | undefined,
      from_date: from_date as string | undefined,
      to_date: to_date as string | undefined,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });
    res.json(result);
  } catch {
    res.status(500).json({ error: "Failed to list audit logs" });
  }
});

export default router;
