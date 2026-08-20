import db from "../config/database";

// Helper: safe interval clause (parameterized)
function intervalDays(col: string, days: number) {
  return db.raw(`${col} >= NOW() - INTERVAL '${Math.max(1, Math.floor(days))}' day`);
}

// ── Overview ───────────────────────────────────────────────────

export async function getOverviewStats() {
  const [touristCount] = await db("tourists")
    .where("trip_end", ">=", new Date())
    .where("trip_start", "<=", new Date())
    .count("id as count");

  const [alertCount] = await db("alerts")
    .whereNot("status", "resolved")
    .count("id as count");

  const [todayIds] = await db("digital_ids")
    .whereRaw("DATE(issued_at) = CURRENT_DATE")
    .count("id as count");

  const [totalIds] = await db("digital_ids")
    .where("status", "active")
    .count("id as count");

  return {
    active_tourists: parseInt((touristCount as any)?.count || "0", 10),
    active_alerts: parseInt((alertCount as any)?.count || "0", 10),
    ids_issued_today: parseInt((todayIds as any)?.count || "0", 10),
    total_active_ids: parseInt((totalIds as any)?.count || "0", 10),
  };
}

export async function getActiveTouristsWithLocation() {
  return db("tourists")
    .join("digital_ids", "tourists.id", "digital_ids.tourist_id")
    .join(
      db("location_pings")
        .select("tourist_id")
        .max("timestamp as last_ping")
        .groupBy("tourist_id")
        .as("latest_pings"),
      "tourists.id",
      "latest_pings.tourist_id"
    )
    .join("location_pings as lp", function () {
      this.on("tourists.id", "=", "lp.tourist_id").andOn(
        "lp.timestamp",
        "=",
        "latest_pings.last_ping"
      );
    })
    .where("digital_ids.status", "active")
    .where("tourists.trip_end", ">=", new Date())
    .select(
      "tourists.id",
      "tourists.full_name",
      "lp.lat",
      "lp.lng",
      "digital_ids.block_id"
    );
}

// ── Alerts Over Time ───────────────────────────────────────────

export async function getAlertStatsOverTime(days: number = 30) {
  const d = Math.max(1, Math.floor(days));
  return db("alerts")
    .where(intervalDays("created_at", d))
    .select(db.raw("DATE(created_at) as date"))
    .count("id as count")
    .groupBy(db.raw("DATE(created_at)"))
    .orderBy("date");
}

// ── Most Visited Zones ─────────────────────────────────────────

export async function getMostVisitedZones() {
  return db("location_pings as lp")
    .join("zones as z", function () {
      this.onRaw(
        "ST_Contains(ST_GeomFromGeoJSON(z.polygon_geojson), ST_SetSRID(ST_MakePoint(lp.lng, lp.lat), 4326))"
      );
    })
    .select("z.name", "z.risk_level")
    .count("lp.id as visit_count")
    .groupBy("z.name", "z.risk_level")
    .orderBy("visit_count", "desc")
    .limit(10);
}

// ── Alerts by Type ─────────────────────────────────────────────

export async function getAlertsByType(days: number = 30) {
  const d = Math.max(1, Math.floor(days));
  return db("alerts")
    .where(intervalDays("created_at", d))
    .select("alert_type")
    .count("id as count")
    .groupBy("alert_type")
    .orderBy("count", "desc");
}

// ── Alerts by Severity ─────────────────────────────────────────

export async function getAlertsBySeverity(days: number = 30) {
  const d = Math.max(1, Math.floor(days));
  return db("alerts")
    .where(intervalDays("created_at", d))
    .select("severity")
    .count("id as count")
    .groupBy("severity")
    .orderBy("count", "desc");
}

// ── Average Response Time ──────────────────────────────────────

