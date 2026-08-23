import { Router, Request, Response } from "express";
import { authenticate } from "../middleware/auth";
import db from "../config/database";

const router = Router();
router.use(authenticate);

// Get active tourists with latest location, safety score, basic info, and Blockchain Hash ID
router.get("/tourists", async (req: Request, res: Response) => {
  try {
    const { window: windowFilter, status: idStatusFilter } = req.query;

    let query = db("tourists as t")
      .leftJoin("digital_ids as di", "t.id", "di.tourist_id")
      .leftJoin(
        db.select("tourist_id", db.raw("max(timestamp) as last_ping"))
          .from("location_pings")
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
        db.select("tourist_id", db.raw("max(created_at) as last_analysis"))
          .from("ai_analyses")
          .groupBy("tourist_id")
          .as("aa"),
        "t.id", "aa.tourist_id"
      )
      .leftJoin("ai_analyses as latest_ai", function () {
        this.on("t.id", "=", "latest_ai.tourist_id").andOn(
          "latest_ai.created_at", "=", "aa.last_analysis"
        );
      })
      .select(
        "t.id",
        "t.full_name",
        "t.phone",
        "t.email",
        "t.trip_start",
        "t.trip_end",
        "t.itinerary",
        "di.block_id",
        "di.status as digital_id_status",
        "latest.lat as current_lat",
        "latest.lng as current_lng",
        "latest.timestamp as last_update",
        db.raw("COALESCE(latest_ai.risk_level, 'low') as risk_level"),
        db.raw("COALESCE(latest_ai.anomaly_score, 0) as anomaly_score"),
        db.raw("CASE WHEN latest.timestamp IS NOT NULL THEN true ELSE false END as is_online"),
        db.raw(`
          CASE 
            WHEN t.trip_start <= CURRENT_TIMESTAMP AND t.trip_end >= CURRENT_TIMESTAMP THEN 'active'
            WHEN t.trip_start > CURRENT_TIMESTAMP THEN 'upcoming'
            ELSE 'expired'
          END as window_status
        `),
        db.raw(`
          CASE 
            WHEN t.trip_start <= CURRENT_TIMESTAMP AND t.trip_end >= CURRENT_TIMESTAMP THEN true
            ELSE false
          END as is_in_trip_window
        `)
      )
      .orderBy("t.created_at", "desc");

    if (idStatusFilter) {
      query = query.where("di.status", idStatusFilter);
    }

    if (windowFilter === "active") {
      query = query.where("t.trip_start", "<=", new Date()).where("t.trip_end", ">=", new Date());
    } else if (windowFilter === "upcoming") {
      query = query.where("t.trip_start", ">", new Date());
    } else if (windowFilter === "expired") {
      query = query.where("t.trip_end", "<", new Date());
    }

    const tourists = await query;
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

// Get tourist detail with full info, digital ID, and generated geofences
router.get("/tourists/:id", async (req: Request, res: Response) => {
  try {
    const tourist = await db("tourists").where("id", req.params.id).first();
    if (!tourist) return res.status(404).json({ error: "Tourist not found" });

    // Get digital ID
    const digitalId = await db("digital_ids").where("tourist_id", req.params.id).first();

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

    // Get geofences associated with this tourist
    const geofences = await db("zones")
      .where("description", "like", `%${req.params.id}%`)
      .select("id", "name", "risk_level", "description", "polygon_geojson", "is_active");

    const now = new Date();
    const tripStart = new Date(tourist.trip_start);
    const tripEnd = new Date(tourist.trip_end);
    const isInWindow = now >= tripStart && now <= tripEnd;
    const windowStatus = now < tripStart ? "upcoming" : now > tripEnd ? "expired" : "active";

    res.json({
      ...tourist,
      block_id: digitalId?.block_id || null,
      digital_id: digitalId?.id || null,
      digital_id_status: digitalId?.status || "active",
      is_in_trip_window: isInWindow,
      window_status: windowStatus,
      current_lat: latestPing?.lat || null,
      current_lng: latestPing?.lng || null,
      last_update: latestPing?.timestamp || null,
      risk_level: latestAI?.risk_level || "low",
      anomaly_score: latestAI?.anomaly_score || 0,
      active_alerts: parseInt((activeAlerts as any)?.count || "0", 10),
      geofences,
    });
  } catch {
    res.status(500).json({ error: "Failed to fetch tourist detail" });
  }
});

export default router;

