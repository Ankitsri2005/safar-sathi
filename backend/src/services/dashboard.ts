import db from "../config/database";

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

export async function getAlertStatsOverTime(days: number = 30) {
  return db("alerts")
    .where("created_at", ">=", db.raw(`NOW() - INTERVAL '${days} days'`))
    .select(db.raw("DATE(created_at) as date"))
    .count("id as count")
    .groupBy(db.raw("DATE(created_at)"))
    .orderBy("date");
}

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
