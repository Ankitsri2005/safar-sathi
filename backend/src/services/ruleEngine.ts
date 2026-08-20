import db from "../config/database";
import { AlertType } from "../types";
import * as alertService from "./alert";

/**
 * Rule Engine: Evaluates alert conditions for all active tourists.
 * Run this on a cron schedule (e.g., every minute) to detect anomalies.
 */

const NO_LOCATION_UPDATE_MINUTES = 30;
const PROLONGED_STOP_MINUTES = 120;
const PROLONGED_STOP_SPEED_THRESHOLD = 2; // km/h — considered stationary
const ROUTE_DEVIATION_KM = 5;

/**
 * Main entry point: run all rules for all active tourists.
 */
export async function evaluateAllRules(): Promise<void> {
  const activeTourists = await db("tourists")
    .where(function () {
      this.where("trip_end", ">=", new Date().toISOString().split("T")[0])
        .orWhere("trip_end", ">=", new Date());
    })
    .select("id");

  for (const tourist of activeTourists) {
    await evaluateRulesForTourist(tourist.id);
  }
}

/**
 * Evaluate all rules for a single tourist.
 */
async function evaluateRulesForTourist(touristId: string): Promise<void> {
  const latestPing = await db("location_pings")
    .where({ tourist_id: touristId })
    .orderBy("timestamp", "desc")
    .first();

  if (!latestPing) return;

  await checkNoLocationUpdate(touristId, latestPing);
  await checkRestrictedZoneEntry(touristId, latestPing);
  await checkHighRiskZoneEntry(touristId, latestPing);
  await checkProlongedStop(touristId, latestPing);
  await checkRouteDeviation(touristId, latestPing);
}

/**
 * Rule 1: No location update for 30+ minutes.
 */
async function checkNoLocationUpdate(
  touristId: string,
  latestPing: any
): Promise<void> {
  const lastUpdate = new Date(latestPing.timestamp);
  const elapsed = (Date.now() - lastUpdate.getTime()) / 60000;

  if (elapsed >= NO_LOCATION_UPDATE_MINUTES) {
    await alertService.createAlert({
      tourist_id: touristId,
      alert_type: AlertType.NO_LOCATION_UPDATE,
      location_lat: latestPing.lat,
      location_lng: latestPing.lng,
      location_name: null,
      message: `No location update received for ${Math.round(elapsed)} minutes (last update: ${lastUpdate.toISOString()}).`,
    });
  }
}

/**
 * Rule 2: Tourist entered a restricted zone.
 */
async function checkRestrictedZoneEntry(
  touristId: string,
  latestPing: any
): Promise<void> {
  const zone = await db("zones")
    .where("is_active", true)
    .where("risk_level", "restricted")
    .whereRaw(
      "ST_Contains(polygon_geom, ST_SetSRID(ST_MakePoint(?, ?), 4326))",
      [latestPing.lng, latestPing.lat]
    )
    .first();

  if (zone) {
    await alertService.createAlert({
      tourist_id: touristId,
      alert_type: AlertType.RESTRICTED_ZONE_ENTRY,
      location_lat: latestPing.lat,
      location_lng: latestPing.lng,
      location_name: zone.name,
      message: `Tourist entered restricted zone "${zone.name}" at ${latestPing.lat.toFixed(4)}, ${latestPing.lng.toFixed(4)}.`,
    });
  }
}

/**
 * Rule 3: Tourist entered a high-risk zone.
 */
async function checkHighRiskZoneEntry(
  touristId: string,
  latestPing: any
): Promise<void> {
  const zone = await db("zones")
    .where("is_active", true)
    .where("risk_level", "high")
    .whereRaw(
      "ST_Contains(polygon_geom, ST_SetSRID(ST_MakePoint(?, ?), 4326))",
      [latestPing.lng, latestPing.lat]
    )
    .first();

  if (zone) {
    await alertService.createAlert({
      tourist_id: touristId,
      alert_type: AlertType.HIGH_RISK_ZONE_ENTRY,
      location_lat: latestPing.lat,
      location_lng: latestPing.lng,
      location_name: zone.name,
      message: `Tourist entered high-risk zone "${zone.name}" at ${latestPing.lat.toFixed(4)}, ${latestPing.lng.toFixed(4)}.`,
    });
  }
}