export async function getAverageResponseTime(days: number = 30) {
  const d = Math.max(1, Math.floor(days));
  const result = await db.raw(`
    SELECT AVG(EXTRACT(EPOCH FROM (tl.created_at - a.created_at)) / 60) as avg_response_minutes
    FROM alerts a
    JOIN alert_timeline tl ON tl.alert_id = a.id AND tl.action = 'acknowledged'
    WHERE a.created_at >= NOW() - INTERVAL '${d}' day
  `);
  return {
    avg_response_minutes: parseFloat(result.rows[0]?.avg_response_minutes || "0"),
  };
}

// ── High-Risk Zone Entries ─────────────────────────────────────

export async function getHighRiskZoneEntries(days: number = 30) {
  const d = Math.max(1, Math.floor(days));
  return db("alerts")
    .where(intervalDays("created_at", d))
    .whereIn("alert_type", ["restricted_zone_entry", "high_risk_zone_entry"])
    .select("alert_type")
    .count("id as count")
    .groupBy("alert_type");
}

// ── Digital ID Stats ───────────────────────────────────────────

export async function getDigitalIdStats() {
  const [active] = await db("digital_ids").where("status", "active").count("id as count");
  const [expired] = await db("digital_ids").where("status", "expired").count("id as count");
  const [revoked] = await db("digital_ids").where("status", "revoked").count("id as count");
  const [total] = await db("digital_ids").count("id as count");

  return {
    active: parseInt((active as any)?.count || "0", 10),
    expired: parseInt((expired as any)?.count || "0", 10),
    revoked: parseInt((revoked as any)?.count || "0", 10),
    total: parseInt((total as any)?.count || "0", 10),
  };
}

// ── AI Anomalies Over Time ─────────────────────────────────────

export async function getAiAnomaliesOverTime(days: number = 30) {
  const d = Math.max(1, Math.floor(days));
  return db("ai_analyses")
    .where(intervalDays("created_at", d))
    .select(db.raw("DATE(created_at) as date"))
    .count("id as total_analyses")
    .sum(db.raw("CASE WHEN anomaly_score > 0.6 THEN 1 ELSE 0 END as anomalies"))
    .groupBy(db.raw("DATE(created_at)"))
    .orderBy("date");
}

// ── False Positive Rate ────────────────────────────────────────

export async function getFalsePositiveRate(days: number = 30) {
  const d = Math.max(1, Math.floor(days));
  const result = await db.raw(`
    SELECT
      COUNT(*) as total_alerts,
      SUM(CASE WHEN status = 'false_positive' THEN 1 ELSE 0 END) as false_positives,
      ROUND(
        CASE WHEN COUNT(*) > 0
          THEN SUM(CASE WHEN status = 'false_positive' THEN 1 ELSE 0 END)::numeric / COUNT(*) * 100
          ELSE 0
        END, 1
      ) as false_positive_rate
    FROM alerts
    WHERE created_at >= NOW() - INTERVAL '${d}' day
  `);
  const row = result.rows[0];
  return {
    total_alerts: parseInt(row?.total_alerts || "0", 10),
    false_positives: parseInt(row?.false_positives || "0", 10),
    false_positive_rate: parseFloat(row?.false_positive_rate || "0"),
  };
}

// ── Tourist Density Heatmap Data ───────────────────────────────

export async function getTouristDensityHeatmap(days: number = 7) {
  const d = Math.max(1, Math.floor(days));
  const MIN_LAT = 26.5, MAX_LAT = 28.0, MIN_LNG = 88.0, MAX_LNG = 89.5;
  const GRID_SIZE = 20;
  const latStep = (MAX_LAT - MIN_LAT) / GRID_SIZE;
  const lngStep = (MAX_LNG - MIN_LNG) / GRID_SIZE;

  const result = await db.raw(`
    SELECT
      FLOOR((${MAX_LAT} - lat) / ${latStep}) as row,
      FLOOR((lng - ${MIN_LNG}) / ${lngStep}) as col,
      COUNT(DISTINCT tourist_id) as tourist_count,
      COUNT(*) as ping_count
    FROM location_pings
    WHERE timestamp >= NOW() - INTERVAL '${d}' day
      AND lat BETWEEN ${MIN_LAT} AND ${MAX_LAT}
      AND lng BETWEEN ${MIN_LNG} AND ${MAX_LNG}
    GROUP BY row, col
  `);

  return {
    grid: result.rows,
    bounds: { min_lat: MIN_LAT, max_lat: MAX_LAT, min_lng: MIN_LNG, max_lng: MAX_LNG },
    grid_size: GRID_SIZE,
  };
}

