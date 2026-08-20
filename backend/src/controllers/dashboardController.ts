import { Request, Response } from "express";
import * as svc from "../services/dashboard";

export async function getOverview(_req: Request, res: Response) {
  try {
    const stats = await svc.getOverviewStats();
    res.json(stats);
  } catch {
    res.status(500).json({ error: "Failed to fetch overview stats" });
  }
}

export async function getActiveTourists(_req: Request, res: Response) {
  try {
    const tourists = await svc.getActiveTouristsWithLocation();
    res.json(tourists);
  } catch {
    res.status(500).json({ error: "Failed to fetch active tourists" });
  }
}

export async function getAlertAnalytics(req: Request, res: Response) {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const [overTime, topZones] = await Promise.all([
      svc.getAlertStatsOverTime(days),
      svc.getMostVisitedZones(),
    ]);
    res.json({ overTime, topZones });
  } catch {
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
}

export async function getComprehensive(req: Request, res: Response) {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const data = await svc.getComprehensiveAnalytics(days);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch comprehensive analytics", details: err.message });
  }
}

export async function getTouristHeatmap(req: Request, res: Response) {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const data = await svc.getTouristDensityHeatmap(days);
    res.json(data);
  } catch {
    res.status(500).json({ error: "Failed to fetch tourist heatmap" });
  }
}

export async function getAlertHeatmap(req: Request, res: Response) {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const data = await svc.getAlertDensityHeatmap(days);
    res.json(data);
  } catch {
    res.status(500).json({ error: "Failed to fetch alert heatmap" });
  }
}
