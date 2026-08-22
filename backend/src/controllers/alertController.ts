import { Request, Response } from "express";
import * as alertService from "../services/alert";
import { logFromRequest } from "../services/audit";
import { AlertStatus } from "../types";

export async function createAlert(req: Request, res: Response) {
  try {
    const alert = await alertService.createAlert(req.body);
    if (!alert) {
      return res.status(200).json({ message: "Alert suppressed by cooldown" });
    }
    res.status(201).json(alert);
  } catch {
    res.status(500).json({ error: "Failed to create alert" });
  }
}

export async function listAlerts(req: Request, res: Response) {
  try {
    const { status, alert_type, severity, search, page, limit } = req.query;
    const result = await alertService.listAlerts({
      status: status as any,
      alert_type: alert_type as any,
      severity: severity as string,
      search: search as string,
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
    const alert = await alertService.getAlertById(req.params.id as string);
    if (!alert) return res.status(404).json({ error: "Alert not found" });
    await logFromRequest(req, "alert_viewing", {
      resource_type: "alert",
      resource_id: req.params.id as string,
    });
    res.json(alert);
  } catch {
    res.status(500).json({ error: "Failed to get alert" });
  }
}

export async function updateAlert(req: Request, res: Response) {
  try {
    const { status, notes } = req.body;
    const alert = await alertService.updateAlertStatus(
      req.params.id as string,
      status,
      req.user?.userId,
      notes
    );
    if (!alert) return res.status(404).json({ error: "Alert not found" });
    if (status === AlertStatus.RESOLVED || status === AlertStatus.FALSE_POSITIVE) {
      await logFromRequest(req, "alert_resolution", {
        resource_type: "alert",
        resource_id: req.params.id as string,
        details: { status, notes },
      });
    }
    res.json(alert);
  } catch {
    res.status(500).json({ error: "Failed to update alert" });
  }
}

export async function getAlertTimeline(req: Request, res: Response) {
  try {
    const timeline = await alertService.getAlertTimeline(req.params.id as string);
    res.json(timeline);
  } catch {
    res.status(500).json({ error: "Failed to get timeline" });
  }
}

export async function getAlertStats(_req: Request, res: Response) {
  try {
    const stats = await alertService.getAlertStats();
    res.json(stats);
  } catch {
    res.status(500).json({ error: "Failed to get alert stats" });
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

export async function updateTriage(req: Request, res: Response) {
  try {
    const { triage_status, triage_transcript, triage_recording_url } = req.body;
    const alert = await alertService.updateAlertTriage(
      req.params.id as string,
      triage_status,
      triage_transcript,
      triage_recording_url
    );
    if (!alert) return res.status(404).json({ error: "Alert not found" });
    
    // Broadcast socket notification to dashboards
    try {
      const { io } = await import("../server");
      io.emit("alert:triage_update", {
        alert_id: req.params.id,
        triage_status,
        triage_transcript
      });
    } catch {}

    res.json(alert);
  } catch (err: any) {
    console.error("Triage update error:", err);
    res.status(500).json({ error: "Failed to update triage" });
  }
}
