import { v4 as uuidv4 } from "uuid";
import db from "../config/database";
import { Zone, RiskLevel } from "../types";

const TABLE = "zones";

export async function createZone(data: {
  name: string;
  risk_level: RiskLevel;
  description?: string;
  polygon_geojson: string;
}): Promise<Zone> {
  const [zone] = await db(TABLE)
    .insert({
      id: uuidv4(),
      ...data,
    })
    .returning("*");
  return zone;
}

export async function listZones(): Promise<Zone[]> {
  return db(TABLE).orderBy("created_at", "desc");
}

export async function getZoneById(id: string): Promise<Zone | null> {
  const zone = await db(TABLE).where({ id }).first();
  return zone || null;
}

export async function updateZone(
  id: string,
  data: Partial<Pick<Zone, "name" | "risk_level" | "description" | "polygon_geojson">>
): Promise<Zone | null> {
  const [zone] = await db(TABLE)
    .where({ id })
    .update({ ...data, updated_at: new Date() })
    .returning("*");
  return zone || null;
}

export async function deleteZone(id: string): Promise<boolean> {
  const deleted = await db(TABLE).where({ id }).del();
  return deleted > 0;
}