/**
 * Rule 4: Prolonged stop (2+ hours) in a high-risk area.
 */
async function checkProlongedStop(
  touristId: string,
  latestPing: any
): Promise<void> {
  // Check if tourist is in a high-risk zone
  const inHighRisk = await db("zones")
    .where("is_active", true)
    .where("risk_level", "high")
    .whereRaw(
      "ST_Contains(polygon_geom, ST_SetSRID(ST_MakePoint(?, ?), 4326))",
      [latestPing.lng, latestPing.lat]
    )
    .first();

  if (!inHighRisk) return;

  // Check recent pings to see if tourist has been stationary
  const recentPings = await db("location_pings")
    .where({ tourist_id: touristId })
    .where("timestamp", ">=", new Date(Date.now() - PROLONGED_STOP_MINUTES * 60000).toISOString())
    .orderBy("timestamp", "asc");

  if (recentPings.length < 3) return;

  // Calculate average speed
  let totalSpeed = 0;
  for (const ping of recentPings) {
    // Estimate speed from distance between consecutive pings
    const idx = recentPings.indexOf(ping);
    if (idx === 0) continue;
    const prev = recentPings[idx - 1];
    const dist = haversineDistance(prev.lat, prev.lng, ping.lat, ping.lng);
    const timeH = (new Date(ping.timestamp).getTime() - new Date(prev.timestamp).getTime()) / 3600000;
    if (timeH > 0) totalSpeed += dist / timeH;
  }
  const avgSpeed = totalSpeed / Math.max(recentPings.length - 1, 1);

  if (avgSpeed < PROLONGED_STOP_SPEED_THRESHOLD) {
    const stopDuration = Math.round(
      (new Date(recentPings[recentPings.length - 1].timestamp).getTime() -
        new Date(recentPings[0].timestamp).getTime()) / 60000
    );
    await alertService.createAlert({
      tourist_id: touristId,
      alert_type: AlertType.PROLONGED_STOP,
      location_lat: latestPing.lat,
      location_lng: latestPing.lng,
      location_name: inHighRisk.name,
      message: `Tourist has been stationary (~${avgSpeed.toFixed(1)} km/h) in high-risk zone "${inHighRisk.name}" for ${stopDuration} minutes.`,
    });
  }
}

/**
 * Rule 5: Route deviation — tourist is more than 5km from nearest planned stop.
 */
async function checkRouteDeviation(
  touristId: string,
  latestPing: any
): Promise<void> {
  const tourist = await db("tourists").where({ id: touristId }).first();
  if (!tourist?.itinerary) return;

  const itinerary = typeof tourist.itinerary === "string"
    ? JSON.parse(tourist.itinerary)
    : tourist.itinerary;

  if (!Array.isArray(itinerary) || itinerary.length === 0) return;

  let minDistance = Infinity;
  for (const stop of itinerary) {
    const dist = haversineDistance(
      latestPing.lat, latestPing.lng,
      stop.lat, stop.lng
    );
    if (dist < minDistance) minDistance = dist;
  }

  if (minDistance > ROUTE_DEVIATION_KM) {
    await alertService.createAlert({
      tourist_id: touristId,
      alert_type: AlertType.ROUTE_DEVIATION,
      location_lat: latestPing.lat,
      location_lng: latestPing.lng,
      location_name: null,
      message: `Tourist is ${minDistance.toFixed(1)} km away from the nearest planned itinerary stop.`,
    });
  }
}

/**
 * Haversine formula to calculate distance between two lat/lng points (km).
 */
function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
