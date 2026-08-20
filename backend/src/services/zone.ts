import { v4 as uuidv4 } from "uuid";
import db from "../config/database";
import { Zone, RiskLevel } from "../types";

const TABLE = "zones";

export async function createZone(data: {
  name: string;
  risk_level: RiskLevel;
  description?: string;
  polygon_geojson: string;
  is_active?: boolean;
}): Promise<Zone> {
  const [zone] = await db(TABLE)
    .insert({
      id: uuidv4(),
      ...data,
    })
    .returning("*");
  return zone;
}

export async function listZones(filters?: { is_active?: boolean }): Promise<Zone[]> {
  const query = db(TABLE).orderBy("created_at", "desc");
  if (filters?.is_active !== undefined) {
    query.where("is_active", filters.is_active);
  }
  return query;
}

export async function getZoneById(id: string): Promise<Zone | null> {
  const zone = await db(TABLE).where({ id }).first();
  return zone || null;
}

export async function updateZone(
  id: string,
  data: Partial<Pick<Zone, "name" | "risk_level" | "description" | "polygon_geojson" | "is_active">>
): Promise<Zone | null> {
  const [zone] = await db(TABLE)
    .where({ id })
    .update({ ...data, updated_at: new Date() })
    .returning("*");
  return zone || null;
}

export async function deactivateZone(id: string): Promise<Zone | null> {
  const [zone] = await db(TABLE)
    .where({ id })
    .update({ is_active: false, updated_at: new Date() })
    .returning("*");
  return zone || null;
}

export async function deleteZone(id: string): Promise<boolean> {
  const deleted = await db(TABLE).where({ id }).del();
  return deleted > 0;
}

/**
 * Spatial query: find which zone(s) contain the given point.
 * Uses PostGIS ST_Contains for efficient geometric containment check.
 */
export async function findZoneForPoint(
  lat: number,
  lng: number
): Promise<Zone | null> {
  const zone = await db(TABLE)
    .where("is_active", true)
    .whereRaw(
      "ST_Contains(polygon_geom, ST_SetSRID(ST_MakePoint(?, ?), 4326))",
      [lng, lat]
    )
    .first();
  return zone || null;
}

/**
 * Spatial query: find all zones that contain the given point.
 */
export async function findAllZonesForPoint(
  lat: number,
  lng: number
): Promise<Zone[]> {
  return db(TABLE)
    .where("is_active", true)
    .whereRaw(
      "ST_Contains(polygon_geom, ST_SetSRID(ST_MakePoint(?, ?), 4326))",
      [lng, lat]
    )
    .orderBy("created_at", "desc");
}
