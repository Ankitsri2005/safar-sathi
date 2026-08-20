import { Router, Request, Response } from "express";
import { authenticate } from "../middleware/auth";
import db from "../config/database";

const router = Router();
router.use(authenticate);

// Get active tourists with latest location, safety score, and basic info
router.get("/tourists", async (_req: Request, res: Response) => {
  try {
    const tourists = await db("tourists as t")
      .join("digital_ids as di", "t.id", "di.tourist_id")
      .leftJoin(
        db("location_pings")
          .select("tourist_id")
          .max("timestamp as last_ping")
          .groupBy("tourist_id")
          .as("lp"),
        "t.id", "lp.tourist_id"
      )
      .leftJoin("location_pings as latest", function () {
        this.on("t.id", "=", "latest.tourist_id").andOn(
          "latest.timestamp", "=", "lp.last_ping"
        );
      })
      .leftJoin(
        db("ai_analyses")
          .select("tourist_id")
          .max("created_at as last_analysis")
          .groupBy("tourist_id")
          .as("aa"),
        "t.id", "aa.tourist_id"
      )
      .leftJoin("ai_analyses as latest_ai", function () {
        this.on("t.id", "=", "latest_ai.tourist_id").andOn(
          "latest_ai.created_at", "=", "aa.last_analysis"
        );
      })
      .where("di.status", "active")
      .where("t.trip_end", ">=", new Date())
      .select(
        "t.id",
        "t.full_name",
        "t.phone",
        "t.email",
        "t.trip_start",
        "t.trip_end",
        "t.itinerary",
        "latest.lat as current_lat",
        "latest.lng as current_lng",
        "latest.timestamp as last_update",
        db.raw("COALESCE(latest_ai.risk_level, 'unknown') as risk_level"),
        db.raw("COALESCE(latest_ai.anomaly_score, 0) as anomaly_score"),
        db.raw("CASE WHEN latest.timestamp IS NOT NULL THEN true ELSE false end as is_online")
      )
      .orderBy("latest.timestamp", "desc");

    res.json(tourists);
  } catch (err: any) {
    console.error("[TRACKING] Failed to fetch tourists:", err.message);
    res.status(500).json({ error: "Failed to fetch tourists" });
  }
});

// Get location pings for a tourist (movement history)
router.get("/tourists/:id/pings", async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const pings = await db("location_pings")
      .where("tourist_id", req.params.id)
      .orderBy("timestamp", "desc")
      .limit(limit);

    res.json(pings);
  } catch {
    res.status(500).json({ error: "Failed to fetch location pings" });
  }
});

// Get tourist detail with full info
router.get("/tourists/:id", async (req: Request, res: Response) => {
  try {
    const tourist = await db("tourists").where("id", req.params.id).first();
    if (!tourist) return res.status(404).json({ error: "Tourist not found" });

    // Get latest location
    const latestPing = await db("location_pings")
      .where("tourist_id", req.params.id)
      .orderBy("timestamp", "desc")
      .first();

    // Get latest AI analysis
    const latestAI = await db("ai_analyses")
      .where("tourist_id", req.params.id)
      .orderBy("created_at", "desc")
      .first();

    // Get active alerts
    const activeAlerts = await db("alerts")
      .where("tourist_id", req.params.id)
      .whereNot("status", "resolved")
      .count("id as count")
      .first();

    res.json({
      ...tourist,
      current_lat: latestPing?.lat || null,
      current_lng: latestPing?.lng || null,
      last_update: latestPing?.timestamp || null,
      risk_level: latestAI?.risk_level || "unknown",
      anomaly_score: latestAI?.anomaly_score || 0,
      active_alerts: parseInt((activeAlerts as any)?.count || "0", 10),
    });
  } catch {
    res.status(500).json({ error: "Failed to fetch tourist detail" });
  }
});

export default router;
