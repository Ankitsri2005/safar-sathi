import { Request, Response } from "express";
import * as dashboardService from "../services/dashboard";
import * as alertService from "../services/alert";

export async function getOverview(_req: Request, res: Response) {
  try {
    const stats = await dashboardService.getOverviewStats();
    res.json(stats);
  } catch {
    res.status(500).json({ error: "Failed to get overview stats" });
  }
}

export async function getActiveTourists(_req: Request, res: Response) {
  try {
    const tourists = await dashboardService.getActiveTouristsWithLocation();
    res.json(tourists);
  } catch {
    res.status(500).json({ error: "Failed to get active tourists" });
  }
}

export async function getAlertAnalytics(req: Request, res: Response) {
  try {
    const days = parseInt((req.query.days as string) || "30", 10);
    const overTime = await dashboardService.getAlertStatsOverTime(days);
    const topZones = await dashboardService.getMostVisitedZones();
    const recentAlerts = await alertService.getRecentAlerts(10);
    res.json({ overTime, topZones, recentAlerts });
  } catch {
    res.status(500).json({ error: "Failed to get analytics" });
  }
}
