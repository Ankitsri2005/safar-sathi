import { Request, Response } from "express";
import * as alertService from "../services/alert";

export async function createAlert(req: Request, res: Response) {
  try {
    const alert = await alertService.createAlert(req.body);
    res.status(201).json(alert);
  } catch {
    res.status(500).json({ error: "Failed to create alert" });
  }
}

export async function listAlerts(req: Request, res: Response) {
  try {
    const { status, alert_type, page, limit } = req.query;
    const result = await alertService.listAlerts({
      status: status as any,
      alert_type: alert_type as any,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });
    res.json(result);
  } catch {
    res.status(500).json({ error: "Failed to list alerts" });
  }
}

export async function getAlert(req: Request, res: Response) {
  try {
    const alert = await alertService.getAlertById(req.params.id);
    if (!alert) return res.status(404).json({ error: "Alert not found" });
    res.json(alert);
  } catch {
    res.status(500).json({ error: "Failed to get alert" });
  }
}

export async function updateAlert(req: Request, res: Response) {
  try {
    const { status } = req.body;
    const alert = await alertService.updateAlertStatus(
      req.params.id,
      status,
      req.user?.userId
    );
    if (!alert) return res.status(404).json({ error: "Alert not found" });
    res.json(alert);
  } catch {
    res.status(500).json({ error: "Failed to update alert" });
  }
}

export async function getRecentAlerts(_req: Request, res: Response) {
  try {
    const alerts = await alertService.getRecentAlerts(10);
    res.json(alerts);
  } catch {
    res.status(500).json({ error: "Failed to get recent alerts" });
  }
}