// ── Alert Density Heatmap Data ─────────────────────────────────

export async function getAlertDensityHeatmap(days: number = 30) {
  const d = Math.max(1, Math.floor(days));
  const MIN_LAT = 26.5, MAX_LAT = 28.0, MIN_LNG = 88.0, MAX_LNG = 89.5;
  const GRID_SIZE = 20;
  const latStep = (MAX_LAT - MIN_LAT) / GRID_SIZE;
  const lngStep = (MAX_LNG - MIN_LNG) / GRID_SIZE;

  const result = await db.raw(`
    SELECT
      FLOOR((${MAX_LAT} - location_lat) / ${latStep}) as row,
      FLOOR((location_lng - ${MIN_LNG}) / ${lngStep}) as col,
      COUNT(*) as alert_count,
      COUNT(DISTINCT alert_type) as alert_types
    FROM alerts
    WHERE created_at >= NOW() - INTERVAL '${d}' day
      AND location_lat BETWEEN ${MIN_LAT} AND ${MAX_LAT}
      AND location_lng BETWEEN ${MIN_LNG} AND ${MAX_LNG}
    GROUP BY row, col
  `);

  return {
    grid: result.rows,
    bounds: { min_lat: MIN_LAT, max_lat: MAX_LAT, min_lng: MIN_LNG, max_lng: MAX_LNG },
    grid_size: GRID_SIZE,
  };
}

// ── Zone Risk Distribution ─────────────────────────────────────

export async function getZoneRiskDistribution() {
  return db("zones")
    .select("risk_level")
    .count("id as count")
    .where("is_active", true)
    .groupBy("risk_level");
}

// ── Alert Status Distribution ──────────────────────────────────

export async function getAlertStatusDistribution(days: number = 30) {
  const d = Math.max(1, Math.floor(days));
  return db("alerts")
    .where(intervalDays("created_at", d))
    .select("status")
    .count("id as count")
    .groupBy("status");
}

// ── Comprehensive Analytics ────────────────────────────────────

export async function getComprehensiveAnalytics(days: number = 30) {
  const [
    alertsOverTime,
    alertsByType,
    alertsBySeverity,
    responseTime,
    highRiskEntries,
    digitalIds,
    aiAnomalies,
    falsePositives,
    touristHeatmap,
    alertHeatmap,
    zoneRisk,
    alertStatus,
    mostVisited,
  ] = await Promise.all([
    getAlertStatsOverTime(days),
    getAlertsByType(days),
    getAlertsBySeverity(days),
    getAverageResponseTime(days),
    getHighRiskZoneEntries(days),
    getDigitalIdStats(),
    getAiAnomaliesOverTime(days),
    getFalsePositiveRate(days),
    getTouristDensityHeatmap(Math.min(days, 14)),
    getAlertDensityHeatmap(days),
    getZoneRiskDistribution(),
    getAlertStatusDistribution(days),
    getMostVisitedZones(),
  ]);

  return {
    alerts_over_time: alertsOverTime,
    alerts_by_type: alertsByType,
    alerts_by_severity: alertsBySeverity,
    avg_response_time: responseTime,
    high_risk_entries: highRiskEntries,
    digital_ids: digitalIds,
    ai_anomalies_over_time: aiAnomalies,
    false_positives: falsePositives,
    tourist_density_heatmap: touristHeatmap,
    alert_density_heatmap: alertHeatmap,
    zone_risk_distribution: zoneRisk,
    alert_status_distribution: alertStatus,
    most_visited_zones: mostVisited,
  };
}
